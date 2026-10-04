// Shared behaviour for the home page (Czech and English versions).
const EN = document.documentElement.lang === 'en';

// sticky header background
const header = document.querySelector('header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, {passive: true}); onScroll();

// logo scrolls back to the very top
document.querySelector('.logo').addEventListener('click', e => {
  e.preventDefault();
  scrollTo({top: 0, behavior: 'smooth'});
  history.replaceState(null, '', location.pathname);
});

// Google map loads only after the visitor asks for it (no data sent to Google before that)
document.getElementById('map-load').addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.className = 'map';
  f.title = EN ? 'Map – PICSTOP' : 'Mapa – PICSTOP';
  f.src = `https://maps.google.com/maps?q=50.0996915,14.3446807&z=16&output=embed&hl=${EN ? 'en' : 'cs'}`;
  document.getElementById('map').replaceWith(f);
});

// mobile menu
const burger = document.querySelector('.burger'), menu = document.querySelector('.menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

// price tabs
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t === tab));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === tab.getAttribute('aria-controls')));
}));

// open-now indicator (Prague time)
const HOURS = {1: [11, 19], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [11, 19]};
const NAMES = EN
  ? ['on Sunday', 'on Monday', 'on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday', 'on Saturday']
  : ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];
const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Prague'}));
const d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
const status = document.getElementById('status');
document.querySelector(`#hours tr[data-d="${d}"]`)?.classList.add('today');
if (HOURS[d] && h >= HOURS[d][0] && h < HOURS[d][1]) {
  status.classList.add('open');
  status.querySelector('span').textContent = EN ? `Open now, until ${HOURS[d][1]}:00` : `Teď otevřeno, do ${HOURS[d][1]}:00`;
} else {
  let n = d;
  do { n = (n + 1) % 7; } while (!HOURS[n]);
  const today = HOURS[d] && h < HOURS[d][0];
  const day = today ? d : n;
  status.querySelector('span').textContent = EN
    ? `Closed · opening ${today ? 'today' : NAMES[day]} at ${HOURS[day][0]}:00`
    : `Zavřeno · otevíráme ${today ? 'dnes' : NAMES[day]} v ${HOURS[day][0]}:00`;
}
document.getElementById('y').textContent = new Date().getFullYear();
