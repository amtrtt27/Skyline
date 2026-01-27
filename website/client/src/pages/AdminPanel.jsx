import React, { useEffect, useState } from 'react';
import { store } from '../store/store.js';
import { shortDate } from '../utils/format.js';

export default function AdminPanel() {
  const [state, setState] = useState(store.state);

  useEffect(() => store.subscribe(setState), []);
  useEffect(() => { store.loadAdmin(); }, []);

  const users = state.admin.users || [];
  const licenses = state.admin.licenses || [];
  const audit = state.admin.audit || [];

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Admin</h2>
          <div className="subtle">Basic oversight: users, licenses, and audit events.</div>
        </div>
      </div>

      <div className="row2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Users</h3>
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="subtle">No data.</div>}
        </div>

        <div className="card">
          <h3>License log</h3>
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>ID</th><th>Project</th><th>Contractor</th><th>Issued</th></tr>
            </thead>
            <tbody>
              {licenses.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.projectId}</td>
                  <td>{l.contractorId}</td>
                  <td>{shortDate(l.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {licenses.length === 0 && <div className="subtle">No licenses issued yet.</div>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>Audit (sample)</h3>
        <div className="subtle">In the MVP, demo mode keeps a lightweight audit list. The API mode logs actions server-side.</div>

        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Time</th><th>Entity</th><th>Action</th><th>Actor</th></tr>
          </thead>
          <tbody>
            {audit.slice().reverse().slice(0, 30).map((a) => (
              <tr key={a.id}>
                <td>{shortDate(a.timestamp)}</td>
                <td>{a.entityType}:{a.entityId}</td>
                <td>{a.action}</td>
                <td>{a.actorId}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {audit.length === 0 && <div className="subtle">No audit events.</div>}
      </div>
    </div>
  );
}
