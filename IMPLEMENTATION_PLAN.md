# CET6 Focus 实施计划

## 已完成

- [x] 空工作区审计并确定从零初始化。
- [x] React + TypeScript + Vite 应用骨架、Hash 路由、设计 token、响应式布局。
- [x] Dexie/IndexedDB schema、初始化、迁移和事务仓储。
- [x] 本地 CET-6 词库构建/校验管线。
- [x] `ts-fsrs` 评分、序列化与真实 Undo。
- [x] Study/Review、听写、薄弱词、词库、统计、设置、备份恢复。
- [x] PWA app shell、背景随机/固定/关闭、无障碍状态。
- [x] 单元测试、E2E smoke flow、生产构建配置。

## 验收顺序

1. 先确认 `pnpm typecheck` 与 `pnpm test`。
2. 再运行 `pnpm lint` 与 `pnpm build`。
3. 使用 Playwright 检查首次运行、评分刷新持久化、Undo、听写和移动端无横向溢出。
4. 对背景、声音和 IndexedDB 进行真实浏览器抽查。

## 约束

核心学习记录不能依赖 React 内存状态；`LearningCard.fsrsCard` 是调度真源，ReviewLog 同时保存 before/after。任何展示层的 Mastered/Weak 都是派生标签，不会篡改 FSRS 状态。
