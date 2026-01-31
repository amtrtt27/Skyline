import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_LABELS } from '../../store/ontology.js';

function colorForType(type) {
  const map = {
    Asset: '#60a5fa',
    Observation: '#93c5fd',
    Assessment: '#fbbf24',
    DebrisBatch: '#f97316',
    Plan: '#a78bfa',
    Task: '#c084fc',
    Resource: '#54e6a5',
    Bid: '#f472b6',
    Contract: '#f59e0b',
    Approval: '#34d399',
    Actor: '#e2e8f0',
    DecisionPacket: '#22c55e',
    Event: '#94a3b8'
  };
  return map[type] || '#9ca3af';
}

export default function OntologyGraph({ graph, onSelectNode }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const sim = useRef({
    nodes: [],
    edges: [],
    dragging: null,
    dragOffset: { x: 0, y: 0 },
    panning: false,
    panStart: { x: 0, y: 0 },
    viewStart: { x: 0, y: 0 }
  });

  const prepared = useMemo(() => {
    const nodes = (graph?.nodes || []).map((n, i) => ({
      ...n,
      x: (Math.cos(i) * 200) + (Math.random() - 0.5) * 80,
      y: (Math.sin(i) * 200) + (Math.random() - 0.5) * 80,
      vx: 0,
      vy: 0
    }));
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const edges = (graph?.edges || []).filter(e => nodeById.has(e.from) && nodeById.has(e.to));
    return { nodes, edges };
  }, [graph]);

  useEffect(() => {
    sim.current.nodes = prepared.nodes;
    sim.current.edges = prepared.edges;
  }, [prepared]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.floor(r.width * devicePixelRatio);
      canvas.height = Math.floor(r.height * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      stepPhysics();
      draw(ctx, canvas);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedId, hoverId]);

  function stepPhysics() {
    const nodes = sim.current.nodes;
    const edges = sim.current.edges;
    if (!nodes.length) return;

    // Basic force layout
    const repulsion = 2200;
    const spring = 0.012;
    const damping = 0.86;
    const centerForce = 0.0009;

    // Pairwise repulsion (O(n^2)  fine for MVP scale)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 0.01;
        const f = repulsion / d2;
        const fx = (dx / Math.sqrt(d2)) * f;
        const fy = (dy / Math.sqrt(d2)) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }

    // Springs along edges
    for (const e of edges) {
      const a = nodes.find(n => n.id === e.from);
      const b = nodes.find(n => n.id === e.to);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const target = 120;
      const k = spring * (dist - target);
      const fx = (dx / dist) * k;
      const fy = (dy / dist) * k;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Centering + integrate
    for (const n of nodes) {
      if (sim.current.dragging && sim.current.dragging.id === n.id) {
        n.vx = 0; n.vy = 0;
        continue;
      }
      n.vx += -n.x * centerForce;
      n.vy += -n.y * centerForce;
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx * 0.015;
      n.y += n.vy * 0.015;
    }
  }

  function worldToScreen(pt) {
    return {
      x: pt.x * view.scale + view.x,
      y: pt.y * view.scale + view.y
    };
  }

  function screenToWorld(pt) {
    return {
      x: (pt.x - view.x) / view.scale,
      y: (pt.y - view.y) / view.scale
    };
  }

  function findNodeAt(screenX, screenY) {
    const { nodes } = sim.current;
    const w = screenToWorld({ x: screenX, y: screenY });
    let best = null;
    let bestD = 1e9;
    for (const n of nodes) {
      const dx = n.x - w.x;
      const dy = n.y - w.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 16 && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  function draw(ctx, canvas) {
    const { nodes, edges } = sim.current;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    // background
    ctx.clearRect(0, 0, w, h);

    // edges
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    for (const e of edges) {
      const a = nodes.find(n => n.id === e.from);
      const b = nodes.find(n => n.id === e.to);
      if (!a || !b) continue;
      const pa = worldToScreen(a);
      const pb = worldToScreen(b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();

      // edge label (small)
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2;
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '11px ui-sans-serif, system-ui';
      ctx.fillText(e.type, mx + 4, my - 4);
    }
    ctx.restore();

    // nodes
    for (const n of nodes) {
      const p = worldToScreen(n);
      const radius = n.id === selectedId ? 14 : n.id === hoverId ? 12 : 11;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colorForType(n.type);
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.globalAlpha = 1;

      // outline
      ctx.strokeStyle = n.id === selectedId ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.35)';
      ctx.lineWidth = n.id === selectedId ? 2 : 1;
      ctx.stroke();

      // label
      ctx.fillStyle = 'rgba(255,255,255,.86)';
      ctx.font = '12px ui-sans-serif, system-ui';
      const text = n.label.length > 28 ? n.label.slice(0, 27) + '' : n.label;
      ctx.fillText(text, p.x + 14, p.y + 4);
    }

    // legend
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '12px ui-sans-serif, system-ui';
    ctx.fillText('Drag nodes  Scroll to zoom  Drag empty space to pan  Click for details', 12, h - 14);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (sim.current.dragging) {
        const w = screenToWorld({ x, y });
        sim.current.dragging.x = w.x - sim.current.dragOffset.x;
        sim.current.dragging.y = w.y - sim.current.dragOffset.y;
        return;
      }
      if (sim.current.panning) {
        const dx = x - sim.current.panStart.x;
        const dy = y - sim.current.panStart.y;
        setView(v => ({ ...v, x: sim.current.viewStart.x + dx, y: sim.current.viewStart.y + dy }));
        return;
      }

      const n = findNodeAt(x, y);
      setHoverId(n ? n.id : null);
      canvas.style.cursor = n ? 'grab' : 'default';
    };

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const n = findNodeAt(x, y);
      if (n) {
        const w = screenToWorld({ x, y });
        sim.current.dragging = n;
        sim.current.dragOffset = { x: w.x - n.x, y: w.y - n.y };
        canvas.style.cursor = 'grabbing';
      } else {
        sim.current.panning = true;
        sim.current.panStart = { x, y };
        sim.current.viewStart = { x: view.x, y: view.y };
      }
    };

    const onMouseUp = (e) => {
      if (sim.current.dragging) {
        sim.current.dragging = null;
      }
      sim.current.panning = false;
      canvas.style.cursor = hoverId ? 'grab' : 'default';
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const n = findNodeAt(x, y);
      if (n) {
        setSelectedId(n.id);
        onSelectNode?.(n);
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const before = screenToWorld({ x, y });
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.08 : 0.92;

      setView((v) => {
        const nextScale = Math.max(0.35, Math.min(2.1, v.scale * factor));
        const after = { x: before.x * nextScale + v.x, y: before.y * nextScale + v.y };
        const dx = x - after.x;
        const dy = y - after.y;
        return { x: v.x + dx, y: v.y + dy, scale: nextScale };
      });
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [view.x, view.y, view.scale, onSelectNode, hoverId]);

  const selected = useMemo(() => prepared.nodes.find(n => n.id === selectedId) || null, [prepared, selectedId]);

  return (
    <div className="grid2" style={{ gridTemplateColumns: '1.2fr .8fr' }}>
      <div>
        <canvas ref={canvasRef} className="graphCanvas" />
      </div>

      <div className="card" style={{ height: '520px', overflow: 'auto' }}>
        <div className="cardHeader">
          <div>
            <h3 className="cardTitle">Object inspector</h3>
            <p className="cardSub">Click a node to see its fields and relations.</p>
          </div>
        </div>

        {!selected ? (
          <div className="muted">
            <div style={{ marginBottom: 10 }}>No object selected.</div>
            <div className="small">This graph renders your core ontology objects and explicit relationship edges.</div>
          </div>
        ) : (
          <div>
            <div className="pill" style={{ marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: colorForType(selected.type) }} />
              <strong style={{ color: 'rgba(255,255,255,.92)' }}>{selected.label}</strong>
              <span style={{ opacity: .75 }}> {TYPE_LABELS[selected.type] || selected.type}</span>
            </div>

            <div className="small muted" style={{ marginBottom: 10 }}>ID: {selected.id}</div>

            <div className="card" style={{ padding: 12, background: 'rgba(255,255,255,.03)' }}>
              <div className="label">Fields</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12, color: 'rgba(255,255,255,.78)' }}>
{JSON.stringify(selected.meta || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
