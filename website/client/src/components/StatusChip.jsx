import React from 'react';

export default function StatusChip({ status }) {
  return <span className={`badge dot ${status}`}>{status}</span>;
}
