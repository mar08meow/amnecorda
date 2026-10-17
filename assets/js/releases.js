/* AMNE CORDA — keep project download buttons on the latest GitHub Release. */
(() => {
  "use strict";

  const groups = new Map();
  document.querySelectorAll("[data-release-repo]").forEach((element) => {
    const repo = element.dataset.releaseRepo;
    if (!repo) return;
    if (!groups.has(repo)) groups.set(repo, []);
    groups.get(repo).push(element);
  });
  if (!groups.size) return;

  const patterns = {
    portable: /portable\.exe$/i,
    setup: /setup\.exe$/i,
    apk: /\.apk$/i,
  };

  const pickAsset = (assets, kind) => {
    const pattern = patterns[kind];
    return pattern
      ? assets.find((asset) => pattern.test(asset.name || ""))
      : null;
  };

  const formatSize = (bytes) => {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const applyRelease = (elements, release) => {
    if (!release || !release.tag_name || !Array.isArray(release.assets)) {
      return;
    }

    elements.forEach((element) => {
      if (element.hasAttribute("data-release-version")) {
        element.textContent = release.tag_name;
      }
      if (element.hasAttribute("data-release-notes")) {
        element.href = release.html_url;
      }

      const kind = element.getAttribute("data-release-download");
      if (!kind) return;
      const asset = pickAsset(release.assets, kind);
      if (!asset) return;
      element.href = asset.browser_download_url;
      element.title = `${asset.name} · ${formatSize(asset.size)}`;
    });
  };

  groups.forEach((elements, repo) => {
    fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        return response.json();
      })
      .then((release) => applyRelease(elements, release))
      .catch(() => {
        /* Keep the static fallback links if GitHub is unavailable. */
      });
  });
})();
