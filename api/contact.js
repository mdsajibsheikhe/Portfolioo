/* ============================================================
   POST /api/contact  —  Contact form → email notification
   Vercel serverless function + Resend
   ------------------------------------------------------------
   Env variables (Vercel dashboard → Settings → Environment Variables):
     RESEND_API_KEY   = re_xxxxxxxx          (Resend API key)
     NOTIFY_EMAIL     = you@gmail.com        (যেখানে alert পাবেন)
     MAIL_FROM        = (optional) "Sajib Portfolio <onboarding@resend.dev>"
   ============================================================ */

function esc(v) {
  return String(v === null || v === undefined ? "" : v)
    .replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}

module.exports = async function handler(req, res) {
  // CORS + method check
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  var b = req.body || {};
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch (e) { b = {}; }
  }

  var name = String(b.name || "").trim().slice(0, 200);
  var email = String(b.email || "").trim().slice(0, 200);
  var subject = String(b.subject || "").trim().slice(0, 300);
  var message = String(b.message || "").trim().slice(0, 5000);

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Name, email and message are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email address." });
  }

  var key = process.env.RESEND_API_KEY;
  var from = process.env.MAIL_FROM || "Portfolio <onboarding@resend.dev>";

  /* ---------------------------------------------------------------
     Who gets the notification?
     The "Info: Email" you type in the admin (About tab) is the single
     source of truth. If that is empty it falls back to the Contact
     tab's email, then the Vercel NOTIFY_EMAIL variable, then a default.
     The browser already publishes the anon key (js/sb.js), so reading
     it from the server exposes nothing new.
     --------------------------------------------------------------- */
  var SUPA_URL = "https://bhhrhatiipaqqyecalzj.supabase.co";
  var SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoaHJoYXRpaXBhcXF5ZWNhbHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDc5MzUsImV4cCI6MjEwODEyMzkzNX0.uXyJFkr8BFijglOVwMW7GXX7HD226DepliR0xUZY-lI";
  var DEFAULT_TO = "mdsajibsheikh103@gmail.com";
  var VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function resolveRecipient() {
    /* The admin's About tab writes to the profile table, so that is the
       real source of truth. settings is only a fallback copy. */
    var H = { apikey: SUPA_ANON, Authorization: "Bearer " + SUPA_ANON };

    try {
      var r = await fetch(SUPA_URL + "/rest/v1/profile?select=about_email,contact_email", { headers: H });
      if (r.ok) {
        var rows = await r.json();
        var p = rows && rows[0] || {};
        var picked = String(p.about_email || p.contact_email || "").trim();
        if (VALID.test(picked)) return picked;
      } else {
        console.warn("[contact] profile lookup failed:", r.status);
      }
    } catch (e) {
      console.warn("[contact] profile lookup exception:", e && e.message);
    }

    try {
      var r2 = await fetch(
        SUPA_URL + "/rest/v1/settings?select=key,value&key=in.(about_email,contact_email)",
        { headers: H }
      );
      if (r2.ok) {
        var rows2 = await r2.json();
        var map = {};
        rows2.forEach(function (x) { map[x.key] = String(x.value || "").trim(); });
        var picked2 = map.about_email || map.contact_email || "";
        if (VALID.test(picked2)) return picked2;
      }
    } catch (e) {
      console.warn("[contact] settings lookup exception:", e && e.message);
    }

    return process.env.NOTIFY_EMAIL || DEFAULT_TO;
  }

  var to = await resolveRecipient();
  var mailSubject = "New contact: " + (subject || "Portfolio enquiry") + " — " + name;
  console.log("[contact] notifying:", to, "| read from settings about_email / contact_email");

  /* ---------------------------------------------------------------
     No RESEND_API_KEY? Then this function has nothing to do — the
     browser already delivered the notification.

     FormSubmit.co forwards the submission to your inbox for free with
     no API key, but it rejects any call that does not originate in a
     real browser (the same request from here returns 403). So
     js/content.js posts to FormSubmit directly from the visitor's
     browser, using the public "Info: Email" from the About page.

     Resend is the upgrade path: set RESEND_API_KEY in Vercel and this
     function takes over with full HTML email, and the browser-side
     FormSubmit call is then redundant (but harmless — it still fails
     closed rather than double-mailing, because it only runs when the
     server reports failure).
     --------------------------------------------------------------- */
  if (!key) {
    console.warn("[contact] RESEND_API_KEY is not set — notification is handled by the browser (FormSubmit). Target was:", to);
    return res.status(200).json({ ok: true, delivered: false, reason: "handled_by_browser", notified: to });
  }

  /* ---- Resend ---- */

  var html =
    '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f1f5f4;padding:28px">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">' +
    '<div style="background:linear-gradient(135deg,#059669,#34d399);padding:22px 26px">' +
    '<h1 style="margin:0;color:#fff;font-size:19px">New message from your portfolio</h1>' +
    '</div>' +
    '<div style="padding:26px">' +
    '<table style="width:100%;border-collapse:collapse;font-size:15px;color:#0f172a">' +
    '<tr><td style="padding:8px 0;color:#64748b;width:90px">Name</td><td style="padding:8px 0;font-weight:600">' + esc(name) + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:' + esc(email) + '" style="color:#059669;font-weight:600">' + esc(email) + '</a></td></tr>' +
    '<tr><td style="padding:8px 0;color:#64748b">Subject</td><td style="padding:8px 0">' + esc(subject || "—") + '</td></tr>' +
    '</table>' +
    '<div style="margin-top:18px;padding:16px;background:#f8faf9;border-left:3px solid #059669;border-radius:8px;line-height:1.65;white-space:pre-wrap">' + esc(message) + '</div>' +
    '<p style="margin-top:22px;font-size:12.5px;color:#94a3b8">Sent from mdsajibsheikh.vercel.app · ' + new Date().toISOString().slice(0, 10) + '</p>' +
    '</div></div></div>';

  var text =
    "New message from your portfolio\n\n" +
    "Name: " + name + "\n" +
    "Email: " + email + "\n" +
    "Subject: " + (subject || "-") + "\n\n" +
    message + "\n\n— mdsajibsheikh.vercel.app";

  try {
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: email,
        subject: mailSubject,
        html: html,
        text: text
      })
    });

    var out = {};
    try { out = await r.json(); } catch (e) { out = {}; }

    if (!r.ok) {
      console.error("[contact] Resend error:", r.status, JSON.stringify(out));
      return res.status(200).json({ ok: true, delivered: false, reason: "resend_error" });
    }

    return res.status(200).json({ ok: true, delivered: true, via: "resend", id: out.id || null, notified: to });
  } catch (err) {
    console.error("[contact] exception:", err && err.message);
    return res.status(200).json({ ok: true, delivered: false, reason: "exception" });
  }
};
