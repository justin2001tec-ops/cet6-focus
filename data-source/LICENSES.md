# 数据许可证

## OpenEtymology CET6.txt

- 来源仓库：[openetymology/OpenEtymology](https://github.com/openetymology/OpenEtymology)
- 原始文件：[CET6/CET6.txt](https://github.com/openetymology/OpenEtymology/blob/main/CET6/CET6.txt)
- License：Creative Commons Attribution-ShareAlike 4.0 International（CC BY-SA 4.0）
- License 页面：https://creativecommons.org/licenses/by-sa/4.0/
- 下载/核验日期：2026-08-22
- 本项目处理：按原始 CET6.txt 逐行读取，并与 ECDICT 交集补充字段；未声称该词表为官方考试大纲。

## ECDICT

- 来源仓库：[skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)
- 原始文件：`ecdict.csv`
- License：MIT
- 下载/核验日期：2026-08-22
- 本项目处理：只保留与 CET6.txt 相交的条目到 `ecdict.cet6.csv`，补充音标、词性、中文释义和频率字段。

项目自身代码采用 MIT 风格的个人项目许可说明；第三方数据仍遵循各自许可证，不以代码许可覆盖。
