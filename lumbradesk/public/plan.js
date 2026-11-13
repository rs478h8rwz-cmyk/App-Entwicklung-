/* lumbra.desk – Plantafel
   Wochenübersicht: links Mitarbeiter und Teams (gruppiert), rechts die Tage von 6 bis 20 Uhr.
   Termine direkt eintragen: in eine leere Stelle tippen oder mit der Maus einen Zeitraum ziehen.
   Termine verschieben (auch zu einem anderen Mitarbeiter) und am rechten Rand verlängern – rastet auf 30 Minuten ein. */
'use strict';
Object.assign(IC, {
  plantafel: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2.5v3M16 2.5v3M7 13h4M13 13h4M7 17h6"/>',
  prev: '<path d="M15 6l-6 6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'
});
const PL = { start: null, data: null, kind: '', gew: '', closed: {}, gw: null, custs: null, drag: null };
const PL_H0 = 6, PL_H1 = 20, PL_HN = PL_H1 - PL_H0, PL_DAYS = 7;
const plPad = n => String(n).padStart(2, '0');
const plIso = d => `${d.getFullYear()}-${plPad(d.getMonth() + 1)}-${plPad(d.getDate())}`;
const plDt = d => `${plIso(d)} ${plPad(d.getHours())}:${plPad(d.getMinutes())}`;
const plParse = s => { const [a, b = '00:00'] = String(s).replace('T', ' ').split(' '); const [y, m, d] = a.split('-').map(Number), [h, mi] = b.split(':').map(Number); return new Date(y, m - 1, d, h || 0, mi || 0); };
const plMonday = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const plAdd = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const plKw = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); };
const plCan = () => PL.data && PL.data.edit;
/* Position im Raster: Anteil (0–1) über die ganze Woche, Stunden außerhalb 6–20 Uhr werden an den Rand gedrückt */
function plFrac(d) {
  const day = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - PL.start) / 864e5);
  if (day < 0) return 0; if (day >= PL_DAYS) return 1;
  const h = Math.min(PL_HN, Math.max(0, d.getHours() + d.getMinutes() / 60 - PL_H0));
  return (day * PL_HN + h) / (PL_DAYS * PL_HN);
}
function plFromFrac(f) {   // Anteil → Zeitpunkt (auf 30 Minuten gerundet)
  f = Math.min(0.99999, Math.max(0, f)); const tot = f * PL_DAYS * PL_HN, day = Math.floor(tot / PL_HN), h = Math.round((tot - day * PL_HN) * 2) / 2;
  const d = plAdd(PL.start, day); d.setHours(PL_H0 + Math.floor(h), (h % 1) * 60, 0, 0); return d;
}

async function planLoad(re) {
  if (!PL.start) PL.start = plMonday(new Date());
  const [d] = await Promise.all([api(`plan&from=${plIso(PL.start)}&to=${plIso(plAdd(PL.start, 6))}`), PL.gw ? null : api('kd-cfg').then(j => { PL.gw = j.gewerke; }).catch(() => { PL.gw = []; })]);
  PL.data = d; if (!re) setTimeout(plToToday, 150);   // nach dem Zeichnen zum heutigen Tag
}
function plVisible(e) { return (!PL.kind || e.kind === PL.kind) && (!PL.gew || e.gewerk === PL.gew); }
/* Überschneidungen in einer Zeile: Termine auf Spuren verteilen */
function plLanes(evs) {
  const lanes = []; const out = [];
  evs.slice().sort((a, b) => plParse(a.start) - plParse(b.start)).forEach(e => {
    const s = plParse(e.start); let k = lanes.findIndex(end => end <= s); if (k < 0) { k = lanes.length; lanes.push(0); }
    lanes[k] = plParse(e.end); out.push([e, k]);
  });
  return { list: out, n: Math.max(1, lanes.length) };
}
function plEvHTML(e, k, rid) {
  const K = PL.data.kinds[e.kind] || { color: '#64748B', name: '' }, s = plParse(e.start), en = plParse(e.end);
  const l = plFrac(s), r = plFrac(en), w = Math.max(r - l, 0.004);
  const sameDay = plIso(s) === plIso(en), time = sameDay ? `${plPad(s.getHours())}:${plPad(s.getMinutes())}–${plPad(en.getHours())}:${plPad(en.getMinutes())}` : `${s.getDate()}.${s.getMonth() + 1}. – ${en.getDate()}.${en.getMonth() + 1}.`;
  const sub = [e.kdnr, e.city].filter(Boolean).join(' · ');
  return `<div class="pl-ev ${plCan() ? 'can' : ''}" data-ev="${e.id}" data-rid="${rid}" style="left:${l * 100}%;width:${w * 100}%;top:${k * 58 + 4}px;--c:${K.color}" title="${esc(K.name + ': ' + e.title + (sub ? ' · ' + sub : '') + ' · ' + time)}">
    <b>${esc(e.title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}<span class="pl-t">${esc(K.name)} · ${time}${e.res.length > 1 ? ` · ${ic('users', 11)}${e.res.length}` : ''}</span>${plCan() ? '<i class="pl-rs" data-rs="1"></i>' : ''}</div>`;
}
function viewPlan() {
  const D = PL.data; if (!D) return '<p class="muted" style="padding:30px 0">Plantafel wird geladen …</p>';
  const days = [...Array(PL_DAYS)].map((_, i) => plAdd(PL.start, i)), today = plIso(new Date()), end = days[6];
  const mon = (a, b) => a.getMonth() === b.getMonth() ? `${a.getDate()}.–${b.getDate()}. ${b.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}` : `${a.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const evs = D.events.filter(plVisible), res = D.res.filter(r => r.active || evs.some(e => e.res.includes(r.id)));
  const groups = []; res.forEach(r => { let g = groups.find(x => x.name === r.grp); if (!g) groups.push(g = { name: r.grp, rows: [] }); g.rows.push(r); });
  const nowF = days.some(d => plIso(d) === today) ? plFrac(new Date()) : null;
  const head = `<div class="pl-row pl-head"><div class="pl-lab">Mitarbeiter</div><div class="pl-days">${days.map(d => `<div class="pl-day ${plIso(d) === today ? 'today' : ''} ${d.getDay() % 6 === 0 ? 'we' : ''}"><b>${d.toLocaleDateString('de-DE', { weekday: 'short' })} ${d.getDate()}.${d.getMonth() + 1}.</b><span>${[9, 12, 15, 18].map(h => `<i style="left:${(h - PL_H0) / PL_HN * 100}%">${plPad(h)}</i>`).join('')}</span></div>`).join('')}</div></div>`;
  const rows = groups.map(g => `<div class="pl-grp" data-grp="${esc(g.name)}">${ic(PL.closed[g.name] ? 'next' : 'down', 14)}<b>${esc(g.name || 'Ohne Gruppe')}</b><span class="muted small">${g.rows.length}</span></div>
    ${PL.closed[g.name] ? '' : g.rows.map(r => { const L = plLanes(evs.filter(e => e.res.includes(r.id))); return `<div class="pl-row"><div class="pl-lab">${esc(r.name)}${r.active ? '' : ' <span class="muted small">(ausgeblendet)</span>'}</div>
      <div class="pl-track" data-rid="${r.id}" style="height:${L.n * 58 + 8}px">${days.map((d, i) => d.getDay() % 6 === 0 ? `<div class="pl-we" style="left:${i / 7 * 100}%"></div>` : '').join('')}${nowF !== null ? `<div class="pl-now" style="left:${nowF * 100}%"></div>` : ''}${L.list.map(([e, k]) => plEvHTML(e, k, r.id)).join('')}</div></div>`; }).join('')}`).join('');
  const kinds = Object.entries(D.kinds);
  return `<section class="hero pl-hero"><div><h1>Plantafel</h1><p class="muted">${mon(PL.start, end)} · KW ${plKw(PL.start)}${plCan() ? '<span class="pl-hint"> · In eine freie Stelle tippen oder einen Zeitraum ziehen, um einen Termin einzutragen.</span>' : ''}</p></div>
      ${plCan() ? `<button class="btn" data-pl="new">${ic('plus', 18)}Neuer Termin</button>` : ''}</section>
    <div class="pl-bar">
      <div class="pl-nav"><button class="btn s sm" data-pl="prev" aria-label="Vorige Woche">${ic('prev', 16)}</button><button class="btn s sm" data-pl="today">Heute</button><button class="btn s sm" data-pl="next" aria-label="Nächste Woche">${ic('next', 16)}</button><input type="date" class="pl-date" value="${plIso(PL.start)}" aria-label="Datum wählen"></div>
      <div class="pl-flt"><select data-plf="kind"><option value="">Alle Kategorien</option>${kinds.map(([k, x]) => `<option value="${k}" ${PL.kind === k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
        ${(PL.gw || []).length ? `<select data-plf="gew"><option value="">Alle Gewerke</option>${PL.gw.map(g => `<option value="${esc(g.id)}" ${PL.gew === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>` : ''}
        ${['admin', 'buero'].includes(ST.user.role) ? `<button class="btn s sm" data-pl="rows">${ic('edit', 15)}Zeilen</button>` : ''}</div>
    </div>
    <div class="pl-leg">${kinds.map(([, x]) => `<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}</div>
    <div class="pl-wrap"><div class="pl-grid">${head}${rows || '<p class="muted" style="padding:20px">Noch keine Zeilen – unter „Zeilen“ Mitarbeiter oder Teams anlegen.</p>'}</div></div>`;
}
const plRender = () => { const w = $('.pl-wrap'), x = w ? w.scrollLeft : 0, y = scrollY; $('#app main').innerHTML = viewPlan(); const w2 = $('.pl-wrap'); if (w2) w2.scrollLeft = x; scrollTo(0, y); };
async function plReload() { await planLoad(true); plRender(); }
/* Beim Öffnen auf schmalen Bildschirmen zum heutigen Tag scrollen */
function plToToday() { const w = $('.pl-wrap'), t = $('.pl-day.today'), l = $('.pl-head .pl-lab'); if (w && t && l && w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, t.offsetLeft - l.offsetWidth); }


/* ---------- Termin-Dialog ---------- */
async function plCusts() { if (!PL.custs) { try { PL.custs = (await api('crm')).customers; } catch (e) { PL.custs = []; } } return PL.custs; }
function plSheet(inner) { plClose(); const o = document.createElement('div'); o.id = 'pl-sheet'; o.className = 'kdsheet'; o.innerHTML = `<div class="kdbox pl-box">${inner}</div>`; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target === o) plClose(); }); return o; }
const plClose = () => { const o = $('#pl-sheet'); if (o) o.remove(); };
async function plOpen(ev) {
  const D = PL.data, can = plCan(), E = ev.id ? ev : { id: 0, title: '', kind: 'termin', note: '', project: null, ...ev };
  const cs = await plCusts(), cur = E.project ? cs.find(c => c.id === E.project) : null;
  const groups = [...new Set(D.res.filter(r => r.active || E.res.includes(r.id)).map(r => r.grp))];
  const o = plSheet(`<form id="f-pl" data-id="${E.id}"><div class="kd-h"><b>${E.id ? (can ? 'Termin bearbeiten' : 'Termin') : 'Neuer Termin'}</b><button type="button" class="xbtn" data-pl="close" aria-label="Schließen">${ic('x', 16)}</button></div>
    <div class="pl-kinds">${Object.entries(D.kinds).map(([k, x]) => `<label class="pl-kc" style="--c:${x.color}"><input type="radio" name="kind" value="${k}" ${E.kind === k ? 'checked' : ''} ${can ? '' : 'disabled'}><span>${esc(x.name)}</span></label>`).join('')}</div>
    <label>Kunde<div class="pl-cust"><input id="pl-cq" placeholder="Name oder Kundennummer …" autocomplete="off" value="${cur ? esc((cur.kdnr ? cur.kdnr + ' · ' : '') + cur.name) : ''}" ${can ? '' : 'disabled'}><input type="hidden" name="project" value="${esc(E.project || '')}"><div id="pl-cl" class="pl-cl"></div></div></label>
    <label>Titel<input name="title" value="${esc(E.title)}" placeholder="leer = Name des Kunden" ${can ? '' : 'disabled'}></label>
    <div class="form-grid"><label>Beginn<input type="datetime-local" name="start" value="${esc(E.start.replace(' ', 'T'))}" step="1800" ${can ? '' : 'disabled'}></label><label>Ende<input type="datetime-local" name="end" value="${esc(E.end.replace(' ', 'T'))}" step="1800" ${can ? '' : 'disabled'}></label></div>
    ${can ? `<div class="row pl-quick"><button type="button" class="btn s sm" data-pl="day">Ganzer Tag (7–16 Uhr)</button><button type="button" class="btn s sm" data-pl="h" data-v="2">2 Std.</button><button type="button" class="btn s sm" data-pl="h" data-v="4">4 Std.</button><button type="button" class="btn s sm" data-pl="d" data-v="1">+1 Tag</button></div>` : ''}
    <div class="pl-who"><span class="muted small">Mitarbeiter / Teams</span>${groups.map(g => `<div class="pl-wg"><span>${esc(g || 'Ohne Gruppe')}</span><div class="chips2">${D.res.filter(r => r.grp === g && (r.active || E.res.includes(r.id))).map(r => `<label class="chip ${E.res.includes(r.id) ? 'on' : ''}"><input type="checkbox" name="res" value="${r.id}" ${E.res.includes(r.id) ? 'checked' : ''} ${can ? '' : 'disabled'}>${esc(r.name)}</label>`).join('')}</div></div>`).join('')}</div>
    <label>Notiz<textarea name="note" rows="2" ${can ? '' : 'disabled'}>${esc(E.note || '')}</textarea></label>
    <div class="kd-act">${E.id && can ? `<button type="button" class="btn g danger" data-pl="del">${ic('x', 16)}Löschen</button>` : ''}${E.project ? `<a class="btn s" href="#/kunde/${esc(E.project)}">Zum Kunden</a>` : ''}<span style="flex:1"></span>${can ? `<button class="btn" type="submit">${ic('check', 18)}Speichern</button>` : ''}</div></form>`);
  const q = o.querySelector('#pl-cq'), list = o.querySelector('#pl-cl'), hid = o.querySelector('[name=project]');
  if (q && can) {
    const show = () => { const s = q.value.trim().toLowerCase(); if (!s) { list.innerHTML = ''; return; }
      const l = cs.filter(c => `${c.kdnr || ''} ${c.name} ${c.city} ${c.street}`.toLowerCase().includes(s)).slice(0, 8);
      list.innerHTML = l.map(c => `<button type="button" data-cid="${esc(c.id)}"><b>${c.kdnr ? esc(c.kdnr) + ' · ' : ''}${esc(c.name)}</b><span>${esc([c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '')}</span></button>`).join('') || '<div class="muted small" style="padding:8px">Kein Kunde gefunden</div>'; };
    q.addEventListener('input', () => { hid.value = ''; show(); });
    list.addEventListener('click', e => { const b = e.target.closest('[data-cid]'); if (!b) return; const c = cs.find(x => x.id === b.dataset.cid); hid.value = c.id; q.value = (c.kdnr ? c.kdnr + ' · ' : '') + c.name; list.innerHTML = ''; });
  }
}
function plNewAt(rid, s, e) { plOpen({ res: rid ? [rid] : [], start: plDt(s), end: plDt(e) }); }

/* ---------- Bedienung ---------- */
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-pl],[data-grp]'); if (!a) return;
  if (a.dataset.grp !== undefined) { PL.closed[a.dataset.grp] = !PL.closed[a.dataset.grp]; return plRender(); }
  const k = a.dataset.pl; e.preventDefault();
  try {
    if (k === 'prev' || k === 'next') { PL.start = plAdd(PL.start, k === 'prev' ? -7 : 7); return await plReload(); }
    if (k === 'today') { PL.start = plMonday(new Date()); return await plReload(); }
    if (k === 'new') { const s = new Date(); s.setMinutes(0, 0, 0); s.setHours(s.getHours() + 1); if (s < PL.start || s > plAdd(PL.start, 7)) { s.setTime(PL.start.getTime()); s.setHours(8); } return plNewAt(null, s, new Date(s.getTime() + 2 * 36e5)); }
    if (k === 'close') return plClose();
    const f = $('#f-pl');
    if (f && (k === 'day' || k === 'h' || k === 'd')) {
      const s = plParse(f.start.value), en = plParse(f.end.value);
      if (k === 'day') { s.setHours(7, 0); en.setTime(s.getTime()); en.setHours(16, 0); }
      if (k === 'h') en.setTime(s.getTime() + +a.dataset.v * 36e5);
      if (k === 'd') en.setTime(en.getTime() + 864e5);
      f.start.value = plDt(s).replace(' ', 'T'); f.end.value = plDt(en).replace(' ', 'T'); return;
    }
    if (k === 'del') { if (!confirm('Termin löschen?')) return; await api('plan-del', { id: +f.dataset.id }); plClose(); toast('Termin gelöscht.'); return await plReload(); }
    if (k === 'rows') return plRows();
    if (k === 'r-add') { PL.rows.push({ id: 0, name: '', grp: (PL.rows[PL.rows.length - 1] || {}).grp || 'Monteure', user: null, active: true }); return plRows(true); }
    if (k === 'r-up' || k === 'r-down') { const i = +a.dataset.v, j = k === 'r-up' ? i - 1 : i + 1; if (PL.rows[j]) [PL.rows[i], PL.rows[j]] = [PL.rows[j], PL.rows[i]]; return plRows(true); }
    if (k === 'r-del') { PL.rows.splice(+a.dataset.v, 1); return plRows(true); }
    if (k === 'r-save') { const j = await api('plan-res', { list: PL.rows }); PL.data.res = j.res; plClose(); toast('Zeilen gespeichert.'); return plRender(); }
  } catch (err) { toast(err.message); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset && el.dataset.plf) { PL[el.dataset.plf] = el.value; return plRender(); }
  if (el.classList && el.classList.contains('pl-date') && el.value) { PL.start = plMonday(plParse(el.value)); return plReload(); }
  if (el.name === 'res' && el.closest('#f-pl')) el.closest('.chip').classList.toggle('on', el.checked);
  if (el.name === 'kind' && el.closest('#f-pl')) { /* Farbe sofort sichtbar */ }
});
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.pr !== undefined && PL.rows) { const r = PL.rows[+el.dataset.pr]; const k = el.dataset.k; r[k] = el.type === 'checkbox' ? el.checked : k === 'user' ? (+el.value || null) : el.value; if (k === 'user' && el.value && !r.name) { const u = (KD.team || []).find(x => x.id === +el.value); if (u) { r.name = u.name; plRows(true); } } } });
document.addEventListener('submit', async e => {
  if (e.target.id !== 'f-pl') return; e.preventDefault(); const f = e.target, b = f.querySelector('[type=submit]');
  const d = { id: +f.dataset.id, kind: (f.querySelector('[name=kind]:checked') || {}).value || 'termin', title: f.elements.namedItem('title').value, start: f.start.value, end: f.end.value, project: f.project.value, note: f.note.value, res: [...f.querySelectorAll('[name=res]:checked')].map(x => +x.value) };
  b.disabled = true;
  try { await api('plan-save', d); plClose(); toast(d.id ? 'Termin gespeichert.' : 'Termin eingetragen.'); await plReload(); } catch (err) { toast(err.message); b.disabled = false; }
});

/* Zeilen verwalten (Admin/Büro): Mitarbeiter und Teams, Gruppen, Reihenfolge */
async function plRows(keep) {
  if (!keep) { PL.rows = PL.data.res.filter(r => r.active).map(r => ({ ...r })); if (!KD.team) { try { KD.team = (await api('team')).users; } catch (e) { KD.team = []; } } }
  const groups = [...new Set(PL.rows.map(r => r.grp).filter(Boolean).concat(['Monteure', 'Vorarbeiter', 'Facharbeiter', 'Helfer', 'Azubi', 'Teams', 'Büro']))];
  const html = `<div class="kd-h"><b>Zeilen der Plantafel</b><button type="button" class="xbtn" data-pl="close" aria-label="Schließen">${ic('x', 16)}</button></div>
    <p class="muted small" style="margin:0 2px 10px">Mitarbeiter aus der Benutzerverwaltung oder freie Teams (z. B. „AC Team“). Die Gruppe fasst Zeilen zusammen. Entfernte Zeilen werden nur ausgeblendet – alte Termine bleiben erhalten.</p>
    <datalist id="pl-grps">${groups.map(g => `<option value="${esc(g)}">`).join('')}</datalist>
    <div class="pl-rl">${PL.rows.map((r, i) => `<div class="pl-ri"><input data-pr="${i}" data-k="name" value="${esc(r.name)}" placeholder="Name"><input data-pr="${i}" data-k="grp" value="${esc(r.grp)}" list="pl-grps" placeholder="Gruppe">
      <select data-pr="${i}" data-k="user"><option value="">kein Login (Team)</option>${(KD.team || []).map(u => `<option value="${u.id}" ${r.user === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
      <span class="pl-ra"><button class="btn g sm" data-pl="r-up" data-v="${i}" ${i ? '' : 'disabled'} aria-label="Nach oben">↑</button><button class="btn g sm" data-pl="r-down" data-v="${i}" ${i < PL.rows.length - 1 ? '' : 'disabled'} aria-label="Nach unten">↓</button><button class="btn g sm danger" data-pl="r-del" data-v="${i}" aria-label="Entfernen">${ic('x', 14)}</button></span></div>`).join('')}</div>
    <div class="kd-act"><button class="btn s" data-pl="r-add">${ic('plus', 16)}Zeile</button><span style="flex:1"></span><button class="btn" data-pl="r-save">${ic('check', 18)}Speichern</button></div>`;
  const o = $('#pl-sheet'); if (o && keep) o.querySelector('.kdbox').innerHTML = html; else plSheet(html);
}

/* Ziehen: freien Bereich → neuer Termin; Termin → verschieben; rechter Rand → verlängern */
document.addEventListener('click', e => { const ev = !plCan() && e.target.closest && e.target.closest('.pl-ev'); if (ev) { const E = PL.data.events.find(x => x.id === +ev.dataset.ev); if (E) plOpen(E); } });
document.addEventListener('pointerdown', e => {
  if (!plCan() || e.button > 0) return;
  const tr = e.target.closest && e.target.closest('.pl-track'); if (!tr) return;
  const ev = e.target.closest('.pl-ev'), rect = tr.getBoundingClientRect(), f0 = (e.clientX - rect.left) / rect.width;
  if (ev) {
    const E = PL.data.events.find(x => x.id === +ev.dataset.ev); if (!E) return;
    PL.drag = { mode: e.target.dataset.rs ? 'size' : 'move', E, el: ev, x0: e.clientX, y0: e.clientY, w: rect.width, rid: +tr.dataset.rid, s: plParse(E.start), en: plParse(E.end), moved: false };
  } else {
    if (e.pointerType === 'touch') { PL.drag = { mode: 'tap', rid: +tr.dataset.rid, f0, x0: e.clientX, y0: e.clientY, tr }; return; }
    PL.drag = { mode: 'new', rid: +tr.dataset.rid, f0, f1: f0, tr, x0: e.clientX, y0: e.clientY };
    const g = document.createElement('div'); g.className = 'pl-ghost'; tr.appendChild(g); PL.drag.g = g;
  }
  if (e.pointerType !== 'touch') e.preventDefault();
});
document.addEventListener('pointermove', e => {
  const G = PL.drag; if (!G) return; const dx = e.clientX - G.x0;
  if (G.mode === 'tap') { if (Math.abs(dx) > 8 || Math.abs(e.clientY - G.y0) > 8) PL.drag = null; return; }
  if (G.mode === 'new') { const r = G.tr.getBoundingClientRect(); G.f1 = (e.clientX - r.left) / r.width; const a = Math.min(G.f0, G.f1), b = Math.max(G.f0, G.f1); G.g.style.left = a * 100 + '%'; G.g.style.width = Math.max(b - a, .003) * 100 + '%'; return; }
  if (!G.moved && Math.abs(dx) < 5 && Math.abs(e.clientY - G.y0) < 5) return;
  G.moved = true; G.el.classList.add('drag');
  const df = dx / G.w;   // Verschiebung als Anteil der Woche (Arbeitszeit 6–20 Uhr), rastet über plFromFrac auf 30 Minuten ein
  if (G.mode === 'size') { const en = plFromFrac(plFrac(G.en) + df), ne = en > G.s ? en : new Date(G.s.getTime() + 30 * 6e4); G.ns = G.s; G.ne = ne; G.el.style.width = Math.max(plFrac(ne) - plFrac(G.s), .004) * 100 + '%'; }
  else {
    const ns = plFromFrac(plFrac(G.s) + df), ne = new Date(ns.getTime() + (G.en - G.s));
    G.ns = ns; G.ne = ne; G.el.style.left = plFrac(ns) * 100 + '%';
    const over = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains('pl-track')); G.to = over ? +over.dataset.rid : G.rid;
    document.querySelectorAll('.pl-track.hl').forEach(x => x.classList.remove('hl')); if (over && G.to !== G.rid) over.classList.add('hl');
  }
});
document.addEventListener('pointerup', async e => {
  const G = PL.drag; if (!G) return; PL.drag = null;
  document.querySelectorAll('.pl-track.hl').forEach(x => x.classList.remove('hl'));
  if (G.mode === 'tap' || (G.mode === 'new' && Math.abs(e.clientX - G.x0) < 6)) {   // Tippen: 3 Stunden ab der angetippten Zeit
    if (G.g) G.g.remove(); const s = plFromFrac(G.f0); s.setMinutes(0); const en = new Date(s.getTime() + 3 * 36e5); return plNewAt(G.rid, s, en);
  }
  if (G.mode === 'new') { G.g.remove(); const a = plFromFrac(Math.min(G.f0, G.f1)), b = plFromFrac(Math.max(G.f0, G.f1)); return plNewAt(G.rid, a, b > a ? b : new Date(a.getTime() + 36e5)); }
  if (!G.moved) return plOpen(G.E);
  const E = G.E, res = G.mode === 'move' && G.to && G.to !== G.rid ? [...new Set(E.res.filter(r => r !== G.rid).concat(G.to))] : E.res;
  try { await api('plan-save', { ...E, start: plDt(G.ns), end: plDt(G.ne), res }); toast('Termin verschoben.'); } catch (err) { toast(err.message); }
  plReload();
});
