# KORVE ARM PRO — Preliminary Engineering Concept Film

A 30-second motion-design technical concept film (1920×1080, 30 fps, H.264) for
**KORVE ARM PRO**, a compression arm sleeve for padel and racket sports. It is a
visual brief for a seamless-sportswear manufacturer's **feasibility review**. It
is not a marketing piece and not a validated specification.

Built with **Remotion** (React) and a custom **Three.js** renderer. Every frame is
a pure function of the frame number, so renders are deterministic: nothing is random
and no state builds up between frames.

## Deliverables (`deliverables/`)

| File | What |
|---|---|
| `korve-arm-pro-concept.mp4` | Final film: 30 s, 1920×1080, 30 fps, H.264 (1.5× supersampled render) |
| `01-hero-frame.png` | Hero frame: LEFT + RIGHT with the final title |
| `02-technical-left-right-front-back.png` | Technical frame: LEFT / RIGHT × FRONT / BACK |
| `03-rail-textile-closeup.png` | Silicone rail macro: low-profile bonded rail on the knit |
| `04-silicone-knit-co-deformation.png` | Silicone + knit co-deformation, stretched state |
| `05-elbow-flex-zone.png` | Elbow flex zone during flexion |
| `06-seamless-tubular-body.png` | Seamless tubular body during the 360° turn |
| `07-upper-cuff-internal-grip.png` | Upper-cuff cutaway: internal grip vs external support rail |
| `contact-sheet.png` | Representative frames (1.5 s, 5 s, 9 s, 13 s, 18 s, 22 s, 25 s, 29 s) |

## Storyboard as built

| Time | Scene | Shows |
|---|---|---|
| 0–3 s | Intro | A hairline sweeps across, then KORVE, ARM PRO and "Engineered for racket sports" |
| 3–7 s | Product reveal | A masked scan reveals the sleeve from cuff to wrist under directional light; the camera travels from the upper arm to the wrist |
| 7–11 s | Zonal compression | A scan ring passes along the sleeve, the four zones light up, and contour rings draw on (ring spacing shows relative density intent; no values) |
| 11–15 s | Elbow flex zone | Flexion goes 20° → 105° → 62°; the open knit expands with stretch; airflow strokes; goniometer |
| 15–20.5 s | Silicone rails | Rails draw on from the forearm toward the elbow; forehand motion study with ghost trails and a racket outline; a light trace runs along the rails |
| 18.7–20.5 s | Silicone + knit co-deformation | Macro: rest → stretched → recovered. A grid printed on knit and rails plus gauge marks on a rail show that the silicone deforms with the fabric (illustrative, not a measured value) |
| 20.5–23.5 s | Left / Right | The left sleeve is revealed out of the right across a mirror plane; both rotate in opposite directions |
| 23.3–27.5 s | Construction | Full 360° turn of the tubular body with a continuous knit course traced around it and a degree counter (no longitudinal sewn seam, shown as a manufacturing target); cuff cutaway labelling A · internal grip (printed dot-wave on the inner face) and B · external support rail (smooth bead on the outer face); low-profile wrist hem |
| 27.5–30 s | Hero | LEFT + RIGHT suspended, KORVE ARM PRO, "Support without restricting motion", "Preliminary engineering concept" |

## Design decisions (concept interpretation of the brief)

- **One continuous tube surface.** The sleeve is a single parametric surface S(u, θ).
  Knit zones, silicone rails, grids and traces all live in the fabric's own (u, θ)
  coordinates. So when the sleeve bends, twists (pronation/supination) or stretches,
  everything on it moves with the textile, the same way a deposited silicone would.
- **True LEFT/RIGHT mirroring.** The LEFT sleeve is the anatomical mirror of the
  RIGHT sleeve (x → −x). It is not the same sleeve with a different label.
- **Rail geometry (original KORVE layout, not a copy of any commercial product):**
  - R1: primary extensor spiral. It runs from the distal dorsal forearm, up along the
    supination line, to the lateral epicondyle.
  - R2: primary rail on the brachioradialis line. It converges with R1 toward the
    lateral epicondyle and stops below the flexion crease.
  - R3: primary volar / medial line. It runs from the anterior-medial forearm to the
    medial epicondyle.
  - S1: short secondary element on the dorsal-ulnar forearm, aligned with the rotation
    spiral.
  - S2: short secondary element on the upper arm. It continues R1's line after a
    deliberate gap over the joint.
  - Where the rails pass the elbow, they stay on its sides, close to the bending
    neutral axis. They never cross the flexion crease (front) or the olecranon apex
    (back).
- **Rails are soft silicone deposited on the knit, not separate parts.** Each rail is a
  narrow-to-medium, flat-topped deposit about 0.7–1 mm high. Its edge feathers to zero
  height on the fabric, so there is no step and no gap. The knit texture shows through
  the thin coat, most strongly at the edges, and the contact shadow is minimal.
- **Elbow flex zone.** An open hexagonal knit. The openings are largest on the
  flexion axes (front and back) and smallest at the sides where the rails pass.
  They open further where the fabric is locally stretched.
- **Knit zones blend into each other.** The zone boundaries curve with the anatomy,
  so the zones never read as stitched panels.
- **Two silicone functions, two applications.** The internal cuff grip is a matte
  printed dot-wave on the inner face. The external rails are smooth satin beads on the
  outer face.
- **Wrist.** A thin folded hem with a fine 1×1 rib and no silicone ring.
  **Upper cuff.** A low-profile welt with an internal silicone wave-grip, which is
  deliberately different from the external rails.

## Engineering honesty

The film contains **no** compression-pressure values, medical or injury-prevention
claims, quantified performance claims, or statements of wash-test or manufacturer
approval. The density profile in scene 2 is labelled *illustrative, not to scale*.
Seamless tubular construction is shown as the **preferred** construction, subject to
manufacturer feasibility.

## Project structure

```
src/
  model/sleeve.ts        parametric sleeve: anatomy, bend (offset hinge), twist, local stretch, rails, hems
  three/shaders.ts       GLSL: studio lighting, procedural knit zones, silicone, zone/scan/grid/cut FX
  three/stage.ts         Three.js renderer wrapper, projection helpers
  three/textures.ts      deterministic canvas textures (rail contact AO, tonal knit-in wordmark)
  director/director.ts   shot list: cameras, poses, effects and blending between shots
  director/math.ts       easing curves, orientation helpers
  film/Film.tsx          main composition
  film/Overlays.tsx      typography, HUD, callouts, goniometer, airflow, swing ghost, L/R labels
  film/Stills.tsx        deliverable stills (hero, technical L/R sheet, rail macro)
```

## Run / render

```bash
npm install
npm run studio                     # interactive preview (Remotion Studio)

# final film; pixelRatio 2 = 2× supersampling inside WebGL
npx remotion render KorveArmPro deliverables/korve-arm-pro-concept.mp4 --props='{"pixelRatio":2}'

# stills
npx remotion still HeroFrame   deliverables/01-hero-frame.png
npx remotion still TechSheetLR deliverables/02-technical-left-right-front-back.png
npx remotion still RailMacro   deliverables/03-rail-textile-closeup.png
```

`remotion.config.ts` uses SwiftShader (`swangle`) so that renders work on machines
without a GPU. On a workstation with a GPU, switch it to `angle` for much faster
renders. To use a specific Chromium build, set `REMOTION_BROWSER` to the path of a
Chromium / headless-shell binary.

### Tweaking

- Timing for every scene is in `src/director/director.ts` (`SCENES`, and each `shot*` function).
- Rail geometry is in `RAILS` in `src/model/sleeve.ts`. Each rail is a list of control
  points in (u, θ°): θ = 0 lateral, 90 anterior, 180 medial, 270 posterior.
- Knit zone boundaries and structures are in `knitAt()` in `src/three/shaders.ts`.
