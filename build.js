// Builds site/ from src/. Usage: node build.js
// English pages go to site/, other languages to site/<lang>/.
const fs = require("fs");
const path = require("path");
const cfg = require("./src/site.config.js");

const SRC = path.join(__dirname, "src", "pages");
const OUT = path.join(__dirname, "site");
const langCodes = Object.keys(cfg.langs);

const dirOf = (lang) => (lang === "en" ? "" : lang + "/");
const urlOf = (lang, page) => cfg.baseUrl + "/" + dirOf(lang) + (page === "index" ? "" : page);
// Relative link from a page in `from` language to `page` in `to` language
const relLink = (from, to, page) => (from === "en" ? "" : "../") + dirOf(to) + page + ".html";

function head(lang, page) {
  const L = cfg.langs[lang];
  const [title, desc] = L.meta[page];
  const root = lang === "en" ? "" : "../";
  const alternates = langCodes
    .map((c) => `  <link rel="alternate" hreflang="${cfg.langs[c].htmlLang}" href="${urlOf(c, page)}">`)
    .concat(`  <link rel="alternate" hreflang="x-default" href="${urlOf("en", page)}">`)
    .join("\n");
  const ld = page !== "index" ? "" : `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Conservation Dwelling Pte Ltd",
    "url": "${cfg.baseUrl}",
    "foundingDate": "2012",
    "foundingLocation": "Singapore",
    "address": { "@type": "PostalAddress", "addressCountry": "SG" },
    "areaServed": ["Singapore", "Japan", "South Korea"],
    "description": "Singapore-based conservation, adaptive-reuse and hospitality management company."
  }
  </script>`;
  return `<!doctype html>
<html lang="${L.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${urlOf(lang, page)}">
${alternates}
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${{ en: "en_SG", ja: "ja_JP", ko: "ko_KR" }[lang]}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${L.fonts}&display=swap" rel="stylesheet">
  <link rel="icon" href="${root}favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="${root}favicon-32.png">
  <link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
  <link rel="stylesheet" href="${root}assets/css/style.css">${ld}
</head>`;
}

function header(lang, page) {
  const L = cfg.langs[lang];
  const links = cfg.navPages
    .map((p) => `      <a href="${p}.html"${p === page ? ' aria-current="page"' : ""}>${L.nav[p]}</a>`)
    .join("\n");
  const switcher = langCodes
    .map((c) => c === lang
      ? `<span aria-current="true">${cfg.langs[c].label}</span>`
      : `<a href="${relLink(lang, c, page)}" hreflang="${cfg.langs[c].htmlLang}" lang="${cfg.langs[c].htmlLang}">${cfg.langs[c].label}</a>`)
    .join("");
  return `<header class="site-header">
  <div class="wrap">
    <a href="index.html" class="brand" aria-label="${L.home}">
      <span class="brand__name">Conservation Dwelling</span>
      <span class="brand__sub">${L.tagline}</span>
    </a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav" data-close="${L.close}">${L.menu}</button>
    <nav class="nav" id="nav" aria-label="Primary">
${links}
      <div class="lang-switch">${switcher}</div>
    </nav>
  </div>
</header>`;
}

function footer(lang) {
  const L = cfg.langs[lang];
  const F = L.footer;
  const root = lang === "en" ? "" : "../";
  const li = (p) => `<li><a href="${p}.html">${L.nav[p]}</a></li>`;
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="brand"><span class="brand__name">Conservation Dwelling</span></div>
        <p style="margin-top:1.2em">${L.tagline}</p>
        <p>${F.markets}</p>
      </div>
      <div>
        <h4>${F.company}</h4>
        <ul>${["about", "careers", "contact"].map(li).join("")}</ul>
      </div>
      <div>
        <h4>${F.work}</h4>
        <ul>${["what-we-do", "markets", "work", "insights"].map(li).join("")}</ul>
      </div>
      <div>
        <h4>${F.singapore}</h4>
        <ul>${F.address.map((a) => `<li>${a}</li>`).join("")}</ul>
      </div>
    </div>
    <div class="footer-base">
      <span>© <span id="year">2026</span> Conservation Dwelling Pte Ltd</span>
      <span>${F.established}</span>
    </div>
  </div>
</footer>

<script src="${root}assets/js/main.js"></script>
</body>
</html>
`;
}

// Replace placeholder blocks with real images once a file exists in site/assets/img/
// (<name>.webp, .jpg, .jpeg or .png, matching the placeholder's data-img).
const IMG_DIR = path.join(OUT, "assets", "img");
const IMG_EXT = [".webp", ".jpg", ".jpeg", ".png"];
function findImage(name) {
  for (const ext of IMG_EXT) if (fs.existsSync(path.join(IMG_DIR, name + ext))) return name + ext;
  return null;
}
const missingImages = new Set();
function swapImages(html, lang) {
  const root = lang === "en" ? "" : "../";
  return html.replace(/<div class="(ph[^"]*)" data-img="([^"]+)" data-label="([^"]*)"([^>]*)><\/div>/g,
    (match, cls, name, label, rest) => {
      const file = findImage(name);
      if (!file) { missingImages.add(name); return match; }
      const alt = label.replace(/^[^—]*—\s*/, "");
      const eager = name.startsWith("hero") ? ' fetchpriority="high"' : ' loading="lazy"';
      return `<div class="${cls} has-img"${rest}><img src="${root}assets/img/${file}" alt="${alt}"${eager} decoding="async"></div>`;
    });
}

let count = 0;
for (const lang of langCodes) {
  fs.mkdirSync(path.join(OUT, dirOf(lang)), { recursive: true });
  for (const page of cfg.pages) {
    const src = path.join(SRC, lang, page + ".html");
    if (!fs.existsSync(src)) { console.warn(`skip: ${lang}/${page} (no source)`); continue; }
    const body = swapImages(fs.readFileSync(src, "utf8").replace(/\s+$/, ""), lang);
    const html = [
      head(lang, page),
      `<body${page === "index" ? ' class="has-hero"' : ""}>`,
      "",
      header(lang, page),
      "",
      "<main>",
      "",
      body,
      "",
      "</main>",
      "",
      footer(lang),
    ].join("\n");
    fs.writeFileSync(path.join(OUT, dirOf(lang), page + ".html"), html);
    count++;
  }
}
// 404 page: served at any address, so all of its links must start from the site root
function notFoundPage() {
  cfg.langs.en.meta["404"] = ["Page not found | Conservation Dwelling", "This page could not be found."];
  const body = `  <section class="page-hero">
    <div class="wrap">
      <span class="eyebrow">404</span>
      <h1>This page could not be found.</h1>
      <p class="lede">The address may have changed, or the page may no longer exist.</p>
      <p lang="ja">お探しのページが見つかりませんでした。</p>
      <p lang="ko">찾으시는 페이지를 찾을 수 없습니다.</p>
      <div class="btn-row">
        <a href="index.html" class="btn btn--solid">Back to Home</a>
        <a href="contact.html" class="btn btn--ghost">Contact Us</a>
      </div>
    </div>
  </section>`;
  const html = [head("en", "404"), "<body>", "", header("en", "404"), "", "<main>", "", body, "", "</main>", "", footer("en")].join("\n")
    .replace(/\s*<link rel="(canonical|alternate)"[^>]*>/g, "")
    .replace(/\s*<meta property="og:[^>]*>/g, "")
    .replace("</title>", '</title>\n  <meta name="robots" content="noindex">')
    .replace(/(href|src)="(?!https?:|mailto:|#|\/)([^"]+)"/g, '$1="/$2"')
    .replace(/href="\/(ja|ko)\/404\.html"/g, 'href="/$1/"');
  fs.writeFileSync(path.join(OUT, "404.html"), html);
}

// Search engine files
function seoFiles() {
  const urls = langCodes.flatMap((lang) => cfg.pages.map((page) => {
    const alts = langCodes.map((c) => `    <xhtml:link rel="alternate" hreflang="${cfg.langs[c].htmlLang}" href="${urlOf(c, page)}"/>`).join("\n");
    return `  <url>\n    <loc>${urlOf(lang, page)}</loc>\n${alts}\n  </url>`;
  }));
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.baseUrl}/sitemap.xml\n`);
}

notFoundPage();
seoFiles();
console.log(`Built ${count} pages.`);
if (missingImages.size) console.log(`Images still using placeholders (${missingImages.size}): ${[...missingImages].join(", ")}`);
