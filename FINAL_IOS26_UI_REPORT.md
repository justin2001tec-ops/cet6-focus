# CET6 Focus · iOS 26 Liquid Glass UI 重构最终报告

> 状态：等待视觉 / 代码验收。此分支已完成 UI 重构和自检，但未合并、未发布 `v1.1.0`。

## 1. 交付范围

- 分支：`ui/ios26-liquid-glass`
- 基线：`main` / `v1.0.0`，基线提交 `9eb6a60`
- PR：<https://github.com/justin2001tec-ops/cet6-focus/pull/1>
- 在线地址：未部署；本次仅使用本地 production preview 做验收
- 合并状态：未合并

本次只处理展示层、布局层和导航层。没有改写 FSRS 调度、IndexedDB schema / migration、学习队列、听写判定、薄弱词算法、备份恢复、PWA 缓存策略、词库内容或图片来源。

## 2. 完成内容

### 视觉系统

- 新增浅色 / 深色的 iOS 26-inspired design tokens。
- 新增 `Clear / Regular / Standard Material` 三层材料语义，并保留 `backdrop-filter` 不可用时的实色 fallback。
- 统一圆角、边界、阴影、字体层级、状态色和控件高度。
- 降低独立卡片密度，改为 grouped list、连续内容面板和浮层控件。
- 移除霓虹渐变、蓝紫 SaaS 视觉、倾斜 / 水波纹 / shimmer / parallax 等干扰效果。

### 自适应导航

- 桌面 / iPad：浮动玻璃侧栏，包含今日、学习、词库、统计、设置，以及复习、听写、薄弱词快捷入口。
- iPhone：顶部 compact bar + 底部浮动四项 Tab Bar：今日、学习、词库、更多。
- 新增 presentation-only 的学习入口页 `/learn` 和工具入口页 `/more`，原有业务路由全部保留。
- 路由变化时回到页面顶部，避免从长页面切换后落在旧滚动位置。
- 听写输入聚焦时底部栏退让，避免移动端键盘态遮挡提交按钮。

### 页面重构

- Dashboard：大标题、主任务面板、分组统计、今日顺序和进度信息。
- Learning Hub：今日学习、学习新词、到期复习、听写、薄弱词入口。
- Study：安静的词卡内容层 + 独立评分浮层，保留快捷键和评分行为。
- Dictation：分段控件、稳定输入材料、移动端键盘友好状态。
- Vocabulary / Word Detail：分组检索列表、移动端紧凑行、宽屏 inspector-like detail layout。
- Stats / Settings：减少 KPI 卡片感，改为连续分组面板和 grouped settings rows。

### 可访问性 / 性能保护

- 保留语义化 `button`、`nav`、`aria-label`、`role=tab` 和可见焦点样式。
- 保留 `prefers-reduced-motion` 和应用内“减少动效”开关。
- 背景图仍然是本地资源，不增加运行时外链图片。
- 玻璃层提供不支持 backdrop blur 浏览器的 fallback，不依赖玻璃效果才能阅读内容。

## 3. 截图验收包

截图均来自 production `dist` preview，使用 Chromium headless，尺寸为 CSS viewport 1x：

| 场景 | 尺寸 | 文件 |
| --- | ---: | --- |
| Dashboard · iPhone light | 390×844 | [`dashboard-iphone-light.png`](audit/ios26-ui/dashboard-iphone-light.png) |
| Dashboard · iPhone dark | 390×844 | [`dashboard-iphone-dark.png`](audit/ios26-ui/dashboard-iphone-dark.png) |
| Study · iPhone | 390×844 | [`study-iphone.png`](audit/ios26-ui/study-iphone.png) |
| Dictation · iPhone keyboard-ready | 390×844 | [`dictation-iphone-keyboard.png`](audit/ios26-ui/dictation-iphone-keyboard.png) |
| Vocabulary · iPhone | 390×844 | [`vocabulary-iphone.png`](audit/ios26-ui/vocabulary-iphone.png) |
| Settings · iPhone | 390×844 | [`settings-iphone.png`](audit/ios26-ui/settings-iphone.png) |
| Homepage · iPad | 834×1194 | [`homepage-ipad.png`](audit/ios26-ui/homepage-ipad.png) |
| Vocabulary inspector · iPad | 834×1194 | [`vocabulary-ipad-inspector.png`](audit/ios26-ui/vocabulary-ipad-inspector.png) |
| Homepage · desktop | 1440×900 | [`homepage-desktop.png`](audit/ios26-ui/homepage-desktop.png) |
| Study · desktop | 1440×900 | [`study-desktop.png`](audit/ios26-ui/study-desktop.png) |
| Stats · desktop | 1440×900 | [`stats-desktop.png`](audit/ios26-ui/stats-desktop.png) |
| Settings · desktop | 1440×900 | [`settings-desktop.png`](audit/ios26-ui/settings-desktop.png) |

截图脚本：`pnpm run capture:ios26`，源码位于 `scripts/capture-ios26-screenshots.mjs`。

## 4. 验证结果

| Gate | 结果 | 证据 |
| --- | --- | --- |
| `pnpm vocab:validate` | PASS | 2219 unique CET-6 entries；missingMeaning=0；missingDefinition=0 |
| `pnpm lint` | PASS | ESLint clean |
| `pnpm typecheck` | PASS | `tsc -b --pretty false` clean |
| `pnpm test` | PASS | 10 files / 23 tests passed |
| `pnpm build` | PASS | 1611 modules transformed；production `dist` generated |
| `pnpm run capture:ios26` | PASS | 12 screenshots generated |
| Existing Playwright E2E | FUNCTIONAL CHECKS PASS | Executed non-skipped desktop/mobile cases reported `ok` |

### E2E 运行说明

`pnpm test:e2e` 和单 worker 辅助命令 `pnpm run test:e2e:serial` 都能执行测试并输出各测试的 `ok` / skipped 结果；在当前 Windows 沙盒中，测试完成后 Playwright 等待本地 Vite webServer 退出，没有输出最终汇总并需要停止 runner。因此这里不把它包装成一个带正式汇总的 PASS；已将逐项 `ok` 结果和这个环境级收尾限制如实记录。

## 5. 已知限制 / 验收重点

- 截图是 Chromium headless 视觉证据，不等同于真机 iOS Safari；建议验收时重点看 375×812、390×844、430×932 的真实触摸和安全区表现。
- `dictation-iphone-keyboard.png` 是“输入已聚焦、底部栏退让”的 keyboard-ready 状态；无头浏览器不会绘制真实系统软键盘。
- 未部署在线网站，也没有创建 `v1.1.0` tag；等待验收后再决定是否合并和发布。
- 玻璃材料在真实设备上会随背景和系统渲染略有差异，fallback 已提供稳定可读的实色层。
- 本报告没有替代验收；请直接检查 PR diff、实际行为和上述截图。

## 6. 验收后动作

1. 先验收 PR diff 和截图。
2. 如通过，再合并 `ui/ios26-liquid-glass` 到 `main`。
3. 合并后再执行发布 / 部署，并单独创建 `v1.1.0`。
