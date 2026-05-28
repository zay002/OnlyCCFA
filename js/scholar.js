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

scholar.run = function () {
  let url = window.location.pathname;
  if (url == "/scholar") {
    scholar.appendRank();
  } else if (url == "/citations") {
    scholar.appendRanks(); // 页面加载时先处理一次作者主页上的条目
    scholar.observeCitations(); // 然后设置观察者以处理动态加载的条目
  }
};

scholar.extractVenue = function (metadata) {
  const parts = (metadata || "").split(/\s[-–—]\s/);
  if (parts.length < 2) {
    return "";
  }

  let venue = parts[1].trim();
  let yearMatch = venue.match(/,\s*(19|20)\d{2}\b/);
  if (yearMatch) {
    venue = venue.substring(0, yearMatch.index);
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
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

scholar.fetchGoogleScholarBibtex = async function (entry) {
  const citationUrl = scholar.getCitationUrl(entry);
  if (!citationUrl) {
    return "";
  }

  const citationResponse = await fetch(citationUrl, { credentials: "include" });
  if (!citationResponse.ok) {
    throw new Error(
      `Google Scholar citation returned ${citationResponse.status}`,
    );
  }

  const citationHtml = await citationResponse.text();
  const bibtexUrl = scholar.extractBibtexHref(citationHtml, citationUrl);
  if (!bibtexUrl) {
    return "";
  }

  const bibtexResponse = await fetch(bibtexUrl, { credentials: "include" });
  if (!bibtexResponse.ok) {
    throw new Error(`Google Scholar BibTeX returned ${bibtexResponse.status}`);
  }

  return (await bibtexResponse.text()).trim();
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

scholar.extractYear = function (metadata) {
  const match = (metadata || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
};

scholar.getResultTags = function (entry) {
  return Array.from(entry.querySelectorAll(".ccf-rank, .rank-source"))
    .map((node) => node.textContent.trim())
    .filter(Boolean);
};

scholar.getResultData = function (entry) {
  const titleLink = entry.querySelector("h3 a");
  const metadata = entry.querySelector(".gs_a")?.textContent || "";
  return {
    title: titleLink?.textContent?.replace(/\s+/g, " ").trim() || "Untitled",
    url: titleLink?.href || "",
    authors: scholar.extractAuthors(metadata),
    year: scholar.extractYear(metadata),
    venue: scholar.extractVenue(metadata),
    tags: scholar.getResultTags(entry),
  };
};

scholar.getSelectedEntries = function () {
  return Array.from(
    document.querySelectorAll(".onlyccfa-select-result:checked"),
  )
    .map((input) => input.closest("#gs_res_ccl_mid > div"))
    .filter(Boolean);
};

scholar.getVisibleEntries = function () {
  return scholar
    .collectResultEntries(document)
    .filter((entry) => entry.style.display !== "none");
};

scholar.getPoolEntries = function () {
  return scholar.collectResultEntries(document).filter((entry) => {
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

scholar.buildBibtexForEntries = function (entries) {
  return scholar
    .buildBibtexResultForEntries(entries)
    .then((result) => result.bibtex);
};

scholar.buildBibtexResultForEntries = async function (entries) {
  const results = [];
  let failed = 0;

  for (const entry of entries) {
    try {
      const bibtex = await scholar.fetchGoogleScholarBibtex(entry);
      if (bibtex) {
        results.push(bibtex);
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
    }
  }

  return {
    bibtex: results.join("\n\n"),
    exported: results.length,
    failed,
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

scholar.importToZotero = async function (category) {
  const entries = scholar.getSelectedEntries();
  const targetEntries = entries.length ? entries : scholar.getVisibleEntries();
  if (targetEntries.length === 0) {
    scholar.setExportStatus(scholar.t("noResults"));
    return false;
  }

  scholar.setExportStatus(scholar.t("bibtexFetching"));
  const bibtexResult = await scholar.buildBibtexResultForEntries(targetEntries);
  if (!bibtexResult.bibtex) {
    scholar.setExportStatus(scholar.t("bibtexUnavailable"));
    return false;
  }

  const items = bibtexResult.bibtex
    .split(/\n\s*\n/)
    .map((bibtex) => onlyccfaBibtex.toZoteroItemFromBibtex(bibtex, category));
  const endpoints = [
    "http://127.0.0.1:23119/connector/saveItems",
    "http://localhost:23119/connector/saveItems",
  ];

  try {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (response.ok) {
          scholar.setExportStatus(scholar.t("zoteroDone"));
          return true;
        }
      } catch (error) {
        // Try the next local Connector host before falling back to BibTeX.
      }
    }
    throw new Error("Zotero Connector unavailable");
  } catch (error) {
    scholar.downloadText("onlyccfa-zotero-fallback.bib", bibtexResult.bibtex);
    scholar.setExportStatus(scholar.t("zoteroFailed"));
    return false;
  }
};

scholar.appendResultActions = function (entry) {
  if (entry.querySelector(".onlyccfa-result-actions")) {
    return;
  }

  const title = entry.querySelector("h3");
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

scholar.appendVenueRank = function (node, venue) {
  if (!venue) {
    return false;
  }

  let matched = false;

  if (ccf.resolveVenueText) {
    let venueMatch = ccf.resolveVenueText(venue);
    if (venueMatch) {
      for (let getRankSpan of scholar.rankSpanList) {
        $(node).after(getRankSpan(venueMatch.refine, venueMatch.type));
      }
      matched = true;
    }
  }

  if (typeof rankSources != "undefined" && rankSources.appendVenueTags) {
    matched = rankSources.appendVenueTags(node, venue) || matched;
  }

  return matched;
};

scholar.appendRank = function () {
  let elements = $("#gs_res_ccl_mid > div > div.gs_ri");
  elements.each(function (index) {
    scholar.appendResultActions(this);

    if ($(this).hasClass("ccf-ranked")) {
      return;
    }

    let node = $(this).find("h3 > a");
    if (
      !node.next().hasClass("ccf-rank") &&
      !node.next().hasClass("rank-source")
    ) {
      let title = node.text();
      let metadata = $(this).find("div.gs_a").text();
      let venue = scholar.extractVenue(metadata);
      $(this).addClass("ccf-ranked");
      if (scholar.appendVenueRank(node, venue)) {
        return;
      }
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

    const entry = event.target.closest("#gs_res_ccl_mid > div");
    if (!entry) {
      return;
    }

    scholar.setExportStatus(scholar.t("bibtexFetching"));
    scholar
      .fetchGoogleScholarBibtex(entry)
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
    let node = $(this).find("td.gsc_a_t > a").first();
    if (!node.next().hasClass("ccf-rank") && !$(this).hasClass("ccf-ranked")) {
      let title = node.text();
      let author = $(this)
        .find("div.gs_gray")[0]
        .innerText.replace(/[\,\…]/g, "")
        .split(" ")[1];
      let year = $(this).find("td.gsc_a_y").text();
      $(this).addClass("ccf-ranked");
      setTimeout(function () {
        fetchRank(node, title, author, year, scholar);
      }, 100 * index);
    }
  });
};
