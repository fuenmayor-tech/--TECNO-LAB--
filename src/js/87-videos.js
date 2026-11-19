/* =====================================================================
   Aprende con videos
   Videos educativos de YouTube seleccionados por tema. Cada video muestra
   sus créditos (título, canal y enlace). La profesora puede agregar más.
   Los videos necesitan conexión a internet.
   ===================================================================== */
const VIDEOS = [
  { id: 'Ue9RFih7W6E', t: 'Qué es la tecnología - Explicado para niños', canal: '', temas: ['1a'] },
  { id: 's-FFvTiIlbU', t: 'El computador y sus partes para niños', canal: '', temas: ['1b', '2a', '4a'] },
  { id: '2AnkpEqvORI', t: 'Objetos antes vs. ahora, para niños', canal: '', temas: ['2d'] },
  { id: 'eGS0ZHEPlEM', t: '¿Qué es la fuerza?', canal: 'Happy Learning Español', temas: ['3f'] },
  { id: 'Qoyb3eOZmtk', t: 'Máquinas y robots para niños', canal: 'Smile and Learn - Español', temas: ['3f', '5g'] },
  { id: 'a4mY3YMNLz8', t: 'Electricidad para niños: circuito, materiales conductores y aislantes', canal: 'Smile and Learn - Español', temas: ['4e', '4g'] },
  { id: 'SrDvQCcNwWQ', t: '¿Qué es la netiqueta? Normas de comportamiento en internet para niños', canal: 'Smile and Learn - Español', temas: ['4d', '5e'] },
  { id: 'NAPAMIpGB-s', t: '¿Qué es la energía? Tipos de energía para niños', canal: 'Smile and Learn - Español', temas: ['5h'] },
  { id: 'aINlFT1m-sM', t: 'Tipos de energías para niños: renovables y no renovables', canal: 'Smile and Learn - Español', temas: ['5i', '5f'] },
  { id: '4eEri5RivV8', t: 'Las energías renovables: tipos de energía para niños', canal: 'Smile and Learn - Español', temas: ['5i'] }
];
/* Busca el identificador de un enlace de YouTube (watch, youtu.be, shorts, embed) */
function ytId(url) {
  const s = String(url || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i);
  return m ? m[1] : null;
}
const VideoMeta = {
  data: null,
  load() { if (this.data) return this.data; try { this.data = JSON.parse(localStorage.getItem('tecnolab.vmeta') || '{}'); } catch { this.data = {}; } return this.data; },
  save() { try { localStorage.setItem('tecnolab.vmeta', JSON.stringify(this.data)); } catch { /* sin espacio */ } },
  /* Consulta a YouTube el título y el canal; si el video ya no existe o no se puede insertar, se oculta */
  async check(ids) {
    if (!navigator.onLine) return false; const d = this.load(); let changed = false;
    await Promise.all(ids.filter(id => !d[id] || Date.now() - d[id].at > 7 * 864e5).map(async id => {
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`);
        if (r.ok) { const j = await r.json(); d[id] = { ok: true, t: j.title, canal: j.author_name, url: j.author_url, at: Date.now() }; changed = true; }
        else if ([401, 403, 404].includes(r.status)) { d[id] = { ok: false, at: Date.now() }; changed = true; }
      } catch { /* sin respuesta: se deja como está */ }
    }));
    if (changed) this.save(); return changed;
  }
};
function videoList(topicId) {
  const mine = (Store.data.videos?.[topicId] || []).map(v => ({ ...v, temas: [topicId], own: true }));
  return [...VIDEOS.filter(v => v.temas.includes(topicId)), ...mine];
}
function videoInfo(v) { const m = VideoMeta.load()[v.id] || {}; return { t: m.t || v.t || 'Video de YouTube', canal: m.canal || v.canal || '', canalUrl: m.url || '', ok: m.ok !== false }; }
function videoCredit(v) { const i = videoInfo(v); return `«${esc(i.t)}»${i.canal ? ` · Canal: ${i.canalUrl ? `<a href="${esc(i.canalUrl)}" target="_blank" rel="noopener">${esc(i.canal)}</a>` : esc(i.canal)}` : ''} · YouTube`; }
function ytSearchURL(t) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(t.t + ' para niños'); }

Views.videos = {
  g: null,
  enter(el, args, q) {
    this.el = el; this.g = +(q.g || Store.grade);
    const focus = q.topic && TOPIC[q.topic] ? q.topic : null; if (focus) this.g = TOPIC[focus].g;
    this.draw(focus);
    const ids = [...new Set([...VIDEOS.map(v => v.id), ...Object.values(Store.data.videos || {}).flat().map(v => v.id)])];
    VideoMeta.check(ids).then(ch => { if (ch && Router.cur === 'videos') this.draw(focus, true); });
  },
  draw(focus, keepScroll = false) {
    const el = this.el, g = this.g, y = scrollY;
    el.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">${icon('video')} Aprende con videos</span><h2>Videos para aprender de otra manera</h2><p>Hay quienes aprenden mejor viendo y escuchando. Elige un tema, mira el video y luego ponte a prueba. Cada video muestra su título, su canal y el enlace a YouTube.</p></div></div>
      ${navigator.onLine ? '' : `<div class="notice warn">${icon('wifi')}<div>Estás sin conexión. Los videos se reproducen desde YouTube y necesitan internet; el resto de TECNO LAB sigue funcionando.</div></div>`}
      <div class="filter-chips" role="tablist" aria-label="Grado" style="margin-bottom:18px">${[1, 2, 3, 4, 5].map(n => `<button class="fchip" data-vg="${n}" aria-pressed="${n === g}">Grado ${n}.°</button>`).join('')}</div>
      <div class="video-topics">${[...TOPICS[g]].sort((a, b) => (videoList(b.id).length ? 1 : 0) - (videoList(a.id).length ? 1 : 0)).map(t => {
        const list = videoList(t.id).filter(v => videoInfo(v).ok);
        return `<section class="card video-topic ${focus === t.id ? 'is-focus' : ''}" id="vt-${t.id}">
          <div class="vt-head"><span class="topic-num">${icon(t.ic)}</span><div class="grow"><h3>${esc(t.t)}</h3><p class="small muted">${esc(t.r)}</p></div></div>
          ${list.length ? `<div class="video-grid">${list.map(v => this.tile(v, t)).join('')}</div>` : `<p class="small muted">Aún no hay un video seleccionado para este tema. Puedes buscar uno en YouTube junto con un adulto.</p>`}
          <div class="row vt-actions"><a class="btn btn-sm" href="${ytSearchURL(t)}" target="_blank" rel="noopener">${icon('search')}Buscar más videos</a><button class="btn btn-sm" data-vq="${t.id}">${icon('quiz')}Quiz del tema</button><button class="btn btn-sm btn-ghost" data-vadd="${t.id}">${icon('plus')}Agregar video (profesora)</button></div>
        </section>`; }).join('')}</div>
      <p class="small muted" style="margin-top:18px">${icon('info')} Los videos pertenecen a sus autores y se muestran desde YouTube con su reproductor oficial (modo de privacidad mejorada). TECNO LAB solo los enlaza con fines educativos.</p>`;
    $$('[data-vg]', el).forEach(b => b.onclick = () => { this.g = +b.dataset.vg; this.draw(); });
    $$('[data-vplay]', el).forEach(b => b.onclick = () => this.play(b.dataset.vplay, b.dataset.topic));
    $$('[data-vq]', el).forEach(b => b.onclick = () => Router.go('study/quiz?topic=' + b.dataset.vq));
    $$('[data-vadd]', el).forEach(b => b.onclick = () => this.add(b.dataset.vadd));
    $$('[data-vdel]', el).forEach(b => b.onclick = () => { const [tid, id] = b.dataset.vdel.split('|'); Store.data.videos[tid] = (Store.data.videos[tid] || []).filter(v => v.id !== id); Store.save(); this.draw(); });
    if (keepScroll) scrollTo(0, y); else if (focus) setTimeout(() => $('#vt-' + focus, el)?.scrollIntoView({ block: 'start', behavior: ENV.reduced ? 'auto' : 'smooth' }), 60);
  },
  tile(v, t) {
    const i = videoInfo(v);
    return `<div class="video-tile"><button type="button" class="vt-thumb" data-vplay="${esc(v.id)}" data-topic="${t.id}" aria-label="Ver el video: ${esc(i.t)}">
        <img src="https://i.ytimg.com/vi/${esc(v.id)}/mqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span class="vt-play">${icon('play')}</span></button>
      <div class="vt-meta"><b>${esc(i.t)}</b><span class="small muted">${i.canal ? 'Canal: ' + esc(i.canal) + ' · ' : ''}YouTube${v.own ? ' · agregado por la profesora' : ''}</span>
      ${v.own ? `<button class="link-btn small" data-vdel="${t.id}|${esc(v.id)}">Quitar</button>` : ''}</div></div>`;
  },
  play(id, topicId) {
    const v = videoList(topicId).find(x => x.id === id) || { id }; const i = videoInfo(v), t = TOPIC[topicId];
    const m = openModal({ title: t ? t.t : 'Video', wide: true, body: `
      ${navigator.onLine ? '' : `<div class="notice warn">${icon('wifi')}<div>Sin conexión: el video no se puede cargar ahora.</div></div>`}
      <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?rel=0&modestbranding=1&autoplay=1" title="${esc(i.t)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
      <p class="video-credit">${icon('info')}<span><b>Créditos:</b> ${videoCredit(v)}. <a href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">Abrir en YouTube ${icon('ext')}</a></span></p>
      ${ENV.file ? `<p class="small muted">Si el video no se reproduce al abrir el archivo directamente, usa el enlace “Abrir en YouTube”.</p>` : ''}`,
      actions: t ? [{ label: 'Tarjetas del tema', icon: 'cards', onClick: () => Router.go('study/cards?topic=' + t.id) }, { label: 'Ponerme a prueba', icon: 'quiz', cls: 'btn-primary', onClick: () => Router.go('study/quiz?topic=' + t.id) }] : [] });
    return m;
  },
  add(topicId) {
    const t = TOPIC[topicId];
    const m = openModal({ title: 'Agregar un video', body: `<p class="small muted">Tema: <b>${esc(t.t)}</b>. Pega el enlace de un video de YouTube. Se guarda en este navegador y aparece con sus créditos.</p>
      <label class="field">Enlace de YouTube<input class="input" id="vaUrl" placeholder="https://www.youtube.com/watch?v=…" autocomplete="off"></label>
      <label class="field">Título (opcional)<input class="input" id="vaT" maxlength="120"></label>
      <label class="field">Canal o autor (opcional)<input class="input" id="vaC" maxlength="80"></label>`,
      actions: [{ label: 'Cancelar' }, { label: 'Agregar', cls: 'btn-primary', icon: 'plus', close: false, onClick: () => {
        const id = ytId($('#vaUrl', m.el).value); if (!id) { toast('Revisa el enlace: debe ser un video de YouTube.', 'try'); return; }
        Store.data.videos ??= {}; const list = Store.data.videos[topicId] ??= [];
        if (!list.some(v => v.id === id)) list.push({ id, t: $('#vaT', m.el).value.trim(), canal: $('#vaC', m.el).value.trim() });
        Store.save(); m.close(); toast('Video agregado al tema.', 'ok'); VideoMeta.check([id]).finally(() => this.draw(topicId, true));
      } }] });
    setTimeout(() => $('#vaUrl', m.el)?.focus(), 50);
  },
  onGrade() { this.g = Store.grade; this.draw(); }
};
