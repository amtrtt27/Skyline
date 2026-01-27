import React from 'react';

export default function HowItWorks() {
  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <h2>How it works</h2>
      <p className="subtle">A single workflow from damage to licensing—built to feel real in hackathon demo mode.</p>

      <div className="card" style={{ marginTop: 14 }}>
        <ol>
          <li><strong>Damage report</strong>: officials upload photos (or use demo thumbnails). A TF.js demo module returns severity, issues, debris estimates, recoverables, and confidence.</li>
          <li><strong>Reconstruction plan</strong>: the platform generates a default plan and allows edits. Sustainability toggles update cost and metrics.</li>
          <li><strong>Resource matching</strong>: inventory items with GPS coordinates are matched by distance (haversine). The UI shows potential savings vs new materials and estimated CO₂ reduction.</li>
          <li><strong>Bidding</strong>: contractors submit bids. The platform scores each bid using: cost 40%, timeline 20%, experience 20%, sustainability 20%.</li>
          <li><strong>Approvals + license</strong>: officials/admin complete a checklist and issue a license with a unique ID, validity period, conditions, and a signature placeholder. Every action is logged.</li>
        </ol>
      </div>
    </div>
  );
}
