import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const authorPath = path.join(root, "data", "authorRankSources.js");
const markerStart = "// BEGIN GENERATED DYS SUPPLEMENT";
const markerEnd = "// END GENERATED DYS SUPPLEMENT";

const dysSeedUrls = [
  {
    year: 2025,
    url: "https://m.maigoo.com/news/741421.html",
    source: "Maigoo 2025 Young Scientists Fund A seed",
  },
  {
    year: 2023,
    url: "https://www.maigoo.com/news/3jgNMzcz.html",
    source: "Maigoo 2023 NSFC Distinguished Young Scholar seed",
  },
  {
    year: 2020,
    url: "https://www.maigoo.com/news/563672.html",
    source: "Maigoo 2020 NSFC Distinguished Young Scholar seed",
  },
  {
    year: 2019,
    url: "https://www.maigoo.com/news/524880.html",
    source: "Maigoo 2019 NSFC Distinguished Young Scholar seed",
  },
  {
    year: null,
    url: "https://www.maigoo.com/news/529622.html",
    source: "Maigoo research honor seed",
  },
];

function loadAuthorRankSources(source) {
  return vm.runInNewContext(`${source}; authorRankSources;`, {});
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNames(html) {
  const names = new Set();
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi))
      .map((cell) => stripHtml(cell[1]))
      .filter(Boolean);
    let index = -1;
    if (cells.length >= 3 && /^\d+$/.test(cells[0])) {
      index = cells.findIndex(
        (cell, cellIndex) =>
          cellIndex > 0 && /^[\u4E00-\u9FFF·]{2,8}$/.test(cell),
      );
    } else if (cells.length >= 2) {
      index = cells.findIndex((cell) => /^[\u4E00-\u9FFF·]{2,8}$/.test(cell));
    }
    if (index < 0) {
      index = cells.findIndex((cell) => /^[\u4E00-\u9FFF·]{2,8}$/.test(cell));
    }
    if (index >= 0 && !/姓名|单位|序号/.test(cells[index])) {
      names.add(cells[index]);
    }
  }
  return Array.from(names);
}

function slugName(name) {
  return Array.from(name)
    .map((char) => char.codePointAt(0).toString(16))
    .join("-");
}

async function fetchSeeds() {
  const byName = new Map();
  for (const seed of dysSeedUrls) {
    const response = await fetch(seed.url);
    if (!response.ok) {
      throw new Error(`Cannot fetch ${seed.url}: ${response.status}`);
    }
    const html = await response.text();
    extractNames(html).forEach((name) => {
      if (!byName.has(name)) {
        byName.set(name, {
          id: `person:dys-seed-${slugName(name)}`,
          name,
          cnName: name,
          year: seed.year,
          provenance: [
            {
              source: seed.source,
              url: seed.url,
            },
          ],
          tags: [
            {
              source: "distinguishedYoungScholar",
              value: seed.year ? String(seed.year) : "seed",
            },
          ],
        });
      }
    });
  }
  return Array.from(byName.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "zh-Hans-CN"),
  );
}

function buildSupplement(records, existing) {
  const existingDys = new Set(
    existing.records
      .filter((record) =>
        (record.tags || []).some(
          (tag) => tag.source === "distinguishedYoungScholar",
        ),
      )
      .map((record) => record.name),
  );
  const supplemental = records.filter(
    (record) => !existingDys.has(record.name),
  );
  return `${markerStart}
authorRankSources.dysSupplementRecords = ${JSON.stringify(
    supplemental,
    null,
    2,
  )};
authorRankSources.dysSupplementRecords.forEach(function (record) {
  const existing = authorRankSources.records.find(function (item) {
    return item.name === record.name || item.cnName === record.name;
  });
  if (existing) {
    existing.provenance = (existing.provenance || []).concat(record.provenance || []);
    const hasDys = (existing.tags || []).some(function (tag) {
      return tag.source === "distinguishedYoungScholar";
    });
    if (!hasDys) {
      existing.tags = (existing.tags || []).concat(record.tags || []);
    }
    return;
  }
  authorRankSources.records.push(record);
});
${markerEnd}
`;
}

function replaceSupplement(source, supplement) {
  const pattern = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\n?`);
  if (pattern.test(source)) {
    return source.replace(pattern, supplement);
  }
  return `${source.trimEnd()}\n\n${supplement}`;
}

const source = fs.readFileSync(authorPath, "utf8");
const existing = loadAuthorRankSources(
  source.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\n?`), ""),
);
const records = await fetchSeeds();
fs.writeFileSync(
  authorPath,
  replaceSupplement(source, buildSupplement(records, existing)),
);
console.log(
  `Updated data/authorRankSources.js with ${records.length} DYS seed names.`,
);
