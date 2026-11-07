
/* =========================================================
   Rechenlogik
   ========================================================= */
function interpPath(path, year) {
  const pts = Object.entries(path || {}).map(([y, v]) => [+y, +v]).filter(a => isFinite(a[0]) && isFinite(a[1])).sort((a, b) => a[0] - b[0]);
  if (!pts.length) return 0;
  if (year <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (year <= pts[i][0]) { const [y0, v0] = pts[i - 1], [y1, v1] = pts[i]; return v0 + (v1 - v0) * (year - y0) / (y1 - y0); }
  return pts[pts.length - 1][1];
}
const co2Share = (fuel, co2Price) => co2Price * (fuel === 'oil' ? 2.66 : 0.2) / 1000 * 1.19; // €/l bzw. €/kWh
function grossOf(p) {
  const o = p.offer;
  if (p.type === 'pvwp') return isNum(o.total) && o.total > 0 ? o.total : nz(o.grossWP) + nz(o.grossPV);
  return nz(o.gross);
}
function standOf(p) { return S.funding.stands.find(s => s.id === p.fund.stand) || currentStand(p.offer.date || isoToday()); }
function heatingAge(p) { const y = p.heating.year; return isNum(y) && y > 1900 ? yearOf(p.offer.date) - y : null; }
function speedAuto(p) {
  const h = p.heating, age = heatingAge(p);
  if (h.fuel === 'oil') return { on: true, why: 'Ölheizung wird ersetzt' };
  if (h.gasType === 'etage') return { on: true, why: 'Gasetagenheizung wird ersetzt' };
  if (age === null) return { on: false, why: 'kein Bonus – Baujahr der Gasheizung fehlt' };
  return age >= 20 ? { on: true, why: `Gas-Zentralheizung ist ${age} Jahre alt (ab 20 Jahren)` } : { on: false, why: `kein Bonus – Gas-Zentralheizung ist erst ${age} Jahre alt (ab 20 Jahren)` };
}
/* Wertschöpfungsbonus: Wärmepumpe aus EU-Produktion – automatisch nach Hersteller, im Projekt änderbar */
const EU_MAKERS = /\b(wolf|viessmann|vaillant|bosch|buderus|junkers|stiebel|tecalor|nibe|alpha[\s-]?innotec|novelan|waterkotte|ochsner|weishaupt|br(?:ö|oe)tje|remeha|de\s?dietrich|kermi|dimplex|idm|lambda|heliotherm|hoval|thermia|ctc|elco|hautec|m-tec|windhager|fr(?:ö|oe)ling|hargassner|zewotherm|ait)\b/i;
const euMaker = p => { const m = EU_MAKERS.exec(String(p.hp.model || '') + ' ' + String(p.hp.warranty || '')); return m ? m[1].replace(/^./, c => c.toUpperCase()) : ''; };
const euOf = p => { const f = p.fund || {}; return f.euMode === 'yes' || (f.euMode !== 'no' && (!!f.eu || !!euMaker(p))); };
function fundingOf(p) {
  const out = { amount: 0, rate: 0, parts: [], eligible: 0, cap: 0, base: 0, stand: null, speedOn: false, capped: false };
  if (!hasWP(p)) return out;
  const st = standOf(p), f = p.fund; out.stand = st;
  const units = Math.max(1, Math.round(nz(f.units, 1)));
  out.cap = st.first + Math.min(Math.max(units - 1, 0), 5) * st.unit2 + Math.max(units - 6, 0) * st.unit7;
  out.eligible = isNum(f.eligible) && f.eligible > 0 ? f.eligible : (p.type === 'pvwp' ? nz(p.offer.grossWP) : grossOf(p));
  out.base = Math.min(out.eligible, out.cap);
  const parts = [['Grundförderung', st.base]];
  if (euOf(p) && st.eu > 0) parts.push(['Wertschöpfungsbonus (EU-Wärmepumpe)', st.eu]);
  out.speedOn = f.speed === null || f.speed === undefined ? speedAuto(p).on : !!f.speed;
  if (out.speedOn && st.speed > 0) parts.push(['Klimageschwindigkeitsbonus', st.speed]);
  const inc = { '50': st.inc50, '40': st.inc40, '30': st.inc30 }[f.income];
  if (inc) parts.push([`Einkommensbonus (bis ${f.income}.000 € zVE)`, inc]);
  if (st.eff > 0) parts.push(['Effizienzbonus', st.eff]);
  const sum = parts.reduce((a, b) => a + b[1], 0), max = f.income === '30' ? st.max30 : st.max;
  out.rate = Math.min(sum, max); out.capped = sum > max; out.max = max; out.parts = parts;
  out.amount = out.base * out.rate / 100;
  return out;
}

/* Monate (0 = Januar), in denen der Heizstab übernimmt und die Wärmepumpe pausiert */
const rodSpan = R => ({ 3: [5, 6, 7], 4: [4, 5, 6, 7], 5: [4, 5, 6, 7, 8], 6: [4, 5, 6, 7, 8, 9] }[R.rodMonths] || [4, 5, 6, 7, 8]);
const rodPause = (R, month) => !!R.rod && rodSpan(R).includes(month - 1);
function rodPauseText(R) { const s = rodSpan(R); return `Von ${MONTH_NAMES[s[0]]} bis ${MONTH_NAMES[s[s.length - 1]]} macht Ihre Wärmepumpe Sommerpause: Der Heizstab${R.rodName ? ` (${R.rodName})` : ''} erwärmt das Warmwasser mit überschüssigem Solarstrom. Das schont die Wärmepumpe und verlängert ihre Lebensdauer.`; }
function compute(p, scen) {
  scen = scen || p.scenario || 'real';
  const c = S.calc, opt = scen === 'opt';
  const P = opt ? { ...c, ...S.optimistic } : c;
  const W = hasWP(p), V = hasPV(p);
  const R = { W, V, scen, label: opt ? S.optimistic.label : 'Realistisch', startYear: yearOf(p.offer.date), N: Math.max(5, Math.round(nz(c.years, 20))) };
  const h = p.heating, hp = p.hp;
  // Investition
  R.gross = grossOf(p);
  R.fund = fundingOf(p);
  R.funding = R.fund.amount;
  R.other = nz(p.fund.other);
  R.discount = p.discount.on ? nz(p.discount.amount) : 0;
  R.net = R.gross - R.funding - R.other - R.discount;
  R.sowieso = W && h.replace ? (isNum(h.replaceCost) && h.replaceCost > 0 ? h.replaceCost : (h.fuel === 'oil' ? c.replaceOil : c.replaceGas)) : 0;
  R.invest = R.net - R.sowieso;
  // Heizung
  R.jaz = isNum(hp.jaz) && hp.jaz > 0 ? hp.jaz : c.jaz;
  if (W) {
    const oil = h.fuel === 'oil';
    R.fuel = h.fuel; R.cons = nz(h.cons); R.price = nz(h.price, oil ? c.oilPrice : c.gasPrice);
    R.endEnergy = oil ? R.cons * 10 : R.cons;
    R.heat = isNum(hp.heat) && hp.heat > 0 ? hp.heat : R.endEnergy * nz(h.eff, 85) / 100;
    R.hpPower = isNum(hp.power) && hp.power > 0 ? hp.power : (R.jaz ? R.heat / R.jaz : 0);
    R.tariffOn = !!hp.tariffOn; R.tariff = R.tariffOn ? nz(hp.tariff, c.hpTariff) : nz(p.hh.price, c.hhPrice);
    const hpBase = R.tariffOn ? nz(hp.base) : 0;
    R.costOld1 = R.cons * R.price + nz(h.base) + nz(h.maint);
    R.costNew1 = R.hpPower * R.tariff + hpBase - nz(hp.p14a) + nz(hp.maint);
    R.co2Old = R.endEnergy * (oil ? c.co2Oil : c.co2Gas);
    R.co2New = R.hpPower * c.co2El;
  } else { R.hpPower = 0; R.costOld1 = 0; R.costNew1 = 0; R.co2Old = 0; R.co2New = 0; R.heat = 0; R.endEnergy = 0; }
  // PV
  R.hhCons = nz(p.hh.cons); R.hhPrice = nz(p.hh.price, c.hhPrice);
  const car = p.car || {}; R.car = V && car.on; R.carKWh = R.car ? nz(car.km) * nz(car.cons) / 100 * nz(car.home, 80) / 100 : 0; R.carDay = nz(car.day, 30) / 100;
  if (V) {
    R.kwp = nz(p.pv.kwp); R.bat = nz(p.pv.bat);
    const g = typeof pvgisValid === 'function' ? pvgisValid(p) : null; R.roofFactor = typeof pvFactor === 'function' ? pvFactor(p) : 1;
    R.yieldSrc = g ? 'pvgis' : 'table'; R.yield = g ? g.E : R.kwp * c.pvYield * R.roofFactor;
    const hpLoad = R.hpPower * c.pvHpShare / 100;
    const carLoad = R.carKWh * (0.35 + 0.65 * R.carDay);
    R.load = R.hhCons + hpLoad + carLoad;
    let share = 0;
    if (R.yield > 0 && R.load > 0) {
      const r = R.load / R.yield, s = R.bat / (R.load / 1000);
      const base = Math.min(0.9, 0.32 * Math.pow(r, 0.55));
      const add = (1 - Math.exp(-s / 1.1)) * 0.38 * Math.min(1, Math.pow(r, 0.6));
      share = Math.min(0.95, base + add);
    }
    R.self = Math.min(share * R.yield, 0.9 * R.load);
    R.feed = Math.max(0, R.yield - R.self);
    R.selfShare = R.yield ? R.self / R.yield : 0;
    const hhPart = R.load ? R.hhCons / R.load : 1;
    R.mixPrice = hhPart * R.hhPrice + (1 - hhPart) * (W ? R.tariff : R.hhPrice);
    R.pvBenefit1 = R.self * R.mixPrice + R.feed * c.feedIn / 100;
    R.autarky = (R.hhCons + R.carKWh + R.hpPower) ? Math.min(1, R.self / (R.hhCons + R.carKWh + R.hpPower)) : 0;
    R.carPV = R.load ? R.self * carLoad / R.load : 0;
    R.co2Pv = R.yield * c.co2El;
  } else { R.yield = 0; R.self = 0; R.feed = 0; R.pvBenefit1 = 0; R.autarky = 0; R.co2Pv = 0; R.kwp = 0; R.bat = 0; R.selfShare = 0; R.mixPrice = R.hhPrice; }
  R.rod = W && V && p.rod && p.rod.on;
  if (R.rod) {
    R.rodMonths = clamp(nz(p.rod.months, 5), 3, 6);
    R.rodName = p.rod.name || c.rodName; R.rodKw = nz(p.rod.kw, c.rodKw);
    R.rodHeat = R.heat * nz(c.dhwShare, 18) / 100 * R.rodMonths / 12;  // Warmwasser in den Sommermonaten
    R.rodHpSaved = R.jaz ? R.rodHeat / R.jaz : 0;                     // WP-Strom, der im Sommer entfällt
  }
  R.co2Save = Math.max(0, R.co2Old - R.co2New) + R.co2Pv;
  // Dynamik
  const fi = nz(P.fuelInc) / 100, ei = nz(P.elecInc) / 100, mi = nz(P.maintInc) / 100, zi = nz(P.rate) / 100, deg = nz(c.pvDeg) / 100;
  const co2Now = W ? co2Share(h.fuel, interpPath(P.co2Path, R.startYear)) : 0;
  const netTarget = nz(P.gasNet) / 100, netYear = Math.max(R.startYear + 1, nz(P.gasNetYear, 2040));
  R.rows = []; let cum = 0, cumNpv = 0, cumStatic = 0;
  for (let t = 1; t <= R.N; t++) {
    const year = R.startYear + t - 1, ef = Math.pow(1 + ei, t - 1), mf = Math.pow(1 + mi, t - 1), ff = Math.pow(1 + fi, t - 1);
    const row = { t, year };
    if (W) {
      const co2Y = co2Share(h.fuel, interpPath(P.co2Path, year));
      const net = h.fuel === 'gas' ? netTarget * clamp((year - R.startYear) / (netYear - R.startYear), 0, 1) : 0;
      row.fuelPrice = Math.max(0, (R.price - co2Now) * ff + co2Y + net);
      row.co2Part = co2Y; row.netFee = net;
      row.costOld = R.cons * row.fuelPrice + nz(h.base) * ff + nz(h.maint) * mf;
      row.hpPrice = R.tariff * ef;
      row.costNew = R.hpPower * row.hpPrice + (R.tariffOn ? nz(hp.base) : 0) * ef - nz(hp.p14a) + nz(hp.maint) * mf;
    } else { row.costOld = 0; row.costNew = 0; }
    row.hhPrice = R.hhPrice * ef;
    row.pv = V ? (R.self * R.mixPrice * ef + R.feed * c.feedIn / 100) * Math.pow(1 - deg, t - 1) : 0;
    row.saving = row.costOld - row.costNew + row.pv;
    cum += row.saving; row.cum = cum; row.saldo = cum - R.invest;
    cumNpv += row.saving / Math.pow(1 + zi, t); row.saldoNpv = cumNpv - R.invest;
    cumStatic += t === 1 ? row.saving : R.rows[0].saving; row.saldoStatic = cumStatic - R.invest;
    const hh = (R.hhCons + R.carKWh) * row.hhPrice;
    row.monthOld = (row.costOld + (V ? hh : 0)) / 12;
    row.monthNew = (row.costNew + (V ? hh - row.pv : 0)) / 12;
    row.monthSave = row.monthOld - row.monthNew;
    R.rows.push(row);
  }
  R.saving1 = R.rows[0].saving;
  R.total = cum; R.avg = cum / R.N; R.surplus = cum - R.invest; R.npvSurplus = cumNpv - R.invest; R.zins = nz(P.rate);
  R.amortStatic = R.invest <= 0 ? 0 : (R.saving1 > 0 ? R.invest / R.saving1 : null);
  R.amortRise = null;
  if (R.invest <= 0) R.amortRise = 0;
  else { let prev = 0; for (const r of R.rows) { if (r.cum >= R.invest) { R.amortRise = r.t - 1 + (R.invest - prev) / (r.cum - prev); break; } prev = r.cum; } }
  R.monthOld1 = R.rows[0].monthOld; R.monthNew1 = R.rows[0].monthNew;
  R.missing = missingOf(p, R);
  if (opt) { const real = compute(p, 'real'); R.real = real; }
  return R;
}
function missingOf(p, R) {
  const m = [];
  if (!(R.gross > 0)) m.push(p.type === 'pvwp' ? 'Bruttopreise der Angebote' : 'Bruttopreis');
  if (R.W) { if (!(p.heating.cons > 0)) m.push('Verbrauch der bisherigen Heizung'); if (!(p.heating.year > 1900)) m.push('Baujahr der Heizung'); }
  if (R.V && !(p.pv.kwp > 0)) m.push('Anlagenleistung (kWp)');
  if (p.type === 'pvwp' && !(p.offer.grossWP > 0) && !(p.fund.eligible > 0)) m.push('WP-Anteil (förderfähige Kosten)');
  return m;
}
function comparisonsOf(R) {
  const base = S.comparisons.basis === 'total' ? R.total : R.surplus;
  return S.comparisons.items.filter(i => i.on && i.price > 0).map(i => ({ ...i, times: base / i.price })).filter(i => i.times >= 1);
}
const amortTxt = v => (v === null ? '> 20' : num(v, 1));

/* ---------- Jahresverlauf: Strombedarf gegenüber Solarstrom ---------- */
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const PV_SHARE = [2.6, 4.4, 7.9, 11.4, 13.2, 13.6, 13.7, 11.9, 8.8, 6.0, 3.3, 2.2];      // Münsterland, typisches Südwestdach
const HEAT_SHARE = [17.5, 15, 12.5, 7.5, 3.5, 0.8, 0.5, 0.5, 2.2, 7, 13.5, 17.5];        // Heizgradtage
const COP_F = [1.15, 1.12, 1.05, 0.97, 0.92, 0.9, 0.9, 0.9, 0.93, 0.98, 1.07, 1.15];     // Winter: mehr Strom je kWh Wärme
const DAY_F = [0.34, 0.38, 0.45, 0.52, 0.58, 0.6, 0.6, 0.58, 0.5, 0.42, 0.36, 0.32];     // Anteil WP-Laufzeit bei Tageslicht
const norm = a => { const s = a.reduce((x, y) => x + y, 0); return a.map(v => v / s); };
function annualProfile(p, R) {
  const pot = !R.V, kwp = pot ? nz(p.pvPot.kwp, S.calc.potKwp) : R.kwp, bat = pot ? nz(p.pvPot.bat, S.calc.potBat) : R.bat;
  const mode = R.W ? 'hp' : 'hh';
  const total = mode === 'hp' ? R.hpPower : R.hhCons;
  const yieldY = pot ? kwp * S.calc.pvYield : R.yield;
  const pvM = norm(PV_SHARE).map(f => f * yieldY);
  const hhM = norm([1.1, 1.02, 1, 0.95, 0.92, 0.9, 0.9, 0.92, 0.95, 1.02, 1.08, 1.14]).map(f => f * R.hhCons);
  let demM;
  let rodM = MONTHS.map(() => 0);
  if (mode === 'hp') {
    const dhw = nz(S.calc.dhwShare, 18) / 100; demM = norm(norm(HEAT_SHARE).map((h, i) => (h * (1 - dhw) + dhw / 12) * COP_F[i])).map(f => f * total);
    if (R.rod) { rodSpan(R).forEach(i => { rodM[i] = R.heat * dhw / 12; demM[i] = demM[i] * 0.04; }); }
  }
  else demM = hhM;
  const bf = Math.min(1, bat / 10);
  const months = MONTHS.map((m, i) => {
    const hhDirect = mode === 'hp' ? Math.min(hhM[i] * 0.4, pvM[i]) : 0;
    const avail = Math.max(0, pvM[i] - hhDirect);
    const dayShare = mode === 'hp' ? DAY_F[i] : 0.42;
    const cap = demM[i] * Math.min(0.95, dayShare + 0.3 * bf);
    const covered = Math.min(cap, avail * (0.55 + 0.25 * bf), demM[i]);
    return { m, demand: demM[i], pv: pvM[i], covered, rod: rodM[i] };
  });
  const covered = months.reduce((a, x) => a + x.covered, 0);
  const price = mode === 'hp' ? (R.tariff || S.calc.hpTariff) : R.hhPrice;
  const totalM = months.reduce((a, x) => a + x.demand, 0);
  return { mode, pot, kwp, bat, yieldY, total: totalM, months, covered, rodTotal: rodM.reduce((a, b) => a + b, 0), rod: R.rod, share: totalM ? covered / totalM : 0, value: covered * (price - S.calc.feedIn / 100) };
}
