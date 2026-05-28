# OnlyCCFA 隐私权政策

# OnlyCCFA Privacy Policy

OnlyCCFA 是一个用于深度筛选 Google 学术结果、显示论文来源等级并导出文献条目的浏览器扩展。本隐私权政策说明扩展会读取哪些页面内容、如何使用这些内容，以及是否会共享数据。

OnlyCCFA is a browser extension that deep-filters Google Scholar results, displays publication-rank badges and exports bibliography items. This Privacy Policy explains what page content the extension reads, how that content is used, and whether any data is shared.

## 收集的信息 / Information processed

OnlyCCFA 会在受支持的网站中读取当前页面上已经显示的论文标题、作者、年份、期刊或会议名称等搜索结果文本。

OnlyCCFA reads paper titles, authors, years, journal names, conference names, result links and rank badges that are already visible on supported search-result pages.

Supported sites include dblp, Google Scholar, Connected Papers, Semantic Scholar and Web of Science.

## 使用方式 / How the information is used

OnlyCCFA 使用这些页面文本在本地匹配 CCF、SCI/JCR、中科院、EI、中文核心和方向 TOP 标签，并根据用户选择筛选 Google 学术结果。用户主动点击深度筛选时，OnlyCCFA 会顺序请求后续 Google 学术结果页，并把结果合并到当前页面的本地结果池。用户主动导出 BibTeX 或导入 Zotero 时，OnlyCCFA 会请求对应 Google 学术结果的引用页面和 BibTeX 链接，以使用 Google 学术提供的原始引用数据。

OnlyCCFA uses this page text locally to match CCF, SCI/JCR, CAS, EI, Chinese core journal and field TOP badges, then filters Google Scholar results according to the user's settings. When the user explicitly starts deep filtering, OnlyCCFA requests later Google Scholar result pages and merges them into a local result pool on the current page. When the user explicitly exports BibTeX or imports to Zotero, OnlyCCFA requests the corresponding Google Scholar citation page and BibTeX link so it can use Google Scholar's native citation data.

## 数据共享 / Data sharing

OnlyCCFA 不收集、出售、出租或上传个人数据到 OnlyCCFA 自有服务器。

OnlyCCFA does not collect, sell, rent or upload personal data to any OnlyCCFA-owned server.

When local page text is not enough to identify a paper source, OnlyCCFA may request the dblp search API with paper title and author keywords to find the publication venue. These requests are used only for CCF rank lookup.

如果用户点击 Zotero 导入，OnlyCCFA 会尝试把用户选择或当前可见的文献条目发送到本机 Zotero Connector 服务（通常为 `127.0.0.1:23119` 或 `localhost:23119`）。这些请求只会发送到用户本机 Zotero 服务；如果本机 Zotero 不可用，OnlyCCFA 会回退为下载 BibTeX 文件。

If the user clicks Zotero import, OnlyCCFA attempts to send selected or visible bibliography items to the local Zotero Connector service, usually `127.0.0.1:23119` or `localhost:23119`. These requests are sent only to the user's local Zotero service. If local Zotero is unavailable, OnlyCCFA falls back to downloading a BibTeX file.

## 存储 / Storage

OnlyCCFA may store your filter preferences, such as the language, default rank, selected source badges, deep-filter batch size and whether unmatched results should be hidden, in the browser's local site storage. These preferences remain on your device.

OnlyCCFA may cache dblp lookup results in the browser's local storage to reduce repeated requests. Cached entries are stored locally in your browser and expire automatically.

## Contact

For privacy questions, please open an issue at:

https://github.com/zay002/OnlyCCFA/issues
