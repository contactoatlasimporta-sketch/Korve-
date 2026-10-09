/**
 * Director — one continuous 3D shot list. Every frame is a pure function of the
 * frame number (deterministic, render-order independent). Scenes overlap and
 * are blended (camera, poses, orientations, effects) so the film flows as a
 * single camera move instead of hard cuts.
 */
import {Pose, restPose, Vec3, surfacePoint, surfaceFrame, RAILS, railCentre} from '../model/sleeve';
import {CameraState, defaultFx, RailFx, SleeveSpec, StageState, TextileFx, toWorld} from '../three/stage';
import {clamp01, deg, E, hash, lerp, lerp3, orient, prog, Quat, rotateVec, slerp} from './math';

export const FPS = 30;
export const DURATION = 900;

export const SCENES = {
  intro: [0, 90],
  reveal: [90, 210],
  zones: [210, 330],
  elbow: [330, 450],
  rails: [450, 600],
  lr: [600, 690],
  build: [690, 795],
  hero: [795, 900],
} as const;

type SleeveState = {
  key: 'R' | 'L';
  pose: Pose;
  pos: Vec3;
  quat: Quat;
  fx: Partial<TextileFx>;
  rails: RailFx | null;
};

type Shot = {
  camera: CameraState;
  light: number;
  exposure: number;
  focusZ: number;
  focusRange: number;
  sleeves: SleeveState[];
};

const HIDDEN_L = (): SleeveState => ({
  key: 'L',
  pose: restPose(true),
  pos: [-30, 0, 0],
  quat: orient([0, -1, 0], [0, 0, 1]),
  fx: {reveal: 0},
  rails: {draw: 1, trace: -1, traceAmt: 0, glow: 0},
});

const RAILS_OFF: RailFx = {draw: 0, trace: -1, traceAmt: 0, glow: 0};
const RAILS_ON: RailFx = {draw: 1, trace: -1, traceAmt: 0, glow: 0};

/** horizontal sleeve (cuff left → wrist right) with the face at angle θ (deg) turned to camera */
export const faceH = (thetaDeg: number, tilt = 0): Quat => {
  const t = deg(thetaDeg);
  const ant: Vec3 = [0, -Math.cos(t), Math.sin(t)];
  // tilt the whole presentation toward camera (rotate about world X)
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const antT: Vec3 = [ant[0], ant[1] * c - ant[2] * s, ant[1] * s + ant[2] * c];
  const longT: Vec3 = [1, 0, 0];
  return orient(longT, antT);
};

/** vertical sleeve (cuff up), α rotates about the vertical axis */
export const faceV = (alphaDeg: number): Quat => {
  const a = deg(alphaDeg);
  return orient([0, -1, 0], [Math.sin(a), 0, Math.cos(a)]);
};

const cam = (pos: Vec3, target: Vec3, fov = 30, roll = 0): CameraState => ({pos, target, fov, roll});

// ---------------------------------------------------------------------------
// Shots
// ---------------------------------------------------------------------------

const H_POS: Vec3 = [-0.3, 0, 0]; // horizontal layout: sleeve spans x ≈ -3 … +3

function shotReveal(f: number): Shot {
  const p = prog(f, 84, 214, E.move);
  const spin = lerp(-38, 8, prog(f, 84, 230, E.inOut));
  const camPos = lerp3([-2.9, 0.55, 4.0], [2.3, 0.35, 4.4], p);
  const camTgt = lerp3([-2.4, 0.05, 0], [1.9, -0.05, 0], p);
  return {
    camera: cam(camPos, camTgt, 30, lerp(-0.04, 0.02, p)),
    light: 0.25 + 0.75 * prog(f, 92, 150, E.inOut),
    exposure: 1,
    focusZ: 4.1,
    focusRange: 2.2,
    sleeves: [
      {
        key: 'R',
        pose: {...restPose(false)},
        pos: H_POS,
        quat: faceH(60 + spin, 0.2),
        fx: {reveal: lerp(0, 1.06, prog(f, 88, 158, E.inOut)), revealDir: 1},
        rails: RAILS_OFF,
      },
      HIDDEN_L(),
    ],
  };
}

function shotZones(f: number): Shot {
  const p = prog(f, 205, 340, E.inOut);
  const scan = f < 222 ? -1 : f > 300 ? 1.2 : lerp(-0.02, 1.08, prog(f, 222, 296, E.inOut));
  const zf = (a: number) => clamp01(1 - Math.abs((scan - a) / 0.16));
  return {
    camera: cam(lerp3([0.25, 1.2, 11.2], [0.1, 0.9, 10.4], p), [0.15, -0.15, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 10.8,
    focusRange: 5,
    sleeves: [
      {
        key: 'R',
        pose: restPose(false),
        pos: H_POS,
        quat: faceH(68, 0.2),
        fx: {
          scanU: scan > 1.1 ? -1 : scan,
          zones: prog(f, 222, 240) * (1 - prog(f, 318, 334)),
          zoneFocus: [zf(0.22), zf(0.45), zf(0.7), zf(0.93)].map((v, i) =>
            f > 296 ? 0.55 : Math.max(v, scan > [0.34, 0.54, 0.86, 1.0][i] ? 0.45 : 0),
          ) as [number, number, number, number],
          contour: prog(f, 226, 250) * (1 - prog(f, 316, 334)),
          contourProg: prog(f, 228, 300, E.inOut),
        },
        rails: RAILS_OFF,
      },
      HIDDEN_L(),
    ],
  };
}

export const elbowFlex = (f: number) => {
  // 20° → 105° → 62°, smooth and controlled
  const a = lerp(20, 105, prog(f, 352, 398, E.inOut));
  const b = lerp(0, -43, prog(f, 412, 448, E.inOut));
  return deg(a + b);
};

function shotElbow(f: number): Shot {
  const p = prog(f, 322, 352, E.move);
  const flex = f < 340 ? deg(20) * prog(f, 318, 342, E.inOut) : elbowFlex(f);
  const push = prog(f, 350, 450, E.inOut);
  return {
    camera: cam(lerp3([0.55, 0.85, 5.4], [0.35, 0.7, 4.6], push), lerp3([0.45, 0.55, 0], [0.3, 0.5, 0], push), 30),
    light: 1,
    exposure: 1,
    focusZ: 4.9,
    focusRange: 1.8,
    sleeves: [
      {
        key: 'R',
        pose: {...restPose(false), flex},
        pos: [0, 0, 0],
        quat: faceH(lerp(150, 205, p), 0.12),
        fx: {stretchViz: prog(f, 356, 380) * (1 - prog(f, 440, 456))},
        rails: RAILS_OFF,
      },
      HIDDEN_L(),
    ],
  };
}

// --- swing kinematics -------------------------------------------------------
const SHOULDER: Vec3 = [-0.6, 3.0, 0];
export const swingPhase = (f: number) => {
  // wind-up hold → fast acceleration → follow-through settle
  return prog(f, 510, 538, E.swing);
};
export const swingPose = (ph: number) => {
  const phi = lerp(deg(-96), deg(78), ph);
  const long: Vec3 = [Math.sin(phi), -Math.cos(phi), 0];
  const ant: Vec3 = [Math.cos(phi), Math.sin(phi), -0.35];
  const q = orient(long, ant);
  const contact = Math.exp(-Math.pow((ph - 0.55) / 0.3, 2));
  const flex = deg(lerp(48, 30, ph) - 14 * contact);
  const pron = lerp(-0.45, 0.95, E.inOut(clamp01(ph * 1.15)));
  return {q, flex, pron};
};
export const swingSleeve = (ph: number): {pos: Vec3; quat: Quat; pose: Pose} => {
  const {q, flex, pron} = swingPose(ph);
  // pivot (elbow) = shoulder + R·(elbow − cuff top)
  const e = toWorld({position: [0, 0, 0], quat: q}, [0, 0, 0]);
  const pos: Vec3 = [SHOULDER[0] - e[0], SHOULDER[1] - e[1], SHOULDER[2] - e[2]];
  return {pos, quat: q, pose: {...restPose(false), flex, pron}};
};

function shotRails(f: number): Shot {
  // A: rails draw on (lateral/dorsal face to camera)
  const drawn = prog(f, 466, 500, E.inOut);
  const a: Shot = {
    camera: cam(lerp3([0.6, 0.6, 7.4], [0.9, 0.45, 6.6], prog(f, 450, 505)), [0.75, -0.05, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 7.0,
    focusRange: 3,
    sleeves: [
      {
        key: 'R',
        pose: {...restPose(false), flex: deg(lerp(62, 12, prog(f, 446, 478, E.inOut)))},
        pos: [-0.1, 0, 0],
        quat: faceH(lerp(-20, -36, prog(f, 450, 505)), 0.16),
        fx: {},
        rails: {draw: drawn, trace: -1, traceAmt: 0, glow: 0},
      },
      HIDDEN_L(),
    ],
  };
  // B: swing
  const ph = swingPhase(f);
  const sw = swingSleeve(ph);
  const tr = prog(f, 512, 546, E.inOut);
  const b: Shot = {
    camera: cam([0.7, -0.4, 18.5], [0.7, -0.7, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 16.5,
    focusRange: 8,
    sleeves: [
      {
        key: 'R',
        pose: sw.pose,
        pos: sw.pos,
        quat: sw.quat,
        fx: {},
        rails: {draw: 1, trace: lerp(-0.2, 1.25, tr), traceAmt: prog(f, 508, 516) * (1 - prog(f, 548, 558)), glow: 0},
      },
      HIDDEN_L(),
    ],
  };
  // C: macro co-deformation — rest → stretch → rail deforms with knit → recovery
  const st = stretchAmount(f);
  const cq = faceH(-24, 0.08);
  const cpos: Vec3 = [-0.1, 0, 0];
  const anc = railPoint(restPose(false), cpos, cq, 0, 0.5, 0);
  const drift = prog(f, 548, 618);
  const camPos: Vec3 = [
    anc.p[0] + anc.n[0] * lerp(2.5, 2.3, drift) - 0.55,
    anc.p[1] + anc.n[1] * lerp(2.5, 2.3, drift) + 0.25,
    anc.p[2] + anc.n[2] * lerp(2.5, 2.3, drift),
  ];
  const c: Shot = {
    camera: cam(camPos, [anc.p[0] + 0.08, anc.p[1], anc.p[2]], 30),
    light: 1,
    exposure: 1,
    focusZ: 2.4,
    focusRange: 1.0,
    sleeves: [
      {
        key: 'R',
        pose: {...restPose(false), circ: 0.07 * st, long: 0.3 * st, stretchU: STRETCH_U, stretchW: 0.085},
        pos: cpos,
        quat: cq,
        fx: {grid: 0.6 * prog(f, 556, 566) * (1 - prog(f, 606, 616))},
        rails: RAILS_ON,
      },
      HIDDEN_L(),
    ],
  };
  if (f < 495) return a;
  if (f < 508) return blend(a, b, prog(f, 495, 508, E.move));
  if (f < 546) return b;
  if (f < 560) return blend(b, c, prog(f, 546, 560, E.move));
  return c;
}

export const STRETCH_U = 0.6;
/** 0 rest → 1 stretched → 0 recovered */
export const stretchAmount = (f: number) => prog(f, 568, 582, E.inOut) * (1 - prog(f, 590, 604, E.inOut));

/** world position + normal of a point on a rail centreline */
export const railPoint = (pose: Pose, pos: Vec3, quat: Quat, idx: number, t: number, lift = 0) => {
  const c = railCentre(RAILS[idx], t);
  const {P, n} = surfaceFrame(c.u, c.th, pose);
  return {p: toWorld({position: pos, quat}, [P[0] + n[0] * lift, P[1] + n[1] * lift, P[2] + n[2] * lift]), n: rotateVec(quat, n)};
};

function shotLR(f: number): Shot {
  const split = prog(f, 622, 652, E.move);
  const rot = prog(f, 644, 698, E.inOut);
  const alpha = lerp(0, 72, rot);
  const camP = lerp3([0, -0.7, 18.2], [0, -0.75, 17.4], prog(f, 610, 704));
  return {
    camera: cam(camP, [0, -0.75, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 16,
    focusRange: 6,
    sleeves: [
      {
        key: 'R',
        pose: {...restPose(false), flex: deg(6)},
        pos: [lerp(0, 2.0, split), 0, 0],
        quat: faceV(-alpha),
        fx: {},
        rails: RAILS_ON,
      },
      {
        key: 'L',
        pose: {...restPose(true), flex: deg(6)},
        pos: [lerp(0, -2.0, split), 0, -0.01],
        quat: faceV(alpha),
        fx: {reveal: lerp(0, 1.06, prog(f, 624, 656, E.inOut)), revealDir: 1},
        rails: RAILS_ON,
      },
    ],
  };
}

export const SPIN_A = 700;
export const SPIN_B = 750;
function shotBuild(f: number): Shot {
  // a) 360° seamless spin (700–750) b) cuff cutaway: internal grip vs external rail (754–782) c) wrist (788–808)
  const base = (q: Quat): SleeveState => ({
    key: 'R',
    pose: {...restPose(false), flex: deg(8)},
    pos: [0, 0, 0],
    quat: q,
    fx: {},
    rails: RAILS_ON,
  });
  // the tube turns a full 360° about its own axis in front of a macro camera
  const spin = prog(f, SPIN_A, SPIN_B, E.inOut);
  const a: Shot = {
    camera: cam(lerp3([0.35, 0.55, 3.2], [0.55, 0.45, 2.95], prog(f, 690, 752)), [1.45, 0.02, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 3.0,
    focusRange: 1.4,
    sleeves: [
      {
        ...base(faceH(70 + 360 * spin, 0.05)),
        fx: {seam: prog(f, 702, 710) * (1 - prog(f, 750, 758)), seamProg: spin, seamU: 0.71},
      },
      HIDDEN_L(),
    ],
  };
  const b: Shot = {
    camera: cam(lerp3([-4.75, 1.75, 2.95], [-4.55, 1.62, 2.75], prog(f, 748, 786)), [-2.25, 0.08, 0.1], 30),
    light: 1,
    exposure: 1,
    focusZ: 3.2,
    focusRange: 1.8,
    sleeves: [{...base(faceH(70, 0)), fx: {cut: prog(f, 756, 770, E.settle), grip: prog(f, 764, 774)}}, HIDDEN_L()],
  };
  const c: Shot = {
    camera: cam(lerp3([4.9, 0.85, 2.3], [4.7, 0.75, 2.1], prog(f, 780, 812)), [3.1, -0.05, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 2.6,
    focusRange: 1.4,
    sleeves: [{...base(faceH(70, 0)), fx: {wristMark: prog(f, 790, 798) * (1 - prog(f, 806, 814))}}, HIDDEN_L()],
  };
  if (f < 746) return a;
  if (f < 756) return blend(a, b, prog(f, 746, 756, E.move));
  if (f < 780) return b;
  if (f < 790) return blend(b, c, prog(f, 780, 790, E.move));
  return c;
}

function shotHero(f: number): Shot {
  const drift = lerp(-6, 6, prog(f, 790, 900, E.inOut));
  return {
    camera: cam(lerp3([-2.3, -1.6, 15.2], [-2.2, -1.4, 14.4], prog(f, 790, 900, E.inOut)), [-2.3, -0.45, 0], 30),
    light: 1,
    exposure: 1,
    focusZ: 15,
    focusRange: 6,
    sleeves: [
      {key: 'R', pose: {...restPose(false), flex: deg(10)}, pos: [1.85, 0, 0], quat: faceV(-38 - drift), fx: {}, rails: RAILS_ON},
      {key: 'L', pose: {...restPose(true), flex: deg(10)}, pos: [-1.85, 0, 0], quat: faceV(38 + drift), fx: {}, rails: RAILS_ON},
    ],
  };
}

// ---------------------------------------------------------------------------
// Blending
// ---------------------------------------------------------------------------
const lerpFx = (a: Partial<TextileFx>, b: Partial<TextileFx>, t: number): Partial<TextileFx> => {
  const A = {...defaultFx(), ...a};
  const B = {...defaultFx(), ...b};
  const out = {} as TextileFx;
  (Object.keys(A) as (keyof TextileFx)[]).forEach((k) => {
    const va = A[k];
    const vb = B[k];
    if (Array.isArray(va)) (out[k] as number[]) = (va as number[]).map((x, i) => lerp(x, (vb as number[])[i], t));
    else (out[k] as number) = lerp(va as number, vb as number, t);
  });
  // effects that must not "slide" — snap discrete states
  out.scanU = t < 0.5 ? A.scanU : B.scanU;
  out.revealDir = t < 0.5 ? A.revealDir : B.revealDir;
  return out;
};
const lerpRails = (a: RailFx | null, b: RailFx | null, t: number): RailFx => {
  const A = a ?? RAILS_OFF;
  const B = b ?? RAILS_OFF;
  return {draw: lerp(A.draw, B.draw, t), trace: t < 0.5 ? A.trace : B.trace, traceAmt: lerp(A.traceAmt, B.traceAmt, t), glow: lerp(A.glow, B.glow, t)};
};
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  flex: lerp(a.flex, b.flex, t),
  pron: lerp(a.pron, b.pron, t),
  circ: lerp(a.circ, b.circ, t),
  long: lerp(a.long, b.long, t),
  stretchU: lerp(a.stretchU, b.stretchU, t),
  stretchW: lerp(a.stretchW, b.stretchW, t),
  mirror: a.mirror,
});

export function blend(a: Shot, b: Shot, t: number): Shot {
  const sleeves = a.sleeves.map((sa) => {
    const sb = b.sleeves.find((s) => s.key === sa.key) ?? sa;
    return {
      key: sa.key,
      pose: lerpPose(sa.pose, sb.pose, t),
      pos: lerp3(sa.pos, sb.pos, t),
      quat: slerp(sa.quat, sb.quat, t),
      fx: lerpFx(sa.fx, sb.fx, t),
      rails: lerpRails(sa.rails, sb.rails, t),
    };
  });
  return {
    camera: {
      pos: lerp3(a.camera.pos, b.camera.pos, t),
      target: lerp3(a.camera.target, b.camera.target, t),
      fov: lerp(a.camera.fov, b.camera.fov, t),
      roll: lerp(a.camera.roll ?? 0, b.camera.roll ?? 0, t),
    },
    light: lerp(a.light, b.light, t),
    exposure: lerp(a.exposure, b.exposure, t),
    focusZ: lerp(a.focusZ, b.focusZ, t),
    focusRange: lerp(a.focusRange, b.focusRange, t),
    sleeves,
  };
}

/** transitions: [startFrame, endFrame] where shot i hands over to shot i+1 */
const SHOTS: {fn: (f: number) => Shot; until: number; tr: number}[] = [
  {fn: shotReveal, until: 214, tr: 26}, // reveal → zones (camera pulls back to full view)
  {fn: shotZones, until: 340, tr: 26}, // zones → elbow (push in + rotate)
  {fn: shotElbow, until: 462, tr: 22}, // elbow → rails
  {fn: shotRails, until: 626, tr: 20}, // macro → L/R pull back
  {fn: shotLR, until: 706, tr: 16}, // L/R → construction spin
  {fn: shotBuild, until: 826, tr: 18}, // wrist → hero
  {fn: shotHero, until: 99999, tr: 0},
];

export function shotAt(f: number): Shot {
  for (let i = 0; i < SHOTS.length; i++) {
    const s = SHOTS[i];
    if (f < s.until - s.tr || i === SHOTS.length - 1) return s.fn(f);
    if (f < s.until) {
      const t = E.move(clamp01((f - (s.until - s.tr)) / s.tr));
      return blend(s.fn(f), SHOTS[i + 1].fn(f), t);
    }
  }
  return shotHero(f);
}

// ---------------------------------------------------------------------------
// Public: full stage state for a frame (+ ghost trails)
// ---------------------------------------------------------------------------
export function stageAt(f: number): StageState {
  const s = shotAt(f);
  const sleeves: SleeveSpec[] = s.sleeves
    .filter((x) => (x.fx.reveal ?? 2) > 0.001)
    .map((x) => ({key: x.key, pose: x.pose, position: x.pos, quat: x.quat, fx: x.fx, rails: x.rails}));

  // swing ghost trails (technical motion study)
  if (f >= 506 && f <= 562) {
    const vis = prog(f, 506, 514) * (1 - prog(f, 546, 558));
    for (let k = 1; k <= 6; k++) {
      const ph = swingPhase(f - k * 1.6);
      const sw = swingSleeve(ph);
      sleeves.push({key: `g${k}`, pose: sw.pose, position: sw.pos, quat: sw.quat, ghost: 0.5 * vis * (1 - k / 7)});
    }
  }
  if (f < 84) {
    return {...s, sleeves: [], time: f / FPS};
  }
  return {
    camera: s.camera,
    light: s.light,
    exposure: s.exposure,
    focusZ: s.focusZ,
    focusRange: s.focusRange,
    sleeves,
    time: f / FPS,
  };
}

export {surfacePoint, RAILS, railCentre, hash};
