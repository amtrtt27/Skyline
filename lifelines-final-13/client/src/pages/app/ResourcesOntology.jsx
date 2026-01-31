import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/DataStore.jsx';

export default function ResourcesOntology() {
  const { db, getProjectsForUser } = useStore();
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState('ontology');
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const projects = getProjectsForUser();

  // Complex ontology data structure
  const ontologyData = useMemo(() => {
    const materials = db.materials || [];
    const bids = db.bids || [];
    const actors = db.actors || [];

    // Create hierarchical ontology structure
    const nodes = [
      // Central hub
      { id: 'hub-central', label: 'Skyline Platform', type: 'system', tier: 0, x: 400, y: 300, size: 30 },
      
      // Layer 1: Core entities
      { id: 'entity-projects', label: 'Projects', type: 'entity', tier: 1, x: 250, y: 150, size: 24 },
      { id: 'entity-materials', label: 'Materials', type: 'entity', tier: 1, x: 550, y: 150, size: 24 },
      { id: 'entity-contractors', label: 'Contractors', type: 'entity', tier: 1, x: 250, y: 450, size: 24 },
      { id: 'entity-bids', label: 'Bids', type: 'entity', tier: 1, x: 550, y: 450, size: 24 },
      
      // Layer 2: Data nodes
      ...projects.slice(0, 6).map((p, i) => ({
        id: `project-${i}`,
        label: (p.title || `Project ${i + 1}`).substring(0, 15),
        type: 'project',
        tier: 2,
        x: 150 + (i % 3) * 60,
        y: 80 + Math.floor(i / 3) * 60,
        size: 14,
        status: p.status
      })),
      
      ...materials.slice(0, 6).map((m, i) => ({
        id: `material-${i}`,
        label: (m.type || 'Material').substring(0, 15),
        type: 'material',
        tier: 2,
        x: 480 + (i % 3) * 60,
        y: 80 + Math.floor(i / 3) * 60,
        size: 14,
        quantity: m.quantity
      })),
      
      ...actors.slice(0, 4).map((a, i) => ({
        id: `contractor-${i}`,
        label: a.name.substring(0, 15),
        type: 'contractor',
        tier: 2,
        x: 150 + (i % 2) * 80,
        y: 400 + Math.floor(i / 2) * 50,
        size: 14
      })),
      
      ...bids.slice(0, 4).map((b, i) => ({
        id: `bid-${i}`,
        label: `Bid ${i + 1}`,
        type: 'bid',
        tier: 2,
        x: 480 + (i % 2) * 80,
        y: 400 + Math.floor(i / 2) * 50,
        size: 14,
        status: b.status
      }))
    ];

    // Create edges with hierarchy
    const edges = [
      // Hub to entities
      { from: 'hub-central', to: 'entity-projects', type: 'primary', strength: 1 },
      { from: 'hub-central', to: 'entity-materials', type: 'primary', strength: 1 },
      { from: 'hub-central', to: 'entity-contractors', type: 'primary', strength: 1 },
      { from: 'hub-central', to: 'entity-bids', type: 'primary', strength: 1 },
      
      // Entities to data
      ...projects.slice(0, 6).map((_, i) => ({
        from: 'entity-projects',
        to: `project-${i}`,
        type: 'secondary',
        strength: 0.6
      })),
      
      ...materials.slice(0, 6).map((_, i) => ({
        from: 'entity-materials',
        to: `material-${i}`,
        type: 'secondary',
        strength: 0.6
      })),
      
      ...actors.slice(0, 4).map((_, i) => ({
        from: 'entity-contractors',
        to: `contractor-${i}`,
        type: 'secondary',
        strength: 0.6
      })),
      
      ...bids.slice(0, 4).map((_, i) => ({
        from: 'entity-bids',
        to: `bid-${i}`,
        type: 'secondary',
        strength: 0.6
      })),
      
      // Cross-entity relationships
      { from: 'entity-projects', to: 'entity-materials', type: 'relationship', strength: 0.4 },
      { from: 'entity-projects', to: 'entity-bids', type: 'relationship', strength: 0.4 },
      { from: 'entity-contractors', to: 'entity-bids', type: 'relationship', strength: 0.4 },
      { from: 'entity-materials', to: 'entity-projects', type: 'relationship', strength: 0.3 }
    ];

    return { nodes, edges };
  }, [db, projects]);

  // Resource locations for map
  const resourceData = useMemo(() => {
    const materials = db.materials || [];
    const baseLocations = [
      { name: 'Warehouse A', lat: 25.2854, lng: 51.5310 },
      { name: 'Warehouse B', lat: 25.3154, lng: 51.4810 },
      { name: 'Site Storage', lat: 25.2654, lng: 51.5810 },
      { name: 'Central Depot', lat: 25.3354, lng: 51.5110 },
      { name: 'East Facility', lat: 25.2954, lng: 51.6010 },
      { name: 'West Hub', lat: 25.2754, lng: 51.4610 }
    ];

    return materials.map((m, idx) => {
      const location = baseLocations[idx % baseLocations.length];
      return {
        id: m.id,
        type: m.type || 'Material',
        quantity: m.quantity || Math.floor(1000 + Math.random() * 5000),
        value: m.estimatedValue || Math.floor(50000 + Math.random() * 200000),
        location: location.name,
        lat: location.lat + (Math.random() - 0.5) * 0.02,
        lng: location.lng + (Math.random() - 0.5) * 0.02,
        status: m.reusable ? 'Reusable' : 'New'
      };
    });
  }, [db.materials]);

  // Initialize Google Maps
  useEffect(() => {
    if (view !== 'map') return;

    const apiKey = 'AIzaSyDqG7DFLBDmAavLs28eSQ8kRhURdGkuiJI';

    const initMap = () => {
      if (!window.google || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.2854, lng: 51.5310 },
        zoom: 11
      });

      resourceData.forEach((resource) => {
        const marker = new window.google.maps.Marker({
          position: { lat: resource.lat, lng: resource.lng },
          map: map,
          title: resource.type,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; font-family: Inter; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${resource.type}</h3>
              <div style="font-size: 12px; color: #475569;">
                <div style="margin-bottom: 4px;"><strong>Location:</strong> ${resource.location}</div>
                <div style="margin-bottom: 4px;"><strong>Quantity:</strong> ${resource.quantity.toLocaleString()}</div>
                <div style="margin-bottom: 4px;"><strong>Value:</strong> $${resource.value.toLocaleString()}</div>
                <div><strong>Status:</strong> ${resource.status}</div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });

      setMapLoaded(true);
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [view, resourceData]);

  // Complex Ontology Graph Component
  const OntologyGraph = ({ nodes, edges, width = 800, height = 600 }) => {
    const getNodeColor = (type) => {
      switch (type) {
        case 'system': return '#0047AB';
        case 'entity': return '#0284c7';
        case 'project': return '#10b981';
        case 'material': return '#f59e0b';
        case 'contractor': return '#8b5cf6';
        case 'bid': return '#ec4899';
        default: return '#64748b';
      }
    };

    const getEdgeStyle = (type) => {
      switch (type) {
        case 'primary': return { stroke: '#0047AB', width: 3, dasharray: 'none' };
        case 'secondary': return { stroke: '#94a3b8', width: 2, dasharray: 'none' };
        case 'relationship': return { stroke: '#cbd5e1', width: 1, dasharray: '4 2' };
        default: return { stroke: '#e2e8f0', width: 1, dasharray: 'none' };
      }
    };

    return (
      <div style={{ width: '100%', overflowX: 'auto', background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid var(--border)' }}>
        <svg width={width} height={height} style={{ minWidth: 800 }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Edges */}
          <g>
            {edges.map((edge, i) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const style = getEdgeStyle(edge.type);
              
              return (
                <line
                  key={i}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  strokeDasharray={style.dasharray}
                  opacity={edge.strength || 0.5}
                  markerEnd={edge.type === 'primary' ? 'url(#arrowhead)' : ''}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node, i) => {
              const color = getNodeColor(node.type);
              const isSelected = selectedNode?.id === node.id;
              
              return (
                <g
                  key={i}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(node)}
                  filter={isSelected ? 'url(#glow)' : 'none'}
                >
                  {/* Outer ring for selected */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.3"
                    >
                      <animate attributeName="r" from={node.size + 8} to={node.size + 15} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  
                  {/* Shadow circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size + 4}
                    fill={color}
                    opacity="0.2"
                  />
                  
                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={color}
                    stroke="white"
                    strokeWidth="3"
                  />
                  
                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + node.size + 16}
                    textAnchor="middle"
                    fontSize={node.tier === 0 ? "12" : "10"}
                    fontWeight={node.tier === 0 ? "800" : "600"}
                    fill="#0f172a"
                  >
                    {node.label}
                  </text>
                  
                  {/* Type badge */}
                  {node.tier === 2 && (
                    <text
                      x={node.x}
                      y={node.y + node.size + 28}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="600"
                      fill="#64748b"
                      textTransform="uppercase"
                    >
                      {node.type}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Legend */}
          <g transform="translate(20, 20)">
            <rect width="180" height="160" fill="white" rx="8" stroke="#cbd5e1" strokeWidth="1" />
            <text x="12" y="20" fontSize="11" fontWeight="700" fill="#0f172a">Entity Types</text>
            
            {[
              { type: 'system', label: 'System Hub', color: '#0047AB' },
              { type: 'entity', label: 'Core Entity', color: '#0284c7' },
              { type: 'project', label: 'Project', color: '#10b981' },
              { type: 'material', label: 'Material', color: '#f59e0b' },
              { type: 'contractor', label: 'Contractor', color: '#8b5cf6' },
              { type: 'bid', label: 'Bid', color: '#ec4899' }
            ].map((item, i) => (
              <g key={i} transform={`translate(12, ${35 + i * 20})`}>
                <circle cx="6" cy="0" r="5" fill={item.color} />
                <text x="18" y="4" fontSize="10" fill="#475569">{item.label}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  };

  const stats = useMemo(() => ({
    totalNodes: ontologyData.nodes.length,
    totalEdges: ontologyData.edges.length,
    entityTypes: new Set(ontologyData.nodes.map(n => n.type)).size,
    totalResources: resourceData.length,
    totalValue: resourceData.reduce((sum, r) => sum + r.value, 0)
  }), [ontologyData, resourceData]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadowLg)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Resource Ontology</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Complex entity relationships and geographic distribution</p>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'ontology', label: 'Ontology Graph' },
            { key: 'map', label: 'Geographic Map' },
            { key: 'data', label: 'Data Table' }
          ].map((v) => (
            <button
              key={v.key}
              className="btn"
              onClick={() => setView(v.key)}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                background: view === v.key ? 'var(--accent)' : 'white',
                color: view === v.key ? 'white' : 'var(--text)',
                border: view === v.key ? 'none' : '1px solid var(--border)',
                fontWeight: 700
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpiLabel">Total Entities</div>
          <div className="kpiValue">{stats.totalNodes}</div>
          <div className="kpiHint">Ontology nodes</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Relationships</div>
          <div className="kpiValue">{stats.totalEdges}</div>
          <div className="kpiHint">Connected edges</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Resources</div>
          <div className="kpiValue">{stats.totalResources}</div>
          <div className="kpiHint">Material inventory</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Total Value</div>
          <div className="kpiValue">${(stats.totalValue / 1000000).toFixed(1)}M</div>
          <div className="kpiHint">Inventory worth</div>
        </div>
      </div>

      {/* Ontology View */}
      {view === 'ontology' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Complex Ontology Network</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Hierarchical entity-relationship visualization with 3 tiers</p>
            </div>
            {selectedNode && (
              <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, minWidth: 200, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Selected</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{selectedNode.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Type: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selectedNode.type}</span></div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tier: {selectedNode.tier}</div>
              </div>
            )}
          </div>
          <OntologyGraph nodes={ontologyData.nodes} edges={ontologyData.edges} />
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Geographic Distribution</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              Materials ({resourceData.length})
            </span>
          </p>
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: 500, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              background: mapLoaded ? 'transparent' : '#f1f5f9'
            }} 
          >
            {!mapLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                <div>Loading map...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      {view === 'data' && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Resource Inventory</h3>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {resourceData.map((resource) => (
                  <tr key={resource.id}>
                    <td style={{ fontWeight: 700 }}>{resource.type}</td>
                    <td>{resource.location}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{resource.quantity.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>
                      ${resource.value.toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        background: resource.status === 'Reusable' ? 'rgba(16,185,129,.15)' : 'rgba(0,71,171,.15)',
                        color: resource.status === 'Reusable' ? '#059669' : '#0047AB',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        {resource.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
