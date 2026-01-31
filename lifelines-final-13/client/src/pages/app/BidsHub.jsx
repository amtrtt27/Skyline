import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import StatusChip from '../../components/ui/StatusChip.jsx';

export default function BidsHub() {
  const { auth, db, getProjectsForUser, getDamageReport } = useStore();
  const user = auth.user;
  const nav = useNavigate();

  const projects = getProjectsForUser();
  const bids = db.bids || [];
  const licenses = db.licenses || [];

  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects
      .filter(p => !term || (p.title + ' ' + (p.location?.address || '')).toLowerCase().includes(term))
      .map(p => {
        const projectBids = bids.filter(b => b.projectId === p.id);
        const awarded = projectBids.find(b => b.status === 'Awarded') || null;
        const lic = licenses.find(l => l.projectId === p.id) || null;
        const report = getDamageReport(p.id);
        return {
          project: p,
          severity: report?.severity || '',
          bids: projectBids.length,
          topScore: projectBids.length ? Math.max(...projectBids.map(b => b.score || 0)) : 0,
          awarded,
          license: lic
        };
      })
      .filter(r => {
        // contractors only care about published projects (plus awarded/licensed for transparency)
        if (user.role === 'contractor') return ['Published','Awarded','Licensed','Completed'].includes(r.project.status);
        return true;
      })
      .sort((a,b) => (b.topScore - a.topScore) || a.project.title.localeCompare(b.project.title));
  }, [projects, bids, licenses, q, user.role, getDamageReport]);

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <h1 className="cardTitle" style={{ fontSize: 26, margin: 0 }}>Bids portal</h1>
          <p className="cardSub">Track contractor activity and open projects to submit or award bids.</p>
        </div>
      </div>

      <div className="row2">
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by project title or address" />
        </div>
        <div className="pill" style={{ alignSelf: 'end' }}>
          Results: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{rows.length}</strong>
        </div>
      </div>

      <hr className="hr" />

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
        <table className="table" aria-label="Bids hub table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ minWidth: 200 }}>Project</th>
              <th style={{ textAlign: 'center', minWidth: 100 }}>Severity</th>
              <th style={{ textAlign: 'center', minWidth: 120 }}>Status</th>
              <th style={{ textAlign: 'center', minWidth: 80 }}>Bids</th>
              <th style={{ textAlign: 'center', minWidth: 100 }}>Top Score</th>
              <th style={{ minWidth: 150 }}>Winner</th>
              <th style={{ textAlign: 'center', minWidth: 100 }}>License</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.project.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/projects/${r.project.id}`)}>
                <td style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.project.title}</div>
                <div className="small muted">{r.project.location?.address || ''}</div>
              </td>
              <td style={{ textAlign: 'center', minWidth: 100 }} className="small">{r.severity}</td>
              <td style={{ textAlign: 'center', minWidth: 120 }}><StatusChip status={r.project.status} /></td>
              <td style={{ textAlign: 'center', minWidth: 80, fontWeight: 700 }} className="small">{r.bids}</td>
              <td style={{ textAlign: 'center', minWidth: 100, fontWeight: 700, color: 'var(--accent)' }} className="small">{r.bids ? `${Math.round(r.topScore * 100)}/100` : ''}</td>
              <td style={{ minWidth: 150 }} className="small">{r.awarded ? (db.actors || []).find(a => a.id === r.awarded.contractorId)?.name || r.awarded.contractorId : ''}</td>
              <td style={{ textAlign: 'center', minWidth: 100 }} className="small">{r.license ? r.license.id : ''}</td>
            </tr>
          ))}
          {!rows.length ? <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No items.</td></tr> : null}
        </tbody>
      </table>
      </div>

      <div className="muted small" style={{ marginTop: 12 }}>
        Tip: open a project to submit bids (contractors) or award bids and issue licenses (official/admin).
      </div>
    </div>
  );
}
