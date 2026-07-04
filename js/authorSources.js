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
  return [record.name]
    .concat(record.cnName || [])
    .concat(record.enNames || [])
    .concat(record.aliases || [])
    .concat(record.nameForms || [])
    .filter(Boolean);
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

authorSources.uniqueRecords = function (records) {
  const seen = new Set();
  return records.filter(function (record) {
    const key = record.id || record.name;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

authorSources.getContextText = function (context) {
  return [
    context?.title,
    context?.venue,
    context?.year,
    context?.snippet,
    (context?.authors || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
};

authorSources.isAbbreviatedLatinName = function (name) {
  const parts = String(name || "")
    .replace(/\./g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    parts.length >= 2 && parts[0].length <= 2 && /^[A-Za-z]/.test(parts[0])
  );
};

authorSources.latinNameMatches = function (left, right) {
  const leftParts = String(left || "")
    .replace(/\./g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const rightParts = String(right || "")
    .replace(/\./g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (leftParts.length < 2 || rightParts.length < 2) {
    return (
      authorSources.normalizeName(left) === authorSources.normalizeName(right)
    );
  }
  const leftFirst = leftParts[0][0] || "";
  const rightFirst = rightParts[0][0] || "";
  const leftLast = leftParts[leftParts.length - 1] || "";
  const rightLast = rightParts[rightParts.length - 1] || "";
  return (
    leftFirst.toUpperCase() === rightFirst.toUpperCase() &&
    authorSources.normalizeName(leftLast) ===
      authorSources.normalizeName(rightLast)
  );
};

authorSources.countContextHits = function (
  values,
  contextText,
  contextAuthors,
) {
  return (values || []).reduce(function (count, value) {
    const text = String(value || "").trim();
    if (!text) {
      return count;
    }
    const normalized = authorSources.normalizeName(text);
    if (
      normalized &&
      authorSources.normalizeName(contextText).includes(normalized)
    ) {
      return count + 1;
    }
    if (
      (contextAuthors || []).some(function (author) {
        return authorSources.latinNameMatches(author, text);
      })
    ) {
      return count + 1;
    }
    return count;
  }, 0);
};

authorSources.scoreRecord = function (author, record, context, ambiguous) {
  const normalizedAuthor = authorSources.normalizeName(author);
  const exactNames = [record.name]
    .concat(record.cnName || [])
    .concat(record.enNames || [])
    .concat(record.aliases || [])
    .filter(Boolean);
  const explicitForms = (record.nameForms || []).filter(Boolean);
  const exactMatch = exactNames.some(function (name) {
    return authorSources.normalizeName(name) === normalizedAuthor;
  });
  const formMatch = explicitForms.some(function (name) {
    return authorSources.normalizeName(name) === normalizedAuthor;
  });
  let score = 0;
  const evidence = [];

  if (authorSources.isCjkName(author) && exactMatch) {
    score = 100;
    evidence.push("中文姓名精确命中");
  } else if (exactMatch && !ambiguous) {
    score = 90;
    evidence.push("英文全名唯一命中");
  } else if (exactMatch) {
    score = 70;
    evidence.push("英文全名重名");
  } else if (formMatch || authorSources.isAbbreviatedLatinName(author)) {
    score = 45;
    evidence.push("英文缩写候选");
  }

  if (score === 0) {
    return { score: 0, evidence };
  }

  const contextText = authorSources.getContextText(context);
  const contextAuthors = context?.authors || [];
  const keywordHits = authorSources.countContextHits(
    (record.keywords || []).concat(record.fields || []),
    contextText,
    [],
  );
  const affiliationHits = authorSources.countContextHits(
    record.affiliations || [],
    contextText,
    [],
  );
  const coauthorHits = authorSources.countContextHits(
    record.coauthors || [],
    contextText,
    contextAuthors,
  );

  if (keywordHits) {
    score += Math.min(25, keywordHits * 12);
    evidence.push(`关键词命中 ${keywordHits}`);
  }
  if (affiliationHits) {
    score += Math.min(20, affiliationHits * 10);
    evidence.push(`机构命中 ${affiliationHits}`);
  }
  if (coauthorHits) {
    score += Math.min(35, coauthorHits * 15);
    evidence.push(`合作者命中 ${coauthorHits}`);
  }

  return { score: Math.min(100, score), evidence };
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

authorSources.resolveAuthorCandidates = function (author, context) {
  const variants = authorSources.getNameVariants(author);
  const matches = authorSources.uniqueRecords(
    variants.flatMap(function (variant) {
      return authorSources.getIndex().byName.get(variant) || [];
    }),
  );
  const sourceKeys = new Set(
    matches.map(authorSources.getRecordSourceKey).filter(Boolean),
  );
  const ambiguous =
    matches.length > 1 &&
    !authorSources.isCjkName(author) &&
    sourceKeys.size > 1;
  return matches
    .map(function (record) {
      const result = authorSources.scoreRecord(
        author,
        record,
        context,
        ambiguous,
      );
      return {
        record,
        confidence: result.score,
        evidence: result.evidence,
      };
    })
    .filter(function (candidate) {
      return candidate.confidence >= 60;
    })
    .sort(function (left, right) {
      return right.confidence - left.confidence;
    });
};

authorSources.resolveAuthor = function (author, context) {
  const candidates = authorSources.resolveAuthorCandidates(author, context);
  const top = candidates[0];
  const next = candidates[1];
  if (!top || top.confidence < 80) {
    return [];
  }
  if (
    next &&
    top.confidence - next.confidence < 15 &&
    authorSources.getRecordSourceKey(top.record) !==
      authorSources.getRecordSourceKey(next.record)
  ) {
    return [];
  }
  return [top];
};

authorSources.resolveAuthors = function (authors, context) {
  const candidates = new Map();
  (authors || []).forEach(function (author) {
    const resolved = authorSources.resolveAuthor(author, {
      ...(context || {}),
      authors: context?.authors || authors,
    });
    if (resolved.length === 0) {
      const weak = authorSources.resolveAuthorCandidates(author, {
        ...(context || {}),
        authors: context?.authors || authors,
      })[0];
      if (weak && !candidates.has("talentCandidate")) {
        candidates.set("talentCandidate", {
          source: "talentCandidate",
          matchedName: weak.record.name,
          matchedAuthor: author,
          confidence: weak.confidence,
          evidence: weak.evidence,
          candidates: authorSources
            .resolveAuthorCandidates(author, {
              ...(context || {}),
              authors: context?.authors || authors,
            })
            .slice(0, 3)
            .map(function (candidate) {
              return candidate.record.name;
            }),
        });
      }
      return;
    }
    resolved.forEach(function (candidate) {
      const record = candidate.record;
      (record.tags || []).forEach(function (tag) {
        if (!candidates.has(tag.source)) {
          candidates.set(tag.source, {
            ...tag,
            matchedName: record.name,
            matchedAuthor: author,
            confidence: candidate.confidence,
            evidence: candidate.evidence,
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
  const evidence = (tag.evidence || []).join("; ");
  const candidates = (tag.candidates || []).join(" / ");
  const title = [
    tag.matchedName || "",
    tag.matchedAuthor ? `matched: ${tag.matchedAuthor}` : "",
    tag.confidence ? `confidence: ${tag.confidence}` : "",
    candidates ? `candidates: ${candidates}` : "",
    evidence,
  ]
    .filter(Boolean)
    .join(" | ");
  return $("<span>")
    .addClass("rank-source")
    .addClass(source.className || "rank-source-default")
    .attr("data-rank-source", tag.source)
    .attr("data-rank-value", tag.value || "")
    .attr("data-rank-title", tag.matchedName || "")
    .attr("title", title)
    .text(authorSources.getTagText(tag));
};
