const onlyccfaI18n = {
  messages: {
    zh: {
      title: "OnlyCCFA",
      subtitle: "Google 学术深度筛选器",
      language: "EN",
      ccfSection: "CCF 筛选",
      sourceSection: "开放标签",
      sourceMode: "标签逻辑",
      any: "任一匹配",
      all: "同时满足",
      defaultFilter: "默认",
      hideUnranked: "隐藏未识别",
      deepSection: "深度筛选",
      batchSize: "每批数量",
      deepSearch: "开始 / 继续",
      clearDeep: "清空结果池",
      exportSection: "导出",
      exportSelected: "导出勾选",
      exportVisible: "导出可见",
      exportPool: "导出结果池",
      selected: "已选",
      selectResult: "选择",
      copyBibtex: "复制 BibTeX",
      copied: "已复制 BibTeX。",
      matchedVenue: "完整 venue",
      bibtexFetching: "正在获取可靠 BibTeX...",
      bibtexDone: "已导出 {count} 条 BibTeX，失败 {failed} 条。",
      bibtexUnavailable:
        "无法从 Google 学术或 Crossref 获取可靠 BibTeX。为避免不准确引用，已停止导出。",
      noResults: "没有可导出的论文。",
      noScholarResults: "未找到 Google 学术结果。",
      loading: "正在加载更多 Google 学术结果...",
      deepProgress: "已新增 {appended} 条，已扫描 {scanned}/{target}。",
      deepDone:
        "深度筛选已扫描 {scanned} 条，新增 {appended} 条。下一次点击会继续下一批。",
      deepStopped: "深度筛选停止：{message}。",
      deepCleared: "已清空深筛结果池。",
      stats: "{shown}/{total} 显示 | {hidden} 隐藏 | {unmatched} 未识别",
    },
    en: {
      title: "OnlyCCFA",
      subtitle: "Google Scholar deep filter",
      language: "中文",
      ccfSection: "CCF Filter",
      sourceSection: "Open Badges",
      sourceMode: "Badge Logic",
      any: "Any",
      all: "All",
      defaultFilter: "Default",
      hideUnranked: "Hide unmatched",
      deepSection: "Deep Filter",
      batchSize: "Batch size",
      deepSearch: "Start / Continue",
      clearDeep: "Clear pool",
      exportSection: "Export",
      exportSelected: "Selected",
      exportVisible: "Visible",
      exportPool: "Pool",
      selected: "Selected",
      selectResult: "Select",
      copyBibtex: "Copy BibTeX",
      copied: "BibTeX copied.",
      matchedVenue: "Matched venue",
      bibtexFetching: "Fetching reliable BibTeX...",
      bibtexDone: "Exported {count} BibTeX entries, {failed} failed.",
      bibtexUnavailable:
        "Could not fetch reliable BibTeX from Google Scholar or Crossref. Export stopped to avoid inaccurate citations.",
      noResults: "No papers to export.",
      noScholarResults: "No Scholar results found.",
      loading: "Loading more Google Scholar results...",
      deepProgress: "Added {appended}, scanned {scanned}/{target}.",
      deepDone:
        "Scanned {scanned} results, added {appended}. Click again for the next batch.",
      deepStopped: "Deep filter stopped: {message}.",
      deepCleared: "Deep result pool cleared.",
      stats: "{shown}/{total} shown | {hidden} hidden | {unmatched} unmatched",
    },
  },

  t(language, key, params = {}) {
    const dict = this.messages[language] || this.messages.zh;
    let text = dict[key] || this.messages.zh[key] || key;
    Object.keys(params).forEach((name) => {
      text = text.replace(`{${name}}`, String(params[name]));
    });
    return text;
  },
};
