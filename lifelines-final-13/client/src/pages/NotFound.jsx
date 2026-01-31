import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Page not found</h2>
        <p className="muted">The page you requested doesnt exist.</p>
        <Link className="btn btnPrimary" to="/">Back to home</Link>
      </div>
    </div>
  );
}
