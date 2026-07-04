<h1 align="center">
  <img src="./onlyccfa_logo.png" width="48" height="48" alt="OnlyCCFA logo" valign="middle">
  OnlyCCFA
</h1>

<p align="center">
  <a href="https://github.com/zay002/OnlyCCFA">
    <img alt="OnlyCCFA version" src="https://img.shields.io/badge/OnlyCCFA-v0.8.0-EA4AAA?logo=github&logoColor=%23EA4AAA">
  </a>
  <a href="https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh">
    <img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome%20Web%20Store-OnlyCCFA-4285F4?logo=googlechrome&logoColor=white">
  </a>
</p>

<p align="center">
  <img alt="Chrome Web Store user trend" src="./assets/cws-users.svg">
</p>

<p align="center">
  中文 | <a href="./README_en.md">English</a>
</p>

OnlyCCFA 是一个科研检索浏览器扩展。它把 CCF、CORE/ICORE、JCR、中科院分区、SCI、EI、TH-CPL、中文核心、方向 TOP 和中文科研身份信号直接放进 Google Scholar、IEEE Xplore、Semantic Scholar、dblp、Connected Papers 和 Web of Science，让论文筛选、引用导出和 Zotero 整理少一点重复劳动。

## 你会得到什么

- **一眼看清 venue 信号**：CCF A/B/C、CORE A\*/A、JCR Q1/Q2、中科院 1区/2区/TOP、SCI/EI、TH-CPL、中文核心、SWJTU 目录和多个方向 TOP 标签并列展示，不合成含糊总分。
- **直接筛选当前检索结果**：Google Scholar、Semantic Scholar 和 IEEE Xplore 支持侧边筛选面板，可按标签组合过滤。
- **按引用数重排 Scholar 页面**：在 Google Scholar 当前页按引用数从高到低或从低到高排序，也可以一键恢复默认顺序。
- **更适合中文科研场景**：覆盖中文核心、TH-CPL、两院院士、国家杰青/青年科学基金 A 类种子名单，并在英文 Scholar 结果中结合题名、合作者和关键词消歧作者身份。
- **少踩 workshop 和缩写歧义坑**：workshop 单独标记；ECCV、CVPR、ICCV、ICML 等常见会议有回归测试保护，尽量避免把简称、LNCS 或异步回退误识别成错误标签。
- **面向整理工作流**：支持 Google Scholar 深度筛选、个人主页标注、单篇/批量 BibTeX 导出，并让 Zotero Connector 只看到筛选后的候选结果。

## 效果预览

| 多来源标签与筛选                                                                                      | 深度筛选结果池                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-advanced-source-filters.png" alt="OnlyCCFA advanced source filters" width="420"> | <img src="./img/demo-deep-filter-workflow.png" alt="OnlyCCFA deep filtering Google Scholar results" width="420"> |

| 方向 TOP 与中文标签                                                                            | Zotero 与 BibTeX 工作流                                                                                              |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-field-top-venues.png" alt="OnlyCCFA field top venue filters" width="420"> | <img src="./img/demo-zotero-filtered-connector.png" alt="OnlyCCFA filtered Zotero Connector candidates" width="420"> |

## 安装

推荐从 Chrome Web Store 安装稳定版本：

[OnlyCCFA - Chrome Web Store](https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh)

GitHub Release 通常更新更快。想提前测试新功能时，可以下载 release zip，在 `chrome://extensions` 开启开发者模式后用 `Load unpacked(加载未打包的扩展程序)` 加载。

## 数据来源

OnlyCCFA 使用可审计、可回滚的数据文件维护标签来源，包括 CCF、CORE/ICORE、JCR 2025、中科院升级版 2025、TH-CPL、中文核心、SWJTU 目录和公开作者身份名单。作者身份信号优先使用 CAS/CAE/NSFC 等官方或可复核来源，第三方页面只作为 seed。JCR 更新参考 [hitfyd/ShowJCR](https://github.com/hitfyd/ShowJCR)，CORE/ICORE 采集方式参考 [benkeks/icore-ranks](https://github.com/benkeks/icore-ranks)。

所有标签都是检索辅助信息，不替代学校、学院、基金或期刊会议官方标准。

## 隐私

OnlyCCFA 在浏览器本地运行，不需要登录，不收集个人检索记录。语言、筛选偏好和面板位置保存在本地存储中。批量 BibTeX 导出只会在用户主动触发时访问 Crossref、arXiv、Google Scholar 或 Semantic Scholar 等公开元数据入口。

## 贡献与致谢

欢迎通过 issue 或 pull request 提交数据修正、误匹配样例和功能改进。数据贡献请尽量附上官方链接、版本日期或可复核来源。

OnlyCCFA 由 [Zhaoyang Li](https://github.com/zay002) 维护，基于 [CCFrank / CCFrank4dblp](https://github.com/WenyanLiu/CCFrank4dblp) 发展而来。感谢 Wenyan Liu、CCFrank 贡献者，以及所有提供数据修正和测试样例的用户。

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
      <td align="center" valign="top" width="14.28%">
        <a href="https://github.com/dongyangli-del">
          <img src="https://avatars.githubusercontent.com/dongyangli-del?s=100" width="100px;" alt="dongyangli-del"/>
          <br />
          <sub><b>dongyangli-del</b></sub>
        </a>
        <br />
        Filter panel, TH-CPL badges, tests
      </td>
    </tr>
  </tbody>
</table>

## License

OnlyCCFA 使用 MIT License 发布, copyright 2026 Zhaoyang Li。
