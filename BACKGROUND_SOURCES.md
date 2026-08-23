# CET6 Focus v1.2 BBDCD background sources

这份记录是 `MASTER_HANDOFF` 要求的本地背景溯源表。运行时只读取 `public/backgrounds/v1.2/avif/` 与 `public/backgrounds/v1.2/webp/`，不热链图库；原始下载文件保留在 `data-source/backgrounds/v1.2/source/`，不随静态部署输出。

- 下载/校验日期：2026-08-23
- 入选数量：20 张（高分辨率源图宽度均不低于 2560px）
- 输出格式：每个场景均生成本地 AVIF 与 WebP；独立 desktop/mobile crop 与 overlay 在 `src/lib/background-scenes.ts`
- 许可：下表入选项均来自 Unsplash，按 Unsplash License 使用；作者与源页保留在代码和本表中
- 视觉校验：抽查原图与本地输出，确认无可见水印；瀑布/花草等竖图使用独立裁切，不强行复用桌面定位

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
| `stars-01` | 星空原野 — Nicolas Houdayer | 6240×4160 | [Unsplash](https://unsplash.com/photos/a-field-with-trees-and-stars-in-the-sky-2rqZj69xpdQ) | `public/backgrounds/v1.2/avif/stars-01.avif` / `.webp` | `infinite`, `luminous`, `vast`, `isolate` · 50% 46% / 50% 48% |
| `stars-02` | 远处星河 — Daniel Bynum | 5343×3562 | [Unsplash](https://unsplash.com/photos/a-field-with-trees-and-stars-in-the-sky-e_bmabLuhOE) | `public/backgrounds/v1.2/avif/stars-02.avif` / `.webp` | `infinite`, `radiant`, `luminous`, `remote` · 50% 46% / 50% 48% |
| `waterfall-01` | 瀑布入谷 — Frank Jing | 6336×9504 | [Unsplash](https://unsplash.com/photos/waterfall-cascades-through-a-lush-green-valley-TVjCD27ykxQ) | `public/backgrounds/v1.2/avif/waterfall-01.avif` / `.webp` | `vertical`, `plunge`, `stream`, `meadow` · 64% 50% / 66% 50% |
| `waterfall-02` | 高瀑与岩壁 — Marc Wieland | 7692×5128 | [Unsplash](https://unsplash.com/photos/tall-waterfall-cascades-down-basalt-columns-in-green-valley-lKdnVgBjc48) | `public/backgrounds/v1.2/avif/waterfall-02.avif` / `.webp` | `vertical`, `plunge`, `cliff`, `severe` · 62% 50% / 65% 50% |
| `waterfall-03` | 山谷水线 — Juan Goyache | 4000×6000 | [Unsplash](https://unsplash.com/photos/a-waterfall-in-the-middle-of-a-lush-green-valley-7Bd8sGIjqvc) | `public/backgrounds/v1.2/avif/waterfall-03.avif` / `.webp` | `stream`, `meadow`, `remote`, `vast` · 58% 50% / 62% 50% |
| `waterfall-04` | 远处的水声 — Quang Nguyen Vinh | 6792×4530 | [Unsplash](https://unsplash.com/photos/a-lush-green-valley-with-a-waterfall-in-the-background-ZUHt0yYoUrQ) | `public/backgrounds/v1.2/avif/waterfall-04.avif` / `.webp` | `stream`, `meadow`, `remote`, `isolate` · 55% 50% / 58% 50% |
| `penguins-01` | 一起向前 — Martin Wettstein | 6720×4480 | [Unsplash](https://unsplash.com/photos/a-group-of-penguins-standing-on-top-of-a-lush-green-field-h3JubFOr_Is) | `public/backgrounds/v1.2/avif/penguins-01.avif` / `.webp` | `stride`, `meadow`, `remote`, `vast` · 50% 56% / 50% 58% |
| `sheep-01` | 草地缓行 — Matheus Oliveira | 6000×4000 | [Unsplash](https://unsplash.com/photos/a-group-of-sheep-grazing-in-a-field-Ra_rH21vRLs) | `public/backgrounds/v1.2/avif/sheep-01.avif` / `.webp` | `graze`, `meadow`, `remote`, `vast` · 50% 52% / 50% 54% |
| `daisy-01` | 雏菊近处 — Engin Akyurt | 7863×5897 | [Unsplash](https://unsplash.com/photos/beautiful-field-of-vibrant-white-daisies-6HFKwwmWl20) | `public/backgrounds/v1.2/avif/daisy-01.avif` / `.webp` | `meadow`, `mild`, `luminous`, `radiant` · 50% 52% / 50% 54% |
| `daisy-02` | 草坡花开 — Annie Spratt | 6192×8256 | [Unsplash](https://unsplash.com/photos/a-bunch-of-daisies-in-a-field-of-grass-5nPu3UY94RA) | `public/backgrounds/v1.2/avif/daisy-02.avif` / `.webp` | `meadow`, `mild`, `radiant`, `isolate` · 50% 52% / 50% 54% |
| `lighthouse-01` | 给远方的信号 — Andrii Butko | 5254×3499 | [Unsplash](https://unsplash.com/photos/orange-lighthouse-on-a-grassy-hill-by-the-sea-FaXoqw1yAL4) | `public/backgrounds/v1.2/avif/lighthouse-01.avif` / `.webp` | `signal`, `solitary`, `remote`, `vast` · 50% 48% / 54% 48% |
| `lighthouse-02` | 孤独灯塔 — Ingo Stiller | 6714×3777 | [Unsplash](https://unsplash.com/photos/a-lighthouse-on-a-grassy-hill-Qk6MMA7YeFE) | `public/backgrounds/v1.2/avif/lighthouse-02.avif` / `.webp` | `signal`, `solitary`, `isolate`, `remote` · 50% 48% / 52% 50% |
| `volcano-02` | 火山点燃夜色 — Jeferson Argueta | 3712×5568 | [Unsplash](https://unsplash.com/photos/a-volcano-erupting-at-night-JChyrFPcWd4) | `public/backgrounds/v1.2/avif/volcano-02.avif` / `.webp` | `blaze`, `intense`, `ignite`, `severe` · 50% 58% / 50% 60% |

## 未入选与拒绝项

- `volcano-01`：候选表中的 Unsplash 源页下载端点在本次校验返回 404，未把不可复核的资源放进运行时池。
- `donkeys-01`：候选表中的 Pexels 源页在本次下载校验返回 403，未把未完成授权/源文件复核的资源放进运行时池。
- `dramatic mountain + dense pine forest` 与 `mountain lake reflection + pine forest`：按 `MASTER_HANDOFF` 的明确视觉方向拒绝，避免回到高密度树林/旧风景图库风格。

## 本地质量检查

```text
source originals: 20
AVIF runtime assets: 20
WebP runtime assets: 20
source width >= 2560px: 20/20
runtime external image URLs: 0
```
