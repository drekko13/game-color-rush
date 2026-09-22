export const PROD_SERVER_URL = 'https://be-color-rush.andrep.my.id';
export const LOCAL_SERVER_URL = 'https://be-color-rush.andrep.my.id';

/**
 * Mendapatkan URL server backend secara langsung ke server BE online:
 * Selalu menggunakan https://be-color-rush.andrep.my.id agar ketika dijalankan
 * di localhost atau diunggah ke MeGo, status game selalu online dan terhubung ke backend.
 */
export function getServerUrl(): string {
  return PROD_SERVER_URL;
}
