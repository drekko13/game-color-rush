/**
 * ColorRush - GitHub Webhook Auto-Deploy
 * ========================================
 * Jalankan file ini secara terpisah (port 9000) di aaPanel.
 * Setiap kali ada push ke GitHub, script ini akan:
 *   1. Verifikasi signature dari GitHub
 *   2. git pull origin main (ambil kode terbaru)
 *   3. npm install (update dependencies jika ada perubahan)
 *   4. pm2 restart colorrush-server
 *
 * Setup:
 *   1. Buat WEBHOOK_SECRET di file .env
 *   2. pm2 start webhook.js --name colorrush-webhook
 *   3. Tambah webhook di GitHub repo
 */

import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import { readFileSync } from 'fs';

const app = express();
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 9000;

// ── Ambil secret dari env atau .env file ─────────────────────────────────────
let WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

if (!WEBHOOK_SECRET) {
  try {
    // Coba baca dari file .env di folder yang sama
    const envContent = readFileSync('.env', 'utf8');
    const match = envContent.match(/WEBHOOK_SECRET=(.+)/);
    if (match) WEBHOOK_SECRET = match[1].trim();
  } catch {
    // .env tidak ditemukan
  }
}

if (!WEBHOOK_SECRET) {
  console.error('[Webhook] ERROR: WEBHOOK_SECRET belum diset!');
  console.error('[Webhook] Buat file .env dengan isi: WEBHOOK_SECRET=rahasia_kamu');
  process.exit(1);
}

// ── Konfigurasi: sesuaikan path dan branch jika perlu ────────────────────────
const REPO_PATH = process.env.REPO_PATH || '/www/wwwroot/colorrush-backend';
const BRANCH    = process.env.BRANCH    || 'main';
const PM2_NAME  = process.env.PM2_NAME  || 'colorrush-server';

// ── Parse raw body untuk verifikasi HMAC signature ───────────────────────────
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));

// ── Fungsi verifikasi signature GitHub ───────────────────────────────────────
function verifySignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// ── Helper: jalankan shell command ───────────────────────────────────────────
function run(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`[Webhook] Running: ${cmd}`);
    exec(cmd, { cwd: REPO_PATH }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[Webhook] Error: ${stderr}`);
        reject(err);
      } else {
        console.log(`[Webhook] Output: ${stdout.trim()}`);
        resolve(stdout);
      }
    });
  });
}

// ── Endpoint health check ─────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ColorRush GitHub Webhook',
    port: WEBHOOK_PORT,
    repo_path: REPO_PATH,
    branch: BRANCH,
    pm2_name: PM2_NAME,
  });
});

// ── Endpoint Webhook dari GitHub ──────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  // 1. Verifikasi signature
  if (!verifySignature(req)) {
    console.warn('[Webhook] Invalid signature! Request ditolak.');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  // 2. Hanya proses event "push" ke branch yang dikonfigurasi
  if (event !== 'push') {
    return res.json({ message: `Event "${event}" diabaikan.` });
  }

  const pushedBranch = (payload.ref || '').replace('refs/heads/', '');
  if (pushedBranch !== BRANCH) {
    return res.json({ message: `Push ke branch "${pushedBranch}" diabaikan (monitoring: ${BRANCH})` });
  }

  const commit = payload.head_commit;
  console.log(`\n[Webhook] ✅ Push terdeteksi dari GitHub!`);
  console.log(`[Webhook]    Branch : ${pushedBranch}`);
  console.log(`[Webhook]    Commit : ${commit?.id?.slice(0, 7)} - ${commit?.message}`);
  console.log(`[Webhook]    Oleh   : ${commit?.author?.name}`);

  // Langsung balas GitHub (agar tidak timeout)
  res.json({ message: 'Deploy dimulai...', commit: commit?.id?.slice(0, 7) });

  // 3. Jalankan deploy pipeline
  try {
    console.log('\n[Webhook] 🚀 Memulai auto-deploy...');

    await run(`git -C ${REPO_PATH} fetch --all`);
    await run(`git -C ${REPO_PATH} reset --hard origin/${BRANCH}`);
    await run(`git -C ${REPO_PATH} pull origin ${BRANCH}`);
    await run(`cd ${REPO_PATH} && npm install --omit=dev`);
    await run(`pm2 restart ${PM2_NAME}`);

    console.log('[Webhook] ✅ Auto-deploy selesai!\n');
  } catch (err) {
    console.error('[Webhook] ❌ Deploy gagal:', err.message);
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(WEBHOOK_PORT, () => {
  console.log(`[Webhook] Server berjalan di http://localhost:${WEBHOOK_PORT}`);
  console.log(`[Webhook] Endpoint: POST http://localhost:${WEBHOOK_PORT}/webhook`);
  console.log(`[Webhook] Pantau branch: ${BRANCH}`);
  console.log(`[Webhook] Repo path: ${REPO_PATH}`);
  console.log(`[Webhook] PM2 process: ${PM2_NAME}`);
});
