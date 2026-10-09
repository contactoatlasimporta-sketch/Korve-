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
| `korve-arm-pro-concept.mp4` | Final film, 30 s, 1920×1080, 30 fps, H.264 |
| `01-hero-frame.png` | Clean hero frame (LEFT + RIGHT, final title) |
| `02-technical-left-right-front-back.png` | LEFT / RIGHT × FRONT / BACK technical frame |
| `03-rail-textile-closeup.png` | Silicone rail + knit macro |
| `contact-sheet.png` | Representative frames (0 s, 5 s, 9 s, 13 s, 18 s, 22 s, 25 s, 29 s) |

## Storyboard as built

| Time | Scene | Shows |
|---|---|---|
| 0–3 s | Intro | A hairline sweeps across, then KORVE, ARM PRO and "Engineered for racket sports" |
| 3–7 s | Product reveal | A masked scan reveals the sleeve from cuff to wrist under directional light; the camera travels from the upper arm to the wrist |
| 7–11 s | Zonal compression | A scan ring passes along the sleeve, the four zones light up, and contour rings draw on (ring spacing shows relative density intent; no values) |
| 11–15 s | Elbow flex zone | Flexion goes 20° → 105° → 62°; the open knit expands with stretch; airflow strokes; goniometer |
| 15–20 s | Silicone rails | Rails draw on from the forearm toward the elbow; forehand motion study with ghost trails and a racket outline; a light trace runs along the rails; macro stretch with a grid printed on both knit and rails |
| 20–23 s | Left / Right | The left sleeve is revealed out of the right across a mirror plane; both rotate in opposite directions |
| 23–26.5 s | Construction | Orbit with a continuous knit course traced around the tube (no seam); cutaway of the upper cuff showing the internal anti-slip grip; low-profile wrist hem |
| 26.5–30 s | Hero | LEFT + RIGHT suspended, KORVE ARM PRO, "Support without restricting motion", "Preliminary engineering concept" |

## Design decisions (concept interpretation of the brief)

- **One continuous tube surface.** The sleeve is a single parametric surface S(u, θ).
  Knit zones, silicone rails, grids and traces all live in the fabric's own (u, θ)
  coordinates. So when the sleeve bends, twists (pronation/supination) or stretches,
  everything on it moves with the textile, the same way a deposited silicone would.
- **True LEFT/RIGHT mirroring.** The LEFT sleeve is the anatomical mirror of the
  RIGHT sleeve (x → −x). It is not the same sleeve with a different label.
- **Rail geometry (original KORVE layout, not a copy of any commercial product):**
  - L1 and L2: two lateral rails. They spiral up the dorsal-lateral forearm along the
    pronation line and pass the elbow on its lateral side.
  - M1: one medial rail. It runs from the volar (front-inner) forearm to the medial
    epicondyle.
  - S1 and S2: two short secondary elements. S1 is a dorsal forearm accent; S2 is a
    lateral anchor above the elbow.
  - Where the rails pass the elbow, they stay on its sides, close to the bending
    neutral axis. They never cross the flexion crease (front) or the olecranon apex
    (back), so they don't fight elbow flexion.
- **Rails are soft silicone, not plastic.** Each rail is a narrow-to-medium, low
  bead (about 1.5 mm) with tapered rounded tips, a satin finish and contact
  shading on the knit around it.
- **Elbow flex zone.** An open hexagonal knit. The openings are largest on the
  flexion axes (front and back) and smallest at the sides where the rails pass.
  They open further where the fabric is locally stretched.
- **Knit zones blend into each other.** The zone boundaries curve with the anatomy,
  so the zones never read as stitched panels.
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
