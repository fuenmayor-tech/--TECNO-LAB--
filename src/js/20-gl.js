/* =====================================================================
   Motor 3D compartido: un solo WebGLRenderer que se "monta" en la sección
   activa (inicio, explorar, RA o RV) para no gastar contextos WebGL.
   ===================================================================== */
const GL = {
  T: null, renderer: null, canvas: null, env: null, host: null, ro: null, onResize: null, ok: false, err: null,
  async init() {
    try {
      const T = this.T = await Libs.three();
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      r.outputColorSpace = T.SRGBColorSpace;
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.setClearColor(0x000000, 0);
      this.canvas = r.domElement; this.canvas.setAttribute('aria-hidden', 'true');
      const pm = new T.PMREMGenerator(r); this.env = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; pm.dispose();
      this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); toast('La vista 3D se reinició por falta de memoria gráfica.', 'bad'); });
      this.ok = true;
    } catch (e) { this.err = e; this.ok = false; console.warn('3D no disponible', e); }
    return this.ok;
  },
  mount(host, onResize, interactive = true) {
    if (!this.ok) return false;
    this.unmount();
    this.host = host; this.onResize = onResize;
    host.prepend(this.canvas);
    this.canvas.style.pointerEvents = interactive ? 'auto' : 'none';
    this.canvas.style.touchAction = interactive ? 'none' : 'auto';
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.resize(); return true;
  },
  resize() {
    if (!this.host) return;
    const w = Math.max(2, this.host.clientWidth), h = Math.max(2, this.host.clientHeight);
    if (this.renderer.xr.isPresenting) return;
    this.renderer.setSize(w, h, false);
    this.onResize && this.onResize(w, h);
  },
  unmount() { if (this.ro) { this.ro.disconnect(); this.ro = null; } this.stop(); if (this.canvas?.parentNode) this.canvas.remove(); this.host = null; this.onResize = null; },
  /* Prepara los sombreados del modelo sin trabar la pantalla (si el navegador lo permite) */
  async precompile(obj, cam, scene) {
    if (!this.ok || !this.renderer.compileAsync) return;
    try { await Promise.race([this.renderer.compileAsync(obj, cam, scene), sleep(5000)]); } catch { /* se compila al dibujar */ }
  },
  /* No se dibuja mientras la portada tapa la pantalla o la pestaña está oculta (ahorra trabajo y evita trabas) */
  setLoop(fn) { if (this.ok) this.renderer.setAnimationLoop(fn ? (t, f) => { if (!f && (document.hidden || document.body.classList.contains('intro-open'))) return; fn(t, f); } : null); },
  stop() { if (this.ok) this.renderer.setAnimationLoop(null); },
  /* Luces de estudio + entorno reflejado */
  studio(scene, accent = 0x7dd3fc) {
    const T = this.T;
    scene.environment = this.env;
    const hemi = new T.HemisphereLight(0xe6f2ff, 0x1c1424, 0.7); scene.add(hemi);
    const key = new T.DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 4); scene.add(key);
    const rim = new T.DirectionalLight(accent, 0.9); rim.position.set(-4, 2.5, -3); scene.add(rim);
    return { hemi, key, rim };
  },
  shadowTex: null,
  contactShadow(size = 1.5, opacity = .55) {
    const T = this.T;
    if (!this.shadowTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); this.shadowTex = new T.CanvasTexture(c);
    }
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: this.shadowTex, transparent: true, opacity, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.renderOrder = -1; return m;
  },
  accent() { return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#7dd3fc'; }
};

/* Animaciones declarativas (sobreviven al clonado porque son texto):
   spinZ:v, spinY:v, blink:fase, slideZ:amp:frec, swingY:amp:frec, pulse */
const Anim = {
  collect(root) { const list = []; root.traverse(o => { const a = o.userData && o.userData.anim; if (a) { const [k, p1 = 0, p2 = 0] = String(a).split(':'); list.push({ o, k, p1: +p1, p2: +p2, base: o.position.clone(), rot: o.rotation.clone() }); } }); root._anims = list; return list; },
  tick(root, t, dt) {
    const list = root._anims || this.collect(root);
    for (const a of list) {
      const o = a.o;
      switch (a.k) {
        case 'spinZ': o.rotation.z += dt * a.p1; break;
        case 'spinY': o.rotation.y += dt * a.p1; break;
        case 'slideZ': o.position.z = a.base.z + Math.sin(t * a.p2 * Math.PI * 2) * a.p1; break;
        case 'swingY': o.rotation.y = a.rot.y + Math.sin(t * a.p2 * Math.PI * 2) * a.p1; break;
        case 'blink': if (o.material) o.material.emissiveIntensity = (Math.sin(t * 5 + a.p1) > -.2) ? 2.2 : .25; break;
        case 'pulse': if (o.material) o.material.opacity = .1 + .06 * (1 + Math.sin(t * 2.4)); break;
      }
    }
    const mx = root._mixer; if (mx) mx.update(dt);
  }
};
