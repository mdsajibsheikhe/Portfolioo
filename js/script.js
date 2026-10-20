/* ============================================
   Portfolio — Md Sajib Sheikh
   ============================================ */

// ---------- Loader ----------
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  setTimeout(() => loader.classList.add("hidden"), 600);
});

// ---------- Theme Toggle ----------
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

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

navToggle.addEventListener("click", openMenu);
navClose.addEventListener("click", closeMenu);
navOverlay.addEventListener("click", closeMenu);
navLinks.forEach((link) => link.addEventListener("click", closeMenu));

// Close menu with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// ---------- Header scroll effect ----------
const header = document.getElementById("header");
const scrollTopBtn = document.getElementById("scroll-top");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 50);
  scrollTopBtn.classList.toggle("show", window.scrollY > 400);
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

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

// ---------- Scroll reveal ----------
const revealElements = document.querySelectorAll(
  ".about, .skills-group, .project-card, .timeline-item, .contact-info, .contact-form"
);

revealElements.forEach((el) => el.classList.add("reveal"));

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

revealElements.forEach((el) => revealObserver.observe(el));

// ---------- Custom cursor ----------
const cursor = document.getElementById("cursor");

document.addEventListener("mousemove", (e) => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

document.querySelectorAll("a, button, input, textarea").forEach((el) => {
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

// ---------- Stats counter ----------
const stats = document.querySelectorAll(".stat-num");
let statsStarted = false;

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !statsStarted) {
        statsStarted = true;
        stats.forEach((stat) => {
          const target = +stat.dataset.count;
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
        statsObserver.disconnect();
      }
    });
  },
  { threshold: 0.5 }
);

if (stats.length) statsObserver.observe(stats[0].closest(".about-stats"));

// ---------- Contact form ----------
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  formStatus.textContent = "✅ Message sent! I'll get back to you soon.";
  contactForm.reset();

  setTimeout(() => {
    formStatus.textContent = "";
  }, 4000);
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();
