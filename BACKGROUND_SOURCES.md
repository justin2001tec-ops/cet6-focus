# CET6 Focus v1.2 BBDCD background sources

这份记录是 `MASTER_HANDOFF` 要求的本地背景溯源表。运行时只读取 `public/backgrounds/v1.2/avif/` 与 `public/backgrounds/v1.2/webp/`，不热链图库；原始下载文件保留在 `data-source/backgrounds/v1.2/source/`，不随静态部署输出。

- 下载/校验日期：2026-08-23
- 入选数量：14 张（高分辨率源图宽度均不低于 2560px）
- 输出格式：每个场景均生成本地 AVIF 与 WebP；独立 desktop/mobile crop 与 overlay 在 `src/lib/background-scenes.ts`
- 许可：下表入选项均来自 Unsplash，按 Unsplash License 使用；作者与源页保留在代码和本表中
- 视觉校验：Round 2 复核原图与本地输出，确认无可见水印；瀑布/花草等竖图使用独立裁切，不强行复用桌面定位

## 入选场景

| id | 场景 / 作者 | 原图尺寸 | 源页 | 本地运行时资产 | 语义词 / crop |
| --- | --- | ---: | --- | --- | --- |
| `plateau-kiang-01` | 高原与藏野驴 — Mayur Arvind | 5921×3331 | [Unsplash](https://unsplash.com/photos/a-mountain-range-with-a-body-of-water-in-the-foreground-FP-LQo1AGTA) | `public/backgrounds/v1.2/avif/plateau-kiang-01.avif` / `.webp` | `remote`, `vast`, `plateau`, `graze` · desktop 50% 52% / mobile 54% 52% |
| `altiplano-01` | 贫瘠高原 — Alexander Schimmeck | 4256×2832 | [Unsplash](https://unsplash.com/photos/a-barren-landscape-with-mountains-in-the-background-VCmVqsnoCyY) | `public/backgrounds/v1.2/avif/altiplano-01.avif` / `.webp` | `barren`, `remote`, `severe`, `extent` · 50% 50% / 52% 50% |
| `altiplano-02` | 荒原光线 — Marek Piwnicki | 7553×4249 | [Unsplash](https://unsplash.com/photos/a-mountain-range-in-the-middle-of-a-desert-yweLOOSW9Do) | `public/backgrounds/v1.2/avif/altiplano-02.avif` / `.webp` | `vast`, `remote`, `barren`, `peak` · 50% 50% / 50% 50% |
| `ladakh-plateau-01` | 棱角与天际 — Rishi Dubey | 5999×2848 | [Unsplash](https://unsplash.com/photos/a-landscape-with-mountains-in-the-back-RMn0hMj-46A) | `public/backgrounds/v1.2/avif/ladakh-plateau-01.avif` / `.webp` | `peak`, `remote`, `vast`, `cliff` · 50% 52% / 50% 54% |
| `pangong-01` | 水面回声 — Rohan Gupta | 6000×4000 | [Unsplash](https://unsplash.com/photos/mountains-rise-above-a-tranquil-lake-4XwOG6Ah4cU) | `public/backgrounds/v1.2/avif/pangong-01.avif` / `.webp` | `reflect`, `remote`, `vast`, `isolate` · 50% 48% / 54% 50% |
| `aurora-01` | 极光初醒 — Jonas Degener | 7008×4672 | [Unsplash](https://unsplash.com/photos/aurora-borealis-dances-over-a-mountain-landscape-DwPo-SA3Fjw) | `public/backgrounds/v1.2/avif/aurora-01.avif` / `.webp` | `luminous`, `glow`, `radiant`, `infinite` · 50% 50% / 50% 52% |
| `aurora-02` | 夜色流光 — Angela Compagnone | 5975×3983 | [Unsplash](https://unsplash.com/photos/aurora-borealis-above-mountain-and-body-of-water-l9cneQNE03Y) | `public/backgrounds/v1.2/avif/aurora-02.avif` / `.webp` | `radiant`, `luminous`, `reflect`, `infinite` · 50% 48% / 54% 50% |
| `stars-02` | 远处星河 — Daniel Bynum | 5343×3562 | [Unsplash](https://unsplash.com/photos/a-field-with-trees-and-stars-in-the-sky-e_bmabLuhOE) | `public/backgrounds/v1.2/avif/stars-02.avif` / `.webp` | `infinite`, `radiant`, `luminous`, `remote` · 50% 46% / 50% 48% |
| `waterfall-02` | 高瀑与岩壁 — Marc Wieland | 7692×5128 | [Unsplash](https://unsplash.com/photos/tall-waterfall-cascades-down-basalt-columns-in-green-valley-lKdnVgBjc48) | `public/backgrounds/v1.2/avif/waterfall-02.avif` / `.webp` | `cascade`, `vertical`, `plunge`, `cliff` · 62% 50% / 65% 50% |
| `waterfall-03` | 山谷水线 — Juan Goyache | 4000×6000 | [Unsplash](https://unsplash.com/photos/a-waterfall-in-the-middle-of-a-lush-green-valley-7Bd8sGIjqvc) | `public/backgrounds/v1.2/avif/waterfall-03.avif` / `.webp` | `cascade`, `stream`, `meadow`, `remote` · 58% 50% / 62% 50% |
| `penguins-01` | 一起向前 — Martin Wettstein | 6720×4480 | [Unsplash](https://unsplash.com/photos/a-group-of-penguins-standing-on-top-of-a-lush-green-field-h3JubFOr_Is) | `public/backgrounds/v1.2/avif/penguins-01.avif` / `.webp` | `waddle`, `stride`, `meadow`, `remote` · 50% 56% / 50% 58% |
| `daisy-02` | 草坡花开 — Annie Spratt | 6192×8256 | [Unsplash](https://unsplash.com/photos/a-bunch-of-daisies-in-a-field-of-grass-5nPu3UY94RA) | `public/backgrounds/v1.2/avif/daisy-02.avif` / `.webp` | `daisy`, `meadow`, `mild`, `radiant` · 50% 52% / 50% 54% |
| `lighthouse-02` | 孤独灯塔 — Ingo Stiller | 6714×3777 | [Unsplash](https://unsplash.com/photos/a-lighthouse-on-a-grassy-hill-Qk6MMA7YeFE) | `public/backgrounds/v1.2/avif/lighthouse-02.avif` / `.webp` | `beacon`, `signal`, `solitary`, `remote` · 50% 48% / 52% 50% |
| `volcano-02` | 火山点燃夜色 — Jeferson Argueta | 3712×5568 | [Unsplash](https://unsplash.com/photos/a-volcano-erupting-at-night-JChyrFPcWd4) | `public/backgrounds/v1.2/avif/volcano-02.avif` / `.webp` | `eruption`, `blaze`, `ignite`, `severe` · 50% 58% / 50% 60% |

## 未入选与拒绝项

- `volcano-01`：候选表中的 Unsplash 源页下载端点在本次校验返回 404，未把不可复核的资源放进运行时池。
- `donkeys-01`：候选表中的 Pexels 源页在本次下载校验返回 403，未把未完成授权/源文件复核的资源放进运行时池。
- `stars-01`：星轨与密集林线抢占画面，偏离参考图的空旷自然气质。
- `waterfall-01`：竖图裁切后森林占比过大，单词与双卡缺少干净承载区。
- `waterfall-04`：画面含游客活动与游船，旅游壁纸感过强。
- `sheep-01`：普通草地放牧场景，和高原/远景动物方向相比辨识度不足。
- `daisy-01`：花朵近景过密、色彩噪声高，保留留白更好的 `daisy-02`。
- `lighthouse-01`：灯塔过小且上部高亮留白过大，保留主体更明确的 `lighthouse-02`。
- `dramatic mountain + dense pine forest` 与 `mountain lake reflection + pine forest`：按 `MASTER_HANDOFF` 的明确视觉方向拒绝，避免回到高密度树林/旧风景图库风格。

## 本地质量检查

```text
candidate source originals retained: 20
selected AVIF runtime assets: 14
selected WebP runtime assets: 14
selected source width >= 2560px: 14/14
runtime external image URLs: 0
```
