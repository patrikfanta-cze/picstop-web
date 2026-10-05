// Test centre: catalogue filter + rental booking (pick-up → return date, price, contact form).
// Without an API URL (js/config.js) the booking runs as a demo: fake busy days, nothing is sent.
(() => {
const EN = document.documentElement.lang === 'en';
const API_URL = window.PICSTOP_API || '';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// mobile menu + footer year (shared by catalogue and product pages)
const burger = $('.burger'), menu = $('.menu');
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', menu.classList.toggle('open')));
$('#y').textContent = new Date().getFullYear();

/* ---------- catalogue filter ---------- */

const catalog = $('#catalog');
if (catalog) {
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('active', c === chip));
    const f = chip.dataset.filter;
    $$('.prod-card', catalog).forEach(card => {
      card.hidden = !(f === 'all' || card.dataset.cat === f || card.dataset.use.split(' ').includes(f));
    });
  }));
}

/* ---------- rental booking ---------- */

const root = $('#rental');
if (!root) return;
const P = JSON.parse($('#product').textContent);

// Pick-up and return only on opening days (0 = Sunday)
const HOURS = {1: [11, 19], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [11, 19]};
const BOOK_AHEAD_DAYS = 90;

const T = EN ? {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dow: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  version: 'Version', step1: 'Pick-up and return', hint: 'Click the pick-up day, then the return day. Crossed-out days are taken.',
  pickup: 'Pick-up', ret: 'Return', choosePickup: 'Choose the pick-up day', chooseReturn: 'Now choose the return day',
  days1: 'day', daysN: 'days', price: 'Price', free: 'Free', deposit: 'Refundable deposit (cash at pick-up)',
  tooLong: n => `You can borrow this product for up to ${n} days.`, taken: 'Someone has already booked part of this period. Please choose other days.',
  name: 'Full name', phone: 'Phone', email: 'E-mail', msg: 'Note (e.g. your current saddle, what bothers you)',
  consent: 'I acknowledge how PICSTOP processes my <a href="privacy.html" target="_blank">personal data</a> to handle the booking.',
  send: 'Book the test', sending: 'Sending…', invalid: 'Please fill this in correctly',
  demo: 'Demo version: the booking is not saved or sent anywhere yet. Taken days are only for illustration.',
  doneTitle: 'Booked, see you soon!', done: (w, e) => `Your test of ${P.label} from ${w} is booked. We have sent a confirmation to ${e}.`,
  doneDemo: (w, e) => `Demo: your test of ${P.label} from ${w} would now be booked and a confirmation sent to ${e}. Nothing was sent in this demo version.`,
  failed: 'The booking could not be saved. Please try again or call +420 735 150 733.', prev: 'Previous month', next: 'Next month',
} : {
  months: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'],
  days: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'],
  dow: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  version: 'Verze', step1: 'Vyzvednutí a vrácení', hint: 'Klikni na den vyzvednutí a potom na den vrácení. Přeškrtnuté dny jsou obsazené.',
  pickup: 'Vyzvednutí', ret: 'Vrácení', choosePickup: 'Vyber den vyzvednutí', chooseReturn: 'Teď vyber den vrácení',
  days1: 'den', daysN: 'dní', days2: 'dny', price: 'Cena', free: 'Zdarma', deposit: 'Vratná záloha (v hotovosti při vyzvednutí)',
  tooLong: n => `Tenhle produkt půjčujeme nejdéle na ${n} dní.`, taken: 'Část tohoto období už má někdo zarezervovanou. Vyber prosím jiné dny.',
  name: 'Celé jméno', phone: 'Telefon', email: 'E-mail', msg: 'Poznámka (např. tvoje současné sedlo, co tě trápí)',
  consent: 'Beru na vědomí, jak PICSTOP zpracovává moje <a href="ochrana-osobnich-udaju.html" target="_blank">osobní údaje</a> pro vyřízení rezervace.',
  send: 'Zarezervovat test', sending: 'Odesílám…', invalid: 'Vyplň prosím správně',
  demo: 'Ukázková verze: rezervace se zatím nikam neukládá ani neodesílá. Obsazené dny jsou jen pro představu.',
  doneTitle: 'Zarezervováno, těšíme se!', done: (w, e) => `Test ${P.label} ${w} je zarezervovaný. Potvrzení jsme poslali na ${e}.`,
  doneDemo: (w, e) => `Ukázka: test ${P.label} ${w} by se teď zarezervoval a na ${e} by přišlo potvrzení. V ukázkové verzi se nic neodeslalo.`,
  failed: 'Rezervaci se nepodařilo uložit. Zkus to prosím znovu, nebo zavolej na +420 735 150 733.', prev: 'Předchozí měsíc', next: 'Další měsíc',
};

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const diffDays = (a, b) => Math.round((b - a) / 86400000);
const pragueNow = () => new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Prague'}));
const money = n => EN ? `CZK ${n.toLocaleString('en-US')}` : `${n.toLocaleString('cs-CZ').replace(/ /g, ' ')} Kč`;
const dayWord = n => EN ? (n === 1 ? T.days1 : T.daysN) : (n === 1 ? T.days1 : n < 5 ? T.days2 : T.daysN);
const dateLabel = d => EN ? `${T.days[d.getDay()]} ${d.getDate()} ${T.months[d.getMonth()]}` : `${T.days[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;

// Price: full weeks at the weekly price, remaining days at the daily price capped by the weekly price
function priceFor(days) {
  const {day, week} = P.price;
  return Math.floor(days / 7) * week + Math.min((days % 7) * day, week);
}

const state = {variant: P.variants[0] || '', from: null, to: null, view: null, busy: []};
const key = () => P.id + (state.variant ? '|' + state.variant : '');

/* availability: list of {key, from, to} (inclusive dates as YYYY-MM-DD) */
function demoBusy() {
  // deterministic fake bookings so the calendar looks realistic in demo mode
  const out = [];
  const today = pragueNow(); today.setHours(0, 0, 0, 0);
  for (const v of (P.variants.length ? P.variants : [''])) {
    let h = 0;
    for (const c of P.id + v) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const start = addDays(today, 4 + (h % 12));
    out.push({key: P.id + (v ? '|' + v : ''), from: ymd(start), to: ymd(addDays(start, 3 + (h % 5)))});
    const start2 = addDays(start, 18 + (h % 9));
    out.push({key: P.id + (v ? '|' + v : ''), from: ymd(start2), to: ymd(addDays(start2, 6))});
  }
  return out;
}

async function loadBusy() {
  if (!API_URL) { state.busy = demoBusy(); return; }
  try {
    const r = await fetch(`${API_URL}?type=test&product=${encodeURIComponent(P.id)}`);
    const data = await r.json();
    state.busy = data.test || [];
  } catch (e) {
    console.error('Availability could not be loaded', e);
  }
}

const isBusy = d => state.busy.some(b => b.key === key() && ymd(d) >= b.from && ymd(d) <= b.to);
const today0 = () => { const t = pragueNow(); t.setHours(0, 0, 0, 0); return t; };
function canBeEndpoint(d) {
  const now = pragueNow(), t = today0();
  if (d < t || d > addDays(t, BOOK_AHEAD_DAYS)) return false;
  const h = HOURS[d.getDay()];
  if (!h) return false;
  if (ymd(d) === ymd(t) && now.getHours() >= h[1] - 1) return false; // too late to pick up today
  return !isBusy(d);
}
function rangeFree(a, b) {
  for (let d = new Date(a); d <= b; d = addDays(d, 1)) if (isBusy(d)) return false;
  return true;
}

/* ---------- render ---------- */

root.innerHTML = `
  <div class="rental-grid">
    <div>
      ${P.variants.length ? `<label class="rental-variant">${T.version}<select id="variant">${P.variants.map(v => `<option>${v}</option>`).join('')}</select></label>` : ''}
      <h3 class="rental-step">${T.step1}</h3>
      <p class="rental-hint">${T.hint}</p>
      <div class="calendar">
        <div class="cal-head">
          <button class="cal-nav" id="cal-prev" type="button" aria-label="${T.prev}">‹</button>
          <span id="cal-month"></span>
          <button class="cal-nav" id="cal-next" type="button" aria-label="${T.next}">›</button>
        </div>
        <div class="cal-grid cal-dow">${T.dow.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="cal-grid" id="cal-days"></div>
      </div>
    </div>
    <div>
      <div class="rental-summary" id="summary" aria-live="polite"></div>
      <form class="details rental-form" id="rental-form" novalidate>
        <label>${T.name}<input name="name" autocomplete="name" required></label>
        <label>${T.phone}<input name="phone" type="tel" autocomplete="tel" placeholder="+420 " required></label>
        <label class="full">${T.email}<input name="email" type="email" autocomplete="email" required></label>
        <label class="full">${T.msg}<textarea name="message" rows="3"></textarea></label>
        <label class="consent full"><input type="checkbox" name="consent" required> ${T.consent}</label>
        <button class="btn btn-red full" id="rental-send" type="submit" disabled>${T.send}</button>
      </form>
    </div>
  </div>
  <div class="done rental-done" id="rental-done" hidden><h2>${T.doneTitle}</h2><span class="bar"></span><p id="rental-done-text"></p></div>`;

if (!API_URL) { $('#demo-note').hidden = false; $('#demo-note').textContent = T.demo; }

function renderCalendar() {
  const t = today0();
  const v = state.view;
  $('#cal-month').textContent = `${T.months[v.getMonth()]} ${v.getFullYear()}`;
  $('#cal-prev').disabled = v <= new Date(t.getFullYear(), t.getMonth(), 1);
  $('#cal-next').disabled = new Date(v.getFullYear(), v.getMonth() + 1, 1) > addDays(t, BOOK_AHEAD_DAYS);
  const first = new Date(v.getFullYear(), v.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
  const grid = $('#cal-days');
  grid.innerHTML = '';
  for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
  for (let n = 1; n <= count; n++) {
    const d = new Date(v.getFullYear(), v.getMonth(), n);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'day';
    b.textContent = n;
    const busy = d >= t && isBusy(d);
    b.classList.toggle('busy', busy);
    b.disabled = !canBeEndpoint(d);
    if (ymd(d) === ymd(t)) b.classList.add('today');
    if (state.from && ymd(d) === ymd(state.from)) b.classList.add('selected', 'edge');
    if (state.to && ymd(d) === ymd(state.to)) b.classList.add('selected', 'edge');
    if (state.from && state.to && d > state.from && d < state.to) b.classList.add('in-range');
    b.addEventListener('click', () => pick(d));
    grid.append(b);
  }
}

let error = '';
function pick(d) {
  error = '';
  if (!state.from || state.to || d <= state.from) {
    state.from = d; state.to = null;
  } else if (diffDays(state.from, d) > P.maxDays) {
    error = T.tooLong(P.maxDays);
  } else if (!rangeFree(state.from, d)) {
    error = T.taken;
  } else {
    state.to = d;
  }
  renderCalendar();
  renderSummary();
}

function renderSummary() {
  const s = $('#summary');
  const rows = [];
  rows.push(`<div><span>${T.pickup}</span><b>${state.from ? dateLabel(state.from) : '—'}</b></div>`);
  rows.push(`<div><span>${T.ret}</span><b>${state.to ? dateLabel(state.to) : '—'}</b></div>`);
  if (state.from && state.to) {
    const days = diffDays(state.from, state.to);
    const price = priceFor(days);
    rows.push(`<div><span>${days} ${dayWord(days)}</span><b class="rental-price">${price === 0 ? T.free : money(price)}</b></div>`);
    rows.push(`<div><span>${T.deposit}</span><b>${money(P.deposit)}</b></div>`);
  } else {
    rows.push(`<p class="rental-next">${state.from ? T.chooseReturn : T.choosePickup}</p>`);
  }
  if (error) rows.push(`<p class="rental-error" role="alert">${error}</p>`);
  s.innerHTML = rows.join('');
  $('#rental-send').disabled = !(state.from && state.to);
}

function valid() {
  let ok = true;
  for (const el of $$('#rental-form input[required]')) {
    let v = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
    if (v && el.type === 'email') v = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
    if (v && el.name === 'phone') v = el.value.replace(/\D/g, '').length >= 9;
    el.closest('label').classList.toggle('invalid', !v);
    ok &&= v;
  }
  return ok;
}

async function submit(e) {
  e.preventDefault();
  if (!(state.from && state.to) || !valid()) return;
  const f = new FormData($('#rental-form'));
  const days = diffDays(state.from, state.to);
  const booking = {
    type: 'test', productId: P.id, product: P.name, variant: state.variant,
    from: ymd(state.from), to: ymd(state.to), days, price: priceFor(days), deposit: P.deposit,
    name: f.get('name').trim(), phone: f.get('phone').trim(), email: f.get('email').trim(),
    message: f.get('message').trim(), lang: EN ? 'en' : 'cs',
  };
  const btn = $('#rental-send');
  btn.disabled = true;
  btn.textContent = T.sending;
  try {
    if (API_URL) {
      // text/plain avoids a CORS preflight, which Apps Script does not answer
      const r = await fetch(API_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(booking)});
      const res = await r.json();
      if (!res.ok) throw new Error(res.error || T.failed);
    }
    const when = EN ? `${dateLabel(state.from)} to ${dateLabel(state.to)}` : `od ${dateLabel(state.from)} do ${dateLabel(state.to)}`;
    $('#rental-done-text').textContent = API_URL ? T.done(when, booking.email) : T.doneDemo(when, booking.email);
    $('.rental-grid').hidden = true;
    $('#rental-done').hidden = false;
    $('#rezervace').scrollIntoView({behavior: 'smooth'});
  } catch (err) {
    alert(err.message || T.failed);
    await loadBusy(); state.from = state.to = null; renderCalendar(); renderSummary();
  } finally {
    btn.disabled = false;
    btn.textContent = T.send;
  }
}

(async function init() {
  await loadBusy();
  const t = today0();
  state.view = new Date(t.getFullYear(), t.getMonth(), 1);
  renderCalendar();
  renderSummary();
  $('#variant')?.addEventListener('change', e => { state.variant = e.target.value; state.from = state.to = null; error = ''; renderCalendar(); renderSummary(); });
  $('#cal-prev').addEventListener('click', () => { state.view.setMonth(state.view.getMonth() - 1); renderCalendar(); });
  $('#cal-next').addEventListener('click', () => { state.view.setMonth(state.view.getMonth() + 1); renderCalendar(); });
  $('#rental-form').addEventListener('input', e => e.target.closest('label')?.classList.remove('invalid'));
  $('#rental-form').addEventListener('submit', submit);
})();
})();
