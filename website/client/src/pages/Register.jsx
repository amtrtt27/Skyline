import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../store/store.js';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'community' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await store.register(form);
      nav('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Register</h2>
        <p className="subtle">For hackathon demos, you can select any role.</p>

        {error && <div className="toast" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="r_name">Full name</label>
            <input id="r_name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="r_email">Email</label>
              <input id="r_email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="r_pw">Password</label>
              <input id="r_pw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="r_role">Role</label>
            <select id="r_role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="community">Community representative</option>
              <option value="official">Government official / urban planner</option>
              <option value="contractor">Contractor</option>
              <option value="admin">Admin</option>
            </select>
            <div className="hint">MVP note: role changes are simplified for demos and not production-secure.</div>
          </div>
          <button className="btn" type="submit">Create account</button>
          <div className="subtle">Already have an account? <Link to="/login">Login</Link>.</div>
        </form>
      </div>
    </div>
  );
}
