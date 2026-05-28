/**
 * MIT License
 *
 * Copyright (c) 2019-2023 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp), mra42 (https://github.com/mra42)
 */

const scholar = {};

scholar.rankSpanList = [];

scholar.run = function () {
  let url = window.location.pathname;
  if (url == "/scholar") {
    scholar.appendRank();
  } else if (url == "/citations") {
    scholar.appendRanks(); // 页面加载时先处理一次作者主页上的条目
    scholar.observeCitations(); // 然后设置观察者以处理动态加载的条目
  }
};

scholar.extractVenue = function (metadata) {
  const parts = (metadata || "").split(/\s[-–—]\s/);
  if (parts.length < 2) {
    return "";
  }

  let venue = parts[1].trim();
  let yearMatch = venue.match(/,\s*(19|20)\d{2}\b/);
  if (yearMatch) {
    venue = venue.substring(0, yearMatch.index);
  }

  return venue.trim();
};

scholar.appendVenueRank = function (node, venue) {
  if (!venue) {
    return false;
  }

  let matched = false;

  if (ccf.resolveVenueText) {
    let venueMatch = ccf.resolveVenueText(venue);
    if (venueMatch) {
      for (let getRankSpan of scholar.rankSpanList) {
        $(node).after(getRankSpan(venueMatch.refine, venueMatch.type));
      }
      matched = true;
    }
  }

  if (typeof rankSources != "undefined" && rankSources.appendVenueTags) {
    matched = rankSources.appendVenueTags(node, venue) || matched;
  }

  return matched;
};

scholar.appendRank = function () {
  let elements = $("#gs_res_ccl_mid > div > div.gs_ri");
  elements.each(function (index) {
    let node = $(this).find("h3 > a");
    if (!node.next().hasClass("ccf-rank")) {
      let title = node.text();
      let metadata = $(this).find("div.gs_a").text();
      let venue = scholar.extractVenue(metadata);
      if (scholar.appendVenueRank(node, venue)) {
        return;
      }
      let data = $(this)
        .find("div.gs_a")
        .text()
        .replace(/[\,\-\…]/g, "")
        .split(" ");
      let author = data[1];
      let year = data.slice(-3)[0];
      setTimeout(function () {
        fetchRank(node, title, author, year, scholar);
      }, 100 * index);
    }
  });
};

scholar.observeCitations = function () {
  console.debug("Start citations ...");
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // 检查是否有新的文献项被添加到列表
        scholar.appendRanks();
      }
    }
  });

  // 开始观察文献列表的变化
  const targetNode = document.getElementById("gsc_a_b");
  if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
  }
};

scholar.appendRanks = function () {
  let elements = $("tr.gsc_a_tr");
  elements.each(function (index) {
    let node = $(this).find("td.gsc_a_t > a").first();
    if (!node.next().hasClass("ccf-rank") && !$(this).hasClass("ccf-ranked")) {
      let title = node.text();
      let author = $(this)
        .find("div.gs_gray")[0]
        .innerText.replace(/[\,\…]/g, "")
        .split(" ")[1];
      let year = $(this).find("td.gsc_a_y").text();
      $(this).addClass("ccf-ranked");
      setTimeout(function () {
        fetchRank(node, title, author, year, scholar);
      }, 100 * index);
    }
  });
};
