# CET6 Focus

一个 Local-first 的 CET-6 个人背词工具：到期复习优先，接着学习新词，再做听写强化。学习记录保存在浏览器 IndexedDB，不需要账号、后端或付费 API。

## 运行

```bash
pnpm install
pnpm dev
```

构建与质量检查：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
pnpm test:e2e
```

首次打开会加载 `public/data/cet6-vocab.v1.json` 到 IndexedDB。完成 onboarding 后，首页会按 FSRS 到期状态组织“复习 → 新词 → 听写”的学习链路。

## 结构

- `src/db/`：Dexie schema、初始化、仓储和事务。
- `src/lib/fsrs.ts`：`ts-fsrs` 适配层，负责序列化、评分、预览与恢复。
- `src/features/`：onboarding、今日计划、Study、Dictation、词库、统计与设置。
- `public/data/`：版本化本地词库。
- `scripts/`：可重复的词库构建和校验脚本。
- `IMAGE_SOURCES.md`：背景图片的来源与许可证记录。
- `FINAL_RC_REPORT.md`：本次 Release Candidate 的修补、门禁、截图和交付边界。

## 数据与隐私

核心学习数据只写入名为 `cet6-focus` 的 IndexedDB。设置页可导出 JSON 备份，也可以在导入前自动备份当前状态。应用不会把学习记录发送到服务器。

## 已知限制

Web Speech API 的可用声音由操作系统和浏览器决定；如果没有匹配的英音/美音，应用会显示非阻塞提示。背景图是本地文件，部署时不依赖运行时图库热链。

## 许可证

应用代码采用 MIT License；词库与背景素材的具体许可见 `data-source/LICENSES.md` 和 `IMAGE_SOURCES.md`。
