# v1.5 Planning Audit

审计日期：2026-08-28

本目录是 CET6 Focus v1.5 的 Product Quality Audit & Scope Definition 证据。v1.4.1 已冻结；本分支只增加审计、截图与范围提案，不修改产品代码。

Scope Finalization：`FINALIZED — P2-ONLY QUALITY HARDENING`。

- Approved P1：0
- Approved Product P2：2（`P2-TYPO-001`、`P2-A11Y-001`）
- Approved QA P2：1（`P3-COVERAGE-001`，priority=`P2_QA`）

## Release closure baseline

- `main` / planning 起点：`574bee5b1b61ea48b77032b946bcd570f1b4df85`
- PR #5 squash merge：`61207041510271267f99f61f0c80f6db3c85175d`
- v1.4.1 tag target：`574bee5b1b61ea48b77032b946bcd570f1b4df85`
- annotated tag object：`fa52ad67261398cdcd24c10a61f2fd4da9099919`
- PWA shell：`cet6-focus-shell-v7`
- 静态词库：2,219；Approved Context：990 / 2,219（44.6%）；provenance：100%

机器可读的发布身份记录见 [release-baseline.json](./release-baseline.json)。

## Audit method

- 使用本地 Vite 开发构建 `http://127.0.0.1:4173/`，Chromium 隔离 context，每个场景不共享 IndexedDB。
- 采集 390×844、1440×900，以及 390×667、430×932、844×390、852×393、1112×834、1920×1080 的响应式测量。
- 采集 Home、Study recall/meaning/detail、Vocabulary、Word Detail、Settings、Weak Words、Dictation 的真实首屏截图。
- 额外检查 `prefers-reduced-motion: reduce`、`forced-colors: active`、键盘 focus 与自动化 200% CSS zoom 信号。
- 结论只把可重复的用户影响列为候选；视觉语义、浏览器真实缩放与历史 WebKit gate 不由自动 DOM 测量替代。

## Verified local gates

- `pnpm vocab:validate`：PASS；2,219 unique CET-6 entries，missingMeaning=0，missingDefinition=0，provenance=100%；Round 5 semantic/blind validation 均为 100% / severe inappropriate=0；44.6% coverage 按既定策略为 informational only。
- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS。
- `pnpm test`：PASS；14 files / 34 tests。
- 本地截图运行：10 张截图、20 个页面状态测量、7 个响应式尺寸；console error、page error、failed request 均为 0。开发构建重复输出既有 `motion() is deprecated. Use motion.create()` warning；它不是本轮新增的 production error，且 Motion Engine 保持冻结。
- v1.4.1 历史 Motion / WebKit / PWA / Offline 结果按 release baseline 继承，不在本 planning PR 中重写或重新解释。

## What remains frozen

本轮不修改 Motion Engine、PhysicalSheet、FSRS、Context data、Vocabulary、Study state machine、DB schema、PWA shell-v7、背景资源、路由行为或 v1.4.1 release history。也不做 Home/Study 重做、Liquid Glass 换皮、后端/账号/云同步/AI。

## Evidence index

截图位于 [screenshots/](./screenshots/)：

1. `home-mobile.png`
2. `home-desktop.png`
3. `study-recall-mobile.png`
4. `study-meaning-mobile.png`
5. `study-detail-mobile.png`
6. `vocabulary-mobile.png`
7. `word-detail-mobile.png`
8. `settings-mobile.png`
9. `weak-words-mobile.png`
10. `dictation-mobile.png`

详细分项见本目录的七个 JSON 审计文件；范围决策见仓库根目录的 `V1_5_PRODUCT_QUALITY_AUDIT.md` 与 `V1_5_SCOPE_PROPOSAL.md`。

## Planning disposition

当前无已确认的 production P0，也没有发现 v1.4.1 release identity 或 main baseline 异常。最终 Scope Decision 已固定为 `P2-ONLY QUALITY HARDENING`：

- `P1-CAND-001 Learning-surface reading contract`：`REJECTED_THIS_RELEASE`，不进入本 release。
- Approved Product P2：`P2-TYPO-001` 与 `P2-A11Y-001`。
- Approved QA P2：`P3-COVERAGE-001`，仅限 isolated、deterministic、test-only、resettable fixtures、screenshots 与 visual regression。
- Safari true browser/page zoom：跨平台 QA backlog；Windows 上 `NOT_AVAILABLE`。Windows raw-file hash normalization：separate tooling backlog。
- 本轮不开始实现；PR 保持 OPEN，等待最终用户确认。
