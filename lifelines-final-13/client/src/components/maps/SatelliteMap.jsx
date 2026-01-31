import React, { useEffect, useRef, useState } from 'react';

export default function SatelliteMap({ lat = 25.2854, lng = 51.5310, height = 400, zoom = 13 }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDqG7DFLBDmAavLs28eSQ8kRhURdGkuiJI';

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
          mapTypeId: 'satellite',
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_CENTER
          },
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        // Add a marker at center
        new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: 'Operations Center',
          animation: window.google.maps.Animation.DROP
        });

        setMap(mapInstance);
      } catch (err) {
        console.error('Satellite map error:', err);
        setError(true);
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => setError(true);
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [lat, lng, zoom]);

  if (error) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f1f5f9',
        borderRadius: 8,
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>MAP</div>
          <div style={{ fontSize: 14 }}>Satellite view unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width: '100%', 
        borderRadius: 8, 
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadowLg)'
      }} 
    />
  );
}
