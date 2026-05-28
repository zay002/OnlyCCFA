chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type !== "onlyccfaFetchText" || !request.url) {
    return false;
  }

  fetch(request.url, { credentials: "include" })
    .then(async (response) => {
      const text = await response.text();
      sendResponse({
        ok: response.ok,
        status: response.status,
        text,
      });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        status: 0,
        error: error.message || "Fetch failed",
      });
    });

  return true;
});
