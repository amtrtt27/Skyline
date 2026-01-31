import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="container">
      <div className="grid2">
        <div className="card">
          <div className="pill" style={{ marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(84,230,165,.9)' }} />
            Sustainable postdisaster reconstruction platform
          </div>

          <h1 style={{ margin: '6px 0 10px', fontSize: 40, lineHeight: 1.05 }}>
            Rebuild faster, with better coordination and measurable sustainability.
          </h1>

          <p className="muted" style={{ fontSize: 16, lineHeight: 1.6 }}>
            LifeLines brings damage assessment, reconstruction planning, resource reuse, transparent bidding,
            and licensing into one workflow  backed by a typed ontology and an audit stream.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link className="btn btnPrimary" to="/register">Get started</Link>
            <Link className="btn" to="/projects">Browse projects</Link>
          </div>

          <hr className="hr" />

          <div className="kpis">
            <div className="kpi">
              <div className="kpiLabel">Time saved</div>
              <div className="kpiValue">24 weeks</div>
              <div className="kpiHint">digitized approvals and bid comparison</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Cost saved</div>
              <div className="kpiValue">$1015%</div>
              <div className="kpiHint">transparent scoring + recycled materials</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">CO reduced</div>
              <div className="kpiValue">25 t</div>
              <div className="kpiHint">per project using recovered resources</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="cardTitle">Key modules</h3>
          <p className="cardSub">An endtoend reconstruction workflow.</p>

          <div className="form" style={{ marginTop: 10 }}>
            <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
              <div style={{ fontWeight: 800 }}>Damage assessment</div>
              <div className="muted small">Upload imagery  AI analysis  severity, issues, debris ranges, recoverables.</div>
            </div>
            <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
              <div style={{ fontWeight: 800 }}>Reconstruction planning</div>
              <div className="muted small">Generate default plan, edit materials & costs, toggle sustainability options.</div>
            </div>
            <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
              <div style={{ fontWeight: 800 }}>Resource matching</div>
              <div className="muted small">Distancebased matching using haversine, with cost and CO savings estimates.</div>
            </div>
            <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
              <div style={{ fontWeight: 800 }}>Bidding + licensing</div>
              <div className="muted small">Weighted bid scoring, award workflow, checklist approvals, license issuance + audit.</div>
            </div>
          </div>

          <hr className="hr" />

          <div className="muted small">
            Officials and admins create projects; contractors bid; community sees transparent progress when enabled.
          </div>
        </div>
      </div>
    </div>
  );
}
