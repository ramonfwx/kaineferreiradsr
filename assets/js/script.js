document.getElementById("year").textContent = new Date().getFullYear();

/* Header background on scroll */
const header = document.getElementById("siteHeader");
const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 40);
};
window.addEventListener("scroll", onScroll);
onScroll();

/* Mobile menu toggle */
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("open");
  mainNav.classList.toggle("open");
});
mainNav.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("open");
    mainNav.classList.remove("open");
  });
});

/* Active nav link on scroll */
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-link");
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);
sections.forEach((section) => navObserver.observe(section));

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Portfólio: abas em pílula + organização das fileiras */
const pGrid = document.getElementById("portfolioGrid");
const pCards = Array.from(pGrid.querySelectorAll(".portfolio-card"));
const pTabs = Array.from(document.querySelectorAll(".portfolio-tab"));
const pThumb = document.querySelector(".portfolio-filter-thumb");
let currentFilter = "identidade";
let switching = false;

const layoutThumb = () => {
  const active = document.querySelector(".portfolio-tab.is-active");
  pThumb.style.width = active.offsetWidth + "px";
  pThumb.style.setProperty("--thumb-x", active.offsetLeft + "px");
};

const applyFilter = (cat) => {
  pCards.forEach((card) => {
    card.hidden = card.dataset.cat !== cat;
    card.classList.remove("is-wide");
  });
  pGrid.dataset.view = cat;
  pGrid.setAttribute("aria-labelledby", "tab-" + cat);
  const visible = pCards.filter((card) => !card.hidden);
  visible.forEach((card, i) => card.style.setProperty("--i", i));
  if (visible.length % 2 === 1) visible[visible.length - 1].classList.add("is-wide");
};

const replayEnter = () => {
  pGrid.classList.remove("is-in");
  void pGrid.offsetWidth;
  pGrid.classList.add("is-in");
};

const switchTo = (cat) => {
  if (cat === currentFilter || switching) return;
  switching = true;
  currentFilter = cat;
  pTabs.forEach((tab) => {
    const on = tab.dataset.filter === cat;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-selected", on);
    tab.tabIndex = on ? 0 : -1;
  });
  layoutThumb();
  pGrid.classList.add("is-leaving");
  setTimeout(() => {
    applyFilter(cat);
    pGrid.classList.remove("is-leaving");
    replayEnter();
    switching = false;
  }, reduceMotion ? 0 : 300);
};

pTabs.forEach((tab, i) => {
  tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
  tab.addEventListener("click", () => switchTo(tab.dataset.filter));
  tab.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const other = pTabs[(i + 1) % pTabs.length];
    other.focus();
    switchTo(other.dataset.filter);
  });
});
applyFilter(currentFilter);
layoutThumb();
window.addEventListener("resize", layoutThumb);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutThumb);

/* Cards: inclinação suave seguindo o mouse (só com mouse) */
if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  pCards.forEach((card) => {
    let frame = null;
    card.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((x - 0.5) * 7).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

/* Textos que alternam */
document.querySelectorAll("[data-rotator]").forEach((el) => {
  const items = Array.from(el.querySelectorAll(".rotator-item"));
  if (items.length < 2 || reduceMotion) return;
  const delay = parseInt(el.dataset.rotator, 10) || 5000;
  let current = 0;
  let timer = null;
  let inView = false;

  const next = () => {
    const prev = items[current];
    current = (current + 1) % items.length;
    const nxt = items[current];
    prev.classList.remove("is-active");
    prev.classList.add("is-leaving");
    prev.setAttribute("aria-hidden", "true");
    nxt.classList.remove("is-leaving");
    nxt.classList.add("is-active");
    nxt.removeAttribute("aria-hidden");
    setTimeout(() => prev.classList.remove("is-leaving"), 1000);
  };
  const play = () => { if (!timer) timer = setInterval(next, delay); };
  const stop = () => { clearInterval(timer); timer = null; };

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    inView && !document.hidden ? play() : stop();
  }).observe(el);
  document.addEventListener("visibilitychange", () => {
    document.hidden || !inView ? stop() : play();
  });
});

/* Entrada: fade ao rolar, da esquerda para a direita */
let motionStarted = false;
const startScrollMotion = () => {
  if (motionStarted) return;
  motionStarted = true;

  document.querySelectorAll("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty("--i", i));
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal, [data-stagger]").forEach((el) => revealObserver.observe(el));

  const gridObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        replayEnter();
        gridObserver.disconnect();
      }
    },
    { threshold: 0.12 }
  );
  gridObserver.observe(pGrid);
};

/* Abertura: logo girando com fade, depois revela o site */
const intro = document.getElementById("intro");
if (root.classList.contains("intro-active") && intro) {
  setTimeout(() => intro.classList.add("is-leaving"), 2300);
  setTimeout(startScrollMotion, 2650);
  setTimeout(() => {
    root.classList.remove("intro-active");
    try { sessionStorage.setItem("akineIntro", "1"); } catch (e) {}
  }, 3400);
} else {
  startScrollMotion();
}
