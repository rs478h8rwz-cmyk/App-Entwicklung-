/* LumbraDesk – Login-Schutz für eingebundene Apps
   Prüft beim Öffnen, ob jemand angemeldet ist; sonst geht es zur Anmeldung.
   Ohne Internet (Baustelle) darf die App weiterlaufen, wenn die letzte Anmeldung höchstens 14 Tage her ist. */
(function () {
  var root = document.documentElement, KEY = 'ld-ok', back = function () { location.replace('../#/login'); };
  root.style.visibility = 'hidden';
  var last = 0; try { last = +localStorage.getItem(KEY) || 0; } catch (e) {}
  fetch('../api/?r=me', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var dir = location.pathname.replace(/\/[^/]*$/, '/').split('/').filter(Boolean).pop() + '/';
      if (j && j.user && !j.user.mustChange && (j.apps || []).some(function (a) { return a.url === dir; })) { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} root.style.visibility = ''; }
      else { try { localStorage.removeItem(KEY); } catch (e) {} back(); }
    })
    .catch(function () { if (Date.now() - last < 14 * 864e5) root.style.visibility = ''; else back(); });
})();
