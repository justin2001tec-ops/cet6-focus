# 背景图片来源

背景图已下载并本地化到 `public/backgrounds/`；每张图均提供 AVIF 与 WebP fallback，运行时不热链图库。所有素材均为公开摄影/影像页面，来源和许可在下表明确记录。

| 文件 | 原始页面 | 作者/摄影师 | 来源/许可 | 获取日期 |
| --- | --- | --- | --- | --- |
| `study-01.avif` / `.webp` | [Mountain Valley](https://commons.wikimedia.org/wiki/File:Mountain_Valley.jpg) | Jasper Boer | Wikimedia Commons · CC0 1.0 | 2026-08-22 |
| `study-02.avif` / `.webp` | [Landscape with mountain, forest and lake with reflection](https://commons.wikimedia.org/wiki/File:Landscape_with_mountain,_forest_and_lake_with_reflection.jpg) | Dev Vora | Wikimedia Commons · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 2026-08-22 |
| `study-03.avif` / `.webp` | [Forest path and trees](https://commons.wikimedia.org/wiki/File:Forest_path_and_trees.jpg) | Denis Zastanceanu | Wikimedia Commons · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 2026-08-22 |
| `study-04.avif` / `.webp` | [The forest path](https://commons.wikimedia.org/wiki/File:The_forest_path_(6244216669).jpg) | Randi Hausken | Wikimedia Commons · [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | 2026-08-22 |
| `study-05.avif` / `.webp` | [Modern library interior with chairs](https://commons.wikimedia.org/wiki/File:Modern_library_interior_with_chairs.jpg) | Shixart1985 | Wikimedia Commons · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | 2026-08-22 |
| `study-06.avif` / `.webp` | [Deanwood Neighborhood Library-interior](https://commons.wikimedia.org/wiki/File:Deanwood_Neighborhood_Library-interior.jpg) | Carol M. Highsmith | Wikimedia Commons · Public domain | 2026-08-22 |
| `study-07.avif` / `.webp` | [Picturesque landscape over the lake](https://commons.wikimedia.org/wiki/File:Picturesque_landscape_over_the_lake.jpg) | MuraliMenon22 | Wikimedia Commons · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 2026-08-22 |
| `study-08.avif` / `.webp` | [Reflection of forest in lake water](https://commons.wikimedia.org/wiki/File:Reflection_of_forest_in_lake_water._(edbfdc057a2e48cc8b8f42e3fe2105a9).jpg) | Kevin Bacher (MORA) | Wikimedia Commons · Public domain | 2026-08-22 |
| `study-09.avif` / `.webp` | [Dal Lake landscape reflection](https://commons.wikimedia.org/wiki/File:Dal_Lake_landscape_reflection,_Srinagar,_Kashmir,_India.jpg) | Kreativeart | Wikimedia Commons · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 2026-08-22 |
| `study-10.avif` / `.webp` | [Valley, Tengboche, Nepal](https://commons.wikimedia.org/wiki/File:Valley,_Tengboche,_Nepal.jpg) | Vyacheslav Argenberg | Wikimedia Commons · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 2026-08-22 |

## 本地处理

- 原始 JPEG 缩放到最长边不超过 1600px，再生成 AVIF 与 WebP；未添加水印或文字。
- `src/config/backgrounds.ts` 保留每张图的 source、author、license、object-position 和遮罩强度。
- 若替换图片，需要同步更新本表、配置和对应的本地二进制文件，并在交付前检查无水印、无广告牌、无 AI 乱码及可读文字对比度。
