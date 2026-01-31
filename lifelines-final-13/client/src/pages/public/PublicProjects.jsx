import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import StatusChip from '../../components/ui/StatusChip.jsx';

export default function PublicProjects() {
  const { refreshPublic, getPublicProjects } = useStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Any');

  useEffect(() => { refreshPublic(); }, [refreshPublic]);

  const projects = getPublicProjects();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects.filter(p => {
      const matchesQ = !term || (p.title + ' ' + (p.description || '') + ' ' + (p.location?.address || '')).toLowerCase().includes(term);
      const matchesStatus = status === 'Any' || p.status === status;
      return matchesQ && matchesStatus;
    });
  }, [projects, q, status]);

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1 className="cardTitle" style={{ fontSize: 28, margin: 0 }}>Projects</h1>
            <p className="cardSub">Read-only dashboard of publicly visible reconstruction projects.</p>
          </div>
        </div>

        <div className="row2" style={{ marginTop: 10 }}>
          <div>
            <label className="label" htmlFor="q">Search</label>
            <input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, address, description..." />
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Any</option>
              <option>Draft</option>
              <option>Published</option>
              <option>Awarded</option>
              <option>Licensed</option>
              <option>Completed</option>
            </select>
          </div>
        </div>

        <hr className="hr" />

        <table className="table" aria-label="Public projects table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Region</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <Link to={`/projects/${p.id}`} style={{ fontWeight: 800 }}>{p.title}</Link>
                  <div className="small muted">{(p.description || '').slice(0, 80)}{(p.description || '').length > 80 ? '' : ''}</div>
                </td>
                <td className="small">{p.location?.regionName || ''}</td>
                <td><StatusChip status={p.status} /></td>
                <td className="small">{p.location?.address || `${p.location?.lat?.toFixed?.(4)}, ${p.location?.lng?.toFixed?.(4)}`}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={4} className="muted">No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
