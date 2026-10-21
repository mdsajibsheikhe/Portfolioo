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
        { k: "facebook", l: "Facebook URL" },
        { k: "instagram", l: "Instagram URL" },
        { k: "linkedin", l: "LinkedIn URL" },
        { k: "twitter", l: "X / Twitter URL" },
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
        { k: "icon", l: "Icon (emoji)" },
        { k: "title", l: "Title" },
        { k: "tags", l: "Skill tags (comma separated)", t: "tags", wide: true },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { icon: "🎨", title: "", tags: "", sort: 0 }
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
        { k: "description", l: "Description", t: "textarea", wide: true },
        { k: "tags", l: "Tags (comma separated)", t: "tags", wide: true },
        { k: "view_url", l: "View link" },
        { k: "case_url", l: "Case study link" },
        { k: "variant", l: "Card color (0-3)", t: "number" },
        { k: "sort", l: "Order", t: "number" }
      ],
      blank: { emoji: "🎨", title: "", description: "", tags: "", view_url: "#", case_url: "#", variant: 0, sort: 0 }
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
    }
  };

  var TITLES = {
    dashboard: "Dashboard",
    profile: "Profile & Hero",
    about: "About",
    contact: "Contact & Footer",
    stats: "Stats",
    services: "Services",
    tools: "Tools",
    projects: "Work / Projects",
    experience: "Experience",
    messages: "Messages"
  };

  /* ============ STATE ============ */
  var state = {
    profile: {},
    stats: [],
    services: [],
    tools: [],
    projects: [],
    experience: [],
    messages: []
  };
  var persisted = { stats: [], services: [], tools: [], projects: [], experience: [] };

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
  $("#quick-grid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (b) switchTab(b.dataset.tab);
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
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
    var icon = this.querySelector("span");
    if (icon) icon.textContent = dark ? "🌙" : "☀️";
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

  /* ============ RENDER: lists ============ */
  function fieldHtml2(f, val, idx) {
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
    } else {
      input = '<input type="' + (f.t === "number" ? "number" : "text") + '" data-i="' + idx + '" data-k="' + f.k + '" value="' + esc(v) + '" />';
    }
    return '<div class="field' + wide + '"><label>' + esc(f.l) + "</label>" + input + "</div>";
  }

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
            cfg.fields.map(function (f) { return fieldHtml2(f, item[f.k], i); }).join("") +
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
  }

  /* ============ COUNTS ============ */
  function refreshCounts() {
    $("#cnt-projects").textContent = state.projects.length || 0;
    $("#cnt-services").textContent = state.services.length || 0;
    $("#cnt-experience").textContent = state.experience.length || 0;
    $("#cnt-tools").textContent = state.tools.length || 0;
    $("#cnt-messages").textContent = state.messages.length || 0;
    var sections =
      (state.profile && Object.keys(state.profile).length ? 1 : 0) +
      state.stats.length + state.services.length + state.tools.length +
      state.projects.length + state.experience.length;
    $("#cnt-all").textContent = sections || 0;
    updateMsgBadge();
  }

  /* ============ BOOT ============ */
  async function boot() {
    showApp();

    var profileP = SB.table("profile?select=*").catch(function () { return []; });
    var statsP = SB.table("stats?select=*&order=sort.asc").catch(function (e) { throw e; });
    var servicesP = SB.table("services?select=*&order=sort.asc");
    var toolsP = SB.table("tools?select=*&order=sort.asc");
    var projectsP = SB.table("projects?select=*&order=sort.asc");
    var expP = SB.table("experience?select=*&order=sort.asc");
    var msgP = SB.table("messages?select=*&order=created_at.desc").catch(function () { return []; });

    try {
      var res = await Promise.all([profileP, statsP, servicesP, toolsP, projectsP, expP, msgP]);

      state.profile = res[0] && res[0][0] ? res[0][0] : { id: 1 };
      state.stats = res[1] || [];
      state.services = res[2] || [];
      state.tools = res[3] || [];
      state.projects = res[4] || [];
      state.experience = res[5] || [];
      state.messages = res[6] || [];

      ["stats", "services", "tools", "projects", "experience"].forEach(function (k) {
        state[k] = state[k].map(function (it) {
          var copy = Object.assign({}, it);
          if (Array.isArray(copy.tags)) copy.tags = copy.tags.join(", ");
          return copy;
        });
        persisted[k] = state[k].map(function (it) { return it.id; });
      });

      renderForm("profile");
      renderForm("about");
      renderForm("contact");
      Object.keys(LISTS).forEach(renderList);
      refreshCounts();

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
