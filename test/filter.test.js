const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/filter.js", "utf8");
const filter = vm.runInNewContext(`${source}; filter;`, {
  console,
  document: {},
  window: {
    location: { hostname: "scholar.google.com", pathname: "/scholar" },
  },
});

function fakeEntry(rankTexts) {
  return {
    querySelectorAll(selector) {
      if (selector !== ".ccf-rank") {
        return [];
      }
      return rankTexts.map((text) => ({ textContent: text }));
    },
  };
}

const scholarConfig = filter.getSiteConfig("scholar.google.com", "/scholar");
assert.strictEqual(scholarConfig.defaultFilter, "A");
assert.strictEqual(scholarConfig.entrySelector, "#gs_res_ccl_mid > div");
assert.strictEqual(scholarConfig.hideUnranked, true);
assert.strictEqual(
  filter.getSiteConfig("scholar.google.com", "/citations"),
  null,
);

const dblpConfig = filter.getSiteConfig("dblp.org", "/search");
assert.strictEqual(dblpConfig.defaultFilter, "ALL");
assert.strictEqual(dblpConfig.hideUnranked, false);

assert.strictEqual(
  filter.shouldShowEntry(fakeEntry(["CCF A"]), "A", scholarConfig),
  true,
);
assert.strictEqual(
  filter.shouldShowEntry(fakeEntry(["CCF B"]), "A", scholarConfig),
  false,
);
assert.strictEqual(
  filter.shouldShowEntry(fakeEntry([]), "A", scholarConfig),
  false,
);
assert.strictEqual(
  filter.shouldShowEntry(fakeEntry(["CCF B"]), "ALL", scholarConfig),
  true,
);
