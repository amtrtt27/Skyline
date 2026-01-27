import { ApiClient } from './api.js';
import { loadOrSeedDb, saveDb } from './seed.js';
import { makeId } from '../utils/ids.js';
import { haversineKm } from '../utils/geo.js';
import { scoreBid } from '../utils/scoring.js';
import { runDamageAnalysis } from '../services/damageAi.js';
import { generateDefaultPlan, applySustainabilityToggles } from '../services/planning.js';

const AUTH_KEY = 'lifelines_auth_v1';

function loadAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return { user: null, token: null };
  try {
    const parsed = JSON.parse(raw);
    return { user: parsed.user ?? null, token: parsed.token ?? null };
  } catch {
    return { user: null, token: null };
  }
}

function saveAuth({ user, token }) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token }));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

const envDemo = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase();
const DEMO_FORCED = envDemo === 'true' || envDemo === '1';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

class Store {
  constructor() {
    const auth = loadAuth();
    this.state = {
      demoMode: DEMO_FORCED || !API_BASE,
      demoFallback: false,
      user: auth.user,
      token: auth.token,
      projects: [],
      toast: null,
      admin: { users: [], licenses: [], audit: [] },
      resourcesCache: {}, // projectId -> resource matches
    };

    this.listeners = new Set();
    this.api = new ApiClient(() => this.state.token);
    this.demoDb = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  setToast(message, kind = 'info') {
    this.state.toast = { id: makeId('toast'), message, kind };
    this.emit();
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => {
      this.state.toast = null;
      this.emit();
    }, 3500);
  }

  async init() {
    if (this.state.demoMode) {
      this.demoDb = loadOrSeedDb();
      this.state.projects = this.demoDb.projects;
      this.emit();
      return;
    }

    // Try API health; fall back to demo if server not running
    try {
      await this.api.health();
    } catch {
      this.state.demoMode = true;
      this.state.demoFallback = true;
      this.demoDb = loadOrSeedDb();
      this.state.projects = this.demoDb.projects;
      this.setToast('API not reachable. Running in Demo Mode (LocalStorage).', 'warn');
      this.emit();
      return;
    }

    await this.refreshProjects();
  }

  // ---------------------------
  // Auth
  // ---------------------------
  async login(email, password) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const u = this.demoDb.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase() && x.password === password);
      if (!u) throw new Error('Invalid credentials');
      const safe = { id: u.id, name: u.name, email: u.email, role: u.role };
      this.state.user = safe;
      this.state.token = 'demo-token';
      saveAuth({ user: safe, token: this.state.token });
      this.setToast(`Welcome back, ${safe.name.split(' ')[0]}!`, 'info');
      this.emit();
      return safe;
    }

    const payload = await this.api.login(email, password);
    this.state.user = payload.user;
    this.state.token = payload.token;
    saveAuth({ user: payload.user, token: payload.token });
    await this.refreshProjects();
    this.setToast('Logged in successfully.', 'info');
    this.emit();
    return payload.user;
  }

  async register({ name, email, password, role }) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      if (this.demoDb.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
        throw new Error('Email already registered');
      }
      const id = Math.max(...this.demoDb.users.map((u) => u.id)) + 1;
      this.demoDb.users.push({ id, name, email, password, role });
      saveDb(this.demoDb);
      this.setToast('Account created. You can log in now.', 'info');
      return true;
    }
    await this.api.register({ name, email, password, role });
    this.setToast('Account created. You can log in now.', 'info');
    return true;
  }

  async logout() {
    try {
      if (!this.state.demoMode) await this.api.logout();
    } catch {
      // ignore
    }
    this.state.user = null;
    this.state.token = null;
    clearAuth();
    this.setToast('Logged out.', 'info');
    this.emit();
  }

  // ---------------------------
  // Data
  // ---------------------------
  async refreshProjects() {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      // Apply access filter like server
      const u = this.state.user;
      const visible = this.demoDb.projects.filter((p) => {
        if (!u) return p.visibility === 'public' && p.status !== 'Draft';
        if (u.role === 'admin') return true;
        if (u.role === 'official') return p.createdBy === u.id;
        if (u.role === 'contractor') return p.status === 'Published' || p.assignedContractorId === u.id || (p.bids || []).some((b) => b.contractorId === u.id);
        return p.visibility === 'public' && p.status !== 'Draft';
      });
      this.state.projects = visible;
      this.emit();
      return visible;
    }

    const list = await this.api.listProjects();
    this.state.projects = list;
    this.emit();
    return list;
  }

  async getProject(id) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const proj = this.demoDb.projects.find((p) => p.id === String(id));
      if (!proj) throw new Error('Project not found');
      return JSON.parse(JSON.stringify(proj));
    }
    return this.api.getProject(id);
  }

  async createProject({ title, description, address, lat, lng, visibility, communityFeedbackEnabled }) {
    const body = {
      title,
      description,
      visibility,
      communityFeedbackEnabled,
      location: { lat: Number(lat), lng: Number(lng), address },
    };

    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const now = new Date().toISOString();
      const nextId = String(Math.max(...this.demoDb.projects.map((p) => Number(p.id))) + 1);
      const proj = {
        id: nextId,
        title,
        description: description ?? '',
        location: body.location,
        status: 'Draft',
        createdAt: now,
        updatedAt: now,
        visibility: visibility === 'private' ? 'private' : 'public',
        communityFeedbackEnabled: Boolean(communityFeedbackEnabled ?? true),
        createdBy: this.state.user?.id,
        communityInputs: [],
        damageReport: null,
        reconstructionPlan: null,
        bids: [],
        selectedBidId: null,
        assignedContractorId: null,
        license: null,
      };
      this.demoDb.projects.push(proj);
      saveDb(this.demoDb);
      this.setToast('Project created (Draft).', 'info');
      await this.refreshProjects();
      return proj;
    }

    const proj = await this.api.createProject(body);
    this.setToast('Project created (Draft).', 'info');
    await this.refreshProjects();
    return proj;
  }

  async updateProject(projectId, patch) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const idx = this.demoDb.projects.findIndex((p) => p.id === String(projectId));
      if (idx === -1) throw new Error('Project not found');
      this.demoDb.projects[idx] = { ...this.demoDb.projects[idx], ...patch, updatedAt: new Date().toISOString() };
      saveDb(this.demoDb);
      await this.refreshProjects();
      return this.demoDb.projects[idx];
    }
    const proj = await this.api.updateProject(projectId, patch);
    await this.refreshProjects();
    return proj;
  }

  async publishProject(projectId) {
    return this.updateProject(projectId, { status: 'Published', visibility: 'public' });
  }

  async runDamage(projectId, imageUrls) {
    const proj = await this.getProject(projectId);
    const report = await runDamageAnalysis({ imageUrls });

    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const idx = this.demoDb.projects.findIndex((p) => p.id === String(projectId));
      this.demoDb.projects[idx].damageReport = report;
      this.demoDb.projects[idx].updatedAt = new Date().toISOString();

      // add recoverables to resources
      for (const rec of report.recoverables) {
        this.demoDb.resources.push({
          id: makeId('res'),
          type: rec.type,
          condition: rec.condition ?? 'Good',
          qty: rec.qty,
          unit: rec.unit,
          location: { lat: proj.location.lat, lng: proj.location.lng },
          sourceProjectId: proj.id,
          reservedForProjectId: null,
          unitCostNew: rec.type === 'Bricks' ? 0.8 : rec.type === 'Steel' ? 320 : 110,
          unitCostRecycled: rec.type === 'Bricks' ? 0.4 : rec.type === 'Steel' ? 200 : 60,
          unitCo2New: rec.type === 'Bricks' ? 0.0005 : rec.type === 'Steel' ? 2.7 : 0.45,
          unitCo2Recycled: rec.type === 'Bricks' ? 0.00025 : rec.type === 'Steel' ? 1.5 : 0.2,
        });
      }

      saveDb(this.demoDb);
      this.setToast('Damage analysis complete.', 'info');
      await this.refreshProjects();
      return report;
    }

    const saved = await this.api.saveDamageReport(projectId, report);
    this.setToast('Damage analysis complete.', 'info');
    return saved;
  }

  async generatePlan(projectId) {
    const proj = await this.getProject(projectId);
    const plan = generateDefaultPlan({ project: proj, damageReport: proj.damageReport });
    applySustainabilityToggles(plan);

    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const idx = this.demoDb.projects.findIndex((p) => p.id === String(projectId));
      this.demoDb.projects[idx].reconstructionPlan = plan;
      this.demoDb.projects[idx].updatedAt = new Date().toISOString();
      saveDb(this.demoDb);
      this.setToast('Default reconstruction plan generated.', 'info');
      await this.refreshProjects();
      return plan;
    }

    const saved = await this.api.savePlan(projectId, plan);
    this.setToast('Default reconstruction plan generated.', 'info');
    return saved;
  }

  async savePlan(projectId, plan) {
    applySustainabilityToggles(plan);

    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const idx = this.demoDb.projects.findIndex((p) => p.id === String(projectId));
      this.demoDb.projects[idx].reconstructionPlan = plan;
      this.demoDb.projects[idx].updatedAt = new Date().toISOString();
      saveDb(this.demoDb);
      await this.refreshProjects();
      return plan;
    }
    return this.api.savePlan(projectId, plan);
  }

  async listResourceMatches(projectId) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const proj = this.demoDb.projects.find((p) => p.id === String(projectId));
      if (!proj) throw new Error('Project not found');
      const needed = new Set((proj.reconstructionPlan?.materials || []).map((m) => m.type));
      const matches = this.demoDb.resources
        .filter((r) => needed.has(r.type))
        .filter((r) => !r.reservedForProjectId || r.reservedForProjectId === proj.id)
        .map((r) => {
          const distanceKm = haversineKm(proj.location, r.location);
          const planMat = proj.reconstructionPlan?.materials?.find((m) => m.type === r.type);
          const neededQty = Number(planMat?.qty ?? 0);
          const usableQty = Math.min(neededQty, r.qty);
          const costSavings = usableQty * (r.unitCostNew - r.unitCostRecycled);
          const co2Reduction = usableQty * (r.unitCo2New - r.unitCo2Recycled);
          return { ...r, distanceKm: Number(distanceKm.toFixed(2)), usableQty, costSavings: Number(costSavings.toFixed(2)), co2Reduction: Number(co2Reduction.toFixed(2)) };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);

      this.state.resourcesCache[projectId] = matches;
      this.emit();
      return matches;
    }

    const matches = await this.api.listResourcesForProject(projectId);
    this.state.resourcesCache[projectId] = matches;
    this.emit();
    return matches;
  }

  async reserveResource(resourceId, projectId, reserve) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const idx = this.demoDb.resources.findIndex((r) => r.id === String(resourceId));
      if (idx === -1) throw new Error('Resource not found');
      this.demoDb.resources[idx].reservedForProjectId = reserve ? String(projectId) : null;
      saveDb(this.demoDb);
      await this.listResourceMatches(projectId);
      this.setToast(reserve ? 'Resource reserved.' : 'Resource released.', 'info');
      return this.demoDb.resources[idx];
    }
    const item = reserve ? await this.api.reserveResource(resourceId, projectId) : await this.api.releaseResource(resourceId, projectId);
    await this.listResourceMatches(projectId);
    this.setToast(reserve ? 'Resource reserved.' : 'Resource released.', 'info');
    return item;
  }

  async submitBid(projectId, bid) {
    const proj = await this.getProject(projectId);
    const payload = {
      cost: Number(bid.cost),
      timelineMonths: Number(bid.timelineMonths),
      experienceCount: Number(bid.experienceCount),
      recycledPercent: Number(bid.recycledPercent),
    };

    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const idx = this.demoDb.projects.findIndex((p) => p.id === String(projectId));
      if (idx === -1) throw new Error('Project not found');

      const newBid = {
        id: makeId('bid'),
        projectId: String(projectId),
        contractorId: this.state.user.id,
        ...payload,
        score: scoreBid(payload, proj.reconstructionPlan),
        createdAt: new Date().toISOString(),
        status: 'Submitted',
      };

      this.demoDb.projects[idx].bids.push(newBid);
      this.demoDb.projects[idx].updatedAt = new Date().toISOString();
      saveDb(this.demoDb);
      this.setToast('Bid submitted.', 'info');
      return newBid;
    }

    const saved = await this.api.submitBid(projectId, payload);
    this.setToast('Bid submitted.', 'info');
    return saved;
  }

  async awardBid(projectId, bidId) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const proj = this.demoDb.projects.find((p) => p.id === String(projectId));
      if (!proj) throw new Error('Project not found');
      const bid = proj.bids.find((b) => b.id === String(bidId));
      if (!bid) throw new Error('Bid not found');

      proj.selectedBidId = bid.id;
      proj.assignedContractorId = bid.contractorId;
      proj.status = 'Awarded';
      proj.updatedAt = new Date().toISOString();
      proj.bids.forEach((b) => (b.status = b.id === bid.id ? 'Won' : 'NotSelected'));
      saveDb(this.demoDb);
      this.setToast('Bid awarded.', 'info');
      await this.refreshProjects();
      return proj;
    }

    const updated = await this.api.awardBid(projectId, bidId);
    this.setToast('Bid awarded.', 'info');
    await this.refreshProjects();
    return updated;
  }

  async issueLicense(projectId) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const proj = this.demoDb.projects.find((p) => p.id === String(projectId));
      if (!proj) throw new Error('Project not found');
      if (!proj.selectedBidId || !proj.assignedContractorId) throw new Error('Contractor not awarded');

      const year = new Date().getFullYear();
      const id = `LIC-${year}-${String(projectId).padStart(4, '0')}`;
      const license = {
        id,
        projectId: String(projectId),
        contractorId: proj.assignedContractorId,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10),
        conditions: ['Safety protocols required', 'Inspection schedule: monthly', 'Weekly progress updates'],
        signature: 'SIGNATURE_PLACEHOLDER',
        issuedBy: this.state.user.id,
        issuedAt: new Date().toISOString(),
      };

      proj.license = license;
      proj.status = 'Licensed';
      proj.updatedAt = new Date().toISOString();

      this.demoDb.licenses = (this.demoDb.licenses || []).concat([license]);
      saveDb(this.demoDb);
      this.setToast('License issued.', 'info');
      await this.refreshProjects();
      return license;
    }

    const lic = await this.api.issueLicense(projectId);
    this.setToast('License issued.', 'info');
    await this.refreshProjects();
    return lic;
  }

  async addCommunityInput(projectId, input) {
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      const proj = this.demoDb.projects.find((p) => p.id === String(projectId));
      if (!proj) throw new Error('Project not found');
      if (!proj.communityFeedbackEnabled) throw new Error('Community feedback is disabled');

      const entry = {
        id: makeId('cinput'),
        authorId: this.state.user.id,
        comment: String(input.comment),
        approvalSignal: Boolean(input.approvalSignal),
        createdAt: new Date().toISOString(),
      };
      proj.communityInputs.push(entry);
      proj.updatedAt = new Date().toISOString();
      saveDb(this.demoDb);
      this.setToast('Feedback submitted.', 'info');
      return entry;
    }

    const entry = await this.api.addCommunityInput(projectId, input);
    this.setToast('Feedback submitted.', 'info');
    return entry;
  }

  // Admin dashboards
  async loadAdmin() {
    if (this.state.user?.role !== 'admin') return;
    if (this.state.demoMode) {
      this.demoDb = this.demoDb || loadOrSeedDb();
      this.state.admin.users = this.demoDb.users.map(({ password, ...safe }) => safe);
      this.state.admin.licenses = this.demoDb.licenses || [];
      this.state.admin.audit = this.demoDb.audit || [];
      this.emit();
      return;
    }
    const [users, licenses, audit] = await Promise.all([this.api.adminUsers(), this.api.adminLicenses(), this.api.adminAudit()]);
    this.state.admin.users = users;
    this.state.admin.licenses = licenses;
    this.state.admin.audit = audit;
    this.emit();
  }
}

export const store = new Store();
