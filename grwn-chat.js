/* GRWN.ai website-assistent — zelfstandige chat-widget. Praat met /api/chat (Gemini, GRWN-persona).
   Insluiten met: <script src="/grwn-chat.js" defer></script>  (op elke pagina waar je 'm wilt). */
(function () {
  if (window.__grwnChatLoaded) return;
  window.__grwnChatLoaded = true;

  var INK = "#173049", MAG = "#E83F6F", MAG_D = "#C72C58", GOLD = "#F5B400", LINE = "#EAEEF1", CLOUD = "#F6F9FB", SLATE = "#5C6873", CERU = MAG, CERU_D = MAG_D;

  var css = "" +
    ".grwnc-btn{position:fixed;right:22px;bottom:22px;z-index:99998;height:54px;padding:0 22px 0 17px;border-radius:999px;border:0;cursor:pointer;background:" + CERU + ";color:#fff;box-shadow:0 12px 32px rgba(23,48,73,.30);display:flex;align-items:center;gap:10px;font-family:Inter,system-ui,sans-serif;font-size:15px;font-weight:700;transition:transform .15s,background .15s}" +
    ".grwnc-btn:hover{background:" + CERU_D + ";transform:translateY(-2px)}" +
    ".grwnc-btn svg{width:24px;height:24px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
    ".grwnc-btn .dot{position:absolute;top:9px;left:30px;width:9px;height:9px;border-radius:50%;background:" + GOLD + ";border:2px solid " + CERU + "}" +
    ".grwnc-btn.hidden{display:none}" +
    ".grwnc-btn.pulse{animation:grwncPulse 2.8s ease-out infinite}" +
    "@keyframes grwncPulse{0%{box-shadow:0 12px 32px rgba(23,48,73,.30),0 0 0 0 rgba(245,180,0,.5)}70%{box-shadow:0 12px 32px rgba(23,48,73,.30),0 0 0 16px rgba(245,180,0,0)}100%{box-shadow:0 12px 32px rgba(23,48,73,.30),0 0 0 0 rgba(245,180,0,0)}}" +
    ".grwnc-teaser{position:fixed;right:22px;bottom:90px;z-index:99997;width:284px;max-width:calc(100vw - 44px);background:#fff;border:1px solid " + LINE + ";border-radius:16px;box-shadow:0 18px 50px rgba(23,48,73,.22);padding:15px 16px 14px;font-family:Inter,system-ui,sans-serif;display:none}" +
    ".grwnc-teaser.show{display:block;animation:grwncIn .25s ease}" +
    ".grwnc-teaser .body{cursor:pointer}" +
    ".grwnc-teaser b{display:block;font-size:14.5px;color:" + INK + ";margin-bottom:4px}" +
    ".grwnc-teaser p{margin:0;font-size:13px;color:" + SLATE + ";line-height:1.5}" +
    ".grwnc-teaser .tx{position:absolute;top:7px;right:9px;border:0;background:0;color:#aab3bd;font-size:19px;line-height:1;cursor:pointer;padding:2px 5px}" +
    ".grwnc-teaser::after{content:'';position:absolute;right:28px;bottom:-7px;width:13px;height:13px;background:#fff;border-right:1px solid " + LINE + ";border-bottom:1px solid " + LINE + ";transform:rotate(45deg)}" +
    ".grwnc-chips{display:flex;flex-direction:column;align-items:flex-start;gap:7px;margin-top:2px}" +
    ".grwnc-chip{border:1px solid " + LINE + ";background:#fff;color:" + CERU_D + ";font:inherit;font-size:13.5px;font-weight:600;padding:9px 13px;border-radius:999px;cursor:pointer;text-align:left;transition:.12s}" +
    ".grwnc-chip:hover{background:" + CLOUD + ";border-color:" + CERU + "}" +
    ".grwnc-panel{position:fixed;right:22px;bottom:92px;z-index:99999;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 130px);background:#fff;border:1px solid " + LINE + ";border-radius:18px;box-shadow:0 24px 70px rgba(23,48,73,.30);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,-apple-system,sans-serif}" +
    ".grwnc-panel.open{display:flex;animation:grwncIn .18s ease}" +
    "@keyframes grwncIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
    ".grwnc-head{background:" + CERU + ";color:#fff;padding:16px 18px;display:flex;align-items:center;gap:11px}" +
    ".grwnc-head .av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;letter-spacing:.02em}" +
    ".grwnc-head .av b{color:#fff}.grwnc-head .av .w{color:" + GOLD + "}" +
    ".grwnc-head h4{margin:0;font-size:15px;font-weight:700}" +
    ".grwnc-head p{margin:2px 0 0;font-size:12px;color:rgba(255,255,255,.8)}" +
    ".grwnc-head .x{margin-left:auto;background:0;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;opacity:.85;padding:2px 4px}" +
    ".grwnc-head .x:hover{opacity:1}" +
    ".grwnc-msgs{flex:1;overflow-y:auto;padding:18px;background:" + CLOUD + ";display:flex;flex-direction:column;gap:12px}" +
    ".grwnc-m{max-width:84%;font-size:14.5px;line-height:1.55;padding:11px 14px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}" +
    ".grwnc-m.bot{background:#fff;border:1px solid " + LINE + ";color:" + INK + ";align-self:flex-start;border-bottom-left-radius:5px}" +
    ".grwnc-m.me{background:" + CERU + ";color:#fff;align-self:flex-end;border-bottom-right-radius:5px}" +
    ".grwnc-m a{color:" + CERU_D + ";font-weight:600}" +
    ".grwnc-m.me a{color:#fff}" +
    ".grwnc-typing{align-self:flex-start;background:#fff;border:1px solid " + LINE + ";border-radius:14px;border-bottom-left-radius:5px;padding:13px 16px;display:flex;gap:5px}" +
    ".grwnc-typing i{width:7px;height:7px;border-radius:50%;background:#9aa8b5;animation:grwncBlink 1.2s infinite}" +
    ".grwnc-typing i:nth-child(2){animation-delay:.2s}.grwnc-typing i:nth-child(3){animation-delay:.4s}" +
    "@keyframes grwncBlink{0%,60%,100%{opacity:.3}30%{opacity:1}}" +
    ".grwnc-foot{border-top:1px solid " + LINE + ";padding:12px;display:flex;gap:8px;background:#fff}" +
    ".grwnc-foot textarea{flex:1;resize:none;border:1px solid " + LINE + ";border-radius:12px;padding:11px 13px;font:inherit;font-size:14.5px;color:" + INK + ";max-height:90px;outline:none}" +
    ".grwnc-foot textarea:focus{border-color:" + CERU + "}" +
    ".grwnc-foot button{flex:none;width:44px;border:0;border-radius:12px;background:" + CERU + ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
    ".grwnc-foot button:hover{background:" + CERU_D + "}.grwnc-foot button:disabled{background:#cfd6d2;cursor:not-allowed}" +
    ".grwnc-foot button svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
    ".grwnc-note{font-size:11px;color:#9aa8b5;text-align:center;padding:0 12px 10px;background:#fff}" +
    "@media(max-width:560px){.grwnc-panel{top:0;left:0;right:0;bottom:auto;width:100%;max-width:100%;height:100dvh;max-height:none;border-radius:0;border:0}.grwnc-btn{right:16px;bottom:16px}.grwnc-teaser{right:16px;left:16px;width:auto;max-width:none}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<button class="grwnc-btn pulse" aria-label="Chat met Growie" id="grwncBtn">' +
      '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/></svg>' +
      '<span class="dot"></span>' +
      'Vraag Growie' +
    '</button>' +
    '<div class="grwnc-teaser" id="grwncTeaser">' +
      '<button class="tx" id="grwncTeaserX" aria-label="Sluiten">&times;</button>' +
      '<div class="body" id="grwncTeaserBody">' +
        '<b>Hoi, ik ben Growie 👋</b>' +
        '<p>Vraag me alles over AI in jouw organisatie — waar te beginnen, wat wij doen, of wat LVL UP is.</p>' +
      '</div>' +
    '</div>' +
    '<div class="grwnc-panel" id="grwncPanel" role="dialog" aria-label="Growie — AI-assistent van GRWN">' +
      '<div class="grwnc-head">' +
        '<div class="av"><b>GR<span class="w">W</span>N</b></div>' +
        '<div><h4>Growie</h4><p>De AI-assistent van GRWN</p></div>' +
        '<button class="x" id="grwncClose" aria-label="Sluiten">&times;</button>' +
      '</div>' +
      '<div class="grwnc-msgs" id="grwncMsgs"></div>' +
      '<div class="grwnc-foot">' +
        '<textarea id="grwncInput" rows="1" placeholder="Stel je vraag…"></textarea>' +
        '<button id="grwncSend" aria-label="Versturen"><svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
      '</div>' +
      '<div class="grwnc-note">AI-assistent — kan fouten maken. Voor maatwerk: plan een kennismaking.</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var btn = document.getElementById("grwncBtn"),
    panel = document.getElementById("grwncPanel"),
    msgs = document.getElementById("grwncMsgs"),
    input = document.getElementById("grwncInput"),
    send = document.getElementById("grwncSend"),
    closeBtn = document.getElementById("grwncClose");

  var history = [];
  var greeted = false;
  var busy = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Mini-markdown: **vet**, *cursief*, links, en kale URLs/e-mail klikbaar.
  function fmt(s) {
    var t = esc(s);
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+|\/[^)\s]*|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/(^|[\s(])((https?:\/\/)[^\s)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    t = t.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
    return t;
  }

  function addMsg(role, text) {
    var d = document.createElement("div");
    d.className = "grwnc-m " + (role === "me" ? "me" : "bot");
    d.innerHTML = role === "me" ? esc(text) : fmt(text);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function typing(on) {
    var ex = document.getElementById("grwncTyping");
    if (on) {
      if (ex) return;
      var t = document.createElement("div");
      t.className = "grwnc-typing"; t.id = "grwncTyping";
      t.innerHTML = "<i></i><i></i><i></i>";
      msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
    } else if (ex) ex.remove();
  }

  function openPanel() {
    panel.classList.add("open");
    btn.classList.add("hidden");
    btn.classList.remove("pulse");
    var tz = document.getElementById("grwncTeaser"); if (tz) tz.classList.remove("show");
    try { sessionStorage.setItem("grwnc_teaser_seen", "1"); } catch (e) {}
    if (!greeted) {
      greeted = true;
      var hi = "Hoi, ik ben **Growie** 👋 — de AI-assistent van GRWN. Vraag me gerust iets over AI in jouw organisatie: waar je zou kunnen beginnen, wat AI-adoptie inhoudt, of wat wij doen. Waar loop je tegenaan?";
      addMsg("bot", hi);
      history.push({ role: "assistant", content: hi });
      var qs = ["Waar begin ik met AI?", "Wat is LVL UP?", "Wat doet GRWN precies?", "Is dit iets voor mijn organisatie?"];
      var cw = document.createElement("div"); cw.className = "grwnc-chips";
      qs.forEach(function (q) {
        var c = document.createElement("button"); c.className = "grwnc-chip"; c.type = "button"; c.textContent = q;
        c.addEventListener("click", function () { cw.remove(); input.value = q; sendMsg(); });
        cw.appendChild(c);
      });
      msgs.appendChild(cw); msgs.scrollTop = msgs.scrollHeight;
    }
    setTimeout(function () { fitMobile(); }, 40);
    setTimeout(function () { input.focus(); }, 50);
  }
  function closePanel() { panel.classList.remove("open"); btn.classList.remove("hidden"); panel.style.height = ""; }
  function fitMobile() {
    if (window.visualViewport && panel.classList.contains("open") && window.innerWidth <= 560) {
      panel.style.height = window.visualViewport.height + "px";
    } else {
      panel.style.height = "";
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitMobile);
    window.visualViewport.addEventListener("scroll", fitMobile);
  }

  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 90) + "px"; }

  function sendMsg() {
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true; send.disabled = true;
    addMsg("me", text);
    history.push({ role: "user", content: text });
    input.value = ""; autoGrow();
    typing(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        typing(false);
        var reply = res.j && res.j.text;
        if (res.ok && reply) {
          addMsg("bot", reply);
          history.push({ role: "assistant", content: reply });
        } else {
          addMsg("bot", (res.j && res.j.error) || "Sorry, er ging even iets mis. Probeer het zo nog eens — of mail ons op info@grwn.ai.");
        }
      })
      .catch(function () {
        typing(false);
        addMsg("bot", "Sorry, ik kon de server even niet bereiken. Probeer het zo nog eens — of mail info@grwn.ai.");
      })
      .finally(function () { busy = false; send.disabled = false; input.focus(); });
  }

  btn.addEventListener("click", function () { panel.classList.contains("open") ? closePanel() : openPanel(); });
  closeBtn.addEventListener("click", closePanel);
  send.addEventListener("click", sendMsg);
  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });

  // Teaser kort na laden tonen zodat bezoekers Growie meteen opmerken.
  (function () {
    var tz = document.getElementById("grwncTeaser");
    var seen = false; try { seen = !!sessionStorage.getItem("grwnc_teaser_seen"); } catch (e) {}
    if (!seen) setTimeout(function () { if (!panel.classList.contains("open")) tz.classList.add("show"); }, 2800);
    document.getElementById("grwncTeaserBody").addEventListener("click", function () { openPanel(); });
    document.getElementById("grwncTeaserX").addEventListener("click", function (e) {
      e.stopPropagation(); tz.classList.remove("show");
      try { sessionStorage.setItem("grwnc_teaser_seen", "1"); } catch (e2) {}
    });
  })();
})();
