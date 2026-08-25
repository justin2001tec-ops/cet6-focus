# R1 DB / Migration Scope Decision

**REVERTED — no exception retained.**

The R1 decision is Path A. The vocabulary batching, queue/cache, restore-marker, and card-initialization changes in `src/db/db.ts` and `src/lib/migration.ts` were not necessary to establish the v1.4 system-motion acceptance behavior, so they are reverted from the PR worktree.

No Reviewed Performance Exception is claimed. No new DB parity gate is required for R1; the existing database, migration, backup, and FSRS tests remain part of the normal local suite.
