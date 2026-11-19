/* TECNO LAB · App de escritorio (Windows y macOS)
   Abre el laboratorio desde los archivos incluidos (carpeta www), sin internet.
   Aplicación elaborada por: Jeniffer Andrea Fuenmayor Díaz · Docente asesor: José Zapata */
const { app, BrowserWindow, protocol, session, shell, net, Menu, systemPreferences } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, allowServiceWorkers: true } }]);
const WWW = path.join(__dirname, 'www');

function crearVentana() {
  const win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 380, minHeight: 600, backgroundColor: '#071630', title: 'TECNO LAB', autoHideMenuBar: true,
    icon: path.join(WWW, 'assets', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadURL('app://tecnolab/index.html');
  // Enlaces externos (YouTube, Sketchfab, GitHub…) en el navegador del sistema
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith('app://')) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); shell.openExternal(url); } });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('app', req => {
    const u = new URL(req.url);
    let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const ruta = path.normalize(path.join(WWW, rel));
    if (!ruta.startsWith(WWW)) return new Response('', { status: 404 });
    return net.fetch(pathToFileURL(ruta).toString()).catch(() => new Response('', { status: 404 }));
  });
  // Cámara para la realidad aumentada, los gestos con la mano y la zona de creación
  if (process.platform === 'darwin' && systemPreferences.getMediaAccessStatus('camera') !== 'granted') systemPreferences.askForMediaAccess('camera').catch(() => {});
  session.defaultSession.setPermissionRequestHandler((wc, permiso, cb) => cb(['media', 'fullscreen', 'clipboard-sanitized-write'].includes(permiso)));
  session.defaultSession.setPermissionCheckHandler((wc, permiso) => ['media', 'fullscreen'].includes(permiso));
  crearVentana();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) crearVentana(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
