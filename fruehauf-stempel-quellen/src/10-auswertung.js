/* =========================================================
   LumbraDesk: Stunden-Auswertung fürs Büro (nur Admin/Büro unter LumbraDesk)
   Monatsübersicht aller Mitarbeiter (Soll, Ist, Differenz, Konto, Urlaub, Krank),
   Hinweise (vergessenes Ausstempeln, fehlende Tage), Stundenzettel als PDF,
   Export für die Lohnabrechnung (Excel/CSV) und Stunden je Baustelle.
   Gerechnet wird mit genau denselben Regeln wie im Stundenzettel.
   ========================================================= */
const AW = { ym: '', busy: false };
const awYm = () => AW.ym || (+isoToday().slice(8) <= 7 ? awShift(isoToday().slice(0, 7), -1) : isoToday().slice(0, 7));   // in der ersten Woche: Vormonat (Lohnabrechnung)
const awLabel = ym => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const awShift = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; };
const awPeople = () => Object.entries(STAFF).filter(([k, st]) => k.startsWith('u') && st.at && Object.keys(st.days || {}).length).sort((a, b) => a[1].name.localeCompare(b[1].name));

/* Kennzahlen eines Mitarbeiters für einen Monat (mit seinen eigenen Einstellungen) */
function awStats(st, ym) {
  return withStaff(st, () => {
    const isos = monthOf(ym + '-01'), today = isoToday(), past = isos.filter(i => i <= today);
    const R = calcRange(isos), Rp = calcRange(past);
    const cnt = t => vacDays(isos.filter(i => isWorkday(i) && dayOf(i).type === t));
    const feiertage = isos.filter(i => holiday(i) && tplSoll(i) > 0).length;
    const hints = [];
    for (const x of Rp.days) {
      const d = x.d, c = x.c; if (x.d.iso === today) continue;
      if (c.missingEnd) hints.push({ iso: d.iso, t: 'Ausstempeln vergessen' });
      else if (d.type === 'work' && c.soll > 0 && !holiday(d.iso) && !(d.segs || []).length) hints.push({ iso: d.iso, t: 'kein Eintrag' });
    }
    const acc = account();
    return { soll: R.soll, sollBis: Rp.soll, ist: Rp.netto + Rp.credit, netto: Rp.netto, diff: Rp.netto + Rp.credit - Rp.soll, urlaub: cnt('urlaub'), krank: cnt('krank'), sonder: cnt('sonder'), frei: cnt('frei'), feiertage,
      over: acc.over, minus: acc.minus, sites: R.sites, hints, partial: isos[isos.length - 1] > today, days: R.days };
  });
}
function awBody() {
  const ym = awYm(), people = awPeople(), rows = people.map(([k, st]) => ({ k, st, s: awStats(st, ym) }));
  const sites = {}; rows.forEach(r => Object.entries(r.s.sites).forEach(([n, m]) => { const x = sites[n] || (sites[n] = { min: 0, who: {} }); x.min += m; x.who[r.st.name] = (x.who[r.st.name] || 0) + m; }));
  const siteList = Object.entries(sites).filter(([n]) => n !== 'Ohne Baustelle' || sites[n].min).sort((a, b) => b[1].min - a[1].min);
  const nh = rows.reduce((a, r) => a + r.s.hints.length, 0);
  const tile = (l, v, cls = '') => `<div class="rounded-[var(--rb)] bg-raised px-3 py-2"><div class="text-[11px] text-ink3">${l}</div><div class="font-semibold text-[15px] ${cls}">${v}</div></div>`;
  return `<div class="flex flex-wrap items-center gap-2 mb-4"><button class="btn-s !h-10 !w-10 !p-0" data-a="aw-m" data-v="-1" aria-label="Vormonat">${ic('chevL', 18)}</button><b class="text-[18px] min-w-[150px] text-center">${awLabel(ym)}</b><button class="btn-s !h-10 !w-10 !p-0" data-a="aw-m" data-v="1" aria-label="Nächster Monat">${ic('chevR', 18)}</button>
      <span class="flex-1"></span><button class="btn-s !h-10" data-a="aw-csv" data-v="sum">${ic('download', 16)}Übersicht (Excel)</button><button class="btn-s !h-10" data-a="aw-csv" data-v="days">${ic('download', 16)}Tagesliste (Excel)</button></div>
    <p class="text-ink3 text-[13px] mb-4">${rows.length} Mitarbeiter mit Stempelzeiten${rows.some(r => r.s.partial) ? ' · laufender Monat: Ist und Differenz bis heute' : ''}${nh ? ` · <span class="text-yel-ink font-semibold">${nh} Hinweis${nh === 1 ? '' : 'e'}</span>` : ''}. Gerechnet wie im Stundenzettel (Pausenregel, Feiertage, halbe Tage).</p>
    ${rows.length ? `<div class="grid gap-3">${rows.map(({ k, st, s }) => `<div class="rounded-[var(--r)] border border-line p-4">
      <div class="flex flex-wrap items-center gap-2"><b class="text-[16px] flex-1 min-w-[140px]">${esc(st.name)}</b><button class="btn-s !h-9" data-a="aw-pdf" data-v="${esc(k)}">${ic('file', 15)}Stundenzettel PDF</button></div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">${tile('Soll' + (s.partial ? ' bis heute' : ''), hm(s.sollBis))}${tile('Ist', hm(s.ist))}${tile('Differenz', (s.diff > 0 ? '+' : '') + hm(s.diff), s.diff < 0 ? 'text-red-ink' : '')}${tile('Überstunden-Konto', hm(s.over) + (s.minus ? `<div class="text-red-ink text-[12px] font-normal">Minus ${hm(s.minus)}</div>` : ''))}${tile('Urlaub / Sonder', fmtDays(s.urlaub) + (s.sonder ? ' / ' + fmtDays(s.sonder) : '') + ' T.')}${tile('Krank', fmtDays(s.krank) + ' T.', s.krank ? 'text-red-ink' : '')}</div>
      ${s.hints.length ? `<div class="mt-3 rounded-[var(--rb)] p-3 text-[13px]" style="background:var(--t-yel)"><b class="text-yel-ink">Bitte prüfen:</b> ${s.hints.slice(0, 8).map(h => `${deDate(h.iso).slice(0, 6)} ${h.t}`).join(' · ')}${s.hints.length > 8 ? ` · und ${s.hints.length - 8} weitere` : ''}</div>` : ''}
    </div>`).join('')}</div>` : '<div class="kpi text-[14px] text-ink3">Noch keine Mitarbeiter mit Stempeluhr unter LumbraDesk.</div>'}
    <h3 class="font-semibold text-[17px] mt-8 mb-1">Stunden je Baustelle · ${awLabel(ym)}</h3><p class="text-ink3 text-[13px] mb-3">Netto-Arbeitszeit aller Mitarbeiter je eingetragener Baustelle – für die Nachkalkulation. Pro Kunde über alle Monate: in LumbraDesk auf der Kundenseite.</p>
    ${siteList.length ? `<div class="grid gap-1.5">${siteList.map(([n, x]) => `<div class="rounded-[var(--rb)] bg-raised px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]"><b class="flex-1 min-w-[160px]">${esc(n)}</b><span class="text-ink3 text-[12px]">${Object.entries(x.who).map(([w, m]) => `${esc(w.split(' ')[0])} ${hm(m)}`).join(' · ')}</span><b class="text-[15px]">${hm(x.min)} Std.</b></div>`).join('')}</div>` : '<div class="kpi text-[14px] text-ink3">Keine Baustellen in diesem Monat.</div>'}`;
}

/* ---------- Export ---------- */
const csvCell = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvH = m => (Math.round(m / 60 * 100) / 100).toString().replace('.', ',');   // Dezimalstunden für Excel
function awCsv(kind) {
  const ym = awYm(), people = awPeople(), L = [];
  if (kind === 'sum') {
    L.push(['Mitarbeiter', 'Personalnummer', 'Monat', 'Soll (Std.)', 'Ist (Std.)', 'davon gearbeitet (Std.)', 'Differenz (Std.)', 'Überstunden-Konto (Std.)', 'Minusstunden (Std.)', 'Urlaub (Tage)', 'Sonderurlaub (Tage)', 'Krank (Tage)', 'Ausgleich frei (Tage)', 'Feiertage', 'Hinweise']);
    for (const [, st] of people) { const s = awStats(st, ym); L.push([st.name, st.nr || '', awLabel(ym), csvH(s.sollBis), csvH(s.ist), csvH(s.netto), csvH(s.diff), csvH(s.over), csvH(s.minus), fmtDays(s.urlaub), fmtDays(s.sonder), fmtDays(s.krank), fmtDays(s.frei), s.feiertage, s.hints.map(h => deDate(h.iso) + ' ' + h.t).join(', ')]); }
  } else {
    L.push(['Mitarbeiter', 'Datum', 'Wochentag', 'Art', 'Beginn', 'Ende', 'Pause (Min.)', 'Netto (Std.)', 'Soll (Std.)', 'Gutschrift (Std.)', 'Baustellen', 'Notiz']);
    const ART = { work: 'Arbeit', urlaub: 'Urlaub', krank: 'Krank', frei: 'Ausgleich', sonder: 'Sonderurlaub', feiertag: 'Feiertag' };
    for (const [, st] of people) withStaff(st, () => {
      for (const iso of monthOf(ym + '-01')) {
        const d = dayOf(iso), c = calcDay(d); if (!c.soll && !hasData(d)) continue;
        L.push([st.name, deDate(iso), wdOf(iso), d.betrieb ? 'Betriebsurlaub' : holiday(iso) && !(d.segs || []).length ? 'Feiertag: ' + holiday(iso) : ART[d.type] || d.type, c.start, c.end || (c.missingEnd ? 'fehlt' : ''), c.abzug || '', csvH(c.netto), csvH(c.soll), csvH(c.credit), c.sites.map(x => `${x.site} ${hm(x.min)}`).join(', '), d.note || '']);
      }
    });
  }
  const blob = new Blob(['﻿' + L.map(r => r.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  saveBlob(blob, `Stunden_${kind === 'sum' ? 'Uebersicht' : 'Tagesliste'}_${ym}.csv`); toast('Excel-Datei gespeichert.');
}
/* Stundenzettel eines Mitarbeiters (gleiches PDF wie in seiner App) */
async function awPdf(k) {
  const st = STAFF[k]; if (!st || AW.busy) return; AW.busy = true;
  modal(`<div class="text-center py-6"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('file', 26)}</div><div class="font-semibold text-[18px] mt-4">Stundenzettel wird erstellt …</div></div>`);
  const ym = awYm(), s0 = S, d0 = DAYS;
  try {
    S = deepMerge(clone(DEFAULTS), st.settings || {}); S.company = s0.company; S.design = s0.design; DAYS = st.days || {};
    const blob = await buildPdf(monthOf(ym + '-01'), awLabel(ym)); S = s0; DAYS = d0;
    const name = `Stundenzettel_${awLabel(ym).replace(' ', '_')}_${fileSafe(st.name)}.pdf`, file = new File([blob], name, { type: 'application/pdf' });
    saveBlob(blob, name);
    modal(`<div class="text-center pt-2"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic('check', 26, 2.4)}</div><div class="font-semibold text-[19px] mt-4">Stundenzettel gespeichert</div><div class="text-[13px] text-ink3 mt-1 break-all">${esc(name)}</div>
      <div class="grid gap-2 mt-6">${navigator.canShare && navigator.canShare({ files: [file] }) ? `<button class="btn-p" id="aw-share">${ic('send', 17)}Teilen</button>` : ''}<button class="btn-g" data-a="modal-close">Fertig</button></div></div>`);
    const b = $('#aw-share'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file], title: name }); closeModal(); } catch (e) {} };
  } catch (err) { S = s0; DAYS = d0; closeModal(); toast('PDF konnte nicht erstellt werden: ' + (err.message || err), 'err', 5000); }
  finally { S = s0; DAYS = d0; AW.busy = false; }
}

/* ---------- Einbindung ---------- */
const _setBodyAw = setBody;
setBody = function () { if (UI.tab === 'auswertung' && LDS.office) return awBody(); return _setBodyAw(); };
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a^="aw-"]'); if (!a) return;
  if (a.dataset.a === 'aw-m') { AW.ym = awShift(awYm(), +a.dataset.v); rerender(); }
  if (a.dataset.a === 'aw-csv') awCsv(a.dataset.v);
  if (a.dataset.a === 'aw-pdf') awPdf(a.dataset.v);
});
/* Reiter „Auswertung“ erscheint für Büro/Admin, sobald die Anmeldung geprüft ist */
function awEnable() {
  if (!LDS.office || SET_TABS.some(t => t[0] === 'auswertung')) return;
  SET_TABS.unshift(['auswertung', 'Auswertung', 'list']);
  if (/^#\/?einstellungen\/auswertung/.test(location.hash)) route(); else if (UI.route === 'settings') rerender();
}
