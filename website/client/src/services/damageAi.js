import * as tf from '@tensorflow/tfjs';
import { makeId } from '../utils/ids.js';

const severities = ['Low', 'Medium', 'High', 'Critical'];
const issuePool = [
  'Roof collapse',
  'Wall cracks',
  'Foundation damage',
  'Water damage',
  'Fire damage',
  'Structural instability',
  'Beam deformation',
  'Window/door failure',
];

/**
 * TF.js stub: structure is ready for real inference.
 * For the MVP, we simulate a prediction with confidence scores and derived values.
 */
export async function runDamageAnalysis({ imageUrls = [] } = {}) {
  await tf.ready();
  // Fake inference time
  await new Promise((r) => setTimeout(r, 450));

  // Use random but realistic distribution
  const x = Math.random();
  const severity =
    x < 0.12 ? 'Low' : x < 0.45 ? 'Medium' : x < 0.82 ? 'High' : 'Critical';

  const nIssues = severity === 'Low' ? 1 : severity === 'Medium' ? 2 : 3;
  const issues = [];
  while (issues.length < nIssues) {
    const it = issuePool[Math.floor(Math.random() * issuePool.length)];
    if (!issues.includes(it)) issues.push(it);
  }

  const confSeverity = Number((0.82 + Math.random() * 0.16).toFixed(2));
  const confDebris = Number((0.75 + Math.random() * 0.20).toFixed(2));
  const confRecoverables = Number((0.70 + Math.random() * 0.22).toFixed(2));

  const debrisVolume =
    severity === 'Low'
      ? Math.round(3 + Math.random() * 6)
      : severity === 'Medium'
        ? Math.round(10 + Math.random() * 18)
        : severity === 'High'
          ? Math.round(25 + Math.random() * 35)
          : Math.round(60 + Math.random() * 55);

  const recoverables = [];
  if (severity !== 'Low') {
    recoverables.push({
      type: 'Steel',
      condition: severity === 'Critical' ? 'Fair' : 'Good',
      qty: Math.round(2 + Math.random() * 6),
      unit: 'tons',
    });
  }
  if (severity === 'High' || severity === 'Critical') {
    recoverables.push({
      type: 'Bricks',
      condition: 'Good',
      qty: Math.round(1500 + Math.random() * 8000),
      unit: 'units',
    });
    recoverables.push({
      type: 'Concrete',
      condition: 'Mixed',
      qty: Math.round(8 + Math.random() * 25),
      unit: 'tons',
    });
  }
  if (severity === 'Medium') {
    recoverables.push({
      type: 'Bricks',
      condition: 'Good',
      qty: Math.round(800 + Math.random() * 2500),
      unit: 'units',
    });
  }

  return {
    id: makeId('dr'),
    images: imageUrls,
    severity,
    issues,
    debrisVolume,
    recoverables,
    confidenceScores: {
      severity: confSeverity,
      debris: confDebris,
      recoverables: confRecoverables,
    },
  };
}
