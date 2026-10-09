import * as THREE from 'three';
import {Easing} from 'remotion';
import type {Vec3} from '../model/sleeve';

export type Quat = [number, number, number, number];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const deg = (d: number) => (d * Math.PI) / 180;

// Signature curves — slow-in / long settle, nothing linear, nothing "PowerPoint".
export const E = {
  move: Easing.bezier(0.65, 0, 0.25, 1), // deliberate camera move
  settle: Easing.bezier(0.16, 1, 0.3, 1), // expo-out settle
  inOut: Easing.bezier(0.45, 0, 0.2, 1),
  accel: Easing.bezier(0.5, 0, 0.9, 0.4),
  swing: Easing.bezier(0.55, 0, 0.15, 1),
};

/** progress of frame f inside [a, b], eased */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = E.inOut) =>
  ease(clamp01((f - a) / (b - a)));

/** critically damped spring response (deterministic, frame based) */
export const springTo = (f: number, start: number, stiffness = 0.12, damping = 1.0) => {
  const t = Math.max(0, f - start);
  const w = Math.sqrt(stiffness);
  const z = damping;
  if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Orientation from anatomy: `long` = world direction the sleeve runs from
 * cuff to wrist, `ant` = world direction the anterior (front) face points.
 * `spin` rotates about the sleeve's own long axis.
 */
export const orient = (long: Vec3, ant: Vec3, spin = 0): Quat => {
  const yl = norm([-long[0], -long[1], -long[2]]);
  const d = ant[0] * yl[0] + ant[1] * yl[1] + ant[2] * yl[2];
  const zl = norm([ant[0] - d * yl[0], ant[1] - d * yl[1], ant[2] - d * yl[2]]);
  const xl: Vec3 = [yl[1] * zl[2] - yl[2] * zl[1], yl[2] * zl[0] - yl[0] * zl[2], yl[0] * zl[1] - yl[1] * zl[0]];
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...xl), new THREE.Vector3(...yl), new THREE.Vector3(...zl));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin));
  return [q.x, q.y, q.z, q.w];
};

export const slerp = (a: Quat, b: Quat, t: number): Quat => {
  const q = new THREE.Quaternion(...a).slerp(new THREE.Quaternion(...b), t);
  return [q.x, q.y, q.z, q.w];
};

export const rotateVec = (q: Quat, v: Vec3): Vec3 => {
  const r = new THREE.Vector3(...v).applyQuaternion(new THREE.Quaternion(...q));
  return [r.x, r.y, r.z];
};

/** deterministic hash → [0,1) */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
