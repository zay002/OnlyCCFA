const authorSources = {};

authorSources.index = null;

authorSources.getSources = function () {
  return typeof authorRankSources === "undefined"
    ? {}
    : authorRankSources.sources || {};
};

authorSources.getRecords = function () {
  return typeof authorRankSources === "undefined"
    ? []
    : authorRankSources.records || [];
};

authorSources.normalizeName = function (name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\u4E00-\u9FFF]+/g, "")
    .trim();
};

authorSources.getNameVariants = function (name) {
  const variants = new Set();
  const source = String(name || "")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = authorSources.normalizeName(source);
  if (normalized) {
    variants.add(normalized);
  }

  return Array.from(variants).filter(Boolean);
};

authorSources.getRecordNames = function (record) {
  return [record.name].concat(record.aliases || []).filter(Boolean);
};

authorSources.getRecordSourceKey = function (record) {
  return (record.tags || [])
    .map((tag) => tag.source)
    .filter(Boolean)
    .sort()
    .join("|");
};

authorSources.isCjkName = function (name) {
  return /[\u4E00-\u9FFF]/.test(String(name || ""));
};

authorSources.filterAmbiguousMatches = function (author, matches) {
  if (matches.length <= 1 || authorSources.isCjkName(author)) {
    return matches;
  }

  const sourceKeys = new Set(
    matches.map(authorSources.getRecordSourceKey).filter(Boolean),
  );
  return sourceKeys.size <= 1 ? matches : [];
};

authorSources.buildIndex = function () {
  const byName = new Map();
  authorSources.getRecords().forEach(function (record) {
    authorSources.getRecordNames(record).forEach(function (name) {
      authorSources.getNameVariants(name).forEach(function (variant) {
        if (!byName.has(variant)) {
          byName.set(variant, []);
        }
        byName.get(variant).push(record);
      });
    });
  });
  return { byName };
};

authorSources.getIndex = function () {
  if (!authorSources.index) {
    authorSources.index = authorSources.buildIndex();
  }
  return authorSources.index;
};

authorSources.resolveAuthor = function (author) {
  const variants = authorSources.getNameVariants(author);
  const seen = new Set();
  return variants.reduce(function (records, variant) {
    const matches = authorSources.filterAmbiguousMatches(
      author,
      authorSources.getIndex().byName.get(variant) || [],
    );
    matches.forEach(function (record) {
      if (!seen.has(record.name)) {
        seen.add(record.name);
        records.push(record);
      }
    });
    return records;
  }, []);
};

authorSources.resolveAuthors = function (authors) {
  const candidates = new Map();
  (authors || []).forEach(function (author) {
    authorSources.resolveAuthor(author).forEach(function (record) {
      (record.tags || []).forEach(function (tag) {
        if (!candidates.has(tag.source)) {
          candidates.set(tag.source, {
            ...tag,
            matchedName: record.name,
            matchedAuthor: author,
          });
        }
      });
    });
  });
  return Array.from(candidates.values());
};

authorSources.getTagText = function (tag) {
  const source = authorSources.getSources()[tag.source];
  return source?.label || tag.source;
};

authorSources.getTagSpan = function (tag) {
  const source = authorSources.getSources()[tag.source] || {};
  return $("<span>")
    .addClass("rank-source")
    .addClass(source.className || "rank-source-default")
    .attr("data-rank-source", tag.source)
    .attr("data-rank-value", tag.value || "")
    .attr("data-rank-title", tag.matchedName || "")
    .attr("title", tag.matchedName || "")
    .text(authorSources.getTagText(tag));
};
