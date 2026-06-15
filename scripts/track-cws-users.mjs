import fs from "node:fs";
import path from "node:path";

const extensionUrl =
  process.env.CWS_EXTENSION_URL ||
  "https://chromewebstore.google.com/detail/onlyccfa/cgbjdimlhdcjinagiacapnkmhpjkeabh";
const statsFile = process.env.CWS_STATS_FILE || "stats/cws-users.json";
const svgFile = process.env.CWS_SVG_FILE || "assets/cws-users.svg";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseUserCount(html) {
  const source = String(html || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#44;/g, ",");
  const patterns = [
    /"userCount"\s*:\s*"?([\d,]+)"?/i,
    /"users"\s*:\s*"?([\d,]+)"?/i,
    /([\d,]+)\s+users\b/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) {
      const count = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(count) && count >= 0) {
        return count;
      }
    }
  }

  throw new Error("Could not find Chrome Web Store user count in page HTML.");
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (compatible; OnlyCCFA stats tracker; +https://github.com/zay002/OnlyCCFA)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchUserCount() {
  if (process.env.CWS_USERS_OVERRIDE) {
    const override = Number(process.env.CWS_USERS_OVERRIDE);
    if (Number.isFinite(override) && override >= 0) {
      return override;
    }
    throw new Error("CWS_USERS_OVERRIDE must be a non-negative number.");
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchWithTimeout(extensionUrl, 20000);
      if (!response.ok) {
        throw new Error(`Chrome Web Store returned HTTP ${response.status}.`);
      }
      return parseUserCount(await response.text());
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
      }
    }
  }
  throw lastError;
}

function readStats(file) {
  if (!fs.existsSync(file)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${file} must contain a JSON array.`);
  }
  return parsed
    .map((item) => ({
      date: String(item.date || ""),
      users: Number(item.users),
    }))
    .filter((item) => item.date && Number.isFinite(item.users));
}

function upsertToday(stats, users, date = todayIsoDate()) {
  const withoutToday = stats.filter((item) => item.date !== date);
  return [...withoutToday, { date, users }].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function scale(value, min, max, start, end) {
  if (max === min) {
    return (start + end) / 2;
  }
  return start + ((value - min) / (max - min)) * (end - start);
}

function handDrawnLine(points, jitterY = 0) {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x.toFixed(1)} ${(point.y + jitterY).toFixed(1)} l 0.1 0`;
  }

  return points
    .map((point, index) => {
      const jitter = index % 2 === 0 ? jitterY : -jitterY;
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(1)} ${(point.y + jitter).toFixed(1)}`;
    })
    .join(" ");
}

function generateSvg(stats) {
  const width = 720;
  const height = 220;
  const pad = { left: 48, right: 24, top: 38, bottom: 42 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const values = stats.map((item) => item.users);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const latest = stats[stats.length - 1] || { date: "", users: 0 };
  const points = stats.map((item, index) => {
    const x =
      pad.left +
      (stats.length === 1
        ? chartWidth / 2
        : (index / (stats.length - 1)) * chartWidth);
    const y = scale(
      item.users,
      minValue,
      maxValue,
      pad.top + chartHeight,
      pad.top,
    );
    return { ...item, x, y };
  });
  const polyline = points
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
  const sketchLineA = handDrawnLine(points, 0.8);
  const sketchLineB = handDrawnLine(points, -0.7);
  const ticks = [0, 0.5, 1].map((ratio) => {
    const value = Math.round(minValue + (maxValue - minValue) * (1 - ratio));
    const y = pad.top + chartHeight * ratio;
    const wobble = ratio === 0.5 ? 1.4 : -0.9;
    return `<g><path d="M ${pad.left} ${y + wobble} C ${pad.left + 180} ${
      y - wobble
    }, ${pad.left + 420} ${y + wobble}, ${pad.left + chartWidth} ${
      y - wobble
    }" fill="none" stroke="#d6d3c8" stroke-width="1.1"/><text x="${
      pad.left - 10
    }" y="${
      y + 4
    }" text-anchor="end" fill="#57534e" font-size="11">${value}</text></g>`;
  });
  const dots = points
    .map(
      (point) =>
        `<g><circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(
          1,
        )}" r="4.3" fill="#fff7ed" stroke="#1d4ed8" stroke-width="2"><title>${escapeXml(
          point.date,
        )}: ${point.users} users</title></circle><path d="M ${(
          point.x - 4
        ).toFixed(
          1,
        )} ${(point.y + 1).toFixed(1)} C ${(point.x - 1).toFixed(1)} ${(
          point.y - 5
        ).toFixed(1)}, ${(point.x + 5).toFixed(1)} ${(point.y - 2).toFixed(
          1,
        )}, ${(point.x + 3).toFixed(1)} ${(point.y + 4).toFixed(
          1,
        )}" fill="none" stroke="#1d4ed8" stroke-width="1.2"/></g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Chrome Web Store users trend">
  <rect width="${width}" height="${height}" rx="8" fill="#fffdf7"/>
  <path d="M 11 8 C 190 3, 512 7, 710 11 M 714 11 C 717 74, 715 151, 711 211 M 708 214 C 523 218, 177 216, 12 211 M 9 211 C 4 145, 7 78, 11 8" fill="none" stroke="#292524" stroke-width="1.3" opacity="0.7"/>
  <text x="24" y="24" fill="#1c1917" font-family="'Comic Sans MS', 'Segoe Print', cursive" font-size="16" font-weight="700">Chrome Web Store users</text>
  <text x="${width - 24}" y="24" fill="#1d4ed8" font-family="'Comic Sans MS', 'Segoe Print', cursive" font-size="16" font-weight="700" text-anchor="end">${latest.users} users</text>
  <text x="${width - 24}" y="43" fill="#57534e" font-family="'Comic Sans MS', 'Segoe Print', cursive" font-size="11" text-anchor="end">Updated ${escapeXml(
    latest.date,
  )}</text>
  ${ticks.join("\n  ")}
  <path d="M ${pad.left} ${pad.top - 2} C ${pad.left - 4} ${
    pad.top + 60
  }, ${pad.left + 2} ${pad.top + 118}, ${pad.left} ${
    pad.top + chartHeight
  }" fill="none" stroke="#292524" stroke-width="1.4"/>
  <path d="M ${pad.left - 2} ${pad.top + chartHeight} C ${
    pad.left + 170
  } ${pad.top + chartHeight + 4}, ${pad.left + 430} ${
    pad.top + chartHeight - 3
  }, ${pad.left + chartWidth} ${
    pad.top + chartHeight + 1
  }" fill="none" stroke="#292524" stroke-width="1.4"/>
  <path d="${sketchLineA}" fill="none" stroke="#2563eb" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${sketchLineB}" fill="none" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
  ${dots}
  <text x="${pad.left}" y="${height - 14}" fill="#57534e" font-family="'Comic Sans MS', 'Segoe Print', cursive" font-size="11">${escapeXml(
    stats[0]?.date || "",
  )}</text>
  <text x="${width - 24}" y="${height - 14}" fill="#57534e" font-family="'Comic Sans MS', 'Segoe Print', cursive" font-size="11" text-anchor="end">${escapeXml(
    latest.date,
  )}</text>
</svg>
`;
}

const users = await fetchUserCount();
const stats = upsertToday(readStats(statsFile), users);

fs.mkdirSync(path.dirname(statsFile), { recursive: true });
fs.mkdirSync(path.dirname(svgFile), { recursive: true });
fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2) + "\n");
fs.writeFileSync(svgFile, generateSvg(stats));

console.log(`Tracked ${users} Chrome Web Store users.`);
