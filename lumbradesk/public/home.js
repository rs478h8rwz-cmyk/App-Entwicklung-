/* lumbra.desk – Startseite im Stil einer iPhone-App
   Datum mit Sonnenpunkt, große Überschrift „Heute“, App-Symbole wie auf dem Home-Bildschirm,
   Kennzahlen als Widgets, darunter gruppierte Listen (Pipeline, Fällig, Team, Aktivitäten, Konto). */
'use strict';
const APP_LOOK = {
  calc: { cls: 'ai-sun', glyph: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>' },
  stempel: { cls: 'ai-ink', glyph: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.4 1.6M9.5 2.8h5"/>' },
  modul: { cls: 'ai-sky', glyph: '<path d="M2.8 13.2 12 5l9.2 8.2"/><path d="M6.5 11.2h11v8.3h-11z"/><path d="M10.2 11.2v8.3M13.8 11.2v8.3M6.5 15.3h11"/>' },
  quick: { cls: 'ai-teal', glyph: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><circle cx="10" cy="12" r="3.6"/><path d="M10 8.4v3.6l2.6 1.6M16.5 9v6"/>' },
  abnahme: { cls: 'ai-leaf', glyph: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v2.5H9zM8.8 13.2l2.2 2.2 4.4-4.6"/>' }
};
const appIcon = key => { const a = APP_LOOK[key] || APP_LOOK.calc; return `<span class="ai ${a.cls}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${a.glyph}</svg></span>`; };
const homeDate = () => new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

viewHome = function () {
  const crm = typeof isCrm === 'function' && isCrm(), first = esc(ST.user.name.split(' ')[0]);
  const apps = ST.apps.filter(a => a.url);
  if (isDesk()) return homeDesk(crm, first, apps);
  return `<section class="h-top"><div class="h-date"><i></i>${esc(homeDate())}</div><div class="h-trow"><h1 class="h-title">${crm ? 'Heute' : 'Hallo ' + first}</h1>${crm ? kdBtn('sm') : ''}</div></section>
    <section class="h-apps">${apps.map(a => `<a class="app" href="${esc(a.url)}">${appIcon(a.key)}<span class="app-l">${esc(a.name)}</span></a>`).join('') || '<p class="muted">Für deine Rolle sind noch keine Apps freigeschaltet.</p>'}</section>
    ${crm ? homeCrm() : ''}
    <section class="h-sec"><h2>Konto</h2></section>
    <div class="glist">
      <div class="grow who"><span class="av">${esc(ST.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span><div class="gmain"><b>${esc(ST.user.name)}</b><span>${esc(ST.user.email)} · ${esc(ST.user.roleName)}</span></div></div>
      <details class="pwbox grow-d"><summary class="grow">${ic('key', 18)}<span class="gmain">Passwort ändern</span>${ic('next', 16)}</summary>
        <form id="f-pw2" class="form-grid"><label>Bisheriges Passwort<input name="old" type="password" autocomplete="current-password" required></label><label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required></label><label>Wiederholen<input name="new2" type="password" autocomplete="new-password" required></label><div><button class="btn" type="submit" style="margin-top:12px">Passwort ändern</button></div></form></details>
      <details class="pwbox grow-d" data-um="1"><summary class="grow">${ic('mail', 18)}<span class="gmain">Eigenes E-Mail-Postfach</span>${ic('next', 16)}</summary><div class="um-box"></div></details>
      <details class="pwbox grow-d" data-sig="1"><summary class="grow">${ic('edit', 18)}<span class="gmain">Meine E-Mail-Signatur</span>${ic('next', 16)}</summary><div class="sig-box"></div></details>
      <button class="grow g-danger" data-a="logout">${ic('out', 18)}<span class="gmain">Abmelden</span></button>
    </div>`;
};

/* ---------- Diagramme (SVG, ohne Bibliothek) ---------- */
const MON_S = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const monS = ym => MON_S[+ym.slice(5, 7) - 1];
const eur0 = n => Math.round(n || 0).toLocaleString('de-DE') + ' €';
/* weiche Kurve durch die Punkte (Catmull-Rom → Bézier) */
function smoothPath(P) {   // monotone Kurve (Fritsch-Carlson): weich, aber ohne Überschwingen
  const n = P.length; if (n < 2) return '';
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < n - 1; i++) d += ` C${P[i][0] + dx[i] / 3},${P[i][1] + t[i] * dx[i] / 3} ${P[i + 1][0] - dx[i] / 3},${P[i + 1][1] - t[i + 1] * dx[i] / 3} ${P[i + 1][0]},${P[i + 1][1]}`;
  return d;
}
/* Monatsbalken: Auftragsvolumen, aktueller Monat hervorgehoben, Ø-Linie */
function revBars(S, W = 360, H = 150) {
  const top = 22, bot = 18, n = S.length, gap = innerWidth < 760 ? 4 : W > 500 ? 14 : 6, bw = (W - gap * (n - 1)) / n, max = Math.max(1, ...S.map(x => x.wonSum));
  const vals = S.filter(x => x.wonSum > 0), avg = vals.length ? vals.reduce((a, x) => a + x.wonSum, 0) / vals.length : 0, y = v => top + (H - top - bot) * (1 - v / max);
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Auftragsvolumen je Monat">
    ${S.map((x, i) => { const X = i * (bw + gap), h = Math.max(x.wonSum ? 4 : 2, H - bot - y(x.wonSum)), last = i === n - 1; return `<g><title>${monS(x.m)}: ${eur0(x.wonSum)} · ${x.won} Auftr${x.won === 1 ? 'ag' : 'äge'}</title><rect x="${X}" y="${H - bot - h}" width="${bw}" height="${h}" rx="4" class="${last ? 'b-a' : x.wonSum ? 'b-n' : 'b-0'}"/><text x="${X + bw / 2}" y="${H - 4}" class="ax" text-anchor="middle">${monS(x.m)}</text></g>`; }).join('')}
    ${avg ? `<line x1="0" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" class="avg"/><rect x="0" y="${y(avg) - 16}" width="${eur0(avg).length * 6 + 18}" height="14" rx="7" class="avgbg"/><text x="7" y="${y(avg) - 6}" class="ax">Ø ${eur0(avg)}</text>` : ''}</svg>`;
}
/* Linien: neue Angebote und Aufträge je Monat (Anzahl) */
function lineChart(S) {
  const ph = innerWidth < 760, W = ph ? 340 : 600, H = ph ? 190 : 210, L = 22, R = 8, T = 14, B = 22, n = S.length, max = Math.max(2, ...S.map(x => Math.max(x.offers, x.won))), step = Math.ceil(max / 3);
  const X = i => L + (W - L - R) * i / (n - 1), Y = v => T + (H - T - B) * (1 - v / (step * 3));
  const pa = S.map((x, i) => [X(i), Y(x.offers)]), pb = S.map((x, i) => [X(i), Y(x.won)]);
  const area = P => `${smoothPath(P)} L${P[P.length - 1][0]},${H - B} L${P[0][0]},${H - B} Z`;
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Neue Angebote und Aufträge je Monat">
    <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ga1"/><stop offset="1" class="ga0"/></linearGradient><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="gb1"/><stop offset="1" class="gb0"/></linearGradient></defs>
    ${[0, 1, 2, 3].map(k => `<line x1="${L}" x2="${W - R}" y1="${Y(k * step)}" y2="${Y(k * step)}" class="grid"/><text x="${L - 6}" y="${Y(k * step) + 3}" class="ax" text-anchor="end">${k * step}</text>`).join('')}
    <path d="${area(pb)}" fill="url(#gb)"/><path d="${area(pa)}" fill="url(#ga)"/>
    <path d="${smoothPath(pb)}" class="l-b"/><path d="${smoothPath(pa)}" class="l-a"/>
    ${S.map((x, i) => !ph || i % 2 === (n - 1) % 2 ? `<text x="${X(i)}" y="${H - 6}" class="ax" text-anchor="middle">${monS(x.m)}</text>` : '').join('')}
    <circle cx="${pa[n - 1][0]}" cy="${pa[n - 1][1]}" r="4" class="d-a"/><circle cx="${pb[n - 1][0]}" cy="${pb[n - 1][1]}" r="4" class="d-b"/>
    ${S.map((x, i) => `<rect x="${X(i) - (W - L - R) / (n - 1) / 2}" y="0" width="${(W - L - R) / (n - 1)}" height="${H - B}" class="hit"><title>${monS(x.m)}: ${x.won} Auftr${x.won === 1 ? 'ag' : 'äge'} (${eur0(x.wonSum)}) · ${x.offers} neue Angebot${x.offers === 1 ? '' : 'e'}</title></rect>`).join('')}</svg>`;
}
/* Heatmap: Aktivität nach Wochentag und Tageszeit */
function heatMap(Hm) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], slots = ['7', '9', '11', '13', '15', '17'], max = Math.max(1, ...Hm.flat()), tot = Hm.flat().reduce((a, b) => a + b, 0);
  const lv = v => v ? Math.min(4, 1 + Math.floor(v / max * 3.999)) : 0;
  return `<div class="hm"><span></span>${slots.map(s => `<span class="hx">${s}</span>`).join('')}
    ${days.map((d, r) => `<span class="hy">${d}</span>${Hm[r].map((v, c) => `<i class="lv${lv(v)}" title="${d} ${slots[c]}–${+slots[c] + 2} Uhr: ${v} Eintr${v === 1 ? 'ag' : 'äge'}"></i>`).join('')}`).join('')}</div>
    <div class="hm-leg"><span>${tot} Einträge · 8 Wochen</span><span class="hm-sc">Weniger ${[0, 1, 2, 3, 4].map(k => `<i class="lv${k}"></i>`).join('')} Mehr</span></div>`;
}
const KIND_TONE = { anruf: 'b', termin: 'a', email: 'b', notiz: 'n', stufe: 'a', zuweisung: 'n', aufgabe: 'n', protokoll: 'a' };

homeCrm = function () {
  const D = ST.dash; if (!D) return homeDueCard();
  const k = D.kpi, S = D.series || [], y = D.year, euros = Math.floor(D.wonYear || 0), cents = ',' + String(Math.round(((D.wonYear || 0) - euros) * 100)).padStart(2, '0');
  const chg = D.wonPrevSame > 0 ? Math.round((D.wonYear - D.wonPrevSame) / D.wonPrevSame * 100) : null;
  const st = D.stages.filter(s => s.key !== 'verloren'), max = Math.max(1, ...st.map(s => s.n)), lost = (D.stages.find(s => s.key === 'verloren') || {}).n || 0;
  return `<div class="hero2 cardx">
      <div class="hv"><span class="wl">Auftragsvolumen ${y}</span><b class="big">${euros.toLocaleString('de-DE')}<span>${cents} €</span></b>
        ${chg !== null ? `<span class="chg ${chg >= 0 ? 'up' : 'dn'}">${chg >= 0 ? '+' : ''}${chg} % ggü. ${+y - 1} bis heute</span>` : `<span class="chg">${k.wonMonth} Auftr${k.wonMonth === 1 ? 'ag' : 'äge'} im ${new Date(D.month + '-01T12:00').toLocaleDateString('de-DE', { month: 'long' })}</span>`}
        <span class="ws">Offen: ${eur0(k.offersSum)} in ${k.offers} Angebot${k.offers === 1 ? '' : 'en'}</span>
        <div class="hb-act"><a class="pill on" href="#/kunden">Kunden</a><a class="pill" href="#/aufgaben">Aufgaben</a></div></div>
      <div class="hbars">${S.length ? revBars(S) : ''}</div>
    </div>
    <div class="kgrid3">
      <a class="mini" href="#/kunden"><span class="wl">Abschlussquote</span><b>${k.rate === null ? '–' : k.rate + ' %'}</b><span class="ws">${k.decided ? `aus ${k.decided} Entscheidungen` : 'noch offen'}</span></a>
      <a class="mini" href="#/kunden"><span class="wl">Offene Angebote</span><b>${k.offers}</b><span class="ws">${eur0(k.offersSum)}</span></a>
      <a class="mini ${k.overdue ? 'bad' : ''}" href="#/aufgaben"><span class="wl">Überfällig</span><b>${k.overdue}</b><span class="ws">${k.dueToday ? `${k.dueToday} heute fällig` : 'Wiedervorlagen'}</span></a>
    </div>
    ${D.vacReq ? `<a class="glist banner" href="stempel/#/einstellungen/team"><span class="grow"><span class="bdot"></span><span class="gmain"><b>${D.vacReq} Urlaubsantrag${D.vacReq === 1 ? '' : 'e'} offen</b><span>Genehmigen in der Stempeluhr</span></span>${ic('next', 16)}</span></a>` : ''}
    <div class="h-2col">
      <div class="cardx"><div class="cx-h"><h2>Angebote und Aufträge</h2><span class="leg"><i class="la"></i>Aufträge <i class="lb"></i>Neue Angebote</span></div>${S.length ? lineChart(S) : ''}</div>
      <div class="cardx"><div class="cx-h"><h2>Aktivität im Team</h2></div>${heatMap(D.heat || [])}</div>
    </div>
    <div class="h-2col">
      <div><section class="h-sec"><h2>Pipeline</h2><a href="#/kunden" data-a="crm-go-pipe">Alle</a></section>
        <div class="glist pipe-l">${st.map(s => `<a class="grow prow" href="#/kunden" data-a="crm-go-stage" data-v="${s.key}"><span class="pl">${STG_L[s.key]}</span><span class="pb"><i style="width:${s.n ? Math.max(4, s.n / max * 100) : 0}%"></i></span><span class="pn">${s.n}</span><span class="ps">${s.sum ? euro(s.sum) : ''}</span></a>`).join('')}
          ${lost ? `<div class="grow foot">Verloren: ${lost}</div>` : ''}</div></div>
      <div>${homeDueCard()}</div>
    </div>
    ${D.all && D.team.length ? `<section class="h-sec"><h2>Team</h2><a href="stempel/#/einstellungen/auswertung">Stunden-Auswertung</a></section>
      <div class="glist">${D.team.map(t => `<div class="grow trow"><span class="av sm">${esc(t.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase())}</span><span class="gmain"><b>${esc(t.name)}</b><span>${t.active} aktive Kunden${t.offers ? ' · ' + euro(t.offers) + ' Angebote' : ''}</span></span><span class="tk"><b>${t.won}</b><span>Aufträge</span></span><span class="tk"><b>${t.acts}</b><span>7 Tage</span></span>${t.overdue ? `<span class="tk bad"><b>${t.overdue}</b><span>überfällig</span></span>` : ''}</div>`).join('')}</div>` : ''}
    ${D.recent.length ? `<section class="h-sec"><h2>Letzte Aktivitäten</h2></section><div class="glist">${D.recent.slice(0, 6).map(e => `<a class="grow" href="#/kunde/${esc(e.project)}"><span class="gic">${ic(e.kind, 16)}</span><span class="gmain"><b>${esc(e.projectName)}</b><span>${esc(e.text.length > 60 ? e.text.slice(0, 60) + ' …' : e.text)}</span></span><span class="tag t-${KIND_TONE[e.kind] || 'n'}">${esc(KIND_L[e.kind] || e.kind)}</span></a>`).join('')}</div>` : ''}`;
};
function homeDueCard() {
  const due = (ST.tasks || []).filter(t => !t.done && t.due <= today() && t.assignee === ST.user.id);
  return `<section class="h-sec"><h2>${due.some(t => t.due < today()) ? 'Fällig' : 'Heute fällig'}</h2><a href="#/aufgaben">Alle</a></section>
    <div class="glist due-l">${due.length ? due.slice(0, 6).map(taskRow).join('') : `<div class="grow empty-g"><span class="gic ok">${ic('aufgabe', 16)}</span><span class="gmain"><b>Alles erledigt</b><span>Neue Wiedervorlagen beim Kunden oder unter Aufgaben</span></span></div>`}</div>`;
}

/* ---------- PC-Dashboard: Raster über die volle Breite ---------- */
function homeDesk(crm, first, apps) {
  const h = new Date().getHours(), hi = h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend', D = crm ? ST.dash : null;
  const head = `<header class="dk-head"><div><div class="h-date"><i></i>${esc(homeDate())}</div><h1 class="dk-title">${hi}, ${first}</h1></div>
    <div class="dk-act">${crm ? kdBtn() : apps.map(a => `<a class="dk-app" href="${esc(a.url)}">${appIcon(a.key)}<span>${esc(a.name)}</span></a>`).join('')}</div></header>`;
  const konto = `<div class="dkc dk-s12 dk-konto"><div class="dkc-h"><h3>Konto</h3></div><div class="dk-kr"><span class="av sm">${esc(ST.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span><span class="gmain"><b>${esc(ST.user.name)}</b><span class="muted small">${esc(ST.user.email)} · ${esc(ST.user.roleName)}</span></span>
      <details class="pwbox"><summary class="btn s sm">${ic('key', 16)}Passwort ändern</summary><form id="f-pw2" class="form-grid"><label>Bisheriges Passwort<input name="old" type="password" autocomplete="current-password" required></label><label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required></label><label>Wiederholen<input name="new2" type="password" autocomplete="new-password" required></label><div><button class="btn" type="submit" style="margin-top:12px">Speichern</button></div></form></details>
      <details class="pwbox" data-um="1"><summary class="btn s sm">${ic('mail', 16)}Eigenes E-Mail-Postfach</summary><div class="um-box"></div></details><details class="pwbox" data-sig="1"><summary class="btn s sm">${ic('edit', 16)}Meine E-Mail-Signatur</summary><div class="sig-box"></div></details></div></div>`;
  if (!D) return `${head}<div class="dk">${crm ? `<div class="dkc dk-s12">${homeDueCard()}</div>` : ''}${konto}</div>`;
  const k = D.kpi, S = D.series || [], y = D.year, chg = D.wonPrevSame > 0 ? Math.round((D.wonYear - D.wonPrevSame) / D.wonPrevSame * 100) : null;
  const st = D.stages.filter(x => x.key !== 'verloren'), tot = st.reduce((a, x) => a + x.n, 0) || 1, lost = (D.stages.find(x => x.key === 'verloren') || {}).n || 0;
  const due = (ST.tasks || []).filter(t => !t.done && t.due <= today() && t.assignee === ST.user.id);
  const kpi = (l, v, sub, href, cls = '') => `<a class="dkc dk-s3 dk-kpi ${cls}" href="${href}"><span class="dk-l">${l}</span><b>${v}</b><span class="dk-sub">${sub}</span></a>`;
  return `${head}<div class="dk">
    ${kpi(`Auftragsvolumen ${y}`, eur0(D.wonYear), chg !== null ? `<span class="chg ${chg >= 0 ? 'up' : 'dn'}">${chg >= 0 ? '+' : ''}${chg} %</span> ggü. ${+y - 1}` : `${k.wonMonth} Auftr${k.wonMonth === 1 ? 'ag' : 'äge'} diesen Monat`, '#/kunden')}
    ${kpi('Offene Angebote', eur0(k.offersSum), `${k.offers} Angebot${k.offers === 1 ? '' : 'e'} in Arbeit`, '#/kunden')}
    ${kpi('Abschlussquote', k.rate === null ? '–' : k.rate + ' %', k.decided ? `aus ${k.decided} Entscheidungen` : 'noch keine Entscheidungen', '#/kunden')}
    ${kpi('Wiedervorlagen', k.overdue ? k.overdue + ' überfällig' : k.dueToday ? k.dueToday + ' heute' : 'Alles erledigt', k.dueToday && k.overdue ? `${k.dueToday} heute fällig` : 'Meine Aufgaben', '#/aufgaben', k.overdue ? 'bad' : '')}
    ${D.vacReq ? `<a class="dkc dk-s12 dk-banner" href="stempel/#/einstellungen/team"><span class="bdot"></span><b>${D.vacReq} Urlaubsantrag${D.vacReq === 1 ? '' : 'e'} offen</b><span class="muted">Genehmigen in der Stempeluhr</span>${ic('next', 16)}</a>` : ''}
    <div class="dkc dk-s8"><div class="dkc-h"><h3>Auftragsvolumen je Monat</h3><span class="muted small">letzte 12 Monate</span></div><div class="hbars dk-bars">${S.length ? revBars(S, 620, 210) : ''}</div></div>
    <div class="dkc dk-s4 dk-due"><div class="dkc-h"><h3>${due.some(t => t.due < today()) ? 'Fällig' : 'Heute fällig'}</h3><a href="#/aufgaben">Alle</a></div>
      <div class="glist due-l">${due.length ? due.slice(0, 7).map(taskRow).join('') : `<div class="grow empty-g"><span class="gic ok">${ic('aufgabe', 16)}</span><span class="gmain"><b>Alles erledigt</b><span>Neue Wiedervorlagen beim Kunden oder unter Aufgaben</span></span></div>`}</div></div>
    <div class="dkc dk-s12"><div class="dkc-h"><h3>Pipeline</h3><span class="muted small">${tot} aktive Kunden${lost ? ` · ${lost} verloren` : ''}</span></div>
      <div class="dk-pipe">${st.map(x => `<a class="dk-st" href="#/kunden" data-a="crm-go-stage" data-v="${x.key}" style="--c:${STG_C[x.key]}"><span class="dk-stl"><i></i>${STG_L[x.key]}</span><b>${x.n}</b><span class="muted small">${x.sum ? euro(x.sum) : '–'}</span><span class="dk-stb"><i style="width:${Math.round(x.n / tot * 100)}%"></i></span></a>`).join('')}</div></div>
    <div class="dkc dk-s7"><div class="dkc-h"><h3>Angebote und Aufträge</h3><span class="leg"><i class="la"></i>Aufträge <i class="lb"></i>Neue Angebote</span></div>${S.length ? lineChart(S) : ''}</div>
    <div class="dkc dk-s5"><div class="dkc-h"><h3>Aktivität im Team</h3><span class="muted small">letzte Wochen</span></div>${heatMap(D.heat || [])}</div>
    <div class="dkc ${D.all && D.team.length ? 'dk-s7' : 'dk-s12'}"><div class="dkc-h"><h3>Letzte Aktivitäten</h3><a href="#/kunden">Kunden</a></div>
      ${D.recent.length ? `<div class="glist">${D.recent.slice(0, 6).map(e => `<a class="grow" href="#/kunde/${esc(e.project)}"><span class="gic">${ic(e.kind, 16)}</span><span class="gmain"><b>${esc(e.projectName)}</b><span>${esc(e.text.length > 90 ? e.text.slice(0, 90) + ' …' : e.text)}</span></span><span class="tag t-${KIND_TONE[e.kind] || 'n'}">${esc(KIND_L[e.kind] || e.kind)}</span></a>`).join('')}</div>` : '<p class="muted">Noch keine Aktivitäten.</p>'}</div>
    ${D.all && D.team.length ? `<div class="dkc dk-s5"><div class="dkc-h"><h3>Team</h3><a href="stempel/#/einstellungen/auswertung">Stunden</a></div>
      <table class="dk-tbl"><thead><tr><th>Name</th><th>Kunden</th><th>Aufträge</th><th>7 Tage</th><th>Überfällig</th></tr></thead><tbody>${D.team.map(t => `<tr><td><span class="dk-tn"><span class="av sm">${esc(t.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase())}</span>${esc(t.name)}</span></td><td>${t.active}</td><td>${t.won}</td><td>${t.acts}</td><td class="${t.overdue ? 'bad' : ''}">${t.overdue || '–'}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${konto}
  </div>`;
}

/* ---------- Eigenes E-Mail-Postfach (Absender für Kunden-Mails) ---------- */
const UM_PRESETS = { m365: ['Outlook / Microsoft 365 (Firma)', 'smtp.office365.com', 587, 'tls'], outlook: ['Outlook.com / Hotmail (privat)', 'smtp-mail.outlook.com', 587, 'tls'], ionos: ['IONOS', 'smtp.ionos.de', 587, 'tls'], gmail: ['Gmail (App-Passwort)', 'smtp.gmail.com', 587, 'tls'], eigen: ['Eigener Server', '', 587, 'tls'] };
function umHTML(u) {
  const pre = Object.entries(UM_PRESETS).find(([, x]) => x[1] && x[1] === u.host); const k = pre ? pre[0] : (u.on ? 'eigen' : 'm365'), P = UM_PRESETS[k];
  return `<form id="f-um" class="form-grid um-f" autocomplete="off">
    <p class="muted small" style="grid-column:1/-1;margin:0">${u.on ? `Aktiv: E-Mails an Kunden gehen von <b>${esc(u.from)}</b> raus.` : 'Noch nicht eingetragen – E-Mails an Kunden gehen über das Firmenpostfach, Antworten an deine Adresse.'}</p>
    <label style="grid-column:1/-1">Anbieter<select name="preset">${Object.entries(UM_PRESETS).map(([key, x]) => `<option value="${key}" ${key === k ? 'selected' : ''}>${x[0]}</option>`).join('')}</select></label>
    <label>Absender-Adresse<input name="from" type="email" value="${esc(u.from || ST.user.email)}" required></label><label>Anzeigename<input name="name" value="${esc(u.name || ST.user.name)}"></label>
    <label>Mailserver (SMTP)<input name="host" value="${esc(u.host || P[1])}" placeholder="smtp.office365.com" required></label><label>Port<input name="port" inputmode="numeric" value="${u.port || P[2]}"></label>
    <label>Verschlüsselung<select name="enc"><option value="tls" ${(u.enc || P[3]) === 'tls' ? 'selected' : ''}>STARTTLS (587)</option><option value="ssl" ${(u.enc || P[3]) === 'ssl' ? 'selected' : ''}>SSL (465)</option></select></label><label>Benutzername<input name="user" value="${esc(u.user || '')}" placeholder="leer = Absender-Adresse"></label>
    <label style="grid-column:1/-1">Passwort bzw. App-Passwort<input name="pass" type="password" autocomplete="new-password" placeholder="${u.hasPass ? '•••••••• (gespeichert – leer lassen zum Behalten)' : ''}"></label>
    <p class="muted small" style="grid-column:1/-1;margin:0">Microsoft 365: Die „SMTP-Authentifizierung“ muss für das Postfach erlaubt sein (Admin-Center). Mit Zwei-Faktor-Anmeldung ein App-Passwort verwenden. Das Passwort wird verschlüsselt auf dem Server gespeichert.</p>
    <div class="row" style="grid-column:1/-1;margin-top:6px"><button class="btn" type="submit">${ic('check', 16)}Speichern</button>${u.on ? `<button class="btn s" type="button" data-a="um-test">Testmail an mich</button><button class="btn g danger" type="button" data-a="um-off">Entfernen</button>` : ''}</div></form>`;
}
document.addEventListener('toggle', async e => { const d = e.target; if (!(d.dataset && d.dataset.um && d.open)) return; const box = d.querySelector('.um-box'); box.innerHTML = '<p class="muted small">Lädt …</p>'; try { box.innerHTML = umHTML(await api('umail')); } catch (err) { box.innerHTML = `<p class="note err">${esc(err.message)}</p>`; } }, true);
document.addEventListener('change', e => { const el = e.target; if (el.name === 'preset' && el.closest('#f-um')) { const P = UM_PRESETS[el.value], f = el.form; if (P[1]) f.host.value = P[1]; f.port.value = P[2]; f.enc.value = P[3]; } });
document.addEventListener('submit', async e => { if (e.target.id !== 'f-um') return; e.preventDefault(); const f = e.target; try { const u = await api('umail', { from: f.from.value, name: f.name.value, host: f.host.value, port: +f.port.value, enc: f.enc.value, user: f.user.value, pass: f.pass.value }); f.closest('.um-box').innerHTML = umHTML(u); toast('Postfach gespeichert – jetzt am besten „Testmail an mich“.'); } catch (err) { toast(err.message); } });
document.addEventListener('click', async e => { const a = e.target.closest && e.target.closest('[data-a="um-test"],[data-a="um-off"]'); if (!a) return; e.preventDefault(); e.stopImmediatePropagation();
  try { if (a.dataset.a === 'um-test') { a.disabled = true; a.textContent = 'Wird gesendet …'; const j = await api('umail-test', {}); toast(`Testmail von ${j.from} an ${j.to} gesendet.`); a.disabled = false; a.textContent = 'Testmail an mich'; }
    else { if (!confirm('Eigenes Postfach entfernen?')) return; const u = await api('umail', { remove: true }); a.closest('.um-box').innerHTML = umHTML(u); toast('Entfernt.'); } } catch (err) { toast(err.message); a.disabled = false; a.textContent = 'Testmail an mich'; } }, true);

/* Eigene E-Mail-Signatur (leer = Firmen-Signatur) */
document.addEventListener('toggle', async e => { const d = e.target; if (!(d.dataset && d.dataset.sig && d.open)) return; const box = d.querySelector('.sig-box'); box.innerHTML = '<p class="muted small">Lädt …</p>';
  try { const c = await api('mail-cfg'); box.innerHTML = `<form id="f-sig" style="padding:10px 4px 4px"><p class="muted small" style="margin:0 0 6px">Wird automatisch unter jede E-Mail an Kunden gesetzt. Leer lassen = Firmen-Signatur. Platzhalter: {Name}, {E-Mail}.</p><textarea name="text" rows="6" placeholder="${esc(c.sig.company)}">${esc(c.sig.own)}</textarea><button class="btn" type="submit" style="margin-top:8px">Signatur speichern</button></form>`; }
  catch (err) { box.innerHTML = `<p class="note err">${esc(err.message)}</p>`; } }, true);
document.addEventListener('submit', async e => { if (e.target.id !== 'f-sig') return; e.preventDefault(); try { await api('mail-sig', { text: e.target.text.value }); toast('Signatur gespeichert.'); } catch (err) { toast(err.message); } });
