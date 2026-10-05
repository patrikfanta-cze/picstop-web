// Booking flow for PICSTOP: service → date/slot → details → confirm.
// With API_URL empty the page runs as a demo (fake busy slots, nothing is sent).
// Set API_URL to the deployed Google Apps Script web app (see apps-script/Code.gs) to go live.
const API_URL = window.PICSTOP_API || ''; // set in js/config.js

// Opening hours per weekday (0 = Sunday). Slots are hourly; the last one starts an hour before closing.
const HOURS = {1: [11, 19], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [11, 19]};
const BOOK_AHEAD_DAYS = 60;
const MIN_LEAD_MINUTES = 60;

// Page language decides all texts; bookings are always stored with the Czech service names (radio values).
const EN = document.documentElement.lang === 'en';
const MONTHS = EN
  ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  : ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const DAYS = EN
  ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  : ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const T = EN ? {
  pickDay: 'Pick a day', service: 'Service', when: 'Date', name: 'Name', phone: 'Phone', bike: 'Bike', msg: 'Message',
  sending: 'Sending…', send: 'Send booking', saveFailed: 'The booking could not be saved',
  retry: 'Please try again or call +420 735 150 733.', at: 'at',
} : {
  pickDay: 'Vyber den', service: 'Služba', when: 'Termín', name: 'Jméno', phone: 'Telefon', bike: 'Kolo', msg: 'Zpráva',
  sending: 'Odesílám…', send: 'Odeslat rezervaci', saveFailed: 'Rezervaci se nepodařilo uložit',
  retry: 'Zkus to prosím znovu, nebo zavolej na +420 735 150 733.', at: 'v',
};

// "pondělí 5. 10." in Czech, "Monday 5 October" in English
function dayLabel(d, withYear = false) {
  const year = withYear ? ' ' + d.getFullYear() : '';
  return EN
    ? `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${year}`
    : `${DAYS[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.${year}`;
}

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "now" in Prague, as a local Date with the same wall-clock values
const pragueNow = () => new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Prague'}));

const state = {service: 'Servis kola', date: null, time: null, view: null, busy: new Set(), closed: new Set()};

/* ---------- availability ---------- */

// Demo: deterministic pseudo-random busy slots so the calendar looks realistic
function demoBusy(dateStr, hour) {
  let h = 0;
  for (const c of dateStr + hour) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 10 < 3;
}

async function loadAvailability(from, to) {
  if (!API_URL) return;
  try {
    const r = await fetch(`${API_URL}?from=${ymd(from)}&to=${ymd(to)}`);
    const data = await r.json();
    data.busy.forEach(s => state.busy.add(s));
    data.closed.forEach(d => state.closed.add(d));
  } catch (e) {
    console.error('Načtení termínů selhalo', e);
  }
}

function slotsFor(date) {
  const range = HOURS[date.getDay()];
  if (!range || state.closed.has(ymd(date))) return [];
  const now = pragueNow();
  const earliest = new Date(now.getTime() + MIN_LEAD_MINUTES * 60000);
  const out = [];
  for (let hr = range[0]; hr < range[1]; hr++) {
    const t = new Date(date); t.setHours(hr, 0, 0, 0);
    const key = `${ymd(date)}T${pad(hr)}:00`;
    const taken = API_URL ? state.busy.has(key) : demoBusy(ymd(date), hr);
    out.push({time: `${pad(hr)}:00`, free: t >= earliest && !taken});
  }
  return out;
}

const hasFreeSlot = date => slotsFor(date).some(s => s.free);

/* ---------- calendar ---------- */

function renderCalendar() {
  const today = pragueNow(); today.setHours(0, 0, 0, 0);
  const last = new Date(today); last.setDate(last.getDate() + BOOK_AHEAD_DAYS);
  const v = state.view;
  $('#cal-month').textContent = `${MONTHS[v.getMonth()]} ${v.getFullYear()}`;
  $('#cal-prev').disabled = v <= new Date(today.getFullYear(), today.getMonth(), 1);
  $('#cal-next').disabled = new Date(v.getFullYear(), v.getMonth() + 1, 1) > last;

  const first = new Date(v.getFullYear(), v.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
  const grid = $('#cal-days');
  grid.innerHTML = '';
  for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
  for (let d = 1; d <= days; d++) {
    const date = new Date(v.getFullYear(), v.getMonth(), d);
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d;
    b.className = 'day';
    const ok = date >= today && date <= last && hasFreeSlot(date);
    b.disabled = !ok;
    if (state.date && ymd(date) === ymd(state.date)) b.classList.add('selected');
    if (ymd(date) === ymd(today)) b.classList.add('today');
    b.addEventListener('click', () => { state.date = date; state.time = null; renderCalendar(); renderSlots(); });
    grid.append(b);
  }
}

function renderSlots() {
  const list = $('#slot-list');
  list.innerHTML = '';
  $('#to-details').disabled = !state.time;
  if (!state.date) { $('#slots-head').textContent = T.pickDay; return; }
  const d = state.date;
  $('#slots-head').textContent = dayLabel(d);
  for (const s of slotsFor(d)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.textContent = s.time;
    b.disabled = !s.free;
    if (state.time === s.time) b.classList.add('selected');
    b.addEventListener('click', () => { state.time = s.time; renderSlots(); });
    list.append(b);
  }
}

function firstAvailableDay() {
  const d = pragueNow(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i <= BOOK_AHEAD_DAYS; i++, d.setDate(d.getDate() + 1)) if (hasFreeSlot(d)) return new Date(d);
  return null;
}

/* ---------- steps ---------- */

let current = 1;
function go(step) {
  current = step;
  $$('.step-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === String(step)));
  $$('.steps li').forEach(li => {
    const n = Number(li.dataset.step);
    li.classList.toggle('active', step === 'done' || n <= step);
  });
  scrollTo({top: 0, behavior: 'smooth'});
}

function validDetails() {
  const f = $('#details');
  let ok = true;
  for (const el of $$('input[required]', f)) {
    let valid = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
    if (valid && el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
    if (valid && el.name === 'phone') valid = el.value.replace(/\D/g, '').length >= 9;
    (el.closest('label')).classList.toggle('invalid', !valid);
    ok &&= valid;
  }
  return ok;
}

function booking() {
  const f = new FormData($('#details'));
  return {
    service: state.service,
    date: ymd(state.date),
    time: state.time,
    name: f.get('name').trim(),
    phone: f.get('phone').trim(),
    email: f.get('email').trim(),
    bike: f.get('bike').trim(),
    message: f.get('message').trim(),
    lang: EN ? 'en' : 'cs',
  };
}

function renderSummary() {
  const b = booking();
  const d = state.date;
  const serviceLabel = $('input[name="service"]:checked').closest('label').querySelector('b').textContent;
  const rows = [
    [T.service, serviceLabel],
    [T.when, `${dayLabel(d, true)} ${T.at} ${b.time}`],
    [T.name, b.name], [T.phone, b.phone], ['E-mail', b.email],
    [T.bike, b.bike || '—'], [T.msg, b.message || '—'],
  ];
  const dl = $('#summary');
  dl.innerHTML = '';
  for (const [k, v] of rows) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  }
}

async function submit() {
  const btn = $('#submit');
  const b = booking();
  btn.disabled = true;
  btn.textContent = T.sending;
  try {
    if (API_URL) {
      // text/plain avoids a CORS preflight, which Apps Script does not answer
      const r = await fetch(API_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(b)});
      const res = await r.json();
      if (!res.ok) throw new Error(res.error || T.saveFailed);
    }
    const when = `${dayLabel(state.date)} ${T.at} ${b.time}`;
    const done = EN
      ? (API_URL
        ? `Your booking for ${when} is saved. We have sent a confirmation to ${b.email}.`
        : `Demo: your booking for ${when} would now be saved and a confirmation sent to ${b.email}. Nothing was sent in this demo version.`)
      : (API_URL
        ? `Rezervace na ${when} je uložená. Potvrzení jsme poslali na ${b.email}.`
        : `Ukázka: rezervace na ${when} by se teď uložila a na ${b.email} by přišlo potvrzení. V ukázkové verzi se nic neodeslalo.`);
    $('#done-text').textContent = done;
    go('done');
  } catch (e) {
    alert(`${e.message}. ${T.retry}`);
    if (API_URL) { state.busy.add(`${b.date}T${b.time}`); state.time = null; renderCalendar(); renderSlots(); go(2); }
  } finally {
    btn.disabled = false;
    btn.textContent = T.send;
  }
}

/* ---------- wiring ---------- */

async function init() {
  if (!API_URL) $('#demo-note').hidden = false;

  const today = pragueNow(); today.setHours(0, 0, 0, 0);
  const last = new Date(today); last.setDate(last.getDate() + BOOK_AHEAD_DAYS);
  await loadAvailability(today, last);

  const first = firstAvailableDay();
  state.view = new Date((first || today).getFullYear(), (first || today).getMonth(), 1);
  state.date = first;
  renderCalendar();
  renderSlots();

  $$('input[name="service"]').forEach(r => r.addEventListener('change', () => { state.service = r.value; }));
  $('#cal-prev').addEventListener('click', () => { state.view.setMonth(state.view.getMonth() - 1); renderCalendar(); });
  $('#cal-next').addEventListener('click', () => { state.view.setMonth(state.view.getMonth() + 1); renderCalendar(); });
  $$('[data-back]').forEach(b => b.addEventListener('click', () => go(current - 1)));
  $$('[data-next]').forEach(b => b.addEventListener('click', () => {
    if (current === 3) { if (!validDetails()) return; renderSummary(); }
    go(current + 1);
  }));
  $('#details').addEventListener('input', e => e.target.closest('label')?.classList.remove('invalid'));
  $('#submit').addEventListener('click', submit);

  // mobile menu
  const burger = $('.burger'), menu = $('.menu');
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', menu.classList.toggle('open')));
  $('#y').textContent = new Date().getFullYear();
}

init();
