import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';
import MapPanel from '../../components/maps/MapPanel.jsx';
import SatelliteMap from '../../components/maps/SatelliteMap.jsx';

export default function AppHome() {
  const { db, auth, getProjectsForUser, getDamageReport } = useStore();
  const nav = useNavigate();
  const user = auth.user;
  const projects = getProjectsForUser();
  const [selectedMetric, setSelectedMetric] = useState('projects');

  const dashboardData = useMemo(() => {
    const materials = db.materials || [];
    const bids = db.bids || [];
    const actors = (db.actors || []).filter(a => a.role === 'contractor');

    // Advanced metrics
    const kpis = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => ['Published', 'Awarded', 'Licensed', 'InProgress'].includes(p.status)).length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      completionRate: projects.length > 0 ? (projects.filter(p => p.status === 'Completed').length / projects.length * 100).toFixed(1) : 0,
      totalBudget: 18.7,
      spentBudget: 11.8,
      budgetEfficiency: ((11.8 / 14.2) * 100).toFixed(1),
      activeContractors: actors.length,
      avgProjectDuration: 47,
      riskScore: 23
    };

    // 12-month timeline with multiple data series
    const timeline = [
      { month: 'Jan', projects: 45, completed: 12, budget: 2.4, active: 33, efficiency: 78, risk: 24 },
      { month: 'Feb', projects: 52, completed: 18, budget: 2.8, active: 34, efficiency: 81, risk: 22 },
      { month: 'Mar', projects: 58, completed: 24, budget: 3.2, active: 34, efficiency: 83, risk: 21 },
      { month: 'Apr', projects: 64, completed: 31, budget: 3.6, active: 33, efficiency: 85, risk: 19 },
      { month: 'May', projects: 71, completed: 38, budget: 4.1, active: 33, efficiency: 87, risk: 18 },
      { month: 'Jun', projects: 76, completed: 45, budget: 4.5, active: 31, efficiency: 89, risk: 16 },
      { month: 'Jul', projects: 82, completed: 52, budget: 4.8, active: 30, efficiency: 90, risk: 15 },
      { month: 'Aug', projects: 88, completed: 59, budget: 5.2, active: 29, efficiency: 91, risk: 14 },
      { month: 'Sep', projects: 94, completed: 67, budget: 5.6, active: 27, efficiency: 92, risk: 12 },
      { month: 'Oct', projects: 101, completed: 75, budget: 6.0, active: 26, efficiency: 93, risk: 11 },
      { month: 'Nov', projects: 107, completed: 82, budget: 6.4, active: 25, efficiency: 94, risk: 10 },
      { month: 'Dec', projects: 113, completed: 89, budget: 6.8, active: 24, efficiency: 95, risk: 9 }
    ];

    // Regional heatmap data
    const regions = [
      { name: 'Doha Downtown', projects: 28, budget: 2.4, completion: 85, efficiency: 92, criticality: 'high' },
      { name: 'West Bay', projects: 22, budget: 3.1, completion: 72, efficiency: 88, criticality: 'medium' },
      { name: 'Al Sadd', projects: 18, budget: 1.8, completion: 91, efficiency: 95, criticality: 'low' },
      { name: 'The Pearl', projects: 15, budget: 2.9, completion: 68, efficiency: 84, criticality: 'medium' },
      { name: 'Lusail', projects: 12, budget: 1.6, completion: 78, efficiency: 89, criticality: 'low' },
      { name: 'Al Wakrah', projects: 9, budget: 0.9, completion: 95, efficiency: 97, criticality: 'low' }
    ];

    // Project categories with trends
    const categories = [
      { name: 'Infrastructure', count: 32, budget: 4.2, trend: 12, velocity: 'fast' },
      { name: 'Residential', count: 28, budget: 3.1, trend: 8, velocity: 'medium' },
      { name: 'Commercial', count: 21, budget: 2.8, trend: 5, velocity: 'medium' },
      { name: 'Healthcare', count: 14, budget: 2.1, trend: -2, velocity: 'slow' },
      { name: 'Education', count: 11, budget: 1.4, trend: 3, velocity: 'slow' },
      { name: 'Transportation', count: 7, budget: 1.1, trend: 15, velocity: 'fast' }
    ];

    // Resource utilization matrix
    const resources = [
      { type: 'Concrete', allocated: 12450, used: 9845, available: 2605, efficiency: 79 },
      { type: 'Steel', allocated: 8920, used: 7234, available: 1686, efficiency: 81 },
      { type: 'Labor Hours', allocated: 45600, used: 38920, available: 6680, efficiency: 85 },
      { type: 'Equipment', allocated: 156, used: 134, available: 22, efficiency: 86 },
      { type: 'Budget (M)', allocated: 18.7, used: 11.8, available: 6.9, efficiency: 63 }
    ];

    return { kpis, timeline, regions, categories, resources };
  }, [projects, db, getDamageReport]);

  // Advanced Multi-Series Line Chart
  const AdvancedLineChart = ({ data, series, height = 280 }) => {
    const maxValue = Math.max(...data.flatMap(d => series.map(s => d[s.key] || 0)));
    
    return (
      <div style={{ position: 'relative', height, fontFamily: 'var(--font)', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {/* Y-axis */}
        <div style={{ position: 'absolute', left: 20, top: 20, bottom: 40, width: 35, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Grid lines */}
        <svg style={{ position: 'absolute', left: 65, top: 20, right: 20, bottom: 40 }} width="calc(100% - 85px)" height={height - 60}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: s.color, stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: s.color, stopOpacity: 0 }} />
              </linearGradient>
            ))}
          </defs>
          
          {/* Horizontal grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line key={i} x1="0" y1={(1 - p) * (height - 60)} x2="100%" y2={(1 - p) * (height - 60)} stroke="#e5e7eb" strokeWidth="1" />
          ))}
          
          {/* Data lines */}
          {series.map((s, sIdx) => {
            const points = data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = (1 - (d[s.key] || 0) / maxValue) * (height - 60);
              return `${x},${y}`;
            }).join(' ');
            
            const areaPoints = `0,${height - 60} ${points} 100,${height - 60}`;
            
            return (
              <g key={sIdx}>
                <polygon points={areaPoints} fill={`url(#gradient-${sIdx})`} />
                <polyline points={points} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 100;
                  const y = (1 - (d[s.key] || 0) / maxValue) * (height - 60);
                  return <circle key={i} cx={`${x}%`} cy={y} r="4" fill={s.color} />;
                })}
              </g>
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div style={{ position: 'absolute', left: 65, right: 20, bottom: 20, display: 'flex', justifyContent: 'space-between' }}>
          {data.map((d, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>{d.month}</div>
          ))}
        </div>
        
        {/* Legend */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 16, background: 'white', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: s.color, borderRadius: 3 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Heatmap Component
  const Heatmap = ({ data }) => {
    const maxProjects = Math.max(...data.map(r => r.projects));
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((region, idx) => {
          const intensity = (region.projects / maxProjects);
          const bgColor = region.criticality === 'high' ? 'rgba(239,68,68,' + intensity + ')' :
                         region.criticality === 'medium' ? 'rgba(245,158,11,' + intensity + ')' :
                         'rgba(16,185,129,' + intensity + ')';
          
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: bgColor, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 4 }}>{region.name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#4b5563' }}>
                  <span><strong>{region.projects}</strong> projects</span>
                  <span><strong>{region.completion}%</strong> complete</span>
                  <span><strong>{region.efficiency}%</strong> efficient</span>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1f2937' }}>${region.budget}M</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Resource Matrix
  const ResourceMatrix = ({ resources }) => (
    <div style={{ display: 'grid', gap: 2, background: '#e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 2, background: '#1f2937', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <div>Resource Type</div>
        <div style={{ textAlign: 'right' }}>Allocated</div>
        <div style={{ textAlign: 'right' }}>Used</div>
        <div style={{ textAlign: 'right' }}>Available</div>
        <div style={{ textAlign: 'right' }}>Efficiency</div>
      </div>
      {resources.map((r, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 2, background: 'white', padding: '16px', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.type}</div>
          <div style={{ textAlign: 'right', color: '#6b7280', fontWeight: 600 }}>{r.allocated.toLocaleString()}</div>
          <div style={{ textAlign: 'right', color: '#0047AB', fontWeight: 700 }}>{r.used.toLocaleString()}</div>
          <div style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{r.available.toLocaleString()}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', background: r.efficiency >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 12, fontWeight: 800, color: r.efficiency >= 80 ? '#059669' : '#d97706' }}>
              {r.efficiency}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font)' }}>
      {/* Advanced Header */}
      <div style={{ marginBottom: 32, padding: 24, background: 'linear-gradient(135deg, #0047AB 0%, #1E90FF 100%)', borderRadius: 16, color: 'white', boxShadow: '0 8px 24px rgba(0,71,171,0.25)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Command Center</h1>
        <p style={{ fontSize: 14, opacity: 0.9 }}>
          Real-time operational intelligence for <strong>{user?.regionName || 'Doha'}</strong> — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12 }}>
          <div><strong>System Status:</strong> Operational</div>
          <div><strong>Data Sync:</strong> Live</div>
          <div><strong>Risk Level:</strong> {dashboardData.kpis.riskScore}% Low</div>
        </div>
      </div>

      {/* Advanced KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'linear-gradient(135deg, #0047AB 0%, #1E90FF 100%)', padding: 24, borderRadius: 12, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,71,171,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Projects</div>
          <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>{dashboardData.kpis.totalProjects}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{dashboardData.kpis.activeProjects} active • {dashboardData.kpis.completionRate}% completion rate</div>
          <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 48, opacity: 0.15 }}>◆</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: 24, borderRadius: 12, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Budget Tracking</div>
          <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>${dashboardData.kpis.totalBudget}M</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>${dashboardData.kpis.spentBudget}M spent • {dashboardData.kpis.budgetEfficiency}% efficiency</div>
          <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 48, opacity: 0.15 }}>▲</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: 24, borderRadius: 12, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(245,158,11,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Performance Index</div>
          <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>95%</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{dashboardData.kpis.avgProjectDuration} days avg duration</div>
          <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 48, opacity: 0.15 }}>●</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', padding: 24, borderRadius: 12, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(139,92,246,0.15)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Risk Assessment</div>
          <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>{dashboardData.kpis.riskScore}%</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Low risk • {dashboardData.kpis.activeContractors} contractors active</div>
          <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 48, opacity: 0.15 }}>■</div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Multi-Dimensional Timeline Analysis</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Projects, efficiency, and risk metrics over 12 months</p>
          <AdvancedLineChart 
            data={dashboardData.timeline}
            series={[
              { key: 'projects', label: 'Total Projects', color: '#0047AB' },
              { key: 'completed', label: 'Completed', color: '#10b981' },
              { key: 'efficiency', label: 'Efficiency %', color: '#f59e0b' }
            ]}
            height={320}
          />
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Regional Heat Matrix</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Priority zones with completion and efficiency metrics</p>
          <Heatmap data={dashboardData.regions} />
        </div>
      </div>

      {/* Resource Utilization Matrix */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Resource Utilization Matrix</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Real-time allocation and efficiency tracking</p>
        <ResourceMatrix resources={dashboardData.resources} />
      </div>

      {/* Category Cards with Trends */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Project Categories & Velocity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {dashboardData.categories.map((cat, idx) => (
            <div key={idx} style={{ padding: 20, background: cat.velocity === 'fast' ? 'rgba(16,185,129,0.05)' : cat.velocity === 'medium' ? 'rgba(245,158,11,0.05)' : 'rgba(107,114,128,0.05)', borderRadius: 12, border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{cat.count}</div>
                </div>
                <div style={{ padding: '4px 8px', background: cat.trend > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 6, fontSize: 12, fontWeight: 800, color: cat.trend > 0 ? '#059669' : '#dc2626' }}>
                  {cat.trend > 0 ? '↑' : '↓'} {Math.abs(cat.trend)}%
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>${cat.budget}M allocated</div>
              <div style={{ marginTop: 12, display: 'inline-flex', padding: '4px 10px', background: 'rgba(0,71,171,0.08)', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#0047AB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {cat.velocity} velocity
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Operational Territory</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Geographic coverage - Doha, Qatar</p>
        <MapPanel lat={25.2854} lng={51.5310} zoom={12} height={400} label="Operations Center" />
      </div>

      {/* Satellite Map */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Satellite View</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>High-resolution aerial imagery of operational area</p>
        <SatelliteMap lat={25.2854} lng={51.5310} zoom={13} height={450} />
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <button className="btn btnPrimary" onClick={() => nav('/app/projects')} style={{ padding: 16, fontSize: 15 }}>View All Projects</button>
          <button className="btn" onClick={() => nav('/app/bids')} style={{ padding: 16, fontSize: 15 }}>Manage Bids</button>
          <button className="btn" onClick={() => nav('/app/resources')} style={{ padding: 16, fontSize: 15 }}>Resource Graph</button>
          <button className="btn" onClick={() => nav('/app/statistics')} style={{ padding: 16, fontSize: 15 }}>Advanced Analytics</button>
        </div>
      </div>
    </div>
  );
}
