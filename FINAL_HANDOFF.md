# CET6 Focus Release Candidate Final Handoff

日期：2026-08-22

## 当前状态

CET6 Focus 已完成 RC final polish、自检、测试、GitHub 发布和 GitHub Pages 部署，可进入第三方正式验收。没有新增账号、云同步、后端或其他超出范围的产品功能。

**CET6 Focus Release Candidate Ready for third independent audit.**

本轮重点收尾：拼写 Weak 30 天衰减、Dictation `lastDictationAt` 确定性轮换、`finishSession` 幂等、Word Detail “进入学习”文案与导航、当前 RC 截图归档/重生成，以及 GitHub/CI 准备。

最终交付入口：

- GitHub：[justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)
- 在线网站：[https://justin2001tec-ops.github.io/cet6-focus/](https://justin2001tec-ops.github.io/cet6-focus/)
- 部署证据：`FINAL_DEPLOYMENT_REPORT.md`

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
- E2E：最终本地运行 22 tests 中 12 passed、10 个按桌面/移动项目边界 skipped；无失败；新增 Dictation rotation、Word Detail 两组用例在 Chromium/Pixel 5 均通过。真实线上 smoke 另见 `FINAL_DEPLOYMENT_REPORT.md`。
- `typecheck`、`lint`、`build`：全部通过。
- Production preview offline：Chromium 与 Pixel 5 各通过 1 项。

详细证据和已知限制见 `FINAL_RC_REPORT.md`。

## 交付说明

项目已连接公开 GitHub remote 并部署到 GitHub Pages。已加入 `.gitignore`、`packageManager`、quality 工作流和 Pages 工作流；正式交付以 GitHub 仓库、在线网站和 `FINAL_DEPLOYMENT_REPORT.md` 为准。由于仓库和在线地址均可用，本次不重复上传 ZIP。
