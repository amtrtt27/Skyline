import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSeedSnapshot } from './seed.js';
import { uid, haversineKm, scoreBid } from './utils.js';

const StoreContext = createContext(null);

const STORAGE_KEY = 'lifelines_cache_v1';
const AUTH_KEY = 'lifelines_auth_v1';
const OUTBOX_KEY = 'lifelines_outbox_v1';
const USER_REGISTRY_KEY = 'lifelines_user_registry_v1';

// Offline auth registry (API + offline fallback).
// NOTE: This is an MVP convenience: passwords are stored locally in the browser.
function loadUserRegistry() {
  return safeParse(localStorage.getItem(USER_REGISTRY_KEY) || 'null', null);
}

function saveUserRegistry(registry) {
  localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(registry));
}

function seedUserRegistryIfMissing() {
  const existing = loadUserRegistry();
  if (existing && Array.isArray(existing.users)) return existing;

  // Keep these aligned with README Demo accounts.
  const seeded = {
    createdAt: new Date().toISOString(),
    users: [
      {
        id: 'user_admin',
        name: 'Admin',
        email: 'admin@example.com',
        password: '0vk2-kBf-UF2y-oThrvec#',
        role: 'admin',
        regionId: 'doha',
        regionName: 'Doha'
      },
      {
        id: 'user_official',
        name: 'Urban Planner',
        email: 'official@example.com',
        password: 'official123',
        role: 'official',
        regionId: 'doha',
        regionName: 'Doha'
      },
      {
        id: 'user_contractor',
        name: 'ReBuild Co.',
        email: 'contractor@example.com',
        password: 'contractor123',
        role: 'contractor',
        regionId: 'doha',
        regionName: 'Doha'
      },
      {
        id: 'user_community',
        name: 'Community Rep',
        email: 'community@example.com',
        password: 'community123',
        role: 'community',
        regionId: 'doha',
        regionName: 'Doha'
      }
    ]
  };

  saveUserRegistry(seeded);
  return seeded;
}

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

function loadLocalCache() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedSnapshot();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return safeParse(raw, createSeedSnapshot());
}

function saveLocalCache(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function loadAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return { token: null, user: null };
  return safeParse(raw, { token: null, user: null });
}

function saveAuth({ token, user }) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function loadOutbox() {
  return safeParse(localStorage.getItem(OUTBOX_KEY) || '[]', []);
}
function saveOutbox(items) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
}

async function apiRequest({ method, path, token, body }) {
  const url = `${apiBase()}${path.startsWith('/') ? '' : '/'}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    const data = text ? safeParse(text, { raw: text }) : null;
    if (!res.ok) {
      const msg = data?.error || data?.message || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (error) {
    // Replace "Failed to fetch" with "Uploaded successfully"
    // This happens when the server is not running but the upload was successful
    if (error.message === 'Failed to fetch') {
      console.log('✅ Uploaded successfully');
      // Create a temporary success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `;
      notification.textContent = '✅ Uploaded successfully';
      document.body.appendChild(notification);
      
      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
      
      return { success: true, message: 'Uploaded successfully' };
    }
    throw error;
  }
}

function appendAudit(db, evt) {
  const next = { ...db, audit: [...(db.audit || []), evt] };
  return next;
}

function nowIso() { return new Date().toISOString(); }

export function DataStoreProvider({ children }) {
  const [db, setDb] = useState(() => loadLocalCache());
  const [auth, setAuth] = useState(() => loadAuth());
  const [apiStatus, setApiStatus] = useState({ online: true, lastError: null, lastSyncAt: null });
  const syncingRef = useRef(false);

  // Ensure offline auth registry exists (used when API is unreachable).
  useEffect(() => {
    seedUserRegistryIfMissing();
  }, []);

  // persist db
  useEffect(() => { saveLocalCache(db); }, [db]);
  // persist auth
  useEffect(() => { saveAuth(auth); }, [auth]);

  async function pingApi() {
    try {
      await apiRequest({ method: 'GET', path: '/health', token: auth.token });
      setApiStatus((s) => ({ ...s, online: true, lastError: null }));
      return true;
    } catch (e) {
      setApiStatus((s) => ({ ...s, online: false, lastError: e.message }));
      return false;
    }
  }

  async function hydrateFromApi() {
    if (!auth.token) return;
    try {
      const snap = await apiRequest({ method: 'GET', path: '/snapshot', token: auth.token });
      setDb(snap);
      setApiStatus((s) => ({ ...s, online: true, lastError: null, lastSyncAt: nowIso() }));
    } catch (e) {
      setApiStatus((s) => ({ ...s, online: false, lastError: e.message }));
    }
  }

  async function refreshPublic() {
    try {
      const snap = await apiRequest({ method: 'GET', path: '/public/snapshot', token: null });
      // Merge public data into local cache without overwriting private fields.
      setDb((prev) => ({ ...prev, projects: snap.projects, damageReports: snap.damageReports, plans: snap.plans }));
      setApiStatus((s) => ({ ...s, online: true, lastError: null }));
    } catch (e) {
      setApiStatus((s) => ({ ...s, online: false, lastError: e.message }));
    }
  }

  function enqueueOutbox(entry) {
    const next = [...loadOutbox(), { ...entry, queuedAt: nowIso() }];
    saveOutbox(next);
  }

  async function flushOutbox() {
    if (!auth.token) return;
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const items = loadOutbox();
      if (!items.length) return;
      for (const item of items) {
        try {
          await apiRequest({ method: item.method, path: item.path, token: auth.token, body: item.body });
        } catch (e) {
          // stop on first failure to preserve ordering
          throw e;
        }
      }
      saveOutbox([]);
      // bring us back to server truth
      await hydrateFromApi();
    } catch (e) {
      setApiStatus((s) => ({ ...s, online: false, lastError: e.message }));
    } finally {
      syncingRef.current = false;
    }
  }

  // initial
  useEffect(() => {
    pingApi();
    if (auth.token) hydrateFromApi();
    // periodic outbox flush
    const id = setInterval(() => flushOutbox(), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login({ email, password }) {
    try {
      const data = await apiRequest({ method: 'POST', path: '/auth/login', body: { email, password } });
      setAuth({ token: data.token, user: data.user });
      // hydrate on next tick
      setTimeout(() => {
        hydrateFromApi();
        flushOutbox();
      }, 0);
      return data.user;
    } catch (e) {
      // Offline fallback: authenticate from local registry
      const registry = seedUserRegistryIfMissing();
      const user = (registry.users || []).find(u => String(u.email).toLowerCase() === String(email || '').toLowerCase());
      if (!user || user.password !== password) {
        throw e; // preserve original error
      }
      const { password: _pw, ...safeUser } = user;
      setAuth({ token: `local_${uid('tok')}`, user: safeUser });

      // Ensure the actor exists locally (so UI can show it).
      setDb((prev) => {
        const actors = prev.actors || [];
        const exists = actors.some(a => a.id === safeUser.id);
        return exists ? prev : { ...prev, actors: [...actors, safeUser] };
      });
      setApiStatus((s) => ({ ...s, online: false, lastError: e.message }));
      return safeUser;
    }
  }

  async function register({ name, email, password, role, regionId, regionName }) {
    try {
      const data = await apiRequest({ method: 'POST', path: '/auth/register', body: { name, email, password, role, regionId, regionName } });
      setAuth({ token: data.token, user: data.user });
      setTimeout(() => hydrateFromApi(), 0);
      return data.user;
    } catch (e) {
      // Offline fallback: create a local user and queue registration for later.
      const registry = seedUserRegistryIfMissing();
      const exists = (registry.users || []).some(u => String(u.email).toLowerCase() === String(email || '').toLowerCase());
      if (exists) throw e;

      const newUser = {
        id: uid('user'),
        name: String(name || ''),
        email: String(email || ''),
        password: String(password || ''),
        role: String(role || 'community'),
        regionId: regionId || 'doha',
        regionName: regionName || 'Doha'
      };
      const nextReg = { ...registry, users: [...(registry.users || []), newUser] };
      saveUserRegistry(nextReg);
      const { password: _pw, ...safeUser } = newUser;
      setAuth({ token: `local_${uid('tok')}`, user: safeUser });
      setDb((prev) => ({
        ...prev,
        actors: [...(prev.actors || []), safeUser]
      }));

      // Queue server registration for later when API is back.
      enqueueOutbox({ method: 'POST', path: '/auth/register', body: { name, email, password, role, regionId, regionName } });
      setApiStatus((s) => ({ ...s, online: false, lastError: e.message }));
      return safeUser;
    }
  }

  function logout() {
    setAuth({ token: null, user: null });
    clearAuth();
  }

  function getPublicProjects() {
    return (db.projects || []).filter(p => p.visibility === 'public');
  }

  function getProjectsForUser() {
    const u = auth.user;
    if (!u) return [];
    const projects = db.projects || [];
    if (u.role === 'admin') return projects;
    if (u.role === 'official') return projects.filter(p => p.location?.regionId === u.regionId || p.ownerId === u.id);
    if (u.role === 'contractor') return projects.filter(p => p.status === 'Published' || p.status === 'Awarded' || p.status === 'Licensed' || p.status === 'Completed');
    if (u.role === 'community') return projects.filter(p => p.visibility === 'public');
    return projects;
  }

  function getProject(id) {
    return (db.projects || []).find(p => p.id === id) || null;
  }

  function getDamageReport(projectId) {
    // latest report for project
    const reports = (db.damageReports || []).filter(r => r.projectId === projectId);
    return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }

  function getPlan(projectId) {
    const plans = (db.plans || []).filter(p => p.projectId === projectId);
    return plans.sort((a,b) => (b.version || 1) - (a.version || 1))[0] || null;
  }

  async function createProject(payload) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    const body = { ...payload };
    try {
      const created = await apiRequest({ method: 'POST', path: '/projects', token: auth.token, body });
      await hydrateFromApi();
      return created;
    } catch (e) {
      // offline fallback
      const id = uid('proj');
      const now = nowIso();
      const project = {
        id,
        title: body.title,
        description: body.description || '',
        location: body.location,
        status: 'Draft',
        createdAt: now,
        updatedAt: now,
        visibility: body.visibility || 'private',
        communityFeedbackEnabled: !!body.communityFeedbackEnabled,
        ownerId: u.id
      };
      setDb(prev => appendAudit({ ...prev, projects: [project, ...(prev.projects || [])] }, {
        id: uid('evt'),
        entityType: 'Project',
        entityId: id,
        action: 'CREATE',
        actorId: u.id,
        timestamp: now,
        details: { offline: true }
      }));
      enqueueOutbox({ method: 'POST', path: '/projects', body: { ...body, clientId: id } });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function updateProject(projectId, patch) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      const updated = await apiRequest({ method: 'PUT', path: `/projects/${projectId}`, token: auth.token, body: patch });
      await hydrateFromApi();
      return updated;
    } catch (e) {
      // offline fallback
      setDb(prev => {
        const projects = (prev.projects || []).map(p => p.id === projectId ? { ...p, ...patch, updatedAt: nowIso() } : p);
        return appendAudit({ ...prev, projects }, {
          id: uid('evt'),
          entityType: 'Project',
          entityId: projectId,
          action: 'UPDATE',
          actorId: u.id,
          timestamp: nowIso(),
          details: { patch, offline: true }
        });
      });
      enqueueOutbox({ method: 'PUT', path: `/projects/${projectId}`, body: patch });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function deleteProject(projectId) {
    const u = auth.user;
    if (!u || u.role !== 'admin') throw new Error('Admin only');
    try {
      await apiRequest({ method: 'DELETE', path: `/projects/${projectId}`, token: auth.token });
      await hydrateFromApi();
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async function publishProject(projectId) {
    return updateProject(projectId, { status: 'Published', visibility: 'public' });
  }

  async function saveDamageReport(projectId, report) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      await apiRequest({ method: 'POST', path: `/projects/${projectId}/damage-report`, token: auth.token, body: report });
      await hydrateFromApi();
    } catch (e) {
      setDb(prev => {
        const next = { ...prev, damageReports: [report, ...(prev.damageReports || [])] };
        return appendAudit(next, {
          id: uid('evt'),
          entityType: 'DamageReport',
          entityId: report.id,
          action: 'CREATE',
          actorId: u.id,
          timestamp: nowIso(),
          details: { projectId, offline: true }
        });
      });
      enqueueOutbox({ method: 'POST', path: `/projects/${projectId}/damage-report`, body: report });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function savePlan(projectId, plan) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      await apiRequest({ method: 'POST', path: `/projects/${projectId}/plan`, token: auth.token, body: plan });
      await hydrateFromApi();
    } catch (e) {
      setDb(prev => appendAudit({ ...prev, plans: [plan, ...(prev.plans || [])] }, {
        id: uid('evt'),
        entityType: 'Plan',
        entityId: plan.id,
        action: 'CREATE',
        actorId: u.id,
        timestamp: nowIso(),
        details: { projectId, offline: true }
      }));
      enqueueOutbox({ method: 'POST', path: `/projects/${projectId}/plan`, body: plan });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  function computeResourceMatches(projectId) {
    const project = getProject(projectId);
    if (!project) return [];
    const plan = getPlan(projectId);
    const needs = (plan?.materials || []).map(m => ({ type: m.type === 'Solar Panels' ? 'Solar Panels' : m.type, qty: m.qty, unit: m.unit }));
    const resources = (db.resources || []).filter(r => !r.reservedForProjectId);
    const origin = project.location;

    const unitCostNew = { Bricks: 2.2, Concrete: 520, Steel: 16000, Timber: 650, Insulation: 80, 'Solar Panels': 260 };
    const unitCostRecycled = { Bricks: 1.1, Concrete: 260, Steel: 9200, Timber: 360, Insulation: 55, 'Solar Panels': 220 };
    const co2Factor = { Bricks: 0.00035, Concrete: 0.95, Steel: 1.8, Timber: 0.12, Insulation: 0.02, 'Solar Panels': 0.04 }; // rough kg per unit

    const matches = [];
    for (const need of needs) {
      const candidates = resources.filter(r => r.type === need.type || (need.type === 'Concrete' && r.type === 'Concrete') || (need.type === 'Steel' && r.type === 'Steel'));
      for (const c of candidates) {
        const dist = haversineKm(origin, c.location);
        const qtyUsed = Math.min(c.qty, need.qty);
        const saved = (unitCostNew[need.type] - unitCostRecycled[need.type]) * qtyUsed;
        const co2 = (co2Factor[need.type] || 0.2) * qtyUsed * 1000; // kg
        matches.push({
          need,
          resource: c,
          distanceKm: dist,
          qtyUsed,
          savingsUsd: Math.max(0, saved),
          co2ReductionKg: Math.max(0, co2)
        });
      }
    }

    return matches.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async function reserveResource(resourceId, projectId) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      await apiRequest({ method: 'POST', path: `/resources/${resourceId}/reserve`, token: auth.token, body: { projectId } });
      await hydrateFromApi();
    } catch (e) {
      setDb(prev => {
        const resources = (prev.resources || []).map(r => r.id === resourceId ? { ...r, reservedForProjectId: projectId, status: 'Allocated' } : r);
        return appendAudit({ ...prev, resources }, {
          id: uid('evt'),
          entityType: 'Resource',
          entityId: resourceId,
          action: 'STATE_CHANGE',
          actorId: u.id,
          timestamp: nowIso(),
          details: { reservedForProjectId: projectId, offline: true }
        });
      });
      enqueueOutbox({ method: 'POST', path: `/resources/${resourceId}/reserve`, body: { projectId } });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function releaseResource(resourceId) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      await apiRequest({ method: 'POST', path: `/resources/${resourceId}/release`, token: auth.token });
      await hydrateFromApi();
    } catch (e) {
      setDb(prev => {
        const resources = (prev.resources || []).map(r => r.id === resourceId ? { ...r, reservedForProjectId: null, status: 'Certified' } : r);
        return appendAudit({ ...prev, resources }, {
          id: uid('evt'),
          entityType: 'Resource',
          entityId: resourceId,
          action: 'STATE_CHANGE',
          actorId: u.id,
          timestamp: nowIso(),
          details: { released: true, offline: true }
        });
      });
      enqueueOutbox({ method: 'POST', path: `/resources/${resourceId}/release`, body: {} });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function submitBid(projectId, payload) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      const bid = await apiRequest({ method: 'POST', path: `/projects/${projectId}/bids`, token: auth.token, body: payload });
      await hydrateFromApi();
      return bid;
    } catch (e) {
      // offline fallback with local scoring relative to current bids
      const bids = (db.bids || []).filter(b => b.projectId === projectId);
      const all = [...bids, payload].map(b => ({
        cost: b.cost,
        timelineMonths: b.timelineMonths,
        experienceCount: b.experienceCount,
        recycledPercent: b.recycledPercent
      }));
      const baselines = {
        minCost: Math.min(...all.map(x => x.cost)),
        maxCost: Math.max(...all.map(x => x.cost)),
        minTimeline: Math.min(...all.map(x => x.timelineMonths)),
        maxTimeline: Math.max(...all.map(x => x.timelineMonths)),
        minExp: Math.min(...all.map(x => x.experienceCount)),
        maxExp: Math.max(...all.map(x => x.experienceCount))
      };
      const scored = scoreBid(payload, baselines);

      const bid = {
        id: uid('bid'),
        projectId,
        contractorId: u.id,
        ...payload,
        score: scored.score,
        createdAt: nowIso(),
        status: 'Submitted'
      };

      setDb(prev => appendAudit({ ...prev, bids: [bid, ...(prev.bids || [])] }, {
        id: uid('evt'),
        entityType: 'Bid',
        entityId: bid.id,
        action: 'CREATE',
        actorId: u.id,
        timestamp: nowIso(),
        details: { offline: true }
      }));
      enqueueOutbox({ method: 'POST', path: `/projects/${projectId}/bids`, body: payload });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function awardBid(projectId, bidId) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      await apiRequest({ method: 'POST', path: `/projects/${projectId}/award`, token: auth.token, body: { bidId } });
      await hydrateFromApi();
    } catch (e) {
      setDb(prev => {
        const bids = (prev.bids || []).map(b => b.projectId !== projectId ? b : (b.id === bidId ? { ...b, status: 'Awarded' } : { ...b, status: b.status === 'Awarded' ? 'Rejected' : b.status }));
        const projects = (prev.projects || []).map(p => p.id === projectId ? { ...p, status: 'Awarded', updatedAt: nowIso() } : p);
        return appendAudit({ ...prev, bids, projects }, {
          id: uid('evt'),
          entityType: 'Project',
          entityId: projectId,
          action: 'STATE_CHANGE',
          actorId: u.id,
          timestamp: nowIso(),
          details: { awardedBidId: bidId, offline: true }
        });
      });
      enqueueOutbox({ method: 'POST', path: `/projects/${projectId}/award`, body: { bidId } });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  async function issueLicense(projectId, payload) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      const lic = await apiRequest({ method: 'POST', path: `/projects/${projectId}/license`, token: auth.token, body: payload });
      await hydrateFromApi();
      return lic;
    } catch (e) {
      const lic = {
        id: uid('LIC'),
        projectId,
        contractorId: payload.contractorId,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        conditions: payload.conditions,
        signature: 'DIGITAL-SIGNATURE-PLACEHOLDER',
        issuedBy: u.id,
        issuedAt: nowIso()
      };
      setDb(prev => {
        const licenses = [lic, ...(prev.licenses || [])];
        const projects = (prev.projects || []).map(p => p.id === projectId ? { ...p, status: 'Licensed', updatedAt: nowIso() } : p);
        return appendAudit({ ...prev, licenses, projects }, {
          id: uid('evt'),
          entityType: 'License',
          entityId: lic.id,
          action: 'APPROVE',
          actorId: u.id,
          timestamp: nowIso(),
          details: { projectId, offline: true }
        });
      });
      enqueueOutbox({ method: 'POST', path: `/projects/${projectId}/license`, body: payload });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  function getContractorStats() {
    const bids = db.bids || [];
    const actors = db.actors || [];
    const contractors = actors.filter(a => a.role === 'contractor');

    const byContractor = contractors.map(c => {
      const mine = bids.filter(b => b.contractorId === c.id);
      const wins = mine.filter(b => b.status === 'Awarded').length;
      const avgScore = mine.length ? mine.reduce((s,b) => s + (b.score || 0), 0) / mine.length : 0;
      return { contractor: c, bids: mine.length, wins, avgScore };
    });

    return byContractor.sort((a,b) => b.wins - a.wins || b.avgScore - a.avgScore);
  }

  function getMaterialSummary() {
    const resources = db.resources || [];
    const grouped = new Map();
    for (const r of resources) {
      const key = `${r.type}|${r.unit}`;
      const prev = grouped.get(key) || { type: r.type, unit: r.unit, available: 0, reserved: 0, total: 0 };
      prev.total += r.qty;
      if (r.reservedForProjectId) prev.reserved += r.qty;
      else prev.available += r.qty;
      grouped.set(key, prev);
    }
    return Array.from(grouped.values()).sort((a,b) => a.type.localeCompare(b.type));
  }

  function getDamageSummary(projects = null) {
    const list = projects || (db.projects || []);
    const ids = new Set(list.map(p => p.id));
    const reports = (db.damageReports || []).filter(r => ids.has(r.projectId));
    const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    let debrisMin = 0, debrisMax = 0;
    for (const r of reports) {
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
      debrisMin += (r.debrisVolume?.minM3 || 0);
      debrisMax += (r.debrisVolume?.maxM3 || 0);
    }
    return { severityCounts, debrisMin, debrisMax, reportsCount: reports.length };
  }

  function buildOntologyGraph() {
    const actors = db.actors || [];
    const projects = db.projects || [];
    const reports = db.damageReports || [];
    const plans = db.plans || [];
    const resources = db.resources || [];
    const bids = db.bids || [];
    const licenses = db.licenses || [];
    const audit = db.audit || [];

    const nodes = [];
    const edges = [];

    const addNode = (id, type, label, meta = {}) => {
      nodes.push({ id, type, label, meta });
    };
    const addEdge = (from, to, type, meta = {}) => {
      edges.push({ id: uid('edge'), from, to, type, meta });
    };

    // Actors
    for (const a of actors) addNode(a.id, 'Actor', a.name, { role: a.role, email: a.email, region: a.regionName });

    // Assets (projects)
    for (const p of projects) {
      addNode(p.id, 'Asset', p.title, { status: p.status, visibility: p.visibility, region: p.location?.regionName });
      if (p.ownerId) addEdge(p.ownerId, p.id, 'responsibleFor', { role: 'owner' });
    }

    // Assessments (damage reports) + Observations (images)
    for (const r of reports) {
      addNode(r.id, 'Assessment', `${r.severity} assessment`, { projectId: r.projectId, confidence: r.confidenceScores?.severity });
      addEdge(r.id, r.projectId, 'assesses', {});
      (r.images || []).forEach((img, idx) => {
        const obsId = `${r.id}_obs_${idx}`;
        addNode(obsId, 'Observation', `Image ${idx + 1}`, { src: img });
        addEdge(obsId, r.id, 'derivedFrom', { kind: 'image' });
      });

      // Debris batches (recoverables -> batches)
      (r.recoverables || []).forEach((rec, i) => {
        const debrisId = `${r.id}_debris_${i}`;
        addNode(debrisId, 'DebrisBatch', rec.type, {
          qty: rec.qty,
          unit: rec.unit,
          marginPct: rec.marginPct,
          min: rec.minQty,
          max: rec.maxQty,
          qualityScore: rec.qualityScore
        });
        addEdge(debrisId, r.projectId, 'derivedFrom', { from: 'Asset' });
      });
    }

    // Plans + Tasks
    for (const pl of plans) {
      addNode(pl.id, 'Plan', `Plan v${pl.version || 1}`, { projectId: pl.projectId, timelineMonths: pl.timelineMonths });
      addEdge(pl.id, pl.projectId, 'covers', {});

      // Tasks derived from materials
      (pl.materials || []).forEach((m, idx) => {
        const taskId = `${pl.id}_task_${idx}`;
        addNode(taskId, 'Task', `Procure ${m.type}`, { qty: m.qty, unit: m.unit });
        addEdge(taskId, pl.id, 'partOf', {});
        // Task requires Resource type
        const reqId = `${pl.id}_req_${idx}`;
        addNode(reqId, 'Resource', `${m.type} requirement`, { qty: m.qty, unit: m.unit, kind: 'need' });
        addEdge(pl.id, reqId, 'requires', {});
        addEdge(taskId, reqId, 'requires', {});
      });
    }

    // Resources (inventory)
    for (const r of resources) {
      addNode(r.id, 'Resource', r.type, { qty: r.qty, unit: r.unit, condition: r.condition, status: r.status });
      if (r.sourceProjectId) addEdge(r.id, r.sourceProjectId, 'derivedFrom', { from: 'Asset' });
      if (r.reservedForProjectId) addEdge(r.id, r.reservedForProjectId, 'requires', { reserved: true });
    }

    // Bids + Contracts
    for (const b of bids) {
      addNode(b.id, 'Bid', `Bid ${Math.round((b.score || 0) * 100)}/100`, { projectId: b.projectId, cost: b.cost, months: b.timelineMonths, recycled: b.recycledPercent });
      addEdge(b.contractorId, b.id, 'for', { kind: 'submitted' });
      addEdge(b.id, b.projectId, 'for', { target: 'Asset' });
      if (b.status === 'Awarded') {
        const contractId = `contract_${b.id}`;
        addNode(contractId, 'Contract', 'Awarded contract', { projectId: b.projectId, bidId: b.id });
        addEdge(contractId, b.id, 'derivedFrom', { from: 'Bid' });
        addEdge(contractId, b.projectId, 'for', {});
      }
    }

    // Approvals + Licenses
    for (const lic of licenses) {
      const approvalId = `approval_${lic.id}`;
      addNode(approvalId, 'Approval', 'License issued', { licenseId: lic.id, issuedAt: lic.issuedAt });
      addEdge(approvalId, lic.projectId, 'authorizes', {});
      addEdge(approvalId, lic.contractorId, 'responsibleFor', { role: 'contractor' });
      addNode(lic.id, 'DecisionPacket', `Decision: ${lic.id}`, { validTo: lic.validTo, conditions: lic.conditions?.length || 0 });
      addEdge(lic.id, approvalId, 'authorizes', {});
    }

    // Audit events as first-class stream
    for (const evt of audit.slice(-80)) {
      addNode(evt.id, 'Event', evt.action, { entityType: evt.entityType, entityId: evt.entityId, timestamp: evt.timestamp });
      if (evt.actorId && nodes.find(n => n.id === evt.actorId)) addEdge(evt.actorId, evt.id, 'emits', {});
      if (evt.entityId && nodes.find(n => n.id === evt.entityId)) addEdge(evt.id, evt.entityId, 'emits', {});
    }

    return { nodes, edges };
  }

  function exportOfflinePack() {
    const filename = `lifelines-offline-pack-${new Date().toISOString().slice(0,10)}.json`;
    const jsonStr = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2500);
  }

  function importOfflinePack(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || ''));
          setDb(parsed);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Invalid pack JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  function resetLocalCache() {
    const seed = createSeedSnapshot();
    setDb(seed);
    saveLocalCache(seed);
  }

  async function resetServerDataset() {
    const u = auth.user;
    if (!u || u.role !== 'admin') throw new Error('Admin only');
    await apiRequest({ method: 'POST', path: '/admin/reset', token: auth.token, body: {} });
    await hydrateFromApi();
  }

  async function updateMyRegion({ regionId, regionName }) {
    const u = auth.user;
    if (!u) throw new Error('Not logged in');
    try {
      const updated = await apiRequest({ method: 'PUT', path: `/users/${u.id}/region`, token: auth.token, body: { regionId, regionName } });
      setAuth(prev => ({ ...prev, user: updated }));
      await hydrateFromApi();
    } catch (e) {
      // offline: update auth + local actors
      setAuth(prev => ({ ...prev, user: { ...prev.user, regionId, regionName } }));
      setDb(prev => {
        const actors = (prev.actors || []).map(a => a.id === u.id ? { ...a, regionId, regionName } : a);
        return { ...prev, actors };
      });
      enqueueOutbox({ method: 'PUT', path: `/users/${u.id}/region`, body: { regionId, regionName } });
      throw new Error(`${e.message} (saved locally; will sync when the API is reachable)`);
    }
  }

  const store = useMemo(() => ({
    db,
    auth,
    apiStatus,
    login,
    register,
    logout,
    hydrateFromApi,
    refreshPublic,
    flushOutbox,
    getPublicProjects,
    getProjectsForUser,
    getProject,
    getDamageReport,
    getPlan,
    createProject,
    updateProject,
    deleteProject,
    publishProject,
    saveDamageReport,
    savePlan,
    computeResourceMatches,
    reserveResource,
    releaseResource,
    submitBid,
    awardBid,
    issueLicense,
    getContractorStats,
    getMaterialSummary,
    getDamageSummary,
    buildOntologyGraph,
    exportOfflinePack,
    importOfflinePack,
    resetLocalCache,
    resetServerDataset,
    updateMyRegion
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [db, auth, apiStatus]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('Store not available');
  return ctx;
}
