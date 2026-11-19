"""Construye TECNO LAB a partir de los módulos de src/.

Uso (desde la carpeta del proyecto):
  python3 src/construir.py                 index.html liviano + models/js/*.js  (para GitHub Pages)
  python3 src/construir.py --un-archivo    además TECNO-LAB-un-archivo.html (todo en un solo archivo)
  python3 src/construir.py --extraer-glb   vuelve a crear los .glb en models/ a partir de models/js/

Qué hace:
- src/shell.html   estructura HTML (marcadores /*@@CSS@@*/ y //@@JS@@)
- src/styles.css   estilos (las fuentes de lib/fonts se incluyen dentro)
- src/js/*.js      módulos, en orden alfabético
- models/modelos.json se incluye como MODELOS_BASE (modelos, grados, créditos y miniaturas)
- cada modelo 3D se guarda en models/js/<nombre>.js (el .glb en base64). Así carga igual
  en GitHub Pages, en las apps y al abrir index.html con doble clic (sin servidor).
- lib/three-bundle.js y lib/aruco-bundle.js se incluyen dentro del index y se ejecutan al necesitarlos.
La detección de manos (lib/mediapipe) es pesada: se carga de la carpeta lib/ o de internet.
"""
import base64, glob, json, os, re, sys

PATRON_JS = re.compile(r'TL_GLB\("([^"]+)","([A-Za-z0-9+/=]+)"\)')


def nombre_js(archivo):
    return re.sub(r'\.glb$', '', archivo, flags=re.I) + '.js'


def bytes_modelo(datos, archivo):
    """Bytes del modelo: de models/<archivo>.glb o, si no está, de models/js/<nombre>.js"""
    glb = os.path.join(datos, 'models', archivo)
    if os.path.exists(glb):
        return open(glb, 'rb').read()
    js = os.path.join(datos, 'models', 'js', nombre_js(archivo))
    if os.path.exists(js):
        m = PATRON_JS.search(open(js, encoding='utf8').read())
        if m:
            return base64.b64decode(m.group(2))
    return None


def escribir_js(datos, m, data):
    carpeta = os.path.join(datos, 'models', 'js')
    os.makedirs(carpeta, exist_ok=True)
    cred = f"«{m.get('titulo', m['archivo'])}» de {m.get('autor', '')} · {m.get('licencia', '')} · {m.get('fuente', '')}"
    txt = f'/* TECNO LAB · Modelo 3D {cred} */\nTL_GLB("{m["archivo"]}","{base64.b64encode(data).decode("ascii")}");\n'
    ruta = os.path.join(carpeta, nombre_js(m['archivo']))
    if not os.path.exists(ruta) or open(ruta, encoding='utf8').read() != txt:
        open(ruta, 'w', encoding='utf8').write(txt)


def construir(src, datos, salida, modo='web'):
    """modo 'web': index liviano que carga models/js/*.js · modo 'un-archivo': todo dentro del HTML"""
    leer = lambda *p: open(os.path.join(*p), encoding='utf8').read()
    b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode('ascii')

    shell = leer(src, 'shell.html')
    css = leer(src, 'styles.css')

    def fuente(m):
        ruta = os.path.join(datos, m.group(1))
        return f'url("data:font/woff2;base64,{b64(ruta)}")' if os.path.exists(ruta) else m.group(0)
    css = re.sub(r'url\("(lib/fonts/[\w.\-]+\.woff2)"\)', fuente, css)

    modelos = json.loads(leer(datos, 'models', 'modelos.json'))
    lista, bloques = [], []
    for m in modelos.get('modelos', []):
        data = bytes_modelo(datos, m['archivo'])
        if data is None:
            print('  (falta el modelo', m['archivo'], ')')
            continue
        m = dict(m)
        mini = os.path.join(datos, 'models', m.get('miniatura', '') or '-')
        if m.get('miniatura') and not m['miniatura'].startswith('data:') and os.path.exists(mini):
            tipo = 'webp' if mini.endswith('.webp') else ('png' if mini.endswith('.png') else 'jpeg')
            m['miniatura'] = f'data:image/{tipo};base64,{b64(mini)}'
        lista.append(m)
        if modo == 'un-archivo':
            bloques.append(f'<script type="application/octet-stream" data-glb="{m["archivo"]}">{base64.b64encode(data).decode("ascii")}</script>')
        else:
            escribir_js(datos, m, data)
    modelos = dict(modelos, modelos=lista, incluidos=(True if modo == 'un-archivo' else 'js'))

    js = '/* Modelos 3D y sus créditos (copiado de models/modelos.json al construir) */\nconst MODELOS_BASE = ' + json.dumps(modelos, ensure_ascii=False) + ';\n'
    js += '\n'.join(leer(f) for f in sorted(glob.glob(os.path.join(src, 'js', '*.js'))))
    assert '</script' not in js.lower(), 'El JS contiene </script'

    libs = ''
    for ident, archivo in (('lib-three', 'three-bundle.js'), ('lib-aruco', 'aruco-bundle.js')):
        ruta = os.path.join(datos, 'lib', archivo)
        if os.path.exists(ruta):
            txt = leer(ruta)
            assert '</script' not in txt.lower() and '<!--' not in txt, archivo
            libs += f'<script type="text/x-libreria" id="{ident}">{txt}</script>\n'

    app = '<script>\n//@@JS@@\n</script>'
    assert app in shell, 'Falta el marcador //@@JS@@ en shell.html'
    cola = ('\n<!-- Modelos 3D incluidos (GLB en base64) -->\n' + '\n'.join(bloques)) if bloques else ''
    html = shell.replace('/*@@CSS@@*/', css).replace(app, libs + '<script>\n' + js + '\n</script>' + cola)
    open(salida, 'w', encoding='utf8').write(html)
    sincronizar_sw(src, datos)
    return html, len(lista)


def sincronizar_sw(src, datos):
    """Pone en sw.js la misma versión que APP_VERSION (así la caché sin internet se renueva con cada versión)"""
    sw = os.path.join(datos, 'sw.js')
    m = re.search(r"const APP_VERSION = '([\d.]+)'", open(os.path.join(src, 'js', '00-core.js'), encoding='utf8').read())
    if not (m and os.path.exists(sw)):
        return
    txt = open(sw, encoding='utf8').read()
    nuevo = re.sub(r"const VERSION = 'tecnolab-v[\d.]+';", f"const VERSION = 'tecnolab-v{m.group(1)}';", txt)
    if nuevo != txt:
        open(sw, 'w', encoding='utf8').write(nuevo)


def extraer_glb(datos):
    modelos = json.loads(open(os.path.join(datos, 'models', 'modelos.json'), encoding='utf8').read())
    n = 0
    for m in modelos.get('modelos', []):
        data = bytes_modelo(datos, m['archivo'])
        if data:
            open(os.path.join(datos, 'models', m['archivo']), 'wb').write(data); n += 1
    print(n, 'archivos .glb creados en models/')


if __name__ == '__main__':
    RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if '--extraer-glb' in sys.argv:
        extraer_glb(RAIZ); sys.exit()
    html, n = construir(os.path.join(RAIZ, 'src'), RAIZ, os.path.join(RAIZ, 'index.html'))
    print('index.html', round(len(html.encode('utf8')) / 1024 / 1024, 1), 'MB ·', n, 'modelos en models/js/')
    if '--un-archivo' in sys.argv:
        html, n = construir(os.path.join(RAIZ, 'src'), RAIZ, os.path.join(RAIZ, 'TECNO-LAB-un-archivo.html'), modo='un-archivo')
        print('TECNO-LAB-un-archivo.html', round(len(html.encode('utf8')) / 1024 / 1024, 1), 'MB ·', n, 'modelos incluidos')
