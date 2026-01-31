import { REGIONS } from './regions.js';

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
}

const now = () => new Date().toISOString();

const region = REGIONS.find(r => r.id === 'doha');

export function createSeedSnapshot() {
  const t0 = now();

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
      title: 'Al Bayan School  Block B',
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
        { type: 'Concrete', qty: 85, unit: 'm', notes: 'Foundation and slab repairs' },
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
      unit: 'm',
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
    actors: seedUsers(),
    projects,
    damageReports,
    plans,
    resources,
    bids,
    licenses,
    audit
  };
}

export function seedUsers() {
  // Client does not store passwords. This is only for local/offline views.
  return [
    { id: 'user_admin', name: 'Admin', email: 'admin@example.com', role: 'admin', regionId: region.id, regionName: region.name },
    { id: 'user_official', name: 'Urban Planner', email: 'official@example.com', role: 'official', regionId: region.id, regionName: region.name },
    { id: 'user_contractor', name: 'ReBuild Co.', email: 'contractor@example.com', role: 'contractor', regionId: region.id, regionName: region.name },
    { id: 'user_community', name: 'Community Rep', email: 'community@example.com', role: 'community', regionId: region.id, regionName: region.name }
  ];
}
