import { useEffect, useRef } from 'react';

/* ── Land approximation ─────────────────────────────── */
function isLand(lat: number, lng: number): boolean {
  if (lat > 15 && lat < 75 && lng > -165 && lng < -52) {
    if (lat < 25 && lng < -90) return false;
    if (lat > 50 && lat < 63 && lng > -90 && lng < -65) return false;
    return true;
  }
  if (lat > -55 && lat < 13 && lng > -82 && lng < -34) {
    if (lat < -15 && lng > -48) return false;
    return true;
  }
  if (lat > 35 && lat < 72 && lng > -12 && lng < 42) return true;
  if (lat > -35 && lat < 38 && lng > -18 && lng < 52) {
    if (lat > 30 && lng > 36) return false;
    return true;
  }
  if (lat > 12 && lat < 42 && lng > 35 && lng < 62) return true;
  if (lat > 5  && lat < 38 && lng > 60 && lng < 98)  return true;
  if (lat > 18 && lat < 78 && lng > 65 && lng < 150) return true;
  if (lat > -8 && lat < 7  && lng > 95 && lng < 118) return true;
  if (lat > 30 && lat < 46 && lng > 129 && lng < 146) return true;
  if (lat > -43 && lat < -10 && lng > 113 && lng < 155) return true;
  if (lat > 60 && lat < 84 && lng > -74 && lng < -10)  return true;
  if (lat > 63 && lat < 67 && lng > -25 && lng < -13)  return true;
  if (lat < -65) return true;
  return false;
}

/* ── Math helpers ───────────────────────────────────── */
type V3 = [number, number, number];
function latLngToV3(latR: number, lngR: number): V3 {
  const c = Math.cos(latR);
  return [c * Math.sin(lngR), Math.sin(latR), c * Math.cos(lngR)];
}
function dot3(a: V3, b: V3) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function norm3(v: V3): V3 {
  const l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) || 1;
  return [v[0]/l, v[1]/l, v[2]/l];
}
function slerpAlt(a: V3, b: V3, t: number, alt: number): V3 {
  const d = Math.min(1, Math.max(-1, dot3(a, b)));
  const omega = Math.acos(d);
  const so = Math.sin(omega);
  let interp: V3;
  if (so < 1e-6) { interp = a; }
  else {
    const fa = Math.sin((1 - t) * omega) / so;
    const fb = Math.sin(t * omega) / so;
    interp = [fa*a[0]+fb*b[0], fa*a[1]+fb*b[1], fa*a[2]+fb*b[2]];
  }
  const n = norm3(interp);
  const sc = 1 + alt * Math.sin(Math.PI * t);
  return [n[0]*sc, n[1]*sc, n[2]*sc];
}

/* ══════════════════════════════════════════════════════
   ALL DATA PRE-COMPUTED AT MODULE LEVEL (never in closures)
══════════════════════════════════════════════════════ */

const LAND_DOTS: [number, number][] = (() => {
  const dots: [number, number][] = [];
  for (let lat = -80; lat <= 80; lat += 3.5) {
    for (let lng = -180; lng < 180; lng += 3.5) {
      if (isLand(lat, lng)) dots.push([lat * Math.PI / 180, lng * Math.PI / 180]);
    }
  }
  return dots;
})();

const CITIES: { name: string; lat: number; lng: number; color: string }[] = [
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

const CITY_MAP: Record<string, typeof CITIES[0]> = {};
CITIES.forEach(c => { CITY_MAP[c.name] = c; });

const ARC_DEFS: [string, string][] = [
  ['Mumbai', 'London'], ['Mumbai', 'Singapore'], ['Mumbai', 'Dubai'],
  ['London', 'New York'], ['London', 'Frankfurt'], ['London', 'Dubai'],
  ['New York', 'Tokyo'], ['New York', 'SaoPaulo'], ['New York', 'Frankfurt'],
  ['Tokyo', 'Shanghai'], ['Tokyo', 'HongKong'],
  ['Shanghai', 'Singapore'], ['Singapore', 'Dubai'], ['Singapore', 'Sydney'],
  ['HongKong', 'Tokyo'], ['Frankfurt', 'Shanghai'],
];

const STEPS = 42;

// Pre-compute all arc waypoints at module load time
const ARC_WAYPOINTS: V3[][] = ARC_DEFS.map(([src, dst]) => {
  const a = CITY_MAP[src], b = CITY_MAP[dst];
  const A = latLngToV3(a.lat * Math.PI / 180, a.lng * Math.PI / 180);
  const B = latLngToV3(b.lat * Math.PI / 180, b.lng * Math.PI / 180);
  return Array.from({ length: STEPS + 1 }, (_, i) => slerpAlt(A, B, i / STEPS, 0.38));
});

// Particle state — simple array, mutated in-place each frame
interface Particle { arcIdx: number; t: number; speed: number; }
const PARTICLES: Particle[] = ARC_DEFS.flatMap((_, i) => [
  { arcIdx: i, t: (i * 0.13) % 1,       speed: 0.0018 + (i % 5) * 0.0003 },
  { arcIdx: i, t: (i * 0.13 + 0.5) % 1, speed: 0.0014 + (i % 4) * 0.0004 },
]);

// Global rotation state (persists across HMR)
let g_rot = 2.2;

/* ── Projection ─────────────────────────────────────── */
function project(v3: V3, R: number, cx: number, cy: number, rot: number): [number, number, number] {
  const cosR = Math.cos(rot), sinR = Math.sin(rot);
  const x = v3[0] * cosR + v3[2] * sinR;
  const z = -v3[0] * sinR + v3[2] * cosR;
  return [cx + x * R, cy - v3[1] * R, z];
}

/* ── Draw function (pure, no closures over component state) ── */
function drawGlobe(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = width, H = height;
  const R = Math.min(W, H) * 0.42;
  const cx = W / 2, cy = H / 2;
  const rot = g_rot;

  ctx.clearRect(0, 0, W, H);

  /* Globe base */
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R * 1.05);
  grad.addColorStop(0,   'rgba(0,50,90,0.7)');
  grad.addColorStop(0.5, 'rgba(0,20,45,0.5)');
  grad.addColorStop(1,   'rgba(0,8,20,0.2)');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();

  /* Atmosphere glow */
  const atm = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.2);
  atm.addColorStop(0,   'rgba(0,160,220,0.18)');
  atm.addColorStop(0.6, 'rgba(0,100,160,0.07)');
  atm.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = atm; ctx.fill();

  /* Lat grid */
  for (let lat = -60; lat <= 60; lat += 30) {
    const ry = Math.sin(lat * Math.PI / 180) * R;
    const rx = Math.cos(lat * Math.PI / 180) * R;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry, rx, rx * 0.07, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,200,220,0.055)';
    ctx.lineWidth = 0.5; ctx.stroke();
  }

  /* Land dots */
  for (const [latR, lngR] of LAND_DOTS) {
    const adjLng = lngR - rot;
    const xv = Math.cos(latR) * Math.sin(adjLng);
    const yv = Math.sin(latR);
    const zv = Math.cos(latR) * Math.cos(adjLng);
    if (zv < 0) continue;
    const bright = 0.28 + zv * 0.72;
    const sz = 0.9 + zv * 1.1;
    ctx.beginPath();
    ctx.arc(cx + xv * R, cy - yv * R, sz, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,210,175,${bright.toFixed(2)})`; ctx.fill();
  }

  /* Arcs */
  for (let ai = 0; ai < ARC_WAYPOINTS.length; ai++) {
    const wps = ARC_WAYPOINTS[ai];
    const mid = wps[Math.floor(STEPS / 2)];
    const [,, midZ] = project(mid, R, cx, cy, rot);
    if (midZ < -0.1) continue;

    const col = CITY_MAP[ARC_DEFS[ai][0]].color;
    const pts2: [number, number, number][] = wps.map(w => project(w, R, cx, cy, rot));

    ctx.beginPath();
    let started = false;
    for (const [px, py, pz] of pts2) {
      if (pz < 0) { started = false; continue; }
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    const mp = pts2[Math.floor(STEPS / 2)];
    const lg = ctx.createLinearGradient(pts2[0][0], pts2[0][1], mp[0], mp[1]);
    lg.addColorStop(0,   col + '00');
    lg.addColorStop(0.4, col + 'aa');
    lg.addColorStop(0.6, col + 'aa');
    lg.addColorStop(1,   col + '00');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 0.9; ctx.stroke();
  }

  /* Flying particles */
  const now = Date.now();
  for (const p of PARTICLES) {
    const wps = ARC_WAYPOINTS[p.arcIdx];
    const idx = Math.min(STEPS - 1, Math.floor(p.t * STEPS));
    const wp = wps[idx];
    const [px, py, pz] = project(wp, R, cx, cy, rot);
    if (pz < 0.05) { p.t = (p.t + p.speed) % 1; continue; }

    const col = CITY_MAP[ARC_DEFS[p.arcIdx][0]].color;

    // Glow halo
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 6);
    glow.addColorStop(0,   col + 'dd');
    glow.addColorStop(0.4, col + '55');
    glow.addColorStop(1,   col + '00');
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    // Core white dot
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    p.t = (p.t + p.speed) % 1;
    void now; // suppress unused warning
  }

  /* City nodes */
  const pulse = (Date.now() % 2000) / 2000;
  for (const city of CITIES) {
    const v3 = latLngToV3(city.lat * Math.PI / 180, city.lng * Math.PI / 180);
    const [px, py, pz] = project(v3, R, cx, cy, rot);
    if (pz < 0.1) continue;

    // Pulse ring
    const ringR = 4 + pulse * 11;
    const ringA = ((1 - pulse) * 0.55).toFixed(2);
    ctx.beginPath(); ctx.arc(px, py, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = city.color + Math.round(+ringA * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1; ctx.stroke();

    // Node glow
    const g = ctx.createRadialGradient(px, py, 0, px, py, 8);
    g.addColorStop(0, city.color + 'ee');
    g.addColorStop(0.5, city.color + '55');
    g.addColorStop(1, city.color + '00');
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();

    // Centre dot
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = city.color; ctx.fill();
  }

  /* Sphere rim + highlight */
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,200,220,0.13)';
  ctx.lineWidth = 1; ctx.stroke();

  const shine = ctx.createRadialGradient(cx - R*.35, cy - R*.35, 0, cx - R*.2, cy - R*.2, R * .7);
  shine.addColorStop(0, 'rgba(255,255,255,0.05)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = shine; ctx.fill();

  g_rot += 0.0025;
}

/* ── Component ──────────────────────────────────────── */
export default function GlobeGL({ width = 480, height = 480 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive || !canvasRef.current) return;
      drawGlobe(canvasRef.current, width, height);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(frameRef.current); };
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
