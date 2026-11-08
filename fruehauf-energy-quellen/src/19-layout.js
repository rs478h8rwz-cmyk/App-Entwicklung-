/* Darstellung für alle Geräte: iPhone/Android hoch und quer, Foldables, iPad, PC */
document.head.insertAdjacentHTML('beforeend', `<style>
/* Ränder neben Notch/Dynamic Island im Querformat */
main{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
/* Handy quer (wenig Höhe): Kopfleiste scrollt mit weg, Startseite zweispaltig */
@media (orientation:landscape) and (max-height:520px){
  header.sticky{position:relative}
  .hero-anim{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:center;gap:24px;padding:22px max(16px,env(safe-area-inset-right)) 22px max(16px,env(safe-area-inset-left))}
  .hero-anim .hero-txt{padding:0!important;margin:0!important;min-height:0!important;max-width:none!important}
  .hero-anim h1{font-size:40px!important;margin-top:10px!important}
  .hero-anim .hero-txt p{font-size:15px!important;margin-top:12px!important}
  .hero-anim .hero-txt .mt-9{margin-top:16px!important}
  .hero-anim .hero-card{margin:0!important}
  #modal>div,#modal .card{max-height:none}
}
</style>`);
