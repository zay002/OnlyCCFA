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
    removeItem(key) {
      delete storage[key];
    },
  },
  window: {
    location: { hostname: "scholar.google.com", pathname: "/scholar" },
  },
});

function fakeEntry(rankTexts, isVisible = true) {
  return {
    style: {
      display: isVisible ? "" : "none",
    },
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

const relaxedScholarConfig = { ...scholarConfig, hideUnranked: false };
assert.strictEqual(
  filter.shouldShowEntry(fakeEntry([]), "A", relaxedScholarConfig),
  true,
);

const stats = filter.calculateStats([
  fakeEntry(["CCF A"], true),
  fakeEntry(["CCF B"], false),
  fakeEntry([], false),
]);
assert.strictEqual(stats.total, 3);
assert.strictEqual(stats.shown, 1);
assert.strictEqual(stats.hidden, 2);
assert.strictEqual(stats.ranked, 2);
assert.strictEqual(stats.unmatched, 1);

const defaultSettings = filter.loadSettings(scholarConfig);
assert.strictEqual(defaultSettings.defaultFilter, "A");
assert.strictEqual(defaultSettings.hideUnranked, true);

filter.siteConfig = scholarConfig;
filter.saveSettings({ defaultFilter: "B", hideUnranked: false });
const storedSettings = filter.loadSettings(scholarConfig);
assert.strictEqual(storedSettings.defaultFilter, "B");
assert.strictEqual(storedSettings.hideUnranked, false);

storage["onlyccfa:filter:scholar"] = JSON.stringify({
  defaultFilter: "Z",
  hideUnranked: "yes",
});
const invalidSettings = filter.loadSettings(scholarConfig);
assert.strictEqual(invalidSettings.defaultFilter, "A");
assert.strictEqual(invalidSettings.hideUnranked, true);

assert.strictEqual(
  JSON.stringify(
    filter.clampPanelPosition(
      { left: -40, top: 900 },
      { width: 1280, height: 800 },
      { width: 336, height: 420 },
    ),
  ),
  JSON.stringify({ left: 8, top: 372 }),
);

function fakeContainer() {
  return {
    children: [],
    appendChild(child) {
      if (child.parentNode?.children) {
        child.parentNode.children = child.parentNode.children.filter(
          (item) => item !== child,
        );
      }
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
  };
}

function fakeDomEntry(name) {
  return {
    name,
    style: {},
    dataset: {},
    attributes: {},
    setAttribute(key, value) {
      this.attributes[key] = value;
    },
    removeAttribute(key) {
      delete this.attributes[key];
    },
  };
}

const container = fakeContainer();
const hiddenPool = fakeContainer();
const first = fakeDomEntry("first");
const second = fakeDomEntry("second");
const third = fakeDomEntry("third");
container.appendChild(first);
container.appendChild(second);
container.appendChild(third);
filter.hiddenEntriesFragment = hiddenPool;
filter.applyScholarDomFilter(container, [
  { entry: first, shouldShow: true },
  { entry: second, shouldShow: false },
  { entry: third, shouldShow: true },
]);
assert.strictEqual(
  JSON.stringify(container.children.map((entry) => entry.name)),
  JSON.stringify(["first", "third"]),
);
assert.strictEqual(
  JSON.stringify(hiddenPool.children.map((entry) => entry.name)),
  JSON.stringify(["second"]),
);
assert.strictEqual(second.style.display, "none");
assert.strictEqual(second.attributes["aria-hidden"], "true");
assert.strictEqual(second.dataset.onlyccfaFilteredOut, "true");
assert.strictEqual(first.style.display, "");
assert.strictEqual(first.attributes["aria-hidden"], undefined);
