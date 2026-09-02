# CET6 Focus — v1.5 Scope Proposal

状态：Scope Finalized；等待最终用户确认
基线：v1.4.1 frozen / `main` = `574bee5b1b61ea48b77032b946bcd570f1b4df85`
分支：`planning/v1.5-product-quality-audit`

本提案已固化 v1.5 Phase 0 的最终 Scope Decision，但不授权本轮实现。完整排序见 [audit/v1.5-planning/scope-candidates.json](audit/v1.5-planning/scope-candidates.json)。

## Scope principles

- v1.4.1 已正式冻结；没有生产 P0 就不创建 v1.4.1 R2/hotfix/polish。
- `Audio label ≈11px` 按交接约束保持 P2，不能为了填满 P1 而重新分级。
- 最终 Approved P1 = 0；不再保留任何未决 P1 候选。任何未来真实用户问题必须重新开独立 proposal。
- 最终 Approved Product P2 = 2，Approved QA P2 = 1；本轮不开始实现，下一阶段必须另开实现轮。
- Motion Engine、PhysicalSheet、FSRS、Context data、Vocabulary、Study state machine、DB、PWA shell-v7、路由和 release history 全部冻结。

## Rejected candidate — P1-CAND-001

### P1-CAND-001: Learning-surface reading contract

**Problem**：Study 在 recall、core meaning、detail 之间切换；当前语义顺序清楚，但字号/支持性标签的跨状态关系没有形成一份可执行的阅读 contract。

**Evidence**：Study 三状态截图与测量显示：recall h1 约 42.9px / kicker 11px；meaning/detail h1 约 35.1px / kicker 12px；Audio label 约 11px；三状态均无横向溢出。

**User impact**：当前没有真实用户证据证明支持性文字竞争主要单词、释义或回忆动作。

**Proposed direction**：本 release 不推进 learning presentation contract；如果未来出现真实用户证据，重新开独立 proposal，不从本 PR 直接晋级。

**Likely files**：未来可能涉及 learning presentation styles/components、针对性 readability tests、截图/a11y fixtures；本轮不触碰。

**Frozen systems**：Motion Engine、PhysicalSheet、FSRS、Context data、Study state machine、DB、PWA shell-v7。

**Test plan**：无 v1.5 实现计划；未来独立 proposal 若重新提出，再定义语义用户 review 与相关 gate。

**Risk**：没有用户证据时，所谓“reading contract”很容易变成全站视觉重做。

**Decision**：`REJECTED_THIS_RELEASE`。当前 Study Recall / Meaning / Detail 层级清楚，没有严重可读性或横向溢出问题；继续推进会带来不必要的 Study redesign 风险。v1.5 Approved P1 = 0。

## Approved Product P2 package

### P2-TYPO-001 — Audio label ≈11px + small-label consistency

- **Problem**：Study AudioButton 为 11px；Word Detail 对应控件为 10px；kicker、metadata、small hint 分布在约 10–13px。
- **Evidence**：`typography-audit.json` 与 Study/Word Detail 截图。
- **User impact**：二级文字在重复学习时可能不够容易扫读。
- **Direction**：只审阅 Audio label 与承担实际操作语义且明显低于 12px 的 actionable labels；若测试支持，再做窄范围调整，不重排页面。
- **Likely files**：focused typography styles 与 focused visual regression tests。
- **Frozen**：Motion、FSRS、Context、Study state machine、PWA shell-v7。
- **Test plan**：WebKit、contrast、长文案、Reduced Motion；Chromium 200% browser zoom 已由 v1.4.1 release evidence 关闭。
- **Risk**：字号增大可能削弱 quiet hierarchy 或导致换行。

### P2-A11Y-001 — Hidden import input accessible name

- **Problem**：Settings 的隐藏 file input 没有独立 accessible name；可见的导入按钮本身有名称并能触发流程。
- **Evidence**：Settings DOM/accessible-name 审计；隐藏 input 为 1×1。
- **User impact**：屏幕阅读器用户可能在控制树中遇到 unnamed file control。
- **Direction**：增加显式 accessible name，或明确从 tree 隐藏；不改变现有导入、自动备份和恢复逻辑。
- **Likely files**：Settings input markup 与 focused accessibility test。
- **Frozen**：DB/backup behavior、PWA shell-v7。
- **Test plan**：axe/manual tree review、keyboard、file-picker trigger、WebKit。
- **Risk**：错误改变隐藏语义可能影响可见按钮触发。

- **Disposition**：`APPROVED_FOR_V1_5`。在 accessibility tree 中只保留一个清楚的 import 语义入口；选择 Path A 或 Path B，但 import/backup/restore/file-picker trigger/DB behavior 全部冻结。

## Backlog-only dispositions

### P2-RESP-001 — Real browser zoom validation

- **Problem**：CSS `zoom: 2` stress signal 报告横向宽度 640px，但这不是浏览器 page zoom。
- **Evidence**：responsive audit；正常 390/430/844/852/1112/1440/1920 测试均无横向溢出。
- **User impact**：v1.4.1 已有 True Chromium Browser Zoom = 200% PASS；Safari true browser/page zoom 在 Windows 上 NOT_AVAILABLE。
- **Direction**：从 v1.5 Product Scope 移出；只保留 Safari cross-platform QA backlog。
- **Likely files**：未来 Safari cross-platform QA fixture only，不进入本次产品实现。
- **Frozen**：Motion、Study state machine、PWA shell-v7。
- **Test plan**：macOS/Safari 可用时验证 Safari true browser/page zoom。
- **Risk**：误把合成信号当缺陷会引入不必要布局 churn。
- **Disposition**：`CLOSED_FOR_CHROMIUM` / `CROSS_PLATFORM_QA_BACKLOG_FOR_SAFARI`；不进入 v1.5 Product Scope。

## Approved QA P2 and separate tooling backlog

### P2-QA-001 — Windows raw-file hash normalization

现象是一次 Windows deterministic artifact invocation 的 raw line-ending hash drift，随后同一未改动树重跑 14/14 files、34/34 tests PASS。它保持 `SEPARATE_TOOLING_BACKLOG`，不能混入产品 UI PR，也不改变任何产品数据或 provenance。

### P3-COVERAGE-001 — Non-empty Weak Words / Dictation fixtures（QA P2）

本轮截图按要求记录 Weak Words 与 Dictation 的 first-use empty state。批准在 v1.5 QA 范围中增加非空内容，但严格限定为 isolated、deterministic、test-only、resettable fixtures、screenshots 与 visual regression；不得写入用户运行时数据库，也不得改 IndexedDB 默认数据、FSRS、ReviewLog、Context 或用户 runtime seed。

**Disposition**：`APPROVED_FOR_V1_5_QA`；priority 固化为 `P2_QA`。

## Explicitly rejected scope

本提案不包含：

- Home / Study 全面重做或信息架构重排
- 更换摄影背景、扩充背景池或让背景成为内容主体
- 以 Liquid Glass 换皮作为版本目标
- Motion Engine、PhysicalSheet、Shared Layout 或 velocity 行为重写
- Router、DB schema、FSRS、Study state machine 改造
- Context data 重新生成、为覆盖率自动 curate 或替换语义审核
- Vocabulary 数据扩张
- PWA shell-v7、Offline 资源、部署链路改造
- 后端、账号、云同步、AI

## Final scope decision

**FINAL SCOPE DECISION: P2-ONLY QUALITY HARDENING**

```text
Approved P1 = 0
Approved Product P2 = 2
Approved QA P2 = 1
```

Approved Product P2：`P2-TYPO-001`、`P2-A11Y-001`。Approved QA P2：`P3-COVERAGE-001`。Rejected：`P1-CAND-001 Learning-surface reading contract`。Backlog only：Safari true browser/page zoom、Windows raw-file hash normalization。

本决策已结束 P1 犹豫；不再保留未决 P1 表述。

## Delivery boundary

本轮仅提交审计与最终 Scope Decision，PR 保持 OPEN；不合并、不部署、不创建 v1.5 tag、不创建 GitHub Release、不开始 implementation。等待最终用户确认后，才从 latest `main` 创建 `product/v1.5-quality-hardening`；禁止在 planning branch 上写产品代码。
