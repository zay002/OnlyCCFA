const onlyccfaBibtex = {};

onlyccfaBibtex.escape = function (value) {
  return String(value || "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, function (match) {
      return `\\${match}`;
    })
    .trim();
};

onlyccfaBibtex.cleanWords = function (value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

onlyccfaBibtex.getLastName = function (author) {
  const parts = String(author || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  return parts.length ? parts[parts.length - 1] : "paper";
};

onlyccfaBibtex.buildKey = function (item) {
  const lastName = onlyccfaBibtex.cleanWords(
    onlyccfaBibtex.getLastName((item.authors || [])[0]),
  );
  const firstTitleWord =
    onlyccfaBibtex
      .cleanWords(item.title)
      .split(" ")
      .find((word) => !/^(a|an|the|of|for|in|on|and|with|to)$/i.test(word)) ||
    "paper";
  const year = item.year || "nd";

  return `${lastName || "paper"}${year}${firstTitleWord}`.toLowerCase();
};

onlyccfaBibtex.getEntryType = function (item) {
  const venue = String(item.venue || "").toLowerCase();
  if (
    venue.includes("conference") ||
    venue.includes("symposium") ||
    venue.includes("workshop") ||
    venue.includes("meeting") ||
    venue.includes("corl") ||
    venue.includes("rss")
  ) {
    return "inproceedings";
  }

  return "article";
};

onlyccfaBibtex.buildEntry = function (item) {
  const entryType = onlyccfaBibtex.getEntryType(item);
  const venueField = entryType === "article" ? "journal" : "booktitle";
  const fields = [
    ["title", item.title],
    ["author", (item.authors || []).join(" and ")],
    [venueField, item.venue],
    ["year", item.year],
    ["volume", item.volume],
    ["number", item.number || item.issue],
    ["pages", item.pages],
    ["publisher", item.publisher],
    ["doi", item.doi],
    ["url", item.url],
  ].filter((field) => field[1]);

  const body = fields
    .map(([name, value]) => `  ${name} = {${onlyccfaBibtex.escape(value)}}`)
    .join(",\n");

  return `@${entryType}{${onlyccfaBibtex.buildKey(item)},\n${body}\n}`;
};

onlyccfaBibtex.parseCreator = function (author) {
  const normalized = String(author || "")
    .replace(/\s+/g, " ")
    .trim();
  const commaParts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (commaParts.length >= 2) {
    return {
      creatorType: "author",
      firstName: commaParts.slice(1).join(" "),
      lastName: commaParts[0],
    };
  }

  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length <= 1) {
    return {
      creatorType: "author",
      lastName: parts[0] || "Unknown",
    };
  }

  return {
    creatorType: "author",
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

onlyccfaBibtex.unwrapValue = function (value) {
  let result = String(value || "").trim();
  if (
    (result.startsWith("{") && result.endsWith("}")) ||
    (result.startsWith('"') && result.endsWith('"'))
  ) {
    result = result.slice(1, -1);
  }

  return result
    .replace(/\\([{}])/g, "$1")
    .replace(/\\textbackslash\{\}/g, "\\")
    .replace(/\s+/g, " ")
    .trim();
};

onlyccfaBibtex.parseFields = function (body) {
  const fields = {};
  let index = 0;

  while (index < body.length) {
    while (index < body.length && /[\s,]/.test(body[index])) {
      index += 1;
    }

    const nameMatch = body.slice(index).match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=/);
    if (!nameMatch) {
      break;
    }

    const name = nameMatch[1].toLowerCase();
    index += nameMatch[0].length;

    while (index < body.length && /\s/.test(body[index])) {
      index += 1;
    }

    let value = "";
    if (body[index] === "{") {
      const start = index;
      let depth = 0;
      while (index < body.length) {
        const char = body[index];
        if (char === "{") {
          depth += 1;
        } else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            break;
          }
        }
        index += 1;
      }
      value = body.slice(start, index);
    } else if (body[index] === '"') {
      const start = index;
      index += 1;
      while (index < body.length) {
        if (body[index] === '"' && body[index - 1] !== "\\") {
          index += 1;
          break;
        }
        index += 1;
      }
      value = body.slice(start, index);
    } else {
      const start = index;
      while (index < body.length && body[index] !== ",") {
        index += 1;
      }
      value = body.slice(start, index);
    }

    fields[name] = onlyccfaBibtex.unwrapValue(value);
  }

  return fields;
};

onlyccfaBibtex.parseEntry = function (bibtex) {
  const source = String(bibtex || "").trim();
  const header = source.match(/^@\s*([A-Za-z]+)\s*[{(]\s*([^,\s]+)\s*,/);
  if (!header) {
    return { type: "", key: "", fields: {} };
  }

  const bodyStart = header[0].length;
  const bodyEnd = Math.max(source.lastIndexOf("}"), source.lastIndexOf(")"));
  const body = bodyEnd > bodyStart ? source.slice(bodyStart, bodyEnd) : "";

  return {
    type: header[1].toLowerCase(),
    key: header[2],
    fields: onlyccfaBibtex.parseFields(body),
  };
};

onlyccfaBibtex.splitAuthors = function (authorField) {
  return String(authorField || "")
    .split(/\s+and\s+/i)
    .map((author) => author.trim())
    .filter(Boolean);
};

onlyccfaBibtex.toZoteroItemFromBibtex = function (bibtex, category) {
  const parsed = onlyccfaBibtex.parseEntry(bibtex);
  const fields = parsed.fields || {};
  const isConference = /^(inproceedings|proceedings|conference)$/i.test(
    parsed.type || "",
  );
  const itemType = isConference ? "conferencePaper" : "journalArticle";
  const tags = category ? [{ tag: category }] : [];

  return {
    itemType,
    title: fields.title || "Untitled",
    creators: onlyccfaBibtex
      .splitAuthors(fields.author)
      .map(onlyccfaBibtex.parseCreator),
    date: fields.year || "",
    publicationTitle: itemType === "journalArticle" ? fields.journal || "" : "",
    proceedingsTitle:
      itemType === "conferencePaper"
        ? fields.booktitle || fields.journal || ""
        : "",
    volume: fields.volume || "",
    issue: fields.number || "",
    pages: fields.pages || "",
    DOI: fields.doi || "",
    url: fields.url || "",
    tags,
  };
};

onlyccfaBibtex.toZoteroItem = function (item, category) {
  const itemType =
    onlyccfaBibtex.getEntryType(item) === "article"
      ? "journalArticle"
      : "conferencePaper";
  const tags = category ? [{ tag: category }] : [];

  return {
    itemType,
    title: item.title || "Untitled",
    creators: (item.authors || []).map(onlyccfaBibtex.parseCreator),
    date: item.year || "",
    publicationTitle: itemType === "journalArticle" ? item.venue || "" : "",
    proceedingsTitle: itemType === "conferencePaper" ? item.venue || "" : "",
    volume: item.volume || "",
    issue: item.number || item.issue || "",
    pages: item.pages || "",
    DOI: item.doi || "",
    url: item.url || "",
    tags,
  };
};
