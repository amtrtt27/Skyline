import express from 'express';
import cors from 'cors';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));

// ---------------------------
// In-memory DB (MVP)
// ---------------------------
let users = [];
let projects = [];
let resources = [];
let licenses = [];
let auditLogs = [];

let nextUserId = 1;
let nextProjectId = 1;
let nextGenericId = 1000;

// ---------------------------
// Helpers
// ---------------------------
const nowIso = () => new Date().toISOString();

function makeId(prefix) {
  nextGenericId += 1;
  return `${prefix}_${nextGenericId}`;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Score weights: cost 40%, timeline 20%, experience 20%, sustainability 20%
 * Cost and timeline are relative to plan targets (lower is better).
 */
function scoreBid({ cost, timelineMonths, experienceCount, recycledPercent }, plan) {
  const planCost = plan?.costBreakdown?.total ?? plan?.costEstimate ?? 1;
  const planTime = plan?.timelineMonths ?? 1;

  const costScore = 40 * clamp(planCost / Math.max(1, cost), 0, 1);
  const timeScore = 20 * clamp(planTime / Math.max(1, timelineMonths), 0, 1);

  // Simple scaling: 10 similar projects => max points
  const expScore = clamp(experienceCount * 2, 0, 20);
  const sustScore = 20 * clamp(recycledPercent / 100, 0, 1);

  return Math.round(costScore + timeScore + expScore + sustScore);
}

function appendAudit({ entityType, entityId, action, actorId, details }) {
  const entry = {
    id: makeId('audit'),
    entityType,
    entityId,
    action,
    actorId,
    timestamp: nowIso(),
    details: details ?? {},
  };
  auditLogs.push(entry);
  return entry;
}

// ---------------------------
// Auth (mock JWT sessions)
// ---------------------------
const sessions = new Map(); // token -> {id,name,email,role}

function requireAuth(req, _res, next) {
  const auth = req.header('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const user = sessions.get(token);
    if (user) req.user = user;
  }
  next();
}

function requireLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

function canReadProject(user, project) {
  if (!project) return false;
  if (!user) {
    return project.visibility === 'public' && project.status !== 'Draft';
  }
  if (user.role === 'admin') return true;
  if (user.role === 'official') return project.createdBy === user.id;
  if (user.role === 'contractor') {
    if (project.status === 'Published') return true;
    if (project.assignedContractorId === user.id) return true;
    if (project.bids?.some((b) => b.contractorId === user.id)) return true;
    return false;
  }
  // community
  return project.visibility === 'public' && project.status !== 'Draft';
}

function canWriteProject(user, project) {
  if (!user || !project) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'official' && project.createdBy === user.id) return true;
  return false;
}

// ---------------------------
// Seed demo data
// ---------------------------
function seed() {
  users = [];
  projects = [];
  resources = [];
  licenses = [];
  auditLogs = [];
  sessions.clear();

  nextUserId = 1;
  nextProjectId = 1;
  nextGenericId = 1000;

  const addUser = (name, email, password, role) => {
    const u = { id: nextUserId++, name, email, password, role };
    users.push(u);
    return u;
  };

  const admin = addUser('Admin User', 'admin@example.com', 'admin123', 'admin');
  const official = addUser('Gov Official', 'official@example.com', 'official123', 'official');
  const contractor = addUser('BuildCo Contractor', 'contractor@example.com', 'contractor123', 'contractor');
  const community = addUser('Community Rep', 'community@example.com', 'community123', 'community');

  const addProject = (p) => {
    const now = nowIso();
    const proj = {
      id: String(nextProjectId++),
      title: p.title,
      description: p.description ?? '',
      location: {
        lat: p.location?.lat ?? 25.2854,
        lng: p.location?.lng ?? 51.531,
        address: p.location?.address ?? 'Doha, Qatar',
      },
      status: p.status ?? 'Draft',
      createdAt: now,
      updatedAt: now,
      visibility: p.visibility ?? 'public', // public | private
      communityFeedbackEnabled: p.communityFeedbackEnabled ?? true,
      createdBy: p.createdBy,
      communityInputs: [],
      damageReport: p.damageReport ?? null,
      reconstructionPlan: p.reconstructionPlan ?? null,
      bids: p.bids ?? [],
      selectedBidId: p.selectedBidId ?? null,
      assignedContractorId: p.assignedContractorId ?? null,
      license: p.license ?? null,
    };
    projects.push(proj);
    appendAudit({
      entityType: 'Project',
      entityId: proj.id,
      action: 'seed_project',
      actorId: admin.id,
      details: { title: proj.title, status: proj.status },
    });
    return proj;
  };

  const p1 = addProject({
    title: 'Central City Library Rebuild',
    description: 'Reconstruction of a public library after earthquake damage.',
    location: { lat: 25.2854, lng: 51.531, address: 'Central City, QA' },
    status: 'Published',
    createdBy: official.id,
    communityFeedbackEnabled: true,
    damageReport: {
      id: makeId('dr'),
      images: ['/sample-images/damage1.svg'],
      severity: 'High',
      issues: ['Wall cracks', 'Foundation damage'],
      debrisVolume: 30,
      recoverables: [
        { type: 'Bricks', condition: 'Good', qty: 8000, unit: 'units' },
        { type: 'Steel', condition: 'Fair', qty: 5, unit: 'tons' },
      ],
      confidenceScores: { severity: 0.92, debris: 0.88, recoverables: 0.85 },
    },
    reconstructionPlan: {
      id: makeId('plan'),
      buildingSpec: { buildingType: 'Civic', floors: 2, areaSqm: 1200 },
      materials: [
        { type: 'Concrete', qty: 100, unit: 'm3' },
        { type: 'Steel', qty: 10, unit: 'tons' },
        { type: 'Bricks', qty: 15000, unit: 'units' },
      ],
      costBreakdown: { labor: 70000, materials: 110000, logistics: 20000, total: 200000 },
      timelineMonths: 12,
      sustainabilityOptions: { solarPanels: true, insulation: false, seismicReinforcement: false },
      sustainabilityMetrics: { co2ReducedTons: 2.4, recycledMaterialPct: 20 },
    },
    bids: [],
  });

  const p2 = addProject({
    title: 'West River Bridge Reconstruction',
    description: 'Rebuilding a bridge with enhanced seismic standards.',
    location: { lat: 25.3, lng: 51.5333, address: 'West River, QA' },
    status: 'Licensed',
    createdBy: official.id,
    communityFeedbackEnabled: false,
    damageReport: {
      id: makeId('dr'),
      images: ['/sample-images/damage2.svg'],
      severity: 'Critical',
      issues: ['Structural instability', 'Foundation damage', 'Beam deformation'],
      debrisVolume: 80,
      recoverables: [
        { type: 'Steel', condition: 'Fair', qty: 20, unit: 'tons' },
        { type: 'Concrete', condition: 'Mixed', qty: 50, unit: 'tons' },
      ],
      confidenceScores: { severity: 0.95, debris: 0.9, recoverables: 0.82 },
    },
    reconstructionPlan: {
      id: makeId('plan'),
      buildingSpec: { buildingType: 'Bridge', floors: 0, areaSqm: 0 },
      materials: [
        { type: 'Concrete', qty: 220, unit: 'm3' },
        { type: 'Steel', qty: 24, unit: 'tons' },
        { type: 'Asphalt', qty: 120, unit: 'tons' },
      ],
      costBreakdown: { labor: 160000, materials: 280000, logistics: 60000, total: 500000 },
      timelineMonths: 18,
      sustainabilityOptions: { solarPanels: false, insulation: false, seismicReinforcement: true },
      sustainabilityMetrics: { co2ReducedTons: 4.2, recycledMaterialPct: 25 },
    },
    bids: [
      {
        id: makeId('bid'),
        projectId: '2',
        contractorId: contractor.id,
        cost: 480000,
        timelineMonths: 17,
        experienceCount: 5,
        recycledPercent: 30,
        score: 88,
        createdAt: nowIso(),
        status: 'Won',
      },
    ],
    selectedBidId: null,
    assignedContractorId: contractor.id,
    license: {
      id: 'LIC-2026-0002',
      projectId: '2',
      contractorId: contractor.id,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10),
      conditions: ['Weekly progress reports', 'Monthly safety inspections'],
      signature: 'SIGNATURE_PLACEHOLDER',
      issuedBy: official.id,
      issuedAt: nowIso(),
    },
  });

  const p3 = addProject({
    title: 'Lakeside Community Center Repair',
    description: 'Repairing the community center roof and interior after storm damage.',
    location: { lat: 25.289, lng: 51.53, address: 'Lakeside, QA' },
    status: 'Draft',
    createdBy: official.id,
    communityFeedbackEnabled: true,
  });

  // Make license log consistent
  if (p2.license) {
    licenses.push(p2.license);
  }

  // Seed a few resource items (salvaged materials)
  const addResource = (r) => {
    const item = {
      id: makeId('res'),
      type: r.type,
      condition: r.condition ?? 'Good',
      qty: r.qty,
      unit: r.unit,
      location: { lat: r.lat, lng: r.lng },
      sourceProjectId: r.sourceProjectId ?? null,
      reservedForProjectId: r.reservedForProjectId ?? null,
      // reference numbers used for savings calculations
      unitCostNew: r.unitCostNew,
      unitCostRecycled: r.unitCostRecycled,
      unitCo2New: r.unitCo2New,
      unitCo2Recycled: r.unitCo2Recycled,
    };
    resources.push(item);
    return item;
  };

  addResource({
    type: 'Bricks',
    qty: 8500,
    unit: 'units',
    lat: 25.287,
    lng: 51.531,
    unitCostNew: 0.8,
    unitCostRecycled: 0.4,
    unitCo2New: 0.0005,
    unitCo2Recycled: 0.00025,
  });
  addResource({
    type: 'Steel',
    qty: 12,
    unit: 'tons',
    lat: 25.31,
    lng: 51.533,
    unitCostNew: 320,
    unitCostRecycled: 200,
    unitCo2New: 2.7,
    unitCo2Recycled: 1.5,
  });
  addResource({
    type: 'Concrete',
    qty: 30,
    unit: 'tons',
    lat: 25.295,
    lng: 51.528,
    unitCostNew: 110,
    unitCostRecycled: 60,
    unitCo2New: 0.45,
    unitCo2Recycled: 0.2,
  });

  appendAudit({
    entityType: 'System',
    entityId: 'seed',
    action: 'seed_complete',
    actorId: admin.id,
    details: { users: users.length, projects: projects.length, resources: resources.length },
  });

  // Community seed comment
  p1.communityInputs.push({
    id: makeId('cinput'),
    authorId: community.id,
    comment: 'Please prioritize accessibility ramps and a temporary reading space.',
    approvalSignal: true,
    createdAt: nowIso(),
  });

  appendAudit({
    entityType: 'Project',
    entityId: p1.id,
    action: 'community_input_added',
    actorId: community.id,
    details: { approvalSignal: true },
  });

  // Keep references used by clients
  return { admin, official, contractor, community, p1, p2, p3 };
}

seed();

// ---------------------------
// Middleware
// ---------------------------
app.use(requireAuth);

// ---------------------------
// Routes
// ---------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true, time: nowIso() }));

// Auth
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body || {};
  const cleanRole = ['community', 'official', 'contractor', 'admin'].includes(role) ? role : 'community';

  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    password,
    role: cleanRole,
  };
  users.push(newUser);

  appendAudit({
    entityType: 'User',
    entityId: String(newUser.id),
    action: 'user_registered',
    actorId: newUser.id,
    details: { email: newUser.email, role: newUser.role },
  });

  res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = `tok_${user.id}_${Math.random().toString(36).slice(2, 10)}`;
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  sessions.set(token, safeUser);

  appendAudit({
    entityType: 'User',
    entityId: String(user.id),
    action: 'login',
    actorId: user.id,
    details: {},
  });

  res.json({ token, user: safeUser });
});

app.post('/api/auth/logout', requireLogin, (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null;
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// Projects
app.get('/api/projects', (req, res) => {
  const user = req.user || null;
  const list = projects.filter((p) => canReadProject(user, p));
  res.json(list);
});

app.get('/api/projects/:id', (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canReadProject(req.user || null, proj)) return res.status(403).json({ message: 'Forbidden' });
  res.json(proj);
});

app.post('/api/projects', requireRole(['official', 'admin']), (req, res) => {
  const { title, description, location, visibility, communityFeedbackEnabled } = req.body || {};
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const now = nowIso();
  const proj = {
    id: String(nextProjectId++),
    title,
    description: description ?? '',
    location: {
      lat: Number(location?.lat ?? 25.2854),
      lng: Number(location?.lng ?? 51.531),
      address: String(location?.address ?? ''),
    },
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
    visibility: visibility === 'private' ? 'private' : 'public',
    communityFeedbackEnabled: Boolean(communityFeedbackEnabled ?? true),
    createdBy: req.user.id,
    communityInputs: [],
    damageReport: null,
    reconstructionPlan: null,
    bids: [],
    selectedBidId: null,
    assignedContractorId: null,
    license: null,
  };

  projects.push(proj);
  appendAudit({
    entityType: 'Project',
    entityId: proj.id,
    action: 'project_created',
    actorId: req.user.id,
    details: { title: proj.title },
  });

  res.json(proj);
});

app.put('/api/projects/:id', requireLogin, (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  const patch = req.body || {};
  const allowedStatuses = ['Draft', 'Published', 'Awarded', 'Licensed', 'Completed'];

  if (typeof patch.title === 'string') proj.title = patch.title;
  if (typeof patch.description === 'string') proj.description = patch.description;
  if (patch.location) {
    if (typeof patch.location.lat === 'number') proj.location.lat = patch.location.lat;
    if (typeof patch.location.lng === 'number') proj.location.lng = patch.location.lng;
    if (typeof patch.location.address === 'string') proj.location.address = patch.location.address;
  }
  if (patch.visibility) proj.visibility = patch.visibility === 'private' ? 'private' : 'public';
  if (typeof patch.communityFeedbackEnabled === 'boolean') {
    proj.communityFeedbackEnabled = patch.communityFeedbackEnabled;
  }
  if (patch.status && allowedStatuses.includes(patch.status)) {
    proj.status = patch.status;
  }

  proj.updatedAt = nowIso();

  appendAudit({
    entityType: 'Project',
    entityId: proj.id,
    action: 'project_updated',
    actorId: req.user.id,
    details: { patch: Object.keys(patch) },
  });

  res.json(proj);
});

// Damage report
app.post('/api/projects/:id/damage-report', requireLogin, (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  const dr = req.body || {};
  const newReport = {
    id: proj.damageReport?.id ?? makeId('dr'),
    images: Array.isArray(dr.images) ? dr.images : [],
    severity: dr.severity || 'Medium',
    issues: Array.isArray(dr.issues) ? dr.issues : [],
    debrisVolume: Number(dr.debrisVolume ?? 0),
    recoverables: Array.isArray(dr.recoverables) ? dr.recoverables : [],
    confidenceScores: dr.confidenceScores ?? {},
  };

  proj.damageReport = newReport;
  proj.updatedAt = nowIso();

  // Auto-add recoverables to inventory as resource items (unreserved)
  for (const rec of newReport.recoverables) {
    resources.push({
      id: makeId('res'),
      type: rec.type,
      condition: rec.condition ?? 'Good',
      qty: Number(rec.qty ?? 0),
      unit: rec.unit,
      location: { ...proj.location },
      sourceProjectId: proj.id,
      reservedForProjectId: null,
      unitCostNew: rec.type === 'Bricks' ? 0.8 : rec.type === 'Steel' ? 320 : 110,
      unitCostRecycled: rec.type === 'Bricks' ? 0.4 : rec.type === 'Steel' ? 200 : 60,
      unitCo2New: rec.type === 'Bricks' ? 0.0005 : rec.type === 'Steel' ? 2.7 : 0.45,
      unitCo2Recycled: rec.type === 'Bricks' ? 0.00025 : rec.type === 'Steel' ? 1.5 : 0.2,
    });
  }

  appendAudit({
    entityType: 'DamageReport',
    entityId: newReport.id,
    action: 'damage_report_saved',
    actorId: req.user.id,
    details: { projectId: proj.id, severity: newReport.severity },
  });

  res.json(newReport);
});

// Reconstruction plan (create/update)
app.put('/api/projects/:id/plan', requireLogin, (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  const plan = req.body || {};
  const newPlan = {
    id: proj.reconstructionPlan?.id ?? makeId('plan'),
    buildingSpec: plan.buildingSpec ?? { buildingType: 'Residential', floors: 1, areaSqm: 120 },
    materials: Array.isArray(plan.materials) ? plan.materials : [],
    costBreakdown: plan.costBreakdown ?? { labor: 0, materials: 0, logistics: 0, total: 0 },
    timelineMonths: Number(plan.timelineMonths ?? 6),
    sustainabilityOptions: plan.sustainabilityOptions ?? {
      solarPanels: false,
      insulation: false,
      seismicReinforcement: false,
    },
    sustainabilityMetrics: plan.sustainabilityMetrics ?? { co2ReducedTons: 0, recycledMaterialPct: 0 },
  };

  // Optionally compute derived metrics (basic demo)
  const opt = newPlan.sustainabilityOptions;
  const baseTotal = Number(newPlan.costBreakdown.total ?? 0);
  const extra =
    (opt.solarPanels ? 8000 : 0) + (opt.insulation ? 5000 : 0) + (opt.seismicReinforcement ? 5000 : 0);
  newPlan.costBreakdown.total = Math.round((baseTotal + extra) / 100) * 100;

  const recycledPct = clamp(
    (opt.solarPanels ? 5 : 0) + (opt.insulation ? 5 : 0) + (opt.seismicReinforcement ? 5 : 0) + 15,
    0,
    60
  );
  newPlan.sustainabilityMetrics.recycledMaterialPct = recycledPct;
  newPlan.sustainabilityMetrics.co2ReducedTons = Number(((recycledPct / 100) * 4).toFixed(1));

  proj.reconstructionPlan = newPlan;
  proj.updatedAt = nowIso();

  appendAudit({
    entityType: 'ReconstructionPlan',
    entityId: newPlan.id,
    action: 'plan_saved',
    actorId: req.user.id,
    details: { projectId: proj.id, total: newPlan.costBreakdown.total, timelineMonths: newPlan.timelineMonths },
  });

  res.json(newPlan);
});

// Resources: list + matching
app.get('/api/resources', (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.json(resources);

  const proj = projects.find((p) => p.id === String(projectId));
  if (!proj) return res.status(404).json({ message: 'Project not found' });
  if (!canReadProject(req.user || null, proj)) return res.status(403).json({ message: 'Forbidden' });

  const neededTypes = new Set((proj.reconstructionPlan?.materials || []).map((m) => m.type));
  const matches = resources
    .filter((r) => neededTypes.has(r.type))
    .filter((r) => !r.reservedForProjectId || r.reservedForProjectId === proj.id)
    .map((r) => {
      const dist = haversineKm(proj.location, r.location);
      const planMat = proj.reconstructionPlan?.materials?.find((m) => m.type === r.type);
      const neededQty = Number(planMat?.qty ?? 0);
      const usableQty = Math.min(neededQty, r.qty);

      const costSavings = usableQty * (r.unitCostNew - r.unitCostRecycled);
      const co2Reduction = usableQty * (r.unitCo2New - r.unitCo2Recycled);

      return {
        ...r,
        distanceKm: Number(dist.toFixed(2)),
        usableQty,
        costSavings: Number(costSavings.toFixed(2)),
        co2Reduction: Number(co2Reduction.toFixed(2)),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(matches);
});

app.post('/api/resources/:id/reserve', requireRole(['official', 'admin']), (req, res) => {
  const { projectId } = req.body || {};
  const r = resources.find((x) => x.id === req.params.id);
  const proj = projects.find((p) => p.id === String(projectId));
  if (!r || !proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  r.reservedForProjectId = proj.id;

  appendAudit({
    entityType: 'ResourceItem',
    entityId: r.id,
    action: 'resource_reserved',
    actorId: req.user.id,
    details: { projectId: proj.id, type: r.type, qty: r.qty },
  });

  res.json(r);
});

app.post('/api/resources/:id/release', requireRole(['official', 'admin']), (req, res) => {
  const { projectId } = req.body || {};
  const r = resources.find((x) => x.id === req.params.id);
  const proj = projects.find((p) => p.id === String(projectId));
  if (!r || !proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  if (r.reservedForProjectId === proj.id) r.reservedForProjectId = null;

  appendAudit({
    entityType: 'ResourceItem',
    entityId: r.id,
    action: 'resource_released',
    actorId: req.user.id,
    details: { projectId: proj.id },
  });

  res.json(r);
});

// Community input
app.post('/api/projects/:id/community-input', requireRole(['community']), (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canReadProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });
  if (!proj.communityFeedbackEnabled) return res.status(400).json({ message: 'Community feedback disabled' });

  const { comment, approvalSignal } = req.body || {};
  if (!comment) return res.status(400).json({ message: 'Comment is required' });

  const entry = {
    id: makeId('cinput'),
    authorId: req.user.id,
    comment: String(comment),
    approvalSignal: Boolean(approvalSignal),
    createdAt: nowIso(),
  };
  proj.communityInputs.push(entry);
  proj.updatedAt = nowIso();

  appendAudit({
    entityType: 'Project',
    entityId: proj.id,
    action: 'community_input_added',
    actorId: req.user.id,
    details: { approvalSignal: entry.approvalSignal },
  });

  res.json(entry);
});

// Bids
app.post('/api/projects/:id/bids', requireRole(['contractor', 'admin']), (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canReadProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });
  if (proj.status !== 'Published') return res.status(400).json({ message: 'Project is not open for bidding' });

  const { cost, timelineMonths, experienceCount, recycledPercent } = req.body || {};
  const c = Number(cost);
  const t = Number(timelineMonths);
  const e = Number(experienceCount);
  const r = Number(recycledPercent);

  if (!Number.isFinite(c) || c <= 0) return res.status(400).json({ message: 'Invalid cost' });
  if (!Number.isFinite(t) || t <= 0) return res.status(400).json({ message: 'Invalid timeline' });
  if (!Number.isFinite(e) || e < 0) return res.status(400).json({ message: 'Invalid experience' });
  if (!Number.isFinite(r) || r < 0 || r > 100) return res.status(400).json({ message: 'Invalid recycled percent' });

  const bid = {
    id: makeId('bid'),
    projectId: proj.id,
    contractorId: req.user.id,
    cost: c,
    timelineMonths: t,
    experienceCount: e,
    recycledPercent: r,
    score: scoreBid({ cost: c, timelineMonths: t, experienceCount: e, recycledPercent: r }, proj.reconstructionPlan),
    createdAt: nowIso(),
    status: 'Submitted',
  };

  proj.bids.push(bid);
  proj.updatedAt = nowIso();

  appendAudit({
    entityType: 'Bid',
    entityId: bid.id,
    action: 'bid_submitted',
    actorId: req.user.id,
    details: { projectId: proj.id, score: bid.score },
  });

  res.json(bid);
});

app.post('/api/projects/:id/bids/:bidId/award', requireRole(['official', 'admin']), (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  const bid = proj.bids.find((b) => b.id === req.params.bidId);
  if (!bid) return res.status(404).json({ message: 'Bid not found' });

  proj.selectedBidId = bid.id;
  proj.assignedContractorId = bid.contractorId;
  proj.status = 'Awarded';
  proj.updatedAt = nowIso();

  for (const b of proj.bids) {
    b.status = b.id === bid.id ? 'Won' : 'NotSelected';
  }

  appendAudit({
    entityType: 'Project',
    entityId: proj.id,
    action: 'bid_awarded',
    actorId: req.user.id,
    details: { bidId: bid.id, contractorId: bid.contractorId },
  });

  res.json(proj);
});

// Licensing
app.post('/api/projects/:id/license', requireRole(['official', 'admin']), (req, res) => {
  const proj = projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  if (!canWriteProject(req.user, proj)) return res.status(403).json({ message: 'Forbidden' });

  if (!proj.reconstructionPlan) return res.status(400).json({ message: 'Missing reconstruction plan' });
  if (!proj.damageReport) return res.status(400).json({ message: 'Missing damage report' });
  if (!proj.selectedBidId || !proj.assignedContractorId) return res.status(400).json({ message: 'Contractor not awarded' });

  const selectedBid = proj.bids.find((b) => b.id === proj.selectedBidId);
  if (!selectedBid) return res.status(400).json({ message: 'Selected bid not found' });

  const budget = Number(proj.reconstructionPlan.costBreakdown?.total ?? 0);
  if (budget > 0 && selectedBid.cost > budget) {
    return res.status(400).json({ message: 'Budget compliance failed' });
  }

  const year = new Date().getFullYear();
  const licId = `LIC-${year}-${String(proj.id).padStart(4, '0')}`;
  const issuedAt = nowIso();
  const validFrom = new Date().toISOString().slice(0, 10);
  const validTo = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10);

  const license = {
    id: licId,
    projectId: proj.id,
    contractorId: proj.assignedContractorId,
    validFrom,
    validTo,
    conditions: ['Safety protocols required', 'Inspection schedule: monthly', 'Weekly progress updates'],
    signature: 'SIGNATURE_PLACEHOLDER',
    issuedBy: req.user.id,
    issuedAt,
  };

  proj.license = license;
  proj.status = 'Licensed';
  proj.updatedAt = nowIso();

  licenses.push(license);

  appendAudit({
    entityType: 'License',
    entityId: license.id,
    action: 'license_issued',
    actorId: req.user.id,
    details: { projectId: proj.id, contractorId: proj.assignedContractorId },
  });

  res.json(license);
});

// Admin
app.get('/api/admin/users', requireRole(['admin']), (_req, res) => {
  res.json(users.map(({ password, ...safe }) => safe));
});

app.get('/api/admin/licenses', requireRole(['admin']), (_req, res) => {
  res.json(licenses);
});

app.get('/api/admin/audit', requireRole(['admin']), (_req, res) => {
  res.json(auditLogs);
});

// Re-seed (demo convenience)
app.post('/api/admin/seed', requireRole(['admin']), (_req, res) => {
  seed();
  res.json({ success: true });
});

// ---------------------------
// Start
// ---------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LifeLines API listening on http://localhost:${PORT}/api`);
});
