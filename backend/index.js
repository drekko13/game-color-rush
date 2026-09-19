import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { db } from './db.js';

const app = express();
const server = http.createServer(app);

// CORS: whitelist only known origins; VITE_FRONTEND_URL env var for custom domains
const ALLOWED_ORIGINS = [
  'https://game-color-rush.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];
if (process.env.VITE_FRONTEND_URL) ALLOWED_ORIGINS.push(process.env.VITE_FRONTEND_URL);

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile apps in WebView)
      if (!origin || ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
  },
});

// Per-socket rate limiting: track last play_card timestamp
const socketLastPlay = new Map(); // socketId -> timestamp
const playerDisconnectTimers = new Map(); // playerId -> Timeout
const PLAY_RATE_LIMIT_MS = 200; // minimum 200ms between play_card events
const VALID_COLORS = new Set(['crimson', 'ocean', 'toxic', 'solar']);

// Input validators
function isValidString(v, maxLen = 64) {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}

// Load .env secara otomatis jika file .env ada (didukung langsung di Node.js 20+)
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // .env opsional jika env var sudah diset via environment / PM2
}

const PORT = process.env.PORT || 9001;

// Normalize multiple slashes in URLs (e.g. //api/auth/register -> /api/auth/register)
app.use((req, res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

// Health check endpoint (buka http://IP:9001 untuk verifikasi server berjalan)
app.use(express.json());

// Express CORS headers for HTTP beacon / endpoints
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Authentication middleware for Express API routes
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.query.token || req.headers['x-auth-token']);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Sesi tidak ditemukan atau belum login.' });
  }
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Sesi login telah kedaluwarsa. Silakan login kembali.' });
  }
  req.user = user;
  req.token = token;
  next();
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'ColorRush Realtime Server',
    version: '1.0.0',
    connections: io.engine.clientsCount || 0,
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// --- AUTH & HISTORY REST API ENDPOINTS ---

// Register new user (Username, Email, Password, Avatar)
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, avatar } = req.body || {};
    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 25) {
      return res.status(400).json({ success: false, error: 'Username harus terdiri dari 3 hingga 25 karakter.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ success: false, error: 'Username hanya boleh berisi huruf, angka, dan garis bawah (_).' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Format email tidak valid.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Kata sandi minimal 6 karakter.' });
    }

    const user = db.createUser({ username, email, password, avatar: avatar || 'crown' });
    const token = db.createSession(user.id);
    return res.status(201).json({ success: true, token, user });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || 'Gagal mendaftar.' });
  }
});

// Login with email OR username + password
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Masukkan username atau email kamu.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Masukkan kata sandi kamu.' });
    }

    const user = db.authenticate(identifier, password);
    const token = db.createSession(user.id);
    return res.json({ success: true, token, user });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message || 'Gagal masuk.' });
  }
});

// Get current logged-in user profile & stats
app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// Logout session
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : req.query.token;
  if (token) db.deleteSession(token);
  return res.json({ success: true, message: 'Berhasil keluar.' });
});

// Update profile
app.post('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const { avatar, username } = req.body || {};
    const updatedUser = db.updateProfile(req.user.id, { avatar, username });
    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Save match history & points when game ends
app.post('/api/history', requireAuth, (req, res) => {
  try {
    const { gameMode, result, pointsEarned, roundScore, opponents, cardsLeft } = req.body || {};
    const recordResult = db.addMatchHistory(req.user.id, {
      gameMode,
      result,
      pointsEarned,
      roundScore,
      opponents,
      cardsLeft,
    });
    return res.json({
      success: true,
      user: recordResult.updatedUser,
      historyItem: recordResult.historyItem,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Get user's match history
app.get('/api/history', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = db.getUserHistory(req.user.id, limit);
    return res.json({ success: true, history });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// --- SHOP & COSMETICS REST API ENDPOINTS ---

// Get shop catalog (Profile borders & Username borders)
app.get('/api/shop/items', (req, res) => {
  return res.json({ success: true, catalog: db.getShopCatalog() });
});

// Buy item with points
app.post('/api/shop/buy', requireAuth, (req, res) => {
  try {
    const { itemType, itemId } = req.body || {};
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, error: 'Parameter itemType dan itemId wajib diisi.' });
    }
    const updatedUser = db.buyItem(req.user.id, itemType, itemId);
    return res.json({
      success: true,
      message: 'Item berhasil dibeli dan dipasang!',
      user: updatedUser,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Equip item
app.post('/api/shop/equip', requireAuth, (req, res) => {
  try {
    const { itemType, itemId } = req.body || {};
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, error: 'Parameter itemType dan itemId wajib diisi.' });
    }
    const updatedUser = db.equipItem(req.user.id, itemType, itemId);
    return res.json({
      success: true,
      message: 'Item berhasil dipasang!',
      user: updatedUser,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// --- LEADERBOARD REST API ENDPOINT ---
// Get global leaderboard with category ('points' or 'winRate')
app.get('/api/leaderboard', (req, res) => {
  try {
    const sortBy = req.query.sortBy === 'winRate' ? 'winRate' : 'points';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    // Optional user identification via auth token
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.query.token || req.headers['x-auth-token']);

    if (token) {
      const user = db.getUserByToken(token);
      if (user) {
        currentUserId = user.id;
      }
    }

    const leaderboardResult = db.getLeaderboard(sortBy, limit, currentUserId);
    return res.json({
      success: true,
      ...leaderboardResult,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal memuat papan peringkat.' });
  }
});

// --- CARD ENGINE DATA & HELPERS ---
const COLORS = ['crimson', 'ocean', 'toxic', 'solar'];

function createFullDeck() {
  const cards = [];
  let idCounter = 1;

  for (const color of COLORS) {
    cards.push({ id: `card-${idCounter++}`, color, value: '0', label: '0', type: 'number', scoreValue: 0 });

    for (let num = 1; num <= 9; num++) {
      const valStr = num.toString();
      for (let copy = 0; copy < 2; copy++) {
        cards.push({ id: `card-${idCounter++}`, color, value: valStr, label: valStr, type: 'number', scoreValue: num });
      }
    }

    for (let copy = 0; copy < 2; copy++) {
      cards.push({ id: `card-${idCounter++}`, color, value: 'HALT', label: 'HALT', type: 'action', scoreValue: 20 });
      cards.push({ id: `card-${idCounter++}`, color, value: 'REWIND', label: 'REWIND', type: 'action', scoreValue: 20 });
      cards.push({ id: `card-${idCounter++}`, color, value: 'BURST_2', label: 'BURST +2', type: 'action', scoreValue: 20 });
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push({ id: `card-${idCounter++}`, color: 'wild', value: 'SPECTRUM', label: 'SPECTRUM', type: 'wild', scoreValue: 50 });
    cards.push({ id: `card-${idCounter++}`, color: 'wild', value: 'INFERNO_4', label: 'INFERNO +4', type: 'wild', scoreValue: 50 });
  }

  return shuffleDeck(cards);
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isValidPlay(card, topDiscard, activeColor, stackCount = 0) {
  if (!topDiscard) return true;
  if (stackCount > 0) {
    return isValidStackPlay(card, topDiscard, stackCount);
  }
  if (card.color === 'wild') return true;
  if (activeColor && card.color === activeColor) return true;
  if (topDiscard.color === card.color) return true;
  if (topDiscard.value === card.value) return true;
  return false;
}

function isValidStackPlay(card, topDiscard, stackCount) {
  if (stackCount <= 0 || !topDiscard) return false;
  if (topDiscard.value === 'BURST_2') {
    return card.value === 'BURST_2' || card.value === 'INFERNO_4';
  }
  if (topDiscard.value === 'INFERNO_4') {
    return card.value === 'INFERNO_4';
  }
  return false;
}

function chooseBotCard(hand, topDiscard, activeColor, stackCount = 0) {
  if (stackCount > 0) {
    const stackCards = hand.filter((c) => isValidStackPlay(c, topDiscard, stackCount));
    if (stackCards.length === 0) return null;
    const burst2 = stackCards.find((c) => c.value === 'BURST_2');
    if (burst2) return burst2;
    return stackCards[0];
  }

  const playable = hand.filter((c) => isValidPlay(c, topDiscard, activeColor, 0));
  if (playable.length === 0) return null;

  const actionCards = playable.filter((c) => c.type === 'action' && c.color === activeColor);
  if (actionCards.length > 0) return actionCards[Math.floor(Math.random() * actionCards.length)];

  const colorMatches = playable.filter((c) => c.type === 'number' && c.color === activeColor);
  if (colorMatches.length > 0) return colorMatches.sort((a, b) => b.scoreValue - a.scoreValue)[0];

  const valueMatches = playable.filter((c) => c.value === topDiscard.value && c.color !== 'wild');
  if (valueMatches.length > 0) return valueMatches[0];

  return playable[0];
}

function chooseBotColor(hand) {
  const counts = { crimson: 0, ocean: 0, toxic: 0, solar: 0 };
  hand.forEach((c) => {
    if (c.color !== 'wild') counts[c.color]++;
  });
  let best = 'crimson';
  let max = -1;
  for (const c of COLORS) {
    if (counts[c] > max) {
      max = counts[c];
      best = c;
    }
  }
  return best;
}

// --- ROOMS & MATCHMAKING STORAGE ---
const rooms = new Map(); // roomId -> RoomState
let matchmakingQueue = []; // array of { socketId, user: { name, avatar } }
let matchmakingTimer = null;

const BOT_TEMPLATES = [
  { name: 'Blaze Bot', avatar: 'flame', personality: 'Aggressive & Bold' },
  { name: 'Cyber Surge', avatar: 'bot', personality: 'Strategic & Calm' },
  { name: 'Neon Bloom', avatar: 'sparkles', personality: 'Tricky & Playful' },
];

function initGameInRoom(room) {
  let deck = createFullDeck();
  const players = [];

  // Add all human players in lobby
  room.lobbyPlayers.forEach((hp, idx) => {
    const pId = hp.socketId || `player_${idx}_${Date.now()}`;
    const isPlayerHost = Boolean(
      hp.isHost ||
      idx === 0 ||
      (room.hostClientId && hp.clientPlayerId === room.hostClientId) ||
      (room.hostId && hp.socketId === room.hostId)
    );
    players.push({
      id: pId,
      socketId: hp.socketId,
      clientPlayerId: hp.clientPlayerId || hp.socketId,
      name: hp.name || `Player ${idx + 1}`,
      originalName: hp.name || `Player ${idx + 1}`,
      avatar: hp.avatar || 'crown',
      profileBorder: hp.profileBorder || 'default',
      usernameBorder: hp.usernameBorder || 'default',
      isBot: false,
      isDisconnected: false,
      isHost: isPlayerHost,
      position: ['bottom', 'left', 'top', 'right'][idx],
      hand: [],
      hasCalledRush: false,
      drinkPenaltyCount: 0,
    });
  });

  // Fill remaining slots up to targetCount with bots (supports 2, 3, or 4 players)
  const targetCount = Math.max(2, Math.min(4, room.maxPlayers || 4));
  let botIdx = 0;
  while (players.length < targetCount) {
    const b = BOT_TEMPLATES[botIdx % BOT_TEMPLATES.length];
    players.push({
      id: `bot-${botIdx}-${Date.now()}`,
      socketId: null,
      name: b.name,
      avatar: b.avatar,
      profileBorder: 'default',
      usernameBorder: 'default',
      isBot: true,
      position: 'top',
      hand: [],
      hasCalledRush: false,
      drinkPenaltyCount: 0,
    });
    botIdx++;
  }

  // Deal 7 cards to each player
  for (let i = 0; i < 7; i++) {
    for (const p of players) {
      const card = deck.pop();
      if (card) p.hand.push(card);
    }
  }

  // Official UNO (unorules.com): Wild Draw 4 cannot be the starting card.
  let initialCard = null;
  while (!initialCard) {
    const cand = deck.pop();
    if (!cand) break;
    if (cand.value === 'INFERNO_4') {
      deck.unshift(cand);
      deck = shuffleDeck(deck);
    } else {
      initialCard = cand;
    }
  }
  if (!initialCard) {
    initialCard = { id: 'initial-card-fallback', color: 'crimson', value: '7', label: '7', type: 'number', scoreValue: 7 };
  }

  const discardPile = [
    {
      ...initialCard,
      rotation: Math.random() * 8 - 4,
      offsetX: 0,
      offsetY: 0,
    },
  ];

  let activeColor = initialCard.color === 'wild' ? 'crimson' : initialCard.color;
  let turnDirection = 'clockwise';
  let currentTurnIndex = 0;
  let gamePhase = 'playing';

  // First card action effects
  if (initialCard.value === 'SPECTRUM') {
    gamePhase = 'color_picker';
  } else if (initialCard.value === 'BURST_2') {
    for (let k = 0; k < 2; k++) {
      const c = deck.pop();
      if (c) players[0].hand.push(c);
    }
    currentTurnIndex = 1;
  } else if (initialCard.value === 'HALT') {
    currentTurnIndex = 1;
  } else if (initialCard.value === 'REWIND') {
    turnDirection = 'counter-clockwise';
    currentTurnIndex = players.length - 1;
  }

  room.deck = deck;
  room.discardPile = discardPile;
  room.activeColor = activeColor;
  room.turnDirection = turnDirection;
  room.players = players;
  room.currentTurnIndex = currentTurnIndex;
  room.gamePhase = gamePhase;
  room.winner = null;
  room.rushDuel = null;
  room.stackCount = 0;
  room.rematchReadyPlayers = new Set();
  room.status = 'playing';
  room.logs = [
    {
      id: `log-${Date.now()}`,
      text: `Match started! Top card is ${initialCard.label} (${activeColor.toUpperCase()}).`,
      color: activeColor,
      timestamp: Date.now(),
    },
  ];
}

// Broadcast public rooms list
function broadcastPublicRooms() {
  const publicList = [];
  for (const [, r] of rooms.entries()) {
    if (r.isPublic && r.status === 'waiting' && r.lobbyPlayers.length < r.maxPlayers) {
      const host = r.lobbyPlayers.find((p) => p.isHost) || r.lobbyPlayers[0];
      publicList.push({
        roomId: r.roomId,
        hostName: host ? host.name : 'Host',
        hostAvatar: host ? host.avatar : 'crown',
        playerCount: r.lobbyPlayers.length,
        maxPlayers: r.maxPlayers,
        status: r.status,
      });
    }
  }
  io.emit('public_rooms_update', publicList);
}

// Broadcast room lobby status (before game starts)
function broadcastLobbyState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const lobbyData = {
    roomId: room.roomId,
    hostId: room.hostId,
    hostClientId: room.hostClientId,
    players: room.lobbyPlayers,
    status: room.status,
    isPublic: room.isPublic,
    maxPlayers: room.maxPlayers,
  };

  io.to(roomId).emit('room_lobby_update', lobbyData);
  broadcastPublicRooms();
}

// Send synchronized in-game state to all players in a room
function broadcastRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  const total = room.players.length;

  for (const p of room.players) {
    if (!p.isBot && p.socketId) {
      const myIdx = room.players.findIndex((pl) => pl.id === p.id);

      const sanitizedPlayers = room.players.map((other, idx) => {
        let mappedPos = 'top';
        if (other.id === p.id) {
          mappedPos = 'bottom';
        } else if (total === 2) {
          mappedPos = 'top';
        } else if (total === 3) {
          const offset = (idx - myIdx + total) % total;
          mappedPos = offset === 1 ? 'left' : 'right';
        } else {
          // 4 players
          const offset = (idx - myIdx + total) % total;
          mappedPos = ['bottom', 'left', 'top', 'right'][offset];
        }

        const isOtherHost = Boolean(
          other.isHost ||
          (room.hostClientId && other.clientPlayerId === room.hostClientId) ||
          (room.hostId && other.socketId === room.hostId) ||
          (idx === 0 && !other.isBot)
        );

        return {
          id: other.id,
          clientPlayerId: other.clientPlayerId || other.id,
          name: other.name,
          avatar: other.avatar,
          profileBorder: other.profileBorder || 'default',
          usernameBorder: other.usernameBorder || 'default',
          isBot: Boolean(other.isBot),
          isDisconnected: Boolean(other.isDisconnected || other.isAway),
          isAway: Boolean(other.isAway),
          isLeft: Boolean(other.isLeft),
          isHost: isOtherHost,
          position: mappedPos,
          hand:
            other.id === p.id
              ? other.hand
              : other.hand.map((c) => ({
                id: c.id,
                color: 'wild',
                value: '0',
                label: '',
                type: 'wild',
                scoreValue: 0,
              })),
          hasCalledRush: Boolean(other.hasCalledRush),
          drinkPenaltyCount: other.drinkPenaltyCount || 0,
          roundScore: other.roundScore || 0,
          matchScore: other.matchScore || 0,
        };
      });

      io.to(p.socketId).emit('game_state_sync', {
        roomId: room.roomId,
        discardPile: room.discardPile,
        activeColor: room.activeColor,
        turnDirection: room.turnDirection,
        players: sanitizedPlayers,
        currentTurnIndex: room.currentTurnIndex,
        gamePhase: room.gamePhase,
        winner: room.winner
          ? {
            id: room.winner.id,
            name: room.winner.name,
            avatar: room.winner.avatar,
            isBot: Boolean(room.winner.isBot),
            isHost: Boolean(room.winner.isHost),
            roundScore: room.winner.roundScore || 0,
            matchScore: room.winner.matchScore || 0,
          }
          : null,
        rushDuel: room.rushDuel,
        logs: room.logs.slice(0, 20),
        myPlayerId: p.id,
        stackCount: room.stackCount || 0,
        rematchReadyPlayers: Array.from(room.rematchReadyPlayers || []),
      });
    }
  }
}

function advanceRoomTurn(room, steps = 1) {
  if (room.gamePhase !== 'playing') return;

  const total = room.players.length;
  if (total === 0) return;

  const offset = room.turnDirection === 'clockwise' ? steps : -steps;
  let nextIndex = (room.currentTurnIndex + offset + total * 10) % total;

  // Skip departed players in turn order (only players who actually left the room)
  let loopCount = 0;
  while (room.players[nextIndex]?.isLeft && loopCount < total) {
    nextIndex = (nextIndex + (room.turnDirection === 'clockwise' ? 1 : -1) + total * 10) % total;
    loopCount++;
  }

  room.currentTurnIndex = nextIndex;
  broadcastRoomState(room.roomId);

  const nextPlayer = room.players[room.currentTurnIndex];
  if (nextPlayer && nextPlayer.isBot && !nextPlayer.isLeft) {
    triggerServerBotTurn(room);
  }
}

function triggerServerBotTurn(room) {
  if (room.botTimeout) clearTimeout(room.botTimeout);

  room.botTimeout = setTimeout(() => {
    const currentP = room.players[room.currentTurnIndex];
    if (!currentP || !currentP.isBot || room.gamePhase !== 'playing') return;

    const top = room.discardPile[room.discardPile.length - 1];
    const cardToPlay = chooseBotCard(currentP.hand, top, room.activeColor, room.stackCount || 0);

    if (cardToPlay) {
      serverPlayCard(room, currentP.id, cardToPlay.id);
    } else {
      serverDrawCard(room, currentP.id);
    }
  }, 1200);
}

function serverPlayCard(room, playerId, cardId) {
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return;

  const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return;
  const card = currentPlayer.hand[cardIndex];

  const topDiscard = room.discardPile[room.discardPile.length - 1];
  if (!isValidPlay(card, topDiscard, room.activeColor, room.stackCount || 0)) return;

  currentPlayer.hand.splice(cardIndex, 1);

  const newDiscard = {
    ...card,
    rotation: Math.random() * 24 - 12,
    offsetX: Math.random() * 12 - 6,
    offsetY: Math.random() * 12 - 6,
  };
  room.discardPile.push(newDiscard);

  if (card.color !== 'wild') {
    room.activeColor = card.color;
  }

  if (currentPlayer.hand.length === 0) {
    room.gamePhase = 'game_over';

    // Calculate hand score of all opponents per official Uno rules
    let roundPoints = 0;
    room.players.forEach((p) => {
      if (p.id !== currentPlayer.id && Array.isArray(p.hand)) {
        p.roundScore = p.hand.reduce((sum, c) => sum + (c.scoreValue || 0), 0);
        roundPoints += p.roundScore;
      } else {
        p.roundScore = 0;
      }
    });

    currentPlayer.roundScore = roundPoints;
    currentPlayer.matchScore = (currentPlayer.matchScore || 0) + roundPoints;

    room.winner = currentPlayer;
    room.rematchReadyPlayers = new Set();
    room.logs.unshift({
      id: `log-${Date.now()}`,
      text: `${currentPlayer.name} MENANG RONDE INI (+${roundPoints} Poin UNO)!`,
      timestamp: Date.now(),
    });
    broadcastRoomState(room.roomId);
    return;
  }

  if (currentPlayer.hand.length === 1 && !currentPlayer.hasCalledRush) {
    room.rushDuel = {
      targetPlayerId: currentPlayer.id,
      targetPlayerName: currentPlayer.name,
      isHumanTarget: !currentPlayer.isBot,
      expiresAt: Date.now() + 2400,
      durationMs: 2400,
    };

    if (room.rushTimeout) clearTimeout(room.rushTimeout);
    room.rushTimeout = setTimeout(() => {
      if (room.rushDuel && room.rushDuel.targetPlayerId === currentPlayer.id) {
        serverCatchRush(room, currentPlayer.id);
      }
    }, 2400);
  }

  if (card.value === 'SPECTRUM' || card.value === 'INFERNO_4') {
    if (card.value === 'INFERNO_4') {
      room.stackCount = (room.stackCount || 0) + 4;
    }
    if (currentPlayer.isBot) {
      const best = chooseBotColor(currentPlayer.hand);
      room.activeColor = best;
      advanceRoomTurn(room, 1);
    } else {
      room.gamePhase = 'color_picker';
      broadcastRoomState(room.roomId);
    }
    return;
  }

  if (card.value === 'REWIND') {
    room.turnDirection = room.turnDirection === 'clockwise' ? 'counter-clockwise' : 'clockwise';
    advanceRoomTurn(room, 1);
    return;
  }

  if (card.value === 'HALT') {
    advanceRoomTurn(room, 2);
    return;
  }

  // Official UNO Stacking Rule: +2 stacks on +2
  if (card.value === 'BURST_2') {
    room.stackCount = (room.stackCount || 0) + 2;
    room.logs.unshift({
      id: `log-${Date.now()}`,
      text: `${currentPlayer.name} menumpuk BURST +2! (Total Stack: +${room.stackCount} Kartu)`,
      color: card.color,
      timestamp: Date.now(),
    });
    advanceRoomTurn(room, 1);
    return;
  }

  advanceRoomTurn(room, 1);
}

function serverDrawCard(room, playerId) {
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return;

  // 1. If stack penalty is active, player draws total stack and turn is skipped!
  if (room.stackCount && room.stackCount > 0) {
    const stack = room.stackCount;
    room.stackCount = 0;
    serverInflictPenalty(room, currentPlayer.id, stack, 'burst_2');
    return;
  }

  if (room.deck.length === 0) {
    if (room.discardPile.length <= 1) {
      advanceRoomTurn(room, 1);
      return;
    }
    const top = room.discardPile.pop();
    room.deck = shuffleDeck(room.discardPile);
    room.discardPile = [top];
  }

  const drawn = room.deck.pop();
  if (!drawn) {
    advanceRoomTurn(room, 1);
    return;
  }

  currentPlayer.hand.push(drawn);
  currentPlayer.hasCalledRush = false;

  // 2. Official UNO Force Play
  // "If you draw a playable card, it will be played automatically."
  const topDiscard = room.discardPile[room.discardPile.length - 1];
  if (isValidPlay(drawn, topDiscard, room.activeColor, 0)) {
    room.logs.unshift({
      id: `log-${Date.now()}`,
      text: `${currentPlayer.name} menarik kartu cocok (${drawn.label}) dan otomatis memainkannya (Force Play)!`,
      timestamp: Date.now(),
    });
    broadcastRoomState(room.roomId);
    setTimeout(() => {
      serverPlayCard(room, currentPlayer.id, drawn.id);
    }, 350);
  } else {
    room.logs.unshift({
      id: `log-${Date.now()}`,
      text: `${currentPlayer.name} menarik kartu (tidak cocok, giliran selesai).`,
      timestamp: Date.now(),
    });
    advanceRoomTurn(room, 1);
  }
}

function serverInflictPenalty(room, targetPlayerId, count, type) {
  const target = room.players.find((p) => p.id === targetPlayerId);
  if (!target) return;

  // CRITICAL FIX: Send penalty_event FIRST so animation starts immediately on all clients.
  // Do NOT broadcast game_state_sync before this — that would cause a re-render collision
  // on mobile (JS thread blocked by heavy state update, killing the missile animation).
  io.to(room.roomId).emit('penalty_event', {
    targetPlayerId,
    cardsCount: count,
    type,
  });

  // After 450ms (missile landing time), add cards to hand then broadcast final state.
  // Both rush_penalty and regular penalties now use the same safe 450ms window.
  setTimeout(() => {
    for (let i = 0; i < count; i++) {
      if (room.deck.length === 0 && room.discardPile.length > 1) {
        const top = room.discardPile.pop();
        room.deck = shuffleDeck(room.discardPile);
        room.discardPile = [top];
      }
      const c = room.deck.pop();
      if (c) target.hand.push(c);
    }
    target.hasCalledRush = false;
    target.drinkPenaltyCount += 1;

    if (type === 'rush_penalty') {
      broadcastRoomState(room.roomId);
    } else {
      advanceRoomTurn(room, 2); // advanceRoomTurn calls broadcastRoomState internally
    }
  }, 450);
}

function serverCatchRush(room, targetPlayerId) {
  if (room.rushTimeout) clearTimeout(room.rushTimeout);
  room.rushDuel = null;
  serverInflictPenalty(room, targetPlayerId, 2, 'rush_penalty');
}

// Handle player leaving or disconnecting from an active multiplayer match
function handlePlayerDeparture(room, departingPlayer, reason = 'left') {
  if (!room || room.status !== 'playing' || !departingPlayer) return;

  console.log(`[Multiplayer] Player ${departingPlayer.name} (${departingPlayer.id}) departed from room ${room.roomId} (reason: ${reason})`);

  // Clear any pending disconnect timer
  if (playerDisconnectTimers.has(departingPlayer.id)) {
    clearTimeout(playerDisconnectTimers.get(departingPlayer.id));
    playerDisconnectTimers.delete(departingPlayer.id);
  }

  // 1. Mark player as permanently departed
  departingPlayer.isDisconnected = true;
  departingPlayer.isLeft = true;
  departingPlayer.socketId = null;
  if (room.rematchReadyPlayers) {
    room.rematchReadyPlayers.delete(departingPlayer.id);
  }

  // Remove departing player from lobby players list
  room.lobbyPlayers = room.lobbyPlayers.filter(
    (lp) =>
      (departingPlayer.socketId ? lp.socketId !== departingPlayer.socketId : true) &&
      (departingPlayer.clientPlayerId ? lp.clientPlayerId !== departingPlayer.clientPlayerId : true)
  );

  // 2. Safely return departing player's cards into the draw deck and shuffle
  if (departingPlayer.hand && departingPlayer.hand.length > 0) {
    room.deck.push(...departingPlayer.hand);
    room.deck = shuffleDeck(room.deck);
    departingPlayer.hand = [];
  }

  // 3. Re-assign Host if departing player was host
  const wasHost = Boolean(
    room.hostId === departingPlayer.socketId ||
    (room.hostClientId && departingPlayer.clientPlayerId && room.hostClientId === departingPlayer.clientPlayerId) ||
    departingPlayer.isHost
  );
  if (wasHost) {
    const nextHost = room.players.find((pl) => !pl.isBot && !pl.isDisconnected && pl.socketId);
    if (nextHost) {
      room.hostId = nextHost.socketId;
      room.hostClientId = nextHost.clientPlayerId;
      nextHost.isHost = true;
      const nextLobbyHost = room.lobbyPlayers.find(
        (lp) =>
          (nextHost.socketId && lp.socketId === nextHost.socketId) ||
          (nextHost.clientPlayerId && lp.clientPlayerId === nextHost.clientPlayerId)
      );
      if (nextLobbyHost) nextLobbyHost.isHost = true;
    }
  }

  // 4. Cancel any active rush duel involving departing player
  if (room.rushDuel && room.rushDuel.targetPlayerId === departingPlayer.id) {
    if (room.rushTimeout) clearTimeout(room.rushTimeout);
    room.rushDuel = null;
  }

  // If match was in color_picker because departing player played wild, restore to playing
  if (room.gamePhase === 'color_picker') {
    room.gamePhase = 'playing';
    if (!room.activeColor || room.activeColor === 'wild') {
      room.activeColor = 'crimson';
    }
  }

  // 5. Count active human players remaining in the room (those who have not departed)
  const remainingHumans = room.players.filter(
    (pl) => !pl.isBot && !pl.isLeft
  );

  // CASE 1: No human players left in room -> delete room
  if (remainingHumans.length === 0) {
    console.log(`[Multiplayer] All human players left room ${room.roomId}. Deleting room.`);
    if (room.botTimeout) clearTimeout(room.botTimeout);
    if (room.rushTimeout) clearTimeout(room.rushTimeout);
    rooms.delete(room.roomId);
    broadcastPublicRooms();
    return;
  }

  // CASE 2: Exactly 1 human player remains
  // (In 2-player match when 1 leaves, OR 3-4 player match when down to 2 and 1 leaves)
  // The player who stayed in the room WINS by default!
  if (remainingHumans.length === 1) {
    const winnerPlayer = remainingHumans[0];
    room.gamePhase = 'game_over';
    winnerPlayer.roundScore = 50;
    winnerPlayer.matchScore = (winnerPlayer.matchScore || 0) + 50;
    room.winner = winnerPlayer;
    if (room.rushTimeout) clearTimeout(room.rushTimeout);
    room.rushDuel = null;
    if (room.botTimeout) clearTimeout(room.botTimeout);
    if (room.rematchReadyPlayers) room.rematchReadyPlayers.clear();

    room.logs.unshift({
      id: `log-${Date.now()}`,
      text: `${departingPlayer.name} keluar dari room. ${winnerPlayer.name} MENANG sebagai pemain yang bertahan! 🏆`,
      color: 'solar',
      timestamp: Date.now(),
    });

    broadcastRoomState(room.roomId);
    broadcastLobbyState(room.roomId);
    return;
  }

  // CASE 3: 2 or more human players still remain (e.g. started with 3 or 4 players)
  // Continue playing between remaining players!
  room.logs.unshift({
    id: `log-${Date.now()}`,
    text: `${departingPlayer.name} keluar dari room. Pertandingan tetap berlanjut! (Sisa ${remainingHumans.length} pemain)`,
    color: 'ocean',
    timestamp: Date.now(),
  });

  // If it was the departing player's turn, advance immediately to next active player!
  if (room.players[room.currentTurnIndex]?.id === departingPlayer.id) {
    advanceRoomTurn(room, 1);
  } else {
    broadcastRoomState(room.roomId);
  }
}

// Broadcast total live online connected users
function broadcastOnlineCount() {
  const count = io.engine.clientsCount || (io.sockets && io.sockets.sockets ? io.sockets.sockets.size : 1);
  io.emit('online_users_count', { count });
}

// --- SOCKET.IO EVENT HANDLERS ---
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  broadcastOnlineCount();

  socket.on('get_online_count', () => {
    broadcastOnlineCount();
  });

  // Quick Matchmaking
  socket.on('join_matchmaking', (userData) => {
    matchmakingQueue = matchmakingQueue.filter((q) => q.socketId !== socket.id);
    matchmakingQueue.push({ socketId: socket.id, user: userData });

    socket.emit('matchmaking_status', {
      inQueue: true,
      queueCount: matchmakingQueue.length,
    });

    if (matchmakingQueue.length >= 2) {
      if (matchmakingTimer) clearTimeout(matchmakingTimer);
      matchmakingTimer = setTimeout(() => {
        launchMatchFromQueue();
      }, 3000);
    }
  });

  socket.on('leave_matchmaking', () => {
    matchmakingQueue = matchmakingQueue.filter((q) => q.socketId !== socket.id);
    socket.emit('matchmaking_status', { inQueue: false, queueCount: 0 });
  });

  // 1. Create Room (Private or Public, with custom maxPlayers: 2, 3, or 4)
  socket.on('create_room', (userData) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    socket.join(roomId);

    const isPublic = Boolean(userData && userData.isPublic);
    const maxPlayers = Math.max(2, Math.min(4, Number(userData && userData.maxPlayers) || 4));
    const hostName = (userData && userData.name && userData.name.trim()) ? userData.name.trim() : 'Player 1';
    const hostAvatar = (userData && userData.avatar) ? userData.avatar : 'crown';
    const clientPlayerId = (userData && userData.clientPlayerId) ? userData.clientPlayerId : socket.id;

    const room = {
      roomId,
      hostId: socket.id,
      hostClientId: clientPlayerId,
      status: 'waiting',
      isPublic,
      maxPlayers,
      lobbyPlayers: [
        {
          socketId: socket.id,
          clientPlayerId,
          name: hostName,
          avatar: hostAvatar,
          profileBorder: (userData && userData.profileBorder) ? userData.profileBorder : 'default',
          usernameBorder: (userData && userData.usernameBorder) ? userData.usernameBorder : 'default',
          isHost: true,
        },
      ],
      deck: [],
      discardPile: [],
      activeColor: 'crimson',
      turnDirection: 'clockwise',
      players: [],
      currentTurnIndex: 0,
      gamePhase: 'dealing',
      winner: null,
      rushDuel: null,
      rushTimeout: null,
      botTimeout: null,
      logs: [],
    };

    rooms.set(roomId, room);

    const lobbyData = {
      roomId,
      hostId: socket.id,
      players: room.lobbyPlayers,
      status: room.status,
      isPublic: room.isPublic,
      maxPlayers: room.maxPlayers,
    };

    console.log(`[Socket] Room created: ${roomId} (Public: ${isPublic}, Max: ${maxPlayers}) by ${hostName}`);

    socket.emit('room_created', { roomId, isHost: true, lobby: lobbyData });
    socket.emit('room_lobby_update', lobbyData);
    broadcastLobbyState(roomId);
  });

  // 2. Join Room (Private or Public)
  socket.on('join_room', ({ roomId, userData }) => {
    const code = (roomId || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('room_error', { message: 'Room tidak ditemukan! Pastikan kode room benar.' });
      return;
    }

    if (room.status === 'playing') {
      socket.emit('room_error', { message: 'Game di room ini sudah berlangsung!' });
      return;
    }

    if (room.lobbyPlayers.length >= (room.maxPlayers || 4)) {
      socket.emit('room_error', { message: `Room sudah penuh (maksimal ${room.maxPlayers || 4} pemain)!` });
      return;
    }

    socket.join(code);

    let guestName = (userData && userData.name && userData.name.trim())
      ? userData.name.trim()
      : `Player ${room.lobbyPlayers.length + 1}`;
    const guestAvatar = (userData && userData.avatar) ? userData.avatar : 'shield';
    const clientPlayerId = (userData && userData.clientPlayerId) ? userData.clientPlayerId : socket.id;

    // Disambiguate if joining player has identical name to existing lobby player
    const nameCollision = room.lobbyPlayers.some(
      (p) => p.socketId !== socket.id && p.clientPlayerId !== clientPlayerId && p.name.toLowerCase() === guestName.toLowerCase()
    );
    if (nameCollision) {
      guestName = `${guestName} (${room.lobbyPlayers.length + 1})`;
    }

    // Match by clientPlayerId OR socketId so reconnecting players/hosts preserve their exact slot!
    const existingIdx = room.lobbyPlayers.findIndex(
      (p) => (clientPlayerId && p.clientPlayerId === clientPlayerId) || p.socketId === socket.id
    );

    if (existingIdx === -1) {
      const isNewHost = Boolean(room.lobbyPlayers.length === 0 || (room.hostClientId && room.hostClientId === clientPlayerId));
      room.lobbyPlayers.push({
        socketId: socket.id,
        clientPlayerId,
        name: guestName,
        avatar: guestAvatar,
        profileBorder: (userData && userData.profileBorder) ? userData.profileBorder : 'default',
        usernameBorder: (userData && userData.usernameBorder) ? userData.usernameBorder : 'default',
        isHost: isNewHost,
      });
      if (isNewHost) {
        room.hostId = socket.id;
        room.hostClientId = clientPlayerId;
      }
    } else {
      room.lobbyPlayers[existingIdx].socketId = socket.id;
      room.lobbyPlayers[existingIdx].clientPlayerId = clientPlayerId;
      room.lobbyPlayers[existingIdx].name = guestName;
      room.lobbyPlayers[existingIdx].avatar = guestAvatar;
      if (userData && userData.profileBorder) room.lobbyPlayers[existingIdx].profileBorder = userData.profileBorder;
      if (userData && userData.usernameBorder) room.lobbyPlayers[existingIdx].usernameBorder = userData.usernameBorder;
      if (room.lobbyPlayers[existingIdx].isHost || existingIdx === 0 || room.hostClientId === clientPlayerId) {
        room.lobbyPlayers[existingIdx].isHost = true;
        room.hostId = socket.id;
        room.hostClientId = clientPlayerId;
      }
    }

    const isThisSocketHost = Boolean(
      room.hostId === socket.id ||
      (room.hostClientId && room.hostClientId === clientPlayerId) ||
      (room.lobbyPlayers[0]?.socketId === socket.id) ||
      (room.lobbyPlayers[0]?.clientPlayerId === clientPlayerId)
    );

    const lobbyData = {
      roomId: code,
      hostId: room.hostId,
      hostClientId: room.hostClientId,
      players: room.lobbyPlayers,
      status: room.status,
      isPublic: room.isPublic,
      maxPlayers: room.maxPlayers,
    };

    console.log(`[Socket] Player joined room ${code}: ${guestName} (${socket.id}). Host: ${room.hostId}. Players: ${room.lobbyPlayers.length}/${room.maxPlayers}`);

    // Send confirmation & full lobby data directly to joining socket
    socket.emit('room_joined', { roomId: code, isHost: isThisSocketHost, lobby: lobbyData });
    socket.emit('room_lobby_update', lobbyData);

    // Broadcast updated lobby list to ALL sockets in the room (Host + all Guests)
    io.to(code).emit('room_lobby_update', lobbyData);
    broadcastLobbyState(code);
  });

  // Random Match: Look for an open public room, or create one
  socket.on('random_match', (userData) => {
    for (const [code, r] of rooms.entries()) {
      if (r.isPublic && r.status === 'waiting' && r.lobbyPlayers.length < (r.maxPlayers || 4)) {
        console.log(`[Socket] Random match matched user ${socket.id} to open public room ${code}`);
        // Redirect client to join this room
        socket.emit('random_match_found', { roomId: code });
        return;
      }
    }

    // No available public room -> automatically create a public 4-player room!
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    socket.join(roomId);

    const hostName = (userData && userData.name && userData.name.trim()) ? userData.name.trim() : 'Player 1';
    const hostAvatar = (userData && userData.avatar) ? userData.avatar : 'crown';
    const clientPlayerId = (userData && userData.clientPlayerId) ? userData.clientPlayerId : socket.id;

    const room = {
      roomId,
      hostId: socket.id,
      hostClientId: clientPlayerId,
      status: 'waiting',
      isPublic: true,
      maxPlayers: 4,
      lobbyPlayers: [
        {
          socketId: socket.id,
          clientPlayerId,
          name: hostName,
          avatar: hostAvatar,
          profileBorder: (userData && userData.profileBorder) ? userData.profileBorder : 'default',
          usernameBorder: (userData && userData.usernameBorder) ? userData.usernameBorder : 'default',
          isHost: true,
        },
      ],
      deck: [],
      discardPile: [],
      activeColor: 'crimson',
      turnDirection: 'clockwise',
      players: [],
      currentTurnIndex: 0,
      gamePhase: 'dealing',
      winner: null,
      rushDuel: null,
      rushTimeout: null,
      botTimeout: null,
      logs: [],
    };

    rooms.set(roomId, room);

    const lobbyData = {
      roomId,
      hostId: socket.id,
      players: room.lobbyPlayers,
      status: room.status,
      isPublic: true,
      maxPlayers: 4,
    };

    console.log(`[Socket] Random match created new public room ${roomId} by ${hostName}`);

    socket.emit('room_created', { roomId, isHost: true, lobby: lobbyData });
    socket.emit('room_lobby_update', lobbyData);
    broadcastLobbyState(roomId);
  });

  // Request public rooms list
  socket.on('get_public_rooms', () => {
    const publicList = [];
    for (const [, r] of rooms.entries()) {
      if (r.isPublic && r.status === 'waiting' && r.lobbyPlayers.length < (r.maxPlayers || 4)) {
        const host = r.lobbyPlayers.find((p) => p.isHost) || r.lobbyPlayers[0];
        publicList.push({
          roomId: r.roomId,
          hostName: host ? host.name : 'Host',
          hostAvatar: host ? host.avatar : 'crown',
          playerCount: r.lobbyPlayers.length,
          maxPlayers: r.maxPlayers || 4,
          status: r.status,
        });
      }
    }
    socket.emit('public_rooms_update', publicList);
  });

  // Request latest lobby state
  socket.on('get_room_lobby', ({ roomId }) => {
    const code = (roomId || '').toUpperCase();
    const room = rooms.get(code);
    if (room) {
      const lobbyData = {
        roomId: code,
        hostId: room.hostId,
        hostClientId: room.hostClientId,
        players: room.lobbyPlayers,
        status: room.status,
        isPublic: room.isPublic,
        maxPlayers: room.maxPlayers,
      };
      socket.emit('room_lobby_update', lobbyData);
    }
  });

  // Leave room (Explicit forfeit or lobby exit)
  socket.on('leave_room', ({ roomId, clientPlayerId, isExplicitForfeit }) => {
    const code = (roomId || '').toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    if (room.status === 'waiting') {
      socket.leave(code);
      room.lobbyPlayers = room.lobbyPlayers.filter(
        (p) => p.socketId !== socket.id && (!clientPlayerId || p.clientPlayerId !== clientPlayerId)
      );
      if (room.lobbyPlayers.length === 0) {
        rooms.delete(code);
      } else {
        if (room.hostId === socket.id || (clientPlayerId && room.hostClientId === clientPlayerId)) {
          room.hostId = room.lobbyPlayers[0].socketId;
          room.hostClientId = room.lobbyPlayers[0].clientPlayerId;
          room.lobbyPlayers[0].isHost = true;
        }
        broadcastLobbyState(code);
      }
      broadcastPublicRooms();
    } else if (room.status === 'playing') {
      const departingPlayer = room.players.find(
        (pl) => pl.socketId === socket.id || (clientPlayerId && pl.clientPlayerId === clientPlayerId)
      );
      if (departingPlayer && !departingPlayer.isLeft) {
        if (isExplicitForfeit) {
          // Explicit forfeit: player clicked "Keluar Pertandingan" or "Menu Utama" and confirmed
          socket.leave(code);
          handlePlayerDeparture(room, departingPlayer, 'forfeit');
        } else {
          // Implicit leave / reload: do NOT immediately forfeit! Give 10s grace period for reconnection!
          console.log(`[Socket] Implicit leave_room for ${departingPlayer.name}. Activating 10s reconnection grace period.`);
          departingPlayer.isDisconnected = true;
          departingPlayer.socketId = null;
          broadcastRoomState(code);

          if (!playerDisconnectTimers.has(departingPlayer.id)) {
            const timer = setTimeout(() => {
              playerDisconnectTimers.delete(departingPlayer.id);
              const activeRoom = rooms.get(code);
              if (activeRoom && activeRoom.status === 'playing') {
                const targetP = activeRoom.players.find((pl) => pl.id === departingPlayer.id);
                if (targetP && !targetP.isLeft && !targetP.socketId) {
                  console.log(`[Socket] Player ${targetP.name} did not reconnect after 10s. Finalizing departure.`);
                  handlePlayerDeparture(activeRoom, targetP, 'timeout');
                }
              }
            }, 10000);
            playerDisconnectTimers.set(departingPlayer.id, timer);
          }
        }
      }
    }
  });

  // Player Away status (Tab switched or minimized, but tab still open)
  socket.on('player_away', ({ roomId, isAway }) => {
    const code = (roomId || '').toUpperCase();
    const room = rooms.get(code);
    if (!room || room.status !== 'playing') return;

    const p = room.players.find((pl) => pl.socketId === socket.id);
    if (!p || p.isLeft) return;

    const nowAway = Boolean(isAway);
    if (Boolean(p.isAway) === nowAway) return;

    p.isAway = nowAway;
    p.isDisconnected = nowAway;

    console.log(`[Socket] Player ${p.name} in room ${code} isAway: ${nowAway} (Status: ${nowAway ? 'Menunggu' : 'LIVE'})`);

    if (nowAway) {
      room.logs.unshift({
        id: `log-${Date.now()}`,
        text: `${p.name} sedang beralih tab. (Status: Menunggu)`,
        color: 'solar',
        timestamp: Date.now(),
      });
    } else {
      room.logs.unshift({
        id: `log-${Date.now()}`,
        text: `${p.name} kembali ke permainan!`,
        color: 'toxic',
        timestamp: Date.now(),
      });
    }

    broadcastRoomState(code);
  });

  // 3. Host Clicks "START GAME" / "MAIN LAGI"
  socket.on('start_room_game', ({ roomId, clientPlayerId }) => {
    const code = (roomId || '').toUpperCase();
    const room = rooms.get(code);

    if (!room) return;
    const isHostSocket = Boolean(
      room.hostId === socket.id ||
      (room.lobbyPlayers.length > 0 && room.lobbyPlayers[0].socketId === socket.id) ||
      (room.hostClientId && clientPlayerId && room.hostClientId === clientPlayerId) ||
      (room.hostClientId && room.lobbyPlayers.find((p) => p.socketId === socket.id)?.clientPlayerId === room.hostClientId) ||
      (room.players.length > 0 && room.players[0].socketId === socket.id)
    );

    if (!isHostSocket) {
      socket.emit('room_error', { message: 'Hanya Host yang dapat memulai permainan!' });
      return;
    }
    room.hostId = socket.id;

    // Rematch verification: all non-host connected human players must be ready
    if (room.gamePhase === 'game_over') {
      const otherHumans = room.players.filter(
        (p) => !p.isBot && !p.isDisconnected && p.socketId !== room.hostId
      );
      const allReady = otherHumans.every(
        (p) => room.rematchReadyPlayers && room.rematchReadyPlayers.has(p.id)
      );
      if (!allReady) {
        socket.emit('room_error', {
          message: 'Semua pemain dalam room harus menekan tombol Siap terlebih dahulu!',
        });
        return;
      }
    }

    if (room.rematchReadyPlayers) {
      room.rematchReadyPlayers.clear();
    }
    initGameInRoom(room);

    io.to(code).emit('room_game_started', { roomId: code });
    broadcastLobbyState(code);
    broadcastRoomState(code);
  });

  // 4. Rematch Ready status toggle
  socket.on('set_rematch_ready', ({ roomId, ready }) => {
    if (!isValidString(roomId)) return;
    const room = rooms.get(roomId.toUpperCase());
    if (!room || room.status !== 'playing' || room.gamePhase !== 'game_over') return;
    const p = room.players.find((pl) => pl.socketId === socket.id);
    if (!p) return;
    if (!room.rematchReadyPlayers) room.rematchReadyPlayers = new Set();
    if (ready) {
      room.rematchReadyPlayers.add(p.id);
    } else {
      room.rematchReadyPlayers.delete(p.id);
    }
    broadcastRoomState(room.roomId);
  });

  // In-Game Events
  socket.on('play_card', ({ roomId, cardId }) => {
    // Input validation
    if (!isValidString(roomId) || !isValidString(cardId)) return;
    // Rate limiting: prevent card spam (cheating / network retry floods)
    const now = Date.now();
    const lastPlay = socketLastPlay.get(socket.id) || 0;
    if (now - lastPlay < PLAY_RATE_LIMIT_MS) return;
    socketLastPlay.set(socket.id, now);

    const room = rooms.get(roomId.toUpperCase());
    if (room && room.status === 'playing') {
      const p = room.players.find((pl) => pl.socketId === socket.id);
      // Security: verify the card belongs to this player's hand before playing
      if (p && p.hand.some((c) => c.id === cardId)) {
        serverPlayCard(room, p.id, cardId);
      }
    }
  });

  socket.on('draw_card', ({ roomId }) => {
    if (!isValidString(roomId)) return;
    const room = rooms.get(roomId.toUpperCase());
    if (room && room.status === 'playing') {
      const p = room.players.find((pl) => pl.socketId === socket.id);
      if (p) serverDrawCard(room, p.id);
    }
  });

  socket.on('pass_turn', ({ roomId }) => {
    if (!isValidString(roomId)) return;
    const room = rooms.get(roomId.toUpperCase());
    if (room && room.status === 'playing') {
      const p = room.players.find((pl) => pl.socketId === socket.id);
      if (p && room.players[room.currentTurnIndex]?.id === p.id) {
        advanceRoomTurn(room, 1);
      }
    }
  });

  socket.on('select_wild_color', ({ roomId, color }) => {
    // Security: reject invalid color strings
    if (!isValidString(roomId) || !VALID_COLORS.has(color)) return;
    const room = rooms.get(roomId.toUpperCase());
    if (room && room.status === 'playing') {
      // Security: only the current player (who played the wild) can pick color
      const p = room.players.find((pl) => pl.socketId === socket.id);
      if (!p || room.players[room.currentTurnIndex]?.id !== p.id) return;
      if (room.gamePhase !== 'color_picker') return;

      room.activeColor = color;
      room.gamePhase = 'playing';
      advanceRoomTurn(room, 1);
    }
  });

  socket.on('call_rush', ({ roomId }) => {
    if (!isValidString(roomId)) return;
    const room = rooms.get(roomId.toUpperCase());
    if (room && room.status === 'playing') {
      const p = room.players.find((pl) => pl.socketId === socket.id);
      if (p && room.rushDuel && room.rushDuel.targetPlayerId === p.id) {
        if (room.rushTimeout) clearTimeout(room.rushTimeout);
        room.rushDuel = null;
        p.hasCalledRush = true;
        io.to(roomId).emit('rush_success', { playerId: p.id });
        broadcastRoomState(roomId);
      }
    }
  });

  socket.on('catch_rush', ({ roomId, targetPlayerId }) => {
    if (!isValidString(roomId) || !isValidString(targetPlayerId)) return;
    // Security: cannot catch yourself
    const room = rooms.get(roomId.toUpperCase());
    if (!room || room.status !== 'playing') return;
    const catcher = room.players.find((pl) => pl.socketId === socket.id);
    if (!catcher || catcher.id === targetPlayerId) return; // cannot catch yourself
    if (room.rushDuel && room.rushDuel.targetPlayerId === targetPlayerId) {
      serverCatchRush(room, targetPlayerId);
    }
  });

  // Reconnect to active room after refresh or lag
  socket.on('reconnect_room', ({ roomId, clientPlayerId, userData }) => {
    const code = (roomId || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      console.log(`[Socket] Reconnect failed: Room ${code} not found`);
      socket.emit('reconnect_failed', { message: 'Room tidak ditemukan atau sudah berakhir.' });
      return;
    }

    // 1. In active match
    if (room.status === 'playing') {
      const p = room.players.find(
        (pl) =>
          pl.socketId === socket.id ||
          (clientPlayerId && pl.clientPlayerId === clientPlayerId) ||
          (clientPlayerId && pl.id === clientPlayerId)
      );

      if (p) {
        if (playerDisconnectTimers.has(p.id)) {
          clearTimeout(playerDisconnectTimers.get(p.id));
          playerDisconnectTimers.delete(p.id);
        }

        p.socketId = socket.id;
        p.isDisconnected = false;
        p.isAway = false;
        p.isLeft = false;
        p.isBot = false;
        p.name = p.originalName || (userData && userData.name) || p.name.replace(' (AI)', '');
        if (userData && userData.avatar) p.avatar = userData.avatar;
        if (userData && userData.profileBorder) p.profileBorder = userData.profileBorder;
        if (userData && userData.usernameBorder) p.usernameBorder = userData.usernameBorder;

        room.logs.unshift({
          id: `log-${Date.now()}`,
          text: `${p.name} kembali tersambung ke permainan!`,
          color: 'toxic',
          timestamp: Date.now(),
        });

        const isPlayerHost = Boolean(
          p.isHost ||
          (room.hostClientId && room.hostClientId === clientPlayerId) ||
          (room.hostClientId && room.hostClientId === p.clientPlayerId) ||
          room.players[0]?.id === p.id
        );

        if (isPlayerHost) {
          p.isHost = true;
          room.hostId = socket.id;
          room.hostClientId = clientPlayerId || p.clientPlayerId;
        }

        // Also update lobbyPlayers to stay in sync
        const lp = room.lobbyPlayers.find(
          (l) => (clientPlayerId && l.clientPlayerId === clientPlayerId) || l.socketId === socket.id
        );
        if (lp) {
          lp.socketId = socket.id;
          if (isPlayerHost) lp.isHost = true;
        }

        socket.join(code);
        console.log(`[Socket] Player ${p.name} (${p.id}) successfully RECONNECTED to active match in room ${code}! Host: ${isPlayerHost}`);

        socket.emit('reconnect_success', { roomId: code, playerId: p.id, isHost: isPlayerHost });
        broadcastRoomState(code);
        return;
      }
    }

    // 2. In lobby
    if (room.status === 'waiting') {
      const lp = room.lobbyPlayers.find(
        (l) => (clientPlayerId && l.clientPlayerId === clientPlayerId) || l.socketId === socket.id
      );
      if (lp) {
        lp.socketId = socket.id;
        if (userData && userData.name) lp.name = userData.name;
        if (userData && userData.avatar) lp.avatar = userData.avatar;
        if (userData && userData.profileBorder) lp.profileBorder = userData.profileBorder;
        if (userData && userData.usernameBorder) lp.usernameBorder = userData.usernameBorder;
        socket.join(code);

        const isLpHost = Boolean(
          lp.isHost ||
          (room.hostClientId && room.hostClientId === clientPlayerId) ||
          room.lobbyPlayers[0] === lp
        );

        if (isLpHost) {
          lp.isHost = true;
          room.hostId = socket.id;
          room.hostClientId = clientPlayerId;
        }

        const lobbyData = {
          roomId: code,
          hostId: room.hostId,
          hostClientId: room.hostClientId,
          players: room.lobbyPlayers,
          status: room.status,
          isPublic: room.isPublic,
          maxPlayers: room.maxPlayers,
        };

        socket.emit('room_created', { roomId: code, isHost: isLpHost, lobby: lobbyData });
        broadcastLobbyState(code);
        return;
      }
    }

    socket.emit('reconnect_failed', { message: 'Data pemain tidak ditemukan di room ini.' });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    broadcastOnlineCount();
    matchmakingQueue = matchmakingQueue.filter((q) => q.socketId !== socket.id);

    for (const [rId, room] of rooms.entries()) {
      if (room.status === 'waiting') {
        // Wait 8s before dropping from lobby to allow quick refresh
        const lp = room.lobbyPlayers.find((p) => p.socketId === socket.id);
        if (lp) {
          setTimeout(() => {
            const currentRoom = rooms.get(rId);
            if (!currentRoom || currentRoom.status !== 'waiting') return;
            // Only drop if this exact player has NOT reconnected with an updated socket ID
            const stillDisconnected = currentRoom.lobbyPlayers.find(
              (p) => p.socketId === socket.id && p.clientPlayerId === lp.clientPlayerId
            );
            if (stillDisconnected) {
              currentRoom.lobbyPlayers = currentRoom.lobbyPlayers.filter((p) => p !== stillDisconnected);
              if (currentRoom.lobbyPlayers.length === 0) {
                rooms.delete(rId);
              } else {
                if (currentRoom.hostId === socket.id || currentRoom.hostClientId === lp.clientPlayerId) {
                  currentRoom.hostId = currentRoom.lobbyPlayers[0].socketId;
                  currentRoom.hostClientId = currentRoom.lobbyPlayers[0].clientPlayerId;
                  currentRoom.lobbyPlayers[0].isHost = true;
                }
                broadcastLobbyState(rId);
              }
            }
          }, 8000);
        }
      } else if (room.status === 'playing') {
        const p = room.players.find((pl) => pl.socketId === socket.id);
        if (p && !p.isLeft) {
          console.log(`[Socket] Player ${p.name} socket disconnected from room ${rId}. Fast 2.5s departure fallback active.`);
          p.isDisconnected = true;
          p.socketId = null;
          if (room.rematchReadyPlayers) {
            room.rematchReadyPlayers.delete(p.id);
          }

          if (playerDisconnectTimers.has(p.id)) {
            clearTimeout(playerDisconnectTimers.get(p.id));
            playerDisconnectTimers.delete(p.id);
          }

          // 10-second grace period: allows quick refresh (F5 / Reload) to reconnect without losing!
          // If player truly closed the tab or left, finalize departure after 10 seconds.
          broadcastRoomState(rId);

          const timer = setTimeout(() => {
            playerDisconnectTimers.delete(p.id);
            const activeRoom = rooms.get(rId);
            if (activeRoom && activeRoom.status === 'playing') {
              const targetP = activeRoom.players.find((pl) => pl.id === p.id);
              if (targetP && !targetP.isLeft && !targetP.socketId) {
                console.log(`[Socket] Player ${targetP.name} did not reconnect after 10s. Finalizing departure.`);
                handlePlayerDeparture(activeRoom, targetP, 'timeout');
              }
            }
          }, 10000);

          playerDisconnectTimers.set(p.id, timer);
        }
      }
    }
  });
});

function launchMatchFromQueue() {
  if (matchmakingQueue.length === 0) return;
  const matchPlayers = matchmakingQueue.splice(0, 4);
  const roomId = `MATCH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const room = {
    roomId,
    hostId: matchPlayers[0].socketId,
    status: 'playing',
    lobbyPlayers: matchPlayers.map((m) => ({
      socketId: m.socketId,
      clientPlayerId: (m.user && m.user.clientPlayerId) ? m.user.clientPlayerId : m.socketId,
      ...m.user,
    })),
    deck: [],
    discardPile: [],
    activeColor: 'crimson',
    turnDirection: 'clockwise',
    players: [],
    currentTurnIndex: 0,
    gamePhase: 'playing',
    winner: null,
    rushDuel: null,
    rushTimeout: null,
    botTimeout: null,
    logs: [],
  };

  initGameInRoom(room);
  rooms.set(roomId, room);

  matchPlayers.forEach((m) => {
    const s = io.sockets.sockets.get(m.socketId);
    if (s) {
      s.join(roomId);
      s.emit('match_found', { roomId });
    }
  });

  broadcastRoomState(roomId);
}

server.listen(PORT, () => {
  console.log(`[ColorRush Server] Node.js & Socket.io server running on http://localhost:${PORT}`);
  console.log(`[ColorRush Server] Health check: http://localhost:${PORT}/`);
});
