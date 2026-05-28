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

OnlyCCFA is an independent Chrome extension based on [CCFrank](https://github.com/WenyanLiu/CCFrank4dblp). It keeps the original CCF rank labels, filters Google Scholar to CCF-A papers by default, and adds open venue badges for SCI, JCR, CAS partition and field TOP venues.

OnlyCCFA 是基于 [CCFrank](https://github.com/WenyanLiu/CCFrank4dblp) 的独立 Chrome 扩展。它保留原有 CCF 等级标签能力，默认将 Google 学术结果筛选到 CCF-A，并补充 SCI、JCR、中科院分区以及各方向 TOP venue 标签。

## Features

- Shows CCF recommended ranks for papers on Google Scholar, dblp, Connected Papers, Semantic Scholar and Web of Science.
- Adds an open multi-source rank badge framework for SCI, JCR quartile, CAS partition, SCI TOP, EI, PKU Core, CSCD, CSSCI, school-specific lists and field TOP venues in robotics, control, electrical engineering, communications and mechanical engineering.
- Marks high-reputation venues that are not well covered by CCF/JCR/CAS with explicit field TOP badges such as `机器人方向TOP`.
- Filters Google Scholar search results to CCF-A papers by default.
- Keeps an on-page rank switcher so you can change between `ALL`, `CCF A`, `CCF B` and `CCF C`.
- Lets you save the default Google Scholar filter and choose whether unmatched results should stay visible.
- Shows how many results are visible, hidden and unmatched after filtering.
- Adds local Google Scholar venue matching before falling back to DBLP lookup, improving matches for venues such as NeurIPS, CVPR, SIGMOD, AAAI and ICLR.

## Screenshots

OnlyCCFA screenshots are organized around research workflows, not button states. The examples below show CCF-A filtering, robotics venues outside CCF, SCI/JCR/CAS badges, and engineering venues for communications, control, electrical and mechanical research.

| Embodied AI: CCF-A first                                                                                        | Robotics: field TOP beyond CCF                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-embodied-ai.png" alt="OnlyCCFA filtering embodied AI results to CCF-A papers" width="420"> | <img src="./img/demo-robotics-field-top.png" alt="OnlyCCFA showing CoRL RSS TRO and RA-L robotics venue badges" width="420"> |

| 6G communication: SCI/JCR/CAS badges                                                                           | Engineering control: EE, control and mechanical venues                                                                                 |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="./img/demo-6g-communications.png" alt="OnlyCCFA showing 6G communication source badges" width="420"> | <img src="./img/demo-engineering-venues.png" alt="OnlyCCFA showing power electronics control and mechanical venue badges" width="420"> |

## Install

Install OnlyCCFA from the Chrome Web Store:

[OnlyCCFA - Chrome Web Store](https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh)

You can also load OnlyCCFA from source as an unpacked Chrome extension for development.

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this repository directory.
5. Open Google Scholar and search as usual.

When testing local changes, click the extension card's reload button in `chrome://extensions` before refreshing Google Scholar.

## Development

Run the local test suite:

```bash
npm test
```

The tests cover:

- Google Scholar default CCF-A filtering behavior.
- Saved filter preferences and unmatched-result handling.
- Filter result statistics.
- Google Scholar venue extraction.
- Local venue-to-CCF matching for common CCF-A venues.
- Open multi-source rank matching for common journals, conferences and Chinese core journals.

## Data Sources

OnlyCCFA uses a transparent data-source structure in `data/openRankSources.js`.

The built-in list is an open seed dataset for common venues, Chinese core journals and field TOP venues such as CoRL, RSS, ICRA, IROS, TRO, IJRR, RA-L, Automatica, IEEE TAC, IEEE TPEL, IEEE TWC and IEEE JSAC.

It is designed to be expanded from official public lists or clearly licensed open datasets. JCR, CAS and field TOP tags are kept explicit instead of being merged into one vague badge. OnlyCCFA does not copy EasyScholar's packaged data.

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
