/* ============================================
   Portfolio — Md Sajib Sheikh
   ============================================ */

// ---------- Loader ----------
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) setTimeout(() => loader.classList.add("hidden"), 600);
});

// ---------- Theme Toggle ----------
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

// ---------- Mobile Nav ----------
const navMenu = document.getElementById("nav-menu");
const navToggle = document.getElementById("nav-toggle");
const navClose = document.getElementById("nav-close");
const navOverlay = document.getElementById("nav-overlay");
const navLinks = document.querySelectorAll(".nav-link");

function openMenu() {
  navMenu.classList.add("show");
  navOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeMenu() {
  navMenu.classList.remove("show");
  navOverlay.classList.remove("show");
  document.body.style.overflow = "";
}

if (navToggle) navToggle.addEventListener("click", openMenu);
if (navClose) navClose.addEventListener("click", closeMenu);
if (navOverlay) navOverlay.addEventListener("click", closeMenu);
navLinks.forEach((link) => link.addEventListener("click", closeMenu));

// Close menu with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// ---------- Header scroll effect ----------
const header = document.getElementById("header");
const scrollTopBtn = document.getElementById("scroll-top");

window.addEventListener("scroll", () => {
  if (header) header.classList.toggle("scrolled", window.scrollY > 50);
  if (scrollTopBtn) scrollTopBtn.classList.toggle("show", window.scrollY > 400);
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ---------- Active link on scroll ----------
const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY + 150;

  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");
    const link = document.querySelector(`.nav-link[href="#${id}"]`);

    if (link) {
      link.classList.toggle("active-link", scrollY >= top && scrollY < top + height);
    }
  });
});

// ---------- Typing effect ----------
const typedElement = document.getElementById("typed");
const words = ["Designer", "Thumbnail Expert", "Packaging Pro", "Brand Creator"];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
  if (!typedElement) return;
  const currentWord = words[wordIndex];

  if (isDeleting) {
    charIndex--;
  } else {
    charIndex++;
  }

  typedElement.textContent = currentWord.substring(0, charIndex);

  let speed = isDeleting ? 60 : 120;

  if (!isDeleting && charIndex === currentWord.length) {
    speed = 1500;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    speed = 400;
  }

  setTimeout(type, speed);
}

type();

// ---------- Scroll reveal (Supabase content লোড হলে নতুন element-এও কাজ করে) ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

function initReveal() {
  document
    .querySelectorAll(".about, .skills-group, .project-card, .timeline-item, .contact-info, .contact-form")
    .forEach((el) => {
      // index.html-তে আগে থেকেই reveal class থাকলেও observe করতে হবে —
      // নাহলে সেই section কখনো visible হয় না (ফাঁকা দেখাত)
      if (!el.classList.contains("reveal")) el.classList.add("reveal");
      if (el.classList.contains("active")) return;
      if (el.dataset.revealObserved === "1") return;
      el.dataset.revealObserved = "1";
      revealObserver.observe(el);
    });
}

/* IntersectionObserver না চললেও স্ক্রিনে যা আছে সেটা লুকিয়ে রাখবে না —
   fold-এর উপরে/ভিতরে সব element সাথে সাথে active হবে */
function revealInView() {
  const vh = window.innerHeight || 600;
  document.querySelectorAll(".reveal:not(.active)").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh) el.classList.add("active");
  });
}
window.addEventListener("scroll", revealInView, { passive: true });
window.addEventListener("resize", revealInView);
window.addEventListener("load", () => setTimeout(revealInView, 400));
setTimeout(revealInView, 1500);

initReveal();
setTimeout(revealInView, 600);

// ---------- Custom cursor ----------
const cursor = document.getElementById("cursor");

document.addEventListener("mousemove", (e) => {
  if (!cursor) return;
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

function initCursorHovers() {
  if (!cursor) return;
  document.querySelectorAll("a, button, input, textarea").forEach((el) => {
    if (el.dataset.cursorBound) return;
    el.dataset.cursorBound = "1";
    el.addEventListener("mouseenter", () => {
      cursor.style.width = "40px";
      cursor.style.height = "40px";
      cursor.style.background = "rgba(5, 150, 105, 0.2)";
    });
    el.addEventListener("mouseleave", () => {
      cursor.style.width = "24px";
      cursor.style.height = "24px";
      cursor.style.background = "transparent";
    });
  });
}

initCursorHovers();

// ---------- Stats counter ----------
let statsStarted = false;

function runCounters() {
  document.querySelectorAll(".stat-num").forEach((stat) => {
    const target = +stat.dataset.count;
    if (!target) {
      stat.textContent = stat.dataset.count + (stat.dataset.count ? "+" : "");
      return;
    }
    let current = 0;
    const increment = target / 60;
    const counter = setInterval(() => {
      current += increment;
      if (current >= target) {
        stat.textContent = target + "+";
        clearInterval(counter);
      } else {
        stat.textContent = Math.floor(current);
      }
    }, 25);
  });
}

const statsBlock = document.querySelector(".about-stats");
if (statsBlock) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsStarted) {
          statsStarted = true;
          runCounters();
          statsObserver.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );
  statsObserver.observe(statsBlock);
}

// ---------- Refresh hook (content.js data বদলালে ডাকে) ----------
window.PortfolioUI = {
  refresh() {
    initReveal();
    initCursorHovers();
    revealInView();
    if (statsStarted) runCounters();
  }
};

// ---------- Contact form (Supabase-এ message save) ----------
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: contactForm.querySelector("#name").value.trim(),
      email: contactForm.querySelector("#email").value.trim(),
      subject: contactForm.querySelector("#subject").value.trim(),
      message: contactForm.querySelector("#message").value.trim()
    };

    try {
      if (!window.SB) throw new Error("offline");
      await SB.table("messages", { method: "POST", body: payload });
      formStatus.textContent = "✅ Message sent! I'll get back to you soon.";
      contactForm.reset();
    } catch (err) {
      console.warn("Message not saved:", err.message);
      formStatus.textContent = "⚠️ Could not send — please email me directly.";
    }

    setTimeout(() => {
      formStatus.textContent = "";
    }, 4000);
  });
}

// ---------- Footer year ----------
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
