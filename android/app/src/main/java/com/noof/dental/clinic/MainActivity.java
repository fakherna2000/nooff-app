package com.noof.dental.clinic;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "NoofMain";
    private static final int LOCAL_PORT = 18080;
    private static final String LOAD_URL = "http://127.0.0.1:" + LOCAL_PORT + "/index.html";
    private LocalWebServer localServer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin.class);

        Log.i(TAG, "Starting embedded HTTP server BEFORE super.onCreate()...");
        try {
            localServer = new LocalWebServer(LOCAL_PORT, getApplicationContext());
            localServer.start();
            Log.i(TAG, "Embedded server start() OK (socket bound, accepting connections soon...)");
        } catch (IOException e) {
            Log.e(TAG, "Failed to start embedded server! Falling back to Capacitor default.", e);
            localServer = null;
        }

        int waited = 0;
        boolean ready = false;
        while (waited < 5000) {
            if (ping()) { ready = true; break; }
            try { Thread.sleep(50); waited += 50; } catch (InterruptedException ignore) {}
        }
        Log.i(TAG, "Server ready after " + waited + "ms? " + ready +
                   " — proceeding to super.onCreate() which will call loadUrl(" + LOAD_URL + ") by Capacitor config.");

        super.onCreate(savedInstanceState);
    }

    private static boolean ping() {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(LOAD_URL).openConnection();
            c.setConnectTimeout(40);
            c.setReadTimeout(40);
            c.setRequestMethod("HEAD");
            c.setInstanceFollowRedirects(false);
            int code = c.getResponseCode();
            c.disconnect();
            return code >= 200 && code < 500;
        } catch (Throwable ignore) { return false; }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (localServer != null) {
            try { localServer.stop(); } catch (Throwable ignore) {}
            localServer = null;
        }
    }
}
