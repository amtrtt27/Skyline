import { uid, clamp } from '../store/utils.js';

function round(n) { return Math.round(n); }

function baseSpecFromProject(project) {
  const types = ['Residential', 'Clinic', 'School', 'Community Center', 'Road Segment', 'Facility'];
  const t = project?.title?.toLowerCase() || '';
  const buildingType =
    t.includes('school') ? 'School' :
    t.includes('clinic') ? 'Clinic' :
    t.includes('road') ? 'Road Segment' :
    t.includes('center') ? 'Community Center' :
    types[(Math.random() * types.length) | 0];

  const floors = buildingType === 'Road Segment' ? 1 : (t.includes('wing') ? 1 : 1 + ((Math.random() * 3) | 0));
  const areaSqm = buildingType === 'Road Segment' ? 1200 : round(450 + Math.random() * 900);
  return { buildingType, floors, areaSqm };
}

function computeMaterials(spec, damageSeverity = 'Medium') {
  const sevFactor = { Low: 0.65, Medium: 1.0, High: 1.35, Critical: 1.6 }[damageSeverity] || 1.0;
  const area = spec.areaSqm;

  const concrete = round((area * 0.07) * sevFactor);
  const steel = Math.round(((area * 0.0038) * sevFactor) * 10) / 10;
  const bricks = round((area * 7.5) * sevFactor);

  return [
    { type: 'Concrete', qty: concrete, unit: 'm', notes: 'Structural reinforcement & slab repairs' },
    { type: 'Steel', qty: steel, unit: 'tons', notes: 'Rebar & framing' },
    { type: 'Bricks', qty: bricks, unit: 'units', notes: 'Masonry replacement' }
  ];
}

function computeCosts(materials, options) {
  const concrete = materials.find(m => m.type === 'Concrete')?.qty || 0;
  const steel = materials.find(m => m.type === 'Steel')?.qty || 0;
  const bricks = materials.find(m => m.type === 'Bricks')?.qty || 0;

  const materialsCost = round(concrete * 420 + steel * 14500 + bricks * 1.9);
  const laborCost = round(materialsCost * 0.72);
  const transportCost = round(materialsCost * 0.12);
  const permits = 6500;

  let uplift = 0;
  if (options.solarPanels) uplift += 12000;
  if (options.insulation) uplift += 6000;
  if (options.seismicReinforcement) uplift += 9000;

  return [
    { item: 'Materials', cost: materialsCost + round(uplift * 0.45) },
    { item: 'Labor', cost: laborCost + round(uplift * 0.40) },
    { item: 'Transport', cost: transportCost + round(uplift * 0.15) },
    { item: 'Permits & inspections', cost: permits }
  ];
}

function computeTimeline(spec, severity = 'Medium', options) {
  const sevFactor = { Low: 0.8, Medium: 1.0, High: 1.25, Critical: 1.45 }[severity] || 1.0;
  let months = 3 + (spec.areaSqm / 500) * sevFactor;
  if (options.solarPanels) months += 0.3;
  if (options.insulation) months += 0.2;
  if (options.seismicReinforcement) months += 0.4;
  return clamp(Math.round(months), 3, 14);
}

function computeSustainability(options, recycledPercentGuess = 22) {
  let recycled = recycledPercentGuess;
  let co2 = 2400 + Math.random() * 1200;

  if (options.solarPanels) co2 += 1100;
  if (options.insulation) co2 += 700;
  if (options.seismicReinforcement) co2 += 450;

  recycled = clamp(recycled + (options.insulation ? 6 : 0) + (options.seismicReinforcement ? 4 : 0), 8, 65);
  const energy = round(11000 + Math.random() * 12000 + (options.solarPanels ? 12000 : 0) + (options.insulation ? 6000 : 0));

  return {
    recycledPercent: round(recycled),
    co2SavedKg: round(co2),
    energyKwhSaved: energy
  };
}

// Mock "Google Maps retrieval"  structured like a real integration point.
export async function fetchBuildingContextFromMaps({ lat, lng }) {
  // In a production build, this would call Places/Geocoding + building info sources.
  // For this MVP, return a deterministic-ish placeholder.
  const hash = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 1000;
  const yearBuilt = 1990 + Math.round(hash % 28);
  const zoning = hash % 2 > 1 ? 'Mixed-use' : 'Residential';
  return { yearBuilt, zoning, confidence: 0.68 + (hash % 20) / 100 };
}

export async function generateDefaultPlan({ project, severity = 'Medium', options }) {
  const buildingSpec = baseSpecFromProject(project);
  const materials = computeMaterials(buildingSpec, severity);
  const costBreakdown = computeCosts(materials, options);
  const timelineMonths = computeTimeline(buildingSpec, severity, options);

  const sustainabilityMetrics = computeSustainability(options);

  const now = new Date().toISOString();
  return {
    id: uid('plan'),
    projectId: project.id,
    version: 1,
    buildingSpec,
    materials,
    costBreakdown,
    timelineMonths,
    sustainabilityOptions: options,
    sustainabilityMetrics,
    createdAt: now,
    updatedAt: now
  };
}
