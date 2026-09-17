#!/bin/bash
echo "=== MEMULAI PROSES DEPLOYMENT OTOMATIS ==="

# PATH Folder Project ColorRush
WEB_PATH="/www/wwwroot/GAMES/Color-Rush"

# 1. Pastikan folder project ada dan masuk ke dalamnya
mkdir -p $WEB_PATH
cd $WEB_PATH || exit

# 2. Set variabel HOME sementara agar Git & PM2 tidak fatal error
export HOME=/root
export PATH=$PATH:/usr/local/bin:/usr/bin

# 3. Bypass kepemilikan folder (safe.directory) agar git bisa jalan sebagai root
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=safe.directory
export GIT_CONFIG_VALUE_0=$WEB_PATH

# 4. Cek apakah folder sudah merupakan git repository
if [ ! -d ".git" ]; then
    echo "Repository belum ada di folder ini. Menginisialisasi Git dari GitHub..."
    git init
    git remote add origin https://github.com/drekko13/game-color-rush.git
    git fetch --all
    git reset --hard origin/main
    git branch -M main
    git checkout -f main
else
    echo "Menarik kode terbaru dari GitHub..."
    git fetch --all
    git reset --hard origin/main
    git pull origin main
fi

# 5. Install dependensi Node.js
echo "Menjalankan npm install..."
npm install

# 6. Build aplikasi React (PENTING agar tidak blank putih di aaPanel)
echo "Membangun (build) aplikasi React..."
npm run build

# 7. Restart atau Start PM2 Server backend ColorRush
echo "Me-restart PM2 Server ColorRush..."
pm2 reload colorrush-server || pm2 start backend/index.js --name colorrush-server

echo "=== DEPLOYMENT SELESAI DENGAN SUKSES ==="
