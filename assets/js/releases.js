/* AMNE CORDA — keep the AppPantry download buttons on the latest Release. */
(() => {
  "use strict";

  const buttons = Array.from(
    document.querySelectorAll("[data-appantry-download]")
  );
  if (!buttons.length) return;

  const versionLabels = document.querySelectorAll("[data-appantry-version]");
  const releaseLinks = document.querySelectorAll("[data-appantry-release]");
  const endpoint =
    "https://api.github.com/repos/mar08meow/AppPantry/releases/latest";

  const pickAsset = (assets, kind) => {
    const pattern = kind === "portable" ? /portable\.exe$/i : /setup\.exe$/i;
    return assets.find((asset) => pattern.test(asset.name || ""));
  };

  fetch(endpoint, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      return response.json();
    })
    .then((release) => {
      if (!release || !release.tag_name || !Array.isArray(release.assets)) {
        return;
      }

      versionLabels.forEach((label) => {
        label.textContent = release.tag_name;
      });

      releaseLinks.forEach((link) => {
        link.href = release.html_url;
      });

      buttons.forEach((button) => {
        const asset = pickAsset(
          release.assets,
          button.dataset.appantryDownload
        );
        if (!asset) return;
        button.href = asset.browser_download_url;
        button.title = `${asset.name} · ${(asset.size / 1024 / 1024).toFixed(
          1
        )} MB`;
      });
    })
    .catch(() => {
      /* Keep the static v1.0.0 links as a safe fallback. */
    });
})();
