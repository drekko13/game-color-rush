import { create } from 'zustand';
import type {
  Card,
  CardColor,
  DiscardCardWithVisual,
  GameLogEntry,
  GameMode,
  GamePhase,
  PenaltyAnimationState,
  Player,
  PlayerPosition,
  RushDuelState,
  TurnDirection,
  UnoChallengeState,
  UserProfile,
  MatchHistoryItem,
  ShopCatalog,
  LeaderboardCategory,
  LeaderboardEntry,
} from '../types/game';
import {
  calculateHandScore,
  chooseBotCard,
  chooseBotColor,
  createFullDeck,
  isValidPlay,
  shouldBotChallengeWildDraw4,
  shuffleDeck,
} from '../game/deck';
import { soundFx } from '../audio/soundEffects';
import { socketService } from '../services/socket';
import { apiService } from '../services/api';

interface GameState {
  deck: Card[];
  discardPile: DiscardCardWithVisual[];
  activeColor: CardColor;
  turnDirection: TurnDirection;
  players: Player[];
  currentTurnIndex: number;
  gamePhase: GamePhase;
  winner: Player | null;

  // Stacking rule (ColorRush)
  stackCount: number;

  // Rematch ready state
  rematchReadyPlayers: string[];

  // Official Uno Scoring (500 pts target)
  targetScore: number;
  matchWinner: Player | null;
  roundScores: Record<string, number>;

  // Screen & Navigation
  currentScreen: import('../types/game').ScreenView;
  publicRooms: import('../types/game').PublicRoomItem[];
  setCurrentScreen: (screen: import('../types/game').ScreenView) => void;
  returnToMainMenu: () => void;
  fetchPublicRooms: () => void;
  joinRandomMatch: () => void;

  // Multiplayer fields
  gameMode: GameMode;
  roomId: string | null;
  myPlayerId: string | null;
  isSearchingMatch: boolean;
  queueCount: number;
  onlineCount: number;
  playerName: string;
  playerAvatar: string;
  roomLobby: import('../types/game').RoomLobbyState | null;
  isHost: boolean;

  // Visual & Penalty States
  penaltyState: PenaltyAnimationState | null;
  screenShake: 'none' | 'sm' | 'lg';
  activeColorPickerPlayerId: string | null;
  cardMissiles: {
    id: string;
    count: number;
    targetPosition: PlayerPosition;
  } | null;

  // Turn tracking & player state
  hasPlayerDrawnThisTurn: boolean;
  drawnCardId: string | null;
  rushCallGracePlayerId: string | null;
  rushDuel: RushDuelState | null;
  challengeState: UnoChallengeState | null;

  // Settings
  partyDrinkPenaltyEnabled: boolean;
  botSpeedMs: number;
  soundMuted: boolean;
  logs: GameLogEntry[];

  // Actions
  initGame: () => void;
  playCard: (playerId: string, cardId: string) => void;
  drawCard: (playerId: string) => void;
  passTurn: (playerId: string) => void;
  selectWildColor: (color: CardColor) => void;
  respondToChallenge: (acceptPenalty: boolean) => void;
  callRush: (playerId: string) => void;
  catchUncalledRush: (targetPlayerId: string) => void;
  togglePartyDrinkPenalty: () => void;
  toggleSound: () => void;
  setBotSpeed: (speed: 'fast' | 'normal' | 'relaxed') => void;
  clearPenalty: () => void;
  getNextPlayerIndex: (steps?: number, forcedDirection?: TurnDirection) => number;
  advanceTurn: (steps?: number, forcedDirection?: TurnDirection) => void;
  inflictDrawPenalty: (
    sourcePlayerId: string,
    targetPlayerId: string,
    count: number,
    type: 'burst_2' | 'inferno_4' | 'rush_penalty' | 'challenge_penalty' | 'challenge_failed' | 'stack_penalty'
  ) => void;
  triggerBotTurn: (botIndex: number) => void;

  // Multiplayer Actions
  setPlayerProfile: (name: string, avatar: string) => void;
  startSoloGame: () => void;
  startMatchmaking: () => void;
  cancelMatchmaking: () => void;
  createCustomRoom: (options?: { isPublic?: boolean; maxPlayers?: number }) => void;
  joinCustomRoom: (code: string) => void;
  startRoomGame: () => void;
  leaveRoom: () => void;
  toggleRematchReady: () => void;
  initMultiplayerSocket: () => void;

  // Auth & Account State
  authUser: UserProfile | null;
  authToken: string | null;
  matchHistory: MatchHistoryItem[];
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  isProfileModalOpen: boolean;
  lastGamePointsGained: number;
  lastGameSaved: boolean;

  // Auth Actions
  initAuth: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  registerUser: (username: string, email: string, password: string, avatar?: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  fetchMatchHistory: () => Promise<void>;
  recordGameResult: (matchData: {
    gameMode: 'solo' | 'multiplayer';
    result: 'win' | 'loss';
    pointsEarned: number;
    roundScore?: number;
    opponents: string[];
    cardsLeft: number;
  }) => Promise<void>;

  // Shop & Cosmetics State
  isShopModalOpen: boolean;
  shopCatalog: ShopCatalog | null;
  openShopModal: () => void;
  closeShopModal: () => void;
  fetchShopCatalog: () => Promise<void>;
  buyShopItem: (itemType: 'profile_border' | 'username_border', itemId: string) => Promise<void>;
  equipShopItem: (itemType: 'profile_border' | 'username_border', itemId: string) => Promise<void>;

  // Leaderboard State
  isLeaderboardOpen: boolean;
  leaderboardCategory: LeaderboardCategory;
  leaderboardEntries: LeaderboardEntry[];
  currentUserLeaderboardRank: LeaderboardEntry | null;
  isLeaderboardLoading: boolean;
  openLeaderboardModal: () => void;
  closeLeaderboardModal: () => void;
  setLeaderboardCategory: (category: LeaderboardCategory) => void;
  fetchLeaderboard: (category?: LeaderboardCategory) => Promise<void>;
}

const INITIAL_PLAYERS: Omit<Player, 'hand'>[] = [
  {
    id: 'p-0',
    name: 'You',
    isBot: false,
    avatar: 'crown',
    personality: 'Challenger',
    position: 'bottom',
    hasCalledRush: false,
    drinkPenaltyCount: 0,
    matchScore: 0,
  },
  {
    id: 'p-1',
    name: 'Blaze Bot',
    isBot: true,
    avatar: 'flame',
    personality: 'Aggressive & Bold',
    position: 'left',
    hasCalledRush: false,
    drinkPenaltyCount: 0,
    matchScore: 0,
  },
  {
    id: 'p-2',
    name: 'Cyber Surge',
    isBot: true,
    avatar: 'bot',
    personality: 'Strategic & Calm',
    position: 'top',
    hasCalledRush: false,
    drinkPenaltyCount: 0,
    matchScore: 0,
  },
  {
    id: 'p-3',
    name: 'Neon Bloom',
    isBot: true,
    avatar: 'sparkles',
    personality: 'Tricky & Playful',
    position: 'right',
    hasCalledRush: false,
    drinkPenaltyCount: 0,
    matchScore: 0,
  },
];

let botTurnTimeout: ReturnType<typeof setTimeout> | null = null;
let botWatchdogTimeout: ReturnType<typeof setTimeout> | null = null;
let rushGraceTimeout: ReturnType<typeof setTimeout> | null = null;
let wildDraw4BluffData: {
  wildPlayerId: string;
  colorBeforeWild: CardColor;
  isBluffing: boolean;
  matchingCards: Card[];
} | null = null;

export const generateRandomGuestProfile = () => {
  const randomNum = Math.floor(Math.random() * 899 + 100);
  const avatars = ['crown', 'flame', 'zap', 'bot', 'ghost', 'skull', 'shield', 'swords'];
  const profile = {
    name: `Player ${randomNum}`,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
  };
  try {
    sessionStorage.setItem('colorrush_name', profile.name);
    sessionStorage.setItem('colorrush_avatar', profile.avatar);
  } catch {}
  return profile;
};

const getInitialProfile = () => {
  try {
    const savedName = sessionStorage.getItem('colorrush_name');
    const savedAvatar = sessionStorage.getItem('colorrush_avatar');
    if (savedName) {
      return {
        name: savedName,
        avatar: savedAvatar || 'crown',
      };
    }
  } catch {}
  return generateRandomGuestProfile();
};

const defaultProfile = getInitialProfile();

const inMemoryTabId = 'client_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const getOrCreateClientId = () => {
  try {
    const activeMatch = getActiveMatch();
    if (activeMatch?.clientPlayerId) {
      return activeMatch.clientPlayerId;
    }
    let clientId = sessionStorage.getItem('colorrush_client_id');
    if (!clientId) {
      clientId = inMemoryTabId;
      sessionStorage.setItem('colorrush_client_id', clientId);
    }
    return clientId;
  } catch {
    return inMemoryTabId;
  }
};

const ACTIVE_MATCH_KEY = 'colorrush_active_match';

const saveActiveMatch = (roomId: string, clientPlayerId: string) => {
  try {
    sessionStorage.setItem(
      ACTIVE_MATCH_KEY,
      JSON.stringify({ roomId, clientPlayerId, timestamp: Date.now() })
    );
  } catch {}
};

const clearActiveMatch = () => {
  try {
    sessionStorage.removeItem(ACTIVE_MATCH_KEY);
  } catch {}
};

const getActiveMatch = (): { roomId: string; clientPlayerId: string; timestamp: number } | null => {
  try {
    const raw = sessionStorage.getItem(ACTIVE_MATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > 25 * 60 * 1000) {
      clearActiveMatch();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const activeMatchOnStartup = getActiveMatch();

export const useGameStore = create<GameState>((set, get) => ({
  deck: [],
  discardPile: [],
  activeColor: 'crimson',
  turnDirection: 'clockwise',
  players: [],
  currentTurnIndex: 0,
  gamePhase: 'dealing',
  winner: null,

  // Official Uno Scoring (500 pts target)
  targetScore: 500,
  matchWinner: null,
  roundScores: {},

  // Stacking rule state
  stackCount: 0,
  rematchReadyPlayers: [],

  currentScreen: activeMatchOnStartup ? 'game' : 'menu',
  publicRooms: [],

  gameMode: activeMatchOnStartup ? 'multiplayer' : 'solo',
  roomId: activeMatchOnStartup ? activeMatchOnStartup.roomId : null,
  myPlayerId: getOrCreateClientId(),
  isSearchingMatch: false,
  queueCount: 0,
  onlineCount: 1,
  playerName: defaultProfile.name,
  playerAvatar: defaultProfile.avatar,
  roomLobby: null,
  isHost: false,

  penaltyState: null,
  screenShake: 'none',
  activeColorPickerPlayerId: null,
  cardMissiles: null,

  hasPlayerDrawnThisTurn: false,
  drawnCardId: null,
  rushCallGracePlayerId: null,
  rushDuel: null,
  challengeState: null,

  partyDrinkPenaltyEnabled: true,
  botSpeedMs: 1100,
  soundMuted: false,
  logs: [],

  // Auth & Account Initial State
  authUser: null,
  authToken: null,
  matchHistory: [],
  isAuthLoading: false,
  isAuthModalOpen: false,
  authModalTab: 'login',
  isProfileModalOpen: false,
  lastGamePointsGained: 0,
  lastGameSaved: false,

  // Shop Initial State
  isShopModalOpen: false,
  shopCatalog: null,

  // Leaderboard Initial State
  isLeaderboardOpen: false,
  leaderboardCategory: 'points',
  leaderboardEntries: [],
  currentUserLeaderboardRank: null,
  isLeaderboardLoading: false,

  initGame: () => {
    if (botTurnTimeout) clearTimeout(botTurnTimeout);
    if (botWatchdogTimeout) clearTimeout(botWatchdogTimeout);
    if (rushGraceTimeout) clearTimeout(rushGraceTimeout);
    wildDraw4BluffData = null;

    const { playerName, playerAvatar, authUser } = get();

    let fullDeck = shuffleDeck(createFullDeck());
    const existingPlayers = get().players;
    const previousMatchWinner = get().matchWinner;
    const shouldResetMatchScore = previousMatchWinner !== null;

    const players: Player[] = INITIAL_PLAYERS.map((p, i) => {
      const existing = existingPlayers.find((ep) => ep.id === p.id);
      const prevMatchScore = shouldResetMatchScore ? 0 : (existing?.matchScore || 0);
      return {
        ...p,
        name: i === 0 ? playerName : p.name,
        avatar: i === 0 ? playerAvatar : p.avatar,
        profileBorder: i === 0 ? (authUser?.activeProfileBorder || 'default') : 'default',
        usernameBorder: i === 0 ? (authUser?.activeUsernameBorder || 'default') : 'default',
        hand: [],
        hasCalledRush: false,
        statusMessage: undefined,
        isThinking: false,
        drinkPenaltyCount: 0,
        matchScore: prevMatchScore,
        roundScore: 0,
      };
    });

    for (let i = 0; i < 7; i++) {
      for (const player of players) {
        const card = fullDeck.pop();
        if (card) player.hand.push(card);
      }
    }

    // Official UNO Rule (https://www.unorules.com/):
    // If the first card is a Wild Draw Four (INFERNO_4), return it to the draw pile,
    // shuffle the deck, and turn over a new card.
    let initialDiscardCard: Card | null = null;
    while (!initialDiscardCard) {
      const cand = fullDeck.pop();
      if (!cand) break;
      if (cand.value === 'INFERNO_4') {
        fullDeck.unshift(cand);
        fullDeck = shuffleDeck(fullDeck);
      } else {
        initialDiscardCard = cand;
      }
    }
    if (!initialDiscardCard) {
      initialDiscardCard = {
        id: 'initial-card-fallback',
        color: 'crimson',
        value: '7',
        label: '7',
        type: 'number',
        scoreValue: 7,
      };
    }

    const discardPile: DiscardCardWithVisual[] = [
      {
        ...initialDiscardCard,
        rotation: Math.random() * 8 - 4,
        offsetX: 0,
        offsetY: 0,
      },
    ];

    let activeColor: CardColor =
      initialDiscardCard.color === 'wild' ? 'crimson' : (initialDiscardCard.color as CardColor);
    let turnDirection: TurnDirection = 'clockwise';
    let currentTurnIndex = 0;
    let initialGamePhase: GamePhase = 'playing';
    let activeColorPickerPlayerId: string | null = null;
    const initialLogs: GameLogEntry[] = [
      {
        id: `log-${Date.now()}`,
        text: `Match dimulai! Kartu pembuka adalah ${initialDiscardCard.label} (${activeColor.toUpperCase()}).`,
        color: activeColor,
        timestamp: Date.now(),
      },
    ];

    // Official UNO First-Card Action Rules:
    if (initialDiscardCard.value === 'SPECTRUM') {
      // Wild: First player chooses what color to begin play
      initialGamePhase = 'color_picker';
      activeColorPickerPlayerId = players[0].id;
      initialLogs.push({
        id: `log-${Date.now()}-wild`,
        text: `Kartu Wild terbuka! ${players[0].name} memilih warna awal permainan.`,
        color: 'solar',
        timestamp: Date.now() + 1,
      });
    } else if (initialDiscardCard.value === 'BURST_2') {
      // Draw Two: First player draws 2 cards and misses their turn!
      const drawnCards: Card[] = [];
      for (let k = 0; k < 2; k++) {
        const c = fullDeck.pop();
        if (c) drawnCards.push(c);
      }
      players[0].hand.push(...drawnCards);
      players[0].statusMessage = '+2 KARTU (Draw Two Awal)';
      currentTurnIndex = 1; // First player skipped
      initialLogs.push({
        id: `log-${Date.now()}-d2`,
        text: `Kartu BURST +2 terbuka! ${players[0].name} harus mengambil 2 kartu dan gilirannya dilewati!`,
        color: 'crimson',
        timestamp: Date.now() + 1,
      });
    } else if (initialDiscardCard.value === 'HALT') {
      // Skip: First player loses turn, next player starts
      players[0].statusMessage = 'HALTED!';
      currentTurnIndex = 1;
      initialLogs.push({
        id: `log-${Date.now()}-halt`,
        text: `Kartu HALT terbuka! Giliran ${players[0].name} dilewati!`,
        color: 'crimson',
        timestamp: Date.now() + 1,
      });
    } else if (initialDiscardCard.value === 'REWIND') {
      // Reverse: Switch direction to counter-clockwise, player to dealer's right (last player) goes first
      turnDirection = 'counter-clockwise';
      currentTurnIndex = players.length - 1;
      initialLogs.push({
        id: `log-${Date.now()}-rewind`,
        text: `Kartu REWIND terbuka! Putaran dibalik ke berlawanan jarum jam; ${players[currentTurnIndex].name} jalan duluan!`,
        color: 'ocean',
        timestamp: Date.now() + 1,
      });
    }

    set({
      deck: fullDeck,
      discardPile,
      activeColor,
      turnDirection,
      players,
      currentTurnIndex,
      gamePhase: initialGamePhase,
      winner: null,
      matchWinner: shouldResetMatchScore ? null : previousMatchWinner,
      roundScores: {},
      gameMode: 'solo',
      roomId: null,
      myPlayerId: 'p-0',
      penaltyState: null,
      screenShake: 'none',
      activeColorPickerPlayerId,
      cardMissiles: null,
      hasPlayerDrawnThisTurn: false,
      drawnCardId: null,
      rushCallGracePlayerId: null,
      rushDuel: null,
      challengeState: null,
      stackCount: 0,
      rematchReadyPlayers: [],
      logs: initialLogs,
    });

    soundFx.playCardDraw();

    if (players[currentTurnIndex].isBot && initialGamePhase === 'playing') {
      setTimeout(() => {
        get().triggerBotTurn(currentTurnIndex);
      }, get().botSpeedMs);
    }
  },

  drawCard: (playerId: string) => {
    const { gameMode, roomId } = get();

    if (gameMode === 'multiplayer' && roomId) {
      socketService.drawCard(roomId);
      soundFx.playCardDraw();
      return;
    }

    const { players, currentTurnIndex, deck, discardPile, gamePhase, hasPlayerDrawnThisTurn, stackCount } = get();
    if (gamePhase !== 'playing') return;
    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return;

    // 1. If stack penalty is active, player must draw the entire accumulated stack!
    if (stackCount > 0) {
      set({ stackCount: 0 });
      get().inflictDrawPenalty('stack', playerId, stackCount, 'stack_penalty');
      return;
    }

    if (hasPlayerDrawnThisTurn) return;

    soundFx.playCardDraw();

    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    if (currentDeck.length === 0) {
      if (currentDiscard.length <= 1) {
        get().advanceTurn(1);
        return;
      }
      const topCard = currentDiscard.pop()!;
      const recycledCards: Card[] = currentDiscard.map((c) => ({
        id: c.id,
        color: c.color,
        value: c.value,
        label: c.label,
        type: c.type,
        scoreValue: c.scoreValue,
      }));
      currentDeck = shuffleDeck(recycledCards);
      currentDiscard = [topCard];
    }

    const drawnCard = currentDeck.pop();
    if (!drawnCard) {
      get().advanceTurn(1);
      return;
    }

    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          hand: [...p.hand, drawnCard],
          hasCalledRush: false,
        };
      }
      return p;
    });

    // 2. Official Rule (ColorRush) - Force Play:
    // "If you draw a playable card, it will be played automatically."
    const topCardNow = currentDiscard[currentDiscard.length - 1];
    const isPlayable = isValidPlay(drawnCard, topCardNow, get().activeColor, 0);

    if (isPlayable) {
      set((state) => ({
        deck: currentDeck,
        discardPile: currentDiscard,
        players: updatedPlayers,
        hasPlayerDrawnThisTurn: true,
        drawnCardId: drawnCard.id,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${currentPlayer.name} menarik kartu cocok (${drawnCard.label}) dan langsung memainkannya (Force Play)!`,
            color: drawnCard.color,
            timestamp: Date.now(),
          },
          ...state.logs.slice(0, 19),
        ],
      }));

      setTimeout(() => {
        const stateNow = get();
        if (stateNow.currentTurnIndex === currentTurnIndex && stateNow.gamePhase === 'playing') {
          get().playCard(currentPlayer.id, drawnCard.id);
        }
      }, 350);
    } else {
      set((state) => ({
        deck: currentDeck,
        discardPile: currentDiscard,
        players: updatedPlayers,
        hasPlayerDrawnThisTurn: true,
        drawnCardId: drawnCard.id,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${currentPlayer.name} menarik kartu (tidak cocok, giliran selesai).`,
            timestamp: Date.now(),
          },
          ...state.logs.slice(0, 19),
        ],
      }));

      setTimeout(() => {
        const stateNow = get();
        if (stateNow.currentTurnIndex === currentTurnIndex && stateNow.gamePhase === 'playing') {
          get().advanceTurn(1);
        }
      }, 450);
    }
  },

  passTurn: (playerId: string) => {
    const { gameMode, roomId } = get();

    if (gameMode === 'multiplayer' && roomId) {
      socketService.passTurn(roomId);
      return;
    }

    const { players, currentTurnIndex, gamePhase, hasPlayerDrawnThisTurn, deck } = get();
    if (gamePhase !== 'playing') return;
    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return;
    if (!hasPlayerDrawnThisTurn && deck.length > 0) return;

    get().advanceTurn();
  },

  playCard: (playerId: string, cardId: string) => {
    const { gameMode, roomId, discardPile, activeColor, players, currentTurnIndex } = get();

    if (gameMode === 'multiplayer' && roomId) {
      const currentPlayer = players[currentTurnIndex];
      const card = currentPlayer?.hand.find((c) => c.id === cardId);
      const topDiscard = discardPile[discardPile.length - 1];

      if (card && isValidPlay(card, topDiscard, activeColor)) {
        // 1. Optimistic local update so card leaves hand and lands on discard pile INSTANTLY (0ms!)
        const updatedHand = currentPlayer.hand.filter((c) => c.id !== cardId);
        const optimisticDiscard = {
          ...card,
          rotation: Math.random() * 20 - 10,
          offsetX: Math.random() * 8 - 4,
          offsetY: Math.random() * 8 - 4,
        };

        const nextActiveColor = card.color !== 'wild' ? card.color : activeColor;

        set((state) => ({
          discardPile: [...state.discardPile, optimisticDiscard],
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, hand: updatedHand } : p
          ),
          activeColor: nextActiveColor,
          gamePhase:
            card.value === 'SPECTRUM' || card.value === 'INFERNO_4'
              ? 'color_picker'
              : state.gamePhase,
          activeColorPickerPlayerId:
            card.value === 'SPECTRUM' || card.value === 'INFERNO_4' ? playerId : null,
        }));

        socketService.playCard(roomId, cardId);
        if (card.value === 'BURST_2') {
          soundFx.playBurst2();
        } else {
          soundFx.playCardPlay();
        }
      }
      return;
    }

    const {
      gamePhase,
      turnDirection,
      botSpeedMs,
      deck,
    } = get();

    if (gamePhase !== 'playing') return;
    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return;

    // Official Uno Rule: If player drew a card this turn, only that drawn card may be played
    if (get().hasPlayerDrawnThisTurn && get().drawnCardId !== cardId) {
      return;
    }

    const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;
    const cardToPlay = currentPlayer.hand[cardIndex];

    const topDiscard = discardPile[discardPile.length - 1];
    if (!isValidPlay(cardToPlay, topDiscard, activeColor, get().stackCount || 0)) {
      if (currentPlayer.isBot) {
        get().drawCard(currentPlayer.id);
      }
      return;
    }

    soundFx.playCardPlay();

    // Track Wild Draw 4 bluff legality before card leaves hand
    if (cardToPlay.value === 'INFERNO_4') {
      const matchingCards = currentPlayer.hand.filter(
        (c) => c.id !== cardId && c.color === activeColor
      );
      wildDraw4BluffData = {
        wildPlayerId: currentPlayer.id,
        colorBeforeWild: activeColor,
        isBluffing: matchingCards.length > 0,
        matchingCards,
      };
    } else {
      wildDraw4BluffData = null;
    }

    const randomRotation = Math.random() * 24 - 12;
    const randomOffsetX = Math.random() * 12 - 6;
    const randomOffsetY = Math.random() * 12 - 6;

    const newDiscardCard: DiscardCardWithVisual = {
      ...cardToPlay,
      rotation: randomRotation,
      offsetX: randomOffsetX,
      offsetY: randomOffsetY,
    };

    const updatedHand = currentPlayer.hand.filter((c) => c.id !== cardId);

    // VICTORY CHECK & OFFICIAL UNO SCORING (https://www.unorules.com/)
    if (updatedHand.length === 0) {
      soundFx.playVictory();

      // Official Uno rule: If the last card played is Draw Two or Wild Draw Four,
      // the next player must still draw the required cards which are then tallied up!
      let finalPlayers = players.map((p) =>
        p.id === playerId ? { ...p, hand: [] } : p
      );
      let nextDeck = [...deck];
      let nextDiscard = [...discardPile, newDiscardCard];

      if (cardToPlay.value === 'BURST_2' || cardToPlay.value === 'INFERNO_4') {
        const penaltyCount = cardToPlay.value === 'BURST_2' ? 2 : 4;
        const targetVictimIdx = get().getNextPlayerIndex(1);
        const targetVictim = finalPlayers[targetVictimIdx];
        if (targetVictim) {
          const drawnCards: Card[] = [];
          for (let k = 0; k < penaltyCount; k++) {
            if (nextDeck.length === 0 && nextDiscard.length > 1) {
              const top = nextDiscard.pop()!;
              nextDeck = shuffleDeck(nextDiscard);
              nextDiscard = [top];
            }
            const c = nextDeck.pop();
            if (c) drawnCards.push(c);
          }
          finalPlayers = finalPlayers.map((p, idx) =>
            idx === targetVictimIdx ? { ...p, hand: [...p.hand, ...drawnCards] } : p
          );
        }
      }

      // Calculate hand score of all opponents per official Uno rules
      let roundTotalScore = 0;
      const roundScores: Record<string, number> = {};
      finalPlayers.forEach((p) => {
        if (p.id !== currentPlayer.id) {
          const score = calculateHandScore(p.hand);
          roundScores[p.id] = score;
          roundTotalScore += score;
        } else {
          roundScores[p.id] = 0;
        }
      });

      const updatedWinner: Player = {
        ...currentPlayer,
        hand: [],
        roundScore: roundTotalScore,
        matchScore: currentPlayer.matchScore + roundTotalScore,
      };

      finalPlayers = finalPlayers.map((p) =>
        p.id === currentPlayer.id ? updatedWinner : { ...p, roundScore: roundScores[p.id] || 0 }
      );

      const isMatchWon = updatedWinner.matchScore >= get().targetScore;

      set({
        deck: nextDeck,
        discardPile: nextDiscard,
        players: finalPlayers,
        gamePhase: 'game_over',
        winner: updatedWinner,
        matchWinner: isMatchWon ? updatedWinner : null,
        roundScores,
        rushDuel: null,
        challengeState: null,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${currentPlayer.name} MENANG RONDE INI (+${roundTotalScore} Poin UNO)! Total: ${updatedWinner.matchScore} Poin.${isMatchWon ? ' JUARA MATCH 500 POIN!' : ''}`,
            color: cardToPlay.color,
            timestamp: Date.now(),
          },
          ...get().logs,
        ],
      });

      // Record game result for local human player in solo mode
      const humanPlayer = finalPlayers.find((p) => !p.isBot) || finalPlayers[0];
      if (humanPlayer) {
        const isHumanWinner = currentPlayer.id === humanPlayer.id;
        const opponentNames = finalPlayers.filter((p) => p.id !== humanPlayer.id).map((p) => p.name);
        const pointsEarned = isHumanWinner ? roundTotalScore : 10;
        get().recordGameResult({
          gameMode: 'solo',
          result: isHumanWinner ? 'win' : 'loss',
          pointsEarned,
          roundScore: isHumanWinner ? roundTotalScore : 0,
          opponents: opponentNames,
          cardsLeft: humanPlayer.hand.length,
        });
      }

      return;
    }

    let startsRushSpeedRace = false;
    if (updatedHand.length === 1 && !currentPlayer.hasCalledRush) {
      startsRushSpeedRace = true;
    }

    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          hand: updatedHand,
          hasCalledRush: updatedHand.length === 1 ? p.hasCalledRush : false,
        };
      }
      return p;
    });

    const nextActiveColor =
      cardToPlay.color === 'wild' ? activeColor : (cardToPlay.color as CardColor);

    const logEntry: GameLogEntry = {
      id: `log-${Date.now()}`,
      text: `${currentPlayer.name} played ${cardToPlay.label}`,
      color: cardToPlay.color,
      timestamp: Date.now(),
    };

    set({
      discardPile: [...discardPile, newDiscardCard],
      players: updatedPlayers,
      activeColor: nextActiveColor,
      hasPlayerDrawnThisTurn: false,
      drawnCardId: null,
      logs: [logEntry, ...get().logs.slice(0, 19)],
    });

    if (startsRushSpeedRace) {
      if (rushGraceTimeout) clearTimeout(rushGraceTimeout);

      const raceDuration = currentPlayer.isBot
        ? Math.max(1600, botSpeedMs * 1.6)
        : Math.max(2400, botSpeedMs * 2.2);

      const rushDuel: RushDuelState = {
        targetPlayerId: currentPlayer.id,
        targetPlayerName: currentPlayer.name,
        isHumanTarget: !currentPlayer.isBot,
        expiresAt: Date.now() + raceDuration,
        durationMs: raceDuration,
      };

      set({
        rushCallGracePlayerId: currentPlayer.id,
        rushDuel,
      });

      if (currentPlayer.isBot) {
        rushGraceTimeout = setTimeout(() => {
          const state = get();
          if (state.rushDuel && state.rushDuel.targetPlayerId === currentPlayer.id) {
            get().callRush(currentPlayer.id);
          }
        }, raceDuration);
      } else {
        rushGraceTimeout = setTimeout(() => {
          const state = get();
          if (state.rushDuel && state.rushDuel.targetPlayerId === currentPlayer.id) {
            const catchingBot = state.players.find((p) => p.isBot);
            if (catchingBot) {
              get().catchUncalledRush(currentPlayer.id);
            }
          }
        }, raceDuration);
      }
    }

    if (cardToPlay.value === 'SPECTRUM' || cardToPlay.value === 'INFERNO_4') {
      if (currentPlayer.isBot) {
        const bestColor = chooseBotColor(updatedHand);
        setTimeout(() => {
          get().selectWildColor(bestColor);
        }, 500);
      } else {
        set({
          gamePhase: 'color_picker',
          activeColorPickerPlayerId: currentPlayer.id,
        });
      }
      return;
    }

    if (cardToPlay.value === 'REWIND') {
      soundFx.playRewind();
      const newDirection = turnDirection === 'clockwise' ? 'counter-clockwise' : 'clockwise';
      set({ turnDirection: newDirection });
      get().advanceTurn(1, newDirection);
      return;
    }

    if (cardToPlay.value === 'HALT') {
      soundFx.playHalt();
      const nextIdx = get().getNextPlayerIndex(1);
      const skippedPlayer = players[nextIdx];

      set((state) => ({
        players: state.players.map((p, i) =>
          i === nextIdx ? { ...p, statusMessage: 'HALTED!' } : p
        ),
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${skippedPlayer.name} was HALTED!`,
            color: 'crimson',
            timestamp: Date.now(),
          },
          ...state.logs,
        ],
      }));

      setTimeout(() => {
        set((state) => ({
          players: state.players.map((p) => ({ ...p, statusMessage: undefined })),
        }));
      }, 1500);

      get().advanceTurn(2);
      return;
    }

    if (cardToPlay.value === 'BURST_2') {
      soundFx.playBurst2();
      const newStack = (get().stackCount || 0) + 2;
      set((state) => ({
        stackCount: newStack,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${currentPlayer.name} menumpuk BURST +2! (Total Stack: +${newStack} Kartu)`,
            color: cardToPlay.color,
            timestamp: Date.now(),
          },
          ...state.logs,
        ],
      }));
      get().advanceTurn(1);
      return;
    }

    get().advanceTurn(1);
  },

  selectWildColor: (color: CardColor) => {
    const { gameMode, roomId } = get();

    soundFx.playColorSelect();

    if (gameMode === 'multiplayer' && roomId) {
      socketService.selectWildColor(roomId, color);
      set({ gamePhase: 'playing', activeColorPickerPlayerId: null, activeColor: color });
      return;
    }

    const { discardPile, players, currentTurnIndex } = get();
    const topCard = discardPile[discardPile.length - 1];
    const currentPlayer = players[currentTurnIndex];

    set((state) => ({
      activeColor: color,
      gamePhase: 'playing',
      activeColorPickerPlayerId: null,
      logs: [
        {
          id: `log-${Date.now()}`,
          text: `${currentPlayer?.name || 'Player'} selected ${color.toUpperCase()}!`,
          color,
          timestamp: Date.now(),
        },
        ...state.logs,
      ],
    }));

    if (topCard && topCard.value === 'INFERNO_4') {
      const newStack = (get().stackCount || 0) + 4;
      set({ stackCount: newStack });

      const targetIdx = get().getNextPlayerIndex(1);
      const targetPlayer = players[targetIdx];
      const bluffData = wildDraw4BluffData || {
        wildPlayerId: currentPlayer.id,
        colorBeforeWild: color,
        isBluffing: false,
        matchingCards: [],
      };

      const challengeState: UnoChallengeState = {
        wildPlayerId: currentPlayer.id,
        wildPlayerName: currentPlayer.name,
        targetPlayerId: targetPlayer.id,
        targetPlayerName: targetPlayer.name,
        targetPosition: targetPlayer.position,
        colorBeforeWild: bluffData.colorBeforeWild,
        isWildPlayerBluffing: bluffData.isBluffing,
        matchingCardsInHand: bluffData.matchingCards,
      };

      set({ challengeState });

      if (!targetPlayer.isBot) {
        // Human player is the victim: show challenge decision modal
        set({ gamePhase: 'challenge_decision' });
        set((state) => ({
          logs: [
            {
              id: `log-${Date.now()}-challenge`,
              text: `${currentPlayer.name} memainkan INFERNO +4! ${targetPlayer.name} dapat Menerima (+${newStack}) atau Menantang (Challenge)!`,
              color: 'solar',
              timestamp: Date.now(),
            },
            ...state.logs,
          ],
        }));
      } else {
        // Bot player is the victim: evaluate challenge decision
        const shouldChallenge = shouldBotChallengeWildDraw4(
          targetPlayer.hand,
          currentPlayer.hand.length
        );
        setTimeout(() => {
          get().respondToChallenge(!shouldChallenge);
        }, get().botSpeedMs * 0.8);
      }
      return;
    }

    get().advanceTurn(1);
  },

  respondToChallenge: (acceptPenalty: boolean) => {
    const { challengeState, stackCount } = get();
    if (!challengeState) return;

    const {
      wildPlayerId,
      wildPlayerName,
      targetPlayerId,
      targetPlayerName,
      colorBeforeWild,
      isWildPlayerBluffing,
      matchingCardsInHand,
    } = challengeState;

    const currentStack = stackCount || 4;

    if (acceptPenalty) {
      soundFx.playInferno4();
      set((state) => ({
        challengeState: null,
        gamePhase: 'playing',
        stackCount: 0,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${targetPlayerName} menerima penalti +${currentStack} kartu dari ${wildPlayerName}.`,
            color: 'crimson',
            timestamp: Date.now(),
          },
          ...state.logs,
        ],
      }));
      get().inflictDrawPenalty(wildPlayerId, targetPlayerId, currentStack, 'inferno_4');
      return;
    }

    // OFFICIAL UNO CHALLENGE RESOLUTION (https://www.unorules.com/)
    if (isWildPlayerBluffing) {
      // GUILTY: Wild player actually had matching color cards!
      soundFx.playInferno4();
      const cardLabels = matchingCardsInHand.map((c) => c.label).join(', ');
      set((state) => ({
        challengeState: null,
        gamePhase: 'playing',
        stackCount: 0,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `TANTANGAN BERHASIL! ${wildPlayerName} terbukti BERSALAH memiliki kartu warna ${colorBeforeWild.toUpperCase()} (${cardLabels})! ${wildPlayerName} harus mengambil ${currentStack} kartu!`,
            color: 'toxic',
            timestamp: Date.now(),
          },
          ...state.logs,
        ],
      }));

      // Wild player draws penalty. Challenger takes turn!
      get().inflictDrawPenalty(targetPlayerId, wildPlayerId, currentStack, 'challenge_penalty');
    } else {
      // INNOCENT: Wild player had NO matching color cards! Challenger draws stack + 2 penalty!
      soundFx.playInferno4();
      const penaltyCards = currentStack + 2;
      set((state) => ({
        challengeState: null,
        gamePhase: 'playing',
        stackCount: 0,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `TANTANGAN GAGAL! ${wildPlayerName} JUJUR (tidak punya warna ${colorBeforeWild.toUpperCase()})! ${targetPlayerName} harus mengambil ${penaltyCards} kartu penalti (+2) dan gilirannya dilewati!`,
            color: 'crimson',
            timestamp: Date.now(),
          },
          ...state.logs,
        ],
      }));

      // Challenger draws stack + 2 penalty and loses turn!
      get().inflictDrawPenalty(wildPlayerId, targetPlayerId, penaltyCards, 'challenge_failed');
    }
  },


  inflictDrawPenalty: (
    sourcePlayerId: string,
    targetPlayerId: string,
    count: number,
    type: 'burst_2' | 'inferno_4' | 'rush_penalty' | 'challenge_penalty' | 'challenge_failed' | 'stack_penalty'
  ) => {
    const { deck, discardPile, players, partyDrinkPenaltyEnabled } = get();
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    if (currentDeck.length < count) {
      const top = currentDiscard.pop()!;
      const recycled = currentDiscard.map((c) => ({
        id: c.id,
        color: c.color,
        value: c.value,
        label: c.label,
        type: c.type,
        scoreValue: c.scoreValue,
      }));
      currentDeck = [...currentDeck, ...shuffleDeck(recycled)];
      currentDiscard = [top];
    }

    const drawnCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const c = currentDeck.pop();
      if (c) drawnCards.push(c);
    }

    const targetPlayer = players.find((p) => p.id === targetPlayerId);
    const targetPos = targetPlayer?.position || 'bottom';

    set({
      deck: currentDeck,
      discardPile: currentDiscard,
      gamePhase: 'penalty_animation',
      screenShake: type === 'inferno_4' || type === 'challenge_failed' ? 'lg' : 'sm',
      cardMissiles: {
        id: `missile-${Date.now()}`,
        count,
        targetPosition: targetPos,
      },
      penaltyState: {
        id: `penalty-${Date.now()}`,
        type,
        sourcePlayerId,
        targetPlayerId,
        cardsCount: count,
        showDrinkSplash: partyDrinkPenaltyEnabled,
      },
    });

    if (partyDrinkPenaltyEnabled) {
      setTimeout(() => {
        soundFx.playDrinkPenalty();
      }, 250);
    }

    // Let missiles land smoothly first before inserting cards into hand
    setTimeout(() => {
      set((state) => ({
        players: state.players.map((p) => {
          if (p.id === targetPlayerId) {
            return {
              ...p,
              hand: [...p.hand, ...drawnCards],
              hasCalledRush: false,
              drinkPenaltyCount: partyDrinkPenaltyEnabled
                ? p.drinkPenaltyCount + 1
                : p.drinkPenaltyCount,
              statusMessage: `+${count} KARTU!`,
            };
          }
          return p;
        }),
        screenShake: 'none',
        cardMissiles: null,
      }));

      // Dismiss banner and advance turn
      setTimeout(() => {
        set((state) => ({
          gamePhase: 'playing',
          penaltyState: null,
          players: state.players.map((p) => ({ ...p, statusMessage: undefined })),
        }));

        if (type === 'rush_penalty') {
          const stateNow = get();
          const currentP = stateNow.players[stateNow.currentTurnIndex];
          if (currentP && currentP.isBot) {
            get().triggerBotTurn(stateNow.currentTurnIndex);
          }
        } else if (type === 'challenge_penalty') {
          // The wild player took 4 cards penalty. Turn passes to target player (challenger)!
          get().advanceTurn(1);
        } else if (type === 'stack_penalty') {
          // Player took the accumulated penalty stack and loses turn
          get().advanceTurn(1);
        } else {
          // Standard action penalty (+2, +4, +6): victim drew and is skipped!
          get().advanceTurn(2);
        }
      }, 450);
    }, 650);
  },

  callRush: (playerId: string) => {
    const { gameMode, roomId } = get();

    soundFx.playRushCall();

    if (gameMode === 'multiplayer' && roomId) {
      socketService.callRush(roomId);
      set((state) => ({
        rushDuel: null,
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, hasCalledRush: true, statusMessage: 'RUSH!' } : p
        ),
      }));
      return;
    }

    const { players } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    if (rushGraceTimeout) clearTimeout(rushGraceTimeout);

    set((state) => ({
      rushCallGracePlayerId: null,
      rushDuel: null,
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, hasCalledRush: true, statusMessage: 'RUSH!' }
          : p
      ),
      logs: [
        {
          id: `log-${Date.now()}`,
          text: `${player.name} cepat menekan "RUSH!" (Aman!)`,
          color: 'solar',
          timestamp: Date.now(),
        },
        ...state.logs,
      ],
    }));

    setTimeout(() => {
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, statusMessage: undefined } : p
        ),
      }));
    }, 1600);
  },

  catchUncalledRush: (targetPlayerId: string) => {
    const { gameMode, roomId } = get();

    if (gameMode === 'multiplayer' && roomId) {
      socketService.catchRush(roomId, targetPlayerId);
      return;
    }

    const { players, rushDuel } = get();
    if (rushGraceTimeout) clearTimeout(rushGraceTimeout);

    const victim = players.find((p) => p.id === targetPlayerId);
    if (!victim || victim.hand.length !== 1 || victim.hasCalledRush) return;

    const catcher = rushDuel?.isHumanTarget
      ? players.find((p) => p.isBot)?.name || 'Lawan'
      : 'Kamu';

    set((state) => ({
      rushCallGracePlayerId: null,
      rushDuel: null,
      logs: [
        {
          id: `log-${Date.now()}`,
          text: `${catcher} menangkap ${victim.name} tidak teriak UNO! (+2 Kartu Penalti UNO)`,
          color: 'crimson',
          timestamp: Date.now(),
        },
        ...state.logs,
      ],
    }));

    get().inflictDrawPenalty('uno_police', victim.id, 2, 'rush_penalty');
  },

  getNextPlayerIndex: (steps = 1, forcedDirection?: TurnDirection) => {
    const { players, currentTurnIndex, turnDirection } = get();
    const direction = forcedDirection || turnDirection;
    const total = players.length;
    const offset = direction === 'clockwise' ? steps : -steps;
    return (currentTurnIndex + offset + total * 10) % total;
  },

  advanceTurn: (steps = 1, forcedDirection?: TurnDirection) => {
    if (botTurnTimeout) clearTimeout(botTurnTimeout);
    if (botWatchdogTimeout) clearTimeout(botWatchdogTimeout);
    if (rushGraceTimeout) clearTimeout(rushGraceTimeout);

    const { players, winner } = get();
    if (winner) return;

    const nextIndex = get().getNextPlayerIndex(steps, forcedDirection);
    const nextPlayer = players[nextIndex];

    set({
      currentTurnIndex: nextIndex,
      gamePhase: 'playing',
      hasPlayerDrawnThisTurn: false,
      drawnCardId: null,
      rushCallGracePlayerId: null,
      rushDuel: null,
    });

    if (nextPlayer.isBot) {
      get().triggerBotTurn(nextIndex);
    }
  },

  triggerBotTurn: (botIndex: number) => {
    if (botTurnTimeout) clearTimeout(botTurnTimeout);
    if (botWatchdogTimeout) clearTimeout(botWatchdogTimeout);

    const { players, currentTurnIndex, gamePhase, botSpeedMs, winner } = get();
    if (winner) return;
    if (currentTurnIndex !== botIndex || !players[botIndex]?.isBot) return;

    if (gamePhase !== 'playing') {
      botTurnTimeout = setTimeout(() => {
        get().triggerBotTurn(botIndex);
      }, 200);
      return;
    }

    set((state) => ({
      players: state.players.map((p, i) =>
        i === botIndex ? { ...p, isThinking: true } : { ...p, isThinking: false }
      ),
    }));

    botWatchdogTimeout = setTimeout(() => {
      const stateNow = get();
      if (
        stateNow.currentTurnIndex === botIndex &&
        stateNow.gamePhase === 'playing'
      ) {
        const bot = stateNow.players[botIndex];
        const top = stateNow.discardPile[stateNow.discardPile.length - 1];
        const card = chooseBotCard(bot.hand, top, stateNow.activeColor, stateNow.stackCount || 0);
        if (card) {
          get().playCard(bot.id, card.id);
        } else {
          get().drawCard(bot.id);
        }
      }
    }, Math.max(3500, botSpeedMs + 2000));

    botTurnTimeout = setTimeout(() => {
      const state = get();
      if (state.currentTurnIndex !== botIndex) return;

      if (state.gamePhase !== 'playing') {
        botTurnTimeout = setTimeout(() => {
          get().triggerBotTurn(botIndex);
        }, 200);
        return;
      }

      const bot = state.players[botIndex];
      const topDiscard = state.discardPile[state.discardPile.length - 1];

      set((s) => ({
        players: s.players.map((p, i) =>
          i === botIndex ? { ...p, isThinking: false } : p
        ),
      }));

      const chosenCard = chooseBotCard(bot.hand, topDiscard, state.activeColor, state.stackCount || 0);

      if (chosenCard) {
        get().playCard(bot.id, chosenCard.id);
      } else {
        get().drawCard(bot.id);
      }
    }, botSpeedMs);
  },

  togglePartyDrinkPenalty: () => {
    set((state) => ({
      partyDrinkPenaltyEnabled: !state.partyDrinkPenaltyEnabled,
    }));
  },

  toggleSound: () => {
    const nextMuted = !get().soundMuted;
    soundFx.setMuted(nextMuted);
    set({ soundMuted: nextMuted });
  },

  setBotSpeed: (speed: 'fast' | 'normal' | 'relaxed') => {
    const ms = speed === 'fast' ? 600 : speed === 'relaxed' ? 1800 : 1100;
    set({ botSpeedMs: ms });
  },

  clearPenalty: () => {
    set({ penaltyState: null, screenShake: 'none', cardMissiles: null });
  },

  // --- MULTIPLAYER ACTIONS ---
  setPlayerProfile: (name: string, avatar: string) => {
    set({ playerName: name, playerAvatar: avatar });
    try {
      sessionStorage.setItem('colorrush_name', name);
      sessionStorage.setItem('colorrush_avatar', avatar);
    } catch {}
  },

  setCurrentScreen: (screen) => {
    set({ currentScreen: screen });
  },

  returnToMainMenu: () => {
    clearActiveMatch();
    const { roomId } = get();
    if (roomId) {
      socketService.leaveRoom(roomId, getOrCreateClientId(), true);
    }
    set({
      currentScreen: 'menu',
      roomLobby: null,
      roomId: null,
      gameMode: 'solo',
      isHost: false,
      isSearchingMatch: false,
      rematchReadyPlayers: [],
    });
  },

  fetchPublicRooms: () => {
    get().initMultiplayerSocket();
    socketService.getPublicRooms();
  },

  joinRandomMatch: () => {
    get().initMultiplayerSocket();
    const { playerName, playerAvatar, authUser } = get();
    socketService.joinRandomMatch({
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
      profileBorder: authUser?.activeProfileBorder || 'default',
      usernameBorder: authUser?.activeUsernameBorder || 'default',
    });
  },

  startSoloGame: () => {
    clearActiveMatch();
    socketService.leaveMatchmaking();
    set({ currentScreen: 'game', gameMode: 'solo' });
    get().initGame();
  },

  startMatchmaking: () => {
    get().initMultiplayerSocket();
    const { playerName, playerAvatar, authUser } = get();
    set({ isSearchingMatch: true, queueCount: 1 });
    socketService.joinMatchmaking({
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
      profileBorder: authUser?.activeProfileBorder || 'default',
      usernameBorder: authUser?.activeUsernameBorder || 'default',
    });
  },

  cancelMatchmaking: () => {
    socketService.leaveMatchmaking();
    set({ isSearchingMatch: false, queueCount: 0 });
  },

  createCustomRoom: (options?: { isPublic?: boolean; maxPlayers?: number }) => {
    get().initMultiplayerSocket();
    const { playerName, playerAvatar, authUser } = get();
    socketService.createRoom({
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
      isPublic: options?.isPublic ?? false,
      maxPlayers: options?.maxPlayers ?? 4,
      profileBorder: authUser?.activeProfileBorder || 'default',
      usernameBorder: authUser?.activeUsernameBorder || 'default',
    });
  },

  joinCustomRoom: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    get().initMultiplayerSocket();
    const { playerName, playerAvatar, authUser } = get();
    set({ roomId: cleanCode, isHost: false });
    socketService.joinRoom(cleanCode, {
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
      profileBorder: authUser?.activeProfileBorder || 'default',
      usernameBorder: authUser?.activeUsernameBorder || 'default',
    });
  },

  startRoomGame: () => {
    const { roomId } = get();
    if (roomId) {
      const clientId = getOrCreateClientId();
      saveActiveMatch(roomId, clientId);
      socketService.startRoomGame(roomId, clientId);
    }
  },

  leaveRoom: () => {
    clearActiveMatch();
    const { roomId } = get();
    if (roomId) {
      socketService.leaveRoom(roomId, getOrCreateClientId(), true);
    }
    set({
      currentScreen: 'menu',
      roomLobby: null,
      roomId: null,
      gameMode: 'solo',
      isHost: false,
      rematchReadyPlayers: [],
    });
    get().initGame();
  },

  toggleRematchReady: () => {
    const { gameMode, roomId, myPlayerId, rematchReadyPlayers } = get();
    if (gameMode !== 'multiplayer' || !roomId || !myPlayerId) return;
    const isReady = rematchReadyPlayers.includes(myPlayerId);
    const nextState = !isReady;
    const nextList = nextState
      ? [...rematchReadyPlayers, myPlayerId]
      : rematchReadyPlayers.filter((id) => id !== myPlayerId);
    set({ rematchReadyPlayers: nextList });
    socketService.setRematchReady(roomId, nextState);
  },

  initMultiplayerSocket: () => {
    const socket = socketService.init();

    // Detach any previous listeners to avoid duplicates
    socket.off('connect');
    socket.off('matchmaking_status');
    socket.off('match_found');
    socket.off('room_created');
    socket.off('room_joined');
    socket.off('room_lobby_update');
    socket.off('room_game_started');
    socket.off('room_error');
    socket.off('game_state_sync');
    socket.off('penalty_event');
    socket.off('rush_success');

    socket.off('public_rooms_update');
    socket.off('random_match_found');
    socket.off('reconnect_success');
    socket.off('reconnect_failed');
    socket.off('online_users_count');

    const handleConnect = () => {
      const activeMatch = getActiveMatch();
      if (activeMatch && activeMatch.roomId) {
        console.log('[Socket] Active match detected! Reconnecting to room:', activeMatch.roomId);
        socketService.reconnectRoom(activeMatch.roomId, activeMatch.clientPlayerId, {
          name: get().playerName,
          avatar: get().playerAvatar,
          profileBorder: get().authUser?.activeProfileBorder || 'default',
          usernameBorder: get().authUser?.activeUsernameBorder || 'default',
        });
      } else {
        const currentRoomId = get().roomId;
        if (currentRoomId) {
          socketService.getRoomLobby(currentRoomId);
        }
      }
      socketService.getPublicRooms();
      socketService.getOnlineCount();
    };

    socket.on('connect', handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    socket.on('online_users_count', (data: { count: number }) => {
      set({ onlineCount: data.count });
    });

    socket.on('reconnect_success', (data: { roomId: string; playerId: string; isHost?: boolean }) => {
      console.log('[Socket] Reconnect success for room:', data.roomId, 'Host:', data.isHost);
      saveActiveMatch(data.roomId, getOrCreateClientId());
      set({
        currentScreen: 'game',
        gameMode: 'multiplayer',
        roomId: data.roomId,
        myPlayerId: data.playerId,
        isHost: typeof data.isHost === 'boolean' ? data.isHost : get().isHost,
        roomLobby: null,
      });
    });

    socket.on('reconnect_failed', (data: { message: string }) => {
      console.log('[Socket] Reconnect failed:', data.message);
      clearActiveMatch();
      set({ currentScreen: 'menu', gameMode: 'solo', roomId: null });
    });

    socket.on('public_rooms_update', (rooms: import('../types/game').PublicRoomItem[]) => {
      set({ publicRooms: rooms });
    });

    socket.on('random_match_found', (data: { roomId: string }) => {
      get().joinCustomRoom(data.roomId);
    });

    socket.on('matchmaking_status', (data: { inQueue: boolean; queueCount: number }) => {
      set({ isSearchingMatch: data.inQueue, queueCount: data.queueCount });
    });

    socket.on('match_found', (data: { roomId: string }) => {
      saveActiveMatch(data.roomId, getOrCreateClientId());
      set({
        currentScreen: 'game',
        gameMode: 'multiplayer',
        roomId: data.roomId,
        roomLobby: null,
        isSearchingMatch: false,
        myPlayerId: socket.id || null,
      });
      soundFx.playCardDraw();
    });

    socket.on('room_created', (data: { roomId: string; isHost: boolean; lobby?: import('../types/game').RoomLobbyState }) => {
      const socketId = socket.id || '';
      set({
        currentScreen: 'lobby',
        gameMode: 'multiplayer',
        roomId: data.roomId,
        isHost: true,
        myPlayerId: socketId || null,
        roomLobby: data.lobby || {
          roomId: data.roomId,
          hostId: socketId,
          status: 'waiting',
          isPublic: false,
          maxPlayers: 4,
          players: [
            {
              socketId: socketId,
              name: get().playerName,
              avatar: get().playerAvatar,
              profileBorder: get().authUser?.activeProfileBorder || 'default',
              usernameBorder: get().authUser?.activeUsernameBorder || 'default',
              isHost: true,
            },
          ],
        },
      });
    });

    socket.on('room_joined', (data: { roomId: string; isHost: boolean; lobby?: import('../types/game').RoomLobbyState }) => {
      const socketId = socket.id || '';
      set({
        currentScreen: 'lobby',
        gameMode: 'multiplayer',
        roomId: data.roomId,
        isHost: data.isHost,
        myPlayerId: socketId || null,
        roomLobby: data.lobby || null,
      });
      // Also request latest lobby to guarantee both host and guest see each other
      socketService.getRoomLobby(data.roomId);
    });

    socket.on('room_lobby_update', (lobbyData: import('../types/game').RoomLobbyState) => {
      const currentSocketId = socket.id;
      const myClientId = getOrCreateClientId();
      const meInLobby = lobbyData.players?.find(
        (p) =>
          (p.clientPlayerId && p.clientPlayerId === myClientId) ||
          (p.socketId && currentSocketId && p.socketId === currentSocketId)
      );

      const isMeHost = Boolean(
        meInLobby?.isHost ||
        (lobbyData.hostClientId && lobbyData.hostClientId === myClientId) ||
        (lobbyData.hostId && currentSocketId && lobbyData.hostId === currentSocketId) ||
        (lobbyData.players && lobbyData.players.length > 0 && lobbyData.players[0] === meInLobby)
      );

      set({
        roomLobby: lobbyData,
        roomId: lobbyData.roomId,
        isHost: isMeHost,
        myPlayerId: currentSocketId || null,
      });
    });

    socket.on('room_game_started', (data: { roomId: string }) => {
      saveActiveMatch(data.roomId, getOrCreateClientId());
      set({
        currentScreen: 'game',
        gameMode: 'multiplayer',
        roomId: data.roomId,
        roomLobby: null,
      });
      soundFx.playCardDraw();
    });

    socket.on('room_error', (data: { message: string }) => {
      alert(`[Multiplayer] ${data.message}`);
      set({ isSearchingMatch: false, roomId: null, roomLobby: null });
    });

    socket.on(
      'game_state_sync',
      (syncData: {
        roomId: string;
        discardPile: DiscardCardWithVisual[];
        activeColor: CardColor;
        turnDirection: TurnDirection;
        players: Player[];
        currentTurnIndex: number;
        gamePhase: GamePhase;
        winner: Player | null;
        rushDuel: RushDuelState | null;
        logs: GameLogEntry[];
        myPlayerId: string;
        stackCount?: number;
        rematchReadyPlayers?: string[];
      }) => {
        const currentWinner = get().winner;

        // Sound cues for multiplayer
        if (!currentWinner && syncData.winner) {
          if (syncData.winner.id === syncData.myPlayerId) {
            soundFx.playVictory();
          } else {
            soundFx.playDrinkPenalty();
          }

          // Record multiplayer game result
          const isHumanWinner = syncData.winner.id === syncData.myPlayerId;
          const myPlayer = syncData.players.find((p) => p.id === syncData.myPlayerId);
          const opponentsList = syncData.players.filter((p) => p.id !== syncData.myPlayerId).map((p) => p.name);
          const pointsEarned = isHumanWinner ? (syncData.winner.roundScore || 50) : 10;
          get().recordGameResult({
            gameMode: 'multiplayer',
            result: isHumanWinner ? 'win' : 'loss',
            pointsEarned,
            roundScore: isHumanWinner ? (syncData.winner.roundScore || 50) : 0,
            opponents: opponentsList,
            cardsLeft: myPlayer ? myPlayer.hand.length : 0,
          });
        }

        if (syncData.roomId && syncData.gamePhase === 'playing') {
          saveActiveMatch(syncData.roomId, getOrCreateClientId());
        }
        if (syncData.gamePhase === 'game_over') {
          clearActiveMatch();
        }

        const isAnimationRunning = get().penaltyState !== null || get().cardMissiles !== null;
        const myPlayer = syncData.players.find((p) => p.id === syncData.myPlayerId);
        const amIHost = myPlayer ? Boolean(myPlayer.isHost) : get().isHost;

        if (isAnimationRunning) {
          set({
            currentScreen: 'game',
            gameMode: 'multiplayer',
            roomId: syncData.roomId,
            discardPile: syncData.discardPile,
            activeColor: syncData.activeColor,
            turnDirection: syncData.turnDirection,
            myPlayerId: syncData.myPlayerId,
            isHost: amIHost,
            stackCount: syncData.stackCount ?? 0,
            rematchReadyPlayers: syncData.rematchReadyPlayers ?? [],
            isSearchingMatch: false,
          });

          setTimeout(() => {
            set({
              players: syncData.players,
              gamePhase: syncData.gamePhase,
              currentTurnIndex: syncData.currentTurnIndex,
              winner: syncData.winner,
              rushDuel: syncData.rushDuel,
              logs: syncData.logs,
              isHost: amIHost,
              stackCount: syncData.stackCount ?? 0,
              rematchReadyPlayers: syncData.rematchReadyPlayers ?? [],
            });
          }, 460);
          return;
        }

        set({
          currentScreen: 'game',
          gameMode: 'multiplayer',
          roomId: syncData.roomId,
          discardPile: syncData.discardPile,
          activeColor: syncData.activeColor,
          turnDirection: syncData.turnDirection,
          players: syncData.players,
          currentTurnIndex: syncData.currentTurnIndex,
          gamePhase: syncData.gamePhase,
          winner: syncData.winner,
          rushDuel: syncData.rushDuel,
          logs: syncData.logs,
          myPlayerId: syncData.myPlayerId,
          isHost: amIHost,
          stackCount: syncData.stackCount ?? 0,
          rematchReadyPlayers: syncData.rematchReadyPlayers ?? [],
          isSearchingMatch: false,
        });
      }
    );

    socket.on('penalty_event', (data: { targetPlayerId: string; cardsCount: number; type: 'burst_2' | 'inferno_4' | 'rush_penalty' }) => {
      const { players, partyDrinkPenaltyEnabled } = get();
      const target = players.find((p) => p.id === data.targetPlayerId);

      // 1. SET STATE FIRST so animations mount immediately on this exact frame without sound blocking
      set({
        screenShake: data.type === 'inferno_4' ? 'lg' : 'sm',
        cardMissiles: {
          id: `missile-${Date.now()}`,
          count: data.cardsCount,
          targetPosition: target?.position || 'bottom',
        },
        penaltyState: {
          id: `penalty-${Date.now()}`,
          type: data.type,
          sourcePlayerId: 'system',
          targetPlayerId: data.targetPlayerId,
          cardsCount: data.cardsCount,
          showDrinkSplash: partyDrinkPenaltyEnabled,
        },
      });

      // 2. Play audio in requestAnimationFrame/non-blocking try-catch so audio issues on mobile never stalls UI
      requestAnimationFrame(() => {
        try {
          if (data.type === 'burst_2') soundFx.playBurst2();
          if (data.type === 'inferno_4') soundFx.playInferno4();
          if (data.type === 'rush_penalty') soundFx.playDrinkPenalty();
        } catch {
          // Safe catch for mobile AudioContext autoplay policies
        }
      });

      // Clear missiles when they finish landing (450ms)
      setTimeout(() => {
        set({ screenShake: 'none', cardMissiles: null });
      }, 450);

      // Clear penalty banner promptly at 650ms
      setTimeout(() => {
        set({ penaltyState: null });
      }, 650);
    });

    socket.on('rush_success', (data: { playerId: string }) => {
      soundFx.playRushCall();
      set((state) => ({
        rushDuel: null,
        players: state.players.map((p) =>
          p.id === data.playerId ? { ...p, hasCalledRush: true, statusMessage: 'RUSH!' } : p
        ),
      }));
    });
  },

  // --- Auth & Profile Actions ---
  initAuth: async () => {
    set({ isAuthLoading: true });
    try {
      const user = await apiService.getMe();
      if (user) {
        set({
          authUser: user,
          authToken: apiService.getToken(),
          playerName: user.username,
          playerAvatar: user.avatar,
        });
        const history = await apiService.getHistory();
        set({ matchHistory: history });
      } else {
        set({ authUser: null, authToken: null });
      }
    } catch {
      set({ authUser: null, authToken: null });
    } finally {
      set({ isAuthLoading: false });
    }
  },

  login: async (identifier: string, password: string) => {
    set({ isAuthLoading: true });
    try {
      const { user, token } = await apiService.login({ identifier, password });
      set({
        authUser: user,
        authToken: token,
        playerName: user.username,
        playerAvatar: user.avatar,
        isAuthModalOpen: false,
      });
      get().setPlayerProfile(user.username, user.avatar);
      const history = await apiService.getHistory();
      set({ matchHistory: history });
    } finally {
      set({ isAuthLoading: false });
    }
  },

  registerUser: async (username: string, email: string, password: string, avatar?: string) => {
    set({ isAuthLoading: true });
    try {
      const { user, token } = await apiService.register({ username, email, password, avatar });
      set({
        authUser: user,
        authToken: token,
        playerName: user.username,
        playerAvatar: user.avatar,
        isAuthModalOpen: false,
      });
      get().setPlayerProfile(user.username, user.avatar);
      set({ matchHistory: [] });
    } finally {
      set({ isAuthLoading: false });
    }
  },

  logout: async () => {
    await apiService.logout();
    const guestProfile = generateRandomGuestProfile();
    get().setPlayerProfile(guestProfile.name, guestProfile.avatar);
    set({
      authUser: null,
      authToken: null,
      playerName: guestProfile.name,
      playerAvatar: guestProfile.avatar,
      matchHistory: [],
      isProfileModalOpen: false,
    });
  },

  openAuthModal: (tab: 'login' | 'register' = 'login') => {
    set({ isAuthModalOpen: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  openProfileModal: () => {
    set({ isProfileModalOpen: true });
    get().fetchMatchHistory();
  },

  closeProfileModal: () => {
    set({ isProfileModalOpen: false });
  },

  fetchMatchHistory: async () => {
    if (!get().authUser) return;
    try {
      const history = await apiService.getHistory();
      set({ matchHistory: history });
    } catch {}
  },

  recordGameResult: async (matchData) => {
    const { authUser } = get();
    set({
      lastGamePointsGained: matchData.pointsEarned,
      lastGameSaved: Boolean(authUser),
    });

    if (!authUser) return;

    try {
      const result = await apiService.saveMatchHistory(matchData);
      if (result) {
        set((state) => ({
          authUser: result.user,
          lastGameSaved: true,
          matchHistory: [result.historyItem, ...state.matchHistory],
        }));
      }
    } catch (err) {
      console.warn('[Store] Gagal menyimpan riwayat pertandingan:', err);
    }
  },

  // --- Shop Actions ---
  openShopModal: () => {
    set({ isShopModalOpen: true });
    get().fetchShopCatalog();
  },

  closeShopModal: () => {
    set({ isShopModalOpen: false });
  },

  fetchShopCatalog: async () => {
    try {
      const catalog = await apiService.getShopCatalog();
      if (catalog) {
        set({ shopCatalog: catalog });
      }
    } catch {}
  },

  buyShopItem: async (itemType, itemId) => {
    try {
      const updatedUser = await apiService.buyShopItem(itemType, itemId);
      set((state) => ({
        authUser: updatedUser,
        players: state.players.map((p) => {
          const isMe = state.myPlayerId ? p.id === state.myPlayerId : !p.isBot;
          if (isMe) {
            return {
              ...p,
              profileBorder: updatedUser.activeProfileBorder || 'default',
              usernameBorder: updatedUser.activeUsernameBorder || 'default',
            };
          }
          return p;
        }),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  equipShopItem: async (itemType, itemId) => {
    try {
      const updatedUser = await apiService.equipShopItem(itemType, itemId);
      set((state) => ({
        authUser: updatedUser,
        players: state.players.map((p) => {
          const isMe = state.myPlayerId ? p.id === state.myPlayerId : !p.isBot;
          if (isMe) {
            return {
              ...p,
              profileBorder: updatedUser.activeProfileBorder || 'default',
              usernameBorder: updatedUser.activeUsernameBorder || 'default',
            };
          }
          return p;
        }),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  // --- Leaderboard Actions ---
  openLeaderboardModal: () => {
    set({ isLeaderboardOpen: true });
    get().fetchLeaderboard(get().leaderboardCategory);
  },

  closeLeaderboardModal: () => {
    set({ isLeaderboardOpen: false });
  },

  setLeaderboardCategory: (category: LeaderboardCategory) => {
    set({ leaderboardCategory: category });
    get().fetchLeaderboard(category);
  },

  fetchLeaderboard: async (category?: LeaderboardCategory) => {
    const targetCat = category || get().leaderboardCategory || 'points';
    set({ isLeaderboardLoading: true });
    try {
      const res = await apiService.getLeaderboard(targetCat, 50);
      if (res && res.success) {
        set({
          leaderboardEntries: res.leaderboard || [],
          currentUserLeaderboardRank: res.currentUserRank || null,
          isLeaderboardLoading: false,
        });
      } else {
        set({ isLeaderboardLoading: false });
      }
    } catch {
      set({ isLeaderboardLoading: false });
    }
  },
}));
