import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../store/store.js';
import StatusChip from '../components/StatusChip.jsx';

export default function ContractorBids() {
  const [state, setState] = useState(store.state);

  useEffect(() => store.subscribe(setState), []);
  useEffect(() => { store.refreshProjects(); }, []);

  const userId = state.user?.id;

  const openProjects = useMemo(() => {
    return (state.projects || []).filter((p) => p.status === 'Published');
  }, [state.projects]);

  const myBids = useMemo(() => {
    const out = [];
    for (const p of state.projects || []) {
      for (const b of p.bids || []) {
        if (b.contractorId === userId) out.push({ project: p, bid: b });
      }
    }
    return out.sort((a, b) => new Date(b.bid.createdAt || 0) - new Date(a.bid.createdAt || 0));
  }, [state.projects, userId]);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Bidding portal</h2>
          <div className="subtle">Browse projects open for bidding, submit bids, and track results.</div>
        </div>
      </div>

      <div className="row2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Open projects</h3>
          {openProjects.length === 0 && <div className="subtle">No open projects right now.</div>}
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {openProjects.map((p) => (
              <div key={p.id} className="toast">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <Link to={`/app/projects/${p.id}`} style={{ fontWeight: 800 }}>{p.title}</Link>
                  <StatusChip status={p.status} />
                </div>
                <div className="subtle">{p.location?.address || '—'} • Severity: {p.damageReport?.severity ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Your bids</h3>
          {myBids.length === 0 && <div className="subtle">You haven’t submitted any bids yet.</div>}
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {myBids.map(({ project, bid }) => (
              <div key={bid.id} className="toast">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <Link to={`/app/projects/${project.id}`} style={{ fontWeight: 800 }}>{project.title}</Link>
                  <span className="badge">Score: {bid.score}</span>
                </div>
                <div className="subtle">Status: {bid.status} • Cost: ${Math.round(bid.cost).toLocaleString()} • Timeline: {bid.timelineMonths} mo</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
