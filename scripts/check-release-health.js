const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { releaseEntries } = require("./package-release");

const dataSourceChecks = [
  {
    globalName: "journalRankSources",
    relativePath: "data/journalRankSources.js",
    minRecords: 20000,
  },
  {
    globalName: "authorRankSources",
    relativePath: "data/authorRankSources.js",
    minRecords: 4000,
    requiredSources: [
      "distinguishedYoungScholar",
      "casAcademician",
      "caeAcademician",
    ],
  },
  {
    globalName: "swjtuRankSources",
    relativePath: "data/swjtuRankSources.js",
    minRecords: 1000,
    requiredSources: ["swjtuJournal", "swjtuScai", "swjtuTransport"],
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileExists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function collectContentScriptFiles(manifest) {
  return (manifest.content_scripts || []).flatMap((script) =>
    (script.css || []).concat(script.js || []),
  );
}

function loadDataSource(root, check) {
  const filePath = path.join(root, check.relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  return vm.runInNewContext(
    `${source}; ${check.globalName};`,
    {},
    {
      filename: filePath,
    },
  );
}

function checkDataSource(root, check, errors) {
  if (!fileExists(root, check.relativePath)) {
    errors.push(`Missing data source: ${check.relativePath}`);
    return { records: 0 };
  }

  let data;
  try {
    data = loadDataSource(root, check);
  } catch (error) {
    errors.push(`Cannot load ${check.relativePath}: ${error.message}`);
    return { records: 0 };
  }

  const records = Array.isArray(data?.records) ? data.records.length : 0;
  if (records < check.minRecords) {
    errors.push(
      `${check.globalName} has ${records} records; expected at least ${check.minRecords}`,
    );
  }

  (check.requiredSources || []).forEach((source) => {
    if (!data?.sources?.[source]) {
      errors.push(`${check.globalName} is missing source "${source}"`);
    }
  });

  return { records };
}

function checkReleaseHealth(root = path.resolve(__dirname, "..")) {
  const errors = [];
  const manifestPath = path.join(root, "manifest.json");
  const packagePath = path.join(root, "package.json");
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);

  if (manifest.version !== packageJson.version) {
    errors.push(
      `Version mismatch: manifest.json ${manifest.version}, package.json ${packageJson.version}`,
    );
  }

  const contentScriptFiles = collectContentScriptFiles(manifest);
  contentScriptFiles.forEach((relativePath) => {
    if (!fileExists(root, relativePath)) {
      errors.push(`Missing content script asset: ${relativePath}`);
    }
  });

  if (
    manifest.background?.service_worker &&
    !fileExists(root, manifest.background.service_worker)
  ) {
    errors.push(
      `Missing background service worker: ${manifest.background.service_worker}`,
    );
  }

  releaseEntries.forEach((entry) => {
    if (!fileExists(root, entry)) {
      errors.push(`Missing release entry: ${entry}`);
    }
  });

  const dataSources = {};
  dataSourceChecks.forEach((check) => {
    dataSources[check.globalName] = checkDataSource(root, check, errors);
  });

  return {
    errors,
    summary: {
      manifestVersion: manifest.version,
      packageVersion: packageJson.version,
      contentScriptFiles: contentScriptFiles.length,
      releaseEntries,
      dataSources,
    },
  };
}

if (require.main === module) {
  const result = checkReleaseHealth();
  if (result.errors.length > 0) {
    console.error("Release health check failed:");
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(
      `Release health OK: ${result.summary.contentScriptFiles} content assets, ${result.summary.releaseEntries.length} release entries.`,
    );
  }
}

module.exports = {
  checkReleaseHealth,
};
