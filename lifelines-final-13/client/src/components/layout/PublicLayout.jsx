import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';

export default function PublicLayout() {
  const { auth } = useStore();
  const loc = useLocation();

  return (
    <>
      <header className="navbar">
        <div className="navInner">
          <Link to="/" className="brand" aria-label="LifeLines home">
            <span className="brandMark">LL</span>
            <span>LifeLines</span>
          </Link>

          <nav className="navLinks" aria-label="Primary">
            <Link to="/about">About</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/contact">Contact</Link>
          </nav>

          <div className="navActions">
            {auth.user ? (
              <Link className="btn btnPrimary" to="/app">Open app</Link>
            ) : (
              <>
                <Link className="btn" to={`/login${loc.pathname.startsWith('/login') ? '' : ''}`}>Login</Link>
                <Link className="btn btnPrimary" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="container" style={{ paddingBottom: 28 }}>
        <div className="muted small">
           {new Date().getFullYear()} LifeLines  Sustainable reconstruction, faster coordination.
        </div>
      </footer>
    </>
  );
}
