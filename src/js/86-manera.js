/* =====================================================================
   Aprende a tu manera (inteligencias múltiples, Howard Gardner)
   Un mismo tema se puede aprender leyendo, viendo, moviéndose, cantando,
   resolviendo, conversando, reflexionando u observando la naturaleza.
   Actividades nuevas: Duelo por equipos · Ordena los pasos · Rimas con ritmo
   · Mi diario · Observa y clasifica. Retroalimentación siempre positiva.
   ===================================================================== */
const INTELIGENCIAS = [
  { id: 'lin', n: 'Lingüística', yo: 'Me gusta leer, escuchar y contar', ic: 'pen', acts: [['study/learn', 'Lecciones con narración', 'book'], ['games/palabra', 'Palabra secreta', 'type'], ['manera/diario', 'Mi diario', 'diary'], ['chat', 'Pregúntale al asistente', 'chat']] },
  { id: 'log', n: 'Lógico-matemática', yo: 'Me gusta resolver y ordenar', ic: 'calc', acts: [['manera/pasos', 'Ordena los pasos', 'listOrd'], ['study/quiz', 'Quiz que cambia', 'quiz'], ['sim/cpu', 'Arma la CPU', 'cpu']] },
  { id: 'esp', n: 'Visual-espacial', yo: 'Me gusta ver e imaginar', ic: 'eye', acts: [['videos', 'Aprende con videos', 'video'], ['explore', 'Explorar en 3D', 'cube'], ['ar', 'Realidad aumentada', 'scan']] },
  { id: 'kin', n: 'Corporal-kinestésica', yo: 'Me gusta moverme y usar las manos', ic: 'person', acts: [['create', 'Dibuja con tu mano', 'handIndex'], ['sim', 'Conecta los cables', 'sim'], ['games/lluvia', 'Lluvia de teclas', 'keyboard']] },
  { id: 'mus', n: 'Musical', yo: 'Me gusta el ritmo y los sonidos', ic: 'music', acts: [['manera/rimas', 'Rimas con ritmo', 'music'], ['study/learn', 'Escucha las lecciones', 'volume']] },
  { id: 'inter', n: 'Interpersonal', yo: 'Me gusta aprender con otros', ic: 'talk', acts: [['manera/duelo', 'Duelo por equipos', 'users'], ['games/memoria', 'Memoria en parejas', 'puzzle'], ['ar', 'Misiones de RA en pareja', 'scan']] },
  { id: 'intra', n: 'Intrapersonal', yo: 'Me gusta pensar en lo que aprendo', ic: 'smile', acts: [['manera/diario', 'Mi diario', 'diary'], ['study/cards', 'Tarjetas a mi ritmo', 'cards']] },
  { id: 'nat', n: 'Naturalista', yo: 'Me gusta observar y clasificar', ic: 'sprout', acts: [['manera/observa', 'Observa y clasifica', 'leaf'], ['games/clasifica', 'Clasificador de partes', 'layers']] }
];
const MANERA_ACTS = { duelo: 'Duelo por equipos', pasos: 'Ordena los pasos', rimas: 'Rimas con ritmo', diario: 'Mi diario', observa: 'Observa y clasifica' };

Views.manera = {
  enter(el, args) {
    this.stop(); const a = args[0];
    if (a && Manera[a]) {
      el.innerHTML = `<div class="game-head"><button class="btn btn-ghost btn-sm" id="mBack">${icon('left')}Aprende a tu manera</button><h2 style="margin:0">${MANERA_ACTS[a]}</h2><div class="game-stats" id="mStats"></div></div><div id="mBody"></div>`;
      $('#mBack', el).onclick = () => Router.go('manera');
      this.cur = Manera[a]; this.cur.start($('#mBody', el), $('#mStats', el)); return;
    }
    el.innerHTML = `<div class="section-head"><div><span class="eyebrow">${icon('shapes')} Aprende a tu manera</span><h2>Cada persona aprende distinto</h2>
        <p>Según la teoría de las <b>inteligencias múltiples</b> de Howard Gardner, todos tenemos varias formas de aprender. Elige la que más te guste hoy; mañana puedes probar otra.</p></div></div>
      <div class="intel-grid">${INTELIGENCIAS.map(x => `<article class="card intel"><div class="intel-head"><span class="fi">${icon(x.ic)}</span><div><h3>${x.n}</h3><p>${x.yo}</p></div></div>
        <div class="intel-acts">${x.acts.map(([r, n, ic]) => `<button class="intel-act" data-r="${r}">${icon(ic)}<span>${n}</span>${icon('right', 'ia-go')}</button>`).join('')}</div></article>`).join('')}</div>
      <p class="small muted" style="margin-top:16px">${icon('info')} Referencia: Gardner, H. (1983). <i>Frames of Mind: The Theory of Multiple Intelligences</i>. Las actividades complementan las lecciones del área; no clasifican a nadie.</p>`;
    $$('[data-r]', el).forEach(b => b.onclick = () => b.dataset.r === 'chat' ? Chat.toggle(true) : Router.go(b.dataset.r));
  },
  stop() { this.cur?.stop?.(); this.cur = null; Voice.stop(); },
  leave() { this.stop(); },
  onGrade() { Router.route(); }
};

/* Respuesta positiva común */
function feedbackHTML(ok, extra = '') { return `<div class="feedback ${ok ? 'ok' : 'try'}">${icon(ok ? 'sparkle' : 'heart', 'ic')}<div><b>${ok ? pick(PRAISE) : pick(ENCOURAGE)}</b>${extra ? `<p style="margin:4px 0 0">${extra}</p>` : ''}</div></div>`; }

const Manera = {};

/* ---------- Duelo por equipos (interpersonal) ---------- */
Manera.duelo = {
  start(el, stats) {
    this.el = el; this.stats = stats;
    const n = Store.data.duelNames || ['Equipo Azul', 'Equipo Rosa'];
    el.innerHTML = `<div class="card duel-setup"><p>Dos equipos se turnan para responder en la misma pantalla. Cada respuesta correcta suma una estrella para su equipo. Si una respuesta no sale, el equipo escucha la explicación y sigue participando.</p>
      <div class="grid grid-2"><label class="field">Nombre del primer equipo<input class="input" id="dA" maxlength="24" value="${esc(n[0])}"></label><label class="field">Nombre del segundo equipo<input class="input" id="dB" maxlength="24" value="${esc(n[1])}"></label></div>
      <label class="field">Preguntas por equipo<select class="select" id="dN"><option value="3">3</option><option value="5" selected>5</option><option value="8">8</option></select></label>
      <button class="btn btn-primary btn-lg" id="dGo">${icon('users')}Empezar el duelo</button></div>`;
    $('#dGo', el).onclick = () => {
      const A = $('#dA', el).value.trim() || 'Equipo 1', B = $('#dB', el).value.trim() || 'Equipo 2';
      Store.data.duelNames = [A, B]; Store.save();
      const per = +$('#dN', el).value; this.teams = [{ n: A, s: 0 }, { n: B, s: 0 }];
      this.qs = QGen.make({ g: Store.grade, n: per * 2 }); this.i = 0; this.show();
    };
  },
  draw() { this.stats.innerHTML = this.teams ? this.teams.map((t, k) => `<span class="chip ${this.i % 2 === k ? 'chip-on' : ''}">${icon('star')}${esc(t.n)}: ${t.s}</span>`).join('') : ''; },
  show() {
    if (this.i >= this.qs.length) return this.end();
    const q = this.qs[this.i], team = this.teams[this.i % 2], L = 'ABCD';
    this.draw();
    this.el.innerHTML = `<div class="quiz-wrap"><div class="duel-turn"><span>Turno de</span><b>${esc(team.n)}</b><small>Pregunta ${Math.floor(this.i / 2) + 1} de ${this.qs.length / 2}</small></div>
      <div class="card">${q.img ? thumbHTML(q.img, 'q-img') : ''}<div class="row-between"><p class="q-text grow" id="dQ">${esc(q.q)}</p><button class="icon-btn" id="dSay" aria-label="Escuchar la pregunta">${icon('volume')}</button></div>
      <div class="options" role="group" aria-labelledby="dQ">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="let">${L[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>
      <div id="dFb"></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" id="dNext" hidden>Siguiente turno ${icon('right')}</button></div></div></div>`;
    $('#dSay', this.el).onclick = () => Voice.speak(q.q + '. ' + q.opts.map((o, k) => `${L[k]}: ${o}`).join('. '));
    $$('[data-k]', this.el).forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === q.ans;
      $$('[data-k]', this.el).forEach(x => { x.disabled = true; if (+x.dataset.k === q.ans) x.classList.add('right'); else if (x === b) x.classList.add('tried'); });
      if (ok) { team.s++; Sfx.ok(); celebrate(b, 50); } else Sfx.try();
      $('#dFb', this.el).innerHTML = feedbackHTML(ok, ok ? esc(q.exp || '') : `La respuesta es: <b>${esc(q.opts[q.ans])}</b>. ${esc(q.exp || '')}`);
      this.draw(); const nx = $('#dNext', this.el); nx.hidden = false; nx.focus();
      nx.onclick = () => { this.i++; this.show(); };
    });
  },
  end() {
    const [a, b] = this.teams; this.draw(); Sfx.win(); FX.confetti(innerWidth / 2, innerHeight / 3, 120);
    const msg = a.s === b.s ? '¡Empate! Los dos equipos trabajaron muy bien.' : `${esc((a.s > b.s ? a : b).n)} sumó más estrellas esta vez. ¡Los dos equipos aprendieron!`;
    this.el.innerHTML = `<div class="card result-hero" style="text-align:center"><h2>${icon('trophy')} ¡Duelo terminado!</h2><div class="duel-score">${this.teams.map(t => `<div><b>${t.s}</b><span>${esc(t.n)}</span></div>`).join('')}</div><p class="lead">${msg}</p>
      <div class="row" style="justify-content:center"><button class="btn btn-primary" id="dAgain">${icon('refresh')}Otro duelo</button><button class="btn" id="dOut">${icon('shapes')}Otras actividades</button></div></div>`;
    $('#dAgain', this.el).onclick = () => this.start(this.el, this.stats);
    $('#dOut', this.el).onclick = () => Router.go('manera');
    this.teams = null; this.draw();
  },
  stop() { this.teams = null; }
};

/* ---------- Ordena los pasos (lógico-matemática) ---------- */
const SECUENCIAS = [
  { g: 1, t: 'Encender el computador', s: ['Revisar que el computador esté conectado', 'Presionar el botón de encendido de la torre', 'Encender el monitor', 'Esperar a que aparezca el escritorio'] },
  { g: 1, t: 'Apagar el computador', s: ['Guardar mi trabajo', 'Cerrar los programas', 'Elegir Inicio y luego Apagar', 'Esperar a que la pantalla se ponga negra'] },
  { g: 2, t: 'Escribir mi nombre', s: ['Abrir el programa para escribir', 'Mantener presionada la tecla Shift', 'Escribir la primera letra en mayúscula', 'Escribir las demás letras', 'Revisar que esté bien escrito'] },
  { g: 2, t: 'Hacer un dibujo digital', s: ['Abrir el programa de dibujo', 'Elegir el pincel y el color', 'Dibujar con el mouse', 'Guardar el dibujo con un nombre'] },
  { g: 3, t: 'Guardar un archivo', s: ['Hacer clic en Archivo', 'Elegir Guardar como', 'Escoger la carpeta', 'Escribir el nombre del archivo', 'Hacer clic en Guardar'] },
  { g: 3, t: 'Levantar una piedra con una palanca', s: ['Poner un apoyo cerca de la piedra', 'Colocar la barra sobre el apoyo', 'Meter la punta de la barra debajo de la piedra', 'Empujar hacia abajo el otro extremo'] },
  { g: 4, t: 'Armar un circuito sencillo', s: ['Reunir una pila, cables, un bombillo y un interruptor', 'Conectar un cable al polo positivo de la pila', 'Unir ese cable al bombillo', 'Llevar otro cable del bombillo al interruptor y al polo negativo', 'Cerrar el interruptor: el bombillo enciende'] },
  { g: 4, t: 'Buscar información segura en internet', s: ['Pedir permiso a un adulto', 'Abrir el navegador', 'Escribir palabras clave en el buscador', 'Elegir una página confiable', 'Comparar la información con otra fuente'] },
  { g: 5, t: 'El computador como sistema', s: ['Entrada: escribo los números con el teclado', 'Proceso: el procesador hace la suma', 'Almacenamiento: la memoria guarda el resultado', 'Salida: veo el resultado en el monitor'] },
  { g: 5, t: 'Desechar un aparato electrónico viejo', s: ['Revisar si se puede reparar o donar', 'Borrar la información personal con ayuda de un adulto', 'Separar las pilas y baterías', 'Llevarlo a un punto de recolección de residuos electrónicos'] }
];
Manera.pasos = {
  start(el, stats) {
    this.el = el; this.stats = stats; const g = Store.grade;
    this.list = [...SECUENCIAS.filter(x => x.g === g), ...SECUENCIAS.filter(x => x.g < g).reverse()];
    this.k = 0; this.done = 0; this.load();
  },
  load() {
    const sq = this.list[this.k % this.list.length];
    this.sq = sq; this.order = []; this.pool = shuffle(sq.s.map((t, i) => ({ t, i })));
    if (this.pool.every((p, j) => p.i === j)) this.pool.reverse();
    this.draw();
  },
  draw() {
    const sq = this.sq, n = sq.s.length;
    this.stats.innerHTML = `<span class="chip">${icon('check')}${this.done} ${this.done === 1 ? 'secuencia' : 'secuencias'}</span>`;
    this.el.innerHTML = `<div class="card steps-game"><p class="small muted">Toca los pasos en el orden correcto. Si te equivocas, toca un paso ya puesto para devolverlo.</p><h3>${icon('listOrd')} ${esc(sq.t)}</h3>
      <ol class="sg-slots">${Array.from({ length: n }, (_, j) => { const p = this.order[j]; return `<li class="sg-slot ${p ? 'full' : ''} ${this.checked && p ? (p.i === j ? 'ok' : 'move') : ''}" ${p ? `data-back="${j}"` : ''}><span class="n">${j + 1}</span><span>${p ? esc(p.t) : '…'}</span></li>`; }).join('')}</ol>
      <div class="sg-pool">${this.pool.map((p, j) => `<button class="opt sg-card" data-take="${j}">${esc(p.t)}</button>`).join('')}</div>
      <div id="sgFb"></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="sgSay">${icon('volume')}Escuchar</button>${this.order.length === n ? `<button class="btn btn-primary" id="sgCheck">${icon('check')}Revisar</button>` : ''}</div></div>`;
    $$('[data-take]', this.el).forEach(b => b.onclick = () => { this.checked = false; this.order.push(this.pool.splice(+b.dataset.take, 1)[0]); this.draw(); });
    $$('[data-back]', this.el).forEach(b => b.onclick = () => { this.checked = false; const j = +b.dataset.back; this.pool.push(...this.order.splice(j)); this.draw(); });
    $('#sgSay', this.el).onclick = () => Voice.speak(sq.t + '. ' + (this.order.length ? this.order.map((p, j) => `${j + 1}: ${p.t}`).join('. ') : this.pool.map(p => p.t).join('. ')));
    $('#sgCheck', this.el)?.addEventListener('click', () => this.check());
  },
  check() {
    this.checked = true; const ok = this.order.every((p, j) => p.i === j);
    this.draw();
    if (ok) {
      this.done++; Sfx.ok(); celebrate($('.sg-slots', this.el), 80);
      $('#sgFb', this.el).innerHTML = feedbackHTML(true, 'Ordenaste todos los pasos. ¡Así piensan los programadores: paso a paso!');
      const b = document.createElement('button'); b.className = 'btn btn-primary'; b.innerHTML = `Otra secuencia ${icon('right')}`; b.onclick = () => { this.k++; this.checked = false; this.load(); };
      $('#sgCheck', this.el)?.replaceWith(b); b.focus();
    } else {
      Sfx.try(); const good = this.order.filter((p, j) => p.i === j).length;
      $('#sgFb', this.el).innerHTML = feedbackHTML(false, `${good} de ${this.order.length} ${good === 1 ? 'paso ya está' : 'pasos ya están'} en su lugar. Toca un paso para devolverlo y vuelve a ordenarlo.`);
    }
  },
  stop() {}
};

/* ---------- Rimas con ritmo (musical) — rimas originales de TECNO LAB ---------- */
const RIMAS = [
  { g: 1, t: 'Las partes del computador', v: ['El monitor me deja ver', 'colores y letras por doquier;', 'el teclado sirve para escribir', 'y el mouse me ayuda a elegir.'], gap: [3, 'elegir', ['correr', 'dormir']] },
  { g: 1, t: 'Cuido la sala', v: ['Antes de usar el computador', 'lavo mis manos con amor;', 'sin comida y sin bebida', 'mi sala queda protegida.'], gap: [3, 'protegida', ['dormida', 'perdida']] },
  { g: 2, t: 'Entrada y salida', v: ['Por el teclado y el ratón', 'entra la información;', 'por la pantalla y el parlante', 'sale en un instante.'], gap: [1, 'información', ['canción', 'estación']] },
  { g: 2, t: 'Pantallas con medida', v: ['Juego un rato y luego paro,', 'muevo el cuerpo, no me agobio;', 'cuido mis ojos y mi espalda', 'y descanso con calma.'], gap: [3, 'calma', ['palma', 'alma']] },
  { g: 3, t: 'Hardware y software', v: ['El hardware lo puedo tocar,', 'el software me ayuda a trabajar;', 'rampa, palanca y polea:', '¡máquinas simples en la tarea!'], gap: [1, 'trabajar', ['nadar', 'cantar']] },
  { g: 4, t: 'El circuito', v: ['Pila, cable y bombillo', 'forman un circuito sencillo;', 'cierro el interruptor ya', '¡y la luz se encenderá!'], gap: [1, 'sencillo', ['amarillo', 'martillo']] },
  { g: 4, t: 'Navego seguro', v: ['Antes de navegar', 'a un adulto voy a avisar;', 'mi clave es un secreto', 'y a todos trato con respeto.'], gap: [3, 'respeto', ['silencio', 'cuidado']] },
  { g: 5, t: 'Energías renovables', v: ['El sol brilla, el viento sopla,', 'el río corre sin parar:', 'son energías renovables', 'que no se van a acabar.'], gap: [3, 'acabar', ['empezar', 'mojar']] },
  { g: 5, t: 'Ciudadanía digital', v: ['En internet soy amable,', 'pienso antes de publicar,', 'cuido mis datos personales', 'y sé con quién voy a hablar.'], gap: [3, 'hablar', ['saltar', 'cocinar']] }
];
Manera.rimas = {
  start(el, stats) {
    this.el = el; this.stats = stats; const g = Store.grade;
    this.list = [...RIMAS.filter(r => r.g === g), ...RIMAS.filter(r => r.g < g).reverse()]; this.k = 0; this.stars = 0; this.draw();
  },
  draw() {
    const r = this.list[this.k % this.list.length]; this.r = r; this.stopBeat();
    this.stats.innerHTML = `<span class="chip">${icon('star')}${this.stars}</span>`;
    this.el.innerHTML = `<div class="card rhyme"><span class="eyebrow">${icon('music')} Rima ${this.k % this.list.length + 1} de ${this.list.length}</span><h3>${esc(r.t)}</h3>
      <div class="rh-lines" id="rhL">${r.v.map((l, i) => `<p data-l="${i}">${esc(l)}</p>`).join('')}</div>
      <div class="row"><button class="btn btn-primary" id="rhPlay">${icon('play')}Escuchar con ritmo</button><button class="btn" id="rhClap">${icon('drum')}Marcar el ritmo</button><button class="btn" id="rhGame">${icon('puzzle')}Completa la rima</button><button class="btn btn-ghost" id="rhNext">Otra rima ${icon('right')}</button></div>
      <div id="rhG"></div><p class="small muted" style="margin-top:12px">Lee en voz alta siguiendo el pulso. Puedes aplaudir en cada golpe o inventar un movimiento para cada verso.</p></div>`;
    $('#rhPlay', this.el).onclick = () => this.play();
    $('#rhClap', this.el).onclick = e => { if (this.iv) { this.stopBeat(); e.currentTarget.setAttribute('aria-pressed', 'false'); } else { this.beat(); e.currentTarget.setAttribute('aria-pressed', 'true'); } };
    $('#rhGame', this.el).onclick = () => this.game();
    $('#rhNext', this.el).onclick = () => { this.k++; Voice.stop(); this.draw(); };
  },
  beat() {
    this.stopBeat(); let n = 0;
    const hit = () => { const strong = n % 4 === 0; Sfx.tone(strong ? 110 : 220, strong ? .14 : .06, strong ? 'sine' : 'triangle', strong ? .12 : .05); const d = $('.rhyme', this.el); if (d) { d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse'); } n++; };
    hit(); this.iv = setInterval(hit, 600);
  },
  stopBeat() { clearInterval(this.iv); this.iv = null; },
  play() {
    const r = this.r; let i = 0; Voice.stop(); this.beat();
    const lines = $$('[data-l]', this.el);
    const next = () => {
      lines.forEach(p => p.classList.toggle('on', +p.dataset.l === i));
      if (i >= r.v.length || Router.cur !== 'manera') { lines.forEach(p => p.classList.remove('on')); setTimeout(() => this.stopBeat(), 600); return; }
      if (Voice.supported) Voice.speak(r.v[i], () => { i++; setTimeout(next, 250); }); else { i++; setTimeout(next, 2400); }
    };
    next();
  },
  game() {
    const r = this.r, [li, word, alts] = r.gap, opts = shuffle([word, ...alts]);
    const lines = $$('[data-l]', this.el);
    lines[li].innerHTML = esc(r.v[li]).replace(new RegExp(esc(word) + '(?![\\wáéíóúñ])'), '<span class="rh-gap">_____</span>');
    $('#rhG', this.el).innerHTML = `<p><b>¿Qué palabra completa la rima?</b></p><div class="options">${opts.map(o => `<button class="opt" data-w="${esc(o)}"><span>${esc(o)}</span></button>`).join('')}</div><div id="rhFb"></div>`;
    $$('[data-w]', this.el).forEach(b => b.onclick = () => {
      const ok = b.dataset.w === word;
      if (ok) { $$('[data-w]', this.el).forEach(x => { x.disabled = true; if (x.dataset.w === word) x.classList.add('right'); }); lines[li].textContent = r.v[li]; this.stars++; this.stats.innerHTML = `<span class="chip">${icon('star')}${this.stars}</span>`; Sfx.ok(); celebrate(b, 50); $('#rhFb', this.el).innerHTML = feedbackHTML(true, `“${esc(word)}” suena parecido al final del otro verso. ¡Eso es una rima!`); }
      else { b.classList.add('tried'); b.disabled = true; Sfx.try(); $('#rhFb', this.el).innerHTML = feedbackHTML(false, 'Escucha cómo termina el verso de al lado y busca una palabra que suene parecido.'); }
    });
  },
  stop() { this.stopBeat(); Voice.stop(); }
};

/* ---------- Mi diario (intrapersonal) ---------- */
const ANIMOS = [['feliz', 'Feliz', 'smile'], ['tranquilo', 'Tranquilo', 'heart'], ['curioso', 'Curioso', 'search'], ['cansado', 'Cansado', 'timer'], ['confundido', 'Con dudas', 'help']];
Manera.diario = {
  start(el, stats) { this.el = el; this.stats = stats; this.mood = null; this.draw(); },
  entries() { Store.data.diary ??= []; return Store.data.diary; },
  draw() {
    const list = this.entries(), g = Store.grade;
    this.stats.innerHTML = `<span class="chip">${icon('diary')}${list.length} ${list.length === 1 ? 'página' : 'páginas'}</span>`;
    const temas = TOPICS[g];
    this.el.innerHTML = `<div class="grid diary-grid">
      <div class="card"><h3>${icon('pen')} Hoy en TECNO LAB</h3>
        <label class="field">¿Sobre qué tema aprendiste?<select class="select" id="dyT">${temas.map(t => `<option value="${t.id}">${esc(t.t)}</option>`).join('')}<option value="">Otro tema</option></select></label>
        <p class="small" style="margin:10px 0 6px">¿Cómo te sentiste?</p>
        <div class="mood-row" role="radiogroup" aria-label="Cómo me sentí">${ANIMOS.map(([k, n, ic]) => `<button type="button" class="mood" role="radio" aria-checked="${this.mood === k}" data-m="${k}">${icon(ic)}<span>${n}</span></button>`).join('')}</div>
        <label class="field">Hoy aprendí que…<textarea class="input" id="dyA" rows="2" maxlength="400"></textarea></label>
        <label class="field">Lo que más me gustó fue…<textarea class="input" id="dyB" rows="2" maxlength="400"></textarea></label>
        <label class="field">Me gustaría saber más sobre…<textarea class="input" id="dyC" rows="2" maxlength="400"></textarea></label>
        <div class="row"><button class="btn btn-primary" id="dySave">${icon('save')}Guardar en mi diario</button><button class="btn" id="dySay">${icon('volume')}Escuchar las preguntas</button></div></div>
      <div class="card"><div class="row-between"><h3 style="margin:0">${icon('book')} Mis páginas</h3>${list.length ? `<button class="btn btn-sm" id="dyPrint">${icon('printer')}Imprimir</button>` : ''}</div>
        <div class="diary-list">${list.length ? [...list].reverse().map((e, j) => { const t = TOPIC[e.t]; const m = ANIMOS.find(a => a[0] === e.m); return `<article class="diary-entry"><div class="row-between"><b>${new Date(e.d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}</b><span class="small muted">${e.g}.° ${m ? '· ' + m[1] : ''}</span></div>${t ? `<p class="small muted">${esc(t.t)}</p>` : ''}${e.a ? `<p><b>Aprendí:</b> ${esc(e.a)}</p>` : ''}${e.b ? `<p><b>Me gustó:</b> ${esc(e.b)}</p>` : ''}${e.c ? `<p><b>Quiero saber:</b> ${esc(e.c)}</p>` : ''}<button class="link-btn small" data-del="${list.length - 1 - j}">Borrar</button></article>`; }).join('') : `<p class="small muted">Aquí aparecerán tus páginas. Escribir lo que aprendiste te ayuda a recordarlo.</p>`}</div></div></div>`;
    $$('[data-m]', this.el).forEach(b => b.onclick = () => { this.mood = b.dataset.m; $$('[data-m]', this.el).forEach(x => x.setAttribute('aria-checked', x === b)); });
    $('#dySay', this.el).onclick = () => Voice.speak('¿Sobre qué tema aprendiste? ¿Cómo te sentiste? Hoy aprendí que… Lo que más me gustó fue… Me gustaría saber más sobre…');
    $('#dySave', this.el).onclick = () => {
      const a = $('#dyA', this.el).value.trim(), b = $('#dyB', this.el).value.trim(), c = $('#dyC', this.el).value.trim();
      if (!a && !b && !c) { toast('Escribe al menos una idea para guardar tu página.', 'try'); return; }
      this.entries().push({ d: Date.now(), g, t: $('#dyT', this.el).value, m: this.mood, a, b, c }); Store.save();
      Sfx.ok(); toast('¡Página guardada! Pensar en lo que aprendes te hace más fuerte.', 'ok'); this.mood = null; this.draw();
    };
    $$('[data-del]', this.el).forEach(b => b.onclick = () => { this.entries().splice(+b.dataset.del, 1); Store.save(); this.draw(); });
    $('#dyPrint', this.el)?.addEventListener('click', () => this.print());
  },
  print() {
    const rows = this.entries().map(e => `<section><h3>${new Date(e.d).toLocaleDateString('es-CO')} · ${e.g}.° ${TOPIC[e.t] ? '· ' + esc(TOPIC[e.t].t) : ''}</h3>${e.a ? `<p><b>Aprendí:</b> ${esc(e.a)}</p>` : ''}${e.b ? `<p><b>Me gustó:</b> ${esc(e.b)}</p>` : ''}${e.c ? `<p><b>Quiero saber:</b> ${esc(e.c)}</p>` : ''}</section>`).join('');
    printHTML(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Mi diario · TECNO LAB</title><style>body{font:15px/1.5 system-ui,sans-serif;padding:24px;color:#111}h1{font-size:22px}h3{font-size:15px;margin:18px 0 4px;border-bottom:1px solid #ccc}</style></head><body><h1>Mi diario · TECNO LAB</h1><p>Nombre: ______________________ Grado: ____</p>${rows}</body></html>`);
  },
  stop() {}
};

/* ---------- Observa y clasifica (naturalista) ---------- */
function observaModos(g) {
  const fromMap = (n, obj, bins) => ({ n, bins, items: Object.entries(obj).flatMap(([k, arr]) => arr.map(x => [x, k])) });
  const M = [];
  if (g <= 2) M.push({ ...fromMap('¿Natural o artefacto?', NATURAL_ART, ['natural', 'artefacto']), labels: { natural: 'Natural (lo hace la naturaleza)', artefacto: 'Artefacto (lo hacen las personas)' } });
  if (g === 1 || g === 4) M.push({ ...fromMap('¿Usa electricidad?', ELECTRIC, Object.keys(ELECTRIC)), labels: { 'funciona con electricidad': 'Funciona con electricidad', 'no usa electricidad': 'No usa electricidad' } });
  if (g === 2) { const mats = shuffle([...new Set(MAT_OBJ.map(x => x[1]))]).slice(0, 4); M.push({ n: '¿De qué material es?', bins: mats, items: MAT_OBJ.filter(x => mats.includes(x[1])), labels: Object.fromEntries(mats.map(m => [m, m])) }); }
  if (g === 3) { const ms = [...new Set(MACHINES.map(x => x[1]))]; M.push({ n: '¿Qué máquina simple es?', bins: ms, items: MACHINES, labels: Object.fromEntries(ms.map(m => [m, m])) }); M.push({ ...fromMap('¿Natural o artefacto?', NATURAL_ART, ['natural', 'artefacto']), labels: { natural: 'Natural', artefacto: 'Artefacto' } }); }
  if (g === 4) M.unshift({ ...fromMap('¿Conductor o aislante?', MATERIALS, ['conductor', 'aislante']), labels: { conductor: 'Conductor (deja pasar la electricidad)', aislante: 'Aislante (no la deja pasar)' } });
  if (g === 5) { M.push({ ...fromMap('¿Renovable o no renovable?', ENERGIES, ['renovable', 'no renovable']), labels: { renovable: 'Renovable', 'no renovable': 'No renovable' }, pre: 'Energía ' }); const fs = [...new Set(E_FORMS.map(x => x[1]))]; M.push({ n: '¿Qué forma de energía es?', bins: fs, items: E_FORMS, labels: Object.fromEntries(fs.map(f => [f, f])) }); }
  return M;
}
Manera.observa = {
  start(el, stats) { this.el = el; this.stats = stats; this.modes = observaModos(Store.grade); this.mi = 0; this.begin(); },
  begin() {
    const M = this.modes[this.mi % this.modes.length]; this.M = M;
    this.deck = shuffle(M.items).slice(0, Math.min(8, M.items.length)); this.right = 0; this.i = 0; this.next();
  },
  next() {
    const M = this.M;
    this.stats.innerHTML = `<span class="chip">${icon('leaf')}${this.i}/${this.deck.length}</span><span class="chip">${icon('star')}${this.right}</span>`;
    if (this.i >= this.deck.length) return this.end();
    const [item, ans] = this.deck[this.i];
    this.el.innerHTML = `<div class="card observa"><div class="row-between"><span class="eyebrow">${icon('sprout')} ${esc(M.n)}</span>${this.modes.length > 1 ? `<button class="btn btn-sm btn-ghost" id="obMode">${icon('refresh')}Cambiar de juego</button>` : ''}</div>
      <p class="ob-item">${esc((M.pre || '') + item)}</p>
      <div class="bins ob-bins">${M.bins.map(b => `<button class="bin" data-b="${esc(b)}"><span>${esc(M.labels[b] || b)}</span></button>`).join('')}</div><div id="obFb"></div></div>`;
    $('#obMode', this.el)?.addEventListener('click', () => { this.mi++; this.begin(); });
    let tries = 0;
    $$('[data-b]', this.el).forEach(btn => btn.onclick = () => {
      const ok = btn.dataset.b === ans;
      if (ok) {
        if (!tries) this.right++; Sfx.ok(); celebrate(btn, 40); btn.classList.add('right');
        $$('[data-b]', this.el).forEach(x => x.disabled = true);
        $('#obFb', this.el).innerHTML = feedbackHTML(true, `${esc(cap((M.pre || '') + item))}: ${esc(M.labels[ans] || ans)}.`);
        setTimeout(() => { this.i++; this.next(); }, 1300);
      } else { tries++; btn.classList.add('tried'); btn.disabled = true; Sfx.try(); $('#obFb', this.el).innerHTML = feedbackHTML(false, 'Observa bien y prueba con otro grupo.'); }
    });
  },
  end() {
    Sfx.win(); FX.confetti(innerWidth / 2, innerHeight / 3, 90);
    const n = this.deck.length, s = this.right / n >= .85 ? 3 : this.right / n >= .5 ? 2 : 1;
    this.el.innerHTML = `<div class="card result-hero" style="text-align:center"><h2>¡Muy buena observación!</h2>${starsHTML(s)}<p class="lead">Clasificaste ${n} elementos; ${this.right} al primer intento.</p>
      <div class="row" style="justify-content:center"><button class="btn btn-primary" id="obAgain">${icon('refresh')}Jugar otra vez</button>${this.modes.length > 1 ? `<button class="btn" id="obOther">${icon('shapes')}Otro juego</button>` : ''}</div></div>`;
    $('#obAgain', this.el).onclick = () => this.begin();
    $('#obOther', this.el)?.addEventListener('click', () => { this.mi++; this.begin(); });
  },
  stop() {}
};
