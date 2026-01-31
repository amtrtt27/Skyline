import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import StatusChip from '../../components/ui/StatusChip.jsx';
import MapPicker from '../../components/maps/MapPicker.jsx';
import { regionById } from '../../store/regions.js';

export default function ProjectsList() {
  const { auth, getProjectsForUser, getDamageReport, createProject } = useStore();
  const user = auth.user;
  const [params] = useSearchParams();
  const openNew = params.get('new') === '1';

  const nav = useNavigate();
  const loc = useLocation();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Any');
  const [severity, setSeverity] = useState('Any');
  const [showNew, setShowNew] = useState(openNew);

  useEffect(() => { setShowNew(openNew); }, [openNew]);

  const projects = getProjectsForUser();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects.filter(p => {
      const rep = getDamageReport(p.id);
      const matchesQ = !term || (p.title + ' ' + (p.description || '') + ' ' + (p.location?.address || '')).toLowerCase().includes(term);
      const matchesStatus = status === 'Any' || p.status === status;
      const matchesSeverity = severity === 'Any' || (rep?.severity === severity);
      return matchesQ && matchesStatus && matchesSeverity;
    });
  }, [projects, q, status, severity, getDamageReport]);

  const canCreate = user?.role === 'official' || user?.role === 'admin';

  const region = regionById(user?.regionId || 'doha');

  const [newProj, setNewProj] = useState({
    title: '',
    description: '',
    visibility: 'private',
    communityFeedbackEnabled: true,
    location: { lat: region.center.lat, lng: region.center.lng, address: '', regionId: region.id, regionName: region.name }
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const updateCoords = (patch) => {
    setNewProj(p => ({
      ...p,
      location: {
        ...p.location,
        ...patch,
        regionId: region.id,
        regionName: region.name
      }
    }));
  };

  const submitNew = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (!newProj.title.trim()) throw new Error('Title is required.');
      if (!Number.isFinite(Number(newProj.location.lat)) || !Number.isFinite(Number(newProj.location.lng))) {
        throw new Error('Valid coordinates are required.');
      }
      await createProject(newProj);
      setShowNew(false);
      nav('/app/projects', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1 className="cardTitle" style={{ fontSize: 26, margin: 0 }}>Projects</h1>
            <p className="cardSub">Search, filter, and open detailed workflows.</p>
          </div>
          {canCreate && (
            <button className="btn btnPrimary" onClick={() => setShowNew(v => !v)}>
              {showNew ? 'Close' : 'New project'}
            </button>
          )}
        </div>

        {showNew && canCreate && (
          <div className="card" style={{ background: 'rgba(255,255,255,.03)', marginBottom: 14 }}>
            <h3 className="cardTitle">Create project</h3>
            <p className="cardSub">Select a location on the map or type coordinates (they stay in sync).</p>

            <form className="form" onSubmit={submitNew}>
              <div className="row2">
                <div>
                  <label className="label" htmlFor="ptitle">Title</label>
                  <input id="ptitle" className="input" value={newProj.title} onChange={(e) => setNewProj(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div>
                  <label className="label" htmlFor="pvis">Visibility</label>
                  <select id="pvis" className="select" value={newProj.visibility} onChange={(e) => setNewProj(p => ({ ...p, visibility: e.target.value }))}>
                    <option value="private">Private (until published)</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="pdesc">Description</label>
                <textarea id="pdesc" className="textarea" value={newProj.description} onChange={(e) => setNewProj(p => ({ ...p, description: e.target.value }))} placeholder="Short context: what happened, what needs rebuilding" />
              </div>

              <div className="row2">
                <div>
                  <label className="label" htmlFor="plat">Latitude</label>
                  <input
                    id="plat"
                    className="input"
                    value={newProj.location.lat}
                    onChange={(e) => updateCoords({ lat: parseFloat(e.target.value) })}
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="plng">Longitude</label>
                  <input
                    id="plng"
                    className="input"
                    value={newProj.location.lng}
                    onChange={(e) => updateCoords({ lng: parseFloat(e.target.value) })}
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="paddr">Address (optional)</label>
                <input id="paddr" className="input" value={newProj.location.address} onChange={(e) => updateCoords({ address: e.target.value })} placeholder="e.g. district, street, landmark" />
              </div>

              <MapPicker
                lat={newProj.location.lat}
                lng={newProj.location.lng}
                onChange={({ lat, lng, address }) => updateCoords({ lat, lng, ...(address ? { address } : {}) })}
              />

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="pill" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newProj.communityFeedbackEnabled}
                    onChange={(e) => setNewProj(p => ({ ...p, communityFeedbackEnabled: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  Enable community feedback
                </label>
                <button className="btn btnPrimary" type="submit" disabled={busy}>{busy ? 'Creating' : 'Create project'}</button>
                {err ? <span className="error">{err}</span> : null}
              </div>
            </form>
          </div>
        )}

        <div className="row2">
          <div>
            <label className="label" htmlFor="q">Search</label>
            <input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, address, description" />
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

        <div className="row2" style={{ marginTop: 10 }}>
          <div>
            <label className="label" htmlFor="sev">Severity</label>
            <select id="sev" className="select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option>Any</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div className="pill" style={{ alignSelf: 'end' }}>
            Showing <strong style={{ color: 'rgba(255,255,255,.92)' }}>{filtered.length}</strong> of {projects.length}
          </div>
        </div>

        <hr className="hr" />

        <table className="table" aria-label="Projects table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Region</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const rep = getDamageReport(p.id);
              return (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/projects/${p.id}`)}>
                  <td>
                    <div style={{ fontWeight: 900 }}>{p.title}</div>
                    <div className="small muted">{p.location?.address || `${p.location?.lat?.toFixed?.(4)}, ${p.location?.lng?.toFixed?.(4)}`}</div>
                  </td>
                  <td className="small">{rep?.severity || ''}</td>
                  <td><StatusChip status={p.status} /></td>
                  <td className="small">{p.location?.regionName || ''}</td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={4} className="muted">No projects found.</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: 12 }} className="small muted">
          Tip: open a project to access tabs for assessment, planning, resources, bids, and approvals.
        </div>
      </div>
    </div>
  );
}
