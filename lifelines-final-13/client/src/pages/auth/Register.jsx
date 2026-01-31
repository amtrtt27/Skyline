import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import { REGIONS, regionById } from '../../store/regions.js';

export default function Register() {
  const { register } = useStore();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'community',
    regionId: 'doha',
    customRegion: ''
  });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const regionName = useMemo(() => {
    if (form.regionId === 'other') return form.customRegion || 'Custom region';
    return regionById(form.regionId).name;
  }, [form.regionId, form.customRegion]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (form.regionId === 'other' && !form.customRegion.trim()) {
        throw new Error('Please enter a custom region name.');
      }
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        regionId: form.regionId === 'other' ? 'custom' : form.regionId,
        regionName
      });
      nav('/app', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Register</h1>
        <p className="muted">Choose your role and region of operation.</p>

        <form className="form" onSubmit={onSubmit}>
          <div className="row2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" className="input" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} required />
            </div>
          </div>

          <div className="row2">
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select id="role" className="select" value={form.role} onChange={(e) => setForm(s => ({ ...s, role: e.target.value }))}>
                <option value="community">Community representative</option>
                <option value="official">Government official / planner</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pw">Password</label>
              <input id="pw" className="input" type="password" value={form.password} onChange={(e) => setForm(s => ({ ...s, password: e.target.value }))} minLength={6} required />
              <div className="helper">For this MVP, passwords are stored server-side in a simple format.</div>
            </div>
          </div>

          <div className="row2">
            <div>
              <label className="label" htmlFor="region">Region</label>
              <select id="region" className="select" value={form.regionId} onChange={(e) => setForm(s => ({ ...s, regionId: e.target.value }))}>
                {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            {form.regionId === 'other' ? (
              <div>
                <label className="label" htmlFor="customRegion">Custom region name</label>
                <input id="customRegion" className="input" value={form.customRegion} onChange={(e) => setForm(s => ({ ...s, customRegion: e.target.value }))} placeholder="e.g. North district" />
              </div>
            ) : (
              <div className="pill" style={{ alignSelf: 'end' }}>
                Selected: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{regionName}</strong>
              </div>
            )}
          </div>

          {err ? <div className="error">{err}</div> : null}

          <button className="btn btnPrimary" type="submit" disabled={busy}>{busy ? 'Creating account' : 'Create account'}</button>

          <div className="muted small">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
