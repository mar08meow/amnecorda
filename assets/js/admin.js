/* AMNE CORDA — admin console
   Cloudflare Access + server-side GitHub token. */
(() => {
  "use strict";

  const OWNER = "mar08meow";
  const REPO = "amnecorda";
  const BRANCH = "main";
  const CATEGORY_DEFAULTS = {
    design: "Design",
    engineering: "Engineering",
    notes: "Notes",
  };

  const state = {
    user: null,
    posts: [],
    filePath: "",
    fileContent: "",
    busy: false,
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

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

  const setStatus = (element, message, type = "", url = "") => {
    if (!element) return;
    element.className = "status" + (type ? " status-" + type : "");
    element.textContent = "";
    if (message) {
      element.appendChild(document.createTextNode(message));
      if (url) element.appendChild(document.createTextNode("\n"));
    }
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = url;
      element.appendChild(link);
    }
  };

  /* --- Admin API --------------------------------------------------------- */

  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let message = `API ${response.status}`;
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch (error) {
        /* keep default message */
      }
      const requestError = new Error(message);
      requestError.status = response.status;
      throw requestError;
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const getFile = async (path) => {
    const data = await api(
      `/api/admin/file?path=${encodeURIComponent(path)}`
    );
    return { content: data.content || "" };
  };

  const commitFiles = async (changes, message) => {
    const data = await api("/api/admin/commit", {
      method: "POST",
      body: JSON.stringify({ message, changes }),
    });
    return {
      html_url: data.commit,
      sha: data.sha,
    };
  };

  /* --- Markdown ---------------------------------------------------------- */

  const safeUrl = (url) => {
    const value = String(url || "").trim();
    if (/^(https?:\/\/|mailto:|\/|#|\.\.?\/)/i.test(value)) return value;
    return "#";
  };

  const inline = (text) => {
    let value = escapeHtml(text);
    value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
    value = value.replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (match, alt, url) => `<img src="${safeUrl(url)}" alt="${alt}">`
    );
    value = value.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (match, label, url) => `<a href="${safeUrl(url)}">${label}</a>`
    );
    value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    value = value.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    return value;
  };

  const plainText = (text) =>
    String(text || "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

  const renderMarkdown = (markdown) => {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const output = [];
    const toc = [];
    let paragraph = [];
    let list = null;
    let quote = [];
    let code = null;
    let h2Count = 0;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      output.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!list) return;
      output.push(
        `<${list.type}>${list.items
          .map((item) => `<li>${inline(item)}</li>`)
          .join("")}</${list.type}>`
      );
      list = null;
    };

    const flushQuote = () => {
      if (!quote.length) return;
      output.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
      quote = [];
    };

    const flushAll = () => {
      flushParagraph();
      flushList();
      flushQuote();
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, "");

      if (code) {
        if (/^```/.test(line.trim())) {
          output.push(
            `<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`
          );
          code = null;
        } else {
          code.lines.push(rawLine);
        }
        continue;
      }

      if (/^```/.test(line.trim())) {
        flushAll();
        code = { lines: [] };
        continue;
      }

      if (!line.trim()) {
        flushAll();
        continue;
      }

      if (/^---+$/.test(line.trim())) {
        flushAll();
        output.push("<hr>");
        continue;
      }

      const heading = line.match(/^(#{2,3})\s+(.+)$/);
      if (heading) {
        flushAll();
        if (heading[1].length === 2) {
          h2Count += 1;
          const id = `s${h2Count}`;
          toc.push({ id, title: plainText(heading[2]) });
          output.push(`<h2 id="${id}">${inline(heading[2])}</h2>`);
        } else {
          output.push(`<h3>${inline(heading[2])}</h3>`);
        }
        continue;
      }

      const quoteLine = line.match(/^>\s?(.*)$/);
      if (quoteLine) {
        flushParagraph();
        flushList();
        quote.push(quoteLine[1]);
        continue;
      }

      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        flushQuote();
        const type = unordered ? "ul" : "ol";
        if (!list || list.type !== type) {
          flushList();
          list = { type, items: [] };
        }
        list.items.push((unordered || ordered)[1]);
        continue;
      }

      flushList();
      flushQuote();
      paragraph.push(line.trim());
    }

    if (code) {
      output.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
    }
    flushAll();

    return { html: output.join("\n"), toc };
  };

  /* --- Article template -------------------------------------------------- */

  const formatDisplayDate = (date) => String(date || "").replace(/-/g, ".");

  const formatArticleDate = (date) => {
    const [year, month] = String(date || "").split("-");
    return `${year || ""} 年 ${Number(month) || 1} 月`;
  };

  const buildSitemap = (posts) => {
    const today = new Date().toISOString().slice(0, 10);
    const urls = [
      ["https://amnecorda.com/", today],
      ["https://amnecorda.com/writing.html", today],
      ["https://amnecorda.com/projects.html", today],
      ["https://amnecorda.com/about.html", today],
      ...posts.map((post) => [
        `https://amnecorda.com/posts/${post.slug}.html`,
        post.date,
      ]),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ([loc, lastmod]) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;
  };

  const buildArticleHtml = (post, rendered, sortedPosts) => {
    const index = sortedPosts.findIndex((item) => item.slug === post.slug);
    const next =
      sortedPosts[index + 1] ||
      (sortedPosts.length > 1 ? sortedPosts[0] : null);

    const tocHtml = rendered.toc.length
      ? `<aside class="toc" aria-label="本文目录">
          <p class="toc-label">Contents</p>
          <ol>
            ${rendered.toc
              .map(
                (item) =>
                  `<li><a href="#${item.id}">${escapeHtml(item.title)}</a></li>`
              )
              .join("")}
          </ol>
          <a class="toc-back" href="../writing.html">← All entries</a>
        </aside>`
      : "";

    const bodyClass = rendered.toc.length
      ? "container article-body"
      : "container article-body article-body--single";

    const nextHtml = next
      ? `<a class="next-post container" href="${encodeURIComponent(
          next.slug
        )}.html">
          <p class="next-label">Next entry</p>
          <h2 class="next-title">${escapeHtml(
            next.title
          )} <span class="next-arrow" aria-hidden="true">↗</span></h2>
        </a>`
      : `<a class="next-post container" href="../writing.html">
          <p class="next-label">All entries</p>
          <h2 class="next-title">返回全部文章 <span class="next-arrow" aria-hidden="true">↗</span></h2>
        </a>`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — AMNE CORDA</title>
  <meta name="description" content="${escapeHtml(post.excerpt)}">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body id="top" data-slug="${escapeHtml(post.slug)}">
  <a class="skip-link" href="#main">跳到正文</a>

  <header class="site-header">
    <div class="container nav">
      <a class="brand" href="../index.html" aria-label="AMNE CORDA 首页">AMNE<br>CORDA<span class="brand-dot" aria-hidden="true"></span></a>
      <nav class="nav-links" aria-label="主导航">
        <a href="../index.html">Home</a>
        <a href="../writing.html" aria-current="page">Writing</a>
        <a href="../projects.html">Projects</a>
        <a href="../about.html">About</a>
      </nav>
      <div class="nav-right">
        <span class="nav-clock" data-clock>--:-- CST</span>
        <a class="nav-mail" href="mailto:hello@amnecorda.com">Say hello <span class="arrow" aria-hidden="true">↗</span></a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="打开菜单">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <div class="progress" data-progress aria-hidden="true"></div>

  <main id="main">
    <article>
      <header class="article-head container">
        <nav class="breadcrumb" aria-label="面包屑">
          <a href="../index.html">Home</a>
          <span class="slash" aria-hidden="true">/</span>
          <a href="../writing.html">Writing</a>
          <span class="slash" aria-hidden="true">/</span>
          <span>${escapeHtml(post.categoryLabel || post.category)}</span>
        </nav>
        <div class="article-meta">
          <span class="cat">${escapeHtml(post.categoryLabel || post.category)}</span>
          <span class="sep" aria-hidden="true"></span>
          <span>${escapeHtml(formatDisplayDate(post.date))}</span>
          <span class="sep" aria-hidden="true"></span>
          <span>${escapeHtml(post.readingTime || "8 min")}</span>
        </div>
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
        <p class="article-deck">${escapeHtml(post.excerpt)}</p>
        <div class="article-byline">
          <span>文 / AmneCorda</span>
          <span class="byline-line" aria-hidden="true"></span>
          <span>Hangzhou</span>
        </div>
      </header>

      <div class="${bodyClass}">
        <div class="prose">
          ${rendered.html}
          <p class="end-mark" aria-hidden="true">· · ·</p>
          <div class="article-end">
            <span>写于 ${escapeHtml(formatArticleDate(post.date))}</span>
            <a href="../writing.html">返回全部文章 ↑</a>
          </div>
        </div>
        ${tocHtml}
      </div>
    </article>

    ${nextHtml}
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div>
          <p class="footer-label">Sitemap</p>
          <nav class="footer-nav" aria-label="页脚导航">
            <a href="../index.html">Home / 首页</a>
            <a href="../writing.html">Writing / 文章</a>
            <a href="../projects.html">Projects / 项目</a>
            <a href="../about.html">About / 关于</a>
          </nav>
        </div>
        <div>
          <p class="footer-label">Elsewhere</p>
          <nav class="footer-nav" aria-label="社交链接">
            <a href="https://github.com/mar08meow" target="_blank" rel="noopener noreferrer">GitHub <span class="arrow" aria-hidden="true">↗</span></a>
            <a href="https://x.com/Amnecorda" target="_blank" rel="noopener noreferrer">X / Twitter <span class="arrow" aria-hidden="true">↗</span></a>
            <a href="mailto:hello@amnecorda.com">Email <span class="arrow" aria-hidden="true">↗</span></a>
          </nav>
        </div>
        <div class="footer-col--note">
          <p class="footer-label">Colophon</p>
          <p>手写 HTML 与 CSS 搭建，未使用框架。字体为 Inter，中文回退至系统中无衬线字体。站点不加载追踪脚本。</p>
        </div>
      </div>
      <p class="footer-mark" aria-hidden="true">AMNE<br>CORDA<span class="mark-dot">.</span></p>
      <div class="footer-bottom">
        <span>© <span data-year>2026</span> AmneCorda</span>
        <span>Made slowly · <span data-clock>--:-- CST</span></span>
        <a href="#top" class="back-top">Back to top ↑</a>
      </div>
    </div>
  </footer>

  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    <div class="mobile-menu-top">
      <a class="brand" href="../index.html">AMNE<br>CORDA<span class="brand-dot" aria-hidden="true"></span></a>
      <button class="menu-close" type="button" aria-label="关闭菜单"><span></span><span></span></button>
    </div>
    <nav class="mobile-nav" aria-label="移动端导航">
      <a href="../index.html"><span>01</span>首页 / Home</a>
      <a href="../writing.html" aria-current="page"><span>02</span>文章 / Writing</a>
      <a href="../projects.html"><span>03</span>项目 / Projects</a>
      <a href="../about.html"><span>04</span>关于 / About</a>
    </nav>
    <div class="mobile-menu-foot">
      <a href="mailto:hello@amnecorda.com">hello@amnecorda.com</a>
      <p>Hangzhou · CST</p>
    </div>
  </div>

  <script src="../assets/js/main.js"></script>
</body>
</html>
`;
  };

  /* --- UI: access -------------------------------------------------------- */

  const enterDashboard = (user) => {
    state.user = user;
    $("#access-view").hidden = true;
    $("#dashboard-view").hidden = false;
    $("#logout-btn").hidden = false;
    $("#repo-status").textContent = `${OWNER}/${REPO} · ${BRANCH}${
      user.email ? " · " + user.email : ""
    }`;
  };

  const showAccessError = (error) => {
    $("#access-view").hidden = false;
    $("#dashboard-view").hidden = true;
    $("#logout-btn").hidden = true;
    $("#access-title").textContent = "需要通过 Cloudflare Access 登录";
    setStatus(
      $("#access-error"),
      error.message || "未通过 Cloudflare Access。",
      "error"
    );
  };

  const init = async () => {
    try {
      const user = await api("/api/admin/me");
      enterDashboard(user);
      await refreshPosts();
    } catch (error) {
      showAccessError(error);
    }
  };

  /* --- UI: tabs ---------------------------------------------------------- */

  const switchTab = (name) => {
    $$(".admin-tabs button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === name);
    });
    $("#panel-posts").hidden = name !== "posts";
    $("#panel-new").hidden = name !== "new";
    $("#panel-files").hidden = name !== "files";
    if (name === "files" && !state.fileContent) {
      loadSelectedFile();
    }
  };

  $$(".admin-tabs button").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  /* --- UI: posts --------------------------------------------------------- */

  const renderPosts = () => {
    const list = $("#posts-list");
    list.textContent = "";

    if (!state.posts.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "还没有文章。";
      list.appendChild(empty);
      return;
    }

    state.posts.forEach((post) => {
      const row = document.createElement("div");
      row.className = "post-admin-row";

      const main = document.createElement("div");
      main.className = "post-admin-main";

      const title = document.createElement("a");
      title.href = `/posts/${encodeURIComponent(post.slug)}.html`;
      title.target = "_blank";
      title.rel = "noopener";
      title.textContent = post.title;
      main.appendChild(title);

      const meta = document.createElement("p");
      meta.textContent = [
        formatDisplayDate(post.date),
        post.categoryLabel || post.category,
        post.readingTime || "",
        post.featured ? "FEATURED" : "",
      ]
        .filter(Boolean)
        .join(" · ");
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "post-admin-actions";

      const edit = document.createElement("button");
      edit.className = "btn btn-ghost";
      edit.type = "button";
      edit.textContent = "编辑源码";
      edit.addEventListener("click", () =>
        openFile(`posts/${post.slug}.html`)
      );
      actions.appendChild(edit);

      const remove = document.createElement("button");
      remove.className = "btn btn-danger";
      remove.type = "button";
      remove.textContent = "删除";
      remove.addEventListener("click", () => deletePost(post, remove));
      actions.appendChild(remove);

      row.append(main, actions);
      list.appendChild(row);
    });
  };

  const refreshPosts = async () => {
    const status = $("#posts-status");
    setStatus(status, "正在读取文章…");
    try {
      const data = await api("/api/admin/posts");
      state.posts = Array.isArray(data.posts) ? data.posts : [];
      state.posts.sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );
      renderPosts();
      setStatus(status, "");
    } catch (error) {
      setStatus(status, "读取失败：" + error.message, "error");
    }
  };

  $("#refresh-posts").addEventListener("click", refreshPosts);

  const deletePost = async (post, button) => {
    if (
      !confirm(
        `确定删除《${post.title}》？\n\n会从 GitHub 删除文章文件，并更新文章列表和 sitemap。`
      )
    ) {
      return;
    }

    const status = $("#posts-status");
    button.disabled = true;
    setStatus(status, "正在删除并提交…");

    try {
      const posts = state.posts.filter((item) => item.slug !== post.slug);
      const commit = await commitFiles(
        [
          { path: `posts/${post.slug}.html`, content: null },
          {
            path: "data/posts.json",
            content: JSON.stringify(posts, null, 2) + "\n",
          },
          { path: "sitemap.xml", content: buildSitemap(posts) },
        ],
        `Delete post: ${post.title}`
      );

      state.posts = posts;
      renderPosts();
      setStatus(
        status,
        "已删除并提交，Cloudflare 会自动部署。",
        "success",
        commit.html_url
      );
    } catch (error) {
      button.disabled = false;
      setStatus(status, "删除失败：" + error.message, "error");
    }
  };

  /* --- UI: publish ------------------------------------------------------- */

  const today = () => new Date().toISOString().slice(0, 10);

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  let slugEdited = false;

  $("#post-date").value = today();
  $("#post-slug").addEventListener("input", () => {
    slugEdited = true;
  });
  $("#post-title").addEventListener("input", () => {
    if (!slugEdited) {
      $("#post-slug").value = slugify($("#post-title").value);
    }
  });
  $("#post-category").addEventListener("change", () => {
    $("#post-category-label").value =
      CATEGORY_DEFAULTS[$("#post-category").value] || "Notes";
  });

  $("#preview-btn").addEventListener("click", () => {
    const rendered = renderMarkdown($("#post-body").value);
    $("#preview-content").innerHTML =
      rendered.html || '<p class="empty-state">还没有正文。</p>';
    $("#preview-panel").classList.add("is-open");
  });

  $("#post-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.busy) return;

    const status = $("#publish-status");
    const publishButton = $("#publish-btn");
    const title = $("#post-title").value.trim();
    const slug = slugify($("#post-slug").value || title);
    const date = $("#post-date").value;
    const category = $("#post-category").value;
    const categoryLabel =
      $("#post-category-label").value.trim() ||
      CATEGORY_DEFAULTS[category] ||
      category;
    const readingTime = $("#post-reading").value.trim() || "8 min";
    const excerpt = $("#post-excerpt").value.trim();
    const body = $("#post-body").value.trim();
    const featured = $("#post-featured").checked;

    if (!title || !slug || !date || !excerpt || !body) {
      setStatus(
        status,
        "请填写标题、slug、日期、摘要和正文。",
        "error"
      );
      return;
    }

    if (state.posts.some((post) => post.slug === slug)) {
      setStatus(status, "这个 slug 已经存在，请换一个。", "error");
      return;
    }

    state.busy = true;
    publishButton.disabled = true;
    publishButton.textContent = "发布中…";
    setStatus(status, "正在生成文章并提交到 GitHub…");

    try {
      const rendered = renderMarkdown(body);
      const post = {
        slug,
        title,
        category,
        categoryLabel,
        date,
        readingTime,
        excerpt,
        featured,
      };
      const posts = [post, ...state.posts].sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );
      const articleHtml = buildArticleHtml(post, rendered, posts);
      const commit = await commitFiles(
        [
          { path: `posts/${slug}.html`, content: articleHtml },
          {
            path: "data/posts.json",
            content: JSON.stringify(posts, null, 2) + "\n",
          },
          { path: "sitemap.xml", content: buildSitemap(posts) },
        ],
        `Publish post: ${title}`
      );

      state.posts = posts;
      renderPosts();
      setStatus(
        status,
        "已发布。Cloudflare 约 1—2 分钟内部署完成。",
        "success",
        commit.html_url
      );

      event.target.reset();
      $("#post-date").value = today();
      $("#post-category").value = "design";
      $("#post-category-label").value = "Design";
      $("#post-reading").value = "8 min";
      slugEdited = false;
      $("#preview-panel").classList.remove("is-open");
      switchTab("posts");
    } catch (error) {
      setStatus(status, "发布失败：" + error.message, "error");
    } finally {
      state.busy = false;
      publishButton.disabled = false;
      publishButton.textContent = "发布文章";
    }
  });

  /* --- UI: site files ---------------------------------------------------- */

  const ensureFileOption = (path) => {
    const select = $("#file-select");
    const exists = Array.from(select.options).some(
      (option) => option.value === path
    );
    if (!exists) {
      const option = document.createElement("option");
      option.value = path;
      option.textContent = path;
      select.appendChild(option);
    }
    select.value = path;
  };

  const loadSelectedFile = async () => {
    const path = $("#file-select").value;
    const status = $("#file-status");
    setStatus(status, "正在读取…");

    try {
      const file = await getFile(path);
      state.filePath = path;
      state.fileContent = file.content;
      $("#file-editor").value = file.content;
      $("#save-file").disabled = false;
      setStatus(
        status,
        file.content ? `已读取 ${path}` : `${path} 不存在，保存时会创建。`
      );
    } catch (error) {
      setStatus(status, "读取失败：" + error.message, "error");
    }
  };

  const openFile = (path) => {
    ensureFileOption(path);
    switchTab("files");
    loadSelectedFile();
  };

  $("#load-file").addEventListener("click", loadSelectedFile);
  $("#file-select").addEventListener("change", loadSelectedFile);

  $("#save-file").addEventListener("click", async () => {
    const path = state.filePath || $("#file-select").value;
    const content = $("#file-editor").value;
    if (!path) return;
    if (!confirm(`保存 ${path} 并提交到 GitHub？`)) return;

    const status = $("#file-status");
    const button = $("#save-file");
    button.disabled = true;
    setStatus(status, "正在提交…");

    try {
      const commit = await commitFiles(
        [{ path, content }],
        `Update ${path}`
      );
      state.fileContent = content;
      setStatus(
        status,
        "已保存并提交，Cloudflare 会自动部署。",
        "success",
        commit.html_url
      );
    } catch (error) {
      setStatus(status, "保存失败：" + error.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  $("#download-file").addEventListener("click", () => {
    const path = state.filePath || $("#file-select").value || "file.txt";
    const blob = new Blob([$("#file-editor").value], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = path.split("/").pop();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  });

  /* --- Init -------------------------------------------------------------- */

  init();
})();
