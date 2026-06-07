/**
 * MIT License
 *
 * Copyright (c) 2019-2023 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp), mra42 (https://github.com/mra42)
 */

const scholar = {};

scholar.rankSpanList = [];
scholar.deepTargetCount = 55;
scholar.deepPageSize = 20;
scholar.deepRequestDelay = 800;
scholar.deepLoading = false;
scholar.deepState = null;
scholar.bibtexConcurrency = 2;
scholar.bibtexCache = new Map();
scholar.citationDetailVenueCache = new Map();
scholar.searchResultVenueCache = new Map();
scholar.searchResultVenueQueue = Promise.resolve();
scholar.searchResultVenueDelay = 120;
scholar.googleCitationCooldownUntil = 0;
scholar.cvfVenueHints = [
  {
    pattern: /(^|\s)CVPR(?:W?(?:19|20)\d{2}|(?:19|20)\d{2}W?)?(\s|$)/i,
    venue: "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
  },
  {
    pattern: /(^|\s)ICCV(?:W?(?:19|20)\d{2}|(?:19|20)\d{2}W?)?(\s|$)/i,
    venue: "International Conference on Computer Vision",
  },
  {
    pattern: /(^|\s)ECCV(?:W?(?:19|20)\d{2}|(?:19|20)\d{2}W?)?(\s|$)/i,
    venue: "European Conference on Computer Vision",
  },
  {
    pattern: /(^|\s)WACV(?:W?(?:19|20)\d{2}|(?:19|20)\d{2}W?)?(\s|$)/i,
    venue: "IEEE/CVF Winter Conference on Applications of Computer Vision",
  },
];
scholar.pmlrVolumeVenues = {
  v119: "International Conference on Machine Learning",
  v139: "International Conference on Machine Learning",
  v162: "International Conference on Machine Learning",
  v202: "International Conference on Machine Learning",
  v235: "International Conference on Machine Learning",
  v267: "International Conference on Machine Learning",
};

scholar.run = function () {
  let url = window.location.pathname;
  if (url == "/scholar") {
    scholar.appendRank();
  } else if (url == "/citations") {
    scholar.appendRanks(); // 页面加载时先处理一次作者主页上的条目
    scholar.observeCitations(); // 然后设置观察者以处理动态加载的条目
  }
};

scholar.normalizeUrlForVenueHint = function (url) {
  return decodeURIComponent(String(url || ""))
    .replace(/[^A-Za-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

scholar.inferVenueFromUrl = function (url) {
  const normalizedUrl = scholar.normalizeUrlForVenueHint(url);
  if (/(^|\s)openaccess\s+thecvf\s+com(\s|$)/i.test(normalizedUrl)) {
    const match = scholar.cvfVenueHints.find((hint) =>
      hint.pattern.test(normalizedUrl),
    );
    return match ? match.venue : "";
  }

  if (/(^|\s)proceedings\s+mlr\s+press(\s|$)/i.test(normalizedUrl)) {
    const volume = (normalizedUrl.match(/(^|\s)(v\d+)(\s|$)/i) || [])[2];
    return scholar.pmlrVolumeVenues[volume?.toLowerCase()] || "";
  }

  if (/(^|\s)proceedings\s+neurips\s+cc(\s|$)/i.test(normalizedUrl)) {
    return "Conference on Neural Information Processing Systems";
  }

  return "";
};

scholar.isTruncatedVenue = function (venue) {
  return /…|\.\.\./.test(String(venue || ""));
};

scholar.extractVenue = function (metadata, url) {
  const parts = (metadata || "").split(/\s[-–—]\s/);
  if (parts.length < 2) {
    return "";
  }

  let venue = parts[1].trim();
  let yearMatch = venue.match(/,\s*(19|20)\d{2}\b/);
  if (yearMatch) {
    venue = venue.substring(0, yearMatch.index);
  }

  const inferredVenue = scholar.inferVenueFromUrl(url);
  if (inferredVenue && scholar.isTruncatedVenue(venue)) {
    return inferredVenue;
  }

  return venue.trim();
};

scholar.getBaseUrl = function () {
  if (typeof window !== "undefined" && window.location) {
    return window.location.href;
  }

  return "https://scholar.google.com/scholar";
};

scholar.getCurrentStart = function (url) {
  return (
    Number(new URL(url, scholar.getBaseUrl()).searchParams.get("start")) || 0
  );
};

scholar.getDeepPageStarts = function (currentStart, pageSize, targetCount) {
  const starts = [];

  for (let loaded = pageSize; loaded < targetCount; loaded += pageSize) {
    starts.push(currentStart + loaded);
  }

  return starts;
};

scholar.withStartParam = function (url, start) {
  return scholar.withPageParams(url, start, null);
};

scholar.withPageParams = function (url, start, num) {
  const nextUrl = new URL(url, scholar.getBaseUrl());
  nextUrl.searchParams.set("start", String(start));
  if (num) {
    nextUrl.searchParams.set("num", String(Math.min(Number(num), 20)));
  }
  return nextUrl.toString();
};

scholar.getSearchKey = function (url) {
  const searchUrl = new URL(url, scholar.getBaseUrl());
  searchUrl.searchParams.delete("start");
  searchUrl.searchParams.delete("num");
  return `${searchUrl.origin}${searchUrl.pathname}?${searchUrl.searchParams.toString()}`;
};

scholar.wait = function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

scholar.collectResultEntries = function (doc) {
  return Array.from(doc.querySelectorAll("#gs_res_ccl_mid > div")).filter(
    (entry) => entry.querySelector("h3 a"),
  );
};

scholar.getResultKey = function (entry) {
  const titleLink = entry.querySelector("h3 a");
  if (!titleLink) {
    return "";
  }

  const href = (titleLink.href || "").trim();
  if (href) {
    return href;
  }

  return titleLink.textContent.replace(/\s+/g, " ").trim().toLowerCase();
};

scholar.decodeHtmlAttribute = function (value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, function (_match, code) {
      return String.fromCodePoint(parseInt(code, 16));
    })
    .replace(/&#(\d+);/g, function (_match, code) {
      return String.fromCodePoint(parseInt(code, 10));
    });
};

scholar.cleanHtmlText = function (value) {
  return scholar
    .decodeHtmlAttribute(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
};

scholar.getCitationDetailFields = function (html) {
  const source = String(html || "");
  const fields = [];

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(source, "text/html");
    Array.from(doc.querySelectorAll(".gsc_oci_field")).forEach((fieldNode) => {
      const valueNode = fieldNode.nextElementSibling;
      if (!valueNode?.classList?.contains("gsc_oci_value")) {
        return;
      }
      fields.push({
        field: scholar.cleanHtmlText(fieldNode.textContent || ""),
        value: scholar.cleanHtmlText(valueNode.textContent || ""),
      });
    });
    if (fields.length > 0) {
      return fields;
    }
  }

  const pairPattern =
    /<div\b[^>]*class=(["'])[^"']*\bgsc_oci_field\b[^"']*\1[^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=(["'])[^"']*\bgsc_oci_value\b[^"']*\3[^>]*>([\s\S]*?)<\/div>/gi;
  let match = pairPattern.exec(source);
  while (match) {
    fields.push({
      field: scholar.cleanHtmlText(match[2]),
      value: scholar.cleanHtmlText(match[4]),
    });
    match = pairPattern.exec(source);
  }
  return fields;
};

scholar.isCitationDetailVenueField = function (field) {
  const normalized = scholar.cleanProfileText(field).toLowerCase();
  return /^(source|journal|conference|book|book title|publication|published in|proceedings|venue|来源|期刊|会议|书籍|图书|书名|出版物|发表在|论文集)$/.test(
    normalized,
  );
};

scholar.extractCitationDetailVenue = function (html) {
  const fields = scholar.getCitationDetailFields(html);
  const venueField = fields.find(function (item) {
    return item.value && scholar.isCitationDetailVenueField(item.field);
  });
  return venueField ? venueField.value : "";
};

scholar.getCitationDetailUrl = function (entry) {
  const titleLink =
    entry?.querySelector?.("a.gsc_a_at") ||
    entry?.querySelector?.("td.gsc_a_t > a");
  const href = titleLink?.getAttribute?.("href") || titleLink?.href || "";
  if (!href) {
    return "";
  }

  const detailUrl = new URL(href, scholar.getBaseUrl());
  if (
    detailUrl.pathname !== "/citations" ||
    detailUrl.searchParams.get("view_op") !== "view_citation"
  ) {
    return "";
  }
  return detailUrl.toString();
};

scholar.shouldFetchCitationDetailVenue = function (venue) {
  return scholar.isTruncatedVenue(venue);
};

scholar.fetchCitationDetailVenue = function (entry) {
  const detailUrl = scholar.getCitationDetailUrl(entry);
  if (!detailUrl) {
    return Promise.resolve("");
  }

  if (scholar.citationDetailVenueCache.has(detailUrl)) {
    return scholar.citationDetailVenueCache.get(detailUrl);
  }

  const request = scholar
    .fetchText(detailUrl)
    .then(function (html) {
      return scholar.extractCitationDetailVenue(html);
    })
    .catch(function () {
      return "";
    });

  scholar.citationDetailVenueCache.set(detailUrl, request);
  return request;
};

scholar.getCitationUrl = function (entry) {
  const citationLink = entry.querySelector('a[href*="output=cite"]');
  if (citationLink?.href && !citationLink.href.startsWith("javascript:")) {
    return new URL(citationLink.href, scholar.getBaseUrl()).toString();
  }

  const cid =
    entry.dataset?.cid || entry.querySelector("[data-cid]")?.dataset?.cid || "";
  if (!cid) {
    return "";
  }

  const citationUrl = new URL("/scholar", scholar.getBaseUrl());
  citationUrl.searchParams.set("q", `info:${cid}:scholar.google.com/`);
  citationUrl.searchParams.set("output", "cite");
  citationUrl.searchParams.set("scirp", "0");
  return citationUrl.toString();
};

scholar.extractBibtexHref = function (html, baseUrl) {
  const source = String(html || "");
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(source, "text/html");
    const bibtexLink =
      Array.from(doc.querySelectorAll("a")).find((link) =>
        /bibtex/i.test(link.textContent || ""),
      ) || doc.querySelector('a[href*="scholar.bib"]');
    if (bibtexLink?.getAttribute("href")) {
      return new URL(bibtexLink.getAttribute("href"), baseUrl).toString();
    }
  }

  const textLinkMatch = source.match(
    /<a\b[^>]*href=(["'])(.*?)\1[^>]*>\s*BibTeX\s*<\/a>/i,
  );
  const hrefMatch =
    textLinkMatch || source.match(/href=(["'])([^"']*scholar\.bib[^"']*)\1/i);
  if (!hrefMatch) {
    return "";
  }

  return new URL(scholar.decodeHtmlAttribute(hrefMatch[2]), baseUrl).toString();
};

scholar.getDirectBibtexUrl = function (entry) {
  const links = Array.from(entry.querySelectorAll?.("a") || []);
  const bibtexLink = links.find((link) => {
    const href = link.getAttribute?.("href") || link.href || "";
    const text = link.textContent || "";
    return /scholar\.bib|output=citation/i.test(href) || /bibtex/i.test(text);
  });

  if (!bibtexLink) {
    return "";
  }

  const href = bibtexLink.getAttribute?.("href") || bibtexLink.href || "";
  return href ? new URL(href, scholar.getBaseUrl()).toString() : "";
};

scholar.extractDoiFromText = function (text) {
  const match = String(text || "").match(/\b10\.\d{4,9}\/[^\s"'<>]+/i);
  if (!match) {
    return "";
  }

  return match[0].replace(/[),.;\]]+$/g, "");
};

scholar.extractArxivIdFromText = function (text) {
  const source = String(text || "");
  const match = source.match(
    /(?:arxiv:\s*|arxiv\.org\/(?:abs|pdf)\/)([0-9]{4}\.[0-9]{4,5}(?:v\d+)?|[a-z-]+(?:\.[A-Z]{2})?\/[0-9]{7}(?:v\d+)?)/i,
  );
  return match ? match[1].replace(/\.pdf$/i, "") : "";
};

scholar.buildCrossrefBibtexUrl = function (doi) {
  return `https://api.crossref.org/works/${encodeURIComponent(
    doi,
  )}/transform/application/x-bibtex`;
};

scholar.buildArxivApiUrl = function (arxivId) {
  const url = new URL("https://export.arxiv.org/api/query");
  url.searchParams.set("id_list", arxivId);
  return url.toString();
};

scholar.normalizeTitleForMatch = function (title) {
  return String(title || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u4E00-\u9FFF]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

scholar.isCrossrefTitleMatch = function (expected, candidate) {
  const expectedTitle = scholar.normalizeTitleForMatch(expected);
  const candidateTitle = scholar.normalizeTitleForMatch(candidate);
  if (!expectedTitle || !candidateTitle) {
    return false;
  }
  if (expectedTitle === candidateTitle) {
    return true;
  }

  const expectedTokens = new Set(expectedTitle.split(" ").filter(Boolean));
  const candidateTokens = new Set(candidateTitle.split(" ").filter(Boolean));
  const overlap = Array.from(expectedTokens).filter((token) =>
    candidateTokens.has(token),
  ).length;
  const denominator = Math.max(expectedTokens.size, candidateTokens.size, 1);
  return overlap / denominator >= 0.86;
};

scholar.isAcceptableYearMatch = function (expectedYear, candidateYear) {
  if (!expectedYear || !candidateYear) {
    return true;
  }

  return Math.abs(Number(expectedYear) - Number(candidateYear)) <= 1;
};

scholar.getCrossrefItemYear = function (item) {
  return String(item?.issued?.["date-parts"]?.[0]?.[0] || "");
};

scholar.isShortContainerAcronym = function (text) {
  return /^[A-Z][A-Z0-9&-]{1,10}$/.test(String(text || "").trim());
};

scholar.getCrossrefContainerTitle = function (item) {
  const containerTitle = (item?.["container-title"] || [])
    .find((title) => String(title || "").trim())
    ?.trim();
  if (!containerTitle) {
    return "";
  }

  const shortTitle = (item?.["short-container-title"] || [])
    .find((title) => scholar.isShortContainerAcronym(title))
    ?.trim();
  if (!shortTitle) {
    return containerTitle;
  }

  const normalizedContainer = scholar.normalizeTitleForMatch(containerTitle);
  const normalizedShort = scholar.normalizeTitleForMatch(shortTitle);
  if (
    !normalizedShort ||
    ` ${normalizedContainer} `.includes(` ${normalizedShort} `)
  ) {
    return containerTitle;
  }

  return `${containerTitle} (${shortTitle})`;
};

scholar.shouldFetchSearchResultVenue = function (data) {
  if (!data?.title || !data.year || !scholar.isTruncatedVenue(data.venue)) {
    return false;
  }

  return !/\barxiv\b/i.test(String(data.venue || ""));
};

scholar.fetchCrossrefVenueByTitle = async function (title, year) {
  if (!title) {
    return "";
  }

  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("rows", "5");
  url.searchParams.set("query.title", title);
  url.searchParams.set(
    "select",
    "title,issued,container-title,short-container-title",
  );

  const text = await scholar.fetchText(url.toString());
  const data = JSON.parse(text);
  const items = data.message?.items || [];
  const match = items.find((item) => {
    const candidateTitle = (item.title || [])[0] || "";
    const issuedYear = scholar.getCrossrefItemYear(item);
    return (
      scholar.isAcceptableYearMatch(year, issuedYear) &&
      scholar.isCrossrefTitleMatch(title, candidateTitle) &&
      scholar.getCrossrefContainerTitle(item)
    );
  });

  return match ? scholar.getCrossrefContainerTitle(match) : "";
};

scholar.enqueueSearchResultVenueLookup = function (lookup) {
  const run = scholar.searchResultVenueQueue.catch(() => {}).then(lookup);
  scholar.searchResultVenueQueue = run
    .catch(() => {})
    .then(() => scholar.wait(scholar.searchResultVenueDelay));
  return run;
};

scholar.fetchSearchResultVenue = async function (data) {
  if (!scholar.shouldFetchSearchResultVenue(data)) {
    return "";
  }

  const key = `${scholar.normalizeTitleForMatch(data.title)}|${data.year}`;
  if (scholar.searchResultVenueCache.has(key)) {
    return scholar.searchResultVenueCache.get(key);
  }

  const venue = await scholar.enqueueSearchResultVenueLookup(() =>
    scholar.fetchCrossrefVenueByTitle(data.title, data.year),
  );
  scholar.searchResultVenueCache.set(key, venue || "");
  return venue || "";
};

scholar.mapWithConcurrency = async function (items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(Number(limit) || 1, items.length));

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: workerCount }, function () {
      return worker();
    }),
  );

  return results;
};

scholar.findBibtexValueEnd = function (source, start) {
  if (source[start] === "{") {
    let depth = 0;
    for (let index = start; index < source.length; index += 1) {
      if (source[index] === "{") {
        depth += 1;
      } else if (source[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          return index + 1;
        }
      }
    }
    return source.length;
  }

  if (source[start] === '"') {
    for (let index = start + 1; index < source.length; index += 1) {
      if (source[index] === '"' && source[index - 1] !== "\\") {
        return index + 1;
      }
    }
    return source.length;
  }

  let index = start;
  while (index < source.length && source[index] !== ",") {
    index += 1;
  }
  return index;
};

scholar.parseBibtexFields = function (body) {
  const fields = [];
  let index = 0;

  while (index < body.length) {
    while (index < body.length && /[\s,]/.test(body[index])) {
      index += 1;
    }

    const nameMatch = body.slice(index).match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=/);
    if (!nameMatch) {
      break;
    }

    const name = nameMatch[1];
    index += nameMatch[0].length;
    while (index < body.length && /\s/.test(body[index])) {
      index += 1;
    }

    const valueStart = index;
    const valueEnd = scholar.findBibtexValueEnd(body, valueStart);
    fields.push({
      name,
      value: body.slice(valueStart, valueEnd).trim(),
    });
    index = valueEnd;
  }

  return fields;
};

scholar.normalizeBibtexValue = function (value) {
  const trimmed = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!trimmed) {
    return "{}";
  }

  if (trimmed.startsWith("{") || trimmed.startsWith('"')) {
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return `{${trimmed.slice(1, -1)}}`;
    }
    return trimmed;
  }

  return `{${trimmed}}`;
};

scholar.formatBibtexEntry = function (entry) {
  const source = String(entry || "").trim();
  const header = source.match(/^@\s*([A-Za-z]+)\s*[{(]\s*([^,\s]+)\s*,/);
  if (!header) {
    return source;
  }

  const type = header[1];
  const key = header[2];
  const bodyStart = header[0].length;
  const bodyEnd = Math.max(source.lastIndexOf("}"), source.lastIndexOf(")"));
  const body = bodyEnd > bodyStart ? source.slice(bodyStart, bodyEnd) : "";
  const fields = scholar.parseBibtexFields(body);
  if (fields.length === 0) {
    return source;
  }

  const lines = fields.map(function (field, index) {
    const suffix = index === fields.length - 1 ? "" : ",";
    return `  ${field.name} = ${scholar.normalizeBibtexValue(field.value)}${suffix}`;
  });

  return [`@${type}{${key},`, ...lines, "}"].join("\n");
};

scholar.splitBibtexEntries = function (bibtex) {
  const source = String(bibtex || "").trim();
  const entries = [];
  let index = 0;

  while (index < source.length) {
    const start = source.indexOf("@", index);
    if (start === -1) {
      break;
    }

    const openIndex = source.slice(start).search(/[({]/);
    if (openIndex === -1) {
      entries.push(source.slice(start).trim());
      break;
    }

    const absoluteOpen = start + openIndex;
    const openChar = source[absoluteOpen];
    const closeChar = openChar === "{" ? "}" : ")";
    let depth = 0;
    let end = source.length;
    for (let cursor = absoluteOpen; cursor < source.length; cursor += 1) {
      if (source[cursor] === openChar) {
        depth += 1;
      } else if (source[cursor] === closeChar) {
        depth -= 1;
        if (depth === 0) {
          end = cursor + 1;
          break;
        }
      }
    }

    entries.push(source.slice(start, end).trim());
    index = end;
  }

  return entries;
};

scholar.formatBibtex = function (bibtex) {
  return scholar
    .splitBibtexEntries(bibtex)
    .map(scholar.formatBibtexEntry)
    .filter(Boolean)
    .join("\n\n");
};

scholar.escapeBibtexValue = function (value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[{}]/g, "");
};

scholar.getArxivText = function (entry, selector) {
  const node = entry.querySelector(selector);
  return (node?.textContent || "").replace(/\s+/g, " ").trim();
};

scholar.getArxivLink = function (entry, rel) {
  const links = Array.from(entry.querySelectorAll?.("link") || []);
  const link = links.find((item) => item.getAttribute("rel") === rel);
  return link?.getAttribute("href") || "";
};

scholar.buildArxivCitationKey = function (authors, year, arxivId) {
  const firstAuthor = (authors[0] || "arxiv")
    .split(/\s+/)
    .pop()
    .replace(/[^A-Za-z0-9]/g, "");
  return `${firstAuthor || "arxiv"}_${year || "arxiv"}_${arxivId.replace(
    /[^A-Za-z0-9]/g,
    "",
  )}`;
};

scholar.buildArxivBibtexFromXml = function (xmlText, fallbackArxivId) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const entry = doc.querySelector("entry");
  if (!entry) {
    return "";
  }

  const idUrl = scholar.getArxivText(entry, "id");
  const arxivId =
    fallbackArxivId || scholar.extractArxivIdFromText(idUrl) || "";
  const title = scholar.getArxivText(entry, "title");
  const published = scholar.getArxivText(entry, "published");
  const year = (published.match(/\b(19|20)\d{2}\b/) || [])[0] || "";
  const authors = Array.from(entry.querySelectorAll("author > name"))
    .map((node) => scholar.escapeBibtexValue(node.textContent))
    .filter(Boolean);
  const primaryCategoryNode =
    entry.getElementsByTagName("arxiv:primary_category")[0] ||
    entry.getElementsByTagName("primary_category")[0];
  const primaryCategory = primaryCategoryNode?.getAttribute("term") || "";
  const pdfUrl = scholar.getArxivLink(entry, "related");
  const citationKey = scholar.buildArxivCitationKey(authors, year, arxivId);
  const lines = [
    `@misc{${citationKey},`,
    `  title={${scholar.escapeBibtexValue(title)}},`,
    `  author={${authors.join(" and ")}},`,
    year ? `  year={${year}},` : "",
    arxivId ? `  eprint={${arxivId.replace(/v\d+$/i, "")}},` : "",
    "  archivePrefix={arXiv},",
    primaryCategory ? `  primaryClass={${primaryCategory}},` : "",
    `  url={${scholar.escapeBibtexValue(idUrl || pdfUrl)}}`,
    "}",
  ].filter(Boolean);

  return lines.join("\n");
};

scholar.fetchText = async function (url) {
  const requestUrl = new URL(url, scholar.getBaseUrl());
  const sameOrigin =
    typeof window !== "undefined" && window.location
      ? requestUrl.origin === window.location.origin
      : requestUrl.hostname.includes("scholar.google.");
  try {
    const response = await fetch(url, {
      credentials: sameOrigin ? "include" : "omit",
    });
    if (!response.ok) {
      throw new Error(`${url} returned ${response.status}`);
    }
    return (await response.text()).trim();
  } catch (error) {
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime?.sendMessage ||
      !chrome.runtime?.id
    ) {
      throw error;
    }
  }

  const response = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "onlyccfaFetchText", url },
      (message) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(message);
      },
    );
  });

  if (!response?.ok) {
    throw new Error(response?.error || `${url} returned ${response?.status}`);
  }

  return String(response.text || "").trim();
};

scholar.waitFor = function (predicate, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const value = predicate();
      if (value) {
        clearInterval(timer);
        resolve(value);
        return;
      }

      if (Date.now() - started >= timeout) {
        clearInterval(timer);
        reject(
          new Error("Timed out waiting for Google Scholar citation dialog"),
        );
      }
    }, interval);
  });
};

scholar.getBibtexUrlFromCitationDialog = async function (entry) {
  const citeButton = entry.querySelector(".gs_or_cit");
  if (!citeButton) {
    return "";
  }

  citeButton.click();
  const bibtexLink = await scholar.waitFor(() => {
    const dialog = document.querySelector("#gs_cit");
    return Array.from(dialog?.querySelectorAll("a") || []).find((link) =>
      /bibtex/i.test(link.textContent || ""),
    );
  });
  const href = bibtexLink?.getAttribute("href") || bibtexLink?.href || "";
  document.querySelector("#gs_cit-x")?.click();
  return href ? new URL(href, scholar.getBaseUrl()).toString() : "";
};

scholar.isGoogleCitationInCooldown = function () {
  return Date.now() < scholar.googleCitationCooldownUntil;
};

scholar.rememberGoogleCitationLimit = function () {
  scholar.googleCitationCooldownUntil = Date.now() + 5 * 60 * 1000;
};

scholar.isGoogleCitationLimitError = function (error) {
  return /\b(403|429|rate|captcha|unusual traffic|restricted)\b/i.test(
    error?.message || "",
  );
};

scholar.fetchGoogleScholarBibtex = async function (entry, options = {}) {
  if (
    options.allowGoogleCitationFetch === false ||
    scholar.isGoogleCitationInCooldown()
  ) {
    return "";
  }

  const directUrl = scholar.getDirectBibtexUrl(entry);
  if (directUrl) {
    try {
      return await scholar.fetchText(directUrl);
    } catch (error) {
      if (scholar.isGoogleCitationLimitError(error)) {
        scholar.rememberGoogleCitationLimit();
      }
      throw error;
    }
  }

  const citationUrl = scholar.getCitationUrl(entry);
  if (!citationUrl) {
    try {
      const dialogBibtexUrl =
        await scholar.getBibtexUrlFromCitationDialog(entry);
      return dialogBibtexUrl ? scholar.fetchText(dialogBibtexUrl) : "";
    } catch (error) {
      return "";
    }
  }

  try {
    const citationHtml = await scholar.fetchText(citationUrl);
    const bibtexUrl = scholar.extractBibtexHref(citationHtml, citationUrl);
    if (!bibtexUrl) {
      try {
        const dialogBibtexUrl =
          await scholar.getBibtexUrlFromCitationDialog(entry);
        return dialogBibtexUrl ? scholar.fetchText(dialogBibtexUrl) : "";
      } catch (error) {
        return "";
      }
    }

    return await scholar.fetchText(bibtexUrl);
  } catch (error) {
    if (scholar.isGoogleCitationLimitError(error)) {
      scholar.rememberGoogleCitationLimit();
    }
    throw error;
  }
};

scholar.fetchCrossrefBibtexByDoi = async function (doi) {
  if (!doi) {
    return "";
  }

  return scholar.fetchText(scholar.buildCrossrefBibtexUrl(doi));
};

scholar.fetchArxivBibtexById = async function (arxivId) {
  if (!arxivId) {
    return "";
  }

  const xml = await scholar.fetchText(scholar.buildArxivApiUrl(arxivId));
  return scholar.buildArxivBibtexFromXml(xml, arxivId);
};

scholar.fetchCrossrefBibtexByTitle = async function (title, year) {
  if (!title) {
    return "";
  }

  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("rows", "5");
  url.searchParams.set("query.title", title);
  url.searchParams.set("select", "DOI,title,issued,score");
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Crossref title search returned ${response.status}`);
  }

  const data = await response.json();
  const items = data.message?.items || [];
  const match = items.find((item) => {
    const candidateTitle = (item.title || [])[0] || "";
    const issuedYear = String(item.issued?.["date-parts"]?.[0]?.[0] || "");
    return (
      scholar.isAcceptableYearMatch(year, issuedYear) &&
      scholar.isCrossrefTitleMatch(title, candidateTitle)
    );
  });

  return match?.DOI ? scholar.fetchCrossrefBibtexByDoi(match.DOI) : "";
};

scholar.getMetadataBibtexForEntry = async function (entry) {
  const resultData = scholar.getResultData(entry);
  const doi = scholar.extractDoiFromText(
    `${resultData.title} ${resultData.url} ${resultData.metadata || ""} ${
      resultData.snippet || ""
    }`,
  );
  const arxivId = scholar.extractArxivIdFromText(
    `${resultData.title} ${resultData.url} ${resultData.pdfUrl || ""} ${
      resultData.metadata || ""
    } ${resultData.snippet || ""}`,
  );

  try {
    const doiBibtex = await scholar.fetchCrossrefBibtexByDoi(doi);
    if (doiBibtex) {
      return doiBibtex;
    }
  } catch (error) {
    // Fall through to strict title lookup.
  }

  try {
    const titleBibtex = await scholar.fetchCrossrefBibtexByTitle(
      resultData.title,
      resultData.year,
    );
    if (titleBibtex) {
      return titleBibtex;
    }
  } catch (error) {
    // Fall through to arXiv lookup.
  }

  try {
    const arxivBibtex = await scholar.fetchArxivBibtexById(arxivId);
    if (arxivBibtex) {
      return arxivBibtex;
    }
  } catch (error) {
    // Keep export conservative rather than fabricating citation fields.
  }

  return "";
};

scholar.getReliableBibtexForEntry = async function (entry, options = {}) {
  const metadataBibtex = await scholar.getMetadataBibtexForEntry(entry);
  if (metadataBibtex) {
    return metadataBibtex;
  }

  try {
    return await scholar.fetchGoogleScholarBibtex(entry, options);
  } catch (error) {
    return "";
  }
};

scholar.getExistingResultKeys = function () {
  return new Set(
    scholar
      .collectResultEntries(document)
      .map((entry) => scholar.getResultKey(entry)),
  );
};

scholar.t = function (key, params) {
  const language =
    typeof filter !== "undefined" && filter.settings?.language
      ? filter.settings.language
      : "zh";
  if (typeof onlyccfaI18n !== "undefined") {
    return onlyccfaI18n.t(language, key, params);
  }
  return key;
};

scholar.setDeepSearchState = function (status, isLoading) {
  const statusNode = document.querySelector(".ccf-filter-deep-status");
  if (statusNode) {
    statusNode.textContent = status || "";
  }

  const button = document.querySelector('[data-action="deep-search"]');
  if (button) {
    button.disabled = Boolean(isLoading);
  }
};

scholar.importDeepEntry = function (entry) {
  const imported = document.importNode(entry, true);
  imported.classList.add("onlyccfa-deep-result");
  imported.dataset.onlyccfaDeepResult = "true";
  return imported;
};

scholar.createDeepState = function () {
  return {
    queryKey: scholar.getSearchKey(window.location.href),
    nextStart:
      scholar.getCurrentStart(window.location.href) +
      scholar.collectResultEntries(document).length,
    seen: scholar.getExistingResultKeys(),
    scanned: scholar.collectResultEntries(document).length,
    appended: 0,
  };
};

scholar.getDeepState = function () {
  const queryKey = scholar.getSearchKey(window.location.href);
  if (!scholar.deepState || scholar.deepState.queryKey !== queryKey) {
    scholar.deepState = scholar.createDeepState();
  }
  return scholar.deepState;
};

scholar.clearDeepResults = function () {
  const entries =
    typeof filter !== "undefined" && filter.getFilterEntries
      ? filter.getFilterEntries()
      : Array.from(document.querySelectorAll(".onlyccfa-deep-result"));

  entries
    .filter((entry) => entry.dataset?.onlyccfaDeepResult === "true")
    .forEach((entry) => {
      entry.remove();
    });

  if (typeof filter !== "undefined" && Array.isArray(filter.managedEntries)) {
    filter.managedEntries = filter.managedEntries.filter(
      (entry) => entry.dataset?.onlyccfaDeepResult !== "true",
    );
  }

  document.querySelectorAll(".onlyccfa-deep-result").forEach((entry) => {
    entry.remove();
  });
  scholar.deepState = null;
  scholar.setDeepSearchState(scholar.t("deepCleared"), false);
  if (typeof filter !== "undefined") {
    filter.applyFilter();
  }
};

scholar.loadDeepResults = async function (targetCount) {
  if (scholar.deepLoading) {
    return;
  }

  const container = document.querySelector("#gs_res_ccl_mid");
  if (!container) {
    scholar.setDeepSearchState(scholar.t("noScholarResults"), false);
    return;
  }

  scholar.deepLoading = true;
  const state = scholar.getDeepState();
  const batchTarget = Number(targetCount) || scholar.deepTargetCount;
  const targetScanned = state.scanned + batchTarget;
  const batchStartScanned = state.scanned;
  const batchStartAppended = state.appended;

  scholar.setDeepSearchState(scholar.t("loading"), true);

  try {
    for (let index = 0; state.scanned < targetScanned; index += 1) {
      if (index > 0 || state.scanned > batchStartScanned) {
        await scholar.wait(scholar.deepRequestDelay);
      }

      const url = scholar.withPageParams(
        window.location.href,
        state.nextStart,
        scholar.deepPageSize,
      );
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Google Scholar returned ${response.status}`);
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const entries = scholar.collectResultEntries(doc);
      if (entries.length === 0) {
        break;
      }

      for (const entry of entries) {
        if (state.scanned >= targetScanned) {
          break;
        }

        state.scanned += 1;
        const key = scholar.getResultKey(entry);
        if (!key || state.seen.has(key)) {
          continue;
        }

        state.seen.add(key);
        container.appendChild(scholar.importDeepEntry(entry));
        state.appended += 1;
      }

      state.nextStart += entries.length || scholar.deepPageSize;
      scholar.setDeepSearchState(
        scholar.t("deepProgress", {
          appended: state.appended - batchStartAppended,
          scanned: state.scanned - batchStartScanned,
          target: batchTarget,
        }),
        true,
      );

      scholar.appendRank();
      if (typeof filter !== "undefined") {
        filter.applyFilter();
      }

      if (entries.length < Math.min(scholar.deepPageSize, 20)) {
        break;
      }
    }

    scholar.appendRank();
    if (typeof filter !== "undefined") {
      filter.applyFilter();
    }
    scholar.setDeepSearchState(
      scholar.t("deepDone", {
        scanned: state.scanned - batchStartScanned,
        appended: state.appended - batchStartAppended,
      }),
      false,
    );
  } catch (error) {
    scholar.setDeepSearchState(
      scholar.t("deepStopped", { message: error.message || "request failed" }),
      false,
    );
  } finally {
    scholar.deepLoading = false;
  }
};

scholar.extractAuthors = function (metadata) {
  const authorText = (metadata || "").split(/\s[-–—]\s/)[0] || "";
  return authorText
    .split(",")
    .map((author) => author.trim())
    .filter(Boolean);
};

scholar.cleanProfileText = function (text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
};

scholar.extractCitationVenue = function (metadata) {
  return scholar
    .cleanProfileText(metadata)
    .replace(/,?\s*\b(19|20)\d{2}\b\s*$/g, "")
    .replace(/,\s*\d[\d\s,–-]*(?:,\s*)?$/g, "")
    .replace(/\s+\d+(?:\s*\([^)]*\)|\s*\[[^\]]*\])?\s*$/g, "")
    .replace(/\s*,\s*$/g, "")
    .trim();
};

scholar.extractYear = function (metadata) {
  const match = (metadata || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
};

scholar.getResultTags = function (entry) {
  return Array.from(entry.querySelectorAll?.(".ccf-rank, .rank-source") || [])
    .map((node) => node.textContent.trim())
    .filter(Boolean);
};

scholar.getPdfUrl = function (entry) {
  const pdfLink =
    entry.querySelector(".gs_or_ggsm a") ||
    Array.from(entry.querySelectorAll?.("a") || []).find((link) =>
      /\.pdf(\?|#|$)/i.test(link.href || link.getAttribute?.("href") || ""),
    );
  const href = pdfLink?.href || pdfLink?.getAttribute?.("href") || "";
  return href ? new URL(href, scholar.getBaseUrl()).toString() : "";
};

scholar.getResultData = function (entry) {
  const titleLink =
    entry.querySelector("h3 a") || entry.querySelector("a.gsc_a_at");
  const citationMeta = Array.from(entry.querySelectorAll?.(".gs_gray") || []);
  const citationAuthorText = citationMeta[0]?.textContent || "";
  const citationVenueText = citationMeta[1]?.textContent || "";
  const metadata =
    entry.querySelector(".gs_a")?.textContent ||
    (citationVenueText
      ? `${scholar.cleanProfileText(citationAuthorText)} - ${scholar.cleanProfileText(
          citationVenueText,
        )}`
      : scholar.cleanProfileText(citationAuthorText));
  const snippet = entry.querySelector(".gs_rs")?.textContent || "";
  const citationYear =
    entry.querySelector("td.gsc_a_y span")?.textContent ||
    entry.querySelector("td.gsc_a_y")?.textContent ||
    "";
  const venue = citationVenueText
    ? scholar.extractCitationVenue(citationVenueText)
    : scholar.extractVenue(metadata, titleLink?.href || "");
  return {
    title: titleLink?.textContent?.replace(/\s+/g, " ").trim() || "Untitled",
    url: titleLink?.href || "",
    pdfUrl: scholar.getPdfUrl(entry),
    authors: scholar.extractAuthors(citationAuthorText || metadata),
    year: scholar.extractYear(citationYear || metadata),
    venue,
    metadata,
    snippet,
    tags: scholar.getResultTags(entry),
  };
};

scholar.getSelectedEntries = function () {
  return Array.from(
    document.querySelectorAll(".onlyccfa-select-result:checked"),
  )
    .map((input) => input.closest("#gs_res_ccl_mid > div, tr.gsc_a_tr"))
    .filter(Boolean);
};

scholar.getCitationEntries = function (
  doc = typeof document === "undefined" ? null : document,
) {
  return Array.from(doc?.querySelectorAll?.("#gsc_a_b tr.gsc_a_tr") || []);
};

scholar.getVisibleEntries = function () {
  const citationEntries = scholar.getCitationEntries();
  if (citationEntries.length > 0) {
    return citationEntries.filter((entry) => entry.style.display !== "none");
  }

  return scholar.collectResultEntries(document).filter((entry) => {
    return entry.style.display !== "none";
  });
};

scholar.getManagedEntries = function () {
  if (
    typeof filter !== "undefined" &&
    ["scholar", "scholarCitations"].includes(filter.siteConfig?.site) &&
    typeof filter.getFilterEntries === "function"
  ) {
    return filter.getFilterEntries();
  }

  return scholar.collectResultEntries(document);
};

scholar.getPoolEntries = function () {
  return scholar.getManagedEntries().filter((entry) => {
    return entry.dataset.onlyccfaDeepResult === "true";
  });
};

scholar.getEntriesForExport = function (scope) {
  if (scope === "selected") {
    return scholar.getSelectedEntries();
  }
  if (scope === "pool") {
    return scholar.getPoolEntries();
  }
  return scholar.getVisibleEntries();
};

scholar.getBibtexCacheKey = function (entry, options = {}) {
  const mode =
    options.allowGoogleCitationFetch === false ? "metadata" : "with-google";
  return `${mode}:${scholar.getResultKey(entry) || scholar.getResultData(entry).title}`;
};

scholar.getCachedReliableBibtexForEntry = async function (entry, options = {}) {
  const key = scholar.getBibtexCacheKey(entry, options);
  if (key && scholar.bibtexCache.has(key)) {
    return scholar.bibtexCache.get(key);
  }

  const request = scholar
    .getReliableBibtexForEntry(entry, options)
    .then(scholar.formatBibtex);
  if (key) {
    scholar.bibtexCache.set(key, request);
  }

  try {
    const formattedBibtex = await request;
    if (key) {
      scholar.bibtexCache.set(key, formattedBibtex);
    }
    return formattedBibtex;
  } catch (error) {
    if (key) {
      scholar.bibtexCache.delete(key);
    }
    throw error;
  }
};

scholar.buildBibtexForEntries = function (entries) {
  return scholar
    .buildBibtexResultForEntries(entries)
    .then((result) => result.bibtex);
};

scholar.buildBibtexResultForEntries = async function (entries) {
  const results = await scholar.mapWithConcurrency(
    entries,
    scholar.bibtexConcurrency,
    async function (entry) {
      try {
        const bibtex = await scholar.getCachedReliableBibtexForEntry(entry, {
          allowGoogleCitationFetch: false,
        });
        return {
          bibtex,
          failed: bibtex ? 0 : 1,
        };
      } catch (error) {
        return {
          bibtex: "",
          failed: 1,
        };
      }
    },
  );

  return {
    bibtex: results
      .map((result) => result.bibtex)
      .filter(Boolean)
      .join("\n\n"),
    exported: results.filter((result) => result.bibtex).length,
    failed: results.reduce((count, result) => count + result.failed, 0),
  };
};

scholar.downloadText = function (filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

scholar.copyText = function (content) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(content);
  }

  const textarea = document.createElement("textarea");
  textarea.value = content;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  return Promise.resolve();
};

scholar.setExportStatus = function (message) {
  const node = document.querySelector(".ccf-filter-export-status");
  if (node) {
    node.textContent = message || "";
  }
};

scholar.exportBibtex = async function (scope) {
  const entries = scholar.getEntriesForExport(scope);
  if (entries.length === 0) {
    scholar.setExportStatus(scholar.t("noResults"));
    return "";
  }

  scholar.setExportStatus(scholar.t("bibtexFetching"));
  const result = await scholar.buildBibtexResultForEntries(entries);
  const bibtex = result.bibtex;
  if (!bibtex) {
    scholar.setExportStatus(scholar.t("bibtexUnavailable"));
    return "";
  }

  scholar.downloadText(`onlyccfa-${scope}.bib`, bibtex);
  scholar.setExportStatus(
    scholar.t("bibtexDone", {
      count: result.exported,
      failed: result.failed,
    }),
  );
  return bibtex;
};

scholar.getRankBadgeHost = function (
  entry,
  doc = typeof document === "undefined" ? null : document,
) {
  if (!entry) {
    return null;
  }

  const existing = entry.querySelector(".onlyccfa-rank-badges");
  if (existing) {
    return existing;
  }

  if (!doc?.createElement) {
    return null;
  }

  const title = entry.querySelector("h3") || entry.querySelector("a.gsc_a_at");
  if (!title) {
    return null;
  }

  const host = doc.createElement("div");
  host.className = "onlyccfa-rank-badges";
  title.insertAdjacentElement("afterend", host);
  return host;
};

scholar.getEntryFromRankAnchor = function (anchor) {
  const node = anchor?.jquery ? anchor[0] : anchor;
  return node?.closest?.("div.gs_ri, tr.gsc_a_tr") || null;
};

scholar.getBadgeNode = function (badge) {
  return badge?.jquery ? badge[0] : badge;
};

scholar.getNodeClassName = function (node) {
  const className = node?.className || "";
  return typeof className === "string" ? className : className.baseVal || "";
};

scholar.getBadgeRankSource = function (badge) {
  const node = scholar.getBadgeNode(badge);
  return (
    node?.dataset?.rankSource || node?.getAttribute?.("data-rank-source") || ""
  );
};

scholar.getBadgeRankValue = function (badge) {
  const node = scholar.getBadgeNode(badge);
  return (
    node?.dataset?.rankValue ||
    node?.getAttribute?.("data-rank-value") ||
    String(node?.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
  );
};

scholar.isCcfRankBadge = function (badge) {
  const node = scholar.getBadgeNode(badge);
  return (
    scholar.getBadgeRankSource(node) === "ccf" ||
    scholar.getNodeClassName(node).split(/\s+/).includes("ccf-rank")
  );
};

scholar.isRankSourceBadge = function (badge) {
  const node = scholar.getBadgeNode(badge);
  return scholar.getNodeClassName(node).split(/\s+/).includes("rank-source");
};

scholar.getBadgeDedupKey = function (badge) {
  const node = scholar.getBadgeNode(badge);
  const rankValue = scholar.getBadgeRankValue(badge);
  if (scholar.isCcfRankBadge(node)) {
    return rankValue ? `ccf|${rankValue}` : "";
  }

  if (scholar.isRankSourceBadge(node)) {
    const rankSource = scholar.getBadgeRankSource(node);
    const text = String(node?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!rankSource && !rankValue && !text) {
      return "";
    }
    return `rank-source|${rankSource}|${rankValue}|${text}`;
  }

  return "";
};

scholar.hasDuplicateRankBadge = function (host, badge) {
  if (!host?.querySelectorAll) {
    return false;
  }

  const dedupKey = scholar.getBadgeDedupKey(badge);
  if (!dedupKey) {
    return false;
  }

  return Array.from(host.querySelectorAll(".ccf-rank, .rank-source")).some(
    (existing) => scholar.getBadgeDedupKey(existing) === dedupKey,
  );
};

scholar.appendRankBadge = function (anchor, badge, entry) {
  const host = scholar.getRankBadgeHost(
    entry || scholar.getEntryFromRankAnchor(anchor),
  );
  if (host) {
    if (scholar.hasDuplicateRankBadge(host, badge)) {
      return;
    }
    $(host).append(badge);
    return;
  }

  $(anchor).after(badge);
};

scholar.appendResultActions = function (entry) {
  if (entry.querySelector(".onlyccfa-result-actions")) {
    return;
  }

  const title = entry.querySelector("h3") || entry.querySelector("a.gsc_a_at");
  if (!title) {
    return;
  }

  const actions = document.createElement("div");
  actions.className = "onlyccfa-result-actions";
  actions.innerHTML = `
    <label>
      <input class="onlyccfa-select-result" type="checkbox">
      <span>${scholar.t("selectResult")}</span>
    </label>
    <button type="button" data-action="copy-entry-bibtex">${scholar.t(
      "copyBibtex",
    )}</button>
  `;
  title.insertAdjacentElement("afterend", actions);
};

scholar.setVenueName = function (entry, venueName) {
  if (!entry || !venueName || entry.querySelector(".onlyccfa-venue-name")) {
    return;
  }

  const anchor =
    entry.querySelector(".onlyccfa-result-actions") ||
    entry.querySelector(".onlyccfa-rank-badges") ||
    entry.querySelector("h3") ||
    entry.querySelector("a.gsc_a_at");
  if (!anchor) {
    return;
  }

  const venue = document.createElement("div");
  venue.className = "onlyccfa-venue-name";
  venue.textContent = `${scholar.t("matchedVenue")}: ${venueName}`;
  anchor.insertAdjacentElement("afterend", venue);
};

scholar.appendBadgeToHost = function (host, badge) {
  if (!host || !badge) {
    return;
  }

  if (badge.jquery && badge[0] && host.appendChild) {
    host.appendChild(badge[0]);
    return;
  }

  if (badge.nodeType && host.appendChild) {
    host.appendChild(badge);
    return;
  }

  $(host).append(badge);
};

scholar.appendAuthorBadges = function (entry) {
  if (
    !entry ||
    entry.dataset?.onlyccfaAuthorRanked === "true" ||
    typeof authorSources === "undefined"
  ) {
    return false;
  }

  const tags = authorSources.resolveAuthors(
    scholar.getResultData(entry).authors,
  );
  entry.dataset.onlyccfaAuthorRanked = "true";
  if (tags.length === 0) {
    return false;
  }

  const host = scholar.getRankBadgeHost(entry);
  tags.forEach((tag) => {
    scholar.appendBadgeToHost(host, authorSources.getTagSpan(tag));
  });
  return true;
};

scholar.appendVenueRank = function (node, venue, entry) {
  if (!venue) {
    return false;
  }

  let matched = false;

  if (ccf.resolveVenueText) {
    let venueMatch = ccf.resolveVenueText(venue);
    if (venueMatch) {
      for (let getRankSpan of scholar.rankSpanList) {
        scholar.appendRankBadge(
          node,
          getRankSpan(venueMatch.refine, venueMatch.type),
          entry,
        );
      }
      const displayName =
        typeof ccf.getVenueDisplayName === "function"
          ? ccf.getVenueDisplayName(venueMatch.refine, venueMatch.type, venue)
          : venueMatch.refine || venue;
      scholar.setVenueName(entry, displayName);
      matched = true;
    }
  }

  if (typeof rankSources != "undefined" && rankSources.resolveVenueText) {
    const tags = rankSources.resolveVenueText(venue);
    if (tags.length > 0) {
      tags.forEach((tag) => {
        scholar.appendRankBadge(node, rankSources.getTagSpan(tag), entry);
      });
      scholar.setVenueName(
        entry,
        tags.find((tag) => tag.matchedTitle)?.matchedTitle || venue,
      );
      matched = true;
    }
  }

  return matched;
};

scholar.appendResolvedSearchResultVenueRank = async function (
  node,
  entry,
  data,
) {
  try {
    const resolvedVenue = await scholar.fetchSearchResultVenue(data);
    if (!resolvedVenue) {
      return false;
    }
    scholar.setVenueName(entry, resolvedVenue);
    return scholar.appendVenueRank(node, resolvedVenue, entry);
  } catch (error) {
    return false;
  }
};

scholar.scheduleSearchResultVenueRank = function (node, entry, data) {
  if (
    !scholar.shouldFetchSearchResultVenue(data) ||
    entry.dataset?.onlyccfaSearchVenueLookupStarted === "true"
  ) {
    return false;
  }

  entry.dataset.onlyccfaSearchVenueLookupStarted = "true";
  scholar.appendResolvedSearchResultVenueRank(node, entry, data);
  return true;
};

scholar.appendRank = function () {
  let elements = $("#gs_res_ccl_mid > div > div.gs_ri");
  elements.each(function (index) {
    scholar.appendResultActions(this);
    scholar.appendAuthorBadges(this);

    if ($(this).hasClass("ccf-ranked")) {
      return;
    }

    let node = $(this).find("h3 > a");
    if (node.length) {
      let title = node.text();
      let metadata = $(this).find("div.gs_a").text();
      let venue = scholar.extractVenue(metadata, node[0]?.href || "");
      $(this).addClass("ccf-ranked");
      if (scholar.appendVenueRank(node, venue, this)) {
        return;
      }
      scholar.scheduleSearchResultVenueRank(node, this, {
        title,
        year: (metadata.match(/\b(19|20)\d{2}\b/g) || []).slice(-1)[0] || "",
        venue,
      });
      let data = $(this)
        .find("div.gs_a")
        .text()
        .replace(/[\,\-\…]/g, "")
        .split(" ");
      let author = data[1];
      let year = data.slice(-3)[0];
      setTimeout(function () {
        fetchRank(node, title, author, year, scholar);
      }, 100 * index);
    }
  });
};

if (typeof document !== "undefined") {
  document.addEventListener("click", function (event) {
    if (event.target?.dataset?.action !== "copy-entry-bibtex") {
      return;
    }

    const entry = event.target.closest("#gs_res_ccl_mid > div, tr.gsc_a_tr");
    if (!entry) {
      return;
    }

    scholar.setExportStatus(scholar.t("bibtexFetching"));
    scholar
      .getCachedReliableBibtexForEntry(entry, {
        allowGoogleCitationFetch: true,
      })
      .then((bibtex) => {
        if (!bibtex) {
          scholar.setExportStatus(scholar.t("bibtexUnavailable"));
          return;
        }
        scholar.copyText(bibtex).then(() => {
          scholar.setExportStatus(scholar.t("copied"));
        });
      })
      .catch(() => {
        scholar.setExportStatus(scholar.t("bibtexUnavailable"));
      });
  });
}

scholar.observeCitations = function () {
  console.debug("Start citations ...");
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // 检查是否有新的文献项被添加到列表
        scholar.appendRanks();
      }
    }
  });

  // 开始观察文献列表的变化
  const targetNode = document.getElementById("gsc_a_b");
  if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
  }
};

scholar.appendRanks = function () {
  let elements = $("tr.gsc_a_tr");
  elements.each(function (index) {
    const entry = this;
    scholar.appendResultActions(entry);
    scholar.appendAuthorBadges(entry);

    if ($(entry).hasClass("ccf-ranked")) {
      return;
    }

    let node = $(entry).find("td.gsc_a_t > a.gsc_a_at, td.gsc_a_t > a").first();
    if (!node.length) {
      return;
    }

    const data = scholar.getResultData(entry);
    const fetchFallbackRank = function () {
      const author = (data.authors[0] || "").split(/\s+/).pop() || "";
      setTimeout(function () {
        fetchRank(node, data.title, author, data.year, scholar);
      }, 100 * index);
    };

    $(entry).addClass("ccf-ranked");
    if (scholar.appendVenueRank(node, data.venue, entry)) {
      return;
    }

    if (
      scholar.shouldFetchCitationDetailVenue(data.venue) &&
      scholar.getCitationDetailUrl(entry)
    ) {
      scholar.fetchCitationDetailVenue(entry).then(function (detailVenue) {
        if (detailVenue && scholar.appendVenueRank(node, detailVenue, entry)) {
          if (typeof filter !== "undefined") {
            filter.applyFilter();
          }
          return;
        }
        fetchFallbackRank();
      });
      return;
    }

    fetchFallbackRank();
  });
};
