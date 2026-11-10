
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

const clockSrc = () => (TIME.ok ? `<span class="text-p">${ic('check', 12, 2.6)} Uhrzeit vom Server geprüft</span>` : `<span class="text-yel-ink">${ic('alert', 12)} Offline – Uhrzeit des Handys, Stempel werden markiert</span>`);

const GEO_K = { in: 'Kommen', out: 'Gehen', pause: 'Pause' };
const geoTile = g => g.lat ? `<a class="block rounded-[var(--rb)] overflow-hidden border border-line bg-raised" target="_blank" rel="noopener" href="https://maps.apple.com/?ll=${g.lat},${g.lon}&q=${encodeURIComponent(GEO_K[g.k] || '')}">${g.map ? `<img src="${g.map}" class="w-full aspect-[8/5] object-cover block" alt="">` : `<div class="w-full aspect-[8/5] grid place-items-center text-ink3">${ic('pin', 22)}</div>`}<div class="px-2 py-1.5 text-[12px] leading-tight"><b>${GEO_K[g.k] || g.k} ${esc(g.t)}</b><div class="text-ink3 truncate">${esc(g.addr || `${g.lat}, ${g.lon}`)}${g.acc ? ` · ±${g.acc} m` : ''}</div></div></a>`
  : `<div class="rounded-[var(--rb)] border border-line p-2 text-[12px]" style="background:var(--t-yel)"><b>${GEO_K[g.k] || g.k} ${esc(g.t)}</b><div class="text-yel-ink">Standort nicht ermittelbar</div></div>`;

/* ---------- Wochenstunden (Ziel 40:00) ---------- */
function weekCard(mon, big) {
  const w = weekStat(mon), done = w.ist >= w.target, past = addDays(mon, 6) < isoToday(), acc = past && !done ? account(mon).weeks[mon] || {} : null;
  return `<div class="card p-5 ${big ? 'sm:p-6' : ''}" style="${done ? 'background:var(--p-light)' : ''}">
    <div class="flex flex-wrap items-end justify-between gap-2"><div><div class="text-[13px] text-ink3">Wochenstunden KW ${isoWeek(mon).w}</div><div class="text-[30px] sm:text-[36px] font-semibold leading-tight mt-1 mono whitespace-nowrap" id="wk-ist">${hm(w.ist)} <span class="text-[15px] text-ink3 font-normal font-sans">von ${hm(w.target)} Std.</span></div></div>
      <div class="text-right">${done ? `<div class="text-[12px] text-ink3">Überstunden</div><div class="text-[26px] font-semibold text-p mono" id="wk-over">+${hm(w.over)}</div>` : past ? `<div class="text-[12px] text-ink3">Fehlend</div><div class="text-[26px] font-semibold mono text-ember">−${hm(w.rest)}</div>` : `<div class="text-[12px] text-ink3">Noch zu arbeiten</div><div class="text-[26px] font-semibold mono" id="wk-rest">${hm(w.rest)}</div>`}</div></div>
    <div class="prog !h-3 mt-4"><i id="wk-bar" style="width:${w.pct}%"></i></div>
    <div class="flex justify-between text-[12px] text-ink3 mt-2"><span>${Math.round(w.pct)} % geschafft</span><span>Urlaub, Krank und Feiertage zählen voll mit</span></div>
    ${acc ? `<div class="mt-3 text-[13px] rounded-[var(--rb)] px-3 py-2" style="background:var(--t-red)">${acc.used ? `${hm(acc.used)} Std. von den Überstunden abgezogen. ` : ''}${acc.minus ? `<b class="text-red-ink">${hm(acc.minus)} Minusstunden</b> (keine Überstunden mehr zum Verrechnen).` : ''}</div>` : ''}</div>`;
}

/* ---------- Erinnerung: Stundenzettel freitags übermitteln ---------- */
let SENT = {};   // Montag der Woche → Zeitpunkt des Sendens
function reminderCard() {
  const today = isoToday(), wd = tNow().getDay(), mon = mondayOf(today), last = addDays(mon, -7);
  let m = '', wk = '';
  if (wd === 5 && !SENT[mon]) { m = tNow().getHours() >= 12 || calcDay(dayOf(today)).end ? 'Heute ist Freitag – bitte den Stundenzettel an ' : 'Denk heute daran, den Stundenzettel an '; wk = mon; }
  else if ((wd === 6 || wd === 0) && !SENT[mon] && Object.keys(DAYS).some(i => i >= mon && i <= today)) { m = 'Stundenzettel dieser Woche noch nicht übermittelt – bitte an '; wk = mon; }
  else if (wd >= 1 && wd <= 4 && !SENT[last] && Object.keys(DAYS).some(i => i >= last && i < mon)) { m = 'Der Stundenzettel der letzten Woche fehlt noch – bitte an '; wk = last; }
  if (!m) return '';
  return `<div class="card p-4 mb-4 flex flex-wrap items-center gap-3 border-s/50" style="background:rgb(var(--s-rgb)/.14)"><span class="w-10 h-10 rounded-full grid place-items-center shrink-0" style="background:rgb(var(--s-rgb)/.25);color:var(--yel-ink)">${ic('alert', 20)}</span><div class="flex-1 min-w-[200px] text-[14px]"><b>Erinnerung:</b> ${m}${esc(S.recipient.name || 'das Büro')} schicken (KW ${isoWeek(wk).w}).</div><button class="btn-p !h-10" data-a="send-week" data-mon="${wk}">${ic('send', 16)}Jetzt senden</button></div>`;
}

/* ---------- Heute ---------- */
function siteChips(target) {
  const l = (S.sites || []).slice(0, 8); if (!l.length) return '';
  return `<div class="flex flex-wrap gap-1.5 mt-2">${l.map(x => `<button type="button" class="chip" data-a="site-pick" data-t="${target}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
}
function viewHome() {
  const iso = isoToday(), d = dayOf(iso), c = calcDay(d), seg = curSeg(d), wk = isoWeek(iso), dt = tNow();
  const state = d.type !== 'work' ? 'absent' : c.inPause ? 'pause' : seg ? 'work' : 'idle';
  const status = { idle: (d.segs || []).length ? `Ausgestempelt um ${esc(c.end)} Uhr` : 'Noch nicht eingestempelt', work: `Bei der Arbeit seit ${esc(seg ? seg.von : '')} Uhr${seg && seg.site ? ` · ${esc(seg.site)}` : ''}`, pause: `In Pause seit ${esc((openPause(d) || {}).von || '')} Uhr`, absent: typeName(d.type) }[state];
  const dot = { idle: 'bg-ink3', work: 'bg-p', pause: 'bg-s', absent: 'bg-s' }[state];
  const btn = (a, label, icon, style, dis) => `<button class="stamp" data-a="${a}" style="${style}" ${dis ? 'disabled' : ''}>${ic(icon, 30, 2)}<span>${label}</span></button>`;
  const G = 'background:rgb(var(--p-rgb));color:#fff', Y = 'background:rgb(var(--s-rgb));color:#1b1405', R = 'background:#D9482B;color:#fff', N = 'background:var(--raised);color:var(--ink);border:1px solid var(--line2)';
  let buttons = '';
  const V = 'background:rgb(var(--s-rgb)/.16);color:var(--yel-ink);border:1px solid rgb(var(--s-rgb)/.45)';
  if (state === 'idle') buttons = `<div class="grid gap-3">${btn('in', (d.segs || []).length ? 'Wieder kommen' : 'Kommen', 'play', G)}${(d.segs || []).length || !isWorkday(iso) ? '' : `<div class="grid grid-cols-2 gap-3">${btn('vac-today', 'Heute Urlaub', 'palm', V)}${btn('sick-today', 'Heute krank', 'heartp', 'background:var(--t-red);color:var(--red-ink);border:1px solid rgba(217,72,43,.35)')}</div>`}</div>`;
  else if (state === 'work') buttons = `<div class="grid grid-cols-2 gap-3">${btn('pause', 'Pause', 'coffee', Y)}${btn('switch', 'Baustelle wechseln', 'refresh', N)}<div class="col-span-2">${btn('out', 'Gehen', 'stop', R)}</div></div>`;
  else if (state === 'pause') buttons = `<div class="grid grid-cols-2 gap-3">${btn('pause', 'Pause beenden', 'play', G)}${btn('out', 'Gehen', 'stop', R)}</div>`;
  else buttons = `<div class="rounded-[var(--r)] p-5 text-center" style="background:rgb(var(--s-rgb)/.14)"><div class="text-yel-ink">${ic(d.type === 'urlaub' ? 'palm' : d.type === 'krank' ? 'heartp' : 'cal', 34, 1.7)}</div><div class="text-[20px] font-semibold mt-2">Heute: ${d.betrieb ? esc(d.betrieb) : typeName(d.type)}</div>${d.type === 'feiertag' && holiday(iso) ? `<div class="text-ink3 text-[14px]">${esc(holiday(iso))}</div>` : ''}</div><div class="grid grid-cols-2 gap-3 mt-3">${btn('in', 'Trotzdem kommen', 'play', G)}${d.type === 'urlaub' ? btn('vac-undo', 'Urlaub zurücknehmen', 'x', N) : d.type === 'krank' ? btn('sick-undo', 'Doch nicht krank', 'x', N) : ''}</div>${d.type === 'krank' ? `<button class="btn-s w-full mt-3" data-a="sick-tell">${ic('send', 16)}${esc(S.recipient.name || 'Büro')} Bescheid geben</button><p class="hint text-center">Gute Besserung! Bitte die Krankmeldung (AU) wie gewohnt einreichen.</p>` : ''}`;
  /* fehlendes Gehen an früheren Tagen */
  const miss = Object.values(DAYS).filter(x => x.iso < iso && x.iso >= addDays(iso, -21) && calcDay(x).missingEnd).sort((a, b) => a.iso.localeCompare(b.iso));
  const missCard = miss.length ? `<div class="card p-4 mt-4 border-ember/50 flex flex-wrap items-center gap-3" style="background:var(--t-red)"><span class="text-ember">${ic('alert', 20)}</span><div class="flex-1 min-w-[200px] text-[14px]">Ausstempeln fehlt: ${miss.map(x => `<b>${wdOf(x.iso).slice(0, 2)}, ${deDate(x.iso)}</b>`).join(', ')} – bitte vom Admin korrigieren lassen.</div><a class="btn-s !h-9" href="#/woche/${mondayOf(miss[0].iso)}">Ansehen</a></div>` : '';
  const segs = (d.segs || []).map(s => `<div class="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[14px]"><span class="w-2 h-2 rounded-full ${s.bis ? 'bg-ink3' : 'bg-p'}"></span><span class="flex-1 min-w-0 truncate">${esc(s.site || 'Ohne Baustelle')}</span><span class="mono text-ink2">${esc(s.von)}–${esc(s.bis || 'jetzt')}</span></div>`).join('');
  const W = calcRange(weekOf(mondayOf(iso))), ACC = account(), bal = ACC.over, vac = vacation();
  const week = W.days.filter(x => x.c.soll > 0 || hasData(x.d)).map(x => `<a href="#/woche/${mondayOf(iso)}" class="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[14px] ${x.d.iso === iso ? 'font-semibold' : ''}"><span class="w-24">${wdOf(x.d.iso).slice(0, 2)}, ${deDate(x.d.iso).slice(0, 6)}</span><span class="flex-1 text-ink3 truncate">${x.d.type !== 'work' ? typeName(x.d.type) : x.c.start ? `${x.c.start}–${x.c.end || '…'}` : '–'}</span><span class="mono w-14 text-right">${hm(x.c.netto + x.c.credit)}</span><span class="mono w-12 text-right text-ink3 text-[12px] whitespace-nowrap">/ ${hm(x.c.soll)}</span></a>`).join('');
  return `<section class="pt-6 sm:pt-10">
    ${reminderCard()}
    ${S.person.name ? '' : `<a href="#/einstellungen/person" class="card p-4 mb-4 flex items-center gap-3 text-[14px]" style="background:var(--t-yel)"><span class="text-yel-ink">${ic('info', 18)}</span><span class="flex-1">Bitte zuerst deinen Namen eintragen – er steht auf dem Stundenzettel.</span>${ic('arrowR', 16)}</a>`}
    <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-4">
      <div class="card p-5 sm:p-7">
        <div class="flex items-center justify-between gap-3"><span class="text-[13px] text-ink3">${WD[dt.getDay()]}, ${deDate(iso)} · KW ${wk.w}</span><span class="inline-flex items-center gap-2 text-[13px]"><span class="w-2 h-2 rounded-full ${dot} ${state === 'work' ? 'animate-pulse' : ''}"></span>${esc(status)}</span></div>
        <div class="big-clock text-[52px] sm:text-[76px] leading-none mt-4" id="clock">${nowHMS()}</div><div class="text-[12px] mt-2" id="clock-src">${clockSrc()}</div>
        ${state === 'idle' || state === 'work' ? `<label class="block mt-6"><span class="lbl">${state === 'work' ? 'Neue Baustelle (für „Baustelle wechseln“)' : 'Baustelle'}</span><input class="inp" id="site" list="dl-sites" placeholder="z. B. Meier, Lotte" autocomplete="off" value="${state === 'idle' && (d.segs || []).length ? esc(d.segs[d.segs.length - 1].site || '') : ''}"></label>${siteChips('site')}` : ''}
        <div class="mt-5">${GEO_STATE === 'denied' ? `<div class="rounded-[var(--r)] p-5" style="background:var(--t-red)"><div class="flex items-center gap-2 font-semibold text-red-ink">${ic('pin', 18)}Standort nicht freigegeben – Stempeln gesperrt</div><div class="mt-3">${geoHelp()}</div><button class="btn-p w-full mt-4" data-a="geo-retry">${ic('refresh', 16)}Erneut prüfen</button></div>` : `${GEO_STATE !== 'granted' && !S.gpsConsent ? `<button class="w-full text-left rounded-[var(--rb)] p-3 mb-3 text-[13px] flex items-center gap-2" style="background:var(--p-light)" data-a="geo-ask">${ic('pin', 16)}<span class="flex-1">Zum Stempeln wird der Standort benötigt – jetzt freigeben</span>${ic('arrowR', 15)}</button>` : ''}${buttons}`}</div>
        ${missCard}
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-2">${kpi('Arbeitszeit heute', hm(c.netto + c.credit), 'live-netto')}${kpi('Soll heute', hm(c.soll))}${kpi('Pause (abgezogen)', `${hm(c.abzug)}`, 'live-pause')}${kpi('Pause gestempelt', hm(c.pause))}</div>
        <p class="text-[12px] text-ink3 -mt-2">Heute werden mindestens ${dayPause(iso)} Min. Pause abgezogen – auch ohne gestempelte Pause; längere Pausen voll.</p>
        ${segs ? `<div class="card p-4"><div class="text-[13px] text-ink3 mb-1">Heute</div>${segs}${(d.geo || []).length ? `<div class="grid grid-cols-2 gap-2 mt-3">${d.geo.slice(-2).map(geoTile).join('')}</div>` : ''}</div>` : ''}
        <div class="grid grid-cols-2 gap-2"><div class="kpi" style="background:var(--p-light)"><div class="text-[12px] text-ink3">Überstunden gesamt</div><div class="text-[26px] font-semibold mt-1 text-p">${overTxt(bal)}</div>${ACC.minus ? `<div class="text-[12px] text-red-ink mt-1">Minusstunden: ${hm(ACC.minus)}</div>` : ''}</div><a href="#/urlaub" class="kpi block"><div class="text-[12px] text-ink3">Resturlaub ${tNow().getFullYear()}</div><div class="text-[26px] font-semibold mt-1">${fmtDays(vac.left)} <span class="text-[13px] text-ink3 font-normal">von ${fmtDays(vac.total)} Tagen</span></div></a></div>
      </div>
    </div>
    <div class="mt-4">${weekCard(mondayOf(iso), true)}</div>
    <div class="card p-5 mt-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-2"><h2 class="sec-t">Diese Woche</h2></div>${week || '<div class="text-ink3 text-[14px]">Noch keine Einträge.</div>'}
      <div class="flex flex-wrap gap-2 mt-4"><a class="btn-s" href="#/woche">${ic('cal', 16)}Woche ansehen</a><button class="btn-g" data-a="konto-edit">${ic('edit', 15)}Bestand einpflegen (Admin)</button><button class="btn-p" data-a="send-week" data-mon="${mondayOf(iso)}">${ic('send', 16)}Stundenzettel an ${esc(S.recipient.name || 'Büro')}</button></div></div>
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
          ${(d.geo || []).length ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">${d.geo.map(geoTile).join('')}</div>` : ''}${(d.offline || []).length ? `<div class="text-[12px] text-yel-ink mt-1.5">${ic('alert', 12)} offline gestempelt (Handy-Uhr): ${esc(d.offline.join(', '))}</div>` : ''}${d.edited ? `<div class="text-[12px] text-ink3 mt-1.5">${ic('edit', 12)} nachgetragen${log ? ` (${log} Änderung${log > 1 ? 'en' : ''})` : ''}</div>` : ''}
        </div>
        <div class="text-right"><div class="text-[18px] font-semibold mono">${hm(c.netto + c.credit)}</div><div class="text-[12px] text-ink3">Soll ${hm(c.soll)}</div></div>
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
    <div class="grid lg:grid-cols-[1fr_260px] gap-3 mt-5">${weekCard(mon)}<div class="kpi"><div class="text-[12px] text-ink3">Überstunden gesamt</div><div class="text-[22px] font-semibold mt-1 text-p">${overTxt(balance())}</div>${account().minus ? `<div class="text-[12px] text-red-ink mt-1">Minusstunden gesamt: ${hm(account().minus)}</div>` : ''}<button class="btn-g !h-8 !px-0 mt-2" data-a="konto-edit">${ic('edit', 14)}Bestand einpflegen</button></div></div>
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
    else if (d.type === 'sonder') { bg = 'rgba(139,92,246,.18)'; tag = 'S'; }
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
  const y = tNow().getFullYear(), v = vacation(y), today = isoToday();
  const von = UI.vVon || today, bis = UI.vBis || von, days = workDaysIn(von, bis);
  const list = Object.values(DAYS).filter(d => d.type === 'urlaub' && d.iso.startsWith(y + '-') && !betriebOf(d.iso)).sort((a, b) => a.iso.localeCompare(b.iso));
  const blocks = []; list.forEach(d => { const l = blocks[blocks.length - 1]; if (l && workDaysIn(addDays(l.bis, 1), addDays(d.iso, -1)).length === 0) { l.bis = d.iso; l.n += sollOf(d.iso) > 0 ? dayFactor(d.iso) : 0; } else blocks.push({ von: d.iso, bis: d.iso, n: sollOf(d.iso) > 0 ? dayFactor(d.iso) : 0 }); });
  const reqs = (UI.requests || []).slice().reverse().slice(0, 8);
  return `<section class="pt-6 sm:pt-10"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Urlaub</h1>
    ${buList().filter(b => b.bis >= today).length ? `<div class="card p-4 mt-5 flex flex-wrap items-center gap-3" style="background:rgb(229,154,92,.12)"><span style="color:#C7792F">${ic('cal', 20)}</span><a href="#/einstellungen/bu" class="text-[13px] text-p font-semibold order-last">Ansehen / ändern →</a><div class="flex-1 min-w-[200px] text-[14px]">${buList().filter(b => b.bis >= today).map(b => `<div><b>${esc(b.name || 'Betriebsurlaub')}</b>: ${deDate(b.von)} – ${deDate(b.bis)} · ${(() => { const l = workDaysIn(b.von, b.bis), ys = [...new Set(l.map(i => i.slice(0, 4)))]; return ys.length > 1 ? ys.map(y2 => { const n = vacDays(l.filter(i => i.startsWith(y2))); return `${fmtDays(n)} ${n === 1 ? 'Tag' : 'Tage'} ${y2}`; }).join(' + ') : `${fmtDays(vacDays(l))} Urlaubstage`; })()}${b.abzug === false ? ' (zählt nicht vom Urlaub)' : ''}</div>`).join('')}</div></div>` : ''}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">${kpi(`Anspruch ${y}`, `${fmtDays(v.total)} Tage`)}${kpi('Genommen', `${fmtDays(v.taken)} Tage`)}${kpi('Geplant', `${fmtDays(v.planned)} Tage${v.betrieb ? ` <span class="text-[12px] text-ink3 font-normal">davon ${fmtDays(v.betrieb)} Betriebsurl.</span>` : ''}`)}<div class="kpi" style="background:var(--p-light)"><div class="text-[12px] text-ink3">Resturlaub</div><div class="text-[26px] font-semibold mt-1 text-p">${fmtDays(v.left)} Tage</div></div></div>
    ${v.ent.why || v.sonder ? `<p class="hint">${v.ent.why ? esc(v.ent.why) + (v.ent.manual ? ' · angepasst auf ' + v.ent.days + ' Tage' : '') : ''}${v.ent.why && v.sonder ? ' · ' : ''}${v.sonder ? `Sonderurlaub ${y}: ${v.sonder} ${v.sonder === 1 ? 'Tag' : 'Tage'} (wird nicht vom Urlaub abgezogen)` : ''}</p>` : ''}
    <button class="btn-g mt-2" data-a="konto-edit">${ic('edit', 15)}Urlaub / Überstunden einpflegen (Admin)</button>
    <div class="grid lg:grid-cols-2 gap-4 mt-4">
      <div class="card p-5 sm:p-6"><h2 class="sec-t mb-1">Urlaub eintragen oder einreichen</h2><p class="text-ink3 text-[14px] mb-5">Wochenenden und Feiertage werden nicht mitgezählt.</p>
        <div class="grid grid-cols-2 gap-3"><label class="block"><span class="lbl">Von</span><input type="date" class="inp" data-vac="von" value="${esc(von)}"></label><label class="block"><span class="lbl">Bis</span><input type="date" class="inp" data-vac="bis" value="${esc(bis)}"></label></div>
        <label class="block mt-3"><span class="lbl">Bemerkung (optional)</span><input class="inp" data-vac="note" value="${esc(UI.vNote || '')}" placeholder="z. B. Familienurlaub"></label>
        <div class="kpi mt-4 flex items-center justify-between"><span class="text-[14px]">${deDate(von)} – ${deDate(bis)}</span><b class="text-[22px]" id="vac-n">${fmtDays(vacDays(days))} Urlaubstag${days.length === 1 ? '' : 'e'}</b></div>
        ${vacDays(days) > v.left ? `<p class="text-ember text-[13px] mt-2">Achtung: mehr Tage als Resturlaub (${fmtDays(v.left)}).</p>` : ''}
        <div class="grid sm:grid-cols-2 gap-2 mt-4"><button class="btn-p !h-12" data-a="vac-submit">${ic('send', 17)}Urlaub einreichen (PDF an ${esc(S.recipient.name || 'Büro')})</button><button class="btn-s !h-12" data-a="vac-set">${ic('palm', 17)}Direkt eintragen</button></div>
        <p class="hint">„Einreichen“ erstellt einen Urlaubsantrag als PDF, speichert ihn und öffnet Teilen (WhatsApp). „Direkt eintragen“ trägt die Tage in den Kalender ein – vergangene Tage nur mit Admin-Passwort.</p></div>
      <div class="card p-5 sm:p-6"><h2 class="sec-t mb-3">Eingetragener Urlaub ${y}</h2>${blocks.length ? blocks.map(b => `<div class="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[14px]"><span class="text-yel-ink">${ic('palm', 16)}</span><span class="flex-1">${deDate(b.von)}${b.bis !== b.von ? ' – ' + deDate(b.bis) : ''}</span><b>${fmtDays(b.n)} Tag${b.n === 1 ? '' : 'e'}</b><button class="btn-g !h-8 !px-2 hover:!text-ember" data-a="vac-del" data-von="${b.von}" data-bis="${b.bis}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('') : '<div class="text-ink3 text-[14px]">Noch kein Urlaub eingetragen.</div>'}
        ${reqs.length ? `<h3 class="font-semibold mt-6 mb-2 text-[15px]">Eingereichte Anträge</h3>${reqs.map(r => `<div class="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[13px]"><span class="flex-1">${deDate(r.von)} – ${deDate(r.bis)} · ${r.n} Tage</span><span class="text-ink3">eingereicht ${deDate(r.at.slice(0, 10))}</span></div>`).join('')}` : ''}</div>
    </div>${calendar()}</section>`;
}

/* ---------- Einstellungen ---------- */
const SET_TABS = [['person', 'Ich & Empfänger', 'users'], ['zeiten', 'Arbeitszeiten', 'clock'], ['konten', 'Konten', 'cal'], ['bu', 'Betriebsurlaub', 'palm'], ['firma', 'Firma & Logo', 'building'], ['design', 'Design', 'sun'], ['admin', 'Admin', 'gear'], ['daten', 'Daten', 'download']];
const LOCKED_TABS = ['zeiten', 'konten', 'bu'];
const sIn = (path, label, ph = '', type = 'text', dis = false) => { const v = path.split('.').reduce((o, k) => (o || {})[k], S); return `<label class="block"><span class="lbl">${label}</span><input class="inp" data-s="${path}" type="${type}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" ${type === 'number' ? 'inputmode="decimal"' : ''} ${dis ? 'disabled' : ''}></label>`; };
function setBody() {
  const ro = LOCKED_TABS.includes(UI.tab) && !canEdit();
  const lockNote = ro ? `<div class="rounded-[var(--rb)] bg-raised p-3 mb-5 flex flex-wrap items-center gap-3 text-[14px]"><span class="text-ink3">${ic('alert', 17)}</span><span class="flex-1">Nur mit Admin-Passwort änderbar.</span><button class="btn-s !h-9" data-a="unlock">Freischalten</button></div>` : '';
  switch (UI.tab) {
    case 'person': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('person.name', 'Mein Name', 'Vor- und Nachname')}${sIn('person.nr', 'Personalnummer (optional)')}</div>
      <h3 class="font-semibold mt-7 mb-3">Stundenzettel senden an</h3><div class="grid sm:grid-cols-2 gap-4">${sIn('recipient.name', 'Name', 'z. B. Jule')}${sIn('recipient.phone', 'WhatsApp-Nummer (optional)', 'z. B. 0176 …', 'tel')}</div>
      <p class="hint">Das PDF wird gespeichert und über „Teilen“ an WhatsApp übergeben – dort ${esc(S.recipient.name || 'den Empfänger')} auswählen. Die Nummer wird genutzt, wenn das Gerät kein Teilen von Dateien kann.</p>
      <h3 class="font-semibold mt-7 mb-2">Erinnerung jeden Freitag</h3><p class="text-ink3 text-[14px] mb-3">Die App erinnert freitags auf der Startseite. Zusätzlich kann eine wiederkehrende Erinnerung in den Handy-Kalender übernommen werden – sie meldet sich jeden Freitag um 13:30 Uhr, auch wenn die App geschlossen ist.</p><button class="btn-s" data-a="ics">${ic('cal', 16)}Erinnerung in Kalender übernehmen</button>
      <div class="kpi mt-6 text-[14px] flex items-start gap-2"><span class="text-p mt-0.5">${ic('pin', 16)}</span><span>Beim Kommen, bei Pausen und beim Gehen wird der Standort gespeichert (Pflicht). Ohne Standortfreigabe ist Stempeln nicht möglich.${S.gpsConsent ? ` Hinweis bestätigt am ${deDate(S.gpsConsent.slice(0, 10))}.` : ''}</span></div>`;
    case 'zeiten': return `${lockNote}<p class="text-ink3 text-[14px] mb-4">Sollzeiten je Wochentag. Die Mindestpause wird bei der Sollzeit und bei jedem Arbeitstag abgezogen.</p>
      <div class="grid grid-cols-[70px_1fr_1fr_64px_58px] gap-2 text-[12px] text-ink3 mb-1"><span>Tag</span><span>Beginn</span><span>Ende</span><span>Pause</span><span class="text-right">Soll</span></div><div class="space-y-2">${[1, 2, 3, 4, 5, 6, 0].map(k => { const h = S.hours[k]; return `<div class="grid grid-cols-[70px_1fr_1fr_64px_58px] gap-2 items-center"><label class="flex items-center gap-2 text-[14px]"><input type="checkbox" data-hour="${k}" data-k="on" ${h.on ? 'checked' : ''} ${ro ? 'disabled' : ''}>${WD[k].slice(0, 2)}</label><input type="time" class="inp !h-10 !px-2" data-hour="${k}" data-k="von" value="${esc(h.von)}" ${ro || !h.on ? 'disabled' : ''}><input type="time" class="inp !h-10 !px-2" data-hour="${k}" data-k="bis" value="${esc(h.bis)}" ${ro || !h.on ? 'disabled' : ''}><input class="inp !h-10 !px-2" inputmode="numeric" data-hour="${k}" data-k="pause" value="${esc(h.pause ?? '')}" ${ro || !h.on ? 'disabled' : ''}><span class="text-[13px] text-ink3 mono text-right">${h.on ? hm(tplSoll(k === 0 ? '2026-11-15' : addDays('2026-11-09', k - 1))) : '–'}</span></div>`; }).join('')}</div>
      <div class="kpi mt-3 flex justify-between text-[14px]"><span>Wochen-Soll</span><b>${hm(weekTarget())} Std.</b></div>
      <p class="hint">Pause = Mindestpause in Minuten, die an diesem Tag immer abgezogen wird (längere Pausen voll).</p><div class="grid sm:grid-cols-2 gap-4 mt-6"><div class="kpi"><div class="text-[12px] text-ink3">Feiertage nach Firmensitz</div><div class="text-[15px] font-semibold mt-1">${esc((STATES.find(x => x[0] === firmState()) || ['', firmState()])[1])}</div><div class="text-[12px] text-ink3 mt-0.5">${esc(FIRMA.firmensitz ? `${FIRMA.firmensitz.name}, ${FIRMA.firmensitz.ort}` : '')}</div></div></div>
      <label class="flex items-center gap-2.5 text-[14px] text-ink2 mt-4"><input type="checkbox" data-a="over6" ${S.pauseOnlyOver6 ? 'checked' : ''} ${ro ? 'disabled' : ''}>Mindestpause nur bei mehr als 6 Std. Arbeit abziehen</label>
      <h3 class="font-semibold mt-7 mb-1">Heiligabend und Silvester</h3><p class="text-ink3 text-[14px] mb-3">Halber Tag = halbe Sollzeit und ½ Urlaubstag (auch im Betriebsurlaub). Frei = arbeitsfrei, zählt nicht als Urlaub.</p>
      <div class="space-y-2">${HALF_DAYS.map(([k, l]) => `<div class="flex flex-wrap items-center gap-2"><span class="text-[14px] w-44">${l}</span><div class="seg">${[['halb', 'Halber Tag'], ['voll', 'Ganzer Tag'], ['frei', 'Frei']].map(([v, t]) => `<button class="${((S.halfDays || {})[k] || 'voll') === v ? 'on' : ''}" data-a="half-day" data-k="${k}" data-v="${v}" ${ro ? 'disabled' : ''}>${t}</button>`).join('')}</div></div>`).join('')}</div>`;
    case 'konten': { const v = vacation(); return `${lockNote}<h3 class="font-semibold mb-3">Urlaub ${tNow().getFullYear()}</h3><div class="grid grid-cols-2 gap-4">${sIn('person.start', 'Eintrittsdatum (hier angefangen am)', '', 'date', ro)}${sIn('vacation.perYear', 'Urlaubstage pro Jahr (laut Vertrag)', '30', 'number', ro)}</div>
      <div class="mt-4"><span class="lbl">Berechnung im Eintrittsjahr</span><div class="seg">${[['anteilig', 'Anteilig (1/12 je Monat)'], ['gesetz', 'Gesetzlich (BUrlG)']].map(([k, l]) => `<button class="${(S.vacation.rule || 'anteilig') === k ? 'on' : ''}" data-a="vac-rule" data-v="${k}" ${ro ? 'disabled' : ''}>${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-4 mt-4"><label class="block"><span class="lbl">Anspruch ${tNow().getFullYear()} (automatisch: ${v.ent.auto} Tage)</span><input class="inp" data-vman type="number" inputmode="decimal" value="${v.ent.manual ? esc(v.ent.days) : ''}" placeholder="automatisch" ${ro ? 'disabled' : ''}></label>${sIn('vacation.carry', 'Resturlaub Vorjahr', '0', 'number', ro)}</div>
      ${v.ent.why ? `<p class="hint">${esc(v.ent.why)}${v.ent.manual ? ' · von Hand angepasst' : ''}</p>` : ''}<p class="hint">Genommen: ${fmtDays(v.taken)} · Geplant: ${fmtDays(v.planned)} · Übrig: ${fmtDays(v.left)} Tage (nur Arbeitstage, ohne Wochenende und Feiertage)${v.sonder ? ` · Sonderurlaub: ${v.sonder} ${v.sonder === 1 ? 'Tag' : 'Tage'} (zählt nicht zum Urlaub)` : ''}</p>
      <h3 class="font-semibold mt-7 mb-2">Betriebsurlaub</h3><a href="#/einstellungen/bu" class="kpi flex items-center gap-3 text-[14px]"><span style="color:#C7792F">${ic('cal', 17)}</span><span class="flex-1">${firmBu().map(b => `${esc(b.name || 'Betriebsurlaub')}: ${deDate(b.von)} – ${deDate(b.bis)}`).join(' · ') || 'Kein Betriebsurlaub eingetragen'}</span><span class="text-p font-semibold">Ändern →</span></a>
      <h3 class="font-semibold mt-7 mb-3">Überstundenkonto</h3><div class="grid grid-cols-2 gap-4">${sIn('balance.from', 'Zählt ab', '', 'date', ro)}<label class="block"><span class="lbl">Startwert Überstunden (Std:Min, z. B. 12:30)</span><input class="inp" data-bal value="${esc(hm(S.balance.min || 0))}" ${ro ? 'disabled' : ''}></label></div><p class="hint">Aktuell: <b>${overTxt(balance())}</b>${account().minus ? ` · Minusstunden: ${hm(account().minus)}` : ''}. Fehlende Stunden werden zuerst von den Überstunden abgezogen, der Rest als Minusstunden ausgewiesen.</p>
      <button class="btn-p mt-4" data-a="konto-edit">${ic('edit', 16)}Bestand einpflegen</button>
      ${(S.kontoLog || []).length ? `<h3 class="font-semibold mt-7 mb-2">Änderungsprotokoll</h3><div class="space-y-1">${S.kontoLog.slice().reverse().slice(0, 15).map(l => `<div class="text-[12px] text-ink3"><b class="text-ink2">${new Date(l.at).toLocaleString('de-DE')}</b> · ${esc(l.what)}</div>`).join('')}</div>` : ''}`; }
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
