/**
 * PICSTOP – backend rezervací pro Google Apps Script (servis + zápůjčky z testovacího centra).
 *
 * Nasazení:
 * 1. Vytvoř Google Tabulku, v ní Rozšíření → Apps Script a vlož tento kód.
 * 2. Spusť jednou funkci setup() (vytvoří listy a vyžádá oprávnění).
 * 3. Nasadit → Nové nasazení → Webová aplikace: spouštět jako „Já“, přístup „Kdokoli“.
 * 4. URL webové aplikace vlož do window.PICSTOP_API v js/config.js.
 *
 * List „Rezervace“ = rezervace servisu, list „Testy“ = zápůjčky testovacích produktů.
 * Řádek se stavem „zrušeno“ termín znovu uvolní.
 * List „Zavřeno“ obsahuje dny (sloupec A, datum), kdy se servis rezervovat nedá – dovolená, svátky.
 *
 * Každá rezervace pošle na NOTIFY_EMAIL e-mail s přílohami:
 *   rezervace.ics – pozvánka do kalendáře (klepnutím se uloží),
 *   kontakt.vcf   – kontaktní karta zákazníka (klepnutím se uloží do telefonu).
 */

const NOTIFY_EMAIL = 'servis@picstop.cz';
const SHOP = 'PICSTOP';
const SHOP_PHONE = '+420 735 150 733';
const SHOP_ADDRESS = 'Na Lužci 226/10, 160 00 Praha 6';
const TZ = 'Europe/Prague';

// Must match HOURS in js/rezervace.js and js/test.js
const HOURS = {1: [11, 19], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [11, 19]};
const MAX_TEST_DAYS = 31;

function setup() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName('Rezervace')) {
    ss.insertSheet('Rezervace').appendRow(['Vytvořeno', 'Datum', 'Čas', 'Služba', 'Jméno', 'Telefon', 'E-mail', 'Kolo', 'Zpráva', 'Stav']);
  }
  if (!ss.getSheetByName('Testy')) {
    ss.insertSheet('Testy').appendRow(['Vytvořeno', 'Produkt', 'ID produktu', 'Verze', 'Vyzvednutí', 'Vrácení', 'Dní', 'Cena (Kč)', 'Záloha (Kč)', 'Jméno', 'Telefon', 'E-mail', 'Poznámka', 'Jazyk', 'Stav']);
  }
  if (!ss.getSheetByName('Zavřeno')) {
    ss.insertSheet('Zavřeno').appendRow(['Datum', 'Poznámka']);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

const sheet = name => SpreadsheetApp.getActive().getSheetByName(name);
const fmtDate = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v);
const fmtTime = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'HH:mm') : String(v);
const czDate = ymd => ymd.split('-').reverse().map(Number).join('. ');
const isCancelled = v => String(v).toLowerCase() === 'zrušeno';

/* ---------- availability ---------- */

function busySlots() {
  return sheet('Rezervace').getDataRange().getValues().slice(1)
    .filter(r => !isCancelled(r[9])).map(r => `${fmtDate(r[1])}T${fmtTime(r[2])}`);
}

function closedDays() {
  return sheet('Zavřeno').getDataRange().getValues().slice(1).filter(r => r[0]).map(r => fmtDate(r[0]));
}

// Test rentals as {key: 'productId|variant', from, to} (inclusive dates)
function testBusy(productId) {
  return sheet('Testy').getDataRange().getValues().slice(1)
    .filter(r => !isCancelled(r[14]) && (!productId || r[2] === productId))
    .map(r => ({key: r[2] + (r[3] ? '|' + r[3] : ''), from: fmtDate(r[4]), to: fmtDate(r[5])}));
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.type === 'test') return json({test: testBusy(p.product)});
  return json({busy: busySlots(), closed: closedDays()});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const b = JSON.parse(e.postData.contents);
    return b.type === 'test' ? handleTest(b) : handleService(b);
  } finally {
    lock.releaseLock();
  }
}

const tooLong = (b, keys) => keys.some(k => !b[k] || String(b[k]).length > 200);

/* ---------- service booking ---------- */

function handleService(b) {
  if (tooLong(b, ['service', 'date', 'time', 'name', 'phone', 'email'])) return json({ok: false, error: 'Chybí povinné údaje'});
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !/^\d{2}:00$/.test(b.time)) return json({ok: false, error: 'Neplatný termín'});

  const day = new Date(b.date + 'T12:00:00');
  const range = HOURS[day.getDay()];
  const hour = Number(b.time.slice(0, 2));
  if (!range || hour < range[0] || hour >= range[1] || closedDays().includes(b.date)) {
    return json({ok: false, error: 'V tento čas máme zavřeno'});
  }
  if (busySlots().includes(`${b.date}T${b.time}`)) {
    return json({ok: false, error: 'Tenhle termín už mezitím někdo zabral'});
  }

  sheet('Rezervace').appendRow([
    new Date(), b.date, "'" + b.time, b.service, b.name, b.phone, b.email, b.bike || '', (b.message || '').slice(0, 2000), 'nová',
  ]);

  const when = `${czDate(b.date)} v ${b.time}`;
  const start = Utilities.parseDate(`${b.date} ${b.time}`, TZ, 'yyyy-MM-dd HH:mm');
  const end = new Date(start.getTime() + 60 * 60000);
  const details = `Služba: ${b.service}\nJméno: ${b.name}\nTelefon: ${b.phone}\nE-mail: ${b.email}\nKolo: ${b.bike || '—'}\n\n${b.message || ''}`;
  const ics = calendar([{uid: `servis-${start.getTime()}-${b.phone}`, start, end, summary: `Servis: ${b.name} – ${b.service}`, description: details}]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: b.email,
    subject: `Nová rezervace: ${when} – ${b.name}${b.lang === 'en' ? ' (EN)' : ''}`,
    body: `Termín: ${when}\n${details}\n\nV příloze je pozvánka do kalendáře (rezervace.ics) a kontaktní karta zákazníka (kontakt.vcf).`,
    attachments: [icsBlob(ics), vcardBlob(b, `Servis ${when}: ${b.service}`)],
  });

  // Customer confirmation in the language of the page they booked from (b.lang = 'cs' | 'en')
  const en = b.lang === 'en';
  const SERVICE_EN = {'Servis kola': 'Bike service', 'Servis odpružení': 'Suspension service', 'Jiné': 'Other'};
  const whenEn = `${b.date.split('-').reverse().join('/')} at ${b.time}`;
  const customerIcs = calendar([{uid: `servis-${start.getTime()}-${b.phone}`, start, end, summary: `${SHOP} – ${en ? 'bike service' : 'servis kola'}`, description: `${SHOP}, ${SHOP_ADDRESS}, ${SHOP_PHONE}`}]);
  MailApp.sendEmail({
    to: b.email,
    replyTo: NOTIFY_EMAIL,
    name: SHOP,
    subject: en ? `Booking confirmation – ${SHOP}, ${whenEn}` : `Potvrzení rezervace – ${SHOP}, ${when}`,
    body: en
      ? `Hello,\n\nthank you for your booking. We look forward to seeing you on ${whenEn}.\n\nService: ${SERVICE_EN[b.service] || b.service}\nAddress: ${SHOP_ADDRESS}, Czech Republic\n\nIf you cannot make it, please let us know at ${SHOP_PHONE} or reply to this e-mail.\n\n${SHOP} – bike service for demanding riders`
      : `Dobrý den,\n\ndíky za rezervaci. Těšíme se na vás ${when}.\n\nSlužba: ${b.service}\nAdresa: ${SHOP_ADDRESS}\n\nPokud se nemůžete dostavit, dejte nám prosím vědět na ${SHOP_PHONE} nebo odpovědí na tento e-mail.\n\n${SHOP} – cykloservis pro náročné`,
    attachments: [icsBlob(customerIcs)],
  });
  return json({ok: true});
}

/* ---------- test-centre rental ---------- */

function handleTest(b) {
  if (tooLong(b, ['productId', 'product', 'from', 'to', 'name', 'phone', 'email'])) return json({ok: false, error: 'Chybí povinné údaje'});
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.from) || !/^\d{4}-\d{2}-\d{2}$/.test(b.to)) return json({ok: false, error: 'Neplatný termín'});

  const from = new Date(b.from + 'T12:00:00'), to = new Date(b.to + 'T12:00:00');
  const days = Math.round((to - from) / 86400000);
  if (days < 1 || days > MAX_TEST_DAYS) return json({ok: false, error: 'Neplatná délka zápůjčky'});
  if (!HOURS[from.getDay()] || !HOURS[to.getDay()]) return json({ok: false, error: 'Vyzvednutí i vrácení musí být v otevírací den'});

  const key = b.productId + (b.variant ? '|' + b.variant : '');
  const clash = testBusy(b.productId).some(r => r.key === key && b.from <= r.to && b.to >= r.from);
  if (clash) return json({ok: false, error: b.lang === 'en' ? 'This product has just been booked for part of this period' : 'Tenhle produkt už mezitím někdo na část termínu zarezervoval'});

  const product = b.product + (b.variant ? ` (${b.variant})` : '');
  sheet('Testy').appendRow([
    new Date(), b.product, b.productId, b.variant || '', b.from, b.to, days, Number(b.price) || 0, Number(b.deposit) || 0,
    b.name, b.phone, b.email, (b.message || '').slice(0, 2000), b.lang || 'cs', 'nová',
  ]);

  const period = `${czDate(b.from)} – ${czDate(b.to)} (${days} dní)`;
  const price = Number(b.price) ? `${b.price} Kč` : 'zdarma';
  const details = `Produkt: ${product}\nVyzvednutí: ${czDate(b.from)}\nVrácení: ${czDate(b.to)}\nDélka: ${days} dní\nCena: ${price}\nZáloha: ${b.deposit} Kč\n\nJméno: ${b.name}\nTelefon: ${b.phone}\nE-mail: ${b.email}\n\n${b.message || ''}`;
  const uid = `test-${b.productId}-${b.from}-${b.phone}`.replace(/[^\w-]/g, '');
  const ics = calendar([
    {uid: uid + '-pickup', date: b.from, summary: `Test – vyzvednutí: ${product}, ${b.name}`, description: details},
    {uid: uid + '-return', date: b.to, summary: `Test – vrácení: ${product}, ${b.name}`, description: details},
  ]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: b.email,
    subject: `Nová zápůjčka: ${product} – ${b.name}, ${period}${b.lang === 'en' ? ' (EN)' : ''}`,
    body: `${details}\n\nV příloze je pozvánka do kalendáře (vyzvednutí a vrácení, rezervace.ics) a kontaktní karta zákazníka (kontakt.vcf).`,
    attachments: [icsBlob(ics), vcardBlob(b, `Test ${product}, ${period}`)],
  });

  const en = b.lang === 'en';
  const enDate = ymd => ymd.split('-').reverse().join('/');
  const customerIcs = calendar([
    {uid: uid + '-pickup', date: b.from, summary: `${SHOP} – ${en ? 'pick up' : 'vyzvednutí'}: ${product}`, description: `${SHOP}, ${SHOP_ADDRESS}, ${SHOP_PHONE}`},
    {uid: uid + '-return', date: b.to, summary: `${SHOP} – ${en ? 'return' : 'vrácení'}: ${product}`, description: `${SHOP}, ${SHOP_ADDRESS}, ${SHOP_PHONE}`},
  ]);
  MailApp.sendEmail({
    to: b.email,
    replyTo: NOTIFY_EMAIL,
    name: SHOP,
    subject: en ? `Test booking confirmed – ${product}` : `Potvrzení zápůjčky – ${product}`,
    body: en
      ? `Hello,\n\nthank you for your booking. Your test is confirmed:\n\nProduct: ${product}\nPick-up: ${enDate(b.from)}\nReturn: ${enDate(b.to)}\nPrice: ${Number(b.price) ? 'CZK ' + b.price : 'free'}\nRefundable deposit (cash at pick-up): CZK ${b.deposit}\n\nPick-up and return during opening hours (Mon and Fri 11–19, Tue–Thu 9–17) at ${SHOP_ADDRESS}, Czech Republic.\nIf your plans change, please let us know at ${SHOP_PHONE} or reply to this e-mail.\n\n${SHOP} – bike service for demanding riders`
      : `Dobrý den,\n\ndíky za rezervaci. Zápůjčka je potvrzená:\n\nProdukt: ${product}\nVyzvednutí: ${czDate(b.from)}\nVrácení: ${czDate(b.to)}\nCena: ${price}\nVratná záloha (v hotovosti při vyzvednutí): ${b.deposit} Kč\n\nVyzvednutí i vrácení v otevírací době (po a pá 11–19, út–čt 9–17) na adrese ${SHOP_ADDRESS}.\nPokud se vám plány změní, dejte nám prosím vědět na ${SHOP_PHONE} nebo odpovědí na tento e-mail.\n\n${SHOP} – cykloservis pro náročné`,
    attachments: [icsBlob(customerIcs)],
  });
  return json({ok: true});
}

/* ---------- .ics and .vcf ---------- */

// Escape text for iCalendar/vCard values
const icsText = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => '\\' + m);

// Fold lines longer than 75 characters (RFC 5545)
function fold(line) {
  const out = [];
  while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); }
  out.push(line);
  return out.join('\r\n');
}

// events: {uid, summary, description, start/end (Date, timed) | date ('YYYY-MM-DD', all-day)}
function calendar(events) {
  const utc = d => Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PICSTOP//Rezervace//CS', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.uid}@picstop.cz`, `DTSTAMP:${utc(new Date())}`);
    if (ev.date) {
      const next = new Date(ev.date + 'T12:00:00'); next.setDate(next.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${ev.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${Utilities.formatDate(next, TZ, 'yyyyMMdd')}`);
    } else {
      lines.push(`DTSTART:${utc(ev.start)}`, `DTEND:${utc(ev.end)}`);
    }
    lines.push(`SUMMARY:${icsText(ev.summary)}`, `DESCRIPTION:${icsText(ev.description)}`, `LOCATION:${icsText(SHOP + ', ' + SHOP_ADDRESS)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

const icsBlob = ics => Utilities.newBlob(ics, 'text/calendar; charset=utf-8', 'rezervace.ics');

function vcardBlob(b, note) {
  const parts = String(b.name).trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : '';
  const first = parts.join(' ');
  const card = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${icsText(last)};${icsText(first)};;;`,
    `FN:${icsText(b.name)}`,
    `TEL;TYPE=CELL:${String(b.phone).replace(/[^\d+]/g, '')}`,
    `EMAIL;TYPE=INTERNET:${b.email}`,
    `NOTE:${icsText('Zákazník PICSTOP – ' + note)}`,
    'END:VCARD',
  ].map(fold).join('\r\n') + '\r\n';
  return Utilities.newBlob(card, 'text/vcard; charset=utf-8', 'kontakt.vcf');
}
