/* ---------- Direktstart aus lumbra.desk (Wirtschaftlichkeit 3.6) ----------
   rechner/?start=modul  → öffnet sofort „Modulplan erstellen“ (Modulbelegung)
   rechner/?start=schnell → öffnet sofort die Wärmepumpen-Schnellauslegung
   rechner/?start=roof&id=…  → Modulplan dieses Kunden (aus der Checkliste in lumbra.desk, ab 3.8)
   rechner/?start=quick&id=… → Wärmepumpen-Auslegung dieses Kunden */
(function () {
  const qs = new URLSearchParams(location.search), st = qs.get('start'), pid = qs.get('id'); if (!st) return;
  history.replaceState(null, '', location.pathname + location.hash);
  let n = 0, ready = 0; const t = setInterval(() => {
    if (++n > 120) return clearInterval(t);
    const app = document.getElementById('app'), sp = document.getElementById('splash');
    if (sp && typeof splashFinishNow === 'function' && !sp.classList.contains('s-out')) splashFinishNow(sp);   // Startanimation überspringen
    if (document.getElementById('splash') || !app || !app.innerHTML.trim()) { ready = 0; return; }
    if (++ready < 3) return;   // kurz warten, bis die Startseite fertig gezeichnet ist
    if (pid && typeof LD === 'object' && LD.on && !LD.ready && n < 60) return;   // Kunden erst vom Server holen
    clearInterval(t);
    if (pid && (st === 'roof' || st === 'quick')) return startFor(pid, st);
    if (st === 'modul' && typeof roofStartDialog === 'function') roofStartDialog();
    else if (st === 'schnell' && typeof quickDialog === 'function') quickDialog();
  }, 250);
  async function startFor(id, what) {
    const p = typeof custEnsure === 'function' ? await custEnsure(id) : findProject(id);
    if (!p) { toast('Kunde nicht gefunden – bitte einmal in lumbra.desk öffnen.', 'warn', 5000); return; }
    go(`projekt/${p.id}/1`);
    setTimeout(() => { if (what === 'roof') roofOpen(p.id); else quickDialog(p.id); }, 300);
  }
})();
