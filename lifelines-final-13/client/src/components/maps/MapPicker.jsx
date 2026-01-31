import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps } from './useGoogleMaps.js';

export default function MapPicker({
  lat,
  lng,
  onChange,
  height = 320,
  zoom = 14,
  allowSearch = true
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const center = useMemo(() => ({
    lat: Number(lat) || 0,
    lng: Number(lng) || 0
  }), [lat, lng]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!apiKey) return;
      try {
        const maps = await loadGoogleMaps(apiKey);
        if (cancelled) return;
        if (!ref.current) return;

        mapRef.current = new maps.Map(ref.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy'
        });

        markerRef.current = new maps.Marker({
          map: mapRef.current,
          position: center,
          draggable: true
        });

        markerRef.current.addListener('dragend', () => {
          const pos = markerRef.current.getPosition();
          if (!pos) return;
          onChange?.({ lat: pos.lat(), lng: pos.lng(), source: 'marker' });
        });

        mapRef.current.addListener('click', (e) => {
          if (!e.latLng) return;
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          markerRef.current.setPosition(pos);
          onChange?.({ ...pos, source: 'map' });
        });

        mapRef.current.addListener('idle', () => {
          const c = mapRef.current.getCenter();
          if (!c) return;
          // keep coordinates in sync even if user pans without click
          onChange?.({ lat: c.lat(), lng: c.lng(), source: 'pan' });
        });

        // Optional search box
        if (allowSearch) {
          const input = document.getElementById('map-search-input');
          if (input) {
            const autocomplete = new maps.places.Autocomplete(input, { fields: ['geometry', 'formatted_address', 'name'] });
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (!place.geometry?.location) return;
              const p = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
              mapRef.current.setCenter(p);
              mapRef.current.setZoom(16);
              markerRef.current.setPosition(p);
              onChange?.({ ...p, address: place.formatted_address || place.name || '', source: 'search' });
            });
          }
        }

        setLoaded(true);
      } catch (e) {
        setError(e.message);
      }
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // If props change (typing coordinates), move map + marker
  useEffect(() => {
    if (!loaded || !mapRef.current || !markerRef.current) return;
    mapRef.current.setCenter(center);
    markerRef.current.setPosition(center);
  }, [center, loaded]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${center.lat}, ${center.lng}`); } catch { /* ignore */ }
  };

  if (!apiKey) {
    return (
      <div className="mapWrap">
        <div className="mapPlaceholder">
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Map picker</div>
            <div className="small">Coordinates: <strong>{Number(center.lat).toFixed(5)}, {Number(center.lng).toFixed(5)}</strong></div>
            <div className="small muted" style={{ marginTop: 8 }}>Add a Google Maps API key to enable interactive selection.</div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={copy}>Copy coords</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {allowSearch && (
        <div style={{ marginBottom: 10 }}>
          <label className="label" htmlFor="map-search-input">Search location</label>
          <input id="map-search-input" className="input" placeholder="Type an address or place name..." />
          <div className="helper">Tip: click on the map or drag the marker to set the project location.</div>
        </div>
      )}

      {error ? <div className="error">{error}</div> : null}
      <div className="mapWrap" style={{ height }}>
        <div ref={ref} style={{ width: '100%', height: '100%' }} aria-label="Map picker" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <span className="pill">Lat: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{Number(center.lat).toFixed(5)}</strong></span>
        <span className="pill">Lng: <strong style={{ color: 'rgba(255,255,255,.92)' }}>{Number(center.lng).toFixed(5)}</strong></span>
        <button className="btn" onClick={copy}>Copy coords</button>
      </div>
    </div>
  );
}
