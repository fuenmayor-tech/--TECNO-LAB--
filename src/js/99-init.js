/* =====================================================================
   Arranque de la aplicación
   La portada aparece de inmediato y responde enseguida. El motor 3D y la primera
   sección se preparan solo al entrar a la aplicación (así nada se congela al abrir).
   ===================================================================== */
const domReady = () => document.readyState === 'loading' ? new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true })) : Promise.resolve();

const App = {
  _p: null, started: false,
  /* Motor 3D + modelos: una sola vez, cuando hace falta */
  start() {
    return this._p ??= (async () => {
      const main = $('#main'); if (main && !main.children.length) main.innerHTML = `<div class="app-loading" role="status">${icon('cube')}<span>Preparando el laboratorio…</span></div>`;
      await domReady();
      await sleep(30); // deja pintar la pantalla antes del trabajo pesado
      await GL.init();
      if (!Models.embedded) await Promise.race([Models.probing, sleep(1200)]); // sin modelos incluidos: espera breve a los .glb publicados
    })();
  },
  /* Lo que se hace después de mostrar la primera sección */
  afterFirst() {
    if (this.started) return; this.started = true;
    Models.markShown();
    setTimeout(async () => {
      if ('serviceWorker' in navigator && !ENV.file && !NATIVO) {
        try {
          const reg = await navigator.serviceWorker.register('sw.js');
          reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Hay una versión nueva de TECNO LAB. Recarga la página para usarla.', 'info', 6000); }); });
        } catch (e) { console.warn('Service worker no registrado', e); }
      }
      if (GL.ok) { await Models.makeThumbs([...PARTS.map(p => p.id), ...Models.customParts().map(p => p.id), ...Models.uploads.filter(u => u.partId).map(u => u.partId)]); refreshThumbs(); }
    }, 1500);
  }
};

(async function boot() {
  Store.load(); buildChrome(); applyGradeUI(); FX.init(); Chat.init();
  addEventListener('unhandledrejection', e => console.warn('Promesa sin manejar:', e.reason));
  await Models.init();
  if (Intro.shouldShow()) { Intro.open(); return; } // el resto arranca al salir de la portada
  await Router.route();
})();
