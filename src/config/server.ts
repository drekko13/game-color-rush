export const PROD_SERVER_URL = 'https://be-color-rush.andrep.my.id';
export const LOCAL_SERVER_URL = 'http://localhost:9001';

/**
 * Mendapatkan URL server backend secara dinamis:
 * 1. Prioritas utama: VITE_SERVER_URL dari file .env (jika secara spesifik ingin diarahkan ke localhost:9001 atau IP lain)
 * 2. Default untuk SEMUA lingkungan (Web Browser dev/prod & APK Mobile):
 *    Menggunakan https://be-color-rush.andrep.my.id
 */
export function getServerUrl(): string {
  const envUrl = import.meta.env.VITE_SERVER_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Selalu default ke server backend ColorRush online
  return PROD_SERVER_URL;
}
