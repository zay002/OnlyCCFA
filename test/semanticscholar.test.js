const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = ["js/bibtex.js", "js/scholar.js", "js/semanticscholar.js"].map(
  (path) => fs.readFileSync(path, "utf8"),
);
const { scholar, semanticscholar } = vm.runInNewContext(
  `${source.join("\n")}; ({ scholar, semanticscholar });`,
  {
    console,
    URL,
    URLSearchParams,
  },
);

assert.strictEqual(
  semanticscholar.normalizeVenueText(
    "Computer Vision and Pattern Recognition (CVPR) 2024",
  ),
  "CVPR",
);

assert.strictEqual(
  semanticscholar.normalizeVenueText(
    "IEEE International Conference on Robotics and Automation '24",
  ),
  "IEEE International Conference on Robotics and Automation",
);

function fakeNode(textContent, href = "") {
  return {
    textContent,
    href,
    getAttribute(name) {
      if (name === "href") {
        return href;
      }
      return "";
    },
  };
}

function fakeSemanticEntry() {
  const nodes = {
    title: fakeNode(
      "Segment Anything",
      "https://www.semanticscholar.org/paper/abc",
    ),
    venue: fakeNode("International Conference on Computer Vision (ICCV)"),
    year: fakeNode("2023"),
    snippet: fakeNode("A foundation model for promptable segmentation."),
    pdf: fakeNode("PDF", "https://arxiv.org/pdf/2304.02643.pdf"),
  };
  const authors = [fakeNode("Alexander Kirillov"), fakeNode("Eric Mintun")];

  return {
    querySelector(selector) {
      if (/venue/i.test(selector)) {
        return nodes.venue;
      }
      if (/year/i.test(selector)) {
        return nodes.year;
      }
      if (/title/i.test(selector) && /a/.test(selector)) {
        return nodes.title;
      }
      if (/abstract|snippet|tldr/i.test(selector)) {
        return nodes.snippet;
      }
      if (/pdf/i.test(selector)) {
        return nodes.pdf;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (/author/i.test(selector)) {
        return authors;
      }
      if (selector === "a") {
        return [nodes.title, nodes.pdf];
      }
      return [];
    },
  };
}

const resultData = semanticscholar.getResultData(fakeSemanticEntry());
assert.strictEqual(resultData.title, "Segment Anything");
assert.strictEqual(resultData.year, "2023");
assert.strictEqual(resultData.venue, "ICCV");
assert.strictEqual(
  JSON.stringify(resultData.authors),
  JSON.stringify(["Alexander Kirillov", "Eric Mintun"]),
);
assert.strictEqual(resultData.pdfUrl, "https://arxiv.org/pdf/2304.02643.pdf");

async function runAsyncTests() {
  let googleFetchCount = 0;
  let crossrefTitle = "";
  scholar.fetchGoogleScholarBibtex = async function () {
    googleFetchCount += 1;
    return "@article{google, title={Google Scholar}}";
  };
  scholar.fetchCrossrefBibtexByTitle = async function (title) {
    crossrefTitle = title;
    return "@inproceedings{kirillov2023segment, title={Segment Anything}}";
  };
  scholar.fetchArxivBibtexById = async function () {
    return "";
  };

  const bibtex =
    await semanticscholar.getReliableBibtexForEntry(fakeSemanticEntry());
  assert.ok(bibtex.includes("@inproceedings{kirillov2023segment"));
  assert.strictEqual(crossrefTitle, "Segment Anything");
  assert.strictEqual(googleFetchCount, 0);
}

runAsyncTests().catch((error) => {
  setTimeout(() => {
    throw error;
  }, 0);
});
