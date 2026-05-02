import { useEffect, useRef } from 'react';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
type Ring = [number, number][]; // [lng, lat] pairs (GeoJSON order)

/* ══════════════════════════════════════════════════════
   GEOGRAPHY — loaded once from CDN, cached at module level
══════════════════════════════════════════════════════ */
let GEO_RINGS: Ring[] = [];
let GEO_LOADING = false;
const GEO_LISTENERS: Array<() => void> = [];

async function ensureGeoLoaded(onReady: () => void) {
  if (GEO_RINGS.length > 0) { onReady(); return; }
  GEO_LISTENERS.push(onReady);
  if (GEO_LOADING) return;
  GEO_LOADING = true;
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
    );
    const topo = (await res.json()) as Topology;
    const geo = feature(topo, (topo.objects as Record<string, any>).countries) as any;
    const rings: Ring[] = [];
    for (const feat of geo.features) {
      const g = feat.geometry;
      if (!g) continue;
      if (g.type === 'Polygon') rings.push(g.coordinates[0] as Ring);
      else if (g.type === 'MultiPolygon')
        for (const poly of g.coordinates) rings.push(poly[0] as Ring);
    }
    GEO_RINGS = rings;
    GEO_LISTENERS.forEach(fn => fn());
    GEO_LISTENERS.length = 0;
  } catch {
    GEO_LOADING = false;
  }
}

/* ══════════════════════════════════════════════════════
   CITIES & ARCS
══════════════════════════════════════════════════════ */
interface City {
  name: string; lat: number; lng: number; color: string;
}
const CITIES: City[] = [
  { name: 'Mumbai',    lat: 19.08,  lng: 72.88,  color: '#00ff9c' },
  { name: 'London',    lat: 51.51,  lng: -0.13,  color: '#3b9eff' },
  { name: 'New York',  lat: 40.71,  lng: -74.01, color: '#3b9eff' },
  { name: 'Tokyo',     lat: 35.68,  lng: 139.69, color: '#a78bfa' },
  { name: 'Shanghai',  lat: 31.23,  lng: 121.47, color: '#f5c842' },
  { name: 'Singapore', lat: 1.35,   lng: 103.82, color: '#00ff9c' },
  { name: 'Dubai',     lat: 25.20,  lng: 55.27,  color: '#ff9933' },
  { name: 'Frankfurt', lat: 50.11,  lng: 8.68,   color: '#3b9eff' },
  { name: 'SaoPaulo',  lat: -23.55, lng: -46.63, color: '#ff4d4f' },
  { name: 'Sydney',    lat: -33.87, lng: 151.21, color: '#a78bfa' },
  { name: 'HongKong',  lat: 22.30,  lng: 114.18, color: '#f5c842' },
];
const CM: Record<string, City> = Object.fromEntries(CITIES.map(c => [c.name, c]));

const ARC_PAIRS: [string, string][] = [
  ['Mumbai',    'London'],
  ['Mumbai',    'Singapore'],
  ['Mumbai',    'Dubai'],
  ['London',    'New York'],
  ['London',    'Frankfurt'],
  ['London',    'Dubai'],
  ['New York',  'Tokyo'],
  ['New York',  'SaoPaulo'],
  ['New York',  'Frankfurt'],
  ['Tokyo',     'Shanghai'],
  ['Tokyo',     'HongKong'],
  ['Shanghai',  'Singapore'],
  ['Singapore', 'Dubai'],
  ['Singapore', 'Sydney'],
  ['HongKong',  'Tokyo'],
  ['Frankfurt', 'Shanghai'],
];

/* ══════════════════════════════════════════════════════
   MATH
══════════════════════════════════════════════════════ */
type V3 = [number, number, number];

function toRad(d: number) { return d * Math.PI / 180; }

/** Convert (lat°, lng°) → unit 3-vector */
function cityV3(lat: number, lng: number): V3 {
  const lr = toRad(lat), ll = toRad(lng);
  return [Math.cos(lr) * Math.sin(ll), Math.sin(lr), Math.cos(lr) * Math.cos(ll)];
}

/** Spherical interpolation + altitude hump */
function slerpAlt(a: V3, b: V3, t: number, alt: number): V3 {
  const d = Math.min(1, Math.max(-1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  const om = Math.acos(d), so = Math.sin(om);
  let v: V3;
  if (so < 1e-6) { v = a; } else {
    const fa = Math.sin((1-t)*om)/so, fb = Math.sin(t*om)/so;
    v = [fa*a[0]+fb*b[0], fa*a[1]+fb*b[1], fa*a[2]+fb*b[2]];
  }
  const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) || 1;
  const s = (1 + alt * Math.sin(Math.PI * t)) / l;
  return [v[0]*s, v[1]*s, v[2]*s];
}

/** Project a 3-vector onto the canvas, applying Y-axis rotation.
 *  Returns [screenX, screenY, depth] where depth>0 = front face. */
function proj(v: V3, rotY: number, R: number, cx: number, cy: number): [number, number, number] {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const x =  v[0]*c + v[2]*s;
  const z = -v[0]*s + v[2]*c;
  return [cx + x*R, cy - v[1]*R, z];
}

/** Project (lng°, lat°) via GeoJSON convention. rotY = current globe rotation. */
function projGeo(lng: number, lat: number, rotY: number, R: number, cx: number, cy: number): [number, number, number] {
  const latR = toRad(lat), lngAdj = toRad(lng) - rotY;
  const x = Math.cos(latR) * Math.sin(lngAdj);
  const y = Math.sin(latR);
  const z = Math.cos(latR) * Math.cos(lngAdj);
  return [cx + x*R, cy - y*R, z];
}

/* ══════════════════════════════════════════════════════
   PRE-COMPUTED ARC WAYPOINTS  (computed once)
══════════════════════════════════════════════════════ */
const STEPS = 60;
const ARC_WAYPOINTS: V3[][] = ARC_PAIRS.map(([src, dst]) => {
  const a = cityV3(CM[src].lat, CM[src].lng);
  const b = cityV3(CM[dst].lat, CM[dst].lng);
  return Array.from({ length: STEPS + 1 }, (_, i) => slerpAlt(a, b, i/STEPS, 0.42));
});

/* ══════════════════════════════════════════════════════
   PARTICLES  — one per arc, evenly spaced around circle
══════════════════════════════════════════════════════ */
interface Particle { arcIdx: number; t: number; speed: number; }
const PARTICLES: Particle[] = ARC_PAIRS.flatMap((_, i) => [
  { arcIdx: i, t: (i * 0.17) % 1,        speed: 0.0020 + (i % 6) * 0.0003 },
  { arcIdx: i, t: (i * 0.17 + 0.5) % 1,  speed: 0.0017 + (i % 5) * 0.0002 },
]);

/* ══════════════════════════════════════════════════════
   GLOBAL MUTABLE STATE  (survives HMR)
══════════════════════════════════════════════════════ */
let g_rot = 1.4; // start facing India/Asia

/* ══════════════════════════════════════════════════════
   DRAW HELPERS
══════════════════════════════════════════════════════ */

/** Draw one GeoJSON polygon ring (lon,lat pairs). */
function drawRing(ctx: CanvasRenderingContext2D, ring: Ring, rotY: number, R: number, cx: number, cy: number) {
  // Compute centroid Z to skip completely-backface polygons
  let cz = 0;
  for (const [lng, lat] of ring) {
    const latR = toRad(lat), lngAdj = toRad(lng) - rotY;
    cz += Math.cos(latR) * Math.cos(lngAdj);
  }
  cz /= ring.length;
  if (cz < -0.15) return; // completely on back — skip

  ctx.beginPath();
  let started = false;
  let prevLng = ring[0][0];

  for (const [lng, lat] of ring) {
    // Antimeridian break — restart sub-path
    if (Math.abs(lng - prevLng) > 180) { started = false; }
    prevLng = lng;

    const [px, py] = projGeo(lng, lat, rotY, R, cx, cy);
    if (!started) { ctx.moveTo(px, py); started = true; }
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/* ══════════════════════════════════════════════════════
   MAIN DRAW FUNCTION
══════════════════════════════════════════════════════ */
function drawGlobe(canvas: HTMLCanvasElement, W: number, H: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const R  = Math.min(W, H) * 0.43;
  const cx = W / 2, cy = H / 2;
  const rot = g_rot;

  ctx.clearRect(0, 0, W, H);

  /* ── Outer atmosphere glow ── */
  const atm = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.28);
  atm.addColorStop(0,   'rgba(0,180,200,0.22)');
  atm.addColorStop(0.5, 'rgba(0,100,140,0.08)');
  atm.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.28, 0, Math.PI*2);
  ctx.fillStyle = atm; ctx.fill();

  /* ── Sphere base ── */
  const base = ctx.createRadialGradient(cx - R*.3, cy - R*.3, R*.04, cx, cy, R);
  base.addColorStop(0,   '#062030');
  base.addColorStop(0.6, '#030f1e');
  base.addColorStop(1,   '#010810');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.fillStyle = base; ctx.fill();

  /* ── Clip everything below to sphere circle ── */
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R - 0.5, 0, Math.PI*2);
  ctx.clip();

  /* ── Ocean fill (fills clip area) ── */
  ctx.fillStyle = '#030f1e';
  ctx.fillRect(cx - R, cy - R, R*2, R*2);

  /* ── Countries (solid filled) ── */
  if (GEO_RINGS.length > 0) {
    // Shadow / depth shading pass
    ctx.fillStyle   = 'rgba(0,90,80,0.82)';
    ctx.strokeStyle = 'rgba(0,200,180,0.22)';
    ctx.lineWidth   = 0.6;
    for (const ring of GEO_RINGS) {
      drawRing(ctx, ring, rot, R, cx, cy);
      ctx.fill();
      ctx.stroke();
    }
  }

  /* ── Latitude grid (very subtle) ── */
  for (let lat = -60; lat <= 60; lat += 30) {
    const ry = Math.sin(toRad(lat)) * R;
    const rx = Math.cos(toRad(lat)) * R;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry, rx, rx * 0.06, 0, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,200,220,0.04)';
    ctx.lineWidth = 0.5; ctx.stroke();
  }

  /* ── Arcs ── */
  for (let ai = 0; ai < ARC_WAYPOINTS.length; ai++) {
    const wps = ARC_WAYPOINTS[ai];
    // Check midpoint visibility
    const [,,mz] = proj(wps[Math.floor(STEPS/2)], rot, R, cx, cy);
    if (mz < -0.05) continue;

    const col = CM[ARC_PAIRS[ai][0]].color;

    // Glow pass (wider, semi-transparent)
    ctx.beginPath();
    let started = false;
    for (const wp of wps) {
      const [px, py, pz] = proj(wp, rot, R, cx, cy);
      if (pz < 0) { started = false; continue; }
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = col + '28';
    ctx.lineWidth = 4; ctx.stroke();

    // Core arc line
    ctx.beginPath();
    started = false;
    for (const wp of wps) {
      const [px, py, pz] = proj(wp, rot, R, cx, cy);
      if (pz < 0) { started = false; continue; }
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    // Gradient along arc from src → dst
    const [x0, y0] = proj(wps[0],    rot, R, cx, cy);
    const [x1, y1] = proj(wps[STEPS], rot, R, cx, cy);
    const lg = ctx.createLinearGradient(x0, y0, x1, y1);
    lg.addColorStop(0,   col + '00');
    lg.addColorStop(0.25, col + 'cc');
    lg.addColorStop(0.75, col + 'cc');
    lg.addColorStop(1,   col + '00');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 1.2; ctx.stroke();
  }

  /* ── Flying particles ── */
  for (const p of PARTICLES) {
    const wps = ARC_WAYPOINTS[p.arcIdx];
    const idx = Math.min(STEPS - 1, Math.floor(p.t * STEPS));
    const [px, py, pz] = proj(wps[idx], rot, R, cx, cy);
    if (pz < 0.04) { p.t = (p.t + p.speed) % 1; continue; }

    const col = CM[ARC_PAIRS[p.arcIdx][0]].color;

    // Large glow
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 14);
    glow.addColorStop(0,   col + 'bb');
    glow.addColorStop(0.35, col + '44');
    glow.addColorStop(1,   col + '00');
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI*2);
    ctx.fillStyle = glow; ctx.fill();

    // Bright core
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    // Small inner glow ring
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2);
    ctx.strokeStyle = col + 'aa';
    ctx.lineWidth = 1; ctx.stroke();

    p.t = (p.t + p.speed) % 1;
  }

  /* ── City nodes (pulse rings + dot) ── */
  const pulse = (Date.now() % 2400) / 2400;
  for (const city of CITIES) {
    const v = cityV3(city.lat, city.lng);
    const [px, py, pz] = proj(v, rot, R, cx, cy);
    if (pz < 0.08) continue;

    const col = city.color;
    const depth = 0.5 + pz * 0.5; // brighter when facing

    // Expanding pulse ring
    const rr = 5 + pulse * 16;
    const ra = (1 - pulse) * 0.6 * depth;
    ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI*2);
    ctx.strokeStyle = col + Math.round(ra * 255).toString(16).padStart(2,'0');
    ctx.lineWidth = 1.2; ctx.stroke();

    // Glow halo
    const g = ctx.createRadialGradient(px, py, 0, px, py, 10);
    g.addColorStop(0,   col + Math.round(depth * 220).toString(16).padStart(2,'0'));
    g.addColorStop(0.5, col + '44');
    g.addColorStop(1,   col + '00');
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();

    // Solid centre dot
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2);
    ctx.fillStyle = col; ctx.fill();

    // White highlight
    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }

  /* ── Restore clip ── */
  ctx.restore();

  /* ── Sphere border ── */
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(0,200,220,0.18)';
  ctx.lineWidth = 1.2; ctx.stroke();

  /* ── Specular highlight ── */
  const shine = ctx.createRadialGradient(cx - R*.38, cy - R*.38, 0, cx - R*.22, cy - R*.22, R * .72);
  shine.addColorStop(0,   'rgba(255,255,255,0.07)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.015)');
  shine.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.fillStyle = shine; ctx.fill();

  g_rot += 0.0022;
}

/* ══════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════ */
export default function GlobeGL({ width = 480, height = 480 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const aliveRef  = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    const loop = () => {
      if (!aliveRef.current || !canvasRef.current) return;
      drawGlobe(canvasRef.current, width, height);
      frameRef.current = requestAnimationFrame(loop);
    };

    // Start animation immediately (countries will appear when loaded)
    frameRef.current = requestAnimationFrame(loop);

    // Trigger geo load — redraws automatically via the always-running loop
    ensureGeoLoaded(() => { /* loop already running */ });

    return () => {
      aliveRef.current = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', borderRadius: '50%' }}
    />
  );
}
