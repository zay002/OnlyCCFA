const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const dataSource = fs.readFileSync("data/authorRankSources.js", "utf8");
const source = fs.readFileSync("js/authorSources.js", "utf8");

const authorSources = vm.runInNewContext(
  `${dataSource}; ${source}; authorSources;`,
  {
    console,
    $() {
      return {
        addClass() {
          return this;
        },
        attr() {
          return this;
        },
        text(value) {
          this.value = value;
          return this;
        },
      };
    },
  },
);

assert.ok(authorSources.getRecords().length > 4000);

const casTags = authorSources.resolveAuthors(["姚期智", "A Researcher"]);
assert.ok(casTags.some((tag) => tag.source === "casAcademician"));

const caeTags = authorSources.resolveAuthors(["倪光南", "A Researcher"]);
assert.ok(caeTags.some((tag) => tag.source === "caeAcademician"));

const dysTags = authorSources.resolveAuthors(["刘涛", "A Researcher"]);
assert.ok(dysTags.some((tag) => tag.source === "distinguishedYoungScholar"));

const dysEnglishTags = authorSources.resolveAuthors(["Ao Bingyun"]);
assert.ok(
  dysEnglishTags.some((tag) => tag.source === "distinguishedYoungScholar"),
);

const englishAliasTags = authorSources.resolveAuthors([
  "Andrew Chi-Chih Yao",
  "A Researcher",
]);
assert.ok(englishAliasTags.some((tag) => tag.source === "casAcademician"));

const officialEnglishTags = authorSources.resolveAuthors(["Ni Guangnan"]);
assert.ok(officialEnglishTags.some((tag) => tag.source === "caeAcademician"));

assert.strictEqual(authorSources.resolveAuthors(["A Yao"]).length, 0);
assert.strictEqual(authorSources.resolveAuthors(["X Wang"]).length, 0);
assert.strictEqual(authorSources.resolveAuthors(["Liu Tao"]).length, 0);
assert.strictEqual(authorSources.resolveAuthors(["Wang Xiaoyun"]).length, 0);

const unknownTags = authorSources.resolveAuthors(["Unknown Person"]);
assert.strictEqual(unknownTags.length, 0);

assert.strictEqual(
  authorSources.getTagText({
    source: "casAcademician",
    matchedName: "姚期智",
  }),
  "中科院院士",
);
