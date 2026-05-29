<h1 align="center">
  <img src="./onlyccfa_logo.png" width="48" height="48" alt="OnlyCCFA logo" valign="middle">
  OnlyCCFA
</h1>

<p align="center">
  <a href="https://github.com/zay002/OnlyCCFA">
    <img alt="GitHub manifest version" src="https://img.shields.io/github/manifest-json/v/zay002/OnlyCCFA?color=%23EA4AAA&label=OnlyCCFA&logo=github&logoColor=%23EA4AAA">
  </a>
  <a href="https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh">
    <img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome%20Web%20Store-OnlyCCFA-4285F4?logo=googlechrome&logoColor=white">
  </a>
</p>

<p align="center">
  中文 | <a href="./README_en.md">English</a>
</p>

OnlyCCFA 是基于 [CCFrank](https://github.com/WenyanLiu/CCFrank4dblp) 的独立 Chrome 扩展。它保留原有 CCF 等级标签能力，并把 Google 学术搜索进一步变成“更适合筛论文”的工作流：深度加载多页 Google 学术结果，按 CCF、SCI/JCR、中科院分区、EI、中文核心以及各方向 TOP venue 标签降噪筛选，再把结果导出为 BibTeX，或让 Zotero Connector 只识别当前筛选后的结果。

这个项目的目标很直接：面向计算机、机器人、机械、电气、通信等方向的学生和研究者，把常用论文搜索结果里的 venue 质量信息尽可能公开、透明、免费地展示出来。

## 功能亮点

- 在 Google 学术、dblp、Connected Papers、Semantic Scholar 和 Web of Science 搜索结果中显示 CCF 推荐等级。
- Google 学术默认筛选为 `CCF A`，页面上可随时切换 `ALL`、`CCF A`、`CCF B`、`CCF C`。
- 新增可调深筛：每批可扫描 `20 / 40 / 60 / 80 / 100` 条 Google 学术结果；第一次建立结果池，之后可继续下一批，也可清空重来。
- 新版右侧控制台支持中文 / English 切换，语言、默认等级、深筛数量和筛选偏好都会保存在本地。
- 支持组合筛选 SCI、JCR Q1/Q2、中科院 1区/2区/TOP、EI、中文核心、西南交大 / 西南交大计算机 C 类 / 交通运输专项目录、机器人/通信/电气/控制/机械方向 TOP，并可选择“任一匹配”或“同时满足”。
- 支持单篇复制 BibTeX、批量导出勾选论文、导出当前可见论文、导出深筛结果池；BibTeX 优先取自 Google 学术原生引用链接，失败后仅用 DOI、arXiv ID 或严格标题匹配请求 Crossref / arXiv，不再用页面摘要拼接引用字段。
- 为 Zotero Connector 做兼容：筛选时会把未命中的 Google 学术结果临时移出结果列表，因此点击 Zotero Connector 时，它看到的是当前筛选后的候选论文，而不是原始 ALL 结果。
- 支持保存默认筛选等级，并可选择是否隐藏未识别结果。
- 显示当前页面可见、隐藏、未识别论文数量，方便判断筛选强度。
- 在 Google 学术中优先进行本地 venue 匹配，再回退到 DBLP 查询，提高 NeurIPS、CVPR、SIGMOD、AAAI、ICLR 等 venue 的识别率。
- 增加开放多源标签框架，覆盖 SCI、JCR 分区、中科院分区、SCI TOP、EI、北大核心、CSCD、CSSCI、西南交大校级 / 学院级 / 交通运输专项清单等。
- 对 CCF/JCR/中科院覆盖不足但在领域内声誉很高的会议或期刊，使用明确的手工补充标签，例如 `机器人方向TOP`、`通信方向TOP`、`电气方向TOP`。

## 效果示意

这些截图按 OnlyCCFA 的核心工作流组织：先深度扫描多页 Google 学术结果，再组合筛选，再批量导出。普通分区标签只是基础能力，真正目标是把冗长搜索结果变成更干净的候选文献池。

| 深筛结果池：从单页扩展到多页筛选                                                                                 | 多条件筛选：CCF/JCR/CAS/方向 TOP 组合                                                                                    |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| <img src="./img/demo-deep-filter-workflow.png" alt="OnlyCCFA deep filtering Google Scholar results" width="420"> | <img src="./img/demo-advanced-source-filters.png" alt="OnlyCCFA advanced source filters for Google Scholar" width="420"> |

| 方向 TOP：覆盖 CCF/JCR/CAS 之外的高声誉 venue                                                             | 继续下一批：可调数量、可续扫、可清空                                                                            |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-field-top-venues.png" alt="OnlyCCFA field top venue filters beyond CCF" width="420"> | <img src="./img/demo-continue-next-batch.png" alt="OnlyCCFA continuing the next deep-filter batch" width="420"> |

| 多行 BibTeX：并发、缓存、可读格式                                                                        | Zotero Connector：只识别筛选后的干净结果                                                                                    |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-clean-bibtex-format.png" alt="OnlyCCFA clean multi-line BibTeX export" width="420"> | <img src="./img/demo-zotero-filtered-connector.png" alt="OnlyCCFA filtered Zotero Connector import candidates" width="420"> |

## 安装

推荐直接从 Chrome Web Store 安装：

[OnlyCCFA - Chrome Web Store](https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh)

也可以从源码以开发者模式加载：

1. 打开 `chrome://extensions`。
2. 开启 `Developer mode`。
3. 点击 `Load unpacked`。
4. 选择本仓库目录。
5. 打开 Google 学术并正常搜索。

本地调试时，修改代码后需要先在 `chrome://extensions` 中点击扩展卡片的 reload，再刷新 Google 学术页面。

## 开发

运行测试：

```bash
npm test
```

当前测试覆盖：

- Google 学术默认 CCF-A 筛选。
- Google 学术深度筛选的分页 URL、start 序列、结果去重和批次续扫。
- 多源标签组合筛选。
- Google 学术 / Crossref / arXiv BibTeX 获取、BibTeX 解析和 Zotero Connector 筛选结果兼容。
- 筛选偏好保存和未识别结果处理。
- 筛选统计信息。
- Google 学术 venue 提取。
- 常见 CCF-A venue 的本地匹配。
- 常见会议、期刊和中文核心期刊的开放多源标签匹配。

## 数据源

OnlyCCFA 使用透明的数据结构维护开放标签，通用开放种子数据入口在 `data/openRankSources.js`，西南交大相关公开目录派生数据入口在 `data/swjtuRankSources.js`。

当前内置数据是种子数据集，覆盖一批常见国际 venue、中文核心期刊、方向 TOP venue，以及西南交通大学学术期刊分级目录、计算机与人工智能学院高水平期刊 C 类目录、交通运输工程专项期刊目录的派生标签。西南交通大学校级期刊分级仅保留 `T类`、`A类`、`B类`；计算机学院补充目录以 `西南交大计算机C类` 独立显示，不混入校级分级。例如 CoRL、RSS、ICRA、IROS、TRO、IJRR、RA-L、Automatica、IEEE TAC、IEEE TPEL、IEEE TWC、IEEE JSAC 等。

项目后续应优先从官方公开清单、明确授权的开放数据集或可验证的公开来源扩展。JCR、中科院分区和方向 TOP 标签会保持独立，不会合并成含糊的“综合等级”。OnlyCCFA 不复制 EasyScholar 的打包数据。

## 致谢

OnlyCCFA 当前由 [Zhaoyang Li](https://github.com/zay002) 维护。

本项目基于 CCFrank / CCFrank4dblp。感谢 Wenyan Liu 以及所有 CCFrank 贡献者在原始扩展、CCF 数据、平台支持、问题修复和长期维护上的工作。没有这些基础，OnlyCCFA 不会这么快站起来。

原项目：[WenyanLiu/CCFrank4dblp](https://github.com/WenyanLiu/CCFrank4dblp)

## 贡献者

<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%">
        <a href="https://github.com/zay002">
          <img src="https://avatars.githubusercontent.com/zay002?s=100" width="100px;" alt="Zhaoyang Li"/>
          <br />
          <sub><b>Zhaoyang Li</b></sub>
        </a>
        <br />
        Code, documentation, tests, maintenance
      </td>
    </tr>
  </tbody>
</table>

## License

OnlyCCFA 使用 MIT License 发布。

原始 CCFrank 版权声明已保留。OnlyCCFA 修改部分 copyright 2026 Zhaoyang Li。
