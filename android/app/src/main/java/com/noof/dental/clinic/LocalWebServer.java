package com.noof.dental.clinic;

import android.content.Context;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LocalWebServer {
    private static final String TAG = "LocalWebServer";
    private static final String ASSETS_PREFIX = "public";
    private static final String DEFAULT_FILE = "index.html";

    private final int port;
    private final Context context;
    private ServerSocket server;
    private ExecutorService pool;
    private volatile boolean running;

    public LocalWebServer(int port, Context context) {
        this.port = port;
        this.context = context.getApplicationContext();
    }

    public void start() throws IOException {
        server = new ServerSocket(port, 50);
        pool = Executors.newFixedThreadPool(4);
        running = true;
        Thread accept = new Thread(new Runnable() {
            @Override
            public void run() {
                while (running) {
                    try {
                        final Socket sock = server.accept();
                        sock.setSoTimeout(30000);
                        sock.setTcpNoDelay(true);
                        pool.execute(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    handle(sock);
                                } catch (Throwable t) {
                                    Log.w(TAG, "handle error", t);
                                } finally {
                                    try { sock.close(); } catch (Throwable ignore) {}
                                }
                            }
                        });
                    } catch (Throwable t) {
                        if (running) Log.w(TAG, "accept loop error", t);
                    }
                }
                Log.i(TAG, "Accept loop stopped");
            }
        }, "LocalWebServer-Accept");
        accept.setDaemon(true);
        accept.start();
        Log.i(TAG, "Started on http://127.0.0.1:" + port);
    }

    public void stop() {
        running = false;
        try { if (server != null) server.close(); } catch (Throwable ignore) {}
        try { if (pool != null) pool.shutdownNow(); } catch (Throwable ignore) {}
        server = null;
        pool = null;
        Log.i(TAG, "Stopped");
    }

    private String fixPath(String rawUri) {
        String path = rawUri.split("\\?")[0].split("#")[0];
        if (path.endsWith("/")) {
            path = path + DEFAULT_FILE;
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (path.isEmpty()) {
            path = DEFAULT_FILE;
        }
        if (!path.startsWith(ASSETS_PREFIX + "/") && !path.equals(ASSETS_PREFIX)) {
            path = ASSETS_PREFIX + "/" + path;
        }
        return path;
    }

    private static final Map<String, String> MIME = new HashMap<>();
    static {
        MIME.put("html", "text/html; charset=utf-8");
        MIME.put("htm", "text/html; charset=utf-8");
        MIME.put("js", "application/javascript; charset=utf-8");
        MIME.put("mjs", "application/javascript; charset=utf-8");
        MIME.put("css", "text/css; charset=utf-8");
        MIME.put("json", "application/json; charset=utf-8");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("jpeg", "image/jpeg");
        MIME.put("svg", "image/svg+xml");
        MIME.put("ico", "image/x-icon");
        MIME.put("webp", "image/webp");
        MIME.put("gif", "image/gif");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("ttf", "font/ttf");
        MIME.put("txt", "text/plain");
        MIME.put("webmanifest", "application/manifest+json");
        MIME.put("map", "application/json; charset=utf-8");
    }

    private String guessMime(String path) {
        int dot = path.lastIndexOf('.');
        if (dot < 0) return "application/octet-stream";
        String ext = path.substring(dot + 1).toLowerCase(Locale.US);
        return MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
    }

    private static final int BUF_SIZE = 16384;

    private static String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(128);
        int c;
        while ((c = in.read()) >= 0) {
            if (c == '\r') continue;
            if (c == '\n') break;
            baos.write(c);
            if (baos.size() > 65536) break;
        }
        return new String(baos.toByteArray(), StandardCharsets.ISO_8859_1);
    }

    private void handle(Socket sock) throws IOException {
        InputStream in = sock.getInputStream();
        OutputStream out = sock.getOutputStream();

        String line = readLine(in);
        if (line == null || line.isEmpty()) return;
        String[] parts = line.split("\\s+");
        if (parts.length < 2) {
            writeError(out, 400, "Bad Request", line);
            return;
        }
        String method = parts[0];
        String rawUri = parts[1];

        while (true) {
            String headerLine = readLine(in);
            if (headerLine == null || headerLine.isEmpty()) break;
        }

        if (!"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method)) {
            writeError(out, 405, "Method Not Allowed", method);
            return;
        }

        String path = fixPath(rawUri);
        android.content.res.AssetManager am = context.getAssets();

        InputStream body = null;
        long bodyLen = -1;
        String resolvedPath = path;

        try {
            try {
                String[] list = am.list(path);
                if (list != null && list.length > 0) {
                    String candidate = path.endsWith("/") ? path + DEFAULT_FILE : path + "/" + DEFAULT_FILE;
                    try {
                        body = am.open(candidate);
                        bodyLen = body.available();
                        resolvedPath = candidate;
                    } catch (IOException ignore) { body = null; }
                }
            } catch (Throwable ignore) {}
            if (body == null) {
                body = am.open(path);
                bodyLen = body.available();
                resolvedPath = path;
            }
        } catch (IOException notFound) {
            String noext = resolvedPath;
            if (noext.startsWith(ASSETS_PREFIX + "/")) {
                noext = noext.substring(ASSETS_PREFIX.length() + 1);
            }
            String withHtml = ASSETS_PREFIX + "/" + (noext.endsWith("/") ? noext.substring(0, noext.length() - 1) : noext) + ".html";
            try {
                body = am.open(withHtml);
                bodyLen = body.available();
                resolvedPath = withHtml;
            } catch (IOException noHtmlEither) {
                try {
                    body = am.open(ASSETS_PREFIX + "/" + DEFAULT_FILE);
                    bodyLen = body.available();
                    resolvedPath = ASSETS_PREFIX + "/" + DEFAULT_FILE;
                } catch (IOException totalFail) {
                    body = null;
                }
            }
        }

        if (body == null) {
            writeError(out, 404, "Not Found", rawUri + " -> " + path);
            return;
        }

        String mime = guessMime(resolvedPath);
        StringBuilder sb = new StringBuilder();
        sb.append("HTTP/1.1 200 OK\r\n");
        sb.append("Content-Type: ").append(mime).append("\r\n");
        sb.append("Content-Length: ").append(bodyLen).append("\r\n");
        sb.append("Cache-Control: no-cache, no-store, must-revalidate\r\n");
        sb.append("Access-Control-Allow-Origin: *\r\n");
        sb.append("Connection: close\r\n");
        sb.append("\r\n");
        byte[] head = sb.toString().getBytes(StandardCharsets.ISO_8859_1);
        out.write(head);

        if ("HEAD".equalsIgnoreCase(method)) {
            out.flush();
            body.close();
            return;
        }

        try {
            byte[] buf = new byte[BUF_SIZE];
            long remain = bodyLen;
            while (remain > 0) {
                int r = body.read(buf, 0, (int) Math.min(buf.length, remain));
                if (r < 0) break;
                out.write(buf, 0, r);
                remain -= r;
            }
            out.flush();
        } finally {
            try { body.close(); } catch (Throwable ignore) {}
        }
    }

    private void writeError(OutputStream out, int code, String status, String info) {
        String html = "<!doctype html><html><head><meta charset='utf-8'><title>" + code + " " + status + "</title></head><body><h1>" + code + " " + status + "</h1><pre>" + (info == null ? "" : escape(info)) + "</pre></body></html>";
        byte[] bodyBytes = html.getBytes(StandardCharsets.UTF_8);
        StringBuilder sb = new StringBuilder();
        sb.append("HTTP/1.1 ").append(code).append(" ").append(status).append("\r\n");
        sb.append("Content-Type: text/html; charset=utf-8\r\n");
        sb.append("Content-Length: ").append(bodyBytes.length).append("\r\n");
        sb.append("Cache-Control: no-store\r\n");
        sb.append("Connection: close\r\n");
        sb.append("\r\n");
        try {
            out.write(sb.toString().getBytes(StandardCharsets.ISO_8859_1));
            out.write(bodyBytes);
            out.flush();
        } catch (Throwable ignore) {}
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
