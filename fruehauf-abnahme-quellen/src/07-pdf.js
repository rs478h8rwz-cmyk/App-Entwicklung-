
/* =========================================================
   PDF direkt mit jsPDF (Text, Fotos, Unterschriften) –
   kein Bildschirmfoto, daher auf iPad/iPhone genauso sauber wie am PC.
   ========================================================= */
function loadScript(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Bibliothek fehlt: ' + src)); document.head.appendChild(s); }); }
/* Nur Zeichen, die die PDF-Standardschrift kennt */
const T = s => String(s ?? '').replace(/[„“”]/g, '"').replace(/[‚‘’]/g, "'").replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/…/g, '...').replace(/→/g, '->').replace(/[•·]/g, '·').replace(/[^\x00-\xFF€]/g, '');
async function imgInfo(src) {
  if (!src) return null;
  let data = src;
  if (!/^data:/.test(src)) { const b = await (await fetch(src)).blob(); data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data; });
  return { data, w: im.naturalWidth, h: im.naturalHeight, fmt: /^data:image\/png/.test(data) ? 'PNG' : 'JPEG' };
}
async function buildPdf(r) {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 16, CW = W - 2 * M, P = hex2rgb(S.design.primary), INK = [19, 35, 52], GRAY = [110, 124, 138], LINE = [222, 228, 234];
  const logo = await imgInfo(S.company.logo).catch(() => null), g = GEWERKE[r.gewerk], t = TYPES[r.type];
  const title = r.type === 'service' ? 'Serviceprotokoll' : 'Abnahmeprotokoll';
  let y = 0;
  const header = () => {
    doc.setFillColor(...P); doc.rect(0, 0, W, 2.2, 'F');
    if (logo) { const h = 13, w = Math.min(52, (logo.w / logo.h) * h); doc.addImage(logo.data, logo.fmt, M, 9, w, w / (logo.w / logo.h)); }
    else { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...INK); doc.text(T(S.company.name), M, 17); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(title, W - M, 13.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text(T(`${g.name} · Nr. ${r.nr}`), W - M, 19, { align: 'right' });
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 27, W - M, 27); y = 35;
  };
  const newPage = () => { doc.addPage(); header(); };
  const need = h => { if (y + h > H - 22) newPage(); };
  const section = s => { need(16); doc.setFillColor(...P); doc.rect(M, y - 3.2, 1.2, 4.6, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK); doc.text(T(s), M + 3.5, y); y += 5; };
  const LW = 62;
  const row = (label, value) => {
    doc.setFontSize(9.2); const lines = doc.splitTextToSize(T(value || '-'), CW - LW - 3), lab = doc.splitTextToSize(T(label), LW - 3), h = Math.max(lines.length, lab.length) * 4.3 + 2.6;
    need(h); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.text(lab, M, y + 3.2);
    doc.setTextColor(...INK); doc.text(lines, M + LW, y + 3.2); y += h; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y - 0.8, W - M, y - 0.8);
  };
  header();
  /* Kopf-Kasten */
  const date = r.type === 'service' ? ((r.answers.einsaetze || [])[0] || {}).datum : r.answers.datum;
  const facts = [['Kunde', r.answers.kunde], ['Adresse', r.answers.adresse], ['Datum', deDate(date)], ['Monteur', r.answers.monteur], ['Art', `${t.name} · ${g.name}`], [r.type === 'service' ? 'Auftrag' : 'Projekt', r.type === 'service' ? r.answers.auftrag : r.answers.projekt]].filter(x => x[1]);
  const fh = Math.ceil(facts.length / 2) * 11 + 4; doc.setFillColor(244, 247, 249); doc.roundedRect(M, y - 2, CW, fh, 2, 2, 'F');
  facts.forEach(([k, v], i) => { const cx = M + 5 + (i % 2) * (CW / 2), cy = y + 3 + Math.floor(i / 2) * 11; doc.setFontSize(7.6); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.text(T(k), cx, cy); doc.setFontSize(10); doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.text(doc.splitTextToSize(T(v), CW / 2 - 9)[0], cx, cy + 4.6); });
  y += fh + 6;
  /* Service: Zeiten und Zuschläge */
  if (r.type === 'service') {
    section('Einsatzzeiten und Zuschläge');
    const nd = r.answers.notdienst === 'ja', cols = [['Datum', 24], ['Tag', 22], ['Zeit', 24], ['Pause', 16], ['Dauer', 18], ['Zuschlag', CW - 104]];
    need(10); doc.setFillColor(238, 242, 245); doc.rect(M, y - 1, CW, 6.5, 'F'); doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY);
    let cx = M + 2; cols.forEach(([l, w]) => { doc.text(l, cx, y + 3.3); cx += w; }); y += 7.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    (r.answers.einsaetze || []).forEach(e => {
      const z = zuschlag(e.datum, nd), hol = holiday(e.datum), vals = [deDate(e.datum), hol ? 'Feiertag' : wdOf(e.datum), `${e.von || '?'}-${e.bis || '?'}`, +e.pause ? `${e.pause} Min.` : '-', hrs(durH(e)), `${z.total} %${z.nd || z.base !== 100 ? ` (${z.label})` : ''}`];
      need(7); cx = M + 2; doc.setTextColor(...INK); vals.forEach((v, i) => { doc.text(doc.splitTextToSize(T(v), cols[i][1] - 2)[0], cx, y + 3); cx += cols[i][1]; }); y += 6; doc.setDrawColor(...LINE); doc.line(M, y - 1, W - M, y - 1);
    });
    need(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text(T(`Gesamtzeit vor Ort: ${hrs(serviceHours(r))}${nd ? '  ·  Notdienst-Einsatz' : ''}`), M + 2, y + 3.5); y += 10;
  }
  /* Alle Abschnitte */
  const skip = new Set(['kunde', 'adresse', 'datum', 'monteur', 'projekt', 'auftrag', 'einsaetze', 'notdienst']);
  for (const s of visSteps(r)) {
    const fs = visFields(r, s).filter(f => f.type !== 'thumbs' && !skip.has(f.id) && filled(r.answers[f.id]));
    if (!fs.length) continue;
    section(s.title); fs.forEach(f => row(f.label, fmtValue(r, f))); y += 4;
  }
  /* Fotos */
  if (r.photos.length) {
    section(`Fotos (${r.photos.length})`);
    const cw = (CW - 6) / 2, chh = 66;
    for (let i = 0; i < r.photos.length; i++) {
      if (i % 2 === 0) need(chh + 4);
      const p = r.photos[i], k = Math.min(cw / p.w, chh / p.h), w = p.w * k, h = p.h * k, x0 = M + (i % 2) * (cw + 6);
      doc.setFillColor(244, 247, 249); doc.roundedRect(x0, y, cw, chh, 1.5, 1.5, 'F');
      doc.addImage(p.data, 'JPEG', x0 + (cw - w) / 2, y + (chh - h) / 2, w, h, undefined, 'FAST');
      if (i % 2 === 1 || i === r.photos.length - 1) y += chh + 5;
    }
  }
  /* Unterschriften */
  need(52); section('Bestätigung');
  doc.setFontSize(8.6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
  const conf = doc.splitTextToSize(T(r.type === 'service' ? 'Die oben aufgeführten Arbeiten, Zeiten und Materialien wurden ausgeführt bzw. verwendet.' : 'Die Arbeiten wurden wie oben beschrieben ausgeführt und abgenommen. Offene Restarbeiten sind im Protokoll vermerkt.'), CW);
  doc.text(conf, M, y + 2); y += conf.length * 4 + 4;
  const bw = (CW - 10) / 2;
  for (const [i, who] of [['0', 'monteur'], ['1', 'kunde']]) {
    const s = r.sig[who], x0 = M + +i * (bw + 10), sy = y;
    if (s.data && !(who === 'kunde' && s.absent)) { const im = await imgInfo(s.data); const k = Math.min(bw / im.w, 24 / im.h); doc.addImage(im.data, 'PNG', x0, sy + 24 - im.h * k, im.w * k, im.h * k); }
    else if (who === 'kunde' && s.absent) { doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text('Kunde nicht anwesend', x0, sy + 20); }
    doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(x0, sy + 26, x0 + bw, sy + 26);
    doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(T(`${who === 'kunde' ? 'Kunde' : 'Monteur'}${who === 'monteur' && r.answers.monteur ? ' – ' + r.answers.monteur : who === 'kunde' && r.answers.kunde ? ' – ' + r.answers.kunde : ''}`), x0, sy + 30.5);
    doc.text(T(`${s.ort || ''}${s.ort ? ', ' : ''}${deDate(s.datum)}`), x0, sy + 34.5);
  }
  y += 40;
  /* Fußzeile */
  const n = doc.getNumberOfPages(), c = S.company, foot = T([c.name, c.street, c.city, c.phone, c.email, c.web].filter(Boolean).join(' · '));
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, H - 14, W - M, H - 14);
    doc.setFontSize(7.4); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.text(doc.splitTextToSize(foot, CW - 30)[0] || '', M, H - 9.5); doc.text(`Seite ${i} / ${n}`, W - M, H - 9.5, { align: 'right' });
  }
  return doc.output('blob');
}
