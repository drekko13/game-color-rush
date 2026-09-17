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
} from '../types/game';
import {
  chooseBotCard,
  chooseBotColor,
  createFullDeck,
  isValidPlay,
  shuffleDeck,
} from '../game/deck';
import { soundFx } from '../audio/soundEffects';
import { socketService } from '../services/socket';

interface GameState {
  deck: Card[];
  discardPile: DiscardCardWithVisual[];
  activeColor: CardColor;
  turnDirection: TurnDirection;
  players: Player[];
  currentTurnIndex: number;
  gamePhase: GamePhase;
  winner: Player | null;

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
    type: 'burst_2' | 'inferno_4' | 'rush_penalty'
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
  initMultiplayerSocket: () => void;
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
  },
];

let botTurnTimeout: ReturnType<typeof setTimeout> | null = null;
let botWatchdogTimeout: ReturnType<typeof setTimeout> | null = null;
let rushGraceTimeout: ReturnType<typeof setTimeout> | null = null;

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
  const randomNum = Math.floor(Math.random() * 89 + 10);
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

  partyDrinkPenaltyEnabled: true,
  botSpeedMs: 1100,
  soundMuted: false,
  logs: [],

  initGame: () => {
    if (botTurnTimeout) clearTimeout(botTurnTimeout);
    if (botWatchdogTimeout) clearTimeout(botWatchdogTimeout);
    if (rushGraceTimeout) clearTimeout(rushGraceTimeout);

    const { playerName, playerAvatar } = get();

    const fullDeck = shuffleDeck(createFullDeck());
    const players: Player[] = INITIAL_PLAYERS.map((p, i) => ({
      ...p,
      name: i === 0 ? playerName : p.name,
      avatar: i === 0 ? playerAvatar : p.avatar,
      hand: [],
      hasCalledRush: false,
      statusMessage: undefined,
      isThinking: false,
      drinkPenaltyCount: 0,
    }));

    for (let i = 0; i < 7; i++) {
      for (const player of players) {
        const card = fullDeck.pop();
        if (card) player.hand.push(card);
      }
    }

    let initialDiscardIndex = fullDeck.findIndex((c) => c.color !== 'wild');
    if (initialDiscardIndex === -1) initialDiscardIndex = 0;
    const [initialDiscardCard] = fullDeck.splice(initialDiscardIndex, 1);

    const discardPile: DiscardCardWithVisual[] = [
      {
        ...initialDiscardCard,
        rotation: Math.random() * 8 - 4,
        offsetX: 0,
        offsetY: 0,
      },
    ];

    const activeColor = (initialDiscardCard.color === 'wild' ? 'crimson' : initialDiscardCard.color) as CardColor;

    set({
      deck: fullDeck,
      discardPile,
      activeColor,
      turnDirection: 'clockwise',
      players,
      currentTurnIndex: 0,
      gamePhase: 'playing',
      winner: null,
      gameMode: 'solo',
      roomId: null,
      myPlayerId: 'p-0',
      penaltyState: null,
      screenShake: 'none',
      activeColorPickerPlayerId: null,
      cardMissiles: null,
      hasPlayerDrawnThisTurn: false,
      drawnCardId: null,
      rushCallGracePlayerId: null,
      rushDuel: null,
      logs: [
        {
          id: `log-${Date.now()}`,
          text: `Match started! Top card is ${initialDiscardCard.label} (${activeColor.toUpperCase()}).`,
          color: activeColor,
          timestamp: Date.now(),
        },
      ],
    });

    soundFx.playCardDraw();
  },

  drawCard: (playerId: string) => {
    const { gameMode, roomId } = get();

    if (gameMode === 'multiplayer' && roomId) {
      socketService.drawCard(roomId);
      soundFx.playCardDraw();
      return;
    }

    const { players, currentTurnIndex, deck, discardPile, gamePhase, hasPlayerDrawnThisTurn } = get();
    if (gamePhase !== 'playing') return;
    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return;
    if (hasPlayerDrawnThisTurn) return;

    soundFx.playCardDraw();

    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    if (currentDeck.length === 0) {
      if (currentDiscard.length <= 1) {
        if (currentPlayer.isBot) {
          get().passTurn(currentPlayer.id);
        }
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
      if (currentPlayer.isBot) {
        get().passTurn(currentPlayer.id);
      }
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

    set((state) => ({
      deck: currentDeck,
      discardPile: currentDiscard,
      players: updatedPlayers,
      hasPlayerDrawnThisTurn: true,
      drawnCardId: drawnCard.id,
      logs: [
        {
          id: `log-${Date.now()}`,
          text: `${currentPlayer.name} drew a card.`,
          timestamp: Date.now(),
        },
        ...state.logs.slice(0, 19),
      ],
    }));

    if (currentPlayer.isBot) {
      const executeBotPostDraw = () => {
        const stateNow = get();
        if (stateNow.currentTurnIndex !== currentTurnIndex) return;

        if (stateNow.gamePhase !== 'playing') {
          setTimeout(executeBotPostDraw, 200);
          return;
        }

        const top = stateNow.discardPile[stateNow.discardPile.length - 1];
        if (isValidPlay(drawnCard, top, stateNow.activeColor)) {
          get().playCard(currentPlayer.id, drawnCard.id);
        } else {
          get().passTurn(currentPlayer.id);
        }
      };

      setTimeout(executeBotPostDraw, get().botSpeedMs * 0.7);
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
        if (card.value === 'SPECTRUM' || card.value === 'INFERNO_4') {
          set({
            gamePhase: 'color_picker',
            activeColorPickerPlayerId: playerId,
          });
        }
        socketService.playCard(roomId, cardId);
        soundFx.playCardPlay();
      }
      return;
    }

    const {
      gamePhase,
      turnDirection,
      botSpeedMs,
    } = get();

    if (gamePhase !== 'playing') return;
    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return;

    const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;
    const cardToPlay = currentPlayer.hand[cardIndex];

    const topDiscard = discardPile[discardPile.length - 1];
    if (!isValidPlay(cardToPlay, topDiscard, activeColor)) {
      if (currentPlayer.isBot) {
        get().drawCard(currentPlayer.id);
      }
      return;
    }

    soundFx.playCardPlay();

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

    if (updatedHand.length === 0) {
      soundFx.playVictory();
      set({
        discardPile: [...discardPile, newDiscardCard],
        players: players.map((p) =>
          p.id === playerId ? { ...p, hand: [] } : p
        ),
        gamePhase: 'game_over',
        winner: currentPlayer,
        rushDuel: null,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `${currentPlayer.name} PLAYED THEIR LAST CARD AND WON!`,
            color: cardToPlay.color,
            timestamp: Date.now(),
          },
          ...get().logs,
        ],
      });
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
      const targetIdx = get().getNextPlayerIndex(1);
      const targetPlayer = players[targetIdx];
      get().inflictDrawPenalty(currentPlayer.id, targetPlayer.id, 2, 'burst_2');
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
      soundFx.playInferno4();
      const targetIdx = get().getNextPlayerIndex(1);
      const targetPlayer = players[targetIdx];
      get().inflictDrawPenalty(currentPlayer.id, targetPlayer.id, 4, 'inferno_4');
      return;
    }

    get().advanceTurn(1);
  },

  inflictDrawPenalty: (
    sourcePlayerId: string,
    targetPlayerId: string,
    count: number,
    type: 'burst_2' | 'inferno_4' | 'rush_penalty'
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
      screenShake: type === 'inferno_4' ? 'lg' : 'sm',
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
        } else {
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
          text: `${catcher} lebih cepat! ${victim.name} kalah cepat menekan RUSH (+1 Kartu Penalti)`,
          color: 'crimson',
          timestamp: Date.now(),
        },
        ...state.logs,
      ],
    }));

    get().inflictDrawPenalty('system', targetPlayerId, 1, 'rush_penalty');
  },

  getNextPlayerIndex: (steps: number = 1, forcedDirection?: TurnDirection): number => {
    const { currentTurnIndex, turnDirection, players } = get();
    const direction = forcedDirection || turnDirection;
    const total = players.length;
    const offset = direction === 'clockwise' ? steps : -steps;
    return (currentTurnIndex + offset + total * 10) % total;
  },

  advanceTurn: (steps: number = 1, forcedDirection?: TurnDirection) => {
    const nextIdx = get().getNextPlayerIndex(steps, forcedDirection);
    const { players } = get();
    const nextPlayer = players[nextIdx];

    set({
      currentTurnIndex: nextIdx,
      hasPlayerDrawnThisTurn: false,
      drawnCardId: null,
    });

    if (nextPlayer.isBot) {
      get().triggerBotTurn(nextIdx);
    }
  },

  triggerBotTurn: (botIndex: number) => {
    if (botTurnTimeout) clearTimeout(botTurnTimeout);
    if (botWatchdogTimeout) clearTimeout(botWatchdogTimeout);
    const { botSpeedMs } = get();

    const currentState = get();
    if (currentState.gamePhase !== 'playing') {
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
        const card = chooseBotCard(bot.hand, top, stateNow.activeColor);
        if (card) {
          get().playCard(bot.id, card.id);
        } else if (!stateNow.hasPlayerDrawnThisTurn) {
          get().drawCard(bot.id);
        } else {
          get().passTurn(bot.id);
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

      const chosenCard = chooseBotCard(bot.hand, topDiscard, state.activeColor);

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
      socketService.leaveRoom(roomId);
    }
    set({
      currentScreen: 'menu',
      roomLobby: null,
      roomId: null,
      gameMode: 'solo',
      isHost: false,
      isSearchingMatch: false,
    });
  },

  fetchPublicRooms: () => {
    get().initMultiplayerSocket();
    socketService.getPublicRooms();
  },

  joinRandomMatch: () => {
    get().initMultiplayerSocket();
    const { playerName, playerAvatar } = get();
    socketService.joinRandomMatch({
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
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
    const { playerName, playerAvatar } = get();
    set({ isSearchingMatch: true, queueCount: 1 });
    socketService.joinMatchmaking({
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
    });
  },

  cancelMatchmaking: () => {
    socketService.leaveMatchmaking();
    set({ isSearchingMatch: false, queueCount: 0 });
  },

  createCustomRoom: (options?: { isPublic?: boolean; maxPlayers?: number }) => {
    get().initMultiplayerSocket();
    const { playerName, playerAvatar } = get();
    socketService.createRoom({
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
      isPublic: options?.isPublic ?? false,
      maxPlayers: options?.maxPlayers ?? 4,
    });
  },

  joinCustomRoom: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    get().initMultiplayerSocket();
    const { playerName, playerAvatar } = get();
    set({ roomId: cleanCode, isHost: false });
    socketService.joinRoom(cleanCode, {
      name: playerName,
      avatar: playerAvatar,
      clientPlayerId: getOrCreateClientId(),
    });
  },

  startRoomGame: () => {
    const { roomId } = get();
    if (roomId) {
      saveActiveMatch(roomId, getOrCreateClientId());
      socketService.startRoomGame(roomId);
    }
  },

  leaveRoom: () => {
    clearActiveMatch();
    const { roomId } = get();
    if (roomId) {
      socketService.leaveRoom(roomId);
    }
    set({
      currentScreen: 'menu',
      roomLobby: null,
      roomId: null,
      gameMode: 'solo',
      isHost: false,
    });
    get().initGame();
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

    socket.on('connect', () => {
      const activeMatch = getActiveMatch();
      if (activeMatch && activeMatch.roomId) {
        console.log('[Socket] Active match detected! Reconnecting to room:', activeMatch.roomId);
        socketService.reconnectRoom(activeMatch.roomId, activeMatch.clientPlayerId, {
          name: get().playerName,
          avatar: get().playerAvatar,
        });
      } else {
        const currentRoomId = get().roomId;
        if (currentRoomId) {
          socketService.getRoomLobby(currentRoomId);
        }
      }
      socketService.getPublicRooms();
      socketService.getOnlineCount();
    });

    socket.on('online_users_count', (data: { count: number }) => {
      set({ onlineCount: data.count });
    });

    socket.on('reconnect_success', (data: { roomId: string; playerId: string }) => {
      console.log('[Socket] Reconnect success for room:', data.roomId);
      saveActiveMatch(data.roomId, getOrCreateClientId());
      set({
        currentScreen: 'game',
        gameMode: 'multiplayer',
        roomId: data.roomId,
        myPlayerId: data.playerId,
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
      set({
        roomLobby: lobbyData,
        roomId: lobbyData.roomId,
        isHost: lobbyData.hostId === currentSocketId,
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
      }) => {
        const currentWinner = get().winner;

        // Sound cues for multiplayer
        if (!currentWinner && syncData.winner) {
          if (syncData.winner.id === syncData.myPlayerId) {
            soundFx.playVictory();
          } else {
            soundFx.playDrinkPenalty();
          }
        }

        if (syncData.roomId && syncData.gamePhase === 'playing') {
          saveActiveMatch(syncData.roomId, getOrCreateClientId());
        }
        if (syncData.gamePhase === 'game_over') {
          clearActiveMatch();
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
          isSearchingMatch: false,
        });
      }
    );

    socket.on('penalty_event', (data: { targetPlayerId: string; cardsCount: number; type: 'burst_2' | 'inferno_4' | 'rush_penalty' }) => {
      const { players, partyDrinkPenaltyEnabled } = get();
      const target = players.find((p) => p.id === data.targetPlayerId);

      if (data.type === 'burst_2') soundFx.playBurst2();
      if (data.type === 'inferno_4') soundFx.playInferno4();
      if (data.type === 'rush_penalty') soundFx.playDrinkPenalty();

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

      // Clear missiles when they finish landing (550ms)
      setTimeout(() => {
        set({ screenShake: 'none', cardMissiles: null });
      }, 550);

      // Clear penalty banner at 1000ms (just before backend state sync at 1100ms)
      setTimeout(() => {
        set({ penaltyState: null });
      }, 1000);
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
}));
