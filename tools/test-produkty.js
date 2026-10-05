// Data for the test centre (catalogue + product pages + rental booking).
// Edit this file and run `node tools/build-test.js` to regenerate the pages.
//
// variants  = physical pieces that can be lent out (availability is tracked per variant)
// price     = rental price in CZK: day = per day, week = cap for 7 days (0 = free)
// deposit   = refundable deposit in CZK, paid in cash at pick-up
// maxDays   = longest allowed rental
// demo      = true → placeholder data, shown with a "sample data" badge until the client confirms it
//
// Saddle data comes from https://www.picstop.cz/test-centrum/sedla/ (October 2026).

module.exports = [
  {
    id: 'pro-stealth-tsa',
    cat: 'sedla', brand: 'PRO', name: 'Stealth TSA 1.1', img: 'pro-tsa.webp',
    use: ['triatlon'],
    variants: [],
    specs: {cs: {'Rozměr': '255 × 132 mm', 'Ližiny': 'karbon', 'Konstrukce': 'in-mold'}, en: {'Size': '255 × 132 mm', 'Rails': 'carbon', 'Construction': 'in-mold'}},
    cs: {
      short: 'Sedlo pro triatlon a časovky s polstrovanou špičkou.',
      desc: 'Sedlo speciálně přizpůsobené pro triatlon a časovky, s prvky modelu Stealth. In-mold konstrukce snižuje hmotnost a přináší aerodynamické, měkké tvary. Polstrovaná špička a podpůrná sedací část se širokým výřezem pro ventilaci a uvolnění tlaku. Tvar je optimalizovaný podle naměřených dat z bikefitting.com.',
      fit: ['Triatlon a časovky', 'Jízda v hluboké aero pozici na špičce sedla'],
    },
    en: {
      short: 'Triathlon and time-trial saddle with a padded nose.',
      desc: 'A saddle designed specifically for triathlon and time trials, with elements of the Stealth model. The in-mold construction reduces weight and gives aerodynamic, soft shapes. Padded nose and a supportive seating area with a wide cut-out for ventilation and pressure relief. The shape is optimised using fitting data from bikefitting.com.',
      fit: ['Triathlon and time trials', 'Riding in a deep aero position on the nose of the saddle'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'pro-falcon',
    cat: 'sedla', brand: 'PRO', name: 'Falcon 142 mm', img: 'pro-falcon.webp',
    use: ['silnice'],
    variants: [],
    specs: {cs: {'Šířka': '142 mm', 'Ližiny': 'CrMo', 'Skořepina': 'nylon', 'Polstrování': 'PU pěna', 'Profil': 'plochý'}, en: {'Width': '142 mm', 'Rails': 'CrMo', 'Shell': 'nylon', 'Padding': 'PU foam', 'Profile': 'flat'}},
    cs: {
      short: 'Plochý profil pro flexibilní jezdce se stabilní pozicí.',
      desc: 'Sedlo PRO Falcon s plochým profilem je ideální pro flexibilní jezdce, kteří mají na sedle stabilní pozici. Má nylonovou skořepinu na CrMo ližinách a polstrování z PU pěny, které spolu s anatomickým výřezem zajišťuje pohodlí. Je kompatibilní se všemi doplňky PRO pro sedla.',
      fit: ['Sportovní silniční jízda', 'Flexibilní jezdci se stabilní pozicí na sedle'],
    },
    en: {
      short: 'Flat profile for flexible riders with a stable position.',
      desc: 'The PRO Falcon saddle with its flat profile is ideal for flexible riders who keep a stable position on the saddle. It has a nylon shell on CrMo rails and PU foam padding which, together with the anatomical cut-out, provides comfort. It is compatible with all PRO saddle accessories.',
      fit: ['Sporty road riding', 'Flexible riders with a stable position on the saddle'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'pro-volture',
    cat: 'sedla', brand: 'PRO', name: 'Volture 142 mm', img: 'pro-volture.webp',
    use: ['silnice'],
    variants: [],
    specs: {cs: {'Šířka': '142 mm', 'Ližiny': 'CrMo', 'Výřez': 'bez otvoru', 'Barva': 'černá'}, en: {'Width': '142 mm', 'Rails': 'CrMo', 'Cut-out': 'none', 'Colour': 'black'}},
    cs: {
      short: 'Klasické sedlo bez otvoru.',
      desc: 'Sedlo PRO Volture ve verzi 142 mm, bez otvoru a s CrMo ližinami. Vhodné pro jezdce, kterým nevyhovují sedla s výřezem.',
      fit: ['Jezdci, kteří preferují sedlo bez otvoru'],
    },
    en: {
      short: 'Classic saddle without a cut-out.',
      desc: 'The PRO Volture saddle in the 142 mm version, without a cut-out and with CrMo rails. Suitable for riders who don\'t get on with cut-out saddles.',
      fit: ['Riders who prefer a saddle without a cut-out'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'pro-stealth-offroad',
    cat: 'sedla', brand: 'PRO', name: 'Stealth Offroad 142 mm', img: 'pro-stealth-offroad.webp',
    use: ['mtb', 'gravel'],
    variants: [],
    specs: {cs: {'Rozměr': '255 × 142 mm', 'Ližiny': 'nerezová ocel', 'Výplň': 'EVA', 'Konstrukce': 'in-mold'}, en: {'Size': '255 × 142 mm', 'Rails': 'stainless steel', 'Padding': 'EVA', 'Construction': 'in-mold'}},
    cs: {
      short: 'Offroadové sedlo s optimalizovaným tlumením.',
      desc: 'Offroadové sedlo s optimalizovaným tlumením. In-mold konstrukce snižuje hmotnost a zlepšuje pohodlí při jízdě, potah má superlehkou výplň EVA.',
      fit: ['MTB a gravel', 'Jezdci, kteří chtějí lehké sedlo s tlumením'],
    },
    en: {
      short: 'Off-road saddle with optimised damping.',
      desc: 'An off-road saddle with optimised damping. The in-mold construction reduces weight and improves riding comfort, and the cover has super-light EVA padding.',
      fit: ['MTB and gravel', 'Riders who want a light saddle with damping'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'sm-shortfit',
    cat: 'sedla', brand: 'Selle San Marco', name: 'Shortfit 2.0', img: 'sm-shortfit.jpg',
    use: ['silnice', 'mtb', 'gravel'], women: true,
    variants: ['Narrow Supercomfort', 'Wide Supercomfort', 'Narrow Racing', 'Wide Racing'],
    specs: {cs: {'Šířky': 'Narrow, Wide', 'Polstrování': 'Supercomfort, Racing', 'Výřez': 'zvětšený otvor'}, en: {'Widths': 'Narrow, Wide', 'Padding': 'Supercomfort, Racing', 'Cut-out': 'enlarged opening'}},
    cs: {
      short: 'Zvětšený otvor a širší špička. Oblíbené i u žen.',
      desc: 'Ideální řešení pro jezdce s ohebnými bedry, normální až širší stavbou pánve nebo agresivnějším jízdním stylem, kdy se zatěžuje perineální oblast a je potřeba jí ulevit. Pomáhá zvětšený otvor a rozšířená špička, na které se lépe rozkládá tlak. Model je určený pro široké spektrum užití na silnici, dráze i MTB a oblíbily si ho i ženy.',
      fit: ['Ohebná bedra, normální až širší pánev', 'Agresivní jízdní styl s tlakem na perineální oblast', 'Silnice, dráha i MTB', 'Vhodné i pro ženy'],
    },
    en: {
      short: 'Enlarged opening and a wider nose. Popular with women too.',
      desc: 'An ideal solution for riders with flexible hips, a normal to wider pelvis or a more aggressive riding style that puts pressure on the perineal area which needs relief. The enlarged opening and widened nose spread the pressure better. The model is designed for a wide range of uses on the road, track and MTB, and is also loved by women.',
      fit: ['Flexible hips, normal to wider pelvis', 'Aggressive riding style with pressure on the perineal area', 'Road, track and MTB', 'Suitable for women too'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
    verify: 'Název modelu doplněn podle popisu (na picstop.cz je jen „Sedla Selle San Marco“) – ověřit.',
  },
  {
    id: 'sm-ground',
    cat: 'sedla', brand: 'Selle San Marco', name: 'Ground', img: 'sm-ground.jpg',
    use: ['mtb', 'gravel'],
    variants: ['Narrow', 'Wide'],
    specs: {cs: {'Šířky': 'Narrow, Wide', 'Špička': 'dodatečně polstrovaná', 'Zadní část': 'zaříznutá'}, en: {'Widths': 'Narrow, Wide', 'Nose': 'extra padded', 'Rear': 'cut away'}},
    cs: {
      short: 'Univerzální sedlo na MTB a gravel.',
      desc: 'Sedlo určené primárně na MTB a gravel, vhodné pro široké spektrum jezdců díky velmi univerzální skořepině. Tvarem vychází z podobné skořepiny jako silniční Shortfit, ale má několik řešení do terénu: špička je dodatečně polstrovaná pro strmé výjezdy a zadní část je zaříznutá, aby se při jízdě za sedlem nezachytávaly kalhoty.',
      fit: ['MTB a gravel', 'Strmé výjezdy na špičce sedla', 'Jízda za sedlem ve sjezdech'],
    },
    en: {
      short: 'Versatile MTB and gravel saddle.',
      desc: 'A saddle designed primarily for MTB and gravel, suitable for a wide range of riders thanks to a very versatile shell. Its shape is based on a shell similar to the road Shortfit, but it has several off-road features: the nose is extra padded for steep climbs and the rear is cut away so your shorts don\'t catch when riding behind the saddle.',
      fit: ['MTB and gravel', 'Steep climbs on the nose of the saddle', 'Riding behind the saddle on descents'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'sm-mantra',
    cat: 'sedla', brand: 'Selle San Marco', name: 'Mantra', img: 'sm-mantra.webp',
    use: ['silnice', 'gravel'], women: true,
    variants: [],
    specs: {cs: {'Tvar': 'delta', 'Špička': 'široká, plochá', 'Konstrukce': 'open-shell'}, en: {'Shape': 'delta', 'Nose': 'wide, flat', 'Construction': 'open-shell'}},
    cs: {
      short: 'Delta tvar a široká plochá špička. Velmi vhodné i pro ženy.',
      desc: 'Model sází na delta tvar, širokou využitelnou špičku s plochým zakončením a open-shell konstrukci. Vyhovuje širokému spektru jezdců, kteří si díky delta tvaru lépe najdou svou jízdní pozici. Velmi vhodné sedlo i pro ženy.',
      fit: ['Široké spektrum jezdců', 'Hledání stabilní jízdní pozice', 'Velmi vhodné i pro ženy'],
    },
    en: {
      short: 'Delta shape and a wide flat nose. Great for women too.',
      desc: 'This model is built around a delta shape, a wide usable nose with a flat end and an open-shell construction. It suits a wide range of riders, who find their riding position more easily thanks to the delta shape. A very good saddle for women too.',
      fit: ['A wide range of riders', 'Finding a stable riding position', 'Very suitable for women too'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'sm-aspide-open-fit',
    cat: 'sedla', brand: 'Selle San Marco', name: 'Aspide Open-Fit', img: 'sm-aspide-open-fit.jpg',
    use: ['silnice'],
    variants: ['Narrow', 'Wide'],
    specs: {cs: {'Šířky': 'Narrow, Wide', 'Špička': 'delší a úzká', 'Výřez': 'standardní'}, en: {'Widths': 'Narrow, Wide', 'Nose': 'longer and narrow', 'Cut-out': 'standard'}},
    cs: {
      short: 'Silniční sedlo s dlouhou úzkou špičkou pro vrchaře.',
      desc: 'Sedlo je primárně určené na silnici pro jezdce se zdravým postavením a normální až užší pánví. Vyhovuje také vrchařům díky delší a úzké špičce a opoře, kterou zadní část poskytuje pánvi při stoupání. Otvor je standardní, počítá se tedy s průměrnou ohebností beder bez extrémního důrazu na úlevu intimním partiím.',
      fit: ['Silnice', 'Normální až užší pánev', 'Vrchaři', 'Průměrná ohebnost beder'],
    },
    en: {
      short: 'Road saddle with a long narrow nose for climbers.',
      desc: 'The saddle is designed primarily for the road, for riders with a healthy posture and a normal to narrower pelvis. It also suits climbers thanks to its longer, narrow nose and the support the rear gives the pelvis when climbing. The opening is standard, so it assumes average hip flexibility without extreme emphasis on relieving the intimate area.',
      fit: ['Road', 'Normal to narrower pelvis', 'Climbers', 'Average hip flexibility'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'sm-aspide-short',
    cat: 'sedla', brand: 'Selle San Marco', name: 'Aspide Short', img: 'sm-aspide-short.jpg',
    use: ['silnice'],
    variants: ['Narrow Comfort', 'Wide Comfort', 'Narrow Racing', 'Wide Racing'],
    specs: {cs: {'Šířky': 'Narrow, Wide', 'Polstrování': 'Comfort, Racing', 'Výřez': 'větší otvor', 'Špička': 'úzká'}, en: {'Widths': 'Narrow, Wide', 'Padding': 'Comfort, Racing', 'Cut-out': 'larger opening', 'Nose': 'narrow'}},
    cs: {
      short: 'Větší otvor, plochý charakter a úzká špička.',
      desc: 'Sedlo nabízí větší otvor, stále relativně plochý charakter a úzkou špičku. Díky širšímu otvoru a nově tvarované zadní části nabízí víc pohodlí. Je vhodné pro jezdce s užší, spíše podsazenou pánví.',
      fit: ['Silnice', 'Užší, spíše podsazená pánev', 'Víc pohodlí díky širšímu otvoru'],
    },
    en: {
      short: 'Larger opening, flat character and a narrow nose.',
      desc: 'The saddle offers a larger opening, a still relatively flat character and a narrow nose. The wider opening and newly shaped rear make it more comfortable. It is suitable for riders with a narrower, rather tucked-under pelvis.',
      fit: ['Road', 'Narrower, rather tucked-under pelvis', 'More comfort thanks to the wider opening'],
    },
    price: {day: 0, week: 0}, deposit: 1000, maxDays: 7,
  },
  {
    id: 'acepac-bikepacking',
    cat: 'brasny', brand: 'Acepac', name: 'Bikepackingová sada', nameEn: 'Bikepacking set', img: null,
    use: ['gravel', 'mtb', 'silnice'],
    variants: [],
    specs: {cs: {'Obsah': 'podsedlová, rámová a řídítková brašna'}, en: {'Includes': 'saddle, frame and handlebar bag'}},
    cs: {
      short: 'Lehké a odolné brašny na výlety i expedice.',
      desc: 'Lehké, odolné a prostorné brašny Acepac na krátké výlety i dlouhé expedice. Vyzkoušej si, jak se ti s nimi jede, než si pořídíš vlastní.',
      fit: ['Bikepacking a cestování na kole', 'Gravel, MTB i silnice'],
    },
    en: {
      short: 'Light and durable bags for trips and expeditions.',
      desc: 'Light, durable and roomy Acepac bags for short trips and long expeditions. Try how you ride with them before you buy your own.',
      fit: ['Bikepacking and bike touring', 'Gravel, MTB and road'],
    },
    price: {day: 150, week: 600}, deposit: 2000, maxDays: 14,
    demo: true,
  },
  {
    id: 'karbonova-kola',
    cat: 'kola', brand: 'PICSTOP', name: 'Karbonová zapletená kola', nameEn: 'Carbon wheelset', img: null,
    use: ['silnice', 'triatlon'],
    variants: [],
    specs: {cs: {'Typ': 'karbonový pár kol'}, en: {'Type': 'carbon wheelset'}},
    cs: {
      short: 'Vyzkoušej rozdíl karbonových kol na vlastním kole.',
      desc: 'Zapletená karbonová kola k otestování na tvém vlastním kole. Poradíme s výběrem a kola ti připravíme a namontujeme.',
      fit: ['Silnice a triatlon', 'Jezdci, kteří zvažují upgrade kol'],
    },
    en: {
      short: 'Feel the difference of carbon wheels on your own bike.',
      desc: 'Carbon wheelsets to test on your own bike. We help you choose, prepare the wheels and fit them for you.',
      fit: ['Road and triathlon', 'Riders considering a wheel upgrade'],
    },
    price: {day: 400, week: 1500}, deposit: 10000, maxDays: 14,
    demo: true,
  },
];
