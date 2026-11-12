/* LumbraDesk – Abnahme & Service: Übersicht aller Protokolle (Büro/Admin) und Abschnitt auf der Kundenseite */
'use strict';
const PR = { q: '', type: '' };
const canOpenProt = () => ['admin', 'buero', 'monteur'].includes(ST.user.role);
const protDate = s => s ? s.split('-').reverse().join('.') : '';
const GEW_L = { AC: 'AC-Montage', DC: 'DC-Montage', SHK: 'SHK' };

async function protLoad(view, arg) {
  if (view === 'protokolle') ST.prots = (await api('ab-list&scope=all')).list;
  if (view === 'kunde') { ST.cprots = null; try { ST.cprots = (await api('ab-list&p=' + encodeURIComponent(arg))).list; } catch (e) { if (e.status === 401) throw e; ST.cprots = []; } }
}
function protRow(p, showCust = true) {
  const inner = `<span class="evi">${ic('protokoll', 18)}</span><div class="cmain"><b>${esc(p.typeName)} ${esc(p.nr)}</b><span class="muted">${showCust ? esc(p.kunde || 'ohne Kunde') + ' · ' : ''}${esc(protDate(p.datum))}${p.monteur ? ' · ' + esc(p.monteur) : ''}${p.photos ? ` · ${p.photos} ${p.photos === 1 ? 'Foto' : 'Fotos'}` : ''}</span>
    ${showCust ? `<div class="cmeta">${p.projectName ? `<span class="badge p">${esc(p.projectName)}</span>` : '<span class="badge">keinem Kunden zugeordnet</span>'}<span class="badge">${esc(GEW_L[p.gewerk] || p.gewerk)}</span></div>` : ''}</div>`;
  return canOpenProt() ? `<a class="crow" href="abnahme/#/p/${encodeURIComponent(p.id)}">${inner}${ic('next', 18)}</a>` : `<div class="crow">${inner}</div>`;
}
function protCard() {
  const l = ST.cprots; if (!l) return '';
  return `<div class="card sec"><h2>Abnahme &amp; Service</h2>${l.length ? `<div class="clist flat">${l.map(p => protRow(p, false)).join('')}</div>` : '<p class="muted">Noch keine Protokolle. Monteure wählen den Kunden beim Start eines Protokolls in der Abnahme-App.</p>'}
    ${canOpenProt() ? '<p class="muted small" style="margin:10px 0 0">Antippen öffnet das Protokoll in Abnahme &amp; Service – dort auch als PDF.</p>' : ''}</div>`;
}
function viewProtokolle() {
  return `<section class="hero"><h1>Protokolle</h1><p class="muted">Abnahmen und Service-Einsätze aller Monteure – mit Fotos und Unterschriften auf dem Server.</p></section>
    <div class="crm-bar"><div class="srch">${ic('search', 18)}<input id="pr-q" type="search" placeholder="Nummer, Kunde, Ort, Monteur …" value="${esc(PR.q)}" autocomplete="off"></div>
      <div class="seg">${[['', 'Alle'], ['abnahme', 'Abnahme'], ['service', 'Service']].map(([k, l]) => `<button class="${PR.type === k ? 'on' : ''}" data-a="pr-type" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div id="pr-res" style="margin-top:14px">${protResults()}</div>`;
}
function protResults() {
  const q = PR.q.trim().toLowerCase(), l = (ST.prots || []).filter(p => (!PR.type || p.type === PR.type) && (!q || `${p.nr} ${p.kunde} ${p.adresse} ${p.monteur} ${p.ownerName} ${p.projectName || ''}`.toLowerCase().includes(q)));
  if (!(ST.prots || []).length) return '<div class="card empty"><b>Noch keine Protokolle auf dem Server.</b><p class="muted">Sobald Monteure in Abnahme &amp; Service ein Protokoll abschließen, erscheint es hier – und beim Kunden.</p></div>';
  return l.length ? `<div class="card clist">${l.map(p => protRow(p)).join('')}</div>` : '<p class="muted" style="padding:20px 4px">Keine Protokolle für diese Suche.</p>';
}
document.addEventListener('input', e => { if (e.target.id === 'pr-q') { PR.q = e.target.value; $('#pr-res').innerHTML = protResults(); } });
document.addEventListener('click', e => { const a = e.target.closest('[data-a="pr-type"]'); if (!a) return; PR.type = a.dataset.v; $('#app main').innerHTML = viewProtokolle(); });
