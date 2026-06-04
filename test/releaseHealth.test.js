const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
let checkReleaseHealth;

try {
  ({ checkReleaseHealth } = require("../scripts/check-release-health"));
} catch (error) {
  assert.fail(
    `Expected scripts/check-release-health.js to export checkReleaseHealth: ${error.message}`,
  );
}

const result = checkReleaseHealth(root);

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(
  result.summary.manifestVersion,
  result.summary.packageVersion,
);
assert.ok(result.summary.contentScriptFiles > 20);
assert.ok(result.summary.releaseEntries.includes("manifest.json"));
assert.ok(result.summary.releaseEntries.includes("script.js"));

assert.ok(result.summary.dataSources.journalRankSources.records > 20000);
assert.ok(result.summary.dataSources.authorRankSources.records > 4000);
assert.ok(result.summary.dataSources.swjtuRankSources.records > 1000);
