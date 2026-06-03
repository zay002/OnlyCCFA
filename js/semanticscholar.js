/**
 * MIT License
 *
 * Copyright (c) 2019-2023 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp)
 */

const semanticscholar = {};

semanticscholar.rankSpanList = [];
semanticscholar.bibtexCache = new Map();
semanticscholar.bibtexConcurrency = 2;
semanticscholar.resultSelector = [
  ".cl-paper-row",
  ".cl-paper-card",
  "[data-test-id='paper-card']",
  "[data-testid='paper-card']",
  "article",
].join(", ");
semanticscholar.titleSelector = [
  "a[data-test-id='title-link']",
  "a[data-testid='title-link']",
  "a[data-heap-id='paper_title']",
  ".cl-paper-title a",
  "h2 a",
  "h3 a",
].join(", ");
semanticscholar.venueSelector = [
  ".cl-paper-venue",
  "[data-test-id='paper-venue']",
  "[data-testid='paper-venue']",
  "[data-selenium-selector='paper-venue']",
].join(", ");
semanticscholar.authorSelector = [
  ".cl-paper-authors a",
  ".cl-paper-authors span",
  "[data-test-id='author-list'] a",
  "[data-testid='author-list'] a",
  "[data-heap-id='paper_author']",
].join(", ");
semanticscholar.yearSelector = [
  ".cl-paper-pubdates",
  "[data-test-id='paper-year']",
  "[data-testid='paper-year']",
  "[data-selenium-selector='paper-year']",
].join(", ");
semanticscholar.snippetSelector = [
  ".cl-paper-abstract",
  ".cl-paper-tldr",
  "[data-test-id='paper-abstract']",
  "[data-testid='paper-abstract']",
  "[data-test-id='tldr']",
  "[data-testid='tldr']",
].join(", ");

semanticscholar.run = function () {
  semanticscholar.appendRanks();

  if (typeof window !== "undefined") {
    $(window).bind("popstate", function () {
      semanticscholar.appendRanks();
    });
  }

  if (
    typeof MutationObserver !== "undefined" &&
    typeof document !== "undefined"
  ) {
    const rerank = semanticscholar.debounce(function () {
      semanticscholar.appendRanks();
      if (
        typeof filter !== "undefined" &&
        filter.siteConfig?.site === "semanticscholar"
      ) {
        filter.applyFilter();
      }
    }, 100);
    const observer = new MutationObserver(rerank);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setInterval(function () {
    semanticscholar.appendRanks();
  }, 1500);
};

semanticscholar.debounce = function (func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

semanticscholar.getBaseUrl = function () {
  if (typeof window !== "undefined" && window.location) {
    return window.location.href;
  }

  return "https://www.semanticscholar.org/search";
};

semanticscholar.cleanText = function (text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
};

semanticscholar.normalizeVenueText = function (text) {
  let source = semanticscholar.cleanText(text);
  const parenthesized = source.match(/\(([A-Za-z][A-Za-z0-9 .&/-]{1,30})\)/);
  if (parenthesized) {
    source = parenthesized[1];
  }

  return source
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\s*['’]\d{2}\b/g, "")
    .replace(/\s*,\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
};

semanticscholar.extractYear = function (...texts) {
  const match = texts
    .map((text) => String(text || ""))
    .join(" ")
    .match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
};

semanticscholar.getEntryFromNode = function (node) {
  return node?.closest?.(semanticscholar.resultSelector) || null;
};

semanticscholar.getRankBadgeHost = function (
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

  const titleLink = entry.querySelector(semanticscholar.titleSelector);
  const titleHost = titleLink?.closest?.("h2,h3") || titleLink;
  if (!titleHost || !doc?.createElement) {
    return null;
  }

  const host = doc.createElement("div");
  host.className = "onlyccfa-rank-badges";
  titleHost.insertAdjacentElement("afterend", host);
  return host;
};

semanticscholar.appendRankBadge = function (anchor, badge, entry) {
  const targetEntry = entry || semanticscholar.getEntryFromNode(anchor);
  const host = semanticscholar.getRankBadgeHost(targetEntry);
  if (host) {
    $(host).append(badge);
    targetEntry?.classList?.add("ccf-ranked");
    return;
  }

  $(anchor).after(badge);
  targetEntry?.classList?.add("ccf-ranked");
};

semanticscholar.t = function (key, params) {
  const language =
    typeof filter !== "undefined" && filter.settings?.language
      ? filter.settings.language
      : "zh";
  if (typeof onlyccfaI18n !== "undefined") {
    return onlyccfaI18n.t(language, key, params);
  }
  return key;
};

semanticscholar.appendResultActions = function (entry) {
  if (!entry || entry.querySelector(".onlyccfa-result-actions")) {
    return;
  }

  const titleLink = entry.querySelector(semanticscholar.titleSelector);
  const titleHost = titleLink?.closest?.("h2,h3") || titleLink;
  if (!titleHost) {
    return;
  }

  const actions = document.createElement("div");
  actions.className = "onlyccfa-result-actions";
  actions.innerHTML = `
    <label>
      <input class="onlyccfa-select-result" type="checkbox">
      <span>${semanticscholar.t("selectResult")}</span>
    </label>
    <button type="button" data-action="copy-entry-bibtex">${semanticscholar.t(
      "copyBibtex",
    )}</button>
  `;
  titleHost.insertAdjacentElement("afterend", actions);
};

semanticscholar.setVenueName = function (entry, venueName) {
  if (!entry || !venueName || entry.querySelector(".onlyccfa-venue-name")) {
    return;
  }

  const anchor =
    entry.querySelector(".onlyccfa-result-actions") ||
    entry.querySelector(".onlyccfa-rank-badges") ||
    entry.querySelector(semanticscholar.titleSelector);
  if (!anchor) {
    return;
  }

  const venue = document.createElement("div");
  venue.className = "onlyccfa-venue-name";
  venue.textContent = `${semanticscholar.t("matchedVenue")}: ${venueName}`;
  anchor.insertAdjacentElement("afterend", venue);
};

semanticscholar.appendBadgeToHost = function (host, badge) {
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

semanticscholar.appendAuthorBadges = function (entry) {
  if (
    !entry ||
    entry.dataset?.onlyccfaAuthorRanked === "true" ||
    typeof authorSources === "undefined"
  ) {
    return false;
  }

  const tags = authorSources.resolveAuthors(
    semanticscholar.extractAuthors(entry),
  );
  entry.dataset.onlyccfaAuthorRanked = "true";
  if (tags.length === 0) {
    return false;
  }

  const host = semanticscholar.getRankBadgeHost(entry);
  tags.forEach((tag) => {
    semanticscholar.appendBadgeToHost(host, authorSources.getTagSpan(tag));
  });
  return true;
};

semanticscholar.appendVenueRank = function (node, venue, entry) {
  if (!venue) {
    return false;
  }

  let matched = false;

  if (typeof ccf !== "undefined" && ccf.resolveVenueText) {
    const venueMatch = ccf.resolveVenueText(venue);
    if (venueMatch) {
      for (let getRankSpan of semanticscholar.rankSpanList) {
        semanticscholar.appendRankBadge(
          node,
          getRankSpan(venueMatch.refine, venueMatch.type),
          entry,
        );
      }
      const displayName =
        typeof ccf.getVenueDisplayName === "function"
          ? ccf.getVenueDisplayName(venueMatch.refine, venueMatch.type, venue)
          : venueMatch.refine || venue;
      semanticscholar.setVenueName(entry, displayName);
      matched = true;
    }
  }

  if (typeof rankSources !== "undefined" && rankSources.resolveVenueText) {
    const tags = rankSources.resolveVenueText(venue);
    if (tags.length > 0) {
      tags.forEach((tag) => {
        semanticscholar.appendRankBadge(
          node,
          rankSources.getTagSpan(tag),
          entry,
        );
      });
      semanticscholar.setVenueName(
        entry,
        tags.find((tag) => tag.matchedTitle)?.matchedTitle || venue,
      );
      matched = true;
    }
  }

  return matched;
};

semanticscholar.appendRanks = function () {
  const entries = Array.from(
    document.querySelectorAll(semanticscholar.resultSelector),
  );
  entries.forEach(function (entry, index) {
    semanticscholar.appendResultActions(entry);
    semanticscholar.appendAuthorBadges(entry);

    if (
      entry.classList.contains("ccf-ranked") &&
      entry.dataset.onlyccfaVenueText ===
        semanticscholar.normalizeVenueText(
          entry.querySelector(semanticscholar.venueSelector)?.textContent || "",
        )
    ) {
      return;
    }

    const titleLink = entry.querySelector(semanticscholar.titleSelector);
    const venueNode = entry.querySelector(semanticscholar.venueSelector);
    const venue = semanticscholar.normalizeVenueText(
      venueNode?.textContent || "",
    );

    if (!venue) {
      return;
    }

    entry.dataset.onlyccfaVenueText = venue;

    if (semanticscholar.appendVenueRank(titleLink || venueNode, venue, entry)) {
      return;
    }

    if (!titleLink || entry.dataset.onlyccfaDblpLookupQueued === "true") {
      return;
    }

    entry.dataset.onlyccfaDblpLookupQueued = "true";

    const data = semanticscholar.getResultData(entry);
    setTimeout(function () {
      fetchRank(
        titleLink,
        data.title,
        (data.authors[0] || "").split(/\s+/).pop() || "",
        data.year,
        semanticscholar,
      );
    }, 100 * index);
  });
};

semanticscholar.getPdfUrl = function (entry) {
  const pdfLink = Array.from(entry.querySelectorAll?.("a") || []).find(
    (link) => {
      const href = link.href || link.getAttribute?.("href") || "";
      const text = link.textContent || "";
      return /\.pdf(\?|#|$)/i.test(href) || /^pdf$/i.test(text.trim());
    },
  );
  const href = pdfLink?.href || pdfLink?.getAttribute?.("href") || "";
  return href ? new URL(href, semanticscholar.getBaseUrl()).toString() : "";
};

semanticscholar.extractAuthors = function (entry) {
  const authorNodes = Array.from(
    entry.querySelectorAll?.(semanticscholar.authorSelector) || [],
  );
  return authorNodes
    .map((node) => semanticscholar.cleanText(node.textContent))
    .filter((name, index, names) => name && names.indexOf(name) === index);
};

semanticscholar.getResultTags = function (entry) {
  return Array.from(entry.querySelectorAll(".ccf-rank, .rank-source"))
    .map((node) => node.textContent.trim())
    .filter(Boolean);
};

semanticscholar.getResultData = function (entry) {
  const titleLink = entry.querySelector(semanticscholar.titleSelector);
  const venueText =
    entry.querySelector(semanticscholar.venueSelector)?.textContent || "";
  const yearText =
    entry.querySelector(semanticscholar.yearSelector)?.textContent || "";
  const snippet =
    entry.querySelector(semanticscholar.snippetSelector)?.textContent || "";

  return {
    title: semanticscholar.cleanText(titleLink?.textContent) || "Untitled",
    url: titleLink?.href
      ? new URL(titleLink.href, semanticscholar.getBaseUrl()).toString()
      : "",
    pdfUrl: semanticscholar.getPdfUrl(entry),
    authors: semanticscholar.extractAuthors(entry),
    year: semanticscholar.extractYear(venueText, yearText, snippet),
    venue: semanticscholar.normalizeVenueText(venueText),
    metadata: semanticscholar.cleanText(`${venueText} ${yearText}`),
    snippet: semanticscholar.cleanText(snippet),
    tags: semanticscholar.getResultTags(entry),
  };
};

semanticscholar.getResultKey = function (entry) {
  const data = semanticscholar.getResultData(entry);
  return data.url || data.title.toLowerCase();
};

semanticscholar.getMetadataBibtexForEntry = async function (entry) {
  const data = semanticscholar.getResultData(entry);
  const doi = scholar.extractDoiFromText(
    `${data.title} ${data.url} ${data.pdfUrl} ${data.metadata} ${data.snippet}`,
  );
  const arxivId = scholar.extractArxivIdFromText(
    `${data.title} ${data.url} ${data.pdfUrl} ${data.metadata} ${data.snippet}`,
  );

  try {
    const doiBibtex = await scholar.fetchCrossrefBibtexByDoi(doi);
    if (doiBibtex) {
      return doiBibtex;
    }
  } catch (error) {
    // Fall through to title lookup.
  }

  try {
    const titleBibtex = await scholar.fetchCrossrefBibtexByTitle(
      data.title,
      data.year,
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
    // Keep conservative fallback below.
  }

  if (
    typeof onlyccfaBibtex !== "undefined" &&
    data.title &&
    data.authors.length
  ) {
    return onlyccfaBibtex.buildEntry(data);
  }

  return "";
};

semanticscholar.getReliableBibtexForEntry = function (entry) {
  return semanticscholar.getMetadataBibtexForEntry(entry);
};

semanticscholar.getCachedReliableBibtexForEntry = async function (entry) {
  const key = semanticscholar.getResultKey(entry);
  if (key && semanticscholar.bibtexCache.has(key)) {
    return semanticscholar.bibtexCache.get(key);
  }

  const request = semanticscholar
    .getReliableBibtexForEntry(entry)
    .then(scholar.formatBibtex);
  if (key) {
    semanticscholar.bibtexCache.set(key, request);
  }

  try {
    const formattedBibtex = await request;
    if (key) {
      semanticscholar.bibtexCache.set(key, formattedBibtex);
    }
    return formattedBibtex;
  } catch (error) {
    if (key) {
      semanticscholar.bibtexCache.delete(key);
    }
    throw error;
  }
};

semanticscholar.getSelectedEntries = function () {
  return Array.from(
    document.querySelectorAll(".onlyccfa-select-result:checked"),
  )
    .map((input) => input.closest(semanticscholar.resultSelector))
    .filter(Boolean);
};

semanticscholar.getVisibleEntries = function () {
  return Array.from(
    document.querySelectorAll(semanticscholar.resultSelector),
  ).filter((entry) => entry.style.display !== "none");
};

semanticscholar.getEntriesForExport = function (scope) {
  if (scope === "selected") {
    return semanticscholar.getSelectedEntries();
  }
  return semanticscholar.getVisibleEntries();
};

semanticscholar.buildBibtexResultForEntries = async function (entries) {
  const results = await scholar.mapWithConcurrency(
    entries,
    semanticscholar.bibtexConcurrency,
    async function (entry) {
      try {
        const bibtex =
          await semanticscholar.getCachedReliableBibtexForEntry(entry);
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

semanticscholar.setExportStatus = function (message) {
  const node = document.querySelector(".ccf-filter-export-status");
  if (node) {
    node.textContent = message || "";
  }
};

semanticscholar.exportBibtex = async function (scope) {
  const entries = semanticscholar.getEntriesForExport(scope);
  if (entries.length === 0) {
    semanticscholar.setExportStatus(semanticscholar.t("noResults"));
    return "";
  }

  semanticscholar.setExportStatus(semanticscholar.t("bibtexFetching"));
  const result = await semanticscholar.buildBibtexResultForEntries(entries);
  const bibtex = result.bibtex;
  if (!bibtex) {
    semanticscholar.setExportStatus(semanticscholar.t("bibtexUnavailable"));
    return "";
  }

  scholar.downloadText(`onlyccfa-semanticscholar-${scope}.bib`, bibtex);
  semanticscholar.setExportStatus(
    semanticscholar.t("bibtexDone", {
      count: result.exported,
      failed: result.failed,
    }),
  );
  return bibtex;
};

if (typeof document !== "undefined") {
  document.addEventListener("click", function (event) {
    if (event.target?.dataset?.action !== "copy-entry-bibtex") {
      return;
    }

    const entry = event.target.closest(semanticscholar.resultSelector);
    if (!entry) {
      return;
    }

    semanticscholar.setExportStatus(semanticscholar.t("bibtexFetching"));
    semanticscholar
      .getCachedReliableBibtexForEntry(entry)
      .then((bibtex) => {
        if (!bibtex) {
          semanticscholar.setExportStatus(
            semanticscholar.t("bibtexUnavailable"),
          );
          return;
        }
        scholar.copyText(bibtex).then(() => {
          semanticscholar.setExportStatus(semanticscholar.t("copied"));
        });
      })
      .catch(() => {
        semanticscholar.setExportStatus(semanticscholar.t("bibtexUnavailable"));
      });
  });
}
