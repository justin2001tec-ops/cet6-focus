# CET6 Focus — v1.5 Scope Proposal

状态：Planning only；等待 Scope review
基线：v1.4.1 frozen / `main` = `574bee5b1b61ea48b77032b946bcd570f1b4df85`
分支：`planning/v1.5-product-quality-audit`

本提案只定义下一阶段的候选范围，不授权本轮实现。完整排序见 [audit/v1.5-planning/scope-candidates.json](audit/v1.5-planning/scope-candidates.json)。

## Scope principles

- v1.4.1 已正式冻结；没有生产 P0 就不创建 v1.4.1 R2/hotfix/polish。
- `Audio label ≈11px` 按交接约束保持 P2，不能为了填满 P1 而重新分级。
- 任何候选 priority 都不是实现授权；必须在 Scope review 后另开实现轮。
- v1.5 推荐最多 1 个经批准的 P1，配合相关 P2；本提案当前确认的 P1 数为 0。
- Motion Engine、PhysicalSheet、FSRS、Context data、Vocabulary、Study state machine、DB、PWA shell-v7、路由和 release history 全部冻结。

## Candidate P1 — held, not accepted

### P1-CAND-001: Learning-surface reading contract

**Problem**：Study 在 recall、core meaning、detail 之间切换；当前语义顺序清楚，但字号/支持性标签的跨状态关系没有形成一份可执行的阅读 contract。

**Evidence**：Study 三状态截图与测量显示：recall h1 约 42.9px / kicker 11px；meaning/detail h1 约 35.1px / kicker 12px；Audio label 约 11px；三状态均无横向溢出。

**User impact**：只有真实用户报告支持性文字竞争主要单词、释义或回忆动作时，才有可能产生足够影响进入 P1。

**Proposed direction**：定义一个局部的 learning presentation token contract，明确主词、释义、例句、kicker、音频标签的相对层级；不改变 Study state machine、Motion、FSRS 或 Context。

**Likely files**：未来可能涉及 learning presentation styles/components、针对性 readability tests、截图/a11y fixtures；本轮不触碰。

**Frozen systems**：Motion Engine、PhysicalSheet、FSRS、Context data、Study state machine、DB、PWA shell-v7。

**Test plan**：真实 WebKit/iOS、真实 Chromium 200% page zoom、Reduced Motion、contrast、长单词/长例句、serial E2E 与语义用户 review。

**Risk**：没有用户证据时，所谓“reading contract”很容易变成全站视觉重做。

**Decision**：HOLD。除非下一轮 Scope review 提供明确语义/用户证据，否则不计入 v1.5 approved P1。

## Recommended P2 package

### P2-TYPO-001 — Audio label ≈11px + small-label consistency

- **Problem**：Study AudioButton 为 11px；Word Detail 对应控件为 10px；kicker、metadata、small hint 分布在约 10–13px。
- **Evidence**：`typography-audit.json` 与 Study/Word Detail 截图。
- **User impact**：二级文字在重复学习时可能不够容易扫读。
- **Direction**：只审阅少数 typography token；若测试支持，再做窄范围调整，不重排页面。
- **Likely files**：focused typography styles 与 focused visual regression tests。
- **Frozen**：Motion、FSRS、Context、Study state machine、PWA shell-v7。
- **Test plan**：WebKit、真实 200% zoom、contrast、长文案、Reduced Motion。
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

### P2-RESP-001 — Real browser zoom validation

- **Problem**：CSS `zoom: 2` stress signal 报告横向宽度 640px，但这不是浏览器 page zoom。
- **Evidence**：responsive audit；正常 390/430/844/852/1112/1440/1920 测试均无横向溢出。
- **User impact**：真实缩放影响目前未知，必须先验证。
- **Direction**：先建立真实 Chromium/WebKit zoom evidence；只有复现真实用户问题才允许最小布局修补。
- **Likely files**：browser QA fixture；是否改产品 CSS 取决于验证结果。
- **Frozen**：Motion、Study state machine、PWA shell-v7。
- **Test plan**：真实 200% Chromium、WebKit/iOS、keyboard、long-word fixture。
- **Risk**：误把合成信号当缺陷会引入不必要布局 churn。

## Optional / separate backlog

### P2-QA-001 — Windows raw-file hash normalization

现象是一次 Windows deterministic artifact invocation 的 raw line-ending hash drift，随后同一未改动树重跑 14/14 files、34/34 tests PASS。它应作为测试工具与 CI 策略单独评审，不能混入产品 UI PR，也不改变任何产品数据或 provenance。

### P3-COVERAGE-001 — Non-empty audit fixtures

本轮截图按要求记录 Weak Words 与 Dictation 的 first-use empty state。未来可在隔离 context 中增加已学习词、拼写错误与薄弱词样例，以扩大截图覆盖；不得写入用户运行时数据库，也不得通过 fixture 改写 FSRS 结论。

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

## Recommended scope decision

**当前建议：批准 0 个 P1、先评审 3 个窄 P2（Typography、hidden input semantics、real browser zoom validation），P2-QA-001 作为独立工具 backlog，P3 fixture optional。**

如果 Scope review 认为 learning-surface reading contract 有明确用户证据，最多把它作为唯一 P1 加入；仍需保持所有冻结系统不变，并为该 P1 建立独立测试计划。否则 v1.5 以小范围质量 hardening 为主，不做“为了新版本而全站改造”。

## Delivery boundary

本轮仅提交审计与提案，PR 保持 OPEN；不合并、不部署、不创建 v1.5 tag、不创建 GitHub Release。等待用户/评审批准 scope 后，再启动单独的 v1.5 实现任务。
