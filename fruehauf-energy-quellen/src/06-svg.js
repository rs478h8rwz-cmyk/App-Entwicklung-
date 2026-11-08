
/* =========================================================
   Illustrationen & Diagramme (SVG mit festen Farben)
   ========================================================= */
function houseSVG(o = {}) {
  const p = o.p || S.design.primary, s = o.s || S.design.secondary, sky = o.sky !== false;
  const dawn = o.dawn !== undefined ? o.dawn : (THEME_CTX === 'doc' ? S.design.pdfTheme !== 'light' : appDark());
  const wide = !!o.wide, W = wide ? 1200 : 600, dx = wide ? 590 : 0, uid2 = (dawn ? 'd' : 'l') + (wide ? 'w' : 'n') + (o.cover ? 'c' : '');
  const id = n => n + uid2;
  const top = { y: 150, l: 205, r: 395 }, bot = { y: 228, l: 150, r: 450 }, lerp = (a, b, t) => a + (b - a) * t;
  const K = dawn
    ? { sky1: '#060B16', sky2: '#13213D', sky3: '#3A3550', hor: '#E59A5C', hill1a: '#132A22', hill1b: '#0E2019', hill2a: '#0F241B', hill2b: '#0A1913', wall1: '#2C3644', wall2: '#222B37', wallS: '#3A4656', roof1: '#4A2219', roof2: '#5C2C21', eave: '#3A1A13', win: '#FFC870', winS: '#FFE2A8', mod1: modColors(true).m1, mod2: modColors(true).m2, modS: modColors(true).s, hp: '#3B4756', hpS: '#566577', fan: '#2C3644', tree: '#163A26', cloud: '#E9A27A' }
    : { sky1: '#A9D4F5', sky2: '#CFE7FA', sky3: '#E8F4FD', hor: '#F4FAFF', hill1a: '#A9DCA0', hill1b: '#86C98A', hill2a: '#8FD08F', hill2b: '#6BB979', wall1: '#FFFFFF', wall2: '#EEF3F7', wallS: '#DCE6EE', roof1: '#C8553D', roof2: '#D9694F', eave: '#A9432E', win: '#CFE6F8', winS: '#ffffff', mod1: modColors(false).m1, mod2: modColors(false).m2, modS: modColors(false).s, hp: '#F7FAFC', hpS: '#C9D6E1', fan: '#E3EBF2', tree: '#5FAE6E', cloud: '#ffffff' };
  let mods = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const pad = 0.035, t0 = 0.1 + r * 0.27 + 0.012, t1 = t0 + 0.255;
    const y0 = lerp(top.y, bot.y, t0), y1 = lerp(top.y, bot.y, t1);
    const l0 = lerp(top.l, bot.l, t0) + 14, r0 = lerp(top.r, bot.r, t0) - 14, l1 = lerp(top.l, bot.l, t1) + 14, r1 = lerp(top.r, bot.r, t1) - 14;
    const a0 = c / 6 + pad / 6, a1 = (c + 1) / 6 - pad / 6;
    const pts = [[lerp(l0, r0, a0), y0], [lerp(l0, r0, a1), y0], [lerp(l1, r1, a1), y1], [lerp(l1, r1, a0), y1]];
    const ptsS = pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ');
    mods += `<polygon points="${ptsS}" fill="url(#${id('mod')})" stroke="${K.modS}" stroke-width="0.8"/>` + (o.anim ? `<polygon class="ha-glint" style="animation-delay:${(c * 0.14 + r * 0.1).toFixed(2)}s" points="${ptsS}" fill="#ffffff"/>` : '');
  }
  // Haus: klassisch oder modern, Licht an/aus, PV/WP/E-Auto je nach Angebot
  const style = o.style || S.design.houseStyle || 'classic', lightMode = o.light || S.design.houseLight || 'auto';
  const lit = lightMode === 'on' || (lightMode !== 'off' && dawn);
  const winF = lit ? '#FFC870' : dawn ? '#1C2532' : '#CFE6F8', winS2 = lit ? '#FFE2A8' : dawn ? '#3A4656' : '#ffffff';
  const glow = (x, y, w, h) => (lit ? `<rect class="ha-glow" x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="10" fill="#FFC870" opacity="${dawn ? 0.2 : 0.14}"/>` : '');
  const batOn = !!o.bat, hpX = 446;
  const hpUnit = o.hp === false ? '' : `<g transform="translate(${hpX} 284)"><rect x="0" y="0" width="74" height="46" rx="6" fill="${K.hp}" stroke="${K.hpS}" stroke-width="2"/>
<circle cx="25" cy="23" r="15" fill="${K.fan}" stroke="${K.hpS}" stroke-width="2"/><g class="ha-fan"><circle cx="25" cy="23" r="13" fill="none"/><path d="M25 10v26M12 23h26M16 14l18 18M34 14 16 32" stroke="${K.hpS}" stroke-width="1.6"/></g>
<rect x="49" y="9" width="17" height="4" rx="2" fill="${K.hpS}"/><rect x="49" y="17" width="17" height="4" rx="2" fill="${K.hpS}"/><rect class="ha-led" x="49" y="25" width="10" height="4" rx="2" fill="${p}"/>
<rect x="6" y="46" width="8" height="4" fill="${K.hpS}"/><rect x="60" y="46" width="8" height="4" fill="${K.hpS}"/></g>
<path d="M432 300 H${hpX}" stroke="${K.hpS}" stroke-width="3"/>${o.anim ? `<path class="ha-flow" d="M${hpX} 300 H432" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 7"/>` : ''}`;
  // Carport mit E-Auto und Wallbox
  const car = !!o.car, wbx = style === 'modern' ? 170 : 172;
  const carport = !car ? '' : `<g>
<ellipse cx="94" cy="333" rx="66" ry="6" fill="#000" opacity="${dawn ? 0.3 : 0.08}"/>
${style === 'modern' ? `<rect x="26" y="258" width="132" height="7" rx="2" fill="${dawn ? '#1A2029' : '#2B3440'}"/>` : `<polygon points="22,266 166,266 154,250 34,250" fill="${K.roof1}"/><rect x="20" y="264" width="148" height="5" rx="2.5" fill="${K.eave}"/>`}
<rect x="32" y="264" width="5" height="68" fill="${dawn ? '#3A4656' : '#8A97A6'}"/><rect x="148" y="264" width="5" height="68" fill="${dawn ? '#3A4656' : '#8A97A6'}"/>
<defs><linearGradient id="${id('car')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p, '#ffffff', 0.18)}"/><stop offset="1" stop-color="${mix(p, '#000000', 0.25)}"/></linearGradient></defs>
<g transform="translate(44 294)"><path d="M12 24 L20 11 Q23 6 29 6 H58 Q64 6 68 11 L77 24 Z" fill="${p}"/><rect x="0" y="22" width="92" height="13" rx="6" fill="${p}"/>
<path d="M30 10 H42 V21 H23 Z" fill="${dawn ? '#2C3E55' : '#DDEFF9'}"/><path d="M45 10 H56 Q61 10 64 14 L68 21 H45 Z" fill="${dawn ? '#2C3E55' : '#DDEFF9'}"/>
<circle cx="20" cy="36" r="8" fill="#26303B"/><circle cx="20" cy="36" r="3.5" fill="#9AA8B6"/><circle cx="72" cy="36" r="8" fill="#26303B"/><circle cx="72" cy="36" r="3.5" fill="#9AA8B6"/>
<rect x="86" y="25" width="5" height="4" rx="1.5" fill="${lit ? '#FFE9A8' : '#FFF4D6'}"/></g>
<rect x="${wbx}" y="270" width="16" height="24" rx="3.5" fill="${dawn ? '#2C3644' : '#ffffff'}" stroke="${K.hpS}" stroke-width="1.5"/><circle cx="${wbx + 8}" cy="278" r="2.4" fill="#3FBF6E"/><rect x="${wbx + 3}" y="286" width="10" height="3" rx="1.5" fill="${p}"/>
<path d="M${wbx + 8} 294 C ${wbx + 8} 316, 146 322, 136 320" fill="none" stroke="#1B232C" stroke-width="2.6" stroke-linecap="round"/>${o.anim ? `<path class="ha-flow" d="M${wbx + 8} 294 C ${wbx + 8} 316, 146 322, 136 320" fill="none" stroke="#5CE08F" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 6"/>` : ''}</g>`;
  // Stromspeicher als Tower zur Außenmontage (z. B. EcoFlow Ocean 2)
  const tx = style === 'modern' ? 255 : 201;
  const tower = !batOn ? '' : `<g transform="translate(${tx} 262)"><ellipse cx="15" cy="71" rx="20" ry="3.5" fill="#000" opacity="${dawn ? 0.3 : 0.1}"/>
<rect x="0" y="0" width="30" height="14" rx="4" fill="${dawn ? '#3B4756' : '#F7FAFC'}" stroke="${K.hpS}" stroke-width="1.6"/><rect x="5" y="5" width="12" height="3" rx="1.5" fill="${p}"/><circle cx="23" cy="7" r="1.8" fill="${lit || dawn ? '#5CE08F' : '#3FBF6E'}"/>
${[0, 1, 2].map(i => `<rect x="0" y="${15 + i * 17}" width="30" height="16" rx="3" fill="${dawn ? '#33404F' : '#FFFFFF'}" stroke="${K.hpS}" stroke-width="1.6"/><rect x="4" y="${21 + i * 17}" width="22" height="2" rx="1" fill="${K.hpS}"/>`).join('')}
<rect x="2" y="66" width="26" height="4" rx="1.5" fill="${K.hpS}"/></g>
`;
  const trees = `<g fill="${K.tree}">${car ? '' : '<circle cx="120" cy="318" r="16"/><circle cx="104" cy="324" r="11"/>'}<circle cx="540" cy="336" r="13"/></g>`;
  let houseBody;
  if (style === 'modern') {
    const roofC = dawn ? '#1A2029' : '#2B3440', wood = dawn ? '#6E4A2E' : '#C98B55', woodL = dawn ? '#5A3C25' : '#B37647', wing = dawn ? '#1E2630' : '#3D4752';
    let rowMods = ''; const n = 7, x0 = 210, w = 30, gap = 2.5;
    if (o.pv !== false) for (let i = 0; i < n; i++) { const x = x0 + i * (w + gap); rowMods += `<polygon points="${x},186 ${x + w},186 ${x + w + 7},168 ${x + 7},168" fill="url(#${id('mod')})" stroke="${K.modS}" stroke-width="0.8"/><line x1="${x + w - 2}" y1="186" x2="${x + w + 4}" y2="176" stroke="${dawn ? '#3A4656' : '#8A97A6'}" stroke-width="1.5"/>`; }
    houseBody = `<ellipse cx="300" cy="333" rx="185" ry="10" fill="#000" opacity="${dawn ? 0.3 : 0.08}"/>
<rect x="150" y="236" width="56" height="96" fill="${wing}"/><rect x="146" y="230" width="64" height="7" rx="2" fill="${roofC}"/>
${car ? '' : `${glow(162, 252, 32, 46)}<rect x="162" y="252" width="32" height="46" rx="2" fill="${winF}" stroke="${winS2}" stroke-width="${dawn ? 1.2 : 2.5}"/>`}
<rect x="200" y="196" width="232" height="136" fill="url(#${id('wall')})" stroke="${K.wallS}"/>
<rect x="334" y="196" width="98" height="136" fill="${wood}"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<line x1="${342 + i * 10.5}" y1="196" x2="${342 + i * 10.5}" y2="332" stroke="${woodL}" stroke-width="1.6"/>`).join('')}
<rect x="192" y="188" width="248" height="10" rx="2" fill="${roofC}"/>${rowMods}
${[[220, 212, 44, 36], [276, 212, 44, 36], ...(batOn ? [] : [[220, 262, 100, 40]])].map(([x, y, w, h]) => `${glow(x, y, w, h)}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${winF}" stroke="${roofC}" stroke-width="3"/>${w > 60 ? `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${roofC}" stroke-width="2.5"/>` : ''}${lit ? '' : `<path d="M${x + 6} ${y + h - 4} L${x + 16} ${y + 4}" stroke="#ffffff" stroke-width="2.5" opacity="${dawn ? 0.06 : 0.4}"/>`}`).join('')}
${glow(350, 214, 66, 34)}<rect x="350" y="214" width="66" height="34" rx="2" fill="${winF}" stroke="${roofC}" stroke-width="3"/>
<rect x="364" y="268" width="36" height="64" rx="2" fill="${p}"/><rect x="368" y="274" width="8" height="52" rx="2" fill="${lit ? '#FFC870' : '#ffffff'}" opacity="${lit ? 0.75 : 0.25}"/><circle cx="394" cy="300" r="2.5" fill="#ffffff" opacity=".9"/>
${lit ? '<circle cx="356" cy="282" r="14" fill="#FFC870" opacity=".18"/><rect x="353" y="276" width="6" height="8" rx="2" fill="#FFE2A8"/>' : ''}
${carport}${tower}${hpUnit}${trees}`;
  } else {
    houseBody = `<ellipse cx="300" cy="333" rx="190" ry="10" fill="#000" opacity="${dawn ? 0.3 : 0.08}"/>
<rect x="168" y="222" width="264" height="110" rx="4" fill="url(#${id('wall')})" stroke="${K.wallS}"/>
<polygon points="${top.l},${top.y} ${top.r},${top.y} ${bot.r + 8},${bot.y + 2} ${bot.l - 8},${bot.y + 2}" fill="${K.roof1}"/>
<polygon points="${top.l + 3},${top.y + 3} ${top.r - 3},${top.y + 3} ${bot.r},${bot.y - 2} ${bot.l},${bot.y - 2}" fill="${K.roof2}"/>
${o.pv === false ? '' : mods}${dawn ? `<line x1="${top.l + 20}" y1="${top.y + 4}" x2="${top.r - 30}" y2="${top.y + 4}" stroke="${s}" stroke-opacity=".5" stroke-width="1.5"/>` : ''}
<rect x="${bot.l - 10}" y="${bot.y}" width="${bot.r - bot.l + 20}" height="6" rx="3" fill="${K.eave}"/>
<g>${batOn ? '' : glow(190, 248, 52, 40)}${glow(358, 248, 52, 40)}
${batOn ? '' : `<rect x="190" y="248" width="52" height="40" rx="4" fill="${winF}" stroke="${winS2}" stroke-width="${dawn ? 1.5 : 4}"/><line x1="216" y1="248" x2="216" y2="288" stroke="${dawn ? K.wall2 : '#fff'}" stroke-width="3"/>`}
<rect x="358" y="248" width="52" height="40" rx="4" fill="${winF}" stroke="${winS2}" stroke-width="${dawn ? 1.5 : 4}"/><line x1="384" y1="248" x2="384" y2="288" stroke="${dawn ? K.wall2 : '#fff'}" stroke-width="3"/></g>
<rect x="276" y="258" width="48" height="74" rx="5" fill="${p}"/><circle cx="314" cy="296" r="3" fill="${lit ? '#FFC870' : '#fff'}" opacity=".9"/><rect x="284" y="266" width="32" height="18" rx="3" fill="${lit ? '#FFC870' : '#fff'}" opacity="${lit ? 0.6 : 0.18}"/>
${carport}${tower}${hpUnit}${trees}`;
  }
  // Sonne: tagsüber hoch oben, in der Dämmerung knapp über dem Horizont
  const sx = dawn ? (wide ? 700 : 120) : 480 + dx, sy = dawn ? 268 : 78;
  let rays = '';
  if (!dawn) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays += `<line x1="${sx + Math.cos(a) * 52}" y1="${sy + Math.sin(a) * 52}" x2="${sx + Math.cos(a) * 68}" y2="${sy + Math.sin(a) * 68}" stroke="${s}" stroke-width="5" stroke-linecap="round" opacity=".85"/>`; }
  let stars = '';
  if (dawn) { let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < (wide ? 70 : 36); i++) { const x = rnd() * W, y = rnd() * 150; stars += `<circle class="ha-star" style="animation-delay:${(rnd() * 4).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(rnd() * 1.1 + 0.3).toFixed(2)}" fill="#fff" opacity="${(0.25 + rnd() * 0.6 * (1 - y / 170)).toFixed(2)}"/>`; } }
  const hills = `<g ${wide ? 'transform="scale(2 1)"' : ''}><path d="M0 300 C120 255 230 265 330 290 S520 262 600 278 V400 H0Z" fill="url(#${id('h1')})"/>${dawn ? `<path d="M0 300 C120 255 230 265 330 290 S520 262 600 278" fill="none" stroke="${s}" stroke-opacity=".35" stroke-width="1.2"/>` : ''}<path d="M0 340 C150 305 300 320 420 335 S560 318 600 324 V400 H0Z" fill="url(#${id('h2')})"/></g>`;
  const vb = o.cover ? `0 14 ${W} 371.4` : `0 0 ${W} 400`, sz = o.cover ? `width="${W === 600 ? 1300 : 2600}" height="805"` : 'width="100%" height="100%"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${sz} preserveAspectRatio="${o.align || 'xMidYMid'} slice">
<defs>
<linearGradient id="${id('sky')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.sky1}"/><stop offset=".45" stop-color="${K.sky2}"/><stop offset=".68" stop-color="${K.sky3}"/><stop offset=".78" stop-color="${K.hor}"/></linearGradient>
<radialGradient id="${id('glow')}" cx="${(sx / W).toFixed(3)}" cy="${(sy / 400).toFixed(3)}" r="${dawn ? 0.55 : 0.5}" gradientTransform="translate(${(sx / W).toFixed(3)} ${(sy / 400).toFixed(3)}) scale(${(400 / W).toFixed(3)} 1) translate(${(-sx / W).toFixed(3)} ${(-sy / 400).toFixed(3)})"><stop offset="0" stop-color="${s}" stop-opacity="${dawn ? 0.75 : 0.55}"/><stop offset=".35" stop-color="${s}" stop-opacity="${dawn ? 0.22 : 0.12}"/><stop offset="1" stop-color="${s}" stop-opacity="0"/></radialGradient>
<linearGradient id="${id('shoot')}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${id('mod')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${K.mod1}"/><stop offset="1" stop-color="${K.mod2}"/></linearGradient>
<linearGradient id="${id('h1')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.hill1a}"/><stop offset="1" stop-color="${K.hill1b}"/></linearGradient>
<linearGradient id="${id('h2')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.hill2a}"/><stop offset="1" stop-color="${K.hill2b}"/></linearGradient>
<linearGradient id="${id('wall')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.wall1}"/><stop offset="1" stop-color="${K.wall2}"/></linearGradient>
</defs>
${sky ? `<rect width="${W}" height="400" fill="url(#${id('sky')})"/>` : ''}${stars}${o.anim && dawn ? [[0.25, 30, 0], [0.62, 18, 4.5], [0.85, 46, 9]].map(([fx, y, d]) => `<g class="ha-shoot" style="animation-delay:${d}s"><line x1="${(fx * W).toFixed(0)}" y1="${y}" x2="${(fx * W - 46).toFixed(0)}" y2="${y + 16}" stroke="url(#${id('shoot')})" stroke-width="1.8" stroke-linecap="round"/><circle cx="${(fx * W).toFixed(0)}" cy="${y}" r="1.6" fill="#fff"/></g>`).join('') : ''}
<rect width="${W}" height="400" fill="url(#${id('glow')})"/>
<g class="ha-sun"><g class="ha-rays">${rays}</g><circle cx="${sx}" cy="${sy}" r="${dawn ? 34 : 40}" fill="${dawn ? mix(s, '#ffffff', 0.25) : s}"/>${dawn ? '' : `<circle cx="${sx}" cy="${sy}" r="30" fill="#FFD36B" opacity=".7"/>`}</g>
<g class="ha-clouds" fill="${K.cloud}" opacity="${dawn ? 0.28 : 0.95}"><ellipse cx="${120 + (dawn ? dx : dx * 0.3)}" cy="${dawn ? 100 : 80}" rx="46" ry="${dawn ? 4 : 16}"/><ellipse cx="${150 + (dawn ? dx : dx * 0.3)}" cy="${dawn ? 93 : 70}" rx="30" ry="${dawn ? 3 : 18}"/>${wide ? `<ellipse cx="${dawn ? 1080 : 520}" cy="${dawn ? 62 : 60}" rx="60" ry="${dawn ? 3 : 14}"/>` : ''}<ellipse cx="${330 + dx}" cy="${dawn ? 122 : 58}" rx="34" ry="${dawn ? 3 : 11}"/></g>
${hills}
<g transform="translate(${dx} 0)"><g class="ha-house">
${houseBody}</g></g>
${wide ? `<g fill="${K.tree}" opacity=".9"><circle cx="90" cy="342" r="14"/><circle cx="76" cy="348" r="10"/><circle cx="1150" cy="356" r="12"/></g>` : ''}
</svg>`;
}
const svgDataUri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/* ---- Achsen-Helfer ---- */
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const n = v / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e; }
const T = (x, y, txt, o = {}) => `<text x="${x}" y="${y}" font-family="${esc(S.design.fontBody)}, Arial, sans-serif" font-size="${o.fs || 11}" font-weight="${Math.min(+(o.fw || 500), 650)}" fill="${o.c || C().ink3}" text-anchor="${o.a || 'start'}"${o.extra || ''}>${esc(txt)}</text>`;

/* Gruppiertes Balkendiagramm (Monatskosten) */
function groupBars(groups, o = {}) {
  const c = C(), W = o.w || 640, H = o.h || 230, pl = 52, pr = 10, pt = 20, pb = 34;
  const max = niceMax(Math.max(...groups.flatMap(g => g.vals.map(v => v.v)), 1));
  const iw = W - pl - pr, ih = H - pt - pb, gw = iw / groups.length, n = groups[0].vals.length, bw = Math.min(30, gw * 0.7 / n);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  for (let i = 0; i <= 4; i++) { const y = pt + ih - ih * i / 4; s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="${C().grid}"/>` + T(pl - 8, y + 4, num(max * i / 4) + ' €', { a: 'end', fs: 10 }); }
  groups.forEach((g, gi) => {
    const cx = pl + gw * gi + gw / 2, x0 = cx - (n * bw + (n - 1) * 6) / 2;
    g.vals.forEach((v, k) => { const h = ih * Math.max(0, v.v) / max, x = x0 + k * (bw + 6); s += `<rect x="${x}" y="${pt + ih - h}" width="${bw}" height="${Math.max(h, 0.5)}" rx="5" fill="${v.c}"/>` + T(x + bw / 2, pt + ih - h - 5, num(v.v), { a: 'middle', fs: 9.5, fw: 700, c: C().ink2 }); });
    s += T(cx, H - 12, g.label, { a: 'middle', fs: 11, fw: 700, c: C().ink2 });
  });
  return s + '</svg>';
}
/* Horizontale Vergleichsbalken */
function hBars(items, o = {}) {
  const W = o.w || 640, rowH = o.rowH || 44, H = items.length * rowH + 6, lw = o.lw || 130, tw = W < 500 ? 80 : 110;
  const max = Math.max(...items.map(i => i.v), 1);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  items.forEach((it, i) => {
    const y = i * rowH + 6, w = (W - lw - tw) * Math.max(0, it.v) / max;
    s += T(0, y + rowH / 2 - 2, it.label, { fs: 12, fw: 700, c: C().ink }) + (it.sub ? T(0, y + rowH / 2 + 12, it.sub, { fs: 9.5 }) : '');
    s += `<rect x="${lw}" y="${y + 6}" width="${W - lw - tw}" height="${rowH - 16}" rx="${(rowH - 16) / 2}" fill="${C().track}"/><rect x="${lw}" y="${y + 6}" width="${Math.max(w, rowH - 16)}" height="${rowH - 16}" rx="${(rowH - 16) / 2}" fill="${it.c}"/>`;
    s += T(lw + Math.max(w, rowH - 16) + 10, y + rowH / 2 + 4, it.txt, { fs: 13, fw: 800, c: C().ink });
  });
  return s + '</svg>';
}
/* Ringe (Autarkie, Eigenverbrauch) */
function ring(v, label, color, size = 120) {
  const r = size / 2 - 10, cf = 2 * Math.PI * r, f = clamp(v, 0, 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${C().track}" stroke-width="12"/>
<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(cf * f).toFixed(1)} ${cf.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
${T(size / 2, size / 2 + 3, pct(f * 100), { a: 'middle', fs: size / 6, fw: 800, c: C().ink })}${T(size / 2, size / 2 + size / 7, label, { a: 'middle', fs: size / 12, fw: 600 })}</svg>`;
}
/* Amortisationsdiagramm */
function amortChart(R, o = {}) {
  const c = C(), W = o.w || 640, H = o.h || 250, pl = 60, pr = 12, pt = 16, pb = 30, rows = R.rows;
  const vals = rows.flatMap(r => [r.saldo, r.saldoStatic]).concat([-R.invest, 0]);
  const mx = niceMax(Math.max(...vals, 1)), mn = -niceMax(Math.max(-Math.min(...vals), 1));
  const iw = W - pl - pr, ih = H - pt - pb, y = v => pt + ih * (mx - v) / (mx - mn), bw = iw / rows.length;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  const steps = 5;
  for (let i = 0; i <= steps; i++) { const v = mn + (mx - mn) * i / steps; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${C().grid}"/>` + T(pl - 8, y(v) + 4, num(v / 1000, Math.abs(mx - mn) < 10000 ? 1 : 0) + ' T€', { a: 'end', fs: 9.5 }); }
  rows.forEach((r, i) => { const x = pl + i * bw + bw * 0.16, v = r.saldo, y0 = y(0), y1 = y(v); s += `<rect x="${x}" y="${Math.min(y0, y1)}" width="${bw * 0.68}" height="${Math.max(Math.abs(y1 - y0), 0.8)}" rx="3" fill="${v >= 0 ? c.p : C().salmon}"/>`; if (r.t === 1 || r.t % 5 === 0) s += T(x + bw * 0.34, H - 12, String(r.t), { a: 'middle', fs: 10 }); });
  s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="${C().ink2}" stroke-width="1"/>`;
  s += `<polyline fill="none" stroke="${C().blue}" stroke-width="2" stroke-dasharray="5 4" points="${rows.map((r, i) => `${(pl + i * bw + bw / 2).toFixed(1)},${y(r.saldoStatic).toFixed(1)}`).join(' ')}"/>`;
  const right = (R.amortStatic || 0) >= (R.amortRise || 0);
  const mark = (t, col, lab, up) => { if (t === null || t > rows.length) return ''; const x = pl + (t - 0.5) * bw; return `<line x1="${x}" x2="${x}" y1="${pt}" y2="${pt + ih}" stroke="${col}" stroke-width="1.5" stroke-dasharray="2 3"/><circle cx="${x}" cy="${y(0)}" r="5.5" fill="${C().surface}" stroke="${col}" stroke-width="3"/>` + T(x + (up ? 6 : -6), up ? pt + 12 : pt + 28, lab, { a: up ? 'start' : 'end', fs: 10, fw: 800, c: col }); };
  s += mark(R.amortStatic, C().blue, amortTxt(R.amortStatic) + ' J. gleichbleibend', right);
  s += mark(R.amortRise, c.pd, amortTxt(R.amortRise) + ' J. steigend', !right);
  return s + T(pl - 8, H - 12, 'Jahr', { a: 'end', fs: 10 }) + '</svg>';
}
/* Preisverlauf 2006–2040 */
function priceChart(key, o = {}) {
  const d = S.prices[key], c = C(), W = o.w || 640, H = o.h || 200, pl = 46, pr = 12, pt = 14, pb = 26;
  const hist = Object.entries(d.years).map(([y, v]) => [+y, +v]).filter(a => isFinite(a[1])).sort((a, b) => a[0] - b[0]);
  const nowY = new Date().getFullYear();
  const lastH = hist.length ? hist[hist.length - 1] : [nowY, d.current];
  const curPt = [Math.max(nowY, lastH[0]), +d.current];
  const fc = [curPt, ...Object.entries(d.forecast).map(([y, v]) => [+y, +v]).filter(a => isFinite(a[1]) && a[0] > curPt[0]).sort((a, b) => a[0] - b[0])];
  const all = hist.concat(fc), x0 = 2006, x1 = 2040;
  const mx = niceMax(Math.max(...all.map(a => a[1])) * 1.08);
  const X = yy => pl + (W - pl - pr) * (yy - x0) / (x1 - x0), Y = v => pt + (H - pt - pb) * (1 - v / mx);
  const col = o.color || c.p;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  s += `<rect x="${X(curPt[0] - 0.5)}" y="${pt}" width="${X(curPt[0] + 0.5) - X(curPt[0] - 0.5) + 6}" height="${H - pt - pb}" fill="${S.design.secondary}" opacity=".16" rx="3"/>` + T(X(curPt[0]) + 3, pt + 10, 'heute', { a: 'middle', fs: 9, fw: 700, c: C().yelInk });
  for (let i = 0; i <= 4; i++) { const v = mx * i / 4; s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${C().grid}"/>` + T(pl - 6, Y(v) + 4, num(v), { a: 'end', fs: 9.5 }); }
  [2006, 2010, 2015, 2020, 2025, 2030, 2035, 2040].forEach(yy => { s += T(X(yy), H - 9, String(yy), { a: 'middle', fs: 9.5 }); });
  const hp = hist.concat([curPt]).filter((a, i, arr) => arr.findIndex(b => b[0] === a[0]) === i);
  if (hp.length) {
    s += `<path d="M${X(hp[0][0])},${Y(0)} ${hp.map(a => `L${X(a[0]).toFixed(1)},${Y(a[1]).toFixed(1)}`).join(' ')} L${X(hp[hp.length - 1][0])},${Y(0)} Z" fill="${col}" opacity=".14"/>`;
    s += `<polyline fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" points="${hp.map(a => `${X(a[0]).toFixed(1)},${Y(a[1]).toFixed(1)}`).join(' ')}"/>`;
  }
  s += `<polyline fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="6 5" points="${fc.map(a => `${X(a[0]).toFixed(1)},${Y(a[1]).toFixed(1)}`).join(' ')}"/>`;
  s += `<circle cx="${X(curPt[0])}" cy="${Y(curPt[1])}" r="4.5" fill="${C().surface}" stroke="${col}" stroke-width="2.5"/>`;
  const last = fc[fc.length - 1]; if (fc.length > 1) s += `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="3.5" fill="${col}"/>`;
  return s + T(pl, pt - 2 + 0, d.unit, { fs: 9, fw: 700 }) + '</svg>';
}
/* Heizölpreise der letzten Jahre (aus den Preisdaten) */
function oilBars() {
  const c = C(), d = S.prices.oel, now = new Date().getFullYear();
  const ys = Object.keys(d.years).map(Number).filter(y => y >= now - 7).sort((a, b) => a - b);
  const vals = ys.map(y => [String(y), +d.years[y]]).concat(ys.includes(now) ? [] : [[String(now), +d.current]]);
  const W = 300, H = 120, mx = niceMax(Math.max(...vals.map(v => v[1])) * 1.15), bw = (W - 10) / vals.length;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  vals.forEach(([y, v], i) => { const h = (H - 34) * v / mx, x = 5 + i * bw + bw * 0.18, peak = v === Math.max(...vals.map(q => q[1])); s += `<rect x="${x}" y="${H - 18 - h}" width="${bw * 0.64}" height="${h}" rx="3" fill="${peak ? c.red : mix(c.red, '#ffffff', 0.55)}"/>` + T(x + bw * 0.32, H - 22 - h, num(v), { a: 'middle', fs: 9, fw: 600, c: c.ink }) + T(x + bw * 0.32, H - 5, y, { a: 'middle', fs: 8.5 }); });
  return s + '</svg>';
}
/* CO2-Preis-Säulen */
function co2Columns() {
  const c = C(), d = S.prices.co2, W = 300, H = 150, ys = Object.keys(d).map(Number).sort();
  const mx = niceMax(Math.max(...Object.values(d)) * 1.2), bw = (W - 20) / (ys.length + 1);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  ys.forEach((y, i) => { const h = (H - 40) * d[y] / mx, x = 10 + i * bw + bw * 0.15; s += `<rect x="${x}" y="${H - 22 - h}" width="${bw * 0.7}" height="${h}" rx="4" fill="${mix(c.p, '#ffffff', 0.55 - i * 0.07)}"/>` + T(x + bw * 0.35, H - 26 - h, d[y], { a: 'middle', fs: 9.5, fw: 800, c: C().ink }) + T(x + bw * 0.35, H - 8, String(y), { a: 'middle', fs: 9 }); });
  const x = 10 + ys.length * bw + bw * 0.15, h = H - 50;
  s += `<rect x="${x}" y="${H - 22 - h}" width="${bw * 0.7}" height="${h}" rx="4" fill="${C().tYel}" stroke="${S.design.secondary}" stroke-width="1.5" stroke-dasharray="4 3"/>` + T(x + bw * 0.35, H - 22 - h / 2 + 6, '?', { a: 'middle', fs: 20, fw: 800, c: '#B9760B' }) + T(x + bw * 0.35, H - 8, 'ab 2028', { a: 'middle', fs: 8.5, fw: 700 });
  return s + '</svg>';
}
/* Spirale Gasnetz */
function gasSpiral() {
  const c = C(), W = 340, H = 170, cx = 170, cy = 85, rx = 110, ry = 60;
  const nodes = [['Weniger', 'Gaskunden', 0], ['Netzkosten bleiben', 'gleich hoch', 90], ['Netzentgelt', 'pro Kunde steigt', 180], ['Noch mehr', 'wechseln', 270]];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="${c.red}"/></marker></defs>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 30}" ry="${ry - 18}" fill="none" stroke="${C().salmon}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  [45, 135, 225, 315].forEach(a => { const r = a * Math.PI / 180, x = cx + Math.cos(r) * (rx - 30), y = cy + Math.sin(r) * (ry - 18), dx = -Math.sin(r) * 6, dy = Math.cos(r) * 6 * (ry / rx); s += `<line x1="${x - dx}" y1="${y - dy}" x2="${x + dx}" y2="${y + dy}" stroke="${c.red}" stroke-width="2.5" marker-end="url(#ah)"/>`; });
  nodes.forEach(([a, b, deg]) => { const r = (deg - 90) * Math.PI / 180, x = cx + Math.cos(r) * rx * 0.98, y = cy + Math.sin(r) * ry * 1.02; s += `<rect x="${x - 56}" y="${y - 17}" width="112" height="34" rx="10" fill="${C().surface}" stroke="${C().grid}"/>` + T(x, y - 3, a, { a: 'middle', fs: 9.5, fw: 800, c: C().ink }) + T(x, y + 10, b, { a: 'middle', fs: 9 }); });
  s += T(cx, cy - 4, '2,3 ct', { a: 'middle', fs: 11, fw: 700, c: C().ink3 }) + T(cx, cy + 12, '→ ca. 22 ct/kWh', { a: 'middle', fs: 11, fw: 800, c: c.red });
  return s + '</svg>';
}
/* Wärmepumpe als Szene im Stil des Deckblatts */
function modColors(dawn) {
  const black = (S.design.moduleColor || 'black') === 'black';
  return black ? (dawn ? { m1: '#1C1E23', m2: '#08090B', s: '#3A3F48' } : { m1: '#2B2E35', m2: '#0E0F12', s: '#5A606A' })
    : (dawn ? { m1: '#1D3354', m2: '#0F1E36', s: '#3C5A86' } : { m1: '#2B5C93', m2: '#173B66', s: '#9EC3E6' });
}
function hpSceneSVG() {
  const p = S.design.primary, s = S.design.secondary, M = modColors(false), red = '#E4572E', blue = '#4F9BE0';
  const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="11" fill="${p}" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${y + 4.3}" text-anchor="middle" font-family="${esc(S.design.fontBody)}, Arial, sans-serif" font-size="12" font-weight="700" fill="#fff">${n}</text>`;
  const lab = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="${esc(S.design.fontBody)}, Arial, sans-serif" font-size="10.5" font-weight="600" fill="#3D5568">${esc(t)}</text>`;
  // Welle aus n Bögen, endet genau bei x + 20·n; Pfeilspitze sitzt direkt dort
  const wave = (x, y, n, col, w = 3) => { let d = `M${x},${y}`; for (let i = 0; i < n; i++) d += ` q5,-7 10,0 t10,0`; return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x + 20 * n - 1},${y - 8} L${x + 20 * n + 12},${y} L${x + 20 * n - 1},${y + 8} Z" fill="${col}"/>`; };
  const arrowHead = (x, y, col) => `<path d="M${x},${y - 9} L${x + 14},${y} L${x},${y + 9} Z" fill="${col}"/>`;
  // Dach mit Modulen
  const top = { y: 70, l: 448, r: 582 }, bot = { y: 120, l: 400, r: 630 }, lerp = (a, b, t) => a + (b - a) * t;
  let mods = '';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const t0 = 0.14 + r * 0.42, t1 = t0 + 0.38, y0 = lerp(top.y, bot.y, t0), y1 = lerp(top.y, bot.y, t1); const l0 = lerp(top.l, bot.l, t0) + 9, r0 = lerp(top.r, bot.r, t0) - 9, l1 = lerp(top.l, bot.l, t1) + 9, r1 = lerp(top.r, bot.r, t1) - 9; const a0 = c / 5 + 0.01, a1 = (c + 1) / 5 - 0.01; mods += `<polygon points="${[[lerp(l0, r0, a0), y0], [lerp(l0, r0, a1), y0], [lerp(l1, r1, a1), y1], [lerp(l1, r1, a0), y1]].map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="url(#hsMod)" stroke="${M.s}" stroke-width=".7"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 262" width="100%">
<defs><linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE6F9"/><stop offset="1" stop-color="#F3F9FE"/></linearGradient>
<linearGradient id="hsMod" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${M.m1}"/><stop offset="1" stop-color="${M.m2}"/></linearGradient>
<linearGradient id="hsWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#EEF3F7"/></linearGradient>
<radialGradient id="hsWarm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFD9A8" stop-opacity="0"/></radialGradient>
<clipPath id="hsClip"><rect x="0" y="0" width="640" height="262" rx="16"/></clipPath></defs>
<g clip-path="url(#hsClip)">
<rect width="640" height="262" fill="url(#hsSky)"/>
<circle cx="70" cy="40" r="18" fill="${s}" opacity=".9"/>
<g fill="#fff" opacity=".95"><ellipse cx="150" cy="44" rx="34" ry="11"/><ellipse cx="172" cy="38" rx="20" ry="11"/><ellipse cx="330" cy="34" rx="26" ry="8"/></g>
<path d="M0 214 C110 196 220 200 330 210 S540 196 640 204 V262 H0Z" fill="#A9DCA0"/><path d="M0 236 C160 222 330 230 460 236 S600 226 640 230 V262 H0Z" fill="#86C98A"/>
<!-- Außenluft -->
<rect x="52" y="68" width="100" height="28" rx="14" fill="#fff" stroke="#CFE3F5"/>${lab(102, 86.5, 'Außenluft')}
${wave(22, 128, 6, blue)}${wave(42, 150, 5, blue)}${wave(22, 172, 6, blue)}
<!-- Außeneinheit -->
<ellipse cx="248" cy="214" rx="78" ry="6" fill="#000" opacity=".08"/>
<rect x="180" y="112" width="136" height="96" rx="9" fill="#F7FAFC" stroke="#C9D6E1" stroke-width="2"/>
<circle cx="226" cy="160" r="34" fill="#E3EBF2" stroke="#B8C7D4" stroke-width="2"/><path d="M226 128v64M194 160h64M203 137l46 46M249 137l-46 46" stroke="#B8C7D4" stroke-width="2"/><circle cx="226" cy="160" r="6" fill="#B8C7D4"/>
<rect x="272" y="130" width="30" height="5" rx="2.5" fill="#C9D6E1"/><rect x="272" y="141" width="30" height="5" rx="2.5" fill="#C9D6E1"/><rect x="272" y="152" width="30" height="5" rx="2.5" fill="#C9D6E1"/><rect x="272" y="166" width="18" height="5" rx="2.5" fill="${p}"/>
<rect x="190" y="208" width="14" height="6" fill="#9FB1C1"/><rect x="292" y="208" width="14" height="6" fill="#9FB1C1"/>
${badge(196, 124, 1)}${lab(226, 106, 'Verdampfer')}
<!-- Strom -->
<rect x="268" y="40" width="76" height="26" rx="13" fill="#FFF4DC" stroke="#F7DFA6"/><path d="M287 45 l-6 9 h5 l-3 8 l9 -11 h-5 l3 -6 z" fill="${s}"/>${lab(316, 57, 'Strom')}
<path d="M300 66 V112" stroke="${s}" stroke-width="3" stroke-dasharray="4 3"/>
${badge(300, 186, 2)}${lab(300, 228, 'Verdichter')}
<!-- Leitungen -->
<path d="M318 140 H390" stroke="${red}" stroke-width="7" stroke-linecap="round"/>${arrowHead(388, 140, red)}
<path d="M404 178 H332" stroke="${blue}" stroke-width="7"/><path d="M334 169 L318 178 L334 187 Z" fill="${blue}"/>
${badge(358, 178, 4)}${lab(358, 202, 'Expansionsventil')}
<text x="358" y="130" text-anchor="middle" font-family="${esc(S.design.fontBody)}, Arial, sans-serif" font-size="9.5" font-weight="600" fill="${red}">warm · Vorlauf</text>
<!-- Haus -->
<ellipse cx="515" cy="216" rx="104" ry="6" fill="#000" opacity=".07"/>
<rect x="404" y="118" width="222" height="96" rx="4" fill="url(#hsWall)" stroke="#DCE6EE"/>
<polygon points="${top.l},${top.y} ${top.r},${top.y} ${bot.r + 8},${bot.y + 2} ${bot.l - 8},${bot.y + 2}" fill="#C8553D"/>
<polygon points="${top.l + 3},${top.y + 3} ${top.r - 3},${top.y + 3} ${bot.r},${bot.y - 2} ${bot.l},${bot.y - 2}" fill="#D9694F"/>${mods}
<rect x="${bot.l - 8}" y="${bot.y}" width="${bot.r - bot.l + 16}" height="5" rx="2.5" fill="#A9432E"/>
<!-- Innen: Speicher, Heizkörper, Dusche -->
<rect x="414" y="134" width="40" height="70" rx="12" fill="#fff" stroke="#C9D6E1" stroke-width="2"/><rect x="418" y="150" width="32" height="50" rx="9" fill="#FDEEE8"/>
${badge(434, 140, 3)}${lab(434, 228, 'Verflüssiger')}

<circle cx="520" cy="166" r="34" fill="url(#hsWarm)"/>
<rect x="494" y="160" width="54" height="34" rx="5" fill="#F7FAFC" stroke="#C9D6E1" stroke-width="2"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${499 + i * 10}" y="164" width="5" height="26" rx="2.5" fill="#E3EBF2"/>`).join('')}
${[504, 520, 536].map(x => `<path d="M${x} 152 q-5 -7 0 -14 t0 -14" fill="none" stroke="${red}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`).join('')}
<path d="M454 170 H494" stroke="${red}" stroke-width="3" stroke-dasharray="5 3"/>
<path d="M582 136 v16 m-8 0 h16" stroke="#9FB1C1" stroke-width="3" stroke-linecap="round"/>${[576, 582, 588].map((x, i) => `<path d="M${x} 158 l-2 ${8 + i * 3}" stroke="${blue}" stroke-width="2" stroke-linecap="round"/>`).join('')}
<path d="M454 146 H566 V136" fill="none" stroke="${red}" stroke-width="2.4" stroke-dasharray="4 3"/>
<rect x="534" y="88" width="0" height="0"/>
${lab(515, 248, 'Ihr Haus · Heizung und Warmwasser')}
</g></svg>`;
}

/* Wärmepumpen-Kreislauf */
/* „So funktioniert Ihre Photovoltaikanlage“ – Illustration im Stil der Wärmepumpen-Szene */
function pvSceneSVG(R) {
  const p = S.design.primary, s = S.design.secondary, M = modColors(false), blue = '#4F9BE0', sunC = mix(s, '#000000', 0.08), F = `${esc(S.design.fontBody)}, Arial, sans-serif`;
  const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="11" fill="${p}" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${y + 4.3}" text-anchor="middle" font-family="${F}" font-size="12" font-weight="700" fill="#fff">${n}</text>`;
  const lab = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="${F}" font-size="10.5" font-weight="600" fill="#3D5568">${esc(t)}</text>`;
  const chip = (x, y, w, t, bg, st, col) => `<rect x="${x}" y="${y}" width="${w}" height="22" rx="11" fill="${bg}" stroke="${st}"/><text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" font-family="${F}" font-size="9.8" font-weight="600" fill="${col || '#3D5568'}">${esc(t)}</text>`;
  const arrowR = (x, y, col) => `<path d="M${x - 4},${y - 8} L${x + 10},${y} L${x - 4},${y + 8} Z" fill="${col}"/>`, arrowL = (x, y, col) => `<path d="M${x + 4},${y - 8} L${x - 10},${y} L${x + 4},${y + 8} Z" fill="${col}"/>`;
  const top = { y: 66, l: 196, r: 336 }, bot = { y: 116, l: 152, r: 380 }, lerp = (a, b, t) => a + (b - a) * t;
  let mods = '';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const t0 = 0.12 + r * 0.44, t1 = t0 + 0.4, y0 = lerp(top.y, bot.y, t0), y1 = lerp(top.y, bot.y, t1); const l0 = lerp(top.l, bot.l, t0) + 8, r0 = lerp(top.r, bot.r, t0) - 8, l1 = lerp(top.l, bot.l, t1) + 8, r1 = lerp(top.r, bot.r, t1) - 8; const a0 = c / 6 + 0.008, a1 = (c + 1) / 6 - 0.008; mods += `<polygon points="${[[lerp(l0, r0, a0), y0], [lerp(l0, r0, a1), y0], [lerp(l1, r1, a1), y1], [lerp(l1, r1, a0), y1]].map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="url(#psMod)" stroke="${M.s}" stroke-width=".7"/>`; }
  let rays = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays += `<line x1="${62 + Math.cos(a) * 29}" y1="${50 + Math.sin(a) * 29}" x2="${62 + Math.cos(a) * 38}" y2="${50 + Math.sin(a) * 38}" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>`; }
  const bat = R.bat > 0, hp = false, car = R.carKWh > 0; // Wärmepumpe bewusst nicht in der PV-Szene
  // Haushalt: Lampe, Fernseher, Steckdose
  const home = `<path d="M312 132 V140" stroke="#9FB1C1" stroke-width="2"/><path d="M300 150 q12 -14 24 0 z" fill="${s}"/><circle cx="312" cy="156" r="16" fill="${s}" opacity=".18"/>
<rect x="290" y="168" width="44" height="28" rx="4" fill="#3D5568"/><rect x="294" y="172" width="36" height="20" rx="2" fill="#6FA8DC"/><rect x="308" y="196" width="8" height="5" fill="#3D5568"/>
<rect x="346" y="176" width="20" height="20" rx="5" fill="#fff" stroke="#C9D6E1" stroke-width="1.6"/><circle cx="352.5" cy="186" r="1.8" fill="#9FB1C1"/><circle cx="359.5" cy="186" r="1.8" fill="#9FB1C1"/>`;
  const battery = bat ? `<rect x="234" y="138" width="34" height="62" rx="7" fill="#fff" stroke="#C9D6E1" stroke-width="2"/><rect x="245" y="133" width="12" height="6" rx="2" fill="#C9D6E1"/>${[0, 1, 2, 3].map(i => `<rect x="240" y="${186 - i * 13}" width="22" height="9" rx="2.5" fill="${i < 3 ? p : '#E3EBF2'}"/>`).join('')}${badge(251, 122, 3)}` : '';
  const heatpump = hp ? `<g transform="translate(392 170)"><rect x="0" y="0" width="52" height="38" rx="5" fill="#F7FAFC" stroke="#C9D6E1" stroke-width="2"/><circle cx="18" cy="19" r="12" fill="#E3EBF2" stroke="#B8C7D4" stroke-width="1.6"/><path d="M18 8v22M7 19h22" stroke="#B8C7D4" stroke-width="1.4"/><rect x="34" y="9" width="12" height="3.5" rx="1.7" fill="#C9D6E1"/><rect x="34" y="16" width="12" height="3.5" rx="1.7" fill="#C9D6E1"/><rect x="34" y="23" width="7" height="3.5" rx="1.7" fill="${p}"/></g><path d="M380 190 H392" stroke="${p}" stroke-width="3"/>${lab(418, 230, 'Wärmepumpe')}` : '';
  const ecar = car ? `<path d="M372 196 H398" stroke="${p}" stroke-width="3"/><g transform="translate(${hp ? 452 : 398} 182)"><path d="M4 22 L10 9 Q12 5 17 5 H39 Q44 5 47 10 L53 22 Z" fill="${p}"/><rect x="0" y="20" width="58" height="12" rx="5" fill="${p}"/><rect x="14" y="9" width="12" height="10" rx="2" fill="#DDEFF9"/><rect x="29" y="9" width="12" height="10" rx="2" fill="#DDEFF9"/><circle cx="14" cy="32" r="6" fill="#3D5568"/><circle cx="45" cy="32" r="6" fill="#3D5568"/></g>${lab(hp ? 481 : 427, 230, 'E-Auto')}` : '';
  const feedY = 98, gx = 572;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 262" width="100%">
<defs><linearGradient id="psSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE6F9"/><stop offset="1" stop-color="#F3F9FE"/></linearGradient>
<linearGradient id="psMod" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${M.m1}"/><stop offset="1" stop-color="${M.m2}"/></linearGradient>
<linearGradient id="psWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#EEF3F7"/></linearGradient>
<radialGradient id="psGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".95"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient>
<clipPath id="psClip"><rect x="0" y="0" width="640" height="262" rx="16"/></clipPath></defs>
<g clip-path="url(#psClip)">
<rect width="640" height="262" fill="url(#psSky)"/>
<circle cx="62" cy="50" r="58" fill="url(#psGlow)"/>${rays}<circle cx="62" cy="50" r="22" fill="${s}"/><circle cx="62" cy="50" r="15" fill="#FFD36B" opacity=".75"/>
<g fill="#fff" opacity=".95"><ellipse cx="430" cy="34" rx="30" ry="9"/><ellipse cx="450" cy="28" rx="18" ry="9"/><ellipse cx="140" cy="22" rx="22" ry="7"/></g>
${badge(98, 92, 1)}${lab(98, 116, 'Sonne einfangen')}
<path d="M0 214 C110 198 220 202 330 210 S540 198 640 204 V262 H0Z" fill="#A9DCA0"/><path d="M0 236 C160 222 330 230 460 236 S600 226 640 230 V262 H0Z" fill="#86C98A"/>
<!-- Haus -->
<ellipse cx="266" cy="216" rx="128" ry="6" fill="#000" opacity=".07"/>
<rect x="160" y="116" width="212" height="98" rx="4" fill="url(#psWall)" stroke="#DCE6EE"/>
<polygon points="${top.l},${top.y} ${top.r},${top.y} ${bot.r + 8},${bot.y + 2} ${bot.l - 8},${bot.y + 2}" fill="#C8553D"/>
<polygon points="${top.l + 3},${top.y + 3} ${top.r - 3},${top.y + 3} ${bot.r},${bot.y - 2} ${bot.l},${bot.y - 2}" fill="#D9694F"/>${mods}
<rect x="${bot.l - 8}" y="${bot.y}" width="${bot.r - bot.l + 16}" height="5" rx="2.5" fill="#A9432E"/>
${[[0.22, 0.16, 0.2], [0.42, 0.24, 0.55], [0.62, 0.3, 0.88]].map(([a, t, v]) => { const x1 = 62 + Math.cos(a) * 46, y1 = 50 + Math.sin(a) * 46, x2 = lerp(lerp(top.l, bot.l, v), lerp(top.r, bot.r, v), t), y2 = lerp(top.y, bot.y, v) - 3, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${(x2 - Math.cos(ang * Math.PI / 180) * 8).toFixed(1)} ${(y2 - Math.sin(ang * Math.PI / 180) * 8).toFixed(1)}" stroke="${sunC}" stroke-width="2.6" stroke-dasharray="6 5" stroke-linecap="round"/><path d="M-9 -6 L4 0 L-9 6 Z" fill="${sunC}" transform="translate(${x2.toFixed(1)} ${y2.toFixed(1)}) rotate(${ang.toFixed(1)})"/>`; }).join('')}
${chip(250, 34, 116, `≈ ${kwh100(R.yield)} kWh im Jahr`, '#FFF4DC', '#F7DFA6', '#8A5A06')}
<!-- Wechselrichter -->
<rect x="176" y="136" width="40" height="50" rx="6" fill="#F7FAFC" stroke="#C9D6E1" stroke-width="2"/><path d="M184 152 h10 M184 157 h10" stroke="#9FB1C1" stroke-width="2"/><path d="M196 172 q4 -8 8 0 t8 0" fill="none" stroke="${p}" stroke-width="2"/><circle cx="208" cy="146" r="2.5" fill="${p}"/>
<path d="M196 122 V136" stroke="${sunC}" stroke-width="3" stroke-dasharray="4 3"/>
${lab(196, bat ? 246 : 230, 'Wechselrichter')}
<path d="M216 168 H${bat ? 234 : 290}" stroke="${p}" stroke-width="3"/>${bat ? `<path d="M268 168 H290" stroke="${p}" stroke-width="3"/>` : ''}
${battery}${bat ? lab(251, 230, 'Speicher') : ''}
${home}${badge(280, 134, 2)}${lab(326, 230, 'Selbst nutzen')}
${heatpump}${ecar}
<!-- Netz -->
<path d="M372 ${feedY + 30} H${gx - 32}" stroke="${p}" stroke-width="3.5"/>${arrowR(gx - 30, feedY + 30, p)}
<path d="M${gx - 22} ${feedY + 52} H384" stroke="${blue}" stroke-width="3.5" stroke-dasharray="7 4"/>${arrowL(382, feedY + 52, blue)}
<text x="${(372 + gx) / 2}" y="${feedY + 23}" text-anchor="middle" font-family="${F}" font-size="9.5" font-weight="600" fill="${p}">Überschuss einspeisen</text>
<text x="${(372 + gx) / 2}" y="${feedY + 66}" text-anchor="middle" font-family="${F}" font-size="9.5" font-weight="600" fill="${blue}">nur bei Bedarf: Strom aus dem Netz</text>
<g stroke="#6B7F92" stroke-width="2.4" fill="none" stroke-linejoin="round"><path d="M${gx - 18} 214 L${gx} 64 L${gx + 18} 214"/><path d="M${gx - 26} 92 H${gx + 26} M${gx - 20} 118 H${gx + 20}"/><path d="M${gx - 13} 170 L${gx + 9} 118 M${gx + 13} 170 L${gx - 9} 118 M${gx - 15} 196 L${gx + 13} 170 M${gx + 15} 196 L${gx - 13} 170"/></g>
<path d="M${gx + 26} 92 Q620 98 640 96 M${gx + 20} 118 Q622 124 640 122" stroke="#9FB1C1" stroke-width="1.4" fill="none"/>
${badge(gx + 28, 64, 4)}${lab(gx, 230, 'Stromnetz')}
${chip(418, 62, 132, `≈ ${kwh100(R.feed)} kWh Einspeisung`, '#fff', '#CFE3F5')}
</g></svg>`;
}
function hpCycleSVG() {
  const c = C(), p = c.p;
  const box = (x, y, w, h, n, t1, t2, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` + (n ? `<circle cx="${x + 18}" cy="${y + 18}" r="11" fill="${p}"/>` + T(x + 18, y + 22, n, { a: 'middle', fs: 11, fw: 800, c: '#fff' }) : '') + T(x + w / 2 + (n ? 8 : 0), y + h / 2 - 2, t1, { a: 'middle', fs: 12, fw: 800, c: C().ink }) + T(x + w / 2 + (n ? 8 : 0), y + h / 2 + 14, t2, { a: 'middle', fs: 10 });
  const arr = (x1, y1, x2, y2, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" marker-end="url(#a-${col.slice(1)})"/>`;
  const mk = col => `<marker id="a-${col.slice(1)}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${col}"/></marker>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 250" width="100%"><defs>${mk('#5DA9E9')}${mk('#E4572E')}${mk(p)}${mk('#F5A524')}</defs>
${box(4, 95, 110, 60, '', 'Außenluft', 'kostenlose Umweltwärme', C().tBlue, C().stroke)}
${box(150, 20, 150, 62, '1', 'Verdampfer', 'nimmt Wärme auf', C().surface, C().stroke)}
${box(340, 20, 150, 62, '2', 'Verdichter', 'erhöht Temperatur', C().surface, C().stroke)}
${box(340, 168, 150, 62, '3', 'Verflüssiger', 'gibt Wärme ab', C().surface, C().stroke)}
${box(150, 168, 150, 62, '4', 'Expansionsventil', 'entspannt, kühlt ab', C().surface, C().stroke)}
${box(526, 95, 110, 60, '', 'Ihr Haus', 'Heizung & Wasser', C().tRed, C().stroke)}
${arr(114, 112, 148, 62, '#5DA9E9')}${arr(300, 51, 336, 51, '#5DA9E9')}${arr(415, 82, 415, 164, '#E4572E')}${arr(340, 199, 304, 199, '#E4572E')}${arr(225, 168, 225, 86, '#5DA9E9')}${arr(490, 199, 528, 148, '#E4572E')}
<g transform="translate(398 0)"><circle cx="17" cy="0" r="0"/></g>
<rect x="510" y="22" width="88" height="40" rx="12" fill="${C().tYel}"/>${T(554, 40, 'Strom', { a: 'middle', fs: 11, fw: 800, c: C().yelInk })}${T(554, 54, 'treibt an', { a: 'middle', fs: 9.5, c: C().yelInk })}${arr(510, 42, 494, 46, '#F5A524')}
</svg>`;
}
/* PV-Energiefluss */
function pvFlowSVG(R) {
  const c = C(), p = c.p, s = S.design.secondary;
  const mk = col => `<marker id="b-${col.slice(1)}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${col}"/></marker>`;
  const box = (x, y, w, h, n, t1, t2, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` + (n ? `<circle cx="${x + 18}" cy="${y + 18}" r="11" fill="${p}"/>` + T(x + 18, y + 22, n, { a: 'middle', fs: 11, fw: 800, c: '#fff' }) : '') + T(x + w / 2 + (n ? 8 : 0), y + h / 2 - 2, t1, { a: 'middle', fs: 12, fw: 800, c: C().ink }) + T(x + w / 2 + (n ? 8 : 0), y + h / 2 + 14, t2, { a: 'middle', fs: 10 });
  const arr = (x1, y1, x2, y2, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" marker-end="url(#b-${col.slice(1)})"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 230" width="100%"><defs>${mk(s)}${mk(p)}${mk(C().blue)}</defs>
<circle cx="50" cy="60" r="28" fill="${s}"/><circle cx="50" cy="60" r="20" fill="#FFD36B"/>${T(50, 112, 'Sonne', { a: 'middle', fs: 11, fw: 800, c: C().ink })}
${box(118, 30, 130, 60, '', 'Solarmodule', `${num(R.kwp, 1)} kWp`, C().tBlue, C().stroke)}
${box(290, 30, 130, 60, '', 'Wechselrichter', 'Gleich- zu Wechselstrom', C().surface, C().stroke)}
${box(470, 4, 166, 54, '1', 'Ihr Haus', 'direkt verbraucht', C().tGrn, C().stroke)}
${box(470, 86, 166, 54, '2', 'Speicher', R.bat ? `${num(R.bat, 1)} kWh` : 'optional', C().tYel, C().stroke)}
${box(470, 168, 166, 54, '3', 'Netz', 'Überschuss einspeisen', C().tGray, C().stroke)}
${arr(80, 60, 113, 60, s)}${arr(248, 60, 285, 60, s)}
${arr(420, 52, 465, 34, p)}${arr(420, 64, 465, 110, s)}${arr(420, 76, 465, 186, C().blue)}
</svg>`;
}
/* Tagesverlauf 6 bis 6 Uhr: Ertrag, Verbrauch, Entladen und Ladezustand des Speichers übereinander */
const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const SUN_RISE = [8.5, 7.8, 6.9, 6.9, 5.9, 5.3, 5.6, 6.3, 7.2, 8.0, 7.6, 8.4];   // Münster, Ortszeit
const SUN_SET = [16.8, 17.7, 18.6, 20.4, 21.3, 21.9, 21.8, 21.0, 19.9, 18.8, 16.9, 16.4];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/* Viertelstunden-Simulation eines typischen (eher sonnigen) Tages im gewählten Monat */
function simulateDay(R, month, p) {
  const mi = clamp((month || 4) - 1, 0, 11), dt = 0.25, steps = 96;
  const rise = SUN_RISE[mi], set = SUN_SET[mi];
  const shape = h => { const x = h % 24; return x > rise && x < set ? Math.pow(Math.sin(Math.PI * (x - rise) / (set - rise)), 1.6) : 0; };
  let sh = 0; for (let i = 0; i < steps; i++) sh += shape(6 + i * dt) * dt;
  const eDay = R.yield * norm(PV_SHARE)[mi] / DAYS[mi] * 1.2;      // typischer Sonnentag: etwas über dem Monatsmittel
  const gen = h => sh ? eDay * shape(h) / sh : 0;
  const hhM = [1.1, 1.02, 1, 0.95, 0.92, 0.9, 0.9, 0.92, 0.95, 1.02, 1.08, 1.14][mi];
  const hhK = Math.max(0.4, R.hhCons / 4000) * hhM;
  const hh = h => { const x = h % 24; return hhK * (0.22 + 0.55 * Math.exp(-Math.pow((x - 7.3) / 1.1, 2)) + 0.38 * Math.exp(-Math.pow((x - 12.6) / 1.4, 2)) + 1.05 * Math.exp(-Math.pow((x - 19.2) / 1.9, 2)) - (x < 5 ? 0.06 : 0)); };
  let hpDay = 0, rodDay = 0;
  if (R.W && p) { const A = annualProfile(p, R); hpDay = A.months[mi].demand / DAYS[mi]; rodDay = A.months[mi].rod / DAYS[mi]; }
  const hpShape = h => { const x = h % 24; return 0.7 + 0.5 * Math.exp(-Math.pow((x - 6.5) / 2.2, 2)) + 0.35 * Math.exp(-Math.pow((x - 13) / 2, 2)) - (x > 22 || x < 4 ? 0.25 : 0); };
  let hpNorm = 0; for (let i = 0; i < steps; i++) hpNorm += hpShape(6 + i * dt) * dt;
  const carDay = R.carKWh ? R.carKWh / 365 : 0, carD = carDay * R.carDay, carE = carDay - carD;
  const car = h => { const x = h % 24; return (x >= 10.5 && x < 15.5 ? carD / 5 : 0) + (x >= 18 && x < 21 ? carE / 3 : 0); };
  const hpAt = h => (hpDay ? hpDay * hpShape(h) / hpNorm : 0);
  const use = h => hh(h) + hpAt(h) + car(h);
  const cap = R.bat || 0, pMax = cap ? Math.max(2.5, cap * 0.5) : 0, minSoc = cap * 0.05, rodKw = R.rod ? R.rodKw : 0;
  let soc = cap * [0.1, 0.1, 0.15, 0.2, 0.3, 0.35, 0.35, 0.3, 0.2, 0.15, 0.1, 0.1][mi], rodLeft = rodDay / 0.98;
  const pts = []; let sum = { g: 0, u: 0, self: 0, rod: 0, hp: 0 };
  for (let i = 0; i <= steps; i++) {
    const h = 6 + i * dt, g = gen(h), uBase = use(h), hp = hpAt(h);
    let ch = 0, dis = 0, rod = 0;
    if (cap) {
      if (g > uBase) { ch = Math.min(g - uBase, pMax, (cap - soc) / dt); soc += ch * dt; }
      else { dis = Math.min(uBase - g, pMax, Math.max(0, soc - minSoc) / dt); soc -= dis * dt; }
    }
    if (rodKw && rodLeft > 0 && g > uBase + ch) { rod = Math.min(g - uBase - ch, rodKw, rodLeft / dt); rodLeft -= rod * dt; }
    const u = uBase + rod;
    if (i < steps) { sum.g += g * dt; sum.u += u * dt; sum.self += Math.min(u, g + dis) * dt; sum.rod += rod * dt; sum.hp += hp * dt; }
    pts.push({ h, g, u, ch, dis, rod, hp, soc: cap ? soc / cap : 0 });
  }
  return { pts, cap, hasHp: hpDay > 0, month: mi + 1, max: Math.max(...pts.map(q => Math.max(q.g, q.u))), sum };
}
function dayInfo(D) {
  const s = D.sum, aut = s.u ? s.self / s.u : 0;
  return `Ertrag ca. ${num(Math.floor(s.g))} kWh · Verbrauch ca. ${num(Math.round(s.u))} kWh · aus Sonne und Speicher gedeckt: ${pct(Math.min(1, aut) * 100)}${s.hp > 0.05 ? ` · davon Wärmepumpe ca. ${num(Math.round(s.hp))} kWh` : ''}${s.rod > 0.05 ? ` · Heizstab ca. ${num(Math.round(s.rod))} kWh` : ''}`;
}
/* Farbe der Wärmepumpe im Tagesverlauf */
const hpDayCol = () => (C().dark ? '#A78BFA' : '#7C5CC4');
function dayProfileSVG(R, o = {}) {
  const c = C(), D = o.D || simulateDay(R, o.month, o.p), W = o.w || 640, H = o.h || 230, pl = 40, pr = D.cap ? 40 : 12, pt = 16, pb = 28;
  const mx = niceMax(Math.max(D.max, 1) * 1.08), X = h => pl + (W - pl - pr) * (h - 6) / 24, Y = v => pt + (H - pt - pb) * (1 - v / mx), Ys = f => pt + (H - pt - pb) * (1 - f);
  const line = f => D.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.h).toFixed(1)},${f(p).toFixed(1)}`).join(' ');
  const area = f => `${line(p => Y(f(p)))} L${X(30).toFixed(1)},${Y(0)} L${X(6).toFixed(1)},${Y(0)} Z`;
  const sun = mix(c.s, '#000000', 0.12), chg = c.p, dis = c.blue, socC = c.dark ? mix(c.blue, '#ffffff', 0.3) : mix(c.blue, '#000000', 0.1);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  const nT = Number.isInteger(mx / 4) || mx === 10 ? 4 : 5;
  for (let i = 0; i <= nT; i++) { const v = mx * i / nT; s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c.grid}"/>` + T(pl - 6, Y(v) + 3.5, num(v, v % 1 ? 1 : 0), { a: 'end', fs: 9 }); }
  if (D.cap) for (let i = 0; i <= 4; i++) s += T(W - 2, Ys(i / 4) + 3.5, (i * 25) + ' %', { a: 'end', fs: 9 });
  s += T(pl - 6, pt - 5, 'kW', { a: 'end', fs: 9, fw: 600 }) + (D.cap ? T(W - 2, pt - 5, 'Ladung', { a: 'end', fs: 9, fw: 600 }) : '');
  s += `<path d="${area(p => p.g)}" fill="${c.s}" fill-opacity=".22"/>`;
  if (D.cap) {
    s += `<path d="${area(p => p.dis)}" fill="${dis}" fill-opacity=".45"/>`;
    s += `<path d="${line(p => Ys(p.soc))}" fill="none" stroke="${socC}" stroke-width="2.2" stroke-dasharray="3 3"/>`;
  } else s += `<path d="${area(p => Math.min(p.g, p.u))}" fill="${chg}" fill-opacity=".45"/>`;
  if (D.hasHp) s += `<path d="${area(p => p.hp)}" fill="${hpDayCol()}" fill-opacity=".32"/><path d="${line(p => Y(p.hp))}" fill="none" stroke="${hpDayCol()}" stroke-width="1.6" stroke-linejoin="round"/>`;
  if (D.pts.some(q => q.rod > 0)) s += `<path d="${area(p => p.rod)}" fill="${mix(c.s, '#C2401F', 0.45)}" fill-opacity=".75"/>`;
  s += `<path d="${line(p => Y(p.g))}" fill="none" stroke="${sun}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="${line(p => Y(p.u))}" fill="none" stroke="${c.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(0)}" y2="${Y(0)}" stroke="${c.stroke}"/>`;
  (W < 500 ? [6, 12, 18, 24, 30] : [6, 9, 12, 15, 18, 21, 24, 27, 30]).forEach(h => { s += T(X(h), H - 9, String(h % 24).padStart(2, '0') + ' Uhr', { a: h === 6 ? 'start' : h === 30 ? 'end' : 'middle', fs: 9.5 }); });
  return s + '</svg>';
}
function dayLegend(R, px) {
  const c = C(), cap = R.bat > 0, m = px ? '14px' : '4mm';
  const box = (col, op, t) => `<span style="display:inline-flex;align-items:center;gap:${px ? '6px' : '1.5mm'};margin-right:${m}"><span style="display:inline-block;width:${px ? '10px' : '3mm'};height:${px ? '10px' : '3mm'};border-radius:2px;background:${col};opacity:${op}"></span>${t}</span>`;
  const ln = (col, w, dash, t) => `<span style="display:inline-flex;align-items:center;gap:${px ? '6px' : '1.5mm'};margin-right:${m}"><span style="display:inline-block;width:${px ? '16px' : '5mm'};height:0;border-top:${w} ${dash ? 'dotted' : 'solid'} ${col}"></span>${t}</span>`;
  return ln(mix(c.s, '#000000', 0.12), px ? '2.5px' : '0.7mm', false, 'Ertrag') + ln(c.ink, px ? '2px' : '0.6mm', false, 'Verbrauch') + (cap ? box(c.blue, 0.6, 'Speicher entladen') + ln(c.dark ? mix(c.blue, '#ffffff', 0.3) : mix(c.blue, '#000000', 0.1), px ? '2px' : '0.5mm', true, 'Ladezustand') : box(c.p, 0.6, 'direkt genutzt')) + (R.W && R.hpPower > 0 ? box(hpDayCol(), 0.55, 'davon Wärmepumpe') : '') + (R.rod ? box(mix(c.s, '#C2401F', 0.45), 0.8, 'Heizstab') : '');
}
const legendDot = (col, txt, dashed) => `<span style="display:inline-flex;align-items:center;gap:1.5mm;margin-right:4mm"><span style="display:inline-block;width:${dashed ? '5mm' : '3mm'};height:${dashed ? '0' : '3mm'};border-radius:1mm;background:${dashed ? 'none' : col};border-top:${dashed ? '0.6mm dashed ' + col : 'none'}"></span>${txt}</span>`;
/* Schallskala */
function soundScaleSVG(val) {
  const W = 640, H = 122, x0 = 20, x1 = 620, X = v => x0 + (x1 - x0) * (v - 20) / 50, by = 40;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%"><defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#5CC27A"/><stop offset=".45" stop-color="#F5C34A"/><stop offset=".75" stop-color="#F08A3E"/><stop offset="1" stop-color="#D9482B"/></linearGradient></defs>`;
  s += `<rect x="${x0}" y="${by}" width="${x1 - x0}" height="14" rx="7" fill="url(#sg)"/>`;
  [[20, 'Blätterrauschen'], [30, 'Flüstern'], [40, 'Bibliothek'], [50, 'Kühlschrank'], [60, 'Gespräch'], [70, 'Staubsauger']].forEach(([v, l], i, arr) => { const a = i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'; s += `<line x1="${X(v)}" x2="${X(v)}" y1="${by + 16}" y2="${by + 22}" stroke="${C().ink3}"/>` + T(X(v), by + 34, v + ' dB', { a, fs: 9.5, fw: 700, c: C().ink2 }) + T(X(v), by + 47, l, { a, fs: 9 }); });
  s += `<line x1="${X(35)}" x2="${X(35)}" y1="${by - 4}" y2="${by + 66}" stroke="${C().ink}" stroke-width="1.5" stroke-dasharray="3 2"/>` + T(X(35) + 5, by + 76, 'Richtwert 35 dB(A) nachts – reines Wohngebiet (TA Lärm)', { fs: 9.5, fw: 700, c: C().ink });
  if (isNum(val)) { const x = X(clamp(val, 20, 70)); s += `<path d="M${x - 7},${by - 14} L${x + 7},${by - 14} L${x},${by - 3} Z" fill="${S.design.primary}"/><rect x="${x - 8}" y="${by - 3}" width="16" height="20" rx="6" fill="none" stroke="${S.design.primary}" stroke-width="3"/>` + T(x > 420 ? x + 8 : x - 8, by - 20, `Ihre Wärmepumpe nachts: ${num(val, 1)} dB(A)`, { a: x > 420 ? 'end' : 'start', fs: 10.5, fw: 800, c: S.design.primary }); }
  return s + '</svg>';
}
/* App-Icon */
function appIconSVG(bg = '#0E7C66') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${bg}"/>
<circle cx="372" cy="138" r="54" fill="#F5A524"/><g stroke="#F5A524" stroke-width="16" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<line x1="${372 + Math.cos(r) * 76}" y1="${138 + Math.sin(r) * 76}" x2="${372 + Math.cos(r) * 98}" y2="${138 + Math.sin(r) * 98}"/>`; }).join('')}</g>
<path d="M78 270 L218 150 L358 270 Z" fill="#1E4C86" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
<g stroke="#9EC3E6" stroke-width="6"><line x1="150" y1="210" x2="286" y2="210"/><line x1="118" y1="240" x2="318" y2="240"/><line x1="185" y1="180" x2="196" y2="262"/><line x1="240" y1="180" x2="240" y2="262"/></g>
<rect x="106" y="264" width="224" height="150" rx="10" fill="#fff"/><rect x="194" y="322" width="48" height="92" rx="6" fill="${bg}"/>
<rect x="130" y="296" width="44" height="36" rx="5" fill="#CFE6F8"/><rect x="262" y="296" width="44" height="36" rx="5" fill="#CFE6F8"/>
<rect x="346" y="330" width="108" height="84" rx="14" fill="#fff"/><circle cx="386" cy="372" r="26" fill="none" stroke="${bg}" stroke-width="9"/><path d="M386 352v40M366 372h40" stroke="${bg}" stroke-width="6" stroke-linecap="round"/><rect x="420" y="352" width="22" height="8" rx="4" fill="#C9D6E1"/><rect x="420" y="368" width="22" height="8" rx="4" fill="#C9D6E1"/>
</svg>`;
}

/* Jahresdiagramm: Strombedarf und Solarstrom je Monat */
function smoothPath(pts, yLimit) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    if (yLimit !== undefined) { const lim = v => (yLimit.dir > 0 ? Math.min(v, yLimit.y) : Math.max(v, yLimit.y)); c1[1] = lim(c1[1]); c2[1] = lim(c2[1]); }
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function annualChart(A, o = {}) {
  const c = C(), W = o.w || 640, H = o.h || 250, pl = 46, pr = 10, pt = 14, pb = 28;
  const mx = niceMax(Math.max(...A.months.map(m => Math.max(m.demand, m.pv)), 1) * 1.05);
  const iw = W - pl - pr, ih = H - pt - pb, bw = iw / 12, Y = v => pt + ih * (1 - v / mx);
  const neutral = c.neutral;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  for (let i = 0; i <= 4; i++) { const v = mx * i / 4; s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c.grid}"/>` + T(pl - 8, Y(v) + 4, num(v), { a: 'end', fs: 9.5 }); }
  s += T(pl - 8, pt - 4, 'kWh', { a: 'end', fs: 9 });
  const pts = A.months.map((m, i) => [pl + bw * i + bw / 2, Y(m.pv)]);
  s += `<path d="${smoothPath(pts)} L${pts[11][0]},${Y(0)} L${pts[0][0]},${Y(0)} Z" fill="${c.s}" fill-opacity=".16"/>`;
  A.months.forEach((m, i) => {
    const x = pl + bw * i + bw * 0.22, w = bw * 0.56, yd = Y(m.demand), yc = Y(m.covered), r = Math.min(4, w / 3);
    s += `<rect x="${x}" y="${yd}" width="${w}" height="${Math.max(0, Y(0) - yd)}" rx="${r}" fill="${neutral}"/>`;
    if (m.covered > 0) s += `<rect x="${x}" y="${yc}" width="${w}" height="${Math.max(0, Y(0) - yc)}" rx="${r}" fill="${c.p}"/>`;
    if (m.rod > 0) { const yr = Y(m.rod); s += `<rect x="${x + w * 0.18}" y="${yr}" width="${w * 0.64}" height="${Math.max(0, Y(0) - yr)}" rx="${r}" fill="${c.s}" fill-opacity=".85"/>`; }
    s += T(x + w / 2, H - 9, m.m, { a: 'middle', fs: 10 });
  });
  s += `<path d="${smoothPath(pts)}" fill="none" stroke="${mix(c.s, '#000000', 0.12)}" stroke-width="2.5" stroke-linecap="round"/>`;
  pts.forEach(q => { s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.6" fill="${c.surface}" stroke="${mix(c.s, '#000000', 0.12)}" stroke-width="1.6"/>`; });
  s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(0)}" y2="${Y(0)}" stroke="${c.ink}" stroke-opacity=".25"/>`;
  return s + '</svg>';
}
function annualLegend(A, px) {
  const c = C(), dot = (col, t, line) => `<span style="display:inline-flex;align-items:center;gap:${px ? '6px' : '1.5mm'};margin-right:${px ? '16px' : '4mm'}"><span style="display:inline-block;width:${line ? (px ? '16px' : '5mm') : (px ? '10px' : '3mm')};height:${line ? '0' : (px ? '10px' : '3mm')};border-radius:2px;background:${line ? 'none' : col};border-top:${line ? `2.5px solid ${col}` : 'none'}"></span>${t}</span>`;
  return dot(c.neutral, A.mode === 'hp' ? 'Strombedarf Wärmepumpe' : 'Strombedarf Haushalt') + dot(c.p, 'davon mit Solarstrom gedeckt') + (A.rod ? dot(c.s, 'Warmwasser per Heizstab (Solarstrom)') : '') + dot(mix(c.s, '#000000', 0.12), A.pot ? `Solarstrom einer ${num(A.kwp, 1)}-kWp-Anlage` : 'Ihr Solarstrom', true);
}

/* Nummer im Kreis – als SVG, damit die Ziffer auch im PDF exakt mittig sitzt */
function numCircle(n, sizeMm, opt = {}) {
  const fill = opt.fill || 'none', stroke = opt.stroke || 'none', color = opt.color || '#fff', sw = opt.border ? 1.6 : 0;
  return `<svg width="${sizeMm * 3.78}" height="${sizeMm * 3.78}" viewBox="0 0 24 24" style="display:block;flex-shrink:0;width:${sizeMm}mm;height:${sizeMm}mm"><circle cx="12" cy="12" r="${12 - sw / 2 - 0.2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><text x="12" y="16.2" text-anchor="middle" font-family="${esc(S.design.fontBody)}, Arial, sans-serif" font-size="${opt.fs || 12}" font-weight="600" fill="${color}">${n}</text></svg>`;
}
/* Kapitelmarke */
function kmHtml() {
  const d = S.design, k = d.chapter, p = d.chapterLine || d.primary, s = d.chapterSun || d.secondary;
  if (k === 'none') return '';
  if (k === 'bar') return `<div class="km"><div style="width:9mm;height:2.2mm;border-radius:2mm;background:linear-gradient(90deg,${s},${p})"></div></div>`;
  if (k === 'dot') return `<div class="km"><svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${s}"/></svg></div>`;
  if (k === 'line') return `<div class="km"><div style="width:14mm;height:0.6mm;border-radius:1mm;background:${p}"></div></div>`;
  if (k === 'mark') return `<div class="km">${sunMark(22)}</div>`;
  return `<div class="km"><svg width="34" height="17" viewBox="0 0 34 17"><path d="M7 15 A10 10 0 0 1 27 15 Z" fill="${s}"/><g stroke="${s}" stroke-width="1.8" stroke-linecap="round"><line x1="17" y1="1.2" x2="17" y2="3"/><line x1="7.4" y1="4.6" x2="8.7" y2="5.9"/><line x1="26.6" y1="4.6" x2="25.3" y2="5.9"/></g><line x1="1" y1="15.6" x2="33" y2="15.6" stroke="${p}" stroke-width="1.8" stroke-linecap="round"/></svg></div>`;
}
/* Signet: das kleine Symbol oben links (App-Kopfleiste und PDF, wenn kein Logo hochgeladen ist) */
function sunMark(size = 28) {
  const m = S.design.mark || {}, bg = m.bg || S.design.primary, fg = m.fg || S.design.secondary, line = m.line || '#ffffff';
  if (m.style === 'image' && fileUrl(m.file)) return `<img src="${fileUrl(m.file)}" alt="" style="max-width:${size}px;max-height:${size}px;width:auto;height:auto;display:block;border-radius:${m.shape === 'circle' ? '50%' : m.shape === 'none' ? '0' : Math.round(size * 0.28) + 'px'}">`;
  const shape = m.shape === 'circle' ? `<circle cx="16" cy="16" r="16" fill="${bg}"/>` : m.shape === 'none' ? '' : `<rect width="32" height="32" rx="9" fill="${bg}"/>`;
  if (m.style === 'initial') return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${shape}<text x="16" y="21.5" text-anchor="middle" font-family="${esc(S.design.fontBody)}, Arial, sans-serif" font-size="16" font-weight="600" fill="${m.shape === 'none' ? bg : fg}">${esc((m.text || coName()[0] || 'F').slice(0, 2))}</text></svg>`;
  const lc = m.shape === 'none' ? bg : line;
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${shape}<path d="M8 21 A8 8 0 0 1 24 21 Z" fill="${fg}"/><g stroke="${fg}" stroke-width="1.8" stroke-linecap="round"><line x1="16" y1="7.5" x2="16" y2="9.5"/><line x1="8.6" y1="10.6" x2="10" y2="12"/><line x1="23.4" y1="10.6" x2="22" y2="12"/></g><line x1="6" y1="21.8" x2="26" y2="21.8" stroke="${lc}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

/* Roadmap nach der Unterschrift (HTML, für App und PDF) */
function roadmapHtml(p, mm = true) {
  const u = v => mm ? v + 'mm' : (v * 3.78).toFixed(1) + 'px', f = v => mm ? v + 'pt' : (v * 1.333).toFixed(1) + 'px';
  const c = C(), RM = S.roadmap, lanes = [];
  if (hasPV(p)) lanes.push({ key: 'pv', title: 'Photovoltaik', icon: 'sun', steps: RM.pv, col: mix(c.s, '#000000', 0.18) });
  if (hasWP(p)) lanes.push({ key: 'wp', title: 'Wärmepumpe', icon: 'fan', steps: RM.wp, col: c.p });
  const two = lanes.length > 1;
  const node = (t, txt, dark) => `<div style="display:flex;justify-content:center"><div style="max-width:${u(two ? 120 : 110)};text-align:center;background:${dark ? 'var(--hl)' : 'var(--tile)'};color:${dark ? '#EEF2F6' : 'var(--ink)'};${dark ? '' : 'box-shadow:0 0 0 1px var(--line)'};border-radius:${u(4)};padding:${u(3)} ${u(6)}"><div style="font-family:var(--fh),Georgia,serif;font-weight:var(--hw);font-size:${f(13)}">${esc(t)}</div><div style="font-size:${f(8)};line-height:1.4;margin-top:${u(0.8)};color:${dark ? 'rgba(255,255,255,.85)' : 'var(--ink2)'}">${esc(txt)}</div></div></div>`;
  const lane = L => `<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:${u(2)};margin-bottom:${u(3)}"><span style="display:inline-flex;width:${u(7)};height:${u(7)};border-radius:50%;background:${L.col};align-items:center;justify-content:center">${icC(L.icon, mm ? 15 : 16, '#ffffff', 2)}</span><b style="font-size:${f(10.5)}">${L.title}</b></div>
    ${L.steps.map((s, i) => `<div style="display:flex;gap:${u(3)};position:relative;padding-bottom:${u(i === L.steps.length - 1 ? 0 : 3.2)}">
      ${i < L.steps.length - 1 ? `<div style="position:absolute;left:${u(2.9)};top:${u(6.2)};bottom:0;width:${u(0.5)};background:${L.col};opacity:.35"></div>` : ''}
      ${mm ? numCircle(i + 1, 6.3, { fill: C().surface, stroke: L.col, color: L.col, border: true, fs: 11 }) : `<span style="flex-shrink:0;display:grid;place-items:center;box-sizing:border-box;width:${u(6.3)};height:${u(6.3)};border-radius:50%;border:${u(0.5)} solid ${L.col};background:var(--bg);color:${L.col};font-weight:600;font-size:${f(8)}">${i + 1}</span>`}
      <div style="min-width:0;padding-top:${u(0.6)}"><div style="font-weight:600;font-size:${f(9)};line-height:1.3">${esc(s.title)}${s.dur ? ` <span style="font-weight:500;color:var(--ink3);font-size:${f(7.4)}">· ${esc(s.dur)}</span>` : ''}</div><div style="font-size:${f(7.8)};color:var(--ink2);line-height:1.4;margin-top:${u(0.4)}">${esc(s.text)}</div></div></div>`).join('')}</div>`;
  const conn = merge => two
    ? `<svg viewBox="0 0 400 40" width="100%" height="${mm ? '10mm' : '38px'}" preserveAspectRatio="none" style="display:block"><path d="${merge ? 'M100,0 C100,24 200,16 200,40 M300,0 C300,24 200,16 200,40' : 'M200,0 C200,24 100,16 100,40 M200,0 C200,24 300,16 300,40'}" fill="none" stroke="${c.ink}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/></svg>`
    : `<div style="display:flex;justify-content:center"><div style="width:0;height:${u(7)};border-left:${u(0.5)} dashed var(--line2)"></div></div>`;
  return `<div>${node(RM.start.title, RM.start.text, true)}${conn(false)}<div style="display:flex;gap:${u(8)};${two ? '' : `max-width:${u(120)};margin:0 auto`}">${lanes.map(lane).join('')}</div>${conn(true)}${node(RM.finish.title, RM.finish.text, false)}</div>`;
}
