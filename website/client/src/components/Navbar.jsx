import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../store/store.js';

export default function Navbar() {
  const [state, setState] = useState(store.state);
  const navigate = useNavigate();

  useEffect(() => store.subscribe(setState), []);

  const user = state.user;

  const onLogout = async () => {
    await store.logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="LifeLines home">
          <span className="brand-badge" aria-hidden="true"></span>
          LifeLines
          {state.demoMode && (
            <span className="badge" style={{ marginLeft: 10, borderColor: '#fde68a', background: '#fffbeb', color: '#92400e' }}>
              Demo Mode
            </span>
          )}
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link className="nav-pill" to="/about">About</Link>
          <Link className="nav-pill" to="/how-it-works">How it works</Link>
          <Link className="nav-pill" to="/projects">Projects</Link>
          <Link className="nav-pill" to="/contact">Contact</Link>

          {user ? (
            <>
              <Link className="btn secondary" to="/app">Dashboard</Link>
              <button className="btn" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn secondary" to="/login">Login</Link>
              <Link className="btn" to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
