import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../store/store.js';
import StatusChip from '../components/StatusChip.jsx';

export default function PublicProjects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const list = await store.refreshProjects();
      // Public view is handled by store access rules when user is null.
      setProjects(list);
    })();
  }, []);

  const filtered = useMemo(() => {
    return projects
      .filter((p) => (status === 'All' ? true : p.status === status))
      .filter((p) => {
        if (severity === 'All') return true;
        return (p.damageReport?.severity || '—') === severity;
      })
      .filter((p) => {
        if (!q.trim()) return true;
        const s = q.trim().toLowerCase();
        return (
          p.title.toLowerCase().includes(s) ||
          (p.description || '').toLowerCase().includes(s) ||
          (p.location?.address || '').toLowerCase().includes(s)
        );
      });
  }, [projects, status, severity, q]);

  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <div className="section-title">
        <div>
          <h2>Public projects</h2>
          <div className="subtle">Read-only project dashboard. Click a project to see details.</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row3">
          <div className="field">
            <label htmlFor="q">Search</label>
            <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g., library, bridge, Doha..." />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="Published">Open for bidding</option>
              <option value="Awarded">Awarded</option>
              <option value="Licensed">Licensed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sev">Damage severity</label>
            <select id="sev" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }} className="grid3">
        {filtered.map((p) => (
          <div className="card" key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <h3 style={{ margin: 0 }}>
                <Link to={`/projects/${p.id}`}>{p.title}</Link>
              </h3>
              <StatusChip status={p.status} />
            </div>
            <p className="subtle" style={{ marginTop: 6 }}>{p.location?.address || '—'}</p>
            <p style={{ marginTop: 10 }}>{p.description || '—'}</p>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge" title="Damage severity">Severity: {p.damageReport?.severity ?? '—'}</span>
              <span className="badge" title="Community feedback">Community: {p.communityFeedbackEnabled ? 'Enabled' : 'Off'}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="card" style={{ marginTop: 14 }}>No projects match your filters.</div>}
    </div>
  );
}
