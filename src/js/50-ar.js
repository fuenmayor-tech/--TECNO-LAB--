/* =====================================================================
   Realidad aumentada
   · Con marcador (ArUco id 42): funciona en computadores, tabletas y
     celulares con cámara, incluido iPhone. Detección y pose en el propio
     navegador (js-aruco2 + POSIT) y dibujo con three.js sobre el video.
   · Sin marcador (WebXR immersive-ar): solo en navegadores compatibles
     (por ejemplo Chrome en Android con ARCore).
   ===================================================================== */
const MARKER_BITS = '001000101110010101101101010000001000'; // ARUCO_MIP_36h12 · id 42 (6×6)
function markerSVG({ quiet = 1, title = false } = {}) {
  const n = 6, N = n + 2 + quiet * 2; let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (MARKER_BITS[y * n + x] === '1') r += `<rect x="${x + 1 + quiet}" y="${y + 1 + quiet}" width="1.02" height="1.02" fill="#fff"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="Marcador TECNO LAB"><rect width="${N}" height="${N}" fill="#fff"/><rect x="${quiet}" y="${quiet}" width="${n + 2}" height="${n + 2}" fill="#000"/>${r}</svg>`;
}
/* Página carta (21,59 × 27,94 cm) con el marcador de 15 cm */
function markerPage(fmt = 'svg') {
  const W = 2159, H = 2794, side = 1500, x0 = (W - side) / 2, y0 = 560, cell = side / 8;
  let rects = ''; for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) if (MARKER_BITS[y * 6 + x] === '1') rects += `<rect x="${x0 + (x + 1) * cell}" y="${y0 + (y + 1) * cell}" width="${cell + 1}" height="${cell + 1}" fill="#fff"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="215.9mm" height="279.4mm" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="#fff"/>
  <text x="${W / 2}" y="250" font-family="Sora, Arial, sans-serif" font-size="120" font-weight="700" text-anchor="middle" fill="#0b1530">TECNO LAB</text>
  <text x="${W / 2}" y="360" font-family="Lexend, Arial, sans-serif" font-size="58" text-anchor="middle" fill="#3b4a6b">Marcador de realidad aumentada · sirve para todas las partes</text>
  <rect x="${x0}" y="${y0}" width="${side}" height="${side}" fill="#000"/>${rects}
  <text x="${W / 2}" y="${y0 + side + 160}" font-family="Lexend, Arial, sans-serif" font-size="50" text-anchor="middle" fill="#0b1530">Imprime al 100 % (sin ajustar a la página). El cuadro negro debe medir 15 cm.</text>
  <text x="${W / 2}" y="${y0 + side + 240}" font-family="Lexend, Arial, sans-serif" font-size="50" text-anchor="middle" fill="#0b1530">Deja el borde blanco, no dobles la hoja y usa buena luz.</text>
  <text x="${W / 2}" y="${H - 170}" font-family="Lexend, Arial, sans-serif" font-size="46" text-anchor="middle" fill="#6b4a3d">Aplicación elaborada por: Jeniffer Andrea Fuenmayor Díaz · Docente asesor: José Zapata</text>
</svg>`;
  return svg;
}
async function downloadMarker(kind) {
  const svg = markerPage();
  if (kind === 'svg') return downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'marcador-tecnolab.svg');
  const img = await blobToImage(new Blob([svg], { type: 'image/svg+xml' }));
  const c = document.createElement('canvas'); c.width = 2159; c.height = 2794; const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
  c.toBlob(b => b ? downloadBlob(b, 'marcador-tecnolab.png') : toast('No se pudo crear la imagen.', 'bad'), 'image/png');
}
function printMarker() {
  printHTML(`<!doctype html><html><head><meta charset="utf-8"><title>Marcador TECNO LAB</title><style>@page{size:letter;margin:0}html,body{margin:0}svg{display:block;width:215.9mm;height:279.4mm}</style></head><body>${markerPage()}</body></html>`);
}

/* Misiones de realidad aumentada según el grado */
function arMissions(g = Store.grade) {
  return [
    { id: 'free', kind: 'free', ic: 'scan', n: 'Explora libre', d: 'Elige cualquier parte y mírala sobre tu mesa.' },
    { id: 'tour', kind: 'tour', ic: 'route', n: `Recorrido de ${g}.°`, d: 'Las partes de tu grado, una por una y con narración.' },
    { id: 'name', kind: 'quiz', q: ['name'], ic: 'target', n: '¿Qué parte es?', d: 'Aparece una parte misteriosa: elige su nombre.' },
    g >= 2 && { id: 'tipo', kind: 'quiz', q: ['tipo'], ic: 'layers', n: g <= 2 ? '¿Entrada o salida?' : '¿De qué tipo es?', d: 'Observa la parte y di qué tipo de dispositivo es.' },
    g >= 3 && { id: 'fn', kind: 'quiz', q: ['fn'], ic: 'bulb', n: '¿Para qué sirve?', d: 'Relaciona cada parte con su función.' },
    g >= 3 && { id: 'ub', kind: 'quiz', q: ['ub'], ic: 'cpu', n: '¿Dentro o fuera?', d: '¿Va dentro de la torre o es un periférico?' },
    g >= 4 && { id: 'mix', kind: 'quiz', q: ['name', 'tipo', 'fn', 'ub'], ic: 'trophy', n: 'Gran reto RA', d: 'Preguntas mezcladas con todas las partes de tu grado.' }
  ].filter(Boolean);
}
function arListFor(m, g = Store.grade) {
  const base = partsForGrade(g).filter(p => Models.has(p.id));
  if (m.kind === 'tour') { const nuevas = base.filter(p => p.g === g); return nuevas.length >= 3 ? nuevas : base; }
  if (m.kind === 'quiz') return sample(base, Math.min(6, base.length));
  return Models.viewable(g);
}
function showMarkerModal() {
  const body = document.createElement('div');
  body.innerHTML = `<div class="marker-preview" style="max-width:360px">${markerSVG()}</div><p class="small muted" style="text-align:center">Imprime en tamaño carta al 100 % o muéstralo en otra pantalla. Sirve para todas las partes.</p>`;
  openModal({ title: 'Marcador TECNO LAB', body, actions: [{ label: 'PNG', icon: 'download', close: false, onClick: () => downloadMarker('png') }, { label: 'SVG', icon: 'download', close: false, onClick: () => downloadMarker('svg') }, { label: 'Imprimir', icon: 'printer', cls: 'btn-primary', close: false, onClick: printMarker }] });
}
Views.ar = {
  sel: null, all: false, xrOK: false, mission: 'free',
  async enter(el, args, q) {
    const g = Store.grade, missions = arMissions(g);
    if (q.mission && missions.some(m => m.id === q.mission)) this.mission = q.mission;
    if (!missions.some(m => m.id === this.mission)) this.mission = 'free';
    if (q.part && Models.has(q.part)) { this.mission = 'free'; this.sel = q.part; }
    if (!Models.viewable().length && Models.count()) this.all = true;
    let list = this.all ? Models.viewableAll() : Models.viewable();
    if (this.sel && Models.has(this.sel) && !list.find(p => p.id === this.sel)) { this.all = true; list = Models.viewableAll(); }
    if (!this.sel || !list.find(p => p.id === this.sel)) this.sel = list[0]?.id || null;
    const none = !list.length;
    this.xrOK = !!(navigator.xr && await navigator.xr.isSessionSupported?.('immersive-ar').catch(() => false));
    const M = missions.find(m => m.id === this.mission);
    const ok = (b, t) => `<div>${icon(b ? 'check' : 'info', b ? 'ok' : 'no')}<span class="${b ? '' : 'muted'}">${t}</span></div>`;
    const preview = M.kind === 'free' ? '' : arListFor(M, g);
    const empty = none || (M.kind !== 'free' && !preview.length);
    const facing = Store.data.arFacing || (ENV.touch ? 'environment' : 'user'), handOn = Store.data.arHand ?? true;
    el.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">${icon('scan')} Realidad aumentada · Grado ${GRADES[g].n}</span><h2>Haz aparecer las partes sobre tu mesa</h2><p>Un solo marcador sirve para todas las partes. Elige una misión de <span style="white-space:nowrap">${g}.°</span>, inicia la cámara y pon el marcador <b>a un lado</b> (impreso o en otra pantalla): el otro lado queda libre para tus manos.</p></div></div>
      ${!ENV.secure ? `<div class="notice warn">${icon('lock')}<div>La cámara solo funciona si TECNO LAB está publicado con <b>https</b> (por ejemplo GitHub Pages) o abierto en <b>localhost</b>.</div></div>` : ''}
      <h3>1. Elige una misión</h3>
      <div class="mission-row" style="margin-bottom:20px">${missions.map(m => `<button class="mission-chip" data-m="${m.id}" aria-pressed="${m.id === this.mission}">${icon(m.ic)}<span><b>${esc(m.n)}</b><small>${esc(m.d)}</small></span></button>`).join('')}</div>
      <div class="ar-layout">
        <div class="card">
          ${none ? `<h3>2. Elige la parte</h3>${noModelsHTML('RA')}` : M.kind !== 'free' && !preview.length ? `<h3>2. ${esc(M.n)}</h3><div class="notice">${icon('info')}<div>Esta misión usa las partes de ${g}.° y todavía no hay modelos 3D de ellas. Prueba la misión <b>Explora libre</b> con los modelos disponibles o carga los modelos de tu grado.</div></div>`
          : M.kind === 'free' ? `<div class="row-between" style="margin-bottom:12px"><h3 style="margin:0">2. Elige el modelo</h3>
            <div class="row"><button class="fchip" id="arAll" aria-pressed="${this.all}">Todos los grados</button><button class="btn btn-sm" id="arUp">${icon('upload')}Subir modelo</button></div></div>
          <div class="grid grid-parts" id="arGrid">${list.map(p => partCard(p, { pressed: p.id === this.sel, tag: false })).join('')}</div>`
          : `<h3>2. ${esc(M.n)}</h3><p class="muted">${M.kind === 'tour' ? 'Verás estas partes una por una. Cuando aparezca cada una sobre el marcador escucharás su explicación.' : `Aparecerán ${preview.length} partes al azar de tu grado; cada vez son diferentes. Responde mirando el modelo sobre el marcador. ¡Gana estrellas!`}</p>
          ${M.kind === 'tour' ? `<div class="mini-parts">${preview.map(p => `<span class="mini-part">${thumbHTML(p.id)}<span>${esc(p.n)}</span></span>`).join('')}</div>` : `<div class="mini-parts">${preview.map(() => `<span class="mini-part"><span class="ic" style="display:grid;place-items:center;font-weight:800">?</span><span>Parte misteriosa</span></span>`).join('')}</div>`}`}
        </div>
        <div class="stack">
          <div class="card marker-card">
            <h3 style="margin:0">3. Ten listo el marcador</h3>
            <div class="marker-preview">${markerSVG()}</div>
            <div class="row" style="justify-content:center"><button class="btn btn-sm" id="mkPng">${icon('download')}PNG</button><button class="btn btn-sm" id="mkSvg">${icon('download')}SVG</button><button class="btn btn-sm" id="mkPrint">${icon('printer')}Imprimir</button></div>
            <p class="small muted" style="margin:0;text-align:center">Imprime en tamaño carta al 100 %. También puedes mostrarlo en la pantalla de otro dispositivo.</p>
          </div>
          <div class="card">
            <h3 style="margin:0 0 10px">4. ¿Qué cámara vas a usar?</h3>
            <div class="cam-pick" role="group" aria-label="Cámara">
              <button type="button" class="cam-opt" data-cam="environment" aria-pressed="${facing === 'environment'}">${icon('camera')}<span><b>Cámara trasera</b><small>Apunta el celular o la tableta al marcador</small></span></button>
              <button type="button" class="cam-opt" data-cam="user" aria-pressed="${facing === 'user'}">${icon('webcam')}<span><b>Cámara frontal</b><small>Selfie o cámara del computador</small></span></button>
            </div>
            <button type="button" class="hand-toggle" id="arHandOpt" aria-pressed="${handOn}">${icon('hand')}<span><b>Manejar con gestos de la mano</b><small>🙌 separar o juntar las manos: tamaño · ☝️ señalar botones · 🖐️ quieto · ✊ girar · ✌️ siguiente</small></span><i class="sw" aria-hidden="true"></i></button>
            <ol class="steps" style="margin-top:14px"><li><span>Toca <b>Iniciar</b> y luego <b>Permitir</b> cuando el navegador pregunte por la cámara.</span></li><li><span>Pon el marcador <b>a un lado</b>, dentro del recuadro, y deja el otro lado libre para tus manos. Apunta desde unos 30 a 60 cm, con buena luz.</span></li><li><span>Gira y cambia el tamaño con los botones, con los dedos o con gestos de la mano.</span></li></ol>
            <button class="btn btn-primary btn-lg btn-block" id="arStart" style="margin-top:16px" ${empty ? 'disabled' : ''}>${icon('camera')}Iniciar: ${esc(M.n)}</button>
            ${this.xrOK && M.kind === 'free' && !empty ? `<button class="btn btn-block" id="arXR" style="margin-top:10px">${icon('target')}RA sin marcador (sobre el piso o la mesa)</button>` : ''}
            <div class="compat" style="margin-top:14px">${ok(ENV.hasCamera, 'Cámara disponible en el navegador')}${ok(ENV.secure, 'Conexión segura (https o localhost)')}${ok(GL.ok, 'Gráficos 3D (WebGL)')}${ok(this.xrOK, this.xrOK ? 'RA sin marcador (WebXR) disponible' : 'RA sin marcador: solo en Android compatible; aquí se usa el marcador')}</div>
          </div>
        </div>
      </div>`;
    $$('[data-m]', el).forEach(b => b.onclick = () => { this.mission = b.dataset.m; Router.go('ar?mission=' + this.mission); });
    $$('#arGrid [data-part]', el).forEach(b => b.onclick = () => { this.sel = b.dataset.part; $$('#arGrid [data-part]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#arAll', el)?.addEventListener('click', () => { this.all = !this.all; Router.route(); });
    $('#arUp', el)?.addEventListener('click', () => openUploadDialog(null, key => { this.sel = key; this.mission = 'free'; Router.go('ar?mission=free'); }));
    bindNoModels(el, key => { this.sel = key; this.mission = 'free'; Router.go('ar?mission=free'); });
    $$('[data-cam]', el).forEach(b => b.onclick = () => { Store.data.arFacing = b.dataset.cam; Store.save(); $$('[data-cam]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#arHandOpt', el).onclick = e => { const on = !(Store.data.arHand ?? true); Store.data.arHand = on; Store.save(); e.currentTarget.setAttribute('aria-pressed', on); };
    $('#mkPng', el).onclick = () => downloadMarker('png'); $('#mkSvg', el).onclick = () => downloadMarker('svg'); $('#mkPrint', el).onclick = printMarker;
    $('#arStart', el).onclick = () => {
      if (empty) return;
      if (M.kind === 'free') return ARRun.start(this.sel, list, M);
      ARRun.start(preview[0].id, preview, M);
    };
    $('#arXR', el)?.addEventListener('click', () => XRAR.start(this.sel));
  },
  leave() { ARRun.stop(); },
  onGrade() { Router.route(); }
};

/* ---------- Motor de RA con marcador ---------- */
const ARRun = {
  on: false, stream: null, facing: 'environment', mirror: false, list: [], idx: 0, scale: 1.1, spin: !ENV.reduced, label: true, side: 'right',
  /* El recuadro del marcador va a un lado (derecha o izquierda) para que las manos tengan espacio; también puede ir al centro */
  SIDES: { right: 'a la derecha', left: 'a la izquierda', center: 'en el centro' },
  applySide() {
    const s = this.side = ['right', 'left', 'center'].includes(Store.data.arSide) ? Store.data.arSide : 'right';
    $('#arStage').dataset.side = s;
    const next = { right: 'left', left: 'center', center: 'right' }[s], b = $('#arSide');
    if (b) { b.innerHTML = `<span aria-hidden="true">⇄</span> ${next === 'center' ? 'Recuadro al centro' : 'Recuadro ' + this.SIDES[next]}`; b.setAttribute('aria-label', 'Mover el recuadro del marcador ' + this.SIDES[next]); }
    const t = $('#arGuideText'); if (t) t.textContent = s === 'center' ? 'Apunta al marcador TECNO LAB' : 'Pon aquí el marcador';
    if (this.on && !this._seen) this.status(this.aimText());
  },
  aimText() { return this.side === 'center' ? 'Apunta la cámara al marcador' : this.hands ? `Pon el marcador ${this.SIDES[this.side]}; tus manos, al otro lado` : `Pon el marcador ${this.SIDES[this.side]}, en el recuadro`; },
  async start(partId, list, mission = { id: 'free', kind: 'free' }) {
    if (this.on) return;
    if (!GL.ok) { toast('La realidad aumentada necesita gráficos 3D (WebGL), que no están disponibles aquí.', 'bad'); return; }
    this.list = list.map(p => p?.id || p).filter(id => id && Models.has(id));
    if (!this.list.length && Models.has(partId)) this.list = [partId];
    if (!this.list.length) { toast('Todavía no hay modelos 3D para mostrar en realidad aumentada. La profesora puede cargarlos con “Subir modelo”.', 'info', 5000); return; }
    this.idx = Math.max(0, this.list.indexOf(partId));
    this.mission = { kind: 'free', ...mission }; this.score = 0; this.done = 0; this.firstTry = true;
    const quiz = this.mission.kind === 'quiz'; this.label = !quiz;
    $('#arInfo').setAttribute('aria-pressed', this.label); $('#arPrev').hidden = quiz; $('#arNext').hidden = quiz;
    const st = $('#arStage'); st.hidden = false; document.body.style.overflow = 'hidden'; this.on = true;
    HandControl.stop();
    this.facing = Store.data.arFacing || (ENV.touch ? 'environment' : 'user');
    this.bindHUD(); this.applySide(); this.syncHUD();
    /* Primero la cámara (así el navegador muestra enseguida la pregunta de permiso) */
    this.ready = false;
    if (!(await this.openStream())) return;
    await this.boot();
  },
  async boot() {
    this.status('Preparando el detector…');
    try { await Libs.aruco(); } catch { this.fail('No se pudo cargar el detector de marcadores. Revisa que la carpeta lib/ esté junto al index.html o que haya internet.'); return; }
    if (!this.on) return;
    const T = GL.T;
    if (!this.scene) {
      this.scene = new T.Scene(); GL.studio(this.scene);
      this.root = new T.Group(); this.root.matrixAutoUpdate = false; this.root.visible = false; this.scene.add(this.root);
      this.content = new T.Group(); this.content.rotation.x = Math.PI / 2; this.root.add(this.content);
      this.content.add(GL.contactShadow(1.6, .5));
      this.tilt = new T.Group(); this.content.add(this.tilt);
      this.yaw = new T.Group(); this.tilt.add(this.yaw);
      this.cam = new T.PerspectiveCamera(45, 1, .01, 100);
      this.sPos = new T.Vector3(); this.sQuat = new T.Quaternion(); this.tm = new T.Matrix4(); this.tPos = new T.Vector3(); this.tQuat = new T.Quaternion(); this.tScl = new T.Vector3(); this.qa = new T.Quaternion(); this.one = new T.Vector3(1, 1, 1);
      this.detector = new AR.Detector({ dictionaryName: MARKER_DICT });
      this.detCanvas = document.createElement('canvas'); this.detCtx = this.detCanvas.getContext('2d', { willReadFrequently: true });
    }
    this.has = false; this.lastSeen = 0; this.frameN = 0; this.detMs = 15; this.every = 1; this.foundOnce = false;
    this.tilt.rotation.x = 0; this.yaw.rotation.y = 0;
    this.setup(); this.status(this.aimText());
    this.loadPart();
    this.ready = true;
    if ((Store.data.arHand ?? true) && !HandEngine.failed) this.startHands(); // si el detector no cargó antes, no se reintenta solo
  },
  /* Abre la cámara elegida (trasera o frontal) y la muestra en el video */
  async openStream() {
    const v = $('#arVideo');
    try {
      stopStream(this.stream); this.stream = null; this.status('Pidiendo permiso para usar la cámara…');
      this.stream = await getCamera(this.facing, 1280, 720);
      if (!this.on) { stopStream(this.stream); this.stream = null; return false; }
      v.srcObject = this.stream; await v.play().catch(() => {});
      await new Promise(r => { if (v.videoWidth) r(); else v.onloadedmetadata = () => r(); });
      const s = this.stream.getVideoTracks()[0].getSettings?.() || {};
      if (s.facingMode === 'user' || s.facingMode === 'environment') this.facing = s.facingMode;
      this.mirror = this.facing === 'user' || (!s.facingMode && !ENV.touch);
      $('#arMirror').setAttribute('aria-pressed', this.mirror); this.syncHUD();
      return true;
    } catch (e) { this.camFail(e); return false; }
  },
  async openCamera() {
    if (!(await this.openStream())) return;
    if (!this.ready) return this.boot();
    this.setup(); this.status(this.aimText());
  },
  camFail(e) {
    this.status('La cámara no abrió');
    const other = this.facing === 'user' ? 'environment' : 'user';
    cameraHelp(e, {
      retry: () => setTimeout(() => this.on && this.openCamera(), 50),
      other: () => { this.facing = other; Store.data.arFacing = other; Store.save(); setTimeout(() => this.on && this.openCamera(), 50); },
      close: () => { if (!this.stream) this.stop(); }
    });
  },
  /* Control con gestos de la mano (MediaPipe) usando la misma cámara de la RA */
  async startHands() {
    const quiz = () => this.mission.kind === 'quiz';
    try {
      await HandControl.start({
        video: $('#arVideo'), mirror: () => this.mirror, hudHost: $('#arStage'), overlayHost: $('#arMedia'),
        handlers: {
          rotate: (dx, dy) => { this.handT = performance.now(); this.yaw.rotation.y += dx; this.tilt.rotation.x = clamp(this.tilt.rotation.x + dy, -.9, .9); },
          zoom: f => { this.handT = performance.now(); this.setScale(f); },
          next: () => { if (quiz()) { HandControl.flash('Responde tocando una opción'); return; } this.idx = (this.idx + 1) % this.list.length; this.loadPart(); },
          reset: () => { this.scale = 1.1; this.setScale(1); this.yaw.rotation.y = 0; this.tilt.rotation.x = 0; },
          hold: () => { this.spin = false; $('#arSpin')?.setAttribute('aria-pressed', 'false'); }
        }
      });
      this.hands = true;
    } catch (e) { this.hands = false; toast(e.message || 'No se pudo activar el control con la mano.', 'info', 5000); }
    this.syncHUD();
  },
  stopHands() { HandControl.stop(); this.hands = false; this.syncHUD(); },
  syncHUD() {
    $('#arHand')?.setAttribute('aria-pressed', !!this.hands); $('#arStage')?.classList.toggle('hands-on', !!this.hands);
    if (this.on && this._seen === false) this.status(this.aimText());
    const f = $('#arSwitch'); if (f) { f.setAttribute('aria-label', this.facing === 'user' ? 'Cambiar a la cámara trasera' : 'Cambiar a la cámara frontal'); const t = f.querySelector('.ar-cam-t'); if (t) t.textContent = this.facing === 'user' ? 'Frontal' : 'Trasera'; }
  },
  setup() {
    const v = $('#arVideo'), vw = v.videoWidth, vh = v.videoHeight, T = GL.T;
    const L = 640, land = vw >= vh; this.dw = land ? L : Math.round(L * vw / vh); this.dh = land ? Math.round(L * vh / vw) : L;
    this.detCanvas.width = this.dw; this.detCanvas.height = this.dh;
    this.f = .76 * Math.max(this.dw, this.dh);
    this.posit = new POS.Posit(1, this.f);
    this.cam.fov = 2 * Math.atan((this.dh / 2) / this.f) * 180 / Math.PI; this.cam.aspect = this.dw / this.dh; this.cam.updateProjectionMatrix();
    this.layout();
    if (!this._onResize) { this._onResize = () => this.on && this.layout(); addEventListener('resize', this._onResize); }
    GL.mount($('#arMedia'), () => {}, false);
    this.last = performance.now(); GL.setLoop(t => this.frame(t));
  },
  layout() {
    const v = $('#arVideo'); if (!v.videoWidth) return; const W = innerWidth, H = innerHeight;
    const s = Math.max(W / v.videoWidth, H / v.videoHeight); const m = $('#arMedia');
    m.style.width = Math.round(v.videoWidth * s) + 'px'; m.style.height = Math.round(v.videoHeight * s) + 'px';
    m.classList.toggle('mirror', this.mirror);
  },
  async loadPart() {
    const id = this.list[this.idx], p = Models.find(id); if (!p) return;
    const quiz = this.mission.kind === 'quiz';
    $('#arPartName').textContent = quiz ? `Parte ${this.idx + 1} de ${this.list.length}` : p.n; $('#arPartType').textContent = quiz ? '★ ' + this.score : [TIPOS[p.tipo]?.n, modelCreditText(id)].filter(Boolean).join(' · ');
    $('#arLabel').textContent = p.n; this.partSeen = false; this.narrated = false;
    if (quiz) this.makeQuestion(p); else if (this.mission.kind === 'tour') this.tourPanel(p); else $('#arQuiz').hidden = true;
    const tok = this._tok = (this._tok || 0) + 1;
    try {
      const inst = await Models.instance(id); if (tok !== this._tok || !this.on) return;
      await GL.precompile(inst, this.cam, this.scene); if (tok !== this._tok || !this.on) return;
      if (this.model) this.yaw.remove(this.model);
      this.model = inst; this.yaw.add(inst); inst.scale.setScalar(this.scale);
    } catch (e) { if (tok !== this._tok) return; if (this.model) { this.yaw.remove(this.model); this.model = null; } this.status(e.message); }
  },
  /* ---- Misiones: preguntas y recorridos sobre el marcador ---- */
  onPartSeen() {
    const p = Models.find(this.list[this.idx]); if (!p) return;
    if (this.mission.kind === 'quiz') { $$('#arQuiz .opt').forEach(b => b.disabled = false); const w = $('#arQuiz .wait'); if (w) w.textContent = 'Elige tu respuesta'; }
    if (this.mission.kind === 'tour' && !this.narrated) { this.narrated = true; Voice.speak(partText(p)); }
  },
  makeQuestion(p) {
    const g = Store.grade, types = this.mission.q || ['name'];
    const tipoOpts = g <= 2 ? ['entrada', 'salida'] : g === 3 ? ['entrada', 'salida', 'almacenamiento'] : ['entrada', 'salida', 'mixto', 'almacenamiento'];
    const pool = partsForGrade(Math.max(g, 2)).filter(x => x.id !== p.id);
    const make = t => {
      if (t === 'tipo' && tipoOpts.includes(p.tipo)) return { q: `¿Esta parte es un dispositivo de…?`, c: TIPOS[p.tipo].n, w: tipoOpts.filter(x => x !== p.tipo).map(x => TIPOS[x].n), exp: TIPOS[p.tipo].d };
      if (t === 'fn' && p.corta) return { q: '¿Para qué sirve esta parte?', c: cap(p.corta), w: sample(pool, 3).map(x => cap(x.corta)), exp: p.fn };
      if (t === 'ub') return { q: '¿Dónde va esta parte?', c: p.ubic === 'interno' ? 'Dentro de la torre' : 'Afuera, es un periférico', w: [p.ubic === 'interno' ? 'Afuera, es un periférico' : 'Dentro de la torre'], exp: p.ubic === 'interno' ? 'Va dentro de la unidad central.' : 'Se conecta por fuera a la unidad central.' };
      if (t === 'name') return { q: '¿Qué parte del computador ves?', c: p.n, w: sample(pool, 3).map(x => x.n), exp: g <= 2 ? p.s : p.fn };
      return null;
    };
    let Q = null; for (const t of shuffle(types)) { Q = make(t); if (Q) break; } if (!Q) Q = make('name');
    const opts = shuffle([Q.c, ...Q.w]); this.Q = { ...Q, opts, ans: opts.indexOf(Q.c) }; this.firstTry = true;
    const box = $('#arQuiz'); box.hidden = false;
    box.innerHTML = `<div class="meta"><span>${esc(this.mission.n || 'Misión')}</span><span>★ ${this.score} · ${this.idx + 1}/${this.list.length}</span></div>
      <p class="q-text">${esc(Q.q)}</p><div class="options">${opts.map((o, k) => `<button class="opt" data-k="${k}" ${this.partSeen ? '' : 'disabled'}><span class="let">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>
      <div class="wait">${this.partSeen ? 'Elige tu respuesta' : 'Primero encuentra la parte en el marcador 👀'}</div>`;
    $$('.opt', box).forEach(b => b.onclick = () => this.answer(+b.dataset.k, b));
  },
  answer(k, btn) {
    const Q = this.Q; if (!Q || this.locked) return;
    if (k === Q.ans) {
      this.locked = true; btn.classList.add('right'); celebrate(btn, 70); if (this.firstTry) this.score++;
      $('#arQuiz .wait').textContent = `${pick(PRAISE)} ${Q.exp || ''}`;
      $('#arPartName').textContent = Models.find(this.list[this.idx]).n;
      setTimeout(() => { this.locked = false; if (!this.on) return; if (this.idx + 1 >= this.list.length) return this.finishMission(); this.idx++; this.loadPart(); }, 1900);
    } else { this.firstTry = false; Sfx.try(); btn.classList.add('tried'); btn.disabled = true; $('#arQuiz .wait').textContent = pick(ENCOURAGE); }
  },
  tourPanel(p) {
    const box = $('#arQuiz'); box.hidden = false; const last = this.idx + 1 >= this.list.length;
    box.innerHTML = `<div class="meta"><span>${esc(this.mission.n || 'Recorrido')}</span><span>${this.idx + 1}/${this.list.length}</span></div>
      <p class="q-text" style="margin-bottom:4px">${esc(p.n)}</p><p class="small" style="margin:0 0 10px;color:#dbe5fb">${esc(Store.grade <= 2 || p.custom ? p.s : p.fn)}</p>
      <div class="row" style="justify-content:space-between"><button class="btn btn-sm" id="arTourSay">${icon('volume')}Escuchar</button><button class="btn btn-sm btn-primary" id="arTourNext">${last ? 'Terminar recorrido' : 'Siguiente parte'} ${icon('right')}</button></div>`;
    $('#arTourSay', box).onclick = () => Voice.toggle(partText(p));
    $('#arTourNext', box).onclick = e => { if (last) { celebrate(e.currentTarget, 120); this.finishMission(); } else { this.idx++; this.loadPart(); } };
  },
  finishMission() {
    const m = this.mission, n = this.list.length;
    const rec = Store.g('games'); const key = 'ra_' + (m.id || 'mision');
    if (m.kind === 'quiz') {
      const st = this.score >= n ? 3 : this.score >= n * .6 ? 2 : 1;
      rec[key] = { plays: (rec[key]?.plays || 0) + 1, best: Math.max(rec[key]?.best || 0, this.score) }; Store.save();
      Sfx.win(); FX.confetti(innerWidth / 2, innerHeight / 3, 160);
      openModal({ title: '¡Misión cumplida!', body: `<div class="result-hero"><div class="stars">${[1, 2, 3].map(i => icon('star', i <= st ? 'on' : '')).join('')}</div><div class="score grad-text">${this.score}/${n}</div><p>${this.score >= n ? '¡Perfecto! Acertaste todas a la primera.' : '¡Muy bien! Juega otra vez: las partes cambian cada vez.'}</p></div>`,
        actions: [{ label: 'Salir', onClick: () => this.stop() }, { label: 'Otra ronda', cls: 'btn-primary', icon: 'refresh', onClick: () => { const list = arListFor(m); this.list = list.map(p => p.id); this.idx = 0; this.score = 0; this.loadPart(); } }] });
    } else {
      rec[key] = { plays: (rec[key]?.plays || 0) + 1 }; Store.save();
      openModal({ title: '¡Recorrido terminado!', body: `<div class="result-hero"><div class="stars">${icon('trophy', 'on')}</div><p>Viste ${n} partes en realidad aumentada. ¿Te atreves con una misión de preguntas?</p></div>`,
        actions: [{ label: 'Salir', onClick: () => this.stop() }, { label: 'Misión ¿Qué parte es?', cls: 'btn-primary', onClick: () => { const mm = arMissions().find(x => x.id === 'name'); const list = arListFor(mm); this.mission = { ...mm }; this.label = false; $('#arPrev').hidden = true; $('#arNext').hidden = true; this.list = list.map(p => p.id); this.idx = 0; this.score = 0; this.loadPart(); } }] });
    }
  },
  detect() {
    const v = $('#arVideo'); if (v.readyState < 2) return;
    const t0 = performance.now();
    this.detCtx.drawImage(v, 0, 0, this.dw, this.dh);
    const img = this.detCtx.getImageData(0, 0, this.dw, this.dh);
    const ms = this.detector.detect(img);
    this.detMs = this.detMs * .9 + (performance.now() - t0) * .1;
    this.every = this.detMs > 45 ? 3 : this.detMs > 26 ? 2 : 1;
    const m = ms.find(x => x.id === MARKER_ID); if (!m) return;
    const W2 = this.dw / 2, H2 = this.dh / 2;
    const pose = this.posit.pose(m.corners.map(c => ({ x: c.x - W2, y: H2 - c.y })));
    const toQ = (R, t, q, pv) => { this.tm.set(R[0][0], R[0][1], -R[0][2], t[0], R[1][0], R[1][1], -R[1][2], t[1], -R[2][0], -R[2][1], R[2][2], -t[2], 0, 0, 0, 1); this.tm.decompose(pv, q, this.tScl); };
    toQ(pose.bestRotation, pose.bestTranslation, this.tQuat, this.tPos);
    if (this.has && pose.alternativeError < pose.bestError * 1.6) {
      const pa = new GL.T.Vector3(); toQ(pose.alternativeRotation, pose.alternativeTranslation, this.qa, pa);
      if (this.qa.angleTo(this.sQuat) < this.tQuat.angleTo(this.sQuat)) { this.tQuat.copy(this.qa); this.tPos.copy(pa); }
    }
    if (!isFinite(this.tPos.z) || this.tPos.z > -.05) return;
    const now = performance.now();
    if (!this.has || now - this.lastSeen > 700) { this.sPos.copy(this.tPos); this.sQuat.copy(this.tQuat); }
    else { this.sPos.lerp(this.tPos, .55); this.sQuat.slerp(this.tQuat, .5); }
    this.has = true; this.lastSeen = now;
  },
  frame(now) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    if (this.frameN++ % this.every === 0) { try { this.detect(); } catch (e) { console.warn(e); } }
    const seen = this.has && now - this.lastSeen < 450;
    this.root.visible = seen;
    if (seen) this.root.matrix.compose(this.sPos, this.sQuat, this.one), this.root.matrixWorldNeedsUpdate = true;
    if (seen !== this._seen) {
      this._seen = seen; $('#arGuide').classList.toggle('hide', seen);
      const s = $('#arStatus'); s.classList.toggle('found', seen); s.textContent = seen ? '¡Marcador encontrado!' : this.aimText();
      if (seen && !this.foundOnce) { this.foundOnce = true; Sfx.click(); if (navigator.vibrate) navigator.vibrate(30); }
    }
    if (seen && !this.partSeen && this.model) { this.partSeen = true; this.onPartSeen(); }
    if (this.spin && !this.dragging && now - (this.handT || 0) > 1800) this.yaw.rotation.y += dt * .6;
    if (this.model) Anim.tick(this.model, now / 1000, dt);
    GL.renderer.render(this.scene, this.cam);
    this.placeLabel(seen);
  },
  placeLabel(seen) {
    const lab = $('#arLabel'); if (!seen || !this.label || !this.model || this.mission.kind === 'quiz') { lab.hidden = true; return; }
    const T = GL.T; const p = new T.Vector3(0, (this.model.userData.h || 1) * this.scale + .12, 0);
    this.yaw.localToWorld(p); p.project(this.cam);
    if (p.z > 1) { lab.hidden = true; return; }
    const r = $('#arMedia').getBoundingClientRect(); let fx = (p.x + 1) / 2; if (this.mirror) fx = 1 - fx;
    lab.hidden = false; lab.style.left = (r.left + fx * r.width) + 'px'; lab.style.top = (r.top + (1 - p.y) / 2 * r.height) + 'px';
  },
  setScale(f) { this.scale = clamp(this.scale * f, .3, 4); if (this.model) this.model.scale.setScalar(this.scale); },
  photo() {
    const v = $('#arVideo'); if (!v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; const x = c.getContext('2d');
    x.save(); if (this.mirror) { x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(v, 0, 0, c.width, c.height);
    GL.renderer.render(this.scene, this.cam); x.drawImage(GL.canvas, 0, 0, c.width, c.height); x.restore();
    const p = Models.find(this.list[this.idx]);
    const bh = Math.round(c.height * .07); x.fillStyle = 'rgba(8,14,30,.7)'; x.fillRect(0, c.height - bh, c.width, bh); x.fillStyle = '#fff'; x.font = `600 ${Math.round(bh * .42)}px Lexend, sans-serif`; x.fillText(`TECNO LAB · ${p ? p.n : ''}`, bh * .4, c.height - bh * .34);
    c.toBlob(b => { if (!b) return toast('No se pudo tomar la foto.', 'bad'); downloadBlob(b, `tecnolab-ra-${this.list[this.idx]}.png`); toast('Foto guardada en descargas.', 'ok'); }, 'image/png');
    const fl = document.createElement('div'); fl.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:1001;opacity:.8;transition:opacity .4s;pointer-events:none'; $('#arStage').appendChild(fl); requestAnimationFrame(() => fl.style.opacity = '0'); setTimeout(() => fl.remove(), 450);
  },
  status(t) { $('#arStatus').textContent = t; },
  fail(msg) {
    this.status('No se pudo iniciar');
    openModal({ title: 'No se pudo abrir la realidad aumentada', body: `<p>${esc(msg)}</p><p class="muted small">Mientras tanto puedes ver la parte en el visor 3D.</p>`, actions: [{ label: 'Ver en 3D', onClick: () => { const id = this.list[this.idx]; this.stop(); Router.go('explore/' + id); } }, { label: 'Cerrar', cls: 'btn-primary', onClick: () => this.stop() }] });
  },
  bindHUD() {
    if (this._bound) return; this._bound = true;
    const set = (id, ic) => $(id).innerHTML = icon(ic);
    set('#arClose', 'x'); $('#arSwitch').innerHTML = icon('switchcam') + '<span class="ar-cam-t">Trasera</span>'; $('#arHand').innerHTML = icon('hand') + '<span>Manos</span>'; set('#arMarkerBtn', 'qr'); $('#arMarkerBtn').onclick = showMarkerModal; set('#arPrev', 'left'); set('#arNext', 'right'); set('#arSmaller', 'minus'); set('#arBigger', 'plus'); set('#arSpin', 'rotate'); set('#arInfo', 'info'); set('#arMirror', 'mirror'); set('#arSpeak', 'volume'); set('#arShot', 'camera');
    $('#arClose').onclick = () => this.stop();
    $('#arSide').onclick = () => { Store.data.arSide = { right: 'left', left: 'center', center: 'right' }[this.side] || 'right'; Store.save(); this.applySide(); };
    $('#arPrev').onclick = () => { this.idx = (this.idx - 1 + this.list.length) % this.list.length; this.loadPart(); };
    $('#arNext').onclick = () => { this.idx = (this.idx + 1) % this.list.length; this.loadPart(); };
    $('#arSmaller').onclick = () => this.setScale(.8); $('#arBigger').onclick = () => this.setScale(1.25);
    $('#arSpin').onclick = e => { this.spin = !this.spin; e.currentTarget.setAttribute('aria-pressed', this.spin); };
    $('#arSpin').setAttribute('aria-pressed', this.spin);
    $('#arInfo').onclick = e => { this.label = !this.label; e.currentTarget.setAttribute('aria-pressed', this.label); };
    $('#arMirror').onclick = e => { this.mirror = !this.mirror; e.currentTarget.setAttribute('aria-pressed', this.mirror); this.layout(); };
    $('#arSpeak').onclick = () => { const p = Models.find(this.list[this.idx]); if (p) Voice.toggle(partText(p)); };
    $('#arShot').onclick = () => this.photo();
    $('#arSwitch').onclick = async () => {
      const devs = (await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter(d => d.kind === 'videoinput');
      if (devs.length && devs.length < 2) { toast('Este dispositivo tiene una sola cámara.', 'info'); return; }
      this.facing = this.facing === 'environment' ? 'user' : 'environment'; Store.data.arFacing = this.facing; Store.save();
      GL.stop(); await this.openCamera();
    };
    $('#arHand').onclick = () => { const on = !this.hands; Store.data.arHand = on; Store.save(); if (on) this.startHands(); else this.stopHands(); };
    const st = $('#arStage'), pts = new Map(); let base = null;
    st.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); st.setPointerCapture?.(e.pointerId); if (pts.size === 2) { const [a, b] = [...pts.values()]; base = { d: Math.hypot(a.x - b.x, a.y - b.y), s: this.scale }; } this.dragging = true; });
    st.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && base) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.scale = clamp(base.s * d / base.d, .3, 4); this.model?.scale.setScalar(this.scale); }
      else if (pts.size === 1 && this.yaw) this.yaw.rotation.y += (e.clientX - prev.x) * .012 * (this.mirror ? -1 : 1);
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) base = null; if (!pts.size) this.dragging = false; };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('wheel', e => { e.preventDefault(); this.setScale(e.deltaY < 0 ? 1.1 : .9); }, { passive: false });
    addEventListener('keydown', e => { if (!this.on || $('.modal-back')) return; if (e.key === 'Escape') this.stop(); if (e.key === 'ArrowRight') $('#arNext').click(); if (e.key === 'ArrowLeft') $('#arPrev').click(); });
  },
  stop() {
    if (!this.on) return; this.on = false;
    HandControl.stop(); this.hands = false;
    GL.unmount(); stopStream(this.stream); this.stream = null; $('#arVideo').srcObject = null;
    $('#arStage').hidden = true; $('#arLabel').hidden = true; $('#arQuiz').hidden = true; $('#arPrev').hidden = false; $('#arNext').hidden = false; document.body.style.overflow = ''; Voice.stop();
    this._seen = undefined; $('#arGuide').classList.remove('hide'); $('#arStatus').classList.remove('found');
    if (['home', 'explore', 'vr'].includes(Router.cur)) Router.route(); // vuelve a dibujar la vista 3D que usaba el motor
  }
};

/* ---------- RA sin marcador con WebXR (Android/Chrome compatibles) ---------- */
const XRAR = {
  session: null,
  async start(partId) {
    if (!GL.ok) return;
    const T = GL.T, r = GL.renderer;
    try {
      const ov = $('#xrOverlay');
      const s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: ov } });
      this.session = s; ov.hidden = false;
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;width:2px;height:2px;left:-10px;top:-10px;overflow:hidden'; document.body.appendChild(host); this.host = host;
      GL.mount(host, () => {}, false);
      r.xr.enabled = true; r.xr.setReferenceSpaceType('local'); await r.xr.setSession(s);
      const scene = new T.Scene(); GL.studio(scene);
      const ret = new T.Mesh(new T.RingGeometry(.07, .09, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: new T.Color(GL.accent()) })); ret.matrixAutoUpdate = false; ret.visible = false; scene.add(ret);
      const holder = new T.Group(); holder.visible = false; scene.add(holder); holder.add(GL.contactShadow(1.6, .5));
      const inst = await Models.instance(partId); inst.scale.setScalar(.35); holder.add(inst);
      const cam = new T.PerspectiveCamera();
      const vs = await s.requestReferenceSpace('viewer'); const hs = await s.requestHitTestSource({ space: vs });
      $('#xrMsg').textContent = 'Mueve el celular despacio para encontrar el piso o la mesa. Toca la pantalla para colocar el modelo.';
      s.addEventListener('select', () => { if (ret.visible) { holder.position.setFromMatrixPosition(ret.matrix); holder.visible = true; $('#xrMsg').textContent = 'Toca otra vez para moverlo. ' + Models.find(partId).n; } });
      $('#xrExit').onclick = () => s.end();
      let last = performance.now();
      r.setAnimationLoop((t, frame) => {
        const dt = (t - last) / 1000; last = t;
        if (frame) { const hits = frame.getHitTestResults(hs); if (hits.length) { const pose = hits[0].getPose(r.xr.getReferenceSpace()); ret.visible = true; ret.matrix.fromArray(pose.transform.matrix); } else ret.visible = false; }
        holder.rotation.y += dt * .3; Anim.tick(inst, t / 1000, dt);
        r.render(scene, cam);
      });
      s.addEventListener('end', () => { r.setAnimationLoop(null); r.xr.enabled = false; ov.hidden = true; GL.unmount(); host.remove(); this.session = null; });
    } catch (e) { toast('No se pudo iniciar la RA sin marcador: ' + (e.message || e), 'bad'); $('#xrOverlay').hidden = true; }
  }
};
