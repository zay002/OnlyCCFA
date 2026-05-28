const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("js/bibtex.js", "utf8");
const bibtex = vm.runInNewContext(`${source}; onlyccfaBibtex;`, { console });

const item = {
  title: "Deep Scholar Filtering for Robot Learning",
  authors: ["Zhaoyang Li", "A. Researcher"],
  year: "2026",
  venue: "Conference on Robot Learning",
  url: "https://example.com/paper",
  tags: ["OnlyCCFA", "机器人方向TOP"],
};

const entry = bibtex.buildEntry(item);
assert.ok(entry.includes("@inproceedings{li2026deep"));
assert.ok(
  entry.includes("title = {Deep Scholar Filtering for Robot Learning}"),
);
assert.ok(entry.includes("author = {Zhaoyang Li and A. Researcher}"));
assert.ok(entry.includes("booktitle = {Conference on Robot Learning}"));
assert.ok(entry.includes("year = {2026}"));
assert.ok(entry.includes("url = {https://example.com/paper}"));
assert.ok(entry.includes("keywords = {OnlyCCFA, 机器人方向TOP}"));

assert.strictEqual(
  bibtex.buildKey({
    title: "A Practical Study of 6G Semantic Communication",
    authors: ["Ming Zhang"],
    year: "2025",
  }),
  "zhang2025practical",
);

const zoteroItem = bibtex.toZoteroItem(item, "Deep Filter");
assert.strictEqual(zoteroItem.itemType, "conferencePaper");
assert.strictEqual(zoteroItem.title, item.title);
assert.strictEqual(zoteroItem.creators[0].lastName, "Li");
assert.ok(zoteroItem.tags.some((tag) => tag.tag === "Deep Filter"));
