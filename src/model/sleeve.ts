/**
 * KORVE ARM PRO — parametric sleeve model.
 *
 * The sleeve is a single continuous tube surface S(u, θ):
 *   u ∈ [0, 1]  along the arm (0 = upper cuff, 1 = wrist hem)
 *   θ ∈ [0, 2π) around the arm, anatomical convention:
 *       θ = 0      lateral  (thumb side / outside of the arm)
 *       θ = π/2    anterior (front, biceps / antecubital crease)
 *       θ = π      medial   (inside of the arm)
 *       θ = 3π/2   posterior (back, olecranon)
 *
 * Rest pose hangs along -Y with anterior facing +Z. A RIGHT sleeve has its
 * lateral side on +X; the LEFT sleeve is a true mirror (x → -x), so every
 * zone and rail is anatomically mirrored rather than relabelled.
 *
 * Everything that sits on the textile (knit zones, silicone rails, grids) is
 * attached in (u, θ) space, so it follows bend, twist and stretch exactly the
 * way a printed / deposited element would follow the fabric.
 *
 * Units: 1 unit ≈ 7.7 cm. Sleeve length 6 units ≈ 46 cm.
 */

export const SLEEVE_LENGTH = 6.0;
export const U_ELBOW = 0.45;
const BEND_HALF = 0.14; // half-width of the bend region in u
const HINGE_K = 0.45; // hinge axis offset toward anterior (fraction of elbow radius)
const TAU = Math.PI * 2;

export type Pose = {
  flex: number; // elbow flexion (rad) — 0 = straight
  pron: number; // forearm twist at the wrist (rad)
  circ: number; // local circumferential stretch (0 = rest, 0.15 = +15 %)
  long: number; // local longitudinal stretch (0 = rest)
  stretchU: number; // centre of the local stretch field (u)
  stretchW: number; // width of the local stretch field (u)
  mirror: boolean; // LEFT sleeve
};

export const restPose = (mirror = false): Pose => ({
  flex: 0,
  pron: 0,
  circ: 0,
  long: 0,
  stretchU: 0.68,
  stretchW: 0.12,
  mirror,
});

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const smoother = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// ---------- radius profile (monotone cubic through anatomical stations) ----------
const R_PTS: [number, number][] = [
  [0.0, 0.615],
  [0.06, 0.622],
  [0.16, 0.612],
  [0.28, 0.585],
  [0.38, 0.552],
  [0.45, 0.538],
  [0.54, 0.556],
  [0.62, 0.552],
  [0.72, 0.515],
  [0.82, 0.452],
  [0.92, 0.392],
  [0.975, 0.368],
  [1.0, 0.362],
];

const radiusBase = (u: number) => {
  const p = R_PTS;
  if (u <= p[0][0]) return p[0][1];
  if (u >= p[p.length - 1][0]) return p[p.length - 1][1];
  let i = 0;
  while (u > p[i + 1][0]) i++;
  const p0 = p[Math.max(0, i - 1)];
  const p1 = p[i];
  const p2 = p[i + 1];
  const p3 = p[Math.min(p.length - 1, i + 2)];
  const h = p2[0] - p1[0];
  const t = (u - p1[0]) / h;
  const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0] || 1)) * h;
  const m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0] || 1)) * h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p1[1] +
    (t3 - 2 * t2 + t) * m1 +
    (-2 * t3 + 3 * t2) * p2[1] +
    (t3 - t2) * m2
  );
};

const gauss = (x: number, c: number, w: number) => Math.exp(-((x - c) * (x - c)) / (w * w));
const angDist = (a: number, b: number) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

/** Anatomical muscle relief — subtle, so the sleeve reads as worn, not as a cylinder. */
const relief = (u: number, th: number) => {
  let r = 0;
  // biceps belly, anterior upper arm
  r += 0.035 * gauss(u, 0.2, 0.1) * gauss(angDist(th, Math.PI / 2), 0, 0.75);
  // triceps, posterior upper arm
  r += 0.02 * gauss(u, 0.14, 0.1) * gauss(angDist(th, (3 * Math.PI) / 2), 0, 0.85);
  // lateral epicondyle / brachioradialis origin
  r += 0.03 * gauss(u, 0.52, 0.07) * gauss(angDist(th, 0.35), 0, 0.6);
  // forearm flexor mass, medial-anterior
  r += 0.028 * gauss(u, 0.6, 0.09) * gauss(angDist(th, 2.3), 0, 0.7);
  // olecranon
  r += 0.025 * gauss(u, 0.455, 0.035) * gauss(angDist(th, (3 * Math.PI) / 2), 0, 0.45);
  return r;
};

/** Cross-section ellipse factors: forearm flattens toward the wrist. */
const ellipse = (u: number) => {
  const f = smooth(0.5, 0.95, u);
  const e = smooth(0.36, 0.5, u) * (1 - smooth(0.5, 0.62, u));
  return {ex: 1.0 + 0.1 * f + 0.05 * e, ez: 0.98 - 0.13 * f};
};

export const sleeveRadius = (u: number) => radiusBase(u);

// ---------- spine (hinge reference curve) ----------
type Spine = {n: number; ds: number; y: Float64Array; z: Float64Array; a: Float64Array; total: number};
const spineCache = new Map<string, Spine>();
const HINGE_OFFSET = HINGE_K * radiusBase(U_ELBOW);

const buildSpine = (flex: number, longAmp: number, sU: number, sW: number): Spine => {
  const key = `${flex.toFixed(5)}|${longAmp.toFixed(5)}|${sU.toFixed(4)}|${sW.toFixed(4)}`;
  const hit = spineCache.get(key);
  if (hit) return hit;
  const n = 800;
  const total = SLEEVE_LENGTH * 1.25;
  const ds = total / n;
  const y = new Float64Array(n + 1);
  const z = new Float64Array(n + 1);
  const a = new Float64Array(n + 1);
  const s0 = (U_ELBOW - BEND_HALF) * SLEEVE_LENGTH;
  const s1 = (U_ELBOW + BEND_HALF) * SLEEVE_LENGTH;
  let cy = 0;
  let cz = HINGE_OFFSET;
  for (let i = 0; i <= n; i++) {
    const s = i * ds;
    const al = flex * smoother((s - s0) / (s1 - s0));
    y[i] = cy;
    z[i] = cz;
    a[i] = al;
    cy += -Math.cos(al) * ds;
    cz += Math.sin(al) * ds;
  }
  const sp = {n, ds, y, z, a, total};
  if (spineCache.size > 4000) spineCache.clear();
  spineCache.set(key, sp);
  return sp;
};

/** arc-length position for u including local longitudinal stretch */
const arcPos = (u: number, p: Pose) => {
  // integral of 1 + long * g(u), g = smooth bump of width stretchW
  const w = p.stretchW;
  const x = (u - p.stretchU) / w;
  const integ = w * 0.5 * Math.sqrt(Math.PI) * (erf(x) - erf(-p.stretchU / w));
  return SLEEVE_LENGTH * (u + p.long * integ);
};
const erf = (x: number) => {
  // Abramowitz-Stegun 7.1.26
  const s = Math.sign(x);
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return s * y;
};

export type Vec3 = [number, number, number];

/** Evaluate the sleeve surface point. `lift` pushes along the local radial direction (for rails / overlays). */
export const surfacePoint = (u: number, th: number, p: Pose, lift = 0): Vec3 => {
  const sp = buildSpine(p.flex, p.long, p.stretchU, p.stretchW);
  let r = radiusBase(u) * (1 + relief(u, th));
  r *= 1 + p.circ * gauss(u, p.stretchU, p.stretchW);
  const {ex, ez} = ellipse(u);
  let x = (r * ex + lift) * Math.cos(th);
  let z = (r * ez + lift) * Math.sin(th);
  // pronation / supination: cross-section rotates progressively toward the wrist
  const tw = p.pron * smooth(0.5, 1.0, u);
  if (tw !== 0) {
    const c = Math.cos(tw);
    const s = Math.sin(tw);
    const nx = x * c - z * s;
    const nz = x * s + z * c;
    x = nx;
    z = nz;
  }
  const s = arcPos(u, p);
  const fi = Math.min(sp.n - 1, Math.max(0, s / sp.ds));
  const i = Math.floor(fi);
  const f = fi - i;
  const ry = sp.y[i] * (1 - f) + sp.y[i + 1] * f;
  const rz = sp.z[i] * (1 - f) + sp.z[i + 1] * f;
  const al = sp.a[i] * (1 - f) + sp.a[i + 1] * f;
  // anterior direction rotated by bend angle: a = (0, sin α, cos α)
  const off = z - HINGE_OFFSET;
  const wx = p.mirror ? -x : x;
  return [wx, ry + Math.sin(al) * off, rz + Math.cos(al) * off];
};

/** Surface point + outward unit normal (finite differences). */
export const surfaceFrame = (u: number, th: number, p: Pose, lift = 0) => {
  const e = 1e-3;
  const P = surfacePoint(u, th, p, lift);
  const Pu = surfacePoint(Math.min(1, u + e), th, p, lift);
  const Pu0 = surfacePoint(Math.max(0, u - e), th, p, lift);
  const Pt = surfacePoint(u, th + e, p, lift);
  const Pt0 = surfacePoint(u, th - e, p, lift);
  const du: Vec3 = [Pu[0] - Pu0[0], Pu[1] - Pu0[1], Pu[2] - Pu0[2]];
  const dt: Vec3 = [Pt[0] - Pt0[0], Pt[1] - Pt0[1], Pt[2] - Pt0[2]];
  // outward = dθ × du (right sleeve); mirrored sleeve flips handedness
  let n: Vec3 = [dt[1] * du[2] - dt[2] * du[1], dt[2] * du[0] - dt[0] * du[2], dt[0] * du[1] - dt[1] * du[0]];
  if (p.mirror) n = [-n[0], -n[1], -n[2]];
  const l = Math.hypot(n[0], n[1], n[2]) || 1;
  n = [n[0] / l, n[1] / l, n[2] / l];
  return {P, n, du, dt};
};

// ---------------------------------------------------------------------------
// Tube grid
// ---------------------------------------------------------------------------
export const NU = 240;
export const NT = 144;

export type TubeBuffers = {
  position: Float32Array;
  normal: Float32Array;
  tanU: Float32Array;
  stretch: Float32Array; // (longitudinal, circumferential) relative to rest
  uv: Float32Array;
  index: Uint32Array;
};

let restLen: {lu: Float32Array; lt: Float32Array} | null = null;

const gridPositions = (p: Pose) => {
  const pos = new Float32Array((NU + 1) * (NT + 1) * 3);
  for (let i = 0; i <= NU; i++) {
    const u = i / NU;
    for (let j = 0; j <= NT; j++) {
      const th = (j / NT) * TAU;
      const P = surfacePoint(u, th, p);
      const k = (i * (NT + 1) + j) * 3;
      pos[k] = P[0];
      pos[k + 1] = P[1];
      pos[k + 2] = P[2];
    }
  }
  return pos;
};

const edgeLengths = (pos: Float32Array) => {
  const lu = new Float32Array((NU + 1) * (NT + 1));
  const lt = new Float32Array((NU + 1) * (NT + 1));
  for (let i = 0; i <= NU; i++) {
    for (let j = 0; j <= NT; j++) {
      const id = i * (NT + 1) + j;
      const ia = Math.max(0, i - 1) * (NT + 1) + j;
      const ib = Math.min(NU, i + 1) * (NT + 1) + j;
      const jm = j === 0 ? NT - 1 : j - 1;
      const jp = j === NT ? 1 : j + 1;
      const ta = i * (NT + 1) + jm;
      const tb = i * (NT + 1) + jp;
      lu[id] = Math.hypot(pos[ib * 3] - pos[ia * 3], pos[ib * 3 + 1] - pos[ia * 3 + 1], pos[ib * 3 + 2] - pos[ia * 3 + 2]);
      lt[id] = Math.hypot(pos[tb * 3] - pos[ta * 3], pos[tb * 3 + 1] - pos[ta * 3 + 1], pos[tb * 3 + 2] - pos[ta * 3 + 2]);
    }
  }
  return {lu, lt};
};

let indexCache: {mirror: boolean; idx: Uint32Array}[] = [];
const tubeIndex = (mirror: boolean) => {
  const hit = indexCache.find((c) => c.mirror === mirror);
  if (hit) return hit.idx;
  const idx = new Uint32Array(NU * NT * 6);
  let k = 0;
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NT; j++) {
      const a = i * (NT + 1) + j;
      const b = a + 1;
      const c = a + (NT + 1);
      const d = c + 1;
      if (mirror) {
        idx[k++] = a; idx[k++] = c; idx[k++] = b;
        idx[k++] = b; idx[k++] = c; idx[k++] = d;
      } else {
        idx[k++] = a; idx[k++] = b; idx[k++] = c;
        idx[k++] = b; idx[k++] = d; idx[k++] = c;
      }
    }
  }
  indexCache.push({mirror, idx});
  return idx;
};

export const buildTube = (p: Pose): TubeBuffers => {
  if (!restLen) restLen = edgeLengths(gridPositions(restPose(false)));
  const pos = gridPositions(p);
  const {lu, lt} = edgeLengths(pos);
  const n = (NU + 1) * (NT + 1);
  const normal = new Float32Array(n * 3);
  const tanU = new Float32Array(n * 3);
  const stretch = new Float32Array(n * 2);
  const uv = new Float32Array(n * 2);
  const sgn = p.mirror ? -1 : 1;
  for (let i = 0; i <= NU; i++) {
    for (let j = 0; j <= NT; j++) {
      const id = i * (NT + 1) + j;
      const ia = Math.max(0, i - 1) * (NT + 1) + j;
      const ib = Math.min(NU, i + 1) * (NT + 1) + j;
      const jm = j === 0 ? NT - 1 : j - 1;
      const jp = j === NT ? 1 : j + 1;
      const ta = i * (NT + 1) + jm;
      const tb = i * (NT + 1) + jp;
      const dux = pos[ib * 3] - pos[ia * 3];
      const duy = pos[ib * 3 + 1] - pos[ia * 3 + 1];
      const duz = pos[ib * 3 + 2] - pos[ia * 3 + 2];
      const dtx = pos[tb * 3] - pos[ta * 3];
      const dty = pos[tb * 3 + 1] - pos[ta * 3 + 1];
      const dtz = pos[tb * 3 + 2] - pos[ta * 3 + 2];
      let nx = dty * duz - dtz * duy;
      let ny = dtz * dux - dtx * duz;
      let nz = dtx * duy - dty * dux;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx = (nx / l) * sgn;
      ny = (ny / l) * sgn;
      nz = (nz / l) * sgn;
      normal[id * 3] = nx;
      normal[id * 3 + 1] = ny;
      normal[id * 3 + 2] = nz;
      const lu2 = Math.hypot(dux, duy, duz) || 1;
      tanU[id * 3] = dux / lu2;
      tanU[id * 3 + 1] = duy / lu2;
      tanU[id * 3 + 2] = duz / lu2;
      stretch[id * 2] = lu[id] / (restLen.lu[id] || 1);
      stretch[id * 2 + 1] = lt[id] / (restLen.lt[id] || 1);
      uv[id * 2] = i / NU;
      uv[id * 2 + 1] = j / NT;
    }
  }
  return {position: pos, normal, tanU, stretch, uv, index: tubeIndex(p.mirror)};
};

// ---------------------------------------------------------------------------
// Silicone support rails — original KORVE geometry
// ---------------------------------------------------------------------------
// Control points in (u, θ°). Rails run from the forearm toward the elbow and
// pass the joint on its lateral / medial sides — close to the bending neutral
// axis — so they never cross the flexion crease (anterior) or the olecranon
// apex (posterior). The forearm sections spiral gently, following the
// pronation / supination line of the forearm.
export type RailDef = {
  id: string;
  pts: [number, number][]; // (u, θ degrees)
  width: number; // max width (units)
  height: number; // max height (units)
  primary: boolean;
};

export const RAILS: RailDef[] = [
  {
    id: 'R1', // primary — extensor spiral: distal dorsal forearm → lateral epicondyle (follows the supination line)
    pts: [[0.9, 262], [0.82, 282], [0.73, 305], [0.64, 330], [0.56, 350], [0.49, 4], [0.43, 10], [0.375, 14]],
    width: 0.085,
    height: 0.013,
    primary: true,
  },
  {
    id: 'R2', // primary — brachioradialis line, converges with R1 toward the lateral epicondyle, stops below the crease
    pts: [[0.86, 322], [0.78, 338], [0.69, 356], [0.61, 14], [0.54, 26], [0.485, 30], [0.45, 31]],
    width: 0.075,
    height: 0.012,
    primary: true,
  },
  {
    id: 'R3', // primary — volar / medial line: anterior-medial forearm → medial epicondyle
    pts: [[0.88, 128], [0.8, 138], [0.71, 150], [0.62, 162], [0.54, 172], [0.47, 178], [0.41, 180], [0.375, 180]],
    width: 0.08,
    height: 0.0125,
    primary: true,
  },
  {
    id: 'S1', // secondary — short dorsal-ulnar element, aligned with the rotation spiral
    pts: [[0.77, 230], [0.705, 243], [0.64, 256]],
    width: 0.055,
    height: 0.0095,
    primary: false,
  },
  {
    id: 'S2', // secondary — upper-arm continuation of R1 after a deliberate gap over the joint
    pts: [[0.335, 17], [0.29, 19], [0.245, 20]],
    width: 0.055,
    height: 0.0095,
    primary: false,
  },
];

const catmull = (pts: [number, number][], t: number): [number, number] => {
  const n = pts.length - 1;
  const ft = Math.min(n - 1e-6, Math.max(0, t * n));
  const i = Math.floor(ft);
  const f = ft - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n, i + 2)];
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
};

/** unwrap degrees so interpolation never jumps across 0/360 */
const unwrap = (pts: [number, number][]) => {
  const out: [number, number][] = [];
  let prev = pts[0][1];
  for (const [u, d] of pts) {
    let dd = d;
    while (dd - prev > 180) dd -= 360;
    while (dd - prev < -180) dd += 360;
    out.push([u, dd]);
    prev = dd;
  }
  return out;
};

export const RAIL_SAMPLES = 120;
export const RAIL_ACROSS = 13;

export type RailBuffers = {
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array; // (u, θ/2π) of the textile under the rail
  rail: Float32Array; // (t along, k across, railIndex, primary)
  index: Uint32Array;
};

const railIndexCache = new Map<string, Uint32Array>();

/** Sample a rail centreline in (u, θ rad) with width/height profile. */
export const railCentre = (def: RailDef, t: number) => {
  const pts = unwrap(def.pts);
  const [u, d] = catmull(pts, t);
  return {u, th: (d * Math.PI) / 180};
};

export const buildRails = (p: Pose, rails: RailDef[] = RAILS): RailBuffers => {
  const per = (RAIL_SAMPLES + 1) * RAIL_ACROSS;
  const total = per * rails.length;
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  const rail = new Float32Array(total * 4);
  const key = `${rails.length}|${p.mirror}`;
  let index = railIndexCache.get(key);
  if (!index) {
    index = new Uint32Array(rails.length * RAIL_SAMPLES * (RAIL_ACROSS - 1) * 6);
    let k = 0;
    for (let r = 0; r < rails.length; r++) {
      for (let i = 0; i < RAIL_SAMPLES; i++) {
        for (let j = 0; j < RAIL_ACROSS - 1; j++) {
          const a = r * per + i * RAIL_ACROSS + j;
          const b = a + 1;
          const c = a + RAIL_ACROSS;
          const d = c + 1;
          if (!p.mirror) {
            index[k++] = a; index[k++] = c; index[k++] = b;
            index[k++] = b; index[k++] = c; index[k++] = d;
          } else {
            index[k++] = a; index[k++] = b; index[k++] = c;
            index[k++] = b; index[k++] = d; index[k++] = c;
          }
        }
      }
    }
    railIndexCache.set(key, index);
  }

  rails.forEach((def, r) => {
    const pts = unwrap(def.pts);
    for (let i = 0; i <= RAIL_SAMPLES; i++) {
      const t = i / RAIL_SAMPLES;
      const [u, d] = catmull(pts, t);
      const [u2, d2] = catmull(pts, Math.min(1, t + 0.004));
      const [u1, d1] = catmull(pts, Math.max(0, t - 0.004));
      const th = (d * Math.PI) / 180;
      const rr = radiusBase(u);
      // direction in locally-isometric (s, w) coordinates
      const ds = (u2 - u1) * SLEEVE_LENGTH;
      const dw = (((d2 - d1) * Math.PI) / 180) * rr;
      const L = Math.hypot(ds, dw) || 1;
      const ps = -dw / L; // perpendicular, s component
      const pw = ds / L; // perpendicular, w component
      // tapered, rounded tips
      const tip = Math.sin(Math.PI * Math.min(1, Math.min(t, 1 - t) / 0.12) * 0.5);
      const taper = Math.pow(tip, 0.6);
      const halfW = 0.5 * def.width * (0.35 + 0.65 * taper);
      for (let j = 0; j < RAIL_ACROSS; j++) {
        const k = (j / (RAIL_ACROSS - 1)) * 2 - 1;
        const uu = u + (k * halfW * ps) / SLEEVE_LENGTH;
        const tt = th + (k * halfW * pw) / rr;
        // soft silicone bead: flat-ish crown, rounded shoulders, embedded base
        // low, flat-topped deposit that feathers to zero at its edge (bonded, no step / gap)
        const ak = Math.abs(k);
        const e = Math.min(1, Math.max(0, (ak - 0.4) / 0.6));
        const prof = 1 - e * e * (3 - 2 * e);
        const h = def.height * taper * prof + 0.0004;
        const {P, n} = surfaceFrame(uu, tt, p);
        const id = r * per + i * RAIL_ACROSS + j;
        position[id * 3] = P[0] + n[0] * h;
        position[id * 3 + 1] = P[1] + n[1] * h;
        position[id * 3 + 2] = P[2] + n[2] * h;
        uv[id * 2] = uu;
        uv[id * 2 + 1] = tt / TAU; // unwrapped: no interpolation jump across θ = 0
        rail[id * 4] = t;
        rail[id * 4 + 1] = k;
        rail[id * 4 + 2] = r;
        rail[id * 4 + 3] = def.primary ? 1 : 0;
      }
    }
    // normals from the rail grid itself (captures the bead profile)
    for (let i = 0; i <= RAIL_SAMPLES; i++) {
      for (let j = 0; j < RAIL_ACROSS; j++) {
        const id = r * per + i * RAIL_ACROSS + j;
        const ia = r * per + Math.max(0, i - 1) * RAIL_ACROSS + j;
        const ib = r * per + Math.min(RAIL_SAMPLES, i + 1) * RAIL_ACROSS + j;
        const ja = r * per + i * RAIL_ACROSS + Math.max(0, j - 1);
        const jb = r * per + i * RAIL_ACROSS + Math.min(RAIL_ACROSS - 1, j + 1);
        const ax = position[ib * 3] - position[ia * 3];
        const ay = position[ib * 3 + 1] - position[ia * 3 + 1];
        const az = position[ib * 3 + 2] - position[ia * 3 + 2];
        const bx = position[jb * 3] - position[ja * 3];
        const by = position[jb * 3 + 1] - position[ja * 3 + 1];
        const bz = position[jb * 3 + 2] - position[ja * 3 + 2];
        let nx = ay * bz - az * by;
        let ny = az * bx - ax * bz;
        let nz = ax * by - ay * bx;
        // orient outward using the textile normal at the centre of the rail
        const c = r * per + i * RAIL_ACROSS + (RAIL_ACROSS >> 1);
        const ox = position[c * 3];
        const oy = position[c * 3 + 1];
        const oz = position[c * 3 + 2];
        void ox; void oy; void oz;
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
        normal[id * 3] = nx;
        normal[id * 3 + 1] = ny;
        normal[id * 3 + 2] = nz;
      }
    }
    // flip whole rail if normals point inward (compare with textile normal at mid)
    const mid = railCentre(def, 0.5);
    const tf = surfaceFrame(mid.u, mid.th, p);
    const cId = r * per + (RAIL_SAMPLES >> 1) * RAIL_ACROSS + (RAIL_ACROSS >> 1);
    const dot = normal[cId * 3] * tf.n[0] + normal[cId * 3 + 1] * tf.n[1] + normal[cId * 3 + 2] * tf.n[2];
    if (dot < 0) {
      for (let q = r * per; q < (r + 1) * per; q++) {
        normal[q * 3] *= -1;
        normal[q * 3 + 1] *= -1;
        normal[q * 3 + 2] *= -1;
      }
    }
  });
  return {position, normal, uv, rail, index};
};

// ---------------------------------------------------------------------------
// Hem rings (upper cuff / wrist) — give the open ends a real fabric thickness
// ---------------------------------------------------------------------------
export const buildHem = (p: Pose, u: number, thickness: number, dir: 1 | -1) => {
  const seg = NT;
  const rings = 7;
  const position = new Float32Array((seg + 1) * rings * 3);
  const normal = new Float32Array((seg + 1) * rings * 3);
  const uv = new Float32Array((seg + 1) * rings * 2);
  for (let j = 0; j <= seg; j++) {
    const th = (j / seg) * TAU;
    const {P, n, du} = surfaceFrame(u, th, p);
    const dl = Math.hypot(du[0], du[1], du[2]) || 1;
    const ax = (du[0] / dl) * -dir; // pointing out of the tube end
    const ay = (du[1] / dl) * -dir;
    const az = (du[2] / dl) * -dir;
    for (let k = 0; k < rings; k++) {
      // half-round lip from outer surface (k=0) to inner surface (k=rings-1)
      const a = (k / (rings - 1)) * Math.PI;
      const rad = thickness * 0.5;
      const cx = P[0] - n[0] * rad;
      const cy = P[1] - n[1] * rad;
      const cz = P[2] - n[2] * rad;
      const ox = n[0] * Math.cos(a) + ax * Math.sin(a);
      const oy = n[1] * Math.cos(a) + ay * Math.sin(a);
      const oz = n[2] * Math.cos(a) + az * Math.sin(a);
      const id = j * rings + k;
      position[id * 3] = cx + ox * rad;
      position[id * 3 + 1] = cy + oy * rad;
      position[id * 3 + 2] = cz + oz * rad;
      normal[id * 3] = ox;
      normal[id * 3 + 1] = oy;
      normal[id * 3 + 2] = oz;
      uv[id * 2] = u;
      uv[id * 2 + 1] = j / seg;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < seg; j++) {
    for (let k = 0; k < rings - 1; k++) {
      const a = j * rings + k;
      const b = a + 1;
      const c = a + rings;
      const d = c + 1;
      index.push(a, b, c, b, d, c);
    }
  }
  return {position, normal, uv, index: new Uint32Array(index)};
};
