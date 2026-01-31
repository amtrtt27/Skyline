import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import StatusChip from '../../components/ui/StatusChip.jsx';

export default function AdminPanel() {
  const { auth, db, resetServerDataset } = useStore();
  const nav = useNavigate();
  const user = auth.user;

  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const projects = db.projects || [];
  const licenses = db.licenses || [];
  const audit = db.audit || [];
  const actors = db.actors || [];

  const stats = useMemo(() => {
    const byRole = { admin: 0, official: 0, contractor: 0, community: 0 };
    for (const a of actors) byRole[a.role] = (byRole[a.role] || 0) + 1;
    return byRole;
  }, [actors]);

  if (user.role !== 'admin') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Admin only</h2>
        <p className="muted">You dont have access to this page.</p>
      </div>
    );
  }

  const doReset = async () => {
    setErr(null);
    setMsg(null);
    if (!confirm('Reset server dataset to seeded defaults?')) return;
    setBusy(true);
    try {
      await resetServerDataset();
      setMsg('Server dataset reset.');
      setTimeout(() => setMsg(null), 2200);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <h1 className="cardTitle" style={{ fontSize: 26, margin: 0 }}>Admin</h1>
          <p className="cardSub">User overview, license log, and dataset controls.</p>
        </div>
        <button className="btn btnDanger" onClick={doReset} disabled={busy}>{busy ? 'Resetting' : 'Reset server dataset'}</button>
      </div>

      {msg ? <div className="success" style={{ marginBottom: 10 }}>{msg}</div> : null}
      {err ? <div className="error" style={{ marginBottom: 10 }}>{err}</div> : null}

      <div className="kpis">
        <div className="kpi">
          <div className="kpiLabel">Users</div>
          <div className="kpiValue">{actors.length}</div>
          <div className="kpiHint">{stats.official} officials  {stats.contractor} contractors  {stats.community} community</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Projects</div>
          <div className="kpiValue">{projects.length}</div>
          <div className="kpiHint">total in dataset</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Licenses issued</div>
          <div className="kpiValue">{licenses.length}</div>
          <div className="kpiHint">approval artifacts</div>
        </div>
      </div>

      <hr className="hr" />

      <div className="grid2">
        <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
          <h3 className="cardTitle">Users</h3>
          <p className="cardSub">Actors in the system (passwords are never shown).</p>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {actors.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 800 }}>{a.name}</td>
                  <td className="small">{a.role}</td>
                  <td className="small">{a.email}</td>
                  <td className="small">{a.regionName || ''}</td>
                </tr>
              ))}
              {!actors.length ? <tr><td colSpan={4} className="muted">No users.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
          <h3 className="cardTitle">License log</h3>
          <p className="cardSub">Issued licenses and their validity windows.</p>
          <table className="table">
            <thead>
              <tr>
                <th>License</th>
                <th>Project</th>
                <th>Contractor</th>
                <th>Valid</th>
              </tr>
            </thead>
            <tbody>
              {licenses.slice().reverse().map(l => (
                <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/projects/${l.projectId}`)}>
                  <td style={{ fontWeight: 900 }}>{l.id}</td>
                  <td className="small">{projects.find(p => p.id === l.projectId)?.title || l.projectId}</td>
                  <td className="small">{actors.find(a => a.id === l.contractorId)?.name || l.contractorId}</td>
                  <td className="small">{l.validFrom}  {l.validTo}</td>
                </tr>
              ))}
              {!licenses.length ? <tr><td colSpan={4} className="muted">No licenses issued.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="hr" />

      <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
        <h3 className="cardTitle">Recent audit</h3>
        <p className="cardSub">Latest append-only events.</p>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {audit.slice().reverse().slice(0, 24).map(evt => (
              <tr key={evt.id}>
                <td className="small">{new Date(evt.timestamp).toLocaleString()}</td>
                <td className="small" style={{ fontWeight: 900 }}>{evt.action}</td>
                <td className="small">{evt.entityType}  {evt.entityId}</td>
                <td className="small">{actors.find(a => a.id === evt.actorId)?.name || evt.actorId}</td>
              </tr>
            ))}
            {!audit.length ? <tr><td colSpan={4} className="muted">No events.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
