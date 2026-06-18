const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function node(text = "") {
  return {
    textContent: text,
    children: [],
    dataset: {},
    parentElement: null,
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
    },
    insertAdjacentElement(position, child) {
      this.inserted = this.inserted || [];
      this.inserted.push({ position, child });
      child.parentNode = this.parentElement;
      this.parentElement?.children?.push(child);
    },
    querySelector(selector) {
      if (selector === ".onlyccfa-ieee-badges") {
        return (
          this.children.find(
            (child) => child.className === "onlyccfa-ieee-badges",
          ) || null
        );
      }
      if (selector === ".ccf-rank, .rank-source") {
        return (
          this.children.find((child) =>
            /ccf-rank|rank-source/.test(String(child.className || "")),
          ) || null
        );
      }
      if (selector.includes(".publication-title")) {
        return this.venueNode || null;
      }
      if (selector.includes("a[href*='/document/']")) {
        return this.titleNode || null;
      }
      return null;
    },
  };
}

const titleHost = node();
const titleNode = node("A wireless systems paper");
titleNode.parentElement = titleHost;
titleNode.ownerDocument = {
  createElement() {
    return node();
  },
};
const entry = node();
titleHost.parentElement = entry;
entry.titleNode = titleNode;
entry.venueNode = node(
  "IEEE INFOCOM 2025 - IEEE Conference on Computer Communications",
);

const context = {
  console,
  setInterval() {},
  setTimeout(callback) {
    callback();
  },
  clearTimeout() {},
  document: {
    body: {},
    querySelectorAll() {
      return [entry];
    },
    querySelector() {
      return null;
    },
  },
  ccf: {
    resolveVenueText(venue) {
      return /INFOCOM/.test(venue) ? { refine: "INFOCOM", type: "abbr" } : null;
    },
  },
  rankSources: {
    resolveVenueText(venue) {
      return /INFOCOM/.test(venue) ? [{ source: "coreRank", value: "A*" }] : [];
    },
    getTagSpan(tag) {
      return {
        textContent: `${tag.source}:${tag.value}`,
        className: "rank-source",
        nodeType: 1,
      };
    },
  },
};

context.$ = function (host) {
  return {
    append(child) {
      host.children.push(child);
    },
  };
};

const { ieeexplore } = vm.runInNewContext(
  `${fs.readFileSync("js/ieeexplore.js", "utf8")}; ({ ieeexplore });`,
  context,
);

ieeexplore.rankSpanList.push((rank) => ({
  textContent: `CCF ${rank}`,
  className: "ccf-rank",
  nodeType: 1,
}));

assert.strictEqual(
  ieeexplore.extractVenue(
    "In: 2025 IEEE Conference on Computer Communications (INFOCOM)",
  ),
  "2025 IEEE Conference on Computer Communications (INFOCOM)",
);
assert.strictEqual(ieeexplore.appendVenueRank(entry), true);
const badgeRow = entry.querySelector(".onlyccfa-ieee-badges");
assert.ok(badgeRow);
assert.deepStrictEqual(
  badgeRow.children.map((child) => child.textContent),
  ["CCF INFOCOM", "coreRank:A*"],
);
assert.strictEqual(ieeexplore.appendVenueRank(entry), false);
assert.deepStrictEqual(
  badgeRow.children.map((child) => child.textContent),
  ["CCF INFOCOM", "coreRank:A*"],
);
