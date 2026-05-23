/**
 * MIT License
 *
 * Copyright (c) 2019-2024 WenyanLiu (https://github.com/WenyanLiu/CCFrank4dblp)
 */

const filter = {
  currentFilter: "ALL",
  siteConfig: null,

  init() {
    this.siteConfig = this.getSiteConfig(
      window.location.hostname,
      window.location.pathname,
    );

    if (!this.siteConfig) {
      return;
    }

    this.currentFilter = this.siteConfig.defaultFilter;
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
      <button data-rank="ALL">ALL</button>
      <button data-rank="A">CCF A</button>
      <button data-rank="B">CCF B</button>
      <button data-rank="C">CCF C</button>
    `;
    filterDiv
      .querySelector(`[data-rank="${this.currentFilter}"]`)
      ?.classList.add("active");
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

    const entries = document.querySelectorAll(this.siteConfig.entrySelector);
    entries.forEach((entry) => {
      const shouldShow = this.shouldShowEntry(
        entry,
        this.currentFilter,
        this.siteConfig,
      );
      entry.style.display = shouldShow ? "" : "none";
    });
  },

  shouldShowEntry(entry, currentFilter, siteConfig) {
    if (currentFilter === "ALL") {
      return true;
    }

    const ranks = this.getEntryRanks(entry);
    if (ranks.length === 0) {
      return !siteConfig.hideUnranked && currentFilter === "ALL";
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
        document.querySelectorAll(".ccf-filter button").forEach((btn) => {
          btn.classList.remove("active");
        });
        e.target.classList.add("active");

        this.currentFilter = e.target.dataset.rank;
        this.applyFilter(false);
      }
    });
  },
};
