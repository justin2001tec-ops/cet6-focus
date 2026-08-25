# Lula 的最终回复 — v1.3 Final Holdout Validation

Round 5 的 Context 语义工作已完成，但其最终 `100/100` retest 使用了 `priorBlindPassPairs`，不属于真正独立 holdout。本轮按 Handoff 冻结当前 release candidate，只计算 unseen eligibility，不再训练数据。

- Phase A 最终：300/300 PASS，严重不适宜 0。
- Mandatory 11：11 条全部按逐句审核结果 durable reject。
- Round 5 blind final retest：100/100 PASS，严重不适宜 0；现保留为历史 retest 证据，不作为独立 holdout 证据。
- Durable curation：30 条 global reject、877 条 pair reject；本轮新增 350 条 pair reject。
- 最终 Context coverage：990/2219 = 44.6%；按 Round 5 规则仅 informational，不构成 blocker；raw candidate coverage 70.4%。
- Source：offline Tatoeba English CC0；没有手写、AI 生成或替代例句。
- 所有真实 FAIL 都保留逐句 rationale、durable reject、重建并复测；没有为了追求 100% 改审核结论。

本轮最终 gate 全部通过：vocab build/validate、typecheck、lint、unit tests（34/34）、production build、serial E2E（32 passed，16 个既有配置性 skip）、审核截图，以及 UI/Motion/FSRS 冻结范围检查。

## Final Holdout 结果

- Historical seen sentence IDs：1542。
- 当前冻结 selected：990/990 均已出现在历史 candidate/review artifacts，包括 blind attempts 1–15 的全部 PASS 和 FAIL。
- 真正 unseen selected：0。
- 路径：**C — `HOLDOUT_EXHAUSTED`**。
- Holdout sample：0；没有开始语义审核，也没有复用历史 PASS、换 seed、重抽、curate 或 rebuild。
- selected examples 与 `context-curation.json` 的前后 hash 完全一致，post-holdout data mutation = false。

因此本轮结果原样提交为 `HOLDOUT_EXHAUSTED`，不伪装成 PASS/FAIL，等待最终 Merge & Release 决策。完整证据见 [`audit/v1.3-final-holdout/final-holdout-acceptance.json`](audit/v1.3-final-holdout/final-holdout-acceptance.json)。

## GitHub

- 仓库：[https://github.com/justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)
- PR #3：[https://github.com/justin2001tec-ops/cet6-focus/pull/3](https://github.com/justin2001tec-ops/cet6-focus/pull/3)
- PR #3 当前保持 OPEN、未合并。

本轮未部署、未创建 `v1.3.0` tag，因此没有新的线上地址可提供。完整报告见 [`FINAL_V1_3_CORE_LEARNING_REPORT.md`](FINAL_V1_3_CORE_LEARNING_REPORT.md)，机器可读最终 Holdout 验收见 [`audit/v1.3-final-holdout/final-holdout-acceptance.json`](audit/v1.3-final-holdout/final-holdout-acceptance.json)。
