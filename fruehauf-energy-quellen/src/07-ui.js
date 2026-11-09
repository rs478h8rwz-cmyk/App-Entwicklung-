
/* =========================================================
   Formular-Bausteine
   ========================================================= */
function scopeOf(b) {
  const i = b.indexOf(':'), sc = b.slice(0, i), rest = b.slice(i + 1);
  if (sc === 'p') return { obj: curProject(), path: rest, kind: 'p' };
  if (sc === 's') return { obj: S, path: rest, kind: 's' };
  if (sc === 'x') { const j = rest.indexOf(':'); return { obj: PRODUCTS.find(x => x.id === rest.slice(0, j)), path: rest.slice(j + 1), kind: 'x' }; }
  if (sc === 'st') { const j = rest.indexOf(':'); return { obj: S.funding.stands.find(x => x.id === rest.slice(0, j)), path: rest.slice(j + 1), kind: 's' }; }
  if (sc === 'adv') { const j = rest.indexOf(':'); return { obj: (S.company.advisors || []).find(x => x.id === rest.slice(0, j)), path: rest.slice(j + 1), kind: 's' }; }
  if (sc === 'tr') { const j = rest.indexOf(':'); return { obj: S.sales.trust.find(x => x.id === rest.slice(0, j)), path: rest.slice(j + 1), kind: 's' }; }
  if (sc === 'rm') { const [lane, id, ...f] = rest.split(':'); return { obj: (S.roadmap[lane] || []).find(x => x.id === id), path: f.join(':'), kind: 's' }; }
  if (sc === 'cmp') { const j = rest.indexOf(':'); return { obj: S.comparisons.items.find(x => x.id === rest.slice(0, j)), path: rest.slice(j + 1), kind: 's' }; }
  return { obj: null, path: rest, kind: sc };
}
const bval = b => { const s = scopeOf(b); return s.obj ? getPath(s.obj, s.path) : undefined; };
function bset(b, v) {
  const s = scopeOf(b); if (!s.obj) return;
  setPath(s.obj, s.path, v);
  if (s.kind === 'p') saveProject(s.obj); else if (s.kind === 'x') saveProducts(); else saveSettings();
}
const isFrom = b => b.startsWith('p:') && curProject() && curProject().from[b.slice(2)];
function inp(b, o = {}) {
  const t = o.t || 's', v = bval(b), empty = v === null || v === undefined || v === '';
  const type = t === 'date' ? 'date' : t === 'email' ? 'email' : t === 'tel' ? 'tel' : 'text';
  const im = t === 'n' ? 'inputmode="decimal"' : t === 'y' ? 'inputmode="numeric"' : '';
  const cls = ['inp', isFrom(b) ? 'inp-from' : '', o.req && empty ? 'inp-req' : '', o.unit ? 'pr-16' : '', o.big ? '!h-14 !text-[22px] font-semibold' : '', o.icls || ''].join(' ');
  const ph = o.ph !== undefined ? o.ph : '';
  return `<div class="relative"><input class="${cls}" type="${type}" ${im} data-b="${esc(b)}" data-t="${t}" value="${esc(inputFmt(v, t))}" placeholder="${esc(ph)}" autocomplete="off" ${o.attrs || ''}>${o.unit ? `<span class="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink4 pointer-events-none">${o.unit}</span>` : ''}</div>`;
}
function field(label, b, o = {}) {
  return `<label class="block ${o.cls || ''}"><span class="lbl flex flex-wrap items-center gap-2">${label}${isFrom(b) ? '<span class="badge bg-p/10 text-p !py-0 !text-[11px]">aus Angebot</span>' : ''}</span>${inp(b, o)}${o.hint ? `<div class="hint ${o.hintCls || ''}">${o.hint}</div>` : ''}</label>`;
}
function area(label, b, rows = 3, o = {}) { return `<label class="block ${o.cls || ''}"><span class="lbl">${label}</span><textarea class="inp" rows="${rows}" data-b="${esc(b)}" data-t="s">${esc(bval(b) || '')}</textarea>${o.hint ? `<div class="hint">${o.hint}</div>` : ''}</label>`; }
function sel(label, b, opts, o = {}) {
  const v = bval(b);
  return `<label class="block ${o.cls || ''}"><span class="lbl flex items-center gap-2">${label}${isFrom(b) ? '<span class="badge bg-p/10 text-p !py-0 !text-[11px]">aus Angebot</span>' : ''}</span><select class="inp appearance-none pr-10" style="background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8D9C' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 16px center" data-b="${esc(b)}" data-t="${o.t || 's'}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${o.hint ? `<div class="hint">${o.hint}</div>` : ''}</label>`;
}
const tgl = (b, on, extra = '') => `<button type="button" class="tgl ${on ? 'on' : ''}" ${b ? `data-tg="${esc(b)}"` : ''} role="switch" aria-checked="${on}" ${extra}></button>`;
function toggleRow(label, b, hint = '', o = {}) {
  const on = o.on !== undefined ? o.on : !!bval(b);
  return `<div class="flex items-start justify-between gap-4 py-3 ${o.cls || ''}"><div><div class="text-[14px] font-semibold text-ink">${label}</div>${hint ? `<div class="hint !mt-0.5">${hint}</div>` : ''}</div>${tgl(o.action ? '' : b, on, o.action ? `data-a="${o.action}" ${o.data || ''}` : '')}</div>`;
}
const seg = (b, opts, o = {}) => { const v = bval(b); return `<div class="seg ${o.cls || ''}">${opts.map(([k, l]) => `<button type="button" class="${String(v) === String(k) ? 'on' : ''}" data-seg="${esc(b)}" data-v="${esc(JSON.stringify(k))}">${l}</button>`).join('')}</div>`; };
const typeBadge = t => t === 'pv' ? '<span class="badge bg-tyel text-yel-ink"><span class="w-1.5 h-1.5 rounded-full bg-s"></span>PV</span>' : t === 'wp' ? '<span class="badge bg-tred text-red-ink"><span class="w-1.5 h-1.5 rounded-full bg-ember"></span>WP</span>' : '<span class="badge bg-p/10 text-pd"><span class="w-1.5 h-1.5 rounded-full bg-p"></span>PV + WP</span>';
const cardHead = (icon, title, sub = '', right = '') => `<div class="flex items-start gap-3 mb-5"><div class="icon-box">${ic(icon, 18)}</div><div class="flex-1 min-w-0"><h3 class="sec-t">${title}</h3>${sub ? `<p class="text-[13px] text-ink3 mt-0.5">${sub}</p>` : ''}</div>${right}</div>`;
const det = (key, title, body, sub = '') => `<details class="mt-4 rounded-[calc(var(--r)-4px)] border border-line bg-field" data-det="${key}" ${UI.open && UI.open[key] ? 'open' : ''}><summary class="flex items-center justify-between px-4 h-12 text-[14px] font-semibold text-ink2">${title}${sub ? `<span class="text-ink4 font-medium ml-2 hidden sm:inline">${sub}</span>` : ''}<span class="chev ml-auto transition text-ink4">${ic('chevD', 18)}</span></summary><div class="px-4 pb-4">${body}</div></details>`;
UI.open = {};

/* =========================================================
   App-Rahmen
   ========================================================= */
function logoMark(size = 40) {
  const url = fileUrl(S.company.logoFile) || S.company.logoUrl;
  if (url) return `<span class="inline-flex items-center ${appDark() ? 'bg-white rounded-lg px-2 py-1' : ''}"><img src="${esc(url)}" alt="" class="${appDark() ? 'max-h-8' : 'max-h-10'} max-w-[140px] object-contain"></span>`;
  return sunMark(size - 4);
}
function shell(inner) {
  if (isStudio() && inner !== '') return studioShell(inner);
  const nav = [['kunden', 'Kunden', 'users'], ['produkte', 'Produkte', 'box'], ['einstellungen', 'Einstellungen', 'gear']];
  const active = UI.route === 'projekt' ? 'kunden' : UI.route;
  const links = cls => nav.map(([k, l, i]) => `<a href="#/${k}" class="navl ${cls} ${active === k ? 'on' : ''}">${ic(i, 17)}${l}</a>`).join('');
  return `<header class="sticky top-0 z-40 border-b border-line" style="background:var(--header);padding-top:env(safe-area-inset-top);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)">
  <div class="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
    <a href="#/kunden" class="flex items-center gap-3 min-w-0">${logoMark()}<div class="min-w-0 leading-tight hidden sm:block"><div class="font-semibold text-[15px] tracking-[-0.01em] truncate">${esc(S.company.name || 'Frühauf Energy')}</div><div class="text-[12px] text-ink3 hidden lg:block">Wirtschaftlichkeitsrechner</div></div></a>
    <nav class="hidden md:flex items-center gap-1 ml-6">${links('')}</nav>
    ${themeButton('ml-auto')}
    <button class="btn-p !h-10 !px-4" data-a="new">${ic('plus', 17)}<span>Neue Berechnung</span></button>
  </div>
  <nav class="md:hidden flex items-center gap-1 px-3 pt-1 pb-3 overflow-x-auto no-scrollbar">${links('!h-9 !px-3 !text-[13px]')}</nav>
</header>
<main class="pb-32">${UI.route !== 'kunden' ? `<div class="max-w-7xl mx-auto px-4 pt-3 -ml-2"><button class="btn-g !h-9 !px-2 text-[14px]" data-a="back">${ic('arrowL', 16)}${UI.route === 'projekt' ? 'Alle Kunden' : 'Zurück zur Übersicht'}</button></div>` : ''}${inner}<footer class="text-center text-[12px] text-ink3 pt-10"><a href="#/einstellungen/recht" class="hover:text-ink">Impressum</a> · <a href="#/einstellungen/recht" class="hover:text-ink">Datenschutz</a> · <a href="#/einstellungen/ansicht" class="hover:text-ink">Version ${typeof WHATS_NEW !== 'undefined' ? WHATS_NEW.version : ''}</a><div class="mt-1 text-[11px]">PLZ- und Ortsdaten: GeoNames (geonames.org), CC BY 4.0</div></footer></main>`;
}
/* Ansicht: Hell ↔ Dunkel */
const curMode = () => (appDark() ? 'dark' : 'light');
const MODE_LABEL = { light: 'Hell', dark: 'Dunkel' };
function themeButton(cls = '') {
  const m = curMode(), next = m === 'light' ? 'dark' : 'light';
  return `<button class="btn-g ${cls} !h-10 !px-2.5 gap-1.5" data-a="theme-toggle" aria-label="Ansicht wechseln, jetzt ${MODE_LABEL[m]}" title="Ansicht: ${MODE_LABEL[m]} – weiter zu ${MODE_LABEL[next]}">${ic(m === 'light' ? 'sun' : 'moon', 18)}<span class="hidden lg:inline text-[13px]">${MODE_LABEL[m]}</span></button>`;
}
function studioShell(inner) {
  const active = UI.route === 'projekt' ? 'kunden' : UI.route;
  const nav = [['kunden', 'Kunden', 'users', PROJECTS.length], ['produkte', 'Produkte', 'box', PRODUCTS.length], ['einstellungen', 'Einstellungen', 'gear', '']];
  const recent = PROJECTS.slice().sort((a, b) => b.updated - a.updated).slice(0, 6);
  const dot = t => `<span class="w-2 h-2 rounded-full shrink-0" style="background:${t === 'pv' ? 'var(--s)' : t === 'wp' ? 'var(--old)' : 'rgb(var(--p-rgb))'};box-shadow:0 0 8px ${t === 'pv' ? 'rgb(var(--s-rgb)/.6)' : t === 'wp' ? 'rgba(217,72,43,.6)' : 'rgb(var(--p-rgb)/.6)'}"></span>`;
  const title = UI.route === 'projekt' ? (curProject() && curProject().customer.name || 'Berechnung') : { kunden: 'Übersicht', produkte: 'Produkte', einstellungen: 'Einstellungen' }[UI.route];
  const tIcon = UI.route === 'produkte' ? 'box' : UI.route === 'einstellungen' ? 'gear' : UI.route === 'projekt' ? 'calc' : 'grid';
  return `<aside class="hidden lg:flex fixed inset-y-0 left-0 w-[268px] flex-col border-r border-line z-40" style="background:var(--side);padding-top:env(safe-area-inset-top)">
    <div class="h-[72px] px-6 flex items-center gap-3"><a href="#/kunden" class="flex items-center gap-3 min-w-0">${logoMark(32)}<span class="font-medium text-[17px] tracking-[-0.01em] truncate">${esc(S.company.name || 'Frühauf Energy')}</span></a></div>
    <div class="px-4"><button class="w-full h-11 rounded-[12px] bg-[#1a1a1c] border border-line flex items-center gap-2.5 px-3 text-ink3 text-[14px] hover:border-line2 transition-colors" data-a="focus-search">${ic('search', 17)}<span>Suchen</span><span class="ml-auto flex gap-1"><span class="kbd">⌘</span><span class="kbd">K</span></span></button></div>
    <div class="mt-6 pt-6 border-t border-line px-4"><div class="mono text-[12px] text-ink3 px-2.5 mb-2">Navigation</div>
      <div class="space-y-1">${nav.map(([k, l, i, n]) => `<a href="#/${k}" class="side-row ${active === k ? 'on' : ''}">${ic(i, 17)}<span>${l}</span>${n !== '' ? `<span class="ml-auto mono text-[12px] text-ink3">${n}</span>` : ''}</a>`).join('')}</div></div>
    <div class="mt-6 pt-6 border-t border-line px-4 min-h-0 flex-1 overflow-y-auto no-scrollbar"><div class="mono text-[12px] text-ink3 px-2.5 mb-2">Zuletzt bearbeitet</div>
      <div class="space-y-1">${recent.length ? recent.map(p => `<a href="#/projekt/${p.id}/${p.step || 1}" class="side-row ${UI.pid === p.id && UI.route === 'projekt' ? 'on' : ''}">${dot(p.type)}<span class="truncate">${esc(p.customer.name || 'Neue Berechnung')}</span><span class="ml-auto mono text-[12px] text-ink3">${{ pv: 'PV', wp: 'WP', pvwp: 'PV+WP' }[p.type]}</span></a>`).join('') : '<div class="px-2.5 text-[13px] text-ink3">Noch keine Berechnungen</div>'}</div></div>
    <div class="p-4 border-t border-line flex items-center gap-2"><button class="btn-p flex-1 !h-10" data-a="new">${ic('plus', 16)}Neue Berechnung</button>${themeButton('!w-10 !px-0 [&>span]:!hidden')}</div>
  </aside>
  <div class="lg:pl-[268px]">
    <div class="lg:hidden">${shellHeaderOnly()}</div>
    <div class="hidden lg:flex h-[72px] items-center gap-3 px-10 border-b border-line text-[16px]"><span class="text-ink3">${ic(tIcon, 19)}</span><span class="font-medium">${esc(title)}</span></div>
    <main class="pb-32">${inner}</main>
  </div>`;
}
function shellHeaderOnly() { return shell('').replace('<main class="pb-32"></main>', ''); }
function newDialog() {
  const opt = (t, icon, title, text) => `<button class="w-full text-left card !shadow-none p-4 flex items-center gap-4 hover:ring-p hover:ring-2 transition" data-a="create" data-type="${t}"><div class="w-12 h-12 rounded-[calc(var(--r)-4px)] grid place-items-center shrink-0" style="background:${t === 'pv' ? 'var(--t-yel)' : t === 'wp' ? 'var(--t-red)' : 'var(--p-light)'};color:${t === 'pv' ? 'var(--yel-ink)' : t === 'wp' ? 'var(--red-ink)' : 'rgb(var(--p-rgb))'}">${icon}</div><div><div class="font-semibold text-[16px]">${title}</div><div class="text-[13px] text-ink3">${text}</div></div><span class="ml-auto text-ink4">${ic('arrowR', 18)}</span></button>`;
  modal(`<h3 class="text-[21px] font-semibold pr-8">Neue Berechnung</h3><p class="text-ink3 text-[14px] mt-1 mb-5">Wofür möchten Sie rechnen?</p>
  <div class="space-y-3">${opt('wp', ic('fan', 24), 'Wärmepumpe', 'Heizungstausch mit BEG-Förderung')}${opt('pv', ic('sun', 24), 'Photovoltaik', 'Solaranlage, optional mit Speicher')}${opt('pvwp', `<span class="flex">${ic('sun', 18)}${ic('fan', 18)}</span>`, 'PV + Wärmepumpe', 'Das Komplettpaket – zwei Angebote möglich')}</div>`);
}

/* =========================================================
   Kunden
   ========================================================= */
function solarModuleObj() {
  let cells = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) cells += `<rect x="${8 + c * 21}" y="${8 + r * 21}" width="19" height="19" rx="2" fill="url(#cellg)"/>`;
  return `<svg viewBox="0 0 142 100" width="150" height="106" style="transform:perspective(500px) rotateY(-18deg) rotateX(14deg) rotate(-8deg);filter:drop-shadow(0 18px 24px rgba(0,0,0,.55))"><defs><linearGradient id="cellg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3a55"/><stop offset=".55" stop-color="#151d2c"/><stop offset="1" stop-color="#0d121b"/></linearGradient><linearGradient id="frameg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a4f"/><stop offset="1" stop-color="#1c1c1e"/></linearGradient><linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="1" y="1" width="140" height="98" rx="5" fill="url(#frameg)"/><rect x="5" y="5" width="132" height="90" rx="3" fill="#0b0f16"/>${cells}<rect x="5" y="5" width="132" height="90" rx="3" fill="url(#gloss)"/></svg>`;
}
/* Angebotsvolumen je Monat: ein Balken pro Monat, gestapelt nach Anlagentyp */
function studioChart(months) {
  const W = 760, H = 300, pl = 52, pr = 12, top = 24, base = 236;
  const types = [['pvwp', S.design.primary], ['pv', S.design.secondary], ['wp', S.design.old]];
  const tot = m => types.reduce((a, [k]) => a + m.vol[k], 0), cnt = m => types.reduce((a, [k]) => a + m.cnt[k], 0);
  const mx = niceMax(Math.max(1, ...months.map(tot)) * 1.12), Y = v => base - (base - top) * v / mx;
  const slot = (W - pl - pr) / months.length, bw = Math.min(64, slot * 0.46);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%"><defs><filter id="sglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  for (let i = 0; i <= 4; i++) { const v = mx * i / 4, y = Y(v); s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.06)"/>` + T(pl - 10, y + 4, v >= 1000 ? num(v / 1000) + 'k' : num(v), { a: 'end', fs: 11, c: '#85858b' }); }
  months.forEach((m, i) => {
    const x = pl + slot * i + (slot - bw) / 2, last = i === months.length - 1, op = last ? 1 : 0.55;
    let y = base; const th = (base - top) * tot(m) / mx;
    s += `<clipPath id="bc${i}"><rect x="${x}" y="${base - th}" width="${bw}" height="${th}" rx="6"/></clipPath><g clip-path="url(#bc${i})" opacity="${op}" ${last ? 'filter="url(#sglow)"' : ''}>`;
    types.forEach(([k, col]) => { const v = m.vol[k]; if (!v) return; const h = (base - top) * v / mx; s += `<rect x="${x}" y="${y - h}" width="${bw}" height="${h + 0.5}" fill="${col}"/>`; y -= h; });
    s += '</g>';
    if (tot(m)) s += T(x + bw / 2, Y(tot(m)) - 8, num(tot(m) / 1000) + 'k', { a: 'middle', fs: 11, c: last ? '#ededed' : '#a1a1a6', fw: 500 });
    s += T(x + bw / 2, base + 22, m.label, { a: 'middle', fs: 12, c: last ? '#ededed' : '#85858b' });
    s += T(x + bw / 2, base + 40, cnt(m) === 1 ? '1 Berechnung' : `${cnt(m)} Berechnungen`, { a: 'middle', fs: 10, c: '#6b6b70' });
  });
  return s + `<line x1="${pl}" x2="${W - pr}" y1="${base}" y2="${base}" stroke="rgba(255,255,255,.14)"/></svg>`;
}
function viewKundenStudio() {
  const q = UI.search.trim().toLowerCase();
  const list = (UI.statusFilter === 'archiv' ? ARCHIVED : q ? PROJECTS.concat(ARCHIVED) : PROJECTS).slice().sort((a, b) => b.updated - a.updated).filter(statusMatch).filter(p => !q || custSearchText(p).includes(q));
  const res = PROJECTS.map(p => ({ p, R: compute(p, 'real') }));
  const now = new Date(), key = d => d.getFullYear() * 12 + d.getMonth(), nowK = key(now);
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ k: key(d), label: d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', ''), vol: { pv: 0, wp: 0, pvwp: 0 }, cnt: { pv: 0, wp: 0, pvwp: 0 } }); }
  res.forEach(({ p, R }) => { const m = months.find(x => x.k === key(new Date(p.created))); if (m) { m.vol[p.type] += nz(R.gross); m.cnt[p.type]++; } });
  const sum = m => m.vol.pv + m.vol.wp + m.vol.pvwp, cur = months[5], prev = months[4];
  const vol = res.reduce((a, x) => a + nz(x.R.gross), 0), am = res.map(x => x.R.amortRise).filter(v => isNum(v) && v > 0), avgAm = am.length ? am.reduce((a, b) => a + b, 0) / am.length : null;
  const fund = res.reduce((a, x) => a + nz(x.R.funding), 0);
  const thisMonth = PROJECTS.filter(p => key(new Date(p.created)) === nowK).length, lastMonth = PROJECTS.filter(p => key(new Date(p.created)) === nowK - 1).length;
  const delta = (a, b, unit = '') => { const d = a - b; return `<span style="color:${d >= 0 ? '#4cc38a' : '#e5484d'}">${d >= 0 ? '+' : '−'}${num(Math.abs(d))}${unit}</span> <span class="text-ink3">vs. Vormonat</span>`; };
  const volChange = sum(prev) ? `<span style="color:${sum(cur) >= sum(prev) ? '#4cc38a' : '#e5484d'}">${num((sum(cur) / sum(prev) - 1) * 100, 1)} % ${sum(cur) >= sum(prev) ? '↑' : '↓'}</span> <span class="text-ink3">vs. ${months[4].label}</span>` : `<span class="text-ink3">${num(thisMonth)} neue Berechnungen diesen Monat</span>`;
  const statCard = (k, v, sub, extra = '') => `<div class="card p-6 relative overflow-hidden min-h-[156px] ${extra ? 'sm:pr-[190px]' : ''}"><div class="text-[14px] text-ink2">${k}</div><div class="text-[38px] font-medium tracking-[-0.02em] mt-2 leading-none num">${v}</div><div class="mono text-[13px] mt-4">${sub}</div>${extra}</div>`;
  return `<div class="max-w-[1400px] mx-auto px-4 sm:px-10 pt-8 lg:pt-10">
    <h1 class="text-[40px] sm:text-[56px] font-medium tracking-[-0.03em] leading-none">Kunden <span class="text-ink3">${now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span></h1>
    <div class="grid lg:grid-cols-[1.35fr_1fr_1fr] gap-4 mt-8">
      ${statCard('Angebotsvolumen', eur(vol), PROJECTS.length ? `<span class="text-ink3">${eur(fund)} Förderung</span>` : '<span class="text-ink3">Noch keine Berechnungen</span>', `<div class="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2">${solarModuleObj()}</div>`)}
      ${statCard('Neue Berechnungen', String(thisMonth).padStart(2, '0'), delta(thisMonth, lastMonth))}
      ${statCard('Ø Amortisation', avgAm ? num(avgAm, 1) + ' J.' : '–', '<span class="text-ink3">mit steigenden Preisen</span>')}
    </div>
    <div class="card p-6 mt-4"><div class="flex flex-wrap items-start justify-between gap-4"><div><div class="text-[14px] text-ink2">Angebotsvolumen im ${now.toLocaleDateString('de-DE', { month: 'long' })}</div><div class="text-[38px] font-medium tracking-[-0.02em] mt-2 leading-none num">${eur(sum(cur))}</div><div class="mono text-[13px] mt-3">${volChange}</div></div>
      <div class="flex gap-4 text-[13px] text-ink2">${[['PV + WP', S.design.primary], ['PV', S.design.secondary], ['WP', S.design.old]].map(([l, c]) => `<span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background:${c};box-shadow:0 0 8px ${c}"></span>${l}</span>`).join('')}</div></div>
      <div class="mt-4">${studioChart(months)}</div><div class="mono text-[12px] text-ink3 mt-1">Summe der Bruttopreise aller in diesem Monat angelegten Berechnungen, aufgeteilt nach Anlagentyp</div></div>
    <div class="mt-8">${backupBanner()}${followUpCard()}</div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6"><h2 class="text-[22px] font-medium tracking-[-0.01em]">Alle Kunden</h2>
      <div class="relative sm:w-[360px]"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3">${ic('search', 17)}</span><input class="inp !pl-10" placeholder="Kunde suchen …" value="${esc(UI.search)}" data-b="u:search" data-t="s" id="cust-search"></div></div>${statusFilterBar()}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 [&>*]:min-w-0" id="cust-list">${list.length ? list.map(customerCard).join('') : `<div class="card p-10 text-center sm:col-span-2 xl:col-span-3 text-ink3">${q ? 'Keine Treffer' : 'Noch keine Berechnungen'}</div>`}</div></div>`;
}
/* Suche: Name, Ort, PLZ, Straße, Telefon, E-Mail, Angebots-Nr. – auch im Archiv */
const custSearchText = p => [p.customer.salutation, p.customer.name, p.customer.street, p.customer.zip, p.customer.city, p.customer.phone, p.customer.email, p.offer.number, p.offer.advisor].join(' ').toLowerCase();
function customerCard(p) {
    const R = compute(p, 'real'), c = p.customer, nd = p.docs.length;
    return `<div class="card p-5 flex flex-col min-w-0 overflow-hidden hover:border-line2 transition-colors cursor-pointer" data-a="open" data-id="${p.id}">
      <div class="flex items-start gap-3"><div class="w-12 h-12 rounded-full grid place-items-center text-white font-semibold shrink-0" style="background:linear-gradient(135deg,var(--p),var(--acc))">${esc(initials(c.name))}</div>
      <div class="min-w-0 flex-1"><div class="font-semibold text-[16px] truncate">${esc(c.name ? (c.salutation && c.salutation !== 'Firma' ? '' : '') + c.name : 'Neuer Kunde')}</div><div class="text-[13px] text-ink3 truncate">${esc([c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Noch keine Anschrift')}</div>
      <div class="flex flex-wrap gap-1.5 mt-2">${typeBadge(p.type)}${statusBadge(p.status)}${p.archived ? '<span class="badge bg-bg text-ink3 border border-line">Archiv</span>' : ''}${nd ? `<span class="badge bg-bg text-ink3 border border-line">${ic('file', 12)} ${nd} ${nd === 1 ? 'Dokument' : 'Dokumente'}</span>` : ''}${p.offer.number ? `<span class="badge bg-bg text-ink3 border border-line">Nr. ${esc(p.offer.number)}</span>` : ''}</div></div></div>
      <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-line text-[12px]"><div><div class="text-ink3 mono text-[11px]">Investition</div><div class="font-semibold text-[14px] text-ink mt-0.5">${R.gross ? eur(R.gross) : '–'}</div></div><div><div class="text-ink3 mono text-[11px]">Ersparnis/Jahr</div><div class="font-semibold text-[14px] text-p mt-0.5">${R.gross || R.saving1 ? eur(R.avg) : '–'}</div></div><div><div class="text-ink3 mono text-[11px]">Stand</div><div class="font-bold text-[13px] text-ink2 mt-0.5">${new Date(p.updated).toLocaleDateString('de-DE')}</div></div></div>
      ${typeof custTodo === 'function' ? custTodo(p) : ''}
      <div class="flex flex-wrap gap-1 mt-3 -mb-1 -mx-2"><button class="btn-g" data-a="dup" data-id="${p.id}">${ic('copy', 15)}Duplizieren</button>${p.archived ? `<button class="btn-g !text-p" data-a="unarchive" data-id="${p.id}">${ic('refresh', 15)}Wiederherstellen</button><button class="btn-g hover:!text-ember2" data-a="del" data-id="${p.id}">${ic('trash', 15)}Löschen</button>` : `<button class="btn-g" data-a="archive" data-id="${p.id}">${ic('db', 15)}Archivieren</button><span class="ml-auto btn-g !text-p">Öffnen ${ic('arrowR', 15)}</span>`}</div>
      ${!p.archived && p.status !== 'unterschrieben' && !(p.sign && p.sign.cust) ? `<button class="btn-s w-full mt-3" data-a="won" data-id="${p.id}">${ic('pen', 16)}Auftrag gewonnen? Jetzt unterschreiben</button>` : ''}</div>`;
  }
function viewKunden() {
  if (isStudio()) return viewKundenStudio();
  const q = UI.search.trim().toLowerCase();
  const list = (UI.statusFilter === 'archiv' ? ARCHIVED : q ? PROJECTS.concat(ARCHIVED) : PROJECTS).slice().sort((a, b) => b.updated - a.updated).filter(statusMatch).filter(p => !q || custSearchText(p).includes(q));
  const res = PROJECTS.map(p => compute(p, 'real'));
  const vol = res.reduce((a, r) => a + nz(r.gross), 0);
  const am = res.map(r => r.amortRise).filter(v => isNum(v) && v > 0);
  const avgAm = am.length ? am.reduce((a, b) => a + b, 0) / am.length : null;
  const card = customerCard;

  return `<section class="relative overflow-hidden border-b border-line hero-anim">
    <div class="hidden lg:block absolute inset-0 hero-bg" style="background:${appDark() ? '#060B16' : '#A9D4F5'}"><div class="absolute left-0 right-0 bottom-0" style="aspect-ratio:3/1">${houseSVG({ wide: true, align: 'xMaxYMax', anim: true, car: true })}</div></div>
    <div class="hidden lg:block absolute inset-0 hero-bg" style="background:linear-gradient(90deg,var(--hero-fade) 0%,var(--hero-fade2) 42%,transparent 68%)"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-8 pt-10 lg:pt-0 pb-8 lg:pb-0 lg:min-h-[600px] flex items-center hero-txt">
      <div class="max-w-[36rem]"><span class="mono text-[12px] text-ink2 inline-flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-s"></span>Photovoltaik und Wärmepumpe</span>
      <h1 class="h-font text-[46px] sm:text-[60px] lg:text-[76px] leading-[0.98] mt-5">Sonnige Zahlen für Ihre Kunden.</h1>
      <p class="text-[17px] sm:text-[19px] text-ink2 mt-6 leading-relaxed">Angebot hochladen, Daten prüfen, fertig: In wenigen Minuten entsteht eine Wirtschaftlichkeitsberechnung, die Ihre Kunden verstehen.</p>
      <div class="flex flex-wrap gap-3 mt-9"><button class="btn-p !h-12 !px-6 !text-[15px]" data-a="new">${ic('plus', 18)}Neue Berechnung</button><a href="#/einstellungen/design" class="btn-s !h-12 !px-5 !text-[15px]">Design anpassen</a></div></div>
    </div>
    <div class="lg:hidden mx-4 sm:mx-8 mb-8 rounded-[var(--r)] overflow-hidden border border-line aspect-[4/3] sm:aspect-[16/10] hero-card">${houseSVG({ anim: true, car: true })}</div>
  </section>
  <section class="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
    ${backupBanner()}${followUpCard()}
    <div class="flex flex-col 2xl:flex-row 2xl:items-end gap-4 justify-between">
      <div><h2 class="h-font text-[30px]">Ihre Kunden</h2><p class="text-ink3 text-[14px]">Alle Berechnungen, gespeichert auf diesem Gerät.</p></div>
      <div class="grid grid-cols-3 gap-2 sm:gap-3">${[['Berechnungen', num(PROJECTS.length)], ['Angebotsvolumen', eur(vol)], ['Ø Amortisation', avgAm ? num(avgAm, 1) + ' J.' : '–']].map(([k, v]) => `<div class="card !rounded-[calc(var(--r)-4px)] px-3 sm:px-4 py-3"><div class="text-[12px] text-ink3 font-medium">${k}</div><div class="text-[17px] sm:text-[22px] font-semibold mt-1 whitespace-nowrap tracking-[-0.01em]" data-countup>${v}</div></div>`).join('')}</div>
      ${salesStats()}
    </div>
    <div class="relative mt-5"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink4">${ic('search', 18)}</span><input class="inp !pl-11 !bg-card" placeholder="Kunde suchen …" value="${esc(UI.search)}" data-b="u:search" data-t="s"></div>${statusFilterBar()}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 [&>*]:min-w-0" id="cust-list">${list.length ? list.map(card).join('') : `<div class="card p-10 text-center sm:col-span-2 xl:col-span-3"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('users', 26)}</div><div class="font-semibold text-[17px] mt-3">${q ? 'Keine Treffer' : 'Noch keine Berechnungen'}</div><p class="text-ink3 text-[14px] mt-1">${q ? 'Versuchen Sie einen anderen Suchbegriff.' : 'Starten Sie mit Ihrer ersten Wirtschaftlichkeitsberechnung.'}</p>${q ? '' : `<button class="btn-p mt-5" data-a="new">${ic('plus', 17)}Neue Berechnung</button>`}</div>`}</div>
  </section>`;
}

/* =========================================================
   Projekt-Assistent
   ========================================================= */
const STEPS = ['Angebot', 'Kunde', 'Daten', 'Ergebnis'];
function progressBar(step) {
  return `<div class="flex items-center">${STEPS.map((s, i) => { const n = i + 1, done = n < step, on = n === step;
    return `${i ? `<div class="flex-1 h-[2px] rounded-full mx-1 sm:mx-2 ${n <= step ? 'bg-p' : 'bg-line2'}"></div>` : ''}<button class="flex items-center gap-2 shrink-0" data-a="step" data-n="${n}"><span class="w-8 h-8 rounded-full grid place-items-center text-[13px] font-semibold transition-colors ${done ? 'bg-p text-white' : on ? 'bg-card text-p ring-2 ring-p' : 'bg-card text-ink3 ring-1 ring-line2'}">${done ? ic('check', 17) : n}</span><span class="text-[13.5px] font-bold hidden sm:inline ${on ? 'text-ink' : 'text-ink3'}">${s}</span></button>`; }).join('')}</div>`;
}
function liveCard(p, R) {
  const row = (k, v, cls = '') => `<div class="flex justify-between gap-3 py-2 border-b border-line last:border-0 text-[13.5px] ${cls}"><span class="text-ink3">${k}</span><span class="font-bold text-right">${v}</span></div>`;
  return `<div class="card overflow-hidden"><div class="p-5 text-white" style="background:var(--hl)">
    <div class="text-[12.5px] font-semibold opacity-90">Amortisation${R.scen === 'opt' ? ' (optimistisch)' : ''}</div>
    <div class="grid grid-cols-2 gap-3 mt-2"><div><div class="text-[26px] font-semibold leading-none">${amortTxt(R.amortStatic)}<span class="text-[14px] font-bold"> J.</span></div><div class="text-[11.5px] opacity-85 mt-1">gleichbleibende Preise</div></div><div><div class="text-[26px] font-semibold leading-none" style="color:var(--hl-num)">${amortTxt(R.amortRise)}<span class="text-[14px] font-bold"> J.</span></div><div class="text-[11.5px] opacity-85 mt-1">steigende Preise</div></div></div>
    <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20"><div><div class="text-[11.5px] opacity-85">Ø Ersparnis/Jahr</div><div class="text-[17px] font-semibold">${eur(R.avg)}</div></div><div><div class="text-[11.5px] opacity-85">Ersparnis 1. Jahr</div><div class="text-[17px] font-semibold">${eur(R.saving1)}</div></div></div></div>
    <div class="px-5 py-3">${row('Bruttopreis', eur(R.gross))}${R.W ? row('Förderung' + (R.fund.rate ? ` (${pct(R.fund.rate)})` : ''), '− ' + eur(R.funding), 'text-p') : ''}${R.other ? row('Zuschüsse', '− ' + eur(R.other)) : ''}${R.discount ? row('Rabatt', '− ' + eur(R.discount)) : ''}
    ${row('<b class="text-ink">Ihre Kosten nach Förderung</b>', `<span class="text-[16px]">${eur(R.net)}</span>`)}${R.sowieso ? row('Sowieso-Kosten', '− ' + eur(R.sowieso)) + row('Mehrkosten', eur(R.invest)) : ''}${row('Überschuss nach ' + R.N + ' Jahren', `<span class="${R.surplus >= 0 ? 'text-p' : 'text-ember2'}">${eur(R.surplus)}</span>`)}</div>${R.missing.length ? `<div class="mx-5 mb-4 rounded-xl bg-tyel px-3 py-2 text-[12.5px] text-ink"><b>Noch offen:</b> ${R.missing.map(esc).join(', ')}</div>` : ''}</div>`;
}
function updateLive() {
  const p = curProject(); if (!p) return;
  const el = $('#live'); if (el) el.innerHTML = liveCard(p, compute(p));
  $$('[data-live]').forEach(n => { const f = LIVE[n.dataset.live]; if (f) n.innerHTML = f(p); });
}
const LIVE = {
  age: p => { const a = heatingAge(p); return a === null ? '<span class="text-ember2 font-semibold">Pflichtfeld – bestimmt die Förderung</span>' : `${a} Jahre alt`; },
  gsum: p => `Summe: <b class="text-ink">${eur(nz(p.offer.grossWP) + nz(p.offer.grossPV))}</b>`
};
function viewProject() {
  const p = curProject(); if (!p) return `<div class="max-w-xl mx-auto p-10 text-center">Berechnung nicht gefunden. <a class="text-p font-bold" href="#/kunden">Zur Übersicht</a></div>`;
  const step = UI.step, R = compute(p);
  const body = step === 1 ? step1(p, R) : step === 2 ? step2(p, R) : step === 3 ? step3(p, R) : step4(p, R);
  const wide = step === 4 && UI.resultTab === 'doc';
  return `<div class="max-w-7xl mx-auto px-4 pt-5">
    <div class="flex items-center gap-3 flex-wrap"><a href="#/kunden" class="btn-g -ml-3">${ic('arrowL', 16)}Kunden</a><div class="h-font text-[22px] truncate">${esc(p.customer.name || 'Neue Berechnung')}</div>${typeBadge(p.type)}<div class="ml-auto flex items-center gap-2"><span class="text-[12px] text-ink3 hidden sm:inline">Status</span><select class="inp !h-9 !w-auto !pr-8 !text-[13px]" data-status-set>${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${(p.status || 'offen') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="card p-4 sm:px-6 mt-3">${progressBar(step)}</div>
    <div class="grid ${wide ? '' : 'lg:grid-cols-[minmax(0,1fr)_340px]'} gap-5 mt-5 items-start">
      <div class="min-w-0 space-y-5">${body}
        <div class="flex justify-between gap-3 pt-2">${step > 1 ? `<button class="btn-s" data-a="step" data-n="${step - 1}">${ic('arrowL', 17)}Zurück</button>` : '<span></span>'}${step < 4 ? `<button class="btn-p" data-a="step" data-n="${step + 1}">Weiter zu ${STEPS[step]}${ic('arrowR', 17)}</button>` : `<button class="btn-p" data-a="pdf">${ic('download', 17)}PDF erstellen</button>`}</div>
      </div>
      ${wide ? '' : `<aside class="lg:sticky lg:top-24 space-y-4" id="live">${liveCard(p, R)}</aside>`}
    </div></div>`;
}

/* ---------- Schritt 1 ---------- */
function dropZone(role, title, sub, multi) {
  return `<label class="block cursor-pointer rounded-[var(--r)] border-2 border-dashed border-line2 bg-field hover:border-p hover:bg-p/5 transition p-5 text-center" data-drop="${role}">
    <input type="file" class="hidden" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" ${multi ? 'multiple' : ''} data-upload="${role}">
    <div class="w-12 h-12 rounded-[calc(var(--r)-4px)] bg-card border border-line text-p grid place-items-center mx-auto shadow-sm">${ic('upload', 22)}</div>
    <div class="font-semibold text-[15px] mt-3">${title}</div><div class="text-[12.5px] text-ink3 mt-1">${sub}</div></label>`;
}
function docCard(p, d) {
  const busy = UI.busy[d.id], nSel = d.sel.filter(Boolean).length, choose = UI.chooseOpen[d.id];
  const roleL = { offer: 'Angebot', offerWP: 'Angebot Wärmepumpe', offerPV: 'Angebot Photovoltaik', tech: 'Technische Unterlage' }[d.role];
  const thumbs = d.pages.map((f, i) => ({ f, i })).filter(x => d.sel[x.i]).slice(0, 8);
  return `<div class="rounded-[var(--r)] border border-line bg-card p-4">
    <div class="flex items-start gap-3"><div class="w-10 h-10 rounded-xl bg-tred text-ember2 grid place-items-center shrink-0">${ic('file', 19)}</div>
    <div class="min-w-0 flex-1"><div class="text-[12px] font-semibold text-ink4">${roleL}</div><div class="font-bold text-[14px] truncate">${esc(d.name)}</div>
    <div class="text-[12.5px] text-ink3">${busy ? `<span class="inline-flex items-center gap-1.5 text-p font-semibold"><span class="spin inline-block">${ic('refresh', 13)}</span><span data-busy="${d.id}">${esc(busy)}</span></span>` : `${d.pages.length} ${d.pages.length === 1 ? 'Seite' : 'Seiten'} · ${nSel} ausgewählt${d.note ? ' · ' + esc(d.note) : ''}`}</div></div>
    <div class="flex items-center gap-2 shrink-0"><span class="text-[12.5px] font-semibold text-ink3 hidden sm:inline">Anhängen</span>${tgl('', d.attach, `data-a="doc-attach" data-id="${d.id}"`)}</div></div>
    ${thumbs.length ? `<div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">${thumbs.map(t => `<img src="${fileUrl(t.f)}" class="h-24 w-auto rounded-lg border border-line bg-card shrink-0" alt="Seite ${t.i + 1}">`).join('')}</div>` : ''}
    <div class="flex flex-wrap gap-1 mt-2 -mx-2">${d.pages.length > 1 ? `<button class="btn-g" data-a="doc-choose" data-id="${d.id}">${ic('grid', 15)}Seiten wählen</button>` : ''}<label class="btn-g cursor-pointer">${ic('refresh', 15)}Ersetzen<input type="file" class="hidden" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" data-replace="${d.id}" data-role="${d.role}"></label><button class="btn-g hover:!text-ember2" data-a="doc-del" data-id="${d.id}">${ic('trash', 15)}Entfernen</button></div>
    ${choose ? `<div class="mt-3 p-3 rounded-[calc(var(--r)-4px)] bg-bg"><div class="flex items-center justify-between mb-2"><span class="text-[13px] font-semibold text-ink2">Seiten für das Dokument antippen</span><span class="flex gap-1"><button class="chip !h-7" data-a="doc-all" data-id="${d.id}">Alle</button><button class="chip !h-7" data-a="doc-none" data-id="${d.id}">Keine</button></span></div>
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">${d.pages.map((f, i) => `<button class="relative rounded-lg overflow-hidden ring-2 ${d.sel[i] ? 'ring-p' : 'ring-transparent opacity-50'} bg-card" data-a="doc-page" data-id="${d.id}" data-i="${i}"><img src="${fileUrl(f)}" class="w-full aspect-[1/1.414] object-cover object-top" alt=""><span class="absolute top-1 left-1 w-5 h-5 rounded-full text-[10px] font-semibold grid place-items-center ${d.sel[i] ? 'bg-p text-white' : 'bg-card text-ink3 border border-line'}">${d.sel[i] ? '✓' : i + 1}</span><span class="absolute bottom-0 inset-x-0 text-[10px] font-bold bg-card text-ink3">${i + 1}</span></button>`).join('')}</div></div>` : ''}
  </div>`;
}
function recognizedCard(p) {
  const docs = p.docs.filter(d => p.rec[d.id]); if (!docs.length) return '';
  const recs = docs.map(d => ({ d, r: p.rec[d.id] }));
  const offers = recs.filter(x => x.d.role !== 'tech');
  const first = (k) => { for (const x of recs) if (x.r[k] != null) return x.r[k]; return null; };
  const c = (offers[0] && offers[0].r.customer) || {};
  const rows = [];
  const add = (k, v) => { if (v) rows.push(`<div class="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-3 py-2.5 border-b border-line last:border-0 text-[13.5px]"><div class="text-ink3 font-semibold">${k}</div><div class="font-semibold min-w-0">${v}</div></div>`); };
  add('Kunde', esc([c.sal, c.name].filter(Boolean).join(' ')));
  add('Anschrift', esc([c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')));
  offers.forEach(x => add(offers.length > 1 ? (x.d.role === 'offerWP' ? 'Angebot WP' : 'Angebot PV') : 'Angebot', esc([x.r.number && 'Nr. ' + x.r.number, x.r.date && deDate(x.r.date), x.r.advisor && 'Ansprechpartner: ' + x.r.advisor].filter(Boolean).join(' · '))));
  const ra = offers.map(x => x.r).find(r => r.advisor);
  if (ra && !(S.company.advisors || []).some(a => a.name && a.name.toLowerCase() === ra.advisor.toLowerCase())) add('Berater', `${esc([ra.advisor, ra.advisorPhone, ra.advisorEmail].filter(Boolean).join(' · '))}<div class="mt-2"><button class="chip" data-a="adv-from-offer" data-n="${esc(ra.advisor)}" data-ph="${esc(ra.advisorPhone || '')}" data-em="${esc(ra.advisorEmail || '')}">${ic('plus', 14)}Zu meinen Beratern hinzufügen</button></div>`);
  offers.forEach(x => { if (x.r.amounts && x.r.amounts.length) add(offers.length > 1 ? `Bruttopreis ${x.d.role === 'offerWP' ? 'WP' : 'PV'}` : 'Bruttopreis', `<div class="text-[16px] font-semibold">${eur2(x.r.gross)}</div><div class="flex flex-wrap gap-1.5 mt-2">${x.r.amounts.map(a => `<button class="chip ${Math.abs(a.v - x.r.gross) < 0.01 ? '!bg-p/10 !text-p !ring-p/30' : ''}" data-a="set-price" data-role="${x.d.role}" data-v="${a.v}" title="${esc(a.line)}">${eur2(a.v)}</button>`).join('')}</div><div class="hint">Erkannte Beträge – ein Antippen setzt den Bruttopreis.</div>`); });
  const kwp = first('kwp'); if (kwp) add('Photovoltaik', `${num(kwp, 2)} kWp${first('modules') ? ` <span class="text-ink3">(${esc(first('modules'))})</span>` : ''}${first('bat') ? ` · Speicher ${num(first('bat'), 1)} kWh` : ''}`);
  const hk = first('hpKw'), hm = first('hpModel');
  if (hk || hm) add('Wärmepumpe', esc([hk && num(hk, 1) + ' kW', hm, first('dims') && 'Maße ' + first('dims'), first('weight') && 'Gewicht ' + num(first('weight')) + ' kg'].filter(Boolean).join(' · ')));
  if (first('jaz')) add('JAZ', num(first('jaz'), 2));
  if (first('heat') || first('power') || first('load')) add('Laut Auslegung', [first('heat') && 'Wärmebedarf ' + num(first('heat')) + ' kWh', first('power') && 'Strombedarf ' + num(first('power')) + ' kWh', first('load') && 'Heizlast ' + num(first('load'), 1) + ' kW'].filter(Boolean).join(' · '));
  if (first('sw') || first('swNight')) add('Schall', [first('sw') && 'Schallleistung ' + num(first('sw'), 1) + ' dB(A)', first('swNight') && 'Nacht ' + num(first('swNight'), 1) + ' dB(A)', first('spl') && `Schalldruck ${num(first('spl'), 1)} dB(A)${first('splDist') ? ' in ' + num(first('splDist'), 1) + ' m' : ''}`].filter(Boolean).join(' · '));
  const scop = recs.flatMap(x => x.r.scop || []);
  if (scop.length) add('SCOP', `<div class="flex flex-wrap gap-1.5">${scop.map(s => `<button class="chip" data-a="set-jaz" data-v="${s.value}">SCOP${s.temp ? ' ' + s.temp + ' °C' : ''}${s.size ? ` (${s.size} kW)` : ''}: ${num(s.value, 2)} als JAZ</button>`).join('')}</div><div class="hint">SCOP ist ein Normwert aus dem Datenblatt. Die JAZ Ihres Gebäudes kann davon abweichen.</div>`);
  const skipped = offers.flatMap(x => x.r.skipped || []);
  if (skipped.length) add('Nicht berücksichtigt', `<ul class="space-y-1">${skipped.map(s => `<li class="text-ink3 text-[13px]"><span class="font-semibold text-ink2 mono">${esc(s.no)}</span> ${esc(s.title)}${s.kind ? ` · <span class="text-ink2">${esc(s.kind)}</span>` : ''}${s.total ? ` <span class="whitespace-nowrap">· ${eur2(s.total)}</span>` : ''}</li>`).join('')}</ul><div class="hint">Alternativ- und Bedarfspositionen werden nicht eingerechnet.</div>`);
  return `<div class="card p-5 sm:p-6">${cardHead('sparkle', 'Das wurde erkannt', 'Bitte kurz prüfen – alles lässt sich in den nächsten Schritten ändern.')}${rows.join('') || '<p class="text-ink3 text-[14px]">Keine Werte erkannt. Bitte tragen Sie die Daten in den nächsten Schritten ein.</p>'}</div>`;
}
function productsRecCard(p) {
  const seen = {}, items = [];
  p.docs.forEach(d => (p.rec[d.id] && p.rec[d.id].products || []).forEach(m => { if (!seen[m.id] && PRODUCTS.find(x => x.id === m.id)) { seen[m.id] = 1; items.push({ m, d }); } }));
  if (!items.length) return '';
  return `<div class="card p-5 sm:p-6">${cardHead('box', 'Produkte aus Ihrer Datenbank erkannt', 'Ausgewählte Produkte erscheinen mit Bild im Kundendokument.')}
    <div class="space-y-2">${items.map(({ m, d }) => { const pr = PRODUCTS.find(x => x.id === m.id); return `<div class="flex items-center gap-3 p-2 rounded-[calc(var(--r)-4px)] bg-bg"><input type="checkbox" ${m.on ? 'checked' : ''} data-a="recprod-on" data-doc="${d.id}" data-id="${m.id}">${prodThumb(pr, 40)}<div class="flex-1 min-w-0"><div class="font-bold text-[14px] truncate">${esc(pr.name)}</div><div class="text-[12px] text-ink3">${esc(CATS[pr.cat][0])}</div></div><input class="inp !h-10 !w-20 text-center" inputmode="numeric" value="${m.qty}" data-recqty data-doc="${d.id}" data-id="${m.id}"><span class="text-[12px] text-ink3">Stk</span></div>`; }).join('')}</div>
    <button class="btn-p btn-sm mt-4" data-a="recprod-apply">${ic('check', 16)}Ins Dokument übernehmen</button></div>`;
}
function step1(p) {
  const zones = p.type === 'pvwp'
    ? `<div class="grid sm:grid-cols-2 gap-4">${dropZone('offerWP', 'Angebot Wärmepumpe', 'PDF, JPG oder PNG hierher ziehen oder tippen')}${dropZone('offerPV', 'Angebot Photovoltaik', 'PDF, JPG oder PNG hierher ziehen oder tippen')}</div>`
    : dropZone('offer', 'Angebot', 'PDF, JPG oder PNG hierher ziehen oder tippen');
  const offerDocs = p.docs.filter(d => d.role !== 'tech'), techDocs = p.docs.filter(d => d.role === 'tech');
  return `<div class="card p-5 sm:p-6">${cardHead('upload', 'Angebot und Unterlagen', 'Wir lesen Kunde, Preise und Anlagendaten automatisch aus. Ihre Dateien bleiben auf diesem Gerät.')}
    ${zones}${offerDocs.length ? `<div class="space-y-3 mt-4">${offerDocs.map(d => docCard(p, d)).join('')}</div>` : ''}
    ${typeof roofSnapCard === 'function' ? roofSnapCard(p) : ''}
    ${typeof quickPvOffer === 'function' ? quickPvOffer(p) : ''}
    ${hasWP(p) ? `<div class="mt-6">${p.quick && p.quick.v === 2 && !techDocs.length ? `<div class="font-semibold text-[15px] mb-1">Wärmepumpen-Auslegung</div>${quickTechCard(p)}` : `<div class="font-semibold text-[15px] mb-1">Technische Unterlagen</div><p class="text-[13px] text-ink3 mb-3">Optional, mehrere Dateien möglich – z. B. Heizlastberechnung, Wolf-Auslegung, JAZ-Berechnung oder Datenblatt. Bei langen Unterlagen wählen wir die relevanten Seiten vor.</p>${dropZone('tech', 'Technische Unterlagen hinzufügen', 'Heizlastberechnung, Wolf-Auslegung, Datenblatt', true)}${techDocs.length ? '' : `<div class="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink3">Keine Auslegung vorhanden?<button class="btn-g !h-9 !px-3 text-[13px] text-p" data-a="quick-redo" data-id="${p.id}">${ic('fan', 15)}Schnellauslegung machen</button></div>`}`}${techDocs.length ? `<div class="space-y-3 mt-4">${techDocs.map(d => docCard(p, d)).join('')}</div>` : ''}</div>` : ''}
    <div class="mt-5 text-right"><button class="text-p font-bold text-[14px] hover:underline" data-a="step" data-n="2">Ohne Angebot fortfahren →</button></div></div>
    ${recognizedCard(p)}${productsRecCard(p)}`;
}

/* ---------- Schritt 2 ---------- */
function step2(p, R) {
  const price = p.type === 'pvwp'
    ? `<div class="grid sm:grid-cols-2 gap-4">${field('Bruttopreis Angebot Wärmepumpe', 'p:offer.grossWP', { t: 'n', unit: '€', big: true })}${field('Bruttopreis Angebot Photovoltaik', 'p:offer.grossPV', { t: 'n', unit: '€', big: true })}</div>
       <div class="mt-3 text-[14px] text-ink3" data-live="gsum">${LIVE.gsum(p)}</div>
       ${det('total', 'Gemeinsames Angebot mit Gesamtpreis', `<div class="pt-1">${field('Gesamtpreis (optional)', 'p:offer.total', { t: 'n', unit: '€', hint: 'Nur ausfüllen, wenn beide Anlagen in einem Angebot mit einem Gesamtpreis stehen. Die Einzelpreise bestimmen dann nur den WP-Anteil für die Förderung.' })}</div>`)}`
    : field('Bruttopreis laut Angebot', 'p:offer.gross', { t: 'n', unit: '€', big: true, hint: 'Einzige Preisgrundlage der Berechnung (inkl. MwSt.).' });
  return `<div class="card p-5 sm:p-6">${cardHead('users', 'Kunde', 'Diese Angaben erscheinen auf dem Deckblatt.')}
    <div class="grid sm:grid-cols-[180px_1fr] gap-4">${sel('Anrede', 'p:customer.salutation', [['Familie', 'Familie'], ['Herr', 'Herr'], ['Frau', 'Frau'], ['Eheleute', 'Eheleute'], ['Firma', 'Firma'], ['', '–']])}${field('Name', 'p:customer.name', { ph: 'z. B. Mustermann' })}</div>
    <div class="grid sm:grid-cols-[1fr_120px_1fr] gap-4 mt-4">${field('Straße und Hausnummer', 'p:customer.street')}${field('PLZ', 'p:customer.zip', { attrs: 'inputmode="numeric"' })}${field('Ort', 'p:customer.city')}</div><div class="hint" data-plz-te='[data-b="p:customer.zip"]'></div>
    <div class="grid sm:grid-cols-2 gap-4 mt-4">${field('E-Mail', 'p:customer.email', { t: 'email' })}${field('Telefon', 'p:customer.phone', { t: 'tel' })}</div></div>
  <div class="card p-5 sm:p-6">${cardHead('euro', 'Preis und Angebot')}${price}
    <div class="grid sm:grid-cols-3 gap-4 mt-5">${field('Angebots-Nr.', 'p:offer.number')}${field('Angebotsdatum', 'p:offer.date', { t: 'date' })}${advisorPicker(p)}</div>
    <div class="mt-4">${field('Titel im Dokument', 'p:offer.title')}</div></div>`;
}

function advisorPicker(p) {
  const list = (S.company.advisors || []).filter(a => a.name);
  const cur = list.find(a => a.id === p.offer.advisorId && a.name === p.offer.advisor) || list.find(a => a.name === p.offer.advisor);
  const val = cur ? cur.id : (p.offer.advisor ? '__other' : '');
  const a = cur;
  return `<div><span class="lbl flex items-center gap-2">Berater${isFrom('p:offer.advisor') ? '<span class="badge bg-p/10 text-p !py-0 !text-[11px]">aus Angebot</span>' : ''}</span>
    <select class="inp appearance-none pr-10" data-advisor-pick style="background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8692' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 16px center">
      <option value="" ${val === '' ? 'selected' : ''}>– kein Berater –</option>${list.map(x => `<option value="${x.id}" ${val === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}<option value="__other" ${val === '__other' ? 'selected' : ''}>Anderer Name …</option></select>
    ${val === '__other' ? `<div class="mt-2">${inp('p:offer.advisor', { ph: 'Name des Beraters' })}</div>` : ''}
    <div class="hint">${a ? esc([a.role, a.phone, a.email].filter(Boolean).join(' · ')) : list.length ? '' : 'Berater legen Sie unter Einstellungen → Berater an.'}</div></div>`;
}

/* ---------- Schritt 3 ---------- */
function step3(p, R) {
  const h = p.heating, c = S.calc, oil = h.fuel === 'oil';
  let out = '';
  if (hasWP(p)) {
    const age = heatingAge(p);
    out += `<div class="card p-5 sm:p-6">${cardHead('flame', 'Bisherige Heizung')}
      <div class="flex flex-wrap gap-3">${`<div class="seg">${[['oil', 'Heizöl'], ['gas', 'Erdgas']].map(([k, l]) => `<button class="${h.fuel === k ? 'on' : ''}" data-a="fuel" data-v="${k}">${l}</button>`).join('')}</div>`}${!oil ? seg('p:heating.gasType', [['central', 'Gas-Zentralheizung'], ['etage', 'Gasetagenheizung']]) : ''}</div>
      <div class="grid sm:grid-cols-2 gap-4 mt-5">
        ${field('Baujahr Heizung', 'p:heating.year', { t: 'y', req: true, ph: 'z. B. 2001', hint: `<span data-live="age">${LIVE.age(p)}</span>` })}
        ${field(oil ? 'Verbrauch pro Jahr' : 'Verbrauch pro Jahr', 'p:heating.cons', { t: 'n', unit: oil ? 'Liter' : 'kWh', ph: oil ? 'z. B. 2.500' : 'z. B. 22.000' })}
        ${field(oil ? 'Preis pro Liter' : 'Preis pro kWh', 'p:heating.price', { t: 'n', unit: oil ? '€/l' : '€/kWh' })}
        ${field('Wartung pro Jahr', 'p:heating.maint', { t: 'n', unit: '€', hint: 'inkl. Schornsteinfeger' })}
      </div>
      ${det('heat-more', 'Weitere Angaben', `<div class="grid sm:grid-cols-2 gap-4 pt-1">${field('Grundpreis pro Jahr', 'p:heating.base', { t: 'n', unit: '€' })}${field('Nutzungsgrad Kessel', 'p:heating.eff', { t: 'n', unit: '%', hint: 'Standard 85 %' })}</div>`)}
      <div class="mt-4 rounded-[calc(var(--r)-4px)] bg-bg px-4">${toggleRow('Bestandsheizung müsste ohnehin erneuert werden', 'p:heating.replace', 'Die Kosten einer neuen Öl-/Gasheizung werden als Sowieso-Kosten abgezogen.')}
      ${h.replace ? `<div class="pb-4">${field(`Kosten einer neuen ${oil ? 'Ölheizung' : 'Gasheizung'}`, 'p:heating.replaceCost', { t: 'n', unit: '€', ph: num(oil ? c.replaceOil : c.replaceGas), hint: `Leer = Standardwert ${eur(oil ? c.replaceOil : c.replaceGas)}` })}</div>` : ''}</div></div>`;
    out += `<div class="card p-5 sm:p-6">${cardHead('fan', 'Neue Wärmepumpe')}${typeof quickCard === 'function' ? quickCard(p) : ''}
      <div class="grid sm:grid-cols-2 gap-4">${field('Modell', 'p:hp.model', { cls: 'sm:col-span-2' })}${field('Pufferspeicher', 'p:hp.buffer', { ph: 'z. B. Pufferspeicher 200 Liter' })}${field('Warmwasserspeicher', 'p:hp.dhw', { ph: 'z. B. Warmwasserspeicher 200 Liter' })}${field('Garantie', 'p:hp.warranty', { cls: 'sm:col-span-2', ph: 'z. B. 5 Jahre Herstellergarantie – Voraussetzung: jährliche Wartung', hint: 'Aus dem Angebot übernommen – erscheint im Kundendokument.' })}${field('Heizleistung', 'p:hp.kw', { t: 'n', unit: 'kW' })}${field('JAZ (Jahresarbeitszahl)', 'p:hp.jaz', { t: 'n', ph: num(c.jaz, 1), hint: `Leer = Standard ${num(c.jaz, 1)}` })}<div class="sm:col-span-2 rounded-[calc(var(--r)-4px)] border border-line bg-field p-4"><label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="mt-0.5" data-tgcheck="p:hp.tariffOn" ${p.hp.tariffOn ? 'checked' : ''}><span><span class="text-[14px] font-semibold">Separater Wärmepumpen-Stromtarif</span><span class="block hint !mt-0.5">Eigener Zähler mit günstigerem Arbeitspreis. Ohne Haken läuft die Wärmepumpe über den normalen Haushaltsstrom (${ct(nz(p.hh.price, c.hhPrice))}/kWh).</span></span></label>${p.hp.tariffOn ? `<div class="grid sm:grid-cols-2 gap-4 mt-4">${field('WP-Stromtarif', 'p:hp.tariff', { t: 'n', unit: '€/kWh' })}${field('Grundpreis WP-Zähler', 'p:hp.base', { t: 'n', unit: '€/Jahr' })}</div>` : ''}</div></div>
      ${det('hp-more', 'Weitere Angaben', `<div class="grid sm:grid-cols-2 gap-4 pt-1">${field('Wärmebedarf laut Auslegung', 'p:hp.heat', { t: 'n', unit: 'kWh', ph: R.heat ? num(R.heat) : '', hint: 'Leer = aus Verbrauch × Nutzungsgrad' })}${field('Strombedarf laut Auslegung', 'p:hp.power', { t: 'n', unit: 'kWh', ph: R.hpPower ? num(R.hpPower) : '', hint: 'Leer = Wärmebedarf ÷ JAZ' })}${field('Maße Außeneinheit', 'p:hp.dims', { ph: '1286 x 979 x 562 mm' })}${field('Gewicht Außeneinheit', 'p:hp.weight', { t: 'n', unit: 'kg' })}${field('Wartung WP', 'p:hp.maint', { t: 'n', unit: '€/Jahr' })}${field('Schallleistungspegel', 'p:hp.sw', { t: 'n', unit: 'dB(A)' })}${field('Schallleistung nachts', 'p:hp.swNight', { t: 'n', unit: 'dB(A)' })}${field('Schalldruck nachts', 'p:hp.spl', { t: 'n', unit: 'dB(A)' })}${field('Abstand Schalldruck', 'p:hp.splDist', { t: 'n', unit: 'm' })}${field('§ 14a-Netzentgeltreduzierung', 'p:hp.p14a', { t: 'n', unit: '€/Jahr' })}</div><p class="hint">Schallwerte sind mit Wolf CHA-10 vorbelegt und werden aus Angebot oder Datenblatt übernommen.</p>`)}
      ${p.type === 'pvwp' ? `<div class="mt-4 rounded-[calc(var(--r)-4px)] border border-line bg-field p-4"><label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="mt-0.5" data-tgcheck="p:rod.on" ${p.rod && p.rod.on ? 'checked' : ''}><span><span class="text-[14px] font-semibold">Heizstab mit PV-Überschuss</span><span class="block hint !mt-0.5">z. B. my-PV: Im Sommer erwärmt der Heizstab das Warmwasser mit überschüssigem Solarstrom. Die Wärmepumpe kann dann nahezu komplett pausieren – weniger Laufzeit, längere Lebensdauer.</span></span></label>
        ${p.rod && p.rod.on ? `<div class="grid sm:grid-cols-3 gap-4 mt-4">${field('Bezeichnung', 'p:rod.name', { ph: S.calc.rodName })}${field('Leistung', 'p:rod.kw', { t: 'n', unit: 'kW', ph: num(S.calc.rodKw, 1) })}${sel('Sommerbetrieb', 'p:rod.months', [[3, 'Juni bis August'], [4, 'Mai bis August'], [5, 'Mai bis September'], [6, 'Mai bis Oktober']], { t: 'y' })}</div>` : ''}</div>` : ''}</div>`;
  }
  if (hasPV(p)) {
    out += `<div class="card p-5 sm:p-6">${cardHead('sun', 'Photovoltaik')}${typeof roofCard === 'function' ? roofCard(p) : ''}${typeof quickPvOffer === 'function' ? quickPvOffer(p, true) : ''}
      <div class="grid sm:grid-cols-2 gap-4">${field('Anlagenleistung', 'p:pv.kwp', { t: 'n', unit: 'kWp', hint: p.pv.modules ? esc(p.pv.modules) : '' })}${field('Batteriespeicher', 'p:pv.bat', { t: 'n', unit: 'kWh', ph: '0' })}</div>
      ${det('pv-maker', 'Hersteller & Garantien', `<div class="grid sm:grid-cols-2 gap-4 pt-1">${field('Module (Hersteller / Typ)', 'p:pv.modMaker', { ph: 'z. B. Winaico WST-BKX54' })}${field('Garantie Module', 'p:pv.modWarranty', { ph: 'z. B. 30 Jahre Produkt- und Leistungsgarantie' })}${field('Speicher (Hersteller / Typ)', 'p:pv.batMaker', { ph: 'z. B. EcoFlow Ocean 2' })}${field('Garantie Speicher', 'p:pv.batWarranty', { ph: 'z. B. 15 Jahre Produktgarantie' })}${field('Wechselrichter (Hersteller / Typ)', 'p:pv.invMaker')}${field('Garantie Wechselrichter', 'p:pv.invWarranty')}</div><p class="hint">Wird aus dem Angebot übernommen und erscheint im Kundendokument.</p>`, [p.pv.modMaker, p.pv.batMaker].filter(Boolean).map(esc).join(' · '))}
      ${roofsCard(p, R)}
      <div class="mt-4 text-[13px] text-ink3">Einspeisevergütung ${num(c.feedIn, 2)} ct/kWh · Ertrag pro Jahr <b class="text-ink2">ca. ${kwh100(R.yield)} kWh</b></div></div>`;
    out += carCard(p, R);
  }
  if (p.type === 'wp') out += `<div class="card p-5 sm:p-6">${cardHead('sun', 'Potenzielle PV-Anlage', 'Nur für das Diagramm „Ihr Strom übers Jahr“ – zeigt, wie viel Solarstrom die Wärmepumpe nutzen könnte. Nicht Teil der Berechnung.')}<div class="grid sm:grid-cols-2 gap-4">${field('Anlagenleistung', 'p:pvPot.kwp', { t: 'n', unit: 'kWp', ph: num(S.calc.potKwp), hint: `Leer = ${num(S.calc.potKwp)} kWp` })}${field('Batteriespeicher', 'p:pvPot.bat', { t: 'n', unit: 'kWh', ph: num(S.calc.potBat) })}</div></div>`;
  out += `<div class="card p-5 sm:p-6">${cardHead('home', 'Haushaltsstrom')}<div class="grid sm:grid-cols-2 gap-4">${field('Verbrauch pro Jahr', 'p:hh.cons', { t: 'n', unit: 'kWh' })}${field('Strompreis', 'p:hh.price', { t: 'n', unit: '€/kWh' })}</div></div>`;
  if (hasWP(p)) out += fundingCard(p, R);
  else out += `<div class="card p-5 sm:p-6">${cardHead('gift', 'Förderung')}<div class="rounded-[calc(var(--r)-4px)] bg-bg p-4 text-[14px] text-ink2">Für PV gibt es keine BEG-Heizungsförderung.</div><div class="mt-4">${field('Sonstige Zuschüsse', 'p:fund.other', { t: 'n', unit: '€', hint: 'z. B. kommunale Förderprogramme' })}</div></div>`;
  out += componentsCard(p);
  return out;
}
function fundingCard(p, R) {
  const f = p.fund, st = standOf(p), cur = currentStand(), auto = speedAuto(p), F = R.fund;
  const stands = S.funding.stands.slice().sort((a, b) => a.from.localeCompare(b.from));
  const tile = (k, v) => `<div class="kpi !p-3"><div class="kpi-k !text-[11.5px]">${k}</div><div class="text-[17px] font-semibold mt-0.5">${v}</div></div>`;
  const manual = f.speed !== null && f.speed !== undefined;
  return `<div class="card p-5 sm:p-6">${cardHead('gift', 'Förderung', 'BEG Einzelmaßnahmen · KfW 458')}
    ${sel('Berechnungsgrundlage', 'p:fund.stand', stands.map(s => [s.id, `Stand ${deDate(s.from)}${s.to ? ` (Anträge bis ${deDate(s.to)})` : ' (ohne Enddatum)'}${s.id === cur.id ? ' · aktuell gültig' : ''}`]))}
    <div class="grid grid-cols-3 gap-2 mt-3">${tile('Grundförderung', pct(st.base))}${tile('Geschwindigkeitsbonus', pct(st.speed))}${tile('Förderfähig max.', eur(st.first))}</div>
    ${st.note ? `<p class="hint">${esc(st.note)}</p>` : ''}
    <div class="mt-3 divide-y divide-line">
      <div class="py-3"><span class="lbl">Wärmepumpe aus EU-Produktion (Wertschöpfungsbonus${st.eu > 0 ? ` +${st.eu} %` : (() => { const e = S.funding.stands.filter(x => x.eu > 0).sort((a, b) => a.from.localeCompare(b.from))[0]; return e ? ` ab ${deDate(e.from)} +${e.eu} %` : ''; })()})</span>${seg('p:fund.euMode', [['auto', `Automatisch${euMaker(p) ? ` (ja – ${esc(euMaker(p))})` : ' (nein)'}`], ['yes', 'Ja'], ['no', 'Nein']], { cls: 'flex-wrap' })}<div class="hint">${st.eu > 0 ? 'Gilt für in der EU gefertigte Wärmepumpen.' : 'Gilt erst für spätere Förderstände – wichtig für den Hinweis „Förderung jetzt sichern“.'} Automatisch erkannt am Hersteller; im Zweifel beim Hersteller nachfragen.</div></div>
      ${st.speed > 0 ? `<div class="py-3"><label class="flex items-start gap-3"><input type="checkbox" class="mt-0.5" ${F.speedOn ? 'checked' : ''} data-a="speed"><span><span class="text-[14px] font-semibold">Klimageschwindigkeitsbonus +${st.speed} %</span><span class="block hint !mt-0.5">${manual ? `Manuell gesetzt · automatisch wäre: ${auto.on ? 'ja' : 'nein'} (${esc(auto.why)})` : `Automatisch: ${auto.on ? 'ja' : 'nein'} – ${esc(auto.why)}`}</span></span></label>${manual ? `<button class="text-p font-bold text-[13px] mt-1 ml-8 hover:underline" data-a="speed-auto">Wieder automatisch bestimmen</button>` : ''}</div>` : `<div class="py-3 text-[13px] text-ink3">In diesem Förderstand gibt es keinen Klimageschwindigkeitsbonus.</div>`}
    </div>
    <div class="grid sm:grid-cols-2 gap-4 mt-3">
      ${sel('Einkommensbonus', 'p:fund.income', [['none', 'kein Einkommensbonus'], ['50', `bis 50.000 € zVE (+${st.inc50} %)`], ['40', `bis 40.000 € zVE (+${st.inc40} %)`], ['30', `bis 30.000 € zVE (+${st.inc30} %)`]], { hint: 'Mit Kind unter 18 werden 10.000 € vom zu versteuernden Einkommen abgezogen.' })}
      ${field('Wohneinheiten', 'p:fund.units', { t: 'y' })}
      ${field(p.type === 'pvwp' ? 'Förderfähige Kosten (WP-Anteil)' : 'Förderfähige Kosten', 'p:fund.eligible', { t: 'n', unit: '€', ph: num(p.type === 'pvwp' ? nz(p.offer.grossWP) : grossOf(p)), hint: `Leer = ${p.type === 'pvwp' ? 'Bruttopreis des WP-Angebots' : 'Bruttopreis'} · Kappungsgrenze ${eur(F.cap)}` })}
      ${field('Sonstige Zuschüsse', 'p:fund.other', { t: 'n', unit: '€' })}
    </div>
    <div class="mt-4 rounded-[calc(var(--r)-4px)] p-4 text-white flex items-center justify-between gap-3" style="background:var(--hl)"><div><div class="text-[12.5px] opacity-90">Fördersatz ${F.capped ? `(gedeckelt auf ${F.max} %)` : ''}</div><div class="text-[24px] font-semibold">${pct(F.rate)}</div></div><div class="text-right"><div class="text-[12.5px] opacity-90">Förderung</div><div class="text-[24px] font-semibold" style="color:var(--hl-num)">${eur(F.amount)}</div></div></div></div>`;
}
function prodThumb(pr, s = 44) {
  const url = fileUrl(pr && pr.img) || (pr && pr.imgUrl);
  return url ? `<img src="${esc(url)}" class="rounded-xl object-contain bg-card border border-line shrink-0" style="width:${s}px;height:${s}px" alt="">` : `<div class="rounded-xl bg-p/10 text-p grid place-items-center shrink-0" style="width:${s}px;height:${s}px">${ic(pr && pr.cat === 'wp' ? 'fan' : pr && pr.cat === 'mod' ? 'sun' : pr && pr.cat === 'bat' ? 'battery' : pr && pr.cat === 'inv' ? 'bolt' : 'box', s * 0.45)}</div>`;
}
function componentsCard(p) {
  if (!PRODUCTS.length) return '';
  const rows = PRODUCTS.map(pr => { const comp = p.components.find(c => c.id === pr.id); return `<div class="flex items-center gap-3 p-2 rounded-[calc(var(--r)-4px)] ${comp ? 'bg-p/5 ring-1 ring-p/20' : 'bg-bg'}"><input type="checkbox" ${comp ? 'checked' : ''} data-a="comp" data-id="${pr.id}">${prodThumb(pr, 40)}<div class="flex-1 min-w-0"><div class="font-bold text-[14px] truncate">${esc(pr.name)}</div><div class="text-[12px] text-ink3">${esc(CATS[pr.cat][0])}${pr.power ? ' · ' + num(pr.power, pr.power % 1 ? 1 : 0) + ' ' + CATS[pr.cat][1] : ''}</div></div>${comp ? `<input class="inp !h-10 !w-20 text-center" inputmode="numeric" value="${comp.qty}" data-compqty="${pr.id}"><span class="text-[12px] text-ink3">Stk</span>` : ''}</div>`; }).join('');
  return `<div class="card p-5 sm:p-6">${det('comps', `<span class="flex items-center gap-2">${ic('box', 17)}Komponenten fürs Dokument <span class="text-ink4 font-medium">(optional)</span>${p.components.length ? `<span class="badge bg-p/10 text-p">${p.components.length}</span>` : ''}</span>`, `<p class="text-[13px] text-ink3 mb-3">Produkte aus Ihrer Datenbank erscheinen mit Bild im Dokument. kWp, Speicher, Heizleistung und JAZ werden daraus übernommen.</p><div class="space-y-2">${rows}</div>`)}</div>`.replace('mt-4 rounded-[calc(var(--r)-4px)]', 'rounded-[calc(var(--r)-4px)]');
}
function applyComponents(p) {
  let kwp = 0, bat = 0, wp = null;
  for (const c of p.components) { const pr = PRODUCTS.find(x => x.id === c.id); if (!pr) continue; if (pr.cat === 'mod') kwp += c.qty * nz(pr.power) / 1000; if (pr.cat === 'bat') bat += c.qty * nz(pr.power); if (pr.cat === 'wp') wp = pr; }
  if (kwp && hasPV(p)) { p.pv.kwp = Math.round(kwp * 1000) / 1000; const m = p.components.find(c => { const pr = PRODUCTS.find(x => x.id === c.id); return pr && pr.cat === 'mod'; }); if (m) { const pr = PRODUCTS.find(x => x.id === m.id); p.pv.modules = `${m.qty} × ${num(pr.power)} W`; } }
  if (bat && hasPV(p)) p.pv.bat = bat;
  if (wp && hasWP(p)) { if (wp.power) p.hp.kw = wp.power; if (wp.jaz) p.hp.jaz = wp.jaz; if (!p.hp.model) p.hp.model = wp.name; if (wp.dims && !p.hp.dims) p.hp.dims = wp.dims; if (wp.weight && !p.hp.weight) p.hp.weight = wp.weight; }
}

/* Vertriebs-Kennzahlen: Abschlüsse mit Quote, erhaltene Berechnungen, Archiv (inkl. archivierter Kunden) */
function salesStats() {
  const all = PROJECTS.concat(ARCHIVED), st = p => p.status || 'offen';
  const signed = all.filter(p => st(p) === 'unterschrieben' || (p.sign && p.sign.cust)).length;
  const got = all.filter(p => st(p) !== 'offen' || (p.sign && p.sign.cust)).length;
  const rate = got ? signed / got * 100 : null;
  const cell = (k, v, u, hl) => `<div class="card !rounded-[calc(var(--r)-4px)] px-3 sm:px-4 py-3" ${hl ? 'style="background:rgb(var(--p-rgb)/.10);border-color:rgb(var(--p-rgb)/.35)"' : ''}><div class="text-[12px] text-ink3 font-medium">${k}</div><div class="text-[17px] sm:text-[22px] font-semibold mt-1 whitespace-nowrap tracking-[-0.01em] ${hl ? 'text-p' : ''}" data-countup>${v}</div><div class="text-[11px] text-ink3 mt-0.5 leading-tight">${u}</div></div>`;
  return `<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3">${cell('Berechnung erhalten', num(got), 'Kunden mit PDF')}${cell('Abgeschlossen', num(signed), 'unterschrieben')}${cell('Abschlussquote', rate === null ? '–' : pct(rate), got ? `${num(signed)} von ${num(got)}` : 'noch keine Daten', true)}${cell('Archiviert', num(ARCHIVED.length), 'Kunden im Archiv')}</div>`;
}
