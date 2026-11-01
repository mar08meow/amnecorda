/* AMNE CORDA — motion & interface details */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* Year & local clock ----------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => {
      const value = format.format(new Date()) + " CST";
      clocks.forEach((node) => {
        node.textContent = value;
      });
    };
    tick();
    window.setInterval(tick, 30000);
  }

  /* Header state ----------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* Scroll progress -------------------------------------------------------- */
  const progress = document.querySelector("[data-progress]");
  if (progress) {
    const updateProgress = () => {
      const max = root.scrollHeight - root.clientHeight;
      const ratio = max > 0 ? root.scrollTop / max : 0;
      progress.style.transform =
        "scaleX(" + Math.min(1, Math.max(0, ratio)) + ")";
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }

  /* Mobile menu ------------------------------------------------------------ */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  const closeButton = document.querySelector(".menu-close");

  const setMenu = (open) => {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) {
      closeButton?.focus();
    } else if (document.activeElement === closeButton) {
      toggle.focus();
    }
  };

  toggle?.addEventListener("click", () => setMenu(true));
  closeButton?.addEventListener("click", () => setMenu(false));
  menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  /* Scroll reveal ---------------------------------------------------------- */
  const revealSelector =
    ".reveal, .project-item, .about-copy, .about-visual, .contact-panel, .section-head";
  const revealItems = Array.from(document.querySelectorAll(revealSelector));

  revealItems.forEach((item) => {
    if (!item.classList.contains("reveal")) item.classList.add("reveal");
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-in"));
  }

  /* Active nav link -------------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const sectionIds = ["home", "projects", "about", "contact"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    const linkFor = (id) => {
      const target = id === "home" ? "#top" : "#" + id;
      return navLinks.find((link) => link.getAttribute("href") === target);
    };

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.classList.remove("is-active"));
          linkFor(entry.target.id)?.classList.add("is-active");
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* Hero product window tilt ---------------------------------------------- */
  const hero = document.querySelector(".hero");
  const visual = document.querySelector("[data-tilt]");
  const windowWrap = visual?.querySelector(".app-window-wrap");

  if (
    hero &&
    windowWrap &&
    window.matchMedia("(pointer: fine)").matches &&
    !reduceMotion
  ) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      windowWrap.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      windowWrap.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    });

    hero.addEventListener("pointerleave", () => {
      windowWrap.style.removeProperty("--ry");
      windowWrap.style.removeProperty("--rx");
    });
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
})();
