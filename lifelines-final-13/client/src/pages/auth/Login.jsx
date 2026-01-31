import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(form.email, form.password);
      if (result) {
        navigate('/app');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (email, password) => {
    setError('');
    setLoading(true);
    setForm({ email, password });
    
    try {
      const result = await login(email, password);
      if (result) {
        navigate('/app');
      } else {
        setError('Demo login failed');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/skyline-logo.svg" alt="Skyline" style={{ height: 60, marginBottom: 16, objectFit: 'contain' }} />
          <h1 className="authTitle">Sign In</h1>
          <p className="authSubtitle">Access your Skyline workspace</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="formGroup">
            <label className="label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btnPrimary" 
            style={{ width: '100%', padding: 14, fontSize: 16, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 32, padding: 20, background: 'rgba(59,130,246,.05)', borderRadius: 'var(--radiusSm)', border: '1px solid rgba(59,130,246,.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
            Demo Accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => demoLogin('admin@example.com', '0vk2-kBf-UF2y-oThrvec#')}
              className="btn"
              style={{ fontSize: 13, padding: '10px 12px', textAlign: 'left' }}
              disabled={loading}
            >
              <strong>Admin</strong> - Full access
            </button>
            <button
              type="button"
              onClick={() => demoLogin('official@example.com', 'official123')}
              className="btn"
              style={{ fontSize: 13, padding: '10px 12px', textAlign: 'left' }}
              disabled={loading}
            >
              <strong>Official</strong> - Project management
            </button>
            <button
              type="button"
              onClick={() => demoLogin('contractor@example.com', 'contractor123')}
              className="btn"
              style={{ fontSize: 13, padding: '10px 12px', textAlign: 'left' }}
              disabled={loading}
            >
              <strong>Contractor</strong> - Bid submissions
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
        </div>
      </div>
    </div>
  );
}
