import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/DataStore.jsx';
import { REGIONS, regionById } from '../../store/regions.js';

export default function Settings() {
  const {
    auth,
    apiStatus,
    exportOfflinePack,
    importOfflinePack,
    resetLocalCache,
    flushOutbox,
    updateMyRegion
  } = useStore();

  const user = auth.user;
  const currentRegion = useMemo(() => regionById(user?.regionId || 'doha'), [user?.regionId]);

  const [regionId, setRegionId] = useState(user?.regionId || currentRegion.id);
  const [customRegion, setCustomRegion] = useState(user?.regionName || '');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const saveRegion = async () => {
    setErr(null);
    setMsg(null);
    try {
      if (regionId === 'other' && !customRegion.trim()) throw new Error('Enter a custom region name.');
      const name = regionId === 'other' ? customRegion.trim() : regionById(regionId).name;
      await updateMyRegion({ regionId: regionId === 'other' ? 'custom' : regionId, regionName: name });
      setMsg('Region updated.');
      setTimeout(() => setMsg(null), 2200);
    } catch (e) {
      setErr(e.message);
    }
  };

  const onImport = async (e) => {
    setErr(null);
    setMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importOfflinePack(file);
      setMsg('Offline pack imported.');
      setTimeout(() => setMsg(null), 2200);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      e.target.value = '';
    }
  };

  const reset = () => {
    if (!confirm('Reset local cache to the seeded dataset?')) return;
    resetLocalCache();
    setMsg('Local cache reset.');
    setTimeout(() => setMsg(null), 2200);
  };

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <h1 className="cardTitle" style={{ fontSize: 26, margin: 0 }}>Settings</h1>
          <p className="cardSub">Offline packs, region selection, and synchronization tools.</p>
        </div>
        <div className={`badge ${apiStatus.online ? 'badgeOk' : 'badgeWarn'}`}>
          {apiStatus.online ? 'API reachable' : 'API unreachable'}
        </div>
      </div>

      {msg ? <div className="success" style={{ marginBottom: 10 }}>{msg}</div> : null}
      {err ? <div className="error" style={{ marginBottom: 10 }}>{err}</div> : null}

      <div className="grid2">
        <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
          <h3 className="cardTitle">Offline packs</h3>
          <p className="cardSub">Export a full snapshot for offline deployments, or import one to restore state.</p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btnPrimary" onClick={exportOfflinePack}>Export offline pack</button>
            <label className="btn" style={{ cursor: 'pointer' }}>
              Import pack
              <input type="file" accept="application/json" onChange={onImport} style={{ display: 'none' }} />
            </label>
            <button className="btn btnDanger" onClick={reset}>Reset local cache</button>
          </div>

          <hr className="hr" />

          <div className="muted small">
            When the API is unavailable, the app continues to work from the local snapshot. Changes are stored locally and will sync when possible.
          </div>

          {!apiStatus.online ? (
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={flushOutbox}>Try sync now</button>
            </div>
          ) : null}
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
          <h3 className="cardTitle">Region of operation</h3>
          <p className="cardSub">You can change your region at any time.</p>

          <div className="form">
            <div className="row2">
              <div>
                <label className="label">Region</label>
                <select className="select" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                  {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {regionId === 'other' ? (
                <div>
                  <label className="label">Custom region name</label>
                  <input className="input" value={customRegion} onChange={(e) => setCustomRegion(e.target.value)} placeholder="e.g. North district" />
                </div>
              ) : (
                <div className="pill" style={{ alignSelf: 'end' }}>
                  Current: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{user?.regionName || currentRegion.name}</strong>
                </div>
              )}
            </div>

            <button className="btn btnPrimary" onClick={saveRegion}>Save region</button>
          </div>

          <hr className="hr" />

          <div className="muted small">
            API base URL: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{import.meta.env.VITE_API_BASE_URL || '/api'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
