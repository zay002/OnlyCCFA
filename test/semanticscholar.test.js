const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = ["js/bibtex.js", "js/scholar.js", "js/semanticscholar.js"].map(
  (path) => fs.readFileSync(path, "utf8"),
);
const context = {
  console,
  URL,
  URLSearchParams,
  setInterval() {},
  setTimeout(callback) {
    callback();
  },
};
context.$ = function (node) {
  return {
    append(child) {
      node.children = node.children || [];
      node.children.push(child);
      child.parentNode = node;
    },
  };
};
context.document = {
  entries: [],
  body: {},
  createElement(tagName) {
    return {
      tagName,
      className: "",
      children: [],
      textContent: "",
      insertAdjacentElement(position, node) {
        this.inserted = this.inserted || [];
        this.inserted.push({ position, node });
      },
      querySelectorAll(selector) {
        if (selector === ".ccf-rank") {
          return this.children.filter((child) =>
            String(child.className || "").includes("ccf-rank"),
          );
        }
        return [];
      },
    };
  },
  addEventListener() {},
  querySelectorAll() {
    return this.entries;
  },
  querySelector() {
    return null;
  },
};
context.ccf = {
  resolveVenueText(venue) {
    return venue === "CVPR" ? { refine: "CVPR", type: "abbr" } : null;
  },
  getVenueDisplayName() {
    return "IEEE/CVF Conference on Computer Vision and Pattern Recognition";
  },
};
context.fetchRank = function () {};

const { scholar, semanticscholar } = vm.runInNewContext(
  `${source.join("\n")}; ({ scholar, semanticscholar });`,
  context,
);

assert.strictEqual(
  semanticscholar.normalizeVenueText(
    "Computer Vision and Pattern Recognition (CVPR) 2024",
  ),
  "CVPR",
);

assert.strictEqual(
  semanticscholar.normalizeVenueText(
    "IEEE International Conference on Robotics and Automation '24",
  ),
  "IEEE International Conference on Robotics and Automation",
);

function fakeNode(textContent, href = "") {
  return {
    textContent,
    href,
    getAttribute(name) {
      if (name === "href") {
        return href;
      }
      return "";
    },
  };
}

function fakeSemanticEntry() {
  const nodes = {
    title: fakeNode(
      "Segment Anything",
      "https://www.semanticscholar.org/paper/abc",
    ),
    venue: fakeNode("International Conference on Computer Vision (ICCV)"),
    year: fakeNode("2023"),
    snippet: fakeNode("A foundation model for promptable segmentation."),
    pdf: fakeNode("PDF", "https://arxiv.org/pdf/2304.02643.pdf"),
  };
  const authors = [fakeNode("Alexander Kirillov"), fakeNode("Eric Mintun")];

  return {
    querySelector(selector) {
      if (/venue/i.test(selector)) {
        return nodes.venue;
      }
      if (/year/i.test(selector)) {
        return nodes.year;
      }
      if (/title/i.test(selector) && /a/.test(selector)) {
        return nodes.title;
      }
      if (/abstract|snippet|tldr/i.test(selector)) {
        return nodes.snippet;
      }
      if (/pdf/i.test(selector)) {
        return nodes.pdf;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (/author/i.test(selector)) {
        return authors;
      }
      if (selector === "a") {
        return [nodes.title, nodes.pdf];
      }
      return [];
    },
  };
}

function fakeClassList() {
  const values = new Set();
  return {
    add(value) {
      values.add(value);
    },
    contains(value) {
      return values.has(value);
    },
  };
}

function fakeRankedSemanticEntry() {
  const entry = {
    dataset: {},
    rankHost: null,
    actionHost: null,
    classList: fakeClassList(),
  };
  const titleHost = {
    insertAdjacentElement(position, node) {
      if (node.className === "onlyccfa-rank-badges") {
        entry.rankHost = node;
      } else if (node.className === "onlyccfa-result-actions") {
        entry.actionHost = node;
      }
      node.parentNode = entry;
      assert.strictEqual(position, "afterend");
    },
  };
  const title = {
    textContent: "So-net: Self-organizing network for point cloud analysis",
    href: "https://www.semanticscholar.org/paper/example",
    closest(selector) {
      return selector === "h2,h3" ? titleHost : null;
    },
  };
  const venue = {
    textContent: "",
  };

  entry.querySelector = function (selector) {
    if (selector === ".onlyccfa-result-actions") {
      return entry.actionHost;
    }
    if (selector === ".onlyccfa-rank-badges") {
      return entry.rankHost;
    }
    if (selector === ".onlyccfa-venue-name") {
      return null;
    }
    if (/venue/i.test(selector)) {
      return venue;
    }
    if (/title/i.test(selector) && /a/.test(selector)) {
      return title;
    }
    return null;
  };
  entry.querySelectorAll = function (selector) {
    if (selector === ".ccf-rank") {
      return entry.rankHost?.querySelectorAll(".ccf-rank") || [];
    }
    if (selector === ".ccf-rank, .rank-source") {
      return entry.querySelectorAll(".ccf-rank");
    }
    return [];
  };
  return { entry, venue };
}

const resultData = semanticscholar.getResultData(fakeSemanticEntry());
assert.strictEqual(resultData.title, "Segment Anything");
assert.strictEqual(resultData.year, "2023");
assert.strictEqual(resultData.venue, "ICCV");
assert.strictEqual(
  JSON.stringify(resultData.authors),
  JSON.stringify(["Alexander Kirillov", "Eric Mintun"]),
);
assert.strictEqual(resultData.pdfUrl, "https://arxiv.org/pdf/2304.02643.pdf");

const dynamicVenueEntry = fakeRankedSemanticEntry();
context.document.entries = [dynamicVenueEntry.entry];
semanticscholar.rankSpanList = [
  function () {
    return {
      className: "ccf-rank",
      textContent: "CCF A",
    };
  },
];
semanticscholar.appendRanks();
assert.strictEqual(
  dynamicVenueEntry.entry.classList.contains("ccf-ranked"),
  false,
);

dynamicVenueEntry.venue.textContent =
  "Computer Vision and Pattern Recognition (CVPR) 2018";
semanticscholar.appendRanks();
assert.strictEqual(
  dynamicVenueEntry.entry.classList.contains("ccf-ranked"),
  true,
);
assert.strictEqual(
  dynamicVenueEntry.entry.querySelectorAll(".ccf-rank")[0].textContent,
  "CCF A",
);

async function runAsyncTests() {
  let googleFetchCount = 0;
  let crossrefTitle = "";
  scholar.fetchGoogleScholarBibtex = async function () {
    googleFetchCount += 1;
    return "@article{google, title={Google Scholar}}";
  };
  scholar.fetchCrossrefBibtexByTitle = async function (title) {
    crossrefTitle = title;
    return "@inproceedings{kirillov2023segment, title={Segment Anything}}";
  };
  scholar.fetchArxivBibtexById = async function () {
    return "";
  };

  const bibtex =
    await semanticscholar.getReliableBibtexForEntry(fakeSemanticEntry());
  assert.ok(bibtex.includes("@inproceedings{kirillov2023segment"));
  assert.strictEqual(crossrefTitle, "Segment Anything");
  assert.strictEqual(googleFetchCount, 0);
}

runAsyncTests().catch((error) => {
  setTimeout(() => {
    throw error;
  }, 0);
});
