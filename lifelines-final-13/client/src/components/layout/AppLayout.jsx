import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';

function SideLink({ to, end, children }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `sideLink ${isActive ? 'sideLinkActive' : ''}`}>{children}</NavLink>;
}

export default function AppLayout() {
  const { auth, logout, apiStatus, flushOutbox } = useStore();
  const navigate = useNavigate();
  const user = auth.user;

  return (<>
    <header className="navbar">
      <div className="navInner">
        <div className="brand">
          <img src="/skyline-logo.svg" alt="Skyline" style={{ height: 50, objectFit: 'contain' }} />
        </div>
        <div className="navActions">
          <span className={`badge ${apiStatus.online ? 'badgeOk' : 'badgeWarn'}`}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: apiStatus.online ? '#10b981' : '#f59e0b' }} />
            {apiStatus.online ? 'Online' : 'Offline'}
          </span>
          {!apiStatus.online && <button className="btn" onClick={() => flushOutbox()}>Sync</button>}
          <span className="pill"><strong>{user?.name}</strong><span style={{ opacity: .8 }}>· {user?.role}</span></span>
          <button className="btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </div>
    </header>
    <div className="layout">
      <aside className="sidebar">
        <div className="sideSection">
          <p className="sideTitle">Workspace</p>
          <SideLink to="/app" end>Dashboard</SideLink>
          <SideLink to="/app/projects">Projects</SideLink>
          <SideLink to="/app/bids">Bids</SideLink>
          <SideLink to="/app/resources">Resources</SideLink>
          <SideLink to="/app/statistics">Statistics</SideLink>
          <SideLink to="/app/settings">Settings</SideLink>
          {user?.role === 'admin' && <SideLink to="/app/admin">Admin</SideLink>}
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  </>);
}
