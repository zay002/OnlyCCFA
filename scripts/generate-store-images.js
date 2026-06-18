const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "img");

const screenshotFiles = {
  ccfaDefault: "demo-deep-filter-workflow.png",
  ccfaUnmatched: "demo-advanced-source-filters.png",
  ccfb: "demo-bibtex-zotero-export.png",
  ccfc: "demo-continue-next-batch.png",
  fieldTop: "demo-field-top-venues.png",
  cleanBibtex: "demo-clean-bibtex-format.png",
  zoteroConnector: "demo-zotero-filtered-connector.png",
};

const promoFiles = {
  small: "promo-small.png",
  marquee: "promo-marquee.png",
};

function findChrome() {
  const candidates = [
    process.env.DEMO_BROWSER_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Google\\Chrome\\Application\\chrome.exe",
    ),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);

  const chromePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!chromePath) {
    throw new Error(
      "Chrome executable was not found. Set DEMO_BROWSER_PATH to your Chrome path.",
    );
  }

  return chromePath;
}

function readAsset(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readBase64(relativePath) {
  return fs.readFileSync(path.join(root, relativePath)).toString("base64");
}

const scenarios = {
  chineseComputing: {
    query: "计算机学报 人工智能",
    entries: [
      {
        rank: null,
        badges: [
          ["rank-source rank-source-cn", "北大核心"],
          ["rank-source rank-source-cn", "CSCD"],
          ["rank-source rank-source-school", "CCF中文T1"],
          ["rank-source rank-source-school", "西南交大"],
        ],
        authorBadges: [["rank-source rank-source-talent", "中科院院士"]],
        title: "面向可信人工智能的图学习方法研究",
        authors: "张钹, 李航, 周志华",
        venue: "计算机学报, 2025",
        cite: "486",
        snippet:
          "围绕可解释性、鲁棒性与可信评测体系，综述图学习在复杂智能系统中的关键技术进展。",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-cn", "北大核心"],
          ["rank-source rank-source-cn", "CSCD"],
          ["rank-source rank-source-school", "CCF中文T1"],
          ["rank-source rank-source-school", "西南交大"],
        ],
        authorBadges: [["rank-source rank-source-talent", "工程院院士"]],
        title: "大模型驱动的软件工程自动化：现状与挑战",
        authors: "梅宏, 吕建, 陈道蓄",
        venue: "软件学报, 2025",
        cite: "392",
        snippet:
          "从需求理解、代码生成、测试修复到软件演化，分析大模型给软件工程研究带来的新范式。",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-cn", "北大核心"],
          ["rank-source rank-source-cn", "CSCD"],
          ["rank-source rank-source-school", "CCF中文T1"],
        ],
        authorBadges: [["rank-source rank-source-talent", "国家杰青"]],
        title: "多智能体协同决策中的安全约束强化学习",
        authors: "陈小平, 刘成林, 王飞跃",
        venue: "中国科学：信息科学, 2025",
        cite: "271",
        snippet:
          "结合安全约束、博弈建模与可验证策略优化，提升复杂开放环境下多智能体系统的可靠性。",
      },
    ],
  },
  robotLearning: {
    query: "robot learning",
    entries: [
      {
        rank: null,
        badges: [
          ["rank-source rank-source-robotics", "机器人方向TOP"],
        ],
        title: "Learning agile whole-body robot control from human videos",
        authors: "A Kumar, L Smith, Y Zhao",
        venue: "Conference on Robot Learning, 2025",
        cite: "684",
        snippet:
          "Robot learning methods transfer visual demonstrations into whole-body control policies for dexterous mobile manipulation.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-robotics", "机器人方向TOP"],
        ],
        title: "Foundation policies for generalist robot manipulation",
        authors: "M Chen, P Florence, R Fox",
        venue: "Robotics: Science and Systems, 2025",
        cite: "512",
        snippet:
          "A generalist manipulation policy improves zero-shot transfer across household, warehouse, and laboratory robot tasks.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-robotics", "机器人方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "Learning force-aware manipulation for contact-rich robotics",
        authors: "N Lee, J Wu, S Levine",
        venue: "IEEE Transactions on Robotics, 2024",
        cite: "421",
        snippet:
          "Force-aware policies combine tactile feedback and model predictive control for robust contact-rich manipulation.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-robotics", "机器人方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ2"],
        ],
        title: "Benchmarking visuomotor policies in open-world robot tasks",
        authors: "D Park, H Li, T Darrell",
        venue: "IEEE Robotics and Automation Letters, 2025",
        cite: "233",
        snippet:
          "A benchmark for evaluating robot policies under distribution shift, object variation, and long-horizon manipulation.",
      },
    ],
  },
  embodiedAI: {
    query: "embodied ai agents",
    entries: [
      {
        rank: "A",
        badges: [["rank-source rank-source-ei", "EI"]],
        title: "Embodied agents that plan, perceive, and act in open worlds",
        authors: "L Wang, K He, Y Bengio",
        venue: "Neural Information Processing Systems, 2025",
        cite: "1288",
        snippet:
          "A multimodal agent architecture links language, perception, memory, and control for long-horizon embodied tasks.",
      },
      {
        rank: "A",
        badges: [["rank-source rank-source-ei", "EI"]],
        title: "Vision-language-action models for general robot policies",
        authors: "S Reed, F Xia, B Ichter",
        venue: "International Conference on Computer Vision, 2025",
        cite: "947",
        snippet:
          "Vision-language-action pretraining improves embodied reasoning and policy transfer across unseen robot environments.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-robotics", "机器人方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "Embodied intelligence for interactive mobile manipulation",
        authors: "C Finn, M Kalakrishnan",
        venue: "Science Robotics, 2024",
        cite: "521",
        snippet:
          "Interactive mobile manipulation systems combine perception, language instruction, and closed-loop robot control.",
      },
    ],
  },
  communication: {
    query: "6G semantic communication",
    entries: [
      {
        rank: null,
        badges: [
          ["rank-source rank-source-comm", "通信方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "Semantic communications for 6G native AI networks",
        authors: "Y Zhang, M Debbah, H V Poor",
        venue: "IEEE Transactions on Wireless Communications, 2025",
        cite: "766",
        snippet:
          "Semantic communication frameworks reduce transmission cost by aligning channel coding with task-level meaning.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-comm", "通信方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "Integrated sensing and communication for autonomous systems",
        authors: "R Liu, F Liu, C Masouros",
        venue: "IEEE Journal on Selected Areas in Communications, 2025",
        cite: "498",
        snippet:
          "Integrated sensing and communication enables shared radio resources for perception, localization, and data links.",
      },
      {
        rank: "A",
        badges: [
          ["rank-source rank-source-comm", "通信方向TOP"],
          ["rank-source rank-source-ei", "EI"],
        ],
        title: "Edge-native 6G networking for foundation model services",
        authors: "J Xu, S Mao, X Shen",
        venue: "IEEE INFOCOM, 2025",
        cite: "321",
        snippet:
          "An edge networking stack schedules foundation-model inference across radio, compute, and memory resources.",
      },
    ],
  },
  engineering: {
    query: "power electronics control",
    entries: [
      {
        rank: null,
        badges: [
          ["rank-source rank-source-ee", "电气方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "AI-assisted model predictive control for power converters",
        authors: "H Wang, J Rodriguez, B K Bose",
        venue: "IEEE Transactions on Power Electronics, 2025",
        cite: "611",
        snippet:
          "Learning-assisted model predictive control improves transient response and robustness in power converter systems.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-control", "控制方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "Safe learning-based control for cyber-physical systems",
        authors: "M Morari, A Bemporad, L Ljung",
        venue: "Automatica, 2025",
        cite: "384",
        snippet:
          "Safety filters and robust optimization make learning-based controllers reliable under model uncertainty.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-mech", "机械方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "Fault diagnosis for rotating machinery with foundation models",
        authors: "T Li, X Chen, R Randall",
        venue: "Mechanical Systems and Signal Processing, 2025",
        cite: "277",
        snippet:
          "Foundation models transfer vibration representations across machines, loads, and fault types for predictive maintenance.",
      },
    ],
  },
  pointCloud: {
    query: "point cloud registration",
    entries: [
      {
        rank: "A",
        badges: [
          ["rank-source rank-source-ei", "EI"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
        ],
        title: "Geometric transformer for fast and robust point cloud registration",
        authors: "Z Qin, H Yu, C Wang, Y Guo, Y Peng, K Xu",
        venue: "IEEE Conference on Computer Vision and Pattern Recognition, 2022",
        cite: "1184",
        snippet:
          "A geometric transformer learns rotation-invariant local structures for robust low-overlap point cloud registration.",
      },
      {
        rank: "A",
        badges: [
          ["rank-source rank-source-ei", "EI"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
        ],
        title: "PointDSC: Robust point cloud registration using deep spatial consistency",
        authors: "X Bai, Z Luo, L Zhou",
        venue: "IEEE Conference on Computer Vision and Pattern Recognition, 2021",
        cite: "936",
        snippet:
          "Deep spatial consistency recovers reliable correspondences and improves registration under heavy outliers.",
      },
      {
        rank: null,
        badges: [
          ["rank-source rank-source-robotics", "机器人方向TOP"],
          ["rank-source rank-source-sci", "SCI"],
          ["rank-source rank-source-jcr", "JCRQ1"],
          ["rank-source rank-source-top", "中科院TOP"],
        ],
        title: "LiDAR-inertial registration for mobile robot mapping",
        authors: "J Zhang, S Singh, L Carlone",
        venue: "IEEE Transactions on Robotics, 2025",
        cite: "402",
        snippet:
          "A tightly coupled registration backend improves large-scale robot mapping under motion distortion and sparse geometry.",
      },
    ],
  },
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scholarFixture(scenario) {
  const entries = scenario.entries;
  const sourceByText = [
    ["JCRQ1", "jcr", "Q1"],
    ["JCRQ2", "jcr", "Q2"],
    ["SCI", "sci", ""],
    ["中科院TOP", "casTop", ""],
    ["机器人", "roboticsTop", ""],
    ["通信", "commTop", ""],
    ["电气", "eeTop", ""],
    ["控制", "controlTop", ""],
    ["机械", "mechTop", ""],
    ["EI", "ei", ""],
    ["北大核心", "pkuCore", ""],
    ["CSCD", "cscd", ""],
    ["CCF中文", "swjtuCcfChinese", ""],
    ["西南交大", "swjtuJournal", ""],
    ["中科院院士", "casAcademician", ""],
    ["工程院院士", "caeAcademician", ""],
    ["国家杰青", "distinguishedYoungScholar", ""],
  ];

  function badgeHtml([className, text]) {
    const source = sourceByText.find(([needle]) => text.includes(needle)) || [
      "",
      "",
      "",
    ];
    return `<span class="${className}" data-rank-source="${source[1]}" data-rank-value="${source[2]}">${text}</span>`;
  }

  const resultHtml = entries
    .map((entry) => {
      const rank =
        entry.rank === null
          ? ""
          : `<span class="ccf-rank ccf-${entry.rank.toLowerCase()}">CCF ${entry.rank}</span>`;
      const badges = (entry.badges || []).map(badgeHtml).join("");
      const authorBadges = (entry.authorBadges || []).map(badgeHtml).join("");
      return `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">${entry.title}</a>${rank}${badges}
            </h3>
            <div class="onlyccfa-result-actions">
              <label><input class="onlyccfa-select-result" type="checkbox"> <span>选择</span></label>
              <button type="button">复制 BibTeX</button>
            </div>
            <div class="gs_a">${entry.authors}${authorBadges} - ${entry.venue} - example.org</div>
            <div class="gs_rs">${entry.snippet}</div>
            <div class="gs_fl">
              <a href="#">Save</a>
              <a href="#">Cite</a>
              <a href="#">Cited by ${entry.cite}</a>
              <a href="#">Related articles</a>
              <a href="#">All versions</a>
            </div>
          </div>
        </div>`;
    })
    .join("");

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>OnlyCCFA Google Scholar demo</title>
      </head>
      <body>
        <header class="demo-header">
          <div class="demo-menu">☰</div>
          <div class="demo-logo"><span>G</span>oogle <strong>Scholar</strong></div>
          <div class="demo-search">${scenario.query}</div>
          <div class="demo-search-button">⌕</div>
          <div class="demo-avatar"></div>
        </header>
        <main class="demo-layout">
          <aside class="demo-sidebar">
            <a class="active">Articles</a>
            <hr>
            <a>Any time</a>
            <a>Since 2026</a>
            <a class="active">Since 2025</a>
            <a>Custom range...</a>
            <hr>
            <a class="active">Sort by relevance</a>
            <a>Sort by date</a>
            <hr>
            <label><input type="checkbox"> include patents</label>
            <label><input type="checkbox" checked> include citations</label>
          </aside>
          <section class="demo-results">
            <div class="demo-count">About 111,000 results (0.06 sec)</div>
            <div id="gs_res_ccl_mid">${resultHtml}</div>
          </section>
        </main>
      </body>
    </html>`;
}

function demoCss() {
  return `
    html, body {
      width: 1280px;
      min-height: 800px;
      margin: 0;
      background: #f8f9fa;
      background:
        linear-gradient(180deg, #ffffff 0, #f6f8fb 180px, #f8f9fa 100%),
        #f8f9fa;
      color: #202124;
      font-family: Arial, Helvetica, sans-serif;
      letter-spacing: 0;
    }

    .demo-header {
      height: 72px;
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 0 28px;
      background: #fff;
      border-bottom: 1px solid #e8eaed;
      box-shadow: 0 1px 12px rgba(60, 64, 67, 0.08);
      box-sizing: border-box;
    }

    .demo-menu {
      color: #5f6368;
      font-size: 28px;
      line-height: 1;
    }

    .demo-logo {
      width: 178px;
      color: #5f6368;
      font-size: 25px;
      white-space: nowrap;
    }

    .demo-logo span {
      color: #4285f4;
      font-weight: 700;
    }

    .demo-logo strong {
      color: #5f6368;
      font-weight: 500;
    }

    .demo-search {
      width: 540px;
      height: 46px;
      display: flex;
      align-items: center;
      padding: 0 18px;
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 4px 0 0 4px;
      box-sizing: border-box;
      color: #111;
      font-size: 22px;
    }

    .demo-search-button {
      width: 58px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: -18px;
      background: #4285f4;
      border-radius: 0 4px 4px 0;
      color: #fff;
      font-size: 28px;
    }

    .demo-avatar {
      width: 40px;
      height: 40px;
      margin-left: auto;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 35%, #2d6cdf 0 18%, transparent 19%),
        radial-gradient(circle at 50% 70%, #2d6cdf 0 24%, transparent 25%),
        #d7e3fd;
    }

    .demo-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 34px;
      padding: 26px 32px;
      box-sizing: border-box;
    }

    .demo-sidebar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #3c4043;
      font-size: 16px;
    }

    .demo-sidebar a,
    .demo-sidebar label {
      color: #3c4043;
      text-decoration: none;
    }

    .demo-sidebar .active {
      color: #d93025;
    }

    .demo-sidebar hr {
      width: 100%;
      border: 0;
      border-top: 1px solid #e8eaed;
    }

    .demo-results {
      max-width: 720px;
    }

    .demo-count {
      margin-bottom: 26px;
      color: #80868b;
      font-size: 15px;
    }

    .gs_r {
      margin: 0 0 26px;
      background: transparent;
      padding: 4px 0 2px;
    }

    .gs_rt {
      margin: 0 0 4px;
      color: #1a0dab;
      font-size: 21px;
      font-weight: 400;
      line-height: 1.22;
    }

    .gs_rt .rank-source,
    .gs_a .rank-source {
      margin-left: 8px;
      vertical-align: 2px;
    }

    .gs_rt a {
      color: #1a0dab;
      text-decoration: none;
    }

    .gs_a {
      margin-bottom: 5px;
      color: #006621;
      font-size: 15px;
      line-height: 1.3;
    }

    .gs_rs {
      max-width: 700px;
      color: #3c4043;
      font-size: 15px;
      line-height: 1.35;
    }

    .gs_fl {
      display: flex;
      gap: 16px;
      margin-top: 7px;
      color: #1a0dab;
      font-size: 14px;
    }

    .gs_fl a {
      color: #1a0dab;
      text-decoration: none;
    }

    .ccf-filter {
      top: 92px;
      right: 28px;
    }
  `;
}

function promoHtml({ wide }) {
  const logo = readBase64("onlyccfa_logo_origin.png");
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          html, body {
            width: ${wide ? 1400 : 440}px;
            height: ${wide ? 560 : 280}px;
            margin: 0;
            background: #f8f9fa;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            letter-spacing: 0;
          }

          body {
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: ${wide ? "58px 86px" : "24px 28px"};
            overflow: hidden;
          }

          .promo {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: ${wide ? "310px 1fr" : "118px 1fr"};
            align-items: center;
            gap: ${wide ? "48px" : "18px"};
          }

          img {
            width: ${wide ? "260px" : "106px"};
            height: ${wide ? "260px" : "106px"};
            object-fit: contain;
          }

          h1 {
            margin: 0;
            color: #0b2f6b;
            font-size: ${wide ? "88px" : "36px"};
            line-height: 1;
            font-weight: 800;
          }

          p {
            max-width: ${wide ? "830px" : "260px"};
            margin: ${wide ? "24px 0 0" : "12px 0 0"};
            color: #344054;
            font-size: ${wide ? "32px" : "15px"};
            line-height: 1.25;
          }

          .tag {
            display: inline-flex;
            align-items: center;
            margin-top: ${wide ? "34px" : "15px"};
            padding: ${wide ? "12px 22px" : "6px 10px"};
            border-radius: 6px;
            background: #e15f37;
            color: #fff;
            font-size: ${wide ? "28px" : "13px"};
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <main class="promo">
          <img src="data:image/png;base64,${logo}" alt="">
          <section>
            <h1>OnlyCCFA</h1>
            <p>Deep-filter Google Scholar, then export clean BibTeX/Zotero-ready papers.</p>
            <div class="tag">Deep Scholar Filter</div>
          </section>
        </main>
      </body>
    </html>`;
}

function readPngInfo(filePath) {
  const data = fs.readFileSync(filePath);
  const signature = data.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`${filePath} is not a PNG file.`);
  }

  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data.readUInt8(25),
  };
}

function assertImage(fileName, width, height) {
  const filePath = path.join(outputDir, fileName);
  const info = readPngInfo(filePath);
  if (info.width !== width || info.height !== height) {
    throw new Error(
      `${fileName} must be ${width}x${height}, got ${info.width}x${info.height}.`,
    );
  }

  if (info.colorType !== 2) {
    throw new Error(
      `${fileName} must be 24-bit RGB PNG, got color type ${info.colorType}.`,
    );
  }
}

async function loadScholarDemo(page, scenario) {
  await page.unroute("https://scholar.google.com/scholar?*").catch(() => {});
  await page.route("https://scholar.google.com/scholar?*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: scholarFixture(scenario),
    });
  });

  await page.goto(
    `https://scholar.google.com/scholar?q=${encodeURIComponent(scenario.query)}`,
  );
  await page.addStyleTag({ content: readAsset("css/style.css") });
  await page.addStyleTag({ content: readAsset("css/filter.css") });
  await page.addStyleTag({ content: demoCss() });
  await page.addScriptTag({ content: readAsset("js/i18n.js") });
  await page.addScriptTag({ content: readAsset("js/filter.js") });
  await page.evaluate(() => filter.init());
  await page.waitForTimeout(100);
}

async function setFilterState(page, { rank, hideUnmatched }) {
  await page.evaluate(
    ({ rank, hideUnmatched }) => {
      filter.currentFilter = rank;
      filter.settings.defaultFilter = rank;
      filter.settings.hideUnranked = hideUnmatched;
      filter.siteConfig.hideUnranked = hideUnmatched;

      const defaultSelect = document.querySelector(
        '[data-setting="defaultFilter"]',
      );
      const hideCheckbox = document.querySelector(
        '[data-setting="hideUnranked"]',
      );
      if (defaultSelect) {
        defaultSelect.value = rank;
      }
      if (hideCheckbox) {
        hideCheckbox.checked = hideUnmatched;
      }

      filter.refreshActiveButton();
      filter.applyFilter();
    },
    { rank, hideUnmatched },
  );
  await page.waitForTimeout(100);
}

async function setPanelState(page, state) {
  await page.evaluate((state) => {
    if (state.signals) {
      filter.settings.selectedSignals = state.signals;
      document.querySelectorAll("[data-signal]").forEach((input) => {
        input.checked = state.signals.includes(input.dataset.signal);
      });
    }
    if (state.signalMode) {
      filter.settings.signalMode = state.signalMode;
      const mode = document.querySelector('[data-setting="signalMode"]');
      if (mode) mode.value = state.signalMode;
    }
    if (state.deepTargetCount) {
      filter.settings.deepTargetCount = state.deepTargetCount;
      const count = document.querySelector('[data-setting="deepTargetCount"]');
      if (count) count.value = String(state.deepTargetCount);
    }
    if (state.deepStatus) {
      const status = document.querySelector(".ccf-filter-deep-status");
      if (status) status.textContent = state.deepStatus;
    }
    if (state.exportStatus) {
      const status = document.querySelector(".ccf-filter-export-status");
      if (status) status.textContent = state.exportStatus;
    }
    if (state.zoteroCategory) {
      const category = document.querySelector('[data-setting="zoteroCategory"]');
      if (category) category.value = state.zoteroCategory;
    }
    if (state.selectedFirst) {
      document
        .querySelectorAll(".onlyccfa-select-result")
        .forEach((input, index) => {
          input.checked = index < state.selectedFirst;
        });
    }
    filter.applyFilter();
  }, state);
  await page.waitForTimeout(100);
}

async function addFeatureCallout(page, { title, body, bullets, tone = "blue" }) {
  await page.addStyleTag({
    content: `
      .demo-feature-callout {
        position: fixed;
        left: 318px;
        bottom: 28px;
        z-index: 20;
        width: 545px;
        box-sizing: border-box;
        padding: 18px 20px;
        border: 1px solid #d0d7de;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
      }

      .demo-feature-callout h2 {
        margin: 0 0 8px;
        color: ${tone === "orange" ? "#9a3412" : "#0b2f6b"};
        font-size: 25px;
        line-height: 1.15;
      }

      .demo-feature-callout p {
        margin: 0 0 12px;
        color: #344054;
        font-size: 15px;
        line-height: 1.45;
      }

      .demo-feature-callout ul {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 12px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .demo-feature-callout li {
        min-height: 28px;
        display: flex;
        align-items: center;
        padding: 6px 9px;
        border-radius: 6px;
        background: ${tone === "orange" ? "#fff7ed" : "#eff6ff"};
        color: ${tone === "orange" ? "#7c2d12" : "#1e3a8a"};
        font-size: 14px;
        font-weight: 700;
      }
    `,
  });

  const list = bullets
    .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
    .join("");
  await page.evaluate(
    ({ title, body, list }) => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<section class="demo-feature-callout">
          <h2>${title}</h2>
          <p>${body}</p>
          <ul>${list}</ul>
        </section>`,
      );
    },
    {
      title: escapeHtml(title),
      body: escapeHtml(body),
      list,
    },
  );
  await page.waitForTimeout(100);
}

async function addBibtexPreview(page) {
  const bibtex = `@inproceedings{qin2022geometric,
  title = {Geometric Transformer for Fast and Robust Point Cloud Registration},
  author = {Qin, Zheng and Yu, Hao and Wang, Changjian and Guo, Yulan and Peng, Yuxing and Xu, Kai},
  booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)},
  month = {June},
  pages = {11143--11152},
  year = {2022},
  doi = {10.1109/CVPR52688.2022.01086}
}`;

  await page.addStyleTag({
    content: `
      .demo-bibtex-preview {
        position: fixed;
        left: 314px;
        bottom: 26px;
        z-index: 20;
        width: 568px;
        box-sizing: border-box;
        padding: 18px 20px;
        border: 1px solid #c7d2fe;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
      }

      .demo-bibtex-preview h2 {
        margin: 0 0 8px;
        color: #0b2f6b;
        font-size: 24px;
      }

      .demo-bibtex-preview p {
        margin: 0 0 12px;
        color: #475467;
        font-size: 14px;
      }

      .demo-bibtex-preview pre {
        margin: 0;
        padding: 14px;
        border-radius: 6px;
        background: #0f172a;
        color: #e5e7eb;
        font-family: Consolas, "Roboto Mono", monospace;
        font-size: 13px;
        line-height: 1.4;
        white-space: pre-wrap;
      }
    `,
  });

  await page.evaluate((bibtex) => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<section class="demo-bibtex-preview">
        <h2>多行 BibTeX，适合论文写作</h2>
        <p>并发获取、结果缓存、优先 Google Scholar 原生引用；导出的 .bib 更容易审阅和维护。</p>
        <pre>${bibtex}</pre>
      </section>`,
    );
  }, escapeHtml(bibtex));
  await page.waitForTimeout(100);
}

async function addZoteroPreview(page) {
  await page.addStyleTag({
    content: `
      .demo-zotero-preview {
        position: fixed;
        left: 318px;
        bottom: 30px;
        z-index: 20;
        width: 540px;
        box-sizing: border-box;
        padding: 18px 20px;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
      }

      .demo-zotero-preview h2 {
        margin: 0 0 8px;
        color: #166534;
        font-size: 24px;
      }

      .demo-zotero-preview p {
        margin: 0 0 12px;
        color: #475467;
        font-size: 14px;
        line-height: 1.45;
      }

      .demo-zotero-preview .demo-zotero-row {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        gap: 9px;
        align-items: center;
        padding: 8px 0;
        border-top: 1px solid #eef2f7;
        color: #111827;
        font-size: 14px;
      }

      .demo-zotero-preview .demo-zotero-row strong {
        color: #166534;
        font-size: 13px;
      }

      .demo-zotero-preview .demo-check {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: #16a34a;
      }
    `,
  });

  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<section class="demo-zotero-preview">
        <h2>Zotero Connector 只看到筛选结果</h2>
        <p>OnlyCCFA 会同步页面结果列表，Zotero 导入时不再抓取原始 ALL 结果；标题保持干净，不附带 CCF/JCR/SCI 标签。</p>
        <div class="demo-zotero-row"><span class="demo-check"></span><span>Embodied agents that plan, perceive, and act in open worlds</span><strong>clean title</strong></div>
        <div class="demo-zotero-row"><span class="demo-check"></span><span>Vision-language-action models for general robot policies</span><strong>filtered</strong></div>
      </section>`,
    );
  });
  await page.waitForTimeout(100);
}

async function screenshot(page, fileName, width, height) {
  await page.setViewportSize({ width, height });
  await page.screenshot({
    path: path.join(outputDir, fileName),
    type: "png",
    fullPage: false,
    omitBackground: false,
  });
  assertImage(fileName, width, height);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({
    executablePath: findChrome(),
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });
    await loadScholarDemo(page, scenarios.chineseComputing);

    await setFilterState(page, { rank: "ALL", hideUnmatched: false });
    await setPanelState(page, {
      signals: ["cnCore", "swjtuCcfChinese", "casAcademician"],
      signalMode: "any",
      deepTargetCount: 60,
      deepStatus: "中文核心与作者身份标签已加入结果池。",
      selectedFirst: 2,
    });
    await screenshot(page, screenshotFiles.ccfaDefault, 1280, 800);

    await loadScholarDemo(page, scenarios.robotLearning);
    await setFilterState(page, { rank: "ALL", hideUnmatched: false });
    await setPanelState(page, {
      signals: ["roboticsTop", "jcrQ1"],
      signalMode: "any",
      deepTargetCount: 80,
      deepStatus: "已新增 68 条，已扫描 80/80。",
    });
    await screenshot(page, screenshotFiles.ccfaUnmatched, 1280, 800);

    await loadScholarDemo(page, scenarios.communication);
    await setFilterState(page, { rank: "ALL", hideUnmatched: false });
    await setPanelState(page, {
      signals: ["commTop", "jcrQ1"],
      signalMode: "all",
      selectedFirst: 3,
      zoteroCategory: "6G semantic communication",
      exportStatus: "3 BibTeX · Zotero-ready",
    });
    await screenshot(page, screenshotFiles.ccfb, 1280, 800);

    await loadScholarDemo(page, scenarios.engineering);
    await setFilterState(page, { rank: "ALL", hideUnmatched: false });
    await setPanelState(page, {
      signals: ["eeTop", "controlTop", "mechTop"],
      signalMode: "any",
      deepTargetCount: 100,
      deepStatus: "本批 100 条完成；继续下一批将从 start=120 开始。",
      exportStatus: "结果池可导出",
    });
    await screenshot(page, screenshotFiles.ccfc, 1280, 800);

    await loadScholarDemo(page, scenarios.robotLearning);
    await setFilterState(page, { rank: "ALL", hideUnmatched: false });
    await setPanelState(page, {
      signals: ["roboticsTop"],
      signalMode: "any",
      deepTargetCount: 80,
      deepStatus: "机器人方向 TOP venue 已加入结果池。",
    });
    await addFeatureCallout(page, {
      title: "不只看 CCF：领域强会也能筛",
      body:
        "CoRL、RSS、ICRA、IROS、TRO、IJRR、RA-L 等机器人方向高声誉 venue 可单独标注和筛选。",
      bullets: ["机器人方向TOP", "通信方向TOP", "电气方向TOP", "控制方向TOP"],
      tone: "orange",
    });
    await screenshot(page, screenshotFiles.fieldTop, 1280, 800);

    await loadScholarDemo(page, scenarios.pointCloud);
    await setFilterState(page, { rank: "ALL", hideUnmatched: false });
    await setPanelState(page, {
      signals: ["jcrQ1", "roboticsTop"],
      signalMode: "any",
      selectedFirst: 3,
      exportStatus: "3 BibTeX · cached · multi-line",
    });
    await addBibtexPreview(page);
    await screenshot(page, screenshotFiles.cleanBibtex, 1280, 800);

    await loadScholarDemo(page, scenarios.embodiedAI);
    await setFilterState(page, { rank: "A", hideUnmatched: true });
    await setPanelState(page, {
      selectedFirst: 2,
      zoteroCategory: "Embodied AI reading list",
      exportStatus: "Zotero sees 2 filtered papers",
    });
    await addZoteroPreview(page);
    await screenshot(page, screenshotFiles.zoteroConnector, 1280, 800);

    const promoPage = await browser.newPage({
      viewport: { width: 440, height: 280 },
    });
    await promoPage.setContent(promoHtml({ wide: false }));
    await screenshot(promoPage, promoFiles.small, 440, 280);

    await promoPage.setViewportSize({ width: 1400, height: 560 });
    await promoPage.setContent(promoHtml({ wide: true }));
    await screenshot(promoPage, promoFiles.marquee, 1400, 560);
  } finally {
    await browser.close();
  }

  Object.values({ ...screenshotFiles, ...promoFiles }).forEach((fileName) => {
    console.log(`Generated img/${fileName}`);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
