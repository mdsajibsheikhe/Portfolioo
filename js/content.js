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

  function rows(path) {
    return SB.table(path)
      .then(function (r) { return Array.isArray(r) ? r : []; })
      .catch(function (e) { console.warn("Supabase:", path, e.message); return []; });
  }

  /* ---------- settings: data-s / data-s-ph apply ---------- */
  function applySettings() {
    if (!Object.keys(SET).length) return;

    // <title> special case
    if (SET.site_title) D.title = SET.site_title;

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
      return '<div class="skills-group"><div class="skills-group-head"><span class="skills-group-icon">' +
        esc(s.icon || "🎨") + "</span><h3>" + esc(s.title) + "</h3></div>" +
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
      return '<article class="project-card">' +
        '<div class="project-image' + (v > 0 ? " alt-" + v : "") + '"><span class="project-emoji">' + esc(p.emoji || "🎨") + "</span></div>" +
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

  /* ---------- load all ---------- */
  Promise.all([
    rows("profile?select=*"),
    rows("settings?select=*"),
    rows("stats?select=*&order=sort.asc"),
    rows("services?select=*&order=sort.asc"),
    rows("tools?select=*&order=sort.asc"),
    rows("projects?select=*&order=sort.asc"),
    rows("experience?select=*&order=sort.asc")
  ]).then(function (r) {
    r[1].forEach(function (s) { SET[s.key] = s.value; });

    applySettings();          // আগে labels
    applyProfile(r[0][0]);    // তারপর profile data
    renderStats(r[2]);
    renderServices(r[3]);
    renderTools(r[4]);
    renderProjects(r[5]);     // settings-এর button label লাগবে
    renderTimeline(r[6]);

    if (window.PortfolioUI && window.PortfolioUI.refresh) window.PortfolioUI.refresh();
  }).catch(function (e) {
    console.warn("Content load skipped:", e);
  });
})();
