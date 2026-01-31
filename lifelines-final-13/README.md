# LifeLines (API + Offline Fallback)

LifeLines is a sustainable post‑disaster reconstruction platform that supports:
- damage assessment (AI stub with confidence + error margins)
- reconstruction planning (editable plan + sustainability toggles)
- resource inventory + matching (distance + cost/CO₂ savings)
- contractor bidding (weighted scoring)
- approvals & licensing (license issuance + audit log)
- ontology objects + interactive relationship graph (Foundry‑style)

This repo runs as:
- **API mode (primary)**: Node/Express backend is the source of truth
- **Offline fallback (built‑in)**: the client keeps a local snapshot + supports export/import “offline packs” and continues working when the API is temporarily unavailable.

---

## Quick start (local)

### 1) Install
From the repo root:

```bash
npm install
npm run install:all
```

### 2) Run (API + client)
```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3001/api

---

## Environment variables

### Client (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDqG7DFLBDmAavLs28eSQ8kRhURdGkuiJI
```

### Server (`server/.env` optional)
```env
PORT=3001
DATA_FILE=.data/db.json
```

> **Google Maps key note:** any key used in browser code is inherently public. Restrict it in Google Cloud Console to your domains (e.g. `https://lifeskylines.com/*`) and only the required APIs.

---

## Demo accounts

### Admin
- Email: `admin@example.com`
- Password: `Jvd8-J+ijn40u@yuVsSEh5`

### Official
- Email: `official@example.com`
- Password: `official123`

### Contractor
- Email: `contractor@example.com`
- Password: `contractor123`

---

## Key flows to demo

### Officials
1. Login as official
2. **Projects → New project**
3. Choose location **on the map** (coordinates auto-sync)
4. **Damage report**: upload image or use sample thumbnails → Run Analysis (shows confidence + error margins)
5. **Plan**: Generate plan → toggle sustainability options → Save
6. Publish project for bidding

### Contractors
1. Login as contractor
2. **Bids**: browse published projects
3. Submit bid → auto-scoring (cost 40%, timeline 20%, experience 20%, sustainability 20%)

### Approvals / Licensing (official/admin)
1. Select winning bid
2. Approvals checklist becomes ready
3. Issue license → creates license ID, validity, conditions, signature placeholder, and writes an audit event

### Admin
- Can delete any project
- Can reset server dataset (Admin → “Reset dataset”)
- Can view license log + audit stream

---

## Offline fallback + “offline packs”

Go to **Settings** (inside the app):
- **Export offline pack**: downloads a JSON snapshot (projects/resources/bids/licenses/audit)
- **Import offline pack**: load a snapshot (useful for offline deployments / demos)
- **Reset local cache**: revert the browser to the seeded defaults

The app continues to function if the API is unreachable; edits are stored locally and automatically synchronized once the API returns.

---

## Hosting on lifeskylines.com

For a single-domain deployment, put the API behind `/api` (reverse proxy) and set:

```env
VITE_API_BASE_URL=/api
```

Also ensure your hosting rewrites unknown routes to `index.html` (SPA fallback).

---

## Security limitations (MVP)
- Auth uses a lightweight token session (not production-grade JWT hardening).
- No password reset / email verification.
- Use HTTPS in production and rotate any exposed API keys.
