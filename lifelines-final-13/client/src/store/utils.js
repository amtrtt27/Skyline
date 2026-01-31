export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function haversineKm(a, b) {
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

export function formatMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatNumber(n, digits = 0) {
  const v = Number(n || 0);
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
}

// Bid scoring: cost 40%, timeline 20%, experience 20%, sustainability 20%
export function scoreBid({ cost, timelineMonths, experienceCount, recycledPercent }, baselines) {
  const { minCost, maxCost, minTimeline, maxTimeline, minExp, maxExp } = baselines;

  const norm = (value, min, max, invert = false) => {
    if (max === min) return 1;
    const t = (value - min) / (max - min);
    const clamped = Math.max(0, Math.min(1, t));
    return invert ? 1 - clamped : clamped;
  };

  const costScore = norm(cost, minCost, maxCost, true); // lower cost better
  const timelineScore = norm(timelineMonths, minTimeline, maxTimeline, true); // lower timeline better
  const expScore = norm(experienceCount, minExp, maxExp, false);
  const susScore = Math.max(0, Math.min(1, (recycledPercent || 0) / 100));

  const score = 0.40 * costScore + 0.20 * timelineScore + 0.20 * expScore + 0.20 * susScore;
  return { score, breakdown: { costScore, timelineScore, expScore, susScore } };
}
