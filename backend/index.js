import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

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

// Health check endpoint (buka http://IP:9001 untuk verifikasi server berjalan)
app.use(express.json());
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'ColorRush Realtime Server',
    version: '1.0.0',
    connections: io.engine.clientsCount || 0,
    uptime: Math.floor(process.uptime()) + 's',
  });
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

function isValidPlay(card, topDiscard, activeColor) {
  if (!topDiscard) return true;
  if (card.color === 'wild') return true;
  if (activeColor && card.color === activeColor) return true;
  if (topDiscard.color === card.color) return true;
  if (topDiscard.value === card.value) return true;
  return false;
}

function chooseBotCard(hand, topDiscard, activeColor) {
  const playable = hand.filter((c) => isValidPlay(c, topDiscard, activeColor));
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
  const deck = createFullDeck();
  const players = [];

  // Add all human players in lobby
  room.lobbyPlayers.forEach((hp, idx) => {
    const pId = hp.socketId || `player_${idx}_${Date.now()}`;
    players.push({
      id: pId,
      socketId: hp.socketId,
      clientPlayerId: hp.clientPlayerId || hp.socketId,
      name: hp.name || `Player ${idx + 1}`,
      originalName: hp.name || `Player ${idx + 1}`,
      avatar: hp.avatar || 'crown',
      isBot: false,
      isDisconnected: false,
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

  // Find first non-wild card
  let discardIdx = deck.findIndex((c) => c.color !== 'wild');
  if (discardIdx === -1) discardIdx = 0;
  const [initialCard] = deck.splice(discardIdx, 1);

  const discardPile = [
    {
      ...initialCard,
      rotation: Math.random() * 8 - 4,
      offsetX: 0,
      offsetY: 0,
    },
  ];

  const activeColor = initialCard.color === 'wild' ? 'crimson' : initialCard.color;

  room.deck = deck;
  room.discardPile = discardPile;
  room.activeColor = activeColor;
  room.turnDirection = 'clockwise';
  room.players = players;
  room.currentTurnIndex = 0;
  room.gamePhase = 'playing';
  room.winner = null;
  room.rushDuel = null;
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

        return {
          ...other,
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
        winner: room.winner,
        rushDuel: room.rushDuel,
        logs: room.logs.slice(0, 20),
        myPlayerId: p.id,
      });
    }
  }
}

function advanceRoomTurn(room, steps = 1) {
  const total = room.players.length;
  const offset = room.turnDirection === 'clockwise' ? steps : -steps;
  room.currentTurnIndex = (room.currentTurnIndex + offset + total * 10) % total;

  broadcastRoomState(room.roomId);

  const nextPlayer = room.players[room.currentTurnIndex];
  if (nextPlayer && nextPlayer.isBot) {
    triggerServerBotTurn(room);
  }
}

function triggerServerBotTurn(room) {
  if (room.botTimeout) clearTimeout(room.botTimeout);

  room.botTimeout = setTimeout(() => {
    const currentP = room.players[room.currentTurnIndex];
    if (!currentP || !currentP.isBot || room.gamePhase !== 'playing') return;

    const top = room.discardPile[room.discardPile.length - 1];
    const cardToPlay = chooseBotCard(currentP.hand, top, room.activeColor);

    if (cardToPlay) {
      serverPlayCard(room, currentP.id, cardToPlay.id);
    } else {
      serverDrawCard(room, currentP.id);
      setTimeout(() => {
        const topNow = room.discardPile[room.discardPile.length - 1];
        const lastDrawn = currentP.hand[currentP.hand.length - 1];
        if (lastDrawn && isValidPlay(lastDrawn, topNow, room.activeColor)) {
          serverPlayCard(room, currentP.id, lastDrawn.id);
        } else {
          advanceRoomTurn(room, 1);
        }
      }, 700);
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
  if (!isValidPlay(card, topDiscard, room.activeColor)) return;

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
    room.winner = currentPlayer;
    room.logs.unshift({
      id: `log-${Date.now()}`,
      text: `${currentPlayer.name} PLAYED THEIR LAST CARD AND WON!`,
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
    if (currentPlayer.isBot) {
      const best = chooseBotColor(currentPlayer.hand);
      room.activeColor = best;
      if (card.value === 'INFERNO_4') {
        const total = room.players.length;
        const nextIdx = (room.currentTurnIndex + (room.turnDirection === 'clockwise' ? 1 : -1) + total * 10) % total;
        serverInflictPenalty(room, room.players[nextIdx].id, 4, 'inferno_4');
        return;
      }
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

  if (card.value === 'BURST_2') {
    const total = room.players.length;
    const nextIdx = (room.currentTurnIndex + (room.turnDirection === 'clockwise' ? 1 : -1) + total * 10) % total;
    serverInflictPenalty(room, room.players[nextIdx].id, 2, 'burst_2');
    return;
  }

  advanceRoomTurn(room, 1);
}

function serverDrawCard(room, playerId) {
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return;

  if (room.deck.length === 0) {
    if (room.discardPile.length <= 1) return;
    const top = room.discardPile.pop();
    room.deck = shuffleDeck(room.discardPile);
    room.discardPile = [top];
  }

  const drawn = room.deck.pop();
  if (drawn) {
    currentPlayer.hand.push(drawn);
    currentPlayer.hasCalledRush = false;
  }
  broadcastRoomState(room.roomId);
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
  serverInflictPenalty(room, targetPlayerId, 1, 'rush_penalty');
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
      (p) => p.socketId !== socket.id && p.name.toLowerCase() === guestName.toLowerCase()
    );
    if (nameCollision) {
      guestName = `${guestName} (${room.lobbyPlayers.length + 1})`;
    }

    // Only match by socketId so that joining guest sockets are ALWAYS assigned a new slot!
    const existingIdx = room.lobbyPlayers.findIndex((p) => p.socketId === socket.id);
    if (existingIdx === -1) {
      room.lobbyPlayers.push({
        socketId: socket.id,
        clientPlayerId,
        name: guestName,
        avatar: guestAvatar,
        isHost: false,
      });
    } else {
      room.lobbyPlayers[existingIdx].socketId = socket.id;
      room.lobbyPlayers[existingIdx].clientPlayerId = clientPlayerId;
      room.lobbyPlayers[existingIdx].name = guestName;
      room.lobbyPlayers[existingIdx].avatar = guestAvatar;
    }

    const lobbyData = {
      roomId: code,
      hostId: room.hostId,
      players: room.lobbyPlayers,
      status: room.status,
      isPublic: room.isPublic,
      maxPlayers: room.maxPlayers,
    };

    console.log(`[Socket] Player joined room ${code}: ${guestName} (${socket.id}). Players: ${room.lobbyPlayers.length}/${room.maxPlayers}`);

    // Send confirmation & full lobby data directly to joining socket
    socket.emit('room_joined', { roomId: code, isHost: room.hostId === socket.id, lobby: lobbyData });
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
        players: room.lobbyPlayers,
        status: room.status,
        isPublic: room.isPublic,
        maxPlayers: room.maxPlayers,
      };
      socket.emit('room_lobby_update', lobbyData);
    }
  });

  // Leave room
  socket.on('leave_room', ({ roomId }) => {
    const code = (roomId || '').toUpperCase();
    const room = rooms.get(code);
    if (room && room.status === 'waiting') {
      socket.leave(code);
      room.lobbyPlayers = room.lobbyPlayers.filter((p) => p.socketId !== socket.id);
      if (room.lobbyPlayers.length === 0) {
        rooms.delete(code);
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.lobbyPlayers[0].socketId;
          room.lobbyPlayers[0].isHost = true;
        }
        broadcastLobbyState(code);
      }
    }
  });

  // 3. Host Clicks "START GAME"
  socket.on('start_room_game', ({ roomId }) => {
    const code = (roomId || '').toUpperCase();
    const room = rooms.get(code);

    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('room_error', { message: 'Hanya Host yang dapat memulai permainan!' });
      return;
    }

    initGameInRoom(room);

    io.to(code).emit('room_game_started', { roomId: code });
    broadcastRoomState(code);
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
      const top = room.discardPile[room.discardPile.length - 1];
      if (top && top.value === 'INFERNO_4') {
        const total = room.players.length;
        const nextIdx = (room.currentTurnIndex + (room.turnDirection === 'clockwise' ? 1 : -1) + total * 10) % total;
        serverInflictPenalty(room, room.players[nextIdx].id, 4, 'inferno_4');
      } else {
        advanceRoomTurn(room, 1);
      }
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
          (clientPlayerId && pl.clientPlayerId === clientPlayerId && pl.isDisconnected) ||
          (pl.id === clientPlayerId && pl.isDisconnected)
      );

      if (p) {
        if (p.disconnectTimer) {
          clearTimeout(p.disconnectTimer);
          p.disconnectTimer = null;
        }

        p.socketId = socket.id;
        p.isDisconnected = false;
        p.isBot = false;
        p.name = p.originalName || (userData && userData.name) || p.name.replace(' (AI)', '');
        if (userData && userData.avatar) p.avatar = userData.avatar;

        socket.join(code);
        console.log(`[Socket] Player ${p.name} (${p.id}) successfully RECONNECTED to active match in room ${code}!`);

        socket.emit('reconnect_success', { roomId: code, playerId: p.id });
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
        socket.join(code);

        const lobbyData = {
          roomId: code,
          hostId: room.hostId,
          players: room.lobbyPlayers,
          status: room.status,
          isPublic: room.isPublic,
          maxPlayers: room.maxPlayers,
        };

        socket.emit('room_created', { roomId: code, isHost: lp.isHost, lobby: lobbyData });
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
            const stillDisconnected = currentRoom.lobbyPlayers.find((p) => p.socketId === socket.id);
            if (stillDisconnected) {
              currentRoom.lobbyPlayers = currentRoom.lobbyPlayers.filter((p) => p.socketId !== socket.id);
              if (currentRoom.lobbyPlayers.length === 0) {
                rooms.delete(rId);
              } else {
                if (currentRoom.hostId === socket.id) {
                  currentRoom.hostId = currentRoom.lobbyPlayers[0].socketId;
                  currentRoom.lobbyPlayers[0].isHost = true;
                }
                broadcastLobbyState(rId);
              }
            }
          }, 8000);
        }
      } else if (room.status === 'playing') {
        const p = room.players.find((pl) => pl.socketId === socket.id);
        if (p) {
          console.log(`[Socket] Player ${p.name} disconnected from room ${rId}. 60s reconnection window active.`);
          p.isDisconnected = true;
          p.socketId = null;
          broadcastRoomState(rId);

          if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
          p.disconnectTimer = setTimeout(() => {
            const activeRoom = rooms.get(rId);
            if (activeRoom && activeRoom.status === 'playing') {
              const targetP = activeRoom.players.find((pl) => pl.id === p.id);
              if (targetP && targetP.isDisconnected) {
                targetP.isBot = true;
                targetP.name = `${targetP.originalName || targetP.name} (AI)`;
                broadcastRoomState(rId);

                if (activeRoom.players[activeRoom.currentTurnIndex]?.id === targetP.id) {
                  triggerServerBotTurn(activeRoom);
                }
              }
            }
          }, 60000);

          // If currently disconnected player's turn, give 10 seconds before temporary AI turn
          if (room.players[room.currentTurnIndex]?.id === p.id) {
            setTimeout(() => {
              const activeRoom = rooms.get(rId);
              if (activeRoom && activeRoom.status === 'playing') {
                const targetP = activeRoom.players.find((pl) => pl.id === p.id);
                if (targetP && targetP.isDisconnected && activeRoom.players[activeRoom.currentTurnIndex]?.id === targetP.id) {
                  triggerServerBotTurn(activeRoom);
                }
              }
            }, 10000);
          }
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
