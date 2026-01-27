import { makeId } from '../utils/ids.js';

export const DEMO_DB_KEY = 'lifelines_demo_db_v1';

export function createSeedDb() {
  // Users (passwords stored only in demo DB)
  const users = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { id: 2, name: 'Gov Official', email: 'official@example.com', password: 'official123', role: 'official' },
    { id: 3, name: 'BuildCo Contractor', email: 'contractor@example.com', password: 'contractor123', role: 'contractor' },
    { id: 4, name: 'Community Rep', email: 'community@example.com', password: 'community123', role: 'community' },
  ];

  const now = new Date().toISOString();

  const projects = [
    {
      id: '1',
      title: 'Central City Library Rebuild',
      description: 'Reconstruction of a public library after earthquake damage.',
      location: { lat: 25.2854, lng: 51.531, address: 'Central City, QA' },
      status: 'Published',
      createdAt: now,
      updatedAt: now,
      visibility: 'public',
      communityFeedbackEnabled: true,
      createdBy: 2,
      communityInputs: [
        {
          id: makeId('cinput'),
          authorId: 4,
          comment: 'Please prioritize accessibility ramps and a temporary reading space.',
          approvalSignal: true,
          createdAt: now,
        },
      ],
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
      selectedBidId: null,
      assignedContractorId: null,
      license: null,
    },
    {
      id: '2',
      title: 'West River Bridge Reconstruction',
      description: 'Rebuilding a bridge with enhanced seismic standards.',
      location: { lat: 25.3, lng: 51.5333, address: 'West River, QA' },
      status: 'Licensed',
      createdAt: now,
      updatedAt: now,
      visibility: 'public',
      communityFeedbackEnabled: false,
      createdBy: 2,
      communityInputs: [],
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
          contractorId: 3,
          cost: 480000,
          timelineMonths: 17,
          experienceCount: 5,
          recycledPercent: 30,
          score: 88,
          createdAt: now,
          status: 'Won',
        },
      ],
      selectedBidId: null,
      assignedContractorId: 3,
      license: {
        id: 'LIC-2026-0002',
        projectId: '2',
        contractorId: 3,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10),
        conditions: ['Weekly progress reports', 'Monthly safety inspections'],
        signature: 'SIGNATURE_PLACEHOLDER',
        issuedBy: 2,
        issuedAt: now,
      },
    },
    {
      id: '3',
      title: 'Lakeside Community Center Repair',
      description: 'Repairing the community center roof and interior after storm damage.',
      location: { lat: 25.289, lng: 51.53, address: 'Lakeside, QA' },
      status: 'Draft',
      createdAt: now,
      updatedAt: now,
      visibility: 'private',
      communityFeedbackEnabled: true,
      createdBy: 2,
      communityInputs: [],
      damageReport: null,
      reconstructionPlan: null,
      bids: [],
      selectedBidId: null,
      assignedContractorId: null,
      license: null,
    },
  ];

  const resources = [
    {
      id: makeId('res'),
      type: 'Bricks',
      condition: 'Good',
      qty: 8500,
      unit: 'units',
      location: { lat: 25.287, lng: 51.531 },
      sourceProjectId: null,
      reservedForProjectId: null,
      unitCostNew: 0.8,
      unitCostRecycled: 0.4,
      unitCo2New: 0.0005,
      unitCo2Recycled: 0.00025,
    },
    {
      id: makeId('res'),
      type: 'Steel',
      condition: 'Fair',
      qty: 12,
      unit: 'tons',
      location: { lat: 25.31, lng: 51.533 },
      sourceProjectId: null,
      reservedForProjectId: null,
      unitCostNew: 320,
      unitCostRecycled: 200,
      unitCo2New: 2.7,
      unitCo2Recycled: 1.5,
    },
    {
      id: makeId('res'),
      type: 'Concrete',
      condition: 'Mixed',
      qty: 30,
      unit: 'tons',
      location: { lat: 25.295, lng: 51.528 },
      sourceProjectId: null,
      reservedForProjectId: null,
      unitCostNew: 110,
      unitCostRecycled: 60,
      unitCo2New: 0.45,
      unitCo2Recycled: 0.2,
    },
  ];

  const licenses = projects.filter((p) => p.license).map((p) => p.license);

  const audit = [
    { id: makeId('audit'), entityType: 'System', entityId: 'seed', action: 'seed_complete', actorId: 1, timestamp: now, details: {} },
  ];

  return { users, projects, resources, licenses, audit };
}

export function loadOrSeedDb() {
  const raw = localStorage.getItem(DEMO_DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallthrough
    }
  }
  const seeded = createSeedDb();
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveDb(db) {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}
