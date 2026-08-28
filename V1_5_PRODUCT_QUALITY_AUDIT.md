# CET6 Focus — v1.5 Product Quality Audit

审计日期：2026-08-28
基线：v1.4.1 frozen release / `main` at `574bee5b1b61ea48b77032b946bcd570f1b4df85`
分支：`planning/v1.5-product-quality-audit`

## Audit boundary

本轮是 v1.5 Phase 0：Product Quality Audit & Scope Definition。它不是 v1.5 实现轮次。所有观察来自最新 `main` 的本地隔离 Chromium 会话、真实页面截图、DOM/布局测量与现有 release evidence；没有修改 `src/**`、`public/**`、CSS、Motion、Study、FSRS、Context、DB、PWA 或 release history。

v1.4.1 release identity 已记录在 [audit/v1.5-planning/release-baseline.json](audit/v1.5-planning/release-baseline.json)，包括 PR #5 merge SHA、release evidence commit、annotated tag object、tag target、PWA shell-v7、词库数量与 Context provenance。当前起点与远端 `main` 一致。

## What is already good

### 1. Home remains quiet and task-oriented

Home 的第一视觉是本地摄影背景与一个 featured word，之后才是 Learn / Review 两个主入口和安静的底部导航。390×844 与 1440×900 均没有横向溢出；移动端标题实测约 42.9px，桌面端约 72px。这个层级支持“打开后知道下一步”，不应被下一轮改成 dashboard。

证据：[home-mobile.png](audit/v1.5-planning/screenshots/home-mobile.png)、[home-desktop.png](audit/v1.5-planning/screenshots/home-desktop.png)。

### 2. Study 的真实节奏保持清楚

Study recall 把进度、单词/发音、回忆提示和三种判断操作放在同一 task frame 内；随后可进入语境、核心词义和扩展理解。recall 判断按钮为 112×74px，detail 的继续按钮为 350×48px，390px 视口没有横向溢出。没有证据支持重做 Study 信息架构。

证据：[study-recall-mobile.png](audit/v1.5-planning/screenshots/study-recall-mobile.png)、[study-meaning-mobile.png](audit/v1.5-planning/screenshots/study-meaning-mobile.png)、[study-detail-mobile.png](audit/v1.5-planning/screenshots/study-detail-mobile.png)。

### 3. 内容型页面的共同骨架稳定

Vocabulary、Word Detail、Settings、Weak Words 和 Dictation 共享 eyebrow / title / description / content 的页面骨架。390px 页面内容框实测为 366px；PageHeader 的 margin-bottom 为 24px、内部 gap 为 17px。Word Detail 把词义、定义、例句与学习状态分开；Settings 按学习节奏、发音/动效、主题/背景、数据备份和重置分组。

证据：[vocabulary-mobile.png](audit/v1.5-planning/screenshots/vocabulary-mobile.png)、[word-detail-mobile.png](audit/v1.5-planning/screenshots/word-detail-mobile.png)、[settings-mobile.png](audit/v1.5-planning/screenshots/settings-mobile.png)。

### 4. 首次使用空状态是可行动的

Weak Words 说明它由 Again、拼写错误、重学状态和重点标记驱动；Dictation 明确显示“先学习，再听写”并提供“去学习”入口。空状态没有被误报成流程缺失。

证据：[weak-words-mobile.png](audit/v1.5-planning/screenshots/weak-words-mobile.png)、[dictation-mobile.png](audit/v1.5-planning/screenshots/dictation-mobile.png)。

### 5. 基线质量与数据事实保持可追溯

本地验证结果：

- `pnpm vocab:validate` PASS：2,219 条 CET-6 词条，missingMeaning=0，missingDefinition=0，provenance=100%；Approved Context 990 / 2,219 = 44.6%，按既定策略为 informational only。
- `pnpm typecheck` PASS。
- `pnpm lint` PASS。
- `pnpm test` PASS：14 个 test files、34 个 tests。
- 本次隔离页面采集 10 张截图、20 个页面状态、7 个 Study 响应式尺寸；console error、page error、failed request 均为 0。
- 开发构建有既有的 `motion() is deprecated. Use motion.create()` console warning，Reduced Motion context 还有 Motion 的 informational warning；没有 console error，也没有因此改动 Motion Engine。
- v1.4.1 已有 Motion、WebKit、PWA、Offline、Reduced Motion、Forced Colors、Safe Area、Study/FSRS/Undo/Dictation release gates 作为发布基线保留；本轮不把 planning DOM smoke test 冒充新的 release gate。

## What should not change

以下系统在 v1.5 Scope review 前保持冻结：

- Motion Engine 与现有 Immediate / Continuous / Interruptible / Velocity-aware / Quiet 行为
- PhysicalSheet 及其 velocity handoff
- FSRS 调度、Study state machine、Undo 与学习事务
- Context data、例句语义审核与 provenance
- Vocabulary 2,219 条静态数据与数据来源策略
- DB schema、IndexedDB 本地优先模型与备份行为
- PWA shell-v7、Offline 资源、背景资源与路由行为
- v1.4.1 release history、tag 与已发布线上内容

明确拒绝把 v1.5 kickoff 变成：Home/Study 全面重做、背景替换、Liquid Glass 换皮、Motion 重写、Router/DB/FSRS 改造、Context 重新生成、加后端/账号/云同步/AI。

## What actually needs work

### P2 — Audio label ≈11px

这是交接文档已接受的 typography backlog：Study 的 AudioButton 在本次实测为 11px，Word Detail 的次级音频控件为 10px。它没有造成已确认的 production P0，也不应为了“新版本”被升级成大规模 UI 调整。

建议下一轮只审阅一个小范围 typography token：Audio label、kicker、metadata、chip、secondary/nav label 是否需要 12–13px 的一致下限，并用真实 WebKit、对比度、长文案和 200% 浏览器缩放验证。详细记录见 [typography-audit.json](audit/v1.5-planning/typography-audit.json)。

### P2 — Hidden import input 的语义命名

Settings 中可见的“导入 JSON 备份”按钮有明确名称并负责触发文件选择；但隐藏的 1×1 file input 本身没有独立 accessible name。它是一个屏幕阅读器语义 hardening item，不是当前可见用户流程的 P0。下一轮可在不改变 DB/backup 行为的前提下，为 input 增加名称，或明确将其从 accessibility tree 隐藏，并补真实 file-picker/屏幕阅读器验证。

### P2 — 真实浏览器缩放验证

自动化 `document.documentElement.style.zoom = 2` 在 Study 上报出 390px 视口内 640px `scrollWidth`。这只是 CSS stress signal，不等价于 Chromium/Browser 的真实 page zoom，不能直接作为产品缺陷或 WCAG 结论。下一轮先用真实浏览器缩放与 WebKit/iOS 验证，只有重现真实用户问题才考虑窄范围换行/布局调整。

### P2 — Windows 审计工具的 raw-file hash 一致性

一次早期 Windows deterministic example-quality invocation 曾在换行规范化阶段观察到 raw-file hash drift；同一未改动树随即以 14/14 files、34/34 tests PASS 重跑。它是跨平台测试工具的可重复性观察，不是产品回归，也不在本轮改动。

### P3 — 审计 fixture 覆盖面

本轮按交接要求截图了 Weak Words 与 Dictation 的首次使用空状态。未来可以增加隔离的非空 fixture，覆盖已学习词、拼写错误和薄弱词队列，但不能把测试 fixture 写入用户运行时数据，也不应因此修改 FSRS 或 DB。

## Priority and expected user benefit

| Priority | Candidate | Expected user benefit | Risk |
| --- | --- | --- | --- |
| P0 | None confirmed | 无需紧急修复 | 不应人为制造 P0 |
| P1 candidate, held | Learning-surface reading contract | 若真实用户确认支持性文字竞争注意力，可降低重复学习时的认知摩擦 | 没有用户证据时容易变成不必要的 Study 重做 |
| P2 | Audio label ≈11px + small-label consistency | 提升二级文字扫描与跨页面一致性 | 放大过度会破坏安静层级并引入换行 |
| P2 | Hidden import input name | 改善屏幕阅读器控制树可理解性 | 隐藏控件语义改变需回归文件导入 |
| P2 | Real browser zoom validation | 在真实缩放环境下发现布局问题，而不是误修合成信号 | 把 CSS stress signal 当缺陷会造成布局 churn |
| P2 | Windows raw-file hash normalization | 降低 CI/本地 deterministic audit 噪声 | 改动 fixture bytes 可能掩盖 provenance |
| P3 | Non-empty audit fixtures | 扩大未来审计覆盖 | fixture 过度依赖实现细节会脆弱 |

## Recommended v1.5 scope

建议 Scope review 从 **0 个已确认 P1 + 2–3 个窄 P2 hardening item** 开始：

1. Typography token consistency：以 `Audio label ≈11px` 为锚点，审阅小标签/metadata/kicker/chip 的最小字号与 line-height。
2. Hidden file-input accessibility semantics：只改语义表达，不改变导入与备份行为。
3. Real browser zoom validation：先补真实 Chromium/WebKit 验证；只有复现后才批准对应的最小布局修补。

Windows hash normalization 可作为独立 QA P2，P3 fixture 作为可选项。`P1-CAND-001` 只有在下一轮语义/用户验证产生明确证据后才可晋级。最终 scope 不超过 1 个经批准的 P1；不做全站视觉重构。

具体候选、likely files、冻结系统、测试计划与风险见 [audit/v1.5-planning/scope-candidates.json](audit/v1.5-planning/scope-candidates.json) 与 [V1_5_SCOPE_PROPOSAL.md](V1_5_SCOPE_PROPOSAL.md)。

## Final status

**PASS — v1.5 Phase 0 audit and scope definition complete.**

无 production P0；没有触发 v1.4.1 release identity、main baseline、FSRS、Context data、Motion Engine 或 DB Stop Condition。此 PR 仅包含审计/截图/范围文档，保持 OPEN；不合并、不部署、不创建 v1.5 tag 或 GitHub Release。下一步等待 Scope review，不开始 v1.5 实现。
