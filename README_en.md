<h1 align="center">
  <img src="./onlyccfa_logo.png" width="48" height="48" alt="OnlyCCFA logo" valign="middle">
  OnlyCCFA
</h1>

<p align="center">
  <a href="https://github.com/zay002/OnlyCCFA">
    <img alt="OnlyCCFA version" src="https://img.shields.io/badge/OnlyCCFA-v0.7.0-EA4AAA?logo=github&logoColor=%23EA4AAA">
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

OnlyCCFA is a Chrome extension for research search workflows. It adds venue and author-quality badges directly to Google Scholar, Semantic Scholar, IEEE Xplore, dblp, Connected Papers and Web of Science, then helps users filter, organize and export cleaner paper candidates.

The project began from [CCFrank / CCFrank4dblp](https://github.com/WenyanLiu/CCFrank4dblp) and is now maintained as an independent research-search assistant. OnlyCCFA keeps its data explainable and auditable: CCF, CORE/ICORE, JCR, CAS, SCI, EI, TH-CPL, Chinese core journals, field TOP venues and author-identity badges are shown as explicit sources rather than being collapsed into a vague aggregate score.

## Project Scope

OnlyCCFA is built for students and researchers who repeatedly search, filter and collect papers, especially Chinese-speaking users in computer science, AI, robotics, mechanical engineering, electrical engineering, communications and transportation. It does not replace academic judgment. Its job is to expose verifiable venue and source signals inside everyday search pages so users can spend less time on repetitive screening.

## Capabilities

- Shows CCF recommended ranks on Google Scholar, Semantic Scholar, IEEE Xplore, dblp, Connected Papers and Web of Science.
- Provides a side filter panel on Google Scholar, Semantic Scholar and IEEE Xplore with multi-select CCF A/B/C filters, open badge filters, result statistics and local preferences.
- Supports CORE/ICORE, SCI, JCR Q1/Q2, CAS 1/2/TOP, EI, TH-CPL A/B, Chinese core journals, NSFC Distinguished Young Scholars, CAS Academicians, CAE Academicians, SWJTU-derived lists and field TOP badges for robotics, communications, electrical engineering, control and mechanical engineering.
- Deep-filters Google Scholar by scanning multiple pages in batches, building a local candidate pool that can be continued or cleared.
- Supports Google Scholar profile pages with publication-table badges, combined filters, single-paper BibTeX copy and batch export. Profile pages default to ALL so opening an author page does not hide papers immediately.
- Exports BibTeX using DOI, arXiv ID or strict-title Crossref/arXiv matches first; Google Scholar native citation links are used only as a low-frequency fallback, and result snippets are never used to fabricate citation fields.
- Works with Zotero Connector by temporarily moving filtered-out Google Scholar results out of the visible result list, so Zotero sees the current filtered candidate set.
- Marks workshop papers separately to avoid confusing workshop results with main-conference papers.
- Deduplicates CCF badges on the same result and keeps the strongest resolved rank when asynchronous fallback sources return later.

## Screenshots

| Deep result pool                                                                                                 | Advanced multi-source filters                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| <img src="./img/demo-deep-filter-workflow.png" alt="OnlyCCFA deep filtering Google Scholar results" width="420"> | <img src="./img/demo-advanced-source-filters.png" alt="OnlyCCFA advanced source filters for Google Scholar" width="420"> |

| Field TOP venues                                                                                          | Continue the next batch                                                                                         |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-field-top-venues.png" alt="OnlyCCFA field top venue filters beyond CCF" width="420"> | <img src="./img/demo-continue-next-batch.png" alt="OnlyCCFA continuing the next deep-filter batch" width="420"> |

| Clean BibTeX export                                                                                      | Zotero Connector sees filtered results                                                                                      |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-clean-bibtex-format.png" alt="OnlyCCFA clean multi-line BibTeX export" width="420"> | <img src="./img/demo-zotero-filtered-connector.png" alt="OnlyCCFA filtered Zotero Connector import candidates" width="420"> |

## Installation

Install the stable version from the Chrome Web Store:

[OnlyCCFA - Chrome Web Store](https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh)

GitHub Releases are usually updated before the Chrome Web Store version. Chrome Web Store releases require review and may lag behind the latest GitHub release; for early testing, download the release zip and load it as an unpacked extension.

Load from source:

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this repository directory.
5. After changing code, reload the extension card and refresh the target search page.

## Data and Matching

OnlyCCFA keeps source data split by origin so changes can be audited and reverted:

- `data/openRankSources.js`: general open venue seeds, field TOP venues and Chinese core journals.
- `data/journalRankSources.js`: JCR 2025 and CAS upgraded partition 2025 journal data, with the JCR refresh informed by [hitfyd/ShowJCR](https://github.com/hitfyd/ShowJCR).
- `data/coreRankSources.js`: CORE/ICORE 2026 conference ratings from the [official CORE portal](https://portal.core.edu.au/conf-ranks), with the collection approach informed by [benkeks/icore-ranks](https://github.com/benkeks/icore-ranks).
- `data/thcplRankSources.js`: TH-CPL recommended venue list.
- `data/swjtuRankSources.js`: SWJTU-related derived public-list badges.
- `data/authorRankSources.js`: public author-identity badges, including Chinese academicians and a best-effort NSFC Distinguished Young Scholar seed list.

The matching policy is intentionally conservative:

- Prefer full venue names, explicit aliases and explainable normalization rules.
- Keep CCF, JCR, CAS, TH-CPL and field TOP signals separate instead of merging them into a single score.
- Do not copy opaque or unclearly licensed packaged datasets.
- Match author identities only by Chinese names, official English names or full pinyin aliases; high-ambiguity abbreviations such as `X Wang` are ignored.
- Treat ambiguous titles and aliases carefully. Full titles take priority, and unreliable guesses are avoided.

## Privacy and Limits

OnlyCCFA runs locally in the browser. It does not require an account and does not collect search history. Language, filter preferences and panel position are stored in browser local storage.

Batch BibTeX export may access public metadata endpoints from Crossref, arXiv, Google Scholar or Semantic Scholar. OnlyCCFA uses conservative requests and caching, but repeated large exports in a short time may still trigger rate limits or anti-crawling rules on those sites.

All badges are search aids, not final academic judgments. Institutional and disciplinary standards differ; always follow the relevant official document for formal evaluation.

## Development and Release

Common commands:

```bash
npm test
npm run format:check
npm run check:release
npm run benchmark:rank
npm run package
```

Before release, tests, formatting, release health checks and local packaging should pass. The GitHub Release zip is generated by `npm run package`.

## Contributing

Issues and pull requests are welcome. Data contributions should include official public links, dates or versions, and reproducible sources whenever possible. Code contributions should include focused tests, especially for venue matching, badge deduplication, BibTeX export and filter-state behavior.

## Credits

OnlyCCFA is currently maintained by [Zhaoyang Li](https://github.com/zay002).

This project is based on CCFrank / CCFrank4dblp. Many thanks to Wenyan Liu and all previous CCFrank contributors for the original extension, CCF data work, platform support, bug fixes and maintenance. The JCR 2025 refresh was informed by the public data work in [hitfyd/ShowJCR](https://github.com/hitfyd/ShowJCR). Their work made OnlyCCFA possible.

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

OnlyCCFA is released under the MIT License.

Original CCFrank copyright notices are retained. OnlyCCFA modifications are copyright 2026 Zhaoyang Li.
