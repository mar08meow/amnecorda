/* AMNE CORDA — personal homepage interactions */
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
  const revealItems = Array.from(
    document.querySelectorAll(".block, .content-footer")
  );
  revealItems.forEach((item) => item.classList.add("reveal"));

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
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-in"));
  }

  /* Sidebar active link ---------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll(".side-nav a"));
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
      { rootMargin: "-38% 0px -54% 0px", threshold: 0 }
    );

    sections.forEach((section) => navObserver.observe(section));
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
