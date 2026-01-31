export const ONTOLOGY_TYPES = [
  'Asset',
  'Observation',
  'Assessment',
  'DebrisBatch',
  'Plan',
  'Task',
  'Resource',
  'Bid',
  'Contract',
  'Approval',
  'Actor',
  'DecisionPacket',
  'Event'
];

export const EDGE_TYPES = [
  'assesses',
  'derivedFrom',
  'covers',
  'requires',
  'partOf',
  'dependsOn',
  'for',
  'authorizes',
  'responsibleFor',
  'emits'
];

// UI helpers
export const TYPE_LABELS = {
  Asset: 'Asset (Building / Facility / Road)',
  Observation: 'Observation (Image / Field report)',
  Assessment: 'Assessment (Damage report)',
  DebrisBatch: 'DebrisBatch',
  Plan: 'Plan (Reconstruction plan)',
  Task: 'Task',
  Resource: 'Resource (Inventory item)',
  Bid: 'Bid',
  Contract: 'Contract',
  Approval: 'Approval (Permit / license step)',
  Actor: 'Actor (Agency / NGO / Contractor / Community rep)',
  DecisionPacket: 'DecisionPacket',
  Event: 'Event (Audit log)'
};
