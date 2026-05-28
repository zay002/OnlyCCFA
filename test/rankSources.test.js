const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const dataSource = fs.readFileSync("data/openRankSources.js", "utf8");
const source = fs.readFileSync("js/rankSources.js", "utf8");

const rankSources = vm.runInNewContext(
  `${dataSource}; ${source}; rankSources;`,
  {
    console,
    $() {
      return {
        addClass() {
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
assert.ok(ieeeTags.some((tag) => tag.source === "casUpgraded"));
assert.ok(ieeeTags.some((tag) => tag.source === "casTop"));

const cvprTags = rankSources.resolveVenueText(
  "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);
assert.ok(cvprTags.some((tag) => tag.source === "ei"));

const cnTags = rankSources.resolveVenueText("计算机学报");
assert.ok(cnTags.some((tag) => tag.source === "pkuCore"));
assert.ok(cnTags.some((tag) => tag.source === "cscd"));

assert.strictEqual(rankSources.resolveVenueText("Unknown Venue").length, 0);
