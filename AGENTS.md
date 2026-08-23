# Agent Notes

- Use `pnpm` for dependency and validation commands.
- Keep learning data in Dexie/IndexedDB; do not move the core dataset or logs into localStorage.
- Keep FSRS calls inside `src/lib/fsrs.ts` and study transactions inside `src/db/`.
- Do not add global keyboard shortcuts. Study shortcuts only run when the active element is not an input, textarea, select, or contenteditable element.
- Do not add remote image hotlinks; background metadata must be updated together with local files and `IMAGE_SOURCES.md`.
