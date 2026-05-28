const fs = require("fs");
const https = require("https");
const path = require("path");
const querystring = require("querystring");

require("./load-env");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);

const extensionId =
  process.env.CWS_EXTENSION_ID || "cgbjdimlhdcjinagiacapnkmhpjkeabh";
const publisherId = process.env.CWS_PUBLISHER_ID;
const clientId = process.env.CWS_CLIENT_ID;
const clientSecret = process.env.CWS_CLIENT_SECRET;
const refreshToken = process.env.CWS_REFRESH_TOKEN;
const proxyUrl = process.env.CWS_PROXY;
const zipPath =
  process.env.CWS_ZIP ||
  path.join(root, "dist", `OnlyCCFA-${manifest.version}.zip`);

if (!publisherId || !clientId || !clientSecret || !refreshToken) {
  throw new Error(
    "CWS_PUBLISHER_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET and CWS_REFRESH_TOKEN are required.",
  );
}

if (!fs.existsSync(zipPath)) {
  throw new Error(`Chrome Web Store zip is missing: ${zipPath}`);
}

function normalizeProxyUrl(value) {
  if (!value) {
    return null;
  }

  return value.includes("://") ? value : `http://${value}`;
}

let proxyAgent;

async function getProxyAgent() {
  if (!proxyUrl) {
    return null;
  }

  if (!proxyAgent) {
    const { HttpsProxyAgent } = await import("https-proxy-agent");
    proxyAgent = new HttpsProxyAgent(normalizeProxyUrl(proxyUrl));
  }

  return proxyAgent;
}

async function request(
  { method, hostname, path: requestPath, headers = {} },
  body,
) {
  const agent = await getProxyAgent();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname,
        path: requestPath,
        headers,
        agent: agent || undefined,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
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

async function getAccessToken() {
  const body = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await request(
    {
      method: "POST",
      hostname: "oauth2.googleapis.com",
      path: "/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body,
  );

  return response.access_token;
}

async function main() {
  const accessToken = await getAccessToken();
  const zipBuffer = fs.readFileSync(zipPath);

  const upload = await request(
    {
      method: "POST",
      hostname: "chromewebstore.googleapis.com",
      path: `/upload/v2/publishers/${publisherId}/items/${extensionId}:upload`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/zip",
        "Content-Length": zipBuffer.length,
      },
    },
    zipBuffer,
  );

  console.log(`Chrome Web Store upload status: ${JSON.stringify(upload)}`);

  const publish = await request(
    {
      method: "POST",
      hostname: "chromewebstore.googleapis.com",
      path: `/v2/publishers/${publisherId}/items/${extensionId}:publish`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
    "{}",
  );

  console.log(`Chrome Web Store publish status: ${JSON.stringify(publish)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
