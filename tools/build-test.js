// Generates the test-centre pages from tools/test-produkty.js:
//   test-centrum.html, test-<id>.html            (Czech)
//   en/test-centre.html, en/test-<id>.html       (English)
// Run from the project root:  node tools/build-test.js
const fs = require('fs');
const path = require('path');
const products = require('./test-produkty.js');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://patrikfanta-cze.github.io/picstop-web/';
const V = {css: 19, test: 2, cfg: 1};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n, en) => en ? `CZK ${n.toLocaleString('en-US')}` : `${n.toLocaleString('cs-CZ').replace(/ /g, ' ')} Kč`;

const L = {
  cs: {
    lang: 'cs', pre: '', catalog: 'test-centrum.html', page: id => `test-${id}.html`,
    other: {catalog: 'en/test-centre.html', page: id => `en/test-${id}.html`, lang: 'en', label: 'EN', title: 'English'},
    nav: [['index.html#servis', 'Servis'], ['index.html#zavody', 'Závody'], ['index.html#cenik', 'Ceník'], ['test-centrum.html', 'Test centrum'], ['index.html#o-nas', 'O nás'], ['https://www.picstop-shop.cz', 'E-shop'], ['index.html#kontakt', 'Kontakt']],
    book: ['rezervace.html', 'Rezervace'], home: 'PICSTOP – úvod',
    cats: {sedla: 'Sedla', brasny: 'Brašny', kola: 'Kola'},
    uses: {silnice: 'Silnice', mtb: 'MTB', gravel: 'Gravel', triatlon: 'Triatlon'},
    women: 'Vhodné i pro ženy', all: 'Vše',
    free: 'Zdarma', perDay: 'den', perWeek: 'týden', deposit: 'Vratná záloha', maxDays: n => `Zápůjčka až na ${n} dní`,
    freeWeek: 'Zdarma na týden', from: 'od',
    demo: 'Ukázková data', demoNote: 'Ukázková data: cena a parametry tohoto produktu jsou zatím jen pro představu a čekají na potvrzení od PICSTOPu.',
    detail: 'Detail a rezervace',
    footer: {id: 'IČ', city: 'Praha 6', complaints: ['reklamace.html', 'Reklamace'], privacy: ['ochrana-osobnich-udaju.html', 'Ochrana osobních údajů'], made: 'Web vytvořil', photos: 'Foto produktů: výrobci'},
  },
  en: {
    lang: 'en', pre: 'en/', catalog: 'test-centre.html', page: id => `test-${id}.html`,
    other: {catalog: 'test-centrum.html', page: id => `test-${id}.html`, lang: 'cs', label: 'CZ', title: 'Česky'},
    nav: [['index.html#service', 'Service'], ['index.html#racing', 'Racing'], ['index.html#pricing', 'Prices'], ['test-centre.html', 'Test centre'], ['index.html#about', 'About'], ['https://www.picstop-shop.cz', 'E-shop'], ['index.html#contact', 'Contact']],
    book: ['booking.html', 'Book now'], home: 'PICSTOP – home',
    cats: {sedla: 'Saddles', brasny: 'Bags', kola: 'Wheels'},
    uses: {silnice: 'Road', mtb: 'MTB', gravel: 'Gravel', triatlon: 'Triathlon'},
    women: 'Suitable for women', all: 'All',
    free: 'Free', perDay: 'day', perWeek: 'week', deposit: 'Refundable deposit', maxDays: n => `Rental for up to ${n} days`,
    freeWeek: 'Free for a week', from: 'from',
    demo: 'Sample data', demoNote: 'Sample data: the price and details of this product are for illustration only and are waiting for confirmation from PICSTOP.',
    detail: 'Details and booking',
    footer: {id: 'Company ID', city: 'Prague 6', complaints: ['complaints.html', 'Complaints'], privacy: ['privacy.html', 'Privacy policy'], made: 'Website by', photos: 'Product photos: manufacturers'},
  },
};

// Label for a price block: "3 hodiny", "1 den", "2 dny" / "3 hours", "1 day", "2 days"
const tierLabel = (tier, en) => tier.hours
  ? (en ? `${tier.hours} hours` : `${tier.hours} ${tier.hours < 5 ? "hodiny" : "hodin"}`)
  : (en ? `${tier.days} ${tier.days === 1 ? "day" : "days"}` : `${tier.days} ${tier.days === 1 ? "den" : tier.days < 5 ? "dny" : "dní"}`);

const pname = (p, en) => (en && p.nameEn) || p.name;
const full = (p, en) => p.brand === 'PICSTOP' ? pname(p, en) : `${p.brand} ${pname(p, en)}`;
const priceShort = (p, t, en) => p.price.tiers
  ? `${t.from} ${money(Math.min(...p.price.tiers.map(x => x.price)), en)}`
  : p.price.day === 0
  ? (p.maxDays === 7 ? t.freeWeek : t.free)
  : `${t.from} ${money(p.price.day, en)} / ${t.perDay}`;

function img(p, prefix, t, en, cls = '') {
  if (!p.img) return `<div class="prod-img prod-img-empty ${cls}"><span>${esc(t.cats[p.cat])}</span></div>`;
  return `<div class="prod-img ${cls}"><img src="${prefix}img/test/${p.img}" alt="${esc(full(p, en))}" loading="lazy"></div>`;
}

function layout({t, title, description, file, otherFile, body, scripts, jsonld}) {
  const en = t.lang === 'en';
  const prefix = en ? '../' : '';
  const nav = t.nav.map(([href, label]) => {
    const ext = href.startsWith('http');
    return `      <li><a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}${href === t.catalog && file === t.catalog ? ' aria-current="page"' : ''}>${label}</a></li>`;
  }).join('\n');
  const otherHref = en ? `../${otherFile}` : otherFile;
  const enUrl = BASE + (en ? `en/${file}` : otherFile);
  const csUrl = BASE + (en ? otherFile : file);
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${prefix}img/logo.png">
<link rel="alternate" hreflang="cs" href="${csUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="stylesheet" href="${prefix}css/fonts.css?v=1">
<link rel="stylesheet" href="${prefix}css/style.css?v=${V.css}">
${jsonld ? `<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 1)}\n</script>\n` : ''}</head>
<body>
<!-- Generated by tools/build-test.js from tools/test-produkty.js – edit the data, not this file. -->

<header id="top" class="scrolled">
  <div class="wrap nav">
    <a href="index.html" class="logo" aria-label="${t.home}">
      <img src="${prefix}img/logo.png" alt="" width="44" height="44">
      <span class="logo-text">PICSTOP</span>
    </a>
    <button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <ul class="menu">
${nav}
      <li class="lang">${en ? `<a href="${otherHref}" hreflang="cs" lang="cs" title="Česky">CZ</a><span aria-current="true">EN</span>` : `<span aria-current="true">CZ</span><a href="${otherHref}" hreflang="en" lang="en" title="English">EN</a>`}</li>
      <li><a href="${t.book[0]}" class="btn btn-red">${t.book[1]}</a></li>
    </ul>
  </div>
</header>

${body}

<footer>
  <div class="wrap">
    <span>© <span id="y"></span> Zdeněk Oupic (PICSTOP) · ${t.footer.id} 07735600 · Na Lužci 226/10, 160 00 ${t.footer.city}<small class="credit">${t.footer.photos}</small></span>
    <span><a href="${t.footer.complaints[0]}">${t.footer.complaints[1]}</a><a href="${t.footer.privacy[0]}">${t.footer.privacy[1]}</a></span>
    <p class="made">${t.footer.made} <a href="mailto:patrik.fanta@gmail.com">Patrik Fanta</a></p>
  </div>
</footer>

${scripts}
<!-- ${en ? 'Anonymous cookie-free visitor counting (GoatCounter), script hosted locally' : 'Anonymní měření návštěvnosti bez cookies (GoatCounter), skript hostovaný lokálně'} -->
<script data-goatcounter="https://picstop.goatcounter.com/count" async src="${prefix}js/count.js"></script>
</body>
</html>
`;
}

/* ---------- catalogue ---------- */

function catalog(t) {
  const en = t.lang === 'en';
  const prefix = en ? '../' : '';
  const cards = products.map(p => `      <a class="prod-card" href="${t.page(p.id)}" data-cat="${p.cat}" data-use="${p.use.join(' ')}${p.women ? ' zeny' : ''}">
        ${img(p, prefix, t, en)}
        <div class="prod-card-body">
          <small>${esc(p.brand === 'PICSTOP' ? t.cats[p.cat] : p.brand)}${p.demo ? ` <em class="demo-badge">${t.demo}</em>` : ''}</small>
          <h3>${esc(pname(p, en))}</h3>
          <p>${esc(p[t.lang].short)}</p>
          <div class="prod-tags">${p.use.map(u => `<span>${t.uses[u]}</span>`).join('')}${p.women ? `<span>${t.women}</span>` : ''}</div>
          <div class="prod-price">${esc(priceShort(p, t, en))}</div>
        </div>
      </a>`).join('\n');

  const saddles = products.filter(p => p.cat === 'sedla');
  const rows = saddles.map(p => {
    const s = p.specs[t.lang];
    const val = (...keys) => keys.map(k => s[k]).find(Boolean) || '—';
    return `          <tr><th scope="row"><a href="${t.page(p.id)}">${esc(full(p, en))}</a></th><td>${p.use.map(u => t.uses[u]).join(', ')}${p.women ? `, ${t.women.toLowerCase()}` : ''}</td><td>${esc(p.variants.length ? p.variants.join(', ') : val('Rozměr', 'Šířka', 'Size', 'Width'))}</td><td>${esc(val('Výřez', 'Cut-out', 'Tvar', 'Shape'))}</td><td>${esc(val('Ližiny', 'Rails'))}</td></tr>`;
  }).join('\n');

  const T = en ? {
    title: 'Test centre – try saddles, bags and wheels before you buy | PICSTOP Prague',
    desc: 'Try PRO and Selle San Marco saddles, Acepac bags and carbon wheels before you buy. Saddles are free to borrow for a week. Book online at PICSTOP, Prague 6.',
    kicker: 'Test centre', h1: 'Try before you buy',
    lead: 'Don\'t leave your choice to chance. Pick a saddle, bag or wheels, book them online and test them on your own bike in real riding.',
    how: 'How it works',
    steps: [['Choose', 'Browse the products below or come for advice. We talk about your current saddle and what you expect from the new one.'], ['Test', 'You take the product for a week and ride it on your own bike. For saddles you leave a CZK 1,000 cash deposit and we write up a short loan record.'], ['Decide', 'After the test you stop by and we talk about how it felt. The deposit is either deducted from a new purchase or returned.']],
    free: 'Testing saddles is completely non-binding and free of charge.',
    filter: 'Filter', compare: 'Saddle comparison', th: ['Saddle', 'Use', 'Versions / size', 'Cut-out / shape', 'Rails'],
  } : {
    title: 'Testovací centrum – vyzkoušej sedla, brašny a kola před nákupem | PICSTOP Praha',
    desc: 'Vyzkoušej sedla PRO a Selle San Marco, brašny Acepac a karbonová kola dřív, než je koupíš. Sedla půjčujeme na týden zdarma. Rezervace online, PICSTOP Praha 6.',
    kicker: 'Testovací centrum', h1: 'Vyzkoušej, než koupíš',
    lead: 'Nenechávej výběr náhodě. Vyber si sedlo, brašnu nebo kola, zarezervuj si je online a otestuj je na svém kole v reálném provozu.',
    how: 'Jak to funguje',
    steps: [['Vyber', 'Projdi si produkty níže, nebo se přijď poradit. Pobavíme se o tvém současném sedle a o tom, co od nového čekáš.'], ['Otestuj', 'Produkt si odvezeš na týden a jezdíš s ním na svém kole. U sedel složíš zálohu 1 000 Kč v hotovosti a sepíšeme krátký protokol o zápůjčce.'], ['Rozhodni se', 'Po testu se zastavíš a probereme, jak ti sedlo sedělo. Záloha se odečte z nově pořízeného kousku, nebo ti ji vrátíme.']],
    free: 'Testování sedel je u nás naprosto nezávazné a zdarma.',
    filter: 'Filtr', compare: 'Srovnání sedel', th: ['Sedlo', 'Použití', 'Verze / rozměr', 'Výřez / tvar', 'Ližiny'],
  };

  const chips = [['all', t.all], ...Object.entries(t.cats), ...Object.entries(t.uses), ['zeny', t.women]]
    .map(([k, v], i) => `<button type="button" class="chip${i === 0 ? ' active' : ''}" data-filter="${k}">${esc(v)}</button>`).join('');

  const body = `<main class="tc">
  <section class="tc-hero tc-band tc-first">
    <div class="wrap">
      <div class="kicker">${T.kicker}</div>
      <h1>${T.h1}</h1>
      <span class="bar"></span>
      <p class="tc-lead">${T.lead}</p>
    </div>
  </section>

  <section class="tc-how tc-band tc-gray">
    <div class="wrap">
      <h2>${T.how}</h2>
      <ol class="steps-list tc-steps">
${T.steps.map(([h, p]) => `        <li><b>${h}</b>${p}</li>`).join('\n')}
      </ol>
      <p class="tc-free">${T.free}</p>
    </div>
  </section>

  <section class="tc-catalog tc-band" id="katalog">
    <div class="wrap">
      <div class="chips" role="group" aria-label="${T.filter}">${chips}</div>
      <div class="prod-grid" id="catalog">
${cards}
      </div>
    </div>
  </section>

  <section class="tc-compare tc-band tc-gray">
    <div class="wrap">
      <h2>${T.compare}</h2>
      <div class="table-scroll">
        <table class="compare">
          <thead><tr>${T.th.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
    </div>
  </section>
</main>`;

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: T.h1,
    itemListElement: products.map((p, i) => ({'@type': 'ListItem', position: i + 1, url: BASE + t.pre + t.page(p.id), name: full(p, en)})),
  };
  return layout({t, title: T.title, description: T.desc, file: t.catalog, otherFile: t.other.catalog, body, jsonld,
    scripts: `<script src="${prefix}js/test.js?v=${V.test}"></script>`});
}

/* ---------- product page ---------- */

function productPage(t, p) {
  const en = t.lang === 'en';
  const prefix = en ? '../' : '';
  const d = p[t.lang];
  const specs = p.specs[t.lang];
  const T = en ? {
    back: 'Test centre', fit: 'Who it suits', specs: 'Specifications', versions: 'Versions to test',
    rental: 'Rental', price: 'Price', bookTitle: 'Book a test', bookCta: 'Book a test',
    related: 'Other products', pick: 'Pick-up and return during opening hours (Mon and Fri 11–19, Tue–Thu 9–17).',
  } : {
    back: 'Test centrum', fit: 'Pro koho je', specs: 'Parametry', versions: 'Verze k testování',
    rental: 'Zápůjčka', price: 'Cena', bookTitle: 'Rezervovat test', bookCta: 'Rezervovat test',
    related: 'Další produkty', pick: 'Vyzvednutí i vrácení v otevírací době (po a pá 11–19, út–čt 9–17).',
  };
  const priceLine = p.price.tiers ? p.price.tiers.map(x => `${tierLabel(x, en)} ${money(x.price, en)}`).join(" · ")
    : p.price.day === 0 ? t.free
    : `${money(p.price.day, en)} / ${t.perDay} · ${money(p.price.week, en)} / ${t.perWeek}`;
  const data = {
    id: p.id, name: full(p, false), label: full(p, en), variants: p.variants,
    tiers: p.price.tiers ? p.price.tiers.map(x => ({...x, label: tierLabel(x, en)})) : null,
    price: p.price, deposit: p.deposit, maxDays: p.maxDays, demo: !!p.demo,
  };
  const related = products.filter(o => o.id !== p.id && o.cat === p.cat).slice(0, 4);

  const body = `<main class="tc">
  <div class="tc-band tc-first"><div class="wrap prod">
    <nav class="crumbs" aria-label="breadcrumb"><a href="${t.catalog}">${T.back}</a> › <a href="${t.catalog}#katalog">${t.cats[p.cat]}</a> › <span>${esc(pname(p, en))}</span></nav>

    <div class="prod-top">
      ${img(p, prefix, t, en, 'prod-img-lg')}
      <div class="prod-info">
        <div class="kicker">${esc(p.brand === 'PICSTOP' ? t.cats[p.cat] : p.brand)}</div>
        <h1>${esc(pname(p, en))}</h1>
        <span class="bar"></span>
        <p class="prod-short">${esc(d.short)}</p>
        ${p.demo ? `<p class="demo-note">${t.demoNote}</p>` : ''}
        <dl class="prod-facts">
          <dt>${T.price}</dt><dd>${esc(priceLine)}</dd>
${p.deposit != null ? `          <dt>${t.deposit}</dt><dd>${esc(money(p.deposit, en))}</dd>
` : ""}          <dt>${T.rental}</dt><dd>${esc(p.price.tiers ? p.price.tiers.map(x => tierLabel(x, en)).join(" / ") : t.maxDays(p.maxDays))}</dd>
        </dl>
        ${d.note ? `<p class="prod-note">${esc(d.note)}</p>` : ""}
        <div class="prod-tags">${p.use.map(u => `<span>${t.uses[u]}</span>`).join('')}${p.women ? `<span>${t.women}</span>` : ''}</div>
        <a href="#rezervace" class="btn btn-red">${T.bookCta}</a>
      </div>
    </div>
  </div></div>

  <div class="tc-band tc-gray"><div class="wrap">
    <div class="prod-detail">
      <div>
        <p class="prod-desc">${esc(d.desc)}</p>
        <h2>${T.fit}</h2>
        <ul class="offer">${d.fit.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
      <div>
        <h2>${T.specs}</h2>
        <dl class="spec">${Object.entries(specs).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}${p.variants.length ? `<dt>${T.versions}</dt><dd>${esc(p.variants.join(', '))}</dd>` : ''}</dl>
      </div>
    </div>
  </div></div>

  <div class="tc-band"><div class="wrap">
    <section class="rental" id="rezervace">
      <h2>${T.bookTitle}</h2>
      <p class="rental-pick">${T.pick}</p>
      <div class="demo-note" id="demo-note" hidden></div>
      <div id="rental"></div>
    </section>
  </div></div>

${related.length ? `  <div class="tc-band tc-gray"><div class="wrap">
    <section class="related">
      <h2>${T.related}</h2>
      <div class="prod-grid prod-grid-sm">
${related.map(o => `        <a class="prod-card" href="${t.page(o.id)}">${img(o, prefix, t, en)}<div class="prod-card-body"><small>${esc(o.brand)}</small><h3>${esc(pname(o, en))}</h3><div class="prod-price">${esc(priceShort(o, t, en))}</div></div></a>`).join('\n')}
      </div>
    </section>
  </div></div>` : ''}
</main>
<script type="application/json" id="product">${JSON.stringify(data)}</script>`;

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: full(p, en), brand: {'@type': 'Brand', name: p.brand}, category: t.cats[p.cat],
    description: d.desc, url: BASE + t.pre + t.page(p.id),
    ...(p.img ? {image: BASE + 'img/test/' + p.img} : {}),
    additionalProperty: Object.entries(specs).map(([name, value]) => ({'@type': 'PropertyValue', name, value})),
  };
  const title = en ? `${full(p, en)} – test before you buy | PICSTOP Prague` : `${full(p, en)} – vyzkoušej před nákupem | PICSTOP Praha`;
  return layout({t, title, description: d.short + ' ' + d.desc.slice(0, 120), file: t.page(p.id), otherFile: t.other.page(p.id), body, jsonld,
    scripts: `<script src="${prefix}js/config.js?v=${V.cfg}"></script>\n<script src="${prefix}js/test.js?v=${V.test}"></script>`});
}

/* ---------- write ---------- */

for (const t of [L.cs, L.en]) {
  const dir = path.join(ROOT, t.pre);
  fs.writeFileSync(path.join(dir, t.catalog), catalog(t));
  for (const p of products) fs.writeFileSync(path.join(dir, t.page(p.id)), productPage(t, p));
}
console.log(`built ${2 * (products.length + 1)} pages`);
const verify = products.filter(p => p.verify || p.demo).map(p => `- ${full(p, false)}: ${p.verify || 'demo data'}`);
if (verify.length) console.log('To confirm with the client:\n' + verify.join('\n'));
