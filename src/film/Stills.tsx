import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {StageCanvas} from '../components/StageCanvas';
import {deg} from '../director/math';
import {faceH, faceV, stageAt} from '../director/director';
import {restPose, RAILS as RAIL_DEFS, railCentre, surfaceFrame, Vec3} from '../model/sleeve';
import {sleeveMatrix} from '../three/stage';
import * as THREE from 'three';
const worldOf = (s: {position: Vec3; quat: [number, number, number, number]}, p: Vec3): Vec3 => {
  const v = new THREE.Vector3(...p).applyMatrix4(sleeveMatrix(s));
  return [v.x, v.y, v.z];
};
import {StageState} from '../three/stage';
import {Backdrop, centre, facing, HeroTitle, projector} from "./Overlays";
import {C, Callout, mono} from './ui';
import {FONT_SANS} from '../fonts';

const W = 1920;
const H = 1080;
const RAILS = {draw: 1, trace: -1, traceAmt: 0, glow: 0};

/** 1 — clean hero frame (final composition, no HUD) */
export const HeroStill: React.FC = () => {
  const state = useMemo(() => stageAt(880), []);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop f={880} state={state} />
      <StageCanvas state={state} width={W} height={H} pixelRatio={2} />
      <HeroTitle f={2000} />
    </AbsoluteFill>
  );
};

/** 2 — LEFT / RIGHT, FRONT / BACK technical frame */
export const TechSheetStill: React.FC = () => {
  const xs = [-5.7, -1.9, 1.9, 5.7];
  const views = [
    {key: 'LF', mirror: true, a: 0, label: 'LEFT · FRONT'},
    {key: 'LB', mirror: true, a: 180, label: 'LEFT · BACK'},
    {key: 'RF', mirror: false, a: 0, label: 'RIGHT · FRONT'},
    {key: 'RB', mirror: false, a: 180, label: 'RIGHT · BACK'},
  ];
  const state: StageState = useMemo(
    () => ({
      camera: {pos: [0, -0.55, 21.5], target: [0, -0.55, 0], fov: 28},
      light: 1,
      exposure: 1.05,
      focusZ: 21.5,
      focusRange: 8,
      time: 0,
      sleeves: views.map((v, i) => ({
        key: v.key,
        pose: {...restPose(v.mirror), flex: deg(6)},
        position: [xs[i], 0, 0],
        quat: faceV(v.a),
        fx: {},
        rails: RAILS,
      })),
    }),
    [],
  );
  const P = projector(state);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop f={300} state={state} />
      <StageCanvas state={state} width={W} height={H} pixelRatio={2} />
      <div style={{position: 'absolute', left: 96, top: 64}}>
        <div style={mono(13, C.lime, 0.28)}>KORVE ARM PRO · TECHNICAL VIEWS</div>
        <div style={{fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: '0.05em', marginTop: 10}}>
          LEFT / RIGHT — MIRRORED ANATOMICAL LAYOUT
        </div>
      </div>
      <div style={{position: 'absolute', right: 96, top: 70, textAlign: 'right', ...mono(11, C.dim, 0.22), lineHeight: 1.9}}>
        PRELIMINARY ENGINEERING CONCEPT
        <br />
        SPECS, DIMENSIONS AND MATERIALS TBD IN TECHNICAL REVIEW
      </div>
      {state.sleeves.map((s, i) => {
        const b = P(centre(s, 1.05));
        return (
          <div key={s.key} style={{position: 'absolute', left: b.x - 120, top: b.y + 18, width: 240, textAlign: 'center', ...mono(13, C.ink, 0.24)}}>
            {views[i].label}
          </div>
        );
      })}
      {/* dividers */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <line x1={960} y1={190} x2={960} y2={1000} stroke={C.line} strokeDasharray="2 8" />
      </svg>
      {(() => {
        const rf = state.sleeves[2];
        const rb = state.sleeves[3];
        const a = P(facing(state, rf, 0.08, 0, 0.02));
        const e = P(facing(state, rb, 0.45, 0, 0.02));
        const r = P(facing(state, rb, 0.66, 0.5, 0.03));
        const w = P(facing(state, rf, 0.97, 0, 0.02));
        const z = P(facing(state, rf, 0.7, 0, 0.02));
        return (
          <>
            <Callout f={100} inAt={0} outAt={1000} ax={e.x} ay={e.y} dx={110} dy={-60} label="ELBOW FLEX ZONE" sub="open, high-stretch knit" />
            <Callout f={100} inAt={0} outAt={1000} ax={r.x} ay={r.y} dx={90} dy={120} label="SILICONE RAILS" sub="mirrored L / R" accent />
            <Callout f={100} inAt={0} outAt={1000} ax={a.x} ay={a.y} dx={-120} dy={-40} label="UPPER CUFF" sub="internal anti-slip grip" />
            <Callout f={100} inAt={0} outAt={1000} ax={z.x} ay={z.y} dx={-120} dy={40} label="FOREARM ZONE" sub="directional knit" />
            <Callout f={100} inAt={0} outAt={1000} ax={w.x} ay={w.y} dx={-120} dy={10} label="LOW-PROFILE WRIST" />
          </>
        );
      })()}
    </AbsoluteFill>
  );
};

/** 3 — silicone rail + textile macro */
export const RailMacroStill: React.FC = () => {
  const state: StageState = useMemo(
    () => ({
      camera: {pos: [1.35, 0.32, 1.75], target: [1.05, 0.02, 0], fov: 26},
      light: 1,
      exposure: 1.05,
      focusZ: 1.75,
      focusRange: 0.7,
      time: 0,
      sleeves: [
        {
          key: 'R',
          pose: {...restPose(false), flex: deg(8)},
          position: [-0.1, 0, 0],
          quat: faceH(-30, 0.06),
          fx: {},
          rails: RAILS,
        },
      ],
    }),
    [],
  );
  const P = projector(state);
  // anchor on the rail crown closest to frame centre
  const sp = state.sleeves[0];
  let a = {x: 960, y: 540};
  let best = 1e9;
  for (const def of RAIL_DEFS) {
    for (let i = 0; i <= 20; i++) {
      const c = railCentre(def, i / 20);
      const {P: p, n} = surfaceFrame(c.u, c.th, sp.pose);
      const lift = def.height * 0.9;
      const q = P(worldOf(sp, [p[0] + n[0] * lift, p[1] + n[1] * lift, p[2] + n[2] * lift]));
      const d = Math.hypot(q.x - 1050, q.y - 420);
      if (q.ok && d < best) {
        best = d;
        a = q;
      }
    }
  }
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop f={300} state={state} />
      <StageCanvas state={state} width={W} height={H} pixelRatio={2} />
      <div style={{position: 'absolute', left: 96, bottom: 84}}>
        <div style={mono(13, C.lime, 0.28)}>DETAIL · SILICONE RAIL ON KNIT</div>
        <div style={{fontFamily: FONT_SANS, fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: '0.05em', marginTop: 10}}>
          SOFT SILICONE, DEPOSITED ON TEXTILE
        </div>
        <div style={{...mono(13, C.dim, 0.2), marginTop: 12}}>NARROW-TO-MEDIUM WIDTH · LOW PROFILE · STRETCHES WITH THE KNIT · CONCEPT ONLY</div>
      </div>
      <Callout f={100} inAt={0} outAt={1000} ax={a.x} ay={a.y} dx={-220} dy={200} label="CONTINUOUS CURVED RAIL" sub="width / thickness / hardness to be defined" accent />
    </AbsoluteFill>
  );
};
