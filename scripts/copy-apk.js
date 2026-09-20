import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version || '1.0.0';

const sourceApk = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const targetDir = path.join(rootDir, 'APK');
const targetFile = path.join(targetDir, `ColorClash-V${version}.apk`);

if (!fs.existsSync(sourceApk)) {
  console.error(`[Error] File APK sumber tidak ditemukan di: ${sourceApk}`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(sourceApk, targetFile);

const stats = fs.statSync(targetFile);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n======================================================');
console.log('✅ APK BERHASIL DISIMPAN KE FOLDER APK!');
console.log(`📁 Lokasi : ${targetFile}`);
console.log(`📦 Versi  : V${version}`);
console.log(`📊 Ukuran : ${sizeMb} MB`);
console.log('======================================================\n');
