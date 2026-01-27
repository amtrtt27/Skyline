import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { store } from '../store/store.js';

export default function Sidebar() {
  const [state, setState] = useState(store.state);
  const navigate = useNavigate();

  useEffect(() => store.subscribe(setState), []);

  const user = state.user;

  const onLogout = async () => {
    await store.logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div>
        <div className="side-brand">
          <span className="dot" aria-hidden="true"></span>
          LifeLines
        </div>

        <div className="side-links">
          <NavLink end className="side-link" to="/app">Home</NavLink>
          <NavLink className="side-link" to="/app/projects">Projects</NavLink>
          {(user.role === 'contractor' || user.role === 'admin') && (
            <NavLink className="side-link" to="/app/bids">Bids</NavLink>
          )}
          {user.role === 'admin' && (
            <NavLink className="side-link" to="/app/admin">Admin</NavLink>
          )}
        </div>
      </div>

      <div className="side-footer">
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#e5e7eb', fontWeight: 800 }}>{user.name}</div>
          <div>{user.email}</div>
          <div style={{ marginTop: 6 }}>
            <span className="badge dot" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#e5e7eb' }}>
              {user.role}
            </span>
          </div>
        </div>
        <button className="btn secondary" onClick={onLogout} style={{ width: '100%' }}>Logout</button>
      </div>
    </aside>
  );
}
