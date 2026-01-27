import React from 'react';

export default function About() {
  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <h2>About LifeLines</h2>
      <p className="subtle">
        Post-disaster reconstruction is often slowed by fragmented data, material waste, opaque contractor selection, and manual approvals.
        LifeLines unifies the workflow with a sustainability-first approach.
      </p>

      <div className="grid3" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Faster decisions</h3>
          <p>Structured damage reports and default plans reduce the time from assessment to action.</p>
        </div>
        <div className="card">
          <h3>Lower waste</h3>
          <p>Recoverables become inventory. Projects can reserve nearby salvaged materials to cut cost and CO₂.</p>
        </div>
        <div className="card">
          <h3>More trust</h3>
          <p>Scored bids and audit logs make decisions transparent—helping communities understand what’s happening and why.</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="card">
        <h3>Roles</h3>
        <ul>
          <li><strong>Community representative</strong>: view projects and submit feedback (when enabled)</li>
          <li><strong>Government official / urban planner</strong>: create projects, upload damage reports, publish for bidding, award contracts, issue licenses</li>
          <li><strong>Contractor</strong>: browse published projects and submit bids</li>
          <li><strong>Admin</strong>: oversight, user management, license logs, audit</li>
        </ul>
      </div>
    </div>
  );
}
