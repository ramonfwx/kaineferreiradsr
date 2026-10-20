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

  const heroMark = document.querySelector(".hero-mark");
  if (heroMark) requestAnimationFrame(() => heroMark.classList.add("is-in"));

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

/* Lightbox 3D: o projeto abre flutuando; dá pra arrastar, girar e virar o card */
const lb = document.getElementById("lightbox");
const lbStage = lb.querySelector(".lb-stage");
const lbFly = lb.querySelector(".lb-fly");
const lbCard = lb.querySelector(".lb-card");
const lbImg = lb.querySelector(".lb-front img");
const lbCloseBtn = lb.querySelector(".lb-close");
const lbPrevBtn = lb.querySelector(".lb-prev");
const lbNextBtn = lb.querySelector(".lb-next");

let lbList = [];
let lbIndex = 0;
let lbOpener = null;
let lbIsOpen = false;
let lbBusy = false;
let lbFace = 0;
let lbMoved = false;
let lbDrag = null;
let lbRaf = 0;
let lbLast = 0;
const lbRot = { x: 0, y: 0, vx: 0, vy: 0 };
const lbHover = { x: 0, y: 0, on: false };
const lbWait = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const lbSize = () => {
  const ratio = lbImg.naturalWidth && lbImg.naturalHeight ? lbImg.naturalWidth / lbImg.naturalHeight : 0.8;
  const small = window.innerWidth <= 760;
  const maxH = Math.min(window.innerHeight - (small ? 220 : 200), 980);
  const maxW = window.innerWidth * (small ? 0.86 : 0.8);
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) { w = maxW; h = w / ratio; }
  lb.style.setProperty("--lb-w", Math.round(w) + "px");
  lb.style.setProperty("--lb-h", Math.round(h) + "px");
};

const lbFill = (i) => {
  const card = lbList[i];
  const thumb = card.querySelector("img");
  const name = card.querySelector(".portfolio-name").textContent;
  lb.querySelector(".lb-title").textContent = name;
  lb.querySelector(".lb-back-title").textContent = name;
  lb.querySelector(".lb-back-cat").textContent = card.dataset.cat === "identidade" ? "Identidade Visual" : "Artes";
  lb.querySelector(".lb-original").href = card.getAttribute("href");
  lb.querySelector(".lb-count").textContent = (i + 1) + " / " + lbList.length;
  lbPrevBtn.hidden = lbNextBtn.hidden = lbList.length < 2;
  lbImg.alt = thumb.alt;
  return new Promise((resolve) => {
    const done = () => { lbSize(); resolve(); };
    lbImg.onload = done;
    lbImg.onerror = done;
    lbImg.src = card.getAttribute("href");
    if (lbImg.complete && lbImg.naturalWidth) done();
  });
};

const lbSetLifted = (card) => {
  lbList.forEach((c) => c.classList.toggle("is-lifted", c === card));
};

const lbFlyFrame = (from, to) => {
  const scale = from.width / to.width;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")";
};

const lbApply = () => {
  lbCard.style.transform = "perspective(1500px) rotateX(" + lbRot.x.toFixed(2) + "deg) rotateY(" + lbRot.y.toFixed(2) + "deg)";
  const ty = clamp((lbRot.y - lbFace) / 30, -1, 1);
  const tx = clamp(lbRot.x / 22, -1, 1);
  lb.style.setProperty("--gx", (50 - ty * 42).toFixed(1) + "%");
  lb.style.setProperty("--gy", (50 + tx * 42).toFixed(1) + "%");
  lb.style.setProperty("--go", Math.min(0.42, 0.05 + Math.abs(ty) * 0.3 + Math.abs(tx) * 0.2).toFixed(3));
};

const lbSpring = (key, target, dt) => {
  const K = 170;
  const C = 2 * Math.sqrt(K) * 0.78;
  const v = lbRot["v" + key];
  const a = K * (target - lbRot[key]) - C * v;
  lbRot["v" + key] = v + a * dt;
  lbRot[key] += lbRot["v" + key] * dt;
};

const lbTick = (t) => {
  const dt = Math.min(0.033, (t - lbLast) / 1000 || 0.016);
  lbLast = t;
  if (!lbDrag || !lbDrag.active) {
    const offY = lbHover.on ? lbHover.x * 10 : 0;
    const offX = lbHover.on ? -lbHover.y * 8 : 0;
    lbSpring("y", lbFace + offY, dt);
    lbSpring("x", offX, dt);
  }
  lbApply();
  lbRaf = requestAnimationFrame(lbTick);
};
const lbStartLoop = () => { cancelAnimationFrame(lbRaf); lbLast = performance.now(); lbRaf = requestAnimationFrame(lbTick); };
const lbStopLoop = () => cancelAnimationFrame(lbRaf);

const lbOpenAt = async (card) => {
  if (lbIsOpen || lbBusy) return;
  lbBusy = true;
  lbOpener = card;
  lbList = pCards.filter((c) => !c.hidden);
  lbIndex = Math.max(0, lbList.indexOf(card));
  await lbFill(lbIndex);

  lb.hidden = false;
  lbIsOpen = true;
  root.classList.add("lb-open");
  lbFace = 0;
  lbRot.x = 6; lbRot.y = -26; lbRot.vx = 0; lbRot.vy = 0;
  lbApply();
  void lb.offsetWidth;
  lb.classList.add("is-open");
  lbStartLoop();

  if (!reduceMotion) {
    const from = card.getBoundingClientRect();
    const to = lbFly.getBoundingClientRect();
    lbFly.animate(
      [
        { transform: lbFlyFrame(from, to), opacity: 0.2 },
        { opacity: 1, offset: 0.3 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 720, easing: "cubic-bezier(.16,.84,.3,1)" }
    );
  } else {
    lbFly.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  }
  lbSetLifted(card);
  lbCloseBtn.focus({ preventScroll: true });
  lbBusy = false;
};

const lbClose = async () => {
  if (!lbIsOpen || lbBusy) return;
  lbBusy = true;
  lbIsOpen = false;
  lb.classList.remove("is-open");
  lbFace = 0;
  lbHover.on = false;
  const card = lbList[lbIndex];
  const from = card.getBoundingClientRect();
  const visible = from.bottom > 0 && from.top < window.innerHeight && from.right > 0 && from.left < window.innerWidth;
  const to = lbFly.getBoundingClientRect();
  let anim;
  if (visible && !reduceMotion) {
    anim = lbFly.animate(
      [
        { transform: "none", opacity: 1 },
        { opacity: 1, offset: 0.7 },
        { transform: lbFlyFrame(from, to), opacity: 0 },
      ],
      { duration: 560, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }
    );
  } else {
    anim = lbFly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
  }
  await anim.finished.catch(() => {});
  lb.hidden = true;
  anim.cancel();
  lbStopLoop();
  root.classList.remove("lb-open");
  lbList.forEach((c) => c.classList.remove("is-lifted"));
  if (lbOpener) lbOpener.focus({ preventScroll: true });
  lbBusy = false;
};

const lbGo = async (dir) => {
  if (lbBusy || lbList.length < 2) return;
  lbBusy = true;
  lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
  lbCard.classList.add("is-swapping");
  await lbWait(reduceMotion ? 0 : 220);
  await lbFill(lbIndex);
  lbFace = 0;
  lbRot.y = -dir * 34;
  lbRot.vy = 0;
  lbSetLifted(lbList[lbIndex]);
  lbOpener = lbList[lbIndex];
  lbCard.classList.remove("is-swapping");
  lbBusy = false;
};

const lbFlip = () => { lbFace = (Math.round(lbRot.y / 180) + 1) * 180; };

pCards.forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    lbOpenAt(card);
  });
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target.closest("a, button")) return;
  lbDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), vy: 0, active: false };
  lbMoved = false;
});
lbStage.addEventListener("pointermove", (e) => {
  if (e.pointerType === "mouse") {
    lbHover.on = true;
    lbHover.x = clamp((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2), -1, 1);
    lbHover.y = clamp((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2), -1, 1);
  }
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  if (!lbDrag.active) {
    if (Math.hypot(e.clientX - lbDrag.x, e.clientY - lbDrag.y) < 6) return;
    lbDrag.active = true;
    lbMoved = true;
    lbStage.setPointerCapture(e.pointerId);
    lbStage.classList.add("is-dragging");
    lbRot.vx = 0; lbRot.vy = 0;
  }
  const now = performance.now();
  const dtMs = Math.max(1, now - lbDrag.lt);
  const dy = e.clientY - lbDrag.ly;
  const dx = e.clientX - lbDrag.lx;
  lbRot.y += dx * 0.5;
  lbRot.x = clamp(lbRot.x - dy * 0.3, -28, 28);
  lbDrag.vy = 0.75 * lbDrag.vy + 0.25 * ((dx * 0.5) / dtMs) * 1000;
  lbDrag.lx = e.clientX; lbDrag.ly = e.clientY; lbDrag.lt = now;
});
const lbEndDrag = (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  if (lbDrag.active) {
    lbRot.vy = clamp(lbDrag.vy, -900, 900);
    lbFace = Math.round((lbRot.y + clamp(lbRot.vy * 0.22, -110, 110)) / 180) * 180;
    lbStage.classList.remove("is-dragging");
  }
  lbDrag = null;
  setTimeout(() => { lbMoved = false; }, 0);
};
lbStage.addEventListener("pointerup", lbEndDrag);
lbStage.addEventListener("pointercancel", lbEndDrag);
lbStage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") lbHover.on = false; });
lbStage.addEventListener("click", (e) => {
  if (lbMoved || e.target.closest("a, button")) return;
  if (e.target.closest(".lb-card")) lbFlip();
  else lbClose();
});

lbCloseBtn.addEventListener("click", lbClose);
lbPrevBtn.addEventListener("click", () => lbGo(-1));
lbNextBtn.addEventListener("click", () => lbGo(1));
window.addEventListener("resize", () => { if (lbIsOpen) lbSize(); });

document.addEventListener("keydown", (e) => {
  if (!lbIsOpen) return;
  if (e.key === "Escape") { e.preventDefault(); lbClose(); }
  else if (e.key === "ArrowRight") lbGo(1);
  else if (e.key === "ArrowLeft") lbGo(-1);
  else if (e.key === "Tab") {
    const items = Array.from(lb.querySelectorAll("button:not([hidden]), a[href]"));
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
