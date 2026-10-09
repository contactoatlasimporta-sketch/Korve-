import * as THREE from 'three';
import {buildHem, buildRails, buildTube, Pose, surfacePoint, Vec3} from '../model/sleeve';
import {GHOST_FRAG, GHOST_VERT, LINE_FRAG, LINE_VERT, RAIL_FRAG, RAIL_VERT, TEXTILE_FRAG, TEXTILE_VERT} from './shaders';
import {makeLogoTexture, makeRailAOTexture} from './textures';

export const LIME = new THREE.Color('#B8FF2C');
const LIME_LINEAR = new THREE.Vector3(0.48, 1.0, 0.025);

export type TextileFx = {
  reveal: number;
  revealDir: number;
  scanU: number;
  zones: number;
  zoneFocus: [number, number, number, number];
  contour: number;
  contourProg: number;
  stretchViz: number;
  grid: number;
  cut: number;
  grip: number;
  seam: number;
  seamProg: number;
  seamU: number;
  tint: number;
  wristMark: number;
};

export const defaultFx = (): TextileFx => ({
  reveal: 2,
  revealDir: 1,
  scanU: -1,
  zones: 0,
  zoneFocus: [0, 0, 0, 0],
  contour: 0,
  contourProg: 0,
  stretchViz: 0,
  grid: 0,
  cut: 0,
  grip: 0,
  seam: 0,
  seamProg: 0,
  seamU: 0.7,
  tint: 0,
  wristMark: 0,
});

export type RailFx = {draw: number; trace: number; traceAmt: number; glow: number};

export type SleeveSpec = {
  key: string;
  pose: Pose;
  position: Vec3; // world position of the pivot (elbow centre)
  quat: [number, number, number, number];
  fx?: Partial<TextileFx>;
  rails?: RailFx | null;
  ghost?: number; // if set, render only as an additive ghost with this opacity
};

export type LineSpec = {
  key: string;
  points: Vec3[];
  color?: [number, number, number];
  opacity: number;
  head?: number;
  tail?: number;
};

export type CameraState = {pos: Vec3; target: Vec3; fov: number; roll?: number};

export type StageState = {
  camera: CameraState;
  light: number;
  exposure: number;
  focusZ: number;
  focusRange: number;
  sleeves: SleeveSpec[];
  lines?: LineSpec[];
  time: number;
};

/** Every sleeve pivots about its elbow centre so poses and shots blend cleanly. */
export const PIVOT: Vec3 = [0, -2.7, 0];

export const sleeveMatrix = (s: Pick<SleeveSpec, 'position' | 'quat'>) => {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion(...s.quat);
  m.compose(new THREE.Vector3(...s.position), q, new THREE.Vector3(1, 1, 1));
  m.multiply(new THREE.Matrix4().makeTranslation(-PIVOT[0], -PIVOT[1], -PIVOT[2]));
  return m;
};

export const toWorld = (s: Pick<SleeveSpec, 'position' | 'quat'>, p: Vec3): Vec3 => {
  const v = new THREE.Vector3(...p).applyMatrix4(sleeveMatrix(s));
  return [v.x, v.y, v.z];
};

export const makeCamera = (c: CameraState, aspect: number) => {
  const cam = new THREE.PerspectiveCamera(c.fov, aspect, 0.05, 200);
  cam.position.set(...c.pos);
  cam.up.set(Math.sin(c.roll ?? 0), Math.cos(c.roll ?? 0), 0);
  cam.lookAt(new THREE.Vector3(...c.target));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

/** Project a point on a sleeve (u, θ) to screen pixels. */
export const projectOnSleeve = (
  state: StageState,
  spec: SleeveSpec,
  u: number,
  th: number,
  w: number,
  h: number,
  lift = 0,
) => {
  const cam = makeCamera(state.camera, w / h);
  const p = surfacePoint(u, th, spec.pose, lift);
  const v = new THREE.Vector3(...p).applyMatrix4(sleeveMatrix(spec));
  const viewZ = v.clone().applyMatrix4(cam.matrixWorldInverse).z;
  v.project(cam);
  return {x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: viewZ};
};

export const projectWorld = (state: StageState, p: Vec3, w: number, h: number) => {
  const cam = makeCamera(state.camera, w / h);
  const v = new THREE.Vector3(...p).project(cam);
  return {x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h};
};

// ---------------------------------------------------------------------------

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  railAO: THREE.Texture;
  logo: THREE.Texture;
  mats = new Map<string, THREE.ShaderMaterial>();
  w: number;
  h: number;

  constructor(canvas: HTMLCanvasElement, w: number, h: number, pixelRatio: number) {
    this.w = w;
    this.h = h;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.railAO = makeRailAOTexture();
    this.logo = makeLogoTexture();
  }

  private common(state: StageState) {
    return {
      uLight: {value: state.light},
      uExposure: {value: state.exposure},
      uLime: {value: LIME_LINEAR.clone()},
      uFocusZ: {value: state.focusZ},
      uFocusRange: {value: state.focusRange},
      uTime: {value: state.time},
    };
  }

  private mat(key: string, make: () => THREE.ShaderMaterial) {
    let m = this.mats.get(key);
    if (!m) {
      m = make();
      this.mats.set(key, m);
    }
    return m;
  }

  render(state: StageState) {
    const scene = this.scene;
    // dispose previous frame geometry
    scene.traverse((o) => {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
    });
    scene.clear();

    const cam = makeCamera(state.camera, this.w / this.h);
    const common = this.common(state);

    for (const s of state.sleeves) {
      const group = new THREE.Group();
      group.matrixAutoUpdate = false;
      group.matrix.copy(sleeveMatrix(s));
      scene.add(group);
      const tube = buildTube(s.pose);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(tube.position, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(tube.normal, 3));
      g.setAttribute('tanU', new THREE.BufferAttribute(tube.tanU, 3));
      g.setAttribute('stretch', new THREE.BufferAttribute(tube.stretch, 2));
      g.setAttribute('uv', new THREE.BufferAttribute(tube.uv, 2));
      g.setIndex(new THREE.BufferAttribute(tube.index, 1));

      if (s.ghost !== undefined) {
        const gm = this.mat(`ghost-${s.key}`, () =>
          new THREE.ShaderMaterial({
            vertexShader: GHOST_VERT,
            fragmentShader: GHOST_FRAG,
            uniforms: {uColor: {value: new THREE.Vector3()}, uOpacity: {value: 0}},
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor,
          }),
        );
        gm.uniforms.uColor.value.set(0.55, 0.62, 0.6);
        gm.uniforms.uOpacity.value = s.ghost;
        const mesh = new THREE.Mesh(g, gm);
        mesh.renderOrder = 10;
        group.add(mesh);
        continue;
      }

      const fx = {...defaultFx(), ...(s.fx ?? {})};
      const tm = this.mat(`tex-${s.key}`, () =>
        new THREE.ShaderMaterial({
          vertexShader: TEXTILE_VERT,
          fragmentShader: TEXTILE_FRAG,
          side: THREE.DoubleSide,
          uniforms: {
            ...this.common(state),
            uMirror: {value: 0},
            uRailAO: {value: this.railAO},
            uLogo: {value: this.logo},
            uMicro: {value: 1},
            uReveal: {value: 2},
            uRevealDir: {value: 1},
            uScanU: {value: -1},
            uZones: {value: 0},
            uZoneFocus: {value: new THREE.Vector4()},
            uContour: {value: 0},
            uContourProg: {value: 0},
            uStretchViz: {value: 0},
            uGrid: {value: 0},
            uCut: {value: 0},
            uGrip: {value: 0},
            uSeam: {value: 0},
            uSeamProg: {value: 0},
            uSeamU: {value: 0.7},
            uTint: {value: 0},
            uWristMark: {value: 0},
          },
          extensions: {derivatives: true} as never,
        }),
      );
      const U = tm.uniforms;
      for (const [k, v] of Object.entries(common)) U[k].value = v.value;
      U.uMirror.value = s.pose.mirror ? 1 : 0;
      U.uReveal.value = fx.reveal;
      U.uRevealDir.value = fx.revealDir;
      U.uScanU.value = fx.scanU;
      U.uZones.value = fx.zones;
      U.uZoneFocus.value.set(...fx.zoneFocus);
      U.uContour.value = fx.contour;
      U.uContourProg.value = fx.contourProg;
      U.uStretchViz.value = fx.stretchViz;
      U.uGrid.value = fx.grid;
      U.uCut.value = fx.cut;
      U.uGrip.value = fx.grip;
      U.uSeam.value = fx.seam;
      U.uSeamProg.value = fx.seamProg;
      U.uSeamU.value = fx.seamU;
      U.uTint.value = fx.tint;
      U.uWristMark.value = fx.wristMark;
      group.add(new THREE.Mesh(g, tm));

      // hems
      for (const [u, dir] of [[0, 1], [1, -1]] as const) {
        const hem = buildHem(s.pose, u, u === 0 ? 0.028 : 0.018, dir as 1 | -1);
        const hg = new THREE.BufferGeometry();
        hg.setAttribute('position', new THREE.BufferAttribute(hem.position, 3));
        hg.setAttribute('normal', new THREE.BufferAttribute(hem.normal, 3));
        hg.setAttribute('uv', new THREE.BufferAttribute(hem.uv, 2));
        hg.setAttribute('tanU', new THREE.BufferAttribute(new Float32Array(hem.position.length).map((_, i) => (i % 3 === 1 ? -1 : 0)), 3));
        hg.setAttribute('stretch', new THREE.BufferAttribute(new Float32Array((hem.position.length / 3) * 2).fill(1), 2));
        hg.setIndex(new THREE.BufferAttribute(hem.index, 1));
        const show = fx.revealDir > 0 ? (u === 0 ? fx.reveal > 0.01 : fx.reveal > 1.0) : u === 1 ? fx.reveal > 0.01 : fx.reveal > 1.0;
        if (show && !(u === 0 && fx.cut > 0.01)) group.add(new THREE.Mesh(hg, tm));
      }

      if (s.rails) {
        const rb = buildRails(s.pose);
        const rg = new THREE.BufferGeometry();
        rg.setAttribute('position', new THREE.BufferAttribute(rb.position, 3));
        rg.setAttribute('normal', new THREE.BufferAttribute(rb.normal, 3));
        rg.setAttribute('uv', new THREE.BufferAttribute(rb.uv, 2));
        rg.setAttribute('rail', new THREE.BufferAttribute(rb.rail, 4));
        rg.setIndex(new THREE.BufferAttribute(rb.index, 1));
        const rm = this.mat(`rail-${s.key}`, () =>
          new THREE.ShaderMaterial({
            vertexShader: RAIL_VERT,
            fragmentShader: RAIL_FRAG,
            side: THREE.DoubleSide,
            uniforms: {
              ...this.common(state),
              uReveal: {value: 2},
              uRevealDir: {value: 1},
              uDraw: {value: 1},
              uTrace: {value: -1},
              uTraceAmt: {value: 0},
              uGlow: {value: 0},
              uGrid: {value: 0},
              uCut: {value: 0},
              uMirror: {value: 0},
              uRailAO: {value: this.railAO},
              uLogo: {value: this.logo},
              uMicro: {value: 1},
            },
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -2,
          }),
        );
        const R = rm.uniforms;
        for (const [k, v] of Object.entries(common)) R[k].value = v.value;
        R.uReveal.value = fx.reveal;
        R.uRevealDir.value = fx.revealDir;
        R.uDraw.value = s.rails.draw;
        R.uTrace.value = s.rails.trace;
        R.uTraceAmt.value = s.rails.traceAmt;
        R.uGlow.value = s.rails.glow;
        R.uGrid.value = fx.grid;
        R.uCut.value = fx.cut;
        group.add(new THREE.Mesh(rg, rm));
      }
    }

    for (const l of state.lines ?? []) {
      const n = l.points.length;
      const pos = new Float32Array(n * 3);
      const along = new Float32Array(n);
      l.points.forEach((p, i) => {
        pos.set(p, i * 3);
        along[i] = i / Math.max(1, n - 1);
      });
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      lg.setAttribute('along', new THREE.BufferAttribute(along, 1));
      const lm = this.mat(`line-${l.key}`, () =>
        new THREE.ShaderMaterial({
          vertexShader: LINE_VERT,
          fragmentShader: LINE_FRAG,
          uniforms: {uColor: {value: new THREE.Vector3()}, uOpacity: {value: 1}, uHead: {value: 1}, uTail: {value: 0}},
          transparent: true,
          depthWrite: false,
          blending: THREE.CustomBlending,
          blendSrc: THREE.OneFactor,
          blendDst: THREE.OneFactor,
        }),
      );
      lm.uniforms.uColor.value.set(...(l.color ?? [0.48, 1.0, 0.025]));
      lm.uniforms.uOpacity.value = l.opacity;
      lm.uniforms.uHead.value = l.head ?? 1;
      lm.uniforms.uTail.value = l.tail ?? 0;
      const line = new THREE.Line(lg, lm);
      line.renderOrder = 20;
      scene.add(line);
    }

    this.renderer.render(scene, cam);
  }

  dispose() {
    scene_dispose(this.scene);
    this.mats.forEach((m) => m.dispose());
    this.renderer.dispose();
  }
}

const scene_dispose = (s: THREE.Scene) =>
  s.traverse((o) => {
    if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
  });
