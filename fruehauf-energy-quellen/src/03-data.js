
/* ---------- Standardwerte ---------- */
const FUND_NOTE = 'Grundförderung 15 % und Wertschöpfungsbonus für EU-Wärmepumpen laut Richtlinie ab Q1 2027 – Details der KfW stehen noch aus.';
const DEFAULT_STANDS = [
  ['2026-07-21', '2027-01-31', 30, 0, 16, 28000], ['2027-02-01', '2027-07-31', 15, 15, 12, 27250], ['2027-08-01', '2028-01-31', 15, 15, 8, 26500],
  ['2028-02-01', '2028-07-31', 15, 15, 4, 25750], ['2028-08-01', '2029-01-31', 15, 15, 0, 25000], ['2029-02-01', '2029-07-31', 15, 15, 0, 24250],
  ['2029-08-01', '2030-01-31', 15, 15, 0, 23500], ['2030-02-01', '2030-07-31', 15, 15, 0, 22750], ['2030-08-01', '', 15, 15, 0, 22000]
].map(([from, to, base, eu, speed, first]) => ({ id: 'st-' + from, from, to, base, eu, speed, eff: 0, first, unit2: 15000, unit7: 8000, inc50: 10, inc40: 30, inc30: 40, max: 70, max30: 80, note: from >= '2027' ? FUND_NOTE : '', builtin: true }));

const DEFAULT_PRICES = {
  strom: { label: 'Strom', unit: 'ct/kWh', current: 37.0, asOf: '2026-10', source: 'BDEW Strompreisanalyse (Haushalte, Jahresdurchschnitt)',
    years: { 2006: 19.46, 2007: 20.64, 2008: 21.65, 2009: 23.21, 2010: 23.69, 2011: 25.23, 2012: 25.89, 2013: 28.84, 2014: 29.14, 2015: 28.70, 2016: 28.80, 2017: 29.28, 2018: 29.47, 2019: 30.46, 2020: 31.81, 2021: 32.16, 2022: 37.91, 2023: 45.73, 2024: 40.92, 2025: 39.3, 2026: 37.0 },
    forecast: { 2030: 35.6, 2035: 33.9, 2040: 32.7 }, text: 'Strom wird zunehmend heimisch und erneuerbar erzeugt. Laut Umweltbundesamt bleibt der Preis real stabil bis leicht sinkend – mit eigenem Solarstrom machen Sie sich zusätzlich unabhängig.' },
  gas: { label: 'Erdgas', unit: 'ct/kWh', current: 11.93, asOf: '2026-10', source: 'BDEW Gaspreisanalyse, Destatis',
    years: { 2008: 7.02, 2009: 6.19, 2010: 6.2, 2014: 6.52, 2015: 6.48, 2016: 5.73, 2019: 5.95, 2020: 6.09, 2021: 6.70, 2022: 16.47, 2023: 11.88, 2024: 12.18, 2025: 12.20, 2026: 11.93 },
    forecast: { 2030: 11.7, 2035: 13.1, 2040: 14.5 }, text: 'Steigender CO₂-Preis und höhere Netzentgelte bei sinkender Kundenzahl machen Erdgas langfristig teurer.' },
  oel: { label: 'Heizöl', unit: '€/100 l', current: 169, asOf: '2026-10-16', currentNote: 'bei 3.000 l Abnahme', source: 'Destatis, Tecson Heizölpreise',
    years: { 2006: 58, 2007: 56, 2008: 79, 2009: 72, 2010: 68, 2011: 82, 2012: 88, 2013: 84, 2014: 78, 2015: 63, 2016: 52, 2017: 57, 2018: 69, 2019: 67, 2020: 52, 2021: 73, 2022: 132.4, 2023: 105.5, 2024: 101.7, 2025: 91.6 },
    forecast: { 2030: 110, 2035: 120, 2040: 130 }, text: 'Heizöl schwankt stark mit Weltmarkt und Krisen. Der CO₂-Preis verteuert jeden Liter zusätzlich – Tendenz steigend.' },
  co2: { 2021: 25, 2022: 30, 2023: 30, 2024: 45, 2025: 55, 2026: 65, 2027: 65 },
  sources: 'Strom: BDEW Strompreisanalyse; Prognose Umweltbundesamt (real). Erdgas: BDEW Gaspreisanalyse, Destatis. Heizöl: Destatis, Tecson (Stand 16.10.2026, 3.000 l). CO₂-Preis: Brennstoffemissionshandelsgesetz (BEHG). Netzentgelte: Fraunhofer IFAM.',
  showPages: true
};

const DEFAULT_SETTINGS = {
  company: { name: 'Frühauf Energy', ceo: '', register: '', street: '', zip: '', city: '', phone: '', email: '', web: '', taxNo: '', vatId: '', bank: '', iban: '', bic: '', logoFile: '', logoUrl: '', advisors: [], defaultAdvisor: '' },
  design: {
    v: 3, mode: 'dark', pdfTheme: 'mixed',
    primary: '#0E7C66', secondary: '#F5A524', accent: '#1E4C86', old: '#D9482B', ink: '#0F2A3D', bg: '#F5F7FA', night: '#0A0E13',
    fontBody: 'Geist', fontHead: 'Instrument Serif', fontMono: 'Geist Mono', headWeight: 400, radius: 14, buttons: 'round', buttonStyle: 'light', highlight: 'solid',
    moduleColor: 'black', hpIllu: 'scene', pvIllu: 'scene', houseStyle: 'classic', houseLight: 'auto', houseUserChoice: false, pdfColors: 'cover',
    coverInfo: { badge: true, title: true, subtitle: true, customer: true, address: true, offer: true, created: true, advisor: true, figures: true, contact: true, note: '' },
    chapter: 'sun', chapterSun: '', chapterLine: '', pdfHeader: 'band', sigBox: { mode: 'auto', color: '#ffffff', alpha: 88, shape: 'round' }, hdrFrom: '', hdrTo: '', hdrHeight: 60, coverStyle: 'illu',
    mark: { style: 'sun', shape: 'rounded', bg: '', fg: '', line: '', text: '', file: '' },
    cover: { use: false, file: '', showCustomer: true, whiteBox: true, dark: true, pos: 62, layout: 'block', blocks: { head: { x: 0, y: 14, w: 100 }, cust: { x: 0, y: 72, w: 100 }, contact: { x: 0, y: 96, w: 70 } } },
    coverLogo: { source: 'company', file: '', x: 6, y: 6, size: 14, whiteBg: true }
  },
  discount: { amount: 500, days: 14, text: 'Sonderrabatt bei Auftragserteilung bis zum {datum}', signPage: true,
    orderText: 'Hiermit beauftrage ich {firma} gemäß Angebot {angebot} vom {angebotsdatum} zum Gesamtpreis von {preis} brutto{rabatt}.' },
  funding: { stands: clone(DEFAULT_STANDS) },
  prices: clone(DEFAULT_PRICES),
  comparisons: { basis: 'surplus', items: [
    { id: 'c1', on: true, icon: 'plane', label: 'Familienurlaub', price: 4500 },
    { id: 'c2', on: true, icon: 'car', label: 'Neues Auto', price: 35000 },
    { id: 'c3', on: true, icon: 'spa', label: 'Wellness-Wochenende', price: 900 },
    { id: 'c4', on: true, icon: 'bike', label: 'E-Bike', price: 3500 }] },
  calc: {
    fuelInc: 3, elecInc: 2.5, maintInc: 2, rate: 2, years: 20,
    co2Path: { 2026: 65, 2027: 65, 2030: 100, 2035: 150, 2040: 190, 2045: 220 },
    gasNet: 0, gasNetYear: 2040, jaz: 3.4,
    oilPrice: 1.05, gasPrice: 0.12, hpTariff: 0.27, hhPrice: 0.34, hhCons: 4000,
    efficiency: 85, hpBase: 120, hpMaint: 180, oilMaint: 380, gasMaint: 280, oilBase: 0, gasBase: 180,
    pvYield: 950, feedIn: 7.7, potKwp: 10, potBat: 0, rodName: 'my-PV Heizstab', rodKw: 3, dhwShare: 18, pvDeg: 0.5, pvHpShare: 30,
    co2Oil: 0.31, co2Gas: 0.24, co2El: 0.38,
    replaceGas: 12000, replaceOil: 15000,
    hideFinanceAbove: 15, showAssump2: false, storageNote: true,
    disclaimer: 'Diese Berechnung ist eine unverbindliche Prognose auf Basis der angegebenen Verbrauchsdaten, aktueller Energiepreise und der zum Erstellungszeitpunkt gültigen Förderbedingungen. Tatsächliche Erträge, Verbräuche, Preisentwicklungen und Förderbewilligungen können abweichen. Maßgeblich für die Förderung ist ausschließlich die Zusage des Fördergebers.'
  },
  doc: { order: null, salesOrder: null, defaults: {}, texts: {}, pdfAsk: 'ask', salesFont: 'Inter' },
  sales: {
    trustOn: true,
    trust: [
      { id: 't1', on: true, icon: 'home', title: 'Alles aus einer Hand', text: 'Planung, Montage, Förderunterlagen und Inbetriebnahme durch unser eigenes Team.' },
      { id: 't2', on: true, icon: 'sun', title: 'Aus der Region', text: 'Kurze Wege im Raum Münster und Osnabrück – auch nach der Montage sind wir für Sie da.' },
      { id: 't3', on: true, icon: 'gift', title: 'Förderservice inklusive', text: 'Wir stellen die KfW-Unterlagen bereit und begleiten Sie bis zur Auszahlung.' },
      { id: 't4', on: true, icon: 'users', title: 'Ein fester Ansprechpartner', text: 'Ihr Berater begleitet Sie vom ersten Gespräch bis zur Fertigstellung.' }
    ],
    ctaTitle: 'Ihr nächster Schritt',
    ctaText: 'Sprechen Sie uns an – wir beantworten Ihre Fragen und planen gemeinsam den Start Ihres Projekts.'
  },
  roadmap: {
    start: { title: 'Start', text: 'Mit Ihrer Unterschrift geht es los. Wir bestätigen den Auftrag und stimmen die Termine mit Ihnen ab.' },
    finish: { title: 'Finish', text: 'Ihr neues Energiesystem läuft. Wir bleiben Ihr Ansprechpartner für Wartung und Service.' },
    pv: [
      { id: 'r1', title: 'Vorabanfrage', text: 'Wir stellen die Anfrage beim Netzbetreiber und klären den Netzanschluss.', dur: 'ca. 2–6 Wochen' },
      { id: 'r2', title: 'DC-Montage', text: 'Unterkonstruktion und Solarmodule werden auf Ihrem Dach montiert.', dur: '1–2 Tage' },
      { id: 'r3', title: 'AC-Montage', text: 'Wechselrichter, Speicher und Zählerschrank werden angeschlossen.', dur: '1 Tag' },
      { id: 'r4', title: 'Fertigmeldung der Anlage', text: 'Wir melden die Anlage beim Netzbetreiber und im Marktstammdatenregister fertig.', dur: '' }
    ],
    wp: [
      { id: 'w1', title: 'Bereitstellung der KfW-Unterlagen', text: 'Sie erhalten von uns die Bestätigung zum Antrag und stellen den Förderantrag – vor Beginn der Arbeiten.', dur: '' },
      { id: 'w2', title: 'Ausbau der alten Heizung', text: 'Wir bauen Ihre bisherige Heizung aus und entsorgen sie fachgerecht.', dur: '1 Tag' },
      { id: 'w3', title: 'Bereitstellung Warmwasser', text: 'Spätestens am 2. Tag haben Sie wieder warmes Wasser.', dur: 'spätestens Tag 2' },
      { id: 'w4', title: 'Wiederaufbau des neuen Heizsystems', text: 'Außeneinheit, Inneneinheit und Speicher werden installiert und in Betrieb genommen.', dur: '3–5 Tage' },
      { id: 'w5', title: 'Hydraulischer Abgleich', text: 'Ihre Heizkörper werden optimal eingestellt – für niedrige Vorlauftemperaturen und eine hohe JAZ.', dur: '' },
      { id: 'w6', title: 'Fertigstellung der KfW-Unterlagen', text: 'Wir erstellen die Bestätigung nach Durchführung für Ihren Verwendungsnachweis.', dur: '' },
      { id: 'w7', title: 'Förderung erhalten', text: 'Die KfW zahlt Ihren Zuschuss direkt auf Ihr Konto aus.', dur: '' }
    ]
  },
  optimistic: { label: 'Optimistisches Szenario', fuelInc: 5, elecInc: 1.5, maintInc: 3, rate: 0, gasNet: 5, gasNetYear: 2040,
    co2Path: { 2026: 65, 2027: 65, 2030: 150, 2035: 200, 2040: 250, 2045: 275 } }
};

const SAMPLE_PRODUCTS = [
  { id: 'pr1', name: 'Luft-Wasser-Wärmepumpe 9 kW R290', maker: 'Musterhersteller', cat: 'wp', power: 9, jaz: 3.6, weight: 118, dims: '1100 x 1250 x 480 mm', price: 14900, beg: true, img: '', imgUrl: '' },
  { id: 'pr2', name: 'Luft-Wasser-Wärmepumpe 12 kW', maker: 'Musterhersteller', cat: 'wp', power: 12, jaz: 3.4, weight: 142, dims: '1286 x 1300 x 560 mm', price: 17900, beg: true, img: '', imgUrl: '' },
  { id: 'pr3', name: 'Glas-Glas-Modul 440 Wp', maker: 'Musterhersteller', cat: 'mod', power: 440, jaz: null, weight: 24, dims: '1762 x 1134 x 30 mm', price: 180, beg: false, img: '', imgUrl: '' },
  { id: 'pr4', name: 'LFP-Speicher 10 kWh', maker: 'Musterhersteller', cat: 'bat', power: 10, jaz: null, weight: 110, dims: '650 x 1100 x 250 mm', price: 6500, beg: false, img: '', imgUrl: '' },
  { id: 'pr5', name: 'Hybrid-Wechselrichter 10 kW', maker: 'Musterhersteller', cat: 'inv', power: 10, jaz: null, weight: 27, dims: '530 x 460 x 200 mm', price: 2400, beg: false, img: '', imgUrl: '' }
];
const CATS = { wp: ['Wärmepumpe', 'kW'], mod: ['PV-Modul', 'Wp'], bat: ['Speicher', 'kWh'], inv: ['Wechselrichter', 'kW'], misc: ['Sonstiges', ''] };
const TYPES = { wp: 'Wärmepumpe', pv: 'Photovoltaik', pvwp: 'PV + Wärmepumpe' };
const WOLF = { '07': { kw: 7, sw: 52, day: 58, night: 49, spl: 32 }, '10': { kw: 10, sw: 53, day: 60, night: 51, spl: 34 }, '16': { kw: 16, sw: 52, day: 63, night: 57, spl: 39.5 } };

const ICON_CHOICES = [['home', 'Haus'], ['sun', 'Sonne'], ['gift', 'Geschenk'], ['users', 'Personen'], ['leaf', 'Blatt'], ['bolt', 'Blitz'], ['clock', 'Uhr'], ['heart', 'Herz'], ['check', 'Haken'], ['scale', 'Waage'], ['euro', 'Euro'], ['fan', 'Wärmepumpe']];
const THEME_PRESETS = [
  { name: 'Vor Sonnenaufgang', primary: '#0E7C66', secondary: '#F5A524', accent: '#1E4C86', old: '#D9482B', ink: '#0F2A3D', bg: '#F5F7FA', night: '#0A0E13' },
  { name: 'Nachtblau', primary: '#2F6FB5', secondary: '#F2B33D', accent: '#0E7C66', old: '#D9482B', ink: '#0E2235', bg: '#F4F7FB', night: '#080D18' },
  { name: 'Waldrand', primary: '#3F7D3A', secondary: '#E9A23B', accent: '#2B5D7D', old: '#C2401F', ink: '#1C2A1E', bg: '#F6F6F1', night: '#0B0F0C' },
  { name: 'Glut', primary: '#C0532F', secondary: '#F0B03F', accent: '#2F4A63', old: '#9E3418', ink: '#2A1E1A', bg: '#F8F5F1', night: '#110D0B' },
  { name: 'Graphit', primary: '#4B5563', secondary: '#F5A524', accent: '#0E7C66', old: '#D9482B', ink: '#111827', bg: '#F5F6F7', night: '#0B0B0C' }
];

/* ---------- Zustand ---------- */
let S = clone(DEFAULT_SETTINGS);
let PRODUCTS = [];
let PROJECTS = [];
let ARCHIVED = []; // archivierte Kunden
const splitArchive = () => { const all = PROJECTS.concat(ARCHIVED); PROJECTS = all.filter(p => !p.archived); ARCHIVED = all.filter(p => p.archived); };
const UI = { route: 'kunden', pid: null, step: 1, settingsTab: 'firma', search: '', resultTab: 'overview', busy: {}, chooseOpen: {}, editProduct: null, standSel: null };

function currentStand(date = isoToday()) {
  const st = S.funding.stands.slice().sort((a, b) => a.from.localeCompare(b.from));
  let cur = st[0];
  for (const s of st) if (s.from <= date) cur = s;
  return cur;
}
function defAdv() { const l = (S.company && S.company.advisors) || []; const me = typeof PERSONAL !== 'undefined' && PERSONAL.profile && PERSONAL.profile.name ? { id: '', name: PERSONAL.profile.name } : null; return me || l.find(a => a.id === S.company.defaultAdvisor) || { id: '', name: '' }; }
function newProject(type) {
  const c = S.calc, today = isoToday();
  return {
    id: uid('p'), type, created: Date.now(), updated: Date.now(), step: 1,
    customer: { salutation: 'Familie', name: '', street: '', zip: '', city: '', email: '', phone: '' },
    offer: { gross: null, grossWP: null, grossPV: null, total: null, number: '', date: today, advisor: defAdv().name, advisorId: defAdv().id, title: 'Individuelle Wirtschaftlichkeits- und Energiekonzept-Berechnung' },
    from: {},
    heating: { fuel: 'gas', gasType: 'central', year: null, cons: null, price: c.gasPrice, maint: c.gasMaint, base: c.gasBase, eff: c.efficiency, replace: false, replaceCost: null },
    hp: { model: '', kw: null, jaz: null, tariffOn: false, tariff: c.hpTariff, heat: null, power: null, dims: '', weight: null, warranty: '', buffer: '', dhw: '', base: c.hpBase, maint: c.hpMaint, sw: 53, swDay: 60, swNight: 51, spl: 34, splDist: 3, p14a: 0 },
    pv: { kwp: null, bat: null, modules: '', modMaker: '', modWarranty: '', batMaker: '', batWarranty: '', invMaker: '', invWarranty: '', roofs: [{ id: 'r1', az: 0, tilt: 35, kwp: null }], pvgis: null },
    pvPot: { kwp: null, bat: null },
    car: { on: false, km: 15000, cons: 18, home: 80, day: 30 },
    status: 'offen', statusDate: today, variants: [], sign: null, signDraft: { place: '' },
    rod: { on: false, name: '', kw: null, months: 5 },
    hh: { cons: c.hhCons, price: c.hhPrice },
    fund: { stand: currentStand(today).id, eu: false, euMode: 'auto', speed: null, income: 'none', units: 1, self: '1', eligible: null, other: 0 },
    discount: { on: true, amount: S.discount.amount, until: addDays(today, S.discount.days) },
    scenario: 'real',
    components: [],
    docs: [],
    rec: {},
    pages: {},
    finance: { on: false, amount: null, rate: null, years: null },
    docOpts: { layout: 'full' }
  };
}
const hasWP = p => p.type !== 'pv';
const hasPV = p => p.type !== 'wp';
const findProject = id => PROJECTS.find(p => p.id === id);
const curProject = () => findProject(UI.pid);

/* ---------- Speichern ---------- */
const saveSettingsNow = () => DB.put('kv', clone(S), 'settings');
const saveProductsNow = () => DB.put('kv', clone(PRODUCTS), 'products');
let saveSettings = debounce(saveSettingsNow, 250);
let saveProducts = debounce(saveProductsNow, 250);
const pendingProjects = new Set();
const flushProjects = debounce(() => { for (const id of pendingProjects) { const p = findProject(id); if (p) DB.put('projects', clone(p)); } pendingProjects.clear(); }, 250);
function saveProject(p) { p.updated = Date.now(); pendingProjects.add(p.id); flushProjects(); }

async function loadAll() {
  await DB.open();
  const st = await DB.get('kv', 'settings');
  const pr = await DB.get('kv', 'products');
  PROJECTS = (await DB.all('projects')) || [];
  if (!st && !PROJECTS.length) await migrateLegacy();
  const st2 = st || (await DB.get('kv', 'settings'));
  if (st2) {
    S = deepMerge(clone(DEFAULT_SETTINGS), st2);
    if (!st2.design || st2.design.v !== 3) { // neue Designsprache: Stil zurücksetzen, Farben, Logos und Deckblatt behalten
      const keep = { mark: S.design.mark, primary: S.design.primary, secondary: S.design.secondary, cover: S.design.cover, coverLogo: S.design.coverLogo, coverStyle: st2.design && st2.design.cover && st2.design.cover.use ? 'image' : 'illu' };
      S.design = { ...clone(DEFAULT_SETTINGS.design), ...keep };
    }
  }
  const pr2 = pr || (await DB.get('kv', 'products'));
  PRODUCTS = Array.isArray(pr2) ? pr2 : clone(SAMPLE_PRODUCTS);
  if (!pr2) saveProductsNow();
  if (!st2) saveSettingsNow();
  if (!PROJECTS.length) PROJECTS = (await DB.all('projects')) || [];
  PROJECTS = PROJECTS.map(p => deepMerge(newProject(p.type || 'wp'), p)); ARCHIVED = []; splitArchive();
  await loadFiles([S.company.logoFile, S.design.splash && S.design.splash.file, S.design.cover.file, S.design.coverLogo.file, S.design.mark && S.design.mark.file, ...(S.company.advisors || []).map(a => a.photo)]);
}
async function migrateLegacy() {
  let raw; try { raw = localStorage.getItem('fruehauf-energy-wirtschaftlichkeit-v1'); } catch (e) { return; }
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.settings) await DB.put('kv', deepMerge(clone(DEFAULT_SETTINGS), d.settings), 'settings');
    if (Array.isArray(d.products)) await DB.put('kv', d.products, 'products');
    const projs = Array.isArray(d) ? d : (d.projects || []);
    for (const p of projs) if (p && typeof p === 'object') await DB.put('projects', deepMerge(newProject(p.type || 'wp'), { ...p, id: p.id || uid('p') }));
    toast('Ältere Daten wurden übernommen.');
  } catch (e) { console.warn('Migration fehlgeschlagen', e); }
}

/* ---------- Datensicherung ---------- */
async function exportBackup() {
  toast('Sicherung wird erstellt …', 'info');
  const files = await DB.all('files');
  const out = { app: 'fruehauf-energy', version: 1, exported: new Date().toISOString(), settings: S, products: PRODUCTS, projects: PROJECTS.concat(ARCHIVED), files: [] };
  for (const f of files) out.files.push({ id: f.id, name: f.name || '', type: f.type || '', data: await blobToDataURL(f.blob) });
  const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
  if (await shareOrDownload(blob, `Frühauf-Energy-Sicherung_${isoToday()}.json`)) { PERSONAL.lastBackup = Date.now(); savePersonal(); toast('Sicherung erstellt.'); render(); }
}
async function importBackup(file) {
  let d; try { d = JSON.parse(await file.text()); } catch (e) { return toast('Die Datei ist keine gültige Sicherung.', 'err'); }
  if (!d || d.app !== 'fruehauf-energy') return toast('Die Datei ist keine Sicherung dieser App.', 'err');
  if (!(await confirmDlg('Sicherung einspielen?', UI.admin ? 'Alle aktuellen Daten werden durch die Sicherung ersetzt.' : 'Kunden, Berechnungen und Produkte werden durch die Sicherung ersetzt. Die Firmen-Einstellungen bleiben unverändert (dafür ist das Admin-Passwort nötig).', 'Einspielen', false))) return;
  const keepS = UI.admin ? null : clone(S);
  await Promise.all(['kv', 'projects', 'files'].map(s => DB.clear(s)));
  for (const k in FILES) { URL.revokeObjectURL(FILES[k].url); delete FILES[k]; }
  for (const f of d.files || []) await DB.put('files', { id: f.id, name: f.name, type: f.type, blob: await dataURLToBlob(f.data) });
  S = keepS || deepMerge(clone(DEFAULT_SETTINGS), d.settings || {});
  PRODUCTS = d.products || [];
  PROJECTS = (d.projects || []).map(p => deepMerge(newProject(p.type || 'wp'), p)); ARCHIVED = [];
  await saveSettingsNow(); await saveProductsNow();
  for (const p of PROJECTS) await DB.put('projects', clone(p));
  splitArchive();
  await loadFiles([S.company.logoFile, S.design.cover.file, S.design.coverLogo.file]);
  applyTheme(); toast('Sicherung eingespielt.'); go('kunden');
}
async function wipeAll() {
  if (!UI.admin) return toast('Nur im Admin-Bereich möglich.', 'err');
  if (!(await confirmDlg('Alles löschen?', 'Alle Berechnungen, Produkte, Einstellungen und Dateien werden unwiderruflich gelöscht.', 'Alles löschen'))) return;
  await Promise.all(['kv', 'projects', 'files'].map(s => DB.clear(s)));
  try { localStorage.removeItem('fruehauf-energy-wirtschaftlichkeit-v1'); } catch (e) {}
  S = clone(DEFAULT_SETTINGS); PRODUCTS = clone(SAMPLE_PRODUCTS); PROJECTS = [];
  await saveSettingsNow(); await saveProductsNow(); applyTheme(); toast('Alle Daten gelöscht.'); go('kunden');
}
