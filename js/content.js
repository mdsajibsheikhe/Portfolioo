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
    var LEGACY = { ocean:"coastal", indigo:"slateblue", violet:"clay", rose:"clay", sunset:"coral", amber:"mustard", teal:"sage", lime:"sage", slate:"slateblue" };
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

    /* ---- site logo image ----
       logo_image তে "MD SAJIB SHEIKH" মতো লেখা থাকলে সেটা URL নয়,
       সেক্ষেত্রে image বসানো হয় না (নাহলে /MD%20SAJIB%20SHEIKH 404 হতো)। */
    var logoImg = D.querySelector(".nav-logo-img");
    var logoTxt = D.querySelector(".nav-logo-text");
    var logoVal = String(SET.logo_image || "").trim();
    var logoIsImg = /^(https?:|\/|\.\/|data:image)/i.test(logoVal) ||
                    /\.(png|jpe?g|svg|webp|gif|avif)$/i.test(logoVal);
    if (logoImg) {
      if (logoIsImg) {
        logoImg.src = logoVal;
        logoImg.hidden = false;
        if (logoTxt) logoTxt.hidden = true;
      } else {
        logoImg.hidden = true;
        logoImg.removeAttribute("src");
        if (logoTxt) logoTxt.hidden = false;
      }
    }

    /* ---- brand logo strip (admin থেকে upload করা ২/৩টা logo) ---- */
    var strip = D.getElementById("logo-strip");
    if (strip) {
      var logos = ["logo_1", "logo_2", "logo_3"]
        .map(function (k) { return String(SET[k] || "").trim(); })
        .filter(function (v) { return /^(https?:|\/|\.\/|data:image)/i.test(v); });
      if (logos.length) {
        strip.innerHTML = logos.map(function (u) {
          return '<img src="' + u.replace(/"/g, "&quot;") + '" alt="Brand logo" loading="lazy" />';
        }).join("");
        strip.hidden = false;
      } else {
        strip.innerHTML = "";
        strip.hidden = true;
      }
    }

    /* ---- hero avatar-এর tool badges ----
       সংখ্যা (add/delete), লোগো/লেখা, রং, সাইজ, background transparent —
       সবই admin থেকে পরিবর্তনযোগ্য। count key না থাকলে ডিফল্ট ৩টা। */
    var host = document.getElementById("hero-tools");
    if (host) {
      var T_SET = "hero_tool_";
      var T_KEYS = ["icon", "label", "bg", "fg", "size", "img", "bgt"];
      var T_DEF = [
        { icon: "", label: "Ai", bg: "#332211", fg: "#ff9a00", size: 60, bgt: "" },
        { icon: "", label: "Ps", bg: "#001e36", fg: "#31a8ff", size: 60, bgt: "" },
        { icon: "figma", label: "Figma", bg: "#1e1e1e", fg: "#ffffff", size: 60, bgt: "" },
        { icon: "canva", label: "Canva", bg: "#0e1726", fg: "#7ed3f7", size: 60, bgt: "" },
        { icon: "sketch", label: "Sketch", bg: "#2b1f0e", fg: "#fdb300", size: 60, bgt: "" },
        { icon: "framer", label: "Framer", bg: "#111111", fg: "#ffffff", size: 60, bgt: "" }
      ];
      var MAXB = T_DEF.length;

      var cnt = parseInt(SET[T_SET + "count"], 10);
      if (!cnt || isNaN(cnt) || cnt < 1) {
        cnt = 0;
        for (var ci = 1; ci <= MAXB; ci++) {
          for (var ck = 0; ck < T_KEYS.length; ck++) {
            if (SET[T_SET + ci + "_" + T_KEYS[ck]] !== undefined) { cnt = ci; break; }
          }
        }
        if (!cnt) cnt = 3;                 /* ডিফল্ট: ৩টা badge */
      }
      if (cnt > MAXB) cnt = MAXB;

      var th = "";
      for (var tn = 1; tn <= cnt; tn++) {
        var td = T_DEF[tn - 1] || T_DEF[0];
        var get = function (key, fallback) {
          var v = SET[T_SET + tn + "_" + key];
          return String(v === undefined || v === null ? fallback : v).trim();
        };
        var bIco  = get("icon", td.icon).toLowerCase();
        var bLab  = get("label", td.label);
        var bBg   = get("bg", td.bg);
        var bFg   = get("fg", td.fg);
        var bImg  = get("img", "");
        var bTran = get("bgt", td.bgt) === "1";        /* transparent background */
        var bSz   = parseInt(get("size", td.size), 10);
        if (!bSz || isNaN(bSz) || bSz < 34 || bSz > 110) bSz = 60;

        var inner, cls = "tool-icon tool-badge p" + (((tn - 1) % 6) + 1);
        var isImg = (bIco === "upload" && /^(https?:|\/|\.\/|data:image)/i.test(bImg));

        if (isImg) {                                    /* নিজের upload করা icon */
          /* loading="lazy" রাখা হয় না — badge সবসময় hero-র দৃশ্যমান অংশে বসে,
             lazy হলে কিছু ব্রাউজারে ছবি আসলেই লোড হতে দেরি/ব্যর্থ হয় */
          inner = '<img src="' + esc(bImg) + '" alt="" />';
          cls += " tool-img";
        } else {
          /* upload মোড বাছা আছে কিন্তু ছবি এখনো দেওয়া হয়নি → ফাঁকা না দেখিয়ে
             স্লটের ডিফল্ট লোগো দেখাও */
          var bIco2 = (bIco === "upload") ? td.icon : bIco;
          var brand = (bIco2 && window.ICONS && ICONS.brand)
            ? ICONS.brand(bIco2, Math.round(bSz * 0.44)) : "";
          if (brand) inner = brand;                      /* আসল vector লোগো */
          else if (bLab) {                               /* টেক্সট (Ai, Ps, Canva …) */
            inner = esc(bLab);
            cls += " tool-text";
          } else continue;                               /* কিছু নেই → লুকাও */
        }

        if (bTran) cls += " tool-transparent";           /* transparent bg */
        th += '<span class="' + cls + '" style="background:' + (bTran ? "transparent" : esc(bBg || "#1e1e1e")) +
              ";color:" + esc(bFg || "#ffffff") +
              ";width:" + bSz + "px;height:" + bSz + "px" +
              ";border-radius:" + Math.round(bSz * 0.26) + "px" +
              ";font-size:" + Math.round(bSz * 0.27) + "px\"'>" + inner + "</span>";
      }
      host.innerHTML = th;
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

  /* ---------- নাম ও favicon ("Your Full Name" থেকে) ----------
     সাইটের সব জায়গায় একই নাম বসে এবং favicon-ও সেই নাম থেকেই আসে। */
  function applyBrandName(nm) {
    nm = String(nm || "").trim();

    function setMeta(sel, attr, val) {
      if (!val) return;
      var el = D.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    }

    if (nm) {
      setMeta('meta[property="og:site_name"]', "content", nm);
      setMeta('meta[name="author"]', "content", nm);
      var ld = D.getElementById("ld-person");
      if (ld) {
        try {
          var obj = JSON.parse(ld.textContent);
          if (obj && typeof obj === "object") {
            obj.name = nm;
            ld.textContent = JSON.stringify(obj);
          }
        } catch (e) { /* ignore */ }
      }
    }

    /* favicon: নিজে আপলোড করা ছবি থাকলে সেটা,
       নাহলে নামের প্রথম অক্ষর দিয়ে theme রঙে icon বানাও */
    var custom = String(SET.favicon || "").trim();
    var href = custom, type = "";

    if (!custom && nm) {
      var parts = nm.split(/\s+/).filter(Boolean);
      var ini = (parts.length >= 2 ? parts[0].charAt(0) + parts[1].charAt(0) : nm.slice(0, 2)).toUpperCase();
      var bg = "#059669";
      try {
        var cs = getComputedStyle(D.documentElement).getPropertyValue("--c1").trim();
        if (cs) bg = cs;
      } catch (e) { /* keep default */ }
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="14" fill="' + bg + '"/>' +
        '<text x="32" y="43" text-anchor="middle" ' +
        'font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="28" font-weight="700" ' +
        'fill="#ffffff">' + ini + "</text></svg>";
      href = "data:image/svg+xml," + encodeURIComponent(svg);
      type = "image/svg+xml";
    }

    if (!href) return;
    var links = D.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    if (!links.length) {
      var l = D.createElement("link");
      l.rel = "icon";
      D.head.appendChild(l);
      links = [l];
    }
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute("href", href);
      if (type) links[i].setAttribute("type", type);
    }
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

    // CV links — cv_url খালি/ "#" হলে button লুকিয়ে দাও (dead link থাকবে না)
    var cv = String(p.cv_url || "").trim();
    D.querySelectorAll(".nav-cv, .about-btn").forEach(function (a) {
      if (cv && cv !== "#") { a.href = cv; a.hidden = false; a.removeAttribute("aria-hidden"); }
      else { a.href = "#"; a.hidden = true; a.setAttribute("aria-hidden", "true"); }
    });

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
    wrap.innerHTML = list.map(function (s, i) {
      var tags = (s.tags || []).map(function (t) { return '<span class="skill-tag">' + esc(t) + "</span>"; }).join("");
      var ico = window.ICONS ? ICONS.resolve(s.icon, "palette", 26) : esc(s.icon || "");
      /* Real uploaded photo becomes a banner across the top of the card.
         Without one, the card stays clean — icon tile + title. */
      var banner = s.image
        ? '<div class="skills-media">' +
            '<img class="skills-media-img" src="' + esc(s.image) + '" alt="' + esc(s.title) + '" loading="lazy" />' +
            '<span class="skills-media-veil"></span>' +
          "</div>"
        : "";
      var tl = Array.isArray(s.tools) ? s.tools : [];
      var tools = tl.filter(function (x) { return String(x || "").trim(); })
        .map(function (t) { return '<span class="tool-mini">' + esc(t) + "</span>"; }).join("");
      var toolsRow = tools
        ? '<div class="service-tools"><span class="service-tools-label">' +
          (window.ICONS ? ICONS.svg("zap", 13) : "") + esc(SET.tools_used_label || "Tools used") +
          "</span>" + tools + "</div>"
        : "";
      return '<article class="skills-group' + (s.image ? " has-media" : "") + '" style="--i:' + i + '">' +
        banner +
        '<div class="skills-body">' +
          '<div class="skills-group-head"><span class="skills-group-icon">' + ico + "</span><h3>" + esc(s.title) + "</h3></div>" +
          '<div class="skills-list">' + tags + "</div>" + toolsRow +
        "</div></article>";
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
    /* admin যদি emoji লিখে রাখে, তবু premium icon দেখাও (emoji দেখাবে না) */
    var EMOJI_ICO = {
      "▶️": "video", "▶": "video", "📱": "image", "📦": "package",
      "🎯": "target", "🎨": "palette", "⚡": "zap", "🖨️": "printer",
      "✏️": "pen", "🖼️": "image", "🎬": "video", "🧩": "layers",
      "📄": "file", "🚀": "rocket", "💡": "bulb", "🤖": "settings",
      "🖌️": "pen", "🎞️": "video", "🗂️": "folder", "⭐": "star"
    };
    var live = function (v) {
      v = String(v || "").trim();
      return v && v !== "#" && v.toLowerCase().indexOf("javascript:") !== 0;
    };
    wrap.innerHTML = list.map(function (p) {
      var v = Number(p.variant) || 0;
      var tagArr = (p.tags || []).filter(function (x) { return String(x || "").trim(); });
      var tags = tagArr.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
      var cat = tagArr.length ? '<span class="project-cat">' + esc(tagArr[0]) + "</span>" : "";

      /* Prefer the proper icon column; fall back to the legacy emoji field,
         which is mapped to a real glyph — an emoji is never drawn. */
      var raw = String(p.emoji || "").trim();
      var ico = p.icon || EMOJI_ICO[raw] || (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(raw) ? raw : "");
      if (ico && window.ICONS && !ICONS.has(ico)) ico = "layers";
      if (!ico) ico = "layers";

      var media = p.image
        ? '<img class="project-img" src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" />'
        : '<span class="project-ico">' + (window.ICONS ? ICONS.resolve(ico, "layers", 58) : "") + "</span>";

      var boxCls = "project-image" + (p.image ? " has-img" : (v > 0 ? " alt-" + v : ""));
      var links = "";
      if (live(p.view_url)) {
        links += '<a href="' + esc(p.view_url) + '" class="btn btn-small" target="_blank" rel="noopener">' + esc(btnView) + "</a>";
      }
      if (live(p.case_url)) {
        links += '<a href="' + esc(p.case_url) + '" class="btn btn-small btn-outline" target="_blank" rel="noopener">' + esc(btnCase) + "</a>";
      }
      var linksRow = links ? '<div class="project-links">' + links + "</div>" : "";

      /* Hover veil + arrow appear over the artwork; the title stays below either way. */
      var veil = '<span class="project-veil"></span><span class="project-arrow" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg></span>';

      return '<article class="project-card">' +
        '<div class="' + boxCls + '">' + media + veil + cat + "</div>" +
        '<div class="project-content"><h3>' + esc(p.title) + "</h3><p>" + esc(p.description) + "</p>" +
        '<div class="project-tags">' + tags + "</div>" +
        linksRow + "</div></article>";
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

    /* পরের card-এর একটু অংশ দেখা যাবে (peek) — বোঝা যায় এটা slider */
    function peek() { return perView() >= 3 ? 0.22 : 0.12; }

    function maxIdx() { return Math.max(0, cards.length - perView()); }

    function cardStep() { return (cards[0] ? cards[0].offsetWidth : 300) + 24; }

    function layout() {
      var pv = perView();
      var gap = 24;
      var w = track.clientWidth || slider.clientWidth;
      var cardW = Math.max(240, Math.floor((w - gap * (pv - 1)) / (pv + peek())));
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

    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    /* wrap-around — শেষে গিয়ে আবার শুরুতে ফিরে আসে, তাই arrow সবসময় কাজ করে */
    function go(n) {
      var m = maxIdx();
      if (m <= 0) { idx = 0; layout(); return; }
      idx = n < 0 ? m : (n > m ? 0 : n);
      layout();
    }

    function step(d) { go(idx + d); auto(); }

    function auto() {
      clearInterval(revTimer);
      if (reduce || cards.length <= perView()) return;
      revTimer = setInterval(function () { go(idx >= maxIdx() ? 0 : idx + 1); }, 5000);
    }

    var prev = q("#rev-prev");
    var next = q("#rev-next");
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
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
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    });

    /* mouse drag (ডেস্কটপ) */
    var mx = 0, mdx = 0, mdrag = false;
    track.addEventListener("mousedown", function (e) {
      if (e.button) return;
      mdrag = true; mx = e.clientX; mdx = 0;
      track.style.transition = "none";
      clearInterval(revTimer);
    });
    window.addEventListener("mousemove", function (e) {
      if (!mdrag) return;
      mdx = e.clientX - mx;
      track.style.transform = "translateX(-" + (idx * cardStep() - mdx) + "px)";
    });
    window.addEventListener("mouseup", function () {
      if (!mdrag) return;
      mdrag = false;
      track.style.transition = "";
      if (Math.abs(mdx) > 50) step(mdx < 0 ? 1 : -1);
      else { layout(); auto(); }
    });
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });

    /* ট্যাব hidden হলে autoplay থামাও */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(revTimer);
      else auto();
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
      sendEmailNote(data);

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
    /* SB.table returns a promise, so a try/catch here would not see the
       failure — log it instead. Losing a visitor's message silently is
       how the RLS bug below stayed invisible. */
    try {
      SB.table("messages", { method: "POST", body: data }).catch(function (err) {
        console.error("[contact] message was NOT saved to Supabase:", err && err.message);
      });
    } catch (e) {
      console.error("[contact] message was NOT saved to Supabase:", e && e.message);
    }
  }

  /* ---------- email notification (zero setup) ----------
     FormSubmit forwards the submission straight to your inbox. It is free,
     unlimited, and needs no API key — but it only accepts requests that come
     from a real browser. The same call made by the serverless function is
     rejected with 403, so it has to happen here.

     The recipient is the public "Info: Email" from the About page, so no
     secret is exposed by calling it from the client.

     One-time step: the first submission makes FormSubmit email you an
     "Activate Form" link. Click it once and every message after that
     arrives automatically. */
  function sendEmailNote(data) {
    var to = String(SET.about_email || SET.contact_email || "").trim();
    if (!to || to.indexOf("@") < 0 || to.indexOf(".") < 0) return;
    try {
      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "New contact: " + (data.subject || "Portfolio enquiry") + " — " + data.name,
          _captcha: "false",
          _template: "table",
          Name: data.name,
          "Sender email": data.email,
          Subject: data.subject || "—",
          Message: data.message
        })
      }).catch(function () { /* a notification failure must never break the form */ });
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
    applyBrandName(r[0][0] && r[0][0].name);   // নাম + favicon
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
