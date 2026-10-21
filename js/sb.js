/* ============================================
   Supabase REST helper — কোনো library ছাড়া,
   শুধু fetch দিয়ে। ব্যবহার:
     SB.table('services?select=*&order=sort.asc')
     SB.login(email, password)
     SB.table('messages', { method: 'POST', body: {...} })
   ============================================ */
window.SB = (function () {
  var URL_BASE = "https://bhhrhatiipaqqyecalzj.supabase.co";
  var ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoaHJoYXRpaXBhcXF5ZWNhbHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDc5MzUsImV4cCI6MjEwODEyMzkzNX0.uXyJFkr8BFijglOVwMW7GXX7HD226DepliR0xUZY-lI";
  var KEY = "portfolio_sb_session";

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function setSession(s) {
    localStorage.setItem(KEY, JSON.stringify(s));
  }
  function clearSession() {
    localStorage.removeItem(KEY);
  }

  function token() {
    var s = getSession();
    return s && s.access_token ? s.access_token : ANON;
  }

  function buildHeaders(opts) {
    var h = { apikey: ANON, Authorization: "Bearer " + token() };
    if (opts && opts.body !== undefined && opts.body !== null) {
      h["Content-Type"] = "application/json";
    }
    if (opts && opts.prefer) h.Prefer = opts.prefer;
    else if (opts && opts.method === "POST") h.Prefer = "return=representation";
    return h;
  }

  function errFrom(res, text) {
    var msg = text;
    try {
      var j = JSON.parse(text);
      msg = j.message || j.error_description || j.msg || j.error || text;
    } catch (e) {}
    var err = new Error(msg || "HTTP " + res.status);
    err.status = res.status;
    return err;
  }

  async function refresh() {
    var s = getSession();
    if (!s || !s.refresh_token) return false;
    try {
      var res = await fetch(URL_BASE + "/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        headers: { apikey: ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      if (!res.ok) return false;
      var d = await res.json();
      setSession({
        access_token: d.access_token,
        refresh_token: d.refresh_token,
        email: (d.user && d.user.email) || s.email
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function request(path, opts, retried) {
    opts = opts || {};
    var res = await fetch(URL_BASE + path, {
      method: opts.method || "GET",
      headers: buildHeaders(opts),
      body: opts.body !== undefined && opts.body !== null ? JSON.stringify(opts.body) : undefined
    });
    var text = await res.text();

    if (!res.ok && res.status === 401 && !retried && getSession()) {
      var ok = await refresh();
      if (ok) return request(path, opts, true);
    }
    if (!res.ok) throw errFrom(res, text);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  async function login(email, password) {
    var res = await fetch(URL_BASE + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });
    var text = await res.text();
    if (!res.ok) throw errFrom(res, text);
    var d = JSON.parse(text);
    setSession({
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      email: (d.user && d.user.email) || email
    });
    return d;
  }

  async function logout() {
    var s = getSession();
    try {
      if (s && s.access_token) {
        await fetch(URL_BASE + "/auth/v1/logout", {
          method: "POST",
          headers: { apikey: ANON, Authorization: "Bearer " + s.access_token }
        });
      }
    } catch (e) {}
    clearSession();
  }

  function table(path, opts) {
    return request("/rest/v1/" + path, opts);
  }

  /* ---- Storage upload: file পাঠিয়ে public URL ফেরত ---- */
  async function upload(filePath, file, retried) {
    var res = await fetch(URL_BASE + "/storage/v1/object/" + filePath, {
      method: "POST",
      headers: {
        apikey: ANON,
        Authorization: "Bearer " + token(),
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      },
      body: file
    });
    var text = await res.text();

    if (!res.ok && res.status === 401 && !retried && getSession()) {
      var ok = await refresh();
      if (ok) return upload(filePath, file, true);
    }
    if (!res.ok) throw errFrom(res, text);
    return URL_BASE + "/storage/v1/object/public/" + filePath;
  }

  function publicUrl(filePath) {
    return URL_BASE + "/storage/v1/object/public/" + filePath;
  }

  return {
    URL: URL_BASE,
    ANON: ANON,
    table: table,
    login: login,
    logout: logout,
    upload: upload,
    publicUrl: publicUrl,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession
  };
})();
