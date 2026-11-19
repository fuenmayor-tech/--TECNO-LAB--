/* =====================================================================
   Realidad virtual: laboratorio 360° con las partes en pedestales.
   Modos: pantalla (arrastrar), visor tipo Cardboard (estereoscópico +
   giroscopio + selección con la mirada) y WebXR immersive-vr (visores
   como Meta Quest) con controles o mirada.
   ===================================================================== */
Views.vr = {
  room: 'ext', xrOK: false,
  async enter(el, args, q) {
    this.xrOK = !!(navigator.xr && await navigator.xr.isSessionSupported?.('immersive-vr').catch(() => false));
    if (q.part && Models.has(q.part)) { const p = Models.find(q.part); if (p) { this.room = p.ubic === 'interno' ? 'int' : 'ext'; VRLab.pending = q.part; } }
    if (!Models.count()) {
      el.innerHTML = `<div class="section-head"><div><span class="eyebrow">${icon('vr')} Realidad virtual</span><h2>Laboratorio virtual TECNO LAB</h2><p>En el laboratorio virtual cada pedestal muestra un modelo 3D real. Se puede recorrer en pantalla, con un visor tipo Cardboard o con visores RV compatibles.</p></div></div>${noModelsHTML('RV')}`;
      bindNoModels(el, key => Router.go('vr?part=' + key));
      return;
    }
    el.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">${icon('vr')} Realidad virtual</span><h2>Laboratorio virtual TECNO LAB</h2><p>Mira a tu alrededor: cada pedestal tiene una parte del computador. Selecciónala para verla de cerca y escuchar su explicación.</p></div></div>
      <div class="vr-layout">
        <div>
          <div class="vr-stage" id="vrStage" tabindex="0" aria-label="Escena de realidad virtual. Arrastra para mirar alrededor y toca una parte para seleccionarla.">
            <div class="vr-overlay-btns">
              ${this.xrOK ? `<button class="btn btn-primary btn-sm" id="vrXR">${icon('vr')}Entrar en RV</button>` : ''}
              <button class="btn btn-sm" id="vrCard">${icon('smartphone')}Modo visor</button>
              <button class="icon-btn" id="vrFull" aria-label="Pantalla completa">${icon('max')}</button>
            </div>
            <button class="btn btn-sm vr-exit" id="vrExit" hidden>${icon('x')}Salir del visor</button>
            <div class="vr-divider" id="vrDiv" hidden></div>
            <div class="vr-tip" id="vrTip">${ENV.touch ? 'Desliza para mirar alrededor · toca una parte' : 'Arrastra para mirar alrededor · haz clic en una parte · flechas del teclado'}</div>
            ${GL.ok ? '' : `<div class="viewer-loading"><div>${icon('vr')}<span>La realidad virtual necesita gráficos 3D (WebGL), que no están disponibles aquí.</span></div></div>`}
          </div>
        </div>
        <aside class="card">
          <p class="small" style="color:var(--accent);margin:0 0 10px">${icon('grad')} Laboratorio de ${Store.grade}.°: ${Models.viewable().length || Models.count()} modelos 3D${Store.grade < 3 ? '. La sala “Por dentro de la CPU” se estudia desde 3.°' : ''}.</p>
          <div class="room-switch" role="group" aria-label="Sala"><button class="fchip" data-room="ext" aria-pressed="${this.room === 'ext'}">${icon('monitor')} Periféricos</button><button class="fchip" data-room="int" aria-pressed="${this.room === 'int'}">${icon(Store.grade < 3 ? 'lockI' : 'cpu')} Por dentro de la CPU${Store.grade < 3 ? ' (avance)' : ''}</button></div>
          <div id="vrInfo"><p class="muted">Selecciona una parte en la escena o en la lista.</p></div>
          <div class="mini-parts" id="vrList" style="margin-top:12px"></div>
          <div class="info-block" style="margin-top:16px"><h4>Cómo usarla</h4><ul>
            <li><b>Pantalla:</b> arrastra para mirar y toca una parte.</li>
            <li><b>Modo visor:</b> pon el celular en un visor tipo Cardboard, en horizontal. Mira una parte unos segundos para seleccionarla.</li>
            <li><b>Visor RV (WebXR):</b> ${this.xrOK ? 'disponible en este dispositivo: usa “Entrar en RV” y apunta con los controles.' : 'en visores como Meta Quest aparece el botón “Entrar en RV”.'}</li></ul></div>
          <label class="row small" style="margin-top:6px"><input type="checkbox" id="vrNarr" ${VRLab.narrate ? 'checked' : ''}> Narrar la parte al seleccionarla</label>
        </aside>
      </div>`;
    $$('[data-room]', el).forEach(b => b.onclick = () => { this.room = b.dataset.room; $$('[data-room]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); VRLab.build(this.room); this.drawList(); });
    $('#vrNarr', el).onchange = e => VRLab.narrate = e.target.checked;
    if (!GL.ok) return;
    await VRLab.mount($('#vrStage', el), this.room);
    this.drawList();
    $('#vrCard', el).onclick = () => VRLab.cardboard(true);
    $('#vrExit', el).onclick = () => VRLab.cardboard(false);
    $('#vrXR', el)?.addEventListener('click', () => VRLab.enterXR());
    $('#vrFull', el).onclick = () => { const s = $('#vrStage'); if (document.fullscreenElement) document.exitFullscreen(); else s.requestFullscreen?.().catch(() => toast('Pantalla completa no disponible.', 'bad')); };
  },
  drawList() {
    const L = $('#vrList'); if (!L) return;
    L.innerHTML = VRLab.parts.map(p => `<button class="mini-part" data-vp="${esc(p.id)}">${thumbHTML(p.id)}<span>${esc(p.n)}</span></button>`).join('');
    $$('[data-vp]', L).forEach(b => b.onclick = () => VRLab.select(b.dataset.vp, true));
  },
  showInfo(p) {
    const box = $('#vrInfo'); if (!box || !p) return;
    box.innerHTML = `<h3 style="margin:0 0 6px">${esc(p.n)}</h3><div class="row" style="gap:6px;margin-bottom:8px">${tipoChip(p.tipo)}</div><p>${esc(Store.grade <= 2 || p.custom ? p.s : p.que)}</p>${p.fn ? `<p class="muted small"><b>Función:</b> ${esc(p.fn)}</p>` : ''}<div class="row">${speakBtn('Escuchar')}<button class="btn btn-sm" id="vrToAR">${icon('scan')}Ver en RA</button></div>`;
    $('[data-speak]', box).onclick = e => Voice.toggle(partText(p), e.currentTarget);
    $('#vrToAR', box).onclick = () => ARRun.start(p.id, VRLab.parts, { id: 'free' });
  },
  leave() { VRLab.unmount(); },
  onGrade() { Router.route(); }
};

const VRLab = {
  narrate: true, parts: [], peds: [], sel: null, pending: null, mode: 'screen', yaw: 0, pitch: -.18,
  init() {
    const T = GL.T; if (this.scene) return;
    const s = this.scene = new T.Scene(); GL.studio(s); s.fog = new T.Fog(0x070d1d, 7, 22);
    const sky = new T.Mesh(new T.SphereGeometry(40, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, fog: false, map: (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#04070f'); g.addColorStop(.45, '#0b1a3a'); g.addColorStop(.55, '#1a1030'); g.addColorStop(1, '#05070e'); x.fillStyle = g; x.fillRect(0, 0, 16, 256); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })() }));
    s.add(sky);
    this.floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; this.floorCtx = c.getContext('2d'); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
    const floor = new T.Mesh(new T.CircleGeometry(14, 96), new T.MeshStandardMaterial({ map: this.floorTex, roughness: .9, metalness: 0, transparent: true }));
    floor.rotation.x = -Math.PI / 2; s.add(floor);
    const pts = new Float32Array(900); for (let i = 0; i < 300; i++) { const r = 6 + Math.random() * 12, a = Math.random() * Math.PI * 2; pts[i * 3] = Math.cos(a) * r; pts[i * 3 + 1] = Math.random() * 8; pts[i * 3 + 2] = Math.sin(a) * r; }
    const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pts, 3));
    this.dust = new T.Points(pg, new T.PointsMaterial({ size: .05, color: 0xbfe8ff, transparent: true, opacity: .7, depthWrite: false })); s.add(this.dust);
    this.rig = new T.Group(); s.add(this.rig);
    this.cam = new T.PerspectiveCamera(70, 1, .05, 100); this.cam.position.set(0, 1.6, 0); this.cam.rotation.order = 'YXZ'; this.rig.add(this.cam);
    const ret = this.reticle = new T.Group(); ret.position.z = -1.2; this.cam.add(ret);
    ret.add(new T.Mesh(new T.RingGeometry(.016, .024, 32), new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: .9 })));
    this.retFill = new T.Mesh(new T.CircleGeometry(.016, 32), new T.MeshBasicMaterial({ color: 0x7dd3fc, depthTest: false, transparent: true })); this.retFill.scale.setScalar(.001); ret.add(this.retFill);
    ret.traverse(o => o.renderOrder = 999); ret.visible = false;
    this.panel = new T.Mesh(new T.PlaneGeometry(1.7, .96), new T.MeshBasicMaterial({ transparent: true, depthWrite: false })); this.panel.visible = false; s.add(this.panel);
    this.ray = new T.Raycaster(); this.tmpM = new T.Matrix4();
    this.camL = new T.PerspectiveCamera(80, 1, .05, 100); this.camR = new T.PerspectiveCamera(80, 1, .05, 100); this.camL.position.x = -.032; this.camR.position.x = .032; this.cam.add(this.camL, this.camR);
  },
  drawFloor() {
    const x = this.floorCtx, W = 1024, acc = GL.accent(); x.clearRect(0, 0, W, W);
    const g = x.createRadialGradient(512, 512, 0, 512, 512, 512); g.addColorStop(0, 'rgba(18,30,60,1)'); g.addColorStop(1, 'rgba(6,10,22,0)'); x.fillStyle = g; x.fillRect(0, 0, W, W);
    x.strokeStyle = acc; x.globalAlpha = .18; x.lineWidth = 1.5; for (let i = 0; i <= W; i += 36) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, W); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    x.globalAlpha = .7; x.lineWidth = 4; [90, 265].forEach(r => { x.beginPath(); x.arc(512, 512, r, 0, 7); x.stroke(); }); x.globalAlpha = 1;
    this.floorTex.needsUpdate = true;
  },
  labelSprite(text) {
    const T = GL.T, c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = 'rgba(8,14,30,.82)'; x.beginPath(); x.roundRect ? x.roundRect(8, 16, 496, 96, 48) : x.rect(8, 16, 496, 96); x.fill(); x.strokeStyle = GL.accent(); x.lineWidth = 4; x.stroke();
    x.fillStyle = '#fff'; x.font = '600 44px Lexend, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text.length > 22 ? text.slice(0, 21) + '…' : text, 256, 66);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(1.15, .29, 1); return sp;
  },
  async build(room) {
    const T = GL.T; this.init(); this.drawFloor();
    this.peds.forEach(p => this.scene.remove(p.g)); this.peds = []; this.sel = null; this.panel.visible = false;
    const g = Store.grade, inRoom = p => (room === 'int' ? p.ubic === 'interno' : p.ubic !== 'interno');
    let all = Models.viewable(g).filter(inRoom);
    if (!all.length) all = Models.viewableAll().filter(inRoom);
    if (!all.length) all = Models.viewableAll();
    this.parts = all;
    const n = this.parts.length, R = n > 12 ? 3.8 : 3.1, acc = new T.Color(GL.accent());
    const pedMat = new T.MeshStandardMaterial({ color: 0x1a2236, roughness: .4, metalness: .5 });
    const glowMat = new T.MeshStandardMaterial({ color: acc, emissive: acc, emissiveIntensity: 1.4 });
    const tok = this._btok = (this._btok || 0) + 1;
    for (let i = 0; i < n; i++) {
      const p = this.parts[i], a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (n % 2 ? 0 : Math.PI / n);
      const g = new T.Group(); g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); g.lookAt(0, 0, 0);
      const ped = new T.Mesh(new T.CylinderGeometry(.3, .36, .85, 40), pedMat); ped.position.y = .425; g.add(ped);
      const ring = new T.Mesh(new T.TorusGeometry(.31, .012, 8, 64), glowMat); ring.rotation.x = Math.PI / 2; ring.position.y = .86; g.add(ring);
      const hit = new T.Mesh(new T.CylinderGeometry(.48, .48, 2, 12), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 1; hit.userData.pid = p.id; g.add(hit);
      const lab = this.labelSprite(p.n); lab.position.y = 1.85; g.add(lab);
      const spot = new T.Group(); spot.position.y = .87; g.add(spot);
      this.scene.add(g); const rec = { g, spot, hit, p, model: null, s: .62, ts: .62 }; this.peds.push(rec);
      Models.instance(p.id).then(m => { if (tok !== this._btok) return; m.scale.setScalar(rec.s); spot.add(m); rec.model = m; }).catch(() => {});
    }
    if (this.pending) { const id = this.pending; this.pending = null; setTimeout(() => this.select(id, true), 400); }
  },
  async mount(host, room) {
    this.init(); this.host = host;
    GL.mount(host, (w, h) => { this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }, true);
    await this.build(room); this.bindInput(host);
    this.last = performance.now(); GL.setLoop((t, f) => this.frame(t, f));
  },
  unmount() {
    if (this.mode === 'cardboard') this.cardboard(false);
    if (GL.renderer?.xr.isPresenting) GL.renderer.xr.getSession()?.end();
    this.unbind?.(); GL.unmount(); this.host = null;
  },
  select(id, fromUI = false) {
    const rec = this.peds.find(r => r.p.id === id); if (!rec) return;
    this.peds.forEach(r => r.ts = r === rec ? .95 : .62); this.sel = rec;
    if (fromUI) { const wp = rec.g.position; this.yaw = Math.atan2(-wp.x, -wp.z); this.pitch = -.12; }
    this.drawPanel(rec.p); Views.vr.showInfo(rec.p); Sfx.click();
    if (this.narrate && (this.mode !== 'screen' || !fromUI)) Voice.speak(partText(rec.p));
  },
  drawPanel(p) {
    const T = GL.T, c = document.createElement('canvas'); c.width = 1024; c.height = 576; const x = c.getContext('2d'); const acc = GL.accent();
    x.fillStyle = 'rgba(8,14,30,.92)'; x.beginPath(); x.roundRect ? x.roundRect(0, 0, 1024, 576, 40) : x.rect(0, 0, 1024, 576); x.fill();
    x.fillStyle = acc; x.fillRect(48, 40, 120, 10);
    x.fillStyle = '#fff'; x.font = '700 66px Sora, sans-serif'; x.fillText(p.n, 48, 130);
    x.fillStyle = acc; x.font = '600 34px Lexend, sans-serif'; x.fillText(TIPOS[p.tipo] ? 'Dispositivo de ' + TIPOS[p.tipo].n.toLowerCase() : '', 48, 186);
    x.fillStyle = '#dbe5fb'; x.font = '400 34px Lexend, sans-serif';
    const text = Store.grade <= 2 || p.custom ? p.s : p.fn; const words = String(text || '').split(' '); let line = '', y = 260;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > 920) { x.fillText(line, 48, y); line = w; y += 48; if (y > 470) break; } else line = t; }
    if (line && y <= 470) x.fillText(line, 48, y);
    x.fillStyle = '#7f8db0'; x.font = '400 26px Lexend, sans-serif'; x.fillText('TECNO LAB · Mira otra parte para seleccionarla', 48, 540);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    this.panel.material.map?.dispose(); this.panel.material.map = t; this.panel.material.needsUpdate = true;
    const wp = this.sel.g.position.clone(); const dir = wp.clone().normalize();
    this.panel.position.copy(wp).addScaledVector(dir, -.95); this.panel.position.y = 1.55;
    this.panel.position.applyAxisAngle(new T.Vector3(0, 1, 0), .42);
    this.panel.lookAt(0, 1.55, 0); this.panel.visible = true;
  },
  bindInput(host) {
    this.unbind?.();
    let down = null, moved = 0;
    const pd = e => { if (e.target.closest('button')) return; down = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; moved = 0; host.setPointerCapture?.(e.pointerId); };
    const pm = e => { if (!down || this.mode !== 'screen') return; const dx = e.clientX - down.x, dy = e.clientY - down.y; moved = Math.max(moved, Math.hypot(dx, dy)); this.yaw = down.yaw + dx * .005; this.pitch = clamp(down.pitch + dy * .004, -1.2, 1.2); };
    const pu = e => { if (down && moved < 6 && this.mode === 'screen') this.pick(e); down = null; };
    const kd = e => { if (this.mode !== 'screen') return; if (e.key === 'ArrowLeft') this.yaw += .15; if (e.key === 'ArrowRight') this.yaw -= .15; if (e.key === 'ArrowUp') this.pitch = clamp(this.pitch + .1, -1.2, 1.2); if (e.key === 'ArrowDown') this.pitch = clamp(this.pitch - .1, -1.2, 1.2); if (e.key === 'Enter' && this.hover) this.select(this.hover); };
    const wh = e => { e.preventDefault(); this.cam.fov = clamp(this.cam.fov + e.deltaY * .03, 35, 85); this.cam.updateProjectionMatrix(); };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm); host.addEventListener('pointerup', pu); host.addEventListener('keydown', kd); host.addEventListener('wheel', wh, { passive: false });
    this.unbind = () => { host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm); host.removeEventListener('pointerup', pu); host.removeEventListener('keydown', kd); host.removeEventListener('wheel', wh); };
  },
  pick(e) {
    const T = GL.T, r = this.host.getBoundingClientRect();
    const v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(v, this.cam); const hit = this.ray.intersectObjects(this.peds.map(p => p.hit))[0];
    if (hit) this.select(hit.object.userData.pid);
  },
  gaze(dt, origin, dir) {
    this.ray.set(origin, dir); const hit = this.ray.intersectObjects(this.peds.map(p => p.hit))[0];
    const id = hit ? hit.object.userData.pid : null;
    if (id !== this.gazeId) { this.gazeId = id; this.gazeT = 0; }
    if (id && (!this.sel || this.sel.p.id !== id)) { this.gazeT += dt; if (this.gazeT > 1.5) { this.select(id); this.gazeT = 0; } }
    const k = id && (!this.sel || this.sel.p.id !== id) ? clamp(this.gazeT / 1.5, .001, 1) : .001; this.retFill.scale.setScalar(k);
  },
  frame(now, xrFrame) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; const t = now / 1000; const r = GL.renderer;
    for (const p of this.peds) { p.s += (p.ts - p.s) * Math.min(1, dt * 6); if (p.model) { p.model.scale.setScalar(p.s); p.spot.rotation.y += dt * (p === this.sel ? 1 : .35); Anim.tick(p.model, t, dt); } }
    this.dust.rotation.y += dt * .01;
    if (r.xr.isPresenting) {
      const xc = r.xr.getCamera(); const o = new GL.T.Vector3(), d = new GL.T.Vector3(); xc.getWorldPosition(o); xc.getWorldDirection(d);
      this.reticle.visible = !this.ctrls?.some(c => c.userData.active); if (this.reticle.visible) this.gaze(dt, o, d);
      r.render(this.scene, this.cam); return;
    }
    if (this.mode === 'cardboard') {
      if (this.ori) this.cam.quaternion.copy(this.ori);
      this.cam.updateMatrixWorld(); const o = new GL.T.Vector3(), d = new GL.T.Vector3(); this.cam.getWorldPosition(o); this.cam.getWorldDirection(d); this.gaze(dt, o, d);
      this.stereo(); return;
    }
    this.cam.rotation.set(this.pitch, this.yaw, 0);
    r.render(this.scene, this.cam);
  },
  stereo() {
    const r = GL.renderer, size = r.getSize(new GL.T.Vector2()), w = size.x / 2, h = size.y, ipd = .064;
    this.cam.updateMatrixWorld();
    [[this.camL, -1], [this.camR, 1]].forEach(([c, s], i) => {
      c.aspect = w / h; c.updateProjectionMatrix();
      r.setScissorTest(true); r.setScissor(i * w, 0, w, h); r.setViewport(i * w, 0, w, h);
      this.reticle.visible = true; r.render(this.scene, c);
    });
    r.setScissorTest(false); r.setViewport(0, 0, size.x, size.y);
  },
  async cardboard(on) {
    const stage = $('#vrStage'); if (!stage) return;
    if (on) {
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') { toast('Sin permiso del giroscopio: el modo visor no podrá seguir tu cabeza.', 'bad'); } } catch { /* sin permiso */ } }
      this.mode = 'cardboard'; stage.classList.add('cardboard'); $('#vrExit').hidden = false; $('#vrDiv').hidden = false; $('#vrTip').hidden = true; $$('.vr-overlay-btns', stage).forEach(b => b.hidden = true);
      try { await stage.requestFullscreen?.(); await screen.orientation?.lock?.('landscape'); } catch { /* opcional */ }
      const T = GL.T, euler = new T.Euler(), q1 = new T.Quaternion(-Math.sqrt(.5), 0, 0, Math.sqrt(.5)), z = new T.Vector3(0, 0, 1), q0 = new T.Quaternion(); let a0 = null;
      this.onOri = e => {
        if (e.alpha == null) return; if (a0 === null) a0 = e.alpha;
        const al = T.MathUtils.degToRad(e.alpha - a0), be = T.MathUtils.degToRad(e.beta), ga = T.MathUtils.degToRad(e.gamma), or = T.MathUtils.degToRad(screen.orientation?.angle ?? window.orientation ?? 0);
        euler.set(be, al, -ga, 'YXZ'); this.ori ??= new T.Quaternion(); this.ori.setFromEuler(euler); this.ori.multiply(q1); this.ori.multiply(q0.setFromAxisAngle(z, -or));
      };
      addEventListener('deviceorientation', this.onOri);
      setTimeout(() => { if (!this.ori) toast('No se detecta el giroscopio. Puedes seguir arrastrando la pantalla.', 'info'); }, 2500);
      if (!this.ori) this.ori = null;
      GL.resize(); this.reticle.visible = true;
    } else {
      this.mode = 'screen'; stage.classList.remove('cardboard'); $('#vrExit').hidden = true; $('#vrDiv').hidden = true; $('#vrTip').hidden = false; $$('.vr-overlay-btns', stage).forEach(b => b.hidden = false);
      removeEventListener('deviceorientation', this.onOri); this.ori = null; this.reticle.visible = false;
      try { screen.orientation?.unlock?.(); } catch { /* */ } if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setTimeout(() => GL.resize(), 100);
    }
  },
  async enterXR() {
    const r = GL.renderer, T = GL.T;
    try {
      const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      r.xr.enabled = true; r.xr.setReferenceSpaceType('local-floor'); await r.xr.setSession(s);
      this.cam.position.set(0, 0, 0); this.reticle.visible = true;
      this.ctrls = [0, 1].map(i => {
        const c = r.xr.getController(i); const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)]), new T.LineBasicMaterial({ color: new T.Color(GL.accent()) })); line.scale.z = 5; c.add(line);
        c.addEventListener('connected', () => c.userData.active = true); c.addEventListener('disconnected', () => c.userData.active = false);
        c.addEventListener('select', () => { this.tmpM.identity().extractRotation(c.matrixWorld); this.ray.ray.origin.setFromMatrixPosition(c.matrixWorld); this.ray.ray.direction.set(0, 0, -1).applyMatrix4(this.tmpM); const h = this.ray.intersectObjects(this.peds.map(p => p.hit))[0]; if (h) this.select(h.object.userData.pid); });
        this.rig.add(c); return c;
      });
      s.addEventListener('end', () => { r.xr.enabled = false; this.ctrls?.forEach(c => this.rig.remove(c)); this.ctrls = null; this.cam.position.set(0, 1.6, 0); this.reticle.visible = false; GL.resize(); });
    } catch (e) { toast('No se pudo entrar en RV: ' + (e.message || e), 'bad'); }
  }
};
