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

    /* ---- color theme (10 preset + custom) ---- */
    var THEMES = ["emerald","ocean","indigo","violet","rose","sunset","amber","teal","lime","slate","custom"];
    var th = SET.theme || "emerald";
    if (THEMES.indexOf(th) === -1) th = "emerald";
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
      contact_location: p.contact_location,
      contact_socials: p.contact_socials,
      footer_text: p.footer_text,
      social_facebook: p.facebook,
      social_instagram: p.instagram,
      social_linkedin: p.linkedin,
      social_twitter: p.twitter
    };

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
      if (key === "social_facebook" || key === "social_instagram" || key === "social_linkedin" || key === "social_twitter") {
        if (v) el.href = v;
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
      return '<div class="skills-group"><div class="skills-group-head"><span class="skills-group-icon">' +
        media + "</span><h3>" + esc(s.title) + "</h3></div>" +
        '<div class="skills-list">' + tags + "</div></div>";
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
          st.textContent = "✅ Message sent — I'll reply to " + data.email + " soon.";
          st.className = "form-status ok";
        }
        f.reset();
      } catch (err) {
        // email না গেলেও message DB-তে থাকে (নিচে সংরক্ষণ হয়)
        if (st) {
          st.textContent = "✅ Message received. I'll reply soon.";
          st.className = "form-status ok";
        }
        f.reset();
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
    bindContactForm();

    // icons render হওয়ার পর আবার (dynamic কনটেন্ট)
    applyIcons();

    if (window.PortfolioUI && window.PortfolioUI.refresh) window.PortfolioUI.refresh();
  }).catch(function (e) {
    console.warn("Content load skipped:", e);
  });
})();
