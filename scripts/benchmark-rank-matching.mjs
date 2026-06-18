import fs from "node:fs";
import vm from "node:vm";
import { performance } from "node:perf_hooks";

const sourceFiles = [
  "data/openRankSources.js",
  "data/journalRankSources.js",
  "data/coreRankSources.js",
  "data/thcplRankSources.js",
  "data/swjtuRankSources.js",
  "js/rankSources.js",
];

const rankSources = vm.runInNewContext(
  `${sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n")}; rankSources;`,
  { console },
);

const topics = {
  "embodied-ai": [
    "Conference on Neural Information Processing Systems",
    "International Conference on Computer Vision",
    "European Conference on Computer Vision",
    "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
    "International Conference on Learning Representations",
    "Science Robotics",
    "International Journal of Computer Vision",
    "ACM International Conference on Multimedia",
    "Robotics: Science and Systems",
    "Conference on Robot Learning",
  ],
  "wireless-communication": [
    "IEEE INFOCOM",
    "ACM International Conference on Mobile Computing and Networking",
    "IEEE Transactions on Wireless Communications",
    "IEEE Journal on Selected Areas in Communications",
    "IEEE Transactions on Communications",
    "IEEE Wireless Communications Letters",
    "ACM Conference on Applications, Technologies, Architectures, and Protocols for Computer Communication",
    "International Conference on Communications",
    "IEEE Global Communications Conference",
    "Computer Networks",
  ],
  "chinese-core": [
    "计算机学报",
    "软件学报",
    "中国科学：信息科学",
    "电子学报",
    "通信学报",
    "自动化学报",
    "计算机研究与发展",
    "系统工程理论与实践",
    "控制理论与应用",
    "数据采集与处理",
  ],
};

function legacyCandidateCount(db, normalizedVenue) {
  const index = rankSources.getDatabaseIndex(db);
  const candidates = new Set();
  rankSources.getNormalizedTokens(normalizedVenue).forEach((token) => {
    const records = index.byToken.get(token);
    if (records) records.forEach((record) => candidates.add(record));
  });
  return candidates.size;
}

function optimizedCandidateCount(db, normalizedVenue) {
  return rankSources.getCandidateRecords(db, normalizedVenue).length;
}

function candidateCounts(venue) {
  const normalizedVenue = rankSources.normalizeText(venue);
  return rankSources.getDatabases().reduce(
    (sum, db) => ({
      legacy: sum.legacy + legacyCandidateCount(db, normalizedVenue),
      optimized: sum.optimized + optimizedCandidateCount(db, normalizedVenue),
    }),
    { legacy: 0, optimized: 0 },
  );
}

let totalLegacy = 0;
let totalOptimized = 0;
const start = performance.now();

Object.entries(topics).forEach(([topic, venues]) => {
  console.log(`\n# ${topic}`);
  venues.forEach((venue) => {
    const counts = candidateCounts(venue);
    totalLegacy += counts.legacy;
    totalOptimized += counts.optimized;
    const tags = rankSources
      .resolveVenueText(venue)
      .map((tag) => rankSources.getTagText(tag))
      .join(", ");
    console.log(
      `${venue}\n  ${tags || "(no tags)"}\n  candidates ${counts.legacy} -> ${counts.optimized}`,
    );
  });
});

const elapsed = performance.now() - start;
console.log(
  `\nTotal candidates ${totalLegacy} -> ${totalOptimized}; resolved ${Object.values(topics).flat().length} venues in ${elapsed.toFixed(1)}ms.`,
);
