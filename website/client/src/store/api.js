const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export class ApiClient {
  constructor(getToken) {
    this.getToken = getToken;
  }

  async request(path, { method = 'GET', body, headers = {} } = {}) {
    const url = `${BASE}${path}`;
    const token = this.getToken?.();
    const h = { 'Content-Type': 'application/json', ...headers };
    if (token) h.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message = payload?.message || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  health() {
    return this.request('/health');
  }

  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  }

  register(body) {
    return this.request('/auth/register', { method: 'POST', body });
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  listProjects() {
    return this.request('/projects');
  }

  getProject(id) {
    return this.request(`/projects/${id}`);
  }

  createProject(body) {
    return this.request('/projects', { method: 'POST', body });
  }

  updateProject(id, patch) {
    return this.request(`/projects/${id}`, { method: 'PUT', body: patch });
  }

  saveDamageReport(projectId, report) {
    return this.request(`/projects/${projectId}/damage-report`, { method: 'POST', body: report });
  }

  savePlan(projectId, plan) {
    return this.request(`/projects/${projectId}/plan`, { method: 'PUT', body: plan });
  }

  listResourcesForProject(projectId) {
    return this.request(`/resources?projectId=${encodeURIComponent(projectId)}`);
  }

  reserveResource(resourceId, projectId) {
    return this.request(`/resources/${resourceId}/reserve`, { method: 'POST', body: { projectId } });
  }

  releaseResource(resourceId, projectId) {
    return this.request(`/resources/${resourceId}/release`, { method: 'POST', body: { projectId } });
  }

  submitBid(projectId, bid) {
    return this.request(`/projects/${projectId}/bids`, { method: 'POST', body: bid });
  }

  awardBid(projectId, bidId) {
    return this.request(`/projects/${projectId}/bids/${bidId}/award`, { method: 'POST' });
  }

  issueLicense(projectId) {
    return this.request(`/projects/${projectId}/license`, { method: 'POST' });
  }

  addCommunityInput(projectId, input) {
    return this.request(`/projects/${projectId}/community-input`, { method: 'POST', body: input });
  }

  adminUsers() {
    return this.request('/admin/users');
  }

  adminLicenses() {
    return this.request('/admin/licenses');
  }

  adminAudit() {
    return this.request('/admin/audit');
  }
}
