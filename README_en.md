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
  <a href="./README.md">中文</a> | English
</p>

OnlyCCFA is an independent Chrome extension based on [CCFrank](https://github.com/WenyanLiu/CCFrank4dblp). It keeps the original CCF rank labels and turns Google Scholar and Semantic Scholar into stricter paper-search workflows: deep-load multiple Google Scholar pages, filter search results by CCF, SCI/JCR, CAS partition, EI, Chinese core journal and field TOP venue badges, then export clean candidates to BibTeX or let Zotero Connector see only the filtered Google Scholar results.

The goal is simple: help students and researchers in computer science, robotics, mechanical engineering, electrical engineering and communications see venue-quality signals directly in their daily paper search results, with data that is transparent, extensible and free.

## Features

- Shows CCF recommended ranks for papers on Google Scholar, dblp, Connected Papers, Semantic Scholar and Web of Science.
- Filters Google Scholar search results to `CCF A` by default, with an on-page switcher for `ALL`, `CCF A`, `CCF B` and `CCF C`.
- Adds Semantic Scholar filtering with the side panel, CCF/open-source badges, single-paper BibTeX copy and batch export for selected or visible results.
- Adds configurable deep filtering: scan `20 / 40 / 60 / 80 / 100` Google Scholar results per batch, continue to the next batch, or clear the local result pool.
- Adds a redesigned bilingual side panel with local settings for language, default rank, deep-filter count and filter preferences.
- Combines SCI, JCR Q1/Q2, CAS 1/2/TOP, EI, Chinese core journals, SWJTU / SWJTU CS C-level / transportation lists and field TOP filters with `any` or `all` matching.
- Exports single papers, selected papers, visible papers or the whole deep-filter pool to BibTeX. BibTeX now prefers DOI, arXiv ID or strict-title Crossref/arXiv matches; Google Scholar's native import links are used only as a low-frequency fallback, and fields are never fabricated from result snippets.
- Makes the filtered Google Scholar DOM compatible with Zotero Connector: filtered-out results are temporarily moved out of the result list, so Zotero Connector sees the current candidate set instead of the original ALL results.
- Saves the default Google Scholar filter and lets you choose whether unmatched results should stay visible.
- Shows how many results are visible, hidden and unmatched after filtering.
- Adds local Google Scholar venue matching before falling back to DBLP lookup, improving matches for venues such as NeurIPS, CVPR, SIGMOD, AAAI and ICLR.
- Adds an open multi-source rank badge framework for SCI, JCR quartile, CAS partition, SCI TOP, EI, PKU Core, CSCD, CSSCI, SWJTU university / school / transportation lists and field TOP venues.
- Marks high-reputation venues that are not well covered by CCF/JCR/CAS with explicit hand-curated field TOP badges such as `机器人方向TOP`, `通信方向TOP` and `电气方向TOP`.

## Screenshots

OnlyCCFA screenshots are organized around the core workflow: deep-scan multiple Google Scholar pages, combine filters, then export the cleaner candidate set. Rank badges are still there, but the product is now a search-noise reducer.

| Deep result pool                                                                                                 | Advanced multi-source filters                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| <img src="./img/demo-deep-filter-workflow.png" alt="OnlyCCFA deep filtering Google Scholar results" width="420"> | <img src="./img/demo-advanced-source-filters.png" alt="OnlyCCFA advanced source filters for Google Scholar" width="420"> |

| Field TOP venues beyond CCF/JCR/CAS                                                                       | Continue the next batch                                                                                         |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-field-top-venues.png" alt="OnlyCCFA field top venue filters beyond CCF" width="420"> | <img src="./img/demo-continue-next-batch.png" alt="OnlyCCFA continuing the next deep-filter batch" width="420"> |

| Clean multi-line BibTeX                                                                                  | Zotero Connector sees only filtered clean results                                                                           |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-clean-bibtex-format.png" alt="OnlyCCFA clean multi-line BibTeX export" width="420"> | <img src="./img/demo-zotero-filtered-connector.png" alt="OnlyCCFA filtered Zotero Connector import candidates" width="420"> |

## Install

Install OnlyCCFA from the Chrome Web Store:

[OnlyCCFA - Chrome Web Store](https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh)

GitHub Releases are usually updated faster than the Chrome Web Store. Web Store releases need review, so they may lag behind the newest GitHub version; for early testing, download the release zip and load it as an unpacked extension.

You can also load OnlyCCFA from source as an unpacked Chrome extension for development.

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this repository directory.
5. Open Google Scholar and search as usual.

When testing local changes, click the extension card's reload button in `chrome://extensions` before refreshing Google Scholar.

Gentle reminder: batch BibTeX export may access public metadata endpoints from Crossref, arXiv, Google Scholar or Semantic Scholar. OnlyCCFA tries to keep requests conservative, but repeated large exports in a short time may still trigger anti-crawling or access-limit policies on those sites.

## Data Sources

OnlyCCFA uses transparent data-source structures: general open seed data lives in `data/openRankSources.js`, while SWJTU-related derived public-list data lives in `data/swjtuRankSources.js`.

The built-in list is an open seed dataset for common venues, Chinese core journals, field TOP venues, and derived badges from SWJTU's academic journal list, the School of Computing and Artificial Intelligence C-level journal list, and the transportation engineering special journal list. The SWJTU university-level journal list is limited to `T`, `A` and `B`; the computing C-level list is shown separately as `西南交大计算机C类` instead of being merged into the university-level ranks. Examples include CoRL, RSS, ICRA, IROS, TRO, IJRR, RA-L, Automatica, IEEE TAC, IEEE TPEL, IEEE TWC and IEEE JSAC.

It is designed to be expanded from official public lists, clearly licensed open datasets or verifiable public sources. JCR, CAS and field TOP tags are kept explicit instead of being merged into one vague badge. OnlyCCFA does not copy EasyScholar's packaged data.

## Credits

OnlyCCFA is currently maintained by [Zhaoyang Li](https://github.com/zay002).

This project is based on CCFrank / CCFrank4dblp. Many thanks to Wenyan Liu and all previous CCFrank contributors for the original extension, CCF data work, platform support, bug fixes and maintenance. Their work made OnlyCCFA possible.

Original project: [WenyanLiu/CCFrank4dblp](https://github.com/WenyanLiu/CCFrank4dblp)

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
    </tr>
  </tbody>
</table>

## License

OnlyCCFA is released under the MIT License.

Original CCFrank copyright notices are retained. OnlyCCFA modifications are copyright 2026 Zhaoyang Li.
