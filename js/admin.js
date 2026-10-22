/* ============================================================
   Admin Panel logic — Supabase CRUD
   ============================================================ */
(function () {
  if (!window.SB) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function esc(v) {
    return String(v === null || v === undefined ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /* ============ FORM SCHEMAS ============ */
  var FORMS = {
    profile: {
      el: "#form-profile", save: "#save-profile", status: "#status-profile", table: "profile",
      fields: [
        { k: "site_title", l: "Browser tab title" },
        { k: "hello", l: "Hero greeting (Hello)" },
        { k: "name", l: "Your full name" },
        { k: "profession", l: "Hero profession (last word = green)" },
        { k: "hero_desc", l: "Hero description", t: "textarea", wide: true },
        { k: "avatar", l: "Avatar initials (e.g. MS)" },
        { k: "cv_url", l: "Download CV link" },
        { k: "linkedin", l: "LinkedIn URL (খালি রাখলে hero-তে লুকিয়ে যাবে)" },
        { k: "behance", l: "Behance URL (খালি রাখলে লুকিয়ে যাবে)" },
        { k: "whatsapp", l: "WhatsApp number (+8801... — hero icon ও popup-এ ব্যবহার হবে)" },
        { k: "facebook", l: "Facebook URL (খালি রাখলে লুকিয়ে যাবে)" },
        { k: "instagram", l: "Instagram URL (খালি রাখলে লুকিয়ে যাবে)" },
        { k: "twitter", l: "X / Twitter URL (খালি রাখলে লুকিয়ে যাবে)" },
        { k: "footer_text", l: "Footer text", wide: true }
      ]
    },
    about: {
      el: "#form-about", save: "#save-about", status: "#status-about", table: "profile",
      fields: [
        { k: "about_heading", l: "About heading" },
        { k: "exp_years", l: "Experience badge (5+)" },
        { k: "about_p1", l: "Paragraph 1", t: "textarea", wide: true },
        { k: "about_p2", l: "Paragraph 2", t: "textarea", wide: true },
        { k: "about_name", l: "Info: Name" },
        { k: "about_email", l: "Info: Email" },
        { k: "about_location", l: "Info: Location" },
        { k: "about_status", l: "Info: Status" }
      ]
    },
    contact: {
      el: "#form-contact", save: "#save-contact", status: "#status-contact", table: "profile",
      fields: [
        { k: "contact_heading", l: "Contact heading", wide: true },
        { k: "contact_sub", l: "Contact subtitle", t: "textarea", wide: true },
        { k: "contact_email", l: "Email" },
        { k: "contact_location", l: "Location" },
        { k: "contact_socials", l: "Socials line" }
      ]
    }
  };

  var LISTS = {
    stats: {
      table: "stats", el: "#list-stats", status: "#status-stats",
      fields: [
        { k: "num", l: "Number", t: "number" },
        { k: "label", l: "Label" },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { num: 0, label: "", sort: 0 }
    },
    services: {
      table: "services", el: "#list-services", status: "#status-services",
      fields: [
        { k: "icon", l: "Icon — icon name লিখুন (palette, layers, video, package, brush, image, type, zap, award, briefcase…) অথবা emoji" },
        { k: "title", l: "Title" },
        { k: "image", l: "Image icon (optional — icon/emoji-এর বদলে নিজের ছবি)", t: "image", wide: true },
        { k: "tags", l: "Skill tags (comma separated)", t: "tags", wide: true },
        { k: "tools", l: "Tools used (comma separated — admin থেকে যেকোনো সময় বদলান)", t: "tags", wide: true },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { icon: "palette", title: "", image: "", tags: "", tools: "", sort: 0 }
    },
    tools: {
      table: "tools", el: "#list-tools", status: "#status-tools",
      fields: [
        { k: "name", l: "Tool name" },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { name: "", sort: 0 }
    },
    projects: {
      table: "projects", el: "#list-projects", status: "#status-projects",
      fields: [
        { k: "emoji", l: "Emoji" },
        { k: "title", l: "Title" },
        { k: "image", l: "Cover image (optional — emoji-এর বদলে)", t: "image", wide: true },
        { k: "description", l: "Description", t: "textarea", wide: true },
        { k: "tags", l: "Tags (comma separated)", t: "tags", wide: true },
        { k: "view_url", l: "View link" },
        { k: "case_url", l: "Case study link" },
        { k: "variant", l: "Card color (0-3)", t: "number" },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { emoji: "🎨", title: "", image: "", description: "", tags: "", view_url: "#", case_url: "#", variant: 0, sort: 0 }
    },
    experience: {
      table: "experience", el: "#list-experience", status: "#status-experience",
      fields: [
        { k: "date_label", l: "Date range (2021 — Present)" },
        { k: "title", l: "Title" },
        { k: "description", l: "Description", t: "textarea", wide: true },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { date_label: "", title: "", description: "", sort: 0 }
    },
    testimonials: {
      table: "testimonials", el: "#list-testimonials", status: "#status-testimonials",
      fields: [
        { k: "name", l: "Client name" },
        { k: "role", l: "Role (e.g. YouTube Creator)" },
        { k: "company", l: "Company / Brand" },
        { k: "rating", l: "Rating (1-5)", t: "number" },
        { k: "avatar", l: "Photo (optional — না দিলে নামের প্রথম অক্ষর দেখাবে)", t: "image", wide: true },
        { k: "text", l: "Review text", t: "textarea", wide: true },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { name: "", role: "", company: "", rating: 5, avatar: "", text: "", sort: 0 }
    }
  };

  var TITLES = {
    dashboard: "Dashboard",
    profile: "Home",
    about: "About",
    contact: "Contact & Footer",
    theme: "Theme & Images",
    labels: "Text & Labels",
    seo: "SEO",
    stats: "Stats",
    services: "Services",
    tools: "Tools",
    projects: "Work / Projects",
    experience: "Experience",
    testimonials: "Client Reviews",
    messages: "Messages"
  };

  /* ============ SETTINGS (text & labels) ============ */
  var SETTINGS_GROUPS = [
    { group: "Navigation & Logo", keys: [
      { k: "nav_logo", l: "Logo text" },
      { k: "nav_home", l: "Menu: Home" },
      { k: "nav_about", l: "Menu: About" },
      { k: "nav_services", l: "Menu: Services" },
      { k: "nav_work", l: "Menu: Work" },
      { k: "nav_experience", l: "Menu: Experience" },
      { k: "nav_contact", l: "Menu: Contact" },
      { k: "nav_cv", l: "Button: Download CV" },
      { k: "loader_text", l: "Loader text" }
    ]},
    { group: "Hero", keys: [
      { k: "site_title", l: "Browser tab title" },
      { k: "watermark", l: "Hero background word (PORTFOLIO)" },
      { k: "hero_btn_about", l: "Button: About Me" }
    ]},
    { group: "About section", keys: [
      { k: "about_eyebrow", l: "Eyebrow (small text)" },
      { k: "about_title", l: "Title — main word" },
      { k: "about_title_accent", l: "Title — green word" },
      { k: "badge_years_label", l: "Experience badge label", t: "textarea" },
      { k: "about_cv", l: "Button: Download CV" },
      { k: "info_label_name", l: "Info label: Name" },
      { k: "info_label_email", l: "Info label: Email" },
      { k: "info_label_location", l: "Info label: Location" },
      { k: "info_label_status", l: "Info label: Status" }
    ]},
    { group: "Services section", keys: [
      { k: "services_eyebrow", l: "Eyebrow" },
      { k: "services_title", l: "Title — main word" },
      { k: "services_title_accent", l: "Title — green word" },
      { k: "tools_used_label", l: "Label above tools list (Tools used)" },
      { k: "tools_label", l: "Tools label" }
    ]},
    { group: "Work section", keys: [
      { k: "work_eyebrow", l: "Eyebrow" },
      { k: "work_title", l: "Title — main word" },
      { k: "work_title_accent", l: "Title — green word" },
      { k: "project_btn_view", l: "Card button 1" },
      { k: "project_btn_case", l: "Card button 2" }
    ]},
    { group: "Experience section", keys: [
      { k: "exp_eyebrow", l: "Eyebrow" },
      { k: "exp_title", l: "Title — main word" },
      { k: "exp_title_accent", l: "Title — green word" }
    ]},
    { group: "Contact section", keys: [
      { k: "contact_eyebrow", l: "Eyebrow" },
      { k: "contact_title", l: "Title — main word" },
      { k: "contact_title_accent", l: "Title — green word" },
      { k: "contact_item_email", l: "Item label: Email" },
      { k: "contact_item_whatsapp", l: "Item label: WhatsApp" },
      { k: "contact_item_location", l: "Item label: Location" },
      { k: "contact_item_socials", l: "Item label: Socials" }
    ]},
    { group: "Thank-you popup", keys: [
      { k: "popup_title", l: "Popup title" },
      { k: "popup_text", l: "Popup message", t: "textarea" },
      { k: "popup_btn", l: "Popup button" }
    ]},
    { group: "Contact form", keys: [
      { k: "form_name_label", l: "Label: Name" },
      { k: "form_name_ph", l: "Placeholder: Name" },
      { k: "form_email_label", l: "Label: Email" },
      { k: "form_email_ph", l: "Placeholder: Email" },
      { k: "form_subject_label", l: "Label: Subject" },
      { k: "form_subject_ph", l: "Placeholder: Subject" },
      { k: "form_message_label", l: "Label: Message" },
      { k: "form_message_ph", l: "Placeholder: Message" },
      { k: "form_submit", l: "Submit button" }
    ]}
  ];

  /* ============ STATE ============ */
  var state = {
    profile: {},
    settings: {},
    stats: [],
    services: [],
    tools: [],
    projects: [],
    experience: [],
    testimonials: [],
    messages: []
  };
  var persisted = { stats: [], services: [], tools: [], projects: [], experience: [], testimonials: [] };

  /* ============ ALERT ============ */
  var alertBox = $("#alert");
  var alertMsg = $("#alert-msg");
  var alertTimer = null;

  function showAlert(msg, type) {
    if (!alertBox) return;
    alertMsg.textContent = msg;
    alertBox.className = "alert " + (type === "info" ? "alert-info" : "alert-success");
    alertBox.querySelector(".alert-tag").textContent = type === "info" ? "Info" : "Success";
    alertBox.hidden = false;
    clearTimeout(alertTimer);
    alertTimer = setTimeout(function () { alertBox.hidden = true; }, 6000);
  }

  function setStatus(sel, msg, ok) {
    var el = $(sel);
    if (!el) return;
    el.textContent = msg;
    el.className = "save-status " + (ok ? "ok" : "err");
  }

  /* ============ LOGIN / APP ============ */
  var loginWrap = $("#login-wrap");
  var app = $("#app");

  function showApp() {
    loginWrap.hidden = true;
    app.hidden = false;
  }

  function showLogin() {
    loginWrap.hidden = false;
    app.hidden = true;
  }

  $("#login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = $("#login-btn");
    var st = $("#login-status");
    btn.disabled = true;
    st.textContent = "Signing in…";
    st.className = "login-status";
    try {
      await SB.login($("#login-email").value.trim(), $("#login-pass").value);
      st.textContent = "✅ Welcome back!";
      st.className = "login-status ok";
      await boot();
    } catch (err) {
      st.textContent = "❌ " + err.message;
      st.className = "login-status err";
    }
    btn.disabled = false;
  });

  $("#logout-btn").addEventListener("click", async function () {
    await SB.logout();
    showLogin();
  });

  /* ============ TABS ============ */
  function switchTab(name) {
    $$(".side-link").forEach(function (b) { b.classList.toggle("active", b.dataset.tab === name); });
    $$(".tab-panel").forEach(function (p) { p.hidden = p.id !== "tab-" + name; });
    $("#page-title").textContent = TITLES[name] || name;
    $("#crumb-current").textContent = TITLES[name] || name;
    if (name === "messages") loadMessages();
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$(".side-link").forEach(function (b) {
    b.addEventListener("click", function () { switchTab(b.dataset.tab); });
  });
  $$("[data-tab-jump]").forEach(function (b) {
    b.addEventListener("click", function () { switchTab(b.dataset.tabJump); });
  });
  /* dashboard-এর সব quick button এক document handler দিয়ে —
     আগে শুধু #quick-grid bind হতো, তাই greet-card-এর
     "Manage work" / "Theme & images" বাটন কাজ করত না। */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".quick-btn[data-tab]");
    if (b) switchTab(b.getAttribute("data-tab"));
  });

  /* ============ SIDEBAR (mobile) ============ */
  var sidebar = $("#sidebar");
  var sideOverlay = $("#side-overlay");

  function closeSidebar() {
    sidebar.classList.remove("open");
    sideOverlay.classList.remove("show");
  }

  $("#hamburger").addEventListener("click", function () {
    sidebar.classList.toggle("open");
    sideOverlay.classList.toggle("show");
  });
  sideOverlay.addEventListener("click", closeSidebar);

  /* ============ SEARCH ============ */
  $("#top-search").addEventListener("input", function (e) {
    var term = e.target.value.trim().toLowerCase();
    if (!term) {
      $$(".side-link").forEach(function (b) { b.style.display = ""; });
      return;
    }
    $$(".side-link").forEach(function (b) {
      b.style.display = b.textContent.toLowerCase().indexOf(term) > -1 ? "" : "none";
    });
  });

  /* ============ ADMIN THEME ============ */
  $("#admin-theme").addEventListener("click", function () {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    var icon = this.querySelector("span");
    if (icon && window.ICONS) {
      icon.innerHTML = window.ICONS.svg(next === "dark" ? "sun" : "moon", 18);
      icon.dataset.sicoDone = "1";
    }
  });

  $("#alert-x").addEventListener("click", function () { alertBox.hidden = true; });

  /* ============ RENDER: single forms ============ */
  function fieldHtml(f, val) {
    var v = val === null || val === undefined ? "" : val;
    var wide = f.wide ? " wide" : "";
    var input;
    if (f.t === "textarea") {
      input = '<textarea data-k="' + f.k + '" rows="3">' + esc(v) + "</textarea>";
    } else {
      input = '<input type="' + (f.t === "number" ? "number" : "text") + '" data-k="' + f.k + '" value="' + esc(v) + '" />';
    }
    return '<div class="field' + wide + '"><label>' + esc(f.l) + "</label>" + input + "</div>";
  }

  function renderForm(name) {
    var cfg = FORMS[name];
    var host = $(cfg.el);
    host.innerHTML = cfg.fields.map(function (f) { return fieldHtml(f, state.profile[f.k]); }).join("");
    host.oninput = function (e) {
      var k = e.target.dataset.k;
      if (k) state.profile[k] = e.target.value;
    };
  }

  async function saveForm(name) {
    var cfg = FORMS[name];
    setStatus(cfg.status, "Saving…", true);
    try {
      state.profile.updated_at = new Date().toISOString();
      await SB.table(cfg.table + "?on_conflict=id", {
        method: "POST",
        body: state.profile,
        prefer: "resolution=merge-duplicates"
      });
      setStatus(cfg.status, "✅ Saved — live site-এ reload করলেই দেখা যাবে।", true);
      showAlert("Profile updated. Open the live site to see changes.", "info");
    } catch (err) {
      setStatus(cfg.status, "❌ " + err.message, false);
    }
  }

  $("#save-profile").addEventListener("click", function () { saveForm("profile"); });
  $("#save-about").addEventListener("click", function () { saveForm("about"); });
  $("#save-contact").addEventListener("click", function () { saveForm("contact"); });

  /* ============ APPEARANCE: 10 color themes ============ */
  var THEMES = [
    { id: "emerald",    n: "Emerald",     c: ["#059669", "#10b981", "#34d399"] },
    { id: "autumn",     n: "Autumn",      c: ["#8e5c63", "#a8757c", "#c9a0a5"] },
    { id: "sage",       n: "Sage",        c: ["#6f8a76", "#8fa794", "#b6c8ba"] },
    { id: "terracotta", n: "Terracotta",  c: ["#b85434", "#d96846", "#eda588"] },
    { id: "olive",      n: "Olive",       c: ["#4f5729", "#6b7540", "#9aa76d"] },
    { id: "coral",      n: "Coral",       c: ["#dd4f2b", "#ef6b3c", "#f5a06a"] },
    { id: "slateblue",  n: "Slate Blue",  c: ["#34495e", "#4a627a", "#8fa3b3"] },
    { id: "coastal",    n: "Coastal",     c: ["#2e4052", "#46627a", "#a5c9ca"] },
    { id: "mustard",    n: "Mustard",     c: ["#a8862f", "#d0b264", "#e6d4a0"] },
    { id: "clay",       n: "Clay",        c: ["#b8432a", "#c84b31", "#de8a72"] },
    { id: "custom",     n: "Custom",      c: null }
  ];

  /* পুরনো theme id থাকলে নতুন নামে বদলাও (admin.css ও style.css-তে নতুন list আছে) */
  var LEGACY = { ocean: "coastal", indigo: "slateblue", violet: "clay", rose: "clay",
                 sunset: "coral", amber: "mustard", teal: "sage", lime: "sage", slate: "slateblue" };

  function applyAdminTheme(id) {
    var cur = id || "emerald";
    if (LEGACY[cur]) cur = LEGACY[cur];
    var known = THEMES.some(function (t) { return t.id === cur; });
    if (!known) cur = "emerald";
    document.documentElement.setAttribute("data-color", cur);
    if (cur === "custom") {
      var rs = document.documentElement.style;
      rs.setProperty("--c1", state.settings.custom_c1 || "#059669");
      rs.setProperty("--c2", state.settings.custom_c2 || "#10b981");
      rs.setProperty("--c3", state.settings.custom_c3 || "#34d399");
    }
    return cur;
  }

  function renderThemePicker() {
    var g = $("#theme-grid");
    if (!g) return;
    var cur = state.settings.theme || "emerald";
    if (LEGACY[cur]) cur = LEGACY[cur];
    if (!THEMES.some(function (t) { return t.id === cur; })) cur = "emerald";

    g.innerHTML = THEMES.map(function (t) {
      var cols = t.c || [
        state.settings.custom_c1 || "#059669",
        state.settings.custom_c2 || "#10b981",
        state.settings.custom_c3 || "#34d399"
      ];
      var sw = cols.map(function (c) { return '<span class="sw" style="background:' + esc(c) + '"></span>'; }).join("");
      return '<button type="button" class="theme-card' + (cur === t.id ? " active" : "") + '" data-theme-id="' + t.id + '">' +
        '<span class="theme-swatches">' + sw + "</span>" +
        '<span class="theme-name">' + esc(t.n) + "</span>" +
        '<span class="theme-check">' + (cur === t.id ? '<span data-sico="check" data-sico-size="13"></span>' : "") + "</span>" +
        "</button>";
    }).join("");

    var cb = $("#custom-box");
    if (cb) cb.hidden = cur !== "custom";

    g.onclick = function (e) {
      var b = e.target.closest("[data-theme-id]");
      if (!b) return;
      state.settings.theme = b.getAttribute("data-theme-id");
      renderThemePicker();
      applyAdminTheme(state.settings.theme);
    };
  }

  function bindCustomColors() {
    var defs = [["cc1", "custom_c1"], ["cc2", "custom_c2"], ["cc3", "custom_c3"]];
    defs.forEach(function (d) {
      var el = $("#" + d[0]);
      if (!el) return;
      el.value = state.settings[d[1]] || el.value;
      el.oninput = function () {
        state.settings[d[1]] = el.value;
        if (state.settings.theme === "custom") applyAdminTheme("custom");
        renderThemePicker();
      };
    });
  }

  $("#save-theme").addEventListener("click", async function () {
    var st = "#status-theme";
    setStatus(st, "Saving…", true);
    try {
      var keys = ["theme", "custom_c1", "custom_c2", "custom_c3"];
      var payload = keys.map(function (k) { return { key: k, value: String(state.settings[k] || "") }; });
      await SB.table("settings?on_conflict=key", {
        method: "POST",
        body: payload,
        prefer: "resolution=merge-duplicates"
      });
      setStatus(st, "✅ Theme saved — live site reload করলেই দেখা যাবে।", true);
      showAlert("Color theme updated. Reload the live site to see it.", "info");
    } catch (err) {
      setStatus(st, "❌ " + err.message, false);
    }
  });

  /* ---- Images panel (logo + profile photo) ---- */
  var IMG_SETTINGS = [
    { k: "logo_image", l: "Header logo (image)", h: "খালি রাখলে নাম লেখা দেখাবে। Brand logo strip-এর জন্য উপরের Logo Manager ব্যবহার করুন।" },
    { k: "avatar_image", l: "Profile photo (hero + about)", h: "খালি রাখলে initials \"MS\" দেখাবে" }
  ];

  function renderImgSettings() {
    var host = $("#img-settings");
    if (!host) return;
    host.innerHTML = IMG_SETTINGS.map(function (f) {
      return imageFieldHtml("set." + f.k, f.l, f.h, state.settings[f.k]);
    }).join("");
  }

  $("#save-images").addEventListener("click", async function () {
    var st = "#status-images";
    setStatus(st, "Saving…", true);
    try {
      var payload = IMG_SETTINGS.map(function (f) {
        return { key: f.k, value: String(state.settings[f.k] || "") };
      });
      await SB.table("settings?on_conflict=key", {
        method: "POST",
        body: payload,
        prefer: "resolution=merge-duplicates"
      });
      setStatus(st, "✅ Images saved — live site reload করলেই দেখা যাবে।", true);
      showAlert("Images updated. Reload the live site to see changes.", "info");
    } catch (err) {
      setStatus(st, "❌ " + err.message, false);
    }
  });

  /* ============ RENDER: settings / labels ============ */
  function renderLabels() {
    var host = $("#form-labels");
    host.innerHTML = SETTINGS_GROUPS.map(function (g) {
      return (
        '<div class="panel-group"><h3 class="group-title">' + esc(g.group) + "</h3>" +
        '<div class="form-grid">' +
          g.keys.map(function (f) {
            var v = state.settings[f.k];
            v = v === null || v === undefined ? "" : v;
            var wide = f.t === "textarea" ? " wide" : "";
            var input = f.t === "textarea"
              ? '<textarea data-sk="' + f.k + '" rows="2">' + esc(v) + "</textarea>"
              : '<input type="text" data-sk="' + f.k + '" value="' + esc(v) + '" />';
            return '<div class="field' + wide + '"><label>' + esc(f.l) + "</label>" + input + "</div>";
          }).join("") +
        "</div></div>"
      );
    }).join("");

    host.oninput = function (e) {
      var k = e.target.dataset.sk;
      if (k) state.settings[k] = e.target.value;
    };
  }

  async function saveLabels() {
    var st = "#status-labels";
    setStatus(st, "Saving…", true);
    try {
      var payload = Object.keys(state.settings).map(function (k) {
        return { key: k, value: state.settings[k] === null || state.settings[k] === undefined ? "" : String(state.settings[k]) };
      });
      if (payload.length) {
        await SB.table("settings?on_conflict=key", {
          method: "POST",
          body: payload,
          prefer: "resolution=merge-duplicates"
        });
      }
      setStatus(st, "✅ " + payload.length + " label(s) saved — live site reload করলেই দেখা যাবে।", true);
      showAlert("Text & labels updated. Reload the live site to see changes.", "info");
    } catch (err) {
      setStatus(st, "❌ " + err.message, false);
    }
  }

  $("#save-labels").addEventListener("click", saveLabels);

  /* ============ RENDER: lists ============ */
  function fieldHtml2(f, val, idx, listName) {
    var v = val === null || val === undefined ? "" : val;
    var wide = f.wide ? " wide" : "";
    var input;
    if (f.t === "textarea") {
      input = '<textarea data-i="' + idx + '" data-k="' + f.k + '" rows="3">' + esc(v) + "</textarea>";
    } else if (f.t === "select") {
      input = '<select data-i="' + idx + '" data-k="' + f.k + '">' +
        f.options.map(function (o) {
          return '<option value="' + o + '"' + (String(v) === String(o) ? " selected" : "") + ">" + o + "</option>";
        }).join("") + "</select>";
    } else if (f.t === "image") {
      input = imageFieldHtml("list." + listName + "." + idx + "." + f.k, "", "", v);
      wide = " wide";
    } else {
      input = '<input type="' + (f.t === "number" ? "number" : "text") + '" data-i="' + idx + '" data-k="' + f.k + '" value="' + esc(v) + '" />';
    }
    var label = f.t === "image" ? "" : '<label>' + esc(f.l) + "</label>";
    return '<div class="field' + wide + '">' + label + input + "</div>";
  }

  /* ---------- shared image widget (upload → storage → URL) ---------- */
  function imageFieldHtml(path, label, hint, value) {
    var v = value === null || value === undefined ? "" : value;
    return '<div class="img-field">' +
      (label ? '<label>' + esc(label) + "</label>" : "") +
      (hint ? '<p class="field-hint">' + esc(hint) + "</p>" : "") +
      '<input type="text" class="img-text" data-imgtext="' + path + '" value="' + esc(v) + '" placeholder="Image URL" />' +
      '<div class="img-actions">' +
        '<button type="button" class="btn-mini" data-imgup="' + path + '"><span data-sico="upload" data-sico-size="15"></span> Upload image</button>' +
        '<button type="button" class="btn-mini ghost" data-imgclr="' + path + '"><span data-sico="close" data-sico-size="14"></span> Remove</button>' +
      "</div>" +
      (v ? '<img class="img-thumb" src="' + esc(v) + '" alt="" />'
         : '<div class="img-thumb empty">No image</div>') +
      '<input type="file" accept="image/*" hidden data-imgfile="' + path + '" />' +
      "</div>";
  }

  function imgParts(p) { return String(p).split("."); }

  function setImgValue(p, val) {
    var a = imgParts(p);
    if (a[0] === "set") state.settings[a[1]] = val;
    else if (a[0] === "list" && state[a[1]] && state[a[1]][+a[2]]) state[a[1]][+a[2]][a[3]] = val;
  }

  function updateThumb(p, val) {
    var el = document.querySelector('[data-imgtext="' + p + '"]');
    if (!el) return;
    var field = el.closest(".img-field");
    var old = field && field.querySelector(".img-thumb");
    if (!old) return;
    var html = val
      ? '<img class="img-thumb" src="' + esc(val) + '" alt="" />'
      : '<div class="img-thumb empty">No image</div>';
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    old.replaceWith(tmp.firstChild);
  }

  async function doImageUpload(path, file) {
    if (!file) return;
    if (file.type && file.type.indexOf("image/") !== 0) { showAlert("Image file নির্বাচন করুন।", "info"); return; }
    if (file.size > 5 * 1024 * 1024) { showAlert("সর্বোচ্চ ৫ MB ছবি হবে।", "info"); return; }
    var clean = String(file.name || "image").replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase();
    var prefix = imgParts(path).slice(0, 2).join("_");
    try {
      var url = await SB.upload("assets/" + prefix + "/" + Date.now() + "_" + clean, file);
      setImgValue(path, url);
      var txt = document.querySelector('[data-imgtext="' + path + '"]');
      if (txt) txt.value = url;
      updateThumb(path, url);
      showAlert("Image uploaded.", "info");
    } catch (e) {
      showAlert("Upload failed: " + e.message, "info");
    }
  }

  document.addEventListener("click", function (e) {
    var up = e.target.closest("[data-imgup]");
    if (up) {
      var fi = document.querySelector('[data-imgfile="' + up.getAttribute("data-imgup") + '"]');
      if (fi) { fi.value = ""; fi.click(); }
      return;
    }
    var clr = e.target.closest("[data-imgclr]");
    if (clr) {
      var p = clr.getAttribute("data-imgclr");
      setImgValue(p, "");
      var t = document.querySelector('[data-imgtext="' + p + '"]');
      if (t) t.value = "";
      updateThumb(p, "");
      return;
    }
  });

  document.addEventListener("change", function (e) {
    var fi = e.target.closest("[data-imgfile]");
    if (fi && fi.files && fi.files[0]) doImageUpload(fi.getAttribute("data-imgfile"), fi.files[0]);
  });

  document.addEventListener("input", function (e) {
    var t = e.target.closest("[data-imgtext]");
    if (t) {
      var p = t.getAttribute("data-imgtext");
      setImgValue(p, t.value);
      updateThumb(p, t.value);
    }
  });

  function renderList(name) {
    var cfg = LISTS[name];
    var host = $(cfg.el);
    var items = state[name];

    if (!items.length) {
      host.innerHTML = '<p class="empty-note">এখনো কিছু নেই — "+ Add" চেপে যোগ করুন।</p>';
      return;
    }

    host.innerHTML = items.map(function (item, i) {
      return (
        '<div class="item-card">' +
          '<div class="item-top">' +
            "<strong>" + (i + 1) + "</strong>" +
            '<div class="item-tools">' +
              '<button class="item-up" data-move="' + i + '" data-list="' + name + '">↑ Up</button>' +
              '<button class="item-del" data-del="' + i + '" data-list="' + name + '">Delete</button>' +
            "</div>" +
          "</div>" +
          '<div class="form-grid">' +
            cfg.fields.map(function (f) { return fieldHtml2(f, item[f.k], i, name); }).join("") +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function bindListInput(name) {
    var cfg = LISTS[name];
    $(cfg.el).addEventListener("input", function (e) {
      var i = e.target.dataset.i;
      var k = e.target.dataset.k;
      if (i === undefined || !k) return;
      state[name][+i][k] = e.target.value;
    });
    $(cfg.el).addEventListener("click", function (e) {
      var del = e.target.closest("[data-del]");
      var move = e.target.closest("[data-move]");
      if (del) {
        var idx = +del.dataset.del;
        state[name].splice(idx, 1);
        renderList(name);
      } else if (move) {
        var mi = +move.dataset.move;
        if (mi > 0) {
          var arr = state[name];
          var tmp = arr[mi - 1];
          arr[mi - 1] = arr[mi];
          arr[mi] = tmp;
          renderList(name);
        }
      }
    });
  }

  async function saveList(name) {
    var cfg = LISTS[name];
    setStatus(cfg.status, "Saving…", true);
    try {
      var items = state[name];
      for (var i = 0; i < items.length; i++) items[i].sort = i + 1;

      var payload = items.map(function (it) {
        var out = { id: it.id || uid() };
        it.id = out.id;
        cfg.fields.forEach(function (f) {
          var v = it[f.k];
          if (f.t === "number") out[f.k] = Number(v) || 0;
          else if (f.t === "tags") {
            out[f.k] = String(v || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
          } else out[f.k] = v === null || v === undefined ? "" : String(v);
        });
        out.sort = Number(out.sort) || i + 1;
        return out;
      });

      if (payload.length) {
        await SB.table(cfg.table + "?on_conflict=id", {
          method: "POST",
          body: payload,
          prefer: "resolution=merge-duplicates"
        });
      }

      var keep = payload.map(function (p) { return p.id; });
      for (var j = 0; j < persisted[name].length; j++) {
        var pid = persisted[name][j];
        if (keep.indexOf(pid) === -1) {
          await SB.table(cfg.table + "?id=eq." + pid, { method: "DELETE" });
        }
      }
      persisted[name] = keep;

      renderList(name);
      setStatus(cfg.status, "✅ " + payload.length + " item(s) saved.", true);
      showAlert(TITLES[name] + " updated successfully.", "info");
      refreshCounts();
    } catch (err) {
      setStatus(cfg.status, "❌ " + err.message, false);
    }
  }

  Object.keys(LISTS).forEach(function (name) {
    bindListInput(name);
    var addBtn = document.querySelector('[data-add="' + name + '"]');
    var saveBtn = document.querySelector('[data-save="' + name + '"]');
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        var blank = {};
        Object.keys(LISTS[name].blank).forEach(function (k) { blank[k] = LISTS[name].blank[k]; });
        blank.id = uid();
        blank.sort = state[name].length + 1;
        state[name].push(blank);
        renderList(name);
      });
    }
    if (saveBtn) saveBtn.addEventListener("click", function () { saveList(name); });
  });

  /* ============ MESSAGES ============ */
  async function loadMessages() {
    var host = $("#list-messages");
    host.innerHTML = '<p class="empty-note">Loading…</p>';
    try {
      var rows = await SB.table("messages?select=*&order=created_at.desc");
      state.messages = rows || [];
      renderMessages();
      updateMsgBadge();
    } catch (err) {
      host.innerHTML = '<p class="empty-note">❌ ' + esc(err.message) + "</p>";
    }
  }

  function renderMessages() {
    var host = $("#list-messages");
    if (!state.messages.length) {
      host.innerHTML = '<p class="empty-note">📭 কোনো message নেই।</p>';
      return;
    }
    host.innerHTML = state.messages.map(function (m) {
      var when = m.created_at ? new Date(m.created_at).toLocaleString() : "";
      return (
        '<div class="msg-card">' +
          '<div class="msg-head"><strong>' + esc(m.name || "Anonymous") + "</strong><span>" + esc(when) + "</span></div>" +
          '<div class="msg-sub">' + esc(m.email || "") + (m.subject ? " · " + esc(m.subject) : "") + "</div>" +
          '<div class="msg-body">' + esc(m.message) + "</div>" +
          '<div class="msg-actions"><button class="btn btn-danger" data-msg-del="' + esc(m.id) + '">Delete</button></div>' +
        "</div>"
      );
    }).join("");
  }

  $("#list-messages").addEventListener("click", async function (e) {
    var b = e.target.closest("[data-msg-del]");
    if (!b) return;
    try {
      await SB.table("messages?id=eq." + b.dataset.msgDel, { method: "DELETE" });
      state.messages = state.messages.filter(function (m) { return m.id !== b.dataset.msgDel; });
      renderMessages();
      updateMsgBadge();
      showAlert("Message deleted.", "info");
    } catch (err) {
      showAlert("Delete failed: " + err.message, "info");
    }
  });

  $("#reload-msgs").addEventListener("click", loadMessages);

  function updateMsgBadge() {
    var n = state.messages.length;
    var badge = $("#msg-side-badge");
    badge.textContent = n;
    badge.hidden = n === 0;
    /* topbar bell */
    var bell = $("#bell-badge");
    if (bell) { bell.textContent = n; bell.hidden = n === 0; }
    var gm = $("#greet-msg");
    if (gm) gm.textContent = n;
  }

  /* ============ COUNTS + SITE STATUS ============ */
  var SEO_FIELDS = [
    { k: "site_title", l: "Page title (browser tab & Google)" },
    { k: "seo_description", l: "Meta description (Google-এ দেখায়)", t: "textarea", wide: true },
    { k: "seo_keywords", l: "Keywords (comma separated)", wide: true },
    { k: "og_image", l: "Share image (Facebook / WhatsApp) — 1200×630 ভালো দেখায়", t: "image", wide: true }
  ];

  function renderSeoForm() {
    var host = $("#form-seo");
    if (!host) return;
    host.innerHTML = SEO_FIELDS.map(function (f) {
      var v = state.settings[f.k];
      v = v === null || v === undefined ? "" : v;
      if (f.t === "image") return imageFieldHtml("set." + f.k, f.l, "", v);
      var wide = f.wide ? " wide" : "";
      var input = f.t === "textarea"
        ? '<textarea data-sk="' + f.k + '" rows="3">' + esc(v) + "</textarea>"
        : '<input type="text" data-sk="' + f.k + '" value="' + esc(v) + '" />';
      return '<div class="field' + wide + '"><label>' + esc(f.l) + "</label>" + input + "</div>";
    }).join("");
    host.oninput = function (e) {
      var k = e.target.dataset.sk;
      if (k) state.settings[k] = e.target.value;
    };
    renderSeoPreview();
  }

  function renderSeoPreview() {
    var host = $("#seo-preview");
    if (!host) return;
    var t = state.settings.site_title || "Md Sajib Sheikh | Graphic Designer";
    var d = state.settings.seo_description || "Graphic Designer with 5+ years experience…";
    var img = state.settings.og_image || "";
    var url = "mdsajibsheikh.vercel.app";
    host.innerHTML =
      '<div class="seo-card">' +
        '<div class="seo-thumb">' + (img
          ? '<img src="' + esc(img) + '" alt="" />'
          : '<span>No image</span>') + "</div>" +
        '<div class="seo-meta">' +
          '<span class="seo-url">' + esc(url) + "</span>" +
          '<h4>' + esc(t) + "</h4>" +
          "<p>" + esc(String(d).slice(0, 180)) + "</p>" +
        "</div>" +
      "</div>" +
      '<p class="field-hint">এটা Google ও Facebook-এ যেমন দেখাবে তার আনুমানিক রূপ। ছবি দিলে share-এ সেটা যাবে।</p>';
  }

  $("#save-seo").addEventListener("click", async function () {
    var st = "#status-seo";
    setStatus(st, "Saving…", true);
    try {
      var keys = ["site_title", "seo_description", "seo_keywords", "og_image"];
      var payload = keys.map(function (k) { return { key: k, value: String(state.settings[k] || "") }; });
      await SB.table("settings?on_conflict=key", {
        method: "POST",
        body: payload,
        prefer: "resolution=merge-duplicates"
      });
      setStatus(st, "✅ SEO saved — Google-এ প্রভাব দেখতে কয়েক দিন লাগে।", true);
      showAlert("SEO updated. Reload the live site to see changes.", "info");
      refreshCounts();
    } catch (err) {
      setStatus(st, "❌ " + err.message, false);
    }
  });

  function refreshCounts() {
    $("#cnt-projects").textContent = state.projects.length || 0;
    $("#cnt-services").textContent = state.services.length || 0;
    $("#cnt-experience").textContent = state.experience.length || 0;
    $("#cnt-tools").textContent = state.tools.length || 0;
    $("#cnt-messages").textContent = state.messages.length || 0;
    if ($("#cnt-reviews")) $("#cnt-reviews").textContent = state.testimonials.length || 0;
    if ($("#cnt-msg2")) $("#cnt-msg2").textContent = state.messages.length || 0;

    var sections =
      (state.profile && Object.keys(state.profile).length ? 1 : 0) +
      state.stats.length + state.services.length + state.tools.length +
      state.projects.length + state.experience.length + state.testimonials.length;
    if ($("#cnt-all")) $("#cnt-all").textContent = sections || 0;

    /* বর্তমান color theme */
    if ($("#cur-theme")) {
      var tid = document.documentElement.getAttribute("data-color") || "emerald";
      var trec = THEMES.filter(function (t) { return t.id === tid; })[0];
      $("#cur-theme").textContent = trec ? trec.n : tid.charAt(0).toUpperCase() + tid.slice(1);
    }

    var s = state.settings;
    var seoDone = ["site_title", "seo_description", "seo_keywords", "og_image"]
      .filter(function (k) { return String(s[k] || "").trim(); }).length;
    if ($("#seo-count")) $("#seo-count").textContent = seoDone + "/4";
    var imgDone = ["logo_image", "avatar_image"].filter(function (k) { return String(s[k] || "").trim(); }).length +
      LOGO_SLOTS.filter(function (k) { return String(s[k] || "").trim(); }).length +
      state.projects.filter(function (p) { return p.image; }).length +
      state.services.filter(function (x) { return x.image; }).length +
      state.testimonials.filter(function (x) { return x.avatar; }).length;
    if ($("#img-count")) $("#img-count").textContent = imgDone;
    if ($("#mail-state")) $("#mail-state").textContent = s.contact_notify_email ? "ON" : "—";

    updateMsgBadge();
    renderSiteStatus();
  }

  function renderSiteStatus() {
    var host = $("#site-status");
    if (!host) return;
    var s = state.settings;

    function row(label, ok, hint, tab) {
      return '<button class="ss-row' + (ok ? " ok" : " todo") + '"' + (tab ? ' data-tab="' + tab + '"' : "") + ">" +
        '<span class="ss-dot">' + (ok ? '<span data-sico="check" data-sico-size="12"></span>' : '<span data-sico="alert" data-sico-size="12"></span>') + "</span>" +
        '<span class="ss-label">' + esc(label) + "</span>" +
        '<span class="ss-hint">' + esc(hint) + "</span>" +
        "</button>";
    }

    var hasPhoto = !!String(s.avatar_image || "").trim();
    var logoCount = ["logo_1", "logo_2", "logo_3"].filter(function (k) { return String(s[k] || "").trim(); }).length;
    var navLogo = !!String(s.logo_image || "").trim();
    var themeOk = !!String(s.theme || "").trim();
    var seoDone = ["site_title", "seo_description", "seo_keywords", "og_image"]
      .every(function (k) { return String(s[k] || "").trim(); });

    host.innerHTML =
      '<div class="ss-group"><h3>Quick checks</h3>' +
        row("Profile photo", hasPhoto, hasPhoto ? "Uploaded" : "Theme → Images থেকে upload করুন", "theme") +
        row("Header logo", navLogo, navLogo ? "Image ব্যবহার হচ্ছে" : "Text logo দেখাচ্ছে", "theme") +
        row("Brand logos", logoCount > 0, logoCount ? logoCount + " টা আপলোড করা আছে" : "Logo Manager থেকে যোগ করুন", "theme") +
        row("Color theme", themeOk, themeOk ? (s.theme || "emerald") + " সক্রিয়" : "নির্বাচন করুন", "theme") +
        row("SEO fields", seoDone, seoDone ? "সব পূরণ" : "SEO tab থেকে পূরণ করুন", "seo") +
        row("Client reviews", state.testimonials.length > 0,
            state.testimonials.length + " টা আছে", "testimonials") +
      "</div>" +
      '<div class="ss-group"><h3>Live sites</h3>' +
        '<a class="ss-link" href="https://mdsajibsheikh.vercel.app/" target="_blank" rel="noopener"><span data-sico="globe"></span> mdsajibsheikh.vercel.app <span class="ss-go">↗</span></a>' +
        '<a class="ss-link" href="https://mdsajibsheikhe.github.io/Portfolioo/" target="_blank" rel="noopener"><span data-sico="github"></span> GitHub Pages <span class="ss-go">↗</span></a>' +
        '<a class="ss-link" href="https://mdsajibsheikh.vercel.app/admin.html" target="_blank" rel="noopener"><span data-sico="shield"></span> This admin panel <span class="ss-go">↗</span></a>' +
      "</div>";

    applyPanelIcons(host);
  }

  /* ============ PANEL ICONS (SVG — emoji নয়) ============ */
  function applyPanelIcons(root) {
    if (!window.ICONS) return;
    (root || document).querySelectorAll("[data-sico]").forEach(function (el) {
      if (el.dataset.sicoDone === "1") return;
      var svg = window.ICONS.svg(el.getAttribute("data-sico"), el.dataset.sicoSize || 18);
      if (!svg) return;
      el.innerHTML = svg;
      el.dataset.sicoDone = "1";
    });
  }

  /* ============ GREETING (দিন + সময়) ============ */
  function initGreeting() {
    var k = $("#greet-kicker"), d = $("#greet-date");
    if (!k || !d) return;
    function tick() {
      var now = new Date(), h = now.getHours();
      k.textContent = h < 12 ? "GOOD MORNING" : h < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";
      d.textContent =
        now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) +
        "  •  " + now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    tick();
    setInterval(tick, 30000);
  }

  /* ============ LOGO MANAGER (২/৩টা logo — upload + delete) ============ */
  var LOGO_SLOTS = ["logo_1", "logo_2", "logo_3"];

  function renderLogoManager() {
    var host = $("#logo-manager");
    if (!host) return;
    host.innerHTML = LOGO_SLOTS.map(function (k, i) {
      var url = String(state.settings[k] || "").trim();
      return '<div class="logo-slot' + (url ? " filled" : "") + '">' +
        '<span class="slot-tag">Logo ' + (i + 1) + "</span>" +
        (url
          ? '<img class="slot-img" src="' + esc(url) + '" alt="Logo ' + (i + 1) + '" />'
          : '<div class="slot-empty">' + (window.ICONS ? window.ICONS.svg("image", 26) : "") + "<span>Empty</span></div>") +
        '<div class="slot-acts">' +
          '<button class="btn-mini" data-logoup="' + k + '">' + (url ? "Replace" : "Upload") + "</button>" +
          (url ? '<button class="btn-mini danger" data-logodel="' + k + '">Delete</button>' : "") +
        "</div>" +
        '<input type="file" accept="image/*" hidden data-logofile="' + k + '" />' +
      "</div>";
    }).join("");
  }

  function saveLogoKeys() {
    return SB.table("settings?on_conflict=key", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: LOGO_SLOTS.map(function (k) { return { key: k, value: String(state.settings[k] || "") }; })
    });
  }

  /* ============ HERO TOOL BADGES (avatar চারপাশের ৩টা icon) ============ */
  var TB_SLOTS = [1, 2, 3];
  var TB_KEYS = ["icon", "label", "bg", "fg"];
  var TB_DEF = [
    { icon: "", label: "Ai", bg: "#332211", fg: "#ff9a00" },
    { icon: "", label: "Ps", bg: "#001e36", fg: "#31a8ff" },
    { icon: "figma", label: "Figma", bg: "#1e1e1e", fg: "#ffffff" }
  ];

  function tbGet(n, k) {
    var v = state.settings["hero_tool_" + n + "_" + k];
    return String(v === undefined || v === null ? TB_DEF[n - 1][k] : v);
  }
  function tbSet(n, k, val) { state.settings["hero_tool_" + n + "_" + k] = String(val); }

  function tbBrand(n) {
    var ico = tbGet(n, "icon").trim().toLowerCase();
    if (!ico || !window.ICONS || !ICONS.brand) return "";
    return ICONS.brand(ico, 26);
  }

  function renderToolBadges() {
    var host = $("#tool-badge-grid");
    if (!host) return;
    var opts = (window.ICONS && ICONS.brandList) ? ICONS.brandList() : ["figma"];

    host.innerHTML = TB_SLOTS.map(function (n) {
      var ico = tbGet(n, "icon").trim().toLowerCase();
      var lab = tbGet(n, "label").trim();
      var bg  = tbGet(n, "bg").trim();
      var fg  = tbGet(n, "fg").trim();

      var brand = tbBrand(n);
      var prev  = brand || (lab ? esc(lab) : '<span style="opacity:.4;font-size:.72rem">Hidden</span>');
      var cls   = "tool-icon tool-badge tool-" + n + " preview-badge" + (!brand && lab ? " tool-text" + (lab.length > 2 ? " tool-long" : "") : "");

      return '<div class="tb-card" data-tbcard="' + n + '" style="border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--bg-soft)">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
          '<span class="' + cls + '" style="background:' + esc(bg) + ";color:" + esc(fg) + ';position:static;animation:none;flex:0 0 auto">' + prev + "</span>" +
          "<div><strong>Badge " + n + '</strong><br/><small class="tb-meta" style="color:var(--muted)">' +
            esc(ico || (lab ? "text: " + lab : "লুকানো")) + "</small></div>" +
        "</div>" +
        '<div class="field"><label>Icon</label><select data-tb="' + n + '" data-tbk="icon">' +
          '<option value=""' + (ico ? "" : " selected") + ">Custom text</option>" +
          opts.map(function (b) {
            return '<option value="' + b + '"' + (ico === b ? " selected" : "") + ">" +
              b.charAt(0).toUpperCase() + b.slice(1) + "</option>";
          }).join("") +
        "</select></div>" +
        '<div class="field"><label>Label</label><input type="text" data-tb="' + n + '" data-tbk="label" value="' +
          esc(lab) + '" placeholder="Ai, Ps, Canva…" /></div>' +
        '<div style="display:flex;gap:12px">' +
          '<div class="field" style="flex:1"><label>Background</label><input type="color" data-tb="' + n + '" data-tbk="bg" value="' + esc(bg) + '" /></div>' +
          '<div class="field" style="flex:1"><label>Text / logo</label><input type="color" data-tb="' + n + '" data-tbk="fg" value="' + esc(fg) + '" /></div>' +
        "</div>" +
      "</div>";
    }).join("");
  }

  /* preview লাইভ আপডেট — re-render না করে (focus হারানো যাবে না) */
  function updateTbPreview(n) {
    var card = document.querySelector('[data-tbcard="' + n + '"]');
    if (!card) return;
    var ico = tbGet(n, "icon").trim().toLowerCase();
    var lab = tbGet(n, "label").trim();
    var bg  = tbGet(n, "bg").trim();
    var fg  = tbGet(n, "fg").trim();

    var badge = card.querySelector(".preview-badge");
    badge.style.background = bg || "#1e1e1e";
    badge.style.color = fg || "#ffffff";

    var brand = tbBrand(n);
    if (brand) {
      badge.innerHTML = brand;
      badge.classList.remove("tool-text", "tool-long");
    } else if (lab) {
      badge.textContent = lab;
      badge.classList.add("tool-text");
      badge.classList.toggle("tool-long", lab.length > 2);
    } else {
      badge.innerHTML = '<span style="opacity:.4;font-size:.72rem">Hidden</span>';
      badge.classList.remove("tool-text", "tool-long");
    }
    var meta = card.querySelector(".tb-meta");
    if (meta) meta.textContent = ico || (lab ? "text: " + lab : "লুকানো");
  }

  document.addEventListener("input", function (e) {
    var el = e.target.closest("[data-tb]");
    if (!el) return;
    var n = Number(el.getAttribute("data-tb")), k = el.getAttribute("data-tbk");
    if (!n || !k) return;
    tbSet(n, k, el.value);
    updateTbPreview(n);
  });

  $("#save-toobadges").addEventListener("click", function () {
    setStatus("#status-toobadges", "Saving…", true);
    var body = [];
    TB_SLOTS.forEach(function (n) {
      TB_KEYS.forEach(function (k) {
        body.push({ key: "hero_tool_" + n + "_" + k, value: tbGet(n, k) });
      });
    });
    SB.table("settings?on_conflict=key", {
      method: "POST", prefer: "resolution=merge-duplicates", body: body
    }).then(function () {
      setStatus("#status-toobadges", "✅ Badges saved — live site reload করলেই দেখা যাবে।", true);
      showAlert("Hero tool badges updated.", "info");
      refreshCounts();
    }).catch(function (err) {
      setStatus("#status-toobadges", "❌ " + err.message, false);
    });
  });

  document.addEventListener("click", function (e) {
    var up = e.target.closest("[data-logoup]");
    if (up) {
      var fi = document.querySelector('[data-logofile="' + up.getAttribute("data-logoup") + '"]');
      if (fi) { fi.value = ""; fi.click(); }
      return;
    }
    var del = e.target.closest("[data-logodel]");
    if (!del) return;
    var key = del.getAttribute("data-logodel");
    state.settings[key] = "";
    renderLogoManager();
    saveLogoKeys().then(function () {
      setStatus("#status-logos", "✅ Logo deleted — live site reload করলেই দেখা যাবে।", true);
      showAlert("Logo removed.", "info");
      refreshCounts();
    }).catch(function (err) {
      setStatus("#status-logos", "❌ " + err.message, false);
    });
  });

  document.addEventListener("change", function (e) {
    var fi = e.target.closest("[data-logofile]");
    if (!fi || !fi.files || !fi.files[0]) return;
    var key = fi.getAttribute("data-logofile"), file = fi.files[0];
    if (file.type && file.type.indexOf("image/") !== 0) { showAlert("Image file নির্বাচন করুন।", "info"); return; }
    if (file.size > 5 * 1024 * 1024) { showAlert("সর্বোচ্চ ৫ MB ছবি হবে।", "info"); return; }
    setStatus("#status-logos", "Uploading…", true);
    var clean = String(file.name || "logo").replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase();
    SB.upload("assets/logo/" + Date.now() + "_" + clean, file).then(function (url) {
      state.settings[key] = url;
      renderLogoManager();
      return saveLogoKeys();
    }).then(function () {
      setStatus("#status-logos", "✅ Logo uploaded — live site reload করলেই দেখা যাবে।", true);
      showAlert("Logo uploaded.", "info");
      refreshCounts();
    }).catch(function (err) {
      setStatus("#status-logos", "❌ " + err.message, false);
    });
  });

  document.addEventListener("click", function (e) {
    var r = e.target.closest(".ss-row[data-tab]");
    if (r) switchTab(r.getAttribute("data-tab"));
  });

  /* ============ BOOT ============ */
  async function boot() {
    showApp();

    var profileP = SB.table("profile?select=*").catch(function () { return []; });
    var settingsP = SB.table("settings?select=*").catch(function () { return []; });
    var statsP = SB.table("stats?select=*&order=sort.asc").catch(function (e) { throw e; });
    var servicesP = SB.table("services?select=*&order=sort.asc");
    var toolsP = SB.table("tools?select=*&order=sort.asc");
    var projectsP = SB.table("projects?select=*&order=sort.asc");
    var expP = SB.table("experience?select=*&order=sort.asc");
    var testiP = SB.table("testimonials?select=*&order=sort.asc").catch(function () { return []; });
    var msgP = SB.table("messages?select=*&order=created_at.desc").catch(function () { return []; });

    try {
      var res = await Promise.all([profileP, settingsP, statsP, servicesP, toolsP, projectsP, expP, testiP, msgP]);

      state.profile = res[0] && res[0][0] ? res[0][0] : { id: 1 };
      (res[1] || []).forEach(function (s) { state.settings[s.key] = s.value; });
      state.stats = res[2] || [];
      state.services = res[3] || [];
      state.tools = res[4] || [];
      state.projects = res[5] || [];
      state.experience = res[6] || [];
      state.testimonials = res[7] || [];
      state.messages = res[8] || [];

      ["stats", "services", "tools", "projects", "experience", "testimonials"].forEach(function (k) {
        state[k] = state[k].map(function (it) {
          var copy = Object.assign({}, it);
          if (Array.isArray(copy.tags)) copy.tags = copy.tags.join(", ");
          if (Array.isArray(copy.tools)) copy.tools = copy.tools.join(", ");
          return copy;
        });
        persisted[k] = state[k].map(function (it) { return it.id; });
      });

      renderForm("profile");
      renderForm("about");
      renderForm("contact");
      renderLabels();
      renderSeoForm();
      applyAdminTheme(state.settings.theme || "emerald");
      renderThemePicker();
      bindCustomColors();
      renderImgSettings();
      Object.keys(LISTS).forEach(renderList);
      refreshCounts();
      renderLogoManager();
      initGreeting();
      applyPanelIcons();

      showAlert("Panel loaded. Changes you save will appear on the live site after reload.");
    } catch (err) {
      if (err && err.status === 401) {
        SB.clearSession();
        showLogin();
        return;
      }
      showAlert("Database not ready — Supabase SQL script চালানো হয়নি? (" + err.message + ")", "info");
      renderForm("profile");
      renderForm("about");
      renderForm("contact");
      renderLabels();
      renderSeoForm();
      applyAdminTheme(state.settings.theme || "emerald");
      renderThemePicker();
      bindCustomColors();
      renderImgSettings();
      Object.keys(LISTS).forEach(renderList);
    }
  }

  /* ============ INIT ============ */
  (async function init() {
    if (SB.getSession()) {
      try {
        await boot();
        return;
      } catch (e) {
        SB.clearSession();
      }
    }
    showLogin();
  })();
})();
