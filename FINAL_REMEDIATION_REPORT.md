# CET6 Focus Max Remediation Final Report

日期：2026-08-22
范围：按 `CET6_Focus_Lula_Max_Remediation_Handoff.md` 完成最终整改、自检、测试和交付准备。本轮没有新增产品方向或扩大需求范围。

## 结论

整改项已完成，项目可以进入正式验收。核心行为以 IndexedDB、ReviewLog、StudySession 和 FSRS 卡片真值为准；报告不把自述当作验收证据。

## 本轮完成的整改

### P0：词库初始化与迁移

- `src/lib/migration.ts` 新增增量 reconciliation：静态词库升级只更新 Word 内容，保留已有卡片对象和学习字段。
- 不再因 `wordCount`、`cardCount` 或 `dataVersion` 不一致清空 `words`、`cards`、`reviewLogs`、`sessions`。
- 新词只创建缺失的新卡；旧词标记 `archived`；孤儿卡和孤儿词保留，备份可带出孤儿词。
- `src/db/db.ts` 在版本变化、卡片缺失或数量不匹配时走事务化增量修复。
- 单元和浏览器测试覆盖：状态保留、个人字段保留、只增新卡、补缺失卡、孤儿卡保留、restore 后 reload。

### P1：Today 真实学习链路

- `src/features/today/TodayFlow.tsx` 实现真实顺序：Review → Study 新词 → Dictation → Completion。
- 保留 `/review`、`/study`、`/dictation` 独立路由；Today 的阶段切换使用独立组件 key，避免 Review 完成状态泄露到 Study 阶段。
- Dashboard 的“开始今日学习”进入 `/today`，不再伪造已完成状态。

### P1：听写隔离与最终卡 Undo

- 听写候选只来自已接触卡片（FSRS 非 New 或 `reps > 0`），没有 New fallback。
- 听写错误只增加 `spellingWrongCount`/`lastSpellingAt` 和听写 session 信号，不写 ReviewLog、不调度 FSRS。
- 听写 session 记录 `attempted/correct/wrong/corrected`，统计使用首次正确率。
- Study 的最后一张卡完成后仍可 Undo；Undo 恢复同一张卡、FSRS before 快照、ReviewLog 和 session 计数。

### P1：薄弱词和统计统一

- `src/lib/weak.ts` 集中计算薄弱信号：重点标记、拼写错误、relearning、近期 Again、近期复习率和低 retrievability。
- 历史上很久以前的 Again 不再永久锁定 Weak；Dashboard、Mistakes、词库和 Stats 使用同一套信号。
- Review 统计与 Dictation 统计分开；Dictation 的纠正次数不伪装成 Review 成功率。
- session 时长按 `endedAt - startedAt` 计算；逐卡 `durationMs` 仅保留在 ReviewLog，不累加污染 session 总时长。

### P1：背景资产

- `public/backgrounds/` 现在包含 10 组本地 AVIF/WebP 资产。
- `src/config/backgrounds.ts` 和 `IMAGE_SOURCES.md` 为每组记录 source URL、作者、许可证、object position 和遮罩配置。
- 固定当前背景会写入 `backgroundId`，reload 后保持同一背景；没有运行时热链。

## 质量门禁

以下命令均在本轮整改后的代码上执行：

| 门禁 | 结果 |
| --- | --- |
| `pnpm vocab:validate` | PASS；2,219 unique entries，`missingMeaning=0`、`missingDefinition=0`、`missingPhonetic=2`、`missingPos=177` |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS；8 个 test files，16 个 tests |
| `pnpm build` | PASS；TypeScript + Vite，1,603 modules transformed |
| `CET6_PREVIEW_URL=http://127.0.0.1:4177 pnpm test:e2e --workers=1` | PASS；18 tests 中 10 passed、8 intentional skipped |

E2E 通过项包括：

- 生产 preview 预热缓存后的离线打开（Chromium、Pixel 5 各 1 项）。
- Today Review → Study → Dictation 完整链路。
- 最后一张卡完成态 Undo。
- 听写错误不改变 FSRS/ReviewLog。
- 未接触词不进入听写。
- 词库版本迁移只补缺失卡并保留学习数据。
- 备份导出 → RESET → 导入 → reload 后字段恢复。
- 固定背景 reload 持久化。
- Pixel 5 移动端无横向溢出。

8 个 skipped 是测试设计边界：7 个完整流程只在 Chromium 桌面执行，移动项目执行专门的移动溢出检查；桌面项目跳过移动专属溢出检查。并非失败。

## 交付边界

- 本报告记录整改完成时的交付边界；其后的授权 GitHub 发布与线上部署见 `FINAL_DEPLOYMENT_REPORT.md`。
- 当前公开仓库为 `https://github.com/justin2001tec-ops/cet6-focus`，在线地址为 `https://justin2001tec-ops.github.io/cet6-focus/`。完整源码、词库、测试和审计材料均在仓库中，本次不重复上传 ZIP。
- 离线门禁验证的是“在线预热应用壳后离线 reload”，不是首次冷启动完全断网。
- 词库中 2 条缺音标、177 条缺词性，属于源数据可选字段，已在校验结果中明确记录，没有伪造。
- Web Speech API 的声音可用性依赖验收机器的浏览器和操作系统。

## 运行方式

```bash
pnpm install
pnpm vocab:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

完整实现说明见 `FINAL_HANDOFF.md`、`README.md` 和 `IMAGE_SOURCES.md`。
