const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const ccfSource = [
  "js/ccf.js",
  "data/ccfRankUrl.js",
  "data/ccfRankAbbr.js",
  "data/ccfRankFull.js",
  "data/ccfFullUrl.js",
  "data/ccfAbbrFull.js",
].map((file) => fs.readFileSync(file, "utf8"));

const rankSource = [
  "data/openRankSources.js",
  "data/journalRankSources.js",
  "data/coreRankSources.js",
  "data/thcplRankSources.js",
  "data/swjtuRankSources.js",
  "js/rankSources.js",
].map((file) => fs.readFileSync(file, "utf8"));

const context = {
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
};

const ccf = vm.runInNewContext(`${ccfSource.join("\n")}; ccf;`, context);
const rankSources = vm.runInNewContext(
  `${rankSource.join("\n")}; rankSources;`,
  context,
);

function ccfRank(venue) {
  const match = ccf.resolveVenueText(venue);
  return match ? ccf.getRankInfo(match.refine, match.type).ranks[0] : null;
}

function rankTags(venue) {
  return rankSources
    .resolveVenueText(venue)
    .map((tag) => `${tag.source}:${tag.value || ""}`);
}

[
  [
    "SMC main conference",
    "IEEE International Conference on Systems, Man, and Cybernetics (SMC)",
    "C",
  ],
  [
    "SMC-IT is not SMC",
    "International Conference on Space Mission Challenges for Information Technology (SMC-IT)",
    null,
  ],
  [
    "CVPR full",
    "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
    "A",
  ],
  ["ICCV full", "International Conference on Computer Vision", "A"],
  ["ECCV full", "European Conference on Computer Vision", "B"],
  [
    "MICCAI hyphen",
    "International Conference on Medical Image Computing and Computer-Assisted Intervention",
    "B",
  ],
  ["arXiv no CCF", "arXiv preprint arXiv:2401.00001", null],
  ["MSSP no CCF", "Mechanical Systems and Signal Processing", null],
].forEach(([name, venue, expected]) => {
  assert.strictEqual(ccfRank(venue), expected, name);
});

[
  [
    "NeurIPS CORE alias",
    "Conference on Neural Information Processing Systems",
    "coreRank:A*",
  ],
  ["ECCV CORE", "European Conference on Computer Vision", "coreRank:A*"],
  ["计算机学报 北大核心", "计算机学报", "pkuCore:"],
  ["计算机学报 CCF中文", "计算机学报", "swjtuCcfChinese:T1"],
  [
    "Applied Sciences warning",
    "Applied Sciences",
    "swjtuGraduateWarning:WARNING",
  ],
  ["US Patent app", "US Patent App.", "patent:"],
  ["Science China short alias", "Sci China Inf Sci", "jcr:Q1"],
].forEach(([name, venue, expectedTag]) => {
  assert.ok(rankTags(venue).includes(expectedTag), name);
});

const scienceChinaTags = rankTags("Science China Information Sciences");
assert.ok(scienceChinaTags.includes("jcr:Q1"));
assert.ok(!scienceChinaTags.some((tag) => tag.startsWith("ei:")));
assert.ok(!scienceChinaTags.some((tag) => tag.startsWith("swjtuJournal:")));
