/* Tastatur-Umschalter: Zahlenfelder starten mit Zahlentastatur, lassen sich aber
   jederzeit auf Buchstaben umstellen (und zurück). Nichts wird auf Zahlen begrenzt. */
const KBD_TEXT = new Set();
const kbdKey = el => el.dataset.b || el.dataset.compqty || (el.dataset.roof !== undefined ? 'roof' + el.dataset.roof + el.dataset.k : '') || el.id || '';
const kbdNumeric = el => el && el.tagName === 'INPUT' && (el.dataset.kbd || /^(decimal|numeric|tel)$/.test(el.getAttribute('inputmode') || '') || el.type === 'tel');
let kbdEl = null, kbdBtn = null, kbdSkipBlur = false;
function kbdSetText(el, on) {
  if (!el.dataset.kbd) el.dataset.kbd = (el.type === 'tel' ? 'tel:' : '') + (el.getAttribute('inputmode') || '');
  const [tel, mode] = el.dataset.kbd.includes(':') ? el.dataset.kbd.split(':') : ['', el.dataset.kbd];
  if (on) { el.setAttribute('inputmode', 'text'); if (tel) el.type = 'text'; }
  else { if (mode) el.setAttribute('inputmode', mode); else el.removeAttribute('inputmode'); if (tel) el.type = 'tel'; }
}
const kbdIsText = el => el.getAttribute('inputmode') === 'text';
function kbdPlace() {
  if (!kbdBtn || !kbdEl || !document.contains(kbdEl)) return kbdHide();
  kbdBtn.textContent = kbdIsText(kbdEl) ? '123 Zahlen' : 'ABC Buchstaben';
  const r = kbdEl.getBoundingClientRect();
  kbdBtn.style.top = Math.max(4, r.top - 34) + 'px';
  kbdBtn.style.left = Math.max(4, Math.min(innerWidth - 4, r.right) - kbdBtn.offsetWidth) + 'px';
}
function kbdHide() { if (kbdBtn) kbdBtn.style.display = 'none'; kbdEl = null; }
function kbdShow(el) {
  if (!kbdBtn) {
    kbdBtn = document.createElement('button');
    kbdBtn.type = 'button'; kbdBtn.id = 'kbd-switch';
    kbdBtn.style.cssText = 'position:fixed;z-index:9999;height:30px;padding:0 12px;border-radius:999px;font-family:inherit;font-size:13px;font-weight:600;line-height:30px;white-space:nowrap;background:var(--p,#2a7);color:#fff;border:0;box-shadow:0 2px 8px rgba(0,0,0,.3)';
    /* Fokus im Feld halten, sonst schließt die Tastatur */
    const keep = e => e.preventDefault();
    kbdBtn.addEventListener('pointerdown', keep); kbdBtn.addEventListener('mousedown', keep); kbdBtn.addEventListener('touchstart', keep, { passive: false });
    const flip = e => {
      e.preventDefault(); const el = kbdEl; if (!el) return;
      const on = !kbdIsText(el), k = kbdKey(el); kbdSetText(el, on);
      if (k) { if (on) KBD_TEXT.add(k); else KBD_TEXT.delete(k); }
      /* Tastatur neu öffnen, damit iOS/Android den neuen Modus zeigt */
      const pos = el.selectionStart; kbdSkipBlur = true; el.blur(); el.focus(); kbdSkipBlur = false;
      try { el.setSelectionRange(pos, pos); } catch (err) {}
      kbdEl = el; kbdPlace();
    };
    kbdBtn.addEventListener('touchend', flip); kbdBtn.addEventListener('click', flip);
    document.body.appendChild(kbdBtn);
  }
  kbdEl = el; kbdBtn.style.display = 'block'; kbdPlace();
}
const isTablet = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) >= 700;
const kbdTouch = () => matchMedia('(pointer: coarse)').matches && !(PERSONAL && PERSONAL.kbdPill === false);
document.addEventListener('focusin', e => {
  const el = e.target;
  if (!kbdNumeric(el)) { if (el !== kbdBtn) kbdHide(); return; }
  const k = kbdKey(el); if (k && KBD_TEXT.has(k) && !kbdIsText(el)) kbdSetText(el, true);
  if (kbdTouch()) kbdShow(el);
});
document.addEventListener('focusout', e => { if (kbdSkipBlur || e.target !== kbdEl) return; setTimeout(() => { if (!kbdSkipBlur && document.activeElement !== kbdEl) kbdHide(); }, 120); });
window.addEventListener('scroll', () => kbdEl && kbdPlace(), true);
window.addEventListener('resize', () => kbdEl && kbdPlace());
if (window.visualViewport) visualViewport.addEventListener('resize', () => kbdEl && kbdPlace());

/* Zahlen auch aus Text lesen, z. B. „ca. 3.000 Liter“ → 3000 */
{
  const _pnum = pnum;
  pnum = function (s) {
    const v = _pnum(s); if (isFinite(v) || typeof s === 'number') return v;
    const m = /-?\d[\d.]*(?:,\d+)?/.exec(String(s ?? '')); return m ? _pnum(m[0]) : NaN;
  };
}
