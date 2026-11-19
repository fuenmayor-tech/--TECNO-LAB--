/* =====================================================================
   Interfaz general: navegación, grados, inicio y escenario 3D reutilizable
   ===================================================================== */
const NAV = [
  { id: 'home', n: 'Inicio', s: 'Inicio', ic: 'home' },
  { sep: true },
  { id: 'ar', n: 'Realidad aumentada', s: 'RA', ic: 'scan', star: true },
  { id: 'explore', n: 'Explorar en 3D', s: '3D', ic: 'cube' },
  { id: 'vr', n: 'Realidad virtual', s: 'RV', ic: 'vr' },
  { sep: true },
  { id: 'study', n: 'Estudio', s: 'Estudio', ic: 'book' },
  { id: 'videos', n: 'Aprende con videos', s: 'Videos', ic: 'video' },
  { id: 'games', n: 'Minijuegos', s: 'Juegos', ic: 'game' },
  { id: 'sim', n: 'Simulador', s: 'Simulador', ic: 'sim' },
  { id: 'create', n: 'Zona de creación', s: 'Crear', ic: 'brush' },
  { id: 'manera', n: 'Aprende a tu manera', s: 'Tu manera', ic: 'shapes' }
];
const Views = {};
const Router = {
  cur: null, args: [], q: {},
  parse() { const h = location.hash.replace(/^#\/?/, ''); const [path, qs = ''] = h.split('?'); const parts = path.split('/').filter(Boolean); return { view: parts[0] || 'home', args: parts.slice(1), q: Object.fromEntries(new URLSearchParams(qs)) }; },
  go(path) { const h = '#/' + path; if (location.hash === h) this.route(); else location.hash = h; },
  async route() {
    await App.start(); // motor 3D listo antes de mostrar la sección (solo tarda la primera vez)
    const { view, args, q } = this.parse(); const v = Views[view] ? view : 'home';
    if (this.cur && Views[this.cur].leave) { try { Views[this.cur].leave(); } catch (e) { console.warn(e); } }
    Voice.stop(); closePopover();
    if (v !== 'explore' && !ARRun.on && typeof HandControl !== 'undefined') HandControl.stop();
    this.cur = v; this.args = args; this.q = q;
    const main = $('#main'); main.innerHTML = ''; const sec = document.createElement('section'); sec.className = 'view'; sec.dataset.view = v; main.appendChild(sec);
    const nav = NAV.find(n => n.id === v); $('#crumb').textContent = nav ? nav.n : 'TECNO LAB'; document.title = (nav && v !== 'home' ? nav.n + ' · ' : '') + 'TECNO LAB';
    $$('[data-route]').forEach(b => { if (b.dataset.route === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    closeDrawer();
    try { await Views[v].enter(sec, args, q); } catch (e) { console.error(e); sec.innerHTML = `<div class="notice warn">${icon('info')}<div>Ocurrió un problema al abrir esta sección: ${esc(e.message)}</div></div>`; }
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    App.afterFirst();
  }
};
addEventListener('hashchange', () => Router.route());

function buildChrome() {
  $('#nav').innerHTML = NAV.map(n => n.sep ? '<div class="nav-sep" role="separator"></div>'
    : `<button type="button" class="nav-item ${n.star ? 'nav-ar' : ''}" data-route="${n.id}" data-tip="${esc(n.n)}" aria-label="${esc(n.n)}">${icon(n.ic)}<span class="nl-s">${esc(n.s)}</span><span class="nl-f">${esc(n.n)}</span></button>`).join('');
  $('#bottombar').innerHTML = ['home', 'study', 'ar', 'games'].map(id => { const n = NAV.find(x => x.id === id); return `<button type="button" class="bb-item ${id === 'ar' ? 'bb-ar' : ''}" data-route="${id}" aria-label="${esc(n.n)}">${icon(n.ic)}<span>${esc(n.s)}</span></button>`; }).join('') + `<button type="button" class="bb-item" id="bbMore" aria-controls="sidebar" aria-label="Más secciones">${icon('menu')}<span>Más</span></button>`;
  $$('[data-route]').forEach(b => b.addEventListener('click', () => Router.go(b.dataset.route)));
  $('#btnMenu').innerHTML = icon('menu');
  $('#btnMenu').onclick = openDrawer; $('#bbMore').onclick = openDrawer; $('#scrim').onclick = closeDrawer;
  $('#brandBtn').onclick = () => Intro.open();
  $('#creditIntro').onclick = () => Intro.open();
  $('#creditList').onclick = () => showCredits();
  $('#gradeBtn').onclick = e => { e.stopPropagation(); gradePopover(); };
  const more = $('#btnMore');
  more.innerHTML = `${icon('gear')}<span class="nl-s">Más</span><span class="nl-f">Más opciones</span><i class="net-dot" id="netDot"></i>`;
  more.dataset.tip = 'Más opciones';
  more.onclick = e => { e.stopPropagation(); morePopover(more); };
  const upd = () => { const d = $('#netDot'); if (d) { d.classList.toggle('off', !navigator.onLine); d.title = navigator.onLine ? 'Con conexión' : 'Sin conexión: modo offline'; } };
  addEventListener('online', upd); addEventListener('offline', upd); upd();
  addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#popover').hidden === false) closePopover(); else if ($('#sidebar').classList.contains('open')) closeDrawer(); } });
  document.addEventListener('click', e => { const pop = $('#popover'); if (!pop.hidden && !pop.contains(e.target)) closePopover(); });
  /* Tooltip de la barra lateral compacta */
  const tip = $('#tip');
  const showTip = b => { if (!b.dataset.tip || innerWidth <= 760) return; const r = b.getBoundingClientRect(); tip.textContent = b.dataset.tip; tip.hidden = false; tip.style.left = (r.right + 10) + 'px'; tip.style.top = (r.top + r.height / 2) + 'px'; };
  $$('#sidebar [data-tip]').forEach(b => { b.addEventListener('mouseenter', () => showTip(b)); b.addEventListener('focus', () => showTip(b)); b.addEventListener('mouseleave', () => tip.hidden = true); b.addEventListener('blur', () => tip.hidden = true); b.addEventListener('click', () => tip.hidden = true); });
}
function openDrawer() { $('#sidebar').classList.add('open'); $('#scrim').hidden = false; $('#btnMenu').setAttribute('aria-expanded', 'true'); $('#sidebar .nav-item')?.focus(); }
function closeDrawer() { $('#sidebar').classList.remove('open'); $('#scrim').hidden = true; $('#btnMenu').setAttribute('aria-expanded', 'false'); }

/* ---------- Ventanas flotantes (grado y más opciones) ---------- */
function openPopover(html, anchor, { cls = '', label = '' } = {}) {
  const pop = $('#popover'); pop.className = 'popover ' + cls; pop.innerHTML = html; pop.hidden = false;
  if (label) pop.setAttribute('aria-label', label);
  const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  if (innerWidth <= 760) { pop.style.left = ''; pop.style.top = ''; pop.classList.add('sheet'); }
  else if (cls.includes('pop-side')) { pop.style.left = (r.right + 10) + 'px'; pop.style.top = Math.max(10, Math.min(innerHeight - h - 10, r.bottom - h)) + 'px'; }
  else { pop.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.right - w)) + 'px'; pop.style.top = (r.bottom + 8) + 'px'; }
  anchor.setAttribute('aria-expanded', 'true'); pop._anchor = anchor;
  setTimeout(() => (pop.querySelector('[aria-checked="true"]') || pop.querySelector('button'))?.focus(), 30);
  return pop;
}
function closePopover() { const pop = $('#popover'); if (!pop || pop.hidden) return; pop.hidden = true; pop.innerHTML = ''; pop._anchor?.setAttribute('aria-expanded', 'false'); }
function gradePopover() {
  const g = Store.grade;
  const pop = openPopover(`<div class="pop-head"><b>¿En qué grado estás?</b><span>Los temas, las palabras y los retos cambian según el grado.</span></div>
    <div class="grade-list" role="radiogroup" aria-label="Grado escolar">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="grade-opt" role="radio" aria-checked="${n === g}" data-g="${n}"><span class="go-n">${n}.°</span><span class="go-t"><b>${GRADES[n].adj} grado</b><small>${esc(TOPICS[n].slice(0, 2).map(t => t.t).join(' · '))}</small></span>${n === g ? icon('check') : ''}</button>`).join('')}</div>`, $('#gradeBtn'), { cls: 'pop-grade', label: 'Elegir grado' });
  $$('[data-g]', pop).forEach(b => b.onclick = () => { closePopover(); setGrade(+b.dataset.g); });
  pop.addEventListener('keydown', e => { if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return; e.preventDefault(); const bs = $$('[data-g]', pop); const i = bs.indexOf(document.activeElement); bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length].focus(); });
}
function morePopover(anchor) {
  const fx = !!Store.data.fx;
  const pop = openPopover(`<div class="pop-menu" role="menu">
      <button role="menuitem" data-a="intro">${icon('present')}<span>Presentación</span></button>
      <button role="menuitem" data-a="gestos">${icon('handOpen')}<span>Guía de gestos</span></button>
      <button role="menuitem" data-a="guia">${icon('info')}<span>Guía para la profesora</span></button>
      <button role="menuitem" data-a="chat">${icon('chat')}<span>Asistente de preguntas</span></button>
      <button role="menuitem" data-a="creditos">${icon('heart')}<span>Créditos</span></button>
      <hr>
      <button role="menuitemcheckbox" aria-checked="${fx}" data-a="fx">${icon('sparkle')}<span>Destellos del puntero: ${fx ? 'sí' : 'no'}</span></button>
      <button role="menuitem" data-a="offline">${icon('download')}<span>Preparar para usar sin internet</span></button>
      <p class="pop-net">${icon(navigator.onLine ? 'globe' : 'wifi')}${navigator.onLine ? 'Con conexión' : 'Sin conexión: modo offline'}</p>
    </div>`, anchor, { cls: 'pop-side', label: 'Más opciones' });
  const act = { intro: () => Intro.open(), creditos: showCredits, gestos: showGestureGuide, guia: showTeacherGuide, chat: () => Chat.toggle(true), fx: () => { Store.data.fx = !Store.data.fx; Store.save(); toast(Store.data.fx ? 'Destellos activados' : 'Destellos desactivados', 'info'); }, offline: prepareOffline };
  $$('[data-a]', pop).forEach(b => b.onclick = () => { closePopover(); closeDrawer(); act[b.dataset.a](); });
}

function applyGradeUI() {
  const g = Store.grade; document.body.dataset.grade = g;
  $('#gradeName').textContent = `${GRADES[g].adj} grado · ${GRADES[g].team}`;
  $('#gradeBtn').innerHTML = `${icon('grad')}<span class="gp-l">Grado</span><b>${g}.°</b><span class="gp-n">${GRADES[g].n}</span>${icon('down', 'gp-c')}`;
  $('#gradeBtn').setAttribute('aria-label', `Grado escolar: ${GRADES[g].n}. Cambiar de grado`);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(document.body).getPropertyValue('--bg').trim();
}
function setGrade(g, { splash = true } = {}) {
  if (g === Store.grade) return;
  Store.data.grade = g; Store.data.firstVisit = false; Store.save(); applyGradeUI();
  announce(`${GRADES[g].adj} grado seleccionado`); if (splash) gradeSplash(g);
  const v = Views[Router.cur]; if (v && v.onGrade) v.onGrade(); else Router.route();
}

function gradeSplash(g) {
  $$('.grade-splash').forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'grade-splash'; d.setAttribute('aria-hidden', 'true');
  const nuevas = PARTS.filter(p => p.g === g).map(p => p.n);
  d.innerHTML = `<div class="gs-card"><span class="gs-k">Grado</span><b>${g}.°</b><strong>${GRADES[g].adj} grado · ${GRADES[g].team}</strong><p>${TOPICS[g].length} temas: ${TOPICS[g].slice(0, 4).map(t => esc(t.t)).join(' · ')}…</p>${nuevas.length ? `<p class="small">Partes nuevas: ${esc(nuevas.slice(0, 5).join(', '))}${nuevas.length > 5 ? '…' : ''}</p>` : ''}</div>`;
  document.body.appendChild(d); d.onclick = () => d.remove();
  setTimeout(() => d.classList.add('out'), 1700); setTimeout(() => d.remove(), 2200);
  FX.confetti(innerWidth / 2, innerHeight / 2, 60);
}
/* Preparar uso sin internet: guarda en caché los recursos pesados */
async function prepareOffline() {
  if (!('caches' in window) || ENV.file) { openModal({ title: 'Modo sin internet', body: `<p><b>Ya funciona sin internet:</b> los ${Models.count()} modelos 3D, la realidad aumentada y las actividades vienen con la aplicación (index.html y su carpeta <span class="kbd">models</span>).</p><p class="muted">Abriendo el archivo directamente, los gestos con la mano y los videos necesitan internet. En las apps de Android, Windows y Mac los gestos funcionan también sin internet.</p>`, actions: [{ label: 'Entendido', cls: 'btn-primary' }] }); return; }
  const files = u => typeof u === 'string' && !u.startsWith('emb:') && !u.startsWith('data:');
  const toUrl = u => u.startsWith('js:') ? 'models/js/' + u.slice(3).replace(/\.glb$/i, '') + '.js' : u;
  const urls = ['index.html', 'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/marcador/marcador-tecnolab.png',
    ...(Models.embedded || document.getElementById('lib-three') || Libs.threeSource === 'incluida' ? [] : ['lib/three-bundle.js', 'lib/aruco-bundle.js', 'lib/fonts/sora-latin-wght-normal.woff2', 'lib/fonts/lexend-latin-wght-normal.woff2', 'lib/fonts/lexend-latin-ext-wght-normal.woff2']),
    ...['hands.js', 'hands_solution_packed_assets_loader.js', 'hands_solution_packed_assets.data', 'hands_solution_simd_wasm_bin.js', 'hands_solution_simd_wasm_bin.wasm', 'hands_solution_wasm_bin.js', 'hands_solution_wasm_bin.wasm', 'hand_landmark_full.tflite', 'hand_landmark_lite.tflite', 'hands.binarypb'].map(f => 'lib/mediapipe/' + f),
    'models/modelos.json', ...Object.values(Models.glbAvail).filter(files).map(toUrl), ...Object.values(Models.thumbs).filter(u => files(u) && u.startsWith('models/'))];
  const body = document.createElement('div'); body.innerHTML = `<p>Se guardará en este dispositivo la detección de manos${Models.embedded === true ? ` (los ${Models.count()} modelos 3D ya vienen incluidos en la app)` : Models.embedded === 'js' ? ` y los ${Models.count()} modelos 3D` : ` y los modelos 3D publicados (${Object.keys(Models.glbAvail).length})`}. Puede tardar unos minutos.</p><div class="progress"><span style="width:0%"></span></div><p class="small muted" data-st>Preparando…</p>`;
  const m = openModal({ title: 'Preparar para usar sin internet', body });
  const bar = body.querySelector('.progress span'), st = body.querySelector('[data-st]');
  try {
    /* Mismos nombres de caché que usa sw.js: el detector de manos se conserva entre versiones */
    const cajas = { mp: await caches.open('tecnolab-mediapipe-0.4'), app: await caches.open('tecnolab-v' + APP_VERSION) }; let ok = 0, fail = 0;
    for (let i = 0; i < urls.length; i++) {
      try { const r = await fetch(urls[i], { cache: 'reload' }); if (r.ok) { await (urls[i].startsWith('lib/mediapipe/') ? cajas.mp : cajas.app).put(urls[i], r); ok++; } else fail++; } catch { fail++; }
      bar.style.width = ((i + 1) / urls.length * 100) + '%'; st.textContent = `${i + 1} de ${urls.length} recursos`;
    }
    st.textContent = fail ? `Listo: ${ok} recursos guardados; ${fail} no se pudieron descargar (puede que no existan en el servidor).` : `¡Listo! ${ok} recursos guardados. TECNO LAB funcionará sin internet en este navegador.`;
    toast('Modo sin internet preparado', 'ok');
  } catch (e) { st.textContent = 'No se pudo completar: ' + e.message; }
}

/* ---------- Escenario 3D reutilizable (inicio y explorar) ---------- */
class Stage3D {
  constructor({ orbit = true, auto = true } = {}) {
    const T = GL.T; this.T = T; this.orbit = orbit; this.auto = auto && !ENV.reduced; this._tok = 0; this.last = 0;
    this.scene = new T.Scene(); this.cam = new T.PerspectiveCamera(34, 1, .01, 100);
    this.lights = GL.studio(this.scene, new T.Color(GL.accent()));
    this.holder = new T.Group(); this.scene.add(this.holder);
    this.holder.add(GL.contactShadow(1.5, .6));
    this.ring = new T.Mesh(new T.RingGeometry(.72, .74, 96), new T.MeshBasicMaterial({ color: new T.Color(GL.accent()), transparent: true, opacity: .55, side: T.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = .003; this.scene.add(this.ring);
    this.cam.position.set(1.4, 1, 1.9); this.target = new T.Vector3(0, .4, 0);
  }
  theme() { const c = new this.T.Color(GL.accent()); this.ring.material.color.copy(c); this.lights.rim.color.copy(c); }
  mount(host) {
    this.host = host;
    if (!GL.mount(host, (w, h) => { this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }, this.orbit)) return false;
    if (this.orbit) {
      const c = this.controls = new this.T.OrbitControls(this.cam, GL.canvas);
      c.enableDamping = true; c.dampingFactor = .08; c.enablePan = false; c.target.copy(this.target);
      c.addEventListener('start', () => { this.userBusy = true; }); c.addEventListener('end', () => { this.userBusy = false; });
    }
    this.last = performance.now(); GL.setLoop(t => this.frame(t)); return true;
  }
  unmount() { this.controls?.dispose(); this.controls = null; GL.unmount(); }
  async show(id, onLoading) {
    const tok = ++this._tok; onLoading && onLoading(true);
    try {
      const inst = await Models.instance(id); if (tok !== this._tok) return;
      await GL.precompile(inst, this.cam, this.scene); if (tok !== this._tok) return;
      if (this.obj) this.holder.remove(this.obj);
      this.obj = inst; this.holder.add(inst); this.holder.rotation.y = -.5; this.fit();
    } finally { if (tok === this._tok) onLoading && onLoading(false); }
  }
  fit() {
    const T = this.T; const sph = new T.Box3().setFromObject(this.obj).getBoundingSphere(new T.Sphere());
    const dist = sph.radius / Math.sin(T.MathUtils.degToRad(this.cam.fov / 2)) * 1.12;
    const dir = new T.Vector3(.55, .42, 1).normalize();
    this.target.copy(sph.center); this.cam.position.copy(sph.center).addScaledVector(dir, dist); this.cam.lookAt(this.target);
    this.cam.near = dist / 100; this.cam.far = dist * 20; this.cam.updateProjectionMatrix();
    if (this.controls) { this.controls.target.copy(this.target); this.controls.minDistance = dist * .35; this.controls.maxDistance = dist * 2.6; this.controls.update(); }
    this.home = { pos: this.cam.position.clone(), tgt: this.target.clone() };
  }
  reset() { if (!this.home) return; this.cam.position.copy(this.home.pos); this.holder.rotation.y = -.5; if (this.controls) { this.controls.target.copy(this.home.tgt); this.controls.update(); } }
  zoom(f) { const c = this.controls, t = c ? c.target : this.target; const v = this.cam.position.clone().sub(t); const d = v.length(); const nd = c ? clamp(d * f, c.minDistance, c.maxDistance) : d * f; if (Math.abs(nd - d) < 1e-6) return false; v.multiplyScalar(nd / d); this.cam.position.copy(t).add(v); return true; }
  /* Giro desde los gestos de la mano: horizontal gira el modelo; vertical mueve la cámara arriba/abajo */
  rotate(dx, dy) {
    this.handT = performance.now(); this.holder.rotation.y += dx;
    if (dy) { const T = this.T, t = this.controls ? this.controls.target : this.target; const off = this.cam.position.clone().sub(t); const sp = new T.Spherical().setFromVector3(off); sp.phi = clamp(sp.phi - dy, .25, 1.5); off.setFromSpherical(sp); this.cam.position.copy(t).add(off); }
  }
  frame(now) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; const t = now / 1000;
    if (this.auto && !this.userBusy && now - (this.handT || 0) > 1800) this.holder.rotation.y += dt * .45;
    if (this.obj) Anim.tick(this.obj, t, dt);
    this.controls ? this.controls.update() : this.cam.lookAt(this.target);
    GL.renderer.render(this.scene, this.cam);
  }
}

/* ---------- Inicio (liviano: lo esencial para empezar) ---------- */
Views.home = {
  stage: null,
  async enter(el) {
    const g = Store.grade, G = GRADES[g], read = Store.g('read');
    const readN = Object.keys(read).length, tot = TOPICS[g].length;
    const best = Object.values(Store.g('quiz')).reduce((m, v) => Math.max(m, v.best || 0), 0);
    const view = Models.viewable(g), heroId = Models.has(G.hero) ? G.hero : (view[0]?.id || null), heroP = heroId ? Models.find(heroId) : null;
    const topics = [...TOPICS[g]].sort((a, b) => (read[a.id] ? 1 : 0) - (read[b.id] ? 1 : 0)).slice(0, 4);
    const nM = Models.count();
    el.innerHTML = `
      ${ENV.file ? `<div class="notice warn">${icon('info')}<div><b>Abriste el archivo directamente.</b> Casi todo funciona, pero los modelos .glb publicados, el modo sin internet y algunas cámaras necesitan abrir TECNO LAB desde GitHub Pages o un servidor local.</div></div>` : ''}
      ${!GL.ok ? `<div class="notice warn">${icon('info')}<div>No se pudo iniciar el motor 3D (${esc(GL.err?.message || 'WebGL no disponible')}). Estudio, videos, juegos, simulador y creación funcionan normalmente.</div></div>` : ''}
      <section class="welcome">
        <div class="welcome-copy">
          <span class="eyebrow">${icon('grad')} ${G.adj} grado · ${G.team}</span>
          <h1>Hola, <span class="grad-text">${G.team}</span></h1>
          <p class="lead">${esc(G.lead)}</p>
          <div class="row">
            <button class="btn btn-primary btn-lg" data-go="ar">${icon('scan')}Empezar con realidad aumentada</button>
            <button class="btn btn-lg" data-go="study">${icon('book')}Temas de ${g}.°</button>
          </div>
          <div class="mini-progress"><span>${icon('check')}<b>${readN}/${tot}</b> temas leídos</span><span>${icon('star')}<b>${best}%</b> mejor quiz</span><span>${icon('cube')}<b>${nM}</b> ${nM === 1 ? 'modelo 3D' : 'modelos 3D'}</span></div>
        </div>
        <div class="welcome-art ${heroP && GL.ok ? 'has-3d' : ''}" id="heroStage">
          ${heroP && GL.ok ? `<div class="hero-cap"><span class="badge-demo glb">${icon('cube')}${esc(heroP.n)}</span><span class="row" style="gap:6px;pointer-events:auto"><button class="btn btn-sm" data-hand-part="${esc(heroId)}">${icon('hand')}Muévelo con tu mano</button><button class="btn btn-sm btn-primary" data-ar-part="${esc(heroId)}">${icon('scan')}Verlo en mi mesa</button></span></div>` : heroArtSVG()}
        </div>
      </section>
      <h2 class="h-sec">Empieza por aquí</h2>
      <div class="start-grid">
        <button type="button" class="card card-link start-card start-ar" data-go="ar"><span class="fi">${icon('scan')}</span><div><h3>Realidad aumentada</h3><p>Imprime el marcador, ponlo a un lado de la cámara y haz aparecer las partes sobre tu mesa. Hay misiones de <span style="white-space:nowrap">${g}.°</span>.</p></div><span class="go">Entrar ${icon('arrowR')}</span></button>
        <button type="button" class="card card-link start-card" data-go="explore"><span class="fi">${icon('cube')}</span><div><h3>Explorar en 3D y RV</h3><p>Gira, acerca y conoce cada parte. También puedes recorrer el laboratorio virtual.</p></div><span class="go">Entrar ${icon('arrowR')}</span></button>
        <button type="button" class="card card-link start-card" data-go="study"><span class="fi">${icon('book')}</span><div><h3>Estudio de ${g}.°</h3><p>${tot} temas con lección, tarjetas y quices que cambian cada vez.</p></div><span class="go">Entrar ${icon('arrowR')}</span></button>
      </div>
      <div class="section-head" style="margin-top:26px"><div><h2>Tus temas de ${G.n.toLowerCase()}</h2><p>${readN ? 'Sigue con los que te faltan.' : 'Empieza por el que más te guste.'}</p></div><button class="btn btn-sm" data-go="study">${icon('book')}Ver los ${tot}</button></div>
      <div class="topic-strip">${topics.map(t => `<button class="card card-link topic-card" data-topic="${t.id}"><span class="topic-num">${icon(t.ic)}</span><div><h3>${esc(t.t)}</h3><p>${esc(t.r)}</p></div>${read[t.id] ? `<span class="done-mark" aria-label="Leído">${icon('check')}</span>` : ''}</button>`).join('')}</div>
      <h2 class="h-sec">Más formas de aprender</h2>
      <div class="quick-row">${[['videos', 'Videos'], ['games', 'Minijuegos'], ['sim', 'Simulador'], ['create', 'Zona de creación'], ['manera', 'Aprende a tu manera']].map(([id, n]) => `<button type="button" class="quick" data-go="${id}">${icon(NAV.find(x => x.id === id).ic)}<span>${n}</span></button>`).join('')}<button type="button" class="quick" id="homeChat">${icon('chat')}<span>Pregúntale al asistente</span></button></div>`;
    $$('[data-go]', el).forEach(b => b.onclick = () => Router.go(b.dataset.go));
    $$('[data-topic]', el).forEach(b => b.onclick = () => Router.go('study/learn/' + b.dataset.topic));
    $$('[data-ar-part]', el).forEach(b => b.onclick = () => ARRun.start(b.dataset.arPart, Models.viewable(g), { id: 'free' }));
    $$('[data-hand-part]', el).forEach(b => b.onclick = () => Router.go('explore/' + b.dataset.handPart + '?mano=1'));
    $('#homeChat', el).onclick = () => Chat.toggle(true);
    if (heroP && GL.ok) {
      this.stage ??= new Stage3D({ orbit: false }); this.stage.theme();
      this.stage.mount($('#heroStage', el)); this.stage.show(heroId).catch(() => { const h = $('#heroStage', el); if (h) { this.stage.unmount(); h.classList.remove('has-3d'); h.innerHTML = heroArtSVG(); } });
    }
  },
  leave() { this.stage?.unmount(); },
  onGrade() { Router.route(); }
};

function showTeacherGuide() {
  openModal({ title: 'Guía para la profesora', wide: true, body: `
    <div class="stack">
      <div class="info-block"><h4>Agregar modelos 3D (.glb)</h4>
        <p><b>Opción 1 · Para todos (recomendada):</b> copia el archivo en la carpeta <span class="kbd">models/</span> de la aplicación con el nombre exacto de la parte y súbelo a GitHub. TECNO LAB lo detecta solo. Las partes sin archivo muestran su ficha y su icono, sin modelo 3D.</p>
        <p><b>Modelos nuevos</b> (por ejemplo un carro, una tableta o un robot): copia el .glb en <span class="kbd">models/</span> y agrégalo a <span class="kbd">models/modelos.json</span> con su nombre, tipo y grado. Aparecerá en 3D, RA y RV para todos.</p>
        <p class="small">Nombres: ${PARTS.map(p => `<span class="kbd">${p.id}.glb</span>`).join(' ')}</p>
        <p><b>Opción 2 · Desde la app:</b> en “Explorar en 3D” o “Realidad aumentada”, usa <b>Subir modelo</b>. Puedes asignarlo a una parte o crear una pieza nueva (por ejemplo un carro); también acepta imágenes .png o .jpg. Queda guardado en este navegador aunque recargues la página y se puede ver en 3D, en RA y en RV. Con <b>Descargar para GitHub</b> obtienes el archivo con el nombre correcto para la carpeta <span class="kbd">models/</span>.</p></div>
      <div class="info-block"><h4>Marcador de realidad aumentada</h4><p>Hay un solo marcador para todas las partes. Descárgalo o imprímelo desde la sección Realidad aumentada, en tamaño carta, sin ajustar la escala. Los estudiantes eligen la parte en la pantalla y apuntan la cámara al marcador.</p></div>
      <div class="info-block"><h4>Publicar en GitHub Pages</h4><ol style="margin:0;padding-left:1.2em"><li>Crea un repositorio y sube todo el contenido del .zip (con las carpetas).</li><li>En Settings → Pages elige la rama <i>main</i> y la carpeta <i>/ (root)</i>.</li><li>Abre la dirección que te da GitHub (https://…github.io/…). La cámara funciona porque es https.</li><li>Para el aula sin internet: abre la página una vez con conexión y, en <b>Más opciones</b> (engranaje del menú), pulsa <b>Preparar para usar sin internet</b>.</li></ol></div>
      <div class="info-block"><h4>Privacidad</h4><p>La cámara se procesa en el propio dispositivo: TECNO LAB no envía imágenes, dibujos ni datos a ningún servidor. El progreso se guarda solo en este navegador.</p></div>
    </div>`, actions: [{ label: 'Cerrar', cls: 'btn-primary' }] });
}
