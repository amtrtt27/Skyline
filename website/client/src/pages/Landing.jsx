import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <h1>Rebuild faster. Rebuild greener. Rebuild with trust.</h1>
            <p>
              LifeLines is a sustainable post-disaster reconstruction platform that connects communities, officials, contractors, and administrators
              through one end-to-end workflow: <strong>damage → plan → resources → bids → approvals → license</strong>.
            </p>

            <div className="hero-cta">
              <Link className="btn" to="/register">Get started</Link>
              <Link className="btn secondary" to="/projects">View public projects</Link>
            </div>

            <div style={{ marginTop: 16 }} className="callout">
              Demo accounts: <strong>official@example.com / official123</strong>, <strong>contractor@example.com / contractor123</strong>,{' '}
              <strong>community@example.com / community123</strong>, <strong>admin@example.com / admin123</strong>
            </div>
          </div>

          <div className="hero-card">
            <h3>What LifeLines does</h3>
            <ul>
              <li>AI-style damage assessment (TF.js demo) with severity + confidence</li>
              <li>Editable reconstruction plan with sustainability toggles</li>
              <li>Resource matching by distance (haversine) + cost/CO₂ savings</li>
              <li>Transparent bidding with weighted scoring</li>
              <li>Approvals checklist + digital license issuance + audit trail</li>
            </ul>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
            <div className="grid3">
              <div className="card">
                <h3>Damage assessment</h3>
                <p>Upload photos or pick demo thumbnails, then run a simulated model to produce structured reports.</p>
              </div>
              <div className="card">
                <h3>Circular resource reuse</h3>
                <p>Track salvaged materials with GPS coordinates, match by distance, and reserve to prevent double-use.</p>
              </div>
              <div className="card">
                <h3>Licensing workflow</h3>
                <p>Review bids, award a contractor, complete the checklist, then issue a unique license with conditions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
