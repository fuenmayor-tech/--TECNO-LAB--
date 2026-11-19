/* =====================================================================
   Explorar en 3D: galería de partes, visor y carga de modelos
   ===================================================================== */
function partCard(p, { pressed = null, tag = true } = {}) {
  const src = Models.sourceOf(p.id);
  return `<button type="button" class="part-card ${src ? '' : 'no-model'}" data-part="${esc(p.id)}" ${pressed !== null ? `aria-pressed="${pressed}"` : ''}>
    <div class="part-thumb">${thumbHTML(p.id)}${tag && src ? `<span class="tag badge-demo glb">${icon('cube')}3D</span>` : ''}</div>
    <span class="part-name">${esc(p.n)}</span>${tipoChip(p.tipo)}</button>`;
}
Views.explore = {
  filter: 'all', search: '', allGrades: false, stage: null,
  enter(el, args, q = {}) { if (args[0] && Models.find(args[0])) return this.detail(el, args[0], q); return this.gallery(el); },
  leave() { if (this.handOn) { this.handOn = false; HandControl.release(); } this.stage?.unmount(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); },
  onGrade() { Router.route(); },
  gallery(el) {
    const F = [['all', 'Todas'], ['entrada', 'Entrada'], ['salida', 'Salida'], ['mixto', 'Entrada y salida'], ['almacenamiento', 'Almacenamiento'], ['procesamiento', 'Procesamiento'], ['energia', 'Energía'], ['interno', 'Por dentro']];
    el.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">${icon('cube')} Visor 3D · Grado ${GRADES[Store.grade].n}</span><h2>Modelos 3D de ${Store.grade}.°</h2><p>Toca un modelo para girarlo, acercarlo, verlo en realidad aumentada y conocer qué es, para qué sirve y de qué tipo es.</p></div>
        <button class="btn btn-primary" id="exUpload">${icon('upload')}Subir modelo o imagen</button></div>
      <div class="toolbar">
        <label class="search">${icon('search')}<input class="input" id="exSearch" type="search" placeholder="Buscar un modelo…" aria-label="Buscar un modelo" value="${esc(this.search)}"></label>
        <button class="fchip" id="exAll" aria-pressed="${this.allGrades}">${icon('layers')} Ver los modelos de todos los grados</button>
      </div>
      <div class="filter-chips" role="group" aria-label="Filtrar por tipo" style="margin-bottom:18px">${F.map(([k, n]) => `<button class="fchip" data-f="${k}" aria-pressed="${this.filter === k}">${n}</button>`).join('')}</div>
      <div id="exSum"></div>
      <div id="exGrid"></div>`;
    /* Solo se muestran modelos 3D que sí cargan: 5 nuevos en cada grado (los de grados anteriores se repasan) */
    const g0 = Store.grade, all3d = [...PARTS, ...Models.extras].filter(p => Models.has(p.id)), mineN = all3d.filter(p => p.g === g0).length, prevN = all3d.filter(p => p.g < g0).length;
    const ups = Models.customParts().filter(p => !p.published && Models.has(p.id));
    $('#exSum', el).innerHTML = all3d.length ? `<div class="notice" style="margin-bottom:16px">${icon('cube')}<div>En ${g0}.° tienes <b>${mineN + prevN} modelos 3D</b>: <b>${mineN}</b> ${mineN === 1 ? 'nuevo' : 'nuevos'}${prevN ? ` y ${prevN} de ${g0 === 2 ? '1.°' : 'grados anteriores'} para repasar` : ''}${ups.length ? `, más ${ups.length} ${ups.length === 1 ? 'subido' : 'subidos'} en este dispositivo` : ''}.</div></div>` : noModelsHTML('3D');
    bindNoModels(el, key => Router.go('explore/' + key));
    const draw = () => {
      const q = norm(this.search.trim()), g = Store.grade;
      const ok = p => (this.filter === 'all' || (this.filter === 'interno' ? p.ubic === 'interno' : p.tipo === this.filter)) && (!q || norm(p.n).includes(q));
      const groups = [
        [`Nuevos en ${g}.°`, all3d.filter(p => p.g === g && ok(p)), 'newI'],
        [g > 1 ? 'Repaso de grados anteriores' : '', all3d.filter(p => p.g < g && ok(p)).sort((a, b) => b.g - a.g), 'history'],
        ['Subidos en este dispositivo', ups.filter(ok), 'upload'],
        [this.allGrades ? 'Próximos grados' : '', this.allGrades ? all3d.filter(p => p.g > g && ok(p)).sort((a, b) => a.g - b.g) : [], 'lockI']
      ].filter(([t, l]) => t && l.length);
      $('#exGrid', el).innerHTML = groups.length ? groups.map(([t, l, ic]) => `<h3 class="group-title">${icon(ic)}${esc(t)} <span class="chip">${l.length}</span></h3><div class="grid grid-parts">${l.map(p => partCard(p).replace('class="part-card"', `class="part-card ${p.g > g && !p.custom ? 'locked' : ''}"`)).join('')}</div>`).join('')
        : `<div class="empty">No hay modelos con ese filtro${this.allGrades ? '' : ' en este grado. Prueba “Ver los modelos de todos los grados”'}.</div>`;
      $$('#exGrid [data-part]', el).forEach(b => b.onclick = () => Router.go('explore/' + b.dataset.part));
    };
    $('#exSearch', el).oninput = e => { this.search = e.target.value; draw(); };
    $$('[data-f]', el).forEach(b => b.onclick = () => { this.filter = b.dataset.f; $$('[data-f]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    $('#exAll', el).onclick = e => { this.allGrades = !this.allGrades; e.currentTarget.setAttribute('aria-pressed', this.allGrades); draw(); };
    $('#exUpload', el).onclick = () => openUploadDialog(null, key => Router.go('explore/' + key));
    draw();
  },
  detail(el, id, q = {}) {
    const p = Models.find(id), g = Store.grade, v3 = Models.viewableAll(), list = v3.some(x => x.id === id) ? v3 : Models.every(), i = list.findIndex(x => x.id === id);
    const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    const has = Models.has(id);
    el.innerHTML = `
      <div class="row-between" style="margin-bottom:14px"><button class="btn btn-ghost btn-sm" id="exBack">${icon('left')}Todos los modelos</button>
        <div class="row"><button class="btn btn-sm" data-nav="${esc(prev.id)}" aria-label="Anterior: ${esc(prev.n)}">${icon('left')}<span class="hide-sm">${esc(prev.n)}</span></button><button class="btn btn-sm" data-nav="${esc(next.id)}" aria-label="Siguiente: ${esc(next.n)}"><span class="hide-sm">${esc(next.n)}</span>${icon('right')}</button></div></div>
      <div class="detail">
        ${has ? `<div class="viewer" id="exViewer" role="img" aria-label="Modelo 3D de ${esc(p.n)}. Arrastra para girar y pellizca o usa la rueda para acercar.">
          <div class="viewer-top"><span class="badge-demo glb" id="exSrc">${icon('cube')}<span class="hide-sm">${esc(Models.sourceLabel(id))}</span></span>
            <div class="row" style="gap:8px">${GL.ok ? `<button class="btn btn-sm btn-hand" id="exHand" aria-pressed="false">${icon('hand')}<span>Usar mis manos</span></button>` : ''}<button class="btn btn-sm btn-primary" id="exAR">${icon('scan')}Ver en RA</button></div></div>
          <div class="viewer-hint">${ENV.touch ? 'Desliza para girar · pellizca para acercar' : 'Arrastra para girar · rueda para acercar'}</div>
          <div class="viewer-loading" id="exLoad" hidden><div><div class="spinner"></div>Cargando modelo…</div></div>
          ${GL.ok ? '' : `<div class="viewer-loading"><div>${icon(p.ic || 'cube')}<span>La vista 3D no está disponible en este navegador.</span></div></div>`}
          <div class="viewer-ctrls">
            <button class="icon-btn" id="exSpin" aria-label="Girar automáticamente" aria-pressed="${!ENV.reduced}">${icon('rotate')}</button>
            <button class="icon-btn" id="exIn" aria-label="Acercar">${icon('plus')}</button>
            <button class="icon-btn" id="exOut" aria-label="Alejar">${icon('minus')}</button>
            <button class="icon-btn" id="exReset" aria-label="Restablecer vista">${icon('refresh')}</button>
            <button class="icon-btn" id="exFull" aria-label="Pantalla completa">${icon('max')}</button>
          </div>
        </div>` : `<div class="viewer viewer-empty">
          <div class="ve-ic">${icon(p.ic || 'cube', 'big')}</div>
          <h3>${esc(p.n)}</h3>
          <p>El modelo 3D de esta parte todavía no está cargado. Mientras tanto puedes leer su ficha, escucharla y practicar con el quiz.</p>
          <button class="btn btn-sm" id="exLoadModel">${icon('upload')}Cargar modelo de esta parte (profesora)</button>
        </div>`}
        <aside class="card info-panel">${partInfoHTML(p, g)}${has ? modelCreditHTML(id) : ''}
          <div class="info-actions">${speakBtn('Escuchar')}${has ? `<button class="btn btn-sm" id="exVR">${icon('vr')}Ver en RV</button>` : ''}${PART[id] ? `<button class="btn btn-sm" id="exQuiz">${icon('quiz')}Ponte a prueba</button>` : ''}</div>
        </aside>
      </div>`;
    $('#exBack', el).onclick = () => Router.go('explore');
    $$('[data-nav]', el).forEach(b => b.onclick = () => Router.go('explore/' + b.dataset.nav + (this.handOn && Models.has(b.dataset.nav) ? '?mano=1' : '')));
    $('#exAR', el)?.addEventListener('click', () => ARRun.start(id, Models.viewableAll(), { id: 'free' }));
    $('#exVR', el)?.addEventListener('click', () => Router.go('vr?part=' + id));
    $('#exLoadModel', el)?.addEventListener('click', () => openUploadDialog(PART[id] ? id : null, key => Router.go('explore/' + key)));
    $('#exQuiz', el)?.addEventListener('click', () => Router.go('study/quiz?part=' + id));
    $('[data-speak]', el).onclick = e => Voice.toggle(partText(p), e.currentTarget);
    if (!GL.ok || !has) return;
    const st = this.stage ??= new Stage3D({ orbit: true }); st.theme(); st.auto = !ENV.reduced;
    st.mount($('#exViewer', el));
    st.show(id, on => { $('#exLoad', el).hidden = !on; }).catch(e => { const v = $('#exViewer', el); if (v) { const d = document.createElement('div'); d.className = 'viewer-loading'; d.innerHTML = `<div>${icon('info')}<span>${esc(e.message)}</span></div>`; v.appendChild(d); } });
    $('#exSpin', el).onclick = e => { st.auto = !st.auto; e.currentTarget.setAttribute('aria-pressed', st.auto); };
    $('#exIn', el).onclick = () => st.zoom(.8); $('#exOut', el).onclick = () => st.zoom(1.25); $('#exReset', el).onclick = () => st.reset();
    $('#exFull', el).onclick = () => { const v = $('#exViewer', el); if (document.fullscreenElement) document.exitFullscreen(); else (v.requestFullscreen ? v.requestFullscreen() : Promise.reject()).catch(() => toast('Este navegador no permite pantalla completa aquí.', 'bad')); };
    $('#exHand', el).onclick = () => { if (this.handOn) this.stopHands(el); else this.startHands(el, id); };
    if (q.mano === '1') this.startHands(el, id); else if (!this.handOn) HandControl.stop();
  },
  /* Gestos con la mano en el visor 3D (cámara frontal pequeña en la esquina) */
  async startHands(el, id) {
    const st = this.stage, v = $('#exViewer', el), btn = $('#exHand', el); if (!st || !v) return;
    this.handOn = true; v.classList.add('hands-on'); btn.setAttribute('aria-pressed', 'true'); btn.querySelector('span').textContent = 'Manos activas';
    const nextId = () => { const l = Models.viewableAll(); const k = l.findIndex(x => x.id === id); return l.length > 1 ? l[(k + 1) % l.length].id : null; };
    try {
      await HandControl.start({
        hudHost: v, pipHost: v, facing: 'user', mirror: true,
        handlers: { rotate: (dx, dy) => st.rotate(dx, dy), zoom: f => st.zoom(1 / f), reset: () => st.reset(), hold: () => { st.auto = false; $('#exSpin', el)?.setAttribute('aria-pressed', 'false'); }, next: () => { const n = nextId(); if (n) Router.go('explore/' + n + '?mano=1'); } }
      });
    } catch (e) {
      this.stopHands(el);
      if (e.code) cameraHelp(e, { retry: () => setTimeout(() => this.startHands(el, id), 50) }); else toast(e.message || 'No se pudo activar el control con la mano.', 'info', 6000);
    }
  },
  stopHands(el) {
    this.handOn = false; HandControl.stop(); $('#exViewer', el)?.classList.remove('hands-on');
    const btn = $('#exHand', el); if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.querySelector('span').textContent = 'Usar mis manos'; }
  }
};
function partInfoHTML(p, g = Store.grade) {
  if (p.custom) return `<span class="eyebrow">${p.published ? 'Modelo agregado por la profesora' : 'Pieza personalizada'}</span><h2>${esc(p.n)}</h2><div class="chips">${tipoChip(p.tipo)}</div><div class="info-block"><h4>Descripción</h4><p>${esc(p.s)}</p></div>`;
  const nivel = g > p.g ? 'Repaso' : g === p.g ? `Nueva en ${g}.°` : `Se estudia en ${p.g}.°`;
  const chips = `<div class="chips">${tipoChip(p.tipo)}<span class="chip">${icon(p.ubic === 'interno' ? 'cpu' : 'plug')}${p.ubic === 'interno' ? 'Va por dentro' : 'Periférico externo'}</span><span class="chip">${icon('grad')}${nivel}</span></div>`;
  const B = (t, html) => `<div class="info-block"><h4>${t}</h4>${html}</div>`;
  const head = `<span class="eyebrow">Parte del computador · Ficha de ${g}.°</span><h2>${esc(p.n)}</h2>${chips}`;
  if (g <= 2) return head + B('¿Qué es?', `<p>${esc(p.s)}</p>`) + B('¿Para qué sirve?', `<p>${esc(p.fn)}</p>`) + B(`Es de ${esc(TIPOS[p.tipo].n.toLowerCase())}`, `<p>${esc(TIPOS[p.tipo].d)}</p>`) + B('Lo cuido así', `<p>${esc(p.cui)}</p>`) + (g === 2 ? B('¿Cómo se conecta?', `<p>${esc(p.con)}</p>`) : '');
  if (g === 3) return head + B('¿Qué es?', `<p>${esc(p.que)}</p>`) + B('Función', `<p>${esc(p.fn)}</p>`) + B('Características', `<ul>${p.car.slice(0, 2).map(c => `<li>${esc(c)}</li>`).join('')}</ul>`) + B('¿Cómo se conecta?', `<p>${esc(p.con)}</p>`) + B('Cuidado', `<p>${esc(p.cui)}</p>`);
  if (g === 4) return head + B('¿Qué es?', `<p>${esc(p.que)}</p>`) + B('Función', `<p>${esc(p.fn)}</p>`) + B('Características', `<ul>${p.car.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`) + B('Conexión', `<p>${esc(p.con)}</p>`) + B('Cuidado · Dato curioso', `<p>${esc(p.cui)}</p><p class="muted">${esc(p.cur)}</p>`);
  return head + B('¿Qué es?', `<p>${esc(p.que)}</p>`) + B('Función en el sistema', `<p>${esc(p.fn)} <span class="muted">(${esc(TIPOS[p.tipo].n.toLowerCase())})</span></p>`) + B('Características', `<ul>${p.car.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`) + B('Conexión y energía', `<p>${esc(p.con)}</p><p>${icon('zap')} ${esc(p.ene)}</p>`) + B('Cuidado · Dato curioso', `<p>${esc(p.cui)}</p><p class="muted">${esc(p.cur)}</p>`);
}

/* ---------- Diálogo para subir modelos .glb o imágenes ---------- */
function openUploadDialog(defPart, onDone) {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="dropzone" id="upDrop" tabindex="0" role="button" aria-label="Elegir archivo">${icon('upload')}<p style="margin:8px 0 4px"><b>Arrastra aquí un archivo o toca para elegirlo</b></p><p class="small" style="margin:0">Modelos <span class="kbd">.glb</span> o imágenes <span class="kbd">.png</span> <span class="kbd">.jpg</span> <span class="kbd">.webp</span></p><p class="small" id="upName" style="margin:8px 0 0;color:var(--accent)"></p></div>
    <input type="file" id="upFile" accept=".glb,model/gltf-binary,image/png,image/jpeg,image/webp,image/gif" hidden>
    <div class="grid grid-2" style="margin-top:14px">
      <label class="field">¿Qué parte es?<select class="select" id="upPart"><option value="">Nueva pieza personalizada</option>${PARTS.map(p => `<option value="${p.id}" ${p.id === defPart ? 'selected' : ''}>Reemplazar: ${esc(p.n)}</option>`).join('')}</select></label>
      <label class="field" id="upNameF">Nombre de la pieza<input class="input" id="upN" maxlength="60" placeholder="Ej.: Lápiz óptico"></label>
      <label class="field" id="upTipoF">Tipo<select class="select" id="upTipo">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${k === 'otro' ? 'selected' : ''}>${t.n}</option>`).join('')}</select></label>
      <label class="field" id="upDescF" style="grid-column:1/-1">Descripción corta (opcional)<textarea class="input" id="upD" rows="2" maxlength="280" placeholder="¿Qué es y para qué sirve?"></textarea></label>
    </div>
    <div class="notice" style="margin-top:12px">${icon('save')}<div>Lo que subas aquí <b>queda guardado en este navegador</b>, aunque recargues la página o la cierres, y se puede ver en 3D, en realidad aumentada y en realidad virtual. Para que también aparezca en los celulares y computadores de los estudiantes, usa <b>Descargar para GitHub</b> (le pone el nombre correcto, por ejemplo <span class="kbd">teclado.glb</span>) y súbelo a la carpeta <span class="kbd">models/</span> del repositorio.</div></div>
    <div id="upList"></div>`;
  let file = null;
  const m = openModal({ title: 'Subir modelo 3D o imagen', body, wide: true, actions: [{ label: 'Cancelar', cls: 'btn-ghost' }, { label: 'Guardar y ver', cls: 'btn-primary', icon: 'upload', onClick: async (modal) => {
    if (!file) { toast('Primero elige un archivo.', 'bad'); return false; }
    if (!GL.ok) { toast('El motor 3D no está disponible en este navegador.', 'bad'); return false; }
    const btn = modal.querySelector('.modal-foot .btn-primary'); btn.disabled = true; btn.querySelector('span').textContent = 'Revisando archivo…';
    try {
      const partId = $('#upPart', body).value || null;
      const { rec, persisted } = await Models.addUpload({ file, partId, name: $('#upN', body).value.trim(), tipo: $('#upTipo', body).value, desc: $('#upD', body).value.trim() });
      toast(persisted ? 'Modelo guardado en este dispositivo.' : 'Modelo cargado solo para esta sesión (el navegador no permitió guardarlo).', 'ok');
      onDone && onDone(rec.partId || rec.id); return true;
    } catch (e) { toast(e.message, 'bad'); btn.disabled = false; btn.querySelector('span').textContent = 'Guardar y ver'; return false; }
  } }] });
  const sel = $('#upPart', body);
  const sync = () => { const custom = !sel.value; ['#upNameF', '#upTipoF', '#upDescF'].forEach(s => $(s, body).hidden = !custom); };
  sel.onchange = sync; sync();
  const setFile = f => { if (!f) return; file = f; $('#upName', body).textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} MB`; if (!$('#upN', body).value) $('#upN', body).value = f.name.replace(/\.[^.]+$/, '').slice(0, 60); };
  const dz = $('#upDrop', body), inp = $('#upFile', body);
  dz.onclick = () => inp.click(); dz.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
  inp.onchange = () => setFile(inp.files[0]);
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));
  const drawList = () => {
    const ups = Models.uploads; const L = $('#upList', body);
    L.innerHTML = ups.length ? `<h3 style="margin-top:18px">Modelos subidos en este dispositivo</h3><div class="upload-list">${ups.map(u => `<div class="upload-item">${icon(u.kind === 'img' ? 'image' : 'cube')}<span class="nm">${esc(u.partId ? 'Reemplaza: ' + PART[u.partId].n : u.name)} <span class="dim small">· ${esc(u.fileName)}</span></span><button class="btn btn-sm" data-dl="${esc(u.id)}" title="Descargar con el nombre para la carpeta models/">${icon('download')}Descargar para GitHub</button><button class="btn btn-sm btn-danger" data-del="${esc(u.id)}" aria-label="Eliminar ${esc(u.name)}">${icon('trash')}</button></div>`).join('')}</div>` : '';
    $$('[data-del]', L).forEach(b => b.onclick = async () => { await Models.removeUpload(b.dataset.del); toast('Modelo eliminado.', 'ok'); drawList(); });
    $$('[data-dl]', L).forEach(b => b.onclick = () => { const u = Models.uploads.find(x => x.id === b.dataset.dl); if (!u) return; const ext = u.kind === 'img' ? (u.fileName.match(/\.\w+$/) || ['.png'])[0] : '.glb'; const base = u.partId || norm(u.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'modelo'; downloadBlob(u.kind === 'img' ? u.data : new Blob([u.data], { type: 'model/gltf-binary' }), base + ext); toast(u.partId ? `Descargado como ${base + ext}. Súbelo a la carpeta models/ de GitHub.` : `Descargado como ${base + ext}. Súbelo a models/ y anótalo en models/modelos.json (ver README).`, 'ok', 6000); });
  };
  drawList();
  return m;
}
