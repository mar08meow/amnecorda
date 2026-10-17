/* MEOW — small, dependency-free enhancements */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

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
  const rows = Array.from(document.querySelectorAll("[data-category]"));
  const groups = Array.from(document.querySelectorAll("[data-year-group]"));

  if (filters.length && rows.length) {
    filters.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.filter;
        filters.forEach((b) => {
          b.classList.toggle("is-active", b === button);
          b.setAttribute("aria-pressed", String(b === button));
        });

        rows.forEach((row) => {
          const show = value === "all" || row.dataset.category === value;
          row.hidden = !show;
        });

        groups.forEach((group) => {
          const hasVisible = Array.from(
            group.querySelectorAll("[data-category]")
          ).some((row) => !row.hidden);
          group.hidden = !hasVisible;
        });
      });
    });
  }

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
})();
