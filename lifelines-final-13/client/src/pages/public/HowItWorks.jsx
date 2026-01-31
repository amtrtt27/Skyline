import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>How it works</h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          LifeLines follows a clear, auditable workflow from initial damage observation to licensing and reconstruction.
          Each step reads/writes typed objects and explicit relationships so the system stays consistent and traceable.
        </p>

        <hr className="hr" />

        <div className="form">
          <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 900 }}>1) Observe</div>
            <div className="muted small">Upload images or field reports. These become Observation objects linked to an Asset.</div>
          </div>
          <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 900 }}>2) Assess</div>
            <div className="muted small">Run analysis to produce an Assessment: severity, issues, confidence, debris and recoverables with error margins.</div>
          </div>
          <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 900 }}>3) Plan</div>
            <div className="muted small">Generate a reconstruction plan, edit materials/costs/timeline, and apply sustainability options.</div>
          </div>
          <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 900 }}>4) Match resources</div>
            <div className="muted small">Inventory is matched to plan needs by distance and suitability; savings and CO reduction are estimated.</div>
          </div>
          <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 900 }}>5) Bid & award</div>
            <div className="muted small">Contractors bid; bids are scored (40/20/20/20) and compared side-by-side; officials award a winner.</div>
          </div>
          <div className="kpi" style={{ background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 900 }}>6) Approve & license</div>
            <div className="muted small">Checklist approvals lead to a generated license object and an append-only audit event.</div>
          </div>
        </div>

        <hr className="hr" />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn btnPrimary" to="/register">Create an account</Link>
          <Link className="btn" to="/projects">See projects</Link>
        </div>
      </div>
    </div>
  );
}
