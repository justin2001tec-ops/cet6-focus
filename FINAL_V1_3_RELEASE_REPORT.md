# CET6 Focus v1.3.0 — Final Merge & Release Report

## Final status

**PASS — v1.3.0 merged, deployed, online-verified, tagged, and released.** The release scope stayed within the Final Merge & Release Handoff. No post-merge product code, UI, Motion, FSRS, vocabulary, Context selection, or curation changes were made.

- Repository: [justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)
- Pull request: [#3](https://github.com/justin2001tec-ops/cet6-focus/pull/3)
- Final PR head before merge: `8fc1bf644412568ccab0928d7040916086911c24`
- Squash merge commit on `main`: `9f80a443baec1ae44036b867e545fb8b1ceaedb1`
- Release tag: [v1.3.0](https://github.com/justin2001tec-ops/cet6-focus/releases/tag/v1.3.0)
- GitHub Release: [CET6 Focus v1.3.0](https://github.com/justin2001tec-ops/cet6-focus/releases/tag/v1.3.0)
- Online site: [https://justin2001tec-ops.github.io/cet6-focus/](https://justin2001tec-ops.github.io/cet6-focus/)

The final report/evidence commit is the commit containing this file and `audit/v1.3-release/`; its SHA is recorded in the final handoff message and is the target of `v1.3.0`.

## Merge and CI gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Final PR scope | PASS; only the allowed PWA shell cache bump was added after the frozen PR head | PR #3 Files changed |
| PR quality workflow | PASS | [run 32821836840](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32821836840) |
| PR E2E workflow | PASS; 32 passed, 16 existing skips | [run 32821836840](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32821836840) |
| Squash merge | PASS; expected PR head matched | `9f80a443baec1ae44036b867e545fb8b1ceaedb1` |
| Post-merge `main` quality | PASS | [run 32822389332](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32822389332) |
| Post-merge `main` E2E | PASS; 32 passed, 16 existing skips | [run 32822389332](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32822389332) |
| Pages build and deploy | PASS | [run 32822389299](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32822389299) |

The local final-head gates also passed: vocabulary validation, typecheck, lint, 14 unit-test files / 34 tests, production build, and serial E2E with 32 passed and 0 failures.

## Frozen data and Context integrity

The release-prep before/after hash comparison was identical. No Context data was changed after the Final Holdout result.

| Artifact | Count | SHA-256 |
| --- | ---: | --- |
| `data-source/examples/selected-examples.json` | 990 | `f7902451a2e8b60c78af649c2cdd8b570bf74b5de7aee524bef6af61add24596` |
| `data-source/examples/context-curation.json` | frozen curation object | `446e9f134e873fbd4a036fa815827d796876ea09ef3db3adda9c0edda69f8410` |
| `data-source/examples/example-provenance.json` | 990 | `c1ca89de70ece3d4f036bf67b436a7bfb4981f61e0e53bbaaecfbc9a67cd0cd3` |
| `public/data/cet6-vocab.v1.json` | 2,219 | `bf9fef2b9e9fa356254186c015bca3366210940058a5ec883fb55d6071e5f96f` |

- Quality-approved Context coverage: `990 / 2,219 = 44.6%`.
- Provenance coverage: `990 / 990 = 100%`.
- Source: offline Tatoeba English CC0 snapshot.
- No authored replacement examples and no runtime Context API / AI generation.
- The Final Holdout result remains exactly `HOLDOUT_EXHAUSTED`: historical seen IDs `1542`, selected `990/990` already seen, eligible unseen selected sample `0`. It is documented as a validation limitation, not relabeled as an independent PASS or FAIL.

Prior semantic evidence remains in [`FINAL_V1_3_CORE_LEARNING_REPORT.md`](FINAL_V1_3_CORE_LEARNING_REPORT.md) and [`audit/v1.3-final-holdout/`](audit/v1.3-final-holdout/).

## Online release audit

The independent online audit was executed against the deployed Pages URL on 2026-08-25 and passed. Full machine-readable evidence is [`audit/v1.3-release/online-audit.json`](audit/v1.3-release/online-audit.json).

- Root, `sw.js`, manifest, icon, JS/CSS, vocabulary, and all runtime background resources returned HTTP 200.
- Runtime backgrounds: `14/14` AVIF and `14/14` WebP returned 200 with the expected content types.
- Online vocabulary count: `2,219`.
- Console errors: `0`; page errors: `0`; online request failures: `0`.
- Home links point to real `#/study` and `#/review` routes; local background asset loaded.
- Study route verified: Recall → Context → Meaning → Detail → Complete.
- Recall exposes Word, phonetic, audio, and exactly three recognition actions; FSRS scheduling vocabulary is absent from the UI.
- Recognition adapter verified: unknown → rating `1`, fuzzy → `2`, known → `3`; ReviewLog was written accordingly.
- Undo restored the same word and removed its ReviewLog.
- Dictation changed spelling signals only; FSRS and ReviewLog remained unchanged, with corrected dictation session evidence.
- A no-example word (`abolish`) skipped Context and opened Meaning directly; this is captured as `meaning-fallback.png`.
- Settings background mode persisted across reload.
- Required responsive sizes had zero measured overflow; reduced-motion mode rendered successfully.

Required review captures are in [`audit/v1.3-release/`](audit/v1.3-release/), including:

- [`home-desktop.png`](audit/v1.3-release/home-desktop.png)
- [`study-recall-desktop.png`](audit/v1.3-release/study-recall-desktop.png)
- [`study-context-desktop.png`](audit/v1.3-release/study-context-desktop.png)
- [`study-meaning-desktop.png`](audit/v1.3-release/study-meaning-desktop.png)
- [`study-detail-desktop.png`](audit/v1.3-release/study-detail-desktop.png)
- [`study-recall-iphone-390.png`](audit/v1.3-release/study-recall-iphone-390.png)
- [`study-meaning-iphone-390.png`](audit/v1.3-release/study-meaning-iphone-390.png)
- [`study-meaning-iphone-430.png`](audit/v1.3-release/study-meaning-iphone-430.png)
- [`study-meaning-ipad.png`](audit/v1.3-release/study-meaning-ipad.png)
- [`study-complete-desktop.png`](audit/v1.3-release/study-complete-desktop.png)
- [`meaning-fallback.png`](audit/v1.3-release/meaning-fallback.png)

## PWA and offline verification

- Active Service Worker: `/cet6-focus/sw.js`.
- Active cache: `cet6-focus-shell-v5`.
- Legacy `shell-v4` cache: absent after controlled reload.
- Service Worker controller: present.
- Warm-cache offline reload: Home rendered successfully while offline.

## Release boundary and limitations

The v1.3 release is frozen at this point. The Final Holdout did not contain an eligible unseen selected sentence, so it must not be described as an independent semantic holdout PASS. This limitation does not invalidate the recorded Round 5 semantic evidence or the release gates above, and no post-holdout curation, resampling, seed change, or data rebuild was performed.

Existing tags `v1.0.0`, `v1.1.0`, and `v1.2.0` were verified unchanged before creating `v1.3.0`. No further code or data changes are planned for v1.3.0.
