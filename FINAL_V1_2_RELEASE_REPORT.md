# CET6 Focus v1.2.0 Final Release Report

Release date: 2026-08-24

## Release identity

- Repository: https://github.com/justin2001tec-ops/cet6-focus
- PR: [#2](https://github.com/justin2001tec-ops/cet6-focus/pull/2)
- Frozen PR head: `28658e3bcd62d26e5d12c876c74b4ae882e9f6f1`
- Squash merge / release commit: `e571fcedf59e095819dc8974951fa0eb6e212585`
- Tag: `v1.2.0`, peeled commit `e571fcedf59e095819dc8974951fa0eb6e212585`
- GitHub Release: [CET6 Focus v1.2.0](https://github.com/justin2001tec-ops/cet6-focus/releases/tag/v1.2.0)
- Live site: https://justin2001tec-ops.github.io/cet6-focus/

The release tag remains anchored to the verified application commit above. This report is a subsequent documentation-only commit and does not change the tagged release contents.

## Release Gate Recovery

The first formal release attempt stopped at the required gate after `aurora-01.avif` returned HTTP 503. No application, UI, background, or architecture changes were made in response.

Recovery evidence:

- Cache-busting query: `?release=e571fced`
- `aurora-01.avif`: HTTP 200, `image/avif`, 380,702 bytes
- `aurora-01.webp`: HTTP 200, `image/webp`, 400,586 bytes
- Sampled `aurora-02`, `penguins-01`, `lighthouse-02`, and `daisy-02` in both AVIF and WebP: all HTTP 200, expected MIME, nonempty
- Full runtime pool: 14 AVIF + 14 WebP = 28/28 HTTP 200, expected MIME, nonempty
- Persistent 5xx/404: none observed after recovery
- Code/visual/background modifications during recovery: none

The initial 503 is classified as a transient CDN/Pages edge response based on the cache-busting recovery and the unchanged application build.

## CI and deployment

- [Main quality workflow](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32714888776): success
  - quality job: success
  - serial E2E job: success
- [GitHub Pages workflow](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32714888789): success
  - build: success
  - deploy: success
- Online `sw.js`: HTTP 200; shell cache `cet6-focus-shell-v4` present; old v3 literal absent; activation cleanup logic present
- Online manifest: HTTP 200

## Online smoke and responsive verification

The deployed site loaded the v1.2 immersive home after a normal reload. The prior stale v1.1 dashboard view was resolved by reload; no source change was required.

- Legacy dashboard/sidebar/date/phonetic/Chinese/scene-label elements: absent
- Featured word: exactly one
- Home entry cards: Learn and Review only
- Navigation icons: 3
- Routes passed: `#/`, `#/study`, `#/review`, `#/words`, `#/dictation`, `#/mistakes`, `#/stats`, `#/settings`, `#/more`
- Learn and Review home links: passed
- Responsive viewports: 1920x1080, iPhone 390x844, iPhone 430x932, iPad 834x1112
- Horizontal and vertical overflow: none in all checked viewports
- Home action width: approximately 88% on mobile/default layouts and 87.5% at 1920px desktop width

## Functional regression evidence

- Study: rating wrote one ReviewLog entry; Stats showed `Review Good / Easy 100%` and `学习词数 1`.
- Undo: restored the same first study card; reload preserved the restored state.
- Settings: daily new words persisted through `20 -> 30` and was restored to `20`.
- Dictation: one wrong answer followed by the correct correction; Stats showed one dictation attempt, one first-wrong attempt, one completed correction, while Review Good remained 100%.
- FSRS, IndexedDB, Undo, Dictation, Weak Words, Backup/Restore, and PWA offline behavior remained available.

## PWA warm-cache verification

The production preview was warmed online and the official offline-preview spec was run serially with one worker:

```text
Chromium: 1 passed
Mobile: 1 passed
2 passed
```

The spec verified service-worker control, cached shell/vocabulary availability, offline reload, and continued v1.2 behavior.

## Error summary

```text
console errors: 0
page errors: 0
critical network errors: 0
runtime background failures: 0
P0: 0
P1: 0
```

## Final state

```text
PR #2: MERGED
main: GREEN
Pages: DEPLOYED
Release gate: RECOVERED
v1.2.0: TAGGED
GitHub Release: PUBLISHED
Online audit: PASS
```

## Known limitations

- Web Speech behavior can vary by browser and installed voices.
- PWA evidence covers a warmed-cache offline reload, not a cold first-install test.
- Serial E2E is the stable verification path; earlier parallel initialization races were not treated as release evidence.
- No physical iPhone hardware safe-area validation was performed.
