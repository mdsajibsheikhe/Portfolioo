/* ============================================
   Portfolio content loader (Supabase)
   profile  -> hero / about / contact / footer
   settings -> সব label, title, button text
   stats / services / tools / projects / experience
   Supabase না চললে built-in content থেকে যায়।
   ============================================ */
(function () {
  if (!window.SB) return;

  var D = document;
  var SET = {}; // settings map
  var WHATSAPP = "";

  function esc(v) {
    return String(v === null || v === undefined ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function q(s) { return D.querySelector(s); }

  /* ---------- premium icons ---------- */
  function applyIcons() {
    if (!window.ICONS) return;
    D.querySelectorAll("[data-ico]").forEach(function (el) {
      var name = el.getAttribute("data-ico");
      var size = Number(el.getAttribute("data-isize")) || 20;
      var svg = ICONS.svg(name, size);
      if (svg) el.innerHTML = svg;
    });
  }

  function hexToRgb(h) {
    if (!h) return null;
    h = String(h).trim().replace(/^#/, "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return parseInt(h.slice(0, 2), 16) + ", " + parseInt(h.slice(2, 4), 16) + ", " + parseInt(h.slice(4, 6), 16);
  }

  function rows(path) {
    return SB.table(path)
      .then(function (r) { return Array.isArray(r) ? r : []; })
      .catch(function (e) { console.warn("Supabase:", path, e.message); return []; });
  }

  /* ---------- settings: data-s / data-s-ph apply ---------- */
  function applySettings() {
    if (!Object.keys(SET).length) return;

    /* ---- color theme (১০টা palette theme + custom) ---- */
    var THEMES = ["emerald","autumn","sage","terracotta","olive","coral","slateblue","coastal","mustard","clay","custom"];
    var LEGACY = { ocean:"slateblue", indigo:"slateblue", violet:"clay", rose:"clay", sunset:"coral", amber:"mustard", teal:"sage", lime:"sage", slate:"slateblue" };
    var th = SET.theme || "emerald";
    if (THEMES.indexOf(th) === -1) th = LEGACY[th] || "emerald";
    document.documentElement.setAttribute("data-color", th);
    if (th === "custom") {
      var rs = document.documentElement.style;
      if (SET.custom_c1) rs.setProperty("--c1", SET.custom_c1);
      if (SET.custom_c2) rs.setProperty("--c2", SET.custom_c2);
      if (SET.custom_c3) rs.setProperty("--c3", SET.custom_c3);
      // custom এর rgb triplet (shadows)
      var rgb = hexToRgb(SET.custom_c1 || "#059669");
      if (rgb) rs.setProperty("--primary-rgb", rgb);
    }

    // <title> special case
    if (SET.site_title) D.title = SET.site_title;

    /* ---- SEO (admin থেকে পরিবর্তনযোগ্য) ---- */
    function setMeta(sel, attr, val) {
      if (!val) return;
      var el = D.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    }
    if (SET.seo_description) {
      setMeta('meta[name="description"]', "content", SET.seo_description);
      setMeta('meta[property="og:description"]', "content", SET.seo_description);
      setMeta('meta[name="twitter:description"]', "content", SET.seo_description);
    }
    if (SET.seo_keywords) setMeta('meta[name="keywords"]', "content", SET.seo_keywords);
    if (SET.og_image) {
      setMeta('meta[property="og:image"]', "content", SET.og_image);
      setMeta('meta[name="twitter:image"]', "content", SET.og_image);
    }
    if (SET.site_title) {
      setMeta('meta[property="og:title"]', "content", SET.site_title);
      setMeta('meta[name="twitter:title"]', "content", SET.site_title);
    }

    /* ---- ছবি থাকলে meta image বসাও (og:site-এ default না থাকলে) ---- */
    if (!SET.og_image && SET.avatar_image) {
      setMeta('meta[property="og:image"]', "content", SET.avatar_image);
      setMeta('meta[name="twitter:image"]', "content", SET.avatar_image);
    }

    /* ---- site logo image ---- */
    var logoImg = D.querySelector(".nav-logo-img");
    var logoTxt = D.querySelector(".nav-logo-text");
    if (logoImg && SET.logo_image) {
      logoImg.src = SET.logo_image;
      logoImg.hidden = false;
      if (logoTxt) logoTxt.hidden = true;
    }

    /* ---- avatar image (hero + about) ---- */
    if (SET.avatar_image) {
      D.querySelectorAll(".hero-avatar, .about-avatar").forEach(function (el) {
        el.style.backgroundImage = 'url("' + SET.avatar_image + '")';
        el.classList.add("has-img");
      });
    }

    D.querySelectorAll("[data-s]").forEach(function (el) {
      var v = SET[el.getAttribute("data-s")];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        if (el.tagName === "TITLE") D.title = v;
        else el.innerHTML = v; // <br/> support
      }
    });

    D.querySelectorAll("[data-s-ph]").forEach(function (el) {
      var v = SET[el.getAttribute("data-s-ph")];
      if (v !== undefined && v !== null && String(v).trim() !== "") el.setAttribute("placeholder", v);
    });
  }

  /* ---------- profile: data-c targets ---------- */
  function applyProfile(p) {
    if (!p) return;

    var c = {
      hello: p.hello,
      name: p.name,
      hero_desc: p.hero_desc,
      avatar: p.avatar,
      exp_years: p.exp_years,
      about_heading: p.about_heading,
      about_p1: p.about_p1,
      about_p2: p.about_p2,
      about_name: p.about_name,
      about_email: p.about_email,
      about_location: p.about_location,
      about_status: p.about_status,
      contact_heading: p.contact_heading,
      contact_sub: p.contact_sub,
      contact_email: p.contact_email,
      contact_whatsapp: p.whatsapp,
      contact_location: p.contact_location,
      contact_socials: p.contact_socials,
      footer_text: p.footer_text,
      social_facebook: p.facebook,
      social_instagram: p.instagram,
      social_linkedin: p.linkedin,
      social_twitter: p.twitter,
      social_behance: p.behance,
      social_whatsapp: p.whatsapp
    };

    /* WhatsApp link wa.me তে বদলাও */
    if (p.whatsapp) {
      var digits = String(p.whatsapp).replace(/[^\d]/g, "");
      c.social_whatsapp = digits ? "https://wa.me/" + digits : "";
      WHATSAPP = digits;
    }

    // profession: শেষ word টা green করে
    if (p.profession) {
      var prof = q(".hero-profession");
      if (prof) {
        var parts = String(p.profession).trim().split(/\s+/);
        var last = parts.pop() || "";
        prof.innerHTML =
          (parts.length ? esc(parts.join(" ")) + " " : "") +
          '<span class="text-primary">' + esc(last) + "</span>";
      }
    }

    // CV links
    if (p.cv_url) {
      D.querySelectorAll(".nav-cv, .about-btn").forEach(function (a) { a.href = p.cv_url; });
    }

    D.querySelectorAll("[data-c]").forEach(function (el) {
      var key = el.getAttribute("data-c");
      if (key === "profession" || key === "avatar_multiple") return;

      var v = c[key];
      if (key.indexOf("social_") === 0) {
        // URL খালি/"#" হলে icon লুকিয়ে দাও — admin থেকে যোগ/মুছে দিতে পারবেন
        var url = String(v || "").trim();
        if (!url || url === "#") { el.hidden = true; el.setAttribute("aria-hidden", "true"); return; }
        el.hidden = false;
        el.removeAttribute("aria-hidden");
        el.href = url;
        return;
      }
      if (v !== undefined && v !== null && String(v).trim() !== "") el.textContent = v;
    });

    // footer year আবার বসাতে হবে (innerHTML replace হলে)
    var y = D.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- lists ---------- */
  function renderStats(list) {
    var wrap = q(".about-stats");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list.map(function (s) {
      return '<div class="stat"><strong class="stat-num" data-count="' + esc(s.num) + '">0</strong><span>' + esc(s.label) + "</span></div>";
    }).join("");
  }

  function renderServices(list) {
    var wrap = q(".skills-container");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list.map(function (s) {
      var tags = (s.tags || []).map(function (t) { return '<span class="skill-tag">' + esc(t) + "</span>"; }).join("");
      var media = s.image
        ? '<img class="skills-group-img" src="' + esc(s.image) + '" alt="" loading="lazy" />'
        : (window.ICONS ? ICONS.resolve(s.icon, "palette", 22) : esc(s.icon || "🎨"));
      var tl = Array.isArray(s.tools) ? s.tools : [];
      var tools = tl.filter(function (x) { return String(x || "").trim(); })
        .map(function (t) { return '<span class="tool-mini">' + esc(t) + "</span>"; }).join("");
      var toolsRow = tools
        ? '<div class="service-tools"><span class="service-tools-label">' +
          (window.ICONS ? ICONS.svg("zap", 13) : "") + esc(SET.tools_used_label || "Tools used") +
          "</span>" + tools + "</div>"
        : "";
      return '<div class="skills-group"><div class="skills-group-head"><span class="skills-group-icon">' +
        media + "</span><h3>" + esc(s.title) + "</h3></div>" +
        '<div class="skills-list">' + tags + "</div>" + toolsRow + "</div>";
    }).join("");
  }

  function renderTools(list) {
    var wrap = q(".tools-list");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list.map(function (t) { return '<span class="tool-chip">' + esc(t.name) + "</span>"; }).join("");
  }

  function renderProjects(list) {
    var wrap = q(".projects-container");
    if (!wrap || !list.length) return;
    var btnView = SET.project_btn_view || "View Samples";
    var btnCase = SET.project_btn_case || "Case Study";
    wrap.innerHTML = list.map(function (p) {
      var v = Number(p.variant) || 0;
      var tags = (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
      var media = p.image
        ? '<img class="project-img" src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" />'
        : '<span class="project-emoji">' + esc(p.emoji || "🎨") + "</span>";
      var boxCls = p.image
        ? "project-image has-img"
        : "project-image" + (v > 0 ? " alt-" + v : "");
      return '<article class="project-card">' +
        '<div class="' + boxCls + '">' + media + "</div>" +
        '<div class="project-content"><h3>' + esc(p.title) + "</h3><p>" + esc(p.description) + "</p>" +
        '<div class="project-tags">' + tags + "</div>" +
        '<div class="project-links">' +
        '<a href="' + esc(p.view_url || "#") + '" class="btn btn-small">' + esc(btnView) + "</a>" +
        '<a href="' + esc(p.case_url || "#") + '" class="btn btn-small btn-outline">' + esc(btnCase) + "</a>" +
        "</div></div></article>";
    }).join("");
  }

  function renderTimeline(list) {
    var wrap = q(".timeline");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list.map(function (e) {
      return '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content">' +
        '<span class="timeline-date">' + esc(e.date_label) + "</span><h3>" + esc(e.title) + "</h3><p>" + esc(e.description) + "</p></div></div>";
    }).join("");
  }

  function renderReviews(list) {
    var wrap = q("#reviews-container");
    var sec = q("#reviews");
    if (!wrap) return;
    if (!list.length) return; // built-in fallback থাকুক
    if (sec) sec.hidden = false;
    var star = window.ICONS ? ICONS.svg("star", 16) : "★";
    var quote = window.ICONS ? ICONS.svg("quote", 24) : "❝";
    var stars = "";
    for (var i = 0; i < 5; i++) stars += '<span class="star">' + star + "</span>";
    wrap.innerHTML = list.map(function (r) {
      var n = String(r.name || "?").trim();
      var ava = r.avatar
        ? '<img class="review-ava has-img" src="' + esc(r.avatar) + '" alt="" loading="lazy" />'
        : '<span class="review-ava">' + esc(n.charAt(0).toUpperCase()) + "</span>";
      var rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
      var st = "";
      for (var k = 0; k < 5; k++) st += '<span class="star' + (k < rating ? "" : " off") + '">' + star + "</span>";
      return '<article class="review-card">' +
        '<span class="review-quote">' + quote + "</span>" +
        '<div class="review-stars">' + st + "</div>" +
        '<p class="review-text">' + esc(r.text) + "</p>" +
        '<div class="review-person">' + ava +
        "<div><strong>" + esc(n) + "</strong><small>" +
        esc([r.role, r.company].filter(Boolean).join(" · ")) + "</small></div></div></article>";
    }).join("");
  }

  /* ---------- reviews slider ---------- */
  var revTimer = null;

  function initReviewSlider() {
    var slider = q("#reviews-slider");
    var track = q("#reviews-container");
    var dotsHost = q("#rev-dots");
    if (!slider || !track) return;

    var cards = Array.prototype.slice.call(track.children);
    if (!cards.length) { slider.hidden = true; return; }
    slider.hidden = false;

    var idx = 0;

    function perView() {
      var w = window.innerWidth;
      if (w < 620) return 1;
      if (w < 1000) return 2;
      if (w < 1320) return 3;
      return 4;
    }

    function maxIdx() { return Math.max(0, cards.length - perView()); }

    function layout() {
      var pv = perView();
      var gap = 24;
      var w = track.clientWidth || slider.clientWidth;
      var cardW = Math.max(240, Math.floor((w - gap * (pv - 1)) / pv));
      cards.forEach(function (c) { c.style.flex = "0 0 " + cardW + "px"; });
      if (idx > maxIdx()) idx = maxIdx();
      track.style.transform = "translateX(-" + idx * (cardW + gap) + "px)";
      buildDots();
      var nav = q(".reviews-nav");
      if (nav) nav.hidden = cards.length <= pv;
    }

    function buildDots() {
      if (!dotsHost) return;
      var pages = maxIdx() + 1;
      if (pages < 2) { dotsHost.innerHTML = ""; return; }
      var html = "";
      for (var i = 0; i < pages; i++) {
        html += '<button type="button" class="review-dot' + (i === idx ? " active" : "") +
          '" data-rev-page="' + i + '" aria-label="Go to review ' + (i + 1) + '"></button>';
      }
      dotsHost.innerHTML = html;
    }

    function go(n) {
      idx = Math.max(0, Math.min(maxIdx(), n));
      layout();
    }

    function auto() {
      clearInterval(revTimer);
      revTimer = setInterval(function () {
        go(idx >= maxIdx() ? 0 : idx + 1);
      }, 5000);
    }

    var prev = q("#rev-prev");
    var next = q("#rev-next");
    if (prev) prev.addEventListener("click", function () { go(idx - 1); auto(); });
    if (next) next.addEventListener("click", function () { go(idx + 1); auto(); });
    if (dotsHost) {
      dotsHost.addEventListener("click", function (e) {
        var b = e.target.closest("[data-rev-page]");
        if (b) { go(Number(b.getAttribute("data-rev-page"))); auto(); }
      });
    }

    slider.addEventListener("mouseenter", function () { clearInterval(revTimer); });
    slider.addEventListener("mouseleave", auto);

    /* touch swipe */
    var sx = 0, dx = 0, dragging = false;
    track.addEventListener("touchstart", function (e) {
      sx = e.touches[0].clientX; dx = 0; dragging = true;
    }, { passive: true });
    track.addEventListener("touchmove", function (e) {
      if (dragging) dx = e.touches[0].clientX - sx;
    }, { passive: true });
    track.addEventListener("touchend", function () {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 45) { go(idx + (dx < 0 ? 1 : -1)); auto(); }
    });

    layout();
    auto();

    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(layout, 150);
    });
  }

  /* ---------- thank-you popup ---------- */
  function showPopup() {
    var pop = q("#popup");
    if (!pop) return;
    pop.hidden = false;
    document.body.style.overflow = "hidden";
    var card = pop.querySelector(".popup-card");
    if (card) { card.classList.remove("in"); void card.offsetWidth; card.classList.add("in"); }
  }

  function hidePopup() {
    var pop = q("#popup");
    if (!pop) return;
    pop.hidden = true;
    document.body.style.overflow = "";
  }

  function bindPopup() {
    var pop = q("#popup");
    if (!pop) return;
    var close = q("#popup-close");
    if (close) close.addEventListener("click", hidePopup);
    pop.addEventListener("click", function (e) { if (e.target === pop) hidePopup(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !pop.hidden) hidePopup();
    });
    // WhatsApp direct link বসাও
    var wa = q("#popup-wa");
    if (wa) {
      if (WHATSAPP) { wa.href = "https://wa.me/" + WHATSAPP; wa.hidden = false; }
    }
  }

  /* ---------- contact form → email notification ---------- */
  function bindContactForm() {
    var f = q("#contact-form");
    if (!f) return;
    f.addEventListener("submit", async function (e) {
      e.preventDefault();
      var st = q("#form-status");
      var btn = f.querySelector('button[type="submit"]');
      var data = {
        name: (f.name.value || "").trim(),
        email: (f.email.value || "").trim(),
        subject: (f.subject.value || "").trim(),
        message: (f.message.value || "").trim()
      };
      if (!data.name || !data.email || !data.message) {
        if (st) { st.textContent = "Please fill name, email and message."; st.className = "form-status err"; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      if (st) { st.textContent = ""; st.className = "form-status"; }

      // সবসময় DB-তে সংরক্ষণ (admin panel-এ দেখাবে)
      saveMessage(data);

      try {
        var r = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
        if (st) {
          st.textContent = "✅ Message sent.";
          st.className = "form-status ok";
        }
        f.reset();
        showPopup();
      } catch (err) {
        // email না গেলেও message DB-তে থাকে (নিচে সংরক্ষণ হয়)
        if (st) {
          st.textContent = "✅ Message received.";
          st.className = "form-status ok";
        }
        f.reset();
        showPopup();
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = SET.form_submit || "Send Message"; }
      }
    });
  }

  /* ---------- save message to DB (always) ---------- */
  function saveMessage(data) {
    try {
      SB.table("messages", { method: "POST", body: data });
    } catch (e) { /* silent */ }
  }

  /* ---------- load all ---------- */
  Promise.all([
    rows("profile?select=*"),
    rows("settings?select=*"),
    rows("stats?select=*&order=sort.asc"),
    rows("services?select=*&order=sort.asc"),
    rows("tools?select=*&order=sort.asc"),
    rows("projects?select=*&order=sort.asc"),
    rows("experience?select=*&order=sort.asc"),
    rows("testimonials?select=*&order=sort.asc")
  ]).then(function (r) {
    r[1].forEach(function (s) { SET[s.key] = s.value; });

    applyIcons();            // প্রথমে premium icons
    applySettings();          // তারপর labels
    applyProfile(r[0][0]);
    renderStats(r[2]);
    renderServices(r[3]);
    renderTools(r[4]);
    renderProjects(r[5]);
    renderTimeline(r[6]);
    renderReviews(r[7]);
    initReviewSlider();
    bindContactForm();
    bindPopup();

    // icons render হওয়ার পর আবার (dynamic কনটেন্ট)
    applyIcons();

    if (window.PortfolioUI && window.PortfolioUI.refresh) window.PortfolioUI.refresh();
  }).catch(function (e) {
    console.warn("Content load skipped:", e);
  });
})();
