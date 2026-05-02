/**
 * GlobeGL — canvas 2D globe with solid countries, arcs & flying particles.
 *
 * Single projection convention throughout:
 *   x_screen = cx + R · cos(lat) · sin(lng − rotY)
 *   y_screen = cy − R · sin(lat)
 *   depth    =       cos(lat) · cos(lng − rotY)   (> 0 = front-facing)
 *
 * All 3D vectors are stored as [cos(lat)·sin(lng), sin(lat), cos(lat)·cos(lng)]
 * so that the rotation formula becomes:
 *   x = v[0]·cos − v[2]·sin   ← matches lng − rotY convention
 *   z = v[0]·sin + v[2]·cos
 */

import { useEffect, useRef } from 'react';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

/* ── types ─────────────────────────────────────────── */
type V3   = [number, number, number];
type Pt2  = [number, number, number]; // [screenX, screenY, depth]

/* ══════════════════════════════════════════════════════
   MATH
══════════════════════════════════════════════════════ */
const D2R = Math.PI / 180;
function r(d: number) { return d * D2R; }

/** Convert geographic degrees → unit 3-vector. */
function geo3(lat: number, lng: number): V3 {
  const la = r(lat), lo = r(lng);
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

/**
 * Project a unit V3 onto canvas.
 * rotY = current globe rotation (radians, increases over time → globe rotates left).
 * Uses convention  x = v[0]·c − v[2]·s  so depth = v[0]·s + v[2]·c = cos(lng − rotY)·cos(lat).
 */
function project(v: V3, rotY: number, R: number, cx: number, cy: number): Pt2 {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const sx =  v[0] * c - v[2] * s;   // cos(lat)·sin(lng − rotY)
  const sz =  v[0] * s + v[2] * c;   // cos(lat)·cos(lng − rotY)  [= depth]
  return [cx + sx * R, cy - v[1] * R, sz];
}

/** Spherical arc interpolation + altitude hump. */
function arcPt(a: V3, b: V3, t: number, alt: number): V3 {
  const d  = Math.max(-1, Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  const om = Math.acos(d), so = Math.sin(om);
  let v: V3;
  if (so < 1e-6) { v = [...a]; }
  else {
    const fa = Math.sin((1-t)*om)/so, fb = Math.sin(t*om)/so;
    v = [fa*a[0]+fb*b[0], fa*a[1]+fb*b[1], fa*a[2]+fb*b[2]];
  }
  const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) || 1;
  const sc = (1 + alt * Math.sin(Math.PI * t)) / l;
  return [v[0]*sc, v[1]*sc, v[2]*sc];
}

/* ══════════════════════════════════════════════════════
   CITIES & ARCS
══════════════════════════════════════════════════════ */
interface City { name: string; lat: number; lng: number; color: string; v3: V3; }

const CITY_LIST: Omit<City,'v3'>[] = [
  { name: 'Mumbai',    lat: 19.08,  lng: 72.88,  color: '#00ff9c' },
  { name: 'London',    lat: 51.51,  lng: -0.13,  color: '#3b9eff' },
  { name: 'New York',  lat: 40.71,  lng: -74.01, color: '#3b9eff' },
  { name: 'Tokyo',     lat: 35.68,  lng: 139.69, color: '#a78bfa' },
  { name: 'Shanghai',  lat: 31.23,  lng: 121.47, color: '#f5c842' },
  { name: 'Singapore', lat:  1.35,  lng: 103.82, color: '#00ff9c' },
  { name: 'Dubai',     lat: 25.20,  lng:  55.27, color: '#ff9933' },
  { name: 'Frankfurt', lat: 50.11,  lng:   8.68, color: '#3b9eff' },
  { name: 'SaoPaulo',  lat:-23.55,  lng: -46.63, color: '#ff4d4f' },
  { name: 'Sydney',    lat:-33.87,  lng: 151.21, color: '#a78bfa' },
  { name: 'HongKong',  lat: 22.30,  lng: 114.18, color: '#f5c842' },
];
const CITIES: City[] = CITY_LIST.map(c => ({ ...c, v3: geo3(c.lat, c.lng) }));
const CM: Record<string, City> = Object.fromEntries(CITIES.map(c => [c.name, c]));

const ARC_PAIRS: [string, string][] = [
  ['Mumbai','London'],   ['Mumbai','Singapore'], ['Mumbai','Dubai'],
  ['London','New York'], ['London','Frankfurt'],  ['London','Dubai'],
  ['New York','Tokyo'],  ['New York','SaoPaulo'], ['New York','Frankfurt'],
  ['Tokyo','Shanghai'],  ['Tokyo','HongKong'],
  ['Shanghai','Singapore'],['Singapore','Dubai'],['Singapore','Sydney'],
  ['HongKong','Tokyo'],  ['Frankfurt','Shanghai'],
];

const STEPS = 64;
const ARC_WPS: V3[][] = ARC_PAIRS.map(([s, d]) => {
  const a = CM[s].v3, b = CM[d].v3;
  return Array.from({ length: STEPS + 1 }, (_, i) => arcPt(a, b, i / STEPS, 0.45));
});

/* ── Particles ─────────────────────────────────────── */
interface Particle { arcIdx: number; t: number; speed: number; }
const PARTICLES: Particle[] = ARC_PAIRS.flatMap((_, i) => [
  { arcIdx: i, t: (i * 0.19) % 1,        speed: 0.0022 + (i % 6) * 0.00025 },
  { arcIdx: i, t: (i * 0.19 + 0.55) % 1, speed: 0.0018 + (i % 5) * 0.00020 },
]);

/* ── Global state ──────────────────────────────────── */
let g_rot = 1.35; // start facing Asia/India

/* ══════════════════════════════════════════════════════
   GEO DATA — load once, cache as V3 rings
══════════════════════════════════════════════════════ */
/**
 * Each ring is an array of V3 unit-sphere vectors (converted from GeoJSON [lng, lat]).
 * We also keep the original lng so we can detect antimeridian jumps.
 */
type V3Ring = { v: V3; lng: number }[];

let GEO_V3_RINGS: V3Ring[] = [];
let GEO_LOADING = false;
const GEO_CALLBACKS: (() => void)[] = [];

async function loadGeo(onDone: () => void) {
  GEO_CALLBACKS.push(onDone);
  if (GEO_LOADING) return;
  GEO_LOADING = true;
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const topo = (await res.json()) as Topology;
    const geo  = feature(topo, (topo.objects as Record<string, any>).countries) as any;
    const rings: V3Ring[] = [];
    for (const feat of geo.features) {
      const g = feat.geometry; if (!g) continue;
      const toRing = (coords: [number,number][]) => {
        const ring: V3Ring = coords.map(([lng, lat]) => ({ v: geo3(lat, lng), lng }));
        rings.push(ring);
      };
      if (g.type === 'Polygon')      g.coordinates.slice(0,1).forEach(toRing);
      else if (g.type === 'MultiPolygon') g.coordinates.forEach((p: any) => toRing(p[0]));
    }
    GEO_V3_RINGS = rings;
    GEO_CALLBACKS.forEach(fn => fn());
    GEO_CALLBACKS.length = 0;
  } catch { GEO_LOADING = false; }
}

/* ══════════════════════════════════════════════════════
   DRAW HELPERS
══════════════════════════════════════════════════════ */

/**
 * Draw a country ring with horizon clipping.
 * Each edge is clipped against depth = 0 so no backface geometry bleeds through.
 */
function drawCountry(
  ctx: CanvasRenderingContext2D,
  ring: V3Ring,
  rotY: number, R: number, cx: number, cy: number,
) {
  const n = ring.length;
  if (n < 3) return;

  // Project all vertices
  const pts: Pt2[] = ring.map(e => project(e.v, rotY, R, cx, cy));

  // Quick reject: centroid on back hemisphere
  let cz = 0;
  for (const p of pts) cz += p[2];
  if (cz / n < -0.35) return;

  ctx.beginPath();
  let drawing = false;

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];

    // Antimeridian guard: if the original GeoJSON lng jumps > 180°, restart segment
    const da = ring[i].lng, db = ring[(i + 1) % n].lng;
    if (Math.abs(da - db) > 180) { drawing = false; continue; }

    if (a[2] >= 0) {
      // Front vertex
      if (!drawing) { ctx.moveTo(a[0], a[1]); drawing = true; }
      else          { ctx.lineTo(a[0], a[1]); }

      if (b[2] < 0) {
        // Edge goes behind — clip to horizon
        const t = a[2] / (a[2] - b[2]);
        ctx.lineTo(a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]));
        drawing = false;
      }
    } else if (b[2] >= 0) {
      // Edge comes from behind — start at horizon
      const t = a[2] / (a[2] - b[2]);
      ctx.moveTo(a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]));
      drawing = true;
    }
  }

  if (drawing) ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ══════════════════════════════════════════════════════
   MAIN DRAW
══════════════════════════════════════════════════════ */
function drawGlobe(canvas: HTMLCanvasElement, W: number, H: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const R  = Math.min(W, H) * 0.43;
  const cx = W / 2, cy = H / 2;
  const rot = g_rot;

  ctx.clearRect(0, 0, W, H);

  /* Outer atmosphere halo */
  const atm = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.25);
  atm.addColorStop(0,   'rgba(0,160,200,0.20)');
  atm.addColorStop(0.55,'rgba(0, 90,140,0.07)');
  atm.addColorStop(1,   'rgba(0,  0,  0,0)');
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = atm; ctx.fill();

  /* Sphere base */
  const base = ctx.createRadialGradient(cx - R * .28, cy - R * .28, R * .04, cx, cy, R);
  base.addColorStop(0,   '#071e32');
  base.addColorStop(0.6, '#030e1c');
  base.addColorStop(1,   '#010810');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = base; ctx.fill();

  /* ── CLIPPED LAYER (sphere boundary) ── */
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2); ctx.clip();

  /* Ocean fill */
  ctx.fillStyle = '#030e1c';
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  /* Countries */
  if (GEO_V3_RINGS.length > 0) {
    ctx.fillStyle   = 'rgba(0,68,62,0.90)';   // dark teal — NOT bright green
    ctx.strokeStyle = 'rgba(0,160,145,0.18)';
    ctx.lineWidth   = 0.55;
    for (const ring of GEO_V3_RINGS) drawCountry(ctx, ring, rot, R, cx, cy);
  }

  /* Subtle latitude parallels */
  for (let lat = -60; lat <= 60; lat += 30) {
    const ry = Math.sin(r(lat)) * R;
    const rx = Math.cos(r(lat)) * R;
    ctx.beginPath(); ctx.ellipse(cx, cy + ry, rx, rx * 0.055, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,180,200,0.04)'; ctx.lineWidth = 0.5; ctx.stroke();
  }

  /* ── ARCS ── */
  for (let ai = 0; ai < ARC_WPS.length; ai++) {
    const wps = ARC_WPS[ai];
    // Midpoint depth check — skip arcs completely on back
    const midPt = project(wps[Math.floor(STEPS / 2)], rot, R, cx, cy);
    if (midPt[2] < -0.06) continue;

    const col = CM[ARC_PAIRS[ai][0]].color;

    // Project the full arc path
    const pts2: Pt2[] = wps.map(w => project(w, rot, R, cx, cy));

    // Glow pass (wide, transparent)
    ctx.beginPath();
    let ok = false;
    for (const [px, py, pz] of pts2) {
      if (pz < 0) { ok = false; continue; }
      if (!ok) { ctx.moveTo(px, py); ok = true; } else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = col + '22'; ctx.lineWidth = 6; ctx.stroke();

    // Core arc
    ctx.beginPath(); ok = false;
    for (const [px, py, pz] of pts2) {
      if (pz < 0) { ok = false; continue; }
      if (!ok) { ctx.moveTo(px, py); ok = true; } else ctx.lineTo(px, py);
    }
    const p0 = pts2[0], p1 = pts2[STEPS];
    const lg = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    lg.addColorStop(0,    col + '00');
    lg.addColorStop(0.2,  col + 'cc');
    lg.addColorStop(0.8,  col + 'cc');
    lg.addColorStop(1,    col + '00');
    ctx.strokeStyle = lg; ctx.lineWidth = 1.4; ctx.stroke();
  }

  /* ── PARTICLES (travel along arcs, SAME projection as arcs → locked to globe) ── */
  for (const p of PARTICLES) {
    const wps  = ARC_WPS[p.arcIdx];
    const idx  = Math.min(STEPS - 1, Math.floor(p.t * STEPS));
    const [px, py, pz] = project(wps[idx], rot, R, cx, cy);

    if (pz < 0.05) { p.t = (p.t + p.speed) % 1; continue; }

    const col = CM[ARC_PAIRS[p.arcIdx][0]].color;

    // Outer glow
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 13);
    glow.addColorStop(0,    col + 'cc');
    glow.addColorStop(0.35, col + '44');
    glow.addColorStop(1,    col + '00');
    ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    // Bright core
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    // Coloured inner ring
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.strokeStyle = col + 'bb'; ctx.lineWidth = 1.2; ctx.stroke();

    p.t = (p.t + p.speed) % 1;
  }

  /* ── CITY NODES ── */
  const pulse = (Date.now() % 2600) / 2600;
  for (const city of CITIES) {
    const [px, py, pz] = project(city.v3, rot, R, cx, cy);
    if (pz < 0.08) continue;
    const col   = city.color;
    const depth = 0.45 + pz * 0.55;

    // Expanding pulse ring
    const rr = 4 + pulse * 14;
    const ra  = Math.round((1 - pulse) * 0.65 * depth * 255).toString(16).padStart(2,'0');
    ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2);
    ctx.strokeStyle = col + ra; ctx.lineWidth = 1.2; ctx.stroke();

    // Glow halo
    const g = ctx.createRadialGradient(px, py, 0, px, py, 9);
    const dh = Math.round(depth * 200).toString(16).padStart(2,'0');
    g.addColorStop(0,   col + dh);
    g.addColorStop(0.5, col + '44');
    g.addColorStop(1,   col + '00');
    ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();

    // Solid dot
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();

    ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }

  ctx.restore(); // end sphere clip

  /* Sphere rim */
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,180,210,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();

  /* Specular highlight */
  const shine = ctx.createRadialGradient(
    cx - R*.36, cy - R*.36, 0, cx - R*.2, cy - R*.2, R * .68);
  shine.addColorStop(0,   'rgba(255,255,255,0.06)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.012)');
  shine.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = shine; ctx.fill();

  g_rot += 0.0022;
}

/* ══════════════════════════════════════════════════════
   REACT COMPONENT
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
    frameRef.current = requestAnimationFrame(loop);
    loadGeo(() => { /* loop already rendering — countries will appear on next frame */ });

    return () => { aliveRef.current = false; cancelAnimationFrame(frameRef.current); };
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
