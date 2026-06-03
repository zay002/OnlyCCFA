const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const dataSource = fs.readFileSync("data/openRankSources.js", "utf8");
const journalSource = fs.readFileSync("data/journalRankSources.js", "utf8");
const swjtuSource = fs.readFileSync("data/swjtuRankSources.js", "utf8");
const source = fs.readFileSync("js/rankSources.js", "utf8");
const swjtuData = vm.runInNewContext(`${swjtuSource}; swjtuRankSources;`);

const rankSources = vm.runInNewContext(
  `${dataSource}; ${journalSource}; ${swjtuSource}; ${source}; rankSources;`,
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

assert.strictEqual(
  rankSources.normalizeText("IEEE/CVF Conference on Computer Vision, 2024"),
  "IEEE CVF CONFERENCE ON COMPUTER VISION",
);

const ieeeTags = rankSources.resolveVenueText("Proceedings of the IEEE, 2023");
assert.ok(ieeeTags.some((tag) => tag.source === "sci"));
assert.ok(ieeeTags.some((tag) => tag.source === "jcr" && tag.value === "Q1"));
assert.ok(ieeeTags.some((tag) => tag.source === "casUpgraded"));
assert.ok(ieeeTags.some((tag) => tag.source === "casTop"));
assert.strictEqual(
  rankSources.getTagText({ source: "casTop", value: "TOP" }),
  "中科院TOP",
);
assert.strictEqual(
  rankSources.getTagText({ source: "jcr", value: "Q1" }),
  "JCRQ1",
);
assert.strictEqual(
  rankSources.getTagText({ source: "swjtuScai", value: "C类" }),
  "西南交大计算机C类",
);

const csurTags = rankSources.resolveVenueText("ACM Computing Surveys, 2025");
assert.ok(csurTags.some((tag) => tag.source === "sci"));
assert.ok(csurTags.some((tag) => tag.source === "jcr" && tag.value === "Q1"));
assert.ok(
  csurTags.some((tag) => tag.source === "casUpgraded" && tag.value === "1区"),
);
assert.ok(csurTags.some((tag) => tag.source === "casTop"));

const artificialIntelligenceTags = rankSources.resolveVenueText(
  "Artificial Intelligence, 2024",
);
assert.ok(
  artificialIntelligenceTags.some(
    (tag) => tag.source === "jcr" && tag.value === "Q2",
  ),
);
assert.ok(
  artificialIntelligenceTags.some(
    (tag) => tag.source === "casUpgraded" && tag.value === "2区",
  ),
);

const cvprTags = rankSources.resolveVenueText(
  "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);
assert.ok(cvprTags.some((tag) => tag.source === "ei"));
assert.ok(!cvprTags.some((tag) => tag.source === "sci"));
assert.ok(!cvprTags.some((tag) => tag.source === "jcr"));
assert.ok(!cvprTags.some((tag) => tag.source === "casUpgraded"));
assert.ok(!cvprTags.some((tag) => tag.source === "swjtuJournal"));

const truncatedCvprProceedingsTags = rankSources.resolveVenueText(
  "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern ...",
);
assert.ok(!truncatedCvprProceedingsTags.some((tag) => tag.source === "sci"));
assert.ok(!truncatedCvprProceedingsTags.some((tag) => tag.source === "jcr"));
assert.ok(
  !truncatedCvprProceedingsTags.some(
    (tag) => tag.source === "casUpgraded" || tag.source === "casTop",
  ),
);

const corlTags = rankSources.resolveVenueText("Conference on Robot Learning");
assert.ok(corlTags.some((tag) => tag.source === "roboticsTop"));
assert.ok(!corlTags.some((tag) => tag.source === "jcr"));

const twcTags = rankSources.resolveVenueText(
  "IEEE Transactions on Wireless Communications",
);
assert.ok(twcTags.some((tag) => tag.source === "commTop"));
assert.ok(twcTags.some((tag) => tag.source === "jcr" && tag.value === "Q1"));

const tpelTags = rankSources.resolveVenueText(
  "IEEE Transactions on Power Electronics",
);
assert.ok(tpelTags.some((tag) => tag.source === "eeTop"));

const tacTags = rankSources.resolveVenueText("Proceedings of TAC 2026");
assert.ok(tacTags.some((tag) => tag.source === "controlTop"));

const cnTags = rankSources.resolveVenueText("计算机学报");
assert.ok(cnTags.some((tag) => tag.source === "pkuCore"));
assert.ok(cnTags.some((tag) => tag.source === "cscd"));

const natureTags = rankSources.resolveVenueText("Nature");
assert.ok(
  natureTags.some(
    (tag) => tag.source === "swjtuJournal" && tag.value === "T类",
  ),
);
assert.ok(
  !rankSources
    .resolveVenueText("Nature Methods")
    .some((tag) => tag.source === "swjtuJournal" && tag.value === "T类"),
);

const computerJournalTags = rankSources.resolveVenueText("Computer Journal");
assert.ok(
  computerJournalTags.some(
    (tag) => tag.source === "swjtuScai" && tag.value === "C类",
  ),
);
assert.ok(
  computerJournalTags.some((tag) => tag.matchedTitle === "Computer Journal"),
);

const duplicatedSchoolTags = rankSources
  .resolveVenueText("系统工程理论与实践")
  .filter((tag) => ["swjtuJournal", "swjtuScai"].includes(tag.source));
assert.strictEqual(
  JSON.stringify(
    duplicatedSchoolTags.map((tag) => `${tag.source}:${tag.value}`),
  ),
  JSON.stringify(["swjtuJournal:A类"]),
);

assert.strictEqual(
  rankSources
    .resolveVenueText("IEEE Transactions")
    .some((tag) => tag.source.startsWith("swjtu")),
  false,
);

const swjtuJournalValues = new Set();
swjtuData.records.forEach((record) => {
  (record.tags || []).forEach((tag) => {
    if (tag.source === "swjtuJournal") {
      swjtuJournalValues.add(tag.value);
    }
  });
});
assert.deepStrictEqual(Array.from(swjtuJournalValues).sort(), [
  "A类",
  "B类",
  "T类",
]);

const transportTags = rankSources.resolveVenueText(
  "IEEE Transactions on Intelligent Transportation Systems",
);
assert.ok(
  transportTags.some(
    (tag) => tag.source === "swjtuTransport" && tag.value === "重点",
  ),
);

assert.strictEqual(rankSources.resolveVenueText("Unknown Venue").length, 0);
assert.strictEqual(
  rankSources.resolveVenueText("An attack on control systems").length,
  0,
);
assert.strictEqual(
  rankSources.resolveVenueText("A practical tie-breaking method").length,
  0,
);
assert.strictEqual(rankSources.resolveVenueText("IEEE").length, 0);
