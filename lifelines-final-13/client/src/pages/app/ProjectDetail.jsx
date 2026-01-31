import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import StatusChip from '../../components/ui/StatusChip.jsx';
import MapPanel from '../../components/maps/MapPanel.jsx';
import MapPicker from '../../components/maps/MapPicker.jsx';
import { runDamageAnalysis } from '../../services/damageDetection.js';
import { generateDefaultPlan, fetchBuildingContextFromMaps } from '../../services/planning.js';
import { formatMoney, formatNumber, uid } from '../../store/utils.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'damage', label: 'Damage report' },
  { id: 'plan', label: 'Reconstruction plan' },
  { id: 'resources', label: 'Resources' },
  { id: 'bids', label: 'Bids' },
  { id: 'approvals', label: 'Approvals & licensing' }
];

function TabButton({ active, onClick, children }) {
  return (
    <button className={`tabBtn ${active ? 'tabBtnActive' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function sumCost(plan) {
  return (plan?.costBreakdown || []).reduce((s, x) => s + (x.cost || 0), 0);
}

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const {
    auth,
    db,
    getProject,
    getDamageReport,
    getPlan,
    updateProject,
    deleteProject,
    publishProject,
    saveDamageReport,
    savePlan,
    computeResourceMatches,
    reserveResource,
    releaseResource,
    submitBid,
    awardBid,
    issueLicense
  } = useStore();

  const user = auth.user;
  const project = getProject(id);
  const report = getDamageReport(id);
  const plan = getPlan(id);

  const [tab, setTab] = useState('overview');

  useEffect(() => {
    // default tab depending on role & missing data
    if (!project) return;
    if (!report && (user.role === 'official' || user.role === 'admin')) setTab('damage');
  }, [project, report, user.role]);

  const isAdmin = user.role === 'admin';
  const isOfficial = user.role === 'official' || user.role === 'admin';
  const isContractor = user.role === 'contractor';
  const isCommunity = user.role === 'community';

  const canEditProject = isOfficial && (isAdmin || project?.ownerId === user.id);

  const bids = useMemo(() => (db.bids || []).filter(b => b.projectId === id).sort((a,b) => (b.score || 0) - (a.score || 0)), [db.bids, id]);
  const awardedBid = bids.find(b => b.status === 'Awarded') || null;
  const license = useMemo(() => (db.licenses || []).find(l => l.projectId === id) || null, [db.licenses, id]);

  const [err, setErr] = useState(null);

  // Location edit state
  const [editLoc, setEditLoc] = useState(false);
  const [locDraft, setLocDraft] = useState(() => project?.location || { lat: 0, lng: 0, address: '' });

  useEffect(() => {
    setLocDraft(project?.location || { lat: 0, lng: 0, address: '' });
  }, [project?.location]);

  // Damage report UI state
  const [images, setImages] = useState(() => (report?.images || []).slice(0, 6));
  const [analysis, setAnalysis] = useState(null);
  const [busyAnalysis, setBusyAnalysis] = useState(false);

  // Plan UI state
  const [planDraft, setPlanDraft] = useState(plan || null);
  const [planBusy, setPlanBusy] = useState(false);
  const [mapsContext, setMapsContext] = useState(null);

  useEffect(() => {
    setPlanDraft(plan || null);
  }, [plan]);

  const totalCost = sumCost(planDraft || plan);

  // Resources matches
  const matches = useMemo(() => computeResourceMatches(id), [computeResourceMatches, id, db.resources, db.plans]);

  // Bid form
  const [bidForm, setBidForm] = useState({ cost: 150000, timelineMonths: 6, experienceCount: 6, recycledPercent: 25 });
  const [bidBusy, setBidBusy] = useState(false);

  // Approvals
  const [licenseForm, setLicenseForm] = useState(() => {
    const now = new Date();
    const from = now.toISOString().slice(0,10);
    const toDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 180);
    const to = toDate.toISOString().slice(0,10);
    return { validFrom: from, validTo: to, conditions: ['Weekly progress report', 'On-site safety inspections', 'Use approved materials list'] };
  });
  const [licBusy, setLicBusy] = useState(false);

  // Community input
  const communityInputs = useMemo(() => (project.communityInputs || []).slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [project.communityInputs]);
  const [communityComment, setCommunityComment] = useState('');
  const [communitySignal, setCommunitySignal] = useState('support');
  const canCommunityInput = isCommunity && project?.communityFeedbackEnabled;

  if (!project) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Project not found</h2>
        <Link className="btn" to="/app/projects">Back</Link>
      </div>
    );
  }

  // Access control: community sees only public projects
  if (isCommunity && project.visibility !== 'public') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Not available</h2>
        <p className="muted">This project is not public.</p>
        <Link className="btn" to="/app/projects">Back</Link>
      </div>
    );
  }

  const doDelete = async () => {
    if (!isAdmin) return;
    if (!confirm('Delete this project permanently? This cannot be undone.')) return;
    try {
      await deleteProject(project.id);
      nav('/app/projects');
    } catch (e) {
      alert(e.message);
    }
  };

  const doPublish = async () => {
    setErr(null);
    try {
      await publishProject(project.id);
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveLocation = async () => {
    setErr(null);
    try {
      await updateProject(project.id, { location: locDraft });
      setEditLoc(false);
    } catch (e) {
      setErr(e.message);
    }
  };

  const pickFiles = async (files) => {
    const list = Array.from(files || []).slice(0, 6);
    const toDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    const urls = [];
    for (const f of list) urls.push(await toDataUrl(f));
    setImages(urls);
  };

  const addSample = (src) => {
    setImages((prev) => {
      if (prev.includes(src)) return prev;
      return [src, ...prev].slice(0, 6);
    });
  };

  const runAnalysis = async () => {
    setErr(null);
    setBusyAnalysis(true);
    try {
      const res = await runDamageAnalysis({ imagesCount: Math.max(1, images.length) });
      setAnalysis(res);

      const newReport = {
        id: uid('dr'),
        projectId: project.id,
        images,
        severity: res.severity,
        issues: res.issues,
        debrisVolume: res.debrisVolume,
        recoverables: res.recoverables,
        confidenceScores: res.confidenceScores,
        modelVersion: res.modelVersion,
        createdAt: new Date().toISOString()
      };

      await saveDamageReport(project.id, newReport);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyAnalysis(false);
    }
  };

  const genPlan = async () => {
    setErr(null);
    setPlanBusy(true);
    try {
      const severity = report?.severity || 'Medium';
      const options = planDraft?.sustainabilityOptions || { solarPanels: true, insulation: true, seismicReinforcement: true };
      const generated = await generateDefaultPlan({ project, severity, options });

      // try pull context from maps (stubbed)
      const ctx = await fetchBuildingContextFromMaps({ lat: project.location.lat, lng: project.location.lng });
      setMapsContext(ctx);

      // attach to plan meta
      const next = { ...generated, mapsContext: ctx };
      setPlanDraft(next);
      await savePlan(project.id, next);
    } catch (e) {
      setErr(e.message);
    } finally {
      setPlanBusy(false);
    }
  };

  const updatePlanOption = (key, val) => {
    setPlanDraft((p) => {
      if (!p) return p;
      const options = { ...p.sustainabilityOptions, [key]: val };
      return { ...p, sustainabilityOptions: options, updatedAt: new Date().toISOString() };
    });
  };

  const savePlanEdits = async () => {
    if (!planDraft) return;
    setErr(null);
    setPlanBusy(true);
    try {
      await savePlan(project.id, { ...planDraft, updatedAt: new Date().toISOString() });
    } catch (e) {
      setErr(e.message);
    } finally {
      setPlanBusy(false);
    }
  };

  const doSubmitBid = async () => {
    setErr(null);
    setBidBusy(true);
    try {
      // Basic validation
      if (bidForm.cost <= 0 || bidForm.timelineMonths <= 0) throw new Error('Cost and timeline must be positive.');
      if (bidForm.recycledPercent < 0 || bidForm.recycledPercent > 100) throw new Error('Recycled percent must be 0100.');
      await submitBid(project.id, {
        cost: Number(bidForm.cost),
        timelineMonths: Number(bidForm.timelineMonths),
        experienceCount: Number(bidForm.experienceCount),
        recycledPercent: Number(bidForm.recycledPercent)
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBidBusy(false);
    }
  };

  const doAward = async (bidId) => {
    setErr(null);
    try {
      await awardBid(project.id, bidId);
      setTab('approvals');
    } catch (e) {
      setErr(e.message);
    }
  };

  const doIssueLicense = async () => {
    setErr(null);
    if (!awardedBid) { setErr('Award a bid first.'); return; }
    setLicBusy(true);
    try {
      await issueLicense(project.id, {
        contractorId: awardedBid.contractorId,
        validFrom: licenseForm.validFrom,
        validTo: licenseForm.validTo,
        conditions: licenseForm.conditions
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLicBusy(false);
    }
  };

  const submitCommunityInput = () => {
    if (!canCommunityInput) return;
    const entry = {
      id: uid('cmt'),
      projectId: project.id,
      authorId: user.id,
      comment: communityComment.trim(),
      approvalSignal: communitySignal,
      createdAt: new Date().toISOString()
    };
    // client-only storage; server also supports it, so we enqueue via updateProject patch
    const nextInputs = [entry, ...(project.communityInputs || [])];
    updateProject(project.id, { communityInputs: nextInputs }).catch(() => {});
    setCommunityComment('');
  };

  const showApprovalsTab = isOfficial;
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'approvals') return showApprovalsTab;
    return true;
  });

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <h1 style={{ margin: 0 }}>{project.title}</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
            <StatusChip status={project.status} />
            <span className="pill">{project.location?.regionName || ''}</span>
            <span className="pill">{project.visibility === 'public' ? 'Public' : 'Private'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link className="btn" to="/app/projects">Back</Link>
          {canEditProject && project.status !== 'Published' && (
            <button className="btn btnPrimary" onClick={doPublish}>Publish for bidding</button>
          )}
          {isAdmin && (
            <button className="btn btnDanger" onClick={doDelete}>Delete project</button>
          )}
        </div>
      </div>

      {err ? <div className="error" style={{ marginBottom: 10 }}>{err}</div> : null}

      <div className="tabs" role="tablist" aria-label="Project tabs">
        {visibleTabs.map(t => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</TabButton>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <div className="cardHeader">
              <div>
                <h3 className="cardTitle">Location</h3>
                <p className="cardSub">{project.location?.address || ''}</p>
              </div>
              {canEditProject && (
                <button className="btn" onClick={() => setEditLoc(v => !v)}>{editLoc ? 'Close' : 'Edit location'}</button>
              )}
            </div>

            {!editLoc ? (
              <>
                <MapPanel lat={project.location?.lat} lng={project.location?.lng} />
                <div className="small muted" style={{ marginTop: 8 }}>
                  Lat {Number(project.location?.lat).toFixed(5)}  Lng {Number(project.location?.lng).toFixed(5)}
                </div>
              </>
            ) : (
              <div className="form">
                <div className="row2">
                  <div>
                    <label className="label">Latitude</label>
                    <input className="input" value={locDraft.lat} onChange={(e) => setLocDraft(s => ({ ...s, lat: parseFloat(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Longitude</label>
                    <input className="input" value={locDraft.lng} onChange={(e) => setLocDraft(s => ({ ...s, lng: parseFloat(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input" value={locDraft.address || ''} onChange={(e) => setLocDraft(s => ({ ...s, address: e.target.value }))} />
                </div>

                <MapPicker
                  lat={locDraft.lat}
                  lng={locDraft.lng}
                  onChange={({ lat, lng, address }) => setLocDraft(s => ({ ...s, lat, lng, ...(address ? { address } : {}) }))}
                />

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btnPrimary" onClick={saveLocation}>Save</button>
                  <button className="btn" onClick={() => { setLocDraft(project.location); setEditLoc(false); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Workflow summary</h3>
            <div className="form" style={{ marginTop: 10 }}>
              <div className="kpi">
                <div className="kpiLabel">Assessment</div>
                <div className="kpiValue" style={{ fontSize: 18 }}>{report?.severity || 'Missing'}</div>
                <div className="kpiHint">{report ? `confidence ${Math.round((report.confidenceScores?.severity || 0) * 100)}%` : 'Upload images and run analysis.'}</div>
              </div>
              <div className="kpi">
                <div className="kpiLabel">Plan</div>
                <div className="kpiValue" style={{ fontSize: 18 }}>{plan ? formatMoney(totalCost) : 'Missing'}</div>
                <div className="kpiHint">{plan ? `${plan.timelineMonths} months` : 'Generate a plan from the Plan tab.'}</div>
              </div>
              <div className="kpi">
                <div className="kpiLabel">Sustainability</div>
                <div className="kpiValue" style={{ fontSize: 18 }}>{plan?.sustainabilityMetrics?.recycledPercent ? `${plan.sustainabilityMetrics.recycledPercent}% recycled` : ''}</div>
                <div className="kpiHint">{plan?.sustainabilityMetrics?.co2SavedKg ? `${formatNumber(plan.sustainabilityMetrics.co2SavedKg)} kg CO saved` : ''}</div>
              </div>

              {canCommunityInput && (
                <div className="card" style={{ padding: 12, background: 'rgba(255,255,255,.03)' }}>
                  <div className="label">Community input</div>
                  <div className="row2">
                    <div>
                      <label className="label" htmlFor="signal">Signal</label>
                      <select id="signal" className="select" value={communitySignal} onChange={(e) => setCommunitySignal(e.target.value)}>
                        <option value="support">Support</option>
                        <option value="neutral">Neutral</option>
                        <option value="concern">Concern</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="comment">Comment</label>
                      <input id="comment" className="input" value={communityComment} onChange={(e) => setCommunityComment(e.target.value)} placeholder="Short feedback" />
                    </div>
                  </div>
                  <button className="btn btnPrimary" type="button" onClick={submitCommunityInput} disabled={!communityComment.trim()}>
                    Submit input
                  </button>

                  <div style={{ marginTop: 10 }}>
                    {communityInputs.slice(0, 6).map((c) => (
                      <div key={c.id} className="kpi" style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 800 }}>{c.approvalSignal.toUpperCase()}</div>
                        <div className="muted small">{c.comment}</div>
                        <div className="muted small">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                    {!communityInputs.length ? <div className="muted small">No community input yet.</div> : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Damage report */}
      {tab === 'damage' && (
        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Images</h3>
            <p className="cardSub">Upload photos or select samples. Then run analysis to generate a structured assessment.</p>

            {isOfficial ? (
              <>
                <div className="row2">
                  <div>
                    <label className="label">Upload images</label>
                    <input className="input" type="file" accept="image/*" multiple onChange={(e) => pickFiles(e.target.files)} />
                    <div className="helper">Images are stored as data URLs for this MVP.</div>
                  </div>
                  <div>
                    <label className="label">Sample thumbnails</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {['/samples/damage_low.png','/samples/damage_medium.png','/samples/damage_high.png','/samples/damage_critical.png'].map(src => (
                        <button key={src} type="button" className="btn" onClick={() => addSample(src)} style={{ padding: 6 }}>
                          <img src={src} alt="sample" style={{ width: 84, height: 56, objectFit: 'cover', borderRadius: 10 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <button className="btn btnPrimary" onClick={runAnalysis} disabled={busyAnalysis}>
                    {busyAnalysis ? 'Running analysis' : 'Run analysis'}
                  </button>
                  <span className="pill">Selected images: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{images.length}</strong></span>
                </div>
              </>
            ) : (
              <p className="muted">Only officials and admins can create damage assessments.</p>
            )}

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {images.map((src, idx) => (
                <img key={idx} src={src} alt={`uploaded-${idx}`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)' }} />
              ))}
              {!images.length ? <div className="muted small">No images selected.</div> : null}
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Assessment</h3>
            <p className="cardSub">Severity + issues + debris and recoverables with explicit confidence and error margins.</p>

            {!report ? (
              <div className="muted">No assessment saved yet.</div>
            ) : (
              <>
                <div className="pill" style={{ marginBottom: 10 }}>
                  Severity: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{report.severity}</strong>
                  <span style={{ opacity: .75 }}> confidence {Math.round((report.confidenceScores?.severity || 0) * 100)}%</span>
                </div>

                <div className="label">Issues</div>
                <ul className="muted" style={{ marginTop: 6 }}>
                  {(report.issues || []).map((i) => <li key={i}>{i}</li>)}
                </ul>

                <div className="label">Debris</div>
                <div className="muted small">
                  {formatNumber(report.debrisVolume?.minM3)}{formatNumber(report.debrisVolume?.maxM3)} m ({report.debrisVolume?.marginPct}%)
                   confidence {Math.round((report.confidenceScores?.debris || 0) * 100)}%
                </div>

                <div className="label" style={{ marginTop: 10 }}>Recoverables</div>
                <div className="muted small">confidence {Math.round((report.confidenceScores?.recoverables || 0) * 100)}%</div>

                <div style={{ marginTop: 10 }}>
                  {(report.recoverables || []).map((r, idx) => (
                    <div key={idx} className="kpi" style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 900 }}>{r.type}</div>
                      <div className="muted small">
                        {formatNumber(r.minQty, r.unit === 'units' ? 0 : 1)}{formatNumber(r.maxQty, r.unit === 'units' ? 0 : 1)} {r.unit} ({r.marginPct}%)
                         quality {Math.round((r.qualityScore || 0) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>

                <div className="small muted" style={{ marginTop: 10 }}>
                  Model: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{report.modelVersion}</strong>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Plan */}
      {tab === 'plan' && (
        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Generate plan</h3>
            <p className="cardSub">Create a default reconstruction plan and then edit it as needed.</p>

            {!isOfficial ? (
              <p className="muted">Only officials and admins can create and edit plans.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btnPrimary" onClick={genPlan} disabled={planBusy}>
                    {planBusy ? 'Generating' : 'Generate default plan'}
                  </button>
                  <button className="btn" onClick={savePlanEdits} disabled={planBusy || !planDraft}>
                    {planBusy ? 'Saving' : 'Save plan'}
                  </button>
                </div>

                <hr className="hr" />

                {!planDraft ? (
                  <div className="muted">No plan saved yet.</div>
                ) : (
                  <div className="form">
                    <div className="row2">
                      <div>
                        <label className="label">Building type</label>
                        <input className="input" value={planDraft.buildingSpec?.buildingType || ''} onChange={(e) => setPlanDraft(p => ({ ...p, buildingSpec: { ...p.buildingSpec, buildingType: e.target.value } }))} />
                      </div>
                      <div className="row2">
                        <div>
                          <label className="label">Floors</label>
                          <input className="input" type="number" value={planDraft.buildingSpec?.floors || 1} onChange={(e) => setPlanDraft(p => ({ ...p, buildingSpec: { ...p.buildingSpec, floors: Number(e.target.value) } }))} />
                        </div>
                        <div>
                          <label className="label">Area (m)</label>
                          <input className="input" type="number" value={planDraft.buildingSpec?.areaSqm || 0} onChange={(e) => setPlanDraft(p => ({ ...p, buildingSpec: { ...p.buildingSpec, areaSqm: Number(e.target.value) } }))} />
                        </div>
                      </div>
                    </div>

                    <div className="row2">
                      <div>
                        <label className="label">Timeline (months)</label>
                        <input className="input" type="number" value={planDraft.timelineMonths || 0} onChange={(e) => setPlanDraft(p => ({ ...p, timelineMonths: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="label">Total cost</label>
                        <div className="pill">{formatMoney(sumCost(planDraft))}</div>
                      </div>
                    </div>

                    <div className="card" style={{ padding: 12, background: 'rgba(255,255,255,.03)' }}>
                      <div className="label">Sustainability options</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label className="pill" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!planDraft.sustainabilityOptions?.solarPanels} onChange={(e) => updatePlanOption('solarPanels', e.target.checked)} style={{ marginRight: 8 }} />
                          Solar panels
                        </label>
                        <label className="pill" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!planDraft.sustainabilityOptions?.insulation} onChange={(e) => updatePlanOption('insulation', e.target.checked)} style={{ marginRight: 8 }} />
                          Insulation
                        </label>
                        <label className="pill" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!planDraft.sustainabilityOptions?.seismicReinforcement} onChange={(e) => updatePlanOption('seismicReinforcement', e.target.checked)} style={{ marginRight: 8 }} />
                          Seismic reinforcement
                        </label>
                      </div>

                      <div className="muted small" style={{ marginTop: 8 }}>
                        Metrics: {planDraft.sustainabilityMetrics?.recycledPercent || ''}% recycled  {formatNumber(planDraft.sustainabilityMetrics?.co2SavedKg)} kg CO saved  {formatNumber(planDraft.sustainabilityMetrics?.energyKwhSaved)} kWh saved
                      </div>
                    </div>

                    <div className="label">Materials</div>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Qty</th>
                          <th>Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(planDraft.materials || []).map((m, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 800 }}>{m.type}</td>
                            <td style={{ width: 140 }}>
                              <input
                                className="input"
                                style={{ padding: '8px 10px' }}
                                value={m.qty}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setPlanDraft(p => ({
                                    ...p,
                                    materials: p.materials.map((x, i) => i === idx ? { ...x, qty: val } : x)
                                  }));
                                }}
                              />
                            </td>
                            <td className="small">{m.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="label" style={{ marginTop: 12 }}>Cost breakdown</div>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(planDraft.costBreakdown || []).map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 800 }}>{c.item}</td>
                            <td>{formatMoney(c.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {planDraft.mapsContext ? (
                      <div className="card" style={{ padding: 12, background: 'rgba(255,255,255,.03)' }}>
                        <div className="label">Building context (maps stub)</div>
                        <div className="muted small">
                          Year built: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{planDraft.mapsContext.yearBuilt}</strong><br/>
                          Zoning: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{planDraft.mapsContext.zoning}</strong><br/>
                          Confidence: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{Math.round((planDraft.mapsContext.confidence || 0) * 100)}%</strong>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Plan readiness</h3>
            <p className="cardSub">Whats needed to move forward.</p>

            <div className="form">
              <div className={`badge ${report ? 'badgeOk' : 'badgeWarn'}`}>Damage assessment {report ? 'complete' : 'missing'}</div>
              <div className={`badge ${plan ? 'badgeOk' : 'badgeWarn'}`}>Reconstruction plan {plan ? 'complete' : 'missing'}</div>
              <div className={`badge ${matches.length ? 'badgeOk' : 'badgeWarn'}`}>Resource matches {matches.length ? 'available' : 'none'}</div>
              <div className={`badge ${(bids.length || 0) > 0 ? 'badgeOk' : 'badgeWarn'}`}>Contractor bids {bids.length ? 'received' : 'none yet'}</div>
            </div>

            <hr className="hr" />

            <div className="muted small" style={{ lineHeight: 1.7 }}>
              <strong style={{ color: 'rgba(255,255,255,.92)' }}>Tip:</strong> Use the Resources tab to reserve nearby materials and reduce transport cost and delays.
            </div>

            <hr className="hr" />

            <div className="muted small">
              Audit stream records every state change and approval. See the Resources  graph view for object relationships.
            </div>
          </div>
        </div>
      )}

      {/* Resources */}
      {tab === 'resources' && (
        <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
          <div className="cardHeader">
            <div>
              <h3 className="cardTitle">Resource matching</h3>
              <p className="cardSub">Distancebased matches to your plan needs (savings + CO included).</p>
            </div>
            <div className="pill">Matches: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{matches.length}</strong></div>
          </div>

          {!plan ? (
            <p className="muted">Create a reconstruction plan first to enable matching.</p>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Need</th>
                    <th>Candidate resource</th>
                    <th>Distance</th>
                    <th>Savings</th>
                    <th>CO reduction</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, 18).map((m, idx) => (
                    <tr key={idx}>
                      <td className="small"><strong>{m.need.type}</strong>  {formatNumber(m.need.qty, m.need.unit === 'units' ? 0 : 1)} {m.need.unit}</td>
                      <td className="small">{m.resource.type}  {formatNumber(m.resource.qty, m.resource.unit === 'units' ? 0 : 1)} {m.resource.unit}  {m.resource.condition}</td>
                      <td className="small">{formatNumber(m.distanceKm, 2)} km</td>
                      <td className="small">{formatMoney(m.savingsUsd)}</td>
                      <td className="small">{formatNumber(m.co2ReductionKg, 0)} kg</td>
                      <td>
                        {m.resource.reservedForProjectId ? (
                          <button className="btn" onClick={() => releaseResource(m.resource.id)}>Release</button>
                        ) : (
                          <button className="btn btnPrimary" onClick={() => reserveResource(m.resource.id, project.id)}>Reserve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!matches.length ? <tr><td colSpan={6} className="muted">No matches yet.</td></tr> : null}
                </tbody>
              </table>

              <div className="muted small" style={{ marginTop: 10 }}>
                Matching uses haversine distance between project location and resource coordinates.
              </div>
            </>
          )}
        </div>
      )}

      {/* Bids */}
      {tab === 'bids' && (
        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <div className="cardHeader">
              <div>
                <h3 className="cardTitle">Bids</h3>
                <p className="cardSub">Auto-scored: cost 40%, timeline 20%, experience 20%, sustainability 20%.</p>
              </div>
              <span className="pill">Total: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{bids.length}</strong></span>
            </div>

            {isContractor && project.status === 'Published' && (
              <div className="card" style={{ padding: 12, background: 'rgba(255,255,255,.03)', marginBottom: 12 }}>
                <div className="label">Submit a bid</div>
                <div className="row2">
                  <div>
                    <label className="label">Cost (USD)</label>
                    <input className="input" type="number" value={bidForm.cost} onChange={(e) => setBidForm(s => ({ ...s, cost: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Timeline (months)</label>
                    <input className="input" type="number" value={bidForm.timelineMonths} onChange={(e) => setBidForm(s => ({ ...s, timelineMonths: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="row2">
                  <div>
                    <label className="label">Experience count</label>
                    <input className="input" type="number" value={bidForm.experienceCount} onChange={(e) => setBidForm(s => ({ ...s, experienceCount: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">% recycled materials</label>
                    <input className="input" type="number" value={bidForm.recycledPercent} onChange={(e) => setBidForm(s => ({ ...s, recycledPercent: Number(e.target.value) }))} />
                  </div>
                </div>
                <button className="btn btnPrimary" onClick={doSubmitBid} disabled={bidBusy}>{bidBusy ? 'Submitting' : 'Submit bid'}</button>
                <div className="helper">Bids are visible to officials/admins and may be compared side-by-side.</div>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Cost</th>
                  <th>Timeline</th>
                  <th>Experience</th>
                  <th>Recycled</th>
                  <th>Score</th>
                  <th>Status</th>
                  {isOfficial ? <th>Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {bids.map((b) => (
                  <tr key={b.id}>
                    <td className="small" style={{ fontWeight: 800 }}>{(db.actors || []).find(a => a.id === b.contractorId)?.name || b.contractorId}</td>
                    <td className="small">{formatMoney(b.cost)}</td>
                    <td className="small">{b.timelineMonths} mo</td>
                    <td className="small">{b.experienceCount}</td>
                    <td className="small">{b.recycledPercent}%</td>
                    <td className="small" style={{ fontWeight: 900 }}>{Math.round((b.score || 0) * 100)}/100</td>
                    <td className="small">{b.status}</td>
                    {isOfficial ? (
                      <td>
                        {project.status === 'Published' && b.status !== 'Awarded' ? (
                          <button className="btn btnPrimary" onClick={() => doAward(b.id)}>Award</button>
                        ) : (
                          <span className="muted small"></span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!bids.length ? <tr><td colSpan={isOfficial ? 8 : 7} className="muted">No bids yet.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Compare</h3>
            <p className="cardSub">Side-by-side view of top bids.</p>

            {!bids.length ? (
              <p className="muted">No bids to compare.</p>
            ) : (
              <div className="form">
                {bids.slice(0, 3).map((b) => (
                  <div key={b.id} className="kpi" style={{ borderColor: b.status === 'Awarded' ? 'rgba(251,191,36,.45)' : 'rgba(255,255,255,.12)' }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                      {(db.actors || []).find(a => a.id === b.contractorId)?.name || b.contractorId}
                      {b.status === 'Awarded' ? <span style={{ marginLeft: 8 }} className="badge badgeWarn">Winner</span> : null}
                    </div>
                    <div className="muted small">Cost: {formatMoney(b.cost)}</div>
                    <div className="muted small">Timeline: {b.timelineMonths} months</div>
                    <div className="muted small">Experience: {b.experienceCount}</div>
                    <div className="muted small">Recycled: {b.recycledPercent}%</div>
                    <div style={{ marginTop: 8, fontWeight: 900 }}>Score {Math.round((b.score || 0) * 100)}/100</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvals */}
      {tab === 'approvals' && showApprovalsTab && (
        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Checklist</h3>
            <p className="cardSub">A deterministic, auditable approval workflow.</p>

            <div className="form">
              <div className={`badge ${report ? 'badgeOk' : 'badgeWarn'}`}>Damage assessment completed</div>
              <div className={`badge ${plan ? 'badgeOk' : 'badgeWarn'}`}>Reconstruction plan approved</div>
              <div className={`badge ${matches.length ? 'badgeOk' : 'badgeWarn'}`}>Resource allocation verified</div>
              <div className={`badge ${awardedBid ? 'badgeOk' : 'badgeWarn'}`}>Contractor selected</div>
              <div className={`badge ${plan ? 'badgeOk' : 'badgeWarn'}`}>Budget compliance checked</div>
            </div>

            <hr className="hr" />

            <h3 className="cardTitle">Issue license</h3>
            <p className="cardSub">Generates a license object with a unique ID and writes an audit event.</p>

            {!awardedBid ? (
              <p className="muted">Award a bid in the Bids tab before licensing.</p>
            ) : license ? (
              <div className="card" style={{ padding: 12, background: 'rgba(255,255,255,.03)' }}>
                <div className="pill" style={{ marginBottom: 10 }}>
                  License: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{license.id}</strong>
                  <span style={{ opacity: .75 }}> {license.validFrom}  {license.validTo}</span>
                </div>
                <div className="muted small">Signature: {license.signature}</div>
                <div className="label" style={{ marginTop: 10 }}>Conditions</div>
                <ul className="muted" style={{ marginTop: 6 }}>
                  {(license.conditions || []).map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              </div>
            ) : (
              <div className="form">
                <div className="row2">
                  <div>
                    <label className="label">Valid from</label>
                    <input className="input" type="date" value={licenseForm.validFrom} onChange={(e) => setLicenseForm(s => ({ ...s, validFrom: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Valid to</label>
                    <input className="input" type="date" value={licenseForm.validTo} onChange={(e) => setLicenseForm(s => ({ ...s, validTo: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Conditions</label>
                  <textarea
                    className="textarea"
                    value={licenseForm.conditions.join('\n')}
                    onChange={(e) => setLicenseForm(s => ({ ...s, conditions: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) }))}
                  />
                  <div className="helper">One condition per line.</div>
                </div>
                <button className="btn btnPrimary" onClick={doIssueLicense} disabled={licBusy}>
                  {licBusy ? 'Issuing' : 'Approve & issue license'}
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Audit stream</h3>
            <p className="cardSub">Append-only events for transparency and traceability.</p>

            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {(db.audit || []).slice().reverse().filter(e => e.entityId === project.id || e.details?.projectId === project.id).slice(0, 18).map((evt) => (
                  <tr key={evt.id}>
                    <td className="small">{new Date(evt.timestamp).toLocaleString()}</td>
                    <td className="small" style={{ fontWeight: 800 }}>{evt.action}</td>
                    <td className="small">{evt.entityType}  {evt.entityId}</td>
                    <td className="small">{(db.actors || []).find(a => a.id === evt.actorId)?.name || evt.actorId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
