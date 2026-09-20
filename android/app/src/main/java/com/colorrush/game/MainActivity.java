package com.colorrush.game;

import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Daftarkan interface native Android agar fungsi keluar aplikasi 100% berfungsi di HP
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void exitApp() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            finishAffinity();
                            System.exit(0);
                        }
                    });
                }
            }, "AndroidNativeApp");
        }
    }

    @Override
    public void onBackPressed() {
        // Intersepsi tombol back fisik dan gesture swipe back dari tepi layar Android
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('androidBackButton'));", 
                        null
                    );
                }
            });
        } else {
            super.onBackPressed();
        }
    }
}
