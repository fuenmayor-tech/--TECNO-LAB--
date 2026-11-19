/* =====================================================================
   Minijuegos: Clasificador · Memoria · Palabra secreta · Lluvia de teclas
   (la dificultad cambia con el grado)
   ===================================================================== */
const GAMES = [
  { id: 'clasifica', n: 'Clasificador', ic: 'layers', d: '¿Entrada, salida o almacenamiento? Clasifica cada parte antes de que se acabe el tiempo.' },
  { id: 'memoria', n: 'Memoria tecnológica', ic: 'puzzle', d: 'Encuentra las parejas: imagen, nombre y función de cada parte.' },
  { id: 'palabra', n: 'Palabra secreta', ic: 'type', d: 'Adivina la palabra letra por letra antes de que se descargue la batería.' },
  { id: 'lluvia', n: 'Lluvia de teclas', ic: 'keyboard', d: 'Escribe las letras y palabras que caen. ¡Entrena tu teclado!' }
];
const GAME_LEVEL = {
  clasifica: { 1: 'En 1.°: entrada o salida, con más tiempo.', 2: 'En 2.°: entrada o salida con más partes.', 3: 'En 3.°: entrada, salida o almacenamiento.', 4: 'En 4.°: se suman los dispositivos de entrada y salida.', 5: 'En 5.°: cinco grupos, incluido procesamiento.' },
  memoria: { 1: 'En 1.°: parejas de imágenes iguales.', 2: 'En 2.°: une la imagen con su nombre.', 3: 'En 3.°: une cada parte con su función.', 4: 'En 4.°: 8 parejas parte–función.', 5: 'En 5.°: 8 parejas con partes internas.' },
  palabra: { 1: 'En 1.°: palabras cortas con imagen de pista.', 2: 'En 2.°: partes del computador con imagen.', 3: 'En 3.°: hardware, software y circuitos.', 4: 'En 4.°: redes, binario y energía.', 5: 'En 5.°: algoritmos, sistemas y más.' },
  lluvia: { 1: 'En 1.°: letras de la fila guía (ASDF JKLÑ).', 2: 'En 2.°: todas las letras y los números.', 3: 'En 3.°: sílabas y palabras cortas.', 4: 'En 4.°: nombres de las partes.', 5: 'En 5.°: palabras largas de tecnología.' }
};
const WORDS_EXTRA = { 2: ['MADERA', 'VIDRIO', 'PLASTICO', 'RECICLAR'], 3: ['HARDWARE', 'SOFTWARE', 'ARCHIVO', 'CARPETA', 'MARTILLO', 'PALANCA', 'POLEA', 'RAMPA'], 4: ['INTERNET', 'BINARIO', 'VOLTAJE', 'RED', 'BLUETOOTH', 'WIFI', 'BYTE', 'NAVEGADOR', 'CIRCUITO', 'CONDUCTOR', 'AISLANTE'], 5: ['ALGORITMO', 'SISTEMA', 'CHIPSET', 'BUCLE', 'PIXEL', 'RECICLAJE', 'TRANSISTOR', 'PROGRAMA', 'ENERGIA', 'TERMICA', 'SOLAR', 'PILA'] };
const WORD_CLUES = { MADERA: 'Material que viene de los árboles.', VIDRIO: 'Material transparente de las ventanas.', PLASTICO: 'Material que fabrican las personas; con él se hacen botellas.', RECICLAR: 'Convertir materiales usados en objetos nuevos.', MARTILLO: 'Herramienta para clavar.', PALANCA: 'Máquina simple: barra que gira sobre un punto de apoyo.', POLEA: 'Máquina simple con rueda y cuerda.', RAMPA: 'Plano inclinado para subir cosas.', TERMICA: 'Energía del calor.', SOLAR: 'Energía que viene del sol.', HARDWARE: 'Las partes del computador que se pueden tocar.', SOFTWARE: 'Los programas e instrucciones del computador.', CIRCUITO: 'Camino cerrado por donde viaja la corriente.', CONDUCTOR: 'Material que deja pasar la electricidad.', AISLANTE: 'Material que no deja pasar la electricidad.', ARCHIVO: 'Un trabajo guardado: texto, imagen o música.', CARPETA: 'Sirve para organizar archivos.', PILA: 'Guarda energía y da corriente continua.', INTERNET: 'La red de redes.', BINARIO: 'Sistema que usa solo 0 y 1.', VOLTAJE: 'En Colombia el del tomacorriente es de unos 120.', RED: 'Dispositivos conectados que comparten información.', BLUETOOTH: 'Conexión inalámbrica de corto alcance.', WIFI: 'Internet sin cables.', BYTE: 'Grupo de 8 bits.', ENERGIA: 'Capacidad de producir trabajo; la eléctrica mueve el computador.', NAVEGADOR: 'Programa para visitar páginas web.', ALGORITMO: 'Pasos ordenados para resolver un problema.', SISTEMA: 'Partes que trabajan juntas con un propósito.', CHIPSET: 'Coordina la comunicación en la tarjeta madre.', BUCLE: 'Repetir instrucciones varias veces.', PIXEL: 'Puntito de color que forma la imagen del monitor.', RECICLAJE: 'Lo que se debe hacer con los RAEE.', TRANSISTOR: 'Pieza diminuta que reemplazó a los tubos de vacío.', PROGRAMA: 'Software para una tarea específica.' };
Views.games = {
  enter(el, args) {
    this.stop(); const id = args[0];
    if (id && Games[id]) { el.innerHTML = `<div class="game-head"><button class="btn btn-ghost btn-sm" id="gBack">${icon('left')}Minijuegos</button><h2 style="margin:0">${GAMES.find(g => g.id === id).n}</h2><div class="game-stats" id="gStats"></div></div><div id="gBody"></div>`; $('#gBack', el).onclick = () => Router.go('games'); this.cur = Games[id]; Games[id].start($('#gBody', el), $('#gStats', el)); this.bump(id); return; }
    const rec = Store.g('games');
    el.innerHTML = `<div class="section-head"><div><span class="eyebrow">${icon('game')} Minijuegos · Grado ${GRADES[Store.grade].n}</span><h2>Aprende jugando</h2><p>La dificultad se ajusta al grado que elegiste.</p></div></div>
      <div class="grid grid-2">${GAMES.map(g => `<button class="card card-link feature-card" data-g="${g.id}"><span class="fi">${icon(g.ic)}</span><h3>${g.n}</h3><p>${g.d}</p><p class="small" style="color:var(--accent)">${icon('grad')} ${esc(GAME_LEVEL[g.id][Store.grade])}</p><span class="go">${rec[g.id]?.best ? `Récord: ${rec[g.id].best} · ` : ''}Jugar ${icon('arrowR')}</span></button>`).join('')}</div>`;
    $$('[data-g]', el).forEach(b => b.onclick = () => Router.go('games/' + b.dataset.g));
  },
  bump(id) { const r = Store.g('games'); r[id] = { ...(r[id] || {}), plays: (r[id]?.plays || 0) + 1 }; Store.save(); },
  stop() { this.cur?.stop?.(); this.cur = null; },
  leave() { this.stop(); },
  onGrade() { Router.route(); }
};
function saveBest(id, score) { const r = Store.g('games'); const prev = r[id]?.best || 0; r[id] = { ...(r[id] || {}), best: Math.max(prev, score) }; Store.save(); return score > prev; }
function gameOver(title, html, again) { openModal({ title, body: `<div class="result-hero">${html}</div>`, actions: [{ label: 'Otros juegos', onClick: () => Router.go('games') }, { label: 'Jugar otra vez', cls: 'btn-primary', icon: 'refresh', onClick: again }] }); }
const starsHTML = n => `<div class="stars">${[1, 2, 3].map(i => icon('star', i <= n ? 'on' : '')).join('')}</div>`;

const Games = {
  clasifica: {
    start(el, stats) {
      const g = Store.grade; this.el = el; this.stats = stats;
      this.bins = g <= 2 ? ['entrada', 'salida'] : g === 3 ? ['entrada', 'salida', 'almacenamiento'] : g === 4 ? ['entrada', 'salida', 'mixto', 'almacenamiento'] : ['entrada', 'salida', 'mixto', 'almacenamiento', 'procesamiento'];
      this.pool = PARTS.filter(p => this.bins.includes(p.tipo) && p.g <= g + 1);
      this.ended = false; this.score = 0; this.streak = 0; this.right = 0; this.wrong = 0; this.time = g <= 2 ? 75 : 60; this.deck = [];
      el.innerHTML = `<p class="muted" style="text-align:center">Arrastra la tarjeta a su grupo o toca el grupo correcto.</p><div id="csCard"></div><div class="bins">${this.bins.map(b => `<button class="bin" data-bin="${b}">${icon(TIPOS[b].ic)}<span>${TIPOS[b].n}</span></button>`).join('')}</div>`;
      $$('[data-bin]', el).forEach(b => b.onclick = () => this.answer(b.dataset.bin, b));
      this.next(); this.draw();
      this.iv = setInterval(() => { if (--this.time <= 0) this.end(); this.draw(); }, 1000);
    },
    draw() { this.stats.innerHTML = `<span class="chip">${icon('timer')}${fmtTime(Math.max(0, this.time))}</span><span class="chip">${icon('star')}${this.score} pts</span><span class="chip">Racha ×${this.streak}</span>`; },
    next() {
      if (!this.deck.length) this.deck = shuffle(this.pool);
      this.cur = this.deck.pop(); const c = $('#csCard', this.el);
      c.innerHTML = `<div class="sort-card" id="csDrag">${thumbHTML(this.cur.id)}<b>${esc(this.cur.n)}</b></div>`;
      const t = $('[data-thumb]', c); if (t && t.tagName !== 'IMG') t.style.cssText = 'width:150px;height:150px;display:grid;place-items:center;margin:auto;color:var(--accent)';
      this.dragify($('#csDrag', c));
    },
    dragify(card) {
      let st = null, clone = null;
      card.addEventListener('pointerdown', e => { st = { x: e.clientX, y: e.clientY }; card.setPointerCapture(e.pointerId); });
      card.addEventListener('pointermove', e => {
        if (!st) return; if (!clone && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 8) { const r = card.getBoundingClientRect(); clone = card.cloneNode(true); clone.classList.add('dragging'); clone.style.width = r.width + 'px'; document.body.appendChild(clone); card.style.opacity = '.3'; }
        if (clone) { clone.style.left = (e.clientX - clone.offsetWidth / 2) + 'px'; clone.style.top = (e.clientY - 60) + 'px'; const over = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-bin]'); $$('[data-bin]', this.el).forEach(b => b.classList.toggle('over', b === over)); }
      });
      const up = e => { if (!st) return; st = null; card.style.opacity = ''; if (clone) { const over = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-bin]'); clone.remove(); clone = null; $$('[data-bin]', this.el).forEach(b => b.classList.remove('over')); if (over) this.answer(over.dataset.bin, over); } };
      card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
    },
    answer(bin, el) {
      if (this.time <= 0 || !this.cur) return;
      const ok = this.cur.tipo === bin;
      if (ok) { this.streak++; this.right++; this.score += 10 + Math.min(10, (this.streak - 1) * 2); celebrate(el, 50); }
      else { this.streak = 0; this.wrong++; Sfx.try(); toast(`${pick(ENCOURAGE)} ${this.cur.n}: ${TIPOS[this.cur.tipo].n.toLowerCase()}. ${TIPOS[this.cur.tipo].d}`, 'try', 2600); }
      el.classList.add(ok ? 'flash-ok' : 'flash-bad'); setTimeout(() => el.classList.remove('flash-ok', 'flash-bad'), 350);
      this.draw(); this.next();
    },
    end() {
      if (this.ended) return; this.ended = true; clearInterval(this.iv);
      const rec = saveBest('clasifica', this.score); const acc = this.right + this.wrong ? this.right / (this.right + this.wrong) : 0; const st = acc >= .9 && this.right >= 8 ? 3 : acc >= .7 ? 2 : this.right ? 1 : 0; Sfx.win();
      gameOver('¡Tiempo!', `${starsHTML(st)}<div class="score grad-text">${this.score}</div><p>${this.right} correctas · ${this.wrong} por repasar${rec ? ' · <b>¡Nuevo récord!</b>' : ''}</p>`, () => Router.route());
    },
    stop() { clearInterval(this.iv); this.ended = true; $$('.sort-card.dragging').forEach(x => x.remove()); }
  },
  memoria: {
    start(el, stats) {
      const g = Store.grade; this.el = el; this.stats = stats; this.moves = 0; this.found = 0; this.t0 = Date.now(); this.lock = false; this.open = [];
      const nP = g <= 2 ? 6 : 8; const parts = sample(partsForGrade(Math.max(g, 2)), nP);
      let cards = [];
      parts.forEach((p, i) => {
        const a = { k: i, html: `${thumbHTML(p.id)}<span>${esc(p.n)}</span>` };
        const b = g === 1 ? { k: i, html: thumbHTML(p.id) } : g === 2 ? { k: i, html: `<b style="font-size:1.05em">${esc(p.n)}</b>` } : { k: i, html: `<span>${esc(cap(p.corta))}</span>` };
        if (g === 1) a.html = thumbHTML(p.id);
        if (g >= 3) a.html = `${thumbHTML(p.id)}<b>${esc(p.n)}</b>`;
        cards.push(a, b);
      });
      this.cards = shuffle(cards); this.total = nP;
      const cols = ENV.mobile ? (nP === 6 ? 3 : 4) : 4;
      el.innerHTML = `<p class="muted" style="text-align:center">${g === 1 ? 'Encuentra las dos imágenes iguales.' : g === 2 ? 'Une cada imagen con su nombre.' : 'Une cada parte con su función.'}</p><div class="mem-grid" style="--cols:${cols}">${this.cards.map((c, i) => `<button class="mem" data-i="${i}" aria-label="Carta ${i + 1}"><div class="mem-in"><div class="mem-f"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${ICONS.cpu}</svg></div><div class="mem-b">${c.html}</div></div></button>`).join('')}</div>`;
      $$('.mem-b [data-thumb]', el).forEach(t => { if (t.tagName !== 'IMG') t.style.cssText = 'width:60%;height:50%;display:grid;place-items:center;color:var(--accent)'; });
      $$('.mem', el).forEach(b => b.onclick = () => this.flip(b));
      this.draw(); this.iv = setInterval(() => this.draw(), 1000);
    },
    draw() { this.stats.innerHTML = `<span class="chip">${icon('timer')}${fmtTime((Date.now() - this.t0) / 1000)}</span><span class="chip">Movimientos: ${this.moves}</span><span class="chip">Parejas: ${this.found}/${this.total}</span>`; },
    flip(b) {
      if (this.lock || b.classList.contains('open') || b.classList.contains('done')) return;
      b.classList.add('open'); this.open.push(b); Sfx.click();
      if (this.open.length < 2) return;
      this.moves++; const [x, y] = this.open; const ok = this.cards[x.dataset.i].k === this.cards[y.dataset.i].k;
      if (ok) { setTimeout(() => { x.classList.add('done'); y.classList.add('done'); celebrate(y, 45); }, 250); this.open = []; this.found++; if (this.found === this.total) setTimeout(() => this.end(), 900); }
      else { this.lock = true; setTimeout(() => { x.classList.remove('open'); y.classList.remove('open'); this.open = []; this.lock = false; }, 900); }
      this.draw();
    },
    end() {
      clearInterval(this.iv); const extra = this.moves - this.total; const st = extra <= 3 ? 3 : extra <= 8 ? 2 : 1; const score = Math.max(10, 200 - extra * 10 - Math.floor((Date.now() - this.t0) / 2000)); const rec = saveBest('memoria', score); Sfx.win();
      gameOver('¡Encontraste todas las parejas!', `${starsHTML(st)}<div class="score grad-text">${score}</div><p>${this.moves} movimientos · ${fmtTime((Date.now() - this.t0) / 1000)}${rec ? ' · <b>¡Nuevo récord!</b>' : ''}</p>`, () => Router.route());
    },
    stop() { clearInterval(this.iv); }
  },
  palabra: {
    start(el, stats) {
      const g = Store.grade; this.el = el; this.stats = stats; this.round = 0; this.score = 0; this.rounds = 5;
      const fromParts = partsForGrade(Math.max(g, 2)).map(p => ({ w: p.pal, clue: g <= 2 ? p.s : p.fn, img: p.id }));
      const extra = Object.entries(WORDS_EXTRA).filter(([k]) => +k <= g && +k >= g - 1).flatMap(([, ws]) => ws.map(w => ({ w, clue: WORD_CLUES[w] })));
      this.list = sample([...fromParts.filter(x => g > 1 || x.w.length <= 8), ...extra], this.rounds);
      this.onKey = e => { if (Router.cur !== 'games') return; const k = norm(e.key); if (/^[A-ZÑ]$/.test(k) || e.key === 'ñ' || e.key === 'Ñ') this.guess(e.key.toLowerCase() === 'ñ' ? 'Ñ' : k); };
      document.addEventListener('keydown', this.onKey); this.next();
    },
    next() {
      if (this.round >= this.list.length) return this.end();
      const it = this.list[this.round]; this.word = norm(it.w).replace(/[^A-ZÑ ]/g, ''); this.used = new Set(); this.lives = 6; this.it = it;
      this.el.innerHTML = `<div class="card" style="max-width:820px;margin:0 auto;text-align:center">
        <div class="row-between"><span class="chip">Palabra ${this.round + 1} de ${this.list.length}</span><div class="battery" aria-label="Batería"></div></div>
        ${it.img && Store.grade <= 2 ? `<div style="width:120px;height:120px;margin:10px auto">${thumbHTML(it.img)}</div>` : ''}
        <p class="muted" style="margin:12px 0 0"><b>Pista:</b> ${esc(it.clue)}</p><div class="word-slots" id="wSlots"></div>
        <div class="vkbd" id="wKbd"></div></div>`;
      const rows = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
      $('#wKbd', this.el).innerHTML = rows.map(r => `<div class="vkbd-row">${[...r].map(c => `<button class="vkey" data-l="${c}">${c}</button>`).join('')}</div>`).join('');
      $$('[data-l]', this.el).forEach(b => b.onclick = () => this.guess(b.dataset.l));
      this.draw();
    },
    draw() {
      $('#wSlots', this.el).innerHTML = [...this.word].map(c => c === ' ' ? '<span class="slot space"></span>' : `<span class="slot ${this.used.has(c) ? 'show' : ''}">${this.used.has(c) ? c : ''}</span>`).join('');
      $('.battery', this.el).innerHTML = Array.from({ length: 6 }, (_, i) => `<i class="${i < this.lives ? '' : 'off'}"></i>`).join('');
      this.stats.innerHTML = `<span class="chip">${icon('star')}${this.score} pts</span>`;
    },
    guess(l) {
      if (!this.word || this.used.has(l) || this.lives <= 0) return; this.used.add(l);
      const b = $(`[data-l="${l}"]`, this.el); b && b.classList.add('used');
      if (this.word.includes(l)) Sfx.click(); else { this.lives--; Sfx.try(); }
      this.draw();
      const won = [...this.word].every(c => c === ' ' || this.used.has(c));
      if (won) { this.score += 20 + this.lives * 5; celebrate($('#wSlots', this.el)); toast(`${pick(PRAISE)} Era ${this.it.w}.`, 'ok'); this.round++; this.word = null; setTimeout(() => this.next(), 1300); }
      else if (this.lives <= 0) { toast(`¡Sigue intentando! La palabra era ${this.it.w}.`, 'try'); this.round++; this.word = null; setTimeout(() => this.next(), 1600); }
    },
    end() {
      const rec = saveBest('palabra', this.score); const st = this.score >= 180 ? 3 : this.score >= 100 ? 2 : this.score ? 1 : 0; Sfx.win();
      gameOver('¡Fin de la ronda!', `${starsHTML(st)}<div class="score grad-text">${this.score}</div><p>${rec ? '<b>¡Nuevo récord!</b>' : 'Sigue practicando el vocabulario tecnológico.'}</p>`, () => Router.route());
    },
    stop() { document.removeEventListener('keydown', this.onKey); }
  },
  lluvia: {
    start(el, stats) {
      const g = Store.grade; this.el = el; this.stats = stats; this.g = g;
      this.src = g === 1 ? [...'ASDFJKLÑ'] : g === 2 ? [...'ASDFGHJKLÑQWERTYUIOPZXCVBNM'] : g === 3 ? ['SOL', 'RED', 'USB', 'RAM', 'PILA', 'CPU', 'WIFI', 'DATO', 'CLIC', 'TECLA', 'MOUSE'] : g === 4 ? PARTS.map(p => p.pal).filter(w => w.length <= 9) : [...PARTS.map(p => p.pal), ...WORDS_EXTRA[5], ...WORDS_EXTRA[4]];
      this.drops = []; this.score = 0; this.lives = 3; this.speed = g <= 2 ? 34 : 26; this.spawnT = 0; this.typed = 0; this.miss = 0; this.over = false;
      el.innerHTML = `<p class="muted" style="text-align:center">Escribe con el teclado ${ENV.touch ? 'en pantalla ' : ''}lo que cae antes de que llegue al piso.</p><div class="rain" id="rain"><div class="floor"></div></div><div class="vkbd" id="rKbd" style="margin-top:12px"></div>`;
      const rows = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
      $('#rKbd', el).innerHTML = rows.filter((r, i) => i || g === 2).map(r => `<div class="vkbd-row">${[...r].map(c => `<button class="vkey" data-l="${c}">${c}</button>`).join('')}</div>`).join('');
      $$('[data-l]', el).forEach(b => b.onclick = () => this.key(b.dataset.l));
      if (g === 2) this.src.push(...'1234567890');
      this.onKey = e => { if (Router.cur !== 'games') return; let k = e.key.length === 1 ? norm(e.key) : ''; if (e.key === 'ñ' || e.key === 'Ñ') k = 'Ñ'; if (k && /^[A-Z0-9Ñ]$/.test(k)) { e.preventDefault(); this.key(k); } };
      document.addEventListener('keydown', this.onKey);
      this.last = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t));
    },
    spawn() {
      const R = $('#rain', this.el); if (!R) return; const w = pick(this.src); const d = document.createElement('div'); d.className = 'drop';
      d.innerHTML = `<span class="typed"></span><span class="rest"></span>`; d.querySelector('.rest').textContent = w;
      const x = 10 + Math.random() * 80; d.style.left = x + '%'; R.appendChild(d); this.drops.push({ el: d, w, i: 0, y: -10 });
    },
    target() { return this.drops.filter(d => d.i > 0)[0] || this.drops.slice().sort((a, b) => b.y - a.y)[0]; },
    key(k) {
      if (this.over) return; const b = $(`[data-l="${k}"]`, this.el); if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 100); }
      const t = this.drops.find(d => d.i > 0 && d.w[d.i] === k) || this.drops.filter(d => d.i === 0 && d.w[0] === k).sort((a, b) => b.y - a.y)[0];
      if (!t) { this.miss++; Sfx.tone(160, .06, 'square', .03); return; }
      t.i++; this.typed++; t.el.querySelector('.typed').textContent = t.w.slice(0, t.i); t.el.querySelector('.rest').textContent = t.w.slice(t.i);
      if (t.i >= t.w.length) { this.score += t.w.length * 10; Sfx.ok(); const r = t.el.getBoundingClientRect(); FX.confetti(r.left + r.width / 2, r.top + r.height / 2, 25); t.el.classList.add('boom'); setTimeout(() => t.el.remove(), 250); this.drops = this.drops.filter(d => d !== t); this.speed += .6; } else Sfx.click();
      this.hint();
    },
    hint() { $$('.vkey.target', this.el).forEach(x => x.classList.remove('target')); const t = this.target(); if (t) $(`[data-l="${t.w[t.i]}"]`, this.el)?.classList.add('target'); },
    loop(now) {
      if (this.over) return; const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; const R = $('#rain', this.el); if (!R) return;
      const H = R.clientHeight; this.spawnT -= dt;
      if (this.spawnT <= 0) { this.spawn(); this.spawnT = Math.max(.9, (this.g <= 2 ? 2.6 : 3.2) - this.score / 600); this.hint(); }
      for (const d of [...this.drops]) { d.y += this.speed * dt; d.el.style.top = d.y + 'px'; if (d.y > H - 44) { d.el.remove(); this.drops = this.drops.filter(x => x !== d); this.lives--; Sfx.try(); this.hint(); if (this.lives <= 0) return this.end(); } }
      this.stats.innerHTML = `<span class="chip">${icon('star')}${this.score} pts</span><span class="chip">${icon('heart')}${'♥'.repeat(this.lives)}</span>`;
      this.raf = requestAnimationFrame(t => this.loop(t));
    },
    end() {
      this.over = true; cancelAnimationFrame(this.raf); const acc = this.typed + this.miss ? Math.round(this.typed / (this.typed + this.miss) * 100) : 0; const rec = saveBest('lluvia', this.score); const st = this.score >= 400 ? 3 : this.score >= 150 ? 2 : this.score ? 1 : 0; Sfx.win();
      gameOver('¡Buen juego!', `${starsHTML(st)}<div class="score grad-text">${this.score}</div><p>Precisión: ${acc}%${rec ? ' · <b>¡Nuevo récord!</b>' : ''}</p><p class="small muted">Consejo: deja los dedos índice sobre la F y la J.</p>`, () => Router.route());
    },
    stop() { this.over = true; cancelAnimationFrame(this.raf); document.removeEventListener('keydown', this.onKey); }
  }
};
