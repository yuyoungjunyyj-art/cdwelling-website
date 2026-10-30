// Conservation Dwelling — minimal site behaviour (no dependencies)
(function () {
  var body = document.body;
  var header = document.querySelector(".site-header");

  // Header becomes solid after scrolling past the hero
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    var openLabel = toggle.textContent;
    var closeLabel = toggle.dataset.close || "Close";
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
      toggle.textContent = open ? closeLabel : openLabel;
    });
  }

  // Subtle reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Insights topic filter
  var filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    var cards = document.querySelectorAll("[data-topic]");
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      filterBar.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var topic = btn.dataset.filter;
      cards.forEach(function (c) {
        c.hidden = topic !== "all" && c.dataset.topic.split(" ").indexOf(topic) === -1;
      });
    });
  }

  // Contact form: preselect enquiry type from ?type= (e.g. from Careers)
  var typeParam = new URLSearchParams(window.location.search).get("type");
  if (typeParam) {
    var radio = document.getElementById("t-" + typeParam);
    if (radio) radio.checked = true;
  }

  // Contact form: send through FormSubmit and show the result on the page
  var form = document.querySelector("form.form");
  if (form && form.action.indexOf("formsubmit.co") !== -1) {
    var copy = {
      en: { sending: "Sending…", ok: "Thank you. Your enquiry has been sent.", fail: "Your enquiry could not be sent. Please email us at dwell@cdwelling.com." },
      ja: { sending: "送信しています…", ok: "お問い合わせを送信しました。ありがとうございます。", fail: "送信できませんでした。dwell@cdwelling.com までメールでご連絡ください。" },
      ko: { sending: "보내는 중입니다…", ok: "문의가 전송되었습니다. 감사합니다.", fail: "문의를 보내지 못했습니다. dwell@cdwelling.com 으로 메일을 보내 주십시오." }
    }[document.documentElement.lang];
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var button = form.querySelector("button[type=submit]");
      var note = form.querySelector(".form__note");
      if (!note) {
        note = document.createElement("p");
        note.className = "form__note";
        note.setAttribute("role", "status");
        form.appendChild(note);
      }
      note.textContent = copy.sending;
      button.disabled = true;
      fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (String(data.success) !== "true") throw new Error(data.message);
        form.reset();
        note.textContent = copy.ok;
      }).catch(function () {
        note.textContent = copy.fail;
      }).finally(function () {
        button.disabled = false;
      });
    });
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
