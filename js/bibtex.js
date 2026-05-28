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
    ["url", item.url],
    ["keywords", (item.tags || []).join(", ")],
  ].filter((field) => field[1]);

  const body = fields
    .map(([name, value]) => `  ${name} = {${onlyccfaBibtex.escape(value)}}`)
    .join(",\n");

  return `@${entryType}{${onlyccfaBibtex.buildKey(item)},\n${body}\n}`;
};

onlyccfaBibtex.parseCreator = function (author) {
  const parts = String(author || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
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

onlyccfaBibtex.toZoteroItem = function (item, category) {
  const itemType =
    onlyccfaBibtex.getEntryType(item) === "article"
      ? "journalArticle"
      : "conferencePaper";
  const tags = (item.tags || []).map((tag) => ({ tag }));
  if (category) {
    tags.push({ tag: category });
  }

  return {
    itemType,
    title: item.title || "Untitled",
    creators: (item.authors || []).map(onlyccfaBibtex.parseCreator),
    date: item.year || "",
    publicationTitle: itemType === "journalArticle" ? item.venue || "" : "",
    proceedingsTitle: itemType === "conferencePaper" ? item.venue || "" : "",
    url: item.url || "",
    tags,
  };
};
