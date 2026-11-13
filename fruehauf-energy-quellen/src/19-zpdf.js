/* ---------- PDF beim Kunden in lumbra.desk ablegen (Wirtschaftlichkeit 3.8) ----------
   Jede fertige PDF (komplett oder Vertriebs-PDF) wird zusätzlich beim Kunden unter „Dateien & Fotos“ abgelegt
   und hängt dort an der Checkliste („Wirtschaftlichkeit berechnet“, „Dachbelegung geprüft“, „Wärmepumpe ausgelegt“).
   Die vorige PDF dieses Kunden wird dabei ersetzt. Ohne lumbra.desk passiert nichts. */
const _pdfReadyLD = pdfReady;
pdfReady = function (blob, name) {
  const r = _pdfReadyLD.apply(this, arguments);
  const p = typeof curProject === 'function' ? curProject() : null;
  if (p && typeof LD === 'object' && LD.on && blob && blob.size <= 15 * 1024 * 1024) {
    const fr = new FileReader();
    fr.onload = async () => {
      const send = () => ldpPost('crm-file-up', { project: p.id, name, type: 'application/pdf', tag: 'wirt', data: String(fr.result).split(',')[1] });
      try { let res = await send(); if (!res.ok && res.status === 404 && typeof ldpSync === 'function') { await ldpSync(); res = await send(); }   // Kunde noch nicht auf dem Server
        if (res.ok) toast('PDF liegt auch beim Kunden in lumbra.desk.', 'ok', 3000); } catch (e) {}
    };
    fr.readAsDataURL(blob);
  }
  return r;
};
