/* =========================================================
   „Das sagen Kunden“ – letzte Seite der PDF (beide Layouts)
   Bewertungen werden in den Einstellungen gepflegt
   ========================================================= */
const REVIEWS_DEFAULT = { on: true, summary: '', items: [] };
DEFAULT_SETTINGS.reviews = clone(REVIEWS_DEFAULT);
if (!S.reviews) S.reviews = clone(REVIEWS_DEFAULT);
DOC_TEXT.reviews = { label: 'Das sagen Kunden', badge: 'Kundenstimmen', title: 'Das sagen unsere *Kunden*', lead: 'Echte Stimmen von Kundinnen und Kunden, die wir bereits begleiten durften.' };
PAGE_KEYS.push('reviews'); SALES_KEYS.push('reviews');
const reviewList = () => ((S.reviews || {}).items || []).filter(r => r.on !== false && String(r.text || '').trim());
const reviewsOn = () => (S.reviews || {}).on !== false && reviewList().length > 0;
const starSvg = (n, size = 4) => { const one = on => svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="${on ? '#F5A524' : '#D9DEE5'}"/></svg>`); return `<span style="display:inline-flex;gap:0.6mm">${[1, 2, 3, 4, 5].map(i => `<img src="${one(i <= n)}" style="width:${size}mm;height:${size}mm;display:block">`).join('')}</span>`; };
DOC.reviews = function (p, R) {
  const sales = CUR_LAYOUT === 'sales', list = reviewList().slice(0, 8), many = list.length > 4;
  let b = sales ? sChap('reviews', p, R) : chap(sMark(txt('reviews', 'title')).replace(/<[^>]+>/g, ''), txt('reviews', 'lead'));
  if (S.reviews.summary) b += `<div style="display:flex;align-items:center;gap:3mm;margin:-2mm 0 5mm">${starSvg(5, 4.6)}<b style="font-size:10pt">${esc(S.reviews.summary)}</b></div>`;
  b += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm">${list.map(r => `<div style="background:var(--tile);border-radius:var(--dr);padding:${many ? '4.5mm 5mm' : '6mm'}">
      <div style="display:flex;justify-content:space-between;align-items:center">${starSvg(Math.max(1, Math.min(5, nz(r.stars, 5))), many ? 3.6 : 4.2)}<span style="font-family:Georgia,serif;font-size:${many ? 26 : 32}pt;line-height:0.6;color:var(--p);opacity:.35">“</span></div>
      <div style="font-size:${many ? 8.8 : 9.8}pt;line-height:1.5;margin-top:2.5mm;color:var(--ink)">${esc(r.text)}</div>
      <div style="margin-top:3mm;font-size:8.6pt;font-weight:700">${esc(r.name || '')}${r.place ? `<span style="font-weight:400;color:var(--ink3)"> · ${esc(r.place)}</span>` : ''}</div></div>`).join('')}</div>`;
  b += `<div style="margin-top:7mm">${typeof salesContact === 'function' && sales ? salesContact(p) : advisorCard(p, R)}</div>`;
  return { title: 'Das sagen Kunden', body: b };
};
/* Einstellungen → Dokument & Verkauf: Bewertungen pflegen */
const _setDok16 = SET.dokument;
SET.dokument = () => _setDok16() + sCard('users', 'Das sagen Kunden', 'Letzte Seite im Dokument (komplette und Vertriebs-PDF). Bitte nur echte Bewertungen mit Einverständnis der Kunden verwenden.', `
  <div class="rounded-[calc(var(--r)-4px)] bg-raised px-4">${toggleRow('Seite „Das sagen Kunden“ anzeigen', 's:reviews.on', 'Erscheint nur, wenn mindestens eine Bewertung eingetragen und aktiv ist.')}</div>
  <div class="mt-4">${field('Zusammenfassung (optional)', 's:reviews.summary', { ph: 'z. B. 4,9 von 5 Sternen bei Google (120 Bewertungen)' })}</div>
  <div class="space-y-3 mt-5">${(S.reviews.items || []).map((r, i) => `<div class="rounded-[calc(var(--r)-4px)] border border-line p-3">
    <div class="flex flex-wrap items-center gap-3">${tgl(`s:reviews.items.${i}.on`, r.on !== false)}<div class="flex-1 min-w-[140px]">${inp(`s:reviews.items.${i}.name`, { ph: 'Vorname, z. B. Frank' })}</div><div class="flex-1 min-w-[140px]">${inp(`s:reviews.items.${i}.place`, { ph: 'Ort (optional)' })}</div>
      <select class="inp !w-auto !h-10" data-b="s:reviews.items.${i}.stars" data-t="n">${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${nz(r.stars, 5) === n ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}</select>
      <button class="btn-g !px-2" data-a="rv-del" data-i="${i}" aria-label="Bewertung löschen">${ic('x', 16)}</button></div>
    <div class="mt-2">${area('', `s:reviews.items.${i}.text`, 3, { ph: 'Bewertungstext' }).replace('<span class="lbl"></span>', '')}</div></div>`).join('') || '<div class="hint">Noch keine Bewertungen – fügen Sie Ihre erste hinzu.</div>'}</div>
  <button class="chip mt-3" data-a="rv-add">${ic('plus', 14)}Bewertung hinzufügen</button>
  <div class="grid sm:grid-cols-2 gap-4 mt-6">${field('Überschrift (*Wort* = Hauptfarbe)', 's:doc.texts.reviews.title', { ph: DOC_TEXT.reviews.title })}${field('Einleitung', 's:doc.texts.reviews.lead', { ph: DOC_TEXT.reviews.lead })}</div>`);
