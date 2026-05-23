const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/scholar.js", "utf8");
const scholar = vm.runInNewContext(`${source}; scholar;`, { console });

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
