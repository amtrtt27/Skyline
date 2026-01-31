import React from 'react';

/**
 * UrgencyClassifier - Classifies and displays decision urgency
 * Three tiers: Immediate (life/safety), Operational, Administrative
 */

export const URGENCY_LEVELS = {
  IMMEDIATE: 'immediate',
  OPERATIONAL: 'operational',
  ADMINISTRATIVE: 'administrative'
};

export const URGENCY_LABELS = {
  [URGENCY_LEVELS.IMMEDIATE]: 'Immediate (Life/Safety)',
  [URGENCY_LEVELS.OPERATIONAL]: 'Operational',
  [URGENCY_LEVELS.ADMINISTRATIVE]: 'Administrative'
};

export const URGENCY_COLORS = {
  [URGENCY_LEVELS.IMMEDIATE]: '#dc2626',
  [URGENCY_LEVELS.OPERATIONAL]: '#ea580c',
  [URGENCY_LEVELS.ADMINISTRATIVE]: '#0891b2'
};

export const URGENCY_SORT_ORDER = {
  [URGENCY_LEVELS.IMMEDIATE]: 1,
  [URGENCY_LEVELS.OPERATIONAL]: 2,
  [URGENCY_LEVELS.ADMINISTRATIVE]: 3
};

export function UrgencyBadge({ urgency }) {
  const color = URGENCY_COLORS[urgency] || URGENCY_COLORS[URGENCY_LEVELS.ADMINISTRATIVE];
  const label = URGENCY_LABELS[urgency] || urgency;

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.85em',
      fontWeight: '600',
      background: `${color}20`,
      color: color,
      border: `1px solid ${color}`
    }}>
      {urgency === URGENCY_LEVELS.IMMEDIATE && ' '}
      {label}
    </span>
  );
}

export function classifyUrgency(decision) {
  // Auto-classify based on keywords and context
  const text = `${decision.type || ''} ${decision.description || ''}`.toLowerCase();
  
  // Immediate/Life-Safety keywords
  if (
    text.includes('life') || 
    text.includes('safety') || 
    text.includes('critical') ||
    text.includes('emergency') ||
    text.includes('urgent') ||
    text.includes('hospital') ||
    text.includes('medical') ||
    text.includes('evacuation') ||
    text.includes('hazard') ||
    text.includes('structural fail')
  ) {
    return URGENCY_LEVELS.IMMEDIATE;
  }
  
  // Operational keywords
  if (
    text.includes('operational') ||
    text.includes('debris') ||
    text.includes('clearing') ||
    text.includes('access') ||
    text.includes('road') ||
    text.includes('utility') ||
    text.includes('water') ||
    text.includes('power') ||
    text.includes('reconstruction')
  ) {
    return URGENCY_LEVELS.OPERATIONAL;
  }
  
  // Default to administrative
  return URGENCY_LEVELS.ADMINISTRATIVE;
}

export function sortByUrgency(decisions) {
  return [...decisions].sort((a, b) => {
    const urgencyA = a.urgency || classifyUrgency(a);
    const urgencyB = b.urgency || classifyUrgency(b);
    
    const orderA = URGENCY_SORT_ORDER[urgencyA] || 99;
    const orderB = URGENCY_SORT_ORDER[urgencyB] || 99;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Within same urgency, sort by creation time (newest first)
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

export function UrgencyClassifier({ decision, onChange }) {
  const currentUrgency = decision.urgency || classifyUrgency(decision);
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
        Decision Urgency
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Object.values(URGENCY_LEVELS).map(level => (
          <button
            key={level}
            onClick={() => onChange(level)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: currentUrgency === level ? `2px solid ${URGENCY_COLORS[level]}` : '1px solid var(--border-color)',
              background: currentUrgency === level ? `${URGENCY_COLORS[level]}20` : 'var(--bg-primary)',
              color: currentUrgency === level ? URGENCY_COLORS[level] : 'var(--text-primary)',
              fontWeight: currentUrgency === level ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {level === URGENCY_LEVELS.IMMEDIATE && ' '}
            {URGENCY_LABELS[level]}
          </button>
        ))}
      </div>
      <div style={{ 
        marginTop: '0.75rem', 
        fontSize: '0.85em', 
        color: 'var(--text-secondary)',
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '6px'
      }}>
        <strong>Why urgency matters:</strong> It stops low-importance paperwork from blocking 
        critical actions. This mirrors how humans actually triage under stress.
      </div>
    </div>
  );
}

export default {
  UrgencyBadge,
  UrgencyClassifier,
  classifyUrgency,
  sortByUrgency,
  URGENCY_LEVELS,
  URGENCY_LABELS
};
