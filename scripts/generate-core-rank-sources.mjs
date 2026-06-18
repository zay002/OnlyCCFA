import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.env.CORE_SOURCE || "ICORE2026";
const url = new URL("https://portal.core.edu.au/conf-ranks");
url.search = new URLSearchParams({
  search: "",
  by: "all",
  sort: "atitle",
  page: "1",
  do: "Export",
  source,
}).toString();

function download(target) {
  return new Promise((resolve, reject) => {
    https
      .get(
        target,
        {
          headers: {
            "User-Agent": "OnlyCCFA data generator",
          },
        },
        (response) => {
          if (
            [301, 302, 303, 307, 308].includes(response.statusCode) &&
            response.headers.location
          ) {
            resolve(download(new URL(response.headers.location, target)));
            return;
          }

          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
              reject(new Error(`CORE export failed: ${response.statusCode}`));
              return;
            }
            resolve(Buffer.concat(chunks).toString("utf8"));
          });
        },
      )
      .on("error", reject);
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  return rows;
}

const rankOrder = new Map([
  ["A*", 0],
  ["A", 1],
  ["B", 2],
  ["C", 3],
  ["Australasian", 4],
]);

function toRecord(row) {
  const title = row[1];
  const acronym = row[2];
  const rank = row[4];
  if (!title || !rankOrder.has(rank)) return null;

  return {
    title,
    ...(acronym && acronym !== title ? { aliases: [acronym] } : {}),
    tags: [{ source: "coreRank", value: rank }],
  };
}

const csv = await download(url);
const records = parseCsv(csv)
  .map(toRecord)
  .filter(Boolean)
  .sort((left, right) => {
    const rankDiff =
      rankOrder.get(left.tags[0].value) - rankOrder.get(right.tags[0].value);
    return rankDiff || left.title.localeCompare(right.title);
  });

const output = `// Generated from CORE/ICORE conference rankings (${source}) via https://portal.core.edu.au/conf-ranks.
// Collection approach adapted from https://github.com/benkeks/icore-ranks.
// CORE ranking data belongs to CORE.
const coreRankSources = {
  sources: {
    coreRank: { label: "CORE ", className: "rank-source-core" },
  },
  records: ${JSON.stringify(records, null, 2)},
};
`;

fs.writeFileSync(path.join(root, "data/coreRankSources.js"), output);
console.log(
  `Generated data/coreRankSources.js with ${records.length} records.`,
);
