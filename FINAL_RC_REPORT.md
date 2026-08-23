# CET6 Focus Release Candidate Report

日期：2026-08-22
范围：按 `CET6_Focus_RC_Final_Polish_Handoff.md` 完成本轮最终 RC polish、自检、回归测试、截图和交付准备。没有新增产品方向，也没有扩大需求范围。

## RC 结论

**CET6 Focus Release Candidate Ready for third independent audit.**

本 RC 已完成交接单列出的 P1/P2 收尾项，具备交给第三方进行代码和实际行为验收的条件。项目仍是 local-first 应用：学习数据保存在浏览器 IndexedDB，不依赖账号、后端或运行时图库热链。

## 本轮完成项

### P1-1：拼写错误 Weak 衰减与统一信号

- `src/lib/weak.ts` 新增 `getSpellingWeakSignal()`，采用 30 天线性衰减：新错误权重最高，达到窗口后不再单独维持 Weak。
- `spellingWrongCount` 和 `lastSpellingAt` 仍保留，历史不被删除；旧错误只是不再永久等价于当前 Weak。
- Dashboard summary、Dashboard 优先队列、Mistakes、Vocabulary、Weak queue 和 Stats 都继续经过同一 `getWeakWordSignal/getWeakWordSignals` 服务计算。
- 覆盖测试：近期错误进入 Weak；60 天前的 5 次错误在稳定卡片上不会仅凭历史计数保持 Weak；新错误重新进入；同一信号集合可供 Dashboard/Mistakes/queue/Stats 使用。

### P1-2：Dictation 轮换与字段兼容

- `LearningCard` 新增可选 `lastDictationAt?: string`，旧 IndexedDB 卡片和旧 JSON 备份无需迁移即可继续读取。
- 每次听写尝试都会更新词卡：首次正确、首次错误、纠正完成都写入 `lastDictationAt`；错误仍同时更新 `spellingWrongCount/lastSpellingAt`。
- 候选排序固定为：当前拼写 Weak 信号 → 从未听写 → 最久未听写 → `wordId` 稳定 tie-break。候选仍排除 New 卡片。
- Dictation 不写 ReviewLog，也不修改 FSRS 调度字段；已有 FSRS/ReviewLog 隔离测试继续通过。
- 增加单测与 Chromium/Pixel 5 E2E：完成 10 词批次后，未听写的下一批优先出现；近期拼写 Weak 可压过单纯的听写时间排序。

### P2：会话幂等、Word Detail 文案、背景和发布准备

- `finishSession()` 改为事务内只在 `endedAt` 缺失时完成会话；组件卸载清理再次调用不会覆盖第一次 `endedAt/durationMs`。
- `WordDetail` 按钮从“放入学习队列”改为“进入学习”，并用 E2E 验证点击后实际进入 `/study`。
- 已目视复核 `study-05`、`study-09`；两者在当前高遮罩下文字可读、视觉刺激可接受，不需要替换。10 组背景仍全部保留本地 AVIF/WebP。
- 查询路径复核：ReviewLog/Sessions 使用现有时间索引；Dictation/Weak 当前对约 2,219 张卡做一次本地候选计算，规模与 local-first 目标匹配，未做会增加风险的过度优化。
- 保留 `vite.config.ts` 的 `sourcemap: true` 作为 RC 调试证据；正式部署如需减小静态发布体积，可作为部署侧 P2 决定关闭。
- 新增 `.gitignore`，排除 `node_modules/dist/.env/test-results` 等本地产物；新增 `.github/workflows/quality.yml`，覆盖词库校验、typecheck、lint、unit test 和 build。

## Schema、迁移与备份边界

- `lastDictationAt` 为可选字段，不需要提高 Dexie schema version；新增卡片不写入该字段，旧卡片读取为 `undefined`。
- 备份校验接受有或没有 `lastDictationAt` 的卡片，并拒绝无效日期；已有 `lastSpellingAt` 兼容规则保持不变。
- 现有增量 vocabulary reconciliation 不清空学习卡、ReviewLog 或 Session；本轮没有改变该迁移边界。

## 质量门禁

以下结果均来自本轮最终代码：

| 门禁 | 结果 |
| --- | --- |
| `pnpm vocab:validate` | PASS — 2,219 unique CET-6 entries；`missingMeaning=0`、`missingDefinition=0`、`missingPhonetic=2`、`missingPos=177` |
| `pnpm typecheck` | PASS — `tsc -b --pretty false` |
| `pnpm lint` | PASS — `eslint .` |
| `pnpm test` | PASS — 10 test files、23 tests |
| `pnpm build` | PASS — Vite 8.2.2、1,605 modules transformed；source maps retained |
| `CET6_PREVIEW_URL=http://127.0.0.1:4177 pnpm test:e2e --workers=1` | PASS — 22 tests：14 passed、8 intentional skipped |

E2E 通过项包括：

- 生产 preview 预热缓存后的离线 reload：Chromium、Pixel 5 各通过 1 项。
- Today Review → Study → Dictation → Completion 真实链路。
- 最后一张 Study 卡完成态 Undo。
- 听写错误/纠正不修改 FSRS 或 ReviewLog。
- New 卡不进入听写候选。
- 新增听写时间戳与批次轮换：Chromium、Pixel 5 均通过。
- 词库迁移保留学习字段并只修复缺失卡。
- 备份导出 → RESET → 导入 → reload 后字段恢复。
- 固定背景 reload 持久化。
- Word Detail “进入学习”文案与实际导航：Chromium、Pixel 5 均通过。
- Pixel 5 无横向溢出。

8 个 skipped 是现有测试的项目边界：7 个完整流程只在 Chromium 桌面执行，移动项目执行专门的移动检查；移动专属横向溢出检查不在 Chromium 项目重复执行。没有失败用例。

单测和 Playwright 使用了项目范围的受控本地权限，因为当前沙箱会阻断 Vitest/esbuild 子进程读取配置目录；这是执行环境说明，不是产品失败。

## 截图证据

当前 RC 截图由最终 `dist` 预览生成，位于 `audit/screenshots/`：

- `dashboard-desktop.png`
- `today-review-desktop.png`
- `study-desktop.png`
- `dictation-desktop.png`
- `mistakes-desktop.png`
- `stats-desktop.png`
- `settings-desktop.png`
- `dashboard-mobile-375.png`
- `study-mobile-375.png`
- `dictation-mobile-375.png`

上一轮 JPG 截图已移至 `audit/screenshots/archive/`，没有混入当前 RC 截图命名空间。可重复生成脚本为 `scripts/capture-rc-screenshots.mjs`。

## 交付状态与边界

- 本报告记录的是 2026-08-22 RC freeze 快照；授权 GitHub 发布和线上部署已在其后完成，当前入口与证据以 `FINAL_DEPLOYMENT_REPORT.md` 为准。
- 当前公开仓库为 `https://github.com/justin2001tec-ops/cet6-focus`，在线地址为 `https://justin2001tec-ops.github.io/cet6-focus/`。
- 由于仓库和在线地址均已可用，本次不重复上传 ZIP；完整源码、词库、测试、审计文本和截图均在仓库中。
- 离线门禁验证的是“在线预热应用壳后离线 reload”，不是首次冷启动完全断网。
- 词库仍有 2 条缺音标、177 条缺词性，属于校验报告中的源数据可选字段；没有在应用中伪造补齐。
- Web Speech API 的声音可用性依赖验收机器的浏览器和操作系统。

## 验收运行方式

```bash
pnpm install
pnpm vocab:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

正式验收请以代码、IndexedDB、ReviewLog、StudySession、FSRS 卡片和实际浏览器行为为准；本报告只提供可复跑的证据索引。
