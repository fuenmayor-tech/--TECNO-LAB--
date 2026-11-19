/* =====================================================================
   Gestor de modelos 3D
   Solo se muestran modelos reales:
   1) Modelo subido por la profesora desde la app (IndexedDB, este dispositivo)
   2) Archivo models/<id>.glb publicado junto a la app (detectado al abrir)
   3) Modelos nuevos declarados en models/modelos.json (piezas que no están
      en la lista base, por ejemplo un carro, un robot o una tableta)
   Si una parte no tiene modelo, se muestra su icono y la opción de cargarlo.
   ===================================================================== */
/* Base64 → ArrayBuffer (rápido y sin red) */
function b64ToBuffer(b64) {
  if (typeof Uint8Array.fromBase64 === 'function') { try { return Uint8Array.fromBase64(String(b64).trim()).buffer; } catch { /* se decodifica con atob */ } }
  const bin = atob(b64), n = bin.length, u8 = new Uint8Array(n); for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}
/* Cada archivo models/js/<nombre>.js llama a TL_GLB("archivo.glb", "base64…") */
window.TL_GLB = (file, b64) => { const e = Models.jsQueue[file]; if (e) e.res(b64); };

const Models = {
  uploads: [], glbAvail: {}, extras: [], templates: new Map(), thumbs: {}, _loader: null, probed: false,
  async init() {
    /* Modelos incluidos con la app (models/modelos.json se copia aquí al construir) */
    /* Si el index trae los modelos incluidos, funcionan siempre: abriendo el archivo, sin internet y en las apps */
    /* incluidos: true = dentro del index · 'js' = en models/js/*.js (cargan también con doble clic) */
    this.embedded = typeof MODELOS_BASE !== 'undefined' ? (MODELOS_BASE.incluidos || false) : false;
    if (typeof MODELOS_BASE !== 'undefined') this.readManifest(MODELOS_BASE, { trust: !!this.embedded || !ENV.file, embedded: this.embedded });
    try { this.uploads = await DB.all('uploads'); } catch { this.uploads = []; }
    this.uploads.forEach(u => { if (u.partId) delete this.thumbs[u.partId]; }); // el modelo subido reemplaza la miniatura publicada
    this.probing = this.probe(); // en segundo plano
  },
  credits: {},
  /* Lee models/modelos.json: { "modelos": [{ "archivo": "carro.glb", "nombre": "Carro", "tipo": "otro", "grado": 1, "descripcion": "…", "autor": "…", "licencia": "…", "fuente": "https://…" }] }
     · "parte": "mouse"          → reemplaza el modelo de una parte de la lista base
     · "variante_de": "mouse"    → otra versión de esa parte (comparte su ficha)
     · sin parte ni variante     → objeto nuevo (carro, robot, tableta…) */
  readManifest(j, { trust = true, embedded = false } = {}) {
    const list = Array.isArray(j) ? j : (Array.isArray(j?.modelos) ? j.modelos : []);
    const txt = (v, n = 400) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
    list.forEach(m => {
      if (!m || typeof m.archivo !== 'string') return;
      const file = m.archivo.trim().replace(/^\.?\/?(models\/)?/i, '');
      if (!/^[\w.\-]+\.glb$/i.test(file)) return;
      const base = file.replace(/\.glb$/i, '');
      const cred = { titulo: txt(m.titulo, 120), autor: txt(m.autor, 120), perfil: /^https:\/\//.test(m.perfil || '') ? m.perfil : '', licencia: txt(m.licencia, 60), licencia_url: /^https?:\/\//.test(m.licencia_url || '') ? m.licencia_url : '', fuente: /^https:\/\//.test(m.fuente || '') ? m.fuente : '', archivo: file };
      const partId = PART[m.parte] ? m.parte : (!m.variante_de && PART[base] ? base : null);
      const mini = typeof m.miniatura === 'string' && /^data:image\/(webp|png|jpeg);base64,[\w+\/=]+$/.test(m.miniatura) ? m.miniatura
        : typeof m.miniatura === 'string' && /^[\w\/.\-]+\.(webp|png|jpe?g)$/i.test(m.miniatura) && !m.miniatura.includes('..') ? 'models/' + m.miniatura.replace(/^\.?\/?(models\/)?/i, '') : null;
      const src = embedded === true ? 'emb:' + file : embedded === 'js' ? 'js:' + file : 'models/' + file;
      const keep = id => /^(emb|js):/.test(String(this.glbAvail[id] || '')); // un modelo incluido no se reemplaza por el archivo suelto
      if (partId) { if (trust && !keep(partId)) { this.glbAvail[partId] = src; if (mini && !this.uploadFor(partId)) this.thumbs[partId] = mini; } if (!this.credits[partId] || embedded) this.credits[partId] = cred; return; }
      const id = 'pub_' + base.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (this.extras.some(x => x.id === id)) return;
      const of = PART[m.variante_de] || null;
      const desc = txt(m.descripcion || m.desc) || (of ? of.s : 'Modelo 3D agregado por la profesora.');
      const g = clamp(parseInt(m.grado, 10) || (of ? of.g : 1), 1, 5);
      const tipo = TIPOS[m.tipo] ? m.tipo : (of ? of.tipo : 'otro');
      this.extras.push({ id, n: txt(m.nombre, 60) || (of ? of.n : base), tipo, ubic: m.ubicacion === 'interno' ? 'interno' : (of ? of.ubic : 'externo'), g, ic: of ? of.ic : 'cube', s: desc, que: desc, fn: txt(m.funcion) || (of ? of.fn : ''), car: of ? of.car : [], custom: true, kind: 'glb', published: true, of: of ? of.id : null });
      if (trust && !keep(id)) { this.glbAvail[id] = src; if (mini) this.thumbs[id] = mini; }
      this.credits[id] = cred;
    });
  },
  /* Detecta qué modelos existen en el servidor */
  async probe() {
    if (ENV.file) { this.probed = true; return; }
    try { const r = await fetch('models/modelos.json', { cache: 'no-cache' }); if (r.ok) this.readManifest(await r.json()); } catch { /* sin manifiesto o sin conexión: se usan los modelos incluidos */ }
    await Promise.all(PARTS.filter(p => !this.glbAvail[p.id]).map(async p => {
      try { const r = await fetch(`models/${p.id}.glb`, { method: 'HEAD', cache: 'no-cache' }); const ct = r.headers.get('content-type') || ''; if (r.ok && !ct.includes('text/html')) this.glbAvail[p.id] = `models/${p.id}.glb`; } catch { /* sin conexión o sin archivo */ }
    }));
    this.probed = true;
    if (!this._shown) return; // la primera vista aún no se ha dibujado: el arranque se encarga
    const nuevos = Object.keys(this.glbAvail).filter(id => !this._known.has(id));
    if (!nuevos.length) return;
    nuevos.forEach(id => this._known.add(id));
    if (GL.ok) { await this.makeThumbs(nuevos); refreshThumbs(); }
    if (['home', 'explore', 'vr', 'ar', 'study'].includes(Router.cur) && $('#arStage').hidden) Router.route(); // había modelos que la vista no conocía
  },
  /* Lo llama el arranque después de dibujar la primera vista */
  markShown() { this._shown = true; this._known = new Set(Object.keys(this.glbAvail)); },
  customParts() {
    const ups = this.uploads.filter(u => !u.partId).map(u => ({ id: u.id, n: u.name, tipo: TIPOS[u.tipo] ? u.tipo : 'otro', ubic: 'externo', g: 1, ic: u.kind === 'img' ? 'image' : 'cube', s: u.desc || 'Modelo subido por la profesora.', que: u.desc || 'Modelo subido por la profesora.', fn: u.desc || '', car: [], custom: true, kind: u.kind }));
    return [...this.extras, ...ups];
  },
  allParts(g = Store.grade) { return [...partsForGrade(g), ...this.customParts().filter(p => !p.published || p.g <= g)]; },
  every() { return [...PARTS, ...this.customParts()]; },
  find(id) { return PART[id] || this.customParts().find(p => p.id === id) || null; },
  uploadFor(id) { const list = this.uploads.filter(u => u.id === id || u.partId === id); return list.sort((a, b) => b.date - a.date)[0] || null; },
  has(id) { return !!(this.uploadFor(id) || this.glbAvail[id]); },
  /* Partes que sí tienen modelo 3D (para 3D, RA y RV) */
  byGrade(list) { return list.map((p, i) => [p, i]).sort((a, b) => (a[0].custom && !a[0].published ? 9 : a[0].g) - (b[0].custom && !b[0].published ? 9 : b[0].g) || a[1] - b[1]).map(x => x[0]); },
  viewable(g = Store.grade) { return this.byGrade(this.allParts(g).filter(p => this.has(p.id))); },
  viewableAll() { return this.byGrade(this.every().filter(p => this.has(p.id))); },
  count() { return this.viewableAll().length; },
  sourceOf(id) { if (this.uploadFor(id)) return 'upload'; if (this.glbAvail[id]) return 'glb'; return null; },
  sourceLabel(id) { return { upload: 'Modelo subido en este dispositivo', glb: 'Modelo 3D' }[this.sourceOf(id)] || 'Ficha de estudio'; },
  loader() {
    if (this._loader) return this._loader;
    const T = GL.T; const l = new T.GLTFLoader();
    try { const d = new T.DRACOLoader(); d.setDecoderPath(Libs.dracoPath); l.setDRACOLoader(d); } catch { /* sin draco */ }
    try { l.setMeshoptDecoder(T.MeshoptDecoder); } catch { /* sin meshopt */ }
    return (this._loader = l);
  },
  parseGLB(buffer) { return new Promise((res, rej) => this.loader().parse(buffer, '', res, () => rej(new Error('El archivo no es un GLB válido o está dañado.')))); },
  loadGLB(url) { return new Promise((res, rej) => this.loader().load(url, res, undefined, () => rej(new Error('No se pudo descargar ' + url)))); },
  /* Modelo guardado en models/js/<nombre>.js: se carga con una etiqueta <script>, que funciona
     en la web, en las apps y también al abrir el index.html con doble clic */
  jsQueue: {},
  jsBuffer(file) {
    let e = this.jsQueue[file];
    if (!e) {
      e = this.jsQueue[file] = {};
      e.p = new Promise((res, rej) => { e.res = res; e.rej = rej; });
      const s = document.createElement('script'); s.async = true;
      s.src = 'models/js/' + file.replace(/\.glb$/i, '') + '.js';
      const falta = () => { delete this.jsQueue[file]; e.rej(new Error('No se encontró el modelo ' + file + '. La carpeta models debe estar junto al index.html (descomprime el zip completo).')); };
      /* Si falta el .js pero está el .glb en models/ (por ejemplo, subido después a GitHub), se usa ese archivo */
      s.onerror = () => { s.remove(); if (ENV.file) return falta(); fetch('models/' + file).then(r => r.ok && !(r.headers.get('content-type') || '').includes('text/html') ? r.arrayBuffer() : Promise.reject()).then(b => e.res(b), falta); };
      s.onload = () => s.remove();
      document.head.appendChild(s);
    }
    return e.p.then(x => { delete this.jsQueue[file]; return typeof x === 'string' ? b64ToBuffer(x) : x; });
  },
  /* Modelo incluido dentro del index.html (texto base64 al final de la página) */
  async embeddedBuffer(file) {
    const find = () => [...document.querySelectorAll('script[data-glb]')].find(s => s.dataset.glb === file);
    let el = find();
    if (!el && document.readyState === 'loading') { await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true })); el = find(); }
    if (!el) throw new Error('El modelo ' + file + ' no está incluido.');
    return b64ToBuffer(el.textContent);
  },
  /* Panel con la imagen subida (cuando la profesora sube una foto en lugar de un .glb) */
  imageBoard(img) {
    const T = GL.T, g = new T.Group(); const ar = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1;
    const h = ar >= 1 ? 1 / ar : 1, w = ar >= 1 ? 1 : ar;
    const tex = new T.Texture(img); tex.colorSpace = T.SRGBColorSpace; tex.needsUpdate = true;
    const frame = new T.Mesh(new T.BoxGeometry(w + .06, h + .06, .04), new T.MeshStandardMaterial({ color: 0x1b2638, roughness: .4, metalness: .3 })); frame.position.y = h / 2 + .08; g.add(frame);
    [1, -1].forEach(sd => { const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: .6 })); p.position.set(0, h / 2 + .08, .021 * sd); if (sd < 0) p.rotation.y = Math.PI; g.add(p); });
    const foot = new T.Mesh(new T.BoxGeometry(w * .5, .06, .22), new T.MeshStandardMaterial({ color: 0x9aa7b8, roughness: .3, metalness: .8 })); foot.position.y = .03; g.add(foot);
    return g;
  },
  /* Centra y escala para que la medida mayor sea 1 y la base quede en y = 0 */
  normalize(obj) {
    const T = GL.T; obj.updateMatrixWorld(true);
    const box = new T.Box3(); const tmp = new T.Box3();
    obj.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && !o.userData.noBounds && o.geometry) { o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box.union(tmp); } });
    if (box.isEmpty()) box.set(new T.Vector3(-.5, 0, -.5), new T.Vector3(.5, 1, .5));
    const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
    const s = 1 / Math.max(size.x, size.y, size.z, 1e-6);
    obj.position.x -= c.x; obj.position.y -= box.min.y; obj.position.z -= c.z;
    const wrap = new T.Group(); wrap.add(obj); wrap.scale.setScalar(s);
    wrap.userData.h = size.y * s; wrap.userData.w = size.x * s; wrap.userData.d = size.z * s;
    return wrap;
  },
  async template(id) {
    if (this.templates.has(id)) return this.templates.get(id);
    const p = (async () => {
      const src = this.sourceOf(id); let obj = null, clips = [];
      if (!src) throw new Error('Esta parte todavía no tiene modelo 3D.');
      try {
        if (src === 'upload') {
          const u = this.uploadFor(id);
          if (u.kind === 'img') { const img = await blobToImage(u.data); obj = this.imageBoard(img); }
          else { const gl = await this.parseGLB(u.data); obj = gl.scene || gl.scenes[0]; clips = gl.animations || []; }
        } else {
          const url = this.glbAvail[id];
          const gl = url.startsWith('emb:') ? await this.parseGLB(await this.embeddedBuffer(url.slice(4)))
            : url.startsWith('js:') ? await this.parseGLB(await this.jsBuffer(url.slice(3))) : await this.loadGLB(url);
          obj = gl.scene || gl.scenes[0]; clips = gl.animations || [];
        }
      } catch (e) { console.warn(e); throw new Error(`No se pudo abrir el modelo de “${this.find(id)?.n || id}”. Revisa que el archivo .glb esté completo.`); }
      if (!obj) throw new Error('El archivo no trae ninguna escena 3D.');
      obj.traverse(o => { if (o.isMesh) { o.frustumCulled = true; if (o.material && o.material.map) o.material.map.anisotropy = 4; } });
      const wrap = this.normalize(obj); wrap._clips = clips; wrap.userData.source = src;
      return wrap;
    })();
    this.templates.set(id, p);
    p.catch(() => this.templates.delete(id));
    return p;
  },
  async instance(id) {
    const T = GL.T; const tpl = await this.template(id);
    const hasSkin = (() => { let s = false; tpl.traverse(o => { if (o.isSkinnedMesh) s = true; }); return s; })();
    const inner = hasSkin ? T.SkeletonUtils.clone(tpl) : tpl.clone(true);
    const inst = new T.Group(); inst.add(inner); // grupo exterior: se puede escalar sin perder la normalización
    inst.userData.h = tpl.userData.h; inst.userData.source = tpl.userData.source;
    const clips = tpl._clips || [];
    if (clips.length) { const mx = new T.AnimationMixer(inner); clips.forEach(c => mx.clipAction(c).play()); inst._mixer = mx; }
    Anim.collect(inst);
    return inst;
  },
  /* Miniaturas renderizadas con el mismo motor 3D (solo para modelos reales) */
  _thumbScene: null,
  async makeThumbs(ids) {
    if (!GL.ok) return;
    ids = [...new Set(ids)].filter(id => this.has(id) && !this.thumbs[id]); // las miniaturas publicadas ya vienen hechas
    if (!ids.length) return;
    const T = GL.T, r = GL.renderer;
    if (!this._thumbScene) { const s = new T.Scene(); GL.studio(s); const cam = new T.PerspectiveCamera(30, 1, .01, 50); this._thumbScene = { s, cam }; }
    const { s, cam } = this._thumbScene; const size = 320;
    if (r.xr.isPresenting) return;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const obj = await this.instance(id); s.add(obj);
        const sph = new T.Box3().setFromObject(obj).getBoundingSphere(new T.Sphere());
        const dist = sph.radius / Math.sin(T.MathUtils.degToRad(15)) * 1.02;
        const dir = new T.Vector3(.62, .42, .66).normalize();
        cam.position.copy(sph.center).addScaledVector(dir, dist); cam.lookAt(sph.center); cam.updateProjectionMatrix();
        Anim.tick(obj, 0, 0);
        const prev = r.getSize(new T.Vector2());
        r.setSize(size, size, false); r.render(s, cam);
        this.thumbs[id] = r.domElement.toDataURL('image/png');
        r.setSize(prev.x, prev.y, false);
        s.remove(obj);
      } catch (e) { console.warn('miniatura', id, e); }
      if (i % 4 === 3) await sleep(0);
    }
    GL.resize();
  },
  async addUpload({ file, name, partId, tipo, desc }) {
    const isImg = /^image\//.test(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const isGlb = /\.glb$/i.test(file.name) || file.type === 'model/gltf-binary';
    if (!isImg && !isGlb) throw new Error('Formato no admitido. Sube un modelo .glb o una imagen .png, .jpg o .webp.');
    if (file.size > 150 * 1024 * 1024) throw new Error('El archivo pesa más de 150 MB; redúcelo antes de subirlo.');
    const data = isImg ? file : await file.arrayBuffer();
    if (isGlb) { await this.parseGLB(data.slice(0)); } else { await blobToImage(file); }
    const rec = { id: 'up_' + uid(), kind: isImg ? 'img' : 'glb', name: name || file.name.replace(/\.[^.]+$/, ''), partId: partId || null, tipo: tipo || 'otro', desc: desc || '', fileName: file.name, size: file.size, date: Date.now(), data };
    let persisted = true;
    try { await DB.put('uploads', rec); navigator.storage?.persist?.().catch(() => {}); } catch { persisted = false; }
    this.uploads.push(rec);
    const key = rec.partId || rec.id; this.templates.delete(key); delete this.thumbs[key];
    await this.makeThumbs([key]); refreshThumbs();
    return { rec, persisted };
  },
  async removeUpload(id) {
    const rec = this.uploads.find(u => u.id === id); if (!rec) return;
    try { await DB.del('uploads', id); } catch { /* ya no estaba */ }
    this.uploads = this.uploads.filter(u => u.id !== id);
    const key = rec.partId || rec.id; this.templates.delete(key); delete this.thumbs[key];
    if (rec.partId && this.has(rec.partId)) { await this.makeThumbs([rec.partId]); }
    refreshThumbs();
  }
};
function blobToImage(blob) { return new Promise((res, rej) => { const u = URL.createObjectURL(blob); const i = new Image(); i.onload = () => { res(i); setTimeout(() => URL.revokeObjectURL(u), 1000); }; i.onerror = () => { URL.revokeObjectURL(u); rej(new Error('La imagen no se pudo abrir.')); }; i.src = u; }); }
/* Imagen o icono de una parte (para tarjetas, juegos y quices) */
function thumbHTML(id, cls = '') {
  const p = Models.find(id); const src = Models.thumbs[id];
  return src ? `<img class="${cls}" data-thumb="${esc(id)}" src="${src}" alt="${esc(p ? p.n : id)}" loading="lazy">`
    : `<span class="${cls} thumb-ic" data-thumb="${esc(id)}" role="img" aria-label="${esc(p ? p.n : id)}">${icon(p?.ic || 'cube')}</span>`;
}
function refreshThumbs(root = document) {
  $$('[data-thumb]', root).forEach(el => {
    const id = el.dataset.thumb, src = Models.thumbs[id];
    if (!src) { if (el.tagName === 'IMG') { const p = Models.find(id); const sp = document.createElement('span'); sp.className = el.className + ' thumb-ic'; sp.dataset.thumb = id; sp.setAttribute('role', 'img'); sp.setAttribute('aria-label', p ? p.n : id); sp.innerHTML = icon(p?.ic || 'cube'); el.replaceWith(sp); } return; }
    if (el.tagName === 'IMG') { if (el.src !== src) el.src = src; return; }
    const img = document.createElement('img'); img.className = el.className.replace(/\s*thumb-ic/, ''); img.dataset.thumb = id; img.src = src; img.alt = el.getAttribute('aria-label') || ''; el.replaceWith(img);
  });
}
const tipoChip = (t, small = false) => t && TIPOS[t] ? `<span class="chip chip-tipo t-${t}">${icon(TIPOS[t].ic)}${esc(TIPOS[t].n)}</span>` : '';
/* Aviso cuando todavía no hay modelos 3D para mostrar */
function noModelsHTML(where = '3D') {
  return `<div class="empty-models">
    <div class="em-ic">${icon('cube', 'big')}</div>
    <h3>Aún no hay modelos 3D ${where === 'RA' ? 'para la realidad aumentada' : where === 'RV' ? 'para el laboratorio virtual' : 'para mostrar'}</h3>
    <p>TECNO LAB solo muestra modelos 3D reales. La profesora puede <b>subir un archivo .glb</b> (queda guardado en este dispositivo) o publicarlo en la carpeta <span class="kbd">models/</span> de la aplicación para que lo vean todos.</p>
    <div class="row" style="justify-content:center"><button class="btn btn-primary" data-upload-model>${icon('upload')}Subir modelo .glb</button><button class="btn" data-teacher-guide>${icon('info')}Cómo publicarlos</button></div>
  </div>`;
}
function bindNoModels(el, after) {
  $$('[data-upload-model]', el).forEach(b => b.onclick = () => openUploadDialog(null, key => after ? after(key) : Router.route()));
  $$('[data-teacher-guide]', el).forEach(b => b.onclick = showTeacherGuide);
}
/* Línea de créditos de un modelo publicado (autor, licencia y enlace a Sketchfab) */
function modelCreditHTML(id) {
  const c = Models.credits[id];
  if (Models.sourceOf(id) === 'upload') return `<p class="model-credit">${icon('upload')}<span>Modelo subido en este dispositivo.</span></p>`;
  if (!c) return '';
  const a = (u, t) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : t;
  return `<p class="model-credit">${icon('cube')}<span>Modelo 3D: ${a(c.fuente, '«' + esc(c.titulo || c.archivo) + '»')}${c.autor ? ` de ${a(c.perfil, esc(c.autor))}` : ''} · ${c.licencia_url ? a(c.licencia_url, esc(c.licencia)) : esc(c.licencia || 'Sketchfab')} · Sketchfab</span></p>`;
}
function modelCreditText(id) { const c = Models.credits[id]; return c && Models.sourceOf(id) !== 'upload' ? `Modelo: ${c.autor || 'Sketchfab'} · ${c.licencia || ''}`.replace(/ · $/, '') : ''; }
