/**
 * MIT License
 *
 * Copyright (c) 2019-2024 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp)
 */

const filter = {
  currentFilter: "ALL",
  siteConfig: null,
  settings: null,
  validFilters: ["ALL", "A", "B", "C"],

  init() {
    this.siteConfig = this.getSiteConfig(
      window.location.hostname,
      window.location.pathname,
    );

    if (!this.siteConfig) {
      return;
    }

    this.settings = this.loadSettings(this.siteConfig);
    this.currentFilter = this.settings.defaultFilter;
    this.siteConfig.hideUnranked = this.settings.hideUnranked;
    this.createFilterButtons();
    this.bindEvents();
    this.applyFilter();
    this.setupDynamicContentHandler();
  },

  getSiteConfig(hostname, pathname) {
    if (hostname.startsWith("dblp")) {
      return {
        site: "dblp",
        defaultFilter: "ALL",
        entrySelector: "#completesearch-publs > div > ul > li",
        triggerSelector: "#completesearch-publs",
        hideUnranked: false,
        observeMutations: false,
      };
    }

    if (hostname.startsWith("scholar.google") && pathname == "/scholar") {
      return {
        site: "scholar",
        defaultFilter: "A",
        entrySelector: "#gs_res_ccl_mid > div",
        triggerSelector: "#gs_res_ccl_mid",
        hideUnranked: true,
        observeMutations: true,
      };
    }

    return null;
  },

  createFilterButtons() {
    if (document.querySelector(".ccf-filter")) {
      return;
    }

    const filterDiv = document.createElement("div");
    filterDiv.className = "ccf-filter";
    filterDiv.dataset.site = this.siteConfig.site;
    filterDiv.innerHTML = `
      <div class="ccf-filter-ranks">
        <button data-rank="ALL">ALL</button>
        <button data-rank="A">CCF A</button>
        <button data-rank="B">CCF B</button>
        <button data-rank="C">CCF C</button>
      </div>
      <div class="ccf-filter-settings">
        <label>
          <span>Default</span>
          <select data-setting="defaultFilter">
            <option value="ALL">ALL</option>
            <option value="A">CCF A</option>
            <option value="B">CCF B</option>
            <option value="C">CCF C</option>
          </select>
        </label>
        <label>
          <input type="checkbox" data-setting="hideUnranked">
          <span>Hide unmatched</span>
        </label>
      </div>
      <div class="ccf-filter-stats" aria-live="polite"></div>
    `;
    filterDiv
      .querySelector(`[data-rank="${this.currentFilter}"]`)
      ?.classList.add("active");
    filterDiv.querySelector('[data-setting="defaultFilter"]').value =
      this.settings.defaultFilter;
    filterDiv.querySelector('[data-setting="hideUnranked"]').checked =
      this.settings.hideUnranked;
    document.body.appendChild(filterDiv);
  },

  setupDynamicContentHandler() {
    const target = document.querySelector(this.siteConfig.triggerSelector);

    if (typeof IntersectionObserver != "undefined" && target) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.applyFilter();
          }
        });
      });

      observer.observe(target);
    }

    window.addEventListener(
      "scroll",
      this.debounce(() => {
        this.applyFilter();
      }, 200),
    );

    if (
      this.siteConfig.observeMutations &&
      typeof MutationObserver != "undefined" &&
      target
    ) {
      const reapplyFilter = this.debounce(() => {
        this.applyFilter();
      }, 50);
      const observer = new MutationObserver(reapplyFilter);
      observer.observe(target, { childList: true, subtree: true });
    }
  },

  applyFilter() {
    if (!this.siteConfig) {
      return;
    }

    const entries = Array.from(
      document.querySelectorAll(this.siteConfig.entrySelector),
    );
    entries.forEach((entry) => {
      const shouldShow = this.shouldShowEntry(
        entry,
        this.currentFilter,
        this.siteConfig,
      );
      entry.style.display = shouldShow ? "" : "none";
    });
    this.updateStats(this.calculateStats(entries));
  },

  shouldShowEntry(entry, currentFilter, siteConfig) {
    if (currentFilter === "ALL") {
      return true;
    }

    const ranks = this.getEntryRanks(entry);
    if (ranks.length === 0) {
      return !siteConfig.hideUnranked;
    }

    return ranks.includes(currentFilter);
  },

  getEntryRanks(entry) {
    return Array.from(entry.querySelectorAll(".ccf-rank")).reduce(
      (ranks, rankNode) => {
        const text = rankNode.textContent;
        if (text.includes("CCF A")) {
          ranks.push("A");
        }
        if (text.includes("CCF B")) {
          ranks.push("B");
        }
        if (text.includes("CCF C")) {
          ranks.push("C");
        }
        return ranks;
      },
      [],
    );
  },

  calculateStats(entries) {
    return entries.reduce(
      (stats, entry) => {
        stats.total += 1;
        if (entry.style.display === "none") {
          stats.hidden += 1;
        } else {
          stats.shown += 1;
        }

        if (this.getEntryRanks(entry).length === 0) {
          stats.unmatched += 1;
        } else {
          stats.ranked += 1;
        }

        return stats;
      },
      { total: 0, shown: 0, hidden: 0, ranked: 0, unmatched: 0 },
    );
  },

  updateStats(stats) {
    const statsElement = document.querySelector(".ccf-filter-stats");
    if (!statsElement) {
      return;
    }

    statsElement.textContent = `${stats.shown}/${stats.total} shown | ${stats.hidden} hidden | ${stats.unmatched} unmatched`;
  },

  getStorageKey(siteConfig) {
    return `onlyccfa:filter:${siteConfig.site}`;
  },

  loadSettings(siteConfig) {
    const defaults = {
      defaultFilter: siteConfig.defaultFilter,
      hideUnranked: siteConfig.hideUnranked,
    };

    try {
      const stored = localStorage.getItem(this.getStorageKey(siteConfig));
      if (!stored) {
        return defaults;
      }

      const parsed = JSON.parse(stored);
      return {
        defaultFilter: this.validFilters.includes(parsed.defaultFilter)
          ? parsed.defaultFilter
          : defaults.defaultFilter,
        hideUnranked:
          typeof parsed.hideUnranked === "boolean"
            ? parsed.hideUnranked
            : defaults.hideUnranked,
      };
    } catch (error) {
      return defaults;
    }
  },

  saveSettings(settings) {
    if (!this.siteConfig) {
      return;
    }

    try {
      localStorage.setItem(
        this.getStorageKey(this.siteConfig),
        JSON.stringify({
          defaultFilter: this.validFilters.includes(settings.defaultFilter)
            ? settings.defaultFilter
            : this.siteConfig.defaultFilter,
          hideUnranked: Boolean(settings.hideUnranked),
        }),
      );
    } catch (error) {
      // Keep filtering usable even if a site blocks localStorage.
    }
  },

  refreshActiveButton() {
    document.querySelectorAll(".ccf-filter button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.rank === this.currentFilter);
    });
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  bindEvents() {
    const filterElement = document.querySelector(".ccf-filter");
    if (!filterElement) {
      return;
    }

    filterElement.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        this.currentFilter = e.target.dataset.rank;
        this.refreshActiveButton();
        this.applyFilter();
      }
    });

    filterElement.addEventListener("change", (e) => {
      if (e.target.dataset.setting === "defaultFilter") {
        this.settings.defaultFilter = e.target.value;
        this.currentFilter = this.settings.defaultFilter;
        this.refreshActiveButton();
        this.saveSettings(this.settings);
        this.applyFilter();
      }

      if (e.target.dataset.setting === "hideUnranked") {
        this.settings.hideUnranked = e.target.checked;
        this.siteConfig.hideUnranked = this.settings.hideUnranked;
        this.saveSettings(this.settings);
        this.applyFilter();
      }
    });
  },
};
