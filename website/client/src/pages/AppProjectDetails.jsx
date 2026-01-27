import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { store } from '../store/store.js';
import MapPanel from '../components/MapPanel.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { money, shortDate } from '../utils/format.js';

const TABS = ['Overview', 'Damage Report', 'Reconstruction Plan', 'Resources', 'Bids', 'Approvals'];

export default function AppProjectDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [state, setState] = useState(store.state);
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [err, setErr] = useState('');

  useEffect(() => store.subscribe(setState), []);

  const role = state.user?.role;
  const canEdit = role === 'official' || role === 'admin';
  const isAdmin = role === 'admin';
  const isContractor = role === 'contractor';
  const isCommunity = role === 'community';

  const visibleTabs = useMemo(() => {
    if (!canEdit) return TABS.filter((t) => t !== 'Approvals');
    return TABS;
  }, [canEdit]);

  useEffect(() => {
    (async () => {
      setErr('');
      try {
        const p = await store.getProject(id);
        setProject(p);
      } catch (e) {
        setErr(e.message || 'Failed to load project');
      }
    })();
  }, [id, state.projects]);

  const refresh = async () => {
    const p = await store.getProject(id);
    setProject(p);
  };

  if (err) {
    return (
      <div className="card">
        <p style={{ marginTop: 0 }}>{err}</p>
        <button className="btn secondary" onClick={() => nav('/app/projects')}>Back</button>
      </div>
    );
  }

  if (!project) {
    return <div className="card">Loading…</div>;
  }

  const dr = project.damageReport;
  const plan = project.reconstructionPlan;

  return (
    <div>
      <div className="section-title">
        <div>
          <h2 style={{ marginBottom: 6 }}>
            {project.title} <StatusChip status={project.status} />
          </h2>
          <div className="subtle">
            {project.location?.address || '—'} • Created {shortDate(project.createdAt)} • Updated {shortDate(project.updatedAt)}
          </div>
        </div>
        <Link className="btn secondary" to="/app/projects">Back</Link>
      </div>

      <div className="tabs" role="tablist" aria-label="Project tabs">
        {visibleTabs.map((t) => (
          <button
            key={t}
            className={`tab ${t === tab ? 'active' : ''}`}
            role="tab"
            aria-selected={t === tab}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <OverviewTab project={project} canEdit={canEdit} isCommunity={isCommunity} refresh={refresh} />
      )}

      {tab === 'Damage Report' && (
        <DamageTab project={project} canEdit={canEdit} refresh={refresh} />
      )}

      {tab === 'Reconstruction Plan' && (
        <PlanTab project={project} canEdit={canEdit} refresh={refresh} />
      )}

      {tab === 'Resources' && (
        <ResourcesTab project={project} canEdit={canEdit} />
      )}

      {tab === 'Bids' && (
        <BidsTab project={project} isContractor={isContractor} canEdit={canEdit} refresh={refresh} />
      )}

      {tab === 'Approvals' && canEdit && (
        <ApprovalsTab project={project} refresh={refresh} />
      )}
    </div>
  );
}

function OverviewTab({ project, canEdit, isCommunity, refresh }) {
  const plan = project.reconstructionPlan;
  const dr = project.damageReport;

  const canPublish = canEdit && project.status === 'Draft' && Boolean(dr) && Boolean(plan);

  const publish = async () => {
    await store.publishProject(project.id);
    await refresh();
  };

  return (
    <div className="row2">
      <div className="card">
        <h3>Project summary</h3>
        <p style={{ marginTop: 6 }}>{project.description || '—'}</p>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge">Severity: {dr?.severity ?? '—'}</span>
          <span className="badge">Budget: {plan ? money(plan.costBreakdown?.total) : '—'}</span>
          <span className="badge">Timeline: {plan ? `${plan.timelineMonths} mo` : '—'}</span>
          <span className="badge">Visibility: {project.visibility}</span>
          <span className="badge">Community: {project.communityFeedbackEnabled ? 'Enabled' : 'Off'}</span>
        </div>

        {canEdit && project.status === 'Draft' && (
          <div style={{ marginTop: 12 }} className="callout">
            <strong>Next:</strong> Add a Damage Report and a Reconstruction Plan, then Publish to open bidding.
          </div>
        )}

        {canEdit && (
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={publish} disabled={!canPublish} title={!canPublish ? 'Requires damage report + plan' : 'Publish for bidding'}>
              Publish for bidding
            </button>
            {!canPublish && <span className="subtle">Requires: damage report + plan</span>}
          </div>
        )}

        {isCommunity && project.communityFeedbackEnabled && (
          <CommunityInput project={project} />
        )}

        {isCommunity && !project.communityFeedbackEnabled && (
          <div style={{ marginTop: 12 }} className="subtle">Community feedback is disabled for this project.</div>
        )}

        {project.communityInputs?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h3>Community notes</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {project.communityInputs.slice().reverse().map((c) => (
                <div className="toast" key={c.id}>
                  <div style={{ fontWeight: 800 }}>{c.approvalSignal ? '✅ Approval signal' : '💬 Comment'}</div>
                  <div className="subtle">{shortDate(c.createdAt)}</div>
                  <div style={{ marginTop: 6 }}>{c.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <MapPanel lat={project.location.lat} lng={project.location.lng} address={project.location.address} />
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Details</h3>
          <ul>
            <li><strong>Created by:</strong> User #{project.createdBy}</li>
            <li><strong>Bids:</strong> {project.bids?.length ?? 0}</li>
            <li><strong>Assigned contractor:</strong> {project.assignedContractorId ?? '—'}</li>
            <li><strong>License:</strong> {project.license?.id ?? '—'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CommunityInput({ project }) {
  const [comment, setComment] = useState('');
  const [signal, setSignal] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await store.addCommunityInput(project.id, { comment, approvalSignal: signal });
      setComment('');
      store.setToast('Feedback saved.', 'info');
    } catch (err) {
      store.setToast(err.message || 'Failed to submit feedback', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <h3>Submit community input</h3>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="ci_comment">Comment</label>
          <textarea id="ci_comment" value={comment} onChange={(e) => setComment(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="ci_sig">Approval signal</label>
          <select id="ci_sig" value={signal ? 'yes' : 'no'} onChange={(e) => setSignal(e.target.value === 'yes')}>
            <option value="yes">Approve direction</option>
            <option value="no">Needs changes</option>
          </select>
        </div>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
      </form>
    </div>
  );
}

function DamageTab({ project, canEdit, refresh }) {
  const [selected, setSelected] = useState(project.damageReport?.images?.[0] || '');
  const [uploads, setUploads] = useState([]);
  const [busy, setBusy] = useState(false);

  const pickSample = (url) => setSelected(url);

  const onFile = (files) => {
    const urls = Array.from(files || []).map((f) => URL.createObjectURL(f));
    setUploads(urls);
    if (urls[0]) setSelected(urls[0]);
  };

  const run = async () => {
    setBusy(true);
    try {
      const images = [selected].filter(Boolean);
      await store.runDamage(project.id, images);
      await refresh();
    } catch (err) {
      store.setToast(err.message || 'Damage analysis failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const dr = project.damageReport;

  return (
    <div className="row2">
      <div className="card">
        <h3>Damage report</h3>
        {!dr && <div className="subtle">No report yet. Use demo images or upload a photo, then click “Run analysis”.</div>}

        {dr && (
          <>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge">Severity: {dr.severity}</span>
              <span className="badge">Debris: {dr.debrisVolume} m³</span>
              <span className="badge">Confidence: {Math.round((dr.confidenceScores?.severity ?? 0) * 100)}%</span>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Issues</strong>
              <div className="subtle">{(dr.issues || []).join(', ') || '—'}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Recoverables</strong>
              <div className="subtle">
                {(dr.recoverables || []).length
                  ? dr.recoverables.map((r) => `${r.qty} ${r.unit} ${r.type} (${r.condition})`).join(', ')
                  : '—'}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Upload images</h3>
        <div className="subtle">Demo mode: pick a sample thumbnail (works without any external services).</div>

        <div className="image-grid" style={{ marginTop: 12 }}>
          {['/sample-images/damage1.svg', '/sample-images/damage2.svg', '/sample-images/damage3.svg'].map((u) => (
            <div
              key={u}
              className={`thumb ${selected === u ? 'selected' : ''}`}
              onClick={() => pickSample(u)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pickSample(u); }}
              role="button"
              tabIndex={0}
            >
              <img src={u} alt="Sample damage thumbnail" />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files)} />
          <div className="hint">Uploads are previewed locally for the MVP.</div>
        </div>

        {selected && (
          <div style={{ marginTop: 12 }}>
            <div className="subtle">Selected image:</div>
            <div className="thumb selected" style={{ marginTop: 8 }}>
              <img src={selected} alt="Selected damage preview" />
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={run} disabled={!canEdit || busy || !selected} title={!canEdit ? 'Only officials/admin can create reports' : ''}>
            {busy ? 'Running…' : 'Run analysis (TF.js demo)'}
          </button>
          {!canEdit && <span className="subtle">Read-only for your role.</span>}
        </div>
      </div>
    </div>
  );
}

function PlanTab({ project, canEdit, refresh }) {
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(project.reconstructionPlan || null);

  useEffect(() => {
    setPlan(project.reconstructionPlan || null);
  }, [project.reconstructionPlan]);

  const generate = async () => {
    setBusy(true);
    try {
      const p = await store.generatePlan(project.id);
      setPlan(p);
      await refresh();
    } catch (err) {
      store.setToast(err.message || 'Failed to generate plan', 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await store.savePlan(project.id, plan);
      store.setToast('Plan saved.', 'info');
      await refresh();
    } catch (err) {
      store.setToast(err.message || 'Failed to save plan', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!plan) {
    return (
      <div className="card">
        <h3>Reconstruction plan</h3>
        <div className="subtle">No plan yet.</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={generate} disabled={!canEdit || busy} title={!canEdit ? 'Read-only for your role' : ''}>
            {busy ? 'Generating…' : 'Generate default plan'}
          </button>
          {!project.damageReport && <span className="subtle">Tip: add a damage report first for better defaults.</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="row2">
      <div className="card">
        <h3>Plan details</h3>

        <div className="row3" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Building type</label>
            <input value={plan.buildingSpec?.buildingType || ''} onChange={(e) => setPlan({ ...plan, buildingSpec: { ...(plan.buildingSpec || {}), buildingType: e.target.value } })} disabled={!canEdit} />
          </div>
          <div className="field">
            <label>Floors</label>
            <input type="number" value={plan.buildingSpec?.floors ?? 0} onChange={(e) => setPlan({ ...plan, buildingSpec: { ...(plan.buildingSpec || {}), floors: Number(e.target.value) } })} disabled={!canEdit} />
          </div>
          <div className="field">
            <label>Area (m²)</label>
            <input type="number" value={plan.buildingSpec?.areaSqm ?? 0} onChange={(e) => setPlan({ ...plan, buildingSpec: { ...(plan.buildingSpec || {}), areaSqm: Number(e.target.value) } })} disabled={!canEdit} />
          </div>
        </div>

        <div className="row2" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Timeline (months)</label>
            <input type="number" value={plan.timelineMonths} onChange={(e) => setPlan({ ...plan, timelineMonths: Number(e.target.value) })} disabled={!canEdit} />
          </div>
          <div className="field">
            <label>Budget (total)</label>
            <input type="number" value={plan.costBreakdown?.total ?? 0} onChange={(e) => setPlan({ ...plan, costBreakdown: { ...(plan.costBreakdown || {}), total: Number(e.target.value) } })} disabled={!canEdit} />
            <div className="hint">MVP note: total is used for bid scoring + budget compliance.</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>Materials</h3>
          <table className="table" aria-label="Materials table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Qty</th>
                <th>Unit</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {(plan.materials || []).map((m, idx) => (
                <tr key={idx}>
                  <td>
                    <input value={m.type} onChange={(e) => {
                      const next = [...plan.materials];
                      next[idx] = { ...next[idx], type: e.target.value };
                      setPlan({ ...plan, materials: next });
                    }} disabled={!canEdit} />
                  </td>
                  <td>
                    <input type="number" value={m.qty} onChange={(e) => {
                      const next = [...plan.materials];
                      next[idx] = { ...next[idx], qty: Number(e.target.value) };
                      setPlan({ ...plan, materials: next });
                    }} disabled={!canEdit} />
                  </td>
                  <td>
                    <input value={m.unit} onChange={(e) => {
                      const next = [...plan.materials];
                      next[idx] = { ...next[idx], unit: e.target.value };
                      setPlan({ ...plan, materials: next });
                    }} disabled={!canEdit} />
                  </td>
                  {canEdit && (
                    <td>
                      <button className="btn small danger" onClick={() => {
                        const next = plan.materials.filter((_, i) => i !== idx);
                        setPlan({ ...plan, materials: next });
                      }}>Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {canEdit && (
            <button className="btn small secondary" onClick={() => setPlan({ ...plan, materials: [...(plan.materials || []), { type: 'NewMaterial', qty: 0, unit: 'units' }] })}>
              + Add material
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Sustainability options</h3>
        <div className="subtle">Toggles affect cost + sustainability metrics.</div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={Boolean(plan.sustainabilityOptions?.solarPanels)} onChange={(e) => setPlan({ ...plan, sustainabilityOptions: { ...(plan.sustainabilityOptions || {}), solarPanels: e.target.checked } })} disabled={!canEdit} />
            Solar panels (+$8k)
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={Boolean(plan.sustainabilityOptions?.insulation)} onChange={(e) => setPlan({ ...plan, sustainabilityOptions: { ...(plan.sustainabilityOptions || {}), insulation: e.target.checked } })} disabled={!canEdit} />
            High-efficiency insulation (+$5k)
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={Boolean(plan.sustainabilityOptions?.seismicReinforcement)} onChange={(e) => setPlan({ ...plan, sustainabilityOptions: { ...(plan.sustainabilityOptions || {}), seismicReinforcement: e.target.checked } })} disabled={!canEdit} />
            Seismic reinforcement (+$5k)
          </label>
        </div>

        <div style={{ marginTop: 14 }} className="callout">
          <div><strong>Estimated CO₂ reduced:</strong> {plan.sustainabilityMetrics?.co2ReducedTons ?? 0} tons</div>
          <div><strong>Recycled materials:</strong> {plan.sustainabilityMetrics?.recycledMaterialPct ?? 0}%</div>
          <div><strong>Plan total:</strong> {money(plan.costBreakdown?.total ?? 0)}</div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canEdit && <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save plan'}</button>}
          {!canEdit && <div className="subtle">Read-only for your role.</div>}
          <button className="btn secondary" onClick={generate} disabled={!canEdit || busy}>Regenerate</button>
        </div>
      </div>
    </div>
  );
}

function ResourcesTab({ project, canEdit }) {
  const [matches, setMatches] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setBusy(true);
      try {
        const list = await store.listResourceMatches(project.id);
        setMatches(list);
      } catch (err) {
        store.setToast(err.message || 'Failed to load resources', 'error');
      } finally {
        setBusy(false);
      }
    })();
  }, [project.id, project.reconstructionPlan?.id]);

  const reserved = matches.filter((m) => m.reservedForProjectId === project.id);
  const available = matches.filter((m) => !m.reservedForProjectId);

  const reserve = async (resId, on) => {
    setBusy(true);
    try {
      await store.reserveResource(resId, project.id, on);
      const list = await store.listResourceMatches(project.id);
      setMatches(list);
    } catch (err) {
      store.setToast(err.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!project.reconstructionPlan) {
    return <div className="card">Create a reconstruction plan to see resource matches.</div>;
  }

  return (
    <div className="row2">
      <div className="card">
        <h3>Matched resources (nearby)</h3>
        <div className="subtle">Distance uses the haversine formula. Savings are recycled vs new materials.</div>

        {busy && <div className="subtle" style={{ marginTop: 10 }}>Loading…</div>}

        {!busy && available.length === 0 && (
          <div className="subtle" style={{ marginTop: 10 }}>No available resources match this plan.</div>
        )}

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {available.map((r) => (
            <div className="toast" key={r.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 800 }}>{r.type} • {r.qty} {r.unit}</div>
                <span className="badge">{r.distanceKm} km</span>
              </div>
              <div className="subtle">Usable: {r.usableQty} {r.unit} • Save ${r.costSavings} • Reduce {r.co2Reduction}t CO₂</div>
              {canEdit && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn small" onClick={() => reserve(r.id, true)} disabled={busy}>Reserve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Reserved for this project</h3>
        {!reserved.length && <div className="subtle">No reserved resources.</div>}

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {reserved.map((r) => (
            <div className="toast" key={r.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 800 }}>{r.type} • {r.qty} {r.unit}</div>
                <span className="badge">Reserved</span>
              </div>
              <div className="subtle">Location: {r.location.lat}, {r.location.lng}</div>
              {canEdit && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn small secondary" onClick={() => reserve(r.id, false)} disabled={busy}>Release</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {!canEdit && <div className="subtle" style={{ marginTop: 12 }}>Read-only for your role.</div>}
      </div>
    </div>
  );
}

function BidsTab({ project, isContractor, canEdit, refresh }) {
  const [form, setForm] = useState({ cost: '', timelineMonths: '', experienceCount: '', recycledPercent: '' });
  const [busy, setBusy] = useState(false);

  const userId = store.state.user?.id;
  const myBid = (project.bids || []).find((b) => b.contractorId === userId);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await store.submitBid(project.id, {
        cost: Number(form.cost),
        timelineMonths: Number(form.timelineMonths),
        experienceCount: Number(form.experienceCount),
        recycledPercent: Number(form.recycledPercent),
      });
      setForm({ cost: '', timelineMonths: '', experienceCount: '', recycledPercent: '' });
      await refresh();
    } catch (err) {
      store.setToast(err.message || 'Bid failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const award = async (bidId) => {
    setBusy(true);
    try {
      await store.awardBid(project.id, bidId);
      await refresh();
    } catch (err) {
      store.setToast(err.message || 'Award failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const canBid = isContractor && project.status === 'Published' && !myBid;

  return (
    <div className="row2">
      <div className="card">
        <h3>Bids</h3>
        <div className="subtle">Scoring weights: cost 40%, timeline 20%, experience 20%, sustainability 20%.</div>

        {(project.bids || []).length === 0 && (
          <div className="subtle" style={{ marginTop: 10 }}>No bids yet.</div>
        )}

        {(project.bids || []).length > 0 && (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Contractor</th>
                <th>Cost</th>
                <th>Timeline</th>
                <th>Exp</th>
                <th>Recycled %</th>
                <th>Score</th>
                <th>Status</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {project.bids.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).map((b) => (
                <tr key={b.id} style={b.status === 'Won' ? { background: '#f0fdf4' } : undefined}>
                  <td>#{b.contractorId}</td>
                  <td>${Math.round(b.cost).toLocaleString()}</td>
                  <td>{b.timelineMonths} mo</td>
                  <td>{b.experienceCount}</td>
                  <td>{b.recycledPercent}%</td>
                  <td><strong>{b.score}</strong></td>
                  <td>{b.status}</td>
                  {canEdit && (
                    <td>
                      <button className="btn small" onClick={() => award(b.id)} disabled={busy || project.status !== 'Published'}>
                        Award
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {canEdit && project.status !== 'Published' && (
          <div className="subtle" style={{ marginTop: 10 }}>Awarding is available while the project is Published.</div>
        )}
      </div>

      <div className="card">
        {isContractor ? (
          <>
            <h3>Submit a bid</h3>
            {project.status !== 'Published' && <div className="subtle">This project is not open for bidding.</div>}

            {myBid && (
              <div style={{ marginTop: 10 }} className="callout">
                <div><strong>Your bid score:</strong> {myBid.score}</div>
                <div className="subtle">Status: {myBid.status}</div>
              </div>
            )}

            {canBid && (
              <form className="form" onSubmit={submit} style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Cost (USD)</label>
                  <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
                </div>
                <div className="row3">
                  <div className="field">
                    <label>Timeline (months)</label>
                    <input type="number" value={form.timelineMonths} onChange={(e) => setForm({ ...form, timelineMonths: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label>Experience count</label>
                    <input type="number" value={form.experienceCount} onChange={(e) => setForm({ ...form, experienceCount: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label>Recycled materials %</label>
                    <input type="number" min="0" max="100" value={form.recycledPercent} onChange={(e) => setForm({ ...form, recycledPercent: e.target.value })} required />
                  </div>
                </div>
                <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit bid'}</button>
              </form>
            )}
          </>
        ) : (
          <>
            <h3>Compare bids</h3>
            <div className="subtle">Winner highlight appears after awarding.</div>
            <div style={{ marginTop: 12 }}>
              {project.assignedContractorId ? (
                <div className="callout">
                  <div><strong>Awarded contractor:</strong> #{project.assignedContractorId}</div>
                  <div className="subtle">Proceed to Approvals to issue a license.</div>
                </div>
              ) : (
                <div className="subtle">No award yet.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ApprovalsTab({ project, refresh }) {
  const [busy, setBusy] = useState(false);

  const drOk = Boolean(project.damageReport);
  const planOk = Boolean(project.reconstructionPlan);
  const contractorOk = Boolean(project.assignedContractorId);
  const bidOk = Boolean(project.selectedBidId);
  const budgetOk = useMemo(() => {
    if (!project.reconstructionPlan || !project.selectedBidId) return false;
    const bid = (project.bids || []).find((b) => b.id === project.selectedBidId);
    if (!bid) return false;
    const budget = Number(project.reconstructionPlan.costBreakdown?.total ?? 0);
    return budget === 0 ? true : bid.cost <= budget;
  }, [project]);

  const canIssue = drOk && planOk && contractorOk && bidOk && budgetOk && !project.license;

  const issue = async () => {
    setBusy(true);
    try {
      await store.issueLicense(project.id);
      await refresh();
    } catch (err) {
      store.setToast(err.message || 'License issuance failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row2">
      <div className="card">
        <h3>Checklist</h3>
        <ul>
          <li>Damage assessment completed {drOk ? '✓' : '✗'}</li>
          <li>Reconstruction plan approved {planOk ? '✓' : '✗'}</li>
          <li>Contractor selected {contractorOk ? '✓' : '✗'}</li>
          <li>Bid awarded {bidOk ? '✓' : '✗'}</li>
          <li>Budget compliance {budgetOk ? '✓' : '✗'}</li>
        </ul>

        <button className="btn" onClick={issue} disabled={!canIssue || busy}>
          {project.license ? 'License issued' : busy ? 'Issuing…' : 'Approve & issue license'}
        </button>

        {!canIssue && !project.license && (
          <div className="subtle" style={{ marginTop: 10 }}>
            Complete missing items above to enable licensing.
          </div>
        )}
      </div>

      <div className="card">
        <h3>License</h3>
        {!project.license && <div className="subtle">No license issued yet.</div>}

        {project.license && (
          <>
            <div className="callout">
              <div><strong>ID:</strong> {project.license.id}</div>
              <div><strong>Valid:</strong> {project.license.validFrom} → {project.license.validTo}</div>
              <div><strong>Contractor:</strong> #{project.license.contractorId}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Conditions</strong>
              <ul>
                {(project.license.conditions || []).map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              <div className="subtle">Signature: {project.license.signature}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
