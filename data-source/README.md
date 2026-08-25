# CET-6 词库来源

本项目的 `public/data/cet6-vocab.v1.json` 由以下公开数据源构建：

1. `CET6.txt`：OpenEtymology 仓库公开的 CET6 单词表，构建时保留 2,219 个词条。
2. `ecdict.cet6.csv`：从 ECDICT 的 `ecdict.csv` 中按 CET6 词表交集提取的释义快照，用于补充音标、词性、中文/英文释义和词频。当前快照的 `pos` 列为空时，构建脚本只从英文释义行首的 `n.` / `v.` / `a.` 等标记派生词性，并在构建报告中保留缺失计数。
3. `examples/`：Tatoeba English CC0 离线句子快照及其来源/许可证清单，用于为部分 CET-6 词条提供正式英语例句；选择规则见 [`examples/README.md`](examples/README.md)。

## Context Quality Refinement — Round 3

例句 selector v2 只改变离线例句选择，不改变运行时学习状态或 UI。它从同一份 CC0 语料派生词频，并对句长/结构、专有名词、非目标词难度、主题中性、上下文独立性和目标词教学位置进行可解释评分；严重不适宜内容直接拒绝。每个已选例句的 Tatoeba sentence ID、quality score 和指标保存在 `examples/example-provenance.json`，候选、拒绝原因、raw candidate coverage 与 quality-approved coverage 保存在 `examples/build-report.json`。

R3 固定 seed 的 250 条质量抽样与回归集位于 [`../audit/v1.3-context-quality/`](../audit/v1.3-context-quality/)。空 Context 是允许的降级：找不到通过质量门槛的句子时，词条不会为了覆盖率保留问题语境。

## 重复构建

```bash
pnpm vocab:build
pnpm vocab:validate
```

`vocab:build` 会先运行 `build-examples.ts`，再读取 `CET6.txt`、`ecdict.cet6.csv` 和选择后的例句映射；同一个词只保留一次，输出稳定的 `public/data/cet6-vocab.v1.json`。若需要使用新的完整 ECDICT 原始 CSV，可设置 `ECDICT_PATH` 环境变量。

## 清洗规则

- 词条统一为小写并去除首尾空白。
- 以 CET6.txt 为准，过滤掉不在 CET6 词表中的 ECDICT 条目。
- 中文释义和英文释义以 ECDICT 字段按真实或转义换行拆分；构建会把 `\\n` / `\\r\\n` 还原为换行，避免把转义文本直接展示给用户。
- 词性优先使用 ECDICT `pos` 字段；该字段为空时才从英文释义行首标记派生。音标、词频保留为可选字段。
- 缺少释义的词条使用明确的“暂无中文释义”标记，并由 `vocab:validate` 作为失败项报告；不会悄悄把无来源文本当作释义。
