
/* =========================================================
   Zeiten und Regeln
   Ein Tag besteht aus Abschnitten je Baustelle (von–bis) und gestempelten Pausen.
   Lücken zwischen zwei Abschnitten (Gehen → wieder Kommen) zählen als Pause.
   Pausenregel: Es wird immer mindestens die Mindestpause (30 Min.) abgezogen;
   ist die Pause länger, wird die tatsächliche Pause abgezogen.
   ========================================================= */
const toMin = t => { if (!t) return null; const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const nowHM = () => { const d = tNow(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const nowHMS = () => { const d = tNow(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; };
const hm = m => { if (m === null || m === undefined || isNaN(m)) return '–'; const neg = m < 0; m = Math.abs(Math.round(m)); return `${neg ? '−' : ''}${Math.floor(m / 60)}:${pad2(m % 60)}`; };
const hmPlus = m => (Math.round(m) > 0 ? '+' + hm(m) : hm(m));
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const mondayOf = iso => addDays(iso, -((new Date(iso + 'T12:00').getDay() + 6) % 7));
function isoWeek(iso) { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const y = d.getFullYear(), w1 = new Date(y, 0, 4, 12); return { w: 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7), y }; }
const weekOf = mon => [0, 1, 2, 3, 4, 5, 6].map(i => addDays(mon, i));
const monthOf = iso => { const [y, m] = iso.split('-').map(Number), n = new Date(y, m, 0).getDate(); return Array.from({ length: n }, (_, i) => `${y}-${pad2(m)}-${pad2(i + 1)}`); };
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const span = (a, b) => { const x = toMin(a), y = toMin(b); if (x === null || y === null) return 0; let m = y - x; if (m < 0) m += 1440; return m; };
const overlap = (a1, b1, a2, b2) => { const s = Math.max(toMin(a1), toMin(a2)), e = Math.min(toMin(b1), toMin(b2)); return Math.max(0, e - s); };

const DAY_TYPES = [['work', 'Arbeit', 'clock'], ['urlaub', 'Urlaub', 'palm'], ['krank', 'Krank', 'heartp'], ['feiertag', 'Feiertag', 'cal'], ['frei', 'Frei / Ausgleich', 'sun']];
const typeName = t => (DAY_TYPES.find(x => x[0] === t) || DAY_TYPES[0])[1];
let FIRMA = { betriebsurlaub: [] };   // aus firma.json (für alle)
const buList = () => (FIRMA.betriebsurlaub || []).map(x => ({ ...x, firm: true })).concat((S.bu || []).map(x => ({ ...x, firm: false })));
const betriebOf = iso => buList().find(x => x.von && x.bis && iso >= x.von && iso <= x.bis) || null;
let DAYS = {};   // iso → { iso, type, segs:[{site,von,bis}], pauses:[{von,bis}], note, geo:[] }
const dayOf = iso => {
  if (DAYS[iso]) return DAYS[iso];
  const b = isWorkday(iso) && betriebOf(iso);
  return { iso, type: holiday(iso) ? 'feiertag' : b ? 'urlaub' : 'work', betrieb: b ? b.name || 'Betriebsurlaub' : '', segs: [], pauses: [], note: '', geo: [] };
};
const hasData = d => !!((d.segs || []).length || (d.pauses || []).length || d.note || (DAYS[d.iso] && d.type !== 'work'));
const curSeg = d => { const s = d.segs || []; return s.length && !s[s.length - 1].bis ? s[s.length - 1] : null; };
const openPause = d => (d.pauses || []).find(p => p.von && !p.bis) || null;

/* Mindestpause je Wochentag (Mo–Do 30, Fr 15 Min.) */
const dayPause = iso => { const h = S.hours[new Date(iso + 'T12:00').getDay()]; return h && h.pause !== undefined && h.pause !== '' ? +h.pause : +S.minPause || 0; };
const minPauseFor = (net, iso) => (S.pauseOnlyOver6 && net <= 360 ? 0 : dayPause(iso));
/* Regelarbeitszeit eines Wochentags (ohne Pause) – auch an Feiertagen (werden gutgeschrieben) */
function tplSoll(iso) {
  const h = S.hours[new Date(iso + 'T12:00').getDay()]; if (!h || !h.on || !h.von || !h.bis) return 0;
  const b = span(h.von, h.bis); return Math.max(0, b - minPauseFor(b - dayPause(iso), iso));
}
const isWorkday = iso => tplSoll(iso) > 0 && !holiday(iso);
const sollOf = iso => tplSoll(iso);
/* Wochen-Soll (Summe der Regelzeiten Mo–So, Standard 40:00) */
const weekTarget = () => [1, 2, 3, 4, 5, 6, 7].reduce((s, i) => s + tplSoll(addDays('2026-11-08', i)), 0);
function calcDay(d, now = nowHM()) {
  const iso = d.iso, today = iso === isoToday(), soll = sollOf(iso);
  const r = { soll, start: '', end: '', brutto: 0, pause: 0, abzug: 0, netto: 0, credit: 0, diff: 0, over: 0, open: false, inPause: false, missingEnd: false, sites: [] };
  if (d.type !== 'work') { r.credit = d.type === 'frei' ? 0 : soll; r.diff = r.credit - soll; return r; }
  if (holiday(iso) && !(d.segs || []).length) { r.credit = soll; return r; }
  const segs = (d.segs || []).filter(s => s.von).slice().sort((a, b) => toMin(a.von) - toMin(b.von));
  if (!segs.length) { r.diff = iso < isoToday() ? -soll : 0; return r; }
  const last = segs[segs.length - 1], endOf = s => s.bis || (today ? now : null);
  r.start = segs[0].von; r.open = !last.bis; r.missingEnd = r.open && !today; r.end = last.bis || '';
  const end = endOf(last); r.brutto = end ? span(r.start, end) : 0;
  let gaps = 0; for (let i = 1; i < segs.length; i++) if (segs[i - 1].bis) gaps += span(segs[i - 1].bis, segs[i].von);
  let stamped = 0; const pz = (d.pauses || []).filter(p => p.von).map(p => ({ von: p.von, bis: p.bis || (today && r.open ? now : p.von) }));
  for (const p of pz) stamped += span(p.von, p.bis);
  r.inPause = today && r.open && !!openPause(d);
  r.pause = gaps + stamped;
  r.abzug = r.brutto ? Math.min(r.brutto, Math.max(r.pause, minPauseFor(r.brutto - r.pause, iso))) : 0;
  r.netto = Math.max(0, r.brutto - r.abzug);
  r.diff = r.missingEnd ? 0 : r.netto - soll;
  r.over = r.missingEnd ? 0 : Math.max(0, r.diff);
  /* Stunden je Baustelle: Abschnitt minus Pausen darin, Mindestpausen-Rest anteilig */
  const per = {};
  for (const s of segs) { const e = endOf(s); if (!e) continue; let m = span(s.von, e); for (const p of pz) m -= overlap(s.von, e, p.von, p.bis); const k = s.site || 'Ohne Baustelle'; per[k] = (per[k] || 0) + Math.max(0, m); }
  const tot = Object.values(per).reduce((a, b) => a + b, 0), extra = Math.max(0, tot - r.netto);
  r.sites = Object.entries(per).map(([site, m]) => ({ site, min: Math.round(m - (tot ? extra * m / tot : 0)) }));
  return r;
}
function calcRange(isos) {
  const days = isos.map(iso => { const d = dayOf(iso); return { d, c: calcDay(d) }; });
  const sum = k => days.reduce((s, x) => s + x.c[k], 0), sites = {};
  days.forEach(x => x.c.sites.forEach(s => { sites[s.site] = (sites[s.site] || 0) + s.min; }));
  return { days, netto: sum('netto'), credit: sum('credit'), soll: sum('soll'), diff: sum('diff'), over: sum('over'), pause: sum('pause'), abzug: sum('abzug'), sites, count: t => days.filter(x => x.d.type === t && x.c.soll > 0).length };
}
/* Wochenbilanz: Ist (Arbeit + Gutschriften für Urlaub/Krank/Feiertag) gegen Wochen-Soll; Überstunden nur über dem Soll */
function weekStat(mon) {
  const R = calcRange(weekOf(mon)), target = R.soll || weekTarget(), ist = R.netto + R.credit;
  return { ist, target, rest: Math.max(0, target - ist), over: Math.max(0, ist - target), pct: target ? Math.min(100, ist / target * 100) : 0, R };
}
/* Überstundenkonto: Startwert + Überstunden aller Wochen ab Startdatum (Minusstunden zählen nicht) */
function balance() {
  const b = S.balance || {}, keys = Object.keys(DAYS).sort(); let m = Math.max(0, +b.min || 0);
  if (!keys.length) return m;
  const from = mondayOf(b.from && b.from > keys[0] ? b.from : keys[0]), last = mondayOf(isoToday());
  for (let mon = from; mon <= last; mon = addDays(mon, 7)) m += weekStat(mon).over;
  return m;
}
/* Arbeitstage eines Zeitraums (ohne Wochenende, Feiertage und freie Tage) */
const workDaysIn = (von, bis) => { const l = []; if (!von || !bis || bis < von) return l; for (let i = von; i <= bis; i = addDays(i, 1)) if (isWorkday(i)) l.push(i); return l; };
function vacation(year = tNow().getFullYear()) {
  let taken = 0, planned = 0, betrieb = 0; const today = isoToday();
  for (let iso = `${year}-01-01`; iso <= `${year}-12-31`; iso = addDays(iso, 1)) {
    if (!isWorkday(iso)) continue; const d = dayOf(iso); if (d.type !== 'urlaub') continue;
    const b = !DAYS[iso] && betriebOf(iso); if (b && b.abzug === false) continue; if (b) betrieb++;
    if (iso <= today) taken++; else planned++;
  }
  const total = (+S.vacation.perYear || 0) + (+S.vacation.carry || 0), used = taken + planned; return { taken, planned, betrieb, used, total, left: total - used };
}
async function saveDay(d) { d.updated = Date.now(); DAYS[d.iso] = d; await DB.put('days', clone(d)); }
function rememberSite(name) { const n = (name || '').trim(); if (!n) return; S.sites = [n].concat((S.sites || []).filter(x => x !== n)).slice(0, 40); saveSettings(); }
