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
  pages: "12--24",
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
assert.ok(entry.includes("pages = {12--24}"));
assert.ok(entry.includes("url = {https://example.com/paper}"));
assert.ok(!entry.includes("keywords ="));

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
assert.strictEqual(zoteroItem.pages, "12--24");
assert.ok(zoteroItem.tags.some((tag) => tag.tag === "Deep Filter"));
assert.ok(!zoteroItem.tags.some((tag) => tag.tag === "机器人方向TOP"));

const parsed = bibtex.parseEntry(`@article{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki},
  journal={Advances in neural information processing systems},
  volume={30},
  pages={5998--6008},
  year={2017}
}`);
assert.strictEqual(parsed.type, "article");
assert.strictEqual(parsed.fields.title, "Attention is all you need");
assert.strictEqual(
  parsed.fields.author,
  "Vaswani, Ashish and Shazeer, Noam and Parmar, Niki",
);
assert.strictEqual(parsed.fields.pages, "5998--6008");

const zoteroFromBibtex = bibtex.toZoteroItemFromBibtex(
  `@article{vaswani2017attention,
    title={Attention is all you need},
    author={Vaswani, Ashish and Shazeer, Noam},
    journal={Advances in neural information processing systems},
    pages={5998--6008},
    year={2017}
  }`,
  "Transformer",
);
assert.strictEqual(zoteroFromBibtex.itemType, "journalArticle");
assert.strictEqual(
  zoteroFromBibtex.publicationTitle,
  "Advances in neural information processing systems",
);
assert.strictEqual(zoteroFromBibtex.creators[0].lastName, "Vaswani");
assert.strictEqual(zoteroFromBibtex.creators[0].firstName, "Ashish");
assert.strictEqual(zoteroFromBibtex.pages, "5998--6008");
assert.ok(zoteroFromBibtex.tags.some((tag) => tag.tag === "Transformer"));
