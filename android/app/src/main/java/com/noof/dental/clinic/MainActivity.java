package com.noof.dental.clinic;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

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
    private static final String CHANNEL_ID = "default";
    private static final int REQUEST_NOTIFICATION_PERMISSION = 1001;
    private LocalWebServer localServer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        createNotificationChannel();

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

        requestNotificationPermission();
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                Log.i(TAG, "Requesting POST_NOTIFICATIONS permission...");
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQUEST_NOTIFICATION_PERMISSION);
            } else {
                Log.i(TAG, "POST_NOTIFICATIONS permission already granted");
            }
        } else {
            Log.i(TAG, "Notification permission not required for this Android version");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_NOTIFICATION_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.i(TAG, "POST_NOTIFICATIONS permission GRANTED");
            } else {
                Log.i(TAG, "POST_NOTIFICATIONS permission DENIED");
            }
        }
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

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "إشعارات العيادة",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("إشعارات العيادة والتذكيرات بالمواعيد");
            channel.enableVibration(true);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.i(TAG, "Notification channel created: " + CHANNEL_ID);
            }
        }
    }
}
