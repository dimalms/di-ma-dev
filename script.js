// Typing effect, page-transition fallback, and GSAP/Lenis-driven scroll
// animation. Libraries are vendored in /vendor — the Pi serves everything,
// no CDN involved; all animation cost runs in the visitor's browser.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasVendor =
  typeof gsap !== "undefined" &&
  typeof ScrollTrigger !== "undefined" &&
  typeof Lenis !== "undefined";

// --- Typing effect (element with [data-type]) ---------------------------
const typedEl = document.querySelector("[data-type]");
if (typedEl) {
  const phrases = JSON.parse(typedEl.dataset.type);
  const textNode = typedEl.querySelector(".typed-text");

  if (reducedMotion) {
    textNode.textContent = phrases[0];
  } else {
    let phrase = 0;
    let char = 0;
    let deleting = false;

    const tick = () => {
      const current = phrases[phrase];
      char += deleting ? -1 : 1;
      textNode.textContent = current.slice(0, char);

      let delay = deleting ? 40 : 75;
      if (!deleting && char === current.length) {
        delay = 2200;
        deleting = true;
      } else if (deleting && char === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        delay = 400;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 600);
  }
}

// --- Scroll animation ----------------------------------------------------
if (reducedMotion || !hasVendor) {
  // Static fallback: show everything, fill bars instantly.
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
  document.querySelectorAll(".bar-fill[data-level]").forEach((bar) => {
    bar.style.width = bar.dataset.level + "%";
  });
} else {
  gsap.registerPlugin(ScrollTrigger);

  // Buttery smooth scrolling; ScrollTrigger reads Lenis' position.
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Staggered reveals.
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        overwrite: true,
      }),
  });

  // Skill bars fill when scrolled into view.
  document.querySelectorAll(".bar-fill[data-level]").forEach((bar) => {
    gsap.to(bar, {
      width: bar.dataset.level + "%",
      duration: 1.4,
      ease: "power3.out",
      scrollTrigger: { trigger: bar.closest(".skill"), start: "top 90%", once: true },
    });
  });

  // Background: the ink cloud sinks deeper as you scroll. The scrub lag
  // makes it trail the scrollbar like it's settling through liquid, and a
  // slow scale/rotation drift keeps the water alive while idle.
  const bg = document.querySelector(".bg-img");
  if (bg) {
    gsap.to(bg, {
      scale: 1.1,
      rotation: 1.2,
      duration: 26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(bg, {
      y: () => window.innerHeight * 0.14,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "max",
        scrub: 1.5,
        invalidateOnRefresh: true,
      },
    });

    // Mouse-reactive ink: the liquid drifts gently away from the cursor.
    // Horizontal only — the vertical channel belongs to the scroll scrub.
    if (window.matchMedia("(pointer: fine)").matches) {
      const driftX = gsap.quickTo(bg, "x", { duration: 1.6, ease: "power3.out" });
      window.addEventListener("mousemove", (e) => {
        const ratio = e.clientX / window.innerWidth - 0.5;
        driftX(ratio * -60);
      });
    }
  }
}

// --- Live Pi vitals in the footer ----------------------------------------
// A systemd timer on the Pi writes /status.json (temp, uptime, load) every
// minute. Fails silently when absent (local dev, file://).
const vitalsEl = document.getElementById("pi-vitals");
if (vitalsEl && location.protocol !== "file:") {
  fetch("status.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((s) => {
      const d = Math.floor(s.uptime_s / 86400);
      const h = Math.floor((s.uptime_s % 86400) / 3600);
      const up = d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((s.uptime_s % 3600) / 60)}m`;
      vitalsEl.textContent = ` · up ${up} · ${s.temp.toFixed(1)}°C`;
    })
    .catch(() => {});
}

// --- Page transition fallback --------------------------------------------
// Browsers with cross-document View Transitions handle this in pure CSS
// (@view-transition). Everyone else gets a quick fade-out before navigation
// and a fade-in on load; nav + background never fade, so they feel persistent.
if (!("onpageswap" in window)) {
  document.body.classList.add("page-enter");

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link || link.target === "_blank") return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;

    e.preventDefault();
    document.body.classList.remove("page-enter");
    document.body.classList.add("page-exit");
    setTimeout(() => { location.href = link.href; }, 210);
  });

  // Restore state when coming back via bfcache.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      document.body.classList.remove("page-exit");
      document.body.classList.add("page-enter");
    }
  });
}
