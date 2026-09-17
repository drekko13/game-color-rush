export type CardColor = 'crimson' | 'ocean' | 'toxic' | 'solar';
export type CardColorWithWild = CardColor | 'wild';

export type CardAction = 'HALT' | 'REWIND' | 'BURST_2' | 'SPECTRUM' | 'INFERNO_4';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | CardAction;

export interface Card {
  id: string;
  color: CardColorWithWild;
  value: CardValue;
  label: string;
  type: 'number' | 'action' | 'wild';
  scoreValue: number;
}

export type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  avatar: string;
  personality: string;
  position: PlayerPosition;
  hand: Card[];
  hasCalledRush: boolean;
  statusMessage?: string;
  isThinking?: boolean;
  drinkPenaltyCount: number;
  clientPlayerId?: string;
  isDisconnected?: boolean;
}

export type TurnDirection = 'clockwise' | 'counter-clockwise';

export type ScreenView = 'menu' | 'lobby' | 'game';

export type GameMode = 'solo' | 'multiplayer';

export interface RoomLobbyPlayer {
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  clientPlayerId?: string;
}

export interface RoomLobbyState {
  roomId: string;
  hostId: string;
  players: RoomLobbyPlayer[];
  status: 'waiting' | 'playing';
  isPublic: boolean;
  maxPlayers: number;
}

export interface PublicRoomItem {
  roomId: string;
  hostName: string;
  hostAvatar: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

export type GamePhase = 'dealing' | 'playing' | 'color_picker' | 'penalty_animation' | 'game_over';

export interface PenaltyAnimationState {
  id: string;
  type: 'burst_2' | 'inferno_4' | 'rush_penalty';
  sourcePlayerId: string;
  targetPlayerId: string;
  cardsCount: number;
  showDrinkSplash: boolean;
}

export interface RushDuelState {
  targetPlayerId: string;
  targetPlayerName: string;
  isHumanTarget: boolean;
  expiresAt: number;
  durationMs: number;
}

export interface DiscardCardWithVisual extends Card {
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export interface GameLogEntry {
  id: string;
  text: string;
  color?: CardColorWithWild;
  timestamp: number;
}

export const SUIT_NAMES: Record<CardColor, string> = {
  crimson: 'Crimson Blaze',
  ocean: 'Ocean Surge',
  toxic: 'Toxic Bloom',
  solar: 'Solar Flare',
};

export const COLOR_HEX: Record<CardColor, { bg: string; border: string; glow: string; text: string }> = {
  crimson: {
    bg: '#e11d48',
    border: '#fb7185',
    glow: 'rgba(225, 29, 72, 0.5)',
    text: '#ffffff',
  },
  ocean: {
    bg: '#0284c7',
    border: '#38bdf8',
    glow: 'rgba(2, 132, 199, 0.5)',
    text: '#ffffff',
  },
  toxic: {
    bg: '#059669',
    border: '#34d399',
    glow: 'rgba(5, 150, 105, 0.5)',
    text: '#ffffff',
  },
  solar: {
    bg: '#d97706',
    border: '#fbbf24',
    glow: 'rgba(217, 119, 6, 0.5)',
    text: '#ffffff',
  },
};
