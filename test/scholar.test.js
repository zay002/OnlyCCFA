const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/scholar.js", "utf8");
const scholar = vm.runInNewContext(`${source}; scholar;`, { console, URL });

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
