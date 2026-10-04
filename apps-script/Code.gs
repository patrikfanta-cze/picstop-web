/**
 * PICSTOP – backend rezervací pro Google Apps Script.
 *
 * Nasazení:
 * 1. Vytvoř Google Tabulku, v ní Rozšíření → Apps Script a vlož tento kód.
 * 2. Spusť jednou funkci setup() (vytvoří listy a vyžádá oprávnění).
 * 3. Nasadit → Nové nasazení → Webová aplikace: spouštět jako „Já“, přístup „Kdokoli“.
 * 4. URL webové aplikace vlož do API_URL v js/rezervace.js.
 *
 * List „Rezervace“ je přehled rezervací. Řádek se stavem „zrušeno“ termín znovu uvolní.
 * List „Zavřeno“ obsahuje dny (sloupec A, datum), kdy se rezervovat nedá – dovolená, svátky.
 */

const NOTIFY_EMAIL = 'servis@picstop.cz';
const SHOP = 'PICSTOP';
const SHOP_PHONE = '+420 735 150 733';
const SHOP_ADDRESS = 'Na Lužci 226/10, 160 00 Praha 6';
const TZ = 'Europe/Prague';

// Must match HOURS in js/rezervace.js
const HOURS = {1: [11, 19], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [11, 19]};

function setup() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName('Rezervace')) {
    ss.insertSheet('Rezervace').appendRow(['Vytvořeno', 'Datum', 'Čas', 'Služba', 'Jméno', 'Telefon', 'E-mail', 'Kolo', 'Zpráva', 'Stav']);
  }
  if (!ss.getSheetByName('Zavřeno')) {
    ss.insertSheet('Zavřeno').appendRow(['Datum', 'Poznámka']);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

const fmtDate = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v);
const fmtTime = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'HH:mm') : String(v);

function busySlots() {
  const rows = SpreadsheetApp.getActive().getSheetByName('Rezervace').getDataRange().getValues().slice(1);
  return rows.filter(r => String(r[9]).toLowerCase() !== 'zrušeno').map(r => `${fmtDate(r[1])}T${fmtTime(r[2])}`);
}

function closedDays() {
  const rows = SpreadsheetApp.getActive().getSheetByName('Zavřeno').getDataRange().getValues().slice(1);
  return rows.filter(r => r[0]).map(r => fmtDate(r[0]));
}

function doGet() {
  return json({busy: busySlots(), closed: closedDays()});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const b = JSON.parse(e.postData.contents);
    for (const k of ['service', 'date', 'time', 'name', 'phone', 'email']) {
      if (!b[k] || String(b[k]).length > 200) return json({ok: false, error: 'Chybí povinné údaje'});
    }
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

    SpreadsheetApp.getActive().getSheetByName('Rezervace').appendRow([
      new Date(), b.date, "'" + b.time, b.service, b.name, b.phone, b.email, b.bike || '', (b.message || '').slice(0, 2000), 'nová',
    ]);

    const when = `${b.date.split('-').reverse().join('. ')} v ${b.time}`;
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: b.email,
      subject: `Nová rezervace: ${when} – ${b.name}${b.lang === 'en' ? ' (EN)' : ''}`,
      body: `Služba: ${b.service}\nTermín: ${when}\nJméno: ${b.name}\nTelefon: ${b.phone}\nE-mail: ${b.email}\nKolo: ${b.bike || '—'}\n\n${b.message || ''}`,
    });
    // Customer confirmation in the language of the page they booked from (b.lang = 'cs' | 'en')
    const en = b.lang === 'en';
    const SERVICE_EN = {'Servis kola': 'Bike service', 'Servis odpružení': 'Suspension service', 'Jiné': 'Other'};
    const whenEn = `${b.date.split('-').reverse().join('/')} at ${b.time}`;
    MailApp.sendEmail({
      to: b.email,
      replyTo: NOTIFY_EMAIL,
      name: SHOP,
      subject: en ? `Booking confirmation – ${SHOP}, ${whenEn}` : `Potvrzení rezervace – ${SHOP}, ${when}`,
      body: en
        ? `Hello,\n\nthank you for your booking. We look forward to seeing you on ${whenEn}.\n\nService: ${SERVICE_EN[b.service] || b.service}\nAddress: ${SHOP_ADDRESS}, Czech Republic\n\nIf you cannot make it, please let us know at ${SHOP_PHONE} or reply to this e-mail.\n\n${SHOP} – bike service for demanding riders`
        : `Dobrý den,\n\ndíky za rezervaci. Těšíme se na vás ${when}.\n\nSlužba: ${b.service}\nAdresa: ${SHOP_ADDRESS}\n\nPokud se nemůžete dostavit, dejte nám prosím vědět na ${SHOP_PHONE} nebo odpovědí na tento e-mail.\n\n${SHOP} – cykloservis pro náročné`,
    });
    return json({ok: true});
  } finally {
    lock.releaseLock();
  }
}
