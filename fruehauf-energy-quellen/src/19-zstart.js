/* ---------- Direktstart aus lumbra.desk (Wirtschaftlichkeit 3.6) ----------
   rechner/?start=modul  → öffnet sofort „Modulplan erstellen“ (Modulbelegung)
   rechner/?start=schnell → öffnet sofort die Wärmepumpen-Schnellauslegung */
(function () {
  const st = new URLSearchParams(location.search).get('start'); if (!st) return;
  history.replaceState(null, '', location.pathname + location.hash);
  let n = 0, ready = 0; const t = setInterval(() => {
    if (++n > 120) return clearInterval(t);
    const app = document.getElementById('app'), sp = document.getElementById('splash');
    if (sp && typeof splashFinishNow === 'function' && !sp.classList.contains('s-out')) splashFinishNow(sp);   // Startanimation überspringen
    if (document.getElementById('splash') || !app || !app.innerHTML.trim()) { ready = 0; return; }
    if (++ready < 3) return;   // kurz warten, bis die Startseite fertig gezeichnet ist
    clearInterval(t);
    if (st === 'modul' && typeof roofStartDialog === 'function') roofStartDialog();
    else if (st === 'schnell' && typeof quickDialog === 'function') quickDialog();
  }, 250);
})();
