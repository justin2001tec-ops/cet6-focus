# CET6 Focus Final Deployment Report

日期：2026-08-23

## 结论

CET6 Focus 已完成 GitHub 仓库发布、GitHub Pages 部署和真实线上 smoke，可交给第三方进行正式验收。最终部署提交为 `443afcf3889b842575df459428e6f4baf0ae2e0f`。

## 交付入口

- GitHub 仓库：[justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)
- 在线网站：[https://justin2001tec-ops.github.io/cet6-focus/](https://justin2001tec-ops.github.io/cet6-focus/)
- 最终 Pages 工作流：[CI and Deploy Pages #32628087659](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32628087659)
- 最终 quality 工作流：[quality #32628087724](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32628087724)

仓库为公开 `main` 分支，Pages API 状态为 `build_type=workflow`，HTTPS 已启用。因为 GitHub 仓库和在线地址均已可用，本次不再额外上传重复 ZIP。

## 发布链路

- `7c88b95`：初始 Release Candidate 发布提交。
- `efe6c2f`：将两个工作流的 Node.js 版本调整为 22，以匹配 pnpm 11 的运行要求。
- `443afcf`：在本地初始化数据未完成前显示启动页，修复 onboarding 时序竞争；同时将 Service Worker shell cache 从 v2 提升为 v3。
- GitHub Actions 在最终提交上完成词库校验、lint、typecheck、unit test、Pages base 构建、artifact 上传和 Pages 部署。

部署使用 `VITE_PUBLIC_BASE=/cet6-focus/`。应用继续使用 Hash 路由；本地开发保持 `/` base，GitHub Pages 使用 `/cet6-focus/` base。manifest、Service Worker、词库、背景图和动态资源均通过 base-aware 路径加载。

## 最终门禁

- `pnpm vocab:validate`：PASS；2,219 条唯一 CET-6 词条，`missingMeaning=0`、`missingDefinition=0`、`missingPhonetic=2`、`missingPos=177`。
- `pnpm typecheck`：PASS。
- `pnpm lint`：PASS。
- `pnpm test`：PASS；10 个 test files、23 个 tests。
- `pnpm build`：PASS；Vite 8.2.2，1,606 modules transformed。
- 最终本地 `pnpm test:e2e --workers=1`：22 个用例，12 passed、10 个既有项目边界 skipped、0 failed。
- 最终 GitHub Actions quality：PASS。
- 最终 GitHub Actions Pages：PASS，build 与 deploy 均 PASS。

本地 E2E 的 skipped 项是移动/桌面专属流程和未提供 `CET6_PREVIEW_URL` 时的离线 preview 项，不是失败。

## 线上 smoke 结果

使用全新 Playwright Chromium context 访问真实 Pages 地址，结果 PASS：

- 首屏 HTTP 200；onboarding 在本地数据 ready 后出现，并可进入 Dashboard。
- `manifest.webmanifest`、`sw.js`、`data/cet6-vocab.v1.json`、`backgrounds/study-05.webp` 均可从 `/cet6-focus/` 子路径访问。
- Service Worker scope 为 `/cet6-focus/`，v3 shell cache 存在，词库已进入 Cache Storage。
- Study 评分写入 ReviewLog 和 StudySession；最终卡 Undo 恢复同一张卡并移除对应 ReviewLog。
- Dictation 错误 → 纠正链路可完成并写入 Dictation session。
- `/stats`、`/settings`、`/mistakes`、`/words` 均真实渲染。
- 设置页备份导出触发下载；固定背景可加载并在 reload 后保持。
- Service Worker 控制 reload；在线预热后切换离线，页面仍能 reload 并显示。
- 页面错误、console error、失败网络请求均为 0。

截图证据：[audit/screenshots/online-pages-smoke.png](audit/screenshots/online-pages-smoke.png)。可复核的文字摘要见 [audit/online-pages-results.txt](audit/online-pages-results.txt)。

## 已知边界

- 离线验证是“在线预热后离线 reload”，没有把首次冷启动完全断网当作已验证。
- Web Speech API 的声音可用性取决于验收机器的浏览器和操作系统；没有声音时不阻断学习流程。
- 词库中的 2 条缺音标和 177 条缺词性属于源数据可选字段，应用没有伪造补齐。
- 应用是 local-first：学习数据保存在验收者浏览器 IndexedDB，没有账号、后端或云端学习数据。
- GitHub Actions 日志带有 GitHub 对部分 action 内部 Node 20 runtime 的非阻断弃用提示；最终工作流本身已使用 Node 22 并成功完成。

## 验收建议

请以仓库代码、IndexedDB、ReviewLog、StudySession、FSRS 卡片、Service Worker Cache Storage 和在线实际行为为准；本报告只提供发布证据索引，不替代独立验收。
