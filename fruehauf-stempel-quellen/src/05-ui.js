
/* =========================================================
   Oberfläche
   ========================================================= */
const UI = { route: 'home', mon: '', tab: 'person', editUntil: 0, openDay: '', vVon: '', vBis: '', vNote: '', calM: '' };
let DEVICE = { admin: false };   // Admin-Gerät: dauerhaft freigeschaltet (nur auf diesem Gerät, nicht in der Sicherung)
const canEdit = () => DEVICE.admin || Date.now() < UI.editUntil;

function logoMark(h = 34) {
  const l = S.company.logo;
  return l ? `<span class="inline-grid place-items-center rounded-[10px] bg-white px-2" style="height:${h}px"><img src="${esc(l)}" alt="" style="max-height:${h - 8}px;max-width:${h * 3.2}px"></span>` : `<span class="w-9 h-9 rounded-[10px] grid place-items-center text-white" style="background:rgb(var(--p-rgb))">${ic('clock', 18, 2.2)}</span>`;
}
function shell(inner) {
  const nav = [['home', 'Heute', 'clock', '#/'], ['week', 'Woche', 'cal', '#/woche'], ['urlaub', 'Urlaub', 'palm', '#/urlaub'], ['settings', 'Einstellungen', 'gear', '#/einstellungen']];
  return `<header class="sticky top-0 z-40 border-b border-line backdrop-blur-xl" style="background:color-mix(in srgb,var(--bg) 86%,transparent);padding-top:env(safe-area-inset-top)">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
      <a href="#/" class="flex items-center gap-3 min-w-0">${logoMark()}<span class="hidden sm:block leading-tight"><span class="block font-semibold text-[15px]">Stempeluhr</span><span class="block text-[12px] text-ink3">${esc(S.person.name || S.company.name)}</span></span></a>
      <nav class="ml-auto flex items-center gap-1">${nav.map(([k, l, i, h]) => `<a href="${h}" class="navl ${UI.route === k ? 'on' : ''}" aria-label="${l}">${ic(i, 17)}<span class="hidden md:inline">${l}</span></a>`).join('')}
      <button class="btn-p !h-10 !px-4 ml-1" data-a="send-week" data-mon="${mondayOf(isoToday())}">${ic('send', 16)}<span class="hidden sm:inline">An ${esc(S.recipient.name || 'Büro')}</span></button></nav>
    </div></header>
    <main class="max-w-6xl mx-auto px-4 sm:px-6 pb-24">${inner}</main>
    <datalist id="dl-sites">${(S.sites || []).map(x => `<option value="${esc(x)}">`).join('')}</datalist>`;
}
const kpi = (k, v, id = '', cls = '') => `<div class="kpi"><div class="text-[12px] text-ink3">${k}</div><div class="text-[22px] font-semibold mt-1 ${cls}" ${id ? `id="${id}"` : ''}>${v}</div></div>`;
const diffCls = m => (Math.round(m) > 0 ? 'text-p' : '');
const overTxt = m => (Math.round(m) > 0 ? '+' + hm(m) : '–');

/* ---------- Heute ---------- */
function siteChips(target) {
  const l = (S.sites || []).slice(0, 8); if (!l.length) return '';
  return `<div class="flex flex-wrap gap-1.5 mt-2">${l.map(x => `<button type="button" class="chip" data-a="site-pick" data-t="${target}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
}
function viewHome() {
  const iso = isoToday(), d = dayOf(iso), c = calcDay(d), seg = curSeg(d), wk = isoWeek(iso), dt = new Date();
  const state = d.type !== 'work' ? 'absent' : c.inPause ? 'pause' : seg ? 'work' : 'idle';
  const status = { idle: (d.segs || []).length ? `Ausgestempelt um ${esc(c.end)} Uhr` : 'Noch nicht eingestempelt', work: `Bei der Arbeit seit ${esc(seg ? seg.von : '')} Uhr${seg && seg.site ? ` · ${esc(seg.site)}` : ''}`, pause: `In Pause seit ${esc((openPause(d) || {}).von || '')} Uhr`, absent: typeName(d.type) }[state];
  const dot = { idle: 'bg-ink3', work: 'bg-p', pause: 'bg-s', absent: 'bg-s' }[state];
  const btn = (a, label, icon, style, dis) => `<button class="stamp" data-a="${a}" style="${style}" ${dis ? 'disabled' : ''}>${ic(icon, 30, 2)}<span>${label}</span></button>`;
  const G = 'background:rgb(var(--p-rgb));color:#fff', Y = 'background:rgb(var(--s-rgb));color:#1b1405', R = 'background:#D9482B;color:#fff', N = 'background:var(--raised);color:var(--ink);border:1px solid var(--line2)';
  let buttons = '';
  const V = 'background:rgb(var(--s-rgb)/.16);color:var(--yel-ink);border:1px solid rgb(var(--s-rgb)/.45)';
  if (state === 'idle') buttons = `<div class="grid gap-3">${btn('in', (d.segs || []).length ? 'Wieder kommen' : 'Kommen', 'play', G)}${(d.segs || []).length || !sollOf(iso) ? '' : btn('vac-today', 'Heute Urlaub', 'palm', V)}</div>`;
  else if (state === 'work') buttons = `<div class="grid grid-cols-2 gap-3">${btn('pause', 'Pause', 'coffee', Y)}${btn('switch', 'Baustelle wechseln', 'refresh', N)}<div class="col-span-2">${btn('out', 'Gehen', 'stop', R)}</div></div>`;
  else if (state === 'pause') buttons = `<div class="grid grid-cols-2 gap-3">${btn('pause', 'Pause beenden', 'play', G)}${btn('out', 'Gehen', 'stop', R)}</div>`;
  else buttons = `<div class="rounded-[var(--r)] p-5 text-center" style="background:rgb(var(--s-rgb)/.14)"><div class="text-yel-ink">${ic(d.type === 'urlaub' ? 'palm' : d.type === 'krank' ? 'heartp' : 'cal', 34, 1.7)}</div><div class="text-[20px] font-semibold mt-2">Heute: ${d.betrieb ? esc(d.betrieb) : typeName(d.type)}</div>${d.type === 'feiertag' && holiday(iso) ? `<div class="text-ink3 text-[14px]">${esc(holiday(iso))}</div>` : ''}</div><div class="grid grid-cols-2 gap-3 mt-3">${btn('in', 'Trotzdem kommen', 'play', G)}${d.type === 'urlaub' ? btn('vac-undo', 'Urlaub zurücknehmen', 'x', N) : ''}</div>`;
  /* fehlendes Gehen an früheren Tagen */
  const miss = Object.values(DAYS).filter(x => x.iso < iso && x.iso >= addDays(iso, -21) && calcDay(x).missingEnd).sort((a, b) => a.iso.localeCompare(b.iso));
  const missCard = miss.length ? `<div class="card p-4 mt-4 border-ember/50 flex flex-wrap items-center gap-3" style="background:var(--t-red)"><span class="text-ember">${ic('alert', 20)}</span><div class="flex-1 min-w-[200px] text-[14px]">Ausstempeln fehlt: ${miss.map(x => `<b>${wdOf(x.iso).slice(0, 2)}, ${deDate(x.iso)}</b>`).join(', ')} – bitte vom Admin korrigieren lassen.</div><a class="btn-s !h-9" href="#/woche/${mondayOf(miss[0].iso)}">Ansehen</a></div>` : '';
  const segs = (d.segs || []).map(s => `<div class="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[14px]"><span class="w-2 h-2 rounded-full ${s.bis ? 'bg-ink3' : 'bg-p'}"></span><span class="flex-1 min-w-0 truncate">${esc(s.site || 'Ohne Baustelle')}</span><span class="mono text-ink2">${esc(s.von)}–${esc(s.bis || 'jetzt')}</span></div>`).join('');
  const W = calcRange(weekOf(mondayOf(iso))), bal = balance(), vac = vacation();
  const week = W.days.filter(x => x.c.soll > 0 || hasData(x.d)).map(x => `<a href="#/woche/${mondayOf(iso)}" class="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[14px] ${x.d.iso === iso ? 'font-semibold' : ''}"><span class="w-24">${wdOf(x.d.iso).slice(0, 2)}, ${deDate(x.d.iso).slice(0, 6)}</span><span class="flex-1 text-ink3 truncate">${x.d.type !== 'work' ? typeName(x.d.type) : x.c.start ? `${x.c.start}–${x.c.end || '…'}` : '–'}</span><span class="mono w-14 text-right">${hm(x.c.netto + x.c.credit)}</span><span class="mono w-16 text-right ${diffCls(x.c.over)}">${overTxt(x.c.over)}</span></a>`).join('');
  return `<section class="pt-6 sm:pt-10">
    ${S.person.name ? '' : `<a href="#/einstellungen/person" class="card p-4 mb-4 flex items-center gap-3 text-[14px]" style="background:var(--t-yel)"><span class="text-yel-ink">${ic('info', 18)}</span><span class="flex-1">Bitte zuerst deinen Namen eintragen – er steht auf dem Stundenzettel.</span>${ic('arrowR', 16)}</a>`}
    <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-4">
      <div class="card p-5 sm:p-7">
        <div class="flex items-center justify-between gap-3"><span class="text-[13px] text-ink3">${WD[dt.getDay()]}, ${deDate(iso)} · KW ${wk.w}</span><span class="inline-flex items-center gap-2 text-[13px]"><span class="w-2 h-2 rounded-full ${dot} ${state === 'work' ? 'animate-pulse' : ''}"></span>${esc(status)}</span></div>
        <div class="big-clock text-[64px] sm:text-[84px] leading-none mt-4" id="clock">${nowHM()}</div>
        ${state === 'idle' || state === 'work' ? `<label class="block mt-6"><span class="lbl">${state === 'work' ? 'Neue Baustelle (für „Baustelle wechseln“)' : 'Baustelle'}</span><input class="inp" id="site" list="dl-sites" placeholder="z. B. Meier, Lotte" autocomplete="off" value="${state === 'idle' && (d.segs || []).length ? esc(d.segs[d.segs.length - 1].site || '') : ''}"></label>${siteChips('site')}` : ''}
        <div class="mt-5">${buttons}</div>
        ${missCard}
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-2">${kpi('Arbeitszeit heute', hm(c.netto + c.credit), 'live-netto')}${kpi('Soll heute', hm(c.soll))}${kpi('Pause (abgezogen)', `${hm(c.abzug)}`, 'live-pause')}${kpi('Überstunden heute', overTxt(Math.max(0, c.diff)), 'live-diff', diffCls(c.diff))}</div>
        <p class="text-[12px] text-ink3 -mt-2">Mindestens ${S.minPause} Min. Pause werden immer abgezogen – auch ohne gestempelte Pause; längere Pausen voll.</p>
        ${segs ? `<div class="card p-4"><div class="text-[13px] text-ink3 mb-1">Heute</div>${segs}</div>` : ''}
        <div class="grid grid-cols-2 gap-2"><div class="kpi" style="background:var(--p-light)"><div class="text-[12px] text-ink3">Überstunden gesamt</div><div class="text-[26px] font-semibold mt-1 text-p">${overTxt(bal)}</div></div><a href="#/urlaub" class="kpi block"><div class="text-[12px] text-ink3">Resturlaub ${new Date().getFullYear()}</div><div class="text-[26px] font-semibold mt-1">${vac.left} <span class="text-[13px] text-ink3 font-normal">von ${vac.total} Tagen</span></div></a></div>
      </div>
    </div>
    <div class="card p-5 mt-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h2 class="sec-t">Diese Woche</h2><span class="text-[14px]">${hm(W.netto + W.credit)} / ${hm(W.soll)} · Überstunden <b class="text-p">${overTxt(W.over)}</b></span></div>${week || '<div class="text-ink3 text-[14px]">Noch keine Einträge.</div>'}
      <div class="flex flex-wrap gap-2 mt-4"><a class="btn-s" href="#/woche">${ic('cal', 16)}Woche ansehen</a><button class="btn-p" data-a="send-week" data-mon="${mondayOf(iso)}">${ic('send', 16)}Stundenzettel an ${esc(S.recipient.name || 'Büro')}</button></div></div>
  </section>`;
}

/* ---------- Woche ---------- */
function dayEditor(d) {
  const iso = d.iso, segs = d.segs || [], pz = d.pauses || [];
  return `<div class="mt-3 pt-3 border-t border-line space-y-4">
    <div><span class="lbl">Art des Tages</span><div class="flex flex-wrap gap-1.5">${DAY_TYPES.map(([k, l, i]) => `<button class="chip ${d.type === k ? '!border-p !text-ink !bg-p/15' : ''}" data-a="ed-type" data-iso="${iso}" data-v="${k}">${ic(i, 14)}${l}</button>`).join('')}</div></div>
    ${d.type === 'work' ? `<div><span class="lbl">Arbeitszeiten je Baustelle</span><div class="space-y-2">${segs.map((s, i) => `<div class="grid grid-cols-[1fr_88px_88px_auto] gap-2 items-center"><input class="inp !h-10" list="dl-sites" data-ed="${iso}" data-seg="${i}" data-k="site" value="${esc(s.site || '')}" placeholder="Baustelle"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-seg="${i}" data-k="von" value="${esc(s.von || '')}"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-seg="${i}" data-k="bis" value="${esc(s.bis || '')}"><button class="btn-g !px-2 hover:!text-ember" data-a="ed-seg-del" data-iso="${iso}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('')}</div>
      <button class="btn-s !h-9 mt-2" data-a="ed-seg-add" data-iso="${iso}">${ic('plus', 15)}Zeitraum</button></div>
    <div><span class="lbl">Gestempelte Pausen</span><div class="space-y-2">${pz.map((p, i) => `<div class="grid grid-cols-[88px_88px_auto] sm:w-max gap-2 items-center"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-pz="${i}" data-k="von" value="${esc(p.von || '')}"><input type="time" class="inp !h-10 !px-2" data-ed="${iso}" data-pz="${i}" data-k="bis" value="${esc(p.bis || '')}"><button class="btn-g !px-2 hover:!text-ember" data-a="ed-pz-del" data-iso="${iso}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('')}</div>
      <button class="btn-s !h-9 mt-2" data-a="ed-pz-add" data-iso="${iso}">${ic('plus', 15)}Pause</button></div>` : ''}
    ${hasData(d) ? `<button class="btn-g hover:!text-ember" data-a="ed-clear" data-iso="${iso}">${ic('trash', 15)}Tag leeren</button>` : ''}
  </div>`;
}
function viewWeek() {
  const mon = UI.mon || mondayOf(isoToday()), wk = isoWeek(mon), W = calcRange(weekOf(mon)), edit = canEdit(), today = isoToday();
  const days = W.days.filter(x => x.c.soll > 0 || hasData(x.d) || x.d.iso === today || [1, 2, 3, 4, 5].includes(new Date(x.d.iso + 'T12:00').getDay()));
  const cards = days.map(({ d, c }) => {
    const open = UI.openDay === d.iso, log = (d.log || []).length;
    return `<div class="card p-4 sm:p-5 ${d.iso === today ? 'border-p/50' : ''}">
      <div class="flex flex-wrap items-start gap-3">
        <div class="w-28"><div class="font-semibold">${wdOf(d.iso)}</div><div class="text-[13px] text-ink3">${deDate(d.iso)}</div></div>
        <div class="flex-1 min-w-[180px] text-[14px]">
          ${d.type !== 'work' ? `<span class="badge bg-tyel text-yel-ink">${d.betrieb ? esc(d.betrieb) : typeName(d.type)}${d.type === 'feiertag' && holiday(d.iso) ? ' · ' + esc(holiday(d.iso)) : ''}</span>` : c.start ? `<div><span class="mono">${c.start}–${c.end || (c.missingEnd ? '?' : 'jetzt')}</span> <span class="text-ink3">· Pause ${hm(c.pause)}${c.abzug > c.pause ? ` (abgezogen ${hm(c.abzug)})` : ''}</span></div>` : `<span class="text-ink3">${c.soll ? 'Kein Eintrag' : 'Frei'}</span>`}
          ${c.missingEnd ? `<div class="text-ember text-[13px] mt-1">${ic('alert', 13)} Ausstempeln fehlt</div>` : ''}
          ${c.sites.length ? `<div class="flex flex-wrap gap-1.5 mt-2">${c.sites.map(s => `<span class="badge bg-raised text-ink2">${ic('pin', 12)}${esc(s.site)} · ${hm(s.min)}</span>`).join('')}</div>` : ''}
          ${d.edited ? `<div class="text-[12px] text-ink3 mt-1.5">${ic('edit', 12)} nachgetragen${log ? ` (${log} Änderung${log > 1 ? 'en' : ''})` : ''}</div>` : ''}
        </div>
        <div class="text-right"><div class="text-[18px] font-semibold mono">${hm(c.netto + c.credit)}</div><div class="text-[12px] text-ink3">Soll ${hm(c.soll)}</div>${c.over ? `<div class="text-[13px] mono text-p">+${hm(c.over)} Überst.</div>` : ''}</div>
      </div>
      <label class="block mt-3"><span class="sr-only">Notiz</span><input class="inp !h-10 text-[14px]" data-note="${d.iso}" value="${esc(d.note || '')}" placeholder="Notiz zum Tag (optional)"></label>
      ${edit ? (open ? dayEditor(d) : `<button class="btn-g !h-8 mt-2 -ml-2" data-a="ed-open" data-iso="${d.iso}">${ic('edit', 14)}Zeiten bearbeiten</button>`) : ''}
    </div>`;
  }).join('');
  const lock = edit ? `<div class="flex flex-wrap items-center gap-2 text-[13px] rounded-[var(--rb)] px-3 py-2" style="background:var(--p-light)"><span class="text-p">${ic('check', 15, 2.4)}</span>${DEVICE.admin ? 'Admin-Gerät – Nachtragen freigeschaltet' : `Bearbeiten freigeschaltet bis ${new Date(UI.editUntil).toTimeString().slice(0, 5)} Uhr`}${DEVICE.admin ? '' : `<button class="btn-g !h-7 !px-2" data-a="lock">Sperren</button>`}</div>`
    : `<button class="btn-s" data-a="unlock">${ic('edit', 16)}Nachtragen / korrigieren</button>`;
  return `<section class="pt-6 sm:pt-10">
    <div class="flex flex-wrap items-center gap-3"><h1 class="h-font text-[38px] sm:text-[48px] leading-none mr-auto">KW ${wk.w}</h1>
      <div class="flex items-center gap-1"><a class="btn-s !px-3" href="#/woche/${addDays(mon, -7)}" aria-label="Vorige Woche">${ic('chevL', 18)}</a><a class="btn-s" href="#/woche/${mondayOf(today)}">Heute</a><a class="btn-s !px-3" href="#/woche/${addDays(mon, 7)}" aria-label="Nächste Woche">${ic('chevR', 18)}</a></div></div>
    <p class="text-ink3 text-[14px] mt-2">${deDate(mon)} – ${deDate(addDays(mon, 6))} · ${esc(S.person.name || 'Name fehlt')}</p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">${kpi('Arbeitszeit', hm(W.netto + W.credit))}${kpi('Soll', hm(W.soll))}${kpi('Überstunden Woche', overTxt(W.over), '', 'text-p')}${kpi('Überstunden gesamt', overTxt(balance()), '', 'text-p')}</div>
    <div class="flex flex-wrap items-center gap-2 mt-5"><button class="btn-p" data-a="send-week" data-mon="${mon}">${ic('send', 16)}Stundenzettel an ${esc(S.recipient.name || 'Büro')}</button><button class="btn-s" data-a="send-month" data-iso="${mon}">${ic('file', 16)}Monat ${MONTHS[+mon.slice(5, 7) - 1]}</button><span class="flex-1"></span>${lock}</div>
    <div class="space-y-3 mt-5">${cards}</div>
    ${Object.keys(W.sites).length ? `<div class="card p-5 mt-4"><h2 class="sec-t mb-3">Baustellen dieser Woche</h2>${Object.entries(W.sites).sort((a, b) => b[1] - a[1]).map(([k, m]) => `<div class="flex justify-between py-2 border-b border-line last:border-0 text-[14px]"><span>${esc(k)}</span><b class="mono">${hm(m)}</b></div>`).join('')}</div>` : ''}
  </section>`;
}

/* ---------- Urlaub ---------- */
function calendar() {
  const base = UI.calM || isoToday().slice(0, 7) + '-01', [y, m] = base.split('-').map(Number), first = `${y}-${pad2(m)}-01`, days = monthOf(first), lead = (new Date(first + 'T12:00').getDay() + 6) % 7, today = isoToday();
  const cell = iso => {
    const d = dayOf(iso), wd = new Date(iso + 'T12:00').getDay(), hol = holiday(iso), b = d.type === 'urlaub' && (d.betrieb || (!DAYS[iso] && betriebOf(iso)));
    let bg = '', fg = '', tag = '';
    if (d.type === 'urlaub') { bg = b ? 'rgb(229,154,92,.22)' : 'rgb(var(--s-rgb)/.22)'; tag = b ? 'BU' : 'U'; }
    else if (d.type === 'krank') { bg = 'var(--t-red)'; tag = 'K'; }
    else if (hol || d.type === 'feiertag') { bg = 'rgba(59,130,246,.16)'; tag = 'F'; }
    else if (d.type === 'frei') { bg = 'var(--raised)'; tag = 'A'; }
    else if ((d.segs || []).length) { tag = '•'; fg = 'color:rgb(var(--p-rgb))'; }
    const we = wd === 0 || wd === 6;
    return `<div class="aspect-square rounded-[10px] p-1 sm:p-1.5 flex flex-col text-[12px] sm:text-[13px] ${iso === today ? 'ring-2 ring-p' : ''} ${we && !bg ? 'opacity-45' : ''}" style="background:${bg || (we ? 'transparent' : 'var(--field)')}" title="${esc(hol || d.betrieb || typeName(d.type))}"><span class="font-medium">${+iso.slice(8)}</span><span class="mt-auto text-[10px] sm:text-[11px] font-semibold" style="${fg}">${tag}</span></div>`;
  };
  const prev = `${m === 1 ? y - 1 : y}-${pad2(m === 1 ? 12 : m - 1)}-01`, next = `${m === 12 ? y + 1 : y}-${pad2(m === 12 ? 1 : m + 1)}-01`;
  const lg = (c, l) => `<span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background:${c}"></span>${l}</span>`;
  return `<div class="card p-5 sm:p-6 mt-4"><div class="flex items-center gap-2 mb-4"><h2 class="sec-t flex-1">${MONTHS[m - 1]} ${y}</h2><button class="btn-s !px-3 !h-9" data-a="cal" data-v="${prev}" aria-label="Voriger Monat">${ic('chevL', 17)}</button><button class="btn-s !h-9" data-a="cal" data-v="">Heute</button><button class="btn-s !px-3 !h-9" data-a="cal" data-v="${next}" aria-label="Nächster Monat">${ic('chevR', 17)}</button></div>
    <div class="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] text-ink3 mb-1">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="grid grid-cols-7 gap-1 sm:gap-1.5">${'<div></div>'.repeat(lead)}${days.map(cell).join('')}</div>
    <div class="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[12px] text-ink2">${lg('rgb(var(--s-rgb)/.35)', 'U = Urlaub')}${lg('rgb(229,154,92,.4)', 'BU = Betriebsurlaub')}${lg('rgba(59,130,246,.3)', 'F = Feiertag')}${lg('var(--t-red)', 'K = Krank')}<span class="inline-flex items-center gap-1.5"><b class="text-p">•</b>gearbeitet</span></div>
    <p class="hint mt-3">${ic('alert', 12)} Nur deine eigenen Einträge – Kollegen sehen diesen Kalender nicht.</p></div>`;
}
function viewUrlaub() {
  const y = new Date().getFullYear(), v = vacation(y), today = isoToday();
  const von = UI.vVon || today, bis = UI.vBis || von, days = workDaysIn(von, bis);
  const list = Object.values(DAYS).filter(d => d.type === 'urlaub' && d.iso.startsWith(y + '-') && !betriebOf(d.iso)).sort((a, b) => a.iso.localeCompare(b.iso));
  const blocks = []; list.forEach(d => { const l = blocks[blocks.length - 1]; if (l && workDaysIn(addDays(l.bis, 1), addDays(d.iso, -1)).length === 0) { l.bis = d.iso; l.n += sollOf(d.iso) > 0 ? 1 : 0; } else blocks.push({ von: d.iso, bis: d.iso, n: sollOf(d.iso) > 0 ? 1 : 0 }); });
  const reqs = (UI.requests || []).slice().reverse().slice(0, 8);
  return `<section class="pt-6 sm:pt-10"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Urlaub</h1>
    ${buList().filter(b => b.bis >= today).length ? `<div class="card p-4 mt-5 flex flex-wrap items-center gap-3" style="background:rgb(229,154,92,.12)"><span style="color:#C7792F">${ic('cal', 20)}</span><div class="flex-1 min-w-[200px] text-[14px]">${buList().filter(b => b.bis >= today).map(b => `<div><b>${esc(b.name || 'Betriebsurlaub')}</b>: ${deDate(b.von)} – ${deDate(b.bis)} · ${workDaysIn(b.von, b.bis).length} Arbeitstage${b.abzug === false ? ' (zählt nicht vom Urlaub)' : ''}</div>`).join('')}</div></div>` : ''}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">${kpi(`Anspruch ${y}`, `${v.total} Tage`)}${kpi('Genommen', `${v.taken} Tage`)}${kpi('Geplant', `${v.planned} Tage${v.betrieb ? ` <span class="text-[12px] text-ink3 font-normal">davon ${v.betrieb} Betriebsurl.</span>` : ''}`)}<div class="kpi" style="background:var(--p-light)"><div class="text-[12px] text-ink3">Resturlaub</div><div class="text-[26px] font-semibold mt-1 text-p">${v.left} Tage</div></div></div>
    <div class="grid lg:grid-cols-2 gap-4 mt-4">
      <div class="card p-5 sm:p-6"><h2 class="sec-t mb-1">Urlaub eintragen oder einreichen</h2><p class="text-ink3 text-[14px] mb-5">Wochenenden und Feiertage werden nicht mitgezählt.</p>
        <div class="grid grid-cols-2 gap-3"><label class="block"><span class="lbl">Von</span><input type="date" class="inp" data-vac="von" value="${esc(von)}"></label><label class="block"><span class="lbl">Bis</span><input type="date" class="inp" data-vac="bis" value="${esc(bis)}"></label></div>
        <label class="block mt-3"><span class="lbl">Bemerkung (optional)</span><input class="inp" data-vac="note" value="${esc(UI.vNote || '')}" placeholder="z. B. Familienurlaub"></label>
        <div class="kpi mt-4 flex items-center justify-between"><span class="text-[14px]">${deDate(von)} – ${deDate(bis)}</span><b class="text-[22px]" id="vac-n">${days.length} Arbeitstag${days.length === 1 ? '' : 'e'}</b></div>
        ${days.length > v.left ? `<p class="text-ember text-[13px] mt-2">Achtung: mehr Tage als Resturlaub (${v.left}).</p>` : ''}
        <div class="grid sm:grid-cols-2 gap-2 mt-4"><button class="btn-p !h-12" data-a="vac-submit">${ic('send', 17)}Urlaub einreichen (PDF an ${esc(S.recipient.name || 'Büro')})</button><button class="btn-s !h-12" data-a="vac-set">${ic('palm', 17)}Direkt eintragen</button></div>
        <p class="hint">„Einreichen“ erstellt einen Urlaubsantrag als PDF, speichert ihn und öffnet Teilen (WhatsApp). „Direkt eintragen“ trägt die Tage in den Kalender ein – vergangene Tage nur mit Admin-Passwort.</p></div>
      <div class="card p-5 sm:p-6"><h2 class="sec-t mb-3">Eingetragener Urlaub ${y}</h2>${blocks.length ? blocks.map(b => `<div class="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[14px]"><span class="text-yel-ink">${ic('palm', 16)}</span><span class="flex-1">${deDate(b.von)}${b.bis !== b.von ? ' – ' + deDate(b.bis) : ''}</span><b>${b.n} Tag${b.n > 1 ? 'e' : ''}</b><button class="btn-g !h-8 !px-2 hover:!text-ember" data-a="vac-del" data-von="${b.von}" data-bis="${b.bis}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('') : '<div class="text-ink3 text-[14px]">Noch kein Urlaub eingetragen.</div>'}
        ${reqs.length ? `<h3 class="font-semibold mt-6 mb-2 text-[15px]">Eingereichte Anträge</h3>${reqs.map(r => `<div class="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[13px]"><span class="flex-1">${deDate(r.von)} – ${deDate(r.bis)} · ${r.n} Tage</span><span class="text-ink3">eingereicht ${deDate(r.at.slice(0, 10))}</span></div>`).join('')}` : ''}</div>
    </div>${calendar()}</section>`;
}

/* ---------- Einstellungen ---------- */
const SET_TABS = [['person', 'Ich & Empfänger', 'users'], ['zeiten', 'Arbeitszeiten', 'clock'], ['konten', 'Konten', 'cal'], ['firma', 'Firma & Logo', 'building'], ['design', 'Design', 'sun'], ['admin', 'Admin', 'gear'], ['daten', 'Daten', 'download']];
const LOCKED_TABS = ['zeiten', 'konten'];
const sIn = (path, label, ph = '', type = 'text', dis = false) => { const v = path.split('.').reduce((o, k) => (o || {})[k], S); return `<label class="block"><span class="lbl">${label}</span><input class="inp" data-s="${path}" type="${type}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" ${type === 'number' ? 'inputmode="decimal"' : ''} ${dis ? 'disabled' : ''}></label>`; };
function setBody() {
  const ro = LOCKED_TABS.includes(UI.tab) && !canEdit();
  const lockNote = ro ? `<div class="rounded-[var(--rb)] bg-raised p-3 mb-5 flex flex-wrap items-center gap-3 text-[14px]"><span class="text-ink3">${ic('alert', 17)}</span><span class="flex-1">Nur mit Admin-Passwort änderbar.</span><button class="btn-s !h-9" data-a="unlock">Freischalten</button></div>` : '';
  switch (UI.tab) {
    case 'person': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('person.name', 'Mein Name', 'Vor- und Nachname')}${sIn('person.nr', 'Personalnummer (optional)')}</div>
      <h3 class="font-semibold mt-7 mb-3">Stundenzettel senden an</h3><div class="grid sm:grid-cols-2 gap-4">${sIn('recipient.name', 'Name', 'z. B. Jule')}${sIn('recipient.phone', 'WhatsApp-Nummer (optional)', 'z. B. 0176 …', 'tel')}</div>
      <p class="hint">Das PDF wird gespeichert und über „Teilen“ an WhatsApp übergeben – dort ${esc(S.recipient.name || 'den Empfänger')} auswählen. Die Nummer wird genutzt, wenn das Gerät kein Teilen von Dateien kann.</p>
      <label class="flex items-center gap-2.5 text-[14px] text-ink2 mt-6"><input type="checkbox" data-a="gps" ${S.gps ? 'checked' : ''} ${canEdit() ? '' : 'disabled'}>Standort beim Stempeln speichern (GPS)${canEdit() ? '' : ' – nur Admin'}</label>`;
    case 'zeiten': return `${lockNote}<p class="text-ink3 text-[14px] mb-4">Sollzeiten je Wochentag. Die Mindestpause wird bei der Sollzeit und bei jedem Arbeitstag abgezogen.</p>
      <div class="space-y-2">${[1, 2, 3, 4, 5, 6, 0].map(k => { const h = S.hours[k]; return `<div class="grid grid-cols-[110px_1fr_1fr_70px] gap-2 items-center"><label class="flex items-center gap-2 text-[14px]"><input type="checkbox" data-hour="${k}" data-k="on" ${h.on ? 'checked' : ''} ${ro ? 'disabled' : ''}>${WD[k].slice(0, 2)}</label><input type="time" class="inp !h-10 !px-2" data-hour="${k}" data-k="von" value="${esc(h.von)}" ${ro || !h.on ? 'disabled' : ''}><input type="time" class="inp !h-10 !px-2" data-hour="${k}" data-k="bis" value="${esc(h.bis)}" ${ro || !h.on ? 'disabled' : ''}><span class="text-[13px] text-ink3 mono text-right">${h.on ? hm(sollOf(k === 0 ? '2026-11-15' : addDays('2026-11-09', k - 1))) : '–'}</span></div>`; }).join('')}</div>
      <div class="grid sm:grid-cols-2 gap-4 mt-6">${sIn('minPause', 'Mindestpause (Min.)', '30', 'number', ro)}<label class="block"><span class="lbl">Bundesland (Feiertage)</span><select class="inp" data-s="state" ${ro ? 'disabled' : ''}>${STATES.map(([k, l]) => `<option value="${k}" ${S.state === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <label class="flex items-center gap-2.5 text-[14px] text-ink2 mt-4"><input type="checkbox" data-a="over6" ${S.pauseOnlyOver6 ? 'checked' : ''} ${ro ? 'disabled' : ''}>Mindestpause nur bei mehr als 6 Std. Arbeit abziehen</label>`;
    case 'konten': { const v = vacation(); return `${lockNote}<h3 class="font-semibold mb-3">Urlaub ${new Date().getFullYear()}</h3><div class="grid grid-cols-2 gap-4">${sIn('vacation.perYear', 'Urlaubstage pro Jahr', '30', 'number', ro)}${sIn('vacation.carry', 'Resturlaub Vorjahr', '0', 'number', ro)}</div><p class="hint">Genommen: ${v.taken} · Geplant: ${v.planned} · Übrig: ${v.left} Tage (nur Arbeitstage, ohne Wochenende und Feiertage)</p>
      <h3 class="font-semibold mt-7 mb-3">Betriebsurlaub</h3>
      <div class="space-y-1.5">${(FIRMA.betriebsurlaub || []).map(b => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2 text-[14px]"><span style="color:#C7792F">${ic('cal', 15)}</span><b>${esc(b.name || 'Betriebsurlaub')}</b><span class="flex-1">${deDate(b.von)} – ${deDate(b.bis)}</span><span class="text-[12px] text-ink3">für alle (Firmenvorgabe)</span></div>`).join('')}
      ${(S.bu || []).map((b, i) => `<div class="flex flex-wrap items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2 text-[14px]"><span style="color:#C7792F">${ic('cal', 15)}</span><b>${esc(b.name || 'Betriebsurlaub')}</b><span class="flex-1">${deDate(b.von)} – ${deDate(b.bis)}${b.abzug === false ? ' · zählt nicht' : ''}</span>${ro ? '' : `<button class="text-ink3 hover:text-ember" data-a="bu-del" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button>`}</div>`).join('')}</div>
      ${ro ? '' : `<div class="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.3fr] gap-2 mt-3"><input type="date" class="inp" id="bu-von"><input type="date" class="inp" id="bu-bis"><input class="inp col-span-2 sm:col-span-1" id="bu-name" placeholder="Name, z. B. Brückentage" value="Betriebsurlaub"></div>
      <label class="flex items-center gap-2 text-[14px] text-ink2 mt-2"><input type="checkbox" id="bu-abzug" checked>vom Urlaubsanspruch abziehen</label><button class="btn-s mt-2" data-a="bu-add">${ic('plus', 16)}Betriebsurlaub hinzufügen</button>`}
      <p class="hint">Firmenvorgaben kommen automatisch mit jedem App-Update auf alle Handys. Zusätzliche Zeiträume hier gelten nur auf diesem Gerät.</p>
      <h3 class="font-semibold mt-7 mb-3">Überstundenkonto</h3><div class="grid grid-cols-2 gap-4">${sIn('balance.from', 'Zählt ab', '', 'date', ro)}<label class="block"><span class="lbl">Startwert Überstunden (Std:Min, z. B. 12:30)</span><input class="inp" data-bal value="${esc(hm(S.balance.min || 0))}" ${ro ? 'disabled' : ''}></label></div><p class="hint">Aktuell: <b>${overTxt(balance())}</b> · Minusstunden werden nicht verrechnet (nicht bezahlt).</p>`; }
    case 'firma': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('company.name', 'Firmenname')}${sIn('company.phone', 'Telefon')}${sIn('company.street', 'Straße')}${sIn('company.city', 'PLZ und Ort')}</div>
      <div class="mt-6"><span class="lbl">Logo (App und PDF)</span><div class="flex flex-wrap items-center gap-3">${S.company.logo ? `<span class="rounded-[var(--rb)] bg-white p-3 border border-line"><img src="${esc(S.company.logo)}" class="h-14" alt=""></span>` : '<span class="text-ink3 text-[14px]">Kein Logo</span>'}
        <label class="btn-s cursor-pointer">${ic('upload', 16)}Logo wählen<input type="file" accept="image/*" class="hidden" data-logo></label>${S.company.logo !== 'logo.png' ? '<button class="btn-g" data-a="logo-reset">Standard-Logo</button>' : ''}</div></div>`;
    case 'design': return `<div><span class="lbl">Ansicht</span><div class="seg">${[['system', 'Wie Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button class="${S.design.mode === k ? 'on' : ''}" data-a="mode" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-4 mt-6">${[['primary', 'Hauptfarbe'], ['secondary', 'Akzentfarbe']].map(([k, l]) => `<label class="block"><span class="lbl">${l}</span><div class="flex items-center gap-2"><input type="color" class="w-12 h-11 rounded-[var(--rb)] border border-line2 bg-field p-1" data-s="design.${k}" value="${esc(S.design[k])}"><span class="mono text-[13px] text-ink3">${esc(S.design[k])}</span></div></label>`).join('')}</div>
      <label class="block mt-6"><span class="lbl">Ecken-Rundung: ${S.design.radius} px</span><input type="range" min="4" max="24" step="1" class="w-full" data-s="design.radius" value="${S.design.radius}"></label>
      <button class="btn-g mt-6" data-a="design-reset">${ic('refresh', 15)}Design zurücksetzen</button>`;
    case 'admin': return DEVICE.admin ? `<div class="rounded-[var(--rb)] p-4 text-[14px] flex items-center gap-3" style="background:var(--p-light)"><span class="text-p">${ic('check', 20, 2.4)}</span><span class="flex-1">Dieses Gerät ist ein <b>Admin-Gerät</b>: Nachtragen und Korrigieren ohne erneute Abfrage. Alle Änderungen werden protokolliert.</span></div>
      <button class="btn-s mt-4" data-a="admin-off">${ic('x', 16)}Admin-Gerät beenden</button>
      <h3 class="font-semibold mt-8 mb-3">Admin-Passwort ändern</h3><div class="grid sm:grid-cols-2 gap-3"><input type="password" class="inp" id="pw-new1" placeholder="Neues Passwort" autocomplete="new-password"><input type="password" class="inp" id="pw-new2" placeholder="Wiederholen" autocomplete="new-password"></div><button class="btn-s mt-3" data-a="pw-change">Passwort ändern</button><p class="hint">Gilt für dieses Gerät und für Sicherungen, die von hier eingespielt werden.</p>`
      : `<p class="text-ink3 text-[14px] mb-4">Nur für Manuel, Artjom und Jule: Mit dem Admin-Passwort wird dieses Gerät dauerhaft zum Admin-Gerät – dort lässt sich ohne erneute Abfrage nachtragen und korrigieren. Auf Mitarbeiter-Geräten wird bei jeder Änderung neu gefragt.</p>
      <div class="flex flex-col sm:flex-row gap-2 max-w-md"><input type="password" class="inp" id="pw-admin" placeholder="Admin-Passwort" autocomplete="current-password"><button class="btn-p shrink-0" data-a="admin-on">Als Admin-Gerät freischalten</button></div>`;
    case 'daten': return `<div class="rounded-[var(--r)] p-4 mb-6" style="background:var(--p-light)"><div class="flex items-center gap-2 font-semibold">${ic('check', 17, 2.4)}Datenschutz</div><p class="text-[14px] text-ink2 mt-2">Deine Zeiten, dein Urlaub und deine Baustellen liegen <b>nur auf deinem Handy</b>. Es gibt keinen gemeinsamen Server – Kollegen sehen nichts davon. Ins Büro geht nur, was du selbst als PDF an ${esc(S.recipient.name || 'das Büro')} schickst.</p></div>
      <h3 class="font-semibold mb-2">App-PIN</h3><p class="text-ink3 text-[14px] mb-3">Schützt die App, falls das Handy verloren geht oder jemand anderes es benutzt. Beim Öffnen wird die PIN abgefragt.</p>
      ${S.pin ? `<div class="flex flex-wrap gap-2"><span class="badge bg-tgrn text-p !h-9 !px-3">${ic('check', 14, 2.4)}PIN aktiv</span><button class="btn-s !h-9" data-a="pin-off">PIN entfernen</button></div>` : `<div class="flex flex-col sm:flex-row gap-2 max-w-md"><input class="inp" id="pin-new" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="4–8 Ziffern" style="-webkit-text-security:disc"><button class="btn-s shrink-0" data-a="pin-set">PIN festlegen</button></div>`}
      <h3 class="font-semibold mt-8 mb-2">Sicherung</h3><p class="text-ink3 text-[14px] mb-4">Alle Daten liegen nur auf diesem Gerät. Bitte regelmäßig eine Sicherung speichern – damit lassen sich die Zeiten auch auf ein neues Handy übertragen.</p>
      <div class="flex flex-wrap gap-2"><button class="btn-p" data-a="backup">${ic('download', 16)}Sicherung speichern</button><label class="btn-s cursor-pointer ${canEdit() ? '' : 'opacity-40 pointer-events-none'}">${ic('upload', 16)}Sicherung einspielen<input type="file" accept="application/json,.json" class="hidden" data-restore ${canEdit() ? '' : 'disabled'}></label></div>
      ${canEdit() ? '' : '<p class="hint">Einspielen nur mit Admin-Freischaltung.</p>'}
      <div class="kpi mt-5 text-[14px]">${Object.keys(DAYS).length} Tage gespeichert</div><p class="hint mt-6">Version ${APP_VERSION}</p>`;
  }
  return '';
}
function viewSettings() {
  return `<section class="pt-8 sm:pt-12"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Einstellungen</h1>
    <div class="flex flex-col md:flex-row gap-5 mt-6"><nav class="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:w-56 shrink-0">${SET_TABS.map(([k, l, i]) => `<a href="#/einstellungen/${k}" class="navl ${UI.tab === k ? 'on' : ''} md:w-full">${ic(i, 16)}${l}${LOCKED_TABS.includes(k) && !canEdit() ? `<span class="ml-auto text-ink3 hidden md:inline">${ic('alert', 13)}</span>` : ''}</a>`).join('')}</nav>
    <div class="card p-5 sm:p-7 flex-1 min-w-0"><h2 class="sec-t mb-5">${SET_TABS.find(t => t[0] === UI.tab)[1]}</h2>${setBody()}</div></div></section>`;
}

/* ---------- Rendern und Navigation ---------- */
function render() {
  const inner = UI.route === 'week' ? viewWeek() : UI.route === 'urlaub' ? viewUrlaub() : UI.route === 'settings' ? viewSettings() : viewHome();
  $('#app').innerHTML = shell(inner);
}
function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'woche') { UI.route = 'week'; UI.mon = h[1] && /^\d{4}-\d\d-\d\d$/.test(h[1]) ? mondayOf(h[1]) : mondayOf(isoToday()); }
  else if (h[0] === 'urlaub') UI.route = 'urlaub';
  else if (h[0] === 'einstellungen') { UI.route = 'settings'; UI.tab = SET_TABS.some(t => t[0] === h[1]) ? h[1] : 'person'; }
  else UI.route = 'home';
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const rerender = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
