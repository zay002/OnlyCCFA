const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "store-listing", "store-assets.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);

const outputDir = path.join(root, "dist", "store-listing");
const screenshotsDir = path.join(outputDir, "screenshots");
const promoDir = path.join(outputDir, "promo");

const expected = {
  screenshot: { width: 1280, height: 800 },
  smallPromoTile: { width: 440, height: 280 },
  marqueePromoTile: { width: 1400, height: 560 },
  icon: { width: 128, height: 128 },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readPngInfo(relativePath) {
  const target = path.join(root, relativePath);
  const data = fs.readFileSync(target);
  const signature = data.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`${relativePath} is not a PNG file.`);
  }

  const chunkType = data.subarray(12, 16).toString("ascii");
  if (chunkType !== "IHDR") {
    throw new Error(`${relativePath} has an invalid PNG header.`);
  }

  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const colorType = data.readUInt8(25);
  const modeByColorType = {
    0: "grayscale",
    2: "RGB",
    3: "indexed",
    4: "grayscale-alpha",
    6: "RGBA",
  };

  return {
    path: target,
    width,
    height,
    mode: modeByColorType[colorType] || `color-type-${colorType}`,
    hasAlpha: colorType === 4 || colorType === 6,
  };
}

function assertPng(relativePath, kind) {
  const info = readPngInfo(relativePath);
  const size = expected[kind];
  const validSize = info.width === size.width && info.height === size.height;
  const validMode = kind === "icon" ? info.hasAlpha : info.mode === "RGB";

  if (!validSize || !validMode) {
    throw new Error(
      `${relativePath} must be ${size.width}x${size.height} ${
        kind === "icon" ? "PNG" : "24-bit RGB PNG without alpha"
      }, got ${info.width}x${info.height} ${info.mode} alpha=${info.hasAlpha}`,
    );
  }
}

function copy(relativePath, targetPath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing store listing file: ${relativePath}`);
  }
  fs.copyFileSync(source, targetPath);
}

fs.rmSync(outputDir, { recursive: true, force: true });
ensureDir(screenshotsDir);
ensureDir(promoDir);

config.screenshots.forEach((screenshot, index) => {
  assertPng(screenshot, "screenshot");
  copy(
    screenshot,
    path.join(screenshotsDir, `${index + 1}-${path.basename(screenshot)}`),
  );
});

assertPng(config.smallPromoTile, "smallPromoTile");
copy(config.smallPromoTile, path.join(promoDir, "small-promo-tile.png"));

assertPng(config.marqueePromoTile, "marqueePromoTile");
copy(config.marqueePromoTile, path.join(promoDir, "marquee-promo-tile.png"));

assertPng(config.icon, "icon");
copy(config.icon, path.join(promoDir, "icon-128.png"));

Object.entries(config.descriptions).forEach(([locale, descriptionPath]) => {
  copy(descriptionPath, path.join(outputDir, `description-${locale}.txt`));
});

copy(config.tags, path.join(outputDir, "tags.txt"));
copy(
  config.releaseNotes,
  path.join(outputDir, `release-notes-v${manifest.version}.md`),
);
copy(config.privacyPractices, path.join(outputDir, "privacy-practices.md"));

fs.writeFileSync(
  path.join(outputDir, "README.txt"),
  [
    `OnlyCCFA ${manifest.version} Chrome Web Store listing assets`,
    "",
    "Chrome Web Store listing text and images are prepared here for Dashboard upload.",
    "The Chrome Web Store API can upload and publish the extension package, but listing metadata still needs Dashboard review.",
    "",
  ].join("\n"),
);

console.log(`Prepared ${path.relative(root, outputDir)}`);
