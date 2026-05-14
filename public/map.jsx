// Stylized map visualization — original design, not a clone of any branded map UI.
// Draws a soft topographic-style canvas with two pins and an animated route line.

const { useMemo, useEffect, useRef, useState } = React;

function MapView({ from, to, route, mode }) {
  // Project the two lat/lng points into a 100x100 viewBox space, padded.
  const projected = useMemo(() => {
    if (!from || !to) return null;
    const lats = [from.lat, to.lat];
    const lngs = [from.lng, to.lng];
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = Math.max(0.02, (maxLat - minLat) * 0.45);
    const padLng = Math.max(0.02, (maxLng - minLng) * 0.45);
    const project = (p) => {
      const x = ((p.lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * 100;
      const y = 100 - ((p.lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * 100;
      return { x, y };
    };
    return { a: project(from), b: project(to) };
  }, [from, to]);

  // Generate a wiggly route path between A and B (deterministic from coords)
  const routePath = useMemo(() => {
    if (!projected) return '';
    const { a, b } = projected;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len < 0.01) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    const nx = -dy / len, ny = dx / len;
    const seed = (Math.abs(from.lat + to.lng) * 100) % 1;
    const segs = 5;
    let d = `M ${a.x} ${a.y}`;
    for (let i = 1; i <= segs; i++) {
      const t = i / (segs + 1);
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const wobble = Math.sin((i + seed * 5) * 1.3) * 4 * (1 - Math.abs(t - 0.5) * 1.4);
      d += ` L ${(px + nx * wobble).toFixed(2)} ${(py + ny * wobble).toFixed(2)}`;
    }
    d += ` L ${b.x} ${b.y}`;
    return d;
  }, [projected, from, to]);

  // Sketched background "streets" — deterministic noise lines
  const bgLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 22; i++) {
      const y = (i * 4.7 + 3) % 100;
      const skew = Math.sin(i * 1.3) * 3;
      lines.push({ x1: -5, y1: y, x2: 105, y2: y + skew, w: i % 4 === 0 ? 0.5 : 0.22 });
    }
    for (let i = 0; i < 18; i++) {
      const x = (i * 5.5 + 2) % 100;
      const skew = Math.cos(i * 1.6) * 4;
      lines.push({ x1: x, y1: -5, x2: x + skew, y2: 105, w: i % 5 === 0 ? 0.45 : 0.18, diag: true });
    }
    return lines;
  }, []);

  // Animate dash offset for the route
  const [dashOffset, setDashOffset] = useState(0);
  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000;
      last = t;
      setDashOffset((o) => (o - dt * 18) % 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!projected) return null;
  const { a, b } = projected;

  const modeColor = {
    drive:   'oklch(0.62 0.14 250)',
    transit: 'oklch(0.62 0.13 155)',
    walk:    'oklch(0.68 0.14 35)',
    bike:    'oklch(0.65 0.14 190)',
  }[mode] || 'oklch(0.62 0.14 250)';

  return (
    <div style={mapStyles.wrap}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={mapStyles.svg}>
        <defs>
          <radialGradient id="terrain" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#f0ece2" />
            <stop offset="60%" stopColor="#e7e1d2" />
            <stop offset="100%" stopColor="#ddd6c3" />
          </radialGradient>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.15" />
          </pattern>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
        </defs>

        {/* Terrain base */}
        <rect x="0" y="0" width="100" height="100" fill="url(#terrain)" />
        <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />

        {/* Park / water blobs for visual interest */}
        <ellipse cx="22" cy="78" rx="18" ry="11" fill="oklch(0.86 0.05 150)" opacity="0.55" />
        <ellipse cx="80" cy="30" rx="22" ry="14" fill="oklch(0.83 0.06 220)" opacity="0.5" />
        <ellipse cx="64" cy="68" rx="9" ry="6" fill="oklch(0.86 0.05 150)" opacity="0.4" />

        {/* "Streets" */}
        {bgLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.diag ? "rgba(70,55,30,0.18)" : "rgba(70,55,30,0.22)"}
            strokeWidth={l.w} />
        ))}

        {/* Major arterial (faux) */}
        <path d="M -5 55 Q 30 50 55 58 T 110 50" fill="none" stroke="#ffffff" strokeWidth="2.2" />
        <path d="M -5 55 Q 30 50 55 58 T 110 50" fill="none" stroke="rgba(70,55,30,0.35)" strokeWidth="0.3" />
        <path d="M 48 -5 Q 52 30 45 55 T 55 105" fill="none" stroke="#ffffff" strokeWidth="1.8" />
        <path d="M 48 -5 Q 52 30 45 55 T 55 105" fill="none" stroke="rgba(70,55,30,0.3)" strokeWidth="0.25" />

        {/* Route — base white halo */}
        <path d={routePath} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Route — colored line */}
        <path d={routePath} fill="none" stroke={modeColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Route — animated dashes */}
        <path d={routePath} fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round"
          strokeDasharray="1.5 2.5" strokeDashoffset={dashOffset} opacity="0.9" />

        {/* Pins */}
        <Pin x={a.x} y={a.y} color="#1a1a1a" label="A" />
        <Pin x={b.x} y={b.y} color={modeColor} label="B" />
      </svg>

      {/* Overlay: compass & scale */}
      <div style={mapStyles.compass}>
        <div style={mapStyles.compassN}>N</div>
        <svg viewBox="0 0 24 24" width="22" height="22">
          <polygon points="12,3 15,12 12,10 9,12" fill="#1a1a1a" />
          <polygon points="12,21 9,12 12,14 15,12" fill="#aaa" />
        </svg>
      </div>
      <div style={mapStyles.scale}>
        <div style={mapStyles.scaleBar}>
          <span></span><span></span><span></span><span></span>
        </div>
        <div style={mapStyles.scaleLabel} className="mono">0 — {Math.max(1, Math.round((route?.drive?.km || 5) / 4))} km</div>
      </div>

      {/* Mode badge */}
      <div style={{ ...mapStyles.modeBadge, background: modeColor }}>
        {modeIcon(mode)} <span>{modeLabel(mode)}</span>
      </div>
    </div>
  );
}

function Pin({ x, y, color, label }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="1.4" rx="2.2" ry="0.7" fill="rgba(0,0,0,0.18)" />
      <path d="M 0 -6 C -3 -6 -4.5 -3.5 -4.5 -1.5 C -4.5 1 0 1 0 1 C 0 1 4.5 1 4.5 -1.5 C 4.5 -3.5 3 -6 0 -6 Z"
        fill={color} stroke="#fff" strokeWidth="0.5" />
      <circle cx="0" cy="-2.5" r="1.2" fill="#fff" />
      <text x="0" y="-1.9" textAnchor="middle" fontSize="1.7" fontWeight="700" fill={color}>{label}</text>
    </g>
  );
}

function modeIcon(mode) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (mode === 'transit') return <svg {...common}><rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 11h14"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M8 17l-2 3M16 17l2 3"/></svg>;
  if (mode === 'walk')    return <svg {...common}><circle cx="13" cy="4" r="2"/><path d="M7 22l3-7-3-3 4-5 4 4 3 1"/><path d="M10 15l-2 7"/></svg>;
  if (mode === 'bike')    return <svg {...common}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h4l4 7M12 5h3l-2 5"/></svg>;
  return <svg {...common}><path d="M5 17h14l-2-6H7l-2 6z"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>;
}

function modeLabel(mode) {
  return { drive: 'Carro', transit: 'Transp. público', walk: 'A pé', bike: 'Bicicleta' }[mode] || 'Carro';
}

const mapStyles = {
  wrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 11',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid var(--line)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.04)',
    background: '#e7e1d2',
  },
  svg: { width: '100%', height: '100%', display: 'block' },
  compass: {
    position: 'absolute', top: 12, right: 12,
    width: 44, height: 44, borderRadius: 22,
    background: 'rgba(255,255,255,0.92)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  compassN: { fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#1a1a1a', marginTop: -2 },
  scale: {
    position: 'absolute', bottom: 12, left: 12,
    display: 'flex', flexDirection: 'column', gap: 4,
    background: 'rgba(255,255,255,0.92)',
    padding: '6px 8px', borderRadius: 6,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  scaleBar: {
    display: 'flex', gap: 0, height: 6,
  },
  scaleLabel: { fontSize: 10, color: '#1a1a1a', letterSpacing: 0.3 },
  modeBadge: {
    position: 'absolute', top: 12, left: 12,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    color: '#fff', padding: '6px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 600,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  },
};

// Inject CSS for scale bar segments
const styleEl = document.createElement('style');
styleEl.textContent = `
  .__scalebar span { display:inline-block; width: 12px; height: 6px; border: 1px solid #1a1a1a; }
  .__scalebar span:nth-child(odd) { background: #1a1a1a; }
  .__scalebar span:nth-child(even) { background: #fff; }
`;
document.head.appendChild(styleEl);

window.MapView = MapView;
