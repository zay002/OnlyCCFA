const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = [
  "js/ccf.js",
  "data/ccfRankUrl.js",
  "data/ccfRankAbbr.js",
  "data/ccfRankFull.js",
  "data/ccfFullUrl.js",
  "data/ccfAbbrFull.js",
].map((path) => fs.readFileSync(path, "utf8"));

const ccf = vm.runInNewContext(`${source.join("\n")}; ccf;`, { console });

function assertVenueRank(venue, expectedRank) {
  const match = ccf.resolveVenueText(venue);
  assert.ok(match, `Expected a CCF venue match for "${venue}"`);

  const rankInfo = ccf.getRankInfo(match.refine, match.type);
  assert.strictEqual(rankInfo.ranks[0], expectedRank);
}

assertVenueRank("Advances in Neural Information Processing Systems, 2023", "A");
assertVenueRank(
  "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition",
  "A",
);
assertVenueRank("Proceedings of the ACM SIGMOD International Conference", "A");
assertVenueRank("Artificial Intelligence", "A");
assertVenueRank("Engineering Applications of Artificial Intelligence", "C");
assertVenueRank("Signal Processing", "C");
assertVenueRank("MICCAI", "B");
assertVenueRank(
  "International Conference on Medical Image Computing and Computer-Assisted Intervention",
  "B",
);
assertVenueRank(
  "International Conference on Medical Image Computing and Computer-Assisted ...",
  "B",
);
assertVenueRank("IEEE International Conference on Image Processing", "C");
assertVenueRank(
  "Proceedings of the 28th ACM International Conference on Multimedia",
  "A",
);
assertVenueRank(
  "Proceedings of the 30th ACM International Conference on Multimedia, 2022",
  "A",
);
assertVenueRank(
  "Proceedings of the 30th ACM International Conference on Multimedia 2022 dl.acm.org",
  "A",
);
assertVenueRank("ACM Multimedia Asia", "C");
assert.strictEqual(ccf.getRankInfo("ACM Multimedia", "abbr").ranks[0], "A");
assert.strictEqual(
  ccf.getVenueDisplayName("ACM MM", "abbr"),
  "ACM International Conference on Multimedia",
);
assertVenueRank(
  "IEEE International Conference on Systems, Man, and Cybernetics (SMC)",
  "C",
);
assert.strictEqual(
  ccf.resolveVenueText(
    "International Conference on Space Mission Challenges for Information Technology (SMC-IT)",
  ),
  null,
);

const cvprMatch = ccf.resolveVenueText(
  "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition",
);
assert.strictEqual(
  ccf.getVenueDisplayName(cvprMatch.refine, cvprMatch.type),
  "IEEE/CVF Computer Vision and Pattern Recognition Conference",
);

const iccvMatch = ccf.resolveVenueText(
  "International Conference on Computer Vision",
);
assert.strictEqual(
  ccf.getVenueDisplayName(iccvMatch.refine, iccvMatch.type),
  "International Conference on Computer Vision",
);

assert.strictEqual(
  ccf.resolveVenueText("arXiv preprint arXiv:2401.00001"),
  null,
);

assert.strictEqual(
  ccf.resolveVenueText("Mechanical Systems and Signal Processing"),
  null,
);

let ccfLookupCount = 0;
const originalFindAbbrInVenue = ccf.findAbbrInVenue;
const originalFindFullNameInVenue = ccf.findFullNameInVenue;
ccf.findAbbrInVenue = function (...args) {
  ccfLookupCount += 1;
  return originalFindAbbrInVenue.apply(this, args);
};
ccf.findFullNameInVenue = function (...args) {
  ccfLookupCount += 1;
  return originalFindFullNameInVenue.apply(this, args);
};

const firstCachedMatch = ccf.resolveVenueText(
  "IEEE International Conference on Data Mining",
);
const lookupCountAfterFirstResolve = ccfLookupCount;
const secondCachedMatch = ccf.resolveVenueText(
  "IEEE International Conference on Data Mining",
);
assert.deepStrictEqual(secondCachedMatch, firstCachedMatch);
assert.strictEqual(ccfLookupCount, lookupCountAfterFirstResolve);
