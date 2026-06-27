// Wereldweb — AI scenario-motor (energie). Gemini, sleutel server-side.
// Env var in Vercel: GEMINI_API_KEY  (zelfde als Growie/LVL UP)
export const maxDuration = 30;

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEYS = "Rusland, SaoediArabie, VS, Qatar, Noorwegen, Irak, VAE, Iran, Algerije, Nigeria, Koeweit, Kazachstan, Duitsland, Italie, Frankrijk, Nederland, Spanje, VK, China, India, Japan, ZuidKorea, Turkije, Polen, Hormuz, Malakka, Suez, BabElMandeb";

function systemPrompt(level, mode) {
  const niveau = {
    kind: "kind (8+): heel simpel, korte zinnen, gebruik een vergelijking uit het dagelijks leven, geen moeilijke woorden.",
    tiener: "tiener: helder oorzaak-en-gevolg, concreet, een beetje uitdagend.",
    volw: "volwassen: mechanismen, tweede-orde-effecten en nuance; geen verzonnen exacte cijfers.",
  }[level] || "tiener: helder oorzaak-en-gevolg.";
  const modus = mode === "watals"
    ? "WAT-ALS: hypothetische of extreme 'wat als'-situaties mogen, ook onwaarschijnlijke. Houd de GEVOLGEN wel logisch en leerzaam. Begin het veld \"situatie\" met de emoji 🔮."
    : "REALISTISCH: blijf strikt binnen wat echt zou kunnen, gebaseerd op bestaande afhankelijkheden en plausibele gevolgen. Geen fantasie, geen verzonnen feiten.";

  return `Je bent een ervaren econoom en geopoliticus die complexe afhankelijkheden rond ENERGIE (gas, olie, doorvoer-knooppunten) glashelder uitlegt. Je bouwt een interactief, vertakkend leer-scenario op een wereldglobe. Schrijf in het Nederlands.

WERELDMODEL — gebruik UITSLUITEND deze sleutels (exact zo geschreven) voor landen/knooppunten:
${KEYS}
Producenten/exporteurs: Rusland, SaoediArabie, VS, Qatar, Noorwegen, Irak, VAE, Iran, Algerije, Nigeria, Koeweit, Kazachstan.
Afnemers/importeurs: Duitsland, Italie, Frankrijk, Nederland, Spanje, VK, China, India, Japan, ZuidKorea, Turkije, Polen.
Knooppunten: Hormuz (~1/5 van alle olie), Malakka (olie naar Oost-Azie), Suez & BabElMandeb (route Europa-Azie).
Kernstromen: Rusland->Europa en China/India (gas/olie); Golf (SaoediArabie/VAE/Irak/Koeweit)->Azie via Hormuz (olie); Qatar->Azie/Europa (LNG); Noorwegen/Algerije->Europa (gas); VS->Europa (LNG).

NIVEAU: ${niveau}
MODUS: ${modus}

PUBLIEK: de gewone Nederlander (geen expert). Leg het glashelder en concreet uit. Dit is GEEN quiz: er zijn geen goede of foute antwoorden. De "keuzes" zijn richtingen die de speler kan verkennen ("wat als..."); bij elke keuze laat je vooral ZIEN wat er gebeurt.

OPDRACHT: gegeven de geschiedenis en de laatste keuze, beschrijf de NIEUWE situatie en leg de gevolgen helder uit. Maak telkens expliciet wat het betekent voor VOEDSEL, BRANDSTOF en PRIJZEN, en -- heel belangrijk -- wat het concreet betekent voor NEDERLAND en de gewone Nederlander (boodschappen, benzine/diesel, energierekening, banen, de haven). Bied daarna 2 of 3 richtingen om verder te ontdekken. Na 3 tot 5 stappen rond je af (einde=true) met een korte slotreflectie. Verzin NOOIT exacte percentages of cijfers alsof ze feitelijk zijn.

MISSIE: help de gewone Nederlander begrijpen wat er ECHT gaande is en hoe reeel hun zorgen zijn (komt er oorlog? wordt benzine duurder? gaat de gasprijs omhoog?), zodat ze minder vatbaar worden voor paniekberichten. Vul daarom ALTIJD het veld "perspectief": een rustige, eerlijke inschatting van hoe waarschijnlijk dit is en hoe groot de impact echt is, en wat men realistisch mag verwachten. Niet bagatelliseren, niet bangmaken -- nuchter en in verhouding.

Antwoord UITSLUITEND met geldige JSON, exact dit formaat:
{"titel":"korte titel","situatie":"de situatie en gevolgen (voedsel, brandstof, prijzen), in het juiste niveau","nederland":"wat dit concreet betekent voor Nederland en de gewone Nederlander","perspectief":"nuchtere inschatting: hoe waarschijnlijk en hoe groot is dit echt, en wat mag je realistisch verwachten","basis":"de echte afhankelijkheid of het mechanisme waarop deze redenering rust (en eerlijk: hoe zeker)","geraakt":["sleutel"],"omhoog":["sleutel"],"stromen":[{"van":"sleutel","naar":"sleutel","soort":"gas"}],"keuzes":[{"label":"richting om te ontdekken"}],"einde":false,"slot":""}
- "geraakt" = direct geraakte landen. "omhoog" = landen waar prijs/druk stijgt. "stromen" = relevante of verstoorde energiestromen (soort = "gas" of "olie").
- "nederland" = ALTIJD invullen: het concrete gevolg voor Nederland (prijzen, boodschappen, brandstof, energierekening, haven).
- "perspectief" = ALTIJD invullen: een rustige, eerlijke inschatting die paniek in verhouding brengt (hoe waarschijnlijk + hoe groot de impact echt is). Niet bagatelliseren, niet bangmaken.
- "basis" = ALTIJD invullen: noem de echte afhankelijkheid of het mechanisme uit het wereldmodel waarop je redenering rust, en wees eerlijk als iets onzeker of speculatief is. Verzin geen feiten of cijfers.
- Gebruik ALLEEN geldige sleutels uit de lijst. Laat een lijst leeg als niet van toepassing.
- Bij einde=true: "keuzes" is [] en vul "slot". Anders is "slot" "".`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Alleen POST" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Server mist GEMINI_API_KEY" });

  try {
    let payload = req.body || {};
    if (typeof payload === "string") { try { payload = JSON.parse(payload); } catch (e) {} }
    let { level, mode, history } = payload;
    level = ["kind", "tiener", "volw"].includes(level) ? level : "tiener";
    mode = mode === "watals" ? "watals" : "realistisch";
    if (!Array.isArray(history) || !history.length) history = [{ role: "user", content: "Start een nieuw energie-scenario." }];

    const contents = history
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .slice(-16)
      .map((m) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: m.content.slice(0, 1500) }] }));

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: 1600,
        temperature: mode === "watals" ? 0.95 : 0.45,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
      system_instruction: { parts: [{ text: systemPrompt(level, mode) }] },
    };

    const isBusy = (o) => /503|429|overload|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(JSON.stringify(o || ""));
    const errs = [];

    for (const model of MODELS) {
      for (let attempt = 0; attempt < 1; attempt++) {
        let r, d;
        try {
          r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
            { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
          );
          d = await r.json();
        } catch (e) { errs.push("netwerk: " + e.message); await sleep(700); continue; }

        if (r.ok) {
          const cand = d.candidates && d.candidates[0];
          const text = ((cand && cand.content && cand.content.parts) || []).map((p) => p.text).filter(Boolean).join("");
          if (!text) {
            const why = (cand && cand.finishReason) || (d.promptFeedback && d.promptFeedback.blockReason) || "leeg antwoord";
            errs.push(model + ": geen tekst (" + why + ")"); break;
          }
          let scene;
          try { scene = JSON.parse(text); }
          catch (e) {
            const m = text.match(/\{[\s\S]*\}/);
            if (m) { try { scene = JSON.parse(m[0]); } catch (e2) {} }
          }
          if (!scene || typeof scene.situatie !== "string") { errs.push(model + ": ongeldig JSON-scenario"); break; }
          // veilige defaults
          scene.titel = scene.titel || "Scenario";
          ["geraakt", "omhoog", "keuzes", "stromen"].forEach((k) => { if (!Array.isArray(scene[k])) scene[k] = []; });
          scene.nederland = typeof scene.nederland === "string" ? scene.nederland : "";
          scene.basis = typeof scene.basis === "string" ? scene.basis : "";
          scene.perspectief = typeof scene.perspectief === "string" ? scene.perspectief : "";
          scene.einde = !!scene.einde;
          scene.slot = scene.slot || "";
          return res.status(200).json({ ok: true, scene });
        }
        errs.push(model + ": " + (d.error?.message || ("server " + r.status)));
        if (!isBusy(d)) break;
        await sleep(700);
      }
    }
    return res.status(503).json({ error: "Het scenario maken lukte niet: " + (errs.join(" | ") || "onbekend") });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
