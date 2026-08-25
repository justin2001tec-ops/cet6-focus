# Reduced Motion Matrix

| Surface | Full profile | Reduced profile | Gate |
| --- | --- | --- | --- |
| Default route | 240ms opacity + 8px settle | 0ms, no displacement | PASS |
| Learning route | 140ms opacity-only entry | 0ms, no displacement | PASS |
| Entity route | 240ms opacity + minimal 0.99→1 identity settle | 0ms, scale 1 | PASS |
| Press feedback | Fine `.975`, coarse `.96` | Scale 1 | PASS |
| PhysicalSheet | CSS geometry settle and direct drag | 0ms settle; direct drag and semantic close remain | PASS |
| Background | Decode-before-crossfade, max two layers | Crossfade/transition disabled by reduced CSS profile | PASS |
| Study background | No scale/parallax; opacity and local surface changes only | Same static geometry, no motion | PASS |

The Chromium/mobile and WebKit motion suites assert the profile marker, route behavior, focus/zoom behavior, and reduced-motion Study path.
