const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/scholar.js", "utf8");
const fakeDocument = {
  addEventListener() {},
  createElement(tagName) {
    return {
      tagName,
      className: "",
      children: [],
      appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
      },
    };
  },
  querySelectorAll() {
    return [];
  },
};
const scholar = vm.runInNewContext(`${source}; scholar;`, {
  console,
  URL,
  URLSearchParams,
  setTimeout,
  document: fakeDocument,
  authorSources: {
    resolveAuthors(authors) {
      return authors.includes("姚期智")
        ? [{ source: "casAcademician", matchedName: "姚期智" }]
        : [];
    },
    getTagSpan(tag) {
      return { className: "rank-source", textContent: tag.source };
    },
  },
  $(target) {
    return {
      append(child) {
        if (target && Array.isArray(target.children)) {
          target.children.push(child);
          if (child) {
            child.parentNode = target;
          }
        } else {
          this.children = this.children || [];
          this.children.push(child);
        }
      },
    };
  },
});

function fakeLink(href, textContent = "") {
  return {
    href,
    textContent,
    getAttribute(name) {
      return name === "href" ? href : "";
    },
  };
}

assert.strictEqual(
  scholar.extractVenue(
    "A Vaswani, N Shazeer - Advances in neural information processing systems, 2017 - papers.nips.cc",
  ),
  "Advances in neural information processing systems",
);

assert.strictEqual(
  scholar.extractVenue(
    "R Girshick - Proceedings of the IEEE international conference on computer vision, 2015 - openaccess.thecvf.com",
  ),
  "Proceedings of the IEEE international conference on computer vision",
);

assert.strictEqual(
  scholar.extractVenue(
    "J Li, BM Chen, GH Lee - Proceedings of the IEEE …, 2018 - openaccess.thecvf.com",
    "https://openaccess.thecvf.com/content_cvpr_2018/html/Li_SO-Net_Self-Organizing_Network_CVPR_2018_paper.html",
  ),
  "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);

assert.strictEqual(
  scholar.inferVenueFromUrl(
    "https://openaccess.thecvf.com/content/CVPR2023W/NTIRE/html/Li_NTIRE_2023_Challenge_on_Efficient_Super-Resolution_CVPRW_2023_paper.html",
  ),
  "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);

assert.strictEqual(
  scholar.inferVenueFromUrl(
    "https://proceedings.mlr.press/v202/michel23a.html",
  ),
  "International Conference on Machine Learning",
);

assert.strictEqual(
  scholar.inferVenueFromUrl(
    "https://proceedings.neurips.cc/paper_files/paper/2026/hash/ac-dit.html",
  ),
  "Conference on Neural Information Processing Systems",
);

assert.strictEqual(
  scholar.extractVenue(
    "S Chen, J Liu, S Qian - Advances in ..., 2026 - proceedings.neurips.cc",
    "https://proceedings.neurips.cc/paper_files/paper/2026/hash/ac-dit.html",
  ),
  "Conference on Neural Information Processing Systems",
);

assert.strictEqual(
  scholar.extractVenue(
    "G Michel, G Nikolentzos, JF Lutzeyer - International ..., 2023 - proceedings.mlr.press",
    "https://proceedings.mlr.press/v202/michel23a.html",
  ),
  "International Conference on Machine Learning",
);

assert.strictEqual(
  scholar.extractVenue(
    "Y Li, J Zhang - Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern ..., 2023 - openaccess.thecvf.com",
    "https://openaccess.thecvf.com/content/CVPR2023W/NTIRE/html/Li_NTIRE_2023_Challenge_on_Efficient_Super-Resolution_CVPRW_2023_paper.html",
  ),
  "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);

assert.strictEqual(
  scholar.extractVenue("A Author, B Author - arXiv preprint arXiv:2401.00001"),
  "arXiv preprint arXiv:2401.00001",
);

assert.strictEqual(
  JSON.stringify(scholar.getDeepPageStarts(0, 10, 55)),
  JSON.stringify([10, 20, 30, 40, 50]),
);
assert.strictEqual(
  JSON.stringify(scholar.getDeepPageStarts(20, 10, 55)),
  JSON.stringify([30, 40, 50, 60, 70]),
);
assert.strictEqual(
  scholar.getCurrentStart(
    "https://scholar.google.com/scholar?q=robot+learning",
  ),
  0,
);
assert.strictEqual(
  scholar.getCurrentStart(
    "https://scholar.google.com/scholar?q=robot+learning&start=40",
  ),
  40,
);

assert.strictEqual(
  scholar.withStartParam(
    "https://scholar.google.com/scholar?q=robot+learning&hl=en&start=10",
    30,
  ),
  "https://scholar.google.com/scholar?q=robot+learning&hl=en&start=30",
);

function fakeResult(title, href) {
  return {
    querySelector(selector) {
      if (selector === "h3 a") {
        return { textContent: title, href };
      }
      return null;
    },
  };
}

assert.strictEqual(
  scholar.getResultKey(
    fakeResult(
      "  A Survey of Embodied AI  ",
      "https://scholar.google.com/scholar?q=related:abc",
    ),
  ),
  "https://scholar.google.com/scholar?q=related:abc",
);
assert.strictEqual(
  scholar.getResultKey(fakeResult("  A Survey of Embodied AI  ", "")),
  "a survey of embodied ai",
);

assert.strictEqual(
  scholar.extractBibtexHref(
    '<a href="/scholar.bib?q=info:abc&amp;output=citation">BibTeX</a>',
    "https://scholar.google.com/scholar?q=info:abc&output=cite",
  ),
  "https://scholar.google.com/scholar.bib?q=info:abc&output=citation",
);

assert.strictEqual(
  scholar.getCitationUrl({
    querySelector(selector) {
      if (selector === 'a[href*="output=cite"]') {
        return {
          href: "/scholar?q=info:abc:scholar.google.com/&output=cite",
        };
      }
      return null;
    },
  }),
  "https://scholar.google.com/scholar?q=info:abc:scholar.google.com/&output=cite",
);

assert.strictEqual(
  scholar.getCitationUrl({
    dataset: { cid: "abc123" },
    querySelector() {
      return null;
    },
  }),
  "https://scholar.google.com/scholar?q=info%3Aabc123%3Ascholar.google.com%2F&output=cite&scirp=0",
);

assert.strictEqual(
  scholar.getDirectBibtexUrl({
    querySelectorAll(selector) {
      assert.strictEqual(selector, "a");
      return [
        fakeLink("/scholar?q=info:abc&output=cite", "Cite"),
        fakeLink(
          "/scholar.bib?q=info:abc&output=citation",
          "Import into BibTeX",
        ),
      ];
    },
  }),
  "https://scholar.google.com/scholar.bib?q=info:abc&output=citation",
);

assert.strictEqual(
  scholar.extractDoiFromText("Published as doi:10.1109/TRO.2024.1234567."),
  "10.1109/TRO.2024.1234567",
);

assert.strictEqual(
  scholar.buildCrossrefBibtexUrl("10.1109/TRO.2024.1234567"),
  "https://api.crossref.org/works/10.1109%2FTRO.2024.1234567/transform/application/x-bibtex",
);

assert.strictEqual(
  scholar.extractArxivIdFromText("arXiv preprint arXiv:2103.02690, 2021"),
  "2103.02690",
);

assert.strictEqual(
  scholar.extractArxivIdFromText("https://arxiv.org/abs/2103.02690v2"),
  "2103.02690v2",
);

assert.strictEqual(
  scholar.buildArxivApiUrl("2103.02690"),
  "https://export.arxiv.org/api/query?id_list=2103.02690",
);

assert.strictEqual(scholar.isAcceptableYearMatch("2020", "2021"), true);
assert.strictEqual(scholar.isAcceptableYearMatch("2020", "2024"), false);

assert.strictEqual(
  scholar.isCrossrefTitleMatch(
    "Learning force-aware manipulation for contact-rich robotics",
    "Learning force aware manipulation for contact rich robotics",
  ),
  true,
);

assert.strictEqual(
  scholar.isCrossrefTitleMatch(
    "Learning force-aware manipulation for contact-rich robotics",
    "A survey of wireless communications",
  ),
  false,
);
assert.strictEqual(
  scholar.getCrossrefItemYear({
    issued: { "date-parts": [[2026, 1, 1]] },
  }),
  "2026",
);
assert.strictEqual(
  scholar.getCrossrefContainerTitle({
    "container-title": ["IEEE International Conference on Image Processing"],
    "short-container-title": ["ICIP"],
  }),
  "IEEE International Conference on Image Processing (ICIP)",
);
assert.strictEqual(
  scholar.shouldFetchSearchResultVenue({
    title: "Deep learning-based point cloud registration",
    year: "2026",
    venue: "International Journal of ...",
  }),
  true,
);
assert.strictEqual(
  scholar.shouldFetchSearchResultVenue({
    title:
      "Pathnet: Evolution channels gradient descent in super neural networks",
    year: "2017",
    venue: "arXiv preprint arXiv ...",
  }),
  false,
);

assert.strictEqual(scholar.buildScholarBibtexSettingsUrl, undefined);
assert.strictEqual(scholar.enableScholarBibtexLinks, undefined);

function fakeScholarEntry() {
  const entry = { dataset: {}, rankHost: null };
  const title = {
    insertAdjacentElement(position, node) {
      assert.strictEqual(position, "afterend");
      entry.rankHost = node;
    },
  };

  entry.querySelector = function (selector) {
    if (selector === ".onlyccfa-rank-badges") {
      return entry.rankHost;
    }
    if (selector === "h3") {
      return title;
    }
    return null;
  };

  return entry;
}

function fakeCitationEntry() {
  const entry = { dataset: {}, rankHost: null, style: { display: "" } };
  const titleLink = {
    textContent: "A profile paper",
    href: "https://example.org/profile-paper",
    insertAdjacentElement(position, node) {
      assert.strictEqual(position, "afterend");
      entry.rankHost = node;
    },
    closest(selector) {
      return selector.includes("tr.gsc_a_tr") ? entry : null;
    },
    getAttribute(name) {
      return name === "href" ? this.href : "";
    },
  };
  const titleCell = {
    insertAdjacentElement(position, node) {
      assert.strictEqual(position, "afterend");
      entry.rankHost = node;
    },
  };
  const authors = { textContent: "A Author, B Researcher" };
  const venue = {
    textContent: "Journal of Machine Learning Research 11, 2079-2107, 2010",
  };
  const year = { textContent: "2010" };

  entry.querySelector = function (selector) {
    if (selector === ".onlyccfa-rank-badges") {
      return this.rankHost;
    }
    if (selector === "h3" || selector === "h3 a" || selector === ".gs_a") {
      return null;
    }
    if (selector === "a.gsc_a_at" || selector === "td.gsc_a_t > a") {
      return titleLink;
    }
    if (selector === "td.gsc_a_t") {
      return titleCell;
    }
    if (selector === "td.gsc_a_y" || selector === "td.gsc_a_y span") {
      return year;
    }
    return null;
  };
  entry.querySelectorAll = function (selector) {
    if (selector === ".gs_gray") {
      return [authors, venue];
    }
    if (selector === "a") {
      return [titleLink];
    }
    return [];
  };

  return entry;
}

const rankHostEntry = fakeScholarEntry();
const rankHost = scholar.getRankBadgeHost(rankHostEntry, {
  createElement(tagName) {
    return {
      tagName,
      className: "",
      children: [],
      querySelectorAll(selector) {
        if (selector === ".ccf-rank") {
          return this.children.filter((child) =>
            String(child.className || "").includes("ccf-rank"),
          );
        }
        if (selector === ".rank-source") {
          return this.children.filter((child) =>
            String(child.className || "").includes("rank-source"),
          );
        }
        if (selector === ".ccf-rank, .rank-source") {
          return this.children.filter((child) => {
            const className = String(child.className || "");
            return (
              className.includes("ccf-rank") ||
              className.includes("rank-source")
            );
          });
        }
        return [];
      },
    };
  },
});
assert.strictEqual(rankHost.tagName, "div");
assert.strictEqual(rankHost.className, "onlyccfa-rank-badges");
assert.strictEqual(scholar.getRankBadgeHost(rankHostEntry), rankHost);

scholar.appendRankBadge(
  {},
  {
    className: "ccf-rank ccf-c",
    dataset: { rankSource: "ccf", rankValue: "CCF C" },
    textContent: "CCF C",
  },
  rankHostEntry,
);
scholar.appendRankBadge(
  {},
  {
    className: "ccf-rank ccf-c",
    dataset: { rankSource: "ccf", rankValue: "CCF C" },
    textContent: "CCF C",
  },
  rankHostEntry,
);
scholar.appendRankBadge(
  {},
  {
    className: "rank-source rank-source-school",
    dataset: { rankSource: "swjtuScai", rankValue: "C类" },
    textContent: "西南交大计算机C类",
  },
  rankHostEntry,
);
scholar.appendRankBadge(
  {},
  {
    className: "rank-source rank-source-sci",
    dataset: { rankSource: "sci", rankValue: "" },
    textContent: "SCI",
  },
  rankHostEntry,
);
scholar.appendRankBadge(
  {},
  {
    className: "rank-source rank-source-sci",
    dataset: { rankSource: "sci", rankValue: "" },
    textContent: "SCI",
  },
  rankHostEntry,
);
scholar.appendRankBadge(
  {},
  {
    className: "rank-source rank-source-school",
    dataset: { rankSource: "swjtuScai", rankValue: "C类" },
    textContent: "西南交大计算机C类",
  },
  rankHostEntry,
);
assert.deepStrictEqual(
  rankHost.children.map((child) => child.textContent),
  ["CCF C", "西南交大计算机C类", "SCI"],
);

assert.strictEqual(typeof scholar.appendAuthorBadges, "function");

const authorBadgeEntry = fakeScholarEntry();
authorBadgeEntry.querySelector = function (selector) {
  if (selector === ".onlyccfa-rank-badges") {
    return this.rankHost;
  }
  if (selector === "h3") {
    return {
      insertAdjacentElement: (_position, node) => {
        this.rankHost = node;
      },
    };
  }
  if (selector === ".gs_a") {
    return {
      textContent: "姚期智, A Researcher - Journal of the ACM, 2025",
    };
  }
  return null;
};
scholar.appendAuthorBadges(authorBadgeEntry);
assert.ok(authorBadgeEntry.rankHost);
assert.strictEqual(authorBadgeEntry.dataset.onlyccfaAuthorRanked, "true");

assert.strictEqual(
  scholar.extractCitationVenue(
    "Journal of Machine Learning Research 11, 2079-2107, 2010",
  ),
  "Journal of Machine Learning Research",
);
assert.strictEqual(
  scholar.extractCitationVenue(
    "IEEE Transactions on Industrial Electronics 71 (4), 4108-4119, 2023",
  ),
  "IEEE Transactions on Industrial Electronics",
);
assert.strictEqual(
  scholar.extractCitationVenue(
    "2023 IEEE/CVF Conference on Computer Vision and Pattern Recognition, 1922-1960, 2023",
  ),
  "2023 IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);

assert.strictEqual(
  scholar.extractCitationDetailVenue(`
    <div class="gsc_oci_field">Authors</div>
    <div class="gsc_oci_value">Y Li, Y Zhang, T Li</div>
    <div class="gsc_oci_field">Publication date</div>
    <div class="gsc_oci_value">2023</div>
    <div class="gsc_oci_field">Source</div>
    <div class="gsc_oci_value">
      Proceedings of the IEEE/CVF conference on computer vision and pattern recognition
    </div>
  `),
  "Proceedings of the IEEE/CVF conference on computer vision and pattern recognition",
);

const citationEntry = fakeCitationEntry();
const citationRankHost = scholar.getRankBadgeHost(citationEntry, fakeDocument);
assert.strictEqual(citationRankHost.tagName, "div");
assert.strictEqual(citationRankHost.className, "onlyccfa-rank-badges");

const citationData = scholar.getResultData(citationEntry);
assert.strictEqual(citationData.title, "A profile paper");
assert.strictEqual(citationData.url, "https://example.org/profile-paper");
assert.strictEqual(
  JSON.stringify(citationData.authors),
  JSON.stringify(["A Author", "B Researcher"]),
);
assert.strictEqual(citationData.year, "2010");
assert.strictEqual(citationData.venue, "Journal of Machine Learning Research");
assert.strictEqual(
  citationData.metadata,
  "A Author, B Researcher - Journal of Machine Learning Research 11, 2079-2107, 2010",
);

const citationAnchorEntry = fakeCitationEntry();
const citationAnchor = citationAnchorEntry.querySelector("a.gsc_a_at");
assert.strictEqual(
  scholar.getEntryFromRankAnchor(citationAnchor),
  citationAnchorEntry,
);

citationAnchor.href =
  "/citations?view_op=view_citation&hl=en&user=CQ1HneMAAAAJ&citation_for_view=CQ1HneMAAAAJ:HqhvjgTjE9cC";
assert.strictEqual(
  scholar.getCitationDetailUrl(citationAnchorEntry),
  "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=CQ1HneMAAAAJ&citation_for_view=CQ1HneMAAAAJ:HqhvjgTjE9cC",
);
assert.strictEqual(
  scholar.shouldFetchCitationDetailVenue(
    "Proceedings of the IEEE/CVF conference on computer vision and pattern …",
  ),
  true,
);

const selectedCitationEntry = fakeCitationEntry();
fakeDocument.querySelectorAll = function (selector) {
  if (selector === ".onlyccfa-select-result:checked") {
    return [
      {
        closest(matchSelector) {
          assert.strictEqual(
            matchSelector,
            "#gs_res_ccl_mid > div, tr.gsc_a_tr",
          );
          return selectedCitationEntry;
        },
      },
    ];
  }
  if (selector === "#gsc_a_b tr.gsc_a_tr") {
    return [selectedCitationEntry, { style: { display: "none" } }];
  }
  return [];
};
assert.strictEqual(scholar.getSelectedEntries()[0], selectedCitationEntry);
assert.strictEqual(scholar.getVisibleEntries()[0], selectedCitationEntry);

const uglyBibtex =
  "@article{Yang_2021, title={TEASER: Fast and Certifiable Point Cloud Registration}, volume={37}, DOI={10.1109/tro.2020.3033695}, month=Apr, pages={314–333} }";
const formattedBibtex = scholar.formatBibtex(uglyBibtex);
assert.strictEqual(
  formattedBibtex,
  [
    "@article{Yang_2021,",
    "  title = {TEASER: Fast and Certifiable Point Cloud Registration},",
    "  volume = {37},",
    "  DOI = {10.1109/tro.2020.3033695},",
    "  month = {Apr},",
    "  pages = {314–333}",
    "}",
  ].join("\n"),
);

async function runAsyncTests() {
  let running = 0;
  let maxRunning = 0;
  const result = await scholar.mapWithConcurrency(
    [1, 2, 3, 4, 5],
    2,
    async (value) => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return value * 10;
    },
  );

  assert.strictEqual(
    JSON.stringify(result),
    JSON.stringify([10, 20, 30, 40, 50]),
  );
  assert.ok(maxRunning <= 2);

  const originalGetReliableBibtexForEntry = scholar.getReliableBibtexForEntry;
  const originalConcurrency = scholar.bibtexConcurrency;
  scholar.bibtexCache = new Map();
  scholar.bibtexConcurrency = 2;
  scholar.getReliableBibtexForEntry = async function (entry, options = {}) {
    assert.strictEqual(options.allowGoogleCitationFetch, false);
    await new Promise((resolve) => setTimeout(resolve, 20 - entry.id));
    return `@article{paper${entry.id}, title={Paper ${entry.id}}, year={202${entry.id}} }`;
  };

  const batch = await scholar.buildBibtexResultForEntries([
    { id: 1, ...fakeResult("Paper 1", "https://example.org/1") },
    { id: 2, ...fakeResult("Paper 2", "https://example.org/2") },
    { id: 3, ...fakeResult("Paper 3", "https://example.org/3") },
  ]);
  assert.strictEqual(batch.exported, 3);
  assert.strictEqual(batch.failed, 0);
  assert.ok(
    batch.bibtex.indexOf("@article{paper1,") <
      batch.bibtex.indexOf("@article{paper2,"),
  );
  assert.ok(batch.bibtex.includes("\n  title = {Paper 1},\n"));

  scholar.getReliableBibtexForEntry = originalGetReliableBibtexForEntry;
  scholar.bibtexConcurrency = originalConcurrency;

  let googleFetchCount = 0;
  const originalFetchGoogleScholarBibtex = scholar.fetchGoogleScholarBibtex;
  const originalFetchCrossrefBibtexByTitle = scholar.fetchCrossrefBibtexByTitle;
  const originalGetResultData = scholar.getResultData;
  scholar.fetchGoogleScholarBibtex = async function () {
    googleFetchCount += 1;
    return "@article{google, title={Google Scholar}}";
  };
  scholar.fetchCrossrefBibtexByTitle = async function () {
    return "@article{crossref, title={Crossref Metadata}}";
  };
  scholar.getResultData = function () {
    return {
      title: "Crossref Metadata",
      url: "https://example.org/crossref",
      metadata: "A Author - Journal, 2026",
      snippet: "",
      pdfUrl: "",
      year: "2026",
    };
  };

  const metadataFirstBibtex = await scholar.getReliableBibtexForEntry(
    fakeResult("Crossref Metadata", "https://example.org/crossref"),
    { allowGoogleCitationFetch: false },
  );
  assert.ok(metadataFirstBibtex.includes("@article{crossref"));
  assert.strictEqual(googleFetchCount, 0);

  scholar.fetchGoogleScholarBibtex = originalFetchGoogleScholarBibtex;
  scholar.fetchCrossrefBibtexByTitle = originalFetchCrossrefBibtexByTitle;
  scholar.getResultData = originalGetResultData;

  const originalFetchText = scholar.fetchText;
  const originalAppendVenueRank = scholar.appendVenueRank;
  const originalFetchSearchResultVenue = scholar.fetchSearchResultVenue;
  const originalSetVenueName = scholar.setVenueName;
  const ijcvTitle =
    "Deep learning-based point cloud registration: A comprehensive survey and taxonomy";
  const tpamiTitle = "PathNet: Path-selective point cloud denoising";
  scholar.searchResultVenueCache = new Map();
  scholar.searchResultVenueQueue = Promise.resolve();
  scholar.fetchText = async function (url) {
    assert.ok(String(url).startsWith("https://api.crossref.org/works?"));
    const parsed = new URL(url);
    const queryTitle = parsed.searchParams.get("query.title");
    if (queryTitle === ijcvTitle) {
      return JSON.stringify({
        message: {
          items: [
            {
              title: [ijcvTitle],
              issued: { "date-parts": [[2026]] },
              "container-title": ["International Journal of Computer Vision"],
            },
          ],
        },
      });
    }
    if (queryTitle === tpamiTitle) {
      return JSON.stringify({
        message: {
          items: [
            {
              title: [tpamiTitle],
              issued: { "date-parts": [[2024]] },
              "container-title": [
                "IEEE Transactions on Pattern Analysis and Machine Intelligence",
              ],
            },
          ],
        },
      });
    }
    return JSON.stringify({ message: { items: [] } });
  };

  assert.strictEqual(
    await scholar.fetchSearchResultVenue({
      title: ijcvTitle,
      year: "2026",
      venue: "International Journal of ...",
    }),
    "International Journal of Computer Vision",
  );
  assert.strictEqual(
    await scholar.fetchSearchResultVenue({
      title: tpamiTitle,
      year: "2024",
      venue: "IEEE Transactions on ...",
    }),
    "IEEE Transactions on Pattern Analysis and Machine Intelligence",
  );

  const resolvedEntry = fakeScholarEntry();
  const resolvedVenues = [];
  const displayedVenues = [];
  scholar.fetchSearchResultVenue = async function () {
    return "International Journal of Computer Vision";
  };
  scholar.setVenueName = function (entry, venue) {
    assert.strictEqual(entry, resolvedEntry);
    displayedVenues.push(venue);
  };
  scholar.appendVenueRank = function (_node, venue, entry) {
    assert.strictEqual(entry, resolvedEntry);
    resolvedVenues.push(venue);
    return true;
  };
  assert.strictEqual(
    await scholar.appendResolvedSearchResultVenueRank({}, resolvedEntry, {
      title: ijcvTitle,
      year: "2026",
      venue: "International Journal of ...",
    }),
    true,
  );
  assert.deepStrictEqual(resolvedVenues, [
    "International Journal of Computer Vision",
  ]);
  assert.deepStrictEqual(displayedVenues, [
    "International Journal of Computer Vision",
  ]);

  scholar.fetchText = originalFetchText;
  scholar.appendVenueRank = originalAppendVenueRank;
  scholar.fetchSearchResultVenue = originalFetchSearchResultVenue;
  scholar.setVenueName = originalSetVenueName;
}

runAsyncTests().catch((error) => {
  setTimeout(() => {
    throw error;
  }, 0);
});
