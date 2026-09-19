import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Pastikan direktori data ada
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Atomic file write helper to prevent data corruption
function safeWriteJSON(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function safeReadJSON(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) {
      safeWriteJSON(filePath, defaultVal);
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[DB] Error reading ${filePath}:`, err.message);
    return defaultVal;
  }
}

// Password hashing using Node.js crypto.scrypt
function hashPassword(password, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, actualSalt, 64);
  return `${actualSalt}:${key.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

// Calculate player tier badge based on total points
export function calculateTier(points = 0) {
  if (points >= 5000) return { name: 'Grandmaster', badge: '👑', color: 'from-amber-400 to-rose-500' };
  if (points >= 2500) return { name: 'Diamond', badge: '💎', color: 'from-cyan-400 to-blue-500' };
  if (points >= 1200) return { name: 'Platinum', badge: '🛡️', color: 'from-emerald-400 to-teal-500' };
  if (points >= 500) return { name: 'Gold', badge: '⭐', color: 'from-amber-300 to-yellow-500' };
  if (points >= 150) return { name: 'Silver', badge: '🥈', color: 'from-slate-300 to-slate-400' };
  return { name: 'Bronze', badge: '🥉', color: 'from-orange-400 to-amber-700' };
}

// Shop items catalog: Profile Borders & Username Borders
export const SHOP_CATALOG = {
  profileBorders: [
    {
      id: 'default',
      name: 'Classic Standard',
      description: 'Bingkai standar klasik bersih tanpa efek tambahan.',
      price: 0,
      gradient: 'from-slate-700 to-slate-800',
      badge: '⚪',
    },
    {
      id: 'neon_cyber',
      name: 'Cyber Matrix',
      description: 'Cahaya neon cyan & magenta futuristik berdenyut.',
      price: 100,
      gradient: 'from-cyan-400 via-sky-500 to-fuchsia-500',
      badge: '⚡',
    },
    {
      id: 'toxic_biohazard',
      name: 'Toxic Biohazard',
      description: 'Pendaran cairan kimia hijau radioaktif pekat.',
      price: 150,
      gradient: 'from-emerald-400 via-lime-400 to-green-600',
      badge: '☣️',
    },
    {
      id: 'flame_inferno',
      name: 'Inferno Flare',
      description: 'Kobaran api crimson-oranye yang membara garang.',
      price: 200,
      gradient: 'from-rose-500 via-orange-500 to-amber-400',
      badge: '🔥',
    },
    {
      id: 'cosmic_nebula',
      name: 'Cosmic Void',
      description: 'Aura galaksi luar angkasa ungu berbintang mistis.',
      price: 300,
      gradient: 'from-purple-500 via-indigo-500 to-pink-500',
      badge: '🌌',
    },
    {
      id: 'golden_royalty',
      name: 'Royal Sovereign',
      description: 'Kemewahan emas murni bertabur permata juara.',
      price: 350,
      gradient: 'from-amber-300 via-yellow-400 to-amber-600',
      badge: '👑',
    },
    {
      id: 'rainbow_rgb',
      name: 'Chroma RGB Wave',
      description: 'Spektrum animasi gelombang pelangi legendaris.',
      price: 500,
      gradient: 'from-rose-500 via-amber-400 via-emerald-400 via-sky-400 to-purple-500',
      badge: '🌈',
    },
  ],
  usernameBorders: [
    {
      id: 'default',
      name: 'Clean Minimal',
      description: 'Plat nama sederhana tanpa efek khusus.',
      price: 0,
      gradient: 'from-slate-800 to-slate-900',
      badge: '⚪',
    },
    {
      id: 'plate_cyber',
      name: 'Cyber Runner',
      description: 'Garis plat neon cyan sudut presisi hi-tech.',
      price: 100,
      gradient: 'from-cyan-500 to-blue-600',
      badge: '⚡',
    },
    {
      id: 'plate_toxic',
      name: 'Acid Venom',
      description: 'Aksen plat hijau racun beracun menyala.',
      price: 150,
      gradient: 'from-emerald-500 to-lime-600',
      badge: '☣️',
    },
    {
      id: 'plate_flame',
      name: 'Blaze Crest',
      description: 'Aksen plat membara merah api sang petarung.',
      price: 200,
      gradient: 'from-rose-600 to-orange-500',
      badge: '🔥',
    },
    {
      id: 'plate_cosmic',
      name: 'Celestial Aura',
      description: 'Plat bercahaya nebula ungu kosmik elegan.',
      price: 300,
      gradient: 'from-purple-600 to-indigo-600',
      badge: '🌌',
    },
    {
      id: 'plate_gold',
      name: 'Golden Sovereign',
      description: 'Plat emas bertahta kehormatan para master Uno.',
      price: 350,
      gradient: 'from-amber-400 via-yellow-300 to-amber-500',
      badge: '👑',
    },
    {
      id: 'plate_rainbow',
      name: 'Rainbow Prism',
      description: 'Plat holografik warna pelangi spektakuler.',
      price: 500,
      gradient: 'from-pink-500 via-purple-500 via-indigo-500 to-cyan-400',
      badge: '🌈',
    },
  ],
};

class Database {
  constructor() {
    this.loadAll();
  }

  loadUsers() {
    this.users = safeReadJSON(USERS_FILE, []);
    return this.users;
  }

  loadSessions() {
    this.sessions = safeReadJSON(SESSIONS_FILE, {});
    return this.sessions;
  }

  loadHistory() {
    this.history = safeReadJSON(HISTORY_FILE, []);
    return this.history;
  }

  loadAll() {
    this.loadUsers();
    this.loadSessions();
    this.loadHistory();
  }

  saveUsers() {
    safeWriteJSON(USERS_FILE, this.users);
  }

  saveSessions() {
    safeWriteJSON(SESSIONS_FILE, this.sessions);
  }

  saveHistory() {
    safeWriteJSON(HISTORY_FILE, this.history);
  }

  // Find user by username or email (case-insensitive)
  findUserByIdentifier(identifier) {
    if (!identifier || typeof identifier !== 'string') return null;
    this.loadUsers();
    const clean = identifier.trim().toLowerCase();
    return this.users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    ) || null;
  }

  findUserById(id) {
    this.loadUsers();
    return this.users.find((u) => u.id === id) || null;
  }

  // Create new user
  createUser({ username, email, password, avatar = 'crown' }) {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    if (this.users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error('Username sudah digunakan. Silakan pilih username lain.');
    }
    if (this.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
    }

    const newUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      avatar: avatar || 'crown',
      totalPoints: 0,
      allTimePoints: 0,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      unlockedProfileBorders: ['default'],
      activeProfileBorder: 'default',
      unlockedUsernameBorders: ['default'],
      activeUsernameBorder: 'default',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveUsers();

    return this.sanitizeUser(newUser);
  }

  // Authenticate user with password
  authenticate(identifier, password) {
    const user = this.findUserByIdentifier(identifier);
    if (!user) {
      throw new Error('Akun dengan username atau email tersebut tidak ditemukan.');
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Kata sandi yang kamu masukkan salah.');
    }

    return this.sanitizeUser(user);
  }

  // Session token management
  createSession(userId) {
    const token = `cr_${crypto.randomBytes(32).toString('hex')}`;
    this.sessions[token] = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    this.saveSessions();
    return token;
  }

  getUserByToken(token) {
    if (!token || !this.sessions[token]) return null;
    const session = this.sessions[token];
    if (Date.now() > session.expiresAt) {
      delete this.sessions[token];
      this.saveSessions();
      return null;
    }
    const user = this.findUserById(session.userId);
    return user ? this.sanitizeUser(user) : null;
  }

  deleteSession(token) {
    if (token && this.sessions[token]) {
      delete this.sessions[token];
      this.saveSessions();
      return true;
    }
    return false;
  }

  // Update profile (avatar, username)
  updateProfile(userId, { avatar, username }) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanName = username.trim();
      if (this.users.some((u) => u.id !== userId && u.username.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error('Username baru sudah digunakan.');
      }
      user.username = cleanName;
    }

    if (avatar) {
      user.avatar = avatar;
    }

    this.saveUsers();
    return this.sanitizeUser(user);
  }

  // Match History & Points Record
  addMatchHistory(userId, matchData) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    const pointsEarned = Math.max(0, parseInt(matchData.pointsEarned, 10) || 0);
    const isWin = matchData.result === 'win';

    // Update user stats
    user.totalPoints = (user.totalPoints || 0) + pointsEarned;
    user.allTimePoints = (user.allTimePoints || 0) + pointsEarned;
    user.totalMatches = (user.totalMatches || 0) + 1;
    if (isWin) {
      user.wins = (user.wins || 0) + 1;
    } else {
      user.losses = (user.losses || 0) + 1;
    }
    this.saveUsers();

    // Create history item
    const historyItem = {
      id: `match_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      playedAt: new Date().toISOString(),
      gameMode: matchData.gameMode || 'solo', // 'solo' | 'multiplayer'
      result: isWin ? 'win' : 'loss',
      pointsEarned,
      roundScore: matchData.roundScore || 0,
      opponents: Array.isArray(matchData.opponents) ? matchData.opponents : [],
      cardsLeft: typeof matchData.cardsLeft === 'number' ? matchData.cardsLeft : 0,
    };

    this.history.unshift(historyItem);
    // Keep max 500 history records globally to bound memory/disk
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }
    this.saveHistory();

    return {
      updatedUser: this.sanitizeUser(user),
      historyItem,
    };
  }

  getUserHistory(userId, limit = 50) {
    return this.history
      .filter((h) => h.userId === userId)
      .slice(0, limit);
  }

  getShopCatalog() {
    return SHOP_CATALOG;
  }

  buyItem(userId, itemType, itemId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    if (!Array.isArray(user.unlockedProfileBorders)) user.unlockedProfileBorders = ['default'];
    if (!Array.isArray(user.unlockedUsernameBorders)) user.unlockedUsernameBorders = ['default'];

    let item = null;
    let unlockedList = null;
    let activeKey = null;

    if (itemType === 'profile_border') {
      item = SHOP_CATALOG.profileBorders.find((i) => i.id === itemId);
      unlockedList = user.unlockedProfileBorders;
      activeKey = 'activeProfileBorder';
    } else if (itemType === 'username_border') {
      item = SHOP_CATALOG.usernameBorders.find((i) => i.id === itemId);
      unlockedList = user.unlockedUsernameBorders;
      activeKey = 'activeUsernameBorder';
    } else {
      throw new Error('Tipe item toko tidak valid.');
    }

    if (!item) throw new Error('Item toko tidak ditemukan.');
    if (unlockedList.includes(itemId)) {
      throw new Error('Item ini sudah kamu miliki!');
    }

    const currentPoints = user.totalPoints || 0;
    if (currentPoints < item.price) {
      throw new Error(`Poin tidak cukup! Harga item ini ${item.price} Pts, saldo kamu ${currentPoints} Pts.`);
    }

    // Deduct points and add to unlocked
    user.totalPoints = currentPoints - item.price;
    unlockedList.push(itemId);
    user[activeKey] = itemId; // Auto equip newly purchased item

    this.saveUsers();
    return this.sanitizeUser(user);
  }

  equipItem(userId, itemType, itemId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    if (!Array.isArray(user.unlockedProfileBorders)) user.unlockedProfileBorders = ['default'];
    if (!Array.isArray(user.unlockedUsernameBorders)) user.unlockedUsernameBorders = ['default'];

    if (itemType === 'profile_border') {
      if (!user.unlockedProfileBorders.includes(itemId)) {
        throw new Error('Kamu belum memiliki border profile ini.');
      }
      user.activeProfileBorder = itemId;
    } else if (itemType === 'username_border') {
      if (!user.unlockedUsernameBorders.includes(itemId)) {
        throw new Error('Kamu belum memiliki border username ini.');
      }
      user.activeUsernameBorder = itemId;
    } else {
      throw new Error('Tipe item toko tidak valid.');
    }

    this.saveUsers();
    return this.sanitizeUser(user);
  }

  sanitizeUser(user) {
    const { passwordHash, ...safe } = user;
    this.loadHistory();
    // Sum of all points ever earned from match history
    const historyPointsSum = (this.history || [])
      .filter((h) => h.userId === safe.id)
      .reduce((acc, h) => acc + (parseInt(h.pointsEarned, 10) || 0), 0);

    const allTimePoints = Math.max(
      safe.allTimePoints || 0,
      safe.totalPoints || 0,
      historyPointsSum
    );

    // Keep user's allTimePoints property synced
    if (user.allTimePoints !== allTimePoints) {
      user.allTimePoints = allTimePoints;
    }

    const tier = calculateTier(allTimePoints);
    const winRate = safe.totalMatches > 0
      ? Math.round((safe.wins / safe.totalMatches) * 100)
      : 0;

    const unlockedProfileBorders = Array.isArray(safe.unlockedProfileBorders) && safe.unlockedProfileBorders.length > 0
      ? safe.unlockedProfileBorders
      : ['default'];
    const activeProfileBorder = safe.activeProfileBorder || 'default';
    const unlockedUsernameBorders = Array.isArray(safe.unlockedUsernameBorders) && safe.unlockedUsernameBorders.length > 0
      ? safe.unlockedUsernameBorders
      : ['default'];
    const activeUsernameBorder = safe.activeUsernameBorder || 'default';

    return {
      ...safe,
      allTimePoints,
      tier,
      winRate,
      unlockedProfileBorders,
      activeProfileBorder,
      unlockedUsernameBorders,
      activeUsernameBorder,
    };
  }

  // Get Leaderboard rankings (points or winRate)
  getLeaderboard(sortBy = 'points', limit = 50, currentUserId = null) {
    this.loadUsers();
    const sanitized = this.users.map((u) => this.sanitizeUser(u));

    let pool = [];
    if (sortBy === 'winRate') {
      // Tetap masukkan SEMUA user di database agar list lengkap, dengan prioritas kualifikasi >= 3 matches
      pool = [...sanitized];
      pool.sort((a, b) => {
        const aExp = (a.totalMatches || 0) >= 3 ? 1 : 0;
        const bExp = (b.totalMatches || 0) >= 3 ? 1 : 0;
        if (bExp !== aExp) return bExp - aExp; // Pemain berkualifikasi (min. 3 match) diprioritaskan
        if ((b.winRate || 0) !== (a.winRate || 0)) return (b.winRate || 0) - (a.winRate || 0);
        if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        return (b.allTimePoints || 0) - (a.allTimePoints || 0);
      });
    } else {
      // Default: allTimePoints (seluruh poin yang pernah didapatkan) DESC, wins DESC, winRate DESC
      pool = [...sanitized];
      pool.sort((a, b) => {
        if ((b.allTimePoints || 0) !== (a.allTimePoints || 0)) return (b.allTimePoints || 0) - (a.allTimePoints || 0);
        if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        return (b.winRate || 0) - (a.winRate || 0);
      });
    }

    // Attach 1-based ranks
    const rankedList = pool.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    // Find current user's rank if requested
    let currentUserRank = null;
    if (currentUserId) {
      const found = rankedList.find((p) => p.id === currentUserId);
      if (found) {
        currentUserRank = found;
      } else {
        const user = this.findUserById(currentUserId);
        if (user) {
          currentUserRank = {
            ...this.sanitizeUser(user),
            rank: 0, // Belum terkualifikasi dalam kategori ini
          };
        }
      }
    }

    return {
      category: sortBy,
      leaderboard: rankedList.slice(0, Math.max(1, limit)),
      currentUserRank,
      totalPlayers: pool.length,
    };
  }
}

export const db = new Database();
