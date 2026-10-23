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
    try {
      var r = await fetch(
        SUPA_URL + "/rest/v1/settings?select=key,value&key=in.(about_email,contact_email)",
        { headers: { apikey: SUPA_ANON, Authorization: "Bearer " + SUPA_ANON } }
      );
      if (r.ok) {
        var rows = await r.json();
        var map = {};
        rows.forEach(function (x) { map[x.key] = String(x.value || "").trim(); });
        var picked = map.about_email || map.contact_email || "";
        if (VALID.test(picked)) return picked;
      } else {
        console.warn("[contact] settings lookup failed:", r.status);
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
     Path 1 — FormSubmit.co (free, unlimited, NO API key needed).
     Runs whenever RESEND_API_KEY is missing, so the portfolio sends
     email notifications out of the box with zero configuration.

     FormSubmit rejects calls that carry no Origin header (it assumes
     the request came from a local HTML file), so one is always sent.

     One-time step: the very first submission makes FormSubmit email
     you an "Activate Form" link. Click it once and every message
     after that arrives automatically. The response says so via
     reason = "needs_activation".
     --------------------------------------------------------------- */
  if (!key) {
    var origin = (req.headers && (req.headers.origin || req.headers.referer)) || "";
    try { origin = new URL(origin).origin; } catch (e) { origin = ""; }
    if (!origin) origin = "https://mdsajibsheikh.vercel.app";

    try {
      var fs = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: origin,
          Referer: origin + "/"
        },
        body: JSON.stringify({
          _subject: mailSubject,
          _captcha: "false",
          _template: "table",
          Name: name,
          "Sender email": email,
          Subject: subject || "—",
          Message: message
        })
      });
      var fj = {};
      try { fj = await fs.json(); } catch (e) { fj = {}; }
      var fmsg = String(fj.message || "");

      if (fs.ok && String(fj.success) === "true") {
        console.log("[contact] sent via FormSubmit to", to);
        return res.status(200).json({ ok: true, delivered: true, via: "formsubmit", notified: to });
      }
      if (/activation/i.test(fmsg)) {
        console.warn("[contact] FormSubmit needs a one-time activation click for", to);
        return res.status(200).json({
          ok: true, delivered: false, reason: "needs_activation", notified: to,
          detail: "An activation email was sent to " + to + ". Click the Activate Form link in it once."
        });
      }
      console.error("[contact] FormSubmit rejected:", fs.status, fmsg.slice(0, 200));
    } catch (e) {
      console.error("[contact] FormSubmit exception:", e && e.message);
    }
    return res.status(200).json({ ok: true, delivered: false, reason: "email_not_configured", notified: to });
  }

  /* ---- Path 2 — Resend (used automatically once RESEND_API_KEY is set) ---- */

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
