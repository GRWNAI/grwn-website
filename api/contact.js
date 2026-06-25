// GRWN contactformulier-backend — stuurt berichten via Resend naar info@grwn.ai.
// Env vars (in Vercel):
//   RESEND_API_KEY   = je Resend API-sleutel (verplicht om te kunnen versturen)
//   CONTACT_EMAIL    = ontvanger (default info@grwn.ai)
//   FROM_EMAIL       = afzender (default GRWN.ai <onboarding@resend.dev> tot grwn.ai geverifieerd is)
export const config = { maxDuration: 10 };

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const esc = (x) =>
  String(x == null ? "" : x).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, reason: "method" });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return res.status(200).json({ ok: false, reason: "no-mail" });

  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const naam = (b.naam || "").toString().trim().slice(0, 120);
    const email = (b.email || "").toString().trim().slice(0, 160);
    const org = (b.org || "").toString().trim().slice(0, 160);
    const onderwerp = (b.onderwerp || "Contact").toString().trim().slice(0, 120);
    const bericht = (b.bericht || "").toString().trim().slice(0, 4000);

    if (!naam || !email || !bericht) return res.status(400).json({ ok: false, reason: "incomplete" });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, reason: "email" });

    const TO = process.env.CONTACT_EMAIL || "info@grwn.ai";
    const FROM = process.env.FROM_EMAIL || "GRWN.ai <onboarding@resend.dev>";

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: "Contactformulier: " + onderwerp + " — " + naam,
        html:
          '<div style="font-family:Inter,Arial,sans-serif;color:#173049">' +
          "<h2 style=\"margin:0 0 12px\">Nieuw bericht via grwn.ai</h2>" +
          "<p style=\"margin:0 0 4px\"><b>Naam:</b> " + esc(naam) + "</p>" +
          "<p style=\"margin:0 0 4px\"><b>E-mail:</b> " + esc(email) + "</p>" +
          (org ? "<p style=\"margin:0 0 4px\"><b>Organisatie:</b> " + esc(org) + "</p>" : "") +
          "<p style=\"margin:0 0 4px\"><b>Onderwerp:</b> " + esc(onderwerp) + "</p>" +
          "<p style=\"font-size:16px;border-left:3px solid #E83F6F;padding-left:12px;margin:14px 0\">" +
          esc(bericht).replace(/\n/g, "<br>") + "</p>" +
          "<p style=\"color:#888;font-size:12px\">" + new Date().toLocaleString("nl-NL") + "</p>" +
          "</div>",
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(200).json({ ok: false, reason: "send", detail: t.slice(0, 200) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "err", detail: String(e).slice(0, 200) });
  }
}
