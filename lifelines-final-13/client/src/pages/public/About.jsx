import React from 'react';

export default function About() {
  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>About LifeLines</h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          Postdisaster reconstruction is slowed by fragmented information, manual approvals, and inefficient
          resource allocation. LifeLines is designed to streamline coordination while encouraging circular
          reuse of materials and transparent contractor selection.
        </p>

        <hr className="hr" />

        <div className="grid2">
          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Mission</h3>
            <p className="muted">
              Help communities rebuild safer and greener by connecting damage intelligence, reconstruction planning,
              reusable resources, and accountable governance in one platform.
            </p>
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
            <h3 className="cardTitle">Sustainability</h3>
            <p className="muted">
              LifeLines tracks recoverable materials, estimates CO reduction, and supports plan options like insulation,
              solar, and seismic reinforcement to reduce lifetime emissions and future risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
