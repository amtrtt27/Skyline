const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

const PORT = process.env.PORT || 3001;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '.data', 'db.json');

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Bid scoring: cost 40%, timeline 20%, experience 20%, sustainability 20%
function scoreBid(bid, baselines) {
  const { minCost, maxCost, minTimeline, maxTimeline, minExp, maxExp } = baselines;

  const norm = (value, min, max, invert = false) => {
    if (max === min) return 1;
    const t = (value - min) / (max - min);
    const clamped = Math.max(0, Math.min(1, t));
    return invert ? 1 - clamped : clamped;
  };

  const costScore = norm(bid.cost, minCost, maxCost, true);
  const timelineScore = norm(bid.timelineMonths, minTimeline, maxTimeline, true);
  const expScore = norm(bid.experienceCount, minExp, maxExp, false);
  const susScore = Math.max(0, Math.min(1, (bid.recycledPercent || 0) / 100));

  const score = 0.40 * costScore + 0.20 * timelineScore + 0.20 * expScore + 0.20 * susScore;
  return { score, breakdown: { costScore, timelineScore, expScore, susScore } };
}

function seedDb() {
  const t0 = nowIso();
  const region = { id: 'doha', name: 'Doha' };

  const users = [
    {
      id: 'user_admin',
      name: 'Admin',
      email: 'admin@example.com',
      // Strong default password (MVP)
      password: '0vk2-kBf-UF2y-oThrvec#',
      role: 'admin',
      regionId: region.id,
      regionName: region.name
    },
    {
      id: 'user_official',
      name: 'Urban Planner',
      email: 'official@example.com',
      password: 'official123',
      role: 'official',
      regionId: region.id,
      regionName: region.name
    },
    {
      id: 'user_contractor',
      name: 'ReBuild Co.',
      email: 'contractor@example.com',
      password: 'contractor123',
      role: 'contractor',
      regionId: region.id,
      regionName: region.name
    },
    {
      id: 'user_community',
      name: 'Community Rep',
      email: 'community@example.com',
      password: 'community123',
      role: 'community',
      regionId: region.id,
      regionName: region.name
    }
  ];

  const projects = [
    {
      id: 'proj_alnoor',
      title: 'Al Noor Community Center',
      description: 'Multi-purpose center supporting temporary shelter and services. Structural damage observed after flooding.',
      location: { lat: 25.2859, lng: 51.5352, address: 'Al Noor District, Doha', regionId: region.id, regionName: region.name },
      status: 'Published',
      createdAt: t0,
      updatedAt: t0,
      visibility: 'public',
      communityFeedbackEnabled: true,
      ownerId: 'user_official',
      communityInputs: []
    },
    {
      id: 'proj_seaside_clinic',
      title: 'Seaside Clinic Wing',
      description: 'Small clinic wing requiring repairs and retrofit. Focus on resilient materials and safer access.',
      location: { lat: 25.2742, lng: 51.5480, address: 'Corniche Area, Doha', regionId: region.id, regionName: region.name },
      status: 'Draft',
      createdAt: t0,
      updatedAt: t0,
      visibility: 'private',
      communityFeedbackEnabled: false,
      ownerId: 'user_official',
      communityInputs: []
    },
    {
      id: 'proj_school_blockb',
      title: 'Al Bayan School – Block B',
      description: 'School classroom block with roof and masonry issues. Priority reconstruction before next term.',
      location: { lat: 25.2958, lng: 51.5204, address: 'Al Bayan, Doha', regionId: region.id, regionName: region.name },
      status: 'Published',
      createdAt: t0,
      updatedAt: t0,
      visibility: 'public',
      communityFeedbackEnabled: true,
      ownerId: 'user_official',
      communityInputs: []
    }
  ];

  const damageReports = [
    {
      id: 'dr_alnoor_v1',
      projectId: 'proj_alnoor',
      images: ['/samples/damage_medium.png'],
      severity: 'Medium',
      issues: ['Wall cracking', 'Water intrusion', 'Electrical safety risk'],
      debrisVolume: { estimateM3: 38, marginPct: 18, minM3: 31, maxM3: 45 },
      recoverables: [
        { type: 'Bricks', qty: 5200, unit: 'units', marginPct: 12, minQty: 4576, maxQty: 5824, qualityScore: 0.72 },
        { type: 'Steel', qty: 2.8, unit: 'tons', marginPct: 15, minQty: 2.38, maxQty: 3.22, qualityScore: 0.66 }
      ],
      confidenceScores: { severity: 0.79, issues: 0.74, debris: 0.69, recoverables: 0.71 },
      modelVersion: 'tfjs-stub-1.0',
      createdAt: t0
    }
  ];

  const plans = [
    {
      id: 'plan_alnoor_v1',
      projectId: 'proj_alnoor',
      version: 1,
      buildingSpec: { buildingType: 'Community Center', floors: 2, areaSqm: 980 },
      materials: [
        { type: 'Concrete', qty: 85, unit: 'm³', notes: 'Foundation and slab repairs' },
        { type: 'Steel', qty: 4.6, unit: 'tons', notes: 'Reinforcement' },
        { type: 'Bricks', qty: 8000, unit: 'units', notes: 'Masonry replacement' }
      ],
      costBreakdown: [
        { item: 'Materials', cost: 92000 },
        { item: 'Labor', cost: 64000 },
        { item: 'Transport', cost: 12500 },
        { item: 'Permits & inspections', cost: 6500 }
      ],
      timelineMonths: 6,
      sustainabilityOptions: { solarPanels: true, insulation: true, seismicReinforcement: true },
      sustainabilityMetrics: { co2SavedKg: 3200, recycledPercent: 28, energyKwhSaved: 18000 },
      createdAt: t0,
      updatedAt: t0
    }
  ];

  const resources = [
    {
      id: 'res_bricks_01',
      type: 'Bricks',
      condition: 'Good',
      qty: 8600,
      unit: 'units',
      location: { lat: 25.2866, lng: 51.5321 },
      sourceProjectId: 'proj_alnoor',
      reservedForProjectId: null,
      status: 'Identified'
    },
    {
      id: 'res_steel_01',
      type: 'Steel',
      condition: 'Fair',
      qty: 3.2,
      unit: 'tons',
      location: { lat: 25.2801, lng: 51.5446 },
      sourceProjectId: 'proj_alnoor',
      reservedForProjectId: null,
      status: 'Sampled'
    },
    {
      id: 'res_timber_01',
      type: 'Timber',
      condition: 'Good',
      qty: 24,
      unit: 'm³',
      location: { lat: 25.3002, lng: 51.5172 },
      sourceProjectId: 'proj_school_blockb',
      reservedForProjectId: null,
      status: 'Certified'
    },
    {
      id: 'res_insulation_01',
      type: 'Insulation',
      condition: 'New',
      qty: 140,
      unit: 'rolls',
      location: { lat: 25.2920, lng: 51.5275 },
      reservedForProjectId: null,
      status: 'Certified'
    },
    {
      id: 'res_solar_01',
      type: 'Solar Panels',
      condition: 'New',
      qty: 40,
      unit: 'panels',
      location: { lat: 25.2721, lng: 51.5520 },
      reservedForProjectId: null,
      status: 'Certified'
    }
  ];

  const bids = [
    {
      id: 'bid_01',
      projectId: 'proj_alnoor',
      contractorId: 'user_contractor',
      cost: 168500,
      timelineMonths: 6,
      experienceCount: 8,
      recycledPercent: 30,
      score: 0,
      createdAt: t0,
      status: 'Submitted'
    }
  ];

  // score seed bids
  {
    const projBids = bids.filter(b => b.projectId === 'proj_alnoor');
    const baselines = {
      minCost: Math.min(...projBids.map(x => x.cost)),
      maxCost: Math.max(...projBids.map(x => x.cost)),
      minTimeline: Math.min(...projBids.map(x => x.timelineMonths)),
      maxTimeline: Math.max(...projBids.map(x => x.timelineMonths)),
      minExp: Math.min(...projBids.map(x => x.experienceCount)),
      maxExp: Math.max(...projBids.map(x => x.experienceCount))
    };
    for (const b of projBids) {
      b.score = scoreBid(b, baselines).score;
    }
  }

  const licenses = [];

  const audit = [
    {
      id: 'evt_seed',
      entityType: 'System',
      entityId: 'seed',
      action: 'CREATE',
      actorId: 'system',
      timestamp: t0,
      details: { message: 'Seed dataset created' }
    }
  ];

  return {
    version: 1,
    createdAt: t0,
    users,
    projects,
    damageReports,
    plans,
    resources,
    bids,
    licenses,
    audit
  };
}

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

let db = null;
let saveTimer = null;

function loadDb() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    db = JSON.parse(raw);
  } catch {
    db = seedDb();
    ensureDir(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      ensureDir(DATA_FILE);
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save DB:', e.message);
    }
  }, 200);
}

loadDb();

// Sessions (in-memory)
const sessions = new Map(); // token -> { userId, issuedAt }
function createToken() {
  return 'tok_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const sess = sessions.get(token);
  if (!sess) return res.status(401).json({ error: 'Invalid token' });
  const user = db.users.find(u => u.id === sess.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = sanitizeUser(user);
  req.token = token;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function auditEvent({ entityType, entityId, action, actorId, details }) {
  db.audit.push({
    id: uid('evt'),
    entityType,
    entityId,
    action,
    actorId,
    timestamp: nowIso(),
    details: details || {}
  });
}

function snapshotForUser(user) {
  const actors = db.users.map(sanitizeUser);

  let projects = db.projects;
  if (user.role === 'official') {
    projects = db.projects.filter(p => p.location?.regionId === user.regionId || p.ownerId === user.id);
  } else if (user.role === 'contractor') {
    projects = db.projects.filter(p => ['Published','Awarded','Licensed','Completed'].includes(p.status));
  } else if (user.role === 'community') {
    projects = db.projects.filter(p => p.visibility === 'public');
  }

  const projectIds = new Set(projects.map(p => p.id));
  const damageReports = db.damageReports.filter(r => projectIds.has(r.projectId));
  const plans = db.plans.filter(p => projectIds.has(p.projectId));
  const bids = db.bids.filter(b => projectIds.has(b.projectId));
  const licenses = db.licenses.filter(l => projectIds.has(l.projectId));
  const resources = db.resources;
  const audit = db.audit.slice(-400);

  return {
    version: db.version,
    createdAt: db.createdAt,
    actors,
    projects,
    damageReports,
    plans,
    resources,
    bids,
    licenses,
    audit
  };
}

function publicSnapshot() {
  const projects = db.projects.filter(p => p.visibility === 'public');
  const projectIds = new Set(projects.map(p => p.id));
  return {
    version: db.version,
    createdAt: db.createdAt,
    projects,
    damageReports: db.damageReports.filter(r => projectIds.has(r.projectId)),
    plans: db.plans.filter(p => projectIds.has(p.projectId))
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: nowIso() });
});

app.get('/api/public/snapshot', (req, res) => {
  res.json(publicSnapshot());
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = createToken();
  sessions.set(token, { userId: user.id, issuedAt: nowIso() });
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, regionId, regionName } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const exists = db.users.some(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(400).json({ error: 'Email already registered' });
  const allowedRoles = ['community','official','contractor'];
  if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const user = {
    id: uid('user'),
    name: String(name),
    email: String(email),
    password: String(password),
    role,
    regionId: regionId || 'doha',
    regionName: regionName || 'Doha'
  };
  db.users.push(user);
  auditEvent({ entityType: 'User', entityId: user.id, action: 'CREATE', actorId: user.id, details: { role } });
  scheduleSave();

  const token = createToken();
  sessions.set(token, { userId: user.id, issuedAt: nowIso() });
  res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/snapshot', requireAuth, (req, res) => {
  res.json(snapshotForUser(req.user));
});

app.put('/api/users/:id/region', requireAuth, (req, res) => {
  const id = req.params.id;
  if (req.user.id !== id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { regionId, regionName } = req.body || {};
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.regionId = regionId || user.regionId;
  user.regionName = regionName || user.regionName;
  auditEvent({ entityType: 'User', entityId: id, action: 'UPDATE', actorId: req.user.id, details: { regionId, regionName } });
  scheduleSave();
  res.json(sanitizeUser(user));
});

// Projects
app.post('/api/projects', requireAuth, requireRole(['official','admin']), (req, res) => {
  const body = req.body || {};
  if (!body.title) return res.status(400).json({ error: 'Title is required' });

  const id = body.clientId || uid('proj');
  const now = nowIso();
  const project = {
    id,
    title: body.title,
    description: body.description || '',
    location: body.location || { lat: 0, lng: 0, address: '', regionId: req.user.regionId, regionName: req.user.regionName },
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
    visibility: body.visibility || 'private',
    communityFeedbackEnabled: !!body.communityFeedbackEnabled,
    ownerId: req.user.id,
    communityInputs: []
  };
  db.projects.unshift(project);
  auditEvent({ entityType: 'Project', entityId: id, action: 'CREATE', actorId: req.user.id });
  scheduleSave();
  res.json(project);
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Community users can only add communityInputs to public, feedback-enabled projects
  if (req.user.role === 'community') {
    if (project.visibility !== 'public' || !project.communityFeedbackEnabled) return res.status(403).json({ error: 'Feedback not enabled' });
    if (!patch.communityInputs || !Array.isArray(patch.communityInputs)) return res.status(400).json({ error: 'communityInputs required' });

    const existingIds = new Set((project.communityInputs || []).map(c => c.id));
    const additions = patch.communityInputs
      .filter(c => c && c.id && !existingIds.has(c.id))
      .map(c => ({
        id: String(c.id),
        projectId: id,
        authorId: req.user.id,
        comment: String(c.comment || ''),
        approvalSignal: String(c.approvalSignal || 'neutral'),
        createdAt: c.createdAt || nowIso()
      }));
    project.communityInputs = [...additions, ...(project.communityInputs || [])];
    project.updatedAt = nowIso();
    auditEvent({ entityType: 'Project', entityId: id, action: 'COMMUNITY_INPUT', actorId: req.user.id, details: { additions: additions.length } });
    scheduleSave();
    return res.json(project);
  }

  // Officials: owner or admin
  if (req.user.role === 'official') {
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }
  // Contractors can't edit projects
  if (req.user.role === 'contractor') return res.status(403).json({ error: 'Forbidden' });

  const allowed = ['title','description','location','status','visibility','communityFeedbackEnabled','communityInputs'];
  for (const k of Object.keys(patch)) {
    if (allowed.includes(k)) {
      project[k] = patch[k];
    }
  }
  project.updatedAt = nowIso();

  auditEvent({ entityType: 'Project', entityId: id, action: 'UPDATE', actorId: req.user.id, details: { patch: Object.keys(patch) } });
  scheduleSave();
  res.json(project);
});

app.delete('/api/projects/:id', requireAuth, requireRole(['admin']), (req, res) => {
  const id = req.params.id;
  const idx = db.projects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });

  db.projects.splice(idx, 1);
  db.damageReports = db.damageReports.filter(r => r.projectId !== id);
  db.plans = db.plans.filter(p => p.projectId !== id);
  db.bids = db.bids.filter(b => b.projectId !== id);
  db.licenses = db.licenses.filter(l => l.projectId !== id);

  auditEvent({ entityType: 'Project', entityId: id, action: 'DELETE', actorId: req.user.id });
  scheduleSave();
  res.json({ ok: true });
});

// Damage report
app.post('/api/projects/:id/damage-report', requireAuth, requireRole(['official','admin']), (req, res) => {
  const projectId = req.params.id;
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const report = req.body || {};
  const stored = {
    ...report,
    id: report.id || uid('dr'),
    projectId,
    createdAt: report.createdAt || nowIso()
  };
  db.damageReports.unshift(stored);
  auditEvent({ entityType: 'DamageReport', entityId: stored.id, action: 'CREATE', actorId: req.user.id, details: { projectId } });
  scheduleSave();
  res.json(stored);
});

// Plan
app.post('/api/projects/:id/plan', requireAuth, requireRole(['official','admin']), (req, res) => {
  const projectId = req.params.id;
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const incoming = req.body || {};
  const existing = db.plans.filter(p => p.projectId === projectId);
  const nextVersion = existing.length ? Math.max(...existing.map(p => p.version || 1)) + 1 : 1;

  const planObj = {
    ...incoming,
    id: incoming.id || uid('plan'),
    projectId,
    version: incoming.version || nextVersion,
    createdAt: incoming.createdAt || nowIso(),
    updatedAt: incoming.updatedAt || nowIso()
  };

  db.plans.unshift(planObj);
  auditEvent({ entityType: 'Plan', entityId: planObj.id, action: 'CREATE', actorId: req.user.id, details: { projectId, version: planObj.version } });
  scheduleSave();
  res.json(planObj);
});

// Resources
app.post('/api/resources/:id/reserve', requireAuth, requireRole(['official','admin']), (req, res) => {
  const resourceId = req.params.id;
  const { projectId } = req.body || {};
  const r = db.resources.find(x => x.id === resourceId);
  const p = db.projects.find(x => x.id === projectId);
  if (!r) return res.status(404).json({ error: 'Resource not found' });
  if (!p) return res.status(404).json({ error: 'Project not found' });
  if (r.reservedForProjectId) return res.status(400).json({ error: 'Resource already reserved' });

  r.reservedForProjectId = projectId;
  r.status = 'Allocated';
  auditEvent({ entityType: 'Resource', entityId: resourceId, action: 'STATE_CHANGE', actorId: req.user.id, details: { reservedForProjectId: projectId } });
  scheduleSave();
  res.json(r);
});

app.post('/api/resources/:id/release', requireAuth, requireRole(['official','admin']), (req, res) => {
  const resourceId = req.params.id;
  const r = db.resources.find(x => x.id === resourceId);
  if (!r) return res.status(404).json({ error: 'Resource not found' });
  r.reservedForProjectId = null;
  r.status = 'Certified';
  auditEvent({ entityType: 'Resource', entityId: resourceId, action: 'STATE_CHANGE', actorId: req.user.id, details: { released: true } });
  scheduleSave();
  res.json(r);
});

// Bids
app.post('/api/projects/:id/bids', requireAuth, requireRole(['contractor']), (req, res) => {
  const projectId = req.params.id;
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.status !== 'Published') return res.status(400).json({ error: 'Project not open for bidding' });

  const body = req.body || {};
  const bid = {
    id: uid('bid'),
    projectId,
    contractorId: req.user.id,
    cost: Number(body.cost || 0),
    timelineMonths: Number(body.timelineMonths || 0),
    experienceCount: Number(body.experienceCount || 0),
    recycledPercent: Number(body.recycledPercent || 0),
    score: 0,
    createdAt: nowIso(),
    status: 'Submitted'
  };
  if (!(bid.cost > 0) || !(bid.timelineMonths > 0)) return res.status(400).json({ error: 'Invalid bid values' });
  db.bids.unshift(bid);

  // Re-score all bids for this project using min/max baselines
  const projBids = db.bids.filter(b => b.projectId === projectId);
  const baselines = {
    minCost: Math.min(...projBids.map(x => x.cost)),
    maxCost: Math.max(...projBids.map(x => x.cost)),
    minTimeline: Math.min(...projBids.map(x => x.timelineMonths)),
    maxTimeline: Math.max(...projBids.map(x => x.timelineMonths)),
    minExp: Math.min(...projBids.map(x => x.experienceCount)),
    maxExp: Math.max(...projBids.map(x => x.experienceCount))
  };
  for (const b of projBids) {
    b.score = scoreBid(b, baselines).score;
  }

  auditEvent({ entityType: 'Bid', entityId: bid.id, action: 'CREATE', actorId: req.user.id, details: { projectId } });
  scheduleSave();
  res.json(bid);
});

// Award
app.post('/api/projects/:id/award', requireAuth, requireRole(['official','admin']), (req, res) => {
  const projectId = req.params.id;
  const { bidId } = req.body || {};
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role === 'official' && project.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (project.status !== 'Published') return res.status(400).json({ error: 'Project not in Published state' });

  const bid = db.bids.find(b => b.id === bidId && b.projectId === projectId);
  if (!bid) return res.status(404).json({ error: 'Bid not found' });

  for (const b of db.bids.filter(x => x.projectId === projectId)) {
    b.status = (b.id === bidId) ? 'Awarded' : 'Rejected';
  }
  project.status = 'Awarded';
  project.updatedAt = nowIso();

  auditEvent({ entityType: 'Project', entityId: projectId, action: 'STATE_CHANGE', actorId: req.user.id, details: { awardedBidId: bidId } });
  scheduleSave();
  res.json({ ok: true });
});

function makeLicenseId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'LIC-';
  for (let i = 0; i < 8; i++) s += chars[(Math.random() * chars.length) | 0];
  return s;
}

// License issuance
app.post('/api/projects/:id/license', requireAuth, requireRole(['official','admin']), (req, res) => {
  const projectId = req.params.id;
  const project = db.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role === 'official' && project.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const awardedBid = db.bids.find(b => b.projectId === projectId && b.status === 'Awarded');
  if (!awardedBid) return res.status(400).json({ error: 'Award a bid first' });

  const body = req.body || {};
  const lic = {
    id: makeLicenseId(),
    projectId,
    contractorId: body.contractorId || awardedBid.contractorId,
    validFrom: body.validFrom || nowIso().slice(0,10),
    validTo: body.validTo || nowIso().slice(0,10),
    conditions: Array.isArray(body.conditions) ? body.conditions : [],
    signature: 'DIGITAL-SIGNATURE-PLACEHOLDER',
    issuedBy: req.user.id,
    issuedAt: nowIso()
  };
  db.licenses.unshift(lic);
  project.status = 'Licensed';
  project.updatedAt = nowIso();

  auditEvent({ entityType: 'License', entityId: lic.id, action: 'APPROVE', actorId: req.user.id, details: { projectId } });
  scheduleSave();
  res.json(lic);
});

// Admin reset
app.post('/api/admin/reset', requireAuth, requireRole(['admin']), (req, res) => {
  db = seedDb();
  scheduleSave();
  // Clear sessions except current token for convenience
  const keep = req.token;
  const keepSess = sessions.get(keep);
  sessions.clear();
  if (keepSess) sessions.set(keep, keepSess);
  res.json({ ok: true });
});

// ---- Serve built frontend (optional) ----
// If you run `npm --prefix client run build`, the server can serve the SPA from client/dist.
// This avoids CORS/proxy issues in production and keeps /api on the same origin.
const CLIENT_DIST = process.env.CLIENT_DIST || path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`LifeLines API running on http://localhost:${PORT}/api`);
});
