const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/fetchRank.js", "utf8");

const appended = [];
const context = {
  console,
  apiCache: {},
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

const { fetchFromCache } = vm.runInNewContext(
  `${source}; ({ fetchFromCache });`,
  context,
);

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
};

fetchFromCache(
  {
    dblp_url: "/journals/pami/pami",
    resp: { hit: [{ info: {} }] },
    flag: true,
  },
  {},
  "A TPAMI paper",
  "Author",
  "2025",
  site,
);

assert.ok(appended.some((badge) => badge.type === "ccf-rank"));
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
