const ieeexplore = {};

ieeexplore.rankSpanList = [];
ieeexplore.resultSelector = [
  "xpl-results-item",
  ".List-results-items",
  ".result-item",
  "article",
].join(", ");
ieeexplore.titleSelector = [
  "h2 a[href*='/document/']",
  "h3 a[href*='/document/']",
  "a[href*='/document/']",
  "h1",
].join(", ");
ieeexplore.venueSelector = [
  ".publisher-info-container",
  ".description",
  ".publication-title",
  "[data-testid='publication-title']",
  "xpl-document-details .u-pb-1",
].join(", ");

ieeexplore.run = function () {
  ieeexplore.appendRanks();

  if (
    typeof MutationObserver !== "undefined" &&
    typeof document !== "undefined"
  ) {
    const observer = new MutationObserver(
      ieeexplore.debounce(function () {
        ieeexplore.appendRanks();
        if (
          typeof filter !== "undefined" &&
          filter.siteConfig?.site === "ieeexplore"
        ) {
          filter.applyFilter();
        }
      }, 100),
    );
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setInterval(function () {
    ieeexplore.appendRanks();
  }, 1500);
};

ieeexplore.debounce = function (func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

ieeexplore.cleanText = function (text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
};

ieeexplore.extractVenue = function (text) {
  const source = ieeexplore.cleanText(text);
  const quoted = source.match(
    /\bin\b:?\s*([^,]+(?:Conference|Symposium|Transactions|Journal|Magazine|Letters)[^,]*)/i,
  );
  if (quoted) {
    return quoted[1].trim();
  }

  return source
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\s*,\s*$/, "")
    .trim();
};

ieeexplore.getRankBadgeHost = function (entry, titleNode) {
  const existing = entry.querySelector?.(".onlyccfa-ieee-badges");
  if (existing) {
    return existing;
  }

  const doc = titleNode?.ownerDocument || document;
  const host = doc.createElement("div");
  host.className = "onlyccfa-ieee-badges";
  const titleContainer = titleNode?.parentElement || entry;

  if (titleContainer.insertAdjacentElement) {
    titleContainer.insertAdjacentElement("afterend", host);
  } else if (entry.appendChild) {
    entry.appendChild(host);
  }

  return host;
};

ieeexplore.hasOnlyccfaBadge = function (host) {
  return Boolean(host?.querySelector?.(".ccf-rank, .rank-source"));
};

ieeexplore.appendRankBadge = function (host, badge) {
  if (!badge) {
    return;
  }

  if (badge.nodeType && host.appendChild) {
    host.appendChild(badge);
    return;
  }

  $(host).append(badge);
};

ieeexplore.getEntries = function () {
  const entries = Array.from(
    document.querySelectorAll(ieeexplore.resultSelector),
  );
  if (entries.length) {
    return entries;
  }

  const title = document.querySelector(ieeexplore.titleSelector);
  return title ? [document.body] : [];
};

ieeexplore.getEntryData = function (entry) {
  const titleNode = entry.querySelector?.(ieeexplore.titleSelector);
  const venueNode = entry.querySelector?.(ieeexplore.venueSelector);
  return {
    titleNode,
    venue: ieeexplore.extractVenue(venueNode?.textContent || ""),
  };
};

ieeexplore.appendVenueRank = function (entry) {
  if (entry.dataset?.onlyccfaRanked === "true") {
    return false;
  }

  const data = ieeexplore.getEntryData(entry);
  if (!data.titleNode || !data.venue) {
    return false;
  }

  const host = ieeexplore.getRankBadgeHost(entry, data.titleNode);
  if (ieeexplore.hasOnlyccfaBadge(host)) {
    entry.dataset.onlyccfaRanked = "true";
    return false;
  }

  let matched = false;

  if (ccf.resolveVenueText) {
    const venueMatch = ccf.resolveVenueText(data.venue);
    if (venueMatch) {
      ieeexplore.rankSpanList.forEach(function (getRankSpan) {
        ieeexplore.appendRankBadge(
          host,
          getRankSpan(venueMatch.refine, venueMatch.type),
        );
      });
      matched = true;
    }
  }

  if (typeof rankSources !== "undefined" && rankSources.resolveVenueText) {
    rankSources.resolveVenueText(data.venue).forEach(function (tag) {
      ieeexplore.appendRankBadge(host, rankSources.getTagSpan(tag));
      matched = true;
    });
  }

  if (matched) {
    entry.dataset.onlyccfaRanked = "true";
  }

  return matched;
};

ieeexplore.appendRanks = function () {
  ieeexplore.getEntries().forEach(function (entry) {
    ieeexplore.appendVenueRank(entry);
  });
};
