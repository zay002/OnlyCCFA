/**
 * MIT License
 *
 * Copyright (c) 2019-2026 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp), FlyingFog (https://github.com/FlyingFog), mra42 (https://github.com/mra42), dozed (https://github.com/dozed), MarkLee131 (https://github.com/MarkLee131)
 */

// PACM PL conference mapping - centralized configuration
const PACM_PL_CONFERENCE_MAP = {
  oopsla: "/conf/oopsla/oopsla",
  oopsla1: "/conf/oopsla/oopsla",
  oopsla2: "/conf/oopsla/oopsla",
  popl: "/conf/popl/popl",
  pldi: "/conf/pldi/pldi",
  icfp: "/conf/icfp/icfp",
};

/**
 * Process PACM PL journal entries to determine the actual conference URL.
 * PACM PL conferences (OOPSLA, POPL, PLDI, ICFP) are published in PACMPL journal
 * but should be recognized as conferences for CCF ranking purposes.
 * @param {Object} resp - DBLP API response hits object
 * @returns {string} DBLP URL for the conference or default PACMPL journal URL
 */
function processPacmPlJournal(resp) {
  let number_raw = resp.hit[0]?.info?.number;
  let number = number_raw ? number_raw.toString().toLowerCase() : "";

  // Handle missing number - traverse resp.hit array to find an element with number info
  if (number === "") {
    for (let i = 0; i < resp["@sent"]; i++) {
      let hit_number = resp.hit[i]?.info?.number;
      if (hit_number) {
        number = hit_number.toString().toLowerCase();
        break;
      }
    }
  }

  // Map to conference URL using centralized config, fallback to PACMPL journal
  return PACM_PL_CONFERENCE_MAP[number] || "/journals/pacmpl/pacmpl";
}

function appendRankSpan(node, rankSpan, site) {
  if (site && typeof site.appendRankBadge == "function") {
    site.appendRankBadge(node, rankSpan);
    return;
  }

  $(node).after(rankSpan);
}

function appendRankSourceSpans(node, venueText, site) {
  if (
    !venueText ||
    typeof rankSources == "undefined" ||
    !rankSources.resolveVenueText
  ) {
    return;
  }

  const tags = rankSources.resolveVenueText(venueText);
  tags.forEach(function (tag) {
    appendRankSpan(node, rankSources.getTagSpan(tag), site);
  });
}

function getDblpVenueText(refine, type) {
  if (typeof ccf == "undefined") {
    return refine || "";
  }

  if (type == "url") {
    return ccf.rankFullName?.[refine] || "";
  }

  if (type == "abbr" || type == "meeting") {
    return ccf.abbrFull?.[refine] || refine || "";
  }

  return refine || "";
}

function appendRankSourceSpansForDblpRef(node, refine, type, site) {
  appendRankSourceSpans(node, getDblpVenueText(refine, type), site);
}

function fetchRank(node, title, authorA, year, site) {
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  let query_url =
    "https://dblp.org/search/publ/api?q=" +
    encodeURIComponent(title + "  author:" + authorA) +
    "&format=json&app=OnlyCCFA_" +
    version;

  let cached = apiCache.getItem(query_url);
  // console.log("cached: ", cached);
  if (cached) fetchFromCache(cached, node, title, authorA, year, site);
  else fetchFromDblpApi(query_url, node, title, authorA, year, site);
}

function fetchFromCache(cached, node, title, authorA, year, site) {
  console.debug('fetch from cache: %s (%s) "%s"', authorA, year, title);

  let dblp_url = cached.dblp_url;
  let resp = cached.resp;
  let resp_flag = cached.flag;
  if (resp_flag === false) {
    return;
  }
  // console.log("dblp_url: ", dblp_url);

  //Find a new vul: rankDB lacks of `tacas` etc., but it does occur in file `dataGen`.
  if (typeof dblp_url == "undefined" && resp_flag != false) {
    let dblp_abbr = resp.hit[0].info.number;
    if (typeof dblp_abbr != "undefined" && isNaN(dblp_abbr)) {
      // console.log("dblp_abbr: ", dblp_abbr);
    } else {
      dblp_abbr = resp.hit[0].info.venue;
    }

    for (let getRankSpan of site.rankSpanList) {
      // console.log("with abbr");
      appendRankSpan(node, getRankSpan(dblp_abbr, "abbr"), site);
    }
    appendRankSourceSpansForDblpRef(node, dblp_abbr, "abbr", site);
  } else if (dblp_url == "/journals/pacmpl/pacmpl") {
    // Process PACM PL conferences using centralized helper function
    dblp_url = processPacmPlJournal(resp);

    for (let getRankSpan of site.rankSpanList) {
      appendRankSpan(node, getRankSpan(dblp_url, "url"), site);
    }
    appendRankSourceSpansForDblpRef(node, dblp_url, "url", site);
  } else {
    // console.log("dblp_url is not empty");
    for (let getRankSpan of site.rankSpanList) {
      // console.log("with url");
      appendRankSpan(node, getRankSpan(dblp_url, "url"), site);
    }
    appendRankSourceSpansForDblpRef(node, dblp_url, "url", site);
  }
}

function fetchFromDblpApi(query_url, node, title, authorA, year, site) {
  console.debug('fetch from API: %s (%s) "%s"', authorA, year, title);
  console.debug("query url: %s", query_url);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", query_url, true);
  var resp_flag = true;
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status && (xhr.status < 200 || xhr.status >= 300)) {
        return;
      }

      var dblp_url = "";
      var resp;
      try {
        resp = JSON.parse(xhr.responseText).result?.hits;
      } catch (error) {
        return;
      }
      if (!resp) {
        return;
      }
      if (resp["@total"] == 0) {
        apiCache.setItem(query_url, {
          dblp_url: "",
          resp: resp,
          flag: false,
        });
        return;
      } else if (resp["@total"] == 1) {
        let url = resp.hit[0].info.url;
        dblp_url = url.substring(
          url.indexOf("/rec/") + 4,
          url.lastIndexOf("/"),
        );
      } else {
        var year_last_check = 0;
        for (var h = 0; h < resp["@sent"]; h++) {
          let info = resp.hit[h].info;

          var cur_venue = info.type;
          if (cur_venue == "Informal Publications") continue;

          let author_1st;
          if (Array.isArray(info.authors.author)) {
            author_1st = info.authors.author[0].text;
          } else {
            author_1st = info.authors.author.text;
          }
          let year_fuzzy = info.year;
          // Note: Author matching is temporarily disabled due to inconsistent
          // author name formats from different platforms. We rely on title and
          // year matching instead, which provides good enough accuracy for most cases.
          if (
            Math.abs(Number(year) - year_fuzzy) <= 1 &&
            author_1st.toLowerCase().split(" ") &&
            year_fuzzy != year_last_check
          ) {
            year_last_check = year_fuzzy;
            let url = resp.hit[h].info.url;
            let dblp_url_last_check = url.substring(
              url.indexOf("/rec/") + 4,
              url.lastIndexOf("/"),
            );
            if (year_fuzzy == year + 1) {
              dblp_url = dblp_url_last_check;
            } else if (year_fuzzy == year) {
              dblp_url = dblp_url_last_check;
              break;
            } else {
              if (dblp_url == "") {
                dblp_url = dblp_url_last_check;
              }
            }
          }
        }
      }
      dblp_url = ccf.rankDb?.[dblp_url];
      apiCache.setItem(query_url, {
        dblp_url: dblp_url,
        resp: resp,
        flag: resp_flag,
      });

      //Find a new vul: rankDB lacks of `tacas` etc., but it does occur in file `dataGen`.
      if (typeof dblp_url == "undefined" && resp_flag != false) {
        let dblp_abbr = resp.hit[0].info.number;
        if (typeof dblp_abbr != "undefined" && isNaN(dblp_abbr)) {
        } else {
          dblp_abbr = resp.hit[0].info.venue;
        }
        for (let getRankSpan of site.rankSpanList) {
          // console.log("with abbr");
          appendRankSpan(node, getRankSpan(dblp_abbr, "abbr"), site);
        }
        appendRankSourceSpansForDblpRef(node, dblp_abbr, "abbr", site);
      }
      // Process PACM PL conferences using centralized helper function
      else if (dblp_url == "/journals/pacmpl/pacmpl") {
        dblp_url = processPacmPlJournal(resp);

        for (let getRankSpan of site.rankSpanList) {
          appendRankSpan(node, getRankSpan(dblp_url, "url"), site);
        }
        appendRankSourceSpansForDblpRef(node, dblp_url, "url", site);
      } else {
        for (let getRankSpan of site.rankSpanList) {
          // console.log("with url");
          appendRankSpan(node, getRankSpan(dblp_url, "url"), site);
        }
        appendRankSourceSpansForDblpRef(node, dblp_url, "url", site);
      }
    }
  };
  xhr.send();
}
