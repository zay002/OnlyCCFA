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

assert.strictEqual(
  JSON.stringify(filter.getEntryRanks(richEntry)),
  JSON.stringify(["A"]),
);
assert.ok(filter.getEntrySignalIds(richEntry).includes("ccfA"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("jcrQ1"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("roboticsTop"));
assert.ok(filter.getEntrySignalIds(richEntry).includes("swjtuScai"));
assert.ok(
  filter.getEntrySignalIds(richEntry).includes("distinguishedYoungScholar"),
);
assert.ok(filter.getEntrySignalIds(richEntry).includes("casAcademician"));

const config = filter.getSiteConfig("scholar.google.com", "/scholar");
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
  filter.shouldShowEntry(richEntry, {
    currentFilter: "A",
    siteConfig: config,
    selectedSignals: ["casTop"],
    signalMode: "any",
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
