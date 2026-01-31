import * as tf from '@tensorflow/tfjs';
import { clamp } from '../store/utils.js';

let _model = null;

// This is a stub model to demonstrate TF.js integration.
// It is not trained; it only produces deterministic-ish outputs.
async function getStubModel() {
  if (_model) return _model;

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [8], units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
  // Random weights are fine for the demo.
  _model = model;
  return model;
}

function pickSeverityFromProb(p) {
  const labels = ['Low', 'Medium', 'High', 'Critical'];
  let acc = 0;
  for (let i = 0; i < labels.length; i++) {
    acc += p[i];
    if (acc >= Math.random()) return labels[i];
  }
  return labels[1];
}

function severityToIssues(sev) {
  const base = {
    Low: ['Minor cracking', 'Surface damage'],
    Medium: ['Wall cracking', 'Water intrusion', 'Electrical safety risk'],
    High: ['Partial structural failure', 'Roof instability', 'Foundation concerns'],
    Critical: ['Major collapse risk', 'Unsafe occupancy', 'Immediate stabilization required']
  };
  const extra = ['Masonry failure', 'Stairwell damage', 'HVAC failure', 'Plumbing rupture', 'Hazardous debris'];
  const issues = [...base[sev]];
  if (sev === 'Medium' || sev === 'High' || sev === 'Critical') {
    const n = sev === 'Medium' ? 1 : sev === 'High' ? 2 : 3;
    for (let i = 0; i < n; i++) issues.push(extra[(Math.random() * extra.length) | 0]);
  }
  return Array.from(new Set(issues));
}

function severityToDebrisM3(sev) {
  const base = { Low: 8, Medium: 35, High: 85, Critical: 140 };
  const jitter = (Math.random() - 0.5) * 0.25;
  const estimate = Math.round(base[sev] * (1 + jitter));
  const marginPct = sev === 'Low' ? 25 : sev === 'Medium' ? 18 : sev === 'High' ? 14 : 12;
  const min = Math.round(estimate * (1 - marginPct / 100));
  const max = Math.round(estimate * (1 + marginPct / 100));
  return { estimateM3: estimate, marginPct, minM3: min, maxM3: max };
}

function severityToRecoverables(sev) {
  const candidates = [
    { type: 'Bricks', unit: 'units', base: 5000, q: 0.72 },
    { type: 'Concrete', unit: 'm', base: 22, q: 0.64 },
    { type: 'Steel', unit: 'tons', base: 3.2, q: 0.66 },
    { type: 'Timber', unit: 'm', base: 18, q: 0.58 }
  ];
  const multiplier = { Low: 0.35, Medium: 0.7, High: 1.0, Critical: 1.25 }[sev];
  const count = sev === 'Low' ? 2 : sev === 'Medium' ? 3 : 4;

  return candidates.slice(0, count).map((c) => {
    const jitter = 0.18 * (Math.random() - 0.5);
    const estimate = c.base * multiplier * (1 + jitter);
    const marginPct = sev === 'Low' ? 22 : sev === 'Medium' ? 15 : sev === 'High' ? 13 : 12;
    const minQty = estimate * (1 - marginPct / 100);
    const maxQty = estimate * (1 + marginPct / 100);

    const qty = c.unit === 'units' ? Math.round(estimate) : Math.round(estimate * 10) / 10;
    return {
      type: c.type,
      unit: c.unit,
      qty,
      marginPct,
      minQty: c.unit === 'units' ? Math.round(minQty) : Math.round(minQty * 10) / 10,
      maxQty: c.unit === 'units' ? Math.round(maxQty) : Math.round(maxQty * 10) / 10,
      qualityScore: clamp(c.q + (Math.random() - 0.5) * 0.16, 0.35, 0.92)
    };
  });
}

export async function runDamageAnalysis({ imagesCount = 1 }) {
  const model = await getStubModel();

  // Turn "imagesCount" into a small feature vector.
  const features = tf.tensor2d([[
    imagesCount,
    0.3 + Math.random() * 0.7,
    Math.random(),
    Math.random(),
    0.4 + Math.random() * 0.6,
    Math.random(),
    Math.random(),
    0.2 + Math.random() * 0.8
  ]]);

  const probs = Array.from((await model.predict(features).data()));
  features.dispose();

  const severity = pickSeverityFromProb(probs);
  const issues = severityToIssues(severity);
  const debrisVolume = severityToDebrisM3(severity);
  const recoverables = severityToRecoverables(severity);

  // Confidence: tie to entropy-ish + random jitter
  const confBase = 0.62 + Math.random() * 0.25;
  const confidenceScores = {
    severity: clamp(confBase + (Math.random() - 0.5) * 0.12, 0.45, 0.95),
    issues: clamp(confBase + (Math.random() - 0.5) * 0.14, 0.45, 0.92),
    debris: clamp(confBase - 0.06 + (Math.random() - 0.5) * 0.12, 0.35, 0.90),
    recoverables: clamp(confBase - 0.03 + (Math.random() - 0.5) * 0.12, 0.40, 0.92)
  };

  return {
    severity,
    issues,
    debrisVolume,
    recoverables,
    confidenceScores,
    modelVersion: 'tfjs-stub-1.0'
  };
}
