# CET6 Focus v1.4.0 — Final Merge & Release Report

Verified: 2026-08-25  
Repository: [justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)  
Online site: [https://justin2001tec-ops.github.io/cet6-focus/](https://justin2001tec-ops.github.io/cet6-focus/)

## Release identity

| Item | Verified value |
| --- | --- |
| PR | [#4](https://github.com/justin2001tec-ops/cet6-focus/pull/4) — merged with squash |
| R1 implementation/evidence head | `2fb96ec0d1d81381d9175e8e629b7a2586106098` |
| Pre-release final PR head | `06856c9f1e7702c11cc2053a821f47e9b797bdc1` |
| Squash merge SHA | `6dc3916052e77186b032b4720591ade56a41cbe0` |
| Release evidence commit SHA | `1b3ab55a796d8130eaaf6c5ca9c8f71201b3c812` |
| Target branch | `main` |
| Release tag | `v1.4.0`, created only after this report commit's main CI and Pages gates are Green |

PR #4 was OPEN, `base=main`, `mergeable=true`, and locked to the expected head before the squash merge. The only pre-merge product change was the required `public/sw.js` cache bump from `cet6-focus-shell-v5` to `cet6-focus-shell-v6`.

## GitHub gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Final PR push quality | PASS | [run 32870969380](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32870969380) |
| Final PR event quality | PASS | [run 32870973756](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32870973756) |
| Squash main quality + E2E | PASS | [run 32872032387](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32872032387) |
| Squash Pages build/deploy | PASS | [run 32872032299](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32872032299) |
| Evidence-only main quality + E2E | PASS | [run 32877725758](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32877725758) |
| Evidence-only Pages build/deploy | PASS | [run 32877725729](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32877725729) |

The main E2E job includes Chromium and WebKit projects. The final local serial rerun was `61 passed / 17 skipped / exit 0`; skipped cases were intentional environment-scoped skips already present in the suite.

## Online release audit

The final online audit completed **46 PASS / 0 FAIL** across Chromium desktop 1440×900, Chromium mobile 390×844, and WebKit mobile 390×844. A separate responsive smoke passed at 390×844, 430×932, 768×1024, 834×1112, 1440×900, and 1920×1080.

- HTTP core resources: PASS; 35 checked, all HTTP 200.
- Background assets: PASS; 14 AVIF + 14 WebP = 28/28 HTTP 200.
- Home: PASS; full-screen photography, Featured Word, Learn/Review, quiet navigation, press primitive.
- Home → Study: PASS; Recall → Context → Meaning → Detail → Continue, with clean route continuity.
- Study/Review: PASS; recognition labels remain Chinese, FSRS mapping and Undo/IndexedDB parity remain intact.
- Shared Layout: PASS; Vocabulary → Word Detail preserves `word-cet6-abandon`.
- PhysicalSheet: PASS; opening/focus, slow drag, reverse drag, fast flick velocity handoff, close, Escape, Back, and WebKit smoke.
- Rapid Navigation: PASS; latest intent wins, final route correct, no duplicate route DOM.
- Background lifecycle: PASS; A → B → C rapid retarget, maximum two layers, settled one layer, stale layers removed.
- Reduced Motion: PASS for OS and app settings; no scale-heavy morph/parallax/depth zoom/animated blur.
- Accessibility/input: PASS for increased contrast, coarse/fine pointer, keyboard focus, Escape, and 200% zoom.
- PWA: PASS; `shell-v6` controls the page, `shell-v5` is absent, vocabulary is warm-cached, offline reload passes.
- Runtime: PASS; console errors 0, page errors 0, failed critical requests 0.

The first CDN probe saw a short pre-propagation stale bundle and was not counted. The final evidence run was performed after the root returned the current deployed bundle and after each screenshot's background image reported positive natural dimensions and successful decode.

## Frozen contracts

| Contract | Result |
| --- | --- |
| Vocabulary | 2,219 |
| Selected Context | 990 / 2,219 |
| Context coverage | 44.6% |
| Provenance | 100% |
| Vocabulary SHA-256 | `3D2586557C3E979D588CE797F9F50271C98B577DF0254027E41692F23C34FFC4` |
| Context curation SHA-256 | `A6F95C6B491CDB0AA41443AFB3AE63DCE1DFD4E839A5A53193F7D52635DD8E35` |
| Selected examples SHA-256 | `F7902451A2E8B60C78AF649C2CDD8B570BF74B5DE7AEE524BEF6AF61ADD24596` |
| Example provenance SHA-256 | `C1CA89DE70ECE3D4F036BF67B436A7BFB4981F61E0E53BBAAECFBC9A67CD0CD3` |

All four frozen hashes were unchanged before and after the PWA bump and are unchanged by the release evidence commits. The Context corpus remains curated from an offline CC0 source; words without an approved example safely fall back to Meaning.

## Historical tag protection

The existing annotated tags were resolved before creating `v1.4.0` and must remain unchanged:

| Tag | Tag object | Commit target |
| --- | --- | --- |
| `v1.0.0` | `c6022ec2cd486c65f38dcf53fd1e981daec0691e` | `9eb6a60f0f4396f267d1a6e8ae8253172045f77f` |
| `v1.1.0` | `4b8fd7d530b9e5482951a3c8d87af2cc2f188fe1` | `7aa93ea1caf67f6621878ea5f8737407c6d16070` |
| `v1.2.0` | `38ccb85cbb2599d6f2830120c6e63ee12b41bfca` | `e571fcedf59e095819dc8974951fa0eb6e212585` |
| `v1.3.0` | `e4882fea8cb54b2af7381d3fc996da0f160a5f60` | `afaf1db78e7d31709694189457f679e62ed3f67a` |

## Evidence index

See [`audit/v1.4-release/README.md`](audit/v1.4-release/README.md) for the complete evidence index and screenshots. The release evidence commit is report/evidence-only; it contains no product implementation, PWA source, vocabulary, Context, Study, Review, FSRS, Motion, CSS, or PhysicalSheet changes.

## Known limitation and freeze boundary

This report does not claim a field INP p75 statistic; the smoke gate verifies immediate feedback, no obvious jank, no motion-period blocker, and no animation queue. After `v1.4.0` GitHub Release is published, v1.4 is frozen. Further changes belong in the v1.5 backlog.
