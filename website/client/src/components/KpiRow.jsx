import React from 'react';

export default function KpiRow({ items }) {
  return (
    <div className="kpi-row" role="list">
      {items.map((it) => (
        <div className="kpi" role="listitem" key={it.label}>
          <div className="label">{it.label}</div>
          <div className="value">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
