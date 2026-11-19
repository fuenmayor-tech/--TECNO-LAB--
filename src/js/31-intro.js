/* =====================================================================
   Portada: presentación con botones, guía de gestos y elección de grado.
   Se muestra al abrir TECNO LAB (una vez por sesión) y se puede volver a
   abrir desde el logo, el pie de página o "Más opciones".
   ===================================================================== */
const AUTORA = 'Jeniffer Andrea Fuenmayor Díaz';
const PROFESOR = 'José Zapata';

/* Ilustración original de la portada: marcador isométrico con un monitor proyectado */
function heroArtSVG() {
  const cells = [[0, 0], [1, 0], [3, 0], [4, 0], [0, 1], [2, 1], [4, 1], [1, 2], [2, 2], [3, 2], [0, 3], [3, 3], [4, 3], [1, 4], [2, 4], [4, 4]];
  return `<svg class="hero-art" viewBox="0 0 480 400" role="img" aria-label="Ilustración: un marcador de realidad aumentada sobre la mesa proyecta un monitor en 3D">
    <defs>
      <radialGradient id="haGlow" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient>
      <radialGradient id="haGlow2" cx="75%" cy="25%" r="40%"><stop offset="0" stop-color="var(--accent-2)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent-2)" stop-opacity="0"/></radialGradient>
      <linearGradient id="haScreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent-2)" stop-opacity=".18"/></linearGradient>
      <linearGradient id="haBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="480" height="400" fill="url(#haGlow)"/><rect width="480" height="400" fill="url(#haGlow2)"/>
    <g transform="translate(240 318) scale(1 .5) rotate(45)" opacity=".5" stroke="var(--line-2)" stroke-width="1.2" fill="none">
      ${[-150, -100, -50, 0, 50, 100, 150].map(v => `<line x1="${v}" y1="-150" x2="${v}" y2="150"/><line x1="-150" y1="${v}" x2="150" y2="${v}"/>`).join('')}
    </g>
    <g transform="translate(240 318) scale(1 .5) rotate(45)">
      <rect x="-62" y="-62" width="124" height="124" rx="6" fill="#f5f7fb"/>
      <rect x="-50" y="-50" width="100" height="100" fill="#0b1324"/>
      ${cells.map(([x, y]) => `<rect x="${-40 + x * 16}" y="${-40 + y * 16}" width="16" height="16" fill="#f5f7fb"/>`).join('')}
    </g>
    <path d="M152 318 L204 214 L276 214 L328 318 Z" fill="url(#haBeam)" opacity=".55"/>
    <g class="ha-float">
      <ellipse cx="240" cy="214" rx="46" ry="9" fill="var(--accent)" opacity=".25"/>
      <path d="M226 186 L254 186 L262 210 L218 210 Z" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>
      <rect x="160" y="78" width="160" height="108" rx="12" fill="var(--bg-2)" stroke="var(--accent)" stroke-width="3.5"/>
      <rect x="172" y="90" width="136" height="84" rx="6" fill="url(#haScreen)"/>
      <path d="M186 150 L210 126 L228 142 L250 112 L292 152" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <circle cx="292" cy="106" r="7" fill="var(--accent-2)"/>
    </g>
    <g class="ha-orbit" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g transform="translate(92 150)" stroke="var(--accent-2)" stroke-width="2.6"><rect x="-22" y="-22" width="44" height="44" rx="8"/><rect x="-10" y="-10" width="20" height="20" rx="3" fill="var(--accent-2)" fill-opacity=".25"/>${[-14, 0, 14].map(v => `<line x1="${v}" y1="-30" x2="${v}" y2="-22"/><line x1="${v}" y1="22" x2="${v}" y2="30"/><line x1="-30" y1="${v}" x2="-22" y2="${v}"/><line x1="22" y1="${v}" x2="30" y2="${v}"/>`).join('')}</g>
      <g transform="translate(392 168)" stroke="var(--accent)" stroke-width="2.6"><rect x="-17" y="-26" width="34" height="52" rx="17"/><line x1="0" y1="-26" x2="0" y2="-8"/></g>
      <g transform="translate(372 286)" stroke="var(--brown, #c8a69a)" stroke-width="2.4"><rect x="-38" y="-14" width="76" height="28" rx="6"/>${[-26, -13, 0, 13, 26].map(v => `<line x1="${v}" y1="-4" x2="${v + 4}" y2="-4"/>`).join('')}<line x1="-18" y1="6" x2="18" y2="6"/></g>
      <g transform="translate(104 270)" stroke="var(--red)" stroke-width="2.4"><path d="M-14 -16 L14 -16 L14 16 L-14 16 Z M-8 -16 L-8 -26 L8 -26 L8 -16"/><line x1="-6" y1="-2" x2="6" y2="-2"/></g>
    </g>
    ${[[70, 70, 3], [420, 74, 2.5], [430, 230, 2], [52, 210, 2], [300, 50, 2]].map(([x, y, r]) => `<circle class="ha-spark" cx="${x}" cy="${y}" r="${r}" fill="var(--accent)"/>`).join('')}
  </svg>`;
}

/* Bloques de gestos reutilizados en la portada y en la guía */
function gestureCard(e, t, d) { return `<div class="gesture"><span class="g-ic g-emoji" aria-hidden="true">${e}</span><div><b>${t}</b><p>${d}</p></div></div>`; }
function gesturesHTML(tab = 'all') {
  const G = (ic, t, d) => `<div class="gesture"><span class="g-ic">${icon(ic)}</span><div><b>${t}</b><p>${d}</p></div></div>`;
  const mano = `<div class="gesture-group"><h4>${icon('hand')} Con la mano frente a la cámara · RA y visor 3D</h4>
      ${GESTOS_MANO.map(x => gestureCard(x.e, x.n, x.d)).join('')}
      <p class="small muted">Actívalo con el botón <b>Usar mis manos</b> (visor 3D) o <b>Manos</b> (realidad aumentada); la app pide permiso para usar la cámara. La mano abierta y la V se mantienen un momento hasta que se llene la barra. Con el índice aparece un círculo en la pantalla: déjalo quieto sobre un botón y se toca solo.</p></div>`;
  const crear = `<div class="gesture-group"><h4>${icon('brush')} Zona de creación (cámara y mano)</h4>
      ${G('handIndex', 'Dedo índice arriba: dibujar', 'Levanta solo el dedo índice y muévelo frente a la cámara para pintar.')}
      ${G('fist', 'Puño cerrado: borrar', 'Cierra la mano y pásala por encima de lo que quieres borrar.')}
      ${G('handOpen', 'Mano abierta: elegir', 'Deja la mano abierta un momento sobre un color o un botón hasta que se llene el círculo.')}</div>`;
  const dedos = `<div class="gesture-group"><h4>${icon('smartphone')} Con los dedos en la pantalla</h4>
      ${G('move3d', 'Un dedo: girar', 'Desliza un dedo sobre el modelo para darle la vuelta.')}
      ${G('zoomIn', 'Dos dedos: acercar o alejar', 'Pellizca la pantalla o usa los botones + y −.')}
      ${G('target', 'Apunta al marcador', 'Coloca el marcador a unos 30 a 60 cm de la cámara, con buena luz.')}</div>`;
  const rv = `<div class="gesture-group"><h4>${icon('vr')} Realidad virtual</h4>
      ${G('move', 'Arrastra para mirar', 'En pantalla, arrastra o usa las flechas del teclado para mirar alrededor.')}
      ${G('eye', 'Mira fijamente para elegir', 'Con visor tipo Cardboard, mira una parte unos segundos y se selecciona sola.')}</div>`;
  const parts = { mano, crear, dedos, rv };
  return tab === 'all' ? `<div class="gesture-groups">${mano + crear + dedos + rv}</div>` : `<div class="gesture-groups single">${parts[tab] || mano}</div>`;
}
/* Abre el visor 3D con la cámara y los gestos activados (pide el permiso de la cámara) */
function tryHands() {
  const g = Store.grade, hero = Models.has(GRADES[g].hero) ? GRADES[g].hero : Models.viewable(g)[0]?.id || Models.viewableAll()[0]?.id;
  if (!hero || !(GL.ok || ENV.webgl)) { toast('Este dispositivo no puede mostrar modelos 3D.', 'info'); return; }
  if (!$('#intro').hidden) Intro.goTo('explore/' + hero + '?mano=1'); else Router.go('explore/' + hero + '?mano=1');
}
function showGestureGuide() { openModal({ title: 'Guía de gestos', wide: true, body: gesturesHTML(), actions: [{ label: 'Entendido' }, { label: 'Probar con mi cámara', icon: 'camera', cls: 'btn-primary', onClick: () => setTimeout(tryHands, 60) }] }); }

/* Portada con botones: inicio + recorrido por paneles (Atrás / Siguiente siempre visibles).
   Todos los botones se atienden con un solo "escuchador" en la portada, y las pestañas solo
   muestran u ocultan su contenido (no se vuelve a dibujar nada): así nunca dejan de responder. */
const Intro = {
  panel: 'home',
  PANELS: [
    { id: 'obj', ic: 'target', t: 'Objetivo', d: '¿Para qué existe TECNO LAB?' },
    { id: 'como', ic: 'route', t: 'Cómo funciona', d: 'Tres pasos para empezar' },
    { id: 'grados', ic: 'layers', t: 'Se adapta a tu grado', d: 'Cada grado aprende cosas distintas' },
    { id: 'talleres', ic: 'scan', t: 'Talleres de RA y RV', d: 'Realidad aumentada y virtual' },
    { id: 'gestos', ic: 'hand', t: 'Explicación de gestos', d: 'Maneja los modelos con tus manos' },
    { id: 'todo', ic: 'list', t: 'Qué vas a encontrar', d: 'Todas las secciones del laboratorio' },
    { id: 'antes', ic: 'shield', t: 'Antes de empezar', d: 'Cámara, navegador y sin internet' },
    { id: 'creditos', ic: 'heart', t: 'Créditos', d: 'Modelos, videos y bibliotecas' }
  ],
  shouldShow() {
    try { if (sessionStorage.getItem('tl.intro')) return false; } catch { /* sin sessionStorage */ }
    const h = location.hash.replace(/^#\/?/, '');
    return !h || h === 'home';
  },
  open(panel = 'home') {
    const box = $('#intro'); box.hidden = false;
    document.body.classList.add('intro-open');
    this.tab = {}; this.show(panel, true);
    box.onclick = e => this.onClick(e);
    box.onkeydown = e => {
      if ($('#modalRoot').children.length) return;
      if (e.key === 'Escape') { if (this.panel === 'home') this.close(true); else this.show('home'); }
      if (this.panel !== 'home' && !/INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.key === 'ArrowRight') this.step(1); if (e.key === 'ArrowLeft') this.step(-1); }
    };
  },
  close(goHome = true) {
    const box = $('#intro'); if (box.hidden) return;
    box.hidden = true; box.innerHTML = ''; box.onclick = null; document.body.classList.remove('intro-open');
    try { sessionStorage.setItem('tl.intro', '1'); } catch { /* sin sessionStorage */ }
    if (goHome) { if (Router.cur === 'home') Router.route(); else Router.go('home'); }
  },
  /* Sale de la portada directo a una sección */
  goTo(route) {
    Store.data.firstVisit = false; Store.save(); this.close(false);
    if (route === 'chat') { Router.go('home'); setTimeout(() => Chat.toggle(true), 600); } else Router.go(route);
  },
  pick(g) { Store.data.firstVisit = false; if (g !== Store.grade) setGrade(g, { splash: false }); else Store.save(); this.close(true); setTimeout(() => gradeSplash(g), 120); },
  order() { return [...this.PANELS.map(p => p.id), 'grado']; },
  step(d) { const o = this.order(), i = o.indexOf(this.panel); const n = o[i + d]; if (n) this.show(n); else if (d < 0) this.show('home'); },
  show(id, first = false) {
    const box = $('#intro'); this.panel = id;
    box.innerHTML = this.bar() + (id === 'home' ? this.homeHTML() : this.panelHTML(id));
    box.scrollTop = 0;
    if (!first) Sfx.click?.();
    setTimeout(() => (id === 'home' ? $('#introStart', box) : $('.in-p-body [aria-selected="true"], .in-p-body button, .in-pnav .btn-primary', box))?.focus({ preventScroll: true }), 40);
  },
  /* Un solo lugar atiende todos los botones de la portada */
  onClick(e) {
    const box = $('#intro'), b = e.target.closest('[data-show], [data-in], [data-tab], [data-pick], [data-goto], [data-trymano], [data-camtest]');
    if (!b || !box.contains(b)) return;
    const d = b.dataset;
    if (d.tab) { const [grp, k] = d.tab.split(':'); this.selectTab(grp, k); return; }
    if (d.show) { this.show(d.show); return; }
    if (d.pick) { this.pick(+d.pick); return; }
    if (d.goto) { this.goTo(d.goto); return; }
    if (d.trymano) { this.goTo('explore/' + d.trymano + '?mano=1'); return; }
    if ('camtest' in d) { this.camTest(b); return; }
    switch (d.in) {
      case 'home': this.show('home'); break;
      case 'prev': this.step(-1); break;
      case 'next': this.step(1); break;
      case 'marker': showMarkerModal(); break;
      case 'credits': showCredits(); break;
    }
  },
  /* Pestañas: solo se muestra una y se ocultan las demás (se puede cambiar cuantas veces se quiera) */
  selectTab(grp, k) {
    this.tab[grp] = k;
    $$('#intro [data-tab]').forEach(t => { if (t.dataset.tab.startsWith(grp + ':')) t.setAttribute('aria-selected', String(t.dataset.tab === grp + ':' + k)); });
    $$('#intro [data-pane]').forEach(p => { if (p.dataset.pane.startsWith(grp + ':')) p.hidden = p.dataset.pane !== grp + ':' + k; });
    Sfx.click?.();
  },
  async camTest(btn) {
    const msg = $('#camTestMsg'); if (msg) msg.textContent = 'Pidiendo permiso…';
    try { const s = await getCamera('user', 640, 480); stopStream(s); if (msg) msg.textContent = '¡La cámara funciona! 🎉'; btn.classList.add('ok'); Sfx.win?.(); }
    catch (err) { if (msg) msg.textContent = ''; cameraHelp(err, { retry: () => setTimeout(() => this.camTest(btn), 50) }); }
  },
  bar() {
    return `<header class="in-bar">
      <button type="button" class="in-brand" data-in="home" aria-label="Inicio de la presentación"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><defs><linearGradient id="bmi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="url(#bmi)" stroke-width="3" opacity=".5"/><path d="M18 21h28M32 21v24" stroke="url(#bmi)" stroke-width="7" stroke-linecap="round"/><circle cx="32" cy="48" r="4.5" fill="var(--red)"/></svg></span><b>TECNO LAB</b></button>
      ${this.panel === 'home' ? `<div class="row" style="gap:8px;margin-left:auto"><button class="btn btn-sm" data-show="obj">${icon('route')}<span class="hide-sm">Recorrido</span></button><button class="btn btn-primary btn-sm" data-show="grado">${icon('rocket')}Iniciar</button></div>` : this.stepBar()}
    </header>`;
  },
  /* Barra fija mientras se lee un panel: Atrás · número · Inicio · Siguiente (siempre visible arriba) */
  stepBar() {
    const o = this.order(), i = o.indexOf(this.panel), next = o[i + 1];
    return `<div class="in-stepbar">
        <button type="button" class="btn btn-sm in-back" data-in="${i > 0 ? 'prev' : 'home'}" aria-label="Atrás: volver al punto anterior">${icon('left')}<span>Atrás</span></button>
        <span class="in-step-n" aria-live="polite"><b>${i + 1}</b> de ${o.length}</span>
        <span class="in-step-sp"></span>
        <button type="button" class="btn btn-sm" data-in="home" aria-label="Inicio de la presentación">${icon('home')}<span class="hide-sm">Inicio</span></button>
        ${next ? `<button type="button" class="btn btn-sm btn-primary" data-in="next" aria-label="Siguiente punto"><span>Siguiente</span>${icon('right')}</button>` : ''}
      </div>`;
  },
  homeHTML() {
    return `<section class="in-hero">
      <div class="in-hero-copy">
        <span class="eyebrow">${icon('grad')} Tecnología e Informática · Básica primaria · 1.° a 5.°</span>
        <h1 id="introTitle"><span class="grad-text">TECNO LAB</span><br>Laboratorio interactivo de tecnología</h1>
        <div class="in-about">
          <h2>${icon('info')} ¿De qué se trata?</h2>
          <p><b>TECNO LAB es una aplicación para aprender Tecnología e Informática en la básica primaria, de 1.° a 5.°.</b> Aquí conoces el computador y sus partes con <b>modelos 3D</b> que puedes girar y agrandar con tus manos, los ves sobre tu mesa con <b>realidad aumentada</b>, recorres un laboratorio en <b>realidad virtual</b> y practicas con lecciones, videos, juegos, un simulador y retos de creación. Cada grado tiene sus propios temas y 5 modelos 3D nuevos.</p>
          <ul class="in-about-list">
            <li>${icon('book')}<span><b>Aprende</b> con lecciones, tarjetas y videos.</span></li>
            <li>${icon('cube')}<span><b>Explora</b> en 3D, realidad aumentada y realidad virtual.</span></li>
            <li>${icon('game')}<span><b>Practica</b> con juegos, el simulador y retos.</span></li>
          </ul>
        </div>
        <div class="row in-hero-btns">
          <button class="btn btn-primary btn-lg" id="introStart" data-show="obj">${icon('route')}Comencemos el recorrido</button>
          <button class="btn btn-lg" data-show="gestos">${icon('hand')}Explicación de gestos</button>
        </div>
        <p class="in-skip"><button type="button" class="link-btn" data-show="grado">${icon('rocket')}Ya conozco la app: elegir mi grado e iniciar</button></p>
        <div class="in-credits">
          <div class="in-person"><span class="av">${icon('user')}</span><div><small>Aplicación elaborada por</small><b>${AUTORA}</b></div></div>
          <div class="in-person"><span class="av av-2">${icon('grad')}</span><div><small>Docente asesor</small><b>${PROFESOR}</b></div></div>
        </div>
      </div>
      <div class="in-hero-art">${heroArtSVG()}</div>
    </section>
    <section class="in-menu-wrap">
      <h2 class="in-menu-t">Conoce TECNO LAB <small>Toca un botón o sigue el recorrido en orden</small></h2>
      <div class="in-menu">${this.PANELS.map((p, i) => `<button type="button" class="in-tile" data-show="${p.id}" style="--i:${i}"><span class="it-ic">${icon(p.ic)}</span><span class="it-tx"><b>${i + 1}. ${p.t}</b><small>${p.d}</small></span>${icon('right')}</button>`).join('')}
        <button type="button" class="in-tile in-tile-go" data-show="grado" style="--i:8"><span class="it-ic">${icon('rocket')}</span><span class="it-tx"><b>9. Elegir mi grado</b><small>Entrar al laboratorio</small></span>${icon('right')}</button></div>
    </section>
    ${this.foot()}`;
  },
  foot() { return `<footer class="in-foot"><span><b>TECNO LAB</b> · Laboratorio interactivo de Tecnología e Informática</span><span>Aplicación elaborada por: <b>${AUTORA}</b> · Docente asesor: <b>${PROFESOR}</b></span><span class="small">Modelos 3D: Sketchfab · Videos: YouTube · Mano: MediaPipe · 3D: three.js · Repositorio: GitHub</span></footer>`; },
  /* Pestañas ya dibujadas: items = [clave, título, icono, contenido] */
  tabs(group, items, cur) {
    return `<div class="in-tabs" role="tablist">${items.map(([k, t, ic]) => `<button type="button" role="tab" id="tab-${group}-${k}" class="in-tab" data-tab="${group}:${k}" aria-controls="pane-${group}-${k}" aria-selected="${k === cur}">${ic ? icon(ic) : ''}${t}</button>`).join('')}</div>`
      + items.map(([k, , , html]) => `<div class="in-tabpane" role="tabpanel" id="pane-${group}-${k}" aria-labelledby="tab-${group}-${k}" data-pane="${group}:${k}"${k === cur ? '' : ' hidden'}>${html}</div>`).join('');
  },
  panelHTML(id) {
    const o = this.order(), i = o.indexOf(id), P = this.PANELS.find(p => p.id === id) || { ic: 'rocket', t: 'Iniciemos', d: 'Elige tu grado' };
    const prev = o[i - 1], next = o[i + 1], nameOf = k => (this.PANELS.find(p => p.id === k) || { t: 'Elegir mi grado' }).t;
    return `<section class="in-panel" aria-labelledby="inPT">
      <div class="in-p-head">
        <div class="in-dots" aria-hidden="true">${o.map(k => `<button type="button" tabindex="-1" class="${k === id ? 'on' : ''}" data-show="${k}" title="${esc(nameOf(k))}"></button>`).join('')}</div>
        <span class="eyebrow">${icon(P.ic)} ${i + 1} de ${o.length}</span><h2 id="inPT">${id === 'grado' ? (Store.data.firstVisit ? '¿En qué grado estás?' : 'Elige tu grado para entrar') : P.t}</h2>
      </div>
      <div class="in-p-body">${this.body(id)}</div>
      <nav class="in-pnav" aria-label="Navegación de la presentación">
        <button class="btn btn-lg" data-in="${prev ? 'prev' : 'home'}">${icon('left')}<span>${prev ? nameOf(prev) : 'Inicio'}</span></button>
        ${next ? `<button class="btn btn-primary btn-lg" data-in="next"><span>${nameOf(next)}</span>${icon('right')}</button>` : `<button class="btn btn-lg" data-in="home">${icon('home')}<span>Volver al inicio</span></button>`}
      </nav>
    </section>${this.foot()}`;
  },
  body(id) {
    const g = Store.grade, tb = this.tab;
    if (id === 'obj') {
      const comps = [
        ['Naturaleza y evolución de la tecnología', '¿Qué es la tecnología?, artefactos de ayer y de hoy, historia de los computadores.'],
        ['Apropiación y uso de la tecnología', 'Partes del computador en 3D y RA, uso del teclado y el mouse, simulador de conexiones.'],
        ['Solución de problemas con tecnología', 'Retos, máquinas simples, circuito eléctrico, armar la CPU y pensamiento computacional.'],
        ['Tecnología y sociedad', 'Cuidado de los equipos, uso responsable de las pantallas, ciudadanía digital, energía y reciclaje.']];
      return this.tabs('obj', [
        ['gen', 'Objetivo general', 'target', `<div class="card in-main-obj"><p>Fortalecer el aprendizaje del área de Tecnología e Informática en la básica primaria (1.° a 5.°) mediante experiencias interactivas —realidad aumentada, realidad virtual, modelos 3D, gestos con la mano, simulación y juego— que permitan a los estudiantes reconocer los artefactos tecnológicos, comprender el computador y sus partes, y usar la tecnología de forma segura y responsable.</p></div>`],
        ['esp', 'Objetivos específicos', 'list', `<div class="in-cards">${[['cube', 'Reconocer las partes del computador, su función y su clasificación (entrada, salida, almacenamiento y procesamiento) con modelos 3D y realidad aumentada.'], ['bulb', 'Relacionar la tecnología con la vida cotidiana según el grado: artefactos, materiales, herramientas, máquinas simples, electricidad y energía.'], ['shield', 'Promover el cuidado de los equipos y el uso seguro y responsable de los aparatos y de internet.'], ['shapes', 'Ofrecer distintas formas de aprender (ver, escuchar, leer, crear, moverse y jugar en equipo) para que cada estudiante avance a su ritmo.']].map(([ic, d], k) => `<div class="in-card"><span class="n">${k + 1}</span>${icon(ic)}<p>${d}</p></div>`).join('')}</div>`],
        ['ref', 'Referentes del área', 'book', `<p class="muted">Los temas siguen los referentes del Ministerio de Educación Nacional: la Ley 115 de 1994 (art. 23), la Guía 30 <i>Ser competente en tecnología</i> (MEN, 2008) y las <i>Orientaciones curriculares para el área de Tecnología e Informática</i> (MEN, 2022). Toca cada componente:</p>
           <div class="in-comps">${comps.map(([t2, d], k) => `<details class="in-comp"><summary><span class="n">${k + 1}</span><b>${t2}</b></summary><p>${d}</p></details>`).join('')}</div>`]
      ], tb.obj || 'gen');
    }
    if (id === 'como') return `<div class="in-steps">${[['Elige tu grado', 'Arriba está el botón <b>Grado</b>. Puedes cambiarlo cuando quieras.', 'grad'], ['Escoge una sección', 'Realidad aumentada, 3D, estudio, videos, juegos… cada una funciona por separado.', 'list'], ['Practica y gana estrellas', 'Responde, juega y crea. Si algo no sale, ¡sigue intentando! Siempre hay otra oportunidad.', 'star']].map(([t, d, ic], k) => `<div class="card"><span class="n">${k + 1}</span>${icon(ic, 'in-step-ic')}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
      <div class="in-try"><b>${icon('sparkle')} Pruébalo ya:</b><div class="row">${['ar', 'explore', 'games'].map(r => { const n = NAV.find(x => x.id === r); return `<button class="btn" data-goto="${r}">${icon(n.ic)}${n.n}</button>`; }).join('')}</div></div>`;
    if (id === 'grados') {
      const pane = t => { const nuevas = PARTS.filter(p => p.g === t && Models.has(p.id)).concat(Models.extras.filter(p => p.g === t && Models.has(p.id)));
        return `<div class="in-grade-pane" data-grade-preview="${t}"><div class="card"><h3>${GRADES[t].adj} grado · ${GRADES[t].team}</h3><p class="muted">${esc(GRADES[t].lead)}</p>
          <div class="in-gcols"><div><h4>${icon('book')} Temas</h4><ul class="in-list">${TOPICS[t].map(x => `<li>${esc(x.t)}</li>`).join('')}</ul></div>
          <div><h4>${icon('cube')} Modelos 3D nuevos</h4>${nuevas.length ? `<div class="mini-parts">${nuevas.slice(0, 8).map(p => `<span class="mini-part">${thumbHTML(p.id)}<span>${esc(p.n)}</span></span>`).join('')}</div>` : '<p class="small muted">Repaso de los grados anteriores.</p>'}</div></div>
          <button class="btn btn-primary" data-pick="${t}">${icon('arrowR')}Entrar a ${t}.°</button></div></div>`; };
      return `<p class="muted in-p-lead">En 1.° se empieza por reconocer el computador y cuidarlo; en 5.° se habla del computador como sistema, del pensamiento computacional y de la energía. Toca cada grado para ver qué aprende:</p>
        ${this.tabs('grados', [1, 2, 3, 4, 5].map(n => [String(n), `${n}.° ${GRADES[n].team}`, '', pane(n)]), String(tb.grados || g))}`;
    }
    if (id === 'talleres') return `<div class="in-work">
        <div class="card in-ar"><h3>${icon('scan')} Realidad aumentada con marcador</h3><ol class="steps"><li><span>Descarga e imprime el marcador (tamaño carta). Uno solo sirve para todos los modelos.</span></li><li><span>Elige la cámara <b>trasera</b> (celular o tableta) o la <b>frontal</b> (computador o selfie).</span></li><li><span>Pon el marcador <b>a un lado</b> de la cámara: así queda espacio para tus manos. El modelo aparece sobre el marcador y lo manejas con botones, con los dedos o con gestos de la mano.</span></li></ol>
          <div class="row"><button class="btn btn-sm" data-in="marker">${icon('qr')}Ver el marcador</button><button class="btn btn-sm btn-primary" data-goto="ar">${icon('scan')}Ir a la RA</button></div></div>
        <div class="card"><h3>${icon('vr')} Realidad virtual</h3><p>Un laboratorio 360° con los modelos en pedestales. Funciona en pantalla, con visor tipo Cardboard o con visores compatibles.</p><button class="btn btn-sm" data-goto="vr">${icon('vr')}Ir a la RV</button>
          <h3 style="margin-top:16px">${icon('target')} RA sin marcador</h3><p>En celulares Android compatibles, el modelo se coloca sobre el piso o la mesa.</p></div>
        <div class="card"><h3>${icon('cube')} 25 modelos 3D reales</h3><p>Modelos <span class="kbd">.glb</span> que se giran y se acercan: 5 nuevos en cada grado. También se pueden subir modelos nuevos desde la app y verlos en 3D, RA y RV.</p><button class="btn btn-sm" data-goto="explore">${icon('cube')}Ir al visor 3D</button></div>
      </div>`;
    if (id === 'gestos') {
      const hero = Models.has(GRADES[g].hero) ? GRADES[g].hero : Models.viewableAll()[0]?.id;
      return `${this.tabs('gestos', [['mano', 'Con la mano (cámara)', 'hand', gesturesHTML('mano')], ['dedos', 'Con los dedos', 'smartphone', gesturesHTML('dedos')], ['crear', 'Zona de creación', 'brush', gesturesHTML('crear')], ['rv', 'Realidad virtual', 'vr', gesturesHTML('rv')]], tb.gestos || 'mano')}
        ${hero && (GL.ok || ENV.webgl) ? `<div class="in-try"><b>${icon('camera')} ¿Lo intentamos?</b><div class="row"><button class="btn btn-primary btn-lg" data-trymano="${hero}">${icon('hand')}Probar con mi cámara</button><button class="btn btn-lg" data-goto="ar">${icon('scan')}Usarlo en la RA</button></div></div>` : ''}`;
    }
    if (id === 'todo') {
      const feats = [
        ['ar', 'scan', 'Realidad aumentada', 'Las partes aparecen sobre tu mesa con un solo marcador. Misiones por grado.'],
        ['explore', 'cube', 'Explorar en 3D', 'Modelos 3D reales que giras y acercas con los dedos o con tu mano.'],
        ['vr', 'vr', 'Realidad virtual', 'Un laboratorio virtual para recorrer en pantalla o con visor.'],
        ['study', 'book', 'Estudio', 'Lecciones, tarjetas de repaso y quices que cambian cada vez.'],
        ['videos', 'video', 'Aprende con videos', 'Videos educativos seleccionados por tema y grado.'],
        ['sim', 'sim', 'Simulador', 'Conecta los cables, enciende el computador y arma la CPU.'],
        ['games', 'game', 'Minijuegos', 'Clasifica, encuentra parejas, adivina palabras y practica el teclado.'],
        ['create', 'brush', 'Zona de creación', 'Dibuja con la mano frente a la cámara y resuelve retos.'],
        ['manera', 'shapes', 'Aprende a tu manera', 'Actividades para cada forma de aprender.'],
        ['chat', 'chat', 'Asistente de preguntas', 'Resuelve dudas de los temas aunque escribas con errores.']];
      return `<p class="muted in-p-lead">Toca una sección para ir directo a ella (entrarás con el grado ${g}.°).</p><div class="in-feats">${feats.map(([r, ic, t, d]) => `<button type="button" class="in-feat" data-goto="${r}"><span class="fi">${icon(ic)}</span><div><b>${t}</b><p>${d}</p></div>${icon('arrowR', 'in-feat-go')}</button>`).join('')}</div>`;
    }
    if (id === 'antes') return `<div class="in-tips">
        <div>${icon('camera')}<p><b>Cámara:</b> la RA, los gestos con la mano y la zona de creación piden permiso para usar la cámara; toca <b>Permitir</b>. Las imágenes se procesan en el mismo dispositivo; nada se envía a internet.</p></div>
        <div>${icon('switchcam')}<p><b>Cámara frontal o trasera:</b> en la RA puedes elegir cuál usar y cambiarla en cualquier momento.</p></div>
        <div>${icon('globe')}<p><b>Navegador:</b> funciona mejor en Chrome, Edge o Safari actualizados. Si abriste el enlace desde WhatsApp o Instagram, ábrelo en Chrome.</p></div>
        <div>${icon('download')}<p><b>Sin internet:</b> los 25 modelos 3D, la realidad aumentada y las actividades vienen con la app (el index.html y sus carpetas) y funcionan sin conexión. Si abres el index.html con doble clic, déjalo junto a sus carpetas. Los videos necesitan internet (y los gestos con la mano, si abres el index.html con doble clic).</p></div>
        <div>${icon('save')}<p><b>Progreso:</b> se guarda solo en este dispositivo.</p></div>
        <div>${icon('smartphone')}<p><b>Apps:</b> también hay app para Android, Windows y Mac.</p></div>
      </div>
      <div class="in-try"><b>${icon('camera')} Revisa tu cámara:</b><div class="row"><button class="btn" data-camtest>${icon('webcam')}Probar la cámara</button><span class="small muted" id="camTestMsg" aria-live="polite"></span></div></div>`;
    if (id === 'creditos') return `<div class="in-credits big">
        <div class="in-person"><span class="av">${icon('user')}</span><div><small>Aplicación elaborada por</small><b>${AUTORA}</b></div></div>
        <div class="in-person"><span class="av av-2">${icon('grad')}</span><div><small>Docente asesor</small><b>${PROFESOR}</b></div></div></div>
      <div class="in-cards">${[['cube', 'Modelos 3D', 'Sketchfab, con licencias Creative Commons.'], ['video', 'Videos', 'YouTube, con el nombre de cada canal.'], ['hand', 'Mano', 'MediaPipe Hands (Google).'], ['code', '3D', 'three.js y js-aruco2.'], ['globe', 'Repositorio', 'GitHub y GitHub Pages.']].map(([ic, t, d]) => `<div class="in-card">${icon(ic)}<p><b>${t}</b><br>${d}</p></div>`).join('')}</div>
      <p style="margin-top:16px"><button class="btn btn-primary" data-in="credits">${icon('list')}Ver todos los créditos</button></p>`;
    if (id === 'grado') {
      const first = !!Store.data.firstVisit;
      return `<p class="muted in-p-lead" style="text-align:center">Toca tu grado. Podrás cambiarlo después con el botón <b>Grado</b> de la parte superior.</p>
        <div class="in-pick" role="radiogroup" aria-label="Grado escolar">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="in-pick-g" role="radio" aria-checked="${!first && n === g}" data-pick="${n}"><span class="k">Grado</span><b>${n}.°</b><span class="nm">${GRADES[n].adj} grado</span><small>${GRADES[n].team}</small></button>`).join('')}</div>
        ${first ? '' : `<p style="text-align:center;margin-top:16px"><button class="btn btn-primary btn-lg" data-pick="${g}">${icon('arrowR')}Entrar a ${g}.° (${GRADES[g].adj.toLowerCase()} grado)</button></p>`}`;
    }
    return '';
  }
};

/* ---------- Créditos: aplicación, modelos 3D, videos, bibliotecas y plataformas ---------- */
const LIBRERIAS = [
  ['three.js r170', 'Motor 3D para los modelos, la realidad aumentada y la realidad virtual.', 'MIT', 'https://threejs.org'],
  ['MediaPipe Hands (Google)', 'Reconocimiento de la mano con la cámara: gestos para girar y hacer zoom en la RA y el visor 3D, y dibujo en la zona de creación.', 'Apache 2.0', 'https://github.com/google-ai-edge/mediapipe'],
  ['js-aruco2 (Damiano Falcioni y Juan Mellado)', 'Detección del marcador de realidad aumentada.', 'MIT', 'https://github.com/damianofalcioni/js-aruco2'],
  ['Draco (Google) y meshoptimizer (Arseny Kapoulkine)', 'Descompresión de modelos 3D livianos.', 'Apache 2.0 / MIT', 'https://github.com/zeux/meshoptimizer'],
  ['glTF-Transform (Don McCurdy)', 'Herramienta usada para optimizar los modelos .glb para la web.', 'MIT', 'https://gltf-transform.dev'],
  ['Lucide', 'Iconos de la interfaz.', 'ISC', 'https://lucide.dev'],
  ['Fuentes Sora y Lexend', 'Tipografías de títulos y textos.', 'SIL OFL 1.1', 'https://fonts.google.com'],
  ['Web Speech API', 'Lectura en voz alta y dictado.', '', 'https://developer.mozilla.org/es/docs/Web/API/Web_Speech_API']
];
const PLATAFORMAS = [
  ['GitHub', 'Repositorio de la aplicación y publicación web con GitHub Pages.', 'https://github.com'],
  ['Sketchfab', 'Fuente de los modelos 3D realistas (.glb) con licencias Creative Commons.', 'https://sketchfab.com'],
  ['YouTube', 'Plataforma de los videos educativos enlazados.', 'https://www.youtube.com']
];
function creditsHTML() {
  const link = (u, t) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : t;
  const mods = Object.entries(Models.credits).map(([id, c]) => ({ id, c, p: Models.find(id) })).sort((a, b) => (a.p?.n || '').localeCompare(b.p?.n || '', 'es'));
  return `<div class="credits">
    <section><h3>${icon('user')} Aplicación</h3><p><b>TECNO LAB</b> · Laboratorio interactivo de Tecnología e Informática para básica primaria.<br>Aplicación elaborada por: <b>${AUTORA}</b><br>Docente asesor: <b>${PROFESOR}</b></p></section>
    <section><h3>${icon('cube')} Modelos 3D <small>(Sketchfab)</small></h3>
      ${mods.length ? `<div class="cr-table" role="table">${mods.map(({ c, p }) => `<div class="cr-row" role="row"><b role="cell">${esc(p?.n || c.archivo)}</b><span role="cell">${link(c.fuente, esc(c.titulo || c.archivo))}</span><span role="cell">${c.perfil ? link(c.perfil, esc(c.autor)) : esc(c.autor || '—')}</span><span role="cell">${c.licencia_url ? link(c.licencia_url, esc(c.licencia)) : esc(c.licencia || '—')}</span></div>`).join('')}</div>
      <p class="small muted">Los modelos pertenecen a sus autores y se usan con fines educativos según su licencia Creative Commons. Para la web se optimizaron (menos polígonos, texturas más livianas y compresión) sin cambiar su forma. Los modelos subidos desde la app quedan solo en el dispositivo de quien los sube.</p>` : '<p class="small muted">Aún no hay modelos publicados.</p>'}</section>
    <section><h3>${icon('video')} Videos <small>(YouTube)</small></h3><ul class="cr-list">${VIDEOS.map(v => { const i = videoInfo(v); return `<li>${link('https://www.youtube.com/watch?v=' + v.id, '«' + esc(i.t) + '»')}${i.canal ? ` · Canal: ${esc(i.canal)}` : ' · Canal indicado en YouTube'} <span class="small muted">(${v.temas.map(t => TOPIC[t]?.t).filter(Boolean).map(esc).join(', ')})</span></li>`; }).join('')}</ul>
      <p class="small muted">Los videos se reproducen desde YouTube con su reproductor oficial y pertenecen a sus canales.</p></section>
    <section><h3>${icon('code')} Bibliotecas y herramientas</h3><ul class="cr-list">${LIBRERIAS.map(([n, d, l, u]) => `<li>${link(u, `<b>${n}</b>`)} · ${d} <span class="small muted">${l ? 'Licencia ' + l + '.' : 'Función incluida en el navegador.'}</span></li>`).join('')}</ul></section>
    <section><h3>${icon('globe')} Plataformas</h3><ul class="cr-list">${PLATAFORMAS.map(([n, d, u]) => `<li>${link(u, `<b>${n}</b>`)} · ${d}</li>`).join('')}</ul></section>
    <section><h3>${icon('book')} Referentes pedagógicos</h3><ul class="cr-list">
      <li>Ministerio de Educación Nacional. Ley 115 de 1994 (Ley General de Educación), artículo 23.</li>
      <li>Ministerio de Educación Nacional (2008). <i>Ser competente en tecnología: ¡una necesidad para el desarrollo!</i> Guía 30.</li>
      <li>Ministerio de Educación Nacional (2022). <i>Orientaciones curriculares para el área de Tecnología e Informática en la educación básica y media.</i></li>
      <li>Gardner, H. (1983). <i>Frames of Mind: The Theory of Multiple Intelligences.</i></li></ul></section>
  </div>`;
}
function showCredits() { openModal({ title: 'Créditos', wide: true, body: creditsHTML(), actions: [{ label: 'Cerrar', cls: 'btn-primary' }] }); }
