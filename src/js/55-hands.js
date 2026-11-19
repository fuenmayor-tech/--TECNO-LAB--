/* =====================================================================
   Gestos con la mano (MediaPipe Hands) para manejar los modelos 3D
   🙌 dos manos: separarlas amplía, juntarlas reduce
   ☝️ índice: señalar y tocar botones · 🖐️ mano abierta: dejar el modelo quieto
   ✊ puño: agarrar y girar el modelo · ✌️ victoria: siguiente modelo
   Se usa en la realidad aumentada y en el visor 3D. Un solo detector
   compartido para toda la app (también lo usa la zona de creación).
   ===================================================================== */
const HandEngine = {
  inst: null, consumer: null, _p: null, failed: false, base: null,
  get() {
    if (this.inst) return Promise.resolve(this.inst);
    return this._p ??= (async () => {
      let last = null;
      /* Prueba la carpeta lib/mediapipe y, si falta algún archivo o no responde, usa internet (CDN) */
      for (const base of await Libs.handsBases()) {
        try { const h = await this.create(base); this.base = base; Libs.handsBase = base; this.failed = false; return (this.inst = h); }
        catch (e) { last = e; console.warn('MediaPipe no cargó desde', base, e); }
      }
      throw last || new Error('MediaPipe no disponible');
    })().catch(e => { this._p = null; this.failed = true; throw new Error('No se pudo cargar el detector de manos (MediaPipe). ' + (ENV.file ? 'Al abrir el index.html directamente, los gestos con la mano necesitan internet. Sin internet funcionan en las apps de Android, Windows y Mac.' : 'Revisa la conexión a internet y vuelve a intentar.')); });
  },
  async create(base) {
    const limite = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('Tiempo agotado')), ms))]);
    if (!window.Hands) await limite(loadScript(base + 'hands.js'), 20000);
    if (!window.Hands) throw new Error('MediaPipe Hands no disponible');
    const h = new window.Hands({ locateFile: f => base + f });
    h.setOptions({ maxNumHands: 2, modelComplexity: ENV.mobile ? 0 : 1, minDetectionConfidence: .6, minTrackingConfidence: .5 });
    h.onResults(r => { if (this._warm) return; try { this.consumer && this.consumer(r); } catch (e) { console.warn(e); } });
    if (h.initialize) await limite(h.initialize(), 30000);
    /* Prueba real: procesa una imagen vacía para confirmar que el modelo cargó */
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; c.getContext('2d').fillRect(0, 0, 64, 64);
    this._warm = true;
    try { await limite(h.send({ image: c }), 30000); } finally { this._warm = false; }
    return h;
  }
};

const GESTOS_MANO = [
  { g: 'two', e: '🙌', n: 'Dos manos', d: 'Sepáralas para ampliar · júntalas para hacerlo pequeño' },
  { g: 'point', e: '☝️', n: 'Dedo índice', d: 'Señala un botón y espera un momento para tocarlo' },
  { g: 'open', e: '🖐️', n: 'Mano abierta', d: 'Deja el modelo quieto donde está' },
  { g: 'fist', e: '✊', n: 'Puño', d: 'Agarra el modelo: mueve la mano para girarlo' },
  { g: 'victory', e: '✌️', n: 'Victoria (V)', d: 'Pasa al siguiente modelo' }
];
const HAND_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];

const HandControl = {
  on: false, video: null, stream: null, own: false, loopId: 0, handlers: null, _rel: null,
  /* opts: { video (opcional: usa la cámara de la RA), mirror (función), hudHost, overlayHost, pipHost, handlers, facing } */
  async start(opts) {
    clearTimeout(this._rel); this._rel = null;
    this.opts = opts; this.handlers = opts.handlers || {};
    this.mountHUD(opts.hudHost);
    this.setGesture('loading');
    try {
      if (opts.video) {
        if (this.own) { stopStream(this.stream); this.stream = null; this.own = false; this.pip?.remove(); this.pip = null; }
        this.video = opts.video;
      } else {
        if (!this.own || !this.stream) {
          this.stream = await getCamera(opts.facing || 'user', 640, 480); this.own = true;
          this.pip = document.createElement('div'); this.pip.className = 'hand-pip';
          this.pip.innerHTML = '<video playsinline muted autoplay></video>';
          const v = this.pip.querySelector('video'); v.muted = true; v.srcObject = this.stream;
          this.video = v;
        }
        /* El video debe estar en la página antes de reproducirse (si no, queda en negro) */
        (opts.pipHost || document.body).appendChild(this.pip);
        const v = this.video; await v.play().catch(() => {});
        await new Promise(r => v.videoWidth ? r() : (v.onloadedmetadata = r));
        if (v.paused) await v.play().catch(() => {});
      }
      this.mountOverlay(opts.overlayHost || this.pip);
      await HandEngine.get();
      if (!this.opts || this.opts !== opts) return false;
      this._consumer = r => this.onResults(r); HandEngine.consumer = this._consumer;
      this.on = true; this.reset(); this.setGesture('none');
      this.loop();
      return true;
    } catch (e) { this.on = false; this.stop(); throw e; } // quien llamó muestra el aviso
  },
  reset() { this.cur = 'none'; this.cand = 'none'; this.candT = 0; this.lastT = 0; this.prev = null; this.sm = null; this.lostT = null; this.fired = null; this.coolT = 0; this.twoD = null; this.twoT = 0; this.ptr = null; this.ptrEl = null; this.ptrT = 0; this.ptrCool = 0; this.hidePointer(); },
  loop() {
    const id = ++this.loopId;
    const step = async () => {
      if (!this.on || id !== this.loopId) return;
      const v = this.video;
      if (v && v.readyState >= 2 && v.videoWidth && !this.busy && !document.hidden) {
        this.busy = true;
        try { await (await HandEngine.get()).send({ image: v }); } catch (e) { console.warn(e); }
        this.busy = false;
      }
      setTimeout(step, ENV.mobile ? 85 : 45);
    };
    step();
  },
  mirror() { const m = this.opts?.mirror; return typeof m === 'function' ? m() : m !== false; },
  classify(lm) {
    const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    const size = d(0, 9) || 1e-3;
    const ext = (tip, pip) => d(tip, 0) > d(pip, 0) * 1.12;
    const i = ext(8, 6), m = ext(12, 10), r = ext(16, 14), p = ext(20, 18);
    if (i && m && !r && !p) return 'victory';
    if (i && !m && !r && !p) return 'point';
    if (i && m && r && p) return 'open';
    if (!i && !m && !r && !p) return 'fist';
    return 'none';
  },
  onResults(res) {
    if (!this.on) return;
    const now = performance.now(), dt = Math.min(.12, this.lastT ? (now - this.lastT) / 1000 : 0); this.lastT = now;
    const hands = res.multiHandLandmarks || [], lm = hands[0], h = this.handlers;
    this.draw(hands);
    if (!lm) { this.hidePointer(); this.twoD = null; this.lostT ??= now; if (now - this.lostT > 300 && this.cur !== 'none') { this.cur = 'none'; this.cand = 'none'; this.prev = null; this.setGesture('none'); } return; }
    this.lostT = null;
    /* 🙌 Dos manos: la distancia entre ellas controla el tamaño */
    if (hands.length >= 2) {
      this.hidePointer(); this.prev = null;
      const c = L => { let x = 0, y = 0; [0, 5, 9, 13, 17].forEach(k => { x += L[k].x; y += L[k].y; }); return { x: x / 5, y: y / 5 }; };
      const a = c(hands[0]), b2 = c(hands[1]), ar = (this.video?.videoWidth || 4) / (this.video?.videoHeight || 3);
      const D = Math.hypot((a.x - b2.x) * ar, a.y - b2.y);
      this.twoS = this.twoD == null ? D : this.twoS + (D - this.twoS) * .45;
      if (this.cur !== 'two') { this.cur = 'two'; this.cand = 'two'; this.candT = now; this.twoD = this.twoS; this.setGesture('two'); }
      const ratio = this.twoS / (this.twoD || this.twoS);
      if (Math.abs(ratio - 1) > .006) {
        h.zoom?.(clamp(Math.pow(ratio, 1.1), .85, 1.18));
        this.setGesture('two', ratio > 1 ? 'Ampliando' : 'Haciéndolo pequeño');
      }
      this.twoD = this.twoS; this.twoT = now;
      return;
    }
    this.twoD = null;
    if (now - this.twoT < 350) return; // al soltar una mano no se dispara otro gesto por error
    const g = this.classify(lm);
    if (g !== this.cand) { this.cand = g; this.candT = now; }
    const held = now - this.candT;
    if (this.cand !== this.cur && held > 220) { this.cur = this.cand; this.prev = null; this.fired = null; this.setGesture(this.cur); }
    const flip = this.mirror() ? -1 : 1;
    /* ✊ Puño: agarrar y girar */
    if (this.cur === 'fist') {
      const p0 = lm[9]; this.sm = this.sm ? { x: this.sm.x + (p0.x - this.sm.x) * .5, y: this.sm.y + (p0.y - this.sm.y) * .5 } : { x: p0.x, y: p0.y };
      if (this.prev) { const dx = (this.sm.x - this.prev.x) * flip, dy = this.sm.y - this.prev.y; if (Math.abs(dx) + Math.abs(dy) > .002) h.rotate?.(dx * 7, dy * 4); }
      this.prev = { ...this.sm };
    } else this.sm = null;
    /* ☝️ Índice: puntero para tocar botones */
    if (this.cur === 'point') this.pointer(lm[8], now); else this.hidePointer();
    /* 🖐️ Mano abierta (dejar quieto) y ✌️ victoria (siguiente): se mantienen un momento */
    const oneShot = { victory: 450, open: 500 }[this.cur];
    if (oneShot) {
      const p = clamp((now - this.candT) / oneShot, 0, 1); this.progress(this.fired === this.cur ? 0 : p);
      if (p >= 1 && this.fired !== this.cur && now > this.coolT) {
        this.fired = this.cur; this.coolT = now + 1000; Sfx.click(); if (navigator.vibrate) navigator.vibrate(25);
        if (this.cur === 'victory') { h.next?.(); this.flash('✌️ ¡Siguiente!'); } else { h.hold?.(); this.flash('🖐️ Quieto'); }
      }
    } else this.progress(0);
  },
  /* Puntero en pantalla que sigue la punta del índice; si se queda sobre un botón, lo toca */
  pointer(tip, now) {
    let x = tip.x; if (this.mirror()) x = 1 - x;
    const sx = clamp((x - .15) / .7, 0, 1) * innerWidth, sy = clamp((tip.y - .12) / .66, 0, 1) * innerHeight;
    this.ptr = this.ptr ? { x: this.ptr.x + (sx - this.ptr.x) * .4, y: this.ptr.y + (sy - this.ptr.y) * .4 } : { x: sx, y: sy };
    if (!this.cursor) { this.cursor = document.createElement('div'); this.cursor.className = 'hand-cursor'; this.cursor.innerHTML = '<i></i>'; }
    if (!this.cursor.isConnected) document.body.appendChild(this.cursor);
    this.cursor.style.left = this.ptr.x + 'px'; this.cursor.style.top = this.ptr.y + 'px';
    let el = document.elementFromPoint(this.ptr.x, this.ptr.y)?.closest('button:not([disabled]), a[href], [role="button"], [role="tab"], .part-card, summary');
    if (el && el.matches('#exHand, #arHand')) el = null; // el puntero no apaga las manos
    if (el !== this.ptrEl) { this.ptrEl = el; this.ptrT = now; }
    const p = el && now > this.ptrCool ? clamp((now - this.ptrT) / 1100, 0, 1) : 0;
    this.cursor.style.setProperty('--p', p); this.cursor.classList.toggle('over', !!el);
    if (el && p >= 1) { this.ptrCool = now + 900; this.ptrT = now + 900; Sfx.click(); if (navigator.vibrate) navigator.vibrate(20); this.cursor.classList.add('tap'); setTimeout(() => this.cursor?.classList.remove('tap'), 250); el.click(); }
  },
  hidePointer() { if (this.cursor?.isConnected) this.cursor.remove(); this.ptrEl = null; },
  /* ---------- Interfaz ---------- */
  mountHUD(host) {
    if (!host) return;
    if (!this.hud) {
      this.hud = document.createElement('div'); this.hud.className = 'hand-hud';
      this.hud.innerHTML = `<div class="hh-chip" aria-live="polite"><span class="hh-e">👋</span><span class="hh-t">Muestra tu mano</span><i class="hh-bar"><i></i></i></div>
        <button type="button" class="hh-help" aria-expanded="true">${icon('help')}<span>Gestos</span></button>
        <ul class="hh-legend">${GESTOS_MANO.map(x => `<li data-g="${x.g}"><span>${x.e}</span><div><b>${x.n}</b><small>${x.d}</small></div></li>`).join('')}</ul>`;
      const help = this.hud.querySelector('.hh-help');
      help.onclick = () => { const open = this.hud.classList.toggle('legend-off') === false; help.setAttribute('aria-expanded', open); };
    }
    /* En la RA la lista de gestos empieza cerrada para no tapar el espacio de las manos (se abre con «Gestos») */
    const ra = host.id === 'arStage';
    this.hud.classList.toggle('legend-off', ra); this.hud.querySelector('.hh-help')?.setAttribute('aria-expanded', String(!ra)); host.appendChild(this.hud);
    clearTimeout(this._legT); if (!ra) this._legT = setTimeout(() => { if (this.hud) { this.hud.classList.add('legend-off'); this.hud.querySelector('.hh-help')?.setAttribute('aria-expanded', 'false'); } }, innerWidth < 760 ? 7000 : 14000);
  },
  mountOverlay(host) {
    if (!host) return;
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.className = 'hand-overlay'; this.cx = this.cv.getContext('2d'); }
    host.appendChild(this.cv);
  },
  draw(hands) {
    const c = this.cv, x = this.cx, v = this.video; if (!c || !v) return;
    if (c.width !== v.videoWidth) { c.width = v.videoWidth || 640; c.height = v.videoHeight || 480; }
    x.clearRect(0, 0, c.width, c.height); if (!hands || !hands.length) return;
    const W = c.width, H = c.height, ac = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#7dd3fc';
    hands.slice(0, 2).forEach(lm => {
      x.lineWidth = Math.max(2, W / 260); x.strokeStyle = ac; x.globalAlpha = .75;
      x.beginPath(); HAND_LINKS.forEach(([a, b]) => { x.moveTo(lm[a].x * W, lm[a].y * H); x.lineTo(lm[b].x * W, lm[b].y * H); }); x.stroke();
      x.globalAlpha = 1; x.fillStyle = '#fff';
      [4, 8, 12, 16, 20].forEach(k => { x.beginPath(); x.arc(lm[k].x * W, lm[k].y * H, Math.max(3, W / 140), 0, Math.PI * 2); x.fill(); });
    });
    if (hands.length >= 2) { const m = L => [L[9].x * W, L[9].y * H]; const [a, b] = [m(hands[0]), m(hands[1])]; x.setLineDash([8, 8]); x.strokeStyle = '#fff'; x.lineWidth = Math.max(3, W / 180); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); x.setLineDash([]); }
  },
  setGesture(g, msg) {
    if (!this.hud) return;
    const map = { loading: ['⏳', 'Preparando el detector de manos…'], none: ['👋', 'Muestra tu mano a la cámara'], two: ['🙌', msg || 'Separa las manos para ampliar · júntalas para reducir'], point: ['☝️', 'Señala un botón y espera'], open: ['🖐️', 'Mantén la mano abierta para dejarlo quieto'], victory: ['✌️', 'Mantén para pasar al siguiente'], fist: ['✊', 'Agarrado: mueve la mano para girar'], error: ['⚠️', msg || 'No se pudo usar la mano'] };
    const [e, t] = map[g] || map.none;
    this.hud.querySelector('.hh-e').textContent = e; this.hud.querySelector('.hh-t').textContent = t;
    this.hud.dataset.g = g;
    this.hud.querySelectorAll('.hh-legend li').forEach(li => li.classList.toggle('on', li.dataset.g === g));
  },
  progress(p) { const b = this.hud?.querySelector('.hh-bar i'); if (b) b.style.width = Math.round(p * 100) + '%'; },
  flash(t) { const f = document.createElement('div'); f.className = 'hand-flash'; f.textContent = t; (this.opts?.hudHost || document.body).appendChild(f); setTimeout(() => f.remove(), 900); },
  /* Libera la cámara un poco después (permite pasar de un modelo a otro sin apagarla) */
  release(ms = 1500) { clearTimeout(this._rel); this._rel = setTimeout(() => this.stop(), ms); },
  stop() {
    clearTimeout(this._rel); this._rel = null; this.on = false; this.loopId++; this.opts = null;
    if (HandEngine.consumer === this._consumer) HandEngine.consumer = null;
    if (this.own) { stopStream(this.stream); this.stream = null; this.own = false; }
    this.pip?.remove(); this.pip = null; this.hud?.remove(); this.cv?.remove(); this.video = null; this.hidePointer();
  }
};
