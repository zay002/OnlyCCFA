const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;

if (!version) {
  throw new Error("manifest.json does not contain a version.");
}

const packageName = `OnlyCCFA-${version}`;
const distDir = path.join(root, "dist");
const stagingDir = path.join(distDir, packageName);
const zipPath = path.join(distDir, `${packageName}.zip`);

const entries = [
  "_locales",
  "css",
  "data",
  "icon",
  "js",
  "lib",
  "LICENSE",
  "manifest.json",
  "PrivacyPolicy.md",
  "script.js",
];

function removeIfExists(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyEntry(entry) {
  const source = path.join(root, entry);
  const target = path.join(stagingDir, entry);

  if (!fs.existsSync(source)) {
    throw new Error(`Required release entry is missing: ${entry}`);
  }

  fs.cpSync(source, target, {
    recursive: true,
    filter(sourcePath) {
      return !sourcePath.includes(`${path.sep}.DS_Store`);
    },
  });
}

function createZip() {
  if (process.platform === "win32") {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "Compress-Archive -Path * -DestinationPath $env:ONLYCCFA_ZIP -Force",
      ],
      {
        cwd: stagingDir,
        env: {
          ...process.env,
          ONLYCCFA_ZIP: zipPath,
        },
        stdio: "inherit",
      },
    );
    return;
  }

  execFileSync("zip", ["-r", zipPath, "."], {
    cwd: stagingDir,
    stdio: "inherit",
  });
}

function packageRelease() {
  fs.mkdirSync(distDir, { recursive: true });
  removeIfExists(stagingDir);
  removeIfExists(zipPath);
  fs.mkdirSync(stagingDir, { recursive: true });
  entries.forEach(copyEntry);
  createZip();
  removeIfExists(stagingDir);

  const zipSize = fs.statSync(zipPath).size;
  console.log(`Created ${path.relative(root, zipPath)} (${zipSize} bytes)`);
}

if (require.main === module) {
  packageRelease();
}

module.exports = {
  packageRelease,
  releaseEntries: entries,
};
