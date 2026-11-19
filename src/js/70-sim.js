/* =====================================================================
   Simulador: 1) Conecta y enciende el computador (puertos, energía,
   entrada → proceso → salida) · 2) Arma la CPU por dentro
   ===================================================================== */
const SVGNS = 'http://www.w3.org/2000/svg';
function svgPoint(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
const PLUG_SHAPES = {
  usb: '<rect x="-15" y="-9" width="30" height="18" rx="4" fill="#1d2433" stroke="#8e9ab0" stroke-width="2"/><rect x="-9" y="-22" width="18" height="14" fill="#cfd6e2"/><rect x="-5" y="-19" width="3" height="3" fill="#1d2433"/><rect x="2" y="-19" width="3" height="3" fill="#1d2433"/>',
  hdmi: '<rect x="-18" y="-10" width="36" height="20" rx="4" fill="#1d2433" stroke="#7dd3fc" stroke-width="2"/><path d="M-13 -10 L13 -10 L10 -22 L-10 -22 Z" fill="#cfd6e2"/>',
  enchufe: '<rect x="-16" y="-14" width="32" height="28" rx="7" fill="#262d3f" stroke="#8e9ab0" stroke-width="2"/><rect x="-9" y="-28" width="5" height="15" fill="#d8dde6"/><rect x="4" y="-28" width="5" height="15" fill="#d8dde6"/><rect x="-2.5" y="-24" width="5" height="11" rx="2.5" fill="#d8dde6"/>',
  audio: '<rect x="-7" y="-6" width="14" height="22" rx="4" fill="#1d2433" stroke="#f9a8d4" stroke-width="2"/><rect x="-3" y="-24" width="6" height="19" rx="3" fill="#d8dde6"/>',
  eth: '<rect x="-13" y="-10" width="26" height="22" rx="3" fill="#c7d2fe" fill-opacity=".85" stroke="#93c5fd" stroke-width="2"/><rect x="-9" y="-24" width="18" height="15" fill="#e8edf6" stroke="#93c5fd"/><rect x="-4" y="-30" width="8" height="7" fill="#93c5fd"/>'
};
const PLUG_NAMES = { usb: 'USB', hdmi: 'HDMI', enchufe: 'enchufe', audio: 'audio', eth: 'red (Ethernet)' };
const SIM = {
  cables: [
    { id: 'mon_hdmi', dev: 'monitor', type: 'hdmi', to: 'hdmi', n: 'Cable HDMI del monitor', a: [520, 392], s: [560, 565], g: 1, col: '#7dd3fc' },
    { id: 'mon_pow', dev: 'monitor', type: 'enchufe', to: 'reg', n: 'Cable de corriente del monitor', a: [490, 392], s: [470, 585], g: 1, col: '#3a4258' },
    { id: 'kbd', dev: 'teclado', type: 'usb', to: 'usb', n: 'Cable USB del teclado', a: [500, 436], s: [410, 560], g: 1, col: '#5b667f' },
    { id: 'mouse', dev: 'mouse', type: 'usb', to: 'usb', n: 'Cable USB del mouse', a: [712, 446], s: [760, 560], g: 1, col: '#5b667f' },
    { id: 'cpu_pow', dev: 'cpu', type: 'enchufe', to: 'reg', n: 'Cable de corriente de la CPU', a: [985, 112], s: [1000, 540], g: 1, col: '#3a4258' },
    { id: 'reg', dev: 'regulador', type: 'enchufe', to: 'wall', n: 'Cable del regulador', a: [732, 623], s: [870, 668], g: 1, col: '#3a4258' },
    { id: 'spk', dev: 'parlantes', type: 'audio', to: 'audio', n: 'Cable de audio de los parlantes', a: [276, 440], s: [300, 585], g: 2, col: '#f9a8d4' },
    { id: 'prn', dev: 'impresora', type: 'usb', to: 'usb', n: 'Cable USB de la impresora', a: [172, 440], s: [160, 590], g: 3, col: '#5b667f' },
    { id: 'rtr', dev: 'router', type: 'eth', to: 'eth', n: 'Cable de red del router', a: [176, 222], s: [250, 300], g: 4, col: '#93c5fd' }
  ],
  ports: [
    { id: 'usb1', k: 'usb', x: 1045, y: 180, w: 36, h: 16 }, { id: 'usb2', k: 'usb', x: 1105, y: 180, w: 36, h: 16 }, { id: 'usb3', k: 'usb', x: 1045, y: 214, w: 36, h: 16 }, { id: 'usb4', k: 'usb', x: 1105, y: 214, w: 36, h: 16 },
    { id: 'hdmi', k: 'hdmi', x: 1075, y: 262, w: 48, h: 18 }, { id: 'eth', k: 'eth', x: 1075, y: 312, w: 30, h: 26 }, { id: 'audio', k: 'audio', x: 1075, y: 362, w: 18, h: 18 },
    { id: 'reg1', k: 'reg', x: 606, y: 623, w: 24, h: 28 }, { id: 'reg2', k: 'reg', x: 640, y: 623, w: 24, h: 28 }, { id: 'reg3', k: 'reg', x: 674, y: 623, w: 24, h: 28 }, { id: 'reg4', k: 'reg', x: 708, y: 623, w: 24, h: 28 },
    { id: 'wall', k: 'wall', x: 1127, y: 470, w: 30, h: 36 }
  ]
};
Views.sim = {
  mode: 'connect',
  enter(el, args) {
    this.mode = args[0] === 'cpu' ? 'cpu' : 'connect'; this.el = el;
    el.innerHTML = `
      <div class="section-head"><div><span class="eyebrow">${icon('sim')} Simulador</span><h2>${this.mode === 'cpu' ? 'Arma la CPU por dentro' : 'Conecta y enciende el computador'}</h2>
        <p>${this.mode === 'cpu' ? 'Arrastra cada componente a su lugar en la tarjeta madre y en el gabinete. Luego enciende tu computador.' : 'Arrastra cada conector hasta el puerto que tiene su misma forma. Después enciende en orden y prueba la entrada, el proceso y la salida.'}</p></div>
        <div class="tabs" role="tablist" style="margin:0"><button class="tab" role="tab" aria-selected="${this.mode === 'connect'}" data-m="">${icon('plug')}Conectar y encender</button><button class="tab" role="tab" aria-selected="${this.mode === 'cpu'}" data-m="cpu">${icon('cpu')}Armar la CPU</button></div></div>
      <div id="simBody"></div>`;
    $$('[data-m]', el).forEach(b => b.onclick = () => Router.go('sim' + (b.dataset.m ? '/' + b.dataset.m : '')));
    this.mode === 'cpu' ? SimCPU.render($('#simBody', el)) : SimConnect.render($('#simBody', el));
  },
  leave() { SimConnect.leave(); },
  onGrade() { Router.route(); }
};

const SimConnect = {
  render(root) {
    const g = Store.grade; this.g = g;
    this.cables = SIM.cables.filter(c => c.g <= g); this.conn = {}; this.regOn = false; this.cpuOn = false; this.booted = false; this.text = ''; this.done = new Set(); this.flow = false; this.mistakes = 0;
    const hint = g <= 3;
    root.innerHTML = `
      <div class="sim-layout">
        <div>
          <div class="sim-wrap" id="simWrap"><svg id="simSvg" viewBox="0 0 1200 720" role="application" aria-label="Escritorio con el computador. Arrastra los conectores a los puertos.">${this.sceneSVG()}</svg>
            <div class="sim-screen" id="simScreen" style="left:${318 / 12}%;top:${113 / 7.2}%;width:${374 / 12}%;height:${214 / 7.2}%"></div></div>
          <div class="ipo" aria-label="Flujo de la información">
            <div class="ipo-box" data-ipo="in"><b>ENTRADA</b><span>teclado · mouse</span></div>
            <div class="ipo-box" data-ipo="proc"><b>PROCESO</b><span>procesador (CPU)</span></div>
            <div class="ipo-box" data-ipo="store"><b>ALMACENAMIENTO</b><span>RAM · disco</span></div>
            <div class="ipo-box" data-ipo="out"><b>SALIDA</b><span>monitor · parlantes · impresora</span></div>
          </div>
          <div class="row" style="margin-top:12px"><button class="btn btn-sm" id="simFlow" aria-pressed="false">${icon('zap')}Ver la electricidad</button><button class="btn btn-sm" id="simKbd">${icon('keyboard')}Teclado en pantalla</button><button class="btn btn-sm btn-ghost" id="simReset">${icon('refresh')}Reiniciar</button></div>
          <div class="vkbd" id="simVK" hidden style="margin-top:10px"></div>
        </div>
        <aside class="card">
          <h3 style="margin-bottom:4px">Misión de ${g}.°</h3><p class="small" style="color:var(--accent);margin:0 0 10px">${this.cables.length} cables para conectar${g >= 2 ? ' · nuevos: ' + SIM.cables.filter(c => c.g === g).map(c => c.n.replace('Cable ', '').replace('de la ', '').replace('de los ', '').replace('del ', '')).join(', ') : ''}</p><ul class="checklist" id="simList"></ul>
          <div class="info-block" style="margin-top:14px" id="simTip"><h4>Pista</h4><p>${hint ? 'Cuando arrastras un conector, los puertos donde encaja brillan.' : 'Observa la forma de cada conector: solo entra en el puerto con su misma forma.'}</p></div>
          <div class="info-block" id="simElec"><h4>${icon('zap')} Energía</h4><p>${g <= 2 ? 'La electricidad llega por el cable desde la pared. El regulador cuida el computador de los cambios de la electricidad.' : g <= 4 ? 'La electricidad llega del tomacorriente (unos 120 V). El regulador la mantiene estable y la fuente de poder la reparte a todas las piezas de la CPU.' : 'Del tomacorriente sale corriente alterna (unos 120 V). El regulador la mantiene estable y la fuente de poder de la CPU la convierte en corriente continua de 12 V, 5 V y 3,3 V.'}</p></div>
        </aside>
      </div>`;
    this.svg = $('#simSvg'); this.scr = $('#simScreen');
    this.drawCables(); this.bind(); this.renderList(); this.screen('off');
    $('#simFlow').onclick = e => { this.flow = !this.flow; e.currentTarget.setAttribute('aria-pressed', this.flow); this.updatePower(); };
    $('#simReset').onclick = () => this.render(root);
    $('#simKbd').onclick = () => { const v = $('#simVK'); v.hidden = !v.hidden; if (!v.hidden) this.buildVK(); };
    this.onKey = e => { if (Router.cur !== 'sim' || e.target.closest('input,textarea,select')) return; if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') { this.type(e.key); if (this.booted) e.preventDefault(); } };
    document.addEventListener('keydown', this.onKey);
  },
  leave() { if (this.onKey) document.removeEventListener('keydown', this.onKey); clearTimeout(this._t); },
  has(dev) { return this.cables.some(c => c.dev === dev); },
  sceneSVG() {
    const g = this.g, has = d => SIM.cables.some(c => c.dev === d && c.g <= g);
    const grid = Array.from({ length: 24 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="500" stroke="rgba(255,255,255,.03)"/>`).join('');
    return `
    <defs><linearGradient id="sWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1d3a"/><stop offset="1" stop-color="#0b162c"/></linearGradient>
      <linearGradient id="sScreenOff" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05070d"/><stop offset="1" stop-color="#0b111f"/></linearGradient></defs>
    <rect width="1200" height="500" fill="url(#sWall)"/>${grid}<rect y="500" width="1200" height="220" fill="#151019"/>
    <path d="M110 420 L990 420 L1032 470 L68 470 Z" fill="#4a3530"/><rect x="68" y="470" width="964" height="18" fill="#3a2a27"/><rect x="90" y="488" width="18" height="200" fill="#2c201e"/><rect x="992" y="488" width="18" height="200" fill="#2c201e"/>
    ${has('router') ? `<g id="dRouter"><rect x="100" y="222" width="160" height="8" rx="3" fill="#4a3530"/><rect x="115" y="196" width="122" height="26" rx="8" fill="#232b3f" stroke="#3a4560"/><line x1="135" y1="196" x2="125" y2="160" stroke="#232b3f" stroke-width="5" stroke-linecap="round"/><line x1="217" y1="196" x2="227" y2="160" stroke="#232b3f" stroke-width="5" stroke-linecap="round"/>${[0, 1, 2, 3].map(i => `<circle class="rtr-led" cx="${150 + i * 16}" cy="209" r="3" fill="#2b3550"/>`).join('')}<text x="176" y="250" text-anchor="middle" fill="#93c5fd" font-size="17" font-family="Lexend">Router</text></g>` : ''}
    ${has('impresora') ? `<g id="dPrinter"><rect x="95" y="378" width="150" height="62" rx="10" fill="#d8dde7"/><rect x="108" y="372" width="124" height="10" rx="4" fill="#b9c1ce"/><rect x="112" y="402" width="116" height="6" rx="3" fill="#1d2433"/><rect id="simPaper" x="122" y="404" width="96" height="0" fill="#fff" stroke="#cbd2de"/><circle cx="226" cy="388" r="4" fill="#f472b6"/><text x="170" y="460" text-anchor="middle" fill="#a3b0cf" font-size="17" font-family="Lexend">Impresora</text></g>` : ''}
    ${has('parlantes') ? [258, 716].map(x => `<g class="spk"><rect x="${x}" y="318" width="40" height="104" rx="8" fill="#232b3f" stroke="#3a4560"/><circle cx="${x + 20}" cy="378" r="13" fill="#0c0f17" stroke="#f9a8d4" stroke-width="2"/><circle cx="${x + 20}" cy="340" r="6" fill="#0c0f17" stroke="#7dd3fc"/></g>`).join('') : ''}
    <g id="dMonitor"><rect x="305" y="100" width="400" height="250" rx="14" fill="#151b2a" stroke="#2b3550" stroke-width="2"/><rect x="318" y="113" width="374" height="214" rx="4" fill="url(#sScreenOff)"/><circle id="monLed" cx="690" cy="340" r="3.5" fill="#2b3550"/><rect x="490" y="350" width="30" height="72" fill="#8f99aa"/><rect x="428" y="414" width="154" height="12" rx="6" fill="#aeb7c4"/></g>
    <g id="dKbd"><path d="M352 432 L648 432 L660 462 L340 462 Z" fill="#232b3f" stroke="#3a4560"/>${Array.from({ length: 3 }, (_, r) => Array.from({ length: 14 }, (_, c) => `<rect class="kkey" x="${357 + c * 20.5 - r * 2}" y="${436 + r * 8}" width="16" height="6" rx="1.5" fill="#c9d0dc"/>`).join('')).join('')}</g>
    <g id="dMouse"><ellipse cx="712" cy="452" rx="17" ry="11" fill="#232b3f" stroke="#3a4560"/><line x1="712" y1="441" x2="712" y2="449" stroke="#7dd3fc" stroke-width="2"/></g>
    <g id="dCPU"><rect x="775" y="175" width="130" height="248" rx="10" fill="#1f2638" stroke="#33405e" stroke-width="2"/>${Array.from({ length: 7 }, (_, i) => `<rect x="795" y="${280 + i * 18}" width="90" height="5" rx="2" fill="#0c0f17"/>`).join('')}<rect x="895" y="200" width="3" height="190" fill="#f472b6" opacity=".7"/>
      <g id="cpuBtn" class="sim-port" role="button" tabindex="0" aria-label="Botón de encendido de la CPU"><circle cx="840" cy="210" r="17" fill="#2a3349" stroke="#8e9ab0" stroke-width="2"/><path d="M840 200 v9 M833 204 a9 9 0 1 0 14 0" stroke="#dfe6f2" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
      <circle id="cpuLed" cx="872" cy="210" r="4" fill="#2b3550"/><rect x="805" y="240" width="18" height="7" rx="1.5" fill="#0c0f17"/><rect x="829" y="240" width="18" height="7" rx="1.5" fill="#0c0f17"/>
      <text x="840" y="445" text-anchor="middle" fill="#a3b0cf" font-size="17" font-family="Lexend">Torre (CPU)</text></g>
    <g id="dBack"><rect x="945" y="40" width="235" height="372" rx="16" fill="rgba(8,14,30,.88)" stroke="#33405e" stroke-dasharray="6 5"/><text x="1062" y="72" text-anchor="middle" fill="#eef3ff" font-size="19" font-family="Sora" font-weight="600">Parte trasera de la CPU</text>
      <rect x="965" y="96" width="40" height="32" rx="5" fill="#0c0f17" stroke="#8e9ab0"/><text x="1015" y="117" fill="#a3b0cf" font-size="15" font-family="Lexend">Corriente</text>
      ${[['USB', 203], ['HDMI', 268], ['Red', 318], ['Audio', 368]].map(([t, y]) => `<text x="960" y="${y}" fill="#c3cde6" font-size="17" font-family="Lexend">${t}</text>`).join('')}
      </g>
    <g id="dReg"><rect x="528" y="600" width="206" height="48" rx="10" fill="#232b3f" stroke="#3a4560" stroke-width="2"/><g id="regSw" class="sim-port" role="button" tabindex="0" aria-label="Interruptor del regulador"><rect x="534" y="606" width="26" height="36" rx="5" fill="#3a1822" stroke="#f43f5e" stroke-width="2"/><rect id="regKnob" x="539" y="626" width="16" height="11" rx="2" fill="#f43f5e"/></g><circle id="regLed" cx="572" cy="612" r="0" fill="#7dd3fc"/>
      <text x="631" y="676" text-anchor="middle" fill="#a3b0cf" font-size="17" font-family="Lexend">Regulador</text></g>
    <g id="dWall"><rect x="1100" y="430" width="54" height="80" rx="8" fill="#d8dde7" stroke="#aeb7c4"/><text x="1127" y="528" text-anchor="middle" fill="#a3b0cf" font-size="16" font-family="Lexend">Pared</text></g>
    <g id="ports">${SIM.ports.map(p => this.portSVG(p)).join('')}</g>
    <g id="cables"></g><g id="plugs"></g>
    <g id="elecLabels" opacity="0"><text x="1127" y="418" text-anchor="middle" fill="#fda4af" font-size="14" font-family="Sora" font-weight="600">${g <= 2 ? '⚡ Electricidad' : g <= 4 ? '⚡ 120 V' : '⚡ 120 V CA'}</text>${g >= 5 ? '<text x="840" y="168" text-anchor="middle" fill="#7dd3fc" font-size="13" font-family="Sora" font-weight="600">Fuente: CC 12 V · 5 V · 3,3 V</text>' : ''}</g>`;
  },
  portSVG(p) {
    const base = `class="sim-port port" data-port="${p.id}" data-k="${p.k}"`;
    if (p.k === 'reg' || p.k === 'wall') return `<g ${base}><rect x="${p.x - p.w / 2}" y="${p.y - p.h / 2}" width="${p.w}" height="${p.h}" rx="5" fill="#eef1f6" stroke="#8e9ab0"/><rect x="${p.x - 6}" y="${p.y - 9}" width="3" height="9" fill="#1d2433"/><rect x="${p.x + 3}" y="${p.y - 9}" width="3" height="9" fill="#1d2433"/><circle cx="${p.x}" cy="${p.y + 6}" r="3" fill="#1d2433"/><rect class="glow" x="${p.x - p.w / 2 - 5}" y="${p.y - p.h / 2 - 5}" width="${p.w + 10}" height="${p.h + 10}" rx="8" fill="none" stroke="var(--accent)" stroke-width="3" opacity="0"/></g>`;
    if (p.k === 'audio') return `<g ${base}><circle cx="${p.x}" cy="${p.y}" r="9" fill="#0c0f17" stroke="#f9a8d4" stroke-width="3"/><circle class="glow" cx="${p.x}" cy="${p.y}" r="16" fill="none" stroke="var(--accent)" stroke-width="3" opacity="0"/></g>`;
    return `<g ${base}><rect x="${p.x - p.w / 2}" y="${p.y - p.h / 2}" width="${p.w}" height="${p.h}" rx="3" fill="#0c0f17" stroke="${p.k === 'hdmi' ? '#7dd3fc' : p.k === 'eth' ? '#93c5fd' : '#8e9ab0'}" stroke-width="2"/><rect class="glow" x="${p.x - p.w / 2 - 5}" y="${p.y - p.h / 2 - 5}" width="${p.w + 10}" height="${p.h + 10}" rx="6" fill="none" stroke="var(--accent)" stroke-width="3" opacity="0"/></g>`;
  },
  drawCables() {
    const cg = $('#cables', this.svg), pg = $('#plugs', this.svg); cg.innerHTML = ''; pg.innerHTML = '';
    this.pos = {};
    this.cables.forEach(c => {
      this.pos[c.id] = [...c.s];
      const path = document.createElementNS(SVGNS, 'path'); path.setAttribute('id', 'cab_' + c.id); path.setAttribute('fill', 'none'); path.setAttribute('stroke', c.col); path.setAttribute('stroke-width', c.type === 'enchufe' ? 7 : 5); path.setAttribute('stroke-linecap', 'round'); cg.appendChild(path);
      const fl = document.createElementNS(SVGNS, 'path'); fl.setAttribute('id', 'flow_' + c.id); fl.setAttribute('fill', 'none'); fl.setAttribute('stroke', '#fde68a00'); fl.setAttribute('stroke-width', 3); fl.setAttribute('stroke-dasharray', '6 14'); fl.setAttribute('stroke-linecap', 'round'); cg.appendChild(fl);
      const p = document.createElementNS(SVGNS, 'g'); p.setAttribute('class', 'sim-plug'); p.dataset.cable = c.id; p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', c.n);
      p.innerHTML = `<circle r="30" fill="transparent"/>${PLUG_SHAPES[c.type]}`; pg.appendChild(p);
      this.placePlug(c.id);
    });
  },
  placePlug(id) {
    const c = this.cables.find(x => x.id === id), [x, y] = this.pos[id], [ax, ay] = c.a;
    const d = Math.hypot(x - ax, y - ay), sag = Math.max(30, d * .35);
    const dpath = `M${ax} ${ay} C ${ax} ${ay + sag}, ${x} ${y + 26 + sag * .7}, ${x} ${y + 12}`;
    $('#cab_' + id, this.svg).setAttribute('d', dpath); $('#flow_' + id, this.svg).setAttribute('d', dpath);
    const pl = $(`[data-cable="${id}"]`, this.svg); pl.setAttribute('transform', `translate(${x} ${y}) scale(1.2)`);
    pl.firstElementChild.setAttribute('r', this.conn[id] ? 13 : 30); // al estar conectado, su zona táctil no tapa los botones cercanos
  },
  bind() {
    const svg = this.svg; let drag = null;
    svg.addEventListener('pointerdown', e => {
      const pl = e.target.closest('.sim-plug'); if (!pl) return;
      e.preventDefault(); const id = pl.dataset.cable, c = this.cables.find(x => x.id === id);
      if (this.conn[id]) { delete this.conn[id]; this.updatePower(); }
      drag = { id, c, el: pl }; pl.classList.add('dragging'); svg.setPointerCapture(e.pointerId);
      if (this.g <= 3) $$(`.port[data-k="${c.to}"]`, svg).forEach(p => { if (!Object.values(this.conn).includes(p.dataset.port)) { p.querySelector('.glow').setAttribute('opacity', '1'); p.querySelector('.glow').classList.add('sim-hint-glow'); } });
    });
    svg.addEventListener('pointermove', e => { if (!drag) return; const p = svgPoint(svg, e); this.pos[drag.id] = [clamp(p.x, 10, 1190), clamp(p.y, 10, 710)]; this.placePlug(drag.id); });
    const end = e => {
      if (!drag) return; const { id, c, el } = drag; drag = null; el.classList.remove('dragging');
      $$('.port .glow', svg).forEach(g => { g.setAttribute('opacity', '0'); g.classList.remove('sim-hint-glow'); });
      const [x, y] = this.pos[id]; let best = null, bd = 1e9;
      SIM.ports.forEach(p => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } });
      if (best && bd < 44) {
        const used = Object.entries(this.conn).find(([k, v]) => v === best.id);
        if (used) { this.feedback('Ese puerto ya tiene un cable. ¡Prueba con otro igual!', 'try'); return this.drop(id); }
        if (best.k !== c.to) { this.mistakes++; return this.wrong(c, best, id); }
        this.conn[id] = best.id; this.pos[id] = [best.x, best.y + (best.k === 'reg' || best.k === 'wall' ? 10 : 16)]; this.placePlug(id);
        celebrate(this.svg.querySelector(`[data-cable="${id}"]`), 30); this.feedback(`${pick(PRAISE)} ${c.n} conectado.`, 'ok'); this.updatePower(); this.check();
      }
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('keydown', e => {
      const pl = e.target.closest && e.target.closest('.sim-plug'); if (!pl || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault();
      const id = pl.dataset.cable, c = this.cables.find(x => x.id === id); if (this.conn[id]) return;
      const used = Object.values(this.conn); const port = SIM.ports.find(p => p.k === c.to && !used.includes(p.id)); if (!port) return;
      this.conn[id] = port.id; this.pos[id] = [port.x, port.y + (port.k === 'reg' || port.k === 'wall' ? 10 : 16)]; this.placePlug(id); Sfx.ok(); this.feedback(`${c.n} conectado.`, 'ok'); this.updatePower(); this.check();
    });
    const press = (sel, fn) => { const el = $(sel, svg); el.addEventListener('click', fn); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); };
    press('#regSw', () => this.toggleReg()); press('#cpuBtn', () => this.pressPower());
  },
  drop(id) { const c = this.cables.find(x => x.id === id); this.pos[id] = [...c.s]; this.placePlug(id); },
  wrong(c, port, id) {
    Sfx.try(); const el = $(`[data-cable="${id}"]`, this.svg); el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500);
    let msg = `${pick(ENCOURAGE)} Busca un puerto con la misma forma del conector ${PLUG_NAMES[c.type]}.`;
    if (c.type === 'enchufe' && port.k === 'wall') msg = 'Mejor conéctalo al regulador: así lo proteges de las subidas y bajadas de voltaje.';
    if (c.type === 'enchufe' && port.k === 'reg' && c.to === 'wall') msg = 'El regulador se conecta al tomacorriente de la pared.';
    this.feedback(msg, 'try'); this.drop(id);
  },
  feedback(msg, type) { toast(msg, type, 2600); },
  path() { return { wall: this.conn.reg === 'wall', reg: this.conn.reg === 'wall' && this.regOn }; },
  updatePower() {
    const P = this.path(); const powered = id => P.reg && this.conn[id] && this.conn[id].startsWith('reg');
    if (this.regOn && !P.wall) { this.regOn = false; }
    $('#regKnob', this.svg).setAttribute('y', this.regOn ? 611 : 626);
    $('#regLed', this.svg).setAttribute('r', this.regOn ? 4 : 0);
    if (this.cpuOn && !powered('cpu_pow')) this.crash('¡Ups! La CPU se apagó de golpe. Recuerda: primero “Apagar” en la pantalla y después el regulador.');
    const monOn = powered('mon_pow');
    $('#monLed', this.svg).setAttribute('fill', monOn ? (this.cpuOn ? '#7dd3fc' : '#f9a8d4') : '#2b3550');
    if (this.cpuOn) this.screen(monOn ? (this.conn.mon_hdmi ? (this.booted ? 'desk' : 'boot') : 'nosignal') : 'off');
    this.cables.forEach(c => { const f = $('#flow_' + c.id, this.svg); const on = this.flow && c.type === 'enchufe' && (c.id === 'reg' ? P.reg : powered(c.id)); f.setAttribute('stroke', on ? '#fda4af' : 'transparent'); f.style.animation = on ? 'simflow .8s linear infinite' : 'none'; });
    $('#elecLabels', this.svg).setAttribute('opacity', this.flow ? 1 : 0);
    $$('.rtr-led', this.svg).forEach((l, i) => l.setAttribute('fill', this.cpuOn && this.conn.rtr ? (i % 2 ? '#f9a8d4' : '#7dd3fc') : '#2b3550'));
  },
  toggleReg() {
    if (!this.regOn && this.conn.reg !== 'wall') { this.feedback('Primero conecta el regulador a la pared: arrastra su enchufe al tomacorriente.', 'try'); Sfx.try(); return; }
    if (this.regOn && this.cpuOn) { this.regOn = false; this.mistakes++; this.updatePower(); return; }
    this.regOn = !this.regOn; Sfx.click(); if (this.regOn) this.mark('reg_on');
    this.feedback(this.regOn ? 'Regulador encendido: ya hay energía protegida.' : 'Regulador apagado.', 'info'); this.updatePower();
    if (!this.regOn && this.done.has('shutdown')) this.mark('reg_off');
    this.check();
  },
  pressPower() {
    if (this.cpuOn) { this.feedback('Para apagar, usa el botón “Apagar” en la pantalla del computador.', 'info'); return; }
    if (!this.conn.cpu_pow) return this.feedback('Para encender la CPU, conecta su cable de corriente al regulador.', 'try');
    if (!this.conn.reg || this.conn.reg !== 'wall') return this.feedback('Ahora conecta el regulador a la pared.', 'try');
    if (!this.regOn) return this.feedback('Primero enciende el regulador.', 'try');
    this.cpuOn = true; this.booted = false; Sfx.tone(440, .15); $('#cpuLed', this.svg).setAttribute('fill', '#7dd3fc'); this.mark('cpu_on'); this.lit('proc');
    if (!this.conn.mon_pow) this.feedback('¡La CPU encendió! Conecta el monitor al regulador para ver la imagen.', 'info'); else if (!this.conn.mon_hdmi) this.feedback('El monitor espera la señal: conecta el cable HDMI.', 'info');
    this.updatePower(); this.check();
  },
  crash(msg) { this.cpuOn = false; this.booted = false; $('#cpuLed', this.svg).setAttribute('fill', '#2b3550'); this.screen('off'); this.feedback(msg, 'try'); Sfx.try(); },
  screen(state) {
    const s = this.scr; if (this._state === state && state !== 'desk') return; const prev = this._state; this._state = state;
    s.className = 'sim-screen' + (state === 'off' || state === 'nosignal' ? '' : ' on');
    if (state === 'off') { s.innerHTML = ''; return; }
    if (state === 'nosignal') { s.innerHTML = `<div class="os-boot"><div><b>Sin señal</b><div class="small" style="opacity:.7">Conecta el cable HDMI</div></div></div>`; return; }
    if (state === 'boot') {
      s.innerHTML = `<div class="os-boot"><div><b style="font-family:Sora;letter-spacing:.1em">TECNO OS</b><div class="bar"><span></span></div><div style="opacity:.7;margin-top:4px">Iniciando…</div></div></div>`;
      requestAnimationFrame(() => { const b = $('.bar span', s); if (b) b.style.width = '100%'; });
      clearTimeout(this._t); this._t = setTimeout(() => { if (this.cpuOn && this._state === 'boot') { this.booted = true; this.lit('out'); this.screen('desk'); this.feedback('¡El computador encendió! Ahora escribe con el teclado.', 'ok'); } }, 2400); return;
    }
    if (state === 'desk') {
      if (prev === 'desk' && $('.os-win', s)) { const d = $('.doc', s); if (d) d.textContent = this.text; return; }
      const apps = [['file', 'Escribir', 'write'], ...(this.has('impresora') ? [['printer', 'Imprimir', 'print']] : []), ...(this.has('parlantes') ? [['keyboardMusic', 'Música', 'music']] : []), ...(this.has('router') ? [['globe', 'Internet', 'net']] : []), ['power', 'Apagar', 'off']];
      s.innerHTML = `<div class="os-desk">${apps.map(([ic, n, a]) => `<button class="os-icon" data-app="${a}">${icon(ic)}<span>${n}</span></button>`).join('')}</div><div class="os-bar"><span class="os-task">${apps.map(([ic, n, a]) => `<button class="os-tbtn" data-app="${a}" aria-label="${n}" title="${n}">${icon(ic)}</button>`).join('')}</span><span>${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span></div>`;
      $$('[data-app]', s).forEach(b => b.onclick = () => this.app(b.dataset.app));
    }
  },
  needMouse() { if (!this.conn.mouse) { this.feedback('Conecta el mouse para poder hacer clic.', 'try'); Sfx.try(); return true; } this.lit('in'); return false; },
  app(a) {
    if (this.needMouse()) return; const s = this.scr;
    if (a === 'write') return this.openWriter();
    if (a === 'print') { if (!this.conn.prn) return this.feedback('Conecta la impresora a un puerto USB para imprimir.', 'try'); this.lit('proc'); this.lit('out'); const p = $('#simPaper', this.svg); p.setAttribute('height', 0); p.style.transition = 'none'; requestAnimationFrame(() => { p.style.transition = 'height 1.6s ease'; p.setAttribute('height', 46); }); Sfx.tone(300, .8, 'sawtooth', .02); this.mark('print'); this.feedback('Imprimiendo… la impresora es un dispositivo de salida.', 'ok'); return this.check(); }
    if (a === 'music') { if (!this.conn.spk) return this.feedback('Conecta los parlantes al puerto de audio para escuchar.', 'try'); this.lit('proc'); this.lit('out'); Sfx.melody(); $$('.spk circle', this.svg).forEach(c => { c.style.transition = 'r .15s'; }); let k = 0; const iv = setInterval(() => { $$('.spk circle:first-of-type', this.svg).forEach(c => c.setAttribute('r', k % 2 ? 13 : 16)); if (++k > 12) clearInterval(iv); }, 160); this.mark('music'); return this.check(); }
    if (a === 'net') { const ok = !!this.conn.rtr; const w = document.createElement('div'); w.className = 'os-win'; w.innerHTML = `<header><span>Internet</span><button aria-label="Cerrar">×</button></header><div class="doc" style="font-family:inherit">${ok ? '✓ Conectado a internet por cable de red.\n\nRecuerda: no compartas tus datos personales.' : '✕ Sin conexión.\n\nConecta el cable de red del router al puerto de red de la CPU.'}</div>`; s.appendChild(w); $('header button', w).onclick = () => w.remove(); if (ok) { this.mark('net'); this.check(); } return; }
    if (a === 'off') { this.screen('off'); this._state = 'shut'; s.className = 'sim-screen on'; s.innerHTML = '<div class="os-boot"><div>Apagando…<div class="small" style="opacity:.7">Guardando la configuración</div></div></div>'; setTimeout(() => { this.cpuOn = false; this.booted = false; $('#cpuLed', this.svg).setAttribute('fill', '#2b3550'); this._state = null; this.screen('off'); this.updatePower(); this.mark('shutdown'); this.feedback('Apagado correcto. Ahora apaga el regulador.', 'ok'); this.check(); }, 1800); }
  },
  openWriter() {
    const s = this.scr; if ($('.os-win .doc', s)) return;
    const w = document.createElement('div'); w.className = 'os-win'; w.innerHTML = `<header><span>Escribir · documento</span><button aria-label="Cerrar">×</button></header><div class="doc"></div><footer><button data-save>Guardar</button><span style="opacity:.6;font-size:.8em">Escribe con el teclado</span></footer>`;
    s.appendChild(w); $('.doc', w).textContent = this.text; $('header button', w).onclick = () => w.remove();
    $('[data-save]', w).onclick = () => { if (this.needMouse()) return; this.lit('store'); this.mark('save'); this.feedback('Documento guardado en el disco (almacenamiento).', 'ok'); this.check(); };
  },
  type(k) {
    if (!this.booted) return;
    if (!this.conn.kbd) { this.feedback('Conecta el teclado a la CPU para escribir.', 'try'); return; }
    if (k === 'Backspace') this.text = this.text.slice(0, -1); else if (k === 'Enter') this.text += '\n'; else this.text = (this.text + k).slice(-400);
    this.lit('in'); this.lit('proc'); this.lit('out');
    const keys = $$('.kkey', this.svg); const kk = keys[(k.charCodeAt(0) || 0) % keys.length]; if (kk) { kk.setAttribute('fill', '#7dd3fc'); setTimeout(() => kk.setAttribute('fill', '#c9d0dc'), 160); }
    if (!$('.os-win .doc', this.scr)) this.openWriter();
    const d = $('.os-win .doc', this.scr); if (d) d.textContent = this.text;
    if (this.text.replace(/\s/g, '').length >= 3) { this.mark('typed'); this.check(); }
  },
  buildVK() {
    const rows = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
    const v = $('#simVK'); v.innerHTML = rows.map(r => `<div class="vkbd-row">${[...r].map(ch => `<button class="vkey" data-k="${ch}">${ch}</button>`).join('')}</div>`).join('') + `<div class="vkbd-row"><button class="vkey" data-k="Backspace" aria-label="Borrar">⌫</button><button class="vkey wide" data-k=" ">espacio</button><button class="vkey" data-k="Enter" aria-label="Enter">⏎</button></div>`;
    $$('[data-k]', v).forEach(b => b.onclick = () => { this.type(b.dataset.k); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120); });
  },
  lit(k) { const b = $(`[data-ipo="${k}"]`); if (!b) return; b.classList.add('lit'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('lit'), 900); },
  mark(k) { this.done.add(k); this.renderList(); },
  steps() {
    const c = id => !!this.conn[id]; const has = d => this.has(d);
    const s = [
      ['Conecta el monitor a la CPU (HDMI)', c('mon_hdmi')], ['Conecta el teclado y el mouse (USB)', c('kbd') && c('mouse')],
      ...(has('parlantes') ? [['Conecta los parlantes (audio)', c('spk')]] : []), ...(has('impresora') ? [['Conecta la impresora (USB)', c('prn')]] : []), ...(has('router') ? [['Conecta el router (cable de red)', c('rtr')]] : []),
      ['Conecta la CPU y el monitor al regulador', c('cpu_pow') && c('mon_pow')], ['Conecta el regulador a la pared', this.conn.reg === 'wall'],
      ['Enciende el regulador', this.done.has('reg_on')], ['Presiona el botón de la CPU', this.done.has('cpu_on')], ['Escribe tu nombre con el teclado', this.done.has('typed')],
      ...(this.g >= 2 ? [['Guarda tu documento', this.done.has('save')]] : []), ...(has('parlantes') ? [['Escucha música', this.done.has('music')]] : []), ...(has('impresora') ? [['Imprime tu documento', this.done.has('print')]] : []), ...(has('router') ? [['Comprueba la conexión a internet', this.done.has('net')]] : []),
      ['Apaga desde la pantalla (botón Apagar)', this.done.has('shutdown')], ['Al final, apaga el regulador', this.done.has('reg_off')]
    ];
    return s;
  },
  renderList() { const L = $('#simList'); if (!L) return; L.innerHTML = this.steps().map(([t, ok]) => `<li class="${ok ? 'done' : ''}"><span class="box">${ok ? icon('check') : ''}</span>${esc(t)}</li>`).join(''); },
  check() {
    this.renderList(); const st = this.steps();
    if (st.every(s => s[1]) && !this.finished) {
      this.finished = true; Sfx.win(); const stars = this.mistakes === 0 ? 3 : this.mistakes <= 3 ? 2 : 1;
      const rec = Store.g('games'); rec.sim = { plays: (rec.sim?.plays || 0) + 1, best: Math.max(rec.sim?.best || 0, stars) }; Store.save();
      openModal({ title: '¡Misión cumplida!', body: `<div class="result-hero"><div class="stars">${[1, 2, 3].map(i => icon('star', i <= stars ? 'on' : '')).join('')}</div><p>Conectaste, encendiste, usaste y apagaste el computador correctamente${this.mistakes ? ` con ${this.mistakes} intento(s) por corregir` : ' sin errores'}.</p><p class="muted">Recuerda: entrada → proceso → almacenamiento → salida.</p></div>`, actions: [{ label: 'Armar la CPU por dentro', onClick: () => Router.go('sim/cpu') }, { label: 'Jugar otra vez', cls: 'btn-primary', onClick: () => Views.sim.enter(Views.sim.el, []) }] });
    }
  }
};
/* animación del flujo de electricidad */
(() => { const s = document.createElement('style'); s.textContent = '@keyframes simflow{to{stroke-dashoffset:-40}}'; document.head.appendChild(s); })();

/* ---------- Armar la CPU ---------- */
const SimCPU = {
  zones: [
    { id: 'z_cpu', part: 'procesador', x: 300, y: 140, w: 110, h: 110, n: 'Zócalo del procesador' },
    { id: 'z_fan', part: 'ventilador', x: 300, y: 140, w: 110, h: 110, n: 'Encima del procesador', after: 'procesador' },
    { id: 'z_ram', part: 'ram', x: 446, y: 110, w: 60, h: 220, n: 'Ranuras de memoria RAM' },
    { id: 'z_gpu', part: 'tarjeta_grafica', x: 170, y: 345, w: 380, h: 56, n: 'Ranura PCI Express' },
    { id: 'z_hdd', part: 'disco_duro', x: 690, y: 110, w: 86, h: 130, n: 'Bahía de almacenamiento' },
    { id: 'z_psu', part: 'fuente', x: 120, y: 560, w: 270, h: 100, n: 'Espacio de la fuente' }
  ],
  render(root) {
    this.placed = {}; this.errors = 0; const g = Store.grade;
    root.innerHTML = `<div class="sim-layout"><div><div class="sim-wrap"><svg id="cpuSvg" viewBox="0 0 1200 720" aria-label="Gabinete abierto. Arrastra los componentes a su lugar.">${this.svg(g)}</svg></div>
      <div class="row" style="margin-top:12px"><button class="btn btn-primary" id="cpuOn" disabled>${icon('power')}Encender</button><button class="btn btn-ghost btn-sm" id="cpuReset">${icon('refresh')}Reiniciar</button></div></div>
      <aside class="card"><h3>Componentes</h3><ul class="checklist" id="cpuList"></ul><div class="info-block" id="cpuFact" style="margin-top:14px"><h4>Dato</h4><p>Toma un componente de la bandeja de la derecha y suéltalo en su lugar.</p></div></aside></div>`;
    this.svgEl = $('#cpuSvg'); this.bind(); this.list();
    $('#cpuReset').onclick = () => this.render(root);
    $('#cpuOn').onclick = () => this.powerOn();
  },
  svg(g) {
    const showNames = g <= 4;
    const items = [
      ['procesador', 870, 80, `<rect width="90" height="90" rx="8" fill="#6b4a3d"/><rect x="10" y="10" width="70" height="70" rx="6" fill="#c7ccd5"/><text x="45" y="52" text-anchor="middle" font-size="13" font-family="Sora" font-weight="700" fill="#4a5568">CPU</text>`, 90, 90],
      ['ram', 890, 235, `<rect width="22" height="200" rx="3" fill="#15294f"/><rect x="2" y="12" width="18" height="160" rx="2" fill="#262d3f"/><rect x="2" y="70" width="18" height="40" fill="#7dd3fc" opacity=".8"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${i % 2 ? 2 : 13}" y="${180 + Math.floor(i / 2) * 3}" width="7" height="2" fill="#d8c08a"/>`).join('')}<rect x="30" width="22" height="200" rx="3" fill="#15294f"/><rect x="32" y="12" width="18" height="160" rx="2" fill="#262d3f"/><rect x="32" y="70" width="18" height="40" fill="#f9a8d4" opacity=".8"/>`, 52, 200],
      ['ventilador', 1045, 75, `<rect width="100" height="100" rx="12" fill="#171c2a" stroke="#3a4560"/><circle cx="50" cy="50" r="42" fill="#0c0f17"/><g class="fanspin" style="transform-origin:50px 50px">${Array.from({ length: 7 }, (_, i) => `<path d="M50 50 Q ${50 + 40 * Math.cos(i * .9)} ${50 + 40 * Math.sin(i * .9)} ${50 + 38 * Math.cos(i * .9 + .5)} ${50 + 38 * Math.sin(i * .9 + .5)} Z" fill="#3a4560"/>`).join('')}<circle cx="50" cy="50" r="12" fill="#f472b6"/></g>`, 100, 100],
      ['tarjeta_grafica', 850, 482, `<rect width="300" height="50" rx="8" fill="#262d3f"/><circle cx="80" cy="25" r="20" fill="#0c0f17" stroke="#7dd3fc" stroke-width="2"/><circle cx="210" cy="25" r="20" fill="#0c0f17" stroke="#f9a8d4" stroke-width="2"/><rect x="40" y="48" width="110" height="6" fill="#d8c08a"/>`, 300, 54],
      ['disco_duro', 1050, 235, `<rect width="80" height="120" rx="6" fill="#c7ccd5"/><circle cx="40" cy="48" r="30" fill="#e5e9ef" stroke="#9aa3b1"/><circle cx="40" cy="48" r="6" fill="#9aa3b1"/><rect x="40" y="90" width="34" height="5" fill="#f472b6" transform="rotate(-35 40 90)"/>`, 80, 120],
      ['fuente', 900, 572, `<rect width="200" height="90" rx="8" fill="#232b3f" stroke="#3a4560"/><circle cx="100" cy="45" r="34" fill="#0c0f17" stroke="#8e9ab0"/><circle cx="100" cy="45" r="8" fill="#f472b6"/><rect x="170" y="20" width="16" height="22" rx="3" fill="#f43f5e"/>`, 200, 90]
    ];
    this.items = items.map(([part, x, y, , w, h]) => ({ part, x, y, w, h, hx: x, hy: y }));
    const traces = Array.from({ length: 14 }, (_, i) => `<path d="M${150 + i * 34} 80 v${60 + (i % 4) * 40} h${(i % 2 ? 1 : -1) * 30}" stroke="rgba(125,211,252,.18)" fill="none" stroke-width="2"/>`).join('');
    return `<rect width="1200" height="720" fill="#0b1328"/>
      <rect x="80" y="40" width="720" height="640" rx="22" fill="#141a28" stroke="#33405e" stroke-width="3"/>
      <rect x="120" y="70" width="540" height="470" rx="10" fill="#132650" stroke="#24407a"/>${traces}
      <text x="390" y="530" text-anchor="middle" fill="rgba(255,255,255,.45)" font-size="14" font-family="Sora">TARJETA MADRE</text>
      <rect x="40" y="90" width="80" height="150" fill="#262d3f" stroke="#3a4560"/><text x="80" y="260" text-anchor="middle" fill="#a3b0cf" font-size="12" font-family="Lexend">Puertos</text>
      ${this.zones.filter(z => z.id !== 'z_fan').map(z => `<g class="zone" data-zone="${z.id}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="8" fill="rgba(255,255,255,.03)" stroke="var(--accent)" stroke-width="2" stroke-dasharray="8 6" opacity=".8"/>${showNames ? `<text x="${z.x + z.w / 2}" y="${z.y + z.h / 2 + 4}" text-anchor="middle" fill="rgba(238,243,255,.7)" font-size="16" font-family="Lexend">${z.n.replace('Ranuras de memoria RAM', 'RAM').replace('Zócalo del procesador', 'Zócalo')}</text>` : ''}</g>`).join('')}
      <rect x="830" y="40" width="340" height="640" rx="18" fill="rgba(255,255,255,.03)" stroke="#33405e" stroke-dasharray="6 6"/><text x="1000" y="30" text-anchor="middle" fill="#a3b0cf" font-size="14" font-family="Lexend">Bandeja de componentes</text>
      <g id="cpuLeds" opacity=".15"><circle cx="760" cy="620" r="7" fill="#7dd3fc"/><circle cx="740" cy="620" r="7" fill="#f9a8d4"/></g>
      ${items.map(([part, x, y, inner, w, h]) => `<g class="sim-plug comp" data-comp="${part}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${esc(PART[part].n)}"><rect x="-8" y="-8" width="${w + 16}" height="${h + 16}" fill="transparent"/>${inner}<text x="${w / 2}" y="${h + 22}" text-anchor="middle" fill="#eef3ff" font-size="15" font-family="Lexend" class="lbl">${esc(PART[part].n)}</text></g>`).join('')}`;
  },
  bind() {
    const svg = this.svgEl; let d = null;
    svg.addEventListener('pointerdown', e => { const g = e.target.closest('.comp'); if (!g || this.placed[g.dataset.comp]) return; e.preventDefault(); const it = this.items.find(i => i.part === g.dataset.comp); const p = svgPoint(svg, e); d = { it, g, ox: p.x - it.x, oy: p.y - it.y }; svg.setPointerCapture(e.pointerId); g.parentNode.appendChild(g); });
    svg.addEventListener('pointermove', e => { if (!d) return; const p = svgPoint(svg, e); d.it.x = p.x - d.ox; d.it.y = p.y - d.oy; d.g.setAttribute('transform', `translate(${d.it.x} ${d.it.y})`); });
    const up = () => { if (!d) return; const { it, g } = d; d = null; this.drop(it, g); };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  },
  drop(it, g) {
    const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    const inside = z => cx > z.x - 30 && cx < z.x + z.w + 30 && cy > z.y - 30 && cy < z.y + z.h + 30;
    const target = this.zones.find(z => z.part === it.part);
    const back = () => { it.x = it.hx; it.y = it.hy; g.setAttribute('transform', `translate(${it.x} ${it.y})`); };
    if (inside(target)) {
      if (target.after && !this.placed[target.after]) { Sfx.try(); toast('Primero instala el procesador: el disipador con ventilador va encima de él.', 'try'); return back(); }
    } else {
      if (this.zones.some(z => z.part !== it.part && inside(z))) { this.errors++; Sfx.try(); toast(`${pick(ENCOURAGE)} Ese lugar es para otra pieza. ${Store.grade <= 3 ? 'Busca: ' + target.n + '.' : 'Piensa dónde se conecta ' + PART[it.part].n.toLowerCase() + '.'}`, 'try'); }
      return back();
    }
    it.x = target.x + (target.w - it.w) / 2; it.y = target.y + (target.h - it.h) / 2;
    if (it.part === 'tarjeta_grafica') { it.x = target.x + 40; it.y = target.y + 2; }
    g.setAttribute('transform', `translate(${it.x} ${it.y})`); g.classList.remove('sim-plug'); g.querySelector('.lbl').setAttribute('opacity', '0');
    this.placed[it.part] = true; celebrate(g, 40);
    $('#cpuFact').innerHTML = `<h4>${esc(PART[it.part].n)}</h4><p>${esc(Store.grade <= 2 ? PART[it.part].s : PART[it.part].fn)}</p>`;
    this.list();
    if (Object.keys(this.placed).length === this.items.length) { $('#cpuOn').disabled = false; toast('¡Todo en su lugar! Presiona Encender.', 'ok'); }
  },
  list() { $('#cpuList').innerHTML = this.items.map(i => `<li class="${this.placed[i.part] ? 'done' : ''}"><span class="box">${this.placed[i.part] ? icon('check') : ''}</span>${esc(PART[i.part].n)}</li>`).join(''); },
  powerOn() {
    $$('.fanspin', this.svgEl).forEach(f => f.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 600, iterations: Infinity }));
    $('#cpuLeds', this.svgEl).setAttribute('opacity', '1'); Sfx.win();
    const stars = this.errors === 0 ? 3 : this.errors <= 2 ? 2 : 1;
    const rec = Store.g('games'); rec.cpu = { plays: (rec.cpu?.plays || 0) + 1, best: Math.max(rec.cpu?.best || 0, stars) }; Store.save();
    openModal({ title: '¡Tu CPU funciona!', body: `<div class="result-hero"><div class="stars">${[1, 2, 3].map(i => icon('star', i <= stars ? 'on' : '')).join('')}</div><p>La fuente de poder da energía, el procesador piensa, la RAM recuerda por un momento, el disco guarda para siempre, la tarjeta de video crea las imágenes y el ventilador enfría.</p></div>`, actions: [{ label: 'Cerrar', cls: 'btn-primary' }] });
  }
};
