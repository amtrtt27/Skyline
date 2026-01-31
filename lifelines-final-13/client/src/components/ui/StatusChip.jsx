import React from 'react';

export default function StatusChip({ status }) {
  const s = status || 'Draft';
  return (
    <span className={`chip ${s}`}>
      <span className="chipDot" />
      {s}
    </span>
  );
}
