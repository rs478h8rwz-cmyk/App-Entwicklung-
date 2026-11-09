
/* =========================================================
   Stundenzettel als PDF (direkt mit jsPDF – auch auf iPad/iPhone sauber)
   ========================================================= */
function loadScript(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Bibliothek fehlt: ' + src)); document.head.appendChild(s); }); }
const T = s => String(s ?? '').replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/[–—]/g, '-').replace(/−/g, '-').replace(/×/g, 'x').replace(/…/g, '...').replace(/[•·]/g, '·').replace(/[^\x00-\xFF€]/g, '');
async function imgInfo(src) {
  if (!src) return null; let data = src;
  if (!/^data:/.test(src)) { const b = await (await fetch(src)).blob(); data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data; });
  return { data, w: im.naturalWidth, h: im.naturalHeight, fmt: /^data:image\/png/.test(data) ? 'PNG' : 'JPEG' };
}
async function buildPdf(isos, label) {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 14, CW = W - 2 * M, P = hex2rgb(S.design.primary), INK = [19, 35, 52], GRAY = [110, 124, 138], LINE = [222, 228, 234], RED = [200, 60, 40], GREEN = P;
  const logo = await imgInfo(S.company.logo).catch(() => null), R = calcRange(isos);
  let y = 0;
  const header = () => {
    doc.setFillColor(...P); doc.rect(0, 0, W, 2.2, 'F');
    if (logo) { const h = 12, w = Math.min(50, (logo.w / logo.h) * h); doc.addImage(logo.data, logo.fmt, M, 8, w, w / (logo.w / logo.h)); }
    else { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...INK); doc.text(T(S.company.name), M, 16); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(T(`Stundenzettel ${label}`), W - M, 12.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text(T(`${S.person.name}${S.person.nr ? ' · Pers.-Nr. ' + S.person.nr : ''} · ${deDate(isos[0])} - ${deDate(isos[isos.length - 1])}`), W - M, 18, { align: 'right' });
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 25, W - M, 25); y = 31;
  };
  header();
  /* Tabelle */
  const cols = [['Tag', 23], ['Kommen', 14], ['Gehen', 14], ['Pause', 13], ['Abzug', 13], ['Arbeit', 14], ['Soll', 13], ['Überst.', 15], ['Baustellen / Bemerkung', CW - 119]];
  const thead = () => { doc.setFillColor(238, 242, 245); doc.rect(M, y - 1, CW, 7, 'F'); doc.setFontSize(7.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY); let x = M + 1.5; cols.forEach(([l, w], i) => { doc.text(l, i >= 3 && i <= 7 ? x + w - 3 : x, y + 3.6, { align: i >= 3 && i <= 7 ? 'right' : 'left' }); x += w; }); y += 8; };
  thead();
  const rows = R.days.filter(x => x.c.soll > 0 || hasData(x.d));
  for (const { d, c } of rows) {
    const work = d.type === 'work', bem = [];
    if (!work) bem.push(typeName(d.type) + (d.type === 'feiertag' && holiday(d.iso) ? ' (' + holiday(d.iso) + ')' : ''));
    c.sites.forEach(s => bem.push(`${s.site} (${hm(s.min)})`));
    if (c.missingEnd) bem.push('Ausstempeln fehlt');
    if (d.note) bem.push('Notiz: ' + d.note);
    if (d.edited) bem.push('nachgetragen');
    doc.setFontSize(8.4); doc.setFont('helvetica', 'normal');
    const bl = doc.splitTextToSize(T(bem.join('\n') || '-'), cols[8][1] - 3), h = Math.max(1, bl.length) * 3.7 + 3;
    if (y + h > H - 60) { doc.addPage(); header(); thead(); }
    const vals = [`${wdOf(d.iso).slice(0, 2)}, ${deDate(d.iso).slice(0, 6)}`, work ? c.start || '-' : '-', work ? c.end || (c.open ? '?' : '-') : '-', work && c.start ? hm(c.pause) : '-', work && c.start ? hm(c.abzug) : '-', hm(c.netto + c.credit), hm(c.soll), c.over ? '+' + hm(c.over) : '-'];
    let x = M + 1.5;
    vals.forEach((v, i) => { const w = cols[i][1], right = i >= 3; doc.setTextColor(...(i === 7 && c.over > 0 ? GREEN : INK)); if (i === 5) doc.setFont('helvetica', 'bold'); doc.text(T(v), right ? x + w - 3 : x, y + 3.2, { align: right ? 'right' : 'left' }); doc.setFont('helvetica', 'normal'); x += w; });
    doc.setTextColor(...INK); doc.text(bl, x, y + 3.2);
    y += h; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y - 0.8, W - M, y - 0.8);
  }
  /* Summen */
  y += 3; doc.setFillColor(244, 247, 249); doc.roundedRect(M, y, CW, 24, 2, 2, 'F');
  const vac = vacation(+isos[0].slice(0, 4)), bal = balance();
  const tiles = [['Arbeitszeit', hm(R.netto + R.credit)], ['Soll', hm(R.soll)], ['Überstunden', R.over ? '+' + hm(R.over) : '0:00'], ['Überstunden gesamt', bal ? '+' + hm(bal) : '0:00'], ['Urlaub / Krank', `${R.count('urlaub')} / ${R.count('krank')} Tage`], ['Resturlaub', `${vac.left} Tage`]];
  tiles.forEach(([k, v], i) => { const cx = M + 5 + (i % 3) * (CW / 3), cy = y + 6 + Math.floor(i / 3) * 10.5; doc.setFontSize(7.4); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.text(T(k), cx, cy); doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...(v.startsWith('+') ? GREEN : INK)); doc.text(T(v), cx, cy + 4.6); });
  y += 30;
  /* Baustellen-Summen */
  const sites = Object.entries(R.sites).sort((a, b) => b[1] - a[1]);
  if (sites.length) {
    if (y + 10 + sites.length * 5 > H - 45) { doc.addPage(); header(); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.text('Stunden je Baustelle', M + 3.5, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    sites.forEach(([k, m]) => { doc.setTextColor(...INK); doc.text(T(k), M + 1.5, y + 3); doc.setFont('helvetica', 'bold'); doc.text(hm(m), M + 90, y + 3, { align: 'right' }); doc.setFont('helvetica', 'normal'); y += 5; doc.setDrawColor(...LINE); doc.line(M, y - 0.6, M + 92, y - 0.6); });
    y += 4;
  }
  /* Hinweis und Unterschriften */
  if (y > H - 45) { doc.addPage(); header(); }
  doc.setFontSize(7.8); doc.setTextColor(...GRAY);
  doc.text(doc.splitTextToSize(T(`Pausenregel: Je Arbeitstag werden mindestens ${S.minPause} Min. Pause abgezogen${S.pauseOnlyOver6 ? ' (ab 6 Std. Arbeit)' : ''}; längere Pausen werden vollständig abgezogen. "Pause" = gestempelte Pausen und Unterbrechungen, "Abzug" = davon abgezogen. Minusstunden werden nicht verrechnet. Nachträgliche Änderungen sind mit "nachgetragen" gekennzeichnet.`), CW), M, y + 2);
  y = Math.max(y + 16, H - 38);
  const bw = (CW - 12) / 2;
  [['Mitarbeiter', S.person.name], ['Geprüft', S.recipient.name]].forEach(([l, n], i) => { const x0 = M + i * (bw + 12); doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(x0, y + 12, x0 + bw, y + 12); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(T(`${l}${n ? ' - ' + n : ''} · Datum, Unterschrift`), x0, y + 16); });
  /* Fußzeile */
  const n = doc.getNumberOfPages(), c = S.company, foot = T([c.name, c.street, c.city, c.phone].filter(Boolean).join(' · '));
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, H - 12, W - M, H - 12); doc.setFontSize(7.2); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.text(foot, M, H - 8); doc.text(T(`Erstellt ${deDate(isoToday())} ${nowHM()} · Seite ${i} / ${n}`), W - M, H - 8, { align: 'right' }); }
  return doc.output('blob');
}

/* Urlaubsantrag */
async function buildVacationPdf(v) {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, M = 18, CW = W - 2 * M, P = hex2rgb(S.design.primary), INK = [19, 35, 52], GRAY = [110, 124, 138], LINE = [222, 228, 234];
  const logo = await imgInfo(S.company.logo).catch(() => null);
  doc.setFillColor(...P); doc.rect(0, 0, W, 2.2, 'F');
  if (logo) { const h = 13, w = Math.min(52, (logo.w / logo.h) * h); doc.addImage(logo.data, logo.fmt, M, 10, w, w / (logo.w / logo.h)); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...INK); doc.text('Urlaubsantrag', W - M, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text(T(`eingereicht am ${deDate(isoToday())}`), W - M, 24, { align: 'right' });
  doc.setDrawColor(...LINE); doc.line(M, 31, W - M, 31);
  let y = 42;
  const row = (k, val, big) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY); doc.text(T(k), M, y); doc.setFont('helvetica', 'bold'); doc.setFontSize(big ? 15 : 11.5); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(T(val), CW - 62), M + 62, y); y += big ? 11 : 9; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y - 5, W - M, y - 5); };
  row('Mitarbeiter', `${S.person.name}${S.person.nr ? ' (Pers.-Nr. ' + S.person.nr + ')' : ''}`);
  row('Zeitraum', `${wdOf(v.von).slice(0, 2)}, ${deDate(v.von)} bis ${wdOf(v.bis).slice(0, 2)}, ${deDate(v.bis)}`, true);
  row('Urlaubstage', `${v.n} Arbeitstag${v.n === 1 ? '' : 'e'} (ohne Wochenende und Feiertage)`);
  row('Urlaubsanspruch', `${v.total} Tage`);
  row('Resturlaub vorher', `${v.leftBefore} Tage`);
  row('Resturlaub danach', `${v.leftAfter} Tage`);
  if (v.note) row('Bemerkung', v.note);
  /* einzelne Tage */
  y += 4; doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.text('Urlaubstage', M + 3.5, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); const days = workDaysIn(v.von, v.bis);
  days.forEach((d, i) => { const cx = M + (i % 4) * (CW / 4), cy = y + Math.floor(i / 4) * 5.5; doc.text(T(`${wdOf(d).slice(0, 2)}, ${deDate(d)}`), cx, cy); });
  y += Math.ceil(days.length / 4) * 5.5 + 12;
  /* Unterschriften und Genehmigung */
  const bw = (CW - 12) / 2;
  doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(M, y + 12, M + bw, y + 12); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(T(`Datum, Unterschrift ${S.person.name}`), M, y + 16);
  y += 28; doc.setFillColor(244, 247, 249); doc.roundedRect(M, y, CW, 34, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(T(`Vom Büro auszufüllen${S.recipient.name ? ' (' + S.recipient.name + ')' : ''}`), M + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); [['genehmigt', 0], ['abgelehnt', 40]].forEach(([l, dx]) => { doc.setDrawColor(...INK); doc.rect(M + 5 + dx, y + 12, 4.5, 4.5); doc.text(l, M + 12 + dx, y + 15.6); });
  doc.line(M + 5, y + 28, M + 5 + bw, y + 28); doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text('Datum, Unterschrift', M + 5, y + 32);
  const c = S.company; doc.setFontSize(7.2); doc.text(T([c.name, c.street, c.city, c.phone].filter(Boolean).join(' · ')), M, 287);
  return doc.output('blob');
}
