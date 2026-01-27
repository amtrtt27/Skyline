import React from 'react';

export default function Toast({ toast }) {
  const border =
    toast.kind === 'warn' ? '#fde68a' : toast.kind === 'error' ? '#fecaca' : '#dbe6ff';
  const bg =
    toast.kind === 'warn' ? '#fffbeb' : toast.kind === 'error' ? '#fef2f2' : '#f1f5ff';
  const color =
    toast.kind === 'warn' ? '#92400e' : toast.kind === 'error' ? '#991b1b' : '#1e3a8a';

  return (
    <div style={{ position: 'fixed', right: 16, top: 76, zIndex: 1000, width: 'min(520px, calc(100vw - 32px))' }}>
      <div className="toast" style={{ borderColor: border, background: bg, color }}>
        {toast.message}
      </div>
    </div>
  );
}
