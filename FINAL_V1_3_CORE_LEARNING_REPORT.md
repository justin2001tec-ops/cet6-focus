# CET6 Focus v1.3 Core Learning Refinement — Round 2 Report

## Release boundary

- Working branch: `product/v1.3-core-learning-redesign`
- Pull request: `#3` (`feat: redesign core learning experience for v1.3`)
- Delivery mode: PR-only. This work does not merge, deploy, or create the `v1.3.0` tag.
- The v1.2 immersive homepage, local background pool/cards, `/study`, `/review`, word-detail routes, FSRS adapter, IndexedDB schema, ReviewLog contract, Undo, Today Flow queue, Dictation isolation, Weak Words, Backup/Restore, v1.2.0 tag, and `main` remain within the handoff freeze. Only the R2-defined data import and presentation-layer refinements were touched.

## R2 scope completed

The existing learning state machine and business adapters remain intact:

```text
Recall -> Context -> Meaning -> Detail -> Transitioning -> Recall
```

This round completed only the five handoff directions:

1. formal offline Context examples;
2. Learning Sans typography;
3. mobile Meaning / Detail action hierarchy;
4. further Recall simplification;
5. overlay and Home-to-Study motion continuity.

## Context Data

- Source: Tatoeba English CC0 sentence export, downloaded from the official per-language export URL and retained as an offline snapshot in `data-source/examples/tatoeba/`.
- License: CC0 1.0 Universal. Attribution is not legally required; the project credits Tatoeba.org and its contributors in `data-source/examples/manifest.json` and `data-source/examples/README.md`.
- Coverage: `exampleCoverage = 1625 / 2219`; `exampleCoveragePercent = 73.2%` (above the required 60% gate).
- Selection: one deterministic English sentence per covered headword, exact whole-word match, 7–24 tokens, ASCII-normalized, URL/digit/markup/profanity/adult/current-political-content filters, no repeated target word. The filter is reproducible through `scripts/build-examples.ts`.
- Translation policy: English only. No Chinese translations were imported, fabricated, or generated; the existing sourced Chinese meaning remains on Meaning.
- Runtime policy: examples are read from the shipped local vocabulary. No paid API, runtime network API, Collins content, AI-generated examples, or test-only Context fixture is used.
- Uncovered words safely follow `Recall -> Meaning`; they do not render an empty Context stage.

The validator now emits the required source metrics and rejects incomplete manifests, fixture-like examples, unlicensed example translations, frozen-word-count drift, and coverage below 60%.

## Typography

- Added `--font-learning-word` with the handoff-specified Inter/system Sans stack.
- `.learning-word-header h1` and `.learning-transition-word` now use the Learning Sans token, weight `600`, and a less negative tracking value for long-word readability.
- The serif `--font-word` token remains available for non-learning surfaces; it was not globally deleted.

## Mobile Action Hierarchy

- Meaning has exactly one primary action: `继续`.
- Meaning secondary actions are `返回` and `更多`; they are ghost actions and no longer repeat the recognition rating.
- Detail has exactly one primary action: `继续`; `返回核心词义` is the demoted secondary action.
- Mobile primary actions are near full width, `15px`, and `min-height: 48px`; the 390x844 and 430x932 computed-style/overflow gate passed.
- Recognition choices are still recorded internally at the frozen adapter boundary. Daily Recall shows only `认识 / 模糊 / 不认识`; explanatory copy moved to keyboard help.

## Recall Refinement

- The daily prompt is now the single weak phrase `想一想，再判断`.
- Removed the repeated prompt/explanation, `现在的感觉`, and the three button descriptions from the daily flow.
- The keyboard help retains the meaning of the three recognition choices for users who need it.

## Motion Refinement

- The atmosphere no longer animates a full-screen gradient background directly. Fixed state layers crossfade through opacity (`base/context/meaning/detail/transitioning/loading`) using the existing `140/240/320/400ms` motion tokens.
- Word transition renders the outgoing word and next word together: current `opacity 1 -> 0`, `translateY 0 -> -12px`; next `opacity 0 -> 1`, `translateY 14px -> 0`. There is no intentional blank pause and no `animationend` dependency.
- Home → Study uses `document.startViewTransition` as progressive enhancement with an opacity/transform fallback. The local photo remains continuous and keeps the same scale; featured word and controls exit gently, Study content enters in sequence, and no full-background zoom or blur animation is introduced.
- `prefers-reduced-motion` and the app setting collapse the transitions while preserving the same route and state behavior.

## Evidence package

The complete visual review set is in [`audit/v1.3-learning/`](audit/v1.3-learning/). `pnpm capture:v1.3` produced 17 artifacts with zero console errors and zero page errors:

- Desktop 1920x1080: `study-recall-desktop.png`, `study-context-desktop.png`, `study-meaning-desktop.png`, `study-detail-desktop.png`, `review-recall-desktop.png`, `review-meaning-desktop.png`, `study-complete-desktop.png`.
- iPhone 390x844: `study-recall-iphone-390.png`, `study-context-iphone-390.png`, `study-meaning-iphone-390.png`, `study-detail-iphone-390.png`, `study-complete-iphone-390.png`.
- iPhone 430x932: `study-meaning-iphone-430.png`, `study-detail-iphone-430.png`.
- iPad 834x1112: `study-recall-ipad.png`, `study-meaning-ipad.png`.
- `v1.2-study-baseline.png` is retained for direct comparison.

The screenshots show the shipped Tatoeba-derived Context sentence, not an IndexedDB fixture. The in-app browser audit independently confirmed 390px overflow `0/0`, Learning Sans `600`, primary `15px` / `48px`, the `返回 / 更多 / 继续` hierarchy, and the active atmosphere opacity layer.

## Verification gates

| Gate | Result |
| --- | --- |
| `pnpm vocab:validate` | PASS — 2,219 entries; `exampleCoverage = 1625 / 2219`; `exampleCoveragePercent = 73.2%`; source Tatoeba English CC0; license CC0 1.0 |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 12 files, 27 tests |
| `pnpm test:e2e:serial` | PASS — 32 passed, 16 intentionally skipped by existing offline/project-specific skip rules |
| R2 learning E2E | PASS — 14/14 desktop/mobile cases, including formal Context, mobile hierarchy, computed readability, reduced motion, and Home → Study fallback |
| `pnpm build` | PASS — Vite production build |
| `pnpm capture:v1.3` | PASS — 17 artifacts; console errors 0; page errors 0 |

## Stop-condition status

```text
Formal offline examples >= 60%: PASS (73.2%; no fabricated translations)
Learning Sans: PASS
Recall simplification: PASS
Mobile Meaning / Detail hierarchy: PASS
Overlay opacity crossfade: PASS
Home -> Study continuity and fallback: PASS
Readability / reduced motion / overflow: PASS
All required gates: PASS
审核截图: COMPLETE
PR #3: OPEN, unmerged
Deployment: NOT PERFORMED
v1.3.0 tag: NOT CREATED
```

R2 stop conditions are met. Work stops here pending final visual/code acceptance; no Round 3 changes, merge, deployment, or release tag were performed.
