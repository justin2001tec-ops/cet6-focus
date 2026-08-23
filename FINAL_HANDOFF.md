# CET6 Focus Release Candidate Final Handoff

日期：2026-08-22

## 当前状态

CET6 Focus 已完成 RC final polish、自检、测试和交付准备，可进入第三方正式验收。没有新增账号、云同步、后端或其他超出范围的产品功能。

**CET6 Focus Release Candidate Ready for third independent audit.**

本轮重点收尾：拼写 Weak 30 天衰减、Dictation `lastDictationAt` 确定性轮换、`finishSession` 幂等、Word Detail “进入学习”文案与导航、当前 RC 截图归档/重生成，以及 GitHub/CI 准备。

## 重点验收入口

- `/`：真实 Dashboard 和今日入口。
- `/today`：Review → Study → Dictation → Completion 真实链路。
- `/review`、`/study`、`/dictation`：独立学习路由。
- `/mistakes`、`/stats`、`/settings`：统一 Weak 派生、分离 Review/Dictation 统计、备份恢复和背景设置。

## 关键实现文件

- `src/db/db.ts`：Dexie schema、增量迁移、队列、事务、Undo、session 和听写记录。
- `src/lib/migration.ts`：版本化词库 reconciliation。
- `src/lib/weak.ts`：统一薄弱词信号。
- `src/lib/dictation.ts`：拼写 Weak 优先、未听写优先、最久未听写优先的确定性轮换。
- `src/lib/sessions.ts`：幂等会话完成纯函数。
- `src/lib/stats.ts`：Review/Dictation 统计分离。
- `src/features/today/TodayFlow.tsx`：Today 状态机。
- `src/features/study/Study.tsx`：FSRS 评分与最终卡 Undo。
- `src/features/dictation/Dictation.tsx`：已接触卡听写与专项计数。
- `src/config/backgrounds.ts`、`public/backgrounds/`、`IMAGE_SOURCES.md`：10 组本地背景及来源。
- `tests/unit/`、`tests/e2e/smoke.spec.ts`：迁移、Weak、统计和真实浏览器回归。

## 验证摘要

- Vocabulary：2,219 条，校验通过。
- Unit：10 files / 23 tests passed。
- E2E：22 tests 中 14 passed、8 个按桌面/移动项目边界 skipped；无失败；新增 Dictation rotation、Word Detail 两组用例在 Chromium/Pixel 5 均通过。
- `typecheck`、`lint`、`build`：全部通过。
- Production preview offline：Chromium 与 Pixel 5 各通过 1 项。

详细证据和已知限制见 `FINAL_RC_REPORT.md`。

## 交付说明

项目没有 `.git` 元数据、没有可用 GitHub remote、没有在线部署地址。已加入 `.gitignore`、`packageManager` 和 `.github/workflows/quality.yml`，可直接交给下一步 GitHub/Deployment 流程。完整项目 ZIP 是本次可交付的外部复制品；ZIP 内含最新 `dist`、当前 RC 截图和报告，不含 `node_modules`、`test-results`、`work`。
