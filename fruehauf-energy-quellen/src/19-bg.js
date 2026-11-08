/* Sanft animierter App-Hintergrund: große, weiche Farbflächen in den Firmenfarben,
   die sehr langsam wandern. Nur in der App (nicht im PDF), ruhig bei „Bewegung reduzieren“. */
document.head.insertAdjacentHTML('beforeend', `<style>
#bg-anim{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
#bg-anim i{position:absolute;border-radius:50%;filter:blur(70px);opacity:var(--bgo,.16);will-change:transform}
#bg-anim i:nth-child(1){width:70vmax;height:70vmax;left:-25vmax;top:-30vmax;background:radial-gradient(circle,rgb(var(--p-rgb)) 0%,transparent 65%);animation:bgA 46s ease-in-out infinite alternate}
#bg-anim i:nth-child(2){width:60vmax;height:60vmax;right:-25vmax;top:20vh;background:radial-gradient(circle,rgb(var(--s-rgb)) 0%,transparent 65%);animation:bgB 58s ease-in-out infinite alternate;opacity:calc(var(--bgo,.16) * .7)}
#bg-anim i:nth-child(3){width:55vmax;height:55vmax;left:10vw;bottom:-30vmax;background:radial-gradient(circle,rgb(var(--p-rgb)) 0%,transparent 65%);animation:bgC 64s ease-in-out infinite alternate;opacity:calc(var(--bgo,.16) * .8)}
@keyframes bgA{to{transform:translate(18vw,22vh) scale(1.15)}}
@keyframes bgB{to{transform:translate(-22vw,-14vh) scale(.9)}}
@keyframes bgC{to{transform:translate(16vw,-18vh) scale(1.1)}}
@media (prefers-reduced-motion: reduce){#bg-anim i{animation:none}}
@media print{#bg-anim{display:none}}
</style>`);
document.body.insertAdjacentHTML('afterbegin', '<div id="bg-anim" aria-hidden="true"><i></i><i></i><i></i></div>');
/* Stärke je Ansicht: im dunklen Modus etwas kräftiger, im hellen sehr zart */
function bgAnimTone() { const el = $('#bg-anim'); if (el) el.style.setProperty('--bgo', appDark() ? '.24' : '.15'); }
{ const _at = applyTheme; applyTheme = function () { const r = _at.apply(this, arguments); bgAnimTone(); return r; }; }
bgAnimTone();
