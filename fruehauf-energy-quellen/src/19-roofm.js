/* =========================================================
   Modulplan auf dem Handy
   Gleiche Funktionen wie am iPad/PC, nur anders angeordnet:
   - Dachbild nimmt den ganzen Bildschirm ein
   - Schritte oben als Leiste, Werkzeuge und „Weiter“ unten griffbereit
   - alle Einstellungen in einem ausklappbaren Feld („Einstellungen“)
   - Foto direkt mit der Kamera aufnehmen
   ========================================================= */
const roofPhone = () => Math.min(innerWidth, innerHeight) < 600;
const roofLand = () => innerWidth > innerHeight;   // Handy quer: Leisten zusammenlegen
const RM_TOOLS = [['add', 'Setzen', 'plus'], ['select', 'Auswählen', 'grid'], ['string', 'Strings', 'bolt'], ['opt', 'Optimierer', 'sparkle']];

const _roofRenderDesk = roofRender;
roofRender = function () {
  if (!roofPhone()) return _roofRenderDesk();
  const box = $('#roof-ed'); if (!box || !RS) return;
  const p = roofP(), f = roofF(), g = faceGeom(f);
  if (RS.rmStep !== RS.step) { RS.rmStep = RS.step; RS.sheet = RS.step === 'photo' || RS.step === 'ref'; }   // Foto/Referenz: Einstellungen offen, Fläche/Belegen: freier Blick
  const steps = [['photo', 'Foto'], ['corners', 'Fläche'], ['ref', 'Referenz'], ['mod', 'Belegen']];
  const can = { photo: true, corners: !!f.photo, ref: !!f.photo, mod: !!(g && !g.bad) };
  const stepChips = steps.map(([k, l], i) => `<button class="chip !h-8 shrink-0 ${RS.step === k ? '!border-p !text-ink !bg-p/10' : ''} ${can[k] ? '' : 'opacity-40 pointer-events-none'}" data-r="step" data-v="${k}"><b class="text-p">${i + 1}</b>&nbsp;${l}</button>`).join(''), land = roofLand();
  box.innerHTML = `
  <div class="flex items-center gap-2 px-3 pb-2 ${land ? 'pt-2' : ''} border-b border-line" style="${land ? 'padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right))' : 'padding-top:max(8px,env(safe-area-inset-top))'}">
    <button class="btn-g !h-10 !w-10 !px-0 shrink-0" data-r="close" aria-label="Schließen">${ic('x', 20)}</button>
    <div class="${land ? 'shrink-0 max-w-[150px]' : 'flex-1'} min-w-0 leading-tight"><div class="font-semibold text-[15px] truncate">Modulplan</div><div class="text-[12px] text-ink3 truncate">${esc(p.customer.name || 'Neue Berechnung')} · ${esc(f.name)}</div></div>
    ${land ? `<div class="flex-1 min-w-0 flex gap-1 overflow-x-auto no-scrollbar">${stepChips}</div>` : ''}
    <button class="btn-s !h-10 !px-3 text-[13px] shrink-0" data-r="save" aria-label="Stand speichern">${ic('download', 16)}Sichern</button>
  </div>
  ${land ? '' : `<div class="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar border-b border-line">${stepChips}</div>`}
  <div class="relative flex-1 min-h-0">
    <div id="roof-stage" class="absolute inset-0 bg-black/40 touch-none select-none overflow-hidden"><canvas id="roof-cv" class="absolute inset-0 w-full h-full block"></canvas>
      <div id="roof-tip" class="absolute left-3 right-3 bottom-2 text-[11px] leading-snug text-white/80 pointer-events-none"></div>
      <div id="roof-badge" class="absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none hidden rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-lg max-w-[92%] text-center" style="background:rgba(12,20,28,.82);backdrop-filter:blur(6px)"></div>
      <div id="roof-pad" class="absolute hidden flex-col items-center gap-1 select-none" style="left:12px;bottom:70px"><div class="relative w-[96px] h-[96px] rounded-full border-2 border-white/70 bg-black/35 backdrop-blur-sm touch-none" id="roof-pad-ring" title="Feinjustieren"><div id="roof-pad-knob" class="absolute w-9 h-9 rounded-full bg-white/90 shadow" style="left:30px;top:30px"></div><span class="absolute inset-0 grid place-items-center text-[10px] text-white/70 pointer-events-none" style="padding-top:62px">fein</span></div><div class="text-[11px] text-white/80" id="roof-pad-lbl"></div></div>
      <div class="absolute right-2 top-2 flex flex-col gap-1.5"><button class="btn-s !h-10 !w-10 !px-0 text-[20px]" data-r="zoom" data-v="in" aria-label="Vergrößern">+</button><button class="btn-s !h-10 !w-10 !px-0 text-[20px]" data-r="zoom" data-v="out" aria-label="Verkleinern">−</button><button class="btn-s !h-10 !w-10 !px-0" data-r="zoom" data-v="fit" aria-label="Einpassen">${ic('grid', 16)}</button></div>
    </div>
  </div>
  <div id="rm-sheet" class="bg-card border-t border-line rounded-t-[18px] shadow-[0_-10px_30px_rgba(0,0,0,.25)] flex flex-col -mt-3 relative z-10 ${RS.sheet ? '' : 'hidden'}" style="max-height:${RS.step === 'photo' ? 60 : 46}dvh">
    <button class="w-full flex items-center justify-center gap-2 py-2 text-[13px] text-ink3 shrink-0" data-r="sheet"><span class="w-10 h-1.5 rounded-full bg-line2"></span>Einstellungen schließen</button>
    <div id="roof-panel" class="overflow-y-auto px-4 pb-4 space-y-4">${roofPanel(p, f, g)}</div>
  </div>
  <div id="roof-foot">${roofFoot(p, f)}</div>`;
  roofBindStage(); roofDraw();
};

/* Fußleiste auf dem Handy: Werkzeuge (beim Belegen), Summe, Zurück/Weiter, Einstellungen */
const _roofFootDesk = roofFoot;
roofFoot = function (p, f) {
  if (!roofPhone()) return _roofFootDesk(p, f);
  const tot = p.roof.faces.reduce((a, x) => [a[0] + x.mods.length, a[1] + faceKwp(x)], [0, 0]);
  const tools = RS.step === 'mod' ? `<div class="flex gap-1 px-2 pt-2 overflow-x-auto no-scrollbar">${RM_TOOLS.map(([k, l, i]) => `<button class="flex-1 min-w-[64px] rounded-[var(--rb)] py-1.5 flex flex-col items-center gap-0.5 text-[11.5px] font-medium border ${RS.mode === k ? 'border-p text-ink bg-p/10' : 'border-line text-ink2'}" data-r="mode" data-v="${k}">${ic(i, 17)}${l}</button>`).join('')}
      ${RS.mode === 'string' || RS.mode === 'opt' ? '' : `<button class="min-w-[56px] rounded-[var(--rb)] py-1.5 flex flex-col items-center gap-0.5 text-[11.5px] border border-line text-ink2" data-r="fill">${ic('grid', 17)}Füllen</button>
      <button class="min-w-[56px] rounded-[var(--rb)] py-1.5 flex flex-col items-center gap-0.5 text-[11.5px] border border-line ${RS.sel.size ? 'text-ember' : 'text-ink3 opacity-50'}" data-r="del" ${RS.sel.size ? '' : 'disabled'}>${ic('trash', 17)}Löschen</button>`}
      <button class="min-w-[56px] rounded-[var(--rb)] py-1.5 flex flex-col items-center gap-0.5 text-[11.5px] border border-line ${RS.hist.length ? 'text-ink2' : 'text-ink3 opacity-50'}" data-r="undo" ${RS.hist.length ? '' : 'disabled'}>${ic('arrowL', 17)}Zurück</button></div>` : '';
  const next = RS.step === 'mod' ? `<button class="btn-p !h-11 !px-4 text-[14px]" data-r="apply" ${tot[0] ? '' : 'disabled'}>${ic('check', 16)}Übernehmen</button>`
    : `<button class="btn-p !h-11 !px-4 text-[14px]" data-r="next" ${RS.step === 'photo' && !f.photo ? 'disabled' : ''}>Weiter ${ic('arrowR', 16)}</button>`;
  if (roofLand()) return `<div class="flex items-center gap-2 px-3 py-1.5" style="padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right));padding-bottom:max(6px,env(safe-area-inset-bottom))">
    ${RS.step !== 'photo' ? `<button class="btn-s !h-10 !w-10 !px-0 shrink-0" data-r="prev" aria-label="Zurück">${ic('arrowL', 17)}</button>` : ''}<button class="btn-s !h-10 !w-10 !px-0 shrink-0 ${RS.sheet ? '!border-p !text-p' : ''}" data-r="sheet" aria-label="Einstellungen">${ic('gear', 18)}</button>
    <div class="flex-1 min-w-0">${tools.replace('px-2 pt-2', 'px-0 pt-0').replace(/py-1\.5/g, 'py-1')}</div>
    <div class="text-[12px] leading-tight text-right whitespace-nowrap"><b>${f.mods.length} Module</b><div class="text-ink3">${num(faceKwp(f), 2)} kWp</div></div>${next}<span id="roof-warn" class="hidden"></span></div>`;
  return `${tools}<div class="flex items-center gap-2 px-3 pt-2" style="padding-bottom:max(10px,env(safe-area-inset-bottom))">
    ${RS.step !== 'photo' ? `<button class="btn-s !h-11 !w-11 !px-0 shrink-0" data-r="prev" aria-label="Zurück">${ic('arrowL', 17)}</button>` : ''}
    <button class="btn-s !h-11 !w-11 !px-0 shrink-0 ${RS.sheet ? '!border-p !text-p' : ''}" data-r="sheet" aria-label="Einstellungen">${ic('gear', 18)}</button>
    <div class="flex-1 min-w-0 text-[12.5px] leading-tight text-right whitespace-nowrap"><b>${f.mods.length} Module</b><div class="text-ink3">${num(faceKwp(f), 2)} kWp${p.roof.faces.length > 1 ? ` · gesamt ${num(tot[1], 2)}` : ''}</div></div>
    ${next}<span id="roof-warn" class="hidden"></span></div>`;
};

/* Panel auf dem Handy: Foto auch direkt mit der Kamera */
const _roofPanelDesk = roofPanel;
roofPanel = function (p, f, g) {
  const h = _roofPanelDesk(p, f, g); if (!roofPhone() || RS.step !== 'photo') return h;
  return h.replace(/<label class="btn-p w-full mt-3 cursor-pointer">[\s\S]*?<\/label>/, `<label class="btn-p w-full mt-3 cursor-pointer">${ic('camera', 17)}Foto aufnehmen<input type="file" accept="image/*" capture="environment" class="hidden" data-r="photo"></label>
    <label class="btn-s w-full mt-2 cursor-pointer">${ic('image', 17)}${f.photo ? 'Anderes Foto aus der Mediathek' : 'Aus der Mediathek wählen'}<input type="file" accept="image/*" class="hidden" data-r="photo"></label>`);
};

/* Einstellungen auf/zu – ohne das Dachbild neu aufzubauen */
document.addEventListener('click', e => {
  const a = e.target.closest('#roof-ed [data-r="sheet"]'); if (!a || !RS) return;
  e.stopImmediatePropagation(); RS.sheet = !RS.sheet;
  const s = $('#rm-sheet'); if (s) s.classList.toggle('hidden', !RS.sheet);
  const ft = $('#roof-foot'); if (ft) ft.innerHTML = roofFoot(roofP(), roofF());
  roofDraw();   // Dachbild an die neue Höhe anpassen
}, true);
/* Drehen des Handys: Ansicht neu aufbauen */
let RM_PHONE = roofPhone() + '' + roofLand();
window.addEventListener('resize', () => { const ph = roofPhone() + '' + roofLand(); if (RS && ph !== RM_PHONE) roofRender(); RM_PHONE = ph; });

/* Feinjustier-Rad auf dem Handy immer gegenüber dem Punkt, der gerade verschoben wird – es verdeckt nie das Ziel */
const _roofDrawPh = roofDraw;
roofDraw = async function () {
  const r = await _roofDrawPh.apply(this, arguments);
  try {
    const pad = $('#roof-pad'); if (!pad || !RS || !roofPhone() || pad.classList.contains('hidden') || !RS.act) return r;
    const f = roofF(), cv = $('#roof-cv'), pts = f[RS.act[0]], c = pts && pts[RS.act[1]]; if (!cv || !c) return r;
    const V = roofView(cv, f, faceGeom(f), RIMG[f.photo]); if (!V || V.kind !== 'img') return r;
    const x = V.ox + c[0] * f.iw * V.k, y = V.oy + c[1] * f.ih * V.k, cw = cv.clientWidth, ch = cv.clientHeight;
    const right = x < cw / 2, top = y > ch / 2;
    pad.style.left = right ? '' : '12px'; pad.style.right = right ? '64px' : '';
    pad.style.top = top ? '12px' : ''; pad.style.bottom = top ? '' : '44px';
  } catch (e) {}
  return r;
};
