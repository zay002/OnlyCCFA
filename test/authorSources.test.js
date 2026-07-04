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
assert.ok(
  !authorSources
    .resolveAuthors(["Wang Xiaoyun"])
    .some((tag) => ["casAcademician", "caeAcademician"].includes(tag.source)),
);

const wangXiaoyunCasTags = authorSources.resolveAuthors(["王小云"]);
assert.ok(wangXiaoyunCasTags.some((tag) => tag.source === "casAcademician"));
assert.ok(!wangXiaoyunCasTags.some((tag) => tag.source === "caeAcademician"));

const wangXiaoyunCaeTags = authorSources.resolveAuthors(["王晓云"]);
assert.ok(wangXiaoyunCaeTags.some((tag) => tag.source === "caeAcademician"));
assert.ok(!wangXiaoyunCaeTags.some((tag) => tag.source === "casAcademician"));

const cryptanalysisTags = authorSources.resolveAuthors(["D Feng", "X Wang"], {
  title: "Cryptanalysis of the Hash Functions MD4 and RIPEMD",
  snippet:
    "Cryptanalysis of MD4 and RIPEMD by Dengguo Feng, Xiaoyun Wang, Xuejia Lai, and Hongbo Yu.",
  authors: ["D Feng", "X Wang", "X Lai", "H Yu"],
});
const cryptanalysisCasTag = cryptanalysisTags.find(
  (tag) => tag.source === "casAcademician",
);
assert.ok(cryptanalysisCasTag);
assert.strictEqual(cryptanalysisCasTag.matchedName, "王小云");
assert.ok(cryptanalysisCasTag.confidence >= 80);

const unknownTags = authorSources.resolveAuthors(["Unknown Person"]);
assert.strictEqual(unknownTags.length, 0);

assert.strictEqual(
  authorSources.getTagText({
    source: "casAcademician",
    matchedName: "姚期智",
  }),
  "中科院院士",
);
