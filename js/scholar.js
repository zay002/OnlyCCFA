/**
 * MIT License
 *
 * Copyright (c) 2019-2023 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp), mra42 (https://github.com/mra42)
 */

const scholar = {};

scholar.rankSpanList = [];
scholar.deepTargetCount = 55;
scholar.deepPageSize = 10;
scholar.deepRequestDelay = 800;
scholar.deepLoading = false;

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

scholar.getBaseUrl = function () {
  if (typeof window !== "undefined" && window.location) {
    return window.location.href;
  }

  return "https://scholar.google.com/scholar";
};

scholar.getCurrentStart = function (url) {
  return (
    Number(new URL(url, scholar.getBaseUrl()).searchParams.get("start")) || 0
  );
};

scholar.getDeepPageStarts = function (currentStart, pageSize, targetCount) {
  const starts = [];

  for (let loaded = pageSize; loaded < targetCount; loaded += pageSize) {
    starts.push(currentStart + loaded);
  }

  return starts;
};

scholar.withStartParam = function (url, start) {
  const nextUrl = new URL(url, scholar.getBaseUrl());
  nextUrl.searchParams.set("start", String(start));
  return nextUrl.toString();
};

scholar.wait = function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

scholar.collectResultEntries = function (doc) {
  return Array.from(doc.querySelectorAll("#gs_res_ccl_mid > div")).filter(
    (entry) => entry.querySelector("h3 a"),
  );
};

scholar.getResultKey = function (entry) {
  const titleLink = entry.querySelector("h3 a");
  if (!titleLink) {
    return "";
  }

  const href = (titleLink.href || "").trim();
  if (href) {
    return href;
  }

  return titleLink.textContent.replace(/\s+/g, " ").trim().toLowerCase();
};

scholar.getExistingResultKeys = function () {
  return new Set(
    scholar
      .collectResultEntries(document)
      .map((entry) => scholar.getResultKey(entry)),
  );
};

scholar.setDeepSearchState = function (status, isLoading) {
  const statusNode = document.querySelector(".ccf-filter-deep-status");
  if (statusNode) {
    statusNode.textContent = status || "";
  }

  const button = document.querySelector('[data-action="deep-search"]');
  if (button) {
    button.disabled = Boolean(isLoading);
  }
};

scholar.importDeepEntry = function (entry) {
  const imported = document.importNode(entry, true);
  imported.classList.add("onlyccfa-deep-result");
  imported.dataset.onlyccfaDeepResult = "true";
  return imported;
};

scholar.loadDeepResults = async function () {
  if (scholar.deepLoading) {
    return;
  }

  const container = document.querySelector("#gs_res_ccl_mid");
  if (!container) {
    scholar.setDeepSearchState("未找到 Google 学术结果。", false);
    return;
  }

  scholar.deepLoading = true;
  let appended = 0;
  let scanned = scholar.collectResultEntries(document).length;
  const seen = scholar.getExistingResultKeys();
  const currentStart = scholar.getCurrentStart(window.location.href);
  const starts = scholar.getDeepPageStarts(
    currentStart,
    scholar.deepPageSize,
    scholar.deepTargetCount,
  );

  scholar.setDeepSearchState("正在加载更多 Google 学术结果...", true);

  try {
    for (
      let index = 0;
      index < starts.length && scanned < scholar.deepTargetCount;
      index += 1
    ) {
      if (index > 0) {
        await scholar.wait(scholar.deepRequestDelay);
      }

      const url = scholar.withStartParam(window.location.href, starts[index]);
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Google Scholar returned ${response.status}`);
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const entries = scholar.collectResultEntries(doc);
      if (entries.length === 0) {
        break;
      }

      for (const entry of entries) {
        if (scanned >= scholar.deepTargetCount) {
          break;
        }

        scanned += 1;
        const key = scholar.getResultKey(entry);
        if (!key || seen.has(key)) {
          continue;
        }

        seen.add(key);
        container.appendChild(scholar.importDeepEntry(entry));
        appended += 1;
      }

      scholar.setDeepSearchState(
        `已新增 ${appended} 条，已扫描 ${Math.min(
          scanned,
          scholar.deepTargetCount,
        )}/${scholar.deepTargetCount}.`,
        true,
      );

      scholar.appendRank();
      if (typeof filter !== "undefined") {
        filter.applyFilter();
      }

      if (entries.length < scholar.deepPageSize) {
        break;
      }
    }

    scholar.appendRank();
    if (typeof filter !== "undefined") {
      filter.applyFilter();
    }
    scholar.setDeepSearchState(
      `深度筛选已扫描 ${Math.min(
        scanned,
        scholar.deepTargetCount,
      )} 条，新增 ${appended} 条。`,
      false,
    );
  } catch (error) {
    scholar.setDeepSearchState(
      `深度筛选停止：${error.message || "请求失败"}。`,
      false,
    );
  } finally {
    scholar.deepLoading = false;
  }
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
    if ($(this).hasClass("ccf-ranked")) {
      return;
    }

    let node = $(this).find("h3 > a");
    if (
      !node.next().hasClass("ccf-rank") &&
      !node.next().hasClass("rank-source")
    ) {
      let title = node.text();
      let metadata = $(this).find("div.gs_a").text();
      let venue = scholar.extractVenue(metadata);
      $(this).addClass("ccf-ranked");
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
