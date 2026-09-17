# ColorRush – Backend (Node.js + Socket.io)

Server realtime multiplayer untuk game ColorRush.

## Isi Folder

```
backend/
├── index.js        ← Server utama (Socket.io + Express)
├── package.json    ← Dependencies
└── README.md       ← Panduan ini
```

## Deploy ke aaPanel

### 1. Upload folder `backend` ke server

Upload seluruh isi folder `backend/` ke server kamu, misalnya di:
```
/www/wwwroot/colorrush-backend/
```

### 2. Install dependencies

SSH ke server, lalu:
```bash
cd /www/wwwroot/colorrush-backend
npm install
```

### 3. Jalankan dengan PM2 (agar tetap berjalan)

Di aaPanel, install PM2 dari **App Store** atau via terminal:
```bash
npm install -g pm2
pm2 start index.js --name colorrush-server
pm2 save
pm2 startup
```

### 4. Buka port 3001 di Firewall aaPanel

Di aaPanel → **Security** → **Firewall** → tambah rule:
- Port: `3001`
- Protocol: `TCP`
- Action: `Accept`

### 5. Set URL di Vercel

Di Vercel dashboard → project → **Settings → Environment Variables**:
```
VITE_SERVER_URL = http://IP_SERVER_KAMU:3001
```
Atau jika pakai domain:
```
VITE_SERVER_URL = https://api.domainkamu.com
```

### 6. Cek server berjalan

Buka browser: `http://IP_SERVER_KAMU:3001`
Harusnya muncul respons dari Express.

## Local Development

```bash
# Dari root project:
npm run dev
# Vite frontend: http://localhost:5173
# Node server:   http://localhost:3001
```
