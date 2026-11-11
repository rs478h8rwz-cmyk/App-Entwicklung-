/* lumbra.desk – Startseite im Stil einer iPhone-App
   Datum mit Sonnenpunkt, große Überschrift „Heute“, App-Symbole wie auf dem Home-Bildschirm,
   Kennzahlen als Widgets, darunter gruppierte Listen (Pipeline, Fällig, Team, Aktivitäten, Konto). */
'use strict';
const APP_LOOK = {
  calc: { cls: 'ai-sun', glyph: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>' },
  stempel: { cls: 'ai-ink', glyph: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.4 1.6M9.5 2.8h5"/>' },
  abnahme: { cls: 'ai-leaf', glyph: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v2.5H9zM8.8 13.2l2.2 2.2 4.4-4.6"/>' }
};
const appIcon = key => { const a = APP_LOOK[key] || APP_LOOK.calc; return `<span class="ai ${a.cls}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${a.glyph}</svg></span>`; };
const homeDate = () => new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

viewHome = function () {
  const crm = typeof isCrm === 'function' && isCrm(), first = esc(ST.user.name.split(' ')[0]);
  const apps = ST.apps.filter(a => a.url);
  return `<section class="h-top"><div class="h-date"><i></i>${esc(homeDate())}</div><h1 class="h-title">${crm ? 'Heute' : 'Hallo ' + first}</h1></section>
    <section class="h-apps">${apps.map(a => `<a class="app" href="${esc(a.url)}">${appIcon(a.key)}<span class="app-l">${esc(a.name)}</span></a>`).join('') || '<p class="muted">Für deine Rolle sind noch keine Apps freigeschaltet.</p>'}</section>
    ${crm ? homeCrm() : ''}
    <section class="h-sec"><h2>Konto</h2></section>
    <div class="glist">
      <div class="grow who"><span class="av">${esc(ST.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span><div class="gmain"><b>${esc(ST.user.name)}</b><span>${esc(ST.user.email)} · ${esc(ST.user.roleName)}</span></div></div>
      <details class="pwbox grow-d"><summary class="grow">${ic('key', 18)}<span class="gmain">Passwort ändern</span>${ic('next', 16)}</summary>
        <form id="f-pw2" class="form-grid"><label>Bisheriges Passwort<input name="old" type="password" autocomplete="current-password" required></label><label>Neues Passwort<input name="new" type="password" autocomplete="new-password" required></label><label>Wiederholen<input name="new2" type="password" autocomplete="new-password" required></label><div><button class="btn" type="submit" style="margin-top:12px">Passwort ändern</button></div></form></details>
      <button class="grow g-danger" data-a="logout">${ic('out', 18)}<span class="gmain">Abmelden</span></button>
    </div>`;
};

homeCrm = function () {
  const D = ST.dash; if (!D) return homeDueCard();
  const k = D.kpi, mName = new Date(D.month + '-01T12:00').toLocaleDateString('de-DE', { month: 'long' });
  const w = (label, val, sub, href, cls = '') => `<a class="wdg ${cls}" href="${href}"><span class="wl">${label}</span><b class="wv">${val}</b><span class="ws">${sub}</span></a>`;
  const st = D.stages.filter(s => s.key !== 'verloren'), max = Math.max(1, ...st.map(s => s.n)), lost = (D.stages.find(s => s.key === 'verloren') || {}).n || 0;
  return `<section class="h-sec"><h2>Auf einen Blick</h2></section>
    <div class="wgrid">
      ${w('Offene Angebote', k.offers, k.offersSum ? euro(k.offersSum) : 'ohne Summe', '#/kunden')}
      ${w('Aufträge ' + esc(mName), k.wonMonth, k.wonMonthSum ? euro(k.wonMonthSum) : 'noch keine', '#/kunden')}
      ${w('Abschlussquote', k.rate === null ? '–' : k.rate + ' %', k.decided ? `aus ${k.decided} Entscheidungen` : 'noch offen', '#/kunden')}
      ${w('Überfällig', k.overdue, k.dueToday ? `${k.dueToday} heute fällig` : 'Wiedervorlagen', '#/aufgaben', k.overdue ? 'bad' : '')}
    </div>
    ${D.vacReq ? `<a class="glist banner" href="stempel/#/einstellungen/team"><span class="grow"><span class="bdot"></span><span class="gmain"><b>${D.vacReq} Urlaubsantrag${D.vacReq === 1 ? '' : 'e'} offen</b><span>Genehmigen in der Stempeluhr</span></span>${ic('next', 16)}</span></a>` : ''}
    <div class="h-2col">
      <div><section class="h-sec"><h2>Pipeline</h2><a href="#/kunden" data-a="crm-go-pipe">Alle</a></section>
        <div class="glist pipe-l">${st.map(s => `<a class="grow prow" href="#/kunden" data-a="crm-go-stage" data-v="${s.key}"><span class="pl">${STG_L[s.key]}</span><span class="pb"><i style="width:${s.n ? Math.max(4, s.n / max * 100) : 0}%"></i></span><span class="pn">${s.n}</span><span class="ps">${s.sum ? euro(s.sum) : ''}</span></a>`).join('')}
          ${lost ? `<div class="grow foot">Verloren: ${lost}</div>` : ''}</div></div>
      <div>${homeDueCard()}</div>
    </div>
    ${D.all && D.team.length ? `<section class="h-sec"><h2>Team</h2><a href="stempel/#/einstellungen/auswertung">Stunden-Auswertung</a></section>
      <div class="glist">${D.team.map(t => `<div class="grow trow"><span class="av sm">${esc(t.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase())}</span><span class="gmain"><b>${esc(t.name)}</b><span>${t.active} aktive Kunden${t.offers ? ' · ' + euro(t.offers) + ' Angebote' : ''}</span></span><span class="tk"><b>${t.won}</b><span>Aufträge</span></span><span class="tk"><b>${t.acts}</b><span>7 Tage</span></span>${t.overdue ? `<span class="tk bad"><b>${t.overdue}</b><span>überfällig</span></span>` : ''}</div>`).join('')}</div>` : ''}
    ${D.recent.length ? `<section class="h-sec"><h2>Letzte Aktivitäten</h2></section><div class="glist">${D.recent.slice(0, 6).map(e => `<a class="grow" href="#/kunde/${esc(e.project)}"><span class="gic">${ic(e.kind, 16)}</span><span class="gmain"><b>${esc(e.projectName)}</b><span>${esc(KIND_L[e.kind] || e.kind)} · ${esc(e.text.length > 70 ? e.text.slice(0, 70) + ' …' : e.text)}</span></span><span class="gmeta">${esc(ago(e.at))}</span></a>`).join('')}</div>` : ''}`;
};
function homeDueCard() {
  const due = (ST.tasks || []).filter(t => !t.done && t.due <= today() && t.assignee === ST.user.id);
  return `<section class="h-sec"><h2>${due.some(t => t.due < today()) ? 'Fällig' : 'Heute fällig'}</h2><a href="#/aufgaben">Alle</a></section>
    <div class="glist due-l">${due.length ? due.slice(0, 6).map(taskRow).join('') : `<div class="grow empty-g"><span class="gic ok">${ic('aufgabe', 16)}</span><span class="gmain"><b>Alles erledigt</b><span>Neue Wiedervorlagen beim Kunden oder unter Aufgaben</span></span></div>`}</div>`;
}
