import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../store/store.js';
import KpiRow from '../components/KpiRow.jsx';

export default function AppHome() {
  const [state, setState] = useState(store.state);

  useEffect(() => store.subscribe(setState), []);
  useEffect(() => { store.refreshProjects(); }, []);

  const role = state.user?.role;

  const kpis = useMemo(() => {
    const list = state.projects || [];
    if (role === 'official') {
      const drafts = list.filter((p) => p.status === 'Draft').length;
      const open = list.filter((p) => p.status === 'Published').length;
      const active = list.filter((p) => ['Awarded', 'Licensed'].includes(p.status)).length;
      return [
        { label: 'Draft projects', value: drafts },
        { label: 'Open for bidding', value: open },
        { label: 'Active builds', value: active },
      ];
    }
    if (role === 'contractor') {
      const open = list.filter((p) => p.status === 'Published').length;
      const won = list.filter((p) => p.assignedContractorId === state.user.id).length;
      return [
        { label: 'Open projects', value: open },
        { label: 'Contracts won', value: won },
        { label: 'Estimated CO₂ saved', value: '3.1t' },
      ];
    }
    if (role === 'community') {
      return [
        { label: 'Public projects', value: list.length },
        { label: 'Feedback enabled', value: list.filter((p) => p.communityFeedbackEnabled).length },
        { label: 'Time saved (est.)', value: '2–3 days' },
      ];
    }
    // admin
    return [
      { label: 'System projects', value: list.length },
      { label: 'Avg. cost saved', value: '$12k' },
      { label: 'Avg. CO₂ reduced', value: '2–5t' },
    ];
  }, [role, state.projects, state.user]);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Dashboard</h2>
          <div className="subtle">Role-aware home with quick actions and KPIs.</div>
        </div>
        <Link className="btn secondary" to="/app/projects">Open projects</Link>
      </div>

      <div style={{ marginTop: 14 }}>
        <KpiRow items={kpis} />
      </div>

      <div style={{ marginTop: 14 }} className="grid3">
        {role === 'official' && (
          <>
            <div className="card">
              <h3>Create a project</h3>
              <p>Start from a damage report, then publish for contractors to bid.</p>
              <div style={{ marginTop: 10 }}>
                <Link className="btn" to="/app/projects">New project</Link>
              </div>
            </div>
            <div className="card">
              <h3>Run TF.js analysis</h3>
              <p>Generate severity + confidence + recoverables (simulated) to speed triage.</p>
            </div>
            <div className="card">
              <h3>Issue a license</h3>
              <p>After awarding a bid, complete the checklist and issue a digital license.</p>
            </div>
          </>
        )}

        {role === 'contractor' && (
          <>
            <div className="card">
              <h3>Browse open projects</h3>
              <p>Submit bids with cost, timeline, experience, and sustainability.</p>
              <div style={{ marginTop: 10 }}>
                <Link className="btn" to="/app/bids">Bidding portal</Link>
              </div>
            </div>
            <div className="card">
              <h3>Compare scored bids</h3>
              <p>Officials see side-by-side scoring using the fixed weights.</p>
            </div>
            <div className="card">
              <h3>Track status</h3>
              <p>Once a project is awarded, licensing and conditions appear in your project details.</p>
            </div>
          </>
        )}

        {role === 'community' && (
          <>
            <div className="card">
              <h3>Review projects</h3>
              <p>See what’s being rebuilt and leave feedback when enabled.</p>
              <div style={{ marginTop: 10 }}>
                <Link className="btn" to="/app/projects">Projects</Link>
              </div>
            </div>
            <div className="card">
              <h3>Transparency</h3>
              <p>Status chips, plan summaries, and audit-style events build trust.</p>
            </div>
            <div className="card">
              <h3>Sustainability</h3>
              <p>Recycled material usage and CO₂ estimates are tracked throughout the workflow.</p>
            </div>
          </>
        )}

        {role === 'admin' && (
          <>
            <div className="card">
              <h3>Oversight</h3>
              <p>View users, licenses, and audit logs.</p>
              <div style={{ marginTop: 10 }}>
                <Link className="btn" to="/app/admin">Admin panel</Link>
              </div>
            </div>
            <div className="card">
              <h3>Moderation</h3>
              <p>Spot-check projects for completeness and compliance before licensing.</p>
            </div>
            <div className="card">
              <h3>Audit trail</h3>
              <p>Every important action is designed to be logged in an append-only style.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
