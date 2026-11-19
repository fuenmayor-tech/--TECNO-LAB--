'use strict';
/* =====================================================================
   TECNO LAB · Núcleo: utilidades, almacenamiento, avisos, voz, IndexedDB,
   carga de librerías locales con respaldo por CDN.
   ===================================================================== */
const APP_VERSION = '1.7.0';
const MARKER_ID = 42;                       // id ArUco del marcador único (diccionario ARUCO_MIP_36h12)
const MARKER_DICT = 'ARUCO_MIP_36h12';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const sample = (a, n) => shuffle(a).slice(0, n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const ENV = {
  file: location.protocol === 'file:',
  touch: matchMedia('(pointer:coarse)').matches,
  mobile: matchMedia('(max-width:760px)').matches,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  secure: window.isSecureContext,
  hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  /* ¿Puede mostrar 3D? (se comprueba una sola vez, sin cargar el motor) */
  get webgl() { if (this._gl === undefined) { try { const c = document.createElement('canvas'); this._gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { this._gl = false; } } return this._gl; }
};
addEventListener('resize', () => { ENV.mobile = matchMedia('(max-width:760px)').matches; });

/* ---------- Estado persistente (localStorage, con tolerancia a fallos) ---------- */
const Store = {
  key: 'tecnolab.v1', data: null, _t: 0,
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.key)) || {}; } catch { this.data = {}; }
    const d = this.data;
    d.grade = clamp(+d.grade || 1, 1, 5);
    d.read ??= {}; d.quiz ??= {}; d.games ??= {}; d.seenQ ??= []; d.cards ??= {}; d.sim ??= {}; d.draw ??= {};
    d.firstVisit ??= true; d.fx ??= !ENV.reduced; d.handHold ??= 500;
    return d;
  },
  save() { clearTimeout(this._t); this._t = setTimeout(() => { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch { /* almacenamiento lleno o bloqueado */ } }, 150); },
  get grade() { return this.data.grade; },
  g(k) { const g = 'g' + this.grade; this.data[k][g] ??= {}; return this.data[k][g]; }
};

/* ---------- Avisos y anuncios accesibles ---------- */
function toast(msg, type = 'info', ms = 3400) {
  const ic = type === 'ok' ? 'check' : type === 'bad' ? 'info' : type === 'try' ? 'sparkle' : 'info';
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.setAttribute('role', type === 'bad' ? 'alert' : 'status');
  t.innerHTML = icon(ic) + '<span></span>'; t.querySelector('span').textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, ms);
}
function announce(msg) { const a = $('#srAnnounce'); a.textContent = ''; setTimeout(() => a.textContent = msg, 30); }

/* ---------- Ventanas modales ---------- */
function openModal({ title = '', body = '', actions = [], wide = false, onClose = null, closable = true }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mt_${uid()}">
    <div class="modal-head"><h2></h2>${closable ? `<button class="icon-btn" data-x aria-label="Cerrar">${icon('x')}</button>` : ''}</div>
    <div class="modal-body"></div><div class="modal-foot"></div></div>`;
  const m = back.firstElementChild; const h = m.querySelector('h2'); h.id = m.getAttribute('aria-labelledby'); h.textContent = title;
  const b = m.querySelector('.modal-body'); if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
  const foot = m.querySelector('.modal-foot');
  const prevFocus = document.activeElement;
  const close = (v) => { back.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(v); prevFocus && prevFocus.focus && prevFocus.focus(); };
  actions.forEach(a => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn ' + (a.cls || ''); btn.innerHTML = (a.icon ? icon(a.icon) : '') + '<span></span>';
    btn.querySelector('span').textContent = a.label;
    btn.onclick = async () => { const r = a.onClick ? await a.onClick(m) : undefined; if (a.close !== false && r !== false) close(a.value); };
    foot.appendChild(btn);
  });
  if (!actions.length) foot.remove();
  const onKey = e => {
    if (e.key === 'Escape' && closable) close();
    if (e.key === 'Tab') { const f = $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', m).filter(x => !x.disabled && x.offsetParent); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); } }
  };
  document.addEventListener('keydown', onKey);
  back.addEventListener('click', e => { if (e.target === back && closable) close(); });
  m.querySelector('[data-x]')?.addEventListener('click', () => close());
  $('#modalRoot').appendChild(back);
  setTimeout(() => (m.querySelector('[autofocus]') || m.querySelector('.modal-foot .btn-primary') || m.querySelector('[data-x]') || m).focus?.(), 20);
  return { el: m, close };
}

/* ---------- Narración (Web Speech API) ---------- */
const Voice = {
  supported: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  voice: null, speaking: false, onchange: null,
  pickVoice() {
    if (!this.supported) return null;
    const vs = speechSynthesis.getVoices();
    const pref = ['es-CO', 'es-MX', 'es-US', 'es-419', 'es-ES', 'es'];
    for (const p of pref) { const v = vs.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase())); if (v) return (this.voice = v); }
    return null;
  },
  speak(text, onend) {
    if (!this.supported) { toast('Este navegador no permite la lectura en voz alta.', 'bad'); return false; }
    this.stop();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[•·]/g, ', '));
    u.lang = 'es-CO'; const v = this.voice || this.pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = Store.grade <= 2 ? 0.9 : 1; u.pitch = 1.03;
    u.onend = u.onerror = () => { this.speaking = false; this.onchange && this.onchange(false); onend && onend(); };
    this.speaking = true; this.onchange && this.onchange(true);
    speechSynthesis.speak(u); return true;
  },
  stop() { if (this.supported && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); this.speaking = false; this.onchange && this.onchange(false); },
  toggle(text, btn) {
    if (this.speaking) { this.stop(); return; }
    const set = on => { if (btn) { btn.setAttribute('aria-pressed', on); const s = btn.querySelector('span'); if (s) s.textContent = on ? 'Detener' : (btn.dataset.label || 'Escuchar'); } };
    if (this.speak(text, () => set(false))) set(true);
  }
};
if (Voice.supported) { speechSynthesis.onvoiceschanged = () => Voice.pickVoice(); Voice.pickVoice(); }
function speakBtn(label = 'Escuchar', cls = 'btn btn-sm') { return `<button type="button" class="${cls}" data-speak data-label="${esc(label)}" aria-pressed="false">${icon('volume')}<span>${esc(label)}</span></button>`; }

/* ---------- IndexedDB: modelos subidos y dibujos ---------- */
const DB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB no disponible'));
      const r = indexedDB.open('tecnolab', 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('uploads')) d.createObjectStore('uploads', { keyPath: 'id' }); if (!d.objectStoreNames.contains('drawings')) d.createObjectStore('drawings', { keyPath: 'id' }); };
      r.onsuccess = () => res(this._db = r.result); r.onerror = () => rej(r.error);
    });
  },
  async tx(store, mode, fn) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const rq = fn(s); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); },
  put(store, v) { return this.tx(store, 'readwrite', s => s.put(v)); },
  del(store, id) { return this.tx(store, 'readwrite', s => s.delete(id)); },
  all(store) { return this.tx(store, 'readonly', s => s.getAll()).then(r => r || []); }
};

/* ---------- Carga de librerías: primero las incluidas en el index, luego ./lib, luego CDN ---------- */
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = false; s.onload = () => res(src); s.onerror = () => { s.remove(); rej(new Error('No se pudo cargar ' + src)); }; document.head.appendChild(s); });
}
/* Ejecuta una librería que viene incluida dentro del index.html (<script type="text/x-libreria" id="…">) */
async function runIncluded(id) {
  const el = document.getElementById(id); if (!el || el.textContent.length < 100) return false;
  const code = el.textContent; el.remove();
  (0, eval)(code + '\n//# sourceURL=' + id + '.js'); // se ejecuta como un script normal (ámbito global)
  return true;
}
const CDN = {
  three: '0.170.0',
  aruco: 'https://cdn.jsdelivr.net/npm/js-aruco2@2.0.0/src/',
  hands: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/',
  draco: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
};
const Libs = {
  threeSource: null, handsBase: 'lib/mediapipe/', dracoPath: CDN.draco, // Draco solo hace falta para modelos subidos comprimidos con Draco
  _three: null, _aruco: null, _hands: null,
  three() {
    return this._three ??= (async () => {
      try { if (await runIncluded('lib-three') && window.THREE?.WebGLRenderer) { this.threeSource = 'incluida'; return window.THREE; } } catch { /* sigue con ./lib */ }
      try { await loadScript('lib/three-bundle.js'); if (window.THREE?.WebGLRenderer) { this.threeSource = 'local'; return window.THREE; } } catch { /* sigue al CDN */ }
      const v = CDN.three, b = `https://esm.sh/three@${v}`;
      const imp = u => import(u);
      const [T, oc, gl, dr, mo, rb, re, su] = await Promise.all([imp(b), imp(`${b}/examples/jsm/controls/OrbitControls.js`), imp(`${b}/examples/jsm/loaders/GLTFLoader.js`), imp(`${b}/examples/jsm/loaders/DRACOLoader.js`), imp(`${b}/examples/jsm/libs/meshopt_decoder.module.js`), imp(`${b}/examples/jsm/geometries/RoundedBoxGeometry.js`), imp(`${b}/examples/jsm/environments/RoomEnvironment.js`), imp(`${b}/examples/jsm/utils/SkeletonUtils.js`)]);
      window.THREE = Object.assign({}, T, { OrbitControls: oc.OrbitControls, GLTFLoader: gl.GLTFLoader, DRACOLoader: dr.DRACOLoader, MeshoptDecoder: mo.MeshoptDecoder, RoundedBoxGeometry: rb.RoundedBoxGeometry, RoomEnvironment: re.RoomEnvironment, SkeletonUtils: su });
      this.threeSource = 'cdn'; this.dracoPath = CDN.draco; return window.THREE;
    })().catch(e => { this._three = null; throw e; });
  },
  aruco() {
    return this._aruco ??= (async () => {
      try { if (await runIncluded('lib-aruco') && window.AR && window.POS) return true; } catch { /* sigue con ./lib */ }
      try { await loadScript('lib/aruco-bundle.js'); if (window.AR && window.POS) return true; } catch { /* CDN */ }
      for (const f of ['cv.js', 'aruco.js', 'svd.js', 'posit1.js']) await loadScript(CDN.aruco + f);
      if (!(window.AR && window.POS)) throw new Error('ArUco no disponible');
      return true;
    })().catch(e => { this._aruco = null; throw e; });
  },
  /* Bases posibles del detector de manos: primero la carpeta lib/mediapipe (si está completa), luego internet */
  async handsBases() {
    const bases = [];
    if (!ENV.file) {
      const need = ['hands.js', 'hands_solution_packed_assets_loader.js', 'hands_solution_packed_assets.data', 'hands_solution_simd_wasm_bin.js', 'hands_solution_simd_wasm_bin.wasm', 'hands.binarypb', ENV.mobile ? 'hand_landmark_lite.tflite' : 'hand_landmark_full.tflite'];
      const ok = await Promise.all(need.map(f => fetch('lib/mediapipe/' + f, { method: 'HEAD', cache: 'no-cache' }).then(r => r.ok && !(r.headers.get('content-type') || '').includes('text/html')).catch(() => false)));
      if (ok.every(Boolean)) bases.push('lib/mediapipe/');
    }
    bases.push(CDN.hands);
    return bases;
  }
};

/* ---------- Descargas ---------- */
/* Puente con las apps nativas (Android): guardar archivos e imprimir */
const NATIVO = (typeof window !== 'undefined' && window.TecnoLabNativo) || null;
function printHTML(html) {
  if (NATIVO && NATIVO.imprimirHTML) { try { NATIVO.imprimirHTML(html); return; } catch (e) { console.warn(e); } }
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
  const d = f.contentDocument; d.open(); d.write(html); d.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch { toast('No se pudo abrir la impresión en este navegador.', 'info'); } setTimeout(() => f.remove(), 2000); }, 300);
}
function downloadBlob(blob, name) {
  if (NATIVO && NATIVO.guardar) {
    const r = new FileReader();
    r.onload = () => { try { NATIVO.guardar(String(r.result).split(',')[1] || '', name, blob.type || 'application/octet-stream'); } catch (e) { toast('No se pudo guardar el archivo.', 'info'); } };
    r.readAsDataURL(blob); return;
  }
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function dataURLtoBlob(d) { const [h, b] = d.split(','); const mime = h.match(/:(.*?);/)[1]; const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: mime }); }

/* ---------- Cámara ---------- */
/* Cámara: prueba varias configuraciones para que funcione con la cámara trasera y la frontal
   en celulares, tabletas y computadores. */
async function getCamera(facing = 'environment', w = 1280, h = 720) {
  if (!ENV.secure) throw Object.assign(new Error('La cámara solo funciona en páginas seguras (https), como GitHub Pages, o en localhost.'), { code: 'insecure' });
  if (!ENV.hasCamera) throw Object.assign(new Error('Este navegador no permite usar la cámara. Ábrelo en Chrome, Edge, Safari o en la app de TECNO LAB.'), { code: 'nocam' });
  const size = { width: { ideal: w }, height: { ideal: h } };
  const intentos = [{ facingMode: { exact: facing }, ...size }, { facingMode: { ideal: facing }, ...size }, { facingMode: facing }, true];
  let ultimo = null;
  for (const video of intentos) {
    try { return await navigator.mediaDevices.getUserMedia({ audio: false, video }); }
    catch (e) { ultimo = e; if (e.name === 'NotAllowedError' || e.name === 'SecurityError' || e.name === 'AbortError') break; }
  }
  const n = ultimo?.name || 'Error';
  const msg = n === 'NotAllowedError' || n === 'SecurityError' ? 'El permiso para usar la cámara no se dio o está bloqueado.'
    : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'No se encontró una cámara disponible en este dispositivo.'
    : n === 'NotReadableError' ? 'La cámara está siendo usada por otra aplicación. Ciérrala y vuelve a intentar.' : 'No se pudo abrir la cámara (' + n + ').';
  throw Object.assign(new Error(msg), { code: n });
}
/* Ventana de ayuda cuando la cámara no abre (con botones para reintentar o cambiar de cámara) */
const IN_APP_BROWSER = /FBAN|FBAV|Instagram|WhatsApp|Line\/|TikTok|Snapchat/i.test(navigator.userAgent);
function cameraHelp(err, { retry, other, close } = {}) {
  const blocked = err && (err.code === 'NotAllowedError' || err.code === 'SecurityError');
  const local = ENV.file || location.protocol === 'content:';
  const nat = NATIVO && typeof NATIVO.ajustes === 'function';
  let pasos = '';
  if (nat && blocked) pasos = `<ol class="steps cam-steps"><li><span>Toca <b>Abrir ajustes</b> → <b>Permisos</b> → <b>Cámara</b> → <b>Permitir</b>.</span></li><li><span>Vuelve a TECNO LAB y toca <b>Reintentar</b>.</span></li></ol>`;
  else if (blocked || local) pasos = `<ol class="steps cam-steps">
      ${local ? '<li><span><b>Abriste el archivo index.html directo en el celular:</b> así el navegador no deja usar la cámara. Usa la <b>app de Android</b> (APK) o la página publicada en <b>GitHub Pages</b>.</span></li>' : ''}
      ${IN_APP_BROWSER ? '<li><span><b>Estás dentro de WhatsApp, Instagram o Facebook:</b> toca el menú ⋮ → “Abrir en Chrome” (o en Safari). Esos visores no permiten la cámara.</span></li>' : ''}
      <li><span><b>En Chrome:</b> toca el ícono junto a la dirección (candado o ajustes) → <b>Permisos</b> → <b>Cámara</b> → <b>Permitir</b>. Luego toca <b>Reintentar</b>.</span></li>
      <li><span><b>En iPhone (Safari):</b> toca <b>aA</b> en la barra → <b>Configuración del sitio web</b> → <b>Cámara</b> → <b>Permitir</b>.</span></li>
      <li><span><b>Si sigue sin preguntar:</b> Ajustes del teléfono → Aplicaciones → Chrome → Permisos → Cámara → Permitir.</span></li></ol>`;
  return openModal({ title: 'Activemos la cámara', body: `<p>${esc(err?.message || 'No se pudo abrir la cámara.')}</p>${pasos}`,
    actions: [{ label: 'Cerrar', onClick: close }, ...(nat && blocked ? [{ label: 'Abrir ajustes', icon: 'settings', close: false, onClick: () => NATIVO.ajustes() }] : []), ...(other ? [{ label: 'Usar la otra cámara', icon: 'switchcam', onClick: other }] : []), ...(retry ? [{ label: 'Reintentar', icon: 'refresh', cls: 'btn-primary', onClick: retry }] : [])] });
}
function stopStream(s) { s && s.getTracks().forEach(t => t.stop()); }

/* ---------- Sonidos breves (Web Audio, sin archivos) ---------- */
const Sfx = {
  ctx: null,
  _c() { if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; this.ctx = new C(); } if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
  tone(f = 600, d = .12, type = 'sine', v = .08, when = 0) { const c = this._c(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; const t = c.currentTime + when; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02); },
  ok() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, .16, 'sine', .065, i * .07)); this.tone(2093, .25, 'triangle', .03, .28); },
  try() { this.tone(392, .14, 'sine', .05); this.tone(440, .18, 'sine', .045, .12); },
  bad() { this.try(); },
  click() { this.tone(900, .04, 'square', .03); },
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .2, 'sine', .07, i * .11)); },
  melody() { [392, 440, 523, 587, 523, 440, 392, 330, 392].forEach((f, i) => this.tone(f, .22, 'triangle', .06, i * .2)); }
};

/* ---------- Efectos: destellos del puntero y confeti ---------- */
const FX = {
  cv: null, x: null, P: [], raf: 0, last: 0, lastSp: 0,
  cols: ['#7dd3fc', '#f9a8d4', '#fb7185', '#c8a69a', '#ffffff', '#38bdf8', '#f472b6'],
  init() {
    const c = this.cv = document.createElement('canvas'); c.id = 'fx'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2600';
    document.body.appendChild(c); this.x = c.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize());
    addEventListener('pointermove', e => {
      if (!Store.data.fx || ENV.reduced) return; const now = performance.now(); if (now - this.lastSp < 22) return; this.lastSp = now;
      const t = e.target; if (t && t.closest && t.closest('.canvas-wrap,.ar-stage,.vr-stage,input,textarea,select')) return;
      for (let i = 0; i < 2; i++) this.P.push({ k: 's', x: e.clientX + (Math.random() - .5) * 10, y: e.clientY + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40 - 15, l: 0, m: .55 + Math.random() * .45, r: 3 + Math.random() * 4, c: pick(this.cols), a: Math.random() * 6 });
      this.run();
    }, { passive: true });
  },
  resize() { if (!this.cv) return; const d = Math.min(devicePixelRatio || 1, 2); this.cv.width = innerWidth * d; this.cv.height = innerHeight * d; this.x.setTransform(d, 0, 0, d, 0, 0); },
  confetti(x = innerWidth / 2, y = innerHeight / 3, n = 90) {
    if (!this.cv) return; const many = ENV.reduced ? Math.round(n / 3) : n;
    for (let i = 0; i < many; i++) { const a = Math.random() * Math.PI * 2, v = 220 + Math.random() * 420; this.P.push({ k: 'c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 260, l: 0, m: 1.3 + Math.random() * .9, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, c: pick(this.cols), a: Math.random() * 6, va: (Math.random() - .5) * 14 }); }
    this.run();
  },
  run() { if (this.raf) return; this.last = performance.now(); this.raf = requestAnimationFrame(t => this.step(t)); },
  star(x, y, r, a) { const c = this.x; c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .38 : r; const q = i * Math.PI / 4; c.lineTo(Math.cos(q) * rr, Math.sin(q) * rr); } c.closePath(); c.fill(); c.restore(); },
  step(now) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; const c = this.x; c.clearRect(0, 0, innerWidth, innerHeight);
    this.P = this.P.filter(p => (p.l += dt) < p.m);
    for (const p of this.P) {
      const f = 1 - p.l / p.m; c.globalAlpha = Math.max(0, f); c.fillStyle = p.c;
      if (p.k === 's') { p.x += p.vx * dt; p.y += p.vy * dt; p.a += dt * 4; this.star(p.x, p.y, p.r * (0.4 + f * .6), p.a); }
      else { p.vy += 900 * dt; p.vx *= .985; p.vy *= .985; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
    }
    c.globalAlpha = 1;
    if (this.P.length) this.raf = requestAnimationFrame(t => this.step(t)); else { this.raf = 0; c.clearRect(0, 0, innerWidth, innerHeight); }
  }
};
/* Celebración de una respuesta correcta: sonido + confeti desde el elemento */
function celebrate(el, n = 90) {
  Sfx.ok(); if (navigator.vibrate) navigator.vibrate(25);
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  FX.confetti(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top + r.height / 2 : innerHeight / 3, n);
}
const PRAISE = ['¡Excelente!', '¡Muy bien!', '¡Lo lograste!', '¡Genial!', '¡Súper!', '¡Eso es!'];
const ENCOURAGE = ['¡Sigue intentando!', '¡Puedes mejorar!', '¡Casi! Inténtalo otra vez.', '¡Vas muy bien, sigue!'];
