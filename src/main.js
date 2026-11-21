import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./style.css";

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ------------------------------------------------------------------ */
/*  Theme lamp                                                         */
/* ------------------------------------------------------------------ */

const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function currentTheme() {
  return root.dataset.theme === "dark" ? "dark" : "light";
}

function setTheme(theme, { persist = true } = {}) {
  const next = theme === "dark" ? "dark" : "light";

  root.dataset.theme = next;
  themeToggle?.classList.toggle("is-on", next === "dark");
  themeToggle?.setAttribute("aria-pressed", String(next === "dark"));
  themeToggle?.setAttribute(
    "aria-label",
    next === "dark" ? "Pull the cord for light mode" : "Pull the cord for dark mode",
  );

  if (themeMeta) {
    themeMeta.setAttribute("content", next === "dark" ? "#0b0b0b" : "#f2f0e9");
  }

  if (persist) {
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch (error) {}
  }

  return next;
}

function toggleTheme() {
  return setTheme(currentTheme() === "dark" ? "light" : "dark");
}

setTheme(currentTheme(), { persist: false });

themeToggle?.addEventListener("click", () => {
  if (themeToggle.classList.contains("is-pulling")) return;

  themeToggle.classList.add("is-pulling");
  window.setTimeout(() => themeToggle.classList.remove("is-pulling"), 560);
  window.setTimeout(toggleTheme, 120);
});

/* ------------------------------------------------------------------ */
/*  Clock                                                              */
/* ------------------------------------------------------------------ */

function updateClock() {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  document.querySelectorAll("[data-time]").forEach((el) => {
    el.textContent = time;
  });
}

updateClock();
window.setInterval(updateClock, 15000);

const sessionHours = document.querySelector("[data-session-h]");
const sessionMinutes = document.querySelector("[data-session-m]");
const sessionSeconds = document.querySelector("[data-session-s]");
let sessionStart = Date.now();

try {
  const savedStart = Number(sessionStorage.getItem("portfolio-session-start"));
  if (Number.isFinite(savedStart) && savedStart > 0) {
    sessionStart = savedStart;
  } else {
    sessionStorage.setItem("portfolio-session-start", String(sessionStart));
  }
} catch (error) {}

function updateSessionClock() {
  if (!sessionHours || !sessionMinutes || !sessionSeconds) return;

  const elapsed = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  sessionHours.textContent = String(hours).padStart(2, "0");
  sessionMinutes.textContent = String(minutes).padStart(2, "0");
  sessionSeconds.textContent = String(seconds).padStart(2, "0");
  sessionSeconds.classList.remove("is-tick");
  void sessionSeconds.offsetWidth;
  sessionSeconds.classList.add("is-tick");
}

updateSessionClock();
window.setInterval(updateSessionClock, 1000);

/* ------------------------------------------------------------------ */
/*  Smooth scroll                                                      */
/* ------------------------------------------------------------------ */

let lenis = null;

if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------------------ */
/*  Header / progress                                                  */
/* ------------------------------------------------------------------ */

const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress span");
let lastScroll = 0;
let lampSwing = 0;
let lampSwingVelocity = 0;
let lampSwingRaf = 0;

function renderLampSwing() {
  themeToggle?.style.setProperty("--lamp-swing", `${lampSwing.toFixed(2)}deg`);
}

function stepLampSwing() {
  lampSwingVelocity += -lampSwing * 0.085;
  lampSwingVelocity *= 0.9;
  lampSwing += lampSwingVelocity;

  if (Math.abs(lampSwing) > 11) {
    lampSwing = Math.sign(lampSwing) * 11;
    lampSwingVelocity *= 0.45;
  }

  renderLampSwing();

  if (Math.abs(lampSwing) > 0.03 || Math.abs(lampSwingVelocity) > 0.03) {
    lampSwingRaf = requestAnimationFrame(stepLampSwing);
  } else {
    lampSwing = 0;
    lampSwingVelocity = 0;
    lampSwingRaf = 0;
    renderLampSwing();
  }
}

function nudgeLampSwing(delta) {
  if (!themeToggle || prefersReduced) return;

  const impulse = Math.max(-5, Math.min(5, delta * 0.12));
  if (Math.abs(impulse) < 0.02) return;

  lampSwingVelocity = Math.max(-8, Math.min(8, lampSwingVelocity + impulse));
  if (!lampSwingRaf) lampSwingRaf = requestAnimationFrame(stepLampSwing);
}

function handleScroll(scroll) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0;
  const scrollDelta = scroll - lastScroll;

  if (Math.abs(scrollDelta) > 0.1) nudgeLampSwing(scrollDelta);
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

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
let menuOpen = false;

function setMenu(open) {
  if (!menuToggle || !mobileMenu) return;

  menuOpen = open;
  mobileMenu.classList.toggle("is-open", open);
  mobileMenu.setAttribute("aria-hidden", String(!open));
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
      lenis.scrollTo(target, { offset: -86, duration: 1.35 });
    } else {
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    }

    history.pushState(null, "", hash);
  });
});

/* ------------------------------------------------------------------ */
/*  Cursor                                                             */
/* ------------------------------------------------------------------ */

const cursor = document.querySelector(".cursor");
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const cursorLabel = document.querySelector(".cursor-label");

if (cursor && isFinePointer && !prefersReduced) {
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
      const label = el.getAttribute("data-cursor");

      if (label) {
        if (cursorLabel) cursorLabel.textContent = label;
        cursor.classList.add("is-active");
      } else {
        cursor.classList.add("is-link");
      }
    });

    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-active", "is-link");
      if (cursorLabel) cursorLabel.textContent = "";
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Magnetic elements                                                  */
/* ------------------------------------------------------------------ */

if (isFinePointer && !prefersReduced) {
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);

      gsap.to(el, {
        x: x * 0.24,
        y: y * 0.24,
        duration: 0.5,
        ease: "power3.out",
      });
    });

    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Split words for scroll-linked colour                               */
/* ------------------------------------------------------------------ */

document.querySelectorAll(".scrub").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";

  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "scrub-word";
    span.textContent = word;
    el.appendChild(span);

    if (index < words.length - 1) {
      el.appendChild(document.createTextNode(" "));
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Preloader + hero intro                                             */
/* ------------------------------------------------------------------ */

const preloader = document.querySelector(".preloader");
const preloaderCount = document.querySelector(".preloader-count");
const preloaderBar = document.querySelector(".preloader-track i");
const heroTitle = document.querySelector(".hero-title");
const heroLines = document.querySelectorAll(".hero-title .line-inner");
const contactLines = document.querySelectorAll(".contact-line .line-inner");

if (!prefersReduced) {
  gsap.set(heroLines, { yPercent: 112 });
  gsap.set(contactLines, { yPercent: 112 });
  gsap.set(".hero-meta", { opacity: 0, y: 12 });
  gsap.set(".hero-copy-wrap", { opacity: 0, y: 28 });
  gsap.set(".terminal-card", { opacity: 0, y: 34, rotate: window.innerWidth > 700 ? 3 : 0 });
}

function playHero() {
  if (prefersReduced) {
    heroTitle?.classList.add("is-lit");
    return;
  }

  const tl = gsap.timeline();

  tl.to(".hero-meta", { opacity: 0.5, y: 0, duration: 0.9, ease: "power3.out" })
    .to(
      heroLines,
      { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.09 },
      "-=0.55",
    )
    .to(".hero-copy-wrap", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.72")
    .to(
      ".terminal-card",
      { opacity: 1, y: 0, rotate: window.innerWidth > 700 ? 0.8 : 0, duration: 1.1, ease: "power3.out" },
      "-=0.85",
    );

  heroTitle?.classList.add("is-lit");
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
      duration: 1.65,
      ease: "power2.inOut",
      onUpdate: () => {
        const value = Math.round(state.value);
        if (preloaderCount) preloaderCount.textContent = String(value).padStart(2, "0");
        if (preloaderBar) preloaderBar.style.width = `${value}%`;
      },
    })
      .to(".preloader-word", { yPercent: -18, opacity: 0, duration: 0.5, ease: "power3.in" }, "-=0.12")
      .to(preloader, { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=0.2");
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
/*  Hero terminal                                                      */
/* ------------------------------------------------------------------ */

const terminal = document.querySelector("[data-terminal]");
const terminalOrbit = document.querySelector("[data-terminal-orbit]");
const terminalWindow = document.querySelector("[data-terminal-window]");
const terminalScroll = terminal?.querySelector("[data-terminal-scroll]");
const terminalForm = terminal?.querySelector("[data-terminal-form]");
const terminalInput = terminal?.querySelector("[data-terminal-input]");
const terminalOutput = terminal?.querySelector("[data-terminal-output]");
const terminalPrompt = terminal?.querySelector("[data-terminal-prompt]");
const terminalDrag = terminal?.querySelector("[data-terminal-drag]");
const terminalMinimize = terminal?.querySelector("[data-terminal-minimize]");
const terminalClose = terminal?.querySelector("[data-terminal-close]");
const terminalLauncher = document.querySelector("[data-terminal-launcher]");
const terminalBadge = terminal?.querySelector("[data-terminal-badge]");

const terminalRoot = {
  type: "dir",
  children: {
    ".ghost": {
      type: "dir",
      children: {
        README: {
          type: "file",
          content: [
            "GHOST PROTOCOL // CTF-01",
            "Three fragments survived the purge.",
            "",
            "1. The operator's own words — about.txt",
            "2. The independent record — experience/independent.md",
            "3. The supply-chain report — projects/scriptsnoop.md",
            "",
            "Each fragment is encoded. Decode, assemble, submit.",
            "Some doors only open after you type: ctf",
          ],
        },
      },
    },
    projects: {
      type: "dir",
      children: {
        "smart-soc.md": {
          type: "file",
          content: [
            "SMART-SOC — ML / SOC / XAI",
            "Alerts that explain themselves.",
            "",
            "An ML-driven SOC analyst workspace that turns noisy alerts into",
            "readable incident context with explainability built in.",
            "",
            "Stack: Python, scikit-learn, SHAP, Streamlit",
            "Repo:  https://github.com/logesh-GIT001/Smart-SOC",
          ],
        },
        "scriptsnoop.md": {
          type: "file",
          content: [
            "SCRIPTSNOOP — SUPPLY CHAIN SECURITY",
            "Shift security left, one commit at a time.",
            "",
            "Static analysis for JavaScript supply-chain risk, exposed secrets",
            "and dangerous install scripts.",
            "",
            "Stack: Python, AST parsing, CI/CD",
            "Repo:  https://github.com/logesh-GIT001",
          ],
        },
        "signal-flare.md": {
          type: "file",
          content: [
            "SIGNAL-FLARE — DECEPTION / EARLY WARNING",
            "Deception as an early warning system.",
            "",
            "A network of low-interaction canaries that surfaces intruder",
            "movement before it reaches production.",
            "",
            "Stack: Python, Docker, network telemetry",
            "Repo:  https://github.com/logesh-GIT001",
          ],
        },
      },
    },
    experience: {
      type: "dir",
      children: {
        "hanodale.md": {
          type: "file",
          content: [
            "HANODALE SOLUTIONS — AI, DEVSECOPS & VAPT INTERN",
            "Sep 2026 — Present",
            "",
            "Worked across AI, DevSecOps and VAPT workstreams.",
            "Performed web application vulnerability assessment using Burp Suite",
            "and manual validation, then applied security practices inside CI/CD.",
          ],
        },
        "aarvion.md": {
          type: "file",
          content: [
            "AARVION SERVICES — SOC / VAPT INTERN",
            "Jan 2026 — Apr 2026",
            "",
            "Hands-on SOC triage, vulnerability assessment and reporting.",
            "Web: https://aarvionservices.com/",
          ],
        },
        "independent.md": {
          type: "file",
          content: [
            "INDEPENDENT BUG HUNTER",
            "2025 — Present",
            "",
            "Responsible disclosures across mobile, web and cloud surfaces.",
            "Acknowledged by Google, NVIDIA and CERT-In.",
          ],
        },
        "tryhackme.md": {
          type: "file",
          content: [
            "TRYHACKME — SOC & BLUE TEAM LABS",
            "2024 — Present",
            "",
            "SOC labs covering brute-force detection, phishing analysis and",
            "alert triage. SIEM-style queries and MITRE ATT&CK mapping.",
          ],
        },
      },
    },
    skills: {
      type: "dir",
      children: {
        "soc.txt": {
          type: "file",
          content: [
            "SOC & DETECTION",
            "- SIEM: Splunk / Microsoft Sentinel",
            "- Alert triage & incident response",
            "- Log analysis & threat hunting",
            "- MITRE ATT&CK mapping",
          ],
        },
        "offensive.txt": {
          type: "file",
          content: [
            "OFFENSE / WEB",
            "- Burp Suite",
            "- XSS & misconfiguration testing",
            "- Recon & parameter fuzzing",
            "- Responsible disclosure",
          ],
        },
        "engineering.txt": {
          type: "file",
          content: [
            "CODE & AUTOMATION",
            "- Python: parsing & automation",
            "- Bash scripting",
            "- ML-driven security tooling",
            "- CI/CD security gates",
          ],
        },
      },
    },
    "about.txt": {
      type: "file",
      content: [
        "LOGESHWARAN S — SECURITY RESEARCHER & SOC ANALYST",
        "Based in Tamil Nadu, India.",
        "",
        "Focus: vulnerability research, SOC operations and detection engineering.",
        "I find what is broken, disclose it responsibly, and build the tools",
        "that keep it from happening again.",
      ],
    },
    "contact.txt": {
      type: "file",
      content: [
        "OPEN CHANNEL",
        "Email:  logesh.spy@gmail.com",
        "GitHub: https://github.com/logesh-GIT001",
        "Status: open to work",
      ],
    },
  },
};

const CTF_PARTS = ["BRO", "YOU", "GOTCHU"];
const CTF_FLAG = CTF_PARTS.join("_");
const CTF_ALIASES = new Set([CTF_PARTS.join("").toLowerCase(), "broyougothchu"]);
const CTF_FRAGMENTS = {
  "about.txt": { label: "1/3", code: "QlJP", answer: "BRO" },
  "experience/independent.md": { label: "2/3", code: "594F55", answer: "YOU" },
  "projects/scriptsnoop.md": { label: "3/3", code: "R09UQ0hV", answer: "GOTCHU" },
};

const ctfState = {
  started: false,
  seen: {},
  decoded: {},
  solved: false,
  hint: 0,
};

try {
  const saved = JSON.parse(localStorage.getItem("portfolio-ctf") || "{}");
  ctfState.started = Boolean(saved.started);
  ctfState.solved = Boolean(saved.solved);
  ctfState.seen = saved.seen && typeof saved.seen === "object" ? saved.seen : {};
  ctfState.decoded = saved.decoded && typeof saved.decoded === "object" ? saved.decoded : {};
} catch (error) {}

function saveCtf() {
  try {
    localStorage.setItem(
      "portfolio-ctf",
      JSON.stringify({
        started: ctfState.started,
        solved: ctfState.solved,
        seen: ctfState.seen,
        decoded: ctfState.decoded,
      }),
    );
  } catch (error) {}
}

function applyCtfSolvedState() {
  if (!terminal) return;
  terminal.classList.toggle("is-ctf-solved", ctfState.solved);
  if (terminalBadge) terminalBadge.hidden = !ctfState.solved;
}

applyCtfSolvedState();

let terminalCwd = [];
const terminalHistory = [];
let terminalHistoryIndex = 0;
let wipeActive = false;

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scrollTerminal() {
  if (terminalScroll) terminalScroll.scrollTop = terminalScroll.scrollHeight;
}

function trimTerminal() {
  if (!terminalOutput) return;
  while (terminalOutput.children.length > 120) {
    terminalOutput.firstElementChild?.remove();
  }
}

function printLine(text = "", className = "") {
  if (!terminalOutput) return;
  const line = document.createElement("p");
  line.className = `terminal-line${className ? ` ${className}` : ""}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
  trimTerminal();
  scrollTerminal();
}

function printHTML(html) {
  if (!terminalOutput) return;
  const line = document.createElement("p");
  line.className = "terminal-line";
  line.innerHTML = html;
  terminalOutput.appendChild(line);
  trimTerminal();
  scrollTerminal();
}

function getTerminalNode(parts) {
  let node = terminalRoot;
  for (const part of parts) {
    if (!node.children?.[part]) return null;
    node = node.children[part];
  }
  return node;
}

function resolveTerminalPath(raw) {
  if (!raw || raw === "~" || raw === "~/") return [];

  let value = raw;
  let base = [...terminalCwd];

  if (value.startsWith("~/")) {
    value = value.slice(2);
    base = [];
  } else if (value === "/home/visitor") {
    value = "";
    base = [];
  } else if (value.startsWith("/home/visitor/")) {
    value = value.slice(14);
    base = [];
  } else if (value.startsWith("/")) {
    value = value.replace(/^\/+/, "");
    base = [];
  }

  for (const segment of value.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      base.pop();
      continue;
    }
    base.push(segment);
  }

  return base;
}

function terminalPromptText() {
  const path = terminalCwd.length ? `~/${terminalCwd.join("/")}` : "~";
  return `visitor@logesh:${path}$`;
}

function updateTerminalPrompt() {
  if (terminalPrompt) terminalPrompt.textContent = terminalPromptText();
}

function printTerminalCommand(command) {
  if (!terminalOutput) return;
  const line = document.createElement("p");
  line.className = "terminal-line";

  const prompt = document.createElement("span");
  prompt.className = "t-path";
  prompt.textContent = `${terminalPromptText()} `;

  const value = document.createElement("span");
  value.className = "t-cmd";
  value.textContent = command;

  line.append(prompt, value);
  terminalOutput.appendChild(line);
  trimTerminal();
  scrollTerminal();
}

function listTerminalDirectory(node, showHidden = false) {
  const entries = Object.entries(node.children || {})
    .filter(([name]) => showHidden || !name.startsWith("."))
    .sort((a, b) => {
      if (a[1].type !== b[1].type) return a[1].type === "dir" ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });

  if (!entries.length) {
    printLine("(empty)", "t-muted");
    return;
  }

  const html = entries
    .map(([name, child]) =>
      child.type === "dir"
        ? `<span class="t-path">${escapeHTML(name)}/</span>`
        : `<span class="t-muted">${escapeHTML(name)}</span>`,
    )
    .join("  ");

  printHTML(html);
}

function printTerminalTree(node, prefix = "") {
  const entries = Object.entries(node.children || {})
    .filter(([name]) => !name.startsWith("."))
    .sort((a, b) => {
      if (a[1].type !== b[1].type) return a[1].type === "dir" ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });

  entries.forEach(([name, child], index) => {
    const last = index === entries.length - 1;
    const branch = last ? "└── " : "├── ";
    const label =
      child.type === "dir"
        ? `<span class="t-path">${escapeHTML(name)}/</span>`
        : `<span class="t-muted">${escapeHTML(name)}</span>`;

    printHTML(`${escapeHTML(prefix)}${branch}${label}`);

    if (child.type === "dir") {
      printTerminalTree(child, `${prefix}${last ? "    " : "│   "}`);
    }
  });
}

function showTerminalHelp() {
  printLine("available commands:", "t-muted");
  [
    ["ls [-a] [path]", "list directory"],
    ["cd <path>", "change directory"],
    ["cat <file>", "read a file"],
    ["tree", "show the full tree"],
    ["pwd", "print working directory"],
    ["whoami", "who is logged in"],
    ["date", "show the current time"],
    ["theme [dark|light]", "switch the lamp"],
    ["ctf", "start the hidden challenge"],
    ["hint", "ask the ghost for a clue"],
    ["fragments", "show recovered fragments"],
    ["decode <value>", "decode a fragment"],
    ["flag <value>", "submit the flag"],
    ["clear", "clear the screen"],
  ].forEach(([command, description]) => {
    printHTML(
      `<span class="t-cmd">${escapeHTML(command)}</span>  <span class="t-muted">${escapeHTML(description)}</span>`,
    );
  });
}

function ctfPathKey(parts) {
  return parts.join("/");
}

function revealCtfFragment(parts) {
  if (!ctfState.started || ctfState.solved) return;
  const key = ctfPathKey(parts);
  const fragment = CTF_FRAGMENTS[key];
  if (!fragment) return;

  ctfState.seen[key] = true;
  saveCtf();
  printLine("");
  printLine(`FRAGMENT ${fragment.label} — ${fragment.code}`, "t-acid");
  printLine(`decode it: decode ${fragment.code}`, "t-muted");
}

function decodeCtfValue(value) {
  const clean = value.trim();
  if (!clean) return null;

  try {
    if (/^[0-9a-f]+$/i.test(clean) && clean.length % 2 === 0) {
      let output = "";
      for (let index = 0; index < clean.length; index += 2) {
        output += String.fromCharCode(parseInt(clean.slice(index, index + 2), 16));
      }
      return output;
    }
    return atob(clean);
  } catch (error) {
    return null;
  }
}

function showCtfBriefing() {
  if (ctfState.solved) {
    printLine("CTF-01 // ALREADY SOLVED", "t-ok");
    printLine(`flag: ${CTF_FLAG}`, "t-acid");
    printLine("You already found the way. The ghost remembers.", "t-muted");
    return;
  }

  ctfState.started = true;
  saveCtf();

  printLine("CTF-01 // CAN YOU FIND THE WAY TO DESTROY THIS SITE?", "t-acid");
  printLine("A ghost left three fragments inside this machine.", "t-muted");
  printLine("The destructive path is real: rm -rf * purges this interface, then rebuilds it.", "t-muted");
  printLine("Destruction is a red herring. The flag survives the rebuild.", "t-muted");
  printLine("Read the operator's story, recover the pieces, assemble the flag.", "t-muted");
  printLine("");
  printLine("start here:  ls -a", "t-ok");
  printLine("then read:   cat .ghost/README", "t-ok");
  printLine("stuck:       hint", "t-muted");
  printLine("submit:      flag <answer>", "t-muted");
}

function showCtfHint() {
  if (!ctfState.started) {
    printLine("ctf not started. run: ctf", "t-muted");
    return;
  }

  if (ctfState.solved) {
    printLine("The flag is already yours: " + CTF_FLAG, "t-ok");
    return;
  }

  const hints = [
    "The ghost hid a directory. Run `ls -a`, then `cat .ghost/README`.",
    "Read the operator's own files: `cat about.txt`, `cat experience/independent.md`, `cat projects/scriptsnoop.md`.",
    "Each fragment is encoded. Try `decode QlJP` and see what comes back.",
    "Recover all three fragments, then join them with underscores.",
    "Final nudge: BRO + YOU + GOTCHU. Submit with `flag BRO_YOU_GOTCHU`.",
  ];

  const hint = hints[Math.min(ctfState.hint, hints.length - 1)];
  ctfState.hint = Math.min(ctfState.hint + 1, hints.length);
  printLine(`hint ${String(ctfState.hint).padStart(2, "0")} // ${hint}`, "t-muted");
}

function showCtfFragments() {
  if (!ctfState.started) {
    printLine("ctf not started. run: ctf", "t-muted");
    return;
  }

  printLine("CTF-01 // FRAGMENT STATUS", "t-muted");
  Object.entries(CTF_FRAGMENTS).forEach(([path, fragment]) => {
    const seen = Boolean(ctfState.seen[path]);
    const decoded = Boolean(ctfState.decoded[path]);
    const code = seen ? fragment.code : "???";
    const answer = decoded ? fragment.answer : "locked";
    printHTML(
      `<span class="t-path">${escapeHTML(fragment.label)}</span>  <span class="t-muted">${escapeHTML(path)}</span>  <span class="t-cmd">${escapeHTML(code)}</span>  <span class="${decoded ? "t-ok" : "t-muted"}">${escapeHTML(answer)}</span>`,
    );
  });
}

function submitCtfFlag(value) {
  const answer = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!answer) {
    printLine("usage: flag <answer>", "t-muted");
    return;
  }

  if (!ctfState.started) {
    printLine("ctf not started. run: ctf", "t-muted");
    return;
  }

  const recovered = Object.keys(CTF_FRAGMENTS).filter((path) => ctfState.decoded[path]).length;
  if (recovered < Object.keys(CTF_FRAGMENTS).length) {
    printLine(`flag rejected. fragments recovered: ${recovered}/3`, "t-err");
    printLine("Try: fragments", "t-muted");
    return;
  }

  if (!CTF_ALIASES.has(answer)) {
    printLine("flag rejected. not enough signal.", "t-err");
    printLine("Try: fragments", "t-muted");
    return;
  }

  ctfState.solved = true;
  saveCtf();
  applyCtfSolvedState();
  printLine("");
  printLine("FLAG ACCEPTED", "t-ok");
  printLine(CTF_FLAG, "t-acid");
  printLine("bro, you gotchu. You are in the 0.1% who found this.", "t-muted");
  printLine("The portfolio is still intact. The ghost kept its promise.", "t-muted");
}

function runTerminalCommand(raw) {
  const command = raw.trim();
  if (!command) return;

  const tokens = command.split(/\s+/);
  const name = tokens[0].toLowerCase();
  const args = tokens.slice(1);

  if (name === "clear") {
    if (terminalOutput) terminalOutput.innerHTML = "";
    return;
  }

  if (name === "help") {
    showTerminalHelp();
    return;
  }

  if (name === "ls" || name === "dir") {
    const flags = args.filter((arg) => arg.startsWith("-"));
    const pathArg = args.find((arg) => !arg.startsWith("-"));
    const showHidden = flags.some((flag) => flag.toLowerCase().includes("a"));
    const parts = pathArg ? resolveTerminalPath(pathArg) : [...terminalCwd];
    const node = getTerminalNode(parts);

    if (!node) {
      printLine(`ls: cannot access '${pathArg}': No such file or directory`, "t-err");
      return;
    }

    if (node.type === "file") {
      printLine(parts[parts.length - 1], "t-muted");
      return;
    }

    listTerminalDirectory(node, showHidden);
    return;
  }

  if (name === "cd") {
    const parts = resolveTerminalPath(args[0] || "~");
    const node = getTerminalNode(parts);

    if (!node) {
      printLine(`cd: no such file or directory: ${args[0] || "~"}`, "t-err");
      return;
    }

    if (node.type !== "dir") {
      printLine(`cd: not a directory: ${args[0]}`, "t-err");
      return;
    }

    terminalCwd = parts;
    updateTerminalPrompt();
    return;
  }

  if (name === "cat") {
    if (!args.length) {
      printLine("cat: missing file operand", "t-err");
      return;
    }

    const parts = resolveTerminalPath(args.join(" "));
    const node = getTerminalNode(parts);

    if (!node) {
      printLine(`cat: ${args.join(" ")}: No such file or directory`, "t-err");
      return;
    }

    if (node.type === "dir") {
      printLine(`cat: ${args.join(" ")}: Is a directory`, "t-err");
      return;
    }

    node.content.forEach((line) => printLine(line));
    revealCtfFragment(parts);
    return;
  }

  if (name === "tree") {
    printLine("/home/visitor");
    printTerminalTree(terminalRoot);
    return;
  }

  if (name === "pwd") {
    printLine(`/home/visitor${terminalCwd.length ? `/${terminalCwd.join("/")}` : ""}`);
    return;
  }

  if (name === "whoami") {
    printLine("visitor");
    return;
  }

  if (name === "date") {
    printLine(new Date().toString());
    return;
  }

  if (name === "theme") {
    const target = args[0]?.toLowerCase();
    if (target === "dark" || target === "light") {
      setTheme(target);
    } else {
      toggleTheme();
    }
    printLine(`lamp: ${currentTheme()} mode`, "t-muted");
    return;
  }

  if (name === "ctf") {
    showCtfBriefing();
    return;
  }

  if (name === "hint") {
    showCtfHint();
    return;
  }

  if (name === "fragments") {
    showCtfFragments();
    return;
  }

  if (name === "decode") {
    const value = args.find((arg) => !arg.startsWith("-"));
    if (!value) {
      printLine("usage: decode <value>", "t-muted");
      return;
    }

    const decoded = decodeCtfValue(value);
    if (decoded === null) {
      printLine("decode: invalid input", "t-err");
      return;
    }

    printLine(`decoded: ${decoded}`, "t-ok");

    if (ctfState.started) {
      const match = Object.entries(CTF_FRAGMENTS).find(
        ([, fragment]) => fragment.code.toLowerCase() === value.toLowerCase(),
      );
      if (match) {
        const [path, fragment] = match;
        ctfState.decoded[path] = true;
        saveCtf();
        printLine(`fragment ${fragment.label} recovered: ${fragment.answer}`, "t-acid");
      }
    }
    return;
  }

  if (name === "flag") {
    submitCtfFlag(args.join(" "));
    return;
  }

  if (name === "sudo") {
    const rest = args.join(" ").toLowerCase();
    if (rest.includes("rm") && rest.includes("-rf")) {
      printLine("sudo: authentication bypass detected", "t-warn");
      window.setTimeout(() => triggerWipe(command), 260);
      return;
    }
    printLine("visitor is not in the sudoers file. This incident will be reported.", "t-err");
    return;
  }

  if (name === "rm") {
    const flags = args.filter((arg) => arg.startsWith("-"));
    const force = flags.some((flag) => flag.toLowerCase().includes("f"));
    const recursive = flags.some((flag) => flag.toLowerCase().includes("r"));

    if (force && recursive) {
      printLine("rm: recursive force delete requested", "t-warn");
      window.setTimeout(() => triggerWipe(command), 260);
      return;
    }

    printLine("rm: operation not permitted: portfolio filesystem is read-only", "t-err");
    return;
  }

  printLine(`${name}: command not found`, "t-err");
}

if (terminal && terminalForm && terminalInput && terminalOutput) {
  updateTerminalPrompt();

  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = terminalInput.value.trim();
    if (!command) return;

    terminalInput.value = "";
    terminalHistory.push(command);
    terminalHistoryIndex = terminalHistory.length;
    printTerminalCommand(command);
    runTerminalCommand(command);
  });

  terminalInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      if (!terminalHistory.length) return;
      event.preventDefault();
      terminalHistoryIndex = Math.max(0, terminalHistoryIndex - 1);
      terminalInput.value = terminalHistory[terminalHistoryIndex] || "";
      terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
    }

    if (event.key === "ArrowDown") {
      if (!terminalHistory.length) return;
      event.preventDefault();
      terminalHistoryIndex = Math.min(terminalHistory.length, terminalHistoryIndex + 1);
      terminalInput.value = terminalHistory[terminalHistoryIndex] || "";
      terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
    }
  });

  terminal.addEventListener("pointerdown", (event) => {
    if (event.target.closest("input, button, a, label")) return;
    terminalInput.focus({ preventScroll: true });
  });

  function setTerminalMinimized(minimized) {
    terminal.classList.toggle("is-minimized", minimized);
    if (!terminalMinimize) return;
    terminalMinimize.setAttribute("aria-pressed", String(minimized));
    terminalMinimize.setAttribute(
      "aria-label",
      minimized ? "Restore terminal" : "Minimize terminal",
    );
    terminalMinimize.textContent = minimized ? "+" : "−";
  }

  terminalMinimize?.addEventListener("click", (event) => {
    event.stopPropagation();
    setTerminalMinimized(!terminal.classList.contains("is-minimized"));
  });

  terminalClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    terminalInput.blur();
    terminalOrbit?.classList.add("is-closed");
    if (terminalLauncher) terminalLauncher.hidden = false;
  });

  terminalLauncher?.addEventListener("click", () => {
    terminalOrbit?.classList.remove("is-closed");
    terminalLauncher.hidden = true;
    setTerminalMinimized(false);
    terminalInput.focus({ preventScroll: true });
  });

  let terminalDragState = null;

  terminalDrag?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();

    const rect = terminal.getBoundingClientRect();
    terminalDragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: Number(terminalWindow?.dataset.dragX || 0),
      baseY: Number(terminalWindow?.dataset.dragY || 0),
      rect,
    };

    terminalWindow?.classList.add("is-dragging");
    terminalDrag.setPointerCapture?.(event.pointerId);
  });

  terminalDrag?.addEventListener("pointermove", (event) => {
    if (!terminalDragState || !terminalWindow) return;

    const dx = event.clientX - terminalDragState.startX;
    const dy = event.clientY - terminalDragState.startY;
    const minX = 8 - terminalDragState.rect.left;
    const maxX = window.innerWidth - 8 - terminalDragState.rect.right;
    const minY = 8 - terminalDragState.rect.top;
    const maxY = window.innerHeight - 8 - terminalDragState.rect.bottom;
    const nextX = terminalDragState.baseX + Math.min(Math.max(dx, minX), maxX);
    const nextY = terminalDragState.baseY + Math.min(Math.max(dy, minY), maxY);

    terminalWindow.dataset.dragX = String(nextX);
    terminalWindow.dataset.dragY = String(nextY);
    terminalWindow.style.transform = `translate(${nextX}px, ${nextY}px)`;
  });

  function endTerminalDrag(event) {
    if (!terminalDragState) return;
    terminalDrag?.releasePointerCapture?.(terminalDragState.pointerId);
    terminalDragState = null;
    terminalWindow?.classList.remove("is-dragging");
    if (event) event.preventDefault();
  }

  terminalDrag?.addEventListener("pointerup", endTerminalDrag);
  terminalDrag?.addEventListener("pointercancel", endTerminalDrag);

  terminalDrag?.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    if (!terminalWindow) return;
    terminalWindow.style.transform = "";
    terminalWindow.dataset.dragX = "0";
    terminalWindow.dataset.dragY = "0";
  });
}

/* ------------------------------------------------------------------ */
/*  Destructive command recovery                                       */
/* ------------------------------------------------------------------ */

function triggerWipe(command = "rm -rf /") {
  if (wipeActive) return;
  wipeActive = true;

  const screen = document.querySelector("[data-wipe]");
  const log = document.querySelector("[data-wipe-log]");
  const count = document.querySelector("[data-wipe-count]");
  const label = document.querySelector("[data-wipe-label]");
  const title = document.querySelector("[data-wipe-title]");

  if (!screen) {
    wipeActive = false;
    return;
  }

  if (lenis) lenis.stop();

  const siteParts = gsap.utils.toArray(
    ".site-header, main > section, .ticker, .footer, .lamp, .session-clock, .terminal-launcher",
  );
  gsap.killTweensOf(siteParts);

  if (log) log.innerHTML = "";
  if (title) title.textContent = "SYSTEM PURGE INITIATED";
  if (count) count.textContent = "000";
  if (label) label.textContent = "SNAPSHOT RECOVERY ARMED";
  screen.classList.remove("is-revealed", "is-rebuilding");
  document.body.classList.add("is-breaking");
  screen.classList.add("is-visible", "is-dissolving");
  screen.setAttribute("aria-hidden", "false");

  runWipeSequence();

  if (!prefersReduced) {
    gsap
      .timeline()
      .to(siteParts, {
        duration: 0.05,
        repeat: 18,
        repeatRefresh: true,
        x: () => gsap.utils.random(-16, 16),
        y: () => gsap.utils.random(-10, 10),
        skewX: () => gsap.utils.random(-2.2, 2.2),
        filter: () =>
          `invert(${Math.random() > 0.5 ? 1 : 0}) hue-rotate(${gsap.utils.random(-40, 40)}deg)`,
        ease: "steps(1)",
      })
      .to(
        siteParts,
        {
          duration: 8,
          x: () => gsap.utils.random(-70, 70),
          y: () => gsap.utils.random(-55, 55),
          rotation: () => gsap.utils.random(-3, 3),
          scale: () => gsap.utils.random(0.8, 1.06),
          opacity: 0,
          filter: "blur(16px)",
          stagger: { amount: 1, from: "random" },
          ease: "power2.in",
        },
        1,
      );
  }

  window.setTimeout(finishPurge, prefersReduced ? 1200 : 10000);

  function runWipeSequence() {
    const lines = [
      [`$ ${command}`, "ok"],
      ["[ok] kernel panic handler engaged", "ok"],
      ["unmounting /home/visitor...", "muted"],
      ["unlinking inode 0x7f3a...", "muted"],
      ["dropping page cache...", "muted"],
      ["removing /home/visitor/projects...", "muted"],
      ["removing /home/visitor/experience...", "muted"],
      ["removing /home/visitor/skills...", "muted"],
      ["removing /etc...", "muted"],
      ["removing /var...", "muted"],
      ["removing /usr...", "muted"],
      ["kernel: I/O error, dev nvme0n1, sector 88214", "err"],
      ["ext4-fs error: unable to read inode block", "err"],
      ["segmentation fault (core dumped)", "err"],
      ["signal 11 received — process terminated", "err"],
      ["snapshot daemon: no response", "err"],
      ["reality check failed", "err"],
      ["system integrity: 0%", "err"],
    ];

    if (log) log.innerHTML = "";

    lines.forEach(([text, className], index) => {
      window.setTimeout(() => {
        if (!log) return;
        const line = document.createElement("span");
        line.className = className;
        line.textContent = text;
        log.appendChild(line);
      }, index * 480);
    });
  }

  function finishPurge() {
    document.body.classList.remove("is-breaking");
    document.body.classList.add("is-wiped");
    screen.classList.remove("is-dissolving");
    screen.classList.add("is-revealed");
    if (title) title.textContent = "YOU THINK YOU CAN BREAK ME LIKE THAT?";
    window.setTimeout(startRebuild, 2600);
  }

  function startRebuild() {
    document.body.classList.remove("is-wiped");
    document.body.classList.add("is-rebuilding");
    screen.classList.add("is-rebuilding");
    if (label) label.textContent = "REBUILDING INTERFACE";
    if (count) count.textContent = "000";
    if (log) log.innerHTML = "";

    const rebuildLines = [
      "snapshot daemon: online",
      "recompiling layout...",
      "restoring 3d geometry...",
      "reassembling /home/visitor...",
      "nothing is ever really gone.",
    ];

    rebuildLines.forEach((text, index) => {
      window.setTimeout(() => {
        if (!log) return;
        const line = document.createElement("span");
        line.className = index === 0 ? "ok" : "muted";
        line.textContent = text;
        log.appendChild(line);
      }, index * 360);
    });

    if (prefersReduced) {
      gsap.set(siteParts, { clearProps: "all" });
    } else {
      gsap.set(siteParts, { clearProps: "all" });
      gsap.fromTo(
        siteParts,
        {
          opacity: 0,
          z: -1500,
          y: 110,
          rotationX: 28,
          rotationY: () => gsap.utils.random(-12, 12),
          scale: 0.55,
          filter: "blur(18px)",
          transformPerspective: 1500,
          transformOrigin: "50% 60%",
        },
        {
          opacity: 1,
          z: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.4,
          stagger: { amount: 4, from: "random" },
          ease: "power3.out",
          clearProps: "filter,transform,opacity",
        },
      );
    }

    let progress = 0;
    const progressTimer = window.setInterval(() => {
      progress = Math.min(100, progress + 2);
      if (count) count.textContent = String(progress).padStart(3, "0");
      if (progress >= 100) window.clearInterval(progressTimer);
    }, 120);

    window.setTimeout(() => {
      window.clearInterval(progressTimer);
      screen.classList.remove("is-visible", "is-rebuilding", "is-revealed");
      screen.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-rebuilding");
      gsap.set(siteParts, { clearProps: "all" });
      if (lenis) lenis.start();
      wipeActive = false;
    }, prefersReduced ? 1600 : 7200);
  }
}

/* ------------------------------------------------------------------ */
/*  Scroll reveals                                                     */
/* ------------------------------------------------------------------ */

if (!prefersReduced) {
  gsap.utils.toArray(".reveal-heading").forEach((el) => {
    gsap.from(el, {
      y: 50,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  gsap.utils.toArray(".scrub").forEach((el) => {
    const words = el.querySelectorAll(".scrub-word");
    gsap.fromTo(
      words,
      { color: "#858176" },
      {
        color: "#0d0d0c",
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          end: "bottom 48%",
          scrub: true,
        },
      },
    );
  });

  gsap.utils.toArray("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count || 0);
    const pad = Number(el.dataset.pad || 0);
    const state = { value: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(state, {
          value: target,
          duration: 1.7,
          ease: "power2.out",
          onUpdate: () => {
            const value = String(Math.round(state.value));
            el.textContent = pad ? value.padStart(pad, "0") : value;
          },
        });
      },
    });
  });

  gsap.to(".contact-line .line-inner", {
    yPercent: 0,
    duration: 1.25,
    ease: "power4.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".contact", start: "top 68%", once: true },
  });

  gsap.to(".hero-glow", {
    yPercent: 24,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
}

/* ------------------------------------------------------------------ */
/*  Project cards                                                      */
/* ------------------------------------------------------------------ */

gsap.utils.toArray("[data-project]").forEach((card) => {
  ScrollTrigger.create({
    trigger: card,
    start: "top 74%",
    once: true,
    onEnter: () => card.classList.add("in-view"),
  });

  if (!prefersReduced) {
    gsap.from(card.querySelectorAll(".project-copy > *"), {
      y: 26,
      opacity: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.06,
      scrollTrigger: { trigger: card, start: "top 70%", once: true },
    });

    gsap.from(card.querySelector(".project-visual"), {
      y: 42,
      opacity: 0,
      scale: 0.97,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 70%", once: true },
    });
  }
});

const createHorizontalGallery = ({ section, track, cards, panFill }) => {
  if (!section || !track || !cards.length) return null;

  section.classList.add("is-horizontal");

  const getPad = () => parseFloat(getComputedStyle(section).paddingLeft) || 0;
  const getDistance = () =>
    Math.max(0, track.scrollWidth - (section.clientWidth - getPad() * 2));

  let cardLayout = [];

  const measureCards = () => {
    cardLayout = cards.map((card) => ({
      left: card.offsetLeft,
      width: card.offsetWidth,
    }));
  };

  measureCards();

  const updateSpiral = () => {
    if (!section.classList.contains("is-horizontal")) return;

    const sectionRect = section.getBoundingClientRect();
    if (sectionRect.bottom < -40 || sectionRect.top > window.innerHeight + 40) return;

    const trackLeft = track.getBoundingClientRect().left;
    const viewportCenter = window.innerWidth / 2;
    const span = Math.max(1, window.innerWidth * 0.52);

    cards.forEach((card, index) => {
      const layout = cardLayout[index] || {
        left: card.offsetLeft,
        width: card.offsetWidth,
      };
      const cardCenter = trackLeft + layout.left + layout.width / 2;
      const delta = gsap.utils.clamp(-1, 1, (cardCenter - viewportCenter) / span);

      gsap.set(card, {
        rotationY: -delta * 26,
        z: -Math.abs(delta) * 260,
        rotate: delta * 7,
        y: delta * 30,
      });
    });
  };

  const onRefresh = () => {
    measureCards();
    updateSpiral();
  };

  gsap.ticker.add(updateSpiral);
  ScrollTrigger.addEventListener("refresh", onRefresh);
  updateSpiral();

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + (getDistance() + window.innerHeight * 0.65),
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh,
      onUpdate: (self) => {
        if (panFill) panFill.style.transform = `scaleX(${self.progress})`;
      },
    },
  });

  tl.to(track, { x: () => -getDistance(), ease: "none", duration: 1 }, 0);

  return () => {
    gsap.ticker.remove(updateSpiral);
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    cards.forEach((card) => gsap.set(card, { clearProps: "transform" }));
    section.classList.remove("is-horizontal");
    if (panFill) panFill.style.transform = "";
  };
};

const horizontalMedia = gsap.matchMedia();

horizontalMedia.add("(min-width: 1180px) and (min-height: 760px)", () => {
  if (prefersReduced) return;

  const work = document.querySelector(".work");

  const cleanup = createHorizontalGallery({
    section: work,
    track: work?.querySelector(".projects"),
    cards: work ? gsap.utils.toArray(".work [data-project]") : [],
    panFill: work?.querySelector(".work-pan-track i"),
  });

  return () => cleanup?.();
});

const vaultMedia = gsap.matchMedia();

vaultMedia.add("(min-width: 1180px) and (min-height: 760px)", () => {
  if (prefersReduced) return;

  const vault = document.querySelector("[data-experience-vault]");
  if (!vault) return;

  const cards = [...vault.querySelectorAll("[data-experience-card]")];
  const nodes = [...vault.querySelectorAll("[data-vault-node]")];
  const fill = vault.querySelector("[data-vault-fill]");
  const scanner = vault.querySelector("[data-vault-scanner]");
  const dial = vault.querySelector("[data-vault-dial]");
  const index = vault.querySelector("[data-vault-index]");
  const status = vault.querySelector("[data-vault-status]");

  if (!cards.length) return;

  let activeStep = -1;

  const setStep = (step) => {
    const next = Math.max(0, Math.min(cards.length - 1, step));
    if (next === activeStep) return;

    activeStep = next;

    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === next);
    });

    nodes.forEach((node, nodeIndex) => {
      node.classList.toggle("is-active", nodeIndex === next);
      node.classList.toggle("is-passed", nodeIndex < next);
    });

    if (index) index.textContent = String(next + 1).padStart(2, "0");
    if (status) {
      status.textContent = `Access ${String(next + 1).padStart(2, "0")} / ${String(
        cards.length,
      ).padStart(2, "0")}`;
    }
  };

  vault.classList.add("is-vault");
  setStep(0);

  if (fill) fill.style.height = "0%";
  if (scanner) scanner.style.top = "0%";
  if (dial) dial.style.transform = "rotate(0deg)";

  const trigger = ScrollTrigger.create({
    trigger: vault,
    start: "top top",
    end: () => "+=" + window.innerHeight * 2.4,
    pin: true,
    scrub: 0.8,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = self.progress;

      if (fill) fill.style.height = `${progress * 100}%`;
      if (scanner) scanner.style.top = `${progress * 100}%`;
      if (dial) dial.style.transform = `rotate(${progress * 270}deg)`;

      setStep(Math.min(cards.length - 1, Math.floor(progress * cards.length)));
    },
  });

  return () => {
    trigger.kill();
    vault.classList.remove("is-vault");
    cards.forEach((card) => card.classList.remove("is-active"));
    if (fill) fill.style.height = "";
    if (scanner) scanner.style.top = "";
    if (dial) dial.style.transform = "";
    if (index) index.textContent = "01";
    if (status) status.textContent = `Access 01 / ${String(cards.length).padStart(2, "0")}`;
  };
});

/* ------------------------------------------------------------------ */
/*  Disclosure flashcard                                               */
/* ------------------------------------------------------------------ */

const disclosureRows = [...document.querySelectorAll(".disclosure-row")];
const proofFlash = document.querySelector("[data-proof-flash]");
const proofFlashBackdrop = document.querySelector("[data-proof-flash-backdrop]");
const proofFlashCard = document.querySelector("[data-proof-flash-card]");
const proofFlashIndex = document.querySelector("[data-proof-flash-index]");
const proofFlashStatus = document.querySelector("[data-proof-flash-status]");
const proofFlashYear = document.querySelector("[data-proof-flash-year]");
const proofFlashTitle = document.querySelector("[data-proof-flash-title]");
const proofFlashProgram = document.querySelector("[data-proof-flash-program]");
const proofFlashCopy = document.querySelector("[data-proof-flash-copy]");
const proofFlashTag = document.querySelector("[data-proof-flash-tag]");
const proofFlashWatermark = document.querySelector("[data-proof-flash-watermark]");

let proofFlashRow = null;
let proofFlashOpen = false;

function hideProofFlash() {
  if (!proofFlash || !proofFlashCard || !proofFlashBackdrop) return;
  proofFlash.classList.remove("is-open");
  proofFlash.setAttribute("aria-hidden", "true");
  gsap.set(proofFlashCard, { clearProps: "transform,opacity,filter" });
  gsap.set(proofFlashBackdrop, { clearProps: "opacity" });
}

function openProofFlash(row) {
  if (!proofFlash || !proofFlashCard || !proofFlashBackdrop || proofFlashOpen) return;

  const disclosure = row.closest(".disclosure");
  const panel = disclosure?.querySelector(".d-panel");
  const read = (selector) => row.querySelector(selector)?.textContent.trim() || "";

  proofFlashCard.dataset.tone = row.dataset.tone || "paper";
  if (proofFlashIndex) proofFlashIndex.textContent = read(".d-index");
  if (proofFlashStatus) proofFlashStatus.textContent = read(".d-status");
  if (proofFlashYear) proofFlashYear.textContent = read(".d-year");
  if (proofFlashTitle) proofFlashTitle.textContent = read(".d-org");
  if (proofFlashProgram) proofFlashProgram.textContent = read(".d-program");
  if (proofFlashCopy) proofFlashCopy.textContent = panel?.querySelector("p")?.textContent.trim() || "";
  if (proofFlashTag) proofFlashTag.textContent = panel?.querySelector(".d-tag")?.textContent.trim() || "";
  if (proofFlashWatermark) proofFlashWatermark.textContent = read(".d-index");

  proofFlashRow = row;
  proofFlashOpen = true;
  disclosureRows.forEach((other) => other.setAttribute("aria-expanded", String(other === row)));
  proofFlash.classList.add("is-open");
  proofFlash.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-proof-open");
  if (lenis) lenis.stop();

  proofFlashCard.scrollTop = 0;
  gsap.killTweensOf([proofFlashCard, proofFlashBackdrop]);
  gsap.set(proofFlashCard, {
    clearProps: "transform,opacity,filter",
  });
  gsap.set(proofFlashBackdrop, { clearProps: "opacity" });
  gsap.set(proofFlashCard, {
    xPercent: -50,
    yPercent: -50,
    transformPerspective: 1200,
    transformOrigin: "50% 50%",
  });

  const rowRect = row.getBoundingClientRect();
  const cardRect = proofFlashCard.getBoundingClientRect();
  const targetX = rowRect.left + rowRect.width / 2 - window.innerWidth / 2;
  const targetY = rowRect.top + rowRect.height / 2 - window.innerHeight / 2;
  const targetScale = Math.min(0.62, Math.max(0.32, rowRect.width / cardRect.width));

  if (prefersReduced) {
    gsap.set(proofFlashCard, { opacity: 1 });
    gsap.set(proofFlashBackdrop, { opacity: 1 });
  } else {
    gsap.fromTo(
      proofFlashCard,
      {
        x: targetX,
        y: targetY,
        scale: targetScale,
        rotationY: -96,
        opacity: 0.25,
        filter: "blur(8px)",
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        rotationY: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.72,
        ease: "power3.out",
        clearProps: "filter",
      },
    );
    gsap.fromTo(proofFlashBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.35 });
  }

  proofFlashCard.focus({ preventScroll: true });
}

function closeProofFlash() {
  if (!proofFlashOpen || !proofFlash || !proofFlashCard || !proofFlashBackdrop) return;

  const row = proofFlashRow;
  const rowRect = row?.getBoundingClientRect();
  const cardRect = proofFlashCard.getBoundingClientRect();
  const targetX = rowRect
    ? rowRect.left + rowRect.width / 2 - window.innerWidth / 2
    : 0;
  const targetY = rowRect
    ? rowRect.top + rowRect.height / 2 - window.innerHeight / 2
    : 0;
  const targetScale = rowRect
    ? Math.min(0.62, Math.max(0.32, rowRect.width / cardRect.width))
    : 0.6;

  proofFlashOpen = false;
  proofFlashRow = null;
  row?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("is-proof-open");
  if (lenis) lenis.start();

  gsap.killTweensOf([proofFlashCard, proofFlashBackdrop]);

  if (prefersReduced) {
    hideProofFlash();
  } else {
    gsap
      .timeline({ onComplete: hideProofFlash })
      .to(
        proofFlashCard,
        {
          x: targetX,
          y: targetY,
          scale: targetScale,
          rotationY: 180,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.62,
          ease: "power2.in",
        },
        0,
      )
      .to(proofFlashBackdrop, { opacity: 0, duration: 0.38, ease: "power2.out" }, 0);
  }

  row?.focus({ preventScroll: true });
  window.setTimeout(() => ScrollTrigger.refresh(), 700);
}

disclosureRows.forEach((row) => {
  row.addEventListener("click", () => openProofFlash(row));
});

proofFlashBackdrop?.addEventListener("click", closeProofFlash);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && proofFlashOpen) closeProofFlash();
});

/* ------------------------------------------------------------------ */
/*  Active nav                                                         */
/* ------------------------------------------------------------------ */

const navLinks = [...document.querySelectorAll("[data-nav]")];
const sections = ["about", "work", "proof", "arsenal", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${entry.target.id}`,
          );
        });
      });
    },
    { rootMargin: "-38% 0px -56% 0px", threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
}

/* ------------------------------------------------------------------ */
/*  Copy email                                                         */
/* ------------------------------------------------------------------ */

const copyButton = document.querySelector(".copy-email");
const copyLabel = copyButton?.querySelector(".copy-label");

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("logesh.spy@gmail.com");
    if (copyLabel) copyLabel.textContent = "Copied ✓";
    copyButton.classList.add("is-copied");

    window.setTimeout(() => {
      if (copyLabel) copyLabel.textContent = "Copy email";
      copyButton.classList.remove("is-copied");
    }, 2200);
  } catch {
    window.location.href = "mailto:logesh.spy@gmail.com";
  }
});

/* ------------------------------------------------------------------ */
/*  Letter station                                                     */
/* ------------------------------------------------------------------ */

const letterScene = document.querySelector("[data-letter-scene]");
const letterStage = document.querySelector("[data-letter-stage]");
const letterForm = document.querySelector("[data-letter-form]");
const letterCard = document.querySelector("[data-letter-card]");
const letterEnvelope = document.querySelector("[data-letter-envelope]");
const letterDove = document.querySelector("[data-letter-dove]");
const letterSuccess = document.querySelector("[data-letter-success]");
const letterError = document.querySelector("[data-letter-error]");
const letterDraft = document.querySelector("[data-letter-draft]");
const letterAgain = document.querySelector("[data-letter-again]");
const letterName = letterForm?.querySelector('[name="name"]');
const letterEmail = letterForm?.querySelector('[name="email"]');
const letterMessage = letterForm?.querySelector('[name="message"]');

let letterBusy = false;

if (
  letterScene &&
  letterStage &&
  letterForm &&
  letterCard &&
  letterEnvelope &&
  letterDove &&
  letterSuccess &&
  letterError &&
  letterName &&
  letterEmail &&
  letterMessage
) {
  if (isFinePointer && !prefersReduced) {
    gsap.set(letterCard, { transformPerspective: 1000 });

    const rotateX = gsap.quickTo(letterCard, "rotationX", { duration: 0.7, ease: "power3" });
    const rotateY = gsap.quickTo(letterCard, "rotationY", { duration: 0.7, ease: "power3" });

    letterStage.addEventListener("mousemove", (event) => {
      if (letterBusy) return;

      const rect = letterStage.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;

      rotateX(-y * 7);
      rotateY(x * 9);
    });

    letterStage.addEventListener("mouseleave", () => {
      rotateX(0);
      rotateY(0);
    });
  }

  const clearLetterError = () => {
    letterError.textContent = "";
    letterScene.classList.remove("is-error");
    [letterName, letterEmail, letterMessage].forEach((field) => {
      field.removeAttribute("aria-invalid");
    });
  };

  const getLetterError = () => {
    const name = letterName.value.trim();
    const email = letterEmail.value.trim();
    const message = letterMessage.value.trim();

    if (name.length < 2) {
      return { field: letterName, message: "Add your name to the letter." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { field: letterEmail, message: "That email doesn't look right." };
    }

    if (message.length < 8) {
      return { field: letterMessage, message: "Give the note a little more detail." };
    }

    return null;
  };

  const showLetterError = ({ field, message }) => {
    letterError.textContent = message;
    letterScene.classList.add("is-error");

    [letterName, letterEmail, letterMessage].forEach((input) => {
      input.setAttribute("aria-invalid", String(input === field));
    });

    field.focus({ preventScroll: true });

    if (!prefersReduced) {
      gsap.fromTo(
        letterCard,
        { x: -6 },
        { x: 0, duration: 0.55, ease: "elastic.out(1, 0.32)", overwrite: "auto" },
      );
    }
  };

  const buildMailto = (name, email, message) => {
    const subject = `A letter from ${name}`;
    const body = `From: ${name}\nEmail: ${email}\n\n${message}`;
    return `mailto:logesh.spy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const resetLetter = () => {
    letterScene.classList.remove(
      "is-sealing",
      "is-sealed",
      "is-flying",
      "is-delivered",
      "is-error",
    );
    letterForm.reset();
    clearLetterError();
    letterSuccess.setAttribute("aria-hidden", "true");
    letterSuccess.inert = true;
    letterForm.inert = false;
    letterBusy = false;

    gsap.set(
      [
        letterCard,
        letterEnvelope,
        letterDove,
        ".envelope-seal",
        ".envelope-shadow",
        ".dove-letter",
        ".dove-copy",
      ],
      {
        clearProps: "transform,opacity",
      },
    );

    letterName.focus({ preventScroll: true });
  };

  letterForm.addEventListener("input", () => {
    if (letterError.textContent) clearLetterError();
  });

  letterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (letterBusy) return;

    const issue = getLetterError();

    if (issue) {
      showLetterError(issue);
      return;
    }

    clearLetterError();
    letterBusy = true;

    const name = letterName.value.trim();
    const email = letterEmail.value.trim();
    const note = letterMessage.value.trim();

    if (letterDraft) letterDraft.href = buildMailto(name, email, note);

    const envelopeRect = letterEnvelope.getBoundingClientRect();
    const doveRect = letterDove.getBoundingClientRect();
    const dovePickX =
      envelopeRect.left + envelopeRect.width / 2 - (doveRect.left + doveRect.width / 2);
    const dovePickY = envelopeRect.top + envelopeRect.height / 2 - doveRect.bottom + 8;

    letterScene.classList.add("is-sealing");

    if (prefersReduced) {
      letterScene.classList.add("is-sealed", "is-flying", "is-delivered");
      letterSuccess.setAttribute("aria-hidden", "false");
      letterSuccess.inert = false;
      letterForm.inert = true;
      letterBusy = false;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        letterScene.classList.add("is-delivered");
        letterSuccess.setAttribute("aria-hidden", "false");
        letterSuccess.inert = false;
        letterForm.inert = true;
        letterBusy = false;
        letterDraft?.focus({ preventScroll: true });
      },
    });

    tl.to(letterCard, {
      y: 118,
      z: -90,
      rotationX: 22,
      rotationY: -8,
      scale: 0.72,
      opacity: 0,
      duration: 0.82,
      ease: "power3.in",
    })
      .add(() => letterScene.classList.add("is-sealed"), "-=0.12")
      .fromTo(
        ".envelope-seal",
        { scale: 0.35, rotation: -24, opacity: 0 },
        { scale: 1, rotation: -7, opacity: 1, duration: 0.55, ease: "back.out(2.2)" },
        "-=0.2",
      )
      .to(
        letterEnvelope,
        { y: 6, scale: 0.2, duration: 0.55, ease: "power3.inOut" },
        "-=0.25",
      )
      .to(".envelope-shadow", { opacity: 0, duration: 0.3 }, "<")
      .add(() => letterScene.classList.add("is-flying"), "-=0.05")
      .fromTo(
        letterDove,
        { x: 130, y: 110, rotation: 10, scale: 0.7, opacity: 0 },
        {
          x: dovePickX,
          y: dovePickY,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
        },
        "+=0.05",
      )
      .fromTo(
        ".dove-letter",
        { xPercent: -50, y: 12, rotation: -8, scale: 0.55, opacity: 0 },
        { xPercent: -50, y: 0, rotation: -8, scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
        "-=0.18",
      )
      .to(letterEnvelope, { opacity: 0, duration: 0.18 }, "-=0.05")
      .fromTo(
        ".dove-copy",
        { xPercent: -50, y: 10, opacity: 0 },
        { xPercent: -50, y: 0, opacity: 1, duration: 0.3 },
        "-=0.12",
      )
      .to(
        letterDove,
        { x: dovePickX - 45, y: -300, rotation: -8, duration: 1.05, ease: "power2.in" },
        "+=0.22",
      )
      .to([letterDove, ".dove-copy"], { opacity: 0, duration: 0.3 }, "-=0.3");
  });

  letterAgain?.addEventListener("click", resetLetter);
}

/* ------------------------------------------------------------------ */
/*  Contact liquid field                                               */
/* ------------------------------------------------------------------ */

const contactSection = document.querySelector("#contact");
const contactLiquidCanvas = document.querySelector("[data-contact-liquid]");

function initContactLiquid(section, canvas) {
  if (!section || !canvas) return;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) {
    initContactLiquid2D(section, canvas);
    return;
  }

  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const advectSource = `
    precision highp float;

    uniform sampler2D u_dye;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform float u_delta;
    uniform float u_energy;
    uniform float u_spread;
    uniform vec3 u_color;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
      float t = u_time * 0.32;

      vec2 mouse = (u_mouse - 0.5) * vec2(aspect, 1.0);
      vec2 toMouse = p - mouse;
      float distanceToMouse = length(toMouse);
      float influence = exp(-distanceToMouse * distanceToMouse / mix(0.0006, 0.0035, u_spread)) * u_energy;

      vec2 flow = vec2(
        sin(p.y * 3.8 + t * 1.4) + 0.55 * sin(p.y * 7.2 - t * 1.1),
        cos(p.x * 3.3 - t * 1.2) + 0.55 * cos(p.x * 6.4 + t * 0.9)
      ) * 0.004;

      flow += vec2(-toMouse.y, toMouse.x) / (distanceToMouse + 0.08) * influence * 0.05;
      flow += toMouse * influence * 0.005;

      vec2 previousUv = clamp(uv - flow * u_delta, 0.002, 0.998);
      vec4 dye = texture2D(u_dye, previousUv);
      dye.rgb *= 0.972;

      float splat = exp(-dot(toMouse, toMouse) / mix(0.0003, 0.0015, u_spread)) * u_energy;
      dye.rgb += u_color * splat * 0.72;
      dye.rgb += vec3(1.0) * splat * 0.1;


      gl_FragColor = vec4(clamp(dye.rgb, 0.0, 1.0), 1.0);
    }
  `;

  const displaySource = `
    precision highp float;

    uniform sampler2D u_dye;
    uniform vec2 u_resolution;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec3 color = texture2D(u_dye, uv).rgb;
      color = pow(color, vec3(0.74));
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const createProgram = (fragmentSource) => {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    return program;
  };

  const advectProgram = createProgram(advectSource);
  const displayProgram = createProgram(displaySource);
  if (!advectProgram || !displayProgram) {
    initContactLiquid2D(section, canvas);
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const advectUniforms = {
    dye: gl.getUniformLocation(advectProgram, "u_dye"),
    resolution: gl.getUniformLocation(advectProgram, "u_resolution"),
    mouse: gl.getUniformLocation(advectProgram, "u_mouse"),
    time: gl.getUniformLocation(advectProgram, "u_time"),
    delta: gl.getUniformLocation(advectProgram, "u_delta"),
    energy: gl.getUniformLocation(advectProgram, "u_energy"),
    spread: gl.getUniformLocation(advectProgram, "u_spread"),
    color: gl.getUniformLocation(advectProgram, "u_color"),
  };
  const displayUniforms = {
    dye: gl.getUniformLocation(displayProgram, "u_dye"),
    resolution: gl.getUniformLocation(displayProgram, "u_resolution"),
  };

  const bindQuad = (program) => {
    const position = gl.getAttribLocation(program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  };

  const createTarget = (width, height) => {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) return null;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer };
  };

  let simWidth = 0;
  let simHeight = 0;
  let targets = null;
  let readIndex = 0;
  let contextLost = false;

  const resize = () => {
    if (contextLost) return;
    const rect = section.getBoundingClientRect();
    const maxDimension = 900;
    const aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
    let width;
    let height;
    if (aspect >= 1) {
      width = maxDimension;
      height = Math.max(1, Math.round(maxDimension / aspect));
    } else {
      height = maxDimension;
      width = Math.max(192, Math.round(maxDimension * aspect));
    }

    if (width === simWidth && height === simHeight) return;
    simWidth = width;
    simHeight = height;
    canvas.width = width;
    canvas.height = height;

    if (targets) {
      targets.forEach((target) => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
    }

    const first = createTarget(width, height);
    const second = createTarget(width, height);
    if (!first || !second) {
      targets = null;
      return;
    }
    targets = [first, second];
    readIndex = 0;
  };

  let targetX = 0.5;
  let targetY = 0.62;
  let currentX = targetX;
  let currentY = targetY;
  let targetEnergy = 0;
  let energy = 0;
  let targetSpread = 0.02;
  let spread = targetSpread;
  let lastPointerX = null;
  let lastPointerY = null;
  let lastPointerTime = 0;
  let visible = false;
  let running = false;
  let raf = 0;
  let lastTime = performance.now();
  const startTime = performance.now();

  const render = (time, delta) => {
    if (!targets || contextLost) return;

    const read = targets[readIndex];
    const write = targets[1 - readIndex];

    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.viewport(0, 0, simWidth, simHeight);
    gl.useProgram(advectProgram);
    bindQuad(advectProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.uniform1i(advectUniforms.dye, 0);
    gl.uniform2f(advectUniforms.resolution, simWidth, simHeight);
    gl.uniform2f(advectUniforms.mouse, currentX, currentY);
    gl.uniform1f(advectUniforms.time, time);
    gl.uniform1f(advectUniforms.delta, delta);
    gl.uniform1f(advectUniforms.energy, energy);
    gl.uniform1f(advectUniforms.spread, spread);
    gl.uniform3f(advectUniforms.color, 0.84, 1.0, 0.29);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    readIndex = 1 - readIndex;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(displayProgram);
    bindQuad(displayProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[readIndex].texture);
    gl.uniform1i(displayUniforms.dye, 0);
    gl.uniform2f(displayUniforms.resolution, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const frame = (now) => {
    if (contextLost || !visible || document.hidden) {
      running = false;
      raf = 0;
      return;
    }

    const delta = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;
    targetEnergy *= Math.pow(0.18, delta);
    targetSpread += (0.02 - targetSpread) * Math.min(1, delta * 3.2);
    currentX += (targetX - currentX) * Math.min(1, delta * 18);
    currentY += (targetY - currentY) * Math.min(1, delta * 18);
    energy += (targetEnergy - energy) * Math.min(1, delta * 7);
    spread += (targetSpread - spread) * Math.min(1, delta * 8);

    render((now - startTime) / 1000, delta);
    raf = window.requestAnimationFrame(frame);
  };

  const start = () => {
    if (contextLost || running || prefersReduced) return;
    running = true;
    lastTime = performance.now();
    raf = window.requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();

  if (prefersReduced) {
    render(0, 0.016);
    return;
  }

  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      if (contextLost) return;
      contextLost = true;
      targets = null;
      stop();
      initContactLiquid2D(section, canvas);
    },
    { once: true },
  );

  section.addEventListener(
    "pointermove",
    (event) => {
      const rect = section.getBoundingClientRect();
      targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      targetY = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));

      const now = performance.now();
      let speed = 0;
      if (lastPointerX !== null) {
        const distance = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);
        speed = (distance / Math.max(8, now - lastPointerTime)) * 1000;
      }
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastPointerTime = now;

      const shake = Math.min(1, Math.max(0, (speed - 600) / 2600));
      targetEnergy = 0.06 + shake * 0.26;
      targetSpread = 0.02 + shake * 0.18;
    },
    { passive: true },
  );

  section.addEventListener("pointerenter", (event) => {
    const rect = section.getBoundingClientRect();
    targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    targetY = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));
    targetEnergy = 0.06;
    targetSpread = 0.02;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = performance.now();
  });

  section.addEventListener("pointerleave", () => {
    targetEnergy = 0;
    targetSpread = 0.02;
    lastPointerX = null;
    lastPointerY = null;
  });

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    },
    { rootMargin: "220px" },
  ).observe(section);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && visible) start();
  });

  new ResizeObserver(resize).observe(section);
}

function initContactLiquid2D(section, canvas) {
  let context = canvas.getContext("2d");
  if (!context) {
    const replacement = canvas.cloneNode(false);
    replacement.removeAttribute("width");
    replacement.removeAttribute("height");
    canvas.replaceWith(replacement);
    canvas = replacement;
    context = canvas.getContext("2d");
  }
  if (!context) return;

  let width = 1;
  let height = 1;
  let targetX = 0.5;
  let targetY = 0.62;
  let currentX = targetX;
  let currentY = targetY;
  let targetEnergy = 0;
  let energy = 0;
  let targetSpread = 0.02;
  let spread = targetSpread;
  let lastPointerX = null;
  let lastPointerY = null;
  let lastPointerTime = 0;
  let visible = false;
  let running = false;
  let raf = 0;
  let lastTime = performance.now();
  const startTime = performance.now();

  const resize = () => {
    const rect = section.getBoundingClientRect();
    const maxPixels = 1_600_000;
    const pixelCap = Math.sqrt(maxPixels / Math.max(1, rect.width * rect.height));
    const dpr = Math.max(0.6, Math.min(window.devicePixelRatio || 1, 1.25, pixelCap));
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
    width = rect.width;
    height = rect.height;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);
  };

  const draw = (now) => {
    const time = (now - startTime) / 1000;
    const pointerX = currentX * width;
    const pointerY = (1 - currentY) * height;
    const minSide = Math.min(width, height);
    const brushRadius = minSide * (0.014 + spread * 0.04);

    context.globalCompositeOperation = "source-over";
    context.fillStyle = "rgba(5, 5, 5, 0.16)";
    context.fillRect(0, 0, width, height);

    if (energy > 0.01) {
      context.globalCompositeOperation = "lighter";

      const brush = context.createRadialGradient(
        pointerX,
        pointerY,
        0,
        pointerX,
        pointerY,
        brushRadius,
      );
      brush.addColorStop(0, `rgba(214, 255, 75, ${energy * 0.84})`);
      brush.addColorStop(0.55, `rgba(214, 255, 75, ${energy * 0.34})`);
      brush.addColorStop(1, "rgba(214, 255, 75, 0)");
      context.fillStyle = brush;
      context.beginPath();
      context.arc(pointerX, pointerY, brushRadius, 0, Math.PI * 2);
      context.fill();

      const offsetX = Math.cos(time * 1.8) * brushRadius * 0.35;
      const offsetY = Math.sin(time * 1.6) * brushRadius * 0.35;
      const highlight = context.createRadialGradient(
        pointerX + offsetX,
        pointerY + offsetY,
        0,
        pointerX + offsetX,
        pointerY + offsetY,
        brushRadius * 0.45,
      );
      highlight.addColorStop(0, `rgba(242, 240, 233, ${energy * 0.52})`);
      highlight.addColorStop(1, "rgba(242, 240, 233, 0)");
      context.fillStyle = highlight;
      context.beginPath();
      context.arc(pointerX + offsetX, pointerY + offsetY, brushRadius * 0.45, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = 1;
      context.strokeStyle = `rgba(214, 255, 75, ${energy * 0.6})`;
      context.beginPath();
      context.arc(pointerX, pointerY, brushRadius * 0.92, time * 2.2, time * 2.2 + 1.5);
      context.stroke();
    }

    context.globalCompositeOperation = "source-over";
  };

  const drawStatic = () => {
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);
  };

  const frame = (now) => {
    if (!visible || document.hidden) {
      running = false;
      raf = 0;
      return;
    }

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    targetEnergy *= Math.pow(0.18, delta);
    targetSpread += (0.02 - targetSpread) * Math.min(1, delta * 3.2);
    currentX += (targetX - currentX) * Math.min(1, delta * 18);
    currentY += (targetY - currentY) * Math.min(1, delta * 18);
    energy += (targetEnergy - energy) * Math.min(1, delta * 7);
    spread += (targetSpread - spread) * Math.min(1, delta * 8);

    draw(now, delta);
    raf = window.requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || prefersReduced) return;
    running = true;
    lastTime = performance.now();
    raf = window.requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();

  if (prefersReduced) {
    drawStatic();
    return;
  }

  section.addEventListener(
    "pointermove",
    (event) => {
      const rect = section.getBoundingClientRect();
      targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      targetY = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));

      const now = performance.now();
      let speed = 0;
      if (lastPointerX !== null) {
        const distance = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);
        speed = (distance / Math.max(8, now - lastPointerTime)) * 1000;
      }
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastPointerTime = now;

      const shake = Math.min(1, Math.max(0, (speed - 600) / 2600));
      targetEnergy = 0.06 + shake * 0.26;
      targetSpread = 0.02 + shake * 0.18;
    },
    { passive: true },
  );

  section.addEventListener("pointerenter", (event) => {
    const rect = section.getBoundingClientRect();
    targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    targetY = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));
    targetEnergy = 0.06;
    targetSpread = 0.02;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = performance.now();
  });

  section.addEventListener("pointerleave", () => {
    targetEnergy = 0;
    targetSpread = 0.02;
    lastPointerX = null;
    lastPointerY = null;
  });

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    },
    { rootMargin: "220px" },
  ).observe(section);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && visible) start();
  });

  new ResizeObserver(resize).observe(section);
}

initContactLiquid(contactSection, contactLiquidCanvas);

/* ------------------------------------------------------------------ */
/*  Back to top                                                        */
/* ------------------------------------------------------------------ */

document.querySelector(".back-top")?.addEventListener("click", () => {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.4 });
  } else {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }
});

/* ------------------------------------------------------------------ */
/*  Refresh on load                                                    */
/* ------------------------------------------------------------------ */

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
