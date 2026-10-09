import * as THREE from 'three';
import {RAILS, railCentre, sleeveRadius, SLEEVE_LENGTH} from '../model/sleeve';

const W = 2048;
const H = 1024;

/** Rail contact-occlusion mask in (θ → x, u → y) space. Deterministic. */
export const makeRailAOTexture = () => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.filter = 'blur(4px)';
  g.strokeStyle = '#fff';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const def of RAILS) {
    const pts: [number, number][] = [];
    let prevX: number | null = null;
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const {u, th} = railCentre(def, t);
      let x = (th / (Math.PI * 2)) * W;
      if (prevX !== null) {
        while (x - prevX > W / 2) x -= W;
        while (x - prevX < -W / 2) x += W;
      }
      prevX = x;
      pts.push([x, u * H]);
    }
    const midU = railCentre(def, 0.5).u;
    // px per unit around the circumference at this station
    const pxPerUnit = W / (2 * Math.PI * sleeveRadius(midU));
    g.lineWidth = def.width * pxPerUnit * 1.25;
    g.globalAlpha = 0.85;
    for (const off of [-W, 0, W]) {
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x + off, y) : g.moveTo(x + off, y)));
      g.stroke();
    }
  }
  void SLEEVE_LENGTH;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
};

/**
 * Tonal knit-in KORVE wordmark. x → along the sleeve (cuff → down), y → around.
 * Text reads wrist→cuff on the lateral upper arm.
 */
export const makeLogoTexture = () => {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.save();
  // text reads from the elbow side toward the cuff → draw reversed along x
  g.translate(c.width, c.height);
  g.rotate(Math.PI);
  g.fillStyle = '#fff';
  (g as unknown as {fontStretch: string}).fontStretch = 'expanded';
  g.font = '800 170px "Archivo Variable", "Inter", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('KORVE', c.width / 2, c.height / 2 + 6);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
};
