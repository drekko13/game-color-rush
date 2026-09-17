import { io, Socket } from 'socket.io-client';
import type { CardColor } from '../types/game';

class SocketService {
  public socket: Socket | null = null;
  public isConnected: boolean = false;

  public init(): Socket {
    if (this.socket) return this.socket;

    // In dev: http://localhost:3001
    // In production: set VITE_SERVER_URL in Vercel dashboard to your Railway server URL
    const serverUrl =
      import.meta.env.VITE_SERVER_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '' // will fail gracefully if not set
        : 'http://localhost:3001');

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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

  public joinMatchmaking(user: { name: string; avatar: string; clientPlayerId?: string }) {
    this.getSocket().emit('join_matchmaking', user);
  }

  public leaveMatchmaking() {
    this.getSocket().emit('leave_matchmaking');
  }

  public createRoom(user: { name: string; avatar: string; isPublic?: boolean; maxPlayers?: number; clientPlayerId?: string }) {
    this.getSocket().emit('create_room', user);
  }

  public joinRandomMatch(user: { name: string; avatar: string; clientPlayerId?: string }) {
    this.getSocket().emit('random_match', user);
  }

  public getPublicRooms() {
    this.getSocket().emit('get_public_rooms');
  }

  public getOnlineCount() {
    this.getSocket().emit('get_online_count');
  }

  public joinRoom(roomId: string, user: { name: string; avatar: string; clientPlayerId?: string }) {
    this.getSocket().emit('join_room', { roomId, userData: user });
  }

  public reconnectRoom(roomId: string, clientPlayerId: string, user: { name: string; avatar: string }) {
    this.getSocket().emit('reconnect_room', { roomId, clientPlayerId, userData: user });
  }

  public getRoomLobby(roomId: string) {
    this.getSocket().emit('get_room_lobby', { roomId });
  }

  public leaveRoom(roomId: string) {
    this.getSocket().emit('leave_room', { roomId });
  }

  public startRoomGame(roomId: string) {
    this.getSocket().emit('start_room_game', { roomId });
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
}

export const socketService = new SocketService();
