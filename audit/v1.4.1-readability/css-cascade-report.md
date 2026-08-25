# CSS Cascade Report

Status: **PASS**

The repair is owned by `ReadingSurface` itself. `ReadingSurface` accepts `tone="learning"` and renders `data-reading-tone="learning"`; the Context, Meaning, and Detail stages use that tone explicitly.

The semantic rule is `.reading-surface[data-reading-tone="learning"]`. Its two-attribute specificity outranks the generic later `.reading-surface` rule in `system-experience.css`, so the learning surface owns its background, text color, border, shadow, backdrop behavior, and all eight `--reading-*` tokens regardless of import order. No `!important` or `v141-overrides.css` was introduced.

The photography layer is separate: `--learning-photo-primary`, `--learning-photo-secondary`, `--learning-photo-muted`, and `--learning-photo-accent` are used by the word header, phonetic, audio, bookmark, Recall, and topbar. Surface content uses `--learning-surface-*` aliases sourced from `--reading-*` tokens.

Detail no longer uses an internal `max-height` scroll region. `.learning-shell`, `.learning-shell__inner`, and the learning app frame preserve vertical document flow; only the horizontal axis is clipped to contain the local header scrim. This keeps page scrolling natural while preventing a local scrim from creating a horizontal scrollbar.

