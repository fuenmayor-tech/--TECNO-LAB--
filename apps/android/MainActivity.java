/*
 * TECNO LAB · App para Android
 * Muestra el laboratorio (index.html y sus archivos) desde la carpeta assets/www
 * dentro de un WebView, sin necesidad de internet. Permite usar la cámara
 * (realidad aumentada y zona de creación), subir modelos .glb, guardar archivos
 * en Descargas e imprimir el marcador.
 * Aplicación elaborada por: Jeniffer Andrea Fuenmayor Díaz · Docente asesor: José Zapata
 */
package edu.tecnolab.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    /* Dirección interna segura (https) desde la que se sirven los archivos de la app */
    static final String HOST = "appassets.androidplatform.net";
    static final String BASE = "https://" + HOST + "/";
    static final int PEDIR_CAMARA = 1;
    static final int ELEGIR_ARCHIVO = 2;
    static final int PEDIR_AL_INICIO = 3;
    static final String CAMARA = "android.permission.CAMERA";
    static final int FONDO = 0xFF071630;

    WebView web;
    WebView webImpresion;
    FrameLayout raiz;
    View vistaCompleta;
    WebChromeClient.CustomViewCallback cierreCompleta;
    ValueCallback<Uri[]> archivoCallback;
    PermissionRequest permisoPendiente;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().setStatusBarColor(FONDO);
            getWindow().setNavigationBarColor(FONDO);
        }
        raiz = new FrameLayout(this);
        web = new WebView(this);
        web.setBackgroundColor(FONDO);
        raiz.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(raiz);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Puente(), "TecnoLabNativo");
        web.setWebViewClient(new Cliente());
        web.setWebChromeClient(new Navegador());
        web.loadUrl(BASE + "index.html");

        /* Pide el permiso de la cámara desde el inicio (realidad aumentada, gestos con la mano y zona de creación) */
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(CAMARA) != 0) requestPermissions(new String[]{CAMARA}, PEDIR_AL_INICIO);
    }

    boolean camaraPermitida() { return Build.VERSION.SDK_INT < 23 || checkSelfPermission(CAMARA) == 0; }

    /* Abre los ajustes de la app para que se pueda activar la cámara a mano */
    void abrirAjustes() {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:edu.tecnolab.app"));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
            aviso("Toca Permisos → Cámara → Permitir y vuelve a TECNO LAB.");
        } catch (Exception e) {
            aviso("Abre Ajustes → Aplicaciones → TECNO LAB → Permisos → Cámara.");
        }
    }

    @Override
    public void onBackPressed() {
        if (vistaCompleta != null) { salirPantallaCompleta(); return; }
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() { super.onPause(); if (web != null) web.onPause(); }

    @Override
    protected void onResume() { super.onResume(); if (web != null) web.onResume(); }

    /* ---------- Archivos de la app (assets/www) ---------- */
    static String tipoMime(String ruta) {
        String r = ruta.toLowerCase();
        if (r.endsWith(".html") || r.endsWith(".htm")) return "text/html";
        if (r.endsWith(".js")) return "application/javascript";
        if (r.endsWith(".css")) return "text/css";
        if (r.endsWith(".json")) return "application/json";
        if (r.endsWith(".webmanifest")) return "application/manifest+json";
        if (r.endsWith(".wasm")) return "application/wasm";
        if (r.endsWith(".glb")) return "model/gltf-binary";
        if (r.endsWith(".png")) return "image/png";
        if (r.endsWith(".jpg") || r.endsWith(".jpeg")) return "image/jpeg";
        if (r.endsWith(".webp")) return "image/webp";
        if (r.endsWith(".svg")) return "image/svg+xml";
        if (r.endsWith(".woff2")) return "font/woff2";
        if (r.endsWith(".pdf")) return "application/pdf";
        if (r.endsWith(".txt") || r.endsWith(".md")) return "text/plain";
        return "application/octet-stream";
    }

    static boolean esTexto(String mime) {
        return mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") || mime.endsWith("+xml");
    }

    WebResourceResponse servir(Uri u) {
        if (u == null || !HOST.equals(u.getHost())) return null;
        String ruta = u.getPath();
        if (ruta == null || ruta.length() == 0 || ruta.equals("/")) ruta = "/index.html";
        ruta = ruta.substring(1);
        Map<String, String> cabeceras = new HashMap<String, String>();
        cabeceras.put("Access-Control-Allow-Origin", "*");
        cabeceras.put("Cache-Control", "no-cache");
        if (ruta.contains("..")) return noEncontrado(cabeceras);
        try {
            InputStream entrada = getAssets().open("www/" + ruta);
            String mime = tipoMime(ruta);
            WebResourceResponse r = new WebResourceResponse(mime, esTexto(mime) ? "utf-8" : null, entrada);
            r.setResponseHeaders(cabeceras);
            return r;
        } catch (Exception e) {
            return noEncontrado(cabeceras);
        }
    }

    static WebResourceResponse noEncontrado(Map<String, String> cabeceras) {
        WebResourceResponse r = new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
        r.setStatusCodeAndReasonPhrase(404, "Not Found");
        r.setResponseHeaders(cabeceras);
        return r;
    }

    class Cliente extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
            return servir(req.getUrl());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (u == null) return false;
            String esquema = u.getScheme();
            if (HOST.equals(u.getHost()) || "blob".equals(esquema) || "data".equals(esquema) || "about".equals(esquema)) return false;
            abrirFuera(u);
            return true;
        }
    }

    /* Los enlaces externos (YouTube, Sketchfab, GitHub…) se abren en el navegador del teléfono */
    void abrirFuera(Uri u) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            aviso("No hay una aplicación para abrir este enlace.");
        }
    }

    /* ---------- Cámara, archivos y video en pantalla completa ---------- */
    class Navegador extends WebChromeClient {
        @Override
        public void onPermissionRequest(PermissionRequest req) {
            boolean pideCamara = false;
            for (String r : req.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) pideCamara = true;
            if (!pideCamara) { req.deny(); return; }
            if (camaraPermitida()) {
                req.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            } else {
                if (permisoPendiente != null) permisoPendiente.deny();
                permisoPendiente = req;
                requestPermissions(new String[]{CAMARA}, PEDIR_CAMARA);
            }
        }

        @Override
        public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback, WebChromeClient.FileChooserParams p) {
            if (archivoCallback != null) archivoCallback.onReceiveValue(null);
            archivoCallback = callback;
            try {
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                startActivityForResult(Intent.createChooser(i, "Elegir archivo"), ELEGIR_ARCHIVO);
                return true;
            } catch (Exception e) {
                archivoCallback = null;
                aviso("No se encontró una aplicación para elegir archivos.");
                return false;
            }
        }

        @Override
        public void onShowCustomView(View vista, WebChromeClient.CustomViewCallback cierre) {
            if (vistaCompleta != null) { cierre.onCustomViewHidden(); return; }
            vistaCompleta = vista;
            cierreCompleta = cierre;
            raiz.addView(vista, new FrameLayout.LayoutParams(-1, -1));
            web.setVisibility(View.GONE);
        }

        @Override
        public void onHideCustomView() { salirPantallaCompleta(); }
    }

    void salirPantallaCompleta() {
        if (vistaCompleta == null) return;
        raiz.removeView(vistaCompleta);
        vistaCompleta = null;
        web.setVisibility(View.VISIBLE);
        if (cierreCompleta != null) cierreCompleta.onCustomViewHidden();
        cierreCompleta = null;
    }

    @Override
    public void onRequestPermissionsResult(int codigo, String[] permisos, int[] resultados) {
        boolean si = resultados.length > 0 && resultados[0] == 0;
        if (codigo == PEDIR_AL_INICIO) return;
        if (codigo != PEDIR_CAMARA || permisoPendiente == null) return;
        if (si) permisoPendiente.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        else {
            permisoPendiente.deny();
            /* Si el permiso quedó bloqueado ("No volver a preguntar"), lleva a los ajustes de la app */
            if (Build.VERSION.SDK_INT >= 23 && !shouldShowRequestPermissionRationale(CAMARA)) abrirAjustes();
            else aviso("Para usar la cámara en TECNO LAB, toca Permitir.");
        }
        permisoPendiente = null;
    }

    @Override
    protected void onActivityResult(int codigo, int resultado, Intent datos) {
        if (codigo == ELEGIR_ARCHIVO) {
            Uri[] elegidos = null;
            try { elegidos = WebChromeClient.FileChooserParams.parseResult(resultado, datos); } catch (Exception e) { elegidos = null; }
            if (archivoCallback != null) archivoCallback.onReceiveValue(elegidos);
            archivoCallback = null;
            return;
        }
        super.onActivityResult(codigo, resultado, datos);
    }

    /* ---------- Puente con la página: guardar archivos e imprimir ---------- */
    public class Puente {
        @JavascriptInterface
        public String version() { return "1.5.0"; }

        @JavascriptInterface
        public boolean camara() { return camaraPermitida(); }

        @JavascriptInterface
        public void ajustes() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { abrirAjustes(); }
            });
        }

        @JavascriptInterface
        public void pedirCamara() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { if (Build.VERSION.SDK_INT >= 23 && !camaraPermitida()) requestPermissions(new String[]{CAMARA}, PEDIR_AL_INICIO); }
            });
        }

        @JavascriptInterface
        public void guardar(String base64, String nombre, String mime) {
            try {
                byte[] datos = Base64.decode(base64, Base64.DEFAULT);
                String limpio = nombre == null ? "archivo" : nombre.replaceAll("[^A-Za-z0-9._-]", "_");
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, limpio);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, mime == null ? "application/octet-stream" : mime);
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/TECNO LAB");
                    ContentResolver cr = getContentResolver();
                    Uri destino = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    OutputStream salida = cr.openOutputStream(destino);
                    salida.write(datos);
                    salida.close();
                    aviso("Guardado en Descargas › TECNO LAB: " + limpio);
                } else {
                    File carpeta = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (carpeta != null) carpeta.mkdirs();
                    File archivo = new File(carpeta, limpio);
                    FileOutputStream salida = new FileOutputStream(archivo);
                    salida.write(datos);
                    salida.close();
                    aviso("Guardado en: " + archivo.getAbsolutePath());
                }
            } catch (Exception e) {
                aviso("No se pudo guardar el archivo.");
            }
        }

        @JavascriptInterface
        public void imprimirHTML(final String html) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { imprimir(html); }
            });
        }
    }

    void imprimir(String html) {
        webImpresion = new WebView(this);
        webImpresion.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return false; }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) { return servir(req.getUrl()); }

            @Override
            public void onPageFinished(WebView v, String url) {
                try {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    PrintDocumentAdapter adaptador = v.createPrintDocumentAdapter("TECNO LAB");
                    pm.print("TECNO LAB", adaptador, null);
                } catch (Exception e) {
                    aviso("No se pudo abrir la impresión.");
                }
            }
        });
        webImpresion.loadDataWithBaseURL(BASE, html, "text/html", "utf-8", null);
    }

    void aviso(final String texto) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() { Toast.makeText(MainActivity.this, texto, Toast.LENGTH_LONG).show(); }
        });
    }
}
