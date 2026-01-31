import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/DataStore.jsx';

export default function Statistics() {
  const { db, getProjectsForUser } = useStore();
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('desc');
  const [view, setView] = useState('overview');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  
  const projects = getProjectsForUser();
  const bids = db.bids || [];
  const actors = db.actors || [];

  const advancedData = useMemo(() => {
    const contractors = actors.filter(a => a.role === 'contractor').map(contractor => {
      const contractorBids = bids.filter(b => b.contractorId === contractor.id);
      const awarded = contractorBids.filter(b => b.status === 'Awarded').length;
      const total = contractorBids.length;
      const winRate = total > 0 ? (awarded / total * 100) : 0;
      const avgScore = 70 + Math.random() * 25;
      const qualityIndex = 75 + Math.random() * 20;
      
      return {
        id: contractor.id,
        name: contractor.name,
        awarded,
        total,
        winRate,
        avgScore,
        qualityIndex,
        verified: Math.random() > 0.3
      };
    });

    const timeSeriesData = [
      { period: 'Q1', projects: 45, budget: 2.8, efficiency: 82, completion: 78 },
      { period: 'Q2', projects: 58, budget: 3.6, efficiency: 85, completion: 82 },
      { period: 'Q3', projects: 71, budget: 4.4, efficiency: 88, completion: 85 },
      { period: 'Q4', projects: 89, budget: 5.5, efficiency: 91, completion: 89 }
    ];

    const categoryData = [
      { name: 'Infrastructure', value: 32, budget: 4.2, growth: 12 },
      { name: 'Residential', value: 28, budget: 3.1, growth: 8 },
      { name: 'Commercial', value: 21, budget: 2.8, growth: 5 },
      { name: 'Healthcare', value: 14, budget: 2.1, growth: -2 },
      { name: 'Education', value: 11, budget: 1.4, growth: 3 }
    ];

    return { contractors, timeSeriesData, categoryData };
  }, [projects, bids, actors]);

  const sortData = (data, key) => {
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * modifier;
      return (aVal - bVal) * modifier;
    });
  };

  // Responsive Interactive Line Chart
  const InteractiveLineChart = ({ data, metrics }) => {
    const [activeMetric, setActiveMetric] = useState(metrics[0].key);
    
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {metrics.map((m, i) => (
            <button
              key={i}
              onClick={() => setActiveMetric(m.key)}
              style={{
                padding: '6px 14px',
                background: activeMetric === m.key ? m.color : 'white',
                color: activeMetric === m.key ? '#fff' : '#475569',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ width: '100%', height: 280, background: '#f8fafc', borderRadius: 8, padding: 20, border: '1px solid var(--border)', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: metrics.find(m => m.key === activeMetric)?.color || '#0047AB', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: metrics.find(m => m.key === activeMetric)?.color || '#0047AB', stopOpacity: 0 }} />
              </linearGradient>
            </defs>

            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <g key={i}>
                <line x1={40} y1={20 + (180 * (1 - p))} x2={560} y2={20 + (180 * (1 - p))} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
                <text x={30} y={20 + (180 * (1 - p))} textAnchor="end" alignmentBaseline="middle" fill="#64748b" fontSize="10" fontWeight="600">
                  {Math.round(100 * p)}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <polygon
              points={[
                '40,200',
                ...data.map((d, i) => `${40 + (i * (520 / (data.length - 1)))},${200 - ((d[activeMetric] || 0) / 100) * 180}`),
                '560,200'
              ].join(' ')}
              fill="url(#chartGrad)"
            />

            {/* Line */}
            <polyline
              points={data.map((d, i) => `${40 + (i * (520 / (data.length - 1)))},${200 - ((d[activeMetric] || 0) / 100) * 180}`).join(' ')}
              fill="none"
              stroke={metrics.find(m => m.key === activeMetric)?.color || '#0047AB'}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Points */}
            {data.map((d, i) => {
              const x = 40 + (i * (520 / (data.length - 1)));
              const y = 200 - ((d[activeMetric] || 0) / 100) * 180;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={metrics.find(m => m.key === activeMetric)?.color || '#0047AB'}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text x={x} y={220} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">{d.period}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // Stacked Bar Chart
  const StackedBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((item, idx) => {
          const percentage = (item.value / maxValue) * 100;
          const isHovered = hoveredBar === idx;
          
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{item.name}</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{item.value}</span>
                  <span style={{ color: 'var(--muted)' }}>${item.budget}M</span>
                  <span style={{ color: item.growth >= 0 ? '#10b981' : '#dc2626', fontWeight: 700 }}>
                    {item.growth >= 0 ? '↑' : '↓'} {Math.abs(item.growth)}%
                  </span>
                </div>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 10, background: '#e2e8f0', borderRadius: 5 }}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0047AB 0%, #10b981 100%)',
                    borderRadius: 5,
                    transition: 'all 0.4s',
                    transform: isHovered ? 'scaleY(1.4)' : 'scaleY(1)',
                    transformOrigin: 'left center'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Data Table
  const DataTable = ({ data, columns }) => (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{
                  padding: 14,
                  textAlign: col.align || 'left',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  cursor: col.sortKey ? 'pointer' : 'default',
                  borderBottom: '2px solid var(--border)'
                }}
                onClick={() => col.sortKey && setSortBy(col.sortKey)}
              >
                {col.label} {col.sortKey && sortBy === col.sortKey && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortData(data, sortBy).map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
              {columns.map((col, i) => (
                <td key={i} style={{ padding: 14, textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const contractorColumns = [
    { label: 'Contractor', key: 'name', sortKey: 'name', render: (row) => <span style={{ fontWeight: 700 }}>{row.name}</span> },
    { label: 'Total', key: 'total', sortKey: 'total', align: 'center', render: (row) => <span style={{ fontWeight: 700 }}>{row.total}</span> },
    { label: 'Win Rate', key: 'winRate', sortKey: 'winRate', align: 'center', render: (row) => (
      <span style={{
        padding: '4px 10px',
        background: row.winRate >= 70 ? 'rgba(16,185,129,.15)' : row.winRate >= 50 ? 'rgba(245,158,11,.15)' : 'rgba(220,38,38,.15)',
        color: row.winRate >= 70 ? '#059669' : row.winRate >= 50 ? '#d97706' : '#dc2626',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800
      }}>
        {row.winRate.toFixed(1)}%
      </span>
    )},
    { label: 'Score', key: 'avgScore', sortKey: 'avgScore', align: 'center', render: (row) => <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{row.avgScore.toFixed(1)}</span> },
    { label: 'Quality', key: 'qualityIndex', align: 'center', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 50, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
          <div style={{ width: `${row.qualityIndex}%`, height: '100%', background: 'linear-gradient(90deg, #0047AB 0%, #10b981 100%)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{row.qualityIndex.toFixed(0)}%</span>
      </div>
    )},
    { label: 'Status', key: 'verified', align: 'center', render: (row) => (
      <span style={{
        padding: '4px 8px',
        background: row.verified ? 'rgba(16,185,129,.15)' : 'rgba(148,163,184,.15)',
        color: row.verified ? '#059669' : '#64748b',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 700
      }}>
        {row.verified ? 'VERIFIED' : 'PENDING'}
      </span>
    )}
  ];

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadowLg)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Analytics Platform</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Performance metrics and data intelligence</p>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['overview', 'contractors', 'trends'].map((v) => (
            <button
              key={v}
              className="btn"
              onClick={() => setView(v)}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                background: view === v ? 'var(--accent)' : 'white',
                color: view === v ? 'white' : 'var(--text)',
                border: view === v ? 'none' : '1px solid var(--border)',
                fontWeight: 700
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpiLabel">Contractors</div>
          <div className="kpiValue">{advancedData.contractors.length}</div>
          <div className="kpiHint">{advancedData.contractors.filter(c => c.verified).length} verified</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Avg Win Rate</div>
          <div className="kpiValue">{(advancedData.contractors.reduce((sum, c) => sum + c.winRate, 0) / advancedData.contractors.length).toFixed(1)}%</div>
          <div className="kpiHint">Success rate</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Avg Score</div>
          <div className="kpiValue">{(advancedData.contractors.reduce((sum, c) => sum + c.avgScore, 0) / advancedData.contractors.length).toFixed(1)}</div>
          <div className="kpiHint">Performance</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Total Budget</div>
          <div className="kpiValue">${advancedData.categoryData.reduce((sum, c) => sum + c.budget, 0).toFixed(1)}M</div>
          <div className="kpiHint">All categories</div>
        </div>
      </div>

      {view === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Category Distribution</h3>
            <StackedBarChart data={advancedData.categoryData} />
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Quarterly Timeline</h3>
            <InteractiveLineChart
              data={advancedData.timeSeriesData}
              metrics={[
                { key: 'projects', label: 'Projects', color: '#0047AB' },
                { key: 'efficiency', label: 'Efficiency', color: '#10b981' },
                { key: 'completion', label: 'Completion', color: '#0284c7' }
              ]}
            />
          </div>
        </div>
      )}

      {view === 'contractors' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Contractor Performance</h3>
            <button
              className="btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
          <DataTable data={advancedData.contractors} columns={contractorColumns} />
        </div>
      )}

      {view === 'trends' && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Multi-Metric Analysis</h3>
          <InteractiveLineChart
            data={advancedData.timeSeriesData}
            metrics={[
              { key: 'projects', label: 'Projects', color: '#0047AB' },
              { key: 'budget', label: 'Budget', color: '#10b981' },
              { key: 'efficiency', label: 'Efficiency', color: '#f59e0b' },
              { key: 'completion', label: 'Completion', color: '#0284c7' }
            ]}
          />
        </div>
      )}
    </div>
  );
}
