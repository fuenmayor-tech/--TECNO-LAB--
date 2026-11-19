/* =====================================================================
   Zona de creación: dibujo y retos con gestos de la mano (MediaPipe Hands,
   procesado en el propio dispositivo) o con el dedo/mouse.
   ☝️ índice arriba = pintar · ✊ puño = borrar · 🖐️ mano abierta = pausa y
   seleccionar botones (quédate quieto sobre el botón hasta que se llene).
   Los cambios de gesto esperan un tiempo configurable para evitar trazos
   que no se querían hacer.
   ===================================================================== */
const PALETTE = [['#38bdf8', 'Azul claro'], ['#f472b6', 'Rosa'], ['#f43f5e', 'Rojo'], ['#8a5a44', 'Café'], ['#1e293b', 'Negro'], ['#7c8aa5', 'Gris'], ['#1d4ed8', 'Azul'], ['#a855f7', 'Morado']];
const HOLDS = [[250, 'Rápida (¼ s)'], [500, 'Normal (½ s)'], [800, 'Calmada (casi 1 s)']];
Views.create = {
  W: 1200, H: 900, color: '#38bdf8', size: 12, tool: 'pen', mode: 'pointer', tab: 'draw', challenge: null, timer: null, undo: [],
  enter(el, args) {
    this.el = el; this.tab = args[0] === 'retos' ? 'retos' : 'draw'; const draw = this.tab === 'draw';
    el.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">${icon('brush')} Zona de creación · Grado ${GRADES[Store.grade].n}</span><h2>${draw ? 'Dibuja con tu mano… ¡o con el dedo!' : 'Retos con la mano'}</h2>
        <p>${draw ? 'El dedo índice arriba pinta, el puño cerrado borra y la mano abierta hace una pausa. Con la mano abierta también eliges los botones del lienzo: quédate quieto sobre uno hasta que se llene.' : 'Responde las preguntas señalando: pon la mano abierta o el dedo índice sobre la respuesta y quédate quieto hasta que se llene. También puedes tocar o hacer clic.'}</p></div></div>
      <div class="tabs mode-tabs" role="tablist"><button class="tab" role="tab" aria-selected="${draw}" data-tab="">${icon('palette')}Dibujar y retos de dibujo</button><button class="tab" role="tab" aria-selected="${!draw}" data-tab="retos">${icon('target')}Retos de preguntas con la mano</button></div>
      <div class="create-layout">
        <div>
          <div class="canvas-wrap" id="cvWrap" ${draw ? '' : 'style="background:#eef2f7"'}>
            <video id="cvVideo" playsinline muted hidden></video>
            <canvas id="cvDraw" width="${this.W}" height="${this.H}" aria-label="Lienzo de dibujo" role="img" ${draw ? '' : 'hidden'}></canvas>
            <div class="hand-bar" id="cvHandBar" hidden></div>
            ${draw ? `<div class="swatch-bar" id="cvSwatches">${PALETTE.map(([c, n]) => `<button class="swatch" data-c="${c}" data-hand style="background:${c}" aria-label="Color ${n}" aria-pressed="${c === this.color}"></button>`).join('')}</div>` : ''}
            <div class="cv-panel" id="cvPanel" hidden></div>
            <div class="hand-cursor" id="cvCursor" hidden></div>
            <div class="gesture-chip" id="cvGesture" hidden></div>
          </div>
          <div class="tool-row">
            <button class="btn btn-primary" id="cvHand">${icon('hand')}<span>Usar la mano (cámara)</span></button>
            ${draw ? `<button class="btn btn-sm" data-tool="pen" aria-pressed="true">${icon('brush')}Pincel</button>
            <button class="btn btn-sm" data-tool="eraser" aria-pressed="false">${icon('eraser')}Borrador</button>
            ${[6, 12, 22].map(s => `<button class="icon-btn" data-size="${s}" aria-label="Grosor ${s}" aria-pressed="${s === this.size}"><span class="size-dot" style="width:${s * .7 + 4}px;height:${s * .7 + 4}px"></span></button>`).join('')}
            <button class="icon-btn" id="cvUndo" aria-label="Deshacer">${icon('undo')}</button>
            <button class="icon-btn" id="cvClear" aria-label="Borrar todo">${icon('trash')}</button>
            <button class="icon-btn" id="cvSave" aria-label="Descargar dibujo">${icon('download')}</button>` : ''}
            <label class="small row" style="gap:6px">${icon('sliders')}Respuesta de los gestos <select class="select" id="cvHold" style="min-height:38px;width:auto;padding:4px 34px 4px 10px">${HOLDS.map(([v, n]) => `<option value="${v}" ${v === Store.data.handHold ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <button class="btn btn-sm btn-ghost" id="cvCam" hidden aria-pressed="false">${icon('eye')}Ver más la cámara</button>
          </div>
        </div>
        <aside class="stack">
          <div class="card prompt-card" id="cvPrompt"></div>
          <div class="card"><h3>Gestos</h3><div class="gesture-legend">
            <div><span class="emo" aria-hidden="true">☝️</span><span><b>Índice arriba:</b> ${draw ? 'pintar' : 'señalar una respuesta'}</span></div>
            ${draw ? '<div><span class="emo" aria-hidden="true">✊</span><span><b>Puño cerrado:</b> borrar</span></div>' : ''}
            <div><span class="emo" aria-hidden="true">🖐️</span><span><b>Mano abierta:</b> ${draw ? 'pausa. Déjala quieta sobre un botón o un color para elegirlo.' : 'señalar. Déjala quieta sobre la respuesta.'}</span></div></div>
            <p class="small muted" style="margin:10px 0 0">Si se hacen líneas que no querías, elige “Calmada” en <b>Respuesta de los gestos</b>. La cámara se procesa en este dispositivo: no se envía ni se guarda ninguna imagen.</p></div>
        </aside>
      </div>
      ${draw ? `<div class="section-head" style="margin-top:28px"><div><h2>Mi galería</h2><p>Tus dibujos se guardan en este navegador.</p></div></div><div class="gallery" id="cvGallery"></div>` : ''}`;
    $$('[data-tab]', el).forEach(b => b.onclick = () => Router.go('create' + (b.dataset.tab ? '/' + b.dataset.tab : '')));
    this.cv = $('#cvDraw', el); this.ctx = this.cv.getContext('2d'); this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round'; this.undo = [];
    $('#cvHold', el).onchange = e => { Store.data.handHold = +e.target.value; Store.save(); };
    $('#cvHand', el).onclick = () => this.mode === 'hand' ? this.stopHand() : this.startHand();
    $('#cvCam', el).onclick = e => { const on = $('#cvWrap').classList.toggle('cam-strong'); e.currentTarget.setAttribute('aria-pressed', on); };
    if (draw) { this.bindPointer(); this.bindTools(); this.newChallenge(); this.gallery(); }
    else this.startRetos();
    this.handBar();
  },
  leave() { this.stopHand(); clearInterval(this.timer); clearTimeout(this._next); },
  onGrade() { Router.route(); },
  /* ---------- botones sobre el lienzo (se eligen con la mano) ---------- */
  handBar() {
    const bar = $('#cvHandBar'); if (!bar) return;
    const B = (id, ic, n, extra = '') => `<button class="hand-btn" data-hand data-act="${id}" ${extra}>${icon(ic)}<span>${n}</span></button>`;
    bar.innerHTML = this.tab === 'draw'
      ? B('next', 'refresh', 'Otro reto') + B('undo', 'undo', 'Deshacer') + B('clear', 'trash', 'Borrar todo', 'data-dwell="1600"') + B('done', 'check', '¡Terminé!') + B('off', 'x', 'Apagar cámara', 'data-dwell="1400"')
      : B('skip', 'right', 'Otra pregunta') + B('off', 'x', 'Apagar cámara', 'data-dwell="1400"');
    $$('[data-act]', bar).forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'next') { this.closePanel(); this.newChallenge(); }
      if (a === 'undo') { const s = this.undo.pop(); if (s) this.ctx.putImageData(s, 0, 0); }
      if (a === 'clear') { this.snap(); this.ctx.clearRect(0, 0, this.W, this.H); toast('Lienzo limpio: ¡empieza desde cero!', 'info', 1800); }
      if (a === 'done') this.finish();
      if (a === 'off') this.stopHand();
      if (a === 'skip') this.nextReto(true);
    });
  },
  bindTools() {
    const el = this.el;
    $$('[data-c]', el).forEach(b => b.onclick = () => this.setColor(b.dataset.c));
    $$('[data-tool]', el).forEach(b => b.onclick = () => { this.tool = b.dataset.tool; $$('[data-tool]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $$('[data-size]', el).forEach(b => b.onclick = () => { this.size = +b.dataset.size; $$('[data-size]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#cvUndo', el).onclick = () => { const s = this.undo.pop(); if (s) this.ctx.putImageData(s, 0, 0); };
    $('#cvClear', el).onclick = () => { this.snap(); this.ctx.clearRect(0, 0, this.W, this.H); };
    $('#cvSave', el).onclick = () => this.composite('image/png').then(b => downloadBlob(b, 'dibujo-tecnolab.png'));
  },
  setColor(c) { this.color = c; this.tool = 'pen'; $$('[data-c]', this.el).forEach(x => x.setAttribute('aria-pressed', x.dataset.c === c)); $$('[data-tool]', this.el).forEach(x => x.setAttribute('aria-pressed', x.dataset.tool === 'pen')); $('#cvCursor')?.style.setProperty('--cur', c); },
  snap() { try { this.undo.push(this.ctx.getImageData(0, 0, this.W, this.H)); if (this.undo.length > 15) this.undo.shift(); } catch { /* */ } },
  stroke(a, b, erase, size) { const c = this.ctx; c.save(); c.globalCompositeOperation = erase ? 'destination-out' : 'source-over'; c.strokeStyle = this.color; c.lineWidth = size; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.restore(); },
  toCanvas(e) { const r = this.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H }; },
  bindPointer() {
    let last = null, id = null;
    this.cv.addEventListener('pointerdown', e => { if (this.mode === 'hand' || !$('#cvPanel').hidden) return; id = e.pointerId; this.cv.setPointerCapture(id); this.snap(); last = this.toCanvas(e); this.stroke(last, { x: last.x + .1, y: last.y }, this.tool === 'eraser', this.tool === 'eraser' ? this.size * 3 : this.size); });
    this.cv.addEventListener('pointermove', e => { if (e.pointerId !== id || !last) return; const p = this.toCanvas(e); this.stroke(last, p, this.tool === 'eraser', this.tool === 'eraser' ? this.size * 3 : this.size); last = p; });
    const up = e => { if (e.pointerId === id) { last = null; id = null; } };
    this.cv.addEventListener('pointerup', up); this.cv.addEventListener('pointercancel', up);
  },
  async composite(type = 'image/png', q = .9) {
    const c = document.createElement('canvas'); c.width = this.W; c.height = this.H; const x = c.getContext('2d');
    x.fillStyle = '#fbf8f6'; x.fillRect(0, 0, c.width, c.height); x.drawImage(this.cv, 0, 0);
    if (this.challenge) { x.fillStyle = 'rgba(15,23,42,.55)'; x.font = '600 26px Lexend, sans-serif'; x.fillText('TECNO LAB · ' + this.challenge.t, 24, this.H - 24); }
    return new Promise(r => c.toBlob(b => r(b), type, q));
  },
  /* ---------- retos de dibujo ---------- */
  newChallenge(free = false) {
    clearInterval(this.timer); const g = Store.grade;
    if (free) this.challenge = null;
    else {
      const parts = partsForGrade(g).filter(p => p.dib && (g >= 3 || p.ubic === 'externo'));
      const cats = [];
      if (g <= 2) cats.push({ t: 'Dibuja un aparato que se conecte a la pared', kind: 'free', list: ['Tiene un cable con enchufe', 'Se ve qué aparato es', 'Tiene botones o una pantalla'] });
      if (g >= 2) cats.push({ t: 'Dibuja un dispositivo de entrada', kind: 'cat', tipo: 'entrada' }, { t: 'Dibuja un dispositivo de salida', kind: 'cat', tipo: 'salida' });
      if (g === 3) cats.push({ t: 'Dibuja una máquina simple', kind: 'free', list: ['Se ve qué máquina es (palanca, polea, rampa…)', 'Tiene sus partes', 'Muestra cómo ayuda a hacer menos fuerza'] }, { t: 'Dibuja tu herramienta favorita', kind: 'free', list: ['Se ve qué herramienta es', 'Tiene mango o agarradera', 'Muestra para qué sirve'] });
      if (g >= 3) cats.push({ t: 'Dibuja un dispositivo de almacenamiento', kind: 'cat', tipo: 'almacenamiento' });
      if (g >= 4) cats.push({ t: 'Dibuja un circuito eléctrico sencillo', kind: 'free', list: ['Una pila (fuente de energía)', 'Cables (conductores)', 'Un bombillo (receptor)', 'Un interruptor', 'El camino está cerrado'] });
      if (g >= 5) cats.push({ t: 'Dibuja un aparato que transforme la energía', kind: 'free', list: ['Se ve qué aparato es', 'Indica qué energía recibe', 'Indica en qué energía la transforma'] }, { t: 'Dibuja una fuente de energía renovable', kind: 'free', list: ['Sol, viento, agua u otra fuente', 'Muestra cómo produce electricidad', 'Se ve que no se agota'] });
      if (cats.length && Math.random() < (g <= 1 ? .2 : .4)) this.challenge = pick(cats);
      else { const p = pick(parts); this.challenge = { t: `Dibuja ${indef(p)}`, kind: 'part', part: p.id }; }
    }
    this.left = g <= 1 ? 120 : 90; this.noTime ??= false; this.drawPrompt();
    if (this.challenge && !this.noTime) this.timer = setInterval(() => { this.left--; const t = $('#cvTime'); if (t) t.textContent = fmtTime(Math.max(0, this.left)); if (this.left <= 0) { clearInterval(this.timer); toast('¡Tiempo! Revisa tu dibujo.', 'info'); this.finish(); } }, 1000);
  },
  drawPrompt() {
    const c = this.challenge, P = $('#cvPrompt'); if (!P) return;
    P.innerHTML = c ? `<span class="eyebrow">${icon('target')} Reto de ${Store.grade}.°</span><div class="big">${esc(c.t)}</div>
      <div class="row-between"><span class="chip timer-chip">${icon('timer')}<span id="cvTime">${this.noTime ? 'Sin tiempo' : fmtTime(this.left)}</span></span><label class="small row"><input type="checkbox" id="cvNoTime" ${this.noTime ? 'checked' : ''}> Sin tiempo</label></div>
      <div class="row" style="margin-top:12px">${speakBtn('Escuchar')}<button class="btn btn-sm" id="cvNew">${icon('refresh')}Otro reto</button><button class="btn btn-sm btn-ghost" id="cvFree">Dibujo libre</button></div>
      <button class="btn btn-primary btn-block" id="cvDone" style="margin-top:12px">${icon('check')}¡Terminé!</button>`
      : `<span class="eyebrow">${icon('palette')} Dibujo libre</span><div class="big">Crea lo que quieras</div><p class="muted small">Dibuja tu computador ideal o inventa un artefacto.</p><div class="row"><button class="btn btn-primary btn-sm" id="cvNew">${icon('target')}Quiero un reto</button><button class="btn btn-sm" id="cvKeep">${icon('save')}Guardar en mi galería</button></div>`;
    $('#cvNew', P).onclick = () => { this.closePanel(); this.newChallenge(); };
    $('#cvFree', P)?.addEventListener('click', () => this.newChallenge(true));
    $('#cvDone', P)?.addEventListener('click', () => this.finish());
    $('#cvKeep', P)?.addEventListener('click', () => this.store('Dibujo libre', 0));
    $('[data-speak]', P)?.addEventListener('click', e => Voice.toggle(c.t, e.currentTarget));
    $('#cvNoTime', P)?.addEventListener('change', e => { this.noTime = e.target.checked; clearInterval(this.timer); this.left = Store.grade <= 1 ? 120 : 90; this.drawPrompt(); if (!this.noTime) this.timer = setInterval(() => { this.left--; const t = $('#cvTime'); if (t) t.textContent = fmtTime(Math.max(0, this.left)); if (this.left <= 0) { clearInterval(this.timer); this.finish(); } }, 1000); });
  },
  panel(html) { const P = $('#cvPanel'); P.innerHTML = html; P.hidden = false; return P; },
  closePanel() { const P = $('#cvPanel'); if (P) { P.hidden = true; P.innerHTML = ''; } },
  /* Evaluación dentro del lienzo: se responde con la mano, el dedo o el mouse */
  finish() {
    clearInterval(this.timer); const c = this.challenge; if (!c) { this.store('Dibujo libre', 0); return; }
    const ref = c.kind === 'part' ? `<div class="ref">${thumbHTML(c.part)}</div>` : '';
    if (c.kind === 'cat') {
      const right = shuffle(PARTS.filter(p => p.tipo === c.tipo && p.g <= Math.max(Store.grade, 2))).slice(0, 3);
      const other = shuffle(PARTS.filter(p => p.tipo !== c.tipo && ['entrada', 'salida', 'almacenamiento'].includes(p.tipo) && p.g <= Math.max(Store.grade, 2))).slice(0, 3);
      const P = this.panel(`<div class="row-between"><h3>¿Qué dibujaste?</h3><button class="hand-btn" data-hand data-x="back">${icon('brush')}Seguir dibujando</button></div><p class="muted" style="margin:0">Elige la imagen que más se parece a tu dibujo.</p>
        <div class="grid-opts" style="grid-template-columns:repeat(3,1fr)">${shuffle([...right, ...other]).map(p => `<button class="hand-btn img-opt" data-hand data-pick="${p.id}">${thumbHTML(p.id)}<span>${esc(p.n)}</span></button>`).join('')}</div>`);
      $('[data-x="back"]', P).onclick = () => this.closePanel();
      $$('[data-pick]', P).forEach(b => b.onclick = () => { const p = PART[b.dataset.pick]; const ok = p.tipo === c.tipo; this.rate(ok ? 3 : 1, ok ? `${pick(PRAISE)} ${p.n} es un dispositivo de ${TIPOS[p.tipo].n.toLowerCase()}.` : `¡Buen dibujo! ${p.n} es de ${TIPOS[p.tipo].n.toLowerCase()}. ¡Sigue intentando con un dispositivo de ${TIPOS[c.tipo].n.toLowerCase()}!`, b); });
      return;
    }
    const list = c.kind === 'part' ? PART[c.part].dib : c.list;
    const P = this.panel(`<div class="row" style="align-items:flex-start;gap:16px">${ref}<div class="grow"><h3>¿Tu dibujo tiene…?</h3><p class="muted" style="margin:4px 0 0">Marca lo que tiene tu dibujo. Puedes revisarlo con tu profe.</p></div></div>
      <div class="grid-opts">${list.map((t, i) => `<button class="hand-btn" data-hand data-ck="${i}" aria-pressed="false">${esc(t)}</button>`).join('')}</div>
      <div class="row" style="justify-content:space-between"><button class="hand-btn" data-hand data-x="back">${icon('brush')}Seguir dibujando</button><button class="hand-btn big" data-hand data-x="ok">${icon('star')}Calificar y guardar</button></div>`);
    $$('[data-ck]', P).forEach(b => b.onclick = () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); Sfx.click(); });
    $('[data-x="back"]', P).onclick = () => this.closePanel();
    $('[data-x="ok"]', P).onclick = e => { const n = $$('[data-ck].on', P).length; const st = Math.max(1, Math.round(n / list.length * 3)); const miss = list.filter((_, i) => !$(`[data-ck="${i}"]`, P).classList.contains('on')); this.rate(st, st === 3 ? `${pick(PRAISE)} Tu dibujo tiene todo.` : `¡Muy bien! Puedes mejorar agregando: ${miss.slice(0, 2).join(', ').toLowerCase()}.`, e.currentTarget); };
  },
  async rate(stars, msg, el) {
    await this.store(this.challenge.t, stars, true);
    const r = Store.g('draw'); r.count = (r.count || 0) + 1; r.stars = (r.stars || 0) + stars; Store.save();
    if (stars >= 2) celebrate(el, 120); else Sfx.try();
    const P = this.panel(`<div style="text-align:center;margin:auto"><div class="stars">${[1, 2, 3].map(i => icon('star', i <= stars ? 'on' : '')).join('')}</div><h3 style="margin:8px 0">${esc(msg)}</h3><p class="muted">Guardado en tu galería.</p>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="hand-btn" data-hand data-x="keep">${icon('brush')}Seguir dibujando</button><button class="hand-btn big" data-hand data-x="next">${icon('target')}Siguiente reto</button></div></div>`);
    $('[data-x="keep"]', P).onclick = () => this.closePanel();
    $('[data-x="next"]', P).onclick = () => { this.closePanel(); this.snap(); this.ctx.clearRect(0, 0, this.W, this.H); this.newChallenge(); };
  },
  async store(title, stars, quiet = false) {
    const b = await this.composite('image/jpeg', .85);
    const rec = { id: 'd_' + uid(), title, stars, date: Date.now(), grade: Store.grade, data: b };
    try { await DB.put('drawings', rec); this.gallery(); if (!quiet) toast('Dibujo guardado en tu galería.', 'ok'); } catch { downloadBlob(b, 'dibujo-tecnolab.jpg'); toast('El navegador no permitió guardarlo; se descargó el dibujo.', 'info'); }
  },
  async gallery() {
    const G = $('#cvGallery'); if (!G) return;
    let items = []; try { items = (await DB.all('drawings')).sort((a, b) => b.date - a.date); } catch { /* */ }
    (this._urls || []).forEach(u => URL.revokeObjectURL(u)); this._urls = [];
    if (!items.length) { G.innerHTML = '<div class="empty" style="grid-column:1/-1">Aún no hay dibujos. ¡Resuelve un reto!</div>'; return; }
    G.innerHTML = items.map(d => { const u = URL.createObjectURL(d.data); this._urls.push(u); return `<figure><img src="${u}" alt="${esc(d.title)}" style="aspect-ratio:4/3;object-fit:cover;width:100%"><figcaption><span>${esc(d.title)}${d.stars ? ' · ' + '★'.repeat(d.stars) : ''}</span><span class="row" style="gap:4px"><button class="icon-btn" style="width:32px;height:32px" data-dl="${d.id}" aria-label="Descargar">${icon('download')}</button><button class="icon-btn" style="width:32px;height:32px" data-rm="${d.id}" aria-label="Eliminar">${icon('trash')}</button></span></figcaption></figure>`; }).join('');
    $$('[data-dl]', G).forEach(b => b.onclick = () => { const d = items.find(x => x.id === b.dataset.dl); downloadBlob(d.data, `tecnolab-${d.title.replace(/\W+/g, '-').toLowerCase()}.jpg`); });
    $$('[data-rm]', G).forEach(b => b.onclick = async () => { await DB.del('drawings', b.dataset.rm); this.gallery(); });
  },
  /* ---------- retos de preguntas con la mano ---------- */
  startRetos() {
    const g = Store.grade, parts = partsForGrade(Math.max(g, 2));
    const qs = [];
    const imgQs = sample(partsForGrade(g), 4).map(p => { const opts = shuffle([p, ...sample(parts.filter(x => x.id !== p.id), 3)]); return { q: `Señala ${withArt(p)}`, img: null, opts: opts.map(o => ({ id: o.id })), ans: opts.indexOf(p), exp: g <= 2 ? p.s : p.fn }; });
    const txt = QGen.make({ n: 12, review: true }).filter(q => q.opts.length <= 4 && q.opts.every(o => o.length <= 44)).slice(0, 4).map(q => ({ q: q.q, img: q.img, opts: q.opts.map(t => ({ t })), ans: q.ans, exp: q.exp }));
    for (let i = 0; i < 4; i++) { if (imgQs[i]) qs.push(imgQs[i]); if (txt[i]) qs.push(txt[i]); }
    this.retos = { qs, i: 0, score: 0 };
    const P = $('#cvPrompt');
    P.innerHTML = `<span class="eyebrow">${icon('target')} Retos de ${g}.°</span><div class="big">Responde señalando</div><p class="muted small">${qs.length} preguntas: algunas con imágenes y otras de los temas de tu grado. Cada ronda es diferente.</p><div class="row"><span class="chip" id="rtScore">★ 0</span><button class="btn btn-sm" id="rtNew">${icon('refresh')}Nueva ronda</button></div>`;
    $('#rtNew', P).onclick = () => this.startRetos();
    this.showReto();
  },
  showReto() {
    const R = this.retos, q = R.qs[R.i]; if (!q) return this.endRetos();
    this.firstTry = true; this.lockR = false;
    const P = this.panel(`<div class="row-between"><span class="small muted">Pregunta ${R.i + 1} de ${R.qs.length}</span><span class="small muted">★ ${R.score}</span></div>
      <div class="row" style="gap:14px;align-items:center">${q.img ? `<div class="ref">${thumbHTML(q.img)}</div>` : ''}<h3 style="font-size:1.35rem;flex:1">${esc(q.q)}</h3><button class="hand-btn" data-hand data-x="say" aria-label="Escuchar la pregunta">${icon('volume')}</button></div>
      <div class="grid-opts">${q.opts.map((o, k) => `<button class="hand-btn ${o.id ? 'img-opt' : 'big'}" data-hand data-k="${k}">${o.id ? thumbHTML(o.id) : esc(o.t)}</button>`).join('')}</div>
      <p class="muted small" id="rtMsg" style="text-align:center;margin:0">Señala tu respuesta</p>`);
    $$('[data-k] [data-thumb]', P).forEach(t => t.setAttribute('aria-label', 'Opción'));
    $('[data-x="say"]', P).onclick = () => Voice.speak(q.q + (q.opts[0].t ? '. ' + q.opts.map(o => o.t).join('. ') : ''));
    $$('[data-k]', P).forEach(b => b.onclick = () => {
      if (this.lockR || b.disabled) return; const k = +b.dataset.k;
      if (k === q.ans) { this.lockR = true; b.classList.add('right'); celebrate(b, 80); if (this.firstTry) R.score++; $('#rtMsg', P).textContent = `${pick(PRAISE)} ${q.exp || ''}`; const sc = $('#rtScore'); if (sc) sc.textContent = '★ ' + R.score; this._next = setTimeout(() => this.nextReto(), 1700); }
      else { this.firstTry = false; Sfx.try(); b.classList.add('tried'); b.disabled = true; $('#rtMsg', P).textContent = pick(ENCOURAGE); }
    });
  },
  nextReto(skip = false) { if (!this.retos) return; clearTimeout(this._next); this.retos.i++; this.showReto(); },
  endRetos() {
    const R = this.retos, n = R.qs.length, st = R.score >= n ? 3 : R.score >= n * .6 ? 2 : 1;
    const rec = Store.g('games'); rec.retosMano = { plays: (rec.retosMano?.plays || 0) + 1, best: Math.max(rec.retosMano?.best || 0, R.score) }; Store.save();
    Sfx.win(); FX.confetti(innerWidth / 2, innerHeight / 3, 140);
    const P = this.panel(`<div style="text-align:center;margin:auto"><div class="stars">${[1, 2, 3].map(i => icon('star', i <= st ? 'on' : '')).join('')}</div><h3 style="margin:8px 0">${R.score >= n ? '¡Perfecto! Todas a la primera.' : '¡Muy bien! Puedes mejorar en otra ronda.'}</h3><p class="muted">${R.score} de ${n} a la primera.</p>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="hand-btn big" data-hand data-x="again">${icon('refresh')}Otra ronda</button><button class="hand-btn" data-hand data-x="draw">${icon('brush')}Ir a dibujar</button></div></div>`);
    $('[data-x="again"]', P).onclick = () => this.startRetos();
    $('[data-x="draw"]', P).onclick = () => Router.go('create');
  },
  /* ---------- seguimiento de la mano ---------- */
  async startHand() {
    const btn = $('#cvHand'); btn.disabled = true; btn.querySelector('span').textContent = 'Preparando cámara…';
    try {
      HandControl.stop();
      this.stream = await getCamera('user', 640, 480);
      const v = $('#cvVideo'); v.srcObject = this.stream; v.hidden = false; await v.play().catch(() => {});
      await new Promise(r => v.videoWidth ? r() : (v.onloadedmetadata = r));
      btn.querySelector('span').textContent = 'Cargando detector de manos…';
      this.hands = await HandEngine.get();
      HandEngine.consumer = this._consumer = r => this.onHand(r);
      if (Router.cur !== 'create') { this.stopHand(); return; }
      this.mode = 'hand'; this.gest = 'none'; this.cand = null; this.candT = 0; this.lastPt = null; this.sm = null; this.lostT = null; this.armT = 0;
      ['#cvCursor', '#cvGesture', '#cvCam', '#cvHandBar'].forEach(s => { const e = $(s); if (e) e.hidden = false; }); this.setGesture('none');
      btn.innerHTML = icon('x') + '<span>Apagar la cámara</span>'; btn.disabled = false; btn.classList.remove('btn-primary');
      const loop = async () => { if (this.mode !== 'hand') return; if (v.readyState >= 2 && !this.busy) { this.busy = true; try { await this.hands.send({ image: v }); } catch (e) { console.warn(e); } this.busy = false; } this.raf = requestAnimationFrame(loop); };
      loop(); toast('¡Listo! Muestra tu mano a la cámara.', 'ok');
    } catch (e) {
      this.stopHand(); btn.disabled = false;
      if (e.code) return cameraHelp(e, { retry: () => setTimeout(() => this.startHand(), 50) });
      openModal({ title: 'No se pudo usar la cámara', body: `<p>${esc(e.message || String(e))}</p><p class="muted small">Puedes seguir con el dedo o con el mouse directamente sobre el lienzo.${ENV.file ? ' Al abrir el archivo directamente (file://), el detector de manos no puede cargarse: usa GitHub Pages o un servidor local.' : ''}</p>`, actions: [{ label: 'Entendido', cls: 'btn-primary' }] });
    }
  },
  stopHand() {
    this.mode = 'pointer'; cancelAnimationFrame(this.raf); stopStream(this.stream); this.stream = null;
    if (this._consumer && HandEngine.consumer === this._consumer) HandEngine.consumer = null;
    const v = $('#cvVideo'); if (v) { v.srcObject = null; v.hidden = true; }
    ['#cvCursor', '#cvGesture', '#cvCam', '#cvHandBar'].forEach(s => { const e = $(s); if (e) e.hidden = true; });
    const btn = $('#cvHand'); if (btn) { btn.innerHTML = icon('hand') + '<span>Usar la mano (cámara)</span>'; btn.classList.add('btn-primary'); btn.disabled = false; }
    this.dwell(null);
  },
  classify(lm) {
    const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    const ext = (tip, pip) => d(tip, 0) > d(pip, 0) * 1.12;
    const i = ext(8, 6), m = ext(12, 10), r = ext(16, 14), p = ext(20, 18);
    if (i && !m && !r && !p) return 'draw';
    if (!i && !m && !r && !p) return 'erase';
    return 'pause';
  },
  setGesture(g) {
    this.gest = g; const chip = $('#cvGesture'), cur = $('#cvCursor'); if (!chip) return;
    const retos = this.tab === 'retos';
    chip.textContent = { draw: retos ? '☝️ Señalando' : '☝️ Pintando', erase: retos ? '✊ Puño' : '✊ Borrando', pause: retos ? '🖐️ Señalando' : '🖐️ Pausa · elige', none: '👋 Muestra tu mano' }[g];
    cur.className = 'hand-cursor' + (g === 'draw' && !retos ? ' draw' : g === 'erase' && !retos ? ' erase' : ''); cur.style.setProperty('--cur', this.color);
  },
  onHand(res) {
    if (this.mode !== 'hand') return;
    const lm = res.multiHandLandmarks && res.multiHandLandmarks[0]; const cur = $('#cvCursor'); if (!cur) return;
    const now = performance.now();
    if (!lm) { this.lastPt = null; this.lostT ??= now; if (now - this.lostT > 250) { if (this.gest !== 'none') this.setGesture('none'); cur.hidden = true; this.sm = null; this.dwell(null); } return; }
    this.lostT = null; cur.hidden = false;
    const raw = this.classify(lm), hold = Store.data.handHold || 500;
    if (raw !== this.cand) { this.cand = raw; this.candT = now; }
    const need = raw === 'draw' || raw === 'erase' ? hold : Math.min(220, hold * .5);
    if (raw !== this.gest && now - this.candT >= need) { if (raw === 'draw') this.snap(); this.setGesture(raw); this.lastPt = null; this.sm = null; this.armT = now + 140; }
    const v = $('#cvVideo'), wrap = $('#cvWrap'); const W = wrap.clientWidth, H = wrap.clientHeight, va = v.videoWidth / v.videoHeight, ca = W / H;
    const map = (x, y) => { let dw = W, dh = H, ox = 0, oy = 0; if (va > ca) { dw = H * va; ox = (dw - W) / 2; } else { dh = W / va; oy = (dh - H) / 2; } return { x: (1 - x) * dw - ox, y: y * dh - oy }; };
    const ref = this.gest === 'erase' ? map((lm[9].x + lm[0].x) / 2, (lm[9].y + lm[0].y) / 2) : map(lm[8].x, lm[8].y);
    this.sm = this.sm ? { x: this.sm.x + (ref.x - this.sm.x) * .45, y: this.sm.y + (ref.y - this.sm.y) * .45 } : ref;
    cur.style.left = this.sm.x + 'px'; cur.style.top = this.sm.y + 'px';
    const panelOpen = !$('#cvPanel').hidden;
    // Pintar solo si el gesto es estable (el gesto crudo coincide) y ya pasó el tiempo de preparación
    const stable = raw === this.gest && now >= this.armT;
    if (this.tab === 'draw' && !panelOpen && stable && (this.gest === 'draw' || this.gest === 'erase')) {
      const pc = { x: this.sm.x / W * this.W, y: this.sm.y / H * this.H };
      if (this.lastPt && Math.hypot(pc.x - this.lastPt.x, pc.y - this.lastPt.y) < 90) this.stroke(this.lastPt, pc, this.gest === 'erase', this.gest === 'erase' ? 70 : this.size);
      this.lastPt = pc;
    } else this.lastPt = null;
    const canSelect = this.gest === 'pause' || (this.tab === 'retos' && this.gest === 'draw') || (panelOpen && this.gest === 'draw');
    const r = wrap.getBoundingClientRect(); const hit = canSelect ? document.elementFromPoint(r.left + this.sm.x, r.top + this.sm.y)?.closest?.('[data-hand]') : null;
    this.dwell(hit && wrap.contains(hit) && !hit.disabled ? hit : null);
  },
  dwell(el) {
    const now = performance.now();
    if (el !== this.dwEl) { if (this.dwEl) { this.dwEl.classList.remove('dwelling'); this.dwEl.style.removeProperty('--p'); } this.dwEl = el; this.dwT = now; if (el) el.classList.add('dwelling'); return; }
    if (!el || now < (this.coolT || 0)) return;
    const need = +(el.dataset.dwell || 1000), p = Math.min(1, (now - this.dwT) / need); el.style.setProperty('--p', p);
    if (p >= 1) { el.classList.remove('dwelling'); el.style.removeProperty('--p'); this.coolT = now + 1100; this.dwT = now + 1100; if (el.dataset.c) { this.setColor(el.dataset.c); Sfx.click(); toast('Color: ' + el.getAttribute('aria-label').replace('Color ', ''), 'info', 1200); } else { Sfx.click(); el.click(); } }
  }
};
