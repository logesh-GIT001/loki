import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./more.css";

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ------------------------------------------------------------------ */
/*  Smooth scroll                                                      */
/* ------------------------------------------------------------------ */

let lenis = null;

if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.12,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------------------ */
/*  Header / progress                                                  */
/* ------------------------------------------------------------------ */

const header = document.querySelector(".field-header");
const progressBar = document.querySelector(".field-progress span");
let lastScroll = 0;

function handleScroll(scroll) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0;

  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;

  if (header) {
    header.classList.toggle("is-scrolled", scroll > 40);

    if (scroll > 180 && scroll > lastScroll + 4) {
      header.classList.add("is-hidden");
    } else if (scroll < lastScroll - 4 || scroll < 120) {
      header.classList.remove("is-hidden");
    }
  }

  lastScroll = scroll;
}

if (lenis) {
  lenis.on("scroll", ({ scroll }) => handleScroll(scroll));
} else {
  window.addEventListener("scroll", () => handleScroll(window.scrollY), { passive: true });
}

handleScroll(window.scrollY);

/* ------------------------------------------------------------------ */
/*  Mobile menu                                                        */
/* ------------------------------------------------------------------ */

const menuToggle = document.querySelector(".field-menu-toggle");
const mobileMenu = document.querySelector(".field-mobile-menu");
let menuOpen = false;

function setMenu(open) {
  if (!menuToggle || !mobileMenu) return;

  menuOpen = open;
  mobileMenu.classList.toggle("is-open", open);
  mobileMenu.setAttribute("aria-hidden", String(!open));
  mobileMenu.inert = !open;
  menuToggle.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

  if (open) {
    document.body.classList.add("is-locked");
    if (lenis) lenis.stop();
  } else {
    document.body.classList.remove("is-locked");
    if (lenis) lenis.start();
  }
}

function closeMenu() {
  if (menuOpen) setMenu(false);
}

menuToggle?.addEventListener("click", () => setMenu(!menuOpen));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) closeMenu();
});

/* ------------------------------------------------------------------ */
/*  Anchors                                                            */
/* ------------------------------------------------------------------ */

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash.length < 2) return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    closeMenu();

    if (lenis) {
      lenis.scrollTo(target, { offset: -72, duration: 1.3 });
    } else {
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    }

    history.pushState(null, "", hash);
  });
});

/* ------------------------------------------------------------------ */
/*  Cursor                                                             */
/* ------------------------------------------------------------------ */

const cursor = document.querySelector(".field-cursor");
const cursorDot = document.querySelector(".field-cursor-dot");
const cursorRing = document.querySelector(".field-cursor-ring");

if (cursor && cursorDot && cursorRing && isFinePointer && !prefersReduced) {
  document.documentElement.classList.add("has-field-cursor");
  gsap.set([cursorDot, cursorRing], { xPercent: -50, yPercent: -50 });

  const dotX = gsap.quickTo(cursorDot, "x", { duration: 0.18, ease: "power3" });
  const dotY = gsap.quickTo(cursorDot, "y", { duration: 0.18, ease: "power3" });
  const ringX = gsap.quickTo(cursorRing, "x", { duration: 0.5, ease: "power3" });
  const ringY = gsap.quickTo(cursorRing, "y", { duration: 0.5, ease: "power3" });

  window.addEventListener("mousemove", (event) => {
    cursor.classList.add("is-visible");
    dotX(event.clientX);
    dotY(event.clientY);
    ringX(event.clientX);
    ringY(event.clientY);
  });

  document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
  document.addEventListener("mouseenter", () => cursor.classList.add("is-visible"));

  document.querySelectorAll("a, button, [data-cursor]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (el.hasAttribute("data-cursor")) {
        cursor.classList.add("is-active");
      } else {
        cursor.classList.add("is-link");
      }
    });

    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-active", "is-link");
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Preloader + hero intro                                             */
/* ------------------------------------------------------------------ */

const preloader = document.querySelector(".field-preloader");
const preloaderCount = document.querySelector("[data-preloader-count]");
const preloaderBar = document.querySelector(".field-preloader-track i");
const heroLines = document.querySelectorAll(".field-title .field-line-inner");
const outroLines = document.querySelectorAll(".outro-title .field-line-inner");
let heroPlayed = false;

if (!prefersReduced) {
  gsap.set(heroLines, { yPercent: 112 });
  gsap.set(".field-hero-top", { opacity: 0, y: 12 });
  gsap.set(".field-kicker", { opacity: 0, y: 12 });
  gsap.set(".field-hero-copy", { opacity: 0, y: 24 });
  gsap.set(".field-hero-foot", { opacity: 0, y: 16 });
  gsap.set(outroLines, { yPercent: 112 });
}

function playHero() {
  if (heroPlayed) return;
  heroPlayed = true;

  if (prefersReduced) return;

  const tl = gsap.timeline();

  tl.to(".field-hero-top", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
    .to(".field-kicker", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.45")
    .to(
      heroLines,
      { yPercent: 0, duration: 1.15, ease: "power4.out", stagger: 0.09 },
      "-=0.4",
    )
    .to(".field-hero-copy", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, "-=0.7")
    .to(".field-hero-foot", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
}

function runPreloader() {
  return new Promise((resolve) => {
    if (prefersReduced || !preloader || !preloader.isConnected) {
      preloader?.remove();
      resolve();
      return;
    }

    const state = { value: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        preloader.remove();
        resolve();
      },
    });

    tl.to(state, {
      value: 100,
      duration: 1.55,
      ease: "power2.inOut",
      onUpdate: () => {
        const value = Math.round(state.value);
        if (preloaderCount) preloaderCount.textContent = String(value).padStart(2, "0");
        if (preloaderBar) preloaderBar.style.width = `${value}%`;
      },
    })
      .to(".field-preloader-word", { yPercent: -18, opacity: 0, duration: 0.45, ease: "power3.in" }, "-=0.1")
      .to(preloader, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.18");
  });
}

if (!prefersReduced) {
  document.body.classList.add("is-locked");
  if (lenis) lenis.stop();
}

const safetyTimer = window.setTimeout(() => {
  if (preloader && preloader.isConnected) {
    preloader.remove();
    document.body.classList.remove("is-locked");
    if (lenis) lenis.start();
    playHero();
  }
}, 5000);

document.fonts.ready.then(() => {
  runPreloader().then(() => {
    window.clearTimeout(safetyTimer);
    document.body.classList.remove("is-locked");
    if (lenis) lenis.start();
    playHero();
    ScrollTrigger.refresh();
  });
});

/* ------------------------------------------------------------------ */
/*  Scroll reveals + landscape parallax                                */
/* ------------------------------------------------------------------ */

if (!prefersReduced) {
  gsap.utils.toArray(".field-reveal").forEach((el) => {
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  gsap.to(outroLines, {
    yPercent: 0,
    duration: 1.2,
    ease: "power4.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".field-outro", start: "top 62%", once: true },
  });

  gsap.to(".hill-far", {
    y: 26,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".hill-mid", {
    y: 44,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".hill-front", {
    y: 62,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".hill-fore", {
    y: 82,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".sun-core", {
    y: -54,
    scale: 1.08,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".sun-glow", {
    y: -36,
    scale: 1.16,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".trees-front", {
    y: 28,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".birds", {
    y: -60,
    x: 34,
    ease: "none",
    scrollTrigger: { trigger: ".field-hero", start: "top top", end: "bottom top", scrub: true },
  });

  gsap.to(".outro-moon", {
    y: -60,
    ease: "none",
    scrollTrigger: { trigger: ".field-outro", start: "top bottom", end: "bottom top", scrub: true },
  });

  gsap.to(".outro-hill-back", {
    y: 26,
    ease: "none",
    scrollTrigger: { trigger: ".field-outro", start: "top bottom", end: "bottom top", scrub: true },
  });
}

/* ------------------------------------------------------------------ */
/*  Calisthenics                                                       */
/* ------------------------------------------------------------------ */

const caliStage = document.querySelector("[data-cali-stage]");
const caliPerson = document.querySelector("[data-cali-person]");
const caliReps = document.querySelector("[data-reps]");
const armLines = {
  leftUpper: document.querySelector("[data-arm-left-upper]"),
  leftFore: document.querySelector("[data-arm-left-fore]"),
  rightUpper: document.querySelector("[data-arm-right-upper]"),
  rightFore: document.querySelector("[data-arm-right-fore]"),
};

function solveElbow(shoulder, hand, bend) {
  const dx = hand.x - shoulder.x;
  const dy = hand.y - shoulder.y;
  const distance = Math.min(209, Math.max(1, Math.hypot(dx, dy)));
  const upper = 105;
  const fore = 105;
  const along = (upper * upper - fore * fore + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const midX = shoulder.x + (dx * along) / distance;
  const midY = shoulder.y + (dy * along) / distance;

  return {
    x: midX + (-dy / distance) * height * bend,
    y: midY + (dx / distance) * height * bend,
  };
}

function setArmLine(line, start, end) {
  if (!line) return;
  line.setAttribute("x1", start.x.toFixed(1));
  line.setAttribute("y1", start.y.toFixed(1));
  line.setAttribute("x2", end.x.toFixed(1));
  line.setAttribute("y2", end.y.toFixed(1));
}

function updateArms(offsetY = 0) {
  const leftShoulder = { x: 272, y: 306 + offsetY };
  const rightShoulder = { x: 328, y: 306 + offsetY };
  const leftHand = { x: 250, y: 120 };
  const rightHand = { x: 350, y: 120 };

  const leftElbow = solveElbow(leftShoulder, leftHand, -1);
  const rightElbow = solveElbow(rightShoulder, rightHand, 1);

  setArmLine(armLines.leftUpper, leftShoulder, leftElbow);
  setArmLine(armLines.leftFore, leftElbow, leftHand);
  setArmLine(armLines.rightUpper, rightShoulder, rightElbow);
  setArmLine(armLines.rightFore, rightElbow, rightHand);
}

if (caliPerson) {
  updateArms(0);

  if (prefersReduced) {
    gsap.set(caliPerson, { y: -18 });
    updateArms(-18);
    if (caliReps) caliReps.textContent = "06";
  } else {
    const lift = { y: 0 };
    let reps = 0;

    const caliTl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      onRepeat: () => {
        reps = (reps + 1) % 100;
        if (caliReps) caliReps.textContent = String(reps).padStart(2, "0");
      },
    });

    caliTl.to(lift, {
      y: -66,
      duration: 1.6,
      ease: "sine.inOut",
      onUpdate: () => {
        gsap.set(caliPerson, { y: lift.y });
        updateArms(lift.y);
      },
    });

    if (caliStage && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              caliTl.play();
            } else {
              caliTl.pause();
            }
          });
        },
        { threshold: 0.08 },
      );

      observer.observe(caliStage);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Running trail                                                      */
/* ------------------------------------------------------------------ */

const runPanel = document.querySelector(".run-panel");
const runPath = document.querySelector("[data-run-path]");
const runRunner = document.querySelector("[data-runner]");
const runKm = document.querySelector("[data-run-km]");
const runMarkers = document.querySelectorAll("[data-run-markers] [data-at]");

if (runPath) {
  const pathLength = runPath.getTotalLength();
  runPath.style.strokeDasharray = String(pathLength);
  runPath.style.strokeDashoffset = String(pathLength);

  runMarkers.forEach((marker) => {
    const at = Math.min(1, Math.max(0, parseFloat(marker.dataset.at || "0")));
    const point = runPath.getPointAtLength(pathLength * at);
    marker.setAttribute("transform", `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
  });

  const setRunProgress = (rawProgress) => {
    const progress = Math.min(1, Math.max(0, rawProgress));
    const point = runPath.getPointAtLength(pathLength * progress);
    const ahead = runPath.getPointAtLength(pathLength * Math.min(1, progress + 0.006));
    const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;

    if (runRunner) {
      runRunner.setAttribute(
        "transform",
        `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${angle.toFixed(1)})`,
      );
    }

    runPath.style.strokeDashoffset = String(pathLength * (1 - progress));

    if (runKm) {
      runKm.textContent = (progress * 42.2).toFixed(1).padStart(4, "0");
    }
  };

  setRunProgress(prefersReduced ? 0.72 : 0);

  if (!prefersReduced && runPanel) {
    ScrollTrigger.create({
      trigger: runPanel,
      start: "top 82%",
      end: "bottom 18%",
      scrub: 1,
      onUpdate: (self) => {
        setRunProgress(self.progress);
        runPanel.classList.toggle("is-running", self.progress > 0.015 && self.progress < 0.985);
      },
      onToggle: (self) => {
        if (!self.isActive) runPanel.classList.remove("is-running");
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Hockey game                                                        */
/* ------------------------------------------------------------------ */

const rink = document.querySelector("[data-rink]");
const puck = document.querySelector("[data-puck]");
const stick = document.querySelector("[data-stick]");
const flash = document.querySelector("[data-flash]");
const goalsEl = document.querySelector("[data-goals]");
const shotsEl = document.querySelector("[data-shots]");
let goals = 0;
let shots = 0;
let shooting = false;

if (rink && puck && stick) {
  gsap.set(flash, { xPercent: -50, yPercent: -50, opacity: 0 });
  gsap.set(stick, { rotate: -28 });

  const shoot = () => {
    if (shooting) return;

    shooting = true;
    shots += 1;
    if (shotsEl) shotsEl.textContent = String(shots).padStart(2, "0");

    const isGoal = Math.random() > 0.28;
    const rect = rink.getBoundingClientRect();
    const dx = rect.width * (isGoal ? 0.64 : 0.58);
    const dy = rect.height * (isGoal ? -0.105 : -0.31);
    const duration = prefersReduced ? 0.01 : 0.6;

    gsap.set(puck, { opacity: 1, scale: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(puck, { clearProps: "transform,opacity,scale" });
        gsap.set(stick, { rotate: -28 });
        shooting = false;
      },
    });

    tl.to(stick, { rotate: 20, duration: duration * 0.28, ease: "power2.out" }, 0)
      .to(
        puck,
        { x: dx, y: dy, rotate: 540, duration, ease: "power2.in" },
        0,
      )
      .to(
        puck,
        { scale: 0.55, opacity: 0, duration: duration * 0.2, ease: "power1.in" },
        duration * 0.8,
      );

    if (isGoal) {
      tl.call(
        () => {
          goals += 1;
          if (goalsEl) goalsEl.textContent = String(goals).padStart(2, "0");
          rink.classList.add("is-goal");

          gsap
            .timeline()
            .fromTo(
              flash,
              { opacity: 0, scale: 0.7, rotate: -6 },
              {
                opacity: 1,
                scale: 1,
                rotate: -6,
                duration: prefersReduced ? 0.01 : 0.24,
                ease: "back.out(2)",
              },
            )
            .to(
              flash,
              { opacity: 0, scale: 1.1, duration: prefersReduced ? 0.01 : 0.36, ease: "power2.in" },
              "+=0.42",
            );

          window.setTimeout(() => rink.classList.remove("is-goal"), 520);
        },
        null,
        duration * 0.92,
      );
    }
  };

  rink.addEventListener("click", shoot);
  rink.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      shoot();
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Games console                                                      */
/* ------------------------------------------------------------------ */

const gameTabs = document.querySelectorAll("[data-game]");
const gameScenes = document.querySelectorAll("[data-scene]");
const gameScreen = document.querySelector("[data-screen]");
const gameLabel = document.querySelector("[data-game-label]");
const gamePlay = document.querySelector("[data-game-play]");
const gameStart = document.querySelector("[data-game-start]");
const gameNames = {
  rdr: "RED DEAD REDEMPTION II",
  gta: "GRAND THEFT AUTO V",
};
let currentGame = "rdr";
let playing = false;
let playTimer = 0;

function setGame(id) {
  if (!gameNames[id]) return;

  currentGame = id;

  gameTabs.forEach((tab) => {
    const active = tab.dataset.game === id;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  gameScenes.forEach((scene) => {
    scene.classList.toggle("is-active", scene.dataset.scene === id);
  });

  if (gameLabel) gameLabel.textContent = gameNames[id];

  if (gamePlay) {
    gamePlay.innerHTML = `${id === "rdr" ? "PLAY / RIDE" : "PLAY / DRIVE"} <span>↗</span>`;
  }

  if (gameStart) gameStart.textContent = "PRESS START";
  gameScreen?.classList.remove("is-playing");
  playing = false;
  window.clearTimeout(playTimer);
}

gameTabs.forEach((tab) => {
  tab.addEventListener("click", () => setGame(tab.dataset.game));
});

gamePlay?.addEventListener("click", () => {
  if (playing || !gameScreen) return;

  playing = true;
  gameScreen.classList.add("is-playing");
  if (gameStart) gameStart.textContent = currentGame === "rdr" ? "RIDING OUT" : "LOS SANTOS";

  playTimer = window.setTimeout(() => {
    gameScreen.classList.remove("is-playing");
    if (gameStart) gameStart.textContent = "PRESS START";
    playing = false;
  }, 3200);
});

/* ------------------------------------------------------------------ */
/*  Bookshelf                                                          */
/* ------------------------------------------------------------------ */

const books = [
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    quote:
      '"You have power over your mind — not outside events. Realise this, and you will find strength."',
    note: "Re-read when the noise gets loud. Stillness is a practice, not a personality.",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    quote:
      '"And, when you want something, all the universe conspires in helping you to achieve it."',
    note: "A reminder that the road is the point. The treasure was usually under your feet.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    quote:
      '"You do not rise to the level of your goals. You fall to the level of your systems."',
    note: "Small reps, boring consistency. The same rule that builds a body builds a life.",
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    quote:
      '"Clarity about what matters provides clarity about what does not."',
    note: "The ability to disappear into one hard thing is becoming rare. Protect it.",
  },
  {
    title: "Can't Hurt Me",
    author: "David Goggins",
    quote:
      '"You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential."',
    note: "Read when the excuse sounds reasonable. It usually isn't.",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    quote:
      '"There is nothing like looking, if you want to find something."',
    note: "The first book that made a long walk feel like an adventure. Still works.",
  },
];

const shelfBooks = document.querySelectorAll("[data-book]");
const openBook = document.querySelector("[data-open-book]");
const bookKicker = document.querySelector("[data-book-kicker]");
const bookTitle = document.querySelector("[data-book-title]");
const bookAuthor = document.querySelector("[data-book-author]");
const bookQuote = document.querySelector("[data-book-quote]");
const bookNote = document.querySelector("[data-book-note]");
const bookNumber = document.querySelector("[data-book-number]");
const pageFlip = document.querySelector("[data-page-flip]");

function renderBook(index) {
  const book = books[index];
  if (!book) return;

  if (bookKicker) bookKicker.textContent = `FIELD NOTE / ${String(index + 1).padStart(2, "0")}`;
  if (bookTitle) bookTitle.textContent = book.title;
  if (bookAuthor) bookAuthor.textContent = book.author;
  if (bookQuote) bookQuote.textContent = book.quote;
  if (bookNote) bookNote.textContent = book.note;
  if (bookNumber) bookNumber.textContent = `${String(index + 1).padStart(2, "0")} / 06`;
}

function selectBook(button) {
  const index = Number(button.dataset.book || 0);
  const book = books[index];
  if (!book) return;

  shelfBooks.forEach((item) => {
    const selected = item === button;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });

  if (prefersReduced || !openBook) {
    renderBook(index);
    return;
  }

  gsap.killTweensOf([openBook, pageFlip]);

  gsap
    .timeline()
    .to(openBook, { opacity: 0.4, duration: 0.12, ease: "power2.in" })
    .call(() => {
      renderBook(index);
      gsap.from(openBook.querySelectorAll(".book-page-left > *, .book-page-right > *"), {
        y: 10,
        opacity: 0,
        duration: 0.42,
        ease: "power3.out",
        stagger: 0.035,
      });
    })
    .to(openBook, { opacity: 1, duration: 0.36, ease: "power2.out" });

  gsap.fromTo(
    pageFlip,
    { opacity: 0, rotateY: 0 },
    {
      opacity: 0.9,
      rotateY: -105,
      duration: 0.58,
      ease: "power2.inOut",
      onComplete: () => gsap.set(pageFlip, { opacity: 0, rotateY: 0 }),
    },
  );
}

shelfBooks.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("is-selected")));
  button.addEventListener("click", () => selectBook(button));
});

/* ------------------------------------------------------------------ */
/*  Back to top + refresh                                              */
/* ------------------------------------------------------------------ */

document.querySelector(".field-top")?.addEventListener("click", () => {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.4 });
  } else {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }
});

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

document.fonts.ready.then(() => ScrollTrigger.refresh());
