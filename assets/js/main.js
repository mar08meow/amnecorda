/* AMNE CORDA — small, dependency-free enhancements */
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

  /* Sticky header state --------------------------------------------------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile menu ----------------------------------------------------------- */
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

  /* Reveal on scroll ------------------------------------------------------ */
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
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

  /* Project platform filter ----------------------------------------------- */
  const filterButtons = document.querySelectorAll("[data-filter]");
  const projectCards = document.querySelectorAll("[data-platform]");
  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.filter || "all";
        filterButtons.forEach((item) => {
          const active = item === btn;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        projectCards.forEach((card) => {
          const match = target === "all" || card.dataset.platform === target;
          card.hidden = !match;
        });
      });
    });
  }

  /* Active nav pill on hash/scroll ---------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (navLinks.length && "IntersectionObserver" in window) {
    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const setActive = (id) => {
      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${id}`;
        if (isCurrent) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  /* Copy to clipboard (email & homepage link) ----------------------------- */
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

      const labelTarget = button.querySelector("[data-copy-label]") || button;
      if (!labelTarget.dataset.originalLabel) {
        labelTarget.dataset.originalLabel = labelTarget.textContent;
      }
      const original = labelTarget.dataset.originalLabel;
      button.classList.add("is-copied");
      labelTarget.textContent = "已复制 ✓";
      window.setTimeout(() => {
        button.classList.remove("is-copied");
        labelTarget.textContent = original;
      }, 1800);
    });
  });
})();
