const rankSources = {};

rankSources.normalizeText = function (text) {
  return (text || "")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[^A-Z0-9\u4E00-\u9FFF]+/g, " ")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

rankSources.getRecordNames = function (record) {
  return [record.title].concat(record.aliases || []).filter(Boolean);
};

rankSources.containsNormalizedPhrase = function (text, phrase) {
  return ` ${text} `.includes(` ${phrase} `);
};

rankSources.isShortAcronymName = function (name) {
  const normalizedName = rankSources.normalizeText(name);
  return /^[A-Z0-9]{2,4}$/.test(normalizedName);
};

rankSources.escapeRegExp = function (text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

rankSources.hasOriginalAcronymToken = function (venueText, name) {
  const normalizedName = rankSources.normalizeText(name);
  const variants = [name, normalizedName].filter(Boolean);
  const pattern = variants
    .map(rankSources.escapeRegExp)
    .filter(Boolean)
    .join("|");

  return new RegExp(`(^|[^A-Za-z0-9])(${pattern})(?=$|[^A-Za-z0-9])`).test(
    venueText || "",
  );
};

rankSources.canReverseMatch = function (text) {
  const tokens = text.split(" ").filter(Boolean);
  return tokens.length > 1 && text.length >= 8;
};

rankSources.matchRecord = function (venueText, record) {
  const normalizedVenue = rankSources.normalizeText(venueText);
  if (!normalizedVenue) {
    return false;
  }

  return rankSources.getRecordNames(record).some(function (name) {
    const normalizedName = rankSources.normalizeText(name);
    if (!normalizedName) {
      return false;
    }

    return (
      normalizedVenue === normalizedName ||
      (rankSources.containsNormalizedPhrase(normalizedVenue, normalizedName) &&
        (!rankSources.isShortAcronymName(name) ||
          rankSources.hasOriginalAcronymToken(venueText, name))) ||
      (rankSources.canReverseMatch(normalizedVenue) &&
        rankSources.containsNormalizedPhrase(normalizedName, normalizedVenue))
    );
  });
};

rankSources.resolveVenueText = function (venueText) {
  const db = typeof openRankSources === "undefined" ? null : openRankSources;
  if (!db || !Array.isArray(db.records)) {
    return [];
  }

  const seen = new Set();
  const tags = [];

  db.records.forEach(function (record) {
    if (!rankSources.matchRecord(venueText, record)) {
      return;
    }

    (record.tags || []).forEach(function (tag) {
      const key = `${tag.source}:${tag.value || ""}`;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      tags.push(tag);
    });
  });

  return tags;
};

rankSources.getTagText = function (tag) {
  const source = openRankSources.sources[tag.source];
  if (!source) {
    return tag.value || tag.source;
  }

  return tag.value ? `${source.label}${tag.value}` : source.label;
};

rankSources.getTagSpan = function (tag) {
  const source = openRankSources.sources[tag.source] || {};
  return $("<span>")
    .addClass("rank-source")
    .addClass(source.className || "rank-source-default")
    .text(rankSources.getTagText(tag));
};

rankSources.appendVenueTags = function (node, venueText) {
  const tags = rankSources.resolveVenueText(venueText);
  if (tags.length === 0) {
    return false;
  }

  tags.forEach(function (tag) {
    $(node).after(rankSources.getTagSpan(tag));
  });

  return true;
};
