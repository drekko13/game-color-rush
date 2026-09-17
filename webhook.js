/**
 * ColorRush - GitHub Webhook Receiver
 * =====================================
 * Jalankan dengan PM2 secara terpisah di port 9000.
 * Saat GitHub push, script ini memanggil deploy.sh.
 *
 * Setup di server aaPanel:
 *   pm2 start webhook.js --name colorrush-webhook
 *   pm2 save
 */

import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9000;

// ── Secret (harus sama dengan yang diisi di GitHub Webhook settings) ─────────
const SECRET = process.env.WEBHOOK_SECRET || 'ganti_dengan_secret_kamu';

// ── Path ke deploy script ─────────────────────────────────────────────────────
const DEPLOY_SCRIPT = '/www/wwwroot/GAMES/Color-Rush/deploy.sh';

// ── Parse raw body untuk verifikasi HMAC signature ───────────────────────────
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ── Fungsi verifikasi signature dari GitHub ───────────────────────────────────
function verifySignature(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', SECRET).update(req.rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ColorRush GitHub Webhook',
    port: PORT,
    deploy_script: DEPLOY_SCRIPT,
  });
});

// ── Endpoint yang dipanggil GitHub saat ada push ──────────────────────────────
app.post('/webhook', (req, res) => {
  // 1. Verifikasi signature
  if (!verifySignature(req)) {
    console.warn('[Webhook] ❌ Signature tidak valid! Request ditolak.');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  // 2. Hanya proses event "push"
  if (event !== 'push') {
    console.log(`[Webhook] Event "${event}" diabaikan.`);
    return res.json({ message: `Event "${event}" diabaikan.` });
  }

  // 3. Hanya proses push ke branch "main"
  const branch = (payload.ref || '').replace('refs/heads/', '');
  if (branch !== 'main') {
    console.log(`[Webhook] Push ke branch "${branch}" diabaikan.`);
    return res.json({ message: `Branch "${branch}" diabaikan.` });
  }

  const commit = payload.head_commit;
  console.log('\n[Webhook] ✅ Push dari GitHub terdeteksi!');
  console.log(`[Webhook]    Branch : ${branch}`);
  console.log(`[Webhook]    Commit : ${commit?.id?.slice(0, 7)} - ${commit?.message}`);
  console.log(`[Webhook]    Oleh   : ${commit?.author?.name}`);

  // Balas GitHub dulu biar tidak timeout
  res.json({ message: 'Deploy dimulai...', commit: commit?.id?.slice(0, 7) });

  // 4. Jalankan deploy.sh
  console.log('\n[Webhook] 🚀 Menjalankan deploy.sh...');
  exec(`bash ${DEPLOY_SCRIPT}`, (err, stdout, stderr) => {
    if (err) {
      console.error('[Webhook] ❌ Deploy gagal!');
      console.error(stderr);
      return;
    }
    console.log('[Webhook] Output deploy.sh:');
    console.log(stdout);
    console.log('[Webhook] ✅ Deploy selesai!\n');
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Webhook] Server berjalan di http://localhost:${PORT}`);
  console.log(`[Webhook] Endpoint: POST http://IP_SERVER:${PORT}/webhook`);
  console.log(`[Webhook] Deploy script: ${DEPLOY_SCRIPT}`);
});
