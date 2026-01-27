import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { store } from '../store/store.js';
import MapPanel from '../components/MapPanel.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { money, shortDate } from '../utils/format.js';

export default function PublicProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [err, setErr] = useState('');

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
  }, [id]);

  if (err) {
    return (
      <div className="container" style={{ paddingTop: 22 }}>
        <div className="card">
          <p style={{ marginTop: 0 }}>{err}</p>
          <Link to="/projects" className="btn secondary">Back to projects</Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container" style={{ paddingTop: 22 }}>
        <div className="card">Loading…</div>
      </div>
    );
  }

  const plan = project.reconstructionPlan;
  const dr = project.damageReport;

  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <div className="section-title">
        <div>
          <h2 style={{ marginBottom: 6 }}>{project.title} <StatusChip status={project.status} /></h2>
          <div className="subtle">Created {shortDate(project.createdAt)} • Updated {shortDate(project.updatedAt)}</div>
        </div>
        <Link className="btn secondary" to="/projects">Back</Link>
      </div>

      <div className="row2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Overview</h3>
          <p className="subtle">{project.location?.address || '—'}</p>
          <p style={{ marginTop: 10 }}>{project.description || '—'}</p>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge">Severity: {dr?.severity ?? '—'}</span>
            <span className="badge">Budget: {plan ? money(plan.costBreakdown?.total) : '—'}</span>
            <span className="badge">Timeline: {plan ? `${plan.timelineMonths} mo` : '—'}</span>
          </div>
        </div>

        <MapPanel lat={project.location.lat} lng={project.location.lng} address={project.location.address} />
      </div>

      <div className="grid3" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Damage report</h3>
          {dr ? (
            <>
              <div className="subtle">Confidence: {Math.round((dr.confidenceScores?.severity ?? 0) * 100)}%</div>
              <ul style={{ marginTop: 10 }}>
                <li><strong>Issues:</strong> {(dr.issues || []).slice(0, 4).join(', ') || '—'}</li>
                <li><strong>Debris:</strong> {dr.debrisVolume} m³</li>
                <li><strong>Recoverables:</strong> {(dr.recoverables || []).map((r) => `${r.qty} ${r.unit} ${r.type}`).join(', ') || '—'}</li>
              </ul>
            </>
          ) : (
            <div className="subtle">Not published yet.</div>
          )}
        </div>

        <div className="card">
          <h3>Plan</h3>
          {plan ? (
            <>
              <div className="subtle">Sustainability: {plan.sustainabilityMetrics?.recycledMaterialPct ?? 0}% recycled • {plan.sustainabilityMetrics?.co2ReducedTons ?? 0}t CO₂ reduced</div>
              <ul style={{ marginTop: 10 }}>
                <li><strong>Materials:</strong> {(plan.materials || []).map((m) => `${m.qty} ${m.unit} ${m.type}`).slice(0, 3).join(', ')}</li>
                <li><strong>Cost:</strong> {money(plan.costBreakdown?.total)}</li>
                <li><strong>Timeline:</strong> {plan.timelineMonths} months</li>
              </ul>
            </>
          ) : (
            <div className="subtle">Not published yet.</div>
          )}
        </div>

        <div className="card">
          <h3>Transparency</h3>
          <p className="subtle">Public view highlights key milestones. Full details are available to authenticated stakeholders.</p>
          <ul style={{ marginTop: 10 }}>
            <li><strong>Bids:</strong> {project.bids?.length ?? 0}</li>
            <li><strong>License:</strong> {project.license?.id ?? '—'}</li>
            <li><strong>Community input:</strong> {project.communityFeedbackEnabled ? `${project.communityInputs?.length ?? 0} comment(s)` : 'Disabled'}</li>
          </ul>
          <div style={{ marginTop: 10 }}>
            <Link className="btn" to="/login">Login to participate</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
