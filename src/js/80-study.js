/* =====================================================================
   Estudio: lecciones por grado, fichas de partes, tarjetas de repaso
   y quices/exámenes que cambian cada vez (banco + preguntas generadas).
   ===================================================================== */
const STUDY_TABS = [['learn', 'Aprende', 'book'], ['parts', 'Partes del computador', 'cpu'], ['cards', 'Tarjetas', 'cards'], ['quiz', 'Ponte a prueba', 'quiz']];
Views.study = {
  enter(el, args, q) {
    const tab = STUDY_TABS.some(t => t[0] === args[0]) ? args[0] : 'learn';
    el.innerHTML = `<div class="tabs" role="tablist" aria-label="Secciones de estudio">${STUDY_TABS.map(([id, n, ic]) => `<button class="tab" role="tab" aria-selected="${id === tab}" data-tab="${id}">${icon(ic)}${n}</button>`).join('')}</div><div id="studyBody"></div>`;
    $$('[data-tab]', el).forEach(b => b.onclick = () => Router.go('study/' + b.dataset.tab));
    const body = $('#studyBody', el);
    if (tab === 'learn') args[1] && TOPIC[args[1]] ? Learn.lesson(body, TOPIC[args[1]]) : Learn.list(body);
    if (tab === 'parts') Learn.parts(body);
    if (tab === 'cards') Cards.start(body, q);
    if (tab === 'quiz') Quiz.setup(body, q);
  },
  leave() { Quiz.stopTimer(); },
  onGrade() { Router.go('study/' + (Router.args[0] || 'learn')); }
};

const Learn = {
  list(el) {
    const g = Store.grade, read = Store.g('read');
    el.innerHTML = `<div class="section-head"><div><span class="eyebrow">${icon('grad')} Grado ${GRADES[g].n}</span><h2>Temas de ${GRADES[g].n.toLowerCase()}</h2><p>Lee cada tema, escúchalo y luego repásalo con tarjetas o un quiz.</p></div>
      <div style="min-width:220px"><div class="small muted">${Object.keys(read).length} de ${TOPICS[g].length} temas leídos</div><div class="progress"><span style="width:${Object.keys(read).length / TOPICS[g].length * 100}%"></span></div></div></div>
      <div class="grid grid-3">${TOPICS[g].map((t, i) => `<button class="card card-link topic-card" data-t="${t.id}"><span class="topic-num">${icon(t.ic)}</span><div><span class="small dim">Tema ${i + 1}</span><h3>${esc(t.t)}</h3><p>${esc(t.r)}</p></div>${read[t.id] ? `<span class="done-mark" aria-label="Leído">${icon('check')}</span>` : ''}</button>`).join('')}</div>
      ${g > 1 ? `<h3 style="margin-top:28px">Repasa grados anteriores</h3><div class="row">${[1, 2, 3, 4].filter(x => x < g).map(x => `<button class="btn btn-sm" data-prev="${x}">${icon('history')}Temas de ${x}.°</button>`).join('')}</div>` : ''}`;
    $$('[data-t]', el).forEach(b => b.onclick = () => Router.go('study/learn/' + b.dataset.t));
    $$('[data-prev]', el).forEach(b => b.onclick = () => { const x = +b.dataset.prev; openModal({ title: `Temas de ${GRADES[x].n.toLowerCase()}`, body: `<div class="stack">${TOPICS[x].map(t => `<button class="card card-link topic-card" data-t2="${t.id}"><span class="topic-num">${icon(t.ic)}</span><div><h3>${esc(t.t)}</h3><p>${esc(t.r)}</p></div></button>`).join('')}</div>` }).el.querySelectorAll('[data-t2]').forEach(c => c.onclick = () => { $('#modalRoot').innerHTML = ''; Router.go('study/learn/' + c.dataset.t2); }); });
  },
  lesson(el, t) {
    const read = Store.g('read'); read[t.id] = Date.now(); Store.save();
    const list = TOPICS[t.g], i = list.findIndex(x => x.id === t.id), next = list[i + 1];
    const arParts = t.parts.filter(id => Models.has(id));
    el.innerHTML = `<article class="lesson">
      <button class="btn btn-ghost btn-sm" id="lsBack" style="margin-bottom:14px">${icon('left')}Todos los temas</button>
      <div class="lesson-head"><span class="topic-num" style="width:58px;height:58px">${icon(t.ic)}</span><div class="grow"><span class="eyebrow">Grado ${t.g}.° · Tema ${i + 1}</span><h2 style="margin:4px 0 0">${esc(t.t)}</h2></div>${speakBtn('Escuchar el tema', 'btn')}</div>
      ${t.sec.map(s => `<section><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></section>`).join('')}
      <div class="keybox"><h3 style="margin-top:0">${icon('sparkle')} Ideas clave</h3><ul>${t.key.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>
      ${t.parts.length ? `<h3>Partes relacionadas</h3><p class="small muted">Toca una parte para ver su ficha${arParts.length ? ', su modelo 3D o usa el botón de realidad aumentada para verlas sobre el marcador' : ''}.</p><div class="mini-parts">${t.parts.map(id => `<button class="mini-part" data-p="${id}">${thumbHTML(id)}<span>${esc(PART[id].n)}</span></button>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:24px">${arParts.length ? `<button class="btn btn-primary" id="lsAR">${icon('scan')}Ver este tema en realidad aumentada</button>` : ''}<button class="btn" id="lsVid">${icon('play')}Videos de este tema</button><button class="btn ${arParts.length ? '' : 'btn-primary'}" id="lsQuiz">${icon('quiz')}Quiz de este tema</button><button class="btn" id="lsCards">${icon('cards')}Tarjetas de este tema</button>${next ? `<button class="btn btn-ghost" id="lsNext">Siguiente: ${esc(next.t)} ${icon('right')}</button>` : ''}</div>
    </article>`;
    $('#lsBack', el).onclick = () => Router.go('study/learn');
    $('[data-speak]', el).onclick = e => Voice.toggle(lessonText(t), e.currentTarget);
    $$('[data-p]', el).forEach(b => b.onclick = () => Router.go('explore/' + b.dataset.p));
    $('#lsQuiz', el).onclick = () => Router.go('study/quiz?topic=' + t.id);
    $('#lsAR', el)?.addEventListener('click', () => ARRun.start(arParts[0], arParts, { id: 'tour', kind: 'tour', n: 'Recorrido: ' + t.t }));
    $('#lsVid', el).onclick = () => Router.go('videos?topic=' + t.id);
    $('#lsCards', el).onclick = () => Router.go('study/cards?topic=' + t.id);
    $('#lsNext', el)?.addEventListener('click', () => Router.go('study/learn/' + next.id));
  },
  parts(el) {
    let f = 'all';
    el.innerHTML = `<div class="section-head"><div><h2>Fichas de las partes del computador</h2><p>Qué son, para qué sirven, si son de entrada o salida, cómo se conectan y cómo reciben la energía.</p></div></div>
      <div class="filter-chips" style="margin-bottom:16px">${[['all', 'Todas'], ['entrada', 'Entrada'], ['salida', 'Salida'], ['mixto', 'Entrada y salida'], ['almacenamiento', 'Almacenamiento'], ['procesamiento', 'Procesamiento'], ['energia', 'Energía'], ['interno', 'Por dentro']].map(([k, n]) => `<button class="fchip" data-f="${k}" aria-pressed="${k === f}">${n}</button>`).join('')}</div>
      <div class="grid grid-parts" id="ptGrid"></div>
      <div class="card" style="margin-top:22px"><h3>Los tipos de dispositivos</h3><div class="grid grid-4">${Object.entries(TIPOS).filter(([k]) => k !== 'otro').map(([k, t]) => `<div>${tipoChip(k)}<p class="small muted" style="margin:6px 0 0">${esc(t.d)}</p></div>`).join('')}</div></div>`;
    const draw = () => { $('#ptGrid', el).innerHTML = PARTS.filter(p => f === 'all' || (f === 'interno' ? p.ubic === 'interno' : p.tipo === f)).map(p => partCard(p, { tag: false })).join(''); $$('#ptGrid [data-part]', el).forEach(b => b.onclick = () => partSheet(b.dataset.part)); };
    $$('[data-f]', el).forEach(b => b.onclick = () => { f = b.dataset.f; $$('[data-f]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    draw();
  }
};
function partSheet(id) {
  const p = PART[id];
  const m = openModal({ title: p.n, wide: true, body: `<div class="grid grid-2" style="align-items:start"><div class="part-thumb" style="max-width:340px;margin:auto">${thumbHTML(id)}</div><div class="info-panel">${partInfoHTML(p)}</div></div>`,
    actions: [{ label: 'Escuchar', icon: 'volume', close: false, onClick: () => Voice.toggle(partText(p)) }, ...(Models.has(id) ? [{ label: 'Ver en RA', icon: 'scan', onClick: () => ARRun.start(id, Models.viewableAll(), { id: 'free' }) }, { label: 'Ver en 3D', icon: 'cube', cls: 'btn-primary', onClick: () => Router.go('explore/' + id) }] : [{ label: 'Abrir ficha completa', icon: 'book', cls: 'btn-primary', onClick: () => Router.go('explore/' + id) }])], onClose: () => Voice.stop() });
  return m;
}

/* ---------- Generador de preguntas ---------- */
const QGen = {
  mc(key, q, correct, wrong, exp, extra = {}) { const opts = shuffle([correct, ...wrong.slice(0, 3)]); return { key, q, opts, ans: opts.indexOf(correct), exp, ...extra }; },
  tf(key, q, val, exp) { return { key, q: 'Verdadero o falso: ' + q, opts: ['Verdadero', 'Falso'], ans: val ? 0 : 1, exp, tf: true }; },
  fromBank(t, i) { const [q, o, exp] = t.q[i]; return this.mc(`b:${t.id}:${i}`, q, o[0], o.slice(1), exp, { topic: t.id }); },
  fromVF(t, i) { const [q, v, exp] = t.vf[i]; return this.tf(`v:${t.id}:${i}`, q, v, exp); },
  gens(g, pool, topic = null) {
    const P = pool.length ? pool : partsForGrade(g); const all = PARTS; const D = partsForGrade(Math.max(g, 2));
    const others = (p, n = 3) => sample((D.length > 6 ? D : all).filter(x => x.id !== p.id && x.n !== p.n), n).map(x => x.n);
    const ES = P.filter(p => ['entrada', 'salida', 'mixto', 'almacenamiento'].includes(p.tipo) && (g >= 4 || p.tipo !== 'mixto'));
    const tipoOpts = g <= 2 ? ['entrada', 'salida'] : g === 3 ? ['entrada', 'salida', 'almacenamiento'] : ['entrada', 'salida', 'mixto', 'almacenamiento'];
    const pickOther = (list, right, n = 3) => sample([...new Set(list.filter(x => x !== right))], n);
    const L = []; const add = (tag, minG, maxG, f) => { if (g >= minG && g <= maxG) L.push({ tag, f }); };
    add('img', 1, 5, () => { const PI = P.filter(x => Models.thumbs[x.id]); if (!PI.length) return null; const p = pick(PI); return this.mc(`img:${p.id}`, '¿Qué parte del computador es esta?', p.n, others(p), g <= 2 ? p.s : p.fn, { img: p.id }); });
    add('fn', 1, 5, () => { const p = pick(P); return this.mc(`fn:${p.id}`, `¿Qué parte sirve para ${p.corta}?`, p.n, others(p), p.fn); });
    add('tipo', 2, 5, () => { const p = pick(ES.filter(x => tipoOpts.includes(x.tipo))); if (!p) return null; return this.mc(`tipo:${p.id}`, `${cap(withArt(p))} ${p.pl ? 'son dispositivos' : 'es un dispositivo'} de…`, TIPOS[p.tipo].n, tipoOpts.filter(t => t !== p.tipo).map(t => TIPOS[t].n), TIPOS[p.tipo].d, { img: p.id }); });
    add('cual', 2, 5, () => { const t = pick(tipoOpts.filter(t => t !== 'almacenamiento' || g >= 3)); const right = P.filter(p => p.tipo === t); const wrong = D.filter(p => tipoOpts.includes(p.tipo) && p.tipo !== t); if (!right.length || wrong.length < 3) return null; const p = pick(right); return this.mc(`cual:${t}:${p.id}`, `¿Cuál de estos es un dispositivo de ${TIPOS[t].n.toLowerCase()}?`, p.n, sample(wrong, 3).map(x => x.n), `${p.n}: ${TIPOS[t].d}`); });
    add('tfx', 2, 5, () => { const p = pick(ES.filter(x => tipoOpts.includes(x.tipo))); if (!p) return null; const truth = Math.random() < .5; const t = truth ? p.tipo : pick(tipoOpts.filter(x => x !== p.tipo)); return this.tf(`tfx:${p.id}:${t}`, `${cap(withArt(p))} ${p.pl ? 'son dispositivos' : 'es un dispositivo'} de ${TIPOS[t].n.toLowerCase()}.`, truth, `${p.n} es de ${TIPOS[p.tipo].n.toLowerCase()}. ${TIPOS[p.tipo].d}`); });
    add('ub', 3, 5, () => { const p = pick(P); const inn = p.ubic === 'interno'; return this.mc(`ub:${p.id}`, `¿Dónde ${p.pl ? 'se ubican' : 'se ubica'} ${withArt(p)}?`, inn ? 'Dentro de la torre (CPU)' : 'Afuera: es un periférico externo', [inn ? 'Afuera: es un periférico externo' : 'Dentro de la torre (CPU)'], p.que, { img: p.id }); });
    add('nat', 1, 2, () => { const k = pick(Object.keys(NATURAL_ART)); const x = pick(NATURAL_ART[k]); return this.mc(`nat:${x}`, `${cap(x)} es…`, k === 'natural' ? 'Natural' : 'Un artefacto creado por personas', [k === 'natural' ? 'Un artefacto creado por personas' : 'Natural'], k === 'natural' ? 'Lo encontramos en la naturaleza; nadie lo fabricó.' : 'Lo inventaron y fabricaron las personas.'); });
    add('ele', 1, 2, () => { const k = pick(Object.keys(ELECTRIC)); const x = pick(ELECTRIC[k]); const yes = 'Se conecta o usa pilas para funcionar', noE = 'Funciona sin conectarse'; return this.mc(`ele:${x}`, `¿Cómo funciona ${x}?`, k === 'funciona con electricidad' ? yes : noE, [k === 'funciona con electricidad' ? noE : yes], k === 'funciona con electricidad' ? 'Necesita energía eléctrica para funcionar.' : 'No necesita conectarse a la pared ni pilas.'); });
    add('mat', 2, 3, () => { const [x, m] = pick(MAT_OBJ); return this.mc(`mat2:${x}`, `¿De qué material está hecha normalmente ${x}?`.replace('hecha normalmente un ', 'hecho normalmente un '), m, pickOther(MAT_OBJ.map(o => o[1]), m), `${cap(x)} suele ser de ${m.toLowerCase()}.`); });
    add('tool', 3, 5, () => { const [u, t] = pick(TOOLS); return this.mc(`tool:${u}`, `¿Qué herramienta usamos para ${u}?`, t, pickOther(TOOLS.map(o => o[1]), t), `${t} sirve para ${u}.`); });
    add('mach', 3, 5, () => { const [x, m] = pick(MACHINES); return this.mc(`mach:${x}`, `${cap(x)} es un ejemplo de…`, m, pickOther(['Palanca', 'Plano inclinado', 'Polea', 'Rueda y eje', 'Cuña', 'Tornillo'], m), `${cap(x)} funciona como ${m.toLowerCase()}.`); });
    add('cond', 4, 5, () => { const k = pick(Object.keys(MATERIALS)); const m = pick(MATERIALS[k]); return this.mc(`cond:${m}`, `¿El material “${m}” es conductor o aislante de la electricidad?`, k === 'conductor' ? 'Conductor' : 'Aislante', [k === 'conductor' ? 'Aislante' : 'Conductor'], k === 'conductor' ? 'Los metales dejan pasar la corriente eléctrica.' : 'Detiene la corriente; por eso protege.'); });
    add('bin', 4, 5, () => { const max = g === 4 ? 15 : 31; const n = rand(2, max); const b = n.toString(2); const w = new Set(); while (w.size < 3) { const d = clamp(n + rand(-4, 4), 0, max + 4); if (d !== n) w.add(String(d)); } return this.mc(`bin:${n}`, `¿Qué número decimal representa ${b} en binario?`, String(n), [...w], `${b} = ${[...b].map((d, i) => d === '1' ? 2 ** (b.length - 1 - i) : 0).filter(Boolean).join(' + ')} = ${n}.`); });
    add('unit', 4, 5, () => { const u = [['bytes', 'bits', 8], ['KB', 'bytes', 1024], ['MB', 'KB', 1024], ['GB', 'MB', 1024]]; const [a, b, f] = pick(u); const n = rand(1, a === 'bytes' ? 8 : 4); const r = n * f; return this.mc(`un:${a}:${n}`, `¿Cuántos ${b} hay en ${n} ${a === 'bytes' && n === 1 ? 'byte' : a}?`, String(r), [String(r / 2), String(r * 2), String(n * (f === 8 ? 10 : 1000))].filter(x => x !== String(r)), `1 ${a === 'bytes' ? 'byte' : a} = ${f} ${b}, entonces ${n} × ${f} = ${r}.`); });
    add('big', 4, 5, () => { const U = ['byte', 'KB', 'MB', 'GB', 'TB']; const i = rand(0, 3), j = rand(i + 1, 4); return this.mc(`big:${i}:${j}`, `¿Qué es más grande: 1 ${U[i]} o 1 ${U[j]}?`, `1 ${U[j]}`, [`1 ${U[i]}`, 'Son iguales'], 'Orden: byte < KB < MB < GB < TB; cada uno es 1024 veces el anterior.'); });
    add('cc', 5, 5, () => { const pairs = [['las pilas', 'Corriente continua'], ['el tomacorriente de la casa', 'Corriente alterna'], ['la batería del celular', 'Corriente continua'], ['las piezas internas del computador', 'Corriente continua']]; const [x, r] = pick(pairs); return this.mc(`cc:${x}`, `¿Qué tipo de corriente hay en ${x}?`, r, [r === 'Corriente continua' ? 'Corriente alterna' : 'Corriente continua'], r === 'Corriente continua' ? 'Fluye siempre en el mismo sentido.' : 'Cambia de sentido 60 veces por segundo en Colombia.'); });
    add('ren', 5, 5, () => { const k = pick(Object.keys(ENERGIES)); const e = pick(ENERGIES[k]); return this.mc(`en:${e}`, `La energía de tipo “${e}” es…`, k === 'renovable' ? 'Renovable' : 'No renovable', [k === 'renovable' ? 'No renovable' : 'Renovable'], k === 'renovable' ? 'Se renueva naturalmente y no se agota.' : 'Se agota porque tarda millones de años en formarse.'); });
    add('eform', 5, 5, () => { const [x, f] = pick(E_FORMS); return this.mc(`ef:${x}`, `¿Qué forma de energía es ${x}?`, f, pickOther(E_FORMS.map(o => o[1]), f), `${cap(x)}: energía ${f.toLowerCase()}.`); });
    add('etrans', 5, 5, () => { const [x, t] = pick(E_TRANS); return this.mc(`et:${x}`, `¿Qué transformación de energía hace ${x}?`, t, pickOther(E_TRANS.map(o => o[1]), t), `${cap(x)}: ${t}.`); });
    const TOPIC_GENS = { '1a': ['nat'], '1f': ['ele'], '2e': ['mat'], '3e': ['tool'], '3f': ['mach'], '4e': ['cond'], '4g': ['cond'], '4c': ['bin', 'unit', 'big'], '5h': ['eform', 'etrans'], '5i': ['ren'], '5j': ['cc'] };
    const PART_TAGS = ['img', 'fn', 'tipo', 'cual', 'tfx', 'ub'];
    let list = L;
    if (topic) { const t = TOPIC[topic]; const allow = [...(TOPIC_GENS[topic] || []), ...(t.parts.length ? PART_TAGS : [])]; list = L.filter(x => allow.includes(x.tag)); }
    return list.map(x => x.f);
  },
  make({ g = Store.grade, n = 10, topic = null, part = null, review = true }) {
    const seen = new Set(Store.data.seenQ); const out = []; const keys = new Set();
    const push = q => { if (q && !keys.has(q.key) && q.opts.length >= 2 && new Set(q.opts).size === q.opts.length) { keys.add(q.key); out.push(q); return true; } return false; };
    let bank = [];
    const topics = topic ? [TOPIC[topic]] : [...TOPICS[g], ...(review ? ALL_TOPICS.filter(t => t.g < g) : [])];
    topics.forEach(t => { t.q.forEach((_, i) => bank.push({ w: t.g === g || topic ? 3 : 1, f: () => this.fromBank(t, i), k: `b:${t.id}:${i}` })); t.vf.forEach((_, i) => bank.push({ w: t.g === g || topic ? 2 : .7, f: () => this.fromVF(t, i), k: `v:${t.id}:${i}` })); });
    if (part) { const p = PART[part]; bank = bank.filter(b => { const q = b.f(); return q.q.toLowerCase().includes(p.n.split(' ')[0].toLowerCase()) || q.opts.some(o => o === p.n); }); }
    bank.forEach(b => b.r = Math.random() * b.w * (seen.has(b.k) ? .25 : 1));
    bank.sort((a, b) => b.r - a.r);
    const pool = topic && TOPIC[topic].parts.length ? TOPIC[topic].parts.map(id => PART[id]) : part ? [PART[part]] : partsForGrade(g);
    const gens = this.gens(topic ? Math.max(g, TOPIC[topic].g) : g, pool, topic);
    const genShare = topic ? .35 : part ? .7 : .5;
    let gi = 0, bi = 0, guard = 0;
    while (out.length < n && guard++ < 400) {
      const useGen = (out.length < n * genShare && gens.length) || bi >= bank.length;
      if (useGen) { if (!gens.length) break; const q = pick(gens)(); if (q && (!seen.has(q.key) || guard > 60)) push(q); }
      else push(bank[bi++].f());
    }
    Store.data.seenQ = [...out.map(q => q.key), ...Store.data.seenQ.filter(k => !keys.has(k))].slice(0, 220); Store.save();
    return shuffle(out).slice(0, n);
  }
};
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---------- Quiz ---------- */
const Quiz = {
  opts: { n: 10, mode: 'practice', review: true, topic: '' },
  setup(el, q) {
    const g = Store.grade; this.el = el; Object.assign(this.opts, { topic: q.topic && TOPIC[q.topic] ? q.topic : (this.opts.topic && TOPIC[this.opts.topic]?.g <= g ? this.opts.topic : ''), part: q.part && PART[q.part] ? q.part : '' });
    const hist = Store.g('quiz');
    el.innerHTML = `<div class="quiz-wrap"><div class="section-head"><div><span class="eyebrow">${icon('quiz')} Ponte a prueba</span><h2>${this.opts.part ? 'Quiz sobre ' + esc(PART[this.opts.part].n) : 'Quiz de ' + GRADES[g].n.toLowerCase()}</h2><p>Las preguntas cambian cada vez: se mezclan las del banco con otras que se crean al azar.</p></div></div>
      <div class="card"><div class="grid grid-2">
        <label class="field">Tema<select class="select" id="qzTopic"><option value="">Todos los temas de ${GRADES[g].n.toLowerCase()}</option>${ALL_TOPICS.filter(t => t.g <= g).map(t => `<option value="${t.id}" ${t.id === this.opts.topic ? 'selected' : ''}>${t.g}.° · ${esc(t.t)}</option>`).join('')}</select></label>
        <label class="field">Número de preguntas<select class="select" id="qzN">${[5, 10, 15, 20].map(n => `<option ${n === this.opts.n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="field">Modo<div class="filter-chips"><button class="fchip" data-mode="practice" aria-pressed="${this.opts.mode === 'practice'}">${icon('bulb')} Práctica (con ayudas)</button><button class="fchip" data-mode="exam" aria-pressed="${this.opts.mode === 'exam'}">${icon('timer')} Examen (con tiempo)</button></div></div>
        <label class="row small" style="align-self:end"><input type="checkbox" id="qzRev" ${this.opts.review ? 'checked' : ''} ${g === 1 ? 'disabled' : ''}> Incluir repaso de grados anteriores</label>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn btn-primary btn-lg" id="qzGo">${icon('play')}Comenzar</button><button class="btn" id="qzPrint">${icon('printer')}Descargar examen para imprimir</button></div>
      ${this.opts.part ? `<p class="small muted" style="margin-top:12px">Quiz enfocado en ${esc(PART[this.opts.part].n)}. <button class="btn btn-ghost btn-sm" id="qzClear">Quitar enfoque</button></p>` : ''}</div>
      ${Object.keys(hist).length ? `<div class="card" style="margin-top:16px"><h3>Tus mejores resultados</h3><div class="row">${Object.entries(hist).map(([k, v]) => `<span class="chip">${esc(k === 'all' ? 'Todos los temas' : TOPIC[k]?.t || PART[k.replace('p:', '')]?.n || k)} · ${v.best}%</span>`).join('')}</div></div>` : ''}</div>`;
    $$('[data-mode]', el).forEach(b => b.onclick = () => { this.opts.mode = b.dataset.mode; $$('[data-mode]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    const read = () => { this.opts.topic = $('#qzTopic', el).value; this.opts.n = +$('#qzN', el).value; this.opts.review = $('#qzRev', el).checked; };
    $('#qzGo', el).onclick = () => { read(); this.start(); };
    $('#qzPrint', el).onclick = () => { read(); this.printable(); };
    $('#qzClear', el)?.addEventListener('click', () => Router.go('study/quiz'));
  },
  start() {
    const o = this.opts; this.qs = QGen.make({ n: o.n, topic: o.topic || null, part: o.part || null, review: o.review });
    if (!this.qs.length) { toast('No hay preguntas suficientes para este tema.', 'bad'); return; }
    this.i = 0; this.answers = []; this.t0 = Date.now();
    this.limit = o.mode === 'exam' ? this.qs.length * (Store.grade <= 2 ? 40 : 30) : 0;
    this.stopTimer(); if (this.limit) this.timer = setInterval(() => this.tick(), 1000);
    this.show();
  },
  stopTimer() { clearInterval(this.timer); this.timer = null; document.removeEventListener('keydown', this._key || (() => {})); },
  tick() { const left = this.limit - Math.floor((Date.now() - this.t0) / 1000); const t = $('#qzTimer'); if (t) t.textContent = fmtTime(Math.max(0, left)); if (left <= 0) { toast('¡Se acabó el tiempo!', 'info'); this.finish(); } },
  show() {
    const q = this.qs[this.i], n = this.qs.length, ex = this.opts.mode === 'exam', L = 'ABCD';
    this.el.innerHTML = `<div class="quiz-wrap"><div class="q-head"><span class="chip">Pregunta ${this.i + 1} de ${n}</span>${ex ? `<span class="chip timer-chip">${icon('timer')}<span id="qzTimer">${fmtTime(this.limit)}</span></span>` : ''}<button class="btn btn-ghost btn-sm" id="qzQuit">${icon('x')}Salir</button></div>
      <div class="progress"><span style="width:${this.i / n * 100}%"></span></div>
      <div class="card" style="margin-top:16px">
        ${q.img ? thumbHTML(q.img, 'q-img') : ''}
        <div class="row-between"><p class="q-text grow" id="qzText">${esc(q.q)}</p><button class="icon-btn" id="qzSay" aria-label="Escuchar la pregunta">${icon('volume')}</button></div>
        <div class="options" role="group" aria-labelledby="qzText">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="let">${L[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="qzFb"></div>
        <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" id="qzNext" ${ex ? 'disabled' : 'hidden'}>${this.i + 1 < n ? 'Siguiente' : 'Ver resultados'} ${icon('right')}</button></div>
      </div></div>`;
    if (q.img) { const im = $('.q-img', this.el); if (im && im.tagName !== 'IMG') im.style.cssText = 'display:grid;place-items:center;width:150px;height:150px;margin:0 auto;color:var(--accent)'; }
    if (ex) this.tick();
    $('#qzQuit', this.el).onclick = () => { this.stopTimer(); Router.go('study/quiz'); };
    $('#qzSay', this.el).onclick = () => Voice.speak(q.q + '. ' + q.opts.map((o, k) => `${L[k]}: ${o}`).join('. '));
    const choose = k => {
      if (this.answers[this.i] !== undefined && !ex) return;
      this.answers[this.i] = k;
      if (ex) { $$('.opt', this.el).forEach(b => b.classList.toggle('sel', +b.dataset.k === k)); $('#qzNext', this.el).disabled = false; return; }
      const ok = k === q.ans; const chosen = $(`.opt[data-k="${k}"]`, this.el);
      if (ok) celebrate(chosen); else Sfx.try();
      $$('.opt', this.el).forEach(b => { b.disabled = true; const j = +b.dataset.k; if (j === q.ans) b.classList.add('right'); else if (j === k) b.classList.add('tried'); });
      $('#qzFb', this.el).innerHTML = `<div class="feedback ${ok ? 'ok' : 'try'}" role="status">${icon(ok ? 'check' : 'sparkle')}<div><b>${ok ? pick(PRAISE) : pick(ENCOURAGE) + ' La respuesta es: ' + esc(q.opts[q.ans])}</b><div class="small">${esc(q.exp || '')}</div></div></div>`;
      const nx = $('#qzNext', this.el); nx.hidden = false; nx.focus();
    };
    $$('.opt', this.el).forEach(b => b.onclick = () => choose(+b.dataset.k));
    $('#qzNext', this.el).onclick = () => { if (++this.i < n) this.show(); else this.finish(); };
    document.removeEventListener('keydown', this._key || (() => {}));
    this._key = e => { if (Router.cur !== 'study' || e.target.closest('input,select,textarea')) return; const k = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase()); if (k >= 0 && k < q.opts.length) choose(k); };
    document.addEventListener('keydown', this._key);
  },
  finish() {
    this.stopTimer(); const n = this.qs.length; const right = this.qs.filter((q, i) => this.answers[i] === q.ans).length; const pct = Math.round(right / n * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
    const key = this.opts.part ? 'p:' + this.opts.part : this.opts.topic || 'all'; const h = Store.g('quiz'); h[key] = { best: Math.max(h[key]?.best || 0, pct), last: pct, plays: (h[key]?.plays || 0) + 1 }; Store.save();
    if (stars >= 2) { Sfx.win(); FX.confetti(innerWidth / 2, innerHeight / 3, 160); }
    const wrong = this.qs.map((q, i) => ({ q, a: this.answers[i] })).filter(x => x.a !== x.q.ans);
    const msg = pct === 100 ? '¡Perfecto! Eres un experto en tecnología.' : pct >= 70 ? '¡Muy buen trabajo! Puedes mejorar repasando estas preguntas.' : pct >= 40 ? '¡Vas por buen camino! Sigue intentando: repasa el tema y juega otra vez.' : '¡Sigue intentando! Repasa las lecciones y las tarjetas y vuelve a jugar.';
    this.el.innerHTML = `<div class="quiz-wrap"><div class="card result-hero"><span class="eyebrow">Resultado</span><div class="score grad-text">${pct}%</div><div class="stars" aria-label="${stars} estrellas">${[1, 2, 3].map(i => icon('star', i <= stars ? 'on' : '')).join('')}</div><p><b>${right} de ${n}</b> respuestas correctas · ${fmtTime((Date.now() - this.t0) / 1000)}</p><p class="muted">${msg}</p>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn btn-primary" id="qzAgain">${icon('refresh')}Otro quiz con preguntas nuevas</button><button class="btn" id="qzCards">${icon('cards')}Repasar con tarjetas</button><button class="btn btn-ghost" id="qzBack">Configurar</button></div></div>
      ${wrong.length ? `<h3 style="margin-top:22px">Para repasar</h3>${wrong.map(({ q, a }) => `<div class="review-item"><b>${esc(q.q)}</b>${a !== undefined ? `<span class="small muted">Elegiste: ${esc(q.opts[a])}</span><br>` : '<span class="small muted">Sin responder</span><br>'}<span class="small" style="color:var(--accent)">${icon('check')} Respuesta: ${esc(q.opts[q.ans])}</span><div class="small muted" style="margin-top:4px">${esc(q.exp || '')}</div></div>`).join('')}` : ''}</div>`;
    $('#qzAgain', this.el).onclick = () => this.start();
    $('#qzCards', this.el).onclick = () => Router.go('study/cards' + (this.opts.topic ? '?topic=' + this.opts.topic : ''));
    $('#qzBack', this.el).onclick = () => Router.go('study/quiz');
  },
  printable() {
    const g = Store.grade, n = Math.max(10, this.opts.n), qs = QGen.make({ n, topic: this.opts.topic || null, part: this.opts.part || null, review: this.opts.review }), L = 'ABCD';
    const title = this.opts.topic ? TOPIC[this.opts.topic].t : `Tecnología e Informática · Grado ${GRADES[g].n}`;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Examen TECNO LAB · ${esc(title)}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:780px;margin:24px auto;padding:0 18px;line-height:1.45}h1{font-size:22px;margin:0}header{border-bottom:3px solid #38bdf8;padding-bottom:10px;margin-bottom:18px}.meta{display:flex;gap:24px;margin-top:10px;font-size:14px}.q{break-inside:avoid;margin:0 0 16px;padding:10px 12px;border:1px solid #ddd;border-radius:8px}.q img{width:110px;height:110px;object-fit:contain;float:right;margin-left:10px;background:#f2f4f8;border-radius:8px}.o{margin:4px 0 0 18px}.key{page-break-before:always}footer{margin-top:24px;font-size:12px;color:#555}@media print{button{display:none}}</style></head><body>
      <header><h1>TECNO LAB · Evaluación</h1><div>${esc(title)}</div><div class="meta"><span>Nombre: ______________________________</span><span>Grado: ${g}.°</span><span>Fecha: ____________</span></div></header>
      <button onclick="print()">Imprimir</button>
      ${qs.map((q, i) => `<div class="q">${q.img && Models.thumbs[q.img] ? `<img src="${Models.thumbs[q.img]}" alt="">` : ''}<b>${i + 1}. ${esc(q.q)}</b>${q.opts.map((o, k) => `<div class="o">( ) ${L[k]}. ${esc(o)}</div>`).join('')}<div style="clear:both"></div></div>`).join('')}
      <section class="key"><h2>Clave de respuestas (para la docente)</h2><ol>${qs.map(q => `<li><b>${L[q.ans]}</b> · ${esc(q.opts[q.ans])} — <span style="color:#555">${esc(q.exp || '')}</span></li>`).join('')}</ol></section>
      <footer>TECNO LAB · Aplicación elaborada por: Jeniffer Andrea Fuenmayor Díaz · Docente asesor: José Zapata · ${new Date().toLocaleDateString('es-CO')}</footer></body></html>`;
    downloadBlob(new Blob([html], { type: 'text/html' }), `examen-tecnolab-grado-${g}${this.opts.topic ? '-' + this.opts.topic : ''}.html`);
    toast('Examen descargado. Ábrelo y usa Imprimir. Cada descarga trae preguntas diferentes.', 'ok', 4200);
  }
};

/* ---------- Tarjetas de repaso ---------- */
const Cards = {
  start(el, q) {
    const g = Store.grade; this.el = el;
    const deck = q.topic && TOPIC[q.topic] ? 't:' + q.topic : (q.deck || this.deckKey || 'grade');
    this.deckKey = deck;
    let cards = [];
    if (deck === 'grade') TOPICS[g].forEach(t => t.c.forEach(c => cards.push({ f: c[0], b: c[1], src: t.t })));
    else if (deck === 'parts') partsForGrade(Math.max(g, 2)).forEach(p => cards.push({ f: '¿Qué parte es esta?', img: p.id, b: `${p.n}: ${g <= 2 ? p.s : p.fn}`, src: TIPOS[p.tipo].n }));
    else if (deck === 'tipos') partsForGrade(Math.max(g, 3)).filter(p => ['entrada', 'salida', 'mixto', 'almacenamiento'].includes(p.tipo)).forEach(p => cards.push({ f: `${p.n}: ¿de qué tipo es?`, img: p.id, b: `${TIPOS[p.tipo].n}. ${TIPOS[p.tipo].d}`, src: 'Tipos de dispositivos' }));
    else if (deck === 'all') ALL_TOPICS.filter(t => t.g <= g).forEach(t => t.c.forEach(c => cards.push({ f: c[0], b: c[1], src: `${t.g}.° · ${t.t}` })));
    else { const t = TOPIC[deck.slice(2)]; if (t) t.c.forEach(c => cards.push({ f: c[0], b: c[1], src: t.t })); if (t) t.key.filter(k => k.includes(':')).forEach(k => cards.push({ f: k.split(':')[0] + '…', b: k, src: t.t + ' · idea clave' })); }
    this.queue = shuffle(cards); this.total = cards.length; this.known = 0; this.again = 0;
    el.innerHTML = `<div class="flash-wrap"><div class="section-head" style="margin-bottom:6px"><div><span class="eyebrow">${icon('cards')} Tarjetas de repaso</span><h2>Toca la tarjeta para darle la vuelta</h2></div></div>
      <label class="field">Mazo<select class="select" id="fcDeck"><option value="grade">Temas de ${GRADES[g].n.toLowerCase()}</option><option value="parts">Partes del computador (con imagen)</option>${g >= 2 ? '<option value="tipos">¿Entrada, salida o almacenamiento?</option>' : ''}${g > 1 ? '<option value="all">Todos los grados hasta el mío</option>' : ''}${TOPICS[g].map(t => `<option value="t:${t.id}">Tema: ${esc(t.t)}</option>`).join('')}</select></label>
      <div id="fcArea"></div></div>`;
    $('#fcDeck', el).value = deck; $('#fcDeck', el).onchange = e => { this.deckKey = e.target.value; Router.go('study/cards?deck=' + encodeURIComponent(e.target.value)); };
    this.draw();
  },
  draw() {
    const A = $('#fcArea', this.el); const c = this.queue[0];
    if (!c) { const rec = Store.g('cards'); rec[this.deckKey] = { done: Date.now(), known: this.known }; Store.save(); Sfx.win(); A.innerHTML = `<div class="card result-hero" style="margin-top:16px"><div class="stars">${icon('trophy', 'on')}</div><h3>¡Terminaste el mazo!</h3><p class="muted">${this.total} tarjetas · ${this.again} repasos extra</p><div class="row" style="justify-content:center"><button class="btn btn-primary" id="fcRe">${icon('refresh')}Empezar de nuevo</button><button class="btn" id="fcQz">${icon('quiz')}Hacer un quiz</button></div></div>`; $('#fcRe', A).onclick = () => Router.route(); $('#fcQz', A).onclick = () => Router.go('study/quiz' + (this.deckKey.startsWith('t:') ? '?topic=' + this.deckKey.slice(2) : '')); return; }
    const done = this.total - this.queue.length;
    A.innerHTML = `<div class="row-between small muted" style="margin-top:14px"><span>${done} de ${this.total} aprendidas</span><span>${esc(c.src || '')}</span></div><div class="progress" style="margin-top:6px"><span style="width:${done / this.total * 100}%"></span></div>
      <div class="flash" id="fc" role="button" tabindex="0" aria-label="Tarjeta. Presiona espacio para girar."><div class="flash-inner">
        <div class="flash-face">${c.img ? thumbHTML(c.img) : ''}<div class="q">${esc(c.f)}</div><span class="hint">Toca para ver la respuesta</span></div>
        <div class="flash-face back"><div class="a">${esc(c.b)}</div><span class="hint">¿Te la sabías?</span></div></div></div>
      <div class="row" style="justify-content:center"><button class="btn" id="fcAgain">${icon('refresh')}Repasar otra vez</button><button class="btn" id="fcSay" aria-label="Escuchar">${icon('volume')}</button>${c.img && Models.has(c.img) ? `<button class="btn" id="fcAR" aria-label="Ver en realidad aumentada">${icon('scan')}RA</button>` : ''}<button class="btn btn-primary" id="fcKnow">${icon('check')}¡Me la sé!</button></div>
      <p class="small dim" style="text-align:center;margin-top:10px">Teclado: <span class="kbd">Espacio</span> girar · <span class="kbd">←</span> repasar · <span class="kbd">→</span> me la sé</p>`;
    const fc = $('#fc', A); const flip = () => fc.classList.toggle('flipped');
    fc.onclick = flip; fc.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } if (e.key === 'ArrowRight') $('#fcKnow', A).click(); if (e.key === 'ArrowLeft') $('#fcAgain', A).click(); };
    $('#fcKnow', A).onclick = e => { this.queue.shift(); this.known++; celebrate(e.currentTarget, 40); this.draw(); $('#fc')?.focus(); };
    $('#fcAgain', A).onclick = () => { const x = this.queue.shift(); this.queue.splice(Math.min(this.queue.length, rand(2, 4)), 0, x); this.again++; this.draw(); $('#fc')?.focus(); };
    $('#fcSay', A).onclick = () => Voice.speak(fc.classList.contains('flipped') ? c.b : c.f);
    $('#fcAR', A)?.addEventListener('click', () => ARRun.start(c.img, [PART[c.img]], { id: 'free' }));
    if (c.img) { const t = $('.flash-face [data-thumb]', A); if (t && t.tagName !== 'IMG') t.style.cssText = 'width:120px;height:120px;display:grid;place-items:center;color:var(--accent)'; }
  }
};
