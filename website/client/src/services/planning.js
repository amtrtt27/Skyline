import { makeId } from '../utils/ids.js';
import { clamp } from '../utils/geo.js';

/**
 * Generates a default reconstruction plan.
 * This is a demo module structured so real Google Maps / building info can plug in later.
 */
export function generateDefaultPlan({ project, damageReport } = {}) {
  const severity = damageReport?.severity ?? 'High';

  // Heuristic: if title contains bridge, treat as bridge
  const isBridge = /bridge|road/i.test(project?.title ?? '');

  const base = severity === 'Low' ? 50000 : severity === 'Medium' ? 120000 : severity === 'High' ? 220000 : 480000;
  const timelineMonths = severity === 'Low' ? 4 : severity === 'Medium' ? 7 : severity === 'High' ? 12 : 18;

  const buildingSpec = isBridge
    ? { buildingType: 'Bridge', floors: 0, areaSqm: 0 }
    : { buildingType: 'Residential', floors: severity === 'Critical' ? 4 : 2, areaSqm: severity === 'Low' ? 180 : 900 };

  const materials = isBridge
    ? [
        { type: 'Concrete', qty: severity === 'Critical' ? 300 : 220, unit: 'm3' },
        { type: 'Steel', qty: severity === 'Critical' ? 30 : 22, unit: 'tons' },
        { type: 'Asphalt', qty: severity === 'Critical' ? 160 : 120, unit: 'tons' },
      ]
    : [
        { type: 'Concrete', qty: severity === 'Critical' ? 160 : 100, unit: 'm3' },
        { type: 'Steel', qty: severity === 'Critical' ? 16 : 10, unit: 'tons' },
        { type: 'Bricks', qty: severity === 'Critical' ? 18000 : 15000, unit: 'units' },
      ];

  const costBreakdown = {
    labor: Math.round(base * 0.35),
    materials: Math.round(base * 0.5),
    logistics: Math.round(base * 0.15),
    total: base,
  };

  const sustainabilityOptions = { solarPanels: false, insulation: false, seismicReinforcement: false };
  const sustainabilityMetrics = { co2ReducedTons: 0, recycledMaterialPct: 15 };

  return {
    id: makeId('plan'),
    buildingSpec,
    materials,
    costBreakdown,
    timelineMonths,
    sustainabilityOptions,
    sustainabilityMetrics,
  };
}

export function applySustainabilityToggles(plan) {
  const opt = plan.sustainabilityOptions || {};
  const baseTotal =
    (plan.costBreakdown?.labor ?? 0) + (plan.costBreakdown?.materials ?? 0) + (plan.costBreakdown?.logistics ?? 0);

  const extra = (opt.solarPanels ? 8000 : 0) + (opt.insulation ? 5000 : 0) + (opt.seismicReinforcement ? 5000 : 0);
  plan.costBreakdown.total = Math.round((baseTotal + extra) / 100) * 100;

  const recycledPct = clamp((opt.solarPanels ? 5 : 0) + (opt.insulation ? 5 : 0) + (opt.seismicReinforcement ? 5 : 0) + 15, 0, 60);
  plan.sustainabilityMetrics.recycledMaterialPct = recycledPct;
  plan.sustainabilityMetrics.co2ReducedTons = Number(((recycledPct / 100) * 4).toFixed(1));
  return plan;
}
