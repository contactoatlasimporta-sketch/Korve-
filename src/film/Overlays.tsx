import React from 'react';
import {Vec3, surfaceFrame, surfacePoint} from '../model/sleeve';
import {makeCamera, sleeveMatrix, SleeveSpec, StageState} from '../three/stage';
import {swingPhase, swingSleeve} from '../director/director';
import {clamp01, E, hash, lerp, prog} from '../director/math';
import {ArmPro, C, Callout, Mask, mono, SectionTitle, Wordmark} from './ui';
import {FONT_SANS} from '../fonts';
import * as THREE from 'three';

const W = 1920;
const H = 1080;

// ---------------------------------------------------------------------------
// projection helpers
// ---------------------------------------------------------------------------
export const projector = (state: StageState) => {
  const cam = makeCamera(state.camera, W / H);
  return (p: Vec3) => {
    const v = new THREE.Vector3(...p);
    const z = v.clone().applyMatrix4(cam.matrixWorldInverse).z;
    v.project(cam);
    return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, z, ok: z < 0};
  };
};
const world = (spec: Pick<SleeveSpec, 'position' | 'quat'>, p: Vec3): Vec3 => {
  const v = new THREE.Vector3(...p).applyMatrix4(sleeveMatrix(spec));
  return [v.x, v.y, v.z];
};
export const centre = (spec: SleeveSpec, u: number): Vec3 => {
  const a = surfacePoint(u, 0, spec.pose);
  const b = surfacePoint(u, Math.PI, spec.pose);
  return world(spec, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
};
/** surface point whose normal faces the camera most, at station u */
export const facing = (state: StageState, spec: SleeveSpec, u: number, bias = 0, lift = 0.02) => {
  const cam = makeCamera(state.camera, W / H);
  let best = 0;
  let bd = -2;
  const m = sleeveMatrix(spec);
  const nm = new THREE.Matrix3().setFromMatrix4(m);
  for (let i = 0; i < 48; i++) {
    const th = (i / 48) * Math.PI * 2;
    const {P, n} = surfaceFrame(u, th, spec.pose);
    const wp = new THREE.Vector3(...P).applyMatrix4(m);
    const wn = new THREE.Vector3(...n).applyMatrix3(nm).normalize();
    const d = wn.dot(cam.position.clone().sub(wp).normalize());
    if (d > bd) {
      bd = d;
      best = th;
    }
  }
  const {P, n} = surfaceFrame(u, best + bias, spec.pose);
  return world(spec, [P[0] + n[0] * lift, P[1] + n[1] * lift, P[2] + n[2] * lift]);
};

// ---------------------------------------------------------------------------
// Backdrop + HUD
// ---------------------------------------------------------------------------
export const Backdrop: React.FC<{f: number; state: StageState}> = ({f, state}) => {
  const gridOn = prog(f, 96, 140) * (1 - 0.55 * prog(f, 330, 360)) * (1 - 0.6 * prog(f, 812, 870));
  const px = -state.camera.target[0] * 18;
  const py = state.camera.target[1] * 18;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 65% at 50% 46%, #121518 0%, #0a0b0d 55%, ${C.bg} 100%)`,
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: gridOn}}>
        <defs>
          <pattern id="g1" width="48" height="48" patternUnits="userSpaceOnUse" x={px % 48} y={py % 48}>
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
          <pattern id="g2" width="240" height="240" patternUnits="userSpaceOnUse" x={(px * 1.6) % 240} y={(py * 1.6) % 240}>
            <path d="M 240 0 L 0 0 0 240" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <path d="M 116 120 L 124 120 M 120 116 L 120 124" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="48%" r="62%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="m">
            <rect width={W} height={H} fill="url(#fade)" />
          </mask>
        </defs>
        <g mask="url(#m)">
          <rect width={W} height={H} fill="url(#g1)" />
          <rect width={W} height={H} fill="url(#g2)" />
        </g>
      </svg>
    </>
  );
};

const SCENE_LABEL: [number, number, string][] = [
  [96, 214, '01 · PRODUCT'],
  [214, 336, '02 · COMPRESSION ARCHITECTURE'],
  [336, 458, '03 · ELBOW'],
  [458, 606, '04 · SUPPORT RAILS'],
  [606, 694, '05 · LEFT / RIGHT'],
  [694, 802, '06 · CONSTRUCTION'],
  [802, 900, '07 · CONCEPT'],
];

export const Hud: React.FC<{f: number}> = ({f}) => {
  const on = prog(f, 98, 126, E.inOut) * (1 - prog(f, 846, 872));
  if (on <= 0) return null;
  const lab = SCENE_LABEL.find(([a, b]) => f >= a && f < b);
  const sec = Math.floor(f / 30);
  const fr = f % 30;
  const tc = `00:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
  const tick = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M ${x} ${y + 22 * sy} L ${x} ${y} L ${x + 22 * sx} ${y}`} stroke="rgba(237,239,241,0.35)" strokeWidth={1} fill="none" />
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: on}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {tick(56, 56, 1, 1)}
        {tick(W - 56, 56, -1, 1)}
        {tick(56, H - 56, 1, -1)}
        {tick(W - 56, H - 56, -1, -1)}
      </svg>
      <div style={{position: 'absolute', left: 92, top: 72, ...mono(12, C.ink, 0.3)}}>
        KORVE <span style={{color: C.dim}}>/ ARM PRO</span>
      </div>
      <div style={{position: 'absolute', right: 92, top: 72, ...mono(12, C.dim, 0.26)}}>
        PRELIMINARY ENGINEERING CONCEPT <span style={{color: C.lime}}>●</span>
      </div>
      <div style={{position: 'absolute', left: 92, bottom: 70, ...mono(12, C.dim, 0.26)}}>{lab ? lab[2] : ''}</div>
      <div style={{position: 'absolute', right: 92, bottom: 70, ...mono(12, C.dim, 0.26)}}>
        VISUAL BRIEF FOR FEASIBILITY REVIEW · {tc}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 0–3 s INTRO
// ---------------------------------------------------------------------------
export const Intro: React.FC<{f: number}> = ({f}) => {
  if (f > 104) return null;
  const sweep = E.move(clamp01((f - 4) / 26));
  const out = E.inOut(clamp01((f - 76) / 18));
  const lineX0 = lerp(0, 1, sweep);
  const y = 560;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="ln" x1="0" x2="1">
            <stop offset="0" stopColor={C.ink} stopOpacity="0" />
            <stop offset="0.5" stopColor={C.ink} stopOpacity="0.7" />
            <stop offset="1" stopColor={C.lime} stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x={lerp(-200, 1920 * 0.18, sweep) + out * 700} y={y} width={Math.max(0, lerp(200, 1920 * 0.64, lineX0) - out * 1400)} height={1} fill="url(#ln)" />
        <rect x={1920 * 0.82 - 3 + out * -700} y={y - 3} width={6} height={7} fill={C.lime} opacity={prog(f, 26, 34) * (1 - out)} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 396, display: 'flex', justifyContent: 'center', transform: `translateY(${-out * 40}px)`, opacity: 1 - out}}>
        <Wordmark size={132} f={f} at={18} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 590, display: 'flex', justifyContent: 'center', opacity: 1 - out}}>
        <ArmPro size={40} f={f} at={36} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 666, display: 'flex', justifyContent: 'center', opacity: 1 - out}}>
        <Mask p={(f - 50) / 18}>
          <span style={mono(15, C.dim, 0.42)}>ENGINEERED FOR RACKET SPORTS</span>
        </Mask>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ZONES — callouts + relative profile (illustrative, no values)
// ---------------------------------------------------------------------------
const ZONES = [
  {u: 0.2, label: 'UPPER-ARM RETENTION', at: 236, up: true},
  {u: 0.45, label: 'ELBOW STABILISATION TRANSITION', at: 252, up: false},
  {u: 0.7, label: 'MAIN FOREARM COMPRESSION', at: 268, up: true},
  {u: 0.93, label: 'LIGHTER WRIST TRANSITION', at: 284, up: false},
];
const ZonesOverlay: React.FC<{f: number; state: StageState}> = ({f, state}) => {
  if (f < 226 || f > 340) return null;
  const R = state.sleeves.find((s) => s.key === 'R');
  if (!R) return null;
  const P = projector(state);
  const curve = [0.62, 0.66, 0.6, 0.4, 0.34, 0.5, 0.8, 0.86, 0.74, 0.5, 0.38, 0.3];
  const gx = 1340;
  const gy = 846;
  const gw = 440;
  const gh = 92;
  const draw = prog(f, 240, 300, E.inOut);
  const out = prog(f, 318, 332);
  const pts = curve.map((v, i) => [gx + (i / (curve.length - 1)) * gw, gy + gh - v * gh] as const);
  let d = '';
  pts.forEach(([x, y], i) => (d += `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `));
  return (
    <>
      {ZONES.map((z, i) => {
        const a = P(facing(state, R, z.u, z.up ? -0.9 : 0.9, 0.03));
        return (
          <Callout key={i} f={f} inAt={z.at} outAt={318} ax={a.x} ay={a.y} dx={z.up ? 70 : -70} dy={z.up ? -150 : 150} label={`0${i + 1}  ${z.label}`} accent={false} />
        );
      })}
      <div style={{position: 'absolute', left: gx, top: gy - 40, opacity: (1 - out) * prog(f, 236, 250)}}>
        <div style={mono(11, C.dim, 0.22)}>RELATIVE KNIT-DENSITY INTENT</div>
      </div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: (1 - out) * prog(f, 236, 250)}}>
        <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={C.line} />
        {[0, 0.29, 0.54, 0.86, 1].map((t, i) => (
          <line key={i} x1={gx + t * gw} y1={gy + gh} x2={gx + t * gw} y2={gy + gh + 6} stroke={C.line} />
        ))}
        <path d={d} fill="none" stroke={C.lime} strokeWidth={1.6} strokeDasharray={1200} strokeDashoffset={1200 * (1 - draw)} />
      </svg>
      <div style={{position: 'absolute', left: gx, top: gy + gh + 14, width: gw, display: 'flex', justifyContent: 'space-between', opacity: (1 - out) * prog(f, 240, 254), ...mono(10, C.dim, 0.18)}}>
        <span>CUFF</span>
        <span>ELBOW</span>
        <span>FOREARM</span>
        <span>WRIST</span>
      </div>
      <div style={{position: 'absolute', left: gx, top: gy + gh + 36, opacity: (1 - out) * prog(f, 246, 260) * 0.8, ...mono(10, C.faint, 0.18)}}>
        ILLUSTRATIVE · NOT TO SCALE · VALUES TBD IN TECHNICAL REVIEW
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// ELBOW — goniometer + airflow through the open knit
// ---------------------------------------------------------------------------
const ElbowOverlay: React.FC<{f: number; state: StageState}> = ({f, state}) => {
  if (f < 344 || f > 462) return null;
  const R = state.sleeves.find((s) => s.key === 'R');
  if (!R) return null;
  const P = projector(state);
  const vis = prog(f, 348, 362) * (1 - prog(f, 444, 458));
  const e = P(centre(R, 0.45));
  const up = P(centre(R, 0.22));
  const fo = P(centre(R, 0.7));
  const a1 = Math.atan2(up.y - e.y, up.x - e.x);
  const a2 = Math.atan2(fo.y - e.y, fo.x - e.x);
  let da = a2 - a1;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const r = 250;
  const arc = (from: number, delta: number, rr: number) => {
    const n = 40;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = from + (delta * i) / n;
      d += `${i ? 'L' : 'M'} ${(e.x + Math.cos(a) * rr).toFixed(1)} ${(e.y + Math.sin(a) * rr).toFixed(1)} `;
    }
    return d;
  };
  const flexDeg = Math.round((R.pose.flex * 180) / Math.PI);
  // airflow: short strokes leaving the open knit along the surface normal
  const m = sleeveMatrix(R);
  const nm = new THREE.Matrix3().setFromMatrix4(m);
  const cam = makeCamera(state.camera, W / H);
  const flows: React.ReactNode[] = [];
  const airOn = prog(f, 366, 384) * (1 - prog(f, 440, 456));
  for (let i = 0; i < 46; i++) {
    const u = 0.385 + hash(i * 3.1) * 0.15;
    const th = hash(i * 7.7) * Math.PI * 2;
    const {P: sp, n} = surfaceFrame(u, th, R.pose);
    const wp = new THREE.Vector3(...sp).applyMatrix4(m);
    const wn = new THREE.Vector3(...n).applyMatrix3(nm).normalize();
    const facingCam = wn.dot(cam.position.clone().sub(wp).normalize());
    if (facingCam < 0.05) continue;
    const ph = (f / 30) * 0.75 + hash(i * 1.3);
    const head = ph - Math.floor(ph);
    const pts: string[] = [];
    const seg = 8;
    for (let k = 0; k <= seg; k++) {
      const s = head - 0.3 + (k / seg) * 0.3;
      if (s < 0) continue;
      const dist = s * 1.3;
      const q = wp.clone().add(wn.clone().multiplyScalar(dist)).add(new THREE.Vector3(0.12, 0.25, 0).multiplyScalar(dist * dist));
      const pr = P([q.x, q.y, q.z]);
      pts.push(`${pr.x.toFixed(1)},${pr.y.toFixed(1)}`);
    }
    if (pts.length < 2) continue;
    const fade = Math.sin(Math.PI * head) * facingCam;
    flows.push(<polyline key={i} points={pts.join(' ')} fill="none" stroke={i % 3 ? C.ink : C.lime} strokeOpacity={0.75 * fade * airOn} strokeWidth={1.3} strokeLinecap="round" />);
  }
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g opacity={vis}>
          <path d={arc(a1, da, r)} stroke={C.lime} strokeWidth={1.4} fill="none" />
          <path d={arc(a1, da, r + 14)} stroke={C.line} strokeWidth={1} fill="none" strokeDasharray="2 6" />
          <line x1={e.x} y1={e.y} x2={e.x + Math.cos(a1) * (r + 40)} y2={e.y + Math.sin(a1) * (r + 40)} stroke={C.line} strokeDasharray="4 6" />
          <line x1={e.x} y1={e.y} x2={e.x + Math.cos(a2) * (r + 40)} y2={e.y + Math.sin(a2) * (r + 40)} stroke={C.line} strokeDasharray="4 6" />
          <circle cx={e.x} cy={e.y} r={4} fill="none" stroke={C.lime} />
        </g>
        {flows}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: e.x + Math.cos(a1 + da / 2) * (r + 34) - 70,
          top: e.y + Math.sin(a1 + da / 2) * (r + 34) - 22,
          width: 140,
          textAlign: 'center',
          opacity: vis,
        }}
      >
        <div style={{...mono(12, C.dim, 0.2)}}>FLEXION</div>
        <div style={{fontFamily: FONT_SANS, fontWeight: 500, fontSize: 30, color: C.ink, fontVariantNumeric: 'tabular-nums'}}>{flexDeg}°</div>
      </div>
      <Callout f={f} inAt={392} outAt={444} ax={P(facing(state, R, 0.44, 0.0, 0.02)).x} ay={P(facing(state, R, 0.44, 0, 0.02)).y} dx={260} dy={140} label="OPEN KNIT EXPANDS WITH FLEXION" sub="no pad · no bunching · multidirectional stretch" />
    </>
  );
};

// ---------------------------------------------------------------------------
// RAILS — callouts, swing ghost (racket + wrist path)
// ---------------------------------------------------------------------------
const racketOutline = () => {
  // padel racket in (across, along) units ≈ 1 unit = 7.7 cm, scaled ×0.85
  const s = 0.85;
  const face: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const y = 4.15 + Math.sin(a) * 1.75;
    const wdt = 1.68 * Math.cos(a) * (1 - 0.12 * Math.sin(a));
    face.push([wdt * s, y * s]);
  }
  const handle: [number, number][] = [
    [-0.16 * s, 0],
    [-0.16 * s, 1.6 * s],
    [-1.05 * s, 2.75 * s],
  ];
  const handle2: [number, number][] = [
    [0.16 * s, 0],
    [0.16 * s, 1.6 * s],
    [1.05 * s, 2.75 * s],
  ];
  const throat: [number, number][] = [
    [-0.16 * s, 1.6 * s],
    [0, 2.55 * s],
    [0.16 * s, 1.6 * s],
  ];
  return [face, handle, handle2, throat];
};
const RACKET = racketOutline();

const racketAt = (ph: number) => {
  const sw = swingSleeve(ph);
  const spec = {position: sw.pos, quat: sw.quat};
  const p = sw.pose;
  const c1 = (u: number): Vec3 => {
    const a = surfacePoint(u, 0, p);
    const b = surfacePoint(u, Math.PI, p);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  };
  const wr = world(spec, c1(1));
  const w0 = world(spec, c1(0.88));
  const lat = world(spec, surfacePoint(1, 0, p));
  const dir = new THREE.Vector3(wr[0] - w0[0], wr[1] - w0[1], wr[2] - w0[2]).normalize();
  const l = new THREE.Vector3(lat[0] - wr[0], lat[1] - wr[1], lat[2] - wr[2]);
  l.sub(dir.clone().multiplyScalar(l.dot(dir))).normalize();
  const axis = dir.clone().multiplyScalar(Math.cos(0.45)).add(l.clone().multiplyScalar(Math.sin(0.45))).normalize();
  const across = l.clone().sub(axis.clone().multiplyScalar(l.dot(axis))).normalize();
  const base = new THREE.Vector3(...wr).add(dir.clone().multiplyScalar(0.75));
  return {
    wrist: wr,
    lines: RACKET.map((poly) =>
      poly.map(([x, y]) => {
        const q = base.clone().add(axis.clone().multiplyScalar(y)).add(across.clone().multiplyScalar(x));
        return [q.x, q.y, q.z] as Vec3;
      }),
    ),
  };
};

const RailsOverlay: React.FC<{f: number; state: StageState}> = ({f, state}) => {
  if (f < 466 || f > 612) return null;
  const R = state.sleeves.find((s) => s.key === 'R');
  if (!R) return null;
  const P = projector(state);
  const nodes: React.ReactNode[] = [];
  // swing ghost
  if (f >= 506 && f <= 566) {
    const vis = prog(f, 508, 516) * (1 - prog(f, 552, 564));
    const ph = swingPhase(f);
    const path: string[] = [];
    for (let k = 0; k <= 40; k++) {
      const q = (k / 40) * ph;
      const wr = P(racketAt(q).wrist);
      path.push(`${wr.x.toFixed(1)},${wr.y.toFixed(1)}`);
    }
    const tipPath: string[] = [];
    for (let k = 0; k <= 40; k++) {
      const q = (k / 40) * ph;
      const r = racketAt(q).lines[0][16];
      const pr = P(r);
      tipPath.push(`${pr.x.toFixed(1)},${pr.y.toFixed(1)}`);
    }
    const ghosts = [0, 1, 2, 3, 4].map((k) => {
      const q = swingPhase(f - k * 2.2);
      const r = racketAt(q);
      return r.lines.map((poly, j) => (
        <polyline
          key={`${k}-${j}`}
          points={poly.map((pt) => {
            const pr = P(pt);
            return `${pr.x.toFixed(1)},${pr.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={k === 0 ? C.ink : C.dim}
          strokeOpacity={(k === 0 ? 0.75 : 0.3 * (1 - k / 5)) * vis}
          strokeWidth={k === 0 ? 1.4 : 1}
        />
      ));
    });
    nodes.push(
      <svg key="swing" width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <polyline points={tipPath.join(' ')} fill="none" stroke={C.ink} strokeOpacity={0.18 * vis} strokeWidth={1} strokeDasharray="3 7" />
        <polyline points={path.join(' ')} fill="none" stroke={C.lime} strokeOpacity={0.8 * vis} strokeWidth={1.4} />
        {ghosts}
      </svg>,
    );
    nodes.push(
      <div key="sw-l" style={{position: 'absolute', left: 1420, top: 210, opacity: vis}}>
        <div style={mono(12, C.dim, 0.22)}>MOTION STUDY · FOREHAND</div>
        <div style={{...mono(12, C.ink, 0.18), marginTop: 8}}>RAILS FOLLOW PRONATION / SUPINATION</div>
      </div>,
    );
  }
  // draw-on callout: neutral-axis routing
  const elbowSide = P(facing(state, R, 0.47, 0, 0.03));
  nodes.push(
    <Callout key="c1" f={f} inAt={486} outAt={504} ax={elbowSide.x} ay={elbowSide.y} dx={-120} dy={-190} label="ROUTED ALONG THE ELBOW SIDES" sub="clear of the flexion crease and olecranon" />,
  );
  // macro
  if (f > 566) {
    const a = P(facing(state, R, 0.68, -0.1, 0.03));
    nodes.push(<Callout key="c2" f={f} inAt={574} outAt={594} ax={a.x} ay={a.y} dx={-260} dy={-220} label="SILICONE STRETCHES WITH THE KNIT" sub="soft deposited profile · no rigid insert" accent />);
  }
  return <>{nodes}</>;
};

// ---------------------------------------------------------------------------
// LEFT / RIGHT
// ---------------------------------------------------------------------------
const LROverlay: React.FC<{f: number; state: StageState}> = ({f, state}) => {
  if (f < 612 || f > 700) return null;
  const P = projector(state);
  const out = prog(f, 684, 696);
  const nodes: React.ReactNode[] = [];
  for (const k of ['L', 'R'] as const) {
    const s = state.sleeves.find((x) => x.key === k);
    if (!s) continue;
    const b = P(centre(s, 1.04));
    const t = P(centre(s, -0.04));
    const vis = prog(f, k === 'L' ? 640 : 630, k === 'L' ? 656 : 646) * (1 - out);
    nodes.push(
      <div key={k} style={{position: 'absolute', left: b.x - 120, top: b.y + 22, width: 240, textAlign: 'center', opacity: vis}}>
        <div style={{fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: '0.1em'}}>{k}</div>
        <div style={{...mono(11, C.dim, 0.24), marginTop: 6}}>{k === 'L' ? 'LEFT ARM' : 'RIGHT ARM'}</div>
      </div>,
    );
    nodes.push(
      <svg key={`${k}t`} width={W} height={H} style={{position: 'absolute', inset: 0, opacity: vis}}>
        <line x1={t.x - 60} y1={t.y - 26} x2={t.x + 60} y2={t.y - 26} stroke={C.line} />
        <line x1={t.x} y1={t.y - 32} x2={t.x} y2={t.y - 20} stroke={C.lime} />
      </svg>,
    );
  }
  const mirror = prog(f, 606, 630, E.inOut) * (1 - prog(f, 676, 692));
  nodes.push(
    <svg key="mirror" width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <line x1={960} y1={lerp(540, 150, mirror)} x2={960} y2={lerp(540, 930, mirror)} stroke={C.lime} strokeOpacity={0.6 * mirror} strokeDasharray="2 8" />
      <text x={972} y={168} fill={C.dim} opacity={mirror} style={{fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.24em'}}>
        MIRROR PLANE
      </text>
    </svg>,
  );
  return <>{nodes}</>;
};

// ---------------------------------------------------------------------------
// CONSTRUCTION
// ---------------------------------------------------------------------------
const BuildOverlay: React.FC<{f: number; state: StageState}> = ({f, state}) => {
  if (f < 692 || f > 812) return null;
  const items = [
    {a: 700, b: 736, t: 'SEAMLESS TUBULAR BODY', s: 'CONTINUOUS CIRCULAR KNIT · NO LONGITUDINAL SEAM'},
    {a: 744, b: 764, t: 'SECURE UPPER CUFF', s: 'INTERNAL ANTI-SLIP GRIP · NO BULKY ELASTIC BAND'},
    {a: 772, b: 796, t: 'LOW-PROFILE WRIST', s: 'THIN SOFT HEM · NO SILICONE RING'},
  ];
  return (
    <>
      {items.map((it, i) => (
        <SectionTitle key={i} f={f} inAt={it.a} outAt={it.b} index={`06 · ${String.fromCharCode(65 + i)}`} title={it.t} sub={it.s} subAt={it.a + 6} />
      ))}
      <div style={{position: 'absolute', right: 128, top: 160, opacity: prog(f, 704, 716) * (1 - prog(f, 730, 740)), textAlign: 'right'}}>
        <div style={mono(11, C.dim, 0.22)}>PREFERRED CONSTRUCTION</div>
        <div style={{...mono(11, C.faint, 0.22), marginTop: 6}}>SUBJECT TO MANUFACTURER FEASIBILITY</div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// HERO
// ---------------------------------------------------------------------------
export const HeroTitle: React.FC<{f: number; at?: number}> = ({f, at = 818}) => {
  if (f < at - 4) return null;
  return (
    <div style={{position: 'absolute', left: 140, top: 388}}>
      <Wordmark size={112} f={f} at={at} />
      <div style={{marginTop: 22}}>
        <ArmPro size={38} f={f} at={at + 10} />
      </div>
      <div style={{width: 64 * E.settle(clamp01((f - at - 18) / 20)), height: 2, background: C.lime, marginTop: 40}} />
      <Mask p={(f - at - 22) / 20} style={{marginTop: 26}}>
        <div style={{fontFamily: FONT_SANS, fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: C.ink}}>SUPPORT WITHOUT RESTRICTING MOTION</div>
      </Mask>
      <Mask p={(f - at - 40) / 20} style={{marginTop: 120}}>
        <div style={mono(12, C.dim, 0.3)}>
          PRELIMINARY ENGINEERING CONCEPT <span style={{color: C.faint}}>· NOT A VALIDATED SPECIFICATION</span>
        </div>
      </Mask>
    </div>
  );
};

// ---------------------------------------------------------------------------
export const Overlays: React.FC<{f: number; state: StageState}> = ({f, state}) => (
  <>
    <Intro f={f} />
    <SectionTitle f={f} inAt={128} outAt={200} index="01" title="Anatomical compression system" sub="SEAMLESS · ANATOMICAL · LEFT / RIGHT" />
    <SectionTitle f={f} inAt={222} outAt={322} index="02" title="Zonal compression" sub="GRADUATED KNIT DENSITY · SMOOTH TRANSITIONS, NO PANELS" />
    <ZonesOverlay f={f} state={state} />
    <SectionTitle f={f} inAt={350} outAt={446} index="03" title="Elbow flex zone" sub="BREATHABLE · HIGH-STRETCH KNIT" subAt={372} />
    <ElbowOverlay f={f} state={state} />
    <SectionTitle f={f} inAt={470} outAt={600} index="04" title="Flexible silicone support rails" sub="FUNCTIONAL — NOT DECORATIVE" subAt={484} size={48} />
    <RailsOverlay f={f} state={state} />
    <SectionTitle f={f} inAt={622} outAt={688} index="05" title={"Left / Right\nanatomical design"} sub="MIRRORED ZONES AND RAIL GEOMETRY" size={46} y={760} />
    <LROverlay f={f} state={state} />
    <BuildOverlay f={f} state={state} />
    <HeroTitle f={f} />
  </>
);
