/**
 * Custom GLSL for the KORVE ARM PRO concept film.
 * Lighting is a hand-built studio rig (key, fill, two rims, softbox, fabric sheen)
 * evaluated in view space so silhouettes stay readable on a near-black stage.
 * All knit structures are procedural in (u, θ) space → they stretch with the fabric.
 */

export const COMMON = /* glsl */ `
#define PI 3.14159265
#define TAU 6.2831853
uniform float uLight;
uniform float uExposure;
uniform vec3 uLime;
uniform float uFocusZ;     // view-space focus distance
uniform float uFocusRange; // detail falloff (fake DOF on micro texture)
uniform float uRimBoost;   // extra silhouette rim light only (edge separation)
uniform float uTime;

vec3 aces(vec3 x){ const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.); }
vec3 toDisplay(vec3 c){ return pow(aces(c*uExposure), vec3(1.0/2.2)); }

float D_GGX(float NoH, float a){ float a2=a*a; float d=NoH*NoH*(a2-1.)+1.; return a2/(PI*d*d+1e-5); }

vec3 studio(vec3 N, vec3 V, vec3 alb, float rough, float specAmt, float sheenAmt, float ao){
  vec3 col = vec3(0.);
  float NoV = clamp(dot(N,V), 1e-3, 1.);
  // key — large soft box, upper-left-front
  vec3 L = normalize(vec3(-0.55, 0.62, 0.56));
  vec3 H = normalize(L+V);
  float NoL = max(dot(N,L),0.);
  float wrapD = max(0.,(dot(N,L)+0.3)/1.3);
  float a = max(rough*rough, 0.02);
  float F = 0.04 + 0.96*pow(1.-max(dot(H,V),0.),5.);
  float spec = D_GGX(max(dot(N,H),0.),a) * NoL * F / (4.*NoV*max(NoL,0.15)+0.1);
  col += 3.2*(alb*wrapD) + 1.6*specAmt*spec*vec3(1.0,0.99,0.97);
  // cool fill, low-right
  vec3 L2 = normalize(vec3(0.75,-0.15,0.65));
  col += 0.35*alb*max(0.,(dot(N,L2)+0.35)/1.35)*vec3(0.82,0.88,1.0);
  vec3 H2 = normalize(L2+V);
  col += 0.35*specAmt*D_GGX(max(dot(N,H2),0.),a)*max(dot(N,L2),0.)*0.05;
  // twin rim lights — define the silhouette against black
  float fr = pow(1.-NoV, 2.2);
  vec3 R1 = normalize(vec3(-1.0,0.35,-0.45));
  vec3 R2 = normalize(vec3(1.0,0.2,-0.5));
  col += fr*(max(dot(N,R1),0.)*0.32 + max(dot(N,R2),0.)*0.26)*vec3(0.86,0.9,1.0)*(0.35+0.65*sheenAmt);
  // optional edge-only lift: concentrated at grazing angles, zero on faces seen head-on
  col += uRimBoost*pow(1.-NoV, 4.0)*(0.5*max(dot(N,R1),0.) + 0.5*max(dot(N,R2),0.) + 0.25)*vec3(0.78,0.84,0.92)*0.22;
  // overhead softbox (environment)
  float sky = clamp(N.y*0.5+0.5,0.,1.);
  col += alb*(0.12 + 0.55*sky*sky);
  col += specAmt*0.06*pow(sky,6.)*(1.-rough);
  // fabric sheen — fibre fuzz at grazing angles
  col += sheenAmt*pow(1.-NoV,4.)*0.07*vec3(0.88,0.92,1.0);
  return col*ao*uLight;
}

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float angDelta(float a, float b){ float d = mod(a-b+PI, TAU)-PI; return d; }
`;

// ---------------------------------------------------------------------------
// Textile
// ---------------------------------------------------------------------------
export const TEXTILE_VERT = /* glsl */ `
attribute vec3 tanU;
attribute vec2 stretch;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vT;
varying vec3 vViewPos;
varying vec3 vWorld;
varying vec2 vStretch;
void main(){
  vUv = uv;
  vStretch = stretch;
  vec4 mv = modelViewMatrix*vec4(position,1.);
  vViewPos = mv.xyz;
  vWorld = (modelMatrix*vec4(position,1.)).xyz;
  vN = normalize(normalMatrix*normal);
  vT = normalize(mat3(modelViewMatrix)*tanU);
  gl_Position = projectionMatrix*mv;
}
`;

export const KNIT = /* glsl */ `
#define WALES 168.0
#define COURSES 300.0
uniform float uMirror;     // 1 for LEFT sleeve
uniform sampler2D uRailAO; // rail contact mask in (θ, u)
uniform sampler2D uLogo;   // tonal knit-in wordmark
uniform float uMicro;      // micro stitch visibility (AA / DOF)

// V-shaped jersey stitch, q in (wale, course) units
float jersey(vec2 q){
  vec2 f = fract(q) - 0.5;
  vec2 a = f - vec2(-0.23, 0.0);
  vec2 b = f - vec2( 0.23, 0.0);
  const float c = 0.88, s = 0.47;
  vec2 ar = vec2(c*a.x - s*a.y, s*a.x + c*a.y);
  vec2 br = vec2(c*b.x + s*b.y, -s*b.x + c*b.y);
  float la = dot(ar/vec2(0.2,0.55), ar/vec2(0.2,0.55));
  float lb = dot(br/vec2(0.2,0.55), br/vec2(0.2,0.55));
  return clamp(max(1.-la, 1.-lb), 0., 1.);
}

// hexagonal open-mesh: returns (holeMask, rimHeight)
vec2 hexMesh(vec2 p, float holeR){
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r*0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 g = dot(a,a) < dot(b,b) ? a : b;
  float d = length(g);
  float hole = 1.0 - smoothstep(holeR-0.07, holeR+0.03, d);
  float rim = smoothstep(holeR-0.02, holeR+0.18, d);
  return vec2(hole, rim);
}

// pointelle ventilation: small round holes on a staggered grid
float pointelle(vec2 p, float r){
  vec2 q = p; q.x += 0.5*mod(floor(q.y),2.);
  vec2 f = fract(q)-0.5;
  return 1.0 - smoothstep(r-0.05, r+0.05, length(f*vec2(1.0,1.15)));
}

struct Knit { float h; float hole; float tone; float rough; };

float zoneW(float u, float a, float b, float soft){ return smoothstep(a-soft, a+soft, u) * (1.0 - smoothstep(b-soft, b+soft, u)); }

// boundaries curve with anatomy (posterior dips) so zones flow, never look like panels
float bUpperElbow(float th){ return 0.355 + 0.022*cos(th - 1.5*PI) - 0.012*cos(th-0.5*PI); }
float bElbowFore(float th){ return 0.545 - 0.02*cos(th - 1.5*PI) + 0.01*cos(2.*th); }

Knit knitAt(float u, float th, vec2 st, float mv){
  Knit k; k.h = 0.; k.hole = 0.; k.tone = 0.; k.rough = 0.78;
  float s = u*6.0;
  vec2 q = vec2(th/TAU*WALES, u*COURSES);
  float micro = jersey(q) * mv * uMicro;

  float b1 = bUpperElbow(th);
  float b2 = bElbowFore(th);
  float wCuff  = 1.0 - smoothstep(0.058, 0.072, u);
  float wUpper = (1.0-wCuff) * (1.0 - smoothstep(b1-0.02, b1+0.02, u));
  float wElbow = smoothstep(b1-0.02, b1+0.02, u) * (1.0 - smoothstep(b2-0.02, b2+0.02, u));
  float wFore  = smoothstep(b2-0.02, b2+0.02, u) * (1.0 - smoothstep(0.855, 0.885, u));
  float wWrist = smoothstep(0.855, 0.885, u);

  // --- cuff welt: horizontal ribs, double layer
  float welt = 0.5+0.5*cos(u*COURSES*TAU/6.0);
  float hCuff = 1.4*welt + 0.45*micro;

  // --- upper arm retention: 2x2 rib texture + jersey
  float rib = 0.5+0.5*cos(q.x*TAU/4.0);
  float hUpper = 0.7*rib + 0.5*micro;

  // --- elbow flex zone: open hex mesh, holes largest on the flexion axes, open further with stretch
  float axis = pow(abs(sin(th)), 1.6);                       // 1 at anterior/posterior, 0 at the sides
  float open = clamp((st.x-1.0)*0.9 + (st.y-1.0)*0.6, 0.0, 0.6);
  vec2 hp = vec2(th/TAU*120.0, u*120.0*0.55*6.0/3.46);     // ~3.5 mm cells
  float midZ = smoothstep(0.0, 0.05, u-b1) * smoothstep(0.0, 0.05, b2-u);
  float holeR = (mix(0.11, 0.25, axis) * mix(0.5, 1.0, midZ)) + open*0.22;
  vec2 hm = hexMesh(hp, holeR);
  float hElbow = 0.7*hm.y + 0.35*micro;

  // --- forearm compression: directional jacquard ribs sweeping with the pronation line
  float sweep = th/TAU*44.0 + (u-0.55)*16.0 + 2.2*sin((u-0.55)*9.0);
  float dRib = 0.5+0.5*cos(sweep*TAU);
  float fine = 0.5+0.5*cos((th/TAU*WALES*0.5 + u*COURSES*0.25)*TAU);
  float hFore = 1.0*smoothstep(0.1,0.9,dRib) + 0.25*fine + 0.45*micro;

  // --- ventilation channels: pointelle strips (posterior upper arm, medial-posterior forearm)
  float ch1 = smoothstep(0.075,0.045,abs(angDelta(th, 4.71))) * zoneW(u, 0.1, 0.3, 0.02);
  float ch2 = smoothstep(0.085,0.05,abs(angDelta(th, 3.85 + (u-0.6)*1.2))) * zoneW(u, 0.6, 0.83, 0.025);
  float chan = max(ch1, ch2);
  float pt = pointelle(vec2(th/TAU*120.0, u*190.0), 0.22);

  // --- wrist transition: fine 1x1 rib, lighter, folded hem
  float rib1 = 0.5+0.5*cos(q.x*TAU/2.0);
  float hem = smoothstep(0.972, 0.985, u);
  float hWrist = 0.45*rib1 + 0.45*micro + 0.8*hem*(0.5+0.5*cos(u*COURSES*TAU/3.0));

  k.h = wCuff*hCuff + wUpper*hUpper + wElbow*hElbow + wFore*hFore + wWrist*hWrist;
  k.hole = wElbow*hm.x + chan*pt*0.85*(1.0-wElbow);
  k.h = mix(k.h, 0.2, chan*pt);
  // tonal variation per zone (yarn density reads as slightly different blacks)
  k.tone = wCuff*(0.18+0.25*welt) + wUpper*(0.1*rib) + wElbow*0.12 + wFore*(-0.05 + 0.24*smoothstep(0.2,0.8,dRib)) + wWrist*0.22 + chan*0.1;
  k.rough = 0.8 - 0.06*wFore*dRib;
  return k;
}
`;

export const TEXTILE_FRAG = /* glsl */ `
${COMMON}
${KNIT}
varying vec2 vUv;
varying vec3 vN;
varying vec3 vT;
varying vec3 vViewPos;
varying vec3 vWorld;
varying vec2 vStretch;

uniform float uReveal;      // reveal front along u (0..1.1)
uniform float uRevealDir;   // 1: cuff→wrist, -1: wrist→cuff
uniform float uScanU;       // technical scan ring position (-1 off)
uniform float uZones;       // zone illumination amount
uniform vec4  uZoneFocus;   // per-zone emphasis
uniform float uContour;     // contour rings amount
uniform float uContourProg; // ring draw-on progress
uniform float uStretchViz;  // elbow stretch visualisation
uniform float uGrid;        // deformation grid
uniform float uCut;         // cuff cutaway amount
uniform float uGrip;        // internal grip highlight
uniform float uSeam;        // seamless ring trace amount
uniform float uSeamProg;    // seamless ring trace angle progress (0..1)
uniform float uSeamU;
uniform float uTint;        // global lime wash (ghosting)
uniform float uWristMark;   // wrist hem highlight

float lineAA(float x, float w){ float f = fwidth(x); return 1.0 - smoothstep(w, w+f*1.5, abs(x)); }
float gridAA(float x, float w){ float d = abs(fract(x+0.5)-0.5); float f = fwidth(x); return 1.0 - smoothstep(w, w+f*1.5, d); }

void main(){
  float u = vUv.x;
  float v = vUv.y;
  float th = v*TAU;

  // reveal (masked wipe along the sleeve)
  float rv = uRevealDir > 0. ? u : 1.0-u;
  if (rv > uReveal) discard;

  // cutaway window on the upper cuff (anterior-lateral quadrant)
  float cutA = abs(angDelta(th, 0.9));
  float cutEdgeU = 0.17*uCut;
  float inCut = step(cutA, 0.95*uCut) * step(u, cutEdgeU);
  if (inCut > 0.5) discard;

  vec3 N = normalize(vN);
  vec3 V = normalize(-vViewPos);
  bool front = gl_FrontFacing;
  if (!front) N = -N;

  // micro detail fades with footprint (anti-alias) and focus (fake DOF)
  vec2 fw = fwidth(vec2(th/TAU*WALES, u*COURSES));
  float foot = max(fw.x, fw.y);
  float dof = 1.0 - smoothstep(0.0, uFocusRange, abs(-vViewPos.z - uFocusZ));
  float microVis = (1.0 - smoothstep(0.12, 0.38, foot)) * mix(0.35, 1.0, dof);

  Knit k = knitAt(u, th, vStretch, microVis);
  vec3 col;

  if (front) {
    // normal perturbation from knit height (finite differences in param space)
    float e = 0.0009;
    Knit ku = knitAt(u+e, th, vStretch, microVis);
    Knit kt = knitAt(u, th+e*3.2, vStretch, microVis);
    float amp = 0.0075;
    float dhds = (ku.h - k.h)/ (e*6.0);
    float dhdc = (kt.h - k.h)/ (e*3.2*0.55);
    vec3 T = normalize(vT - N*dot(vT,N));
    vec3 B = normalize(cross(T, N)) * (uMirror > 0.5 ? -1.0 : 1.0);
    vec3 Np = normalize(N - amp*(dhds*T + dhdc*B));
    Np = normalize(mix(N, Np, mix(0.55, 1.0, microVis)));

    // rail contact occlusion + logo
    float ao = 1.0 - 0.22*texture2D(uRailAO, vec2(v, u)).r;
    vec2 lc = vec2((u-0.085)/0.25, angDelta(th, 0.62)/0.34 + 0.5);
    lc.x = 1.0 - lc.x;
    if (uMirror > 0.5) lc.y = 1.0 - lc.y;
    float logo = 0.0;
    if (lc.x > 0. && lc.x < 1. && lc.y > 0. && lc.y < 1.) logo = texture2D(uLogo, lc).r;

    float cav = mix(1.0, 0.82, k.h*microVis);
    float hole = k.hole;
    vec3 alb = vec3(0.0085,0.0088,0.0095) * (1.0 + k.tone) * cav;
    alb = mix(alb, alb*1.9, logo*0.8);
    alb = mix(alb, vec3(0.0012), hole);
    float sheen = mix(1.0, 0.3, hole);
    float specAmt = 0.22*(1.0-hole) + logo*0.12;
    col = studio(Np, V, alb, k.rough - logo*0.2, specAmt, sheen, ao*(1.0-0.6*hole));
  } else {
    // interior: brushed inner face + anti-slip grip pattern inside the upper cuff
    vec3 alb = vec3(0.005);
    float gz = 1.0 - smoothstep(0.075, 0.095, u);
    // printed anti-slip dots on a wave track — matte, discrete, inner face only
    vec2 gp = vec2(th/TAU*72.0, u*6.0/0.075);
    float wy = gp.y + 0.28*sin(gp.x*0.55);
    vec2 cell = vec2(fract(gp.x)-0.5, fract(wy)-0.5);
    float dotm = 1.0 - smoothstep(0.2, 0.3, length(cell*vec2(1.0,1.25)));
    float grip = dotm*gz;
    alb = mix(alb, vec3(0.02), grip);
    col = studio(N, V, alb, mix(0.9,0.6,grip), 0.25*grip, 0.2, 0.85);
    col += uLime*grip*uGrip*0.05;
  }

  // --- cut edge (technical section line)
  float cutLine = 0.0;
  if (uCut > 0.01) {
    float edgeA = abs(cutA - 0.95*uCut);
    cutLine = (1.0 - smoothstep(0.0, 0.025, edgeA))*step(u, cutEdgeU);
    cutLine = max(cutLine, (1.0 - smoothstep(0.0, 0.006, abs(u-cutEdgeU)))*step(cutA, 0.95*uCut+0.02));
    col = mix(col, uLime*1.4, cutLine*uCut);
  }

  // --- reveal edge glow
  float edge = 1.0 - smoothstep(0.0, 0.004, uReveal - rv);
  col += uLime*edge*0.5*step(uReveal, 1.05);

  // --- zonal compression visualisation
  if (uZones > 0.001) {
    float b1 = bUpperElbow(th), b2 = bElbowFore(th);
    vec4 z;
    z.x = smoothstep(0.07, 0.09, u)*(1.0-smoothstep(b1-0.015,b1+0.015,u));
    z.y = smoothstep(b1-0.015,b1+0.015,u)*(1.0-smoothstep(b2-0.015,b2+0.015,u));
    z.z = smoothstep(b2-0.015,b2+0.015,u)*(1.0-smoothstep(0.85,0.88,u));
    z.w = smoothstep(0.85,0.88,u);
    float passed = uScanU < 0. ? 1.0 : smoothstep(0.0, 0.05, uScanU - u);
    float emph = dot(z, uZoneFocus);
    // graduated contour rings: spacing tracks relative knit density (illustrative)
    float dens = z.x*14.0 + z.y*10.0 + z.z*20.0 + z.w*8.0;
    float ring = gridAA(u*dens*1.5, 0.016);
    float drawn = step(fract(v - 0.15 + 1.0), uContourProg);
    col += uLime * ring * (z.x+z.y+z.z+z.w) * drawn * uContour * passed * (0.25 + 0.75*emph) * 0.22;
    // zone boundaries
    float bl = lineAA(u - b1, 0.0015) + lineAA(u - b2, 0.0015) + lineAA(u - 0.865, 0.0015) + lineAA(u - 0.08, 0.0015);
    col += uLime * bl * uZones * passed * 0.6;
    col = mix(col, col*0.55, uZones*passed*(1.0-emph)*0.6);
    col += uLime*emph*uZones*passed*0.006;
  }
  if (uScanU >= 0.) {
    float sc = 1.0 - smoothstep(0.0, 0.004, abs(u-uScanU));
    float trail = smoothstep(0.12, 0.0, uScanU-u)*step(u, uScanU);
    col += uLime*(sc*2.2 + trail*0.06);
  }

  // --- elbow stretch visualisation (longitudinal elongation on the outer elbow)
  if (uStretchViz > 0.001) {
    float el = clamp((vStretch.x - 1.0)/1.6, 0.0, 1.0);
    float iso = gridAA(vStretch.x*2.5, 0.03) * step(1.08, vStretch.x);
    col += uLime * (el*0.025 + iso*0.05*el) * uStretchViz * (front ? 1.0 : 0.0);
  }

  // --- deformation grid (fabric-attached)
  if (uGrid > 0.001) {
    float gs = u*6.0/0.12;
    float gc = th/TAU*29.0;
    float g = max(gridAA(gs, 0.007), gridAA(gc, 0.007));
    col += uLime*g*uGrid*0.1*(front?1.0:0.0);
  }

  // --- seamless ring trace (continuous course around the tube)
  if (uSeam > 0.001) {
    float r = lineAA(u - uSeamU, 0.0016);
    float prog = step(fract(v - 0.25 + 1.0), uSeamProg);
    float head = exp(-pow((fract(v-0.25+1.0) - uSeamProg)*40.0, 2.0));
    col += uLime*r*uSeam*(prog*1.2 + head*2.0);
  }

  if (uWristMark > 0.001) {
    float w = smoothstep(0.955, 0.975, u);
    col += uLime*w*uWristMark*0.01*(front?1.0:0.0);
    col += uLime*lineAA(u-0.958,0.0012)*uWristMark*0.7*(front?1.0:0.0);
  }

  col = mix(col, col + uLime*0.08, uTint);
  gl_FragColor = vec4(toDisplay(col), 1.0);
}
`;

// ---------------------------------------------------------------------------
// Silicone rails
// ---------------------------------------------------------------------------
export const RAIL_VERT = /* glsl */ `
attribute vec4 rail;
varying vec2 vUv;
varying vec4 vRail;
varying vec3 vN;
varying vec3 vViewPos;
void main(){
  vUv = uv;
  vRail = rail;
  vec4 mv = modelViewMatrix*vec4(position,1.);
  vViewPos = mv.xyz;
  vN = normalize(normalMatrix*normal);
  gl_Position = projectionMatrix*mv;
}
`;

export const RAIL_FRAG = /* glsl */ `
${COMMON}
${KNIT}
varying vec2 vUv;
varying vec4 vRail;
varying vec3 vN;
varying vec3 vViewPos;
uniform float uReveal;
uniform float uRevealDir;
uniform float uDraw;      // draw-on progress along each rail (0..1)
uniform float uTrace;     // trace head position (0..1.2), <0 off
uniform float uTraceAmt;
uniform float uGlow;      // static indicator amount
uniform float uGrid;
uniform float uCut;
float lineAA(float x, float w){ float f = fwidth(x); return 1.0 - smoothstep(w, w+f*1.5, abs(x)); }
float gridAA(float x, float w){ float d = abs(fract(x+0.5)-0.5); float f = fwidth(x); return 1.0 - smoothstep(w, w+f*1.5, d); }
void main(){
  float u = vUv.x;
  float th = vUv.y*TAU;
  float rv = uRevealDir > 0. ? u : 1.0-u;
  if (rv > uReveal) discard;
  float t = vRail.x;
  float k = vRail.y;
  // staggered draw-on: secondary rails follow primary rails
  float delay = vRail.w > 0.5 ? vRail.z*0.06 : 0.25 + vRail.z*0.03;
  float d = clamp((uDraw - delay)/(1.0-delay), 0.0, 1.0);
  float tt = t; // rails grow from forearm toward elbow
  if (tt > d*1.001) discard;
  if (uCut > 0.01 && abs(angDelta(th,0.9)) < 0.95*uCut && u < 0.17*uCut) discard;

  vec3 N = normalize(vN);
  vec3 V = normalize(-vViewPos);
  // rail normals are built outward on the CPU; never flip them by winding
  // The silicone is a thin deposit: the knit underneath telegraphs through it,
  // strongest at the feathered edge where the coat is thinnest.
  float ak = abs(k);
  float edgeF = smoothstep(0.55, 1.0, ak);
  vec2 q = vec2(th/TAU*WALES, u*COURSES);
  vec2 fwq = fwidth(q);
  float mv = 1.0 - smoothstep(0.12, 0.38, max(fwq.x, fwq.y));
  float hgt = jersey(q) * mv * mix(0.0005, 0.003, edgeF);
  vec3 dpdx = dFdx(vViewPos), dpdy = dFdy(vViewPos);
  float dhx = dFdx(hgt), dhy = dFdy(hgt);
  vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det)*(dhx*r1 + dhy*r2);
  N = normalize(abs(det)*N - grad);
  // satin silicone, only slightly lifted from the black knit; edge blends into the fabric tone
  vec3 alb = mix(vec3(0.034,0.035,0.037), vec3(0.012,0.0124,0.013), edgeF);
  alb *= mix(1.0, 0.85, jersey(q)*mv*edgeF);
  float rough = mix(0.36, 0.65, edgeF);
  float sp = mix(0.55, 0.22, edgeF);
  vec3 col = studio(N, V, alb, rough, sp, mix(0.3, 0.8, edgeF), 1.0);

  // draw-on head
  float headD = exp(-pow((tt - d)*28.0, 2.0)) * step(d, 0.999);
  // restrained trace travelling along the rail during the swing
  float tr = exp(-pow((tt - uTrace)*9.0, 2.0)) * uTraceAmt;
  float spine = lineAA(k, 0.1);
  col += uLime*(headD*1.6 + tr*(0.35 + 1.1*spine));
  col += uLime*spine*uGlow*0.45;

  if (uGrid > 0.001) {
    float gs = u*6.0/0.12;
    float gc = th/TAU*29.0;
    float g = max(gridAA(gs, 0.007), gridAA(gc, 0.007));
    col += uLime*g*uGrid*0.12;
  }
  gl_FragColor = vec4(toDisplay(col), 1.0);
}
`;

// ---------------------------------------------------------------------------
// Ghost (additive fresnel silhouette) — swing trails
// ---------------------------------------------------------------------------
export const GHOST_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vViewPos;
void main(){
  vec4 mv = modelViewMatrix*vec4(position,1.);
  vViewPos = mv.xyz;
  vN = normalize(normalMatrix*normal);
  gl_Position = projectionMatrix*mv;
}
`;
export const GHOST_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vViewPos;
void main(){
  vec3 V = normalize(-vViewPos);
  float f = pow(1.0 - abs(dot(normalize(vN), V)), 3.0);
  gl_FragColor = vec4(uColor*f*uOpacity, 0.0);
}
`;

export const LINE_VERT = /* glsl */ `
attribute float along;
varying float vAlong;
void main(){ vAlong = along; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }
`;
export const LINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uHead;   // 0..1 draw progress
uniform float uTail;   // fade length
varying float vAlong;
void main(){
  if (vAlong > uHead) discard;
  float a = uTail > 0.0 ? smoothstep(uHead-uTail, uHead, vAlong) : 1.0;
  gl_FragColor = vec4(uColor*uOpacity*a, 0.0);
}
`;
