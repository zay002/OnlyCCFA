const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const i18nSource = fs.readFileSync("js/i18n.js", "utf8");
const source = fs.readFileSync("js/filter.js", "utf8");
const storage = {};
const filter = vm.runInNewContext(`${i18nSource}; ${source}; filter;`, {
  console,
  document: {},
  localStorage: {
    getItem(key) {
      return storage[key] || null;
    },
    setItem(key, value) {
      storage[key] = value;
    },
  },
  window: {
    location: { hostname: "scholar.google.com", pathname: "/scholar" },
  },
});

function node(text, attrs = {}) {
  return {
    textContent: text,
    className: (attrs.classes || []).join(" "),
    dataset: attrs.dataset || {},
    classList: {
      contains(className) {
        return (attrs.classes || []).includes(className);
      },
    },
  };
}

function entry(nodes) {
  return {
    style: { display: "" },
    querySelector(selector) {
      if (selector === ".ccf-rank.ccf-p") {
        return this.querySelectorAll(".ccf-rank").find((badge) =>
          badge.classList.contains("ccf-p"),
        );
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".ccf-rank") {
        return nodes
          .filter((item) => item.kind === "ccf")
          .map((item) => item.node);
      }
      if (selector === ".rank-source") {
        return nodes
          .filter((item) => item.kind === "source")
          .map((item) => item.node);
      }
      return [];
    },
  };
}

const richEntry = entry([
  { kind: "ccf", node: node("CCF A") },
  {
    kind: "source",
    node: node("JCRQ1", { dataset: { rankSource: "jcr", rankValue: "Q1" } }),
  },
  {
    kind: "source",
    node: node("机器人方向TOP", {
      dataset: { rankSource: "roboticsTop", rankValue: "" },
    }),
  },
  {
    kind: "source",
    node: node("CORE A*", {
      dataset: { rankSource: "coreRank", rankValue: "A*" },
    }),
  },
  {
    kind: "source",
    node: node("西南交大SCAI·C类", {
      dataset: { rankSource: "swjtuScai", rankValue: "C类" },
    }),
  },
  {
    kind: "source",
    node: node("国家杰青", {
      dataset: { rankSource: "distinguishedYoungScholar", rankValue: "" },
    }),
  },
  {
    kind: "source",
    node: node("中科院院士", {
      dataset: { rankSource: "casAcademician", rankValue: "" },
    }),
  },
]);
const ccfAOnlyEntry = entry([{ kind: "ccf", node: node("CCF A") }]);
const eiOnlyEntry = entry([
  {
    kind: "source",
    node: node("EI", { dataset: { rankSource: "ei", rankValue: "" } }),
  },
]);

assert.strictEqual(
  JSON.stringify(filter.getEntryRanks(richEntry)),
  JSON.stringify(["A"]),
);
assert.ok(filter.getEntrySignalIds(richEntry).includes("ccfA"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("jcrQ1"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("roboticsTop"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("coreRank"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("swjtuScai"));
assert.ok(
  filter.getEntrySignalIds(richEntry).includes("distinguishedYoungScholar"),
);
assert.ok(filter.getEntrySignalIds(richEntry).includes("casAcademician"));

const config = filter.getSiteConfig("scholar.google.com", "/scholar");
const preprintBadge = node("PreprintarXiv: Preprint", {
  classes: ["ccf-rank", "ccf-p"],
  dataset: { rankSource: "ccf", rankValue: "Preprint" },
});
const preprintEntry = entry([
  { kind: "ccf", node: node("CCF A") },
  { kind: "ccf", node: preprintBadge },
]);
assert.deepStrictEqual(Array.from(filter.getBadgeSignalIds(preprintBadge)), [
  "preprint",
]);
const preprintAndCcf = {
  currentFilter: "A",
  siteConfig: config,
  selectedSignals: ["preprint"],
  signalMode: "all",
};
assert.strictEqual(filter.shouldShowEntry(preprintEntry, preprintAndCcf), true);
assert.strictEqual(
  filter.shouldShowEntry(ccfAOnlyEntry, preprintAndCcf),
  false,
);
assert.strictEqual(
  filter.shouldShowEntry(ccfAOnlyEntry, {
    ...preprintAndCcf,
    signalMode: "any",
  }),
  true,
);
assert.strictEqual(
  filter.shouldShowEntry(richEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedSignals: ["jcrQ1", "roboticsTop"],
    signalMode: "all",
  }),
  true,
);
assert.strictEqual(
  filter.shouldShowEntry(ccfAOnlyEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedRanks: ["A"],
    selectedSignals: ["ei"],
    signalMode: "any",
  }),
  true,
);
assert.strictEqual(
  filter.shouldShowEntry(eiOnlyEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedRanks: ["A"],
    selectedSignals: ["ei"],
    signalMode: "any",
  }),
  true,
);
assert.strictEqual(
  filter.shouldShowEntry(ccfAOnlyEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedRanks: ["A"],
    selectedSignals: ["ei"],
    signalMode: "all",
  }),
  false,
);
assert.strictEqual(
  filter.shouldShowEntry(richEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedSignals: ["casTop"],
    signalMode: "any",
  }),
  true,
);
assert.strictEqual(
  filter.shouldShowEntry(richEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedSignals: ["casTop"],
    signalMode: "all",
  }),
  false,
);
assert.strictEqual(
  filter.shouldShowEntry(richEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedSignals: ["distinguishedYoungScholar", "caeAcademician"],
    signalMode: "any",
  }),
  true,
);
