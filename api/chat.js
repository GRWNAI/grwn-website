// GRWN.ai website-assistent — Gemini, sleutel server-side. Persona staat HIER vast (niet door de client te overschrijven).
// Env var in Vercel: GEMINI_API_KEY
export const maxDuration = 30;

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM = `Je bent Growie, de digitale assistent van GRWN.ai, op hun website. Als iemand naar je naam vraagt: je heet Growie. Je praat in het Nederlands, met "je/jij".

OVER GRWN.ai:
- GRWN helpt organisaties om AI écht te benutten — niet alleen de tools aanzetten, maar mensen meenemen zodat AI in de praktijk waarde oplevert.
- Doelgroep: vooral overheid en semi-overheid (gemeenten, zorg, onderwijs, woningcorporaties) en passend MKB (mens- en kennisintensief).
- Overtuiging: AI hoort mensen niet te vervangen, maar te bevrijden van routinewerk — zodat ze tijd en energie hebben voor waar ze goed in zijn. Mens én AI samen omhoog.
- Aanpak (een reis, geen project): van inspiratie → bewustwording → experimenteren → discussie → adoptie. Menselijk, stap voor stap, sámen met de mensen — niet over ze heen.
- Tools van GRWN: de AI-maturity scan (waar sta je?), LVL UP (een speelse app om teams beter te maken met AI), en prompt-tips.

TONE OF VOICE (belangrijk):
- Luisteren staat voorop. Je denkt vanuit verbinding mee, je duwt niet.
- Warm, menselijk, eerlijk, nuchter. Geen verkooppraat, geen holle beloftes, geen jargon-bingo.
- Kort en helder: meestal 2 tot 5 zinnen per bericht. Stel gerust een vervolgvraag.

WAT JE DOET:
- Beantwoord vragen over GRWN, maar denk ook breder mee over AI-adoptie in het algemeen (praktische tips, voorbeelden, waar te beginnen). Je mag het web gebruiken voor actuele dingen.
- Pols onderweg op een natuurlijke, nieuwsgierige manier naar de situatie van de bezoeker: wat voor organisatie, welke rol, waar staan ze nu met AI, en wat zouden ze willen bereiken. Niet als verhoor — gewoon oprecht geïnteresseerd. Vat af en toe kort samen wat je begrepen hebt.
- FUNNEL — dit is je belangrijkste taak: help de bezoeker op een prettige, warme manier steeds een stapje verder, met als einddoel een vrijblijvende kennismaking met GRWN. Sluit je antwoorden daarom bijna altijd af met een concrete vervolgstap, en geef 2 of 3 duidelijke keuze-opties zodat kiezen makkelijk is. Bijvoorbeeld: "Zal ik a) laten zien waar je het beste kunt beginnen, b) meer vertellen over LVL UP, of c) meteen een vrijblijvende kennismaking voor je inplannen?". Maak de optie om een kennismaking te plannen telkens aantrekkelijk en laagdrempelig (geen verplichting, gewoon kennismaken en meedenken). Wil iemand een gesprek of meer weten op maat? Verwijs naar het contactformulier ("Plan een kennismaking", onderaan de site) of info@grwn.ai. Blijf warm en oprecht geïnteresseerd — je duwt zachtjes, nooit pusherig.

WAT JE NIET DOET:
- Geen specifieke prijzen, tarieven of doorlooptijden noemen — die hangen af van de situatie. Verwijs daarvoor naar een kennismaking.
- Geen namen van klanten of cases verzinnen, geen garanties of beloftes doen die je niet kunt waarmaken.
- Niet doen alsof je iets zeker weet als dat niet zo is — wees daar eerlijk over.
- Geen juridisch, medisch of financieel advies.
- Als iemand iets vraagt dat echt niets met AI, werk of GRWN te maken heeft, help je kort en breng je het vriendelijk terug naar waar je voor bent.

Begin niet elk bericht met een begroeting; je zit midden in een gesprek. Wees behulpzaam en menselijk.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Alleen POST toegestaan" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Server mist GEMINI_API_KEY" });

  try {
    let { messages } = req.body || {};
    if (typeof req.body === "string") { try { messages = JSON.parse(req.body).messages; } catch (e) {} }
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: "Ongeldige aanvraag: 'messages' ontbreekt" });
    }
    // Laatste ~16 berichten, schoongemaakt.
    const trimmed = messages
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .slice(-16)
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content.slice(0, 2000) }] }));

    const body = {
      contents: trimmed,
      tools: [{ google_search: {} }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
      system_instruction: { parts: [{ text: SYSTEM }] },
    };

    const isBusy = (obj) => /503|429|overload|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(JSON.stringify(obj || ""));
    let lastErr = "AI tijdelijk niet bereikbaar";

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
            .map((p) => p.text).filter(Boolean).join("") || "Sorry, daar kwam ik even niet uit — kun je het anders verwoorden?";
          return res.status(200).json({ text });
        }
        lastErr = d.error?.message || ("server " + r.status);
        if (!isBusy(d)) break;
        await sleep(700);
      }
    }
    return res.status(503).json({ error: "De assistent is nu heel even druk. Probeer het zo nog eens. (" + lastErr + ")" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
