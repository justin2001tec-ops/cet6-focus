# CET6 Focus v1.3 Core Learning Refinement — Round 3 Report

## Release boundary

- Working branch: `product/v1.3-core-learning-redesign`
- Pull request: `#3` (`feat: redesign core learning experience for v1.3`)
- Delivery mode: PR-only. This work does not merge, deploy, or create the `v1.3.0` tag.
- The v1.2 immersive homepage, local background pool/cards, `/study`, `/review`, word-detail routes, FSRS adapter, IndexedDB schema, ReviewLog contract, Undo, Today Flow queue, Dictation isolation, Weak Words, Backup/Restore, v1.2.0 tag, and `main` remain within the handoff freeze. R2 Study / Review UI and Motion are retained unchanged; this R3 update is limited to offline Context selection, provenance, quality audits, documentation, tests, and data-only smoke screenshots.

## R2 baseline retained

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

## Context Data — R3 quality refinement

- Source: Tatoeba English CC0 sentence export, downloaded from the official per-language export URL and retained as an offline snapshot in `data-source/examples/tatoeba/`.
- License: CC0 1.0 Universal. Attribution is not legally required; the project credits Tatoeba.org and its contributors in `data-source/examples/manifest.json` and `data-source/examples/README.md`.
- Raw candidate coverage: `1563 / 2219 = 70.4%` after source-language, URL, digit, markup, and basic sentence-shape eligibility.
- Quality-approved coverage: `1339 / 2219 = 60.3%` (the release gate is `>= 60%`; coverage is intentionally allowed to fall when a sentence is not teachable).
- Selector v2: 6–18 tokens by default, with only clear 19–20 token exceptions; 8–14 tokens and 45–120 characters preferred; exact whole-word match; one target occurrence; simple punctuation; proper-noun and acronym penalties; corpus-derived non-target token frequency; standalone-context and target-position scoring; severe sensitive-content rejection; and a fixed regression blacklist for the R2 problem sentences.
- Explainability: `data-source/examples/build-report.json` records 41,503 source sentences, 21,655 matched target candidates, raw pairs/words, selected count, and rejection counts. `data-source/examples/example-provenance.json` records the Tatoeba sentence ID, source marker, quality score, and quality metrics for every selected example.
- Translation policy: English only. No Chinese translations were imported, fabricated, or generated; the existing sourced Chinese meaning remains on Meaning.
- Runtime policy: examples are read from the shipped local vocabulary. No paid API, runtime network API, Collins content, AI-generated examples, or test-only Context fixture is used.
- Uncovered words safely follow `Recall -> Meaning`; they do not render an empty Context stage.

The validator now rejects incomplete manifests, fixture-like examples, unlicensed example translations, target mismatch/repetition, length/structure drift, missing provenance, known regression sentences, frozen-word-count drift, runtime Tatoeba references, and quality-approved coverage below 60%.

## Context Quality Refinement — Round 3 audit

- Source remains the local Tatoeba English CC0 export. No AI-generated examples, paid service, runtime Tatoeba API, Collins content, or imported/generated Chinese example translations were added.
- Fixed-seed sample: 250 selected examples; `238 / 250 = 95.2%` passed all five rubric dimensions: independently understandable, non-target vocabulary not disproportionately difficult, neutral topic, simple syntax, and target-word teaching value.
- Severe inappropriate sample count: `0`.
- Provenance coverage: `1339 / 1339 = 100%`.
- Regression set: `abrupt`, `absence`, `abstract`, `absurd`, `accord`, `account`, `accuse`, `acute`, `addition`, `adjacent`, `adolescent`. R3 replaces `absence`, `abstract`, and `account` with clearer sentences; it intentionally leaves no approved Context for the other problem cases where the CC0 snapshot does not contain a sufficiently neutral, standalone teaching sentence.
- Audit package: [`audit/v1.3-context-quality/`](audit/v1.3-context-quality/), including the Markdown summary, JSON/CSV sample decisions, build report, regression comparison, Desktop/iPhone Context smoke screenshots, and uncovered-word Meaning fallback screenshot.

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

The frozen R2 visual review set remains in [`audit/v1.3-learning/`](audit/v1.3-learning/). The R3 data-only smoke capture is in [`audit/v1.3-context-quality/`](audit/v1.3-context-quality/) and produced three artifacts with zero console errors and zero page errors:

- `context-desktop.png` — Desktop Context with the shipped Tatoeba sentence.
- `context-iphone-390.png` — iPhone Context with the same shipped sentence.
- `meaning-fallback-iphone-390.png` — Meaning fallback for an uncovered word (`abortion`), confirming the expected `Recall -> Meaning` downgrade without an empty Context stage.

The earlier R2 capture remains complete and unchanged:

- Desktop 1920x1080: `study-recall-desktop.png`, `study-context-desktop.png`, `study-meaning-desktop.png`, `study-detail-desktop.png`, `review-recall-desktop.png`, `review-meaning-desktop.png`, `study-complete-desktop.png`.
- iPhone 390x844: `study-recall-iphone-390.png`, `study-context-iphone-390.png`, `study-meaning-iphone-390.png`, `study-detail-iphone-390.png`, `study-complete-iphone-390.png`.
- iPhone 430x932: `study-meaning-iphone-430.png`, `study-detail-iphone-430.png`.
- iPad 834x1112: `study-recall-ipad.png`, `study-meaning-ipad.png`.
- `v1.2-study-baseline.png` is retained for direct comparison.

The screenshots show the shipped Tatoeba-derived Context sentence, not an IndexedDB fixture. The in-app browser audit independently confirmed 390px overflow `0/0`, Learning Sans `600`, primary `15px` / `48px`, the `返回 / 更多 / 继续` hierarchy, and the active atmosphere opacity layer.

## Verification gates

| Gate | Result |
| --- | --- |
| `pnpm vocab:validate` | PASS — 2,219 entries; `qualityApprovedCoverage = 1339 / 2219`; `qualityApprovedCoveragePercent = 60.3%`; raw candidate coverage 70.4%; provenance 100%; sample pass 95.2% |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 13 files, 31 tests |
| `pnpm test:e2e:serial` | PASS — 32 passed, 16 intentionally skipped by existing offline/project-specific skip rules |
| R2 learning E2E | PASS — 14/14 desktop/mobile cases, including formal Context, mobile hierarchy, computed readability, reduced motion, and Home → Study fallback |
| `pnpm build` | PASS — Vite production build |
| `pnpm capture:context-quality` | PASS — 3 data-only smoke artifacts; console errors 0; page errors 0 |

## Stop-condition status

```text
Raw candidate coverage: PASS (70.4%)
Quality-approved Context coverage >= 60%: PASS (60.3%; no fabricated translations)
Sample size >= 200: PASS (250)
Sample quality pass rate >= 90%: PASS (95.2%; 238/250)
Severe inappropriate sample count = 0: PASS
Provenance coverage = 100%: PASS
Deterministic rebuild: PASS
Regression set: PASS
Learning Sans: PASS
Recall simplification: PASS
Mobile Meaning / Detail hierarchy: PASS
Overlay opacity crossfade: PASS
Home -> Study continuity and fallback: PASS
Readability / reduced motion / overflow: PASS
All required gates: PASS
审核截图: COMPLETE (R3 data-only smoke: 3)
PR #3: OPEN, unmerged
Deployment: NOT PERFORMED
v1.3.0 tag: NOT CREATED
```

R3 stop conditions are met. UI, Motion, routes, FSRS, IndexedDB schema, and learning behavior remain frozen. Work stops here pending final acceptance; no merge, deployment, or `v1.3.0` tag was performed.
