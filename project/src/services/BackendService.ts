import { env } from '../config/env';

export interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  lastLogin: Date;
  subscription: 'free' | 'premium' | 'pro';
  stats: {
    gamesPlayed: number;
    blocksPlaced: number;
    itemsCrafted: number;
    achievements: string[];
  };
}

export interface SaveMetadata {
  id: string;
  name: string;
  description?: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
  version: string;
  worldSeed: string;
}

export class BackendService {
  private static instance: BackendService;
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = env.get().apiBaseUrl;
  }

  static getInstance(): BackendService {
    if (!BackendService.instance) {
      BackendService.instance = new BackendService();
    }
    return BackendService.instance;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('voxelcraft_auth_token', token);
  }

  getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('voxelcraft_auth_token');
    }
    return this.authToken;
  }

  clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('voxelcraft_auth_token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BackendResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Backend request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<BackendResponse<{ token: string; user: UserProfile }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async register(username: string, email: string, password: string): Promise<BackendResponse<{ token: string; user: UserProfile }>> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  async socialLogin(provider: string, token: string): Promise<BackendResponse<{ token: string; user: UserProfile }>> {
    return this.makeRequest('/auth/social', {
      method: 'POST',
      body: JSON.stringify({ provider, token })
    });
  }

  async logout(): Promise<BackendResponse> {
    const result = await this.makeRequest('/auth/logout', {
      method: 'POST'
    });
    this.clearAuthToken();
    return result;
  }

  // User Profile
  async getProfile(): Promise<BackendResponse<UserProfile>> {
    return this.makeRequest('/user/profile');
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<BackendResponse<UserProfile>> {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Save Management
  async uploadSave(saveData: any, metadata: Partial<SaveMetadata>): Promise<BackendResponse<SaveMetadata>> {
    return this.makeRequest('/saves', {
      method: 'POST',
      body: JSON.stringify({ saveData, metadata })
    });
  }

  async getSaves(): Promise<BackendResponse<SaveMetadata[]>> {
    return this.makeRequest('/saves');
  }

  async getSave(saveId: string): Promise<BackendResponse<{ metadata: SaveMetadata; data: any }>> {
    return this.makeRequest(`/saves/${saveId}`);
  }

  async deleteSave(saveId: string): Promise<BackendResponse> {
    return this.makeRequest(`/saves/${saveId}`, {
      method: 'DELETE'
    });
  }

  async getPublicSaves(page = 1, limit = 20): Promise<BackendResponse<{ saves: SaveMetadata[]; total: number }>> {
    return this.makeRequest(`/saves/public?page=${page}&limit=${limit}`);
  }

  // Multiplayer
  async createRoom(roomData: any): Promise<BackendResponse<{ roomId: string; joinCode: string }>> {
    return this.makeRequest('/multiplayer/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
  }

  async joinRoom(roomId: string, password?: string): Promise<BackendResponse<{ room: any; players: any[] }>> {
    return this.makeRequest(`/multiplayer/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }

  async getRoomInfo(roomId: string): Promise<BackendResponse<any>> {
    return this.makeRequest(`/multiplayer/rooms/${roomId}`);
  }

  // Analytics
  async trackEvent(event: string, data: any): Promise<BackendResponse> {
    return this.makeRequest('/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
    });
  }

  async getPlayerStats(): Promise<BackendResponse<any>> {
    return this.makeRequest('/analytics/stats');
  }

  // Leaderboards
  async getLeaderboard(type: string, timeframe = 'all'): Promise<BackendResponse<any[]>> {
    return this.makeRequest(`/leaderboards/${type}?timeframe=${timeframe}`);
  }

  // Friends
  async getFriends(): Promise<BackendResponse<any[]>> {
    return this.makeRequest('/friends');
  }

  async addFriend(username: string): Promise<BackendResponse> {
    return this.makeRequest('/friends', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  }

  async removeFriend(friendId: string): Promise<BackendResponse> {
    return this.makeRequest(`/friends/${friendId}`, {
      method: 'DELETE'
    });
  }

  // Health Check
  async healthCheck(): Promise<BackendResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('/health');
  }
}
