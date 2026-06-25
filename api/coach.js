// Serverless functie (Vercel) — gratis AI via Google Gemini, sleutel server-side.
// Bezoekers praten met de coach zonder ooit een sleutel te zien.
// Zet in Vercel een environment variable: GEMINI_API_KEY = jouw gratis sleutel
// (gratis aan te maken op https://aistudio.google.com/apikey — geen creditcard nodig).

export const maxDuration = 30; // grounded antwoorden mogen wat langer duren

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]; // fallback bij drukte
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST toegestaan" });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server mist GEMINI_API_KEY (zet die in Vercel > Settings > Environment Variables)" });
  }
  try {
    const { system, messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Ongeldige aanvraag: 'messages' ontbreekt" });
    }
    // Map de chathistorie naar Gemini-formaat (assistant -> model).
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const body = {
      contents,
      // Live grounding: laat het model echt op het web zoeken voor actuele trends/tools.
      tools: [{ google_search: {} }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.8 }
    };
    if (system) body.system_instruction = { parts: [{ text: system }] };

    const isBusy = obj => /503|429|overload|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(JSON.stringify(obj || ""));

    let lastErr = "AI tijdelijk niet bereikbaar";
    // Probeer per model max. 2 keer; val daarna terug op het volgende model.
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        let r, d;
        try {
          r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
            { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
          );
          d = await r.json();
        } catch (e) {
          lastErr = e.message; await sleep(700); continue;
        }
        if (r.ok) {
          const text = (d.candidates?.[0]?.content?.parts || [])
            .map(p => p.text).filter(Boolean).join("") || "(geen antwoord — probeer het opnieuw)";
          return res.status(200).json({ text });
        }
        lastErr = d.error?.message || ("server " + r.status);
        if (!isBusy(d)) break;        // andere fout -> niet blijven proberen
        await sleep(700);             // druk -> heel even wachten en opnieuw
      }
    }
    return res.status(503).json({ error: "De AI is nu even erg druk. Probeer het over een paar tellen opnieuw. (" + lastErr + ")" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
