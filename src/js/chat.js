// 818 Accounting Serve: chat assistant widget
// Sends the conversation to the chat Worker (worker/), which holds the Gemini
// key. Never put an API key in this file: everything here is public.

var CHAT_API_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? "http://localhost:8787"
  : ""; // set to the deployed Worker URL, e.g. https://818-chat.<account>.workers.dev

(function () {
  var history = [];
  var GREETING = "Hi, I'm Taxo! I can answer general accounting, tax and small business questions. What can I help you with?";
  var FALLBACK = "Sorry, Taxo is unavailable right now. Please call Garo at 310-941-1144 or email garog@818accountingserve.com.";

  var root = document.createElement("div");
  root.className = "chat";
  root.innerHTML =
    '<button class="chat-toggle" type="button" aria-expanded="false" aria-controls="chat-panel" aria-label="Chat with Taxo">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '</button>' +
    '<section class="chat-panel" id="chat-panel" hidden aria-label="Chat with Taxo">' +
      '<header class="chat-head">' +
        '<div><strong>Taxo</strong><small>General answers to accounting and tax questions</small></div>' +
        '<div class="chat-actions">' +
          '<button class="chat-expand" type="button" aria-label="Full screen" aria-pressed="false" title="Full screen">' +
            '<svg class="icon-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>' +
            '<svg class="icon-shrink" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>' +
          '</button>' +
          '<button class="chat-close" type="button" aria-label="Close chat">&times;</button>' +
        '</div>' +
      '</header>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<form class="chat-form">' +
        '<input type="text" name="q" placeholder="Type your question" aria-label="Your question" autocomplete="off" maxlength="2000" required>' +
        '<button class="pill" type="submit">Send</button>' +
      '</form>' +
      '<p class="chat-note">General information only, not tax advice. For your situation, call Garo at <a href="tel:+13109411144">310-941-1144</a>.</p>' +
    '</section>';
  document.body.appendChild(root);

  var toggle = root.querySelector(".chat-toggle");
  var panel = root.querySelector(".chat-panel");
  var log = root.querySelector(".chat-log");
  var form = root.querySelector(".chat-form");
  var input = form.elements.q;
  var send = form.querySelector("button");

  function add(role, text) {
    var msg = document.createElement("div");
    msg.className = "chat-msg " + role;
    msg.textContent = text;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
    return msg;
  }

  var expand = root.querySelector(".chat-expand");

  function setFullscreen(on) {
    root.classList.toggle("fullscreen", on);
    document.body.classList.toggle("chat-locked", on);
    expand.setAttribute("aria-pressed", String(on));
    expand.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
    expand.title = on ? "Exit full screen" : "Full screen";
    log.scrollTop = log.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      if (!log.children.length) add("assistant", GREETING);
      input.focus();
    } else {
      setFullscreen(false);
    }
  }

  toggle.addEventListener("click", function () { setOpen(panel.hidden); });
  root.querySelector(".chat-close").addEventListener("click", function () { setOpen(false); });
  expand.addEventListener("click", function () {
    setFullscreen(!root.classList.contains("fullscreen"));
    input.focus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("fullscreen")) setFullscreen(false);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    add("user", text);
    history.push({ role: "user", content: text });

    if (!CHAT_API_URL) {
      add("assistant", FALLBACK);
      return;
    }

    var pending = add("assistant pending", "Thinking...");
    send.disabled = true;
    fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var reply = data.reply || FALLBACK;
        pending.className = "chat-msg assistant";
        pending.textContent = reply;
        if (data.reply) history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        pending.className = "chat-msg assistant";
        pending.textContent = FALLBACK;
      })
      .then(function () {
        send.disabled = false;
        log.scrollTop = log.scrollHeight;
        input.focus();
      });
  });
})();
