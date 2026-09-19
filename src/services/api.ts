import type {
  UserProfile,
  MatchHistoryItem,
  ShopCatalog,
  LeaderboardCategory,
  LeaderboardResponse,
} from '../types/game';

const isDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const defaultServerUrl =
  typeof window !== 'undefined' && window.location.hostname && !isDev
    ? `${window.location.protocol}//${window.location.hostname}:9001`
    : 'http://localhost:9001';

const API_BASE_URL = (import.meta.env.VITE_SERVER_URL as string) || defaultServerUrl;
const TOKEN_KEY = 'colorrush_token';

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Register new account
  public async register(payload: {
    username: string;
    email: string;
    password: string;
    avatar?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Pendaftaran gagal. Silakan coba lagi.');
    }

    this.setToken(data.token);
    return { user: data.user, token: data.token };
  }

  // Login with email or username
  public async login(payload: {
    identifier: string;
    password: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login gagal. Periksa username/email dan kata sandi.');
    }

    this.setToken(data.token);
    return { user: data.user, token: data.token };
  }

  // Get current user profile
  public async getMe(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Invalid or expired token
        this.setToken(null);
        return null;
      }

      return data.user;
    } catch {
      return null;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
      } catch {
        // Ignore network error on logout
      }
    }
    this.setToken(null);
  }

  // Update profile avatar / username
  public async updateProfile(payload: {
    avatar?: string;
    username?: string;
  }): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memperbarui profil.');
    }

    return data.user;
  }

  // Save match history and reward points
  public async saveMatchHistory(matchData: {
    gameMode: 'solo' | 'multiplayer';
    result: 'win' | 'loss';
    pointsEarned: number;
    roundScore?: number;
    opponents: string[];
    cardsLeft: number;
  }): Promise<{ user: UserProfile; historyItem: MatchHistoryItem } | null> {
    const token = this.getToken();
    if (!token) return null; // Guest user, skip saving to backend

    try {
      const res = await fetch(`${API_BASE_URL}/api/history`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(matchData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn('[API] Gagal menyimpan history pertandingan:', data.error);
        return null;
      }

      return { user: data.user, historyItem: data.historyItem };
    } catch (err) {
      console.warn('[API] Network error saving match history:', err);
      return null;
    }
  }

  // Get user's match history
  public async getHistory(limit: number = 50): Promise<MatchHistoryItem[]> {
    const token = this.getToken();
    if (!token) return [];

    try {
      const res = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return [];
      }

      return data.history || [];
    } catch {
      return [];
    }
  }

  // Get shop catalog
  public async getShopCatalog(): Promise<ShopCatalog | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/items`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return null;
      }
      return data.catalog;
    } catch {
      return null;
    }
  }

  // Buy shop item
  public async buyShopItem(
    itemType: 'profile_border' | 'username_border',
    itemId: string
  ): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/api/shop/buy`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ itemType, itemId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal membeli item.');
    }

    return data.user;
  }

  // Equip shop item
  public async equipShopItem(
    itemType: 'profile_border' | 'username_border',
    itemId: string
  ): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/api/shop/equip`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ itemType, itemId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memasang item.');
    }

    return data.user;
  }

  // Get Leaderboard rankings
  public async getLeaderboard(
    category: LeaderboardCategory = 'points',
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/leaderboard?sortBy=${category}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          category,
          leaderboard: [],
          currentUserRank: null,
          totalPlayers: 0,
        };
      }

      return data;
    } catch (err) {
      console.warn('[ApiService] Error fetching leaderboard:', err);
      return {
        success: false,
        category,
        leaderboard: [],
        currentUserRank: null,
        totalPlayers: 0,
      };
    }
  }
}

export const apiService = new ApiService();
