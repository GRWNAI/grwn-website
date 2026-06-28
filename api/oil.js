// Wereldweb — live olieprijs + eerstvolgende OPEC-datum via Gemini (google_search grounding).
// Env var in Vercel: GEMINI_API_KEY (zelfde sleutel als Growie/scenario).
export const maxDuration = 30;

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Server mist GEMINI_API_KEY" });

  const prompt =
    'Zoek de MEEST ACTUELE gegevens op via zoeken en antwoord UITSLUITEND met geldige JSON, exact dit formaat (geen extra tekst):\n' +
    '{"brent": <getal: huidige Brent-ruwe-olieprijs in USD per vat>, "asof": "<korte datum/tijd waarop die prijs geldt>", "nextOpec": "<eerstvolgende geplande OPEC of OPEC+ vergaderdatum, kort, bijv. 5 juli 2026>"}';

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
  };

  const errs = [];
  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
      );
      const d = await r.json();
      if (!r.ok) { errs.push(model + ": " + (d.error?.message || ("server " + r.status))); continue; }
      const text = ((d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [])
        .map((p) => p.text).filter(Boolean).join("");
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) { errs.push(model + ": geen JSON"); continue; }
      let o;
      try { o = JSON.parse(m[0]); } catch (e) { errs.push(model + ": JSON-fout"); continue; }
      const brent = parseFloat(o.brent);
      if (!brent || isNaN(brent)) { errs.push(model + ": geen prijs"); continue; }
      return res.status(200).json({
        brent: Math.round(brent * 100) / 100,
        asof: String(o.asof || "").slice(0, 48),
        nextOpec: String(o.nextOpec || "").slice(0, 64),
      });
    } catch (e) { errs.push(model + ": " + e.message); }
  }
  return res.status(503).json({ error: "Live olieprijs niet beschikbaar: " + (errs.join(" | ") || "onbekend") });
}
