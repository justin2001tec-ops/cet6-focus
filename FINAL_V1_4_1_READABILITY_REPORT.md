# CET6 Focus v1.4.1 — Learning Readability & Layout Integrity Patch

Status: **PASS — PR-only handoff**

Branch: `fix/v1.4.1-learning-readability`

## Root cause

`LearningStages` rendered Context, Meaning, and Detail with the generic `ReadingSurface`, while `learning-experience.css` supplied a dark-card `--learning-ink` palette. `system-experience.css` loaded later and made `.reading-surface` light. The surface and learning text therefore came from different semantic contracts, producing white-on-white or low-contrast Light-theme learning text. Detail also used a 54vh internal scroll box, which could trap the reader and hide the continuation action.

## Repair

- Added the explicit `ReadingSurface tone="learning"` API and `data-reading-tone="learning"` output.
- Added complete paired Light/Dark/System tokens: background, primary, secondary, tertiary, accent, separator, highlight background, and highlight text.
- Split photography tokens from surface tokens; word/header/audio/bookmark/Recall/topbar remain photography-aware, while learning copy uses surface semantics.
- Added local header scrim protection, stage background-weight tuning, readable minimum sizes, responsive length tiers, natural Detail page scrolling, horizontal overflow containment, and stronger High Contrast treatment.
- Kept the Study state machine, FSRS, ReviewLog, Undo, vocabulary, Context data, PWA behavior, and Motion systems unchanged.

## Verification

- `pnpm vocab:validate` — PASS; 2219 unique entries, 990 curated Context examples, 100% provenance. Informational coverage remains 44.6% under the prior Round 5 policy; this patch did not alter data.
- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS.
- `pnpm build` — PASS.
- `pnpm test` — PASS; 14 files, 34 tests. The first sandbox attempt was denied before test execution; the same command was rerun with controlled workspace access.
- Readability suite — Chromium 6/6 PASS; Mobile Chromium 6/6 PASS; WebKit 6/6 PASS.
- Full serial Playwright run — PASS; 80 tests passed, 19 tests intentionally skipped by project/device scope, and 0 failed. This includes the frozen Motion/WebKit suite and the new Chromium/Mobile/WebKit readability suites.

## Data and freeze evidence

SHA-256 values are unchanged from v1.4.0:

| Artifact | SHA-256 |
| --- | --- |
| `public/data/cet6-vocab.v1.json` | `3D2586557C3E979D588CE797F9F50271C98B577DF0254027E41692F23C34FFC4` |
| `data-source/examples/context-curation.json` | `A6F95C6B491CDB0AA41443AFB3AE63DCE1DFD4E839A5A53193F7D52635DD8E35` |
| `data-source/examples/selected-examples.json` | `F7902451A2E8B60C78AF649C2CDD8B570BF74B5DE7AEE524BEF6AF61ADD24596` |
| `data-source/examples/example-provenance.json` | `C1CA89DE70ECE3D4F036BF67B436A7BFB4981F61E0E53BBAAECFBC9A67CD0CD3` |

No Motion Engine, Shared Layout, PhysicalSheet, background asset/engine, Study state machine, FSRS, ReviewLog, Undo, Dictation, IndexedDB, Context curation, vocabulary, or PWA file was changed.

## Delivery boundary

The final branch must be pushed and opened as a PR. Keep the PR **OPEN** for visual/code acceptance. Do not merge, deploy, or create a `v1.4.1` tag. If any final gate fails, report the exact blocker and stop.

## R1 Final Visual Integrity Fix

Status: **PASS — local implementation and evidence complete; PR-only**

R1 corrected only the four visual-integrity gaps named by the handoff:

- Background hierarchy now follows the required direction: Recall is the most atmospheric/lightest scrim, Context is stronger, Meaning is stronger again, and Detail is the quietest/strongest scrim. The observed active-layer alpha ordering is `0.26 < 0.42 < 0.54 < 0.64` across bright (`plateau-kiang-01`), dark (`stars-02`), textured (`waterfall-02`), and medium (`altiplano-01`) scenes.
- Safe Area uses separate logical inline start/end padding with `max(--learning-page-gutter, env(safe-area-inset-left/right, 0px))`, plus the existing bottom inset. A test-only wrapper simulated independent 44px left and right insets across 390x844, 430x932, 844x390, 852x393, and 1112x834; all 10 cases passed with no horizontal overflow beyond 1 CSS pixel.
- Zoom evidence now separates automated root/CSS zoom from real browser zoom. The automated `document.documentElement.style.zoom='2'` contract passed in Chromium, Mobile Chromium, and WebKit. A manual Chromium browser-level 200% check passed on the local Windows desktop host: the effective CSS viewport narrowed from 1280x720 to approximately 664x680, Meaning and Detail remained readable, and the continuation CTA stayed reachable. Browser version/OS build are not exposed by the browser control surface. Safari is explicitly `NOT_AVAILABLE` because Safari is unavailable in this Windows environment.
- `forced-colors: active` and `prefers-contrast: more` are separate gates. Both passed in Chromium, Mobile Chromium, and WebKit, including stronger boundaries, contrast tokens, controls, and focus visibility.

### R1 evidence links

- [R1 audit index](audit/v1.4.1-readability/README.md)
- [Background hierarchy report](audit/v1.4.1-readability/background-hierarchy-report.json)
- [Safe Area report](audit/v1.4.1-readability/safe-area-report.json)
- [Zoom report](audit/v1.4.1-readability/zoom-200-report.json)
- [Contrast report](audit/v1.4.1-readability/high-contrast-report.json)
- [Visual review](audit/v1.4.1-readability/visual-review.md)

### R1 verification

- Chromium Readability: 9/9 PASS.
- Mobile Chromium Readability: 9/9 PASS.
- WebKit Readability: 9/9 PASS.
- Chromium R1 screenshot evidence: 2/2 PASS.
- Full serial Playwright: 90 PASS, 21 intentional project/device skips, 0 failures across 111 tests.
- `pnpm vocab:validate`: PASS; 2219 unique entries, 990 curated Context examples, 100% provenance; 44.6% coverage remains informational under the prior Round 5 policy.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test`: PASS; 14 files, 34 tests.
- `pnpm build`: PASS.

Data hashes, Motion Engine, Shared Layout, PhysicalSheet, FSRS, Study flow/state machine, Context curation, vocabulary, PWA behavior, background assets, and background engine remain frozen and unchanged. PR #5 remains **OPEN**; this round does not merge, deploy, or create a `v1.4.1` tag.
