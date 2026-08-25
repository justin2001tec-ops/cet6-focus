# Reduced Motion Matrix

| Surface | Full profile | Reduced profile | Gate |
| --- | --- | --- | --- |
| Default route | 240ms opacity + 8px settle | 0ms, no displacement | PASS |
| Learning route | 140ms opacity-only entry | 0ms, no displacement | PASS |
| Entity route | 240ms opacity + minimal 0.99→1 identity settle | 0ms, scale 1 | PASS |
| Press feedback | Fine `.99`, coarse `.975` | Scale 1 | PASS |
| PhysicalSheet | MotionValue geometry, opening spring, velocity handoff, direct drag | 0ms settle; direct drag and semantic close remain | PASS |
| Background | Decode-before-crossfade, max two layers | 120ms quiet transition, max two layers, one settled layer | PASS |
| Study background | No scale/parallax; opacity and local surface changes only | Same static geometry, no motion | PASS |

The Chromium/mobile and WebKit motion suites assert the profile marker, app toggle, route behavior, shared-layout fallback, focus/zoom behavior, and reduced-motion Study path.
