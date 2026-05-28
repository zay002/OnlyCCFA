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
  validLanguages: ["zh", "en"],
  validSignalModes: ["any", "all"],
  deepCountOptions: [20, 40, 60, 80, 100],
  signalOptions: [
    { id: "sci", zh: "SCI", en: "SCI" },
    { id: "jcrQ1", zh: "JCR Q1", en: "JCR Q1" },
    { id: "jcrQ2", zh: "JCR Q2", en: "JCR Q2" },
    { id: "cas1", zh: "中科院 1区", en: "CAS Q1" },
    { id: "cas2", zh: "中科院 2区", en: "CAS Q2" },
    { id: "casTop", zh: "中科院 TOP", en: "CAS TOP" },
    { id: "ei", zh: "EI", en: "EI" },
    { id: "cnCore", zh: "中文核心", en: "CN Core" },
    { id: "roboticsTop", zh: "机器人TOP", en: "Robotics TOP" },
    { id: "commTop", zh: "通信TOP", en: "Comm TOP" },
    { id: "eeTop", zh: "电气TOP", en: "EE TOP" },
    { id: "controlTop", zh: "控制TOP", en: "Control TOP" },
    { id: "mechTop", zh: "机械TOP", en: "Mech TOP" },
    { id: "swjtuJournal", zh: "西南交大", en: "SWJTU" },
    { id: "swjtuScai", zh: "交大计算机C类", en: "SWJTU CS C" },
    { id: "swjtuTransport", zh: "交大交通", en: "SWJTU Transport" },
  ],

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
    const language = this.settings.language;
    const t = (key, params) => onlyccfaI18n.t(language, key, params);
    const deepSearchControls =
      this.siteConfig.site === "scholar"
        ? `
      <div class="ccf-filter-deep">
        <div class="ccf-filter-section-title">${t("deepSection")}</div>
        <label class="ccf-filter-row">
          <span>${t("batchSize")}</span>
          <select data-setting="deepTargetCount">
            ${this.deepCountOptions
              .map((count) => `<option value="${count}">${count}</option>`)
              .join("")}
          </select>
        </label>
        <div class="ccf-filter-action-row">
          <button type="button" data-action="deep-search">${t("deepSearch")}</button>
          <button type="button" data-action="clear-deep">${t("clearDeep")}</button>
        </div>
        <div class="ccf-filter-deep-status" aria-live="polite"></div>
      </div>
    `
        : "";
    const exportControls =
      this.siteConfig.site === "scholar"
        ? `
      <div class="ccf-filter-export">
        <div class="ccf-filter-section-title">${t("exportSection")}</div>
        <div class="ccf-filter-action-row">
          <button type="button" data-action="export-selected">${t("exportSelected")}</button>
          <button type="button" data-action="export-visible">${t("exportVisible")}</button>
        </div>
        <button type="button" data-action="export-pool">${t("exportPool")}</button>
        <button type="button" data-action="enable-bibtex-links">${t(
          "enableScholarBibtex",
        )}</button>
        <label class="ccf-filter-row">
          <span>${t("zoteroCategory")}</span>
          <input type="text" data-setting="zoteroCategory" value="${this.escapeHtml(
            this.settings.zoteroCategory,
          )}">
        </label>
        <button type="button" data-action="zotero-import">${t("zoteroImport")}</button>
        <div class="ccf-filter-export-status" aria-live="polite"></div>
      </div>
    `
        : "";

    filterDiv.innerHTML = `
      <div class="ccf-filter-header">
        <div>
          <div class="ccf-filter-title">${t("title")}</div>
          <div class="ccf-filter-subtitle">${t("subtitle")}</div>
        </div>
        <button type="button" class="ccf-filter-language" data-action="toggle-language">${t(
          "language",
        )}</button>
      </div>
      <div class="ccf-filter-section-title">${t("ccfSection")}</div>
      <div class="ccf-filter-ranks">
        <button data-rank="ALL">ALL</button>
        <button data-rank="A">CCF A</button>
        <button data-rank="B">CCF B</button>
        <button data-rank="C">CCF C</button>
      </div>
      <div class="ccf-filter-settings">
        <label class="ccf-filter-row">
          <span>${t("defaultFilter")}</span>
          <select data-setting="defaultFilter">
            <option value="ALL">ALL</option>
            <option value="A">CCF A</option>
            <option value="B">CCF B</option>
            <option value="C">CCF C</option>
          </select>
        </label>
        <label class="ccf-filter-check">
          <input type="checkbox" data-setting="hideUnranked">
          <span>${t("hideUnranked")}</span>
        </label>
      </div>
      <div class="ccf-filter-sources">
        <div class="ccf-filter-section-title">${t("sourceSection")}</div>
        <div class="ccf-filter-signal-grid">
          ${this.signalOptions
            .map(
              (option) => `
            <label class="ccf-filter-chip">
              <input type="checkbox" data-signal="${option.id}">
              <span>${this.escapeHtml(option[language] || option.zh)}</span>
            </label>
          `,
            )
            .join("")}
        </div>
        <label class="ccf-filter-row">
          <span>${t("sourceMode")}</span>
          <select data-setting="signalMode">
            <option value="any">${t("any")}</option>
            <option value="all">${t("all")}</option>
          </select>
        </label>
      </div>
      <div class="ccf-filter-stats" aria-live="polite"></div>
      ${deepSearchControls}
      ${exportControls}
    `;
    filterDiv
      .querySelector(`[data-rank="${this.currentFilter}"]`)
      ?.classList.add("active");
    filterDiv.querySelector('[data-setting="defaultFilter"]').value =
      this.settings.defaultFilter;
    filterDiv.querySelector('[data-setting="hideUnranked"]').checked =
      this.settings.hideUnranked;
    filterDiv.querySelector('[data-setting="signalMode"]').value =
      this.settings.signalMode;
    filterDiv.querySelectorAll("[data-signal]").forEach((input) => {
      input.checked = this.settings.selectedSignals.includes(
        input.dataset.signal,
      );
    });
    const deepCount = filterDiv.querySelector(
      '[data-setting="deepTargetCount"]',
    );
    if (deepCount) {
      deepCount.value = String(this.settings.deepTargetCount);
    }
    document.body.appendChild(filterDiv);
    this.applyPanelPosition(filterDiv);
    this.initPanelDrag(filterDiv);
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
        this.getActiveFilterState(),
      );
      entry.style.display = shouldShow ? "" : "none";
    });
    this.updateStats(this.calculateStats(entries));
  },

  getActiveFilterState() {
    return {
      currentFilter: this.currentFilter,
      siteConfig: this.siteConfig,
      selectedSignals: this.settings?.selectedSignals || [],
      signalMode: this.settings?.signalMode || "any",
    };
  },

  shouldShowEntry(entry, stateOrFilter, maybeSiteConfig) {
    const state =
      typeof stateOrFilter === "object"
        ? stateOrFilter
        : {
            currentFilter: stateOrFilter,
            siteConfig: maybeSiteConfig,
            selectedSignals: [],
            signalMode: "any",
          };
    const currentFilter = state.currentFilter;
    const siteConfig = state.siteConfig;
    const selectedSignals = state.selectedSignals || [];
    const signalMode = state.signalMode || "any";

    if (currentFilter === "ALL") {
      return this.matchesSelectedSignals(entry, selectedSignals, signalMode);
    }

    const ranks = this.getEntryRanks(entry);
    if (ranks.length === 0) {
      return (
        !siteConfig.hideUnranked &&
        this.matchesSelectedSignals(entry, selectedSignals, signalMode)
      );
    }

    return (
      ranks.includes(currentFilter) &&
      this.matchesSelectedSignals(entry, selectedSignals, signalMode)
    );
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

  getEntrySignalIds(entry) {
    const signals = new Set();

    this.getEntryRanks(entry).forEach((rank) => {
      signals.add(`ccf${rank}`);
    });

    Array.from(entry.querySelectorAll(".rank-source")).forEach((node) => {
      const source = node.dataset?.rankSource || "";
      const value = node.dataset?.rankValue || "";
      const text = node.textContent || "";

      if (source === "sci" || text === "SCI") {
        signals.add("sci");
      }
      if (source === "jcr" && value === "Q1") {
        signals.add("jcrQ1");
      }
      if (source === "jcr" && value === "Q2") {
        signals.add("jcrQ2");
      }
      if (source === "casTop" || text.includes("中科院TOP")) {
        signals.add("casTop");
      }
      if (text.includes("中科院") && text.includes("1区")) {
        signals.add("cas1");
      }
      if (text.includes("中科院") && text.includes("2区")) {
        signals.add("cas2");
      }
      if (source === "ei" || text === "EI") {
        signals.add("ei");
      }
      if (["pkuCore", "cscd", "cssci"].includes(source)) {
        signals.add("cnCore");
      }
      [
        "roboticsTop",
        "commTop",
        "eeTop",
        "controlTop",
        "mechTop",
        "swjtuJournal",
        "swjtuScai",
        "swjtuTransport",
      ].forEach((id) => {
        if (source === id) {
          signals.add(id);
        }
      });
    });

    return Array.from(signals);
  },

  matchesSelectedSignals(entry, selectedSignals, signalMode) {
    if (!selectedSignals || selectedSignals.length === 0) {
      return true;
    }

    const signals = new Set(this.getEntrySignalIds(entry));
    if (signalMode === "all") {
      return selectedSignals.every((signal) => signals.has(signal));
    }

    return selectedSignals.some((signal) => signals.has(signal));
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

    const language = this.settings?.language || "zh";
    statsElement.textContent = onlyccfaI18n.t(language, "stats", stats);
  },

  getStorageKey(siteConfig) {
    return `onlyccfa:filter:${siteConfig.site}`;
  },

  loadSettings(siteConfig) {
    const defaults = {
      defaultFilter: siteConfig.defaultFilter,
      hideUnranked: siteConfig.hideUnranked,
      language: "zh",
      selectedSignals: [],
      signalMode: "any",
      deepTargetCount: 60,
      zoteroCategory: "",
      panelPosition: null,
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
        language: this.validLanguages.includes(parsed.language)
          ? parsed.language
          : defaults.language,
        selectedSignals: Array.isArray(parsed.selectedSignals)
          ? parsed.selectedSignals.filter((signal) =>
              this.signalOptions.some((option) => option.id === signal),
            )
          : defaults.selectedSignals,
        signalMode: this.validSignalModes.includes(parsed.signalMode)
          ? parsed.signalMode
          : defaults.signalMode,
        deepTargetCount: this.deepCountOptions.includes(
          Number(parsed.deepTargetCount),
        )
          ? Number(parsed.deepTargetCount)
          : defaults.deepTargetCount,
        zoteroCategory:
          typeof parsed.zoteroCategory === "string"
            ? parsed.zoteroCategory
            : defaults.zoteroCategory,
        panelPosition: parsed.panelPosition
          ? this.clampPanelPosition(parsed.panelPosition)
          : defaults.panelPosition,
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
          language: this.validLanguages.includes(settings.language)
            ? settings.language
            : "zh",
          selectedSignals: Array.isArray(settings.selectedSignals)
            ? settings.selectedSignals.filter((signal) =>
                this.signalOptions.some((option) => option.id === signal),
              )
            : [],
          signalMode: this.validSignalModes.includes(settings.signalMode)
            ? settings.signalMode
            : "any",
          deepTargetCount: this.deepCountOptions.includes(
            Number(settings.deepTargetCount),
          )
            ? Number(settings.deepTargetCount)
            : 60,
          zoteroCategory:
            typeof settings.zoteroCategory === "string"
              ? settings.zoteroCategory
              : "",
          panelPosition: settings.panelPosition
            ? this.clampPanelPosition(settings.panelPosition)
            : null,
        }),
      );
    } catch (error) {
      // Keep filtering usable even if a site blocks localStorage.
    }
  },

  clampPanelPosition(
    position,
    viewport = {
      width: typeof window === "undefined" ? 1280 : window.innerWidth,
      height: typeof window === "undefined" ? 800 : window.innerHeight,
    },
    size = { width: 336, height: 420 },
  ) {
    const margin = 8;
    const maxLeft = Math.max(margin, viewport.width - size.width - margin);
    const maxTop = Math.max(margin, viewport.height - size.height - margin);
    const left = Math.min(
      Math.max(Number(position?.left) || margin, margin),
      maxLeft,
    );
    const top = Math.min(
      Math.max(Number(position?.top) || margin, margin),
      maxTop,
    );

    return { left, top };
  },

  applyPanelPosition(panel) {
    if (!panel || !this.settings?.panelPosition) {
      return;
    }

    const rect = panel.getBoundingClientRect?.() || {
      width: panel.offsetWidth || 336,
      height: panel.offsetHeight || 420,
    };
    const position = this.clampPanelPosition(
      this.settings.panelPosition,
      { width: window.innerWidth, height: window.innerHeight },
      rect,
    );

    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
    panel.style.right = "auto";
  },

  initPanelDrag(panel) {
    const header = panel?.querySelector?.(".ccf-filter-header");
    if (!header) {
      return;
    }

    const interactiveSelector = "button,input,select,textarea,a,label";
    header.addEventListener("pointerdown", (event) => {
      if (event.target.closest(interactiveSelector)) {
        return;
      }

      const rect = panel.getBoundingClientRect();
      const start = {
        x: event.clientX,
        y: event.clientY,
        left: rect.left,
        top: rect.top,
      };

      const movePanel = (moveEvent) => {
        const nextPosition = this.clampPanelPosition(
          {
            left: start.left + moveEvent.clientX - start.x,
            top: start.top + moveEvent.clientY - start.y,
          },
          { width: window.innerWidth, height: window.innerHeight },
          { width: rect.width, height: rect.height },
        );
        panel.style.left = `${nextPosition.left}px`;
        panel.style.top = `${nextPosition.top}px`;
        panel.style.right = "auto";
      };

      const stopDrag = () => {
        document.removeEventListener("pointermove", movePanel);
        document.removeEventListener("pointerup", stopDrag);
        this.settings.panelPosition = this.clampPanelPosition(
          {
            left: Number.parseFloat(panel.style.left),
            top: Number.parseFloat(panel.style.top),
          },
          { width: window.innerWidth, height: window.innerHeight },
          { width: rect.width, height: rect.height },
        );
        this.saveSettings(this.settings);
      };

      panel.setPointerCapture?.(event.pointerId);
      document.addEventListener("pointermove", movePanel);
      document.addEventListener("pointerup", stopDrag, { once: true });
    });
  },

  setStatus(selector, message) {
    const node = document.querySelector(selector);
    if (node) {
      node.textContent = message || "";
    }
  },

  rerenderPanel() {
    const oldPanel = document.querySelector(".ccf-filter");
    if (oldPanel) {
      oldPanel.remove();
    }
    this.createFilterButtons();
    this.bindEvents();
    this.applyFilter();
  },

  escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
      if (e.target.dataset.action === "toggle-language") {
        this.settings.language = this.settings.language === "zh" ? "en" : "zh";
        this.saveSettings(this.settings);
        this.rerenderPanel();
        return;
      }

      if (e.target.dataset.action === "deep-search") {
        if (typeof scholar !== "undefined" && scholar.loadDeepResults) {
          scholar.loadDeepResults(this.settings.deepTargetCount);
        }
        return;
      }

      if (e.target.dataset.action === "clear-deep") {
        if (typeof scholar !== "undefined" && scholar.clearDeepResults) {
          scholar.clearDeepResults();
        }
        return;
      }

      if (e.target.dataset.action === "export-selected") {
        if (typeof scholar !== "undefined") {
          scholar.exportBibtex("selected");
        }
        return;
      }

      if (e.target.dataset.action === "export-visible") {
        if (typeof scholar !== "undefined") {
          scholar.exportBibtex("visible");
        }
        return;
      }

      if (e.target.dataset.action === "export-pool") {
        if (typeof scholar !== "undefined") {
          scholar.exportBibtex("pool");
        }
        return;
      }

      if (e.target.dataset.action === "zotero-import") {
        if (typeof scholar !== "undefined") {
          scholar.importToZotero(this.settings.zoteroCategory);
        }
        return;
      }

      if (e.target.dataset.action === "enable-bibtex-links") {
        if (
          typeof scholar !== "undefined" &&
          scholar.enableScholarBibtexLinks
        ) {
          scholar.enableScholarBibtexLinks();
        }
        return;
      }

      if (e.target.tagName === "BUTTON" && e.target.dataset.rank) {
        this.currentFilter = e.target.dataset.rank;
        this.refreshActiveButton();
        this.applyFilter();
      }
    });

    filterElement.addEventListener("change", (e) => {
      if (e.target.dataset.signal) {
        const signal = e.target.dataset.signal;
        if (e.target.checked) {
          this.settings.selectedSignals = Array.from(
            new Set(this.settings.selectedSignals.concat(signal)),
          );
        } else {
          this.settings.selectedSignals = this.settings.selectedSignals.filter(
            (item) => item !== signal,
          );
        }
        this.saveSettings(this.settings);
        this.applyFilter();
      }

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

      if (e.target.dataset.setting === "signalMode") {
        this.settings.signalMode = e.target.value;
        this.saveSettings(this.settings);
        this.applyFilter();
      }

      if (e.target.dataset.setting === "deepTargetCount") {
        this.settings.deepTargetCount = Number(e.target.value);
        this.saveSettings(this.settings);
      }

      if (e.target.dataset.setting === "zoteroCategory") {
        this.settings.zoteroCategory = e.target.value;
        this.saveSettings(this.settings);
      }
    });
  },
};
