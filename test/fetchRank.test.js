const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/fetchRank.js", "utf8");

const appended = [];
const context = {
  console,
  apiCache: {
    setItem() {},
  },
  ccf: {
    rankFullName: {
      "/journals/pami/pami":
        "IEEE Transactions on Pattern Analysis and Machine Intelligence",
    },
  },
  rankSources: {
    resolveVenueText(venue) {
      assert.strictEqual(
        venue,
        "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      );
      return [
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casUpgraded", value: "1区" },
        { source: "casTop", value: "TOP" },
      ];
    },
    getTagSpan(tag) {
      return { type: "rank-source", tag };
    },
  },
};

context.$ = function () {
  return {};
};

const { fetchFromCache, fetchFromDblpApi } = vm.runInNewContext(
  `${source}; ({ fetchFromCache, fetchFromDblpApi });`,
  context,
);

const tpamiNode = {};
const tpamiEntry = {};
const venueNames = [];
const site = {
  rankSpanList: [
    function (dblpUrl, type) {
      assert.strictEqual(dblpUrl, "/journals/pami/pami");
      assert.strictEqual(type, "url");
      return { type: "ccf-rank", dblpUrl };
    },
  ],
  appendRankBadge(_node, badge) {
    appended.push(badge);
  },
  getEntryFromRankAnchor(node) {
    assert.strictEqual(node, tpamiNode);
    return tpamiEntry;
  },
  setVenueName(entry, venueName) {
    assert.strictEqual(entry, tpamiEntry);
    venueNames.push(venueName);
  },
};

fetchFromCache(
  {
    dblp_url: "/journals/pami/pami",
    resp: { hit: [{ info: {} }] },
    flag: true,
  },
  tpamiNode,
  "A TPAMI paper",
  "Author",
  "2025",
  site,
);

assert.ok(appended.some((badge) => badge.type === "ccf-rank"));
assert.deepStrictEqual(venueNames, [
  "IEEE Transactions on Pattern Analysis and Machine Intelligence",
]);
assert.ok(
  appended.some(
    (badge) =>
      badge.type === "rank-source" &&
      badge.tag.source === "jcr" &&
      badge.tag.value === "Q1",
  ),
);
assert.ok(
  appended.some(
    (badge) =>
      badge.type === "rank-source" &&
      badge.tag.source === "casUpgraded" &&
      badge.tag.value === "1区",
  ),
);
assert.ok(appended.some((badge) => badge.tag?.source === "casTop"));

function withFakeXhr(responseText, status = 200) {
  context.XMLHttpRequest = function () {
    return {
      readyState: 0,
      status,
      responseText,
      open() {},
      send() {
        this.readyState = 4;
        this.onreadystatechange();
      },
    };
  };
}

withFakeXhr("<!DOCTYPE html><title>dblp: error</title>", 500);
assert.doesNotThrow(() => {
  fetchFromDblpApi(
    "https://dblp.org/search/publ/api?q=broken",
    {},
    "Broken title",
    "Author",
    "2026",
    site,
  );
});

const appendedAfterError = appended.length;
context.ccf.rankDb = {};
withFakeXhr(
  JSON.stringify({
    result: { hits: { "@total": 0, "@sent": 0, hit: [] } },
  }),
);
fetchFromDblpApi(
  "https://dblp.org/search/publ/api?q=no-hit",
  {},
  "No hit title",
  "Author",
  "2026",
  site,
);
assert.strictEqual(appended.length, appendedAfterError);

const integrationSource = [
  "js/ccf.js",
  "data/ccfRankUrl.js",
  "data/ccfRankAbbr.js",
  "data/ccfRankFull.js",
  "data/ccfFullUrl.js",
  "data/ccfAbbrFull.js",
  "data/coreRankSources.js",
  "data/thcplRankSources.js",
  "data/swjtuRankSources.js",
  "js/rankSources.js",
  "js/fetchRank.js",
].map((path) => fs.readFileSync(path, "utf8"));
const integrationFilter = {
  count: 0,
  applyFilter() {
    this.count += 1;
  },
};
const integrationContext = {
  console,
  apiCache: {
    setItem() {},
  },
  filter: integrationFilter,
  $(tagName) {
    return {
      tagName,
      classes: [],
      attrs: {},
      children: [],
      addClass(className) {
        this.classes.push(className);
        return this;
      },
      attr(name, value) {
        this.attrs[name] = value;
        return this;
      },
      text(value) {
        this.textContent = value;
        return this;
      },
      append(child) {
        this.children.push(child);
        return this;
      },
    };
  },
};
const integration = vm.runInNewContext(
  `${integrationSource.join("\n")}; ({ fetchFromCache, ccf, rankSources });`,
  integrationContext,
);
const acmMmAppended = [];
const acmMmEntry = {};
const acmMmVenueNames = [];
integration.fetchFromCache(
  {
    resp: {
      hit: [
        {
          info: {
            venue: "ACM Multimedia",
          },
        },
      ],
    },
    flag: true,
  },
  {},
  "You Only Hypothesize Once: Point Cloud Registration with Rotation-equivariant Descriptors.",
  "Wang",
  "2022",
  {
    rankSpanList: [
      function (refine, type) {
        return integration.ccf.getRankSpan(refine, type);
      },
    ],
    appendRankBadge(_node, badge) {
      acmMmAppended.push(badge);
    },
    getEntryFromRankAnchor() {
      return acmMmEntry;
    },
    setVenueName(entry, venueName) {
      assert.strictEqual(entry, acmMmEntry);
      acmMmVenueNames.push(venueName);
    },
  },
);
assert.deepStrictEqual(acmMmVenueNames, [
  "ACM International Conference on Multimedia",
]);
assert.strictEqual(integrationFilter.count, 1);
assert.ok(
  acmMmAppended.some((badge) => badge.attrs?.["data-rank-value"] === "CCF A"),
);
assert.ok(
  !acmMmAppended.some((badge) => badge.attrs?.["data-rank-value"] === "CCF C"),
);
assert.ok(
  acmMmAppended.some(
    (badge) =>
      badge.attrs?.["data-rank-source"] === "coreRank" &&
      badge.attrs?.["data-rank-value"] === "A*",
  ),
);
assert.ok(
  acmMmAppended.some(
    (badge) =>
      badge.attrs?.["data-rank-source"] === "thcpl" &&
      badge.attrs?.["data-rank-value"] === "A",
  ),
);
assert.ok(
  acmMmAppended.some(
    (badge) =>
      badge.attrs?.["data-rank-source"] === "swjtuJournal" &&
      badge.attrs?.["data-rank-value"] === "A类",
  ),
);
