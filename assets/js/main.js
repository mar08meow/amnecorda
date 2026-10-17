/* AMNE CORDA — small, dependency-free enhancements */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const rootPrefix = location.pathname.includes("/posts/") ? "../" : "";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char];
    });

  /* Current year ---------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* Local time in Asia/Shanghai ------------------------------------------- */
  const clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => {
      const value = fmt.format(new Date()) + " CST";
      clocks.forEach((el) => {
        el.textContent = value;
      });
    };
    tick();
    window.setInterval(tick, 30000);
  }

  /* Sticky header state ---------------------------------------------------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile menu ------------------------------------------------------------ */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  const closeBtn = document.querySelector(".menu-close");

  const setMenu = (open) => {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) {
      closeBtn?.focus();
    } else if (document.activeElement === closeBtn) {
      toggle.focus();
    }
  };

  toggle?.addEventListener("click", () => setMenu(true));
  closeBtn?.addEventListener("click", () => setMenu(false));
  menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  /* Reveal on scroll ------------------------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-in"));
  }

  /* Archive filtering ------------------------------------------------------ */
  const filters = Array.from(document.querySelectorAll("[data-filter]"));

  const applyArchiveFilter = (value) => {
    const rows = Array.from(document.querySelectorAll("[data-category]"));
    rows.forEach((row) => {
      row.hidden = !(value === "all" || row.dataset.category === value);
    });

    document.querySelectorAll("[data-year-group]").forEach((group) => {
      const hasVisible = Array.from(
        group.querySelectorAll("[data-category]")
      ).some((row) => !row.hidden);
      group.hidden = !hasVisible;
    });
  };

  if (filters.length) {
    filters.forEach((button) => {
      button.addEventListener("click", () => {
        filters.forEach((item) => {
          item.classList.toggle("is-active", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
        applyArchiveFilter(button.dataset.filter);
      });
    });
  }

  /* Posts data ------------------------------------------------------------- */
  const renderFeatured = (posts) => {
    const list = document.querySelector("[data-featured-list]");
    if (!list) return;

    const featured = posts.filter((post) => post.featured).slice(0, 3);
    const items = featured.length ? featured : posts.slice(0, 3);
    if (!items.length) return;

    list.innerHTML = items
      .map(
        (post) => `<li>
          <a href="posts/${encodeURIComponent(post.slug)}.html">${escapeHtml(post.title)}</a>
          <span class="mini-meta">${escapeHtml(
            post.categoryLabel || post.category
          )} · ${escapeHtml(String(post.date || "").slice(0, 4))}</span>
        </li>`
      )
      .join("");
  };

  const renderArchive = (posts) => {
    const container = document.querySelector("[data-archive-root]");
    if (!container) return;

    const groups = new Map();
    posts.forEach((post) => {
      const year = String(post.date || "").slice(0, 4) || "—";
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(post);
    });

    let index = 0;
    container.innerHTML = Array.from(groups.entries())
      .map(
        ([year, items]) => `<div class="archive-group" data-year-group>
          <h2 class="year-label">${escapeHtml(year)}</h2>
          ${items
            .map((post) => {
              index += 1;
              const shortDate = String(post.date || "")
                .slice(5)
                .replace("-", ".");
              return `<a class="archive-row" href="posts/${encodeURIComponent(
                post.slug
              )}.html" data-category="${escapeHtml(post.category)}">
                <span class="archive-no">${String(index).padStart(2, "0")}</span>
                <span class="archive-title">${escapeHtml(post.title)}</span>
                <span class="archive-cat">${escapeHtml(
                  post.categoryLabel || post.category
                )}</span>
                <span class="archive-date">${escapeHtml(shortDate)}</span>
                <span class="archive-arrow" aria-hidden="true">↗</span>
              </a>`;
            })
            .join("")}
        </div>`
      )
      .join("");
  };

  const updateNextPost = (posts) => {
    const link = document.querySelector(".next-post");
    if (!link) return;

    const slug =
      document.body.dataset.slug ||
      location.pathname.split("/").pop().replace(/\.html$/, "");
    const index = posts.findIndex((post) => post.slug === slug);
    if (index < 0) return;

    const next = posts[index + 1] || (posts.length > 1 ? posts[0] : null);
    if (!next) {
      link.hidden = true;
      return;
    }

    link.href = `${rootPrefix}posts/${encodeURIComponent(next.slug)}.html`;
    const title = link.querySelector(".next-title");
    if (title) {
      title.innerHTML = `${escapeHtml(
        next.title
      )} <span class="next-arrow" aria-hidden="true">↗</span>`;
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`${rootPrefix}data/posts.json`, {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (error) {
      return null;
    }
  };

  loadPosts().then((posts) => {
    if (!posts) return;
    renderFeatured(posts);
    renderArchive(posts);
    updateNextPost(posts);

    const count = document.querySelector("[data-post-count]");
    if (count) {
      const years = posts
        .map((post) => String(post.date || "").slice(0, 4))
        .filter(Boolean)
        .sort();
      const range = years.length
        ? years[0] === years[years.length - 1]
          ? years[0]
          : `${years[0]}—${years[years.length - 1]}`
        : "";
      count.textContent = `${String(posts.length).padStart(2, "0")} ENTRIES${
        range ? " / " + range : ""
      }`;
    }

    const activeFilter = document.querySelector(".filter.is-active");
    applyArchiveFilter(activeFilter?.dataset.filter || "all");
  });

  /* Reading progress ------------------------------------------------------- */
  const bar = document.querySelector("[data-progress]");
  if (bar) {
    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      const ratio = max > 0 ? root.scrollTop / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, ratio)) + ")";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* TOC active state ------------------------------------------------------- */
  const tocLinks = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
  if (tocLinks.length && "IntersectionObserver" in window) {
    const targets = tocLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const tocObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          tocLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-18% 0px -70% 0px", threshold: 0 }
    );

    targets.forEach((target) => tocObserver.observe(target));
  }

  /* Copy email ------------------------------------------------------------- */
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
      } catch (error) {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }

      if (!button.dataset.label) {
        button.dataset.label = button.textContent;
      }
      const original = button.dataset.label;
      button.textContent = "已复制 ✓";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1800);
    });
  });

  /* Newsletter (demo only) ------------------------------------------------- */
  const form = document.querySelector(".subscribe-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input");
      const note = form.parentElement?.querySelector(".form-note");
      if (!input || !input.value.trim() || !note) return;

      note.textContent = "已记下。信会在某个安静的下午寄出。";
      form.reset();
    });
  }
  /* Site search ------------------------------------------------------------- */
  const navRight = document.querySelector(".nav-right");
  let searchPosts = null;

  if (navRight) {
    const searchButton = document.createElement("button");
    searchButton.type = "button";
    searchButton.className = "nav-search";
    searchButton.setAttribute("aria-label", "搜索文章");
    searchButton.innerHTML = 'Search <kbd>/</kbd>';
    navRight.insertBefore(searchButton, navRight.firstChild);

    const rssButton = document.createElement("a");
    rssButton.className = "nav-rss";
    rssButton.href = `${rootPrefix}feed.xml`;
    rssButton.setAttribute("aria-label", "RSS 订阅");
    rssButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="19" r="2.2" fill="currentColor"></circle><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg><span class="nav-rss-label">RSS</span>`;
    navRight.insertBefore(rssButton, searchButton.nextSibling);

    const dialog = document.createElement("dialog");
    dialog.className = "search-dialog";
    dialog.innerHTML = `
      <div class="search-panel">
        <div class="search-head">
          <input class="search-input" type="search" placeholder="搜索文章…" autocomplete="off" aria-label="搜索文章">
          <button class="search-close" type="button" aria-label="关闭搜索">Esc</button>
        </div>
        <div class="search-results" role="list"></div>
        <p class="search-hint">支持标题、摘要与分类 · 按 / 打开</p>
      </div>`;
    document.body.appendChild(dialog);

    const input = dialog.querySelector(".search-input");
    const results = dialog.querySelector(".search-results");

    const renderSearch = (query) => {
      const q = String(query || "").trim().toLowerCase();
      if (!searchPosts) {
        results.innerHTML = '<p class="search-empty">正在读取文章…</p>';
        return;
      }

      const matched = searchPosts
        .filter((post) => {
          if (!q) return true;
          return [
            post.title,
            post.excerpt,
            post.categoryLabel,
            post.category,
            post.date,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        })
        .slice(0, 8);

      if (!matched.length) {
        results.innerHTML = '<p class="search-empty">没有找到相关文章。</p>';
        return;
      }

      results.innerHTML = matched
        .map(
          (post) => `<a class="search-result" href="${rootPrefix}posts/${encodeURIComponent(
            post.slug
          )}.html" role="listitem">
            <span class="search-result-title">${escapeHtml(post.title)}</span>
            <span class="search-result-meta">${escapeHtml(
              post.categoryLabel || post.category
            )} · ${escapeHtml(post.date)}</span>
            <span class="search-result-excerpt">${escapeHtml(
              post.excerpt
            )}</span>
          </a>`
        )
        .join("");
    };

    const openSearch = async () => {
      if (dialog.open) return;
      dialog.showModal();
      input.value = "";
      input.focus();
      renderSearch("");
      if (!searchPosts) {
        searchPosts = await loadPosts();
        renderSearch("");
      }
    };

    searchButton.addEventListener("click", openSearch);
    dialog
      .querySelector(".search-close")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    input.addEventListener("input", () => renderSearch(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const first = results.querySelector("a");
      if (first) window.location.href = first.href;
    });
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) return;
      if (
        event.key === "/" ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")
      ) {
        event.preventDefault();
        openSearch();
      }
    });
  }
})();
