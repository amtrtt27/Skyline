import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../store/store.js';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await store.login(form.email, form.password);
      nav('/app');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p className="subtle">Use the demo accounts from the landing page, or create your own.</p>
        {error && <div className="toast" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="l_email">Email</label>
            <input id="l_email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="l_pw">Password</label>
            <input id="l_pw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn" type="submit">Login</button>
          <div className="subtle">No account? <Link to="/register">Register here</Link>.</div>
        </form>
      </div>
    </div>
  );
}
