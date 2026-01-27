# LifeLines — Hackathon MVP (React + Express)

A production-quality, hackathon-ready MVP for **LifeLines**: a sustainable post-disaster reconstruction platform featuring:

- Public pages (landing/about/how-it-works/projects/contact)
- Role-based auth (community / official / contractor / admin)
- Project creation + detailed dashboards (tabs)
- Bidding portal + weighted scoring
- Resource inventory + distance-based matching (haversine) with cost & CO₂ savings
- Approvals checklist + license issuance + audit-friendly workflow
- Google Maps integration with graceful fallback (no key needed)
- TensorFlow.js integration as a **stub** (simulated inference)

## Repo structure

- `client/` — React 18 + React Router 6 (Vite)
- `server/` — minimal Express API (in-memory DB)

---

## Quick start (API mode)

### 1) Install deps

```bash
npm install
npm run install:all
```

### 2) Run the full stack

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3001/api

> The client will automatically fall back to **Demo Mode (LocalStorage)** if the API is not reachable.

---

## Demo Mode (no server required)

Demo Mode works without any external services and persists to LocalStorage.

1) Create `client/.env` from the example:
```bash
cp client/.env.example client/.env
```

2) Set:
```env
VITE_DEMO_MODE=true
```

3) Run only the client:
```bash
npm --prefix client install
npm --prefix client dev
```

---

## Environment variables

### Server (`.env` at repo root)
- `PORT` (default `3001`)
- `CLIENT_ORIGIN` (default `http://localhost:5173`)

### Client (`client/.env`)
- `VITE_API_BASE_URL` (default `http://localhost:3001/api`)
- `VITE_DEMO_MODE` (`true`/`false`)
- `VITE_GOOGLE_MAPS_API_KEY` (optional; blank = placeholder map)

---

## Demo accounts

Use these for a smooth demo:

- **Official**: `official@example.com` / `official123`
- **Contractor**: `contractor@example.com` / `contractor123`
- **Community**: `community@example.com` / `community123`
- **Admin**: `admin@example.com` / `admin123`

---

## Demo walkthrough (aligned to MVP video story)

1) **Intro**: open `/` and explain the end-to-end workflow.
2) **Projects**: open `/projects` and click a project → `/projects/:id` for details.
3) **Login as Official**:
   - Go to `/login` (official)
   - Open `/app/projects` → click **New project**
   - Create a Draft project and open it.
4) **Damage detection (TF.js demo)**:
   - In the project, open **Damage Report**
   - Select a sample thumbnail and click **Run analysis**
   - Observe severity, issues, debris, recoverables + confidence.
5) **Reconstruction planning**:
   - Open **Reconstruction Plan**
   - Click **Generate default plan**
   - Toggle sustainability options and **Save plan**
   - Note budget/timeline and sustainability metrics.
6) **Resource matching (Ontology demo)**:
   - Open **Resources**
   - Review haversine distance, estimated cost savings, and CO₂ reduction.
   - Reserve a resource (official/admin only).
7) **Bidding**:
   - Log out and log in as **Contractor**
   - Go to `/app/bids` → pick an open project → **Bids** tab → submit a bid.
   - Note the score uses the fixed weights:
     - cost 40%, timeline 20%, experience 20%, sustainability 20%.
8) **Award + approvals + licensing**:
   - Log in as **Official**
   - Open the project → **Bids** tab → award a bid
   - Open **Approvals** tab → **Approve & issue license**
   - Observe unique license ID, validity period, conditions, and signature placeholder.
9) **Impact**:
   - Return to dashboard KPIs (time saved, cost/CO₂ estimates) to close the story.

---

## Notes on MVP security

- Auth is a simplified token (API mode) or demo token (Demo Mode).
- Tokens are stored in LocalStorage (sufficient for MVP, not production-secure).
- Role-based route guarding is implemented client-side and enforced on key API routes.

---

## Acceptance checklist

- ✅ Works in Demo Mode without keys or external services
- ✅ All routes exist and do not crash
- ✅ Role switching works (demo accounts)
- ✅ Project creation works (official/admin) and project details are richer (tabs)
- ✅ Bidding scoring follows exact weights (40/20/20/20)
- ✅ Approve & issue license generates an ID and updates project state
- ✅ Resource matching uses haversine and shows distance + savings + CO₂
