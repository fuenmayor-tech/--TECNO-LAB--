# Apps de TECNO LAB

Las apps muestran exactamente el mismo laboratorio (`index.html` y sus carpetas), incluido dentro de la app para que funcione sin internet.

## Android (`android/`)

- `MainActivity.java`: abre el laboratorio en un WebView desde la carpeta interna `assets/www`.
- Pide el permiso de la cámara al abrirse y cada vez que la página lo necesita (realidad aumentada con cámara trasera o frontal, gestos con la mano y zona de creación). Si el permiso quedó bloqueado, abre los ajustes de la app para activarlo.
- Permite subir modelos .glb, guardar archivos en *Descargas › TECNO LAB* e imprimir el marcador.
- Paquete `edu.tecnolab.app`, Android 7.0 o superior.

## Windows y macOS (`escritorio/`)

- Hecha con [Electron](https://www.electronjs.org) (licencia MIT).
- `main.js` sirve los archivos del laboratorio desde la carpeta `www`, permite la cámara (en macOS la pide al abrirse) y abre los enlaces externos en el navegador.
- Para generar las apps: copiar el laboratorio en `escritorio/www/` y empaquetar con `@electron/packager`.

## Dónde se publican

Las apps pesan más de 25 MB (el máximo que GitHub acepta por archivo desde el navegador), así que no van dentro del repositorio: se suben como archivos de una versión en la sección **Releases** del repositorio, que acepta archivos de hasta 2 GB.

## iPhone y iPad

Apple solo permite instalar apps firmadas con una cuenta de Apple Developer desde un Mac. Mientras tanto, en Safari se abre la página publicada y se usa **Compartir → Agregar a pantalla de inicio**: queda como una app con su icono y funciona sin internet después de la primera visita.

---
Aplicación elaborada por: Jeniffer Andrea Fuenmayor Díaz · Docente asesor: José Zapata
