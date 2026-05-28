const fs = require("fs");
const https = require("https");
const path = require("path");

require("./load-env");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);
const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY || "zay002/OnlyCCFA";
const tag = process.env.RELEASE_TAG || `v${manifest.version}`;
const zipPath =
  process.env.RELEASE_ZIP ||
  path.join(root, "dist", `OnlyCCFA-${manifest.version}.zip`);
const notesPath =
  process.env.RELEASE_NOTES ||
  path.join(root, "store-listing", "release-notes.md");

if (!token) {
  throw new Error("GITHUB_TOKEN is required.");
}

if (!fs.existsSync(zipPath)) {
  throw new Error(`Release zip is missing: ${zipPath}`);
}

function request(
  { method, hostname, path: requestPath, headers = {}, allow404 = false },
  body,
) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname,
        path: requestPath,
        headers: {
          "User-Agent": "OnlyCCFA-release-script",
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (allow404 && res.statusCode === 404) {
            resolve(null);
            return;
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(
              new Error(
                `${method} ${requestPath} failed: ${res.statusCode} ${text}`,
              ),
            );
            return;
          }
          resolve(text ? JSON.parse(text) : {});
        });
      },
    );

    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function main() {
  const notes = fs.readFileSync(notesPath, "utf8");
  let release = await request({
    method: "GET",
    hostname: "api.github.com",
    path: `/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`,
    allow404: true,
  });

  if (release) {
    release = await request(
      {
        method: "PATCH",
        hostname: "api.github.com",
        path: `/repos/${repo}/releases/${release.id}`,
        headers: { "Content-Type": "application/json" },
      },
      JSON.stringify({
        name: `OnlyCCFA ${tag}`,
        body: notes,
        draft: false,
        prerelease: false,
      }),
    );
  } else {
    release = await request(
      {
        method: "POST",
        hostname: "api.github.com",
        path: `/repos/${repo}/releases`,
        headers: { "Content-Type": "application/json" },
      },
      JSON.stringify({
        tag_name: tag,
        name: `OnlyCCFA ${tag}`,
        body: notes,
        draft: false,
        prerelease: false,
        generate_release_notes: false,
      }),
    );
  }

  const assets = await request({
    method: "GET",
    hostname: "api.github.com",
    path: `/repos/${repo}/releases/${release.id}/assets`,
  });

  const zipBuffer = fs.readFileSync(zipPath);
  const assetName = path.basename(zipPath);
  const existingAsset = assets.find((asset) => asset.name === assetName);

  if (existingAsset) {
    await request({
      method: "DELETE",
      hostname: "api.github.com",
      path: `/repos/${repo}/releases/assets/${existingAsset.id}`,
    });
  }

  const uploadPath = `/repos/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(
    assetName,
  )}`;

  await request(
    {
      method: "POST",
      hostname: "uploads.github.com",
      path: uploadPath,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": zipBuffer.length,
      },
    },
    zipBuffer,
  );

  console.log(`Published GitHub release ${release.html_url}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
