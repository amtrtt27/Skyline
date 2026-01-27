import React, { useMemo } from 'react';

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function MapPanel({ lat, lng, address, height = 260 }) {
  const hasKey = Boolean(GMAPS_KEY);

  const embedUrl = useMemo(() => {
    if (!hasKey) return '';
    const center = `${lat},${lng}`;
    const q = encodeURIComponent(address || center);
    // Using Maps Embed API (simple & robust)
    return `https://www.google.com/maps/embed/v1/place?key=${GMAPS_KEY}&q=${q}&center=${center}&zoom=15`;
  }, [hasKey, lat, lng, address]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${lat},${lng}`);
    } catch {
      // ignore
    }
  };

  return (
    <div className="map" style={{ height }}>
      {hasKey ? (
        <iframe
          title="Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
        />
      ) : (
        <div className="map-placeholder" style={{ height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800 }}>Map (placeholder)</div>
              <div className="subtle">Provide VITE_GOOGLE_MAPS_API_KEY to enable an interactive map.</div>
            </div>
            <button className="btn small secondary" onClick={copy}>Copy coords</button>
          </div>
          <div className="map-coords">{lat}, {lng}</div>
          <div className="subtle">{address || 'No address provided'}</div>
        </div>
      )}
    </div>
  );
}
