import { io, Socket } from 'socket.io-client';
import type { CardColor } from '../types/game';

class SocketService {
  public socket: Socket | null = null;
  public isConnected: boolean = false;

  public init(): Socket {
    if (this.socket) return this.socket;

    // Dev  → http://localhost:9001 (automatic)
    // Prod → set VITE_SERVER_URL or defaults to current server IP/domain on port 9001
    const isDev = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    const defaultServerUrl = typeof window !== 'undefined' && window.location.hostname && !isDev
      ? `${window.location.protocol}//${window.location.hostname}:9001`
      : 'http://localhost:9001';

    const rawServerUrl = (import.meta.env.VITE_SERVER_URL as string) || defaultServerUrl;
    const serverUrl = (rawServerUrl || '').trim().replace(/\/+$/, '');

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[Socket] Connected to server, ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('[Socket] Disconnected from server');
    });

    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.init();
    }
    return this.socket;
  }

  public joinMatchmaking(user: {
    name: string;
    avatar: string;
    clientPlayerId?: string;
    profileBorder?: string;
    usernameBorder?: string;
  }) {
    this.getSocket().emit('join_matchmaking', user);
  }

  public leaveMatchmaking() {
    this.getSocket().emit('leave_matchmaking');
  }

  public createRoom(user: {
    name: string;
    avatar: string;
    isPublic?: boolean;
    maxPlayers?: number;
    clientPlayerId?: string;
    profileBorder?: string;
    usernameBorder?: string;
  }) {
    this.getSocket().emit('create_room', user);
  }

  public joinRandomMatch(user: {
    name: string;
    avatar: string;
    clientPlayerId?: string;
    profileBorder?: string;
    usernameBorder?: string;
  }) {
    this.getSocket().emit('random_match', user);
  }

  public getPublicRooms() {
    this.getSocket().emit('get_public_rooms');
  }

  public getOnlineCount() {
    this.getSocket().emit('get_online_count');
  }

  public joinRoom(
    roomId: string,
    user: {
      name: string;
      avatar: string;
      clientPlayerId?: string;
      profileBorder?: string;
      usernameBorder?: string;
    }
  ) {
    this.getSocket().emit('join_room', { roomId, userData: user });
  }

  public reconnectRoom(
    roomId: string,
    clientPlayerId: string,
    user: {
      name: string;
      avatar: string;
      profileBorder?: string;
      usernameBorder?: string;
    }
  ) {
    this.getSocket().emit('reconnect_room', { roomId, clientPlayerId, userData: user });
  }

  public getRoomLobby(roomId: string) {
    this.getSocket().emit('get_room_lobby', { roomId });
  }

  public leaveRoom(roomId: string, clientPlayerId?: string, isExplicitForfeit: boolean = false) {
    this.getSocket().emit('leave_room', { roomId, clientPlayerId, isExplicitForfeit });
  }

  public setPlayerAway(roomId: string, isAway: boolean) {
    this.getSocket().emit('player_away', { roomId, isAway });
  }

  public startRoomGame(roomId: string, clientPlayerId?: string) {
    this.getSocket().emit('start_room_game', { roomId, clientPlayerId });
  }

  public playCard(roomId: string, cardId: string) {
    this.getSocket().emit('play_card', { roomId, cardId });
  }

  public drawCard(roomId: string) {
    this.getSocket().emit('draw_card', { roomId });
  }

  public passTurn(roomId: string) {
    this.getSocket().emit('pass_turn', { roomId });
  }

  public selectWildColor(roomId: string, color: CardColor) {
    this.getSocket().emit('select_wild_color', { roomId, color });
  }

  public callRush(roomId: string) {
    this.getSocket().emit('call_rush', { roomId });
  }

  public catchRush(roomId: string, targetPlayerId: string) {
    this.getSocket().emit('catch_rush', { roomId, targetPlayerId });
  }

  public setRematchReady(roomId: string, ready: boolean) {
    this.getSocket().emit('set_rematch_ready', { roomId, ready });
  }
}

export const socketService = new SocketService();
