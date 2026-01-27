import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../store/store.js';
import StatusChip from '../components/StatusChip.jsx';

export default function AppProjects() {
  const [state, setState] = useState(store.state);
  const nav = useNavigate();

  const [filters, setFilters] = useState({ q: '', status: 'All', severity: 'All' });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    lat: 25.2854,
    lng: 51.531,
    visibility: 'public',
    communityFeedbackEnabled: true,
  });
  const [error, setError] = useState('');

  useEffect(() => store.subscribe(setState), []);
  useEffect(() => { store.refreshProjects(); }, []);

  const canCreate = state.user?.role === 'official' || state.user?.role === 'admin';

  const filtered = useMemo(() => {
    return (state.projects || [])
      .filter((p) => (filters.status === 'All' ? true : p.status === filters.status))
      .filter((p) => (filters.severity === 'All' ? true : (p.damageReport?.severity || '—') === filters.severity))
      .filter((p) => {
        const q = filters.q.trim().toLowerCase();
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.location?.address || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [state.projects, filters]);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const proj = await store.createProject(form);
      setCreating(false);
      setForm({ title: '', description: '', address: '', lat: 25.2854, lng: 51.531, visibility: 'public', communityFeedbackEnabled: true });
      nav(`/app/projects/${proj.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    }
  };

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Projects</h2>
          <div className="subtle">Search, filter, and click a project for detailed tabs.</div>
        </div>

        {canCreate && (
          <button className="btn" onClick={() => setCreating((v) => !v)}>
            {creating ? 'Close' : 'New project'}
          </button>
        )}
      </div>

      {creating && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Create project</h3>
          <p className="subtle">Projects start as Draft. Add a damage report and plan, then publish for bidding.</p>
          {error && <div className="toast" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

          <form className="form" onSubmit={create}>
            <div className="field">
              <label htmlFor="p_title">Title</label>
              <input id="p_title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="field">
              <label htmlFor="p_desc">Description</label>
              <textarea id="p_desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short context for the demo…" />
            </div>

            <div className="row3">
              <div className="field">
                <label htmlFor="p_addr">Address / label</label>
                <input id="p_addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g., Doha, Qatar" />
              </div>
              <div className="field">
                <label htmlFor="p_lat">Latitude</label>
                <input id="p_lat" type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} required />
              </div>
              <div className="field">
                <label htmlFor="p_lng">Longitude</label>
                <input id="p_lng" type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} required />
              </div>
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="p_vis">Visibility</label>
                <select id="p_vis" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="p_cfb">Community feedback</label>
                <select id="p_cfb" value={form.communityFeedbackEnabled ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, communityFeedbackEnabled: e.target.value === 'yes' })}>
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
            </div>

            <button className="btn" type="submit">Create</button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row3">
          <div className="field">
            <label htmlFor="q">Search</label>
            <input id="q" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Search title, description, address…" />
          </div>
          <div className="field">
            <label htmlFor="st">Status</label>
            <select id="st" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Published">Open for bidding</option>
              <option value="Awarded">Awarded</option>
              <option value="Licensed">Licensed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sev">Severity</label>
            <select id="sev" value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
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
                <Link to={`/app/projects/${p.id}`}>{p.title}</Link>
              </h3>
              <StatusChip status={p.status} />
            </div>
            <p className="subtle" style={{ marginTop: 6 }}>{p.location?.address || '—'}</p>
            <p style={{ marginTop: 10 }}>{p.description || '—'}</p>

            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge">Severity: {p.damageReport?.severity ?? '—'}</span>
              <span className="badge">Bids: {p.bids?.length ?? 0}</span>
              <span className="badge">Community: {p.communityFeedbackEnabled ? 'On' : 'Off'}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          No projects match your filters.
        </div>
      )}
    </div>
  );
}
