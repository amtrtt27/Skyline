import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Page not found</h2>
        <p className="subtle">The page you requested doesn’t exist.</p>
        <Link className="btn" to="/">Go home</Link>
      </div>
    </div>
  );
}
