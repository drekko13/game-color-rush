import { getServerUrl } from '../config/server';
import { socketService } from './socket';

/**
 * Memeriksa status koneksi internet secara nyata dan akurat:
 * - Menangani kondisi ketika kabel USB / ADB aktif di Android yang membuat navigator.onLine tetap 'true'
 *   meskipun data seluler dan Wi-Fi dalam keadaan mati.
 * - Melakukan ping ringan ke backend server ColorRush.
 */
export async function checkNetworkConnectivity(timeoutMs: number = 2500): Promise<boolean> {
  // 1. Jika sistem browser/perangkat secara tegas melaporkan offline
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  // 2. Jika socket sudah dalam keadaan terhubung, berarti pasti online
  if (socketService.socket?.connected) {
    return true;
  }

  // 3. Lakukan ping ke server backend untuk memastikan akses internet benar-benar tersedia
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const serverUrl = getServerUrl();
    const response = await fetch(serverUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
    });
    clearTimeout(timer);
    return response.ok || response.status < 500;
  } catch {
    // Jika fetch gagal (karena tidak ada kuota/wifi/paket data mati), berarti offline
    return false;
  }
}
