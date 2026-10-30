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

  // Contact form is not yet connected to a form service: keep the page in place and say so
  var form = document.querySelector("form.form");
  if (form && form.getAttribute("action") === "#") {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = document.documentElement.lang;
      var msg = {
        ja: "このフォームはまだ送信先に接続されていません。",
        ko: "이 문의 양식은 아직 전송 서비스와 연결되지 않았습니다."
      }[lang] || "This form is not yet connected to a form service.";
      var note = form.querySelector(".form__note");
      if (!note) {
        note = document.createElement("p");
        note.className = "form__note";
        note.setAttribute("role", "status");
        form.appendChild(note);
      }
      note.textContent = msg;
    });
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
