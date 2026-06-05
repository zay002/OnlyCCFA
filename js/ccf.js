/**
 * MIT License
 *
 * Copyright (c) 2019-2023 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp), Kai Chen (https://github.com/FunClip), dozed (https://github.com/dozed)
 */

const ccf = {};

ccf.VENUE_STOP_WORDS = new Set([
  "A",
  "AN",
  "AND",
  "AT",
  "CONFERENCE",
  "IN",
  "INTERNATIONAL",
  "JOURNAL",
  "MEETING",
  "OF",
  "ON",
  "PROC",
  "PROCEEDINGS",
  "SYMPOSIUM",
  "THE",
  "TRANSACTIONS",
  "WORKSHOP",
]);

ccf.normalizeVenueText = function (text) {
  return (text || "")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[^A-Z0-9+]+/g, " ")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

ccf.getVenueTokens = function (text) {
  return ccf
    .normalizeVenueText(text)
    .split(" ")
    .filter(function (token) {
      return token.length > 1 && !ccf.VENUE_STOP_WORDS.has(token);
    });
};

ccf.getVenueAlias = function (normalizedVenue) {
  const aliases = {
    "ADVANCES IN NEURAL INFORMATION PROCESSING SYSTEMS": "NeurIPS",
    "CONFERENCE AND WORKSHOP ON NEURAL INFORMATION PROCESSING SYSTEMS":
      "NeurIPS",
    "IEEE CVF CONFERENCE ON COMPUTER VISION AND PATTERN RECOGNITION": "CVPR",
    "IEEE CONFERENCE ON COMPUTER VISION AND PATTERN RECOGNITION": "CVPR",
    "ACM INTERNATIONAL CONFERENCE ON MULTIMEDIA": "ACM MM",
    "ACM SIGKDD INTERNATIONAL CONFERENCE": "SIGKDD",
    "ACM SIGKDD CONFERENCE": "SIGKDD",
    "INTERNATIONAL CONFERENCE ON MEDICAL IMAGE COMPUTING AND COMPUTER ASSISTED":
      "MICCAI",
    "IEEE INTERNATIONAL CONFERENCE ON IMAGE PROCESSING": "ICIP",
    "INTERNATIONAL CONFERENCE ON IMAGE PROCESSING": "ICIP",
  };

  for (let alias in aliases) {
    if (normalizedVenue.includes(alias)) {
      return aliases[alias];
    }
  }

  return null;
};

ccf.findAbbrInVenue = function (normalizedVenue) {
  const abbrs = Object.keys(ccf.abbrFull || {}).filter(function (abbr) {
    return abbr.trim().length > 1;
  });

  abbrs.sort(function (left, right) {
    return (
      ccf.normalizeVenueText(right).length - ccf.normalizeVenueText(left).length
    );
  });

  for (let abbr of abbrs) {
    let normalizedAbbr = ccf.normalizeVenueText(abbr);
    if (
      normalizedAbbr.length > 1 &&
      (" " + normalizedVenue + " ").includes(" " + normalizedAbbr + " ")
    ) {
      return abbr;
    }
  }

  return null;
};

ccf.findFullNameInVenue = function (normalizedVenue) {
  const fullNames = Object.keys(ccf.fullUrl || {});

  for (let fullName of fullNames) {
    let normalizedFullName = ccf.normalizeVenueText(fullName);
    if (normalizedFullName && normalizedFullName === normalizedVenue) {
      return fullName;
    }
  }

  const venueTokens = new Set(ccf.getVenueTokens(normalizedVenue));
  const fullNameCandidates = fullNames
    .map(function (fullName) {
      return {
        fullName,
        tokens: ccf.getVenueTokens(fullName),
      };
    })
    .sort(function (left, right) {
      return right.tokens.length - left.tokens.length;
    });

  for (let candidate of fullNameCandidates) {
    let fullNameTokens = candidate.tokens;
    if (fullNameTokens.length < 3) {
      continue;
    }

    let matched = fullNameTokens.every(function (token) {
      return venueTokens.has(token);
    });
    if (matched && venueTokens.size - fullNameTokens.length <= 1) {
      return candidate.fullName;
    }
  }

  return null;
};

ccf.resolveVenueText = function (venueText) {
  const normalizedVenue = ccf.normalizeVenueText(venueText);
  if (normalizedVenue.length == 0) {
    return null;
  }

  let alias = ccf.getVenueAlias(normalizedVenue);
  if (alias && ccf.abbrFull[alias]) {
    return { refine: alias, type: "abbr" };
  }

  let abbr = ccf.findAbbrInVenue(normalizedVenue);
  if (abbr) {
    return { refine: abbr, type: "abbr" };
  }

  let fullName = ccf.findFullNameInVenue(normalizedVenue);
  if (fullName) {
    return { refine: fullName, type: "publication" };
  }

  return null;
};

ccf.getVenueDisplayName = function (refine, type, fallback) {
  let url = "";
  if (type == "abbr" || type == "meeting") {
    const fullName = ccf.abbrFull?.[refine];
    url = ccf.fullUrl?.[fullName];
  } else if (type == "publication") {
    url = ccf.fullUrl?.[refine];
  } else if (type == "url") {
    url = refine;
  }

  return ccf.rankFullName?.[url] || fallback || refine || "";
};

ccf.getRankInfo = function (refine, type) {
  let rankInfo = {};
  rankInfo.ranks = [];
  rankInfo.info = "";
  let rank;
  let url;
  if (type == "url") {
    rank = ccf.rankUrl[refine];
    url = refine;
  } else if (type == "abbr") {
    if (refine === undefined) {
      rank = "none";
      rankInfo.info += "Not Found\n";
    } else {
      let full = ccf.abbrFull[refine];
      url = ccf.fullUrl[full];
      if (full === undefined) {
        refine = refine.substring(0, refine.length - 1);
        let res = Object.keys(ccf.fullUrl).filter(function (k) {
          return k.indexOf(refine.toUpperCase()) == 0;
        });
        url = res ? ccf.fullUrl[res] : false;
      }
      rank = ccf.rankUrl[url];
    }
  } else if (type == "meeting") {
    let full = ccf.abbrFull[refine];
    url = ccf.fullUrl[full];
    rank = ccf.rankUrl[url];
  } else {
    url = ccf.fullUrl[refine];
    rank = ccf.rankUrl[url];
  }
  if (rank == undefined) {
    rank = "none";
    rankInfo.info += "Not Found\n";
  } else {
    rankInfo.info += ccf.rankFullName[url];
    let abbrname = ccf.rankAbbrName[url];
    if (abbrname != "") {
      rankInfo.info += " (" + abbrname + ")";
    }
    if (rank == "E") {
      rankInfo.info += ": Expanded\n";
    } else if (rank == "P") {
      rankInfo.info += ": Preprint\n";
    } else {
      rankInfo.info += ": CCF " + rank + "\n";
    }
  }
  rankInfo.ranks.push(rank);
  return rankInfo;
};

ccf.getRankClass = function (ranks) {
  for (let rank of "ABCEP") {
    for (let r of ranks) {
      if (r[0] == rank) {
        return "ccf-" + rank.toLowerCase();
      }
    }
  }
  return "ccf-none";
};

ccf.getRankSpan = function (refine, type) {
  let rankInfo = ccf.getRankInfo(refine, type);
  let span = $("<span>")
    .addClass("ccf-rank")
    .addClass(ccf.getRankClass(rankInfo.ranks));
  let firstRank = rankInfo.ranks[0];
  let label;
  if (firstRank == "E") {
    label = "Expanded";
  } else if (firstRank == "P") {
    label = "Preprint";
  } else if (firstRank == "none") {
    label = "CCF None";
  } else {
    label = "CCF " + rankInfo.ranks.join("/");
  }
  span
    .attr("data-rank-source", "ccf")
    .attr("data-rank-value", label)
    .text(label);
  if (rankInfo.info.length != 0) {
    span
      .addClass("ccf-tooltip")
      .append($("<pre>").addClass("ccf-tooltiptext").text(rankInfo.info));
  }
  return span;
};
