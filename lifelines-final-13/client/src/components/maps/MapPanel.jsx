import React, { useEffect, useRef, useState } from 'react';

export default function MapPanel({ lat, lng, height = 280, zoom = 14, label = 'Location' }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [error, setError] = useState(false);
  const validLat = Number(lat) || 25.2854;
  const validLng = Number(lng) || 51.5310;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDqG7DFLBDmAavLs28eSQ8kRhURdGkuiJI';
    
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => setError(true);
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || !window.google) return;

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: validLat, lng: validLng },
          zoom: zoom,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
        });

        new window.google.maps.Marker({
          position: { lat: validLat, lng: validLng },
          map: mapInstance,
          title: label || 'Location',
          animation: window.google.maps.Animation.DROP
        });

        setMap(mapInstance);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError(true);
      }
    }
  }, [validLat, validLng, zoom, label]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${validLat.toFixed(6)}, ${validLng.toFixed(6)}`);
      alert('Coordinates copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (error) {
    return (
      <div>
        <div className="mapWrap" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', color: 'var(--muted)', fontSize: '14px', fontFamily: 'var(--font)' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>MAP</div>
            <div>Map loading error</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Using fallback location</div>
          </div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: '12px', fontFamily: 'var(--font)' }}>
          <span style={{ color: 'var(--muted)' }}>Location: {validLat.toFixed(5)}, {validLng.toFixed(5)}</span>
          <button className="btn" onClick={copy} style={{ padding: '6px 10px', fontSize: '12px' }}>Copy Coordinates</button>
          <button className="btn" onClick={() => window.open(`https://www.google.com/maps?q=${validLat},${validLng}`, '_blank')} style={{ padding: '6px 10px', fontSize: '12px' }}>Open in Google Maps</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mapRef} className="mapWrap" style={{ height, width: '100%' }} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: '12px', alignItems: 'center', fontFamily: 'var(--font)' }}>
        <span style={{ color: 'var(--muted)' }}>Location: {validLat.toFixed(5)}, {validLng.toFixed(5)}</span>
        <button className="btn" onClick={copy} style={{ padding: '6px 10px', fontSize: '12px' }}>Copy Coordinates</button>
        <button className="btn" onClick={() => window.open(`https://www.google.com/maps?q=${validLat},${validLng}`, '_blank')} style={{ padding: '6px 10px', fontSize: '12px' }}>Open in Google Maps</button>
      </div>
    </div>
  );
}
