import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import StatusChip from '../../components/ui/StatusChip.jsx';
import MapPanel from '../../components/maps/MapPanel.jsx';
import { formatMoney, formatNumber } from '../../store/utils.js';

export default function PublicProjectDetail() {
  const { id } = useParams();
  const { refreshPublic, getProject, getDamageReport, getPlan } = useStore();

  useEffect(() => { refreshPublic(); }, [refreshPublic]);

  const project = getProject(id);
  const report = getDamageReport(id);
  const plan = getPlan(id);

  if (!project || project.visibility !== 'public') {
    return (
      <div className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Project not found</h2>
          <p className="muted">This project may be private or not available.</p>
          <Link className="btn" to="/projects">Back</Link>
        </div>
      </div>
    );
  }

  const totalCost = (plan?.costBreakdown || []).reduce((s, x) => s + (x.cost || 0), 0);

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1 style={{ margin: 0 }}>{project.title}</h1>
            <p className="muted" style={{ margin: '6px 0 0' }}>{project.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusChip status={project.status} />
            <Link className="btn" to="/projects">Back</Link>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 10 }}>
          <div>
            <MapPanel lat={project.location?.lat} lng={project.location?.lng} />
            <div className="small muted" style={{ marginTop: 8 }}>
              {project.location?.address || ''}  {project.location?.regionName || ''}
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Public summary</h3>
            <div className="form" style={{ marginTop: 10 }}>
              <div className="kpi">
                <div className="kpiLabel">Severity</div>
                <div className="kpiValue" style={{ fontSize: 18 }}>{report?.severity || ''}</div>
                <div className="kpiHint">confidence: {report ? Math.round((report.confidenceScores?.severity || 0) * 100) + '%' : ''}</div>
              </div>
              <div className="kpi">
                <div className="kpiLabel">Debris estimate</div>
                <div className="kpiValue" style={{ fontSize: 18 }}>
                  {report ? `${formatNumber(report.debrisVolume?.minM3)}${formatNumber(report.debrisVolume?.maxM3)} m` : ''}
                </div>
                <div className="kpiHint">{report ? `${report.debrisVolume?.marginPct}%` : ''}</div>
              </div>
              <div className="kpi">
                <div className="kpiLabel">Plan cost</div>
                <div className="kpiValue" style={{ fontSize: 18 }}>{plan ? formatMoney(totalCost) : ''}</div>
                <div className="kpiHint">{plan ? `${plan.timelineMonths} months` : ''}</div>
              </div>
            </div>
          </div>
        </div>

        <hr className="hr" />

        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Damage report</h3>
            {!report ? <p className="muted">No assessment available yet.</p> : (
              <>
                <div className="pill" style={{ marginBottom: 10 }}>Issues: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{report.issues?.length || 0}</strong></div>
                <ul className="muted" style={{ marginTop: 0 }}>
                  {(report.issues || []).map((i) => <li key={i}>{i}</li>)}
                </ul>
                <div className="pill">Recoverables: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{report.recoverables?.length || 0}</strong></div>
                <div style={{ marginTop: 10 }}>
                  {(report.recoverables || []).map((r, idx) => (
                    <div key={idx} className="kpi" style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 800 }}>{r.type}</div>
                      <div className="muted small">
                        {formatNumber(r.minQty, r.unit === 'units' ? 0 : 1)}{formatNumber(r.maxQty, r.unit === 'units' ? 0 : 1)} {r.unit}  quality {Math.round((r.qualityScore || 0) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Reconstruction plan</h3>
            {!plan ? <p className="muted">No plan available yet.</p> : (
              <>
                <div className="pill" style={{ marginBottom: 10 }}>
                  Building: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{plan.buildingSpec?.buildingType}</strong>
                  <span style={{ opacity: .75 }}> {plan.buildingSpec?.floors} floors  {formatNumber(plan.buildingSpec?.areaSqm)} m</span>
                </div>
                <div className="label">Materials</div>
                <ul className="muted" style={{ marginTop: 6 }}>
                  {(plan.materials || []).slice(0, 6).map((m) => (
                    <li key={m.type}>{m.type}: {formatNumber(m.qty, m.unit === 'units' ? 0 : 1)} {m.unit}</li>
                  ))}
                </ul>

                <div className="label" style={{ marginTop: 10 }}>Sustainability</div>
                <div className="muted small">
                  Recycled materials: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{plan.sustainabilityMetrics?.recycledPercent}%</strong><br/>
                  CO reduction: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{formatNumber(plan.sustainabilityMetrics?.co2SavedKg)} kg</strong>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
