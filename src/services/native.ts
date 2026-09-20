import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Inisialisasi konfigurasi native untuk Android (Status Bar, Safe Area, dan Splash Screen).
 */
export const initNativeApp = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    document.documentElement.classList.add('is-android-native');
  }

  // 1. Konfigurasi Status Bar Android
  try {
    // Style.Dark membuat teks/ikon status bar berwarna terang (putih) untuk latar gelap
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0d14' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('[Native] Gagal mengonfigurasi StatusBar:', err);
  }

  // 2. Tutup Splash Screen setelah webview siap dan ter-render
  try {
    // Beri sedikit jeda agar DOM React pertama selesai di-paint sempurna
    setTimeout(async () => {
      try {
        await SplashScreen.hide({
          fadeOutDuration: 400,
        });
      } catch (hideErr) {
        console.warn('[Native] Gagal menyembunyikan SplashScreen:', hideErr);
      }
    }, 300);
  } catch (err) {
    console.warn('[Native] Error handler SplashScreen:', err);
  }
};
