/* LumbraDesk – CRM: Kunden-Übersicht (Liste + Pipeline), Kundenseite mit Logbuch und Wiedervorlagen, Aufgaben */
'use strict';
Object.assign(IC, {
  kunden: '<path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>',
  aufgaben: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 15l2.5 2.5L15 13"/>',
  mehr: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  notiz: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  anruf: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  termin: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  stufe: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  zuweisung: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  protokoll: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
  aufgabe: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
});
const CRM_ROLES = ['admin', 'buero', 'vertrieb'];
const isCrm = () => ST.user && CRM_ROLES.includes(ST.user.role);
const STG = ['anfrage', 'termin', 'angebot', 'auftrag', 'montage', 'fertig', 'verloren'];
const STG_L = { anfrage: 'Anfrage', termin: 'Termin', angebot: 'Angebot', auftrag: 'Auftrag', montage: 'Montage', fertig: 'Abgeschlossen', verloren: 'Verloren' };
const STG_C = { anfrage: '#7A8692', termin: '#5B8DEF', angebot: '#F5A524', auftrag: '#0E7C66', montage: '#8B5CF6', fertig: '#2F9E44', verloren: '#C2412A' };
const TYPE_L = { pv: 'PV', wp: 'Wärmepumpe', pvwp: 'PV + WP', speicher: 'Speicher', wb: 'Wallbox' };
const KIND_L = { protokoll: 'Protokoll', notiz: 'Notiz', anruf: 'Anruf', termin: 'Termin', email: 'E-Mail', stufe: 'Stufe geändert', zuweisung: 'Zuweisung', aufgabe: 'Wiedervorlage' };
const CR = { ment: new Set(), scope: 'meine', adv: '', stage: '', q: '', mode: 'liste', tscope: 'meine', kind: 'notiz', archiv: false };
try { Object.assign(CR, JSON.parse(localStorage.getItem('ld-crm') || '{}'), { q: '' }); } catch (e) {}
const crSave = () => { try { localStorage.setItem('ld-crm', JSON.stringify({ scope: CR.scope, adv: CR.adv, mode: CR.mode, tscope: CR.tscope })); } catch (e) {} };

/* ---------- Hilfen ---------- */
const pad = n => String(n).padStart(2, '0');
const isoDay = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => isoDay(new Date());
const plusDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoDay(d); };
const deDay = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
const dueLabel = s => { const t = today(); if (s < t) return 'überfällig · ' + deDay(s); if (s === t) return 'heute'; if (s === plusDays(1)) return 'morgen'; return deDay(s); };
const dueCls = s => s < today() ? 'r' : s === today() ? 'y' : '';
const euro = n => n ? Math.round(n).toLocaleString('de-DE') + ' €' : '';
const ago = s => { if (!s) return ''; const m = (Date.now() - utc(s)) / 6e4; if (m < 2) return 'gerade eben'; if (m < 60) return `vor ${Math.round(m)} Min.`; if (m < 1440) return `vor ${Math.round(m / 60)} Std.`; const d = Math.round(m / 1440); return d === 1 ? 'gestern' : d < 30 ? `vor ${d} Tagen` : utc(s).toLocaleDateString('de-DE'); };
const stageBadge = s => `<span class="stg" style="--c:${STG_C[s]}"><i></i>${STG_L[s] || s}</span>`;
const localNow = () => { const d = new Date(); return isoDay(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const toUtc = v => { const d = new Date(v); return isNaN(d) ? '' : d.toISOString().slice(0, 16).replace('T', ' '); };
const teamSel = (name, cur, cls = '') => `<select name="${name}" class="${cls}">${(ST.team || []).map(u => `<option value="${u.id}" ${u.id === cur ? 'selected' : ''}>${u.id === ST.user.id ? 'Ich' : esc(u.name)}</option>`).join('')}</select>`;
const rechnerUrl = c => `rechner/#/projekt/${encodeURIComponent(c.id)}/${c.step || 1}`;

/* ---------- Kunden-Übersicht ---------- */
function crmFiltered() {
  const me = ST.user.id, q = CR.q.trim().toLowerCase();
  return (ST.crm || []).filter(c => {
    if (CR.scope === 'meine' && c.owner !== me) return false;
    if (CR.scope === 'zugewiesen' && !(c.owner === me && c.assignedBy && c.assignedBy !== me)) return false;
    if (CR.scope === 'abgegeben' && !(c.by === me && c.owner !== me)) return false;
    if (CR.scope === 'alle' && CR.adv && c.owner !== +CR.adv) return false;
    if (!CR.archiv && c.archived) return false;
    if (q && !`${c.name} ${c.city} ${c.zip} ${c.street} ${c.phone} ${c.email} ${c.offerNo} ${c.kdnr}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
function viewKunden() {
  const me = ST.user.id, all = ST.crmAll, list = ST.crm || [];
  const nZu = list.filter(c => c.owner === me && c.assignedBy && c.assignedBy !== me).length, nAb = list.filter(c => c.by === me && c.owner !== me).length;
  const scopes = [['meine', 'Meine'], ['zugewiesen', 'Mir zugewiesen' + (nZu ? ` · ${nZu}` : '')], ...(nAb ? [['abgegeben', 'Abgegeben · ' + nAb]] : []), ['alle', all ? 'Alle' : 'Alle sichtbaren']];
  return `<section class="hero kd-hero"><div><h1>Kunden</h1><p class="muted">Alle Kunden – mit Kundennummer, Vertriebs-Stufe, Logbuch und Wiedervorlagen.</p></div>${kdBtn()}</section>
    <div class="crm-bar">
      <div class="srch">${ic('search', 18)}<input id="crm-q" type="search" placeholder="Name, Kundennr., Ort, Telefon, Angebots-Nr. …" value="${esc(CR.q)}" autocomplete="off"></div>
      <div class="seg" role="tablist">${[['liste', 'Liste'], ['pipeline', 'Pipeline']].map(([k, l]) => `<button class="${CR.mode === k ? 'on' : ''}" data-a="crm-mode" data-v="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="chips">${scopes.map(([k, l]) => `<button class="chip ${CR.scope === k ? 'on' : ''}" data-a="crm-scope" data-v="${k}">${l}</button>`).join('')}
      ${all && CR.scope === 'alle' ? `<select id="crm-adv" class="chip-sel"><option value="">Alle Berater</option>${(ST.team || []).map(u => `<option value="${u.id}" ${+CR.adv === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>` : ''}
      ${list.some(c => c.archived) ? `<button class="chip ${CR.archiv ? 'on' : ''}" data-a="crm-archiv">Archiv zeigen</button>` : ''}</div>
    <div id="crm-res">${crmResults()}</div>`;
}
function crmResults() {
  const rows = crmFiltered();
  if (!(ST.crm || []).length) return `<div class="card empty"><b>Noch keine Kunden auf dem Server.</b><p class="muted">Kunden legst du wie gewohnt in der Wirtschaftlichkeit an – sie erscheinen hier automatisch nach dem Abgleich.</p><a class="btn" href="rechner/">Wirtschaftlichkeit öffnen</a></div>`;
  return CR.mode === 'pipeline' ? crmPipeline(rows) : crmList(rows);
}
function crmList(rows) {
  const cnt = Object.fromEntries(STG.map(s => [s, rows.filter(c => c.stage === s).length]));
  const shown = CR.stage ? rows.filter(c => c.stage === CR.stage) : rows;
  shown.sort((a, b) => (a.nextDue || '9999').localeCompare(b.nextDue || '9999') || (b.last || b.upd || '').localeCompare(a.last || a.upd || ''));
  return `<div class="chips stg-chips"><button class="chip ${!CR.stage ? 'on' : ''}" data-a="crm-stage-f" data-v="">Alle · ${rows.length}</button>${STG.filter(s => cnt[s]).map(s => `<button class="chip ${CR.stage === s ? 'on' : ''}" data-a="crm-stage-f" data-v="${s}"><i class="dot" style="background:${STG_C[s]}"></i>${STG_L[s]} · ${cnt[s]}</button>`).join('')}</div>
    ${!shown.length ? '<p class="muted" style="padding:20px 4px">Keine Kunden für diese Auswahl.</p>' : typeof isDesk === 'function' && isDesk() ? crmTable(shown) : `<div class="card clist">${shown.map(crmRow).join('')}</div>`}`;
}
/* PC-Ansicht: Tabelle mit allen wichtigen Spalten */
function crmTable(rows) {
  return `<div class="card dk-ctbl"><table><thead><tr><th>Nr.</th><th>Kunde</th><th>Ort</th><th>Stufe</th><th>Art</th><th>Zuständig</th><th class="r">Volumen</th><th>Wiedervorlage</th><th>Zuletzt</th></tr></thead><tbody>
    ${rows.map(c => `<tr data-href="#/kunde/${esc(c.id)}"><td class="kd-nr">${c.kdnr ? esc(c.kdnr) : '<span class="muted">–</span>'}</td><td><a href="#/kunde/${esc(c.id)}"><b>${esc(c.name)}</b></a>${c.archived ? ' <span class="badge">Archiv</span>' : ''}</td><td class="muted">${esc([c.zip, c.city].filter(Boolean).join(' ') || '–')}</td><td>${stageBadge(c.stage)}</td><td>${c.type ? `<span class="badge">${esc(TYPE_L[c.type] || c.type)}</span>` : '–'}</td><td>${esc(c.ownerName || '')}</td><td class="r">${c.total ? euro(c.total) : '–'}</td><td>${c.nextDue ? `<span class="due ${dueCls(c.nextDue)}">${ic('aufgaben', 14)}${dueLabel(c.nextDue)}</span>` : '<span class="muted">–</span>'}</td><td class="muted">${esc(ago(c.last || c.upd))}</td></tr>`).join('')}</tbody></table></div>`;
}
document.addEventListener('click', e => { const tr = e.target.closest && e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href; });
function crmRow(c) {
  return `<a class="crow" href="#/kunde/${esc(c.id)}"><div class="cmain"><b>${esc(c.name)}</b><span class="muted">${esc([c.zip, c.city].filter(Boolean).join(' ') || 'Ort fehlt')}${c.total ? ' · ' + euro(c.total) : ''}</span>
    <div class="cmeta">${kdBadge(c)}${stageBadge(c.stage)}${c.type ? `<span class="badge">${esc(TYPE_L[c.type] || c.type)}</span>` : ''}${ST.user.id !== c.owner ? `<span class="badge">${esc(c.ownerName)}</span>` : ''}${c.archived ? '<span class="badge">Archiv</span>' : ''}</div></div>
    <div class="cside">${c.nextDue ? `<span class="due ${dueCls(c.nextDue)}">${ic('aufgaben', 14)}${dueLabel(c.nextDue)}</span>` : ''}<span class="muted small">${esc(ago(c.last || c.upd))}</span></div>${ic('next', 18)}</a>`;
}
function crmPipeline(rows) {
  return `<div class="pipe">${STG.map(s => {
    const col = rows.filter(c => c.stage === s), sum = col.reduce((a, c) => a + (c.total || 0), 0);
    return `<div class="pcol"><div class="phead"><span class="stg" style="--c:${STG_C[s]}"><i></i>${STG_L[s]}</span><span class="muted small">${col.length}${sum ? ' · ' + euro(sum) : ''}</span></div>
      ${col.map(c => `<div class="pcard"><a href="#/kunde/${esc(c.id)}"><b>${esc(c.name)}</b><span class="muted small">${esc(c.city || '')}${c.total ? ' · ' + euro(c.total) : ''}</span>${c.nextDue ? `<span class="due ${dueCls(c.nextDue)}">${ic('aufgaben', 13)}${dueLabel(c.nextDue)}</span>` : ''}${ST.user.id !== c.owner ? `<span class="muted small">${esc(c.ownerName)}</span>` : ''}</a>
        ${s !== 'fertig' && s !== 'verloren' ? `<button class="btn g sm pnext" data-a="crm-adv-stage" data-id="${esc(c.id)}" data-v="${STG[STG.indexOf(s) + 1]}" title="Weiter zu ${STG_L[STG[STG.indexOf(s) + 1]]}">${STG_L[STG[STG.indexOf(s) + 1]]} ${ic('next', 14)}</button>` : ''}</div>`).join('') || '<p class="muted small" style="padding:6px 2px">–</p>'}</div>`;
  }).join('')}</div>`;
}

/* ---------- Kundenseite ---------- */
function viewKunde() {
  const D = ST.cd; if (!D) return `<p class="muted" style="padding:30px 0">Kunde nicht gefunden.</p>`;
  const c = D.customer, open = D.tasks.filter(t => !t.done), done = D.tasks.filter(t => t.done);
  const addr = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const cur = STG.indexOf(c.stage);
  return `<a class="backl" href="#/kunden">${ic('back', 18)}Kunden</a>
    <section class="hero" style="padding-top:8px"><h1>${esc(c.name)}</h1><div class="cmeta" style="margin-top:10px">${c.kdnr ? kdBadge(c) : `<button class="badge kd-set" data-a="kd-assign">${ic('plus', 12)}Kundennummer vergeben</button>`}${stageBadge(c.stage)}${c.type ? `<span class="badge">${esc(TYPE_L[c.type] || c.type)}</span>` : ''}<span class="badge">Zuständig: ${esc(c.ownerName)}</span>${c.archived ? '<span class="badge">Archiv</span>' : ''}</div></section>
    <div class="kgrid">
      <div class="kcol">
        <div class="card"><div class="contact">
          ${addr ? `<a href="https://maps.apple.com/?q=${encodeURIComponent(addr)}" target="_blank" rel="noopener">${ic('pin', 18)}<span>${esc(addr)}</span></a>` : `<span class="muted">${ic('pin', 18)}<span>Keine Adresse hinterlegt</span></span>`}
          ${c.phone ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${ic('phone', 18)}<span>${esc(c.phone)}</span></a>` : ''}
          ${c.email ? `<a href="mailto:${esc(c.email)}">${ic('mail', 18)}<span>${esc(c.email)}</span></a>` : ''}
          ${c.total || c.offerNo ? `<span>${ic('calc', 18)}<span>Angebot${c.offerNo ? ' ' + esc(c.offerNo) : ''}${c.total ? ' · <b>' + euro(c.total) + '</b>' : ''}</span></span>` : ''}
        </div><a class="btn s" style="width:100%;margin-top:14px" href="${rechnerUrl(c)}">${ic('calc', 18)}In der Wirtschaftlichkeit öffnen</a>
        <p class="muted small" style="margin:10px 0 0">Kontaktdaten und Angebot änderst du in der Wirtschaftlichkeit.${c.created ? ' Angelegt ' + utc(c.created).toLocaleDateString('de-DE') + ' von ' + esc(c.byName) + '.' : ''}</p></div>

        <div class="card sec"><h2>Vertriebs-Stufe</h2>
          <div class="steps">${STG.slice(0, 6).map((s, i) => `<button class="step ${s === c.stage ? 'on' : i < cur && c.stage !== 'verloren' ? 'past' : ''}" style="--c:${STG_C[s]}" data-a="crm-set-stage" data-v="${s}"><i></i><span>${STG_L[s]}</span></button>`).join('')}</div>
          <div class="row" style="margin-top:12px">${c.stage === 'verloren' ? `<span class="muted small">Als verloren markiert.</span><button class="btn g sm" data-a="crm-set-stage" data-v="anfrage">Wieder aufnehmen</button>` : `<button class="btn g sm danger" data-a="crm-set-stage" data-v="verloren">Als verloren markieren</button>`}</div>
          <p class="muted small" style="margin:8px 0 0">Tippe auf eine Stufe, um sie zu setzen. Wird später in der Wirtschaftlichkeit „Gesendet“ oder „Unterschrieben“ gewählt, rückt die Stufe automatisch mit.</p></div>

        ${typeof offerCard === 'function' ? offerCard() : ''}
        <div class="card sec"><div class="of-head"><h2>Zählerschrank</h2><a class="btn sm" href="#/zaehler/neu/${esc(c.id)}">${ic('zaehler', 16)}Check starten</a></div><div id="k-zs"><p class="muted small" style="margin:0">Foto aufnehmen und prüfen, ob der Zählerschrank für PV, Wärmepumpe oder Wallbox passt.</p></div></div>
        ${typeof invoiceCard === 'function' ? invoiceCard() : ''}
        <div class="card sec"><h2>Wiedervorlagen</h2>
          ${open.length ? `<div class="tlist">${open.map(taskRow).join('')}</div>` : '<p class="muted">Keine offenen Wiedervorlagen.</p>'}
          ${taskForm(c.id)}
          ${done.length ? `<details class="done-l"><summary>${done.length} erledigt</summary><div class="tlist">${done.map(taskRow).join('')}</div></details>` : ''}</div>
        ${typeof protCard === 'function' ? protCard() : ''}
        ${hoursCard()}
      </div>
      <div class="kcol">
        <div class="card"><h2>Logbuch</h2>
          <form id="f-crm-ev" class="evform">
            <div class="seg kinds">${['notiz', 'anruf', 'termin', 'email'].map(k => `<button type="button" class="${CR.kind === k ? 'on' : ''}" data-a="crm-kind" data-v="${k}">${ic(k, 16)}<span>${KIND_L[k]}</span></button>`).join('')}</div>
            <textarea name="text" rows="3" placeholder="${{ notiz: 'Was gibt es Neues?', anruf: 'Worüber wurde gesprochen?', termin: 'Termin: wo, mit wem, Ergebnis …', email: 'Inhalt der E-Mail kurz zusammengefasst' }[CR.kind]}" required></textarea>
            ${mentionChips()}
            <div class="row"><label class="inl">Wann<input name="at" type="datetime-local" value="${localNow()}"></label><button class="btn" type="submit">Speichern</button></div>
          </form>
          <div class="tl">${D.events.length ? D.events.map(evRow).join('') : '<p class="muted">Noch keine Einträge. Halte hier Gespräche, Termine und Notizen fest – alle Kollegen mit Zugriff sehen sie.</p>'}</div></div>
      </div>
    </div>`;
}
function mentionChips() {
  if (!(ST.features || {}).markieren) return '';
  const ppl = ((ST.cd && ST.cd.people) || []).filter(x => x.id !== ST.user.id); if (!ppl.length) return '';
  return `<div class="ment"><span class="muted small">Markieren – bekommt eine E-Mail:</span><div class="chips">${ppl.map(x => `<button type="button" class="chip ${CR.ment.has(x.id) ? 'on' : ''}" data-a="crm-ment" data-v="${x.id}">@${esc(x.name.split(' ')[0])}</button>`).join('')}</div></div>`;
}
function evRow(e) {
  const mine = e.user === ST.user.id || ST.user.role === 'admin', manual = ['notiz', 'anruf', 'termin', 'email'].includes(e.kind);
  return `<div class="ev ${manual ? '' : 'auto'}"><span class="evi">${ic(e.kind, 16)}</span><div class="evb"><div class="evh"><b>${KIND_L[e.kind] || e.kind}</b><span class="muted small">${utc(e.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${esc(e.userName)}</span>
    ${mine && manual ? `<button class="xbtn" data-a="crm-ev-del" data-id="${e.id}" title="Eintrag löschen" aria-label="Eintrag löschen">${ic('x', 14)}</button>` : ''}</div><div class="evt">${esc(e.text)}</div>${(e.mentions || []).length ? `<div class="evm">${e.mentions.map(m => `<span>@${esc(m.name)}</span>`).join('')}</div>` : ''}</div></div>`;
}
function taskRow(t) {
  return `<div class="task ${t.done ? 'done' : ''}"><button class="chk" data-a="crm-task-done" data-id="${t.id}" data-v="${t.done ? 0 : 1}" aria-label="${t.done ? 'Wieder öffnen' : 'Erledigt'}">${t.done ? ic('aufgabe', 16) : ''}</button>
    <div class="tb"><b>${esc(t.title)}</b><div class="tm">${t.done ? `<span class="muted small">erledigt ${t.doneAt ? utc(t.doneAt).toLocaleDateString('de-DE') : ''}${t.doneByName ? ' von ' + esc(t.doneByName) : ''}</span>` : `<span class="due ${dueCls(t.due)}">${dueLabel(t.due)}</span>`}
      ${t.project && ST.view !== 'kunde' ? `<a class="small" href="#/kunde/${esc(t.project)}">${esc(t.projectName || 'Kunde')}</a>` : ''}${t.assignee !== ST.user.id ? `<span class="muted small">für ${esc(t.assigneeName)}</span>` : t.by !== ST.user.id ? `<span class="muted small">von ${esc(t.byName)}</span>` : ''}</div></div>
    ${t.done ? '' : `<div class="tact"><button class="btn g sm" data-a="crm-task-move" data-id="${t.id}" data-v="1" title="Auf morgen verschieben">+1 Tag</button><button class="btn g sm" data-a="crm-task-move" data-id="${t.id}" data-v="7" title="Eine Woche später">+1 Woche</button></div>`}
    <button class="xbtn" data-a="crm-task-del" data-id="${t.id}" title="Löschen" aria-label="Löschen">${ic('x', 14)}</button></div>`;
}
function taskForm(pid) {
  return `<form id="f-crm-task" class="tform" data-p="${esc(pid || '')}"><input name="title" placeholder="${pid ? 'z. B. Nachfassen wegen Angebot' : 'Was ist zu tun?'}" required maxlength="300">
    ${pid ? '' : `<select name="project"><option value="">Ohne Kunde</option>${(ST.crm || []).filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${esc(c.id)}">${esc(c.name)}${c.city ? ' – ' + esc(c.city) : ''}</option>`).join('')}</select>`}
    <div class="quick">${[[1, 'Morgen'], [3, '3 Tage'], [7, '1 Woche'], [14, '2 Wochen']].map(([n, l]) => `<button type="button" class="chip" data-a="crm-due" data-v="${n}">${l}</button>`).join('')}</div>
    <div class="row"><label class="inl">Fällig am<input name="due" type="date" value="${plusDays(3)}" required></label><label class="inl">Für${teamSel('assignee', ST.user.id)}</label><button class="btn" type="submit">${ic('plus', 18)}Wiedervorlage</button></div></form>`;
}

function hoursCard() {
  const h = ST.hrs; if (!h) return '<div id="k-hrs"></div>';
  const t = m => Math.floor(m / 60) + ':' + String(Math.round(m % 60)).padStart(2, '0');
  return `<div class="card sec" id="k-hrs"><h2>Stunden auf der Baustelle</h2>${h.total ? `<p style="margin:10px 0 4px"><b class="kv" style="font-size:34px">${t(h.total)}</b> <span class="muted">Std.${h.from ? ` · ${deDay(h.from)}${h.to !== h.from ? ' – ' + deDay(h.to) : ''}` : ''}</span></p>
    <div class="tlist">${h.people.map(p => `<div class="task" style="padding:8px 0"><div class="tb">${esc(p.name)}</div><b>${t(p.min)} Std.</b></div>`).join('')}</div>
    <p class="muted small" style="margin:8px 0 0">Aus der Stempeluhr – Baustellen: ${h.sites.map(esc).join(', ')}.</p>` : `<p class="muted">Noch keine Stunden. In der Stempeluhr als Baustelle „${esc(h.key)}${ST.cd && ST.cd.customer.city ? ', ' + esc(ST.cd.customer.city) : ''}“ wählen – laufende Aufträge stehen dort als Vorschlag.</p>`}</div>`;
}

/* ---------- Aufgaben ---------- */
function viewAufgaben() {
  const T = ST.tasks || [], t0 = today(), t1 = plusDays(1), wk = plusDays(7), open = T.filter(t => !t.done);
  const groups = [['Überfällig', open.filter(t => t.due < t0), 'r'], ['Heute', open.filter(t => t.due === t0), 'y'], ['Morgen', open.filter(t => t.due === t1), ''], ['Nächste 7 Tage', open.filter(t => t.due > t1 && t.due <= wk), ''], ['Später', open.filter(t => t.due > wk), ''], ['Erledigt (letzte 14 Tage)', T.filter(t => t.done), 'd']];
  return `<section class="hero"><h1>Aufgaben</h1><p class="muted">Wiedervorlagen für dich und deine Kunden. ${open.filter(t => t.due <= t0).length ? `<b>${open.filter(t => t.due <= t0).length} heute fällig.</b>` : 'Heute ist nichts fällig.'}</p></section>
    ${ST.tasksAll ? `<div class="chips">${[['meine', 'Meine'], ['alle', 'Alle im Team']].map(([k, l]) => `<button class="chip ${CR.tscope === k ? 'on' : ''}" data-a="crm-tscope" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
    <div class="card"><h2>Neue Wiedervorlage</h2>${taskForm('')}</div>
    ${groups.filter(g => g[1].length).map(([l, list, cls]) => cls === 'd' ? `<details class="card sec done-l"><summary><b>${l}</b> · ${list.length}</summary><div class="tlist">${list.map(taskRow).join('')}</div></details>` : `<div class="card sec"><h3 class="gh ${cls}">${l} <span class="muted">· ${list.length}</span></h3><div class="tlist">${list.map(taskRow).join('')}</div></div>`).join('') || '<p class="muted sec">Keine Aufgaben – alles erledigt.</p>'}
    <div class="card sec remind"><label class="sw"><input type="checkbox" id="crm-remind" ${ST.remind ? 'checked' : ''}><span>Morgens per E-Mail an fällige Wiedervorlagen erinnern</span></label><p class="muted small" style="margin:6px 0 0">Kommt einmal am Tag mit der nächtlichen Datensicherung (Cronjob).</p></div>`;
}
/* Startseite: Dashboard */
function homeDash() {
  const D = ST.dash; if (!D) return '';
  const k = D.kpi, mName = new Date(D.month + '-01T12:00').toLocaleDateString('de-DE', { month: 'long' });
  const tile = (label, val, sub, href, cls = '') => `<a class="card kpi ${cls}" href="${href}"><span class="kl">${label}</span><b class="kv">${val}</b><span class="ks">${sub}</span></a>`;
  const st = D.stages.filter(s => s.key !== 'verloren'), max = Math.max(1, ...st.map(s => s.n));
  return `<div class="kpis">
      ${tile('Offene Angebote', k.offers, k.offersSum ? euro(k.offersSum) + ' Volumen' : 'noch ohne Summe', '#/kunden', '')}
      ${tile('Aufträge im ' + mName, k.wonMonth, k.wonMonthSum ? euro(k.wonMonthSum) : 'diesen Monat', '#/kunden', '')}
      ${tile('Abschlussquote', k.rate === null ? '–' : k.rate + ' %', k.decided ? `von ${k.decided} Entscheidungen` : 'noch keine Entscheidungen', '#/kunden', '')}
      ${tile('Überfällig', k.overdue, k.dueToday ? `${k.dueToday} heute fällig` : 'Wiedervorlagen', '#/aufgaben', k.overdue ? 'warn' : '')}
    </div>
    <div class="dgrid sec">
      <div class="card"><div class="row" style="justify-content:space-between"><h2>Pipeline</h2><a class="btn g sm" href="#/kunden" data-a="crm-go-pipe">Öffnen ${ic('next', 16)}</a></div>
        <div class="bars" role="table" aria-label="Kunden je Vertriebs-Stufe">${st.map(s => `<a class="bar" role="row" href="#/kunden" data-a="crm-go-stage" data-v="${s.key}" title="${STG_L[s.key]}: ${s.n} ${s.n === 1 ? 'Kunde' : 'Kunden'}${s.sum ? ' · ' + euro(s.sum) : ''}">
          <span class="bl" role="cell">${STG_L[s.key]}</span><span class="bt" role="cell"><i style="width:${s.n ? Math.max(3, s.n / max * 100) : 0}%"></i></span><span class="bv" role="cell"><b>${s.n}</b>${s.sum ? `<span class="muted">${euro(s.sum)}</span>` : ''}</span></a>`).join('')}</div>
        ${D.stages.find(s => s.key === 'verloren').n ? `<p class="muted small" style="margin:10px 0 0">Verloren: ${D.stages.find(s => s.key === 'verloren').n}</p>` : ''}</div>
      ${homeDue()}
    </div>
    ${D.all && D.team.length ? `<div class="card sec"><div class="row" style="justify-content:space-between"><h2>Team</h2><a class="btn g sm" href="stempel/#/einstellungen/auswertung">Stunden-Auswertung ${ic('next', 16)}</a></div>${D.vacReq ? `<a class="note ok" style="display:block;text-decoration:none" href="stempel/#/einstellungen/team"><b>${D.vacReq} Urlaubsantrag${D.vacReq === 1 ? '' : 'e'} offen</b> – jetzt ansehen →</a>` : ''}<table class="mt team"><thead><tr><th>Berater</th><th>Aktive Kunden</th><th>Angebote offen</th><th>Aufträge ${esc(mName)}</th><th>Aktivitäten 7 Tage</th><th>Überfällig</th></tr></thead><tbody>
      ${D.team.map(t => `<tr><td class="tn"><b>${esc(t.name)}</b></td><td data-l="Aktive Kunden">${t.active}</td><td data-l="Angebote offen">${t.offers ? euro(t.offers) : '–'}</td><td data-l="Aufträge">${t.won}</td><td data-l="Aktivitäten 7 Tage">${t.acts}</td><td data-l="Überfällig" class="${t.overdue ? 'od' : ''}">${t.overdue}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${D.recent.length ? `<div class="card sec"><h2>Letzte Aktivitäten</h2><div class="tl">${D.recent.map(e => `<a class="ev lnk ${['notiz', 'anruf', 'termin', 'email'].includes(e.kind) ? '' : 'auto'}" href="#/kunde/${esc(e.project)}"><span class="evi">${ic(e.kind, 16)}</span><div class="evb"><div class="evh"><b>${esc(e.projectName)}</b><span class="muted small">${KIND_L[e.kind] || e.kind} · ${esc(ago(e.at))} · ${esc(e.userName)}</span></div><div class="evt">${esc(e.text.length > 140 ? e.text.slice(0, 140) + ' …' : e.text)}</div></div></a>`).join('')}</div></div>` : ''}`;
}
/* Startseite: heute fällig */
function homeCrm() {
  if (!isCrm()) return '';
  return homeDash() || homeDue();
}
function homeDue() {
  const due = (ST.tasks || []).filter(t => !t.done && t.due <= today() && t.assignee === ST.user.id);
  return `<div class="card ${ST.dash ? '' : 'sec'}"><div class="row" style="justify-content:space-between"><h2>${due.some(t => t.due < today()) ? 'Fällig' : 'Heute fällig'}</h2><a class="btn g sm" href="#/aufgaben">Alle Aufgaben ${ic('next', 16)}</a></div>
    ${due.length ? `<div class="tlist">${due.slice(0, 8).map(taskRow).join('')}</div>${due.length > 8 ? `<p class="muted small">… und ${due.length - 8} weitere</p>` : ''}` : '<p class="muted">Nichts fällig – gute Arbeit. Neue Wiedervorlagen legst du beim Kunden oder unter Aufgaben an.</p>'}</div>`;
}
/* Handy: „Mehr“ für die Admin-Seiten */
function viewMehr() {
  return `<section class="hero"><h1>Verwaltung</h1></section><div class="card clist">${[...((ST.features || {}).angebote ? [['assistent', 'Angebots-Assistent', 'Fragen, Reihenfolge, Anhänge, Gratis-Mengen, Systeme'], ['produkte', 'Produkte', 'Produktdatenbank fürs Angebot: Module, Speicher, Wechselrichter …'], ['artikel', 'Leistungen & Pakete', 'Montage, Elektro & Co. – feste und bedingte Positionen'], ['belege', 'Nummern & Texte', 'Kundennummern, Nummernkreise, Textbausteine, Mahnwesen']] : []), ...((ST.features || {}).rechnungen ? [['rechnungen', 'Rechnungen', 'Offene Posten, E-Rechnung, Mahnungen']] : []), ['protokolle', 'Protokolle', 'Abnahmen und Service-Einsätze aller Monteure'], ['stunden', 'Stunden-Auswertung', 'Monatsübersicht, Lohn-Export, Baustellen'], ['users', 'Benutzer', 'Mitarbeiter anlegen, Rollen, Zugänge'], ['audit', 'Änderungen', 'Wer hat wann was im System gemacht'], ['system', 'System', 'Update, Datensicherung, E-Mail']].map(([k, l, t]) => `<a class="crow" href="${k === 'stunden' ? 'stempel/#/einstellungen/auswertung' : '#/' + k}"><span class="evi">${ic(k === 'stunden' ? 'stempel' : k === 'artikel' || k === 'produkte' || k === 'assistent' ? 'box' : k === 'belege' || k === 'rechnungen' ? 'offer' : k, 18)}</span><div class="cmain"><b>${l}</b><span class="muted">${t}</span></div>${ic('next', 18)}</a>`).join('')}</div>`;
}

/* ---------- Laden ---------- */
async function crmLoad(view, arg) {
  if (view === 'kunden' || view === 'aufgaben') { const j = await api('crm'); ST.crm = j.customers; ST.crmAll = j.all; ST.team = j.team; }
  if (view === 'kunde') api('zs-list&p=' + encodeURIComponent(arg)).then(j => { const el = $('#k-zs'); if (el && j.list.length && typeof ZS_RES === 'object') el.innerHTML = `<div class="clist flat">${j.list.map(x => `<a class="crow" href="#/zaehler/${x.id}"><span class="evi" style="color:${ZS_RES[x.result][2]}">${ic('zaehler', 18)}</span><div class="cmain"><b>${esc(ZS_RES[x.result][0])}</b><span class="muted">${utc(x.at).toLocaleDateString('de-DE')}${x.fields ? ' · Empfehlung ' + x.fields + '-feldig' : ''}</span></div>${ic('next', 18)}</a>`).join('')}</div>`; }).catch(() => {});
  if (view === 'kunde') { ST.hrs = null; api('st-sites&p=' + encodeURIComponent(arg)).then(h => { ST.hrs = h; const el = $('#k-hrs'); if (el && ST.view === 'kunde') el.outerHTML = hoursCard(); }).catch(() => {}); ST.cd = null; try { const [d, t] = await Promise.all([api('crm-p&id=' + encodeURIComponent(arg)), ST.team ? null : api('tasks')]); ST.cd = d; if (t) ST.team = t.team; } catch (e) { if (e.status === 401) throw e; toast(e.message); } }
  if (view === 'home') { try { ST.dash = await api('dash'); } catch (e) { if (e.status === 401) throw e; ST.dash = null; } }
  if (view === 'aufgaben' || view === 'home') { const j = await api('tasks&scope=' + (view === 'home' ? 'meine' : CR.tscope)); ST.tasks = j.tasks; ST.tasksAll = j.all; ST.remind = j.remind; ST.team = j.team; }
}
async function crmReload() { const y = scrollY; await route(); scrollTo(0, y); }
const crmApplyDetail = j => { if (j && j.customer) ST.cd = j; };

/* ---------- Bedienung ---------- */
async function crmClick(a) {
  const v = a.dataset.v, id = a.dataset.id;
  switch (a.dataset.a) {
    case 'crm-go-pipe': CR.mode = 'pipeline'; crSave(); return;
    case 'crm-go-stage': CR.mode = 'liste'; CR.stage = v; CR.scope = 'alle'; CR.adv = ''; crSave(); return;
    case 'crm-mode': CR.mode = v; crSave(); return void ($('#app main').innerHTML = viewKunden());
    case 'crm-scope': CR.scope = v; CR.stage = ''; crSave(); return void ($('#app main').innerHTML = viewKunden());
    case 'crm-archiv': CR.archiv = !CR.archiv; return void ($('#app main').innerHTML = viewKunden());
    case 'crm-stage-f': CR.stage = v; return void ($('#crm-res').innerHTML = crmResults());
    case 'crm-tscope': CR.tscope = v; crSave(); return crmReload();
    case 'crm-ment': { const n = +v; CR.ment.has(n) ? CR.ment.delete(n) : CR.ment.add(n); a.classList.toggle('on', CR.ment.has(n)); return; }
    case 'crm-kind': { CR.kind = v; const f = $('#f-crm-ev'); f.querySelectorAll('.kinds button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); f.text.placeholder = { notiz: 'Was gibt es Neues?', anruf: 'Worüber wurde gesprochen?', termin: 'Termin: wo, mit wem, Ergebnis …', email: 'Inhalt der E-Mail kurz zusammengefasst' }[v]; f.text.focus(); return; }
    case 'crm-due': { const f = a.closest('form'); f.due.value = plusDays(+v); f.querySelectorAll('.quick .chip').forEach(b => b.classList.toggle('on', b === a)); return; }
    case 'crm-set-stage': {
      if (v === 'verloren' && !confirm('Kunde als verloren markieren?')) return;
      crmApplyDetail(await api('crm-stage', { id: ST.cd.customer.id, stage: v })); toast('Stufe: ' + STG_L[v]); return crmRender();
    }
    case 'crm-adv-stage': { await api('crm-stage', { id, stage: v }); const c = ST.crm.find(x => x.id === id); if (c) c.stage = v; toast(`${c ? c.name : 'Kunde'} → ${STG_L[v]}`); return void ($('#crm-res').innerHTML = crmResults()); }
    case 'crm-ev-del': if (!confirm('Eintrag löschen?')) return; crmApplyDetail(await api('crm-event-del', { id: +id })); return crmRender();
    case 'crm-task-done': { a.disabled = true; const j = await api('task-update', { id: +id, done: v === '1' }); crmApplyDetail(j); if (v === '1') toast('Erledigt ✓'); return ST.view === 'kunde' ? crmRender() : crmReload(); }
    case 'crm-task-move': { const t = crmTask(+id); const d = new Date((t && t.due > today() ? t.due : today()) + 'T12:00'); d.setDate(d.getDate() + +v); const j = await api('task-update', { id: +id, due: isoDay(d) }); crmApplyDetail(j); toast('Verschoben auf ' + deDay(isoDay(d))); return ST.view === 'kunde' ? crmRender() : crmReload(); }
    case 'crm-task-del': if (!confirm('Wiedervorlage löschen?')) return; crmApplyDetail(await api('task-del', { id: +id })); return ST.view === 'kunde' ? crmRender() : crmReload();
  }
}
const crmTask = id => (ST.cd ? ST.cd.tasks : []).concat(ST.tasks || []).find(t => t.id === id);
function crmRender() { const y = scrollY; $('#app main').innerHTML = viewKunde(); scrollTo(0, y); }
async function crmSubmit(f, d) {
  if (f.id === 'f-crm-ev') { const j = await api('crm-event', { id: ST.cd.customer.id, kind: CR.kind, text: d.text, at: toUtc(d.at), mentions: [...CR.ment] }); crmApplyDetail(j); CR.ment = new Set(); toast(j.mailed && j.mailed.length ? 'Im Logbuch gespeichert · E-Mail an ' + j.mailed.join(', ') : 'Im Logbuch gespeichert.', ); return crmRender(); }
  if (f.id === 'f-crm-task') {
    const pid = f.dataset.p || d.project || '';
    const j = await api('task', { project: pid, title: d.title, due: d.due, assignee: +d.assignee });
    toast('Wiedervorlage am ' + deDay(d.due) + (+d.assignee !== ST.user.id ? ' für ' + ((ST.team || []).find(u => u.id === +d.assignee) || {}).name : '') + ' angelegt.');
    if (ST.view === 'kunde') { crmApplyDetail(j); return crmRender(); }
    return crmReload();
  }
}
document.addEventListener('input', e => { if (e.target.id === 'crm-q') { CR.q = e.target.value; $('#crm-res').innerHTML = crmResults(); } });
document.addEventListener('change', async e => {
  if (e.target.id === 'crm-adv') { CR.adv = e.target.value; crSave(); $('#crm-res').innerHTML = crmResults(); }
  if (e.target.id === 'crm-remind') { try { await api('remind', { on: e.target.checked }); ST.remind = e.target.checked; toast(e.target.checked ? 'Erinnerung per E-Mail an.' : 'Erinnerung per E-Mail aus.'); } catch (err) { toast(err.message); } }
});

/* ---------- Kunde hinzufügen · Kundennummer je Gewerk ---------- */
const KD = { g: null, team: null };
async function kdLoad(force) { if (!KD.g || force) KD.g = (await api('kd-cfg')).gewerke; return KD.g; }
const kdBtn = (cls = '') => typeof isCrm === 'function' && isCrm() ? `<button class="btn ${cls}" data-a="kd-new">${ic('plus', 18)}Kunde hinzufügen</button>` : '';
const kdBadge = c => c.kdnr ? `<span class="badge kdnr">${esc(c.kdnr)}</span>` : '';
const kdClose = () => { const o = $('#kd-sheet'); if (o) o.remove(); };
function kdSheet(inner) { kdClose(); const o = document.createElement('div'); o.id = 'kd-sheet'; o.className = 'kdsheet'; o.innerHTML = `<div class="kdbox">${inner}</div>`; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target === o) kdClose(); }); return o; }
async function kdNew() {
  const [G, T] = await Promise.all([kdLoad(true), ST.crmAll || ['admin', 'buero'].includes(ST.user.role) ? (KD.team ? Promise.resolve(KD.team) : api('team').then(j => (KD.team = j.users))) : Promise.resolve(null)]);
  const g0 = G[0] || {}, opt = (l, v) => l.map(([k, n]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${n}</option>`).join('');
  const o = kdSheet(`<form id="f-kd-new" autocomplete="off"><div class="kd-h"><b>Kunde hinzufügen</b><button type="button" class="xbtn" data-a="kd-close" aria-label="Schließen">${ic('x', 16)}</button></div>
    <div class="kd-g">${G.map((g, i) => `<label class="kd-gw"><input type="radio" name="gewerk" value="${esc(g.id)}" ${i ? '' : 'checked'}><span><b>${esc(g.name)}</b><em>${esc(g.preview)}</em></span></label>`).join('')}</div>
    <p class="muted small" style="margin:6px 2px 0">Die Kundennummer wird beim Anlegen vergeben. Gewerke und Nummern stellst du unter <a href="#/belege" data-a="kd-close">Nummern &amp; Texte</a> ein.</p>
    <div class="form-grid kd-f"><label>Anrede<select name="salutation">${opt([['Familie', 'Familie'], ['Herr', 'Herr'], ['Frau', 'Frau'], ['Firma', 'Firma'], ['', '–']], 'Familie')}</select></label>
      <label>Name<input name="name" required placeholder="z. B. Müller"></label>
      <label style="grid-column:1/-1">Straße und Hausnummer<input name="street"></label>
      <label>PLZ<input name="zip" inputmode="numeric" maxlength="5"></label><label>Ort<input name="city"></label>
      <label>Telefon<input name="phone" type="tel"></label><label>E-Mail<input name="email" type="email"></label>
      <label>Art in der Wirtschaftlichkeit<select name="type">${opt([['pv', 'Photovoltaik'], ['wp', 'Wärmepumpe'], ['pvwp', 'PV + Wärmepumpe']], (g0.types || [])[0] || 'pv')}</select></label>
      ${T ? `<label>Zuständig<select name="owner">${T.map(u => `<option value="${u.id}" ${u.id === ST.user.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>` : ''}</div>
    <div class="kd-act"><button type="button" class="btn s" data-a="kd-close">Abbrechen</button><button class="btn" type="submit">${ic('plus', 18)}Anlegen</button></div></form>`);
  setTimeout(() => { const n = o.querySelector('[name=name]'); if (n) n.focus(); }, 50);
}
async function kdAssign() {
  const c = ST.cd && ST.cd.customer; if (!c) return; const G = await kdLoad(true);
  kdSheet(`<div class="kd-h"><b>Kundennummer vergeben</b><button type="button" class="xbtn" data-a="kd-close" aria-label="Schließen">${ic('x', 16)}</button></div>
    <p class="muted small" style="margin:0 2px 10px">Für ${esc(c.name)} – welches Gewerk?</p>
    <div class="kd-g">${G.map(g => `<button class="kd-gw" data-a="kd-assign-go" data-v="${esc(g.id)}"><span><b>${esc(g.name)}</b><em>${esc(g.preview)}</em></span></button>`).join('')}</div>`);
}
document.addEventListener('change', e => { const f = e.target.closest && e.target.closest('#f-kd-new'); if (f && e.target.name === 'gewerk') { const g = (KD.g || []).find(x => x.id === e.target.value); if (g && (g.types || [])[0]) f.type.value = g.types[0]; } });
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-a^="kd-"]'); if (!a) return;
  const k = a.dataset.a; if (k !== 'kd-close' || a.tagName !== 'A') e.preventDefault();
  try {
    if (k === 'kd-new') return await kdNew();
    if (k === 'kd-close') return kdClose();
    if (k === 'kd-assign') return await kdAssign();
    if (k === 'kd-assign-go') { a.disabled = true; const j = await api('kd-assign', { id: ST.cd.customer.id, gewerk: a.dataset.v }); kdClose(); toast('Kundennummer ' + j.kdnr + ' vergeben.'); return crmReload(); }
  } catch (err) { toast(err.message); a.disabled = false; }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'f-kd-new') return; e.preventDefault(); const f = e.target, b = f.querySelector('[type=submit]');
  const d = Object.fromEntries(new FormData(f)); if (d.owner) d.owner = +d.owner;
  b.disabled = true;
  try { const j = await api('crm-new', d); kdClose(); toast(`Kunde ${j.kdnr} angelegt.`); location.hash = '#/kunde/' + j.id; }
  catch (err) { toast(err.message); b.disabled = false; }
});
window.addEventListener('hashchange', kdClose);
