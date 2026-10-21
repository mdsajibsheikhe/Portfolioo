/* ============================================
   Portfolio content loader (Supabase)
   ডাটাবেস থেকে content পড়ে page-এ বসায়।
   Supabase না চললে বা টেবিল খালি থাকলে
   index.html-এর built-in content যেমন আছে তেমনই থাকে।
   ============================================ */
(function () {
  if (!window.SB) return;

  var D = document;

  function esc(v) {
    return String(v === null || v === undefined ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function q(s) {
    return D.querySelector(s);
  }

  function setText(sel, val) {
    var el = q(sel);
    if (el && val !== null && val !== undefined && String(val).trim() !== "") el.textContent = val;
  }

  function rows(path) {
    return SB.table(path)
      .then(function (r) {
        return Array.isArray(r) ? r : [];
      })
      .catch(function (e) {
        console.warn("Supabase:", path, e.message);
        return [];
      });
  }

  /* ---------- Profile (hero, about, contact, footer) ---------- */
  function renderProfile(p) {
    if (!p) return;

    if (p.site_title) D.title = p.site_title;
    setText(".hero-hello", p.hello);
    setText(".hero-name", p.name);

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

    setText(".hero-description", p.hero_desc);

    if (p.avatar) {
      Array.prototype.forEach.call(D.querySelectorAll(".hero-avatar, .about-avatar"), function (el) {
        el.textContent = p.avatar;
      });
    }

    var socials = { Facebook: p.facebook, Instagram: p.instagram, LinkedIn: p.linkedin, Twitter: p.twitter };
    Array.prototype.forEach.call(D.querySelectorAll(".hero-social .social-icon"), function (a) {
      var v = socials[a.getAttribute("aria-label")];
      if (v) a.href = v;
    });

    if (p.cv_url) {
      Array.prototype.forEach.call(D.querySelectorAll(".nav-cv, .about-btn"), function (a) {
        a.href = p.cv_url;
      });
    }

    setText(".about-content h3", p.about_heading);
    var ps = D.querySelectorAll(".about-content > p");
    if (p.about_p1 && ps[0]) ps[0].textContent = p.about_p1;
    if (p.about_p2 && ps[1]) ps[1].textContent = p.about_p2;
    setText(".about-experience-badge strong", p.exp_years);

    var infoMap = { Name: p.about_name, Email: p.about_email, Location: p.about_location, Status: p.about_status };
    Array.prototype.forEach.call(D.querySelectorAll(".about-box"), function (box) {
      var lbl = box.querySelector(".about-label");
      if (!lbl) return;
      var v = infoMap[lbl.textContent.trim()];
      var el = box.querySelector("p");
      if (v && el) el.textContent = v;
    });

    setText(".contact-info h3", p.contact_heading);
    setText(".contact-info > p", p.contact_sub);
    var cMap = { Email: p.contact_email, Location: p.contact_location, Socials: p.contact_socials };
    Array.prototype.forEach.call(D.querySelectorAll(".contact-item"), function (item) {
      var h = item.querySelector("h4");
      if (!h) return;
      var v = cMap[h.textContent.trim()];
      var el = item.querySelector("p");
      if (v && el) el.textContent = v;
    });

    if (p.footer_text) {
      var f = q(".footer p");
      if (f) {
        f.innerHTML = '© <span id="year"></span> ' + esc(p.footer_text);
        var y = D.getElementById("year");
        if (y) y.textContent = new Date().getFullYear();
      }
    }
  }

  /* ---------- Stats ---------- */
  function renderStats(list) {
    var wrap = q(".about-stats");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list
      .map(function (s) {
        return (
          '<div class="stat"><strong class="stat-num" data-count="' + esc(s.num) + '">0</strong><span>' +
          esc(s.label) +
          "</span></div>"
        );
      })
      .join("");
  }

  /* ---------- Services ---------- */
  function renderServices(list) {
    var wrap = q(".skills-container");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list
      .map(function (s) {
        var tags = (s.tags || [])
          .map(function (t) {
            return '<span class="skill-tag">' + esc(t) + "</span>";
          })
          .join("");
        return (
          '<div class="skills-group"><div class="skills-group-head"><span class="skills-group-icon">' +
          esc(s.icon || "🎨") +
          "</span><h3>" + esc(s.title) + "</h3></div>" +
          '<div class="skills-list">' + tags + "</div></div>"
        );
      })
      .join("");
  }

  /* ---------- Tools ---------- */
  function renderTools(list) {
    var wrap = q(".tools-list");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list
      .map(function (t) {
        return '<span class="tool-chip">' + esc(t.name) + "</span>";
      })
      .join("");
  }

  /* ---------- Projects ---------- */
  function renderProjects(list) {
    var wrap = q(".projects-container");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list
      .map(function (p) {
        var v = Number(p.variant) || 0;
        var tags = (p.tags || [])
          .map(function (t) {
            return "<span>" + esc(t) + "</span>";
          })
          .join("");
        return (
          '<article class="project-card">' +
          '<div class="project-image' + (v > 0 ? " alt-" + v : "") + '">' +
          '<span class="project-emoji">' + esc(p.emoji || "🎨") + "</span></div>" +
          '<div class="project-content"><h3>' + esc(p.title) + "</h3><p>" + esc(p.description) + "</p>" +
          '<div class="project-tags">' + tags + "</div>" +
          '<div class="project-links">' +
          '<a href="' + esc(p.view_url || "#") + '" class="btn btn-small">View Samples</a>' +
          '<a href="' + esc(p.case_url || "#") + '" class="btn btn-small btn-outline">Case Study</a>' +
          "</div></div></article>"
        );
      })
      .join("");
  }

  /* ---------- Experience ---------- */
  function renderTimeline(list) {
    var wrap = q(".timeline");
    if (!wrap || !list.length) return;
    wrap.innerHTML = list
      .map(function (e) {
        return (
          '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content">' +
          '<span class="timeline-date">' + esc(e.date_label) + "</span>" +
          "<h3>" + esc(e.title) + "</h3><p>" + esc(e.description) + "</p></div></div>"
        );
      })
      .join("");
  }

  /* ---------- Load all ---------- */
  Promise.all([
    rows("profile?select=*"),
    rows("stats?select=*&order=sort.asc"),
    rows("services?select=*&order=sort.asc"),
    rows("tools?select=*&order=sort.asc"),
    rows("projects?select=*&order=sort.asc"),
    rows("experience?select=*&order=sort.asc")
  ])
    .then(function (res) {
      renderProfile(res[0][0]);
      renderStats(res[1]);
      renderServices(res[2]);
      renderTools(res[3]);
      renderProjects(res[4]);
      renderTimeline(res[5]);
      if (window.PortfolioUI && window.PortfolioUI.refresh) window.PortfolioUI.refresh();
    })
    .catch(function (e) {
      console.warn("Content load skipped:", e);
    });
})();
