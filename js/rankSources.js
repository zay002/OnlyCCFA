const rankSources = {};
rankSources.VENUE_SERIES_TOKENS = new Set([
  "CONFERENCE",
  "CONGRESS",
  "PROCEEDINGS",
  "SYMPOSIUM",
  "WORKSHOP",
]);

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

rankSources.isSingleWordTitle = function (name) {
  const normalizedName = rankSources.normalizeText(name);
  return (
    /^[A-Z0-9]+$/.test(normalizedName) && !rankSources.isShortAcronymName(name)
  );
};

rankSources.hasVenueSeriesToken = function (normalizedText) {
  return normalizedText
    .split(" ")
    .some((token) => rankSources.VENUE_SERIES_TOKENS.has(token));
};

rankSources.isUnsafeSeriesSubstringMatch = function (
  normalizedVenue,
  normalizedName,
  name,
  record,
) {
  if (!rankSources.hasVenueSeriesToken(normalizedVenue)) {
    return false;
  }

  if (
    normalizedVenue === normalizedName ||
    rankSources.hasVenueSeriesToken(normalizedName)
  ) {
    return false;
  }

  if (rankSources.isShortAcronymName(name)) {
    return false;
  }

  const nameTokenCount = normalizedName.split(" ").filter(Boolean).length;
  if (nameTokenCount > 2) {
    return false;
  }

  const recordNames = rankSources
    .getRecordNames(record)
    .map((recordName) => rankSources.normalizeText(recordName));
  return !recordNames.some((recordName) =>
    rankSources.hasVenueSeriesToken(recordName),
  );
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

rankSources.getNameMatchScore = function (venueText, name, record) {
  const normalizedVenue = rankSources.normalizeText(venueText);
  if (!normalizedVenue) {
    return 0;
  }

  const normalizedName = rankSources.normalizeText(name);
  if (!normalizedName) {
    return 0;
  }

  if (normalizedVenue === normalizedName) {
    return 100000 + normalizedName.length;
  }

  if (rankSources.isSingleWordTitle(name)) {
    return 0;
  }

  if (
    rankSources.containsNormalizedPhrase(normalizedVenue, normalizedName) &&
    (!rankSources.isShortAcronymName(name) ||
      rankSources.hasOriginalAcronymToken(venueText, name)) &&
    !rankSources.isUnsafeSeriesSubstringMatch(
      normalizedVenue,
      normalizedName,
      name,
      record,
    )
  ) {
    return 50000 + normalizedName.length;
  }

  return 0;
};

rankSources.getRecordMatch = function (venueText, record) {
  return rankSources.getRecordNames(record).reduce(
    (best, name) => {
      const score = rankSources.getNameMatchScore(venueText, name, record);
      if (score > best.score) {
        return { score, matchedTitle: record.title, matchedName: name };
      }
      return best;
    },
    { score: 0, matchedTitle: "", matchedName: "" },
  );
};

rankSources.matchRecord = function (venueText, record) {
  return rankSources.getRecordMatch(venueText, record).score > 0;
};

rankSources.getExclusiveGroup = function (source) {
  if (["swjtuJournal", "swjtuScai"].includes(source)) {
    return "swjtuSchool";
  }

  return source;
};

rankSources.getTagPriority = function (tag) {
  if (tag.source === "swjtuJournal") {
    return { T类: 400, A类: 300, B类: 200 }[tag.value] || 100;
  }

  if (tag.source === "swjtuScai") {
    return 100;
  }

  return 0;
};

rankSources.shouldReplaceCandidate = function (existing, candidate) {
  if (!existing) {
    return true;
  }

  if (candidate.matchScore !== existing.matchScore) {
    return candidate.matchScore > existing.matchScore;
  }

  const candidatePriority = rankSources.getTagPriority(candidate);
  const existingPriority = rankSources.getTagPriority(existing);
  if (candidatePriority !== existingPriority) {
    return candidatePriority > existingPriority;
  }

  return false;
};

rankSources.addTagCandidates = function (candidates, newTags, match) {
  (newTags || []).forEach(function (tag) {
    const group = rankSources.getExclusiveGroup(tag.source);
    const candidate = {
      ...tag,
      matchedTitle: match.matchedTitle,
      matchedName: match.matchedName,
      matchScore: match.score,
    };
    const existing = candidates.get(group);

    if (rankSources.shouldReplaceCandidate(existing, candidate)) {
      candidates.set(group, candidate);
    }
  });
};

rankSources.getDatabases = function () {
  return [
    typeof openRankSources === "undefined" ? null : openRankSources,
    typeof swjtuRankSources === "undefined" ? null : swjtuRankSources,
  ].filter((db) => db && Array.isArray(db.records));
};

rankSources.getSources = function () {
  return rankSources.getDatabases().reduce((sources, db) => {
    return Object.assign(sources, db.sources || {});
  }, {});
};

rankSources.resolveVenueText = function (venueText) {
  const candidates = new Map();

  rankSources.getDatabases().forEach(function (db) {
    db.records.forEach(function (record) {
      const match = rankSources.getRecordMatch(venueText, record);
      if (match.score === 0) {
        return;
      }

      rankSources.addTagCandidates(candidates, record.tags, match);
    });
  });

  return Array.from(candidates.values());
};

rankSources.getTagText = function (tag) {
  const source = rankSources.getSources()[tag.source];
  if (!source) {
    return tag.value || tag.source;
  }

  if (!tag.value || source.label.endsWith(tag.value)) {
    return source.label;
  }

  return `${source.label}${tag.value}`;
};

rankSources.getTagSpan = function (tag) {
  const source = rankSources.getSources()[tag.source] || {};
  return $("<span>")
    .addClass("rank-source")
    .addClass(source.className || "rank-source-default")
    .attr("data-rank-source", tag.source)
    .attr("data-rank-value", tag.value || "")
    .attr("data-rank-title", tag.matchedTitle || "")
    .attr("title", tag.matchedTitle || "")
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

  return {
    matched: true,
    tags,
    displayName:
      tags.find((tag) => tag.matchedTitle)?.matchedTitle || venueText,
  };
};
