<h1 align="center">
  <img src="./onlyccfa_logo.png" width="48" height="48" alt="OnlyCCFA logo" valign="middle">
  OnlyCCFA
</h1>

<p align="center">
  <a href="https://github.com/zay002/OnlyCCFA">
    <img alt="OnlyCCFA version" src="https://img.shields.io/badge/OnlyCCFA-v0.7.2-EA4AAA?logo=github&logoColor=%23EA4AAA">
  </a>
  <a href="https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh">
    <img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome%20Web%20Store-OnlyCCFA-4285F4?logo=googlechrome&logoColor=white">
  </a>
</p>

<p align="center">
  <img alt="Chrome Web Store user trend" src="./assets/cws-users.svg">
</p>

<p align="center">
  <a href="./README.md">中文</a> | English
</p>

OnlyCCFA is a browser extension for academic search. It adds CCF, CORE/ICORE, JCR, CAS, SCI, EI, TH-CPL, Chinese core journal, field TOP and author-identity badges directly to Google Scholar, IEEE Xplore, Semantic Scholar, dblp, Connected Papers and Web of Science, so paper screening, BibTeX export and Zotero cleanup take less manual work.

## What It Does

- **Shows venue signals at a glance**: CCF A/B/C, CORE A\*/A, JCR Q1/Q2, CAS 1/2/TOP, SCI/EI, TH-CPL, Chinese core journals, SWJTU-derived lists and field TOP badges stay visible as separate sources instead of being collapsed into a vague score.
- **Filters real search pages**: Google Scholar, Semantic Scholar and IEEE Xplore get a side panel for badge combinations.
- **Sorts Scholar results by citations**: reorder the current Google Scholar page from high to low or low to high citation count, then restore the original order when needed.
- **Works well for Chinese research workflows**: Chinese core journals, TH-CPL, CAS/CAE academicians, NSFC Distinguished Young Scholar seed names and field signals for robotics, communications, electrical engineering, control and mechanical engineering are supported.
- **Handles workshops and ambiguous names more carefully**: workshops get their own marker; ECCV, CVPR, ICCV, ICML and other common conference edge cases are covered by regression tests.
- **Fits the collecting workflow**: Google Scholar deep filtering, profile-page badges, single/batch BibTeX export and Zotero Connector synchronization are built in.

## Preview

| Multi-source badges and filters                                                                       | Deep result pool                                                                                                 |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-advanced-source-filters.png" alt="OnlyCCFA advanced source filters" width="420"> | <img src="./img/demo-deep-filter-workflow.png" alt="OnlyCCFA deep filtering Google Scholar results" width="420"> |

| Field TOP and Chinese badges                                                                   | Zotero and BibTeX workflow                                                                                           |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-field-top-venues.png" alt="OnlyCCFA field top venue filters" width="420"> | <img src="./img/demo-zotero-filtered-connector.png" alt="OnlyCCFA filtered Zotero Connector candidates" width="420"> |

## Install

Install the stable version from the Chrome Web Store:

[OnlyCCFA - Chrome Web Store](https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh)

GitHub Releases usually update faster. To test new builds early, download the release zip, open `chrome://extensions`, enable developer mode and load it as an unpacked extension.

## Data

OnlyCCFA keeps its badge data auditable and easy to revert, including CCF, CORE/ICORE, JCR 2025, CAS upgraded partition 2025, TH-CPL, Chinese core journals, SWJTU-derived lists and public author-identity lists. The JCR refresh was informed by [hitfyd/ShowJCR](https://github.com/hitfyd/ShowJCR), and CORE/ICORE collection was informed by [benkeks/icore-ranks](https://github.com/benkeks/icore-ranks).

Badges are search aids, not final academic judgments. Always follow the official standard required by your school, lab, funder or venue.

## Privacy

OnlyCCFA runs locally in the browser. It does not require an account and does not collect search history. Language, filter preferences and panel position are stored in browser local storage. Batch BibTeX export contacts public metadata sources such as Crossref, arXiv, Google Scholar or Semantic Scholar only after the user starts the export.

## Contributing and Credits

Issues and pull requests are welcome. For data fixes, please include official links, version dates or other reproducible sources whenever possible.

OnlyCCFA is maintained by [Zhaoyang Li](https://github.com/zay002) and grew from [CCFrank / CCFrank4dblp](https://github.com/WenyanLiu/CCFrank4dblp). Thanks to Wenyan Liu, the CCFrank contributors, and everyone who has reported data fixes and matching edge cases.

## Contributors

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

OnlyCCFA is released under the MIT License. Original CCFrank copyright notices are retained. OnlyCCFA modifications are copyright 2026 Zhaoyang Li.
