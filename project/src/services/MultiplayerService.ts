import { io, Socket } from 'socket.io-client';
import Peer, { DataConnection } from 'peerjs';

export interface PlayerData {
  id: string;
  username: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  isOnline: boolean;
  avatar?: string;
}

export interface RoomData {
  id: string;
  name: string;
  players: PlayerData[];
  maxPlayers: number;
  isPrivate: boolean;
  worldSeed: string;
  gameMode: 'survival' | 'creative' | 'adventure';
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'whisper';
}

export class MultiplayerService {
  private static instance: MultiplayerService;
  private socket: Socket | null = null;
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private currentRoom: RoomData | null = null;
  private currentPlayer: PlayerData | null = null;
  private isHost = false;

  // Event callbacks
  private onPlayerJoin?: (player: PlayerData) => void;
  private onPlayerLeave?: (playerId: string) => void;
  private onPlayerUpdate?: (player: PlayerData) => void;
  private onChatMessage?: (message: ChatMessage) => void;
  private onWorldUpdate?: (worldData: any) => void;

  static getInstance(): MultiplayerService {
    if (!MultiplayerService.instance) {
      MultiplayerService.instance = new MultiplayerService();
    }
    return MultiplayerService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize PeerJS for P2P connections
      this.peer = new Peer({
        host: 'peerjs-server.herokuapp.com',
        port: 443,
        secure: true,
        debug: 2
      });

      this.peer.on('open', (id) => {
        console.log('PeerJS connected with ID:', id);
      });

      this.peer.on('connection', (conn) => {
        this.handlePeerConnection(conn);
      });

      this.peer.on('error', (error) => {
        console.error('PeerJS error:', error);
      });

      // Initialize Socket.IO for signaling (fallback to local simulation)
      this.initializeSocketConnection();

    } catch (error) {
      console.error('Failed to initialize multiplayer service:', error);
      // Continue with local simulation
    }
  }

  private initializeSocketConnection(): void {
    try {
      // Try to connect to actual server, fallback to simulation
      this.socket = io('wss://voxelcraft-server.herokuapp.com', {
        transports: ['websocket'],
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('Connected to multiplayer server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from multiplayer server');
      });

      this.socket.on('room-joined', (roomData: RoomData) => {
        this.currentRoom = roomData;
        console.log('Joined room:', roomData.id);
      });

      this.socket.on('player-joined', (player: PlayerData) => {
        if (this.onPlayerJoin) {
          this.onPlayerJoin(player);
        }
      });

      this.socket.on('player-left', (playerId: string) => {
        if (this.onPlayerLeave) {
          this.onPlayerLeave(playerId);
        }
      });

      this.socket.on('player-update', (player: PlayerData) => {
        if (this.onPlayerUpdate) {
          this.onPlayerUpdate(player);
        }
      });

      this.socket.on('chat-message', (message: ChatMessage) => {
        if (this.onChatMessage) {
          this.onChatMessage(message);
        }
      });

      this.socket.on('world-update', (worldData: any) => {
        if (this.onWorldUpdate) {
          this.onWorldUpdate(worldData);
        }
      });

    } catch (error) {
      console.warn('Socket.IO connection failed, using local simulation');
      this.simulateMultiplayerLocally();
    }
  }

  private simulateMultiplayerLocally(): void {
    // Simulate multiplayer functionality locally for development
    console.log('Running in local multiplayer simulation mode');
    
    // Create mock players
    setTimeout(() => {
      const mockPlayers: PlayerData[] = [
        {
          id: 'bot1',
          username: 'Steve_AI',
          position: [10, 70, 10],
          rotation: [0, 0, 0],
          health: 20,
          isOnline: true
        },
        {
          id: 'bot2',
          username: 'Alex_Bot',
          position: [-10, 70, -10],
          rotation: [0, 0, 0],
          health: 20,
          isOnline: true
        }
      ];

      mockPlayers.forEach(player => {
        if (this.onPlayerJoin) {
          this.onPlayerJoin(player);
        }
      });

      // Simulate chat messages
      setInterval(() => {
        const messages = [
          'Hey everyone!',
          'Nice build!',
          'Anyone want to explore together?',
          'Found some diamonds!',
          'Building a castle over here'
        ];

        const randomPlayer = mockPlayers[Math.floor(Math.random() * mockPlayers.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        if (this.onChatMessage && Math.random() < 0.1) { // 10% chance every interval
          this.onChatMessage({
            id: Date.now().toString(),
            playerId: randomPlayer.id,
            username: randomPlayer.username,
            message: randomMessage,
            timestamp: new Date(),
            type: 'chat'
          });
        }
      }, 10000); // Every 10 seconds

    }, 2000);
  }

  private handlePeerConnection(conn: DataConnection): void {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data: any) => {
      this.handlePeerData(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.onPlayerLeave) {
        this.onPlayerLeave(conn.peer);
      }
    });
  }

  private handlePeerData(data: any, peerId: string): void {
    switch (data.type) {
      case 'player-update':
        if (this.onPlayerUpdate) {
          this.onPlayerUpdate(data.player);
        }
        break;
      case 'chat-message':
        if (this.onChatMessage) {
          this.onChatMessage(data.message);
        }
        break;
      case 'world-update':
        if (this.onWorldUpdate) {
          this.onWorldUpdate(data.worldData);
        }
        break;
    }
  }

  async createRoom(roomName: string, maxPlayers: number = 8, isPrivate: boolean = false): Promise<RoomData> {
    const roomData: RoomData = {
      id: this.generateRoomId(),
      name: roomName,
      players: [],
      maxPlayers,
      isPrivate,
      worldSeed: Math.random().toString(36).substring(7),
      gameMode: 'survival'
    };

    this.currentRoom = roomData;
    this.isHost = true;

    if (this.socket) {
      this.socket.emit('create-room', roomData);
    }

    return roomData;
  }

  async joinRoom(roomId: string, password?: string): Promise<RoomData> {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, password });
    } else {
      // Simulate joining room locally
      const mockRoom: RoomData = {
        id: roomId,
        name: 'Local Room',
        players: [],
        maxPlayers: 8,
        isPrivate: false,
        worldSeed: 'local-seed',
        gameMode: 'survival'
      };
      this.currentRoom = mockRoom;
      return mockRoom;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Room join timeout'));
      }, 10000);

      this.socket?.once('room-joined', (roomData: RoomData) => {
        clearTimeout(timeout);
        resolve(roomData);
      });

      this.socket?.once('room-join-error', (error: string) => {
        clearTimeout(timeout);
        reject(new Error(error));
      });
    });
  }

  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('leave-room');
    }

    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.currentRoom = null;
    this.isHost = false;
  }

  sendChatMessage(message: string): void {
    if (!this.currentPlayer) return;

    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: this.currentPlayer.id,
      username: this.currentPlayer.username,
      message,
      timestamp: new Date(),
      type: 'chat'
    };

    if (this.socket) {
      this.socket.emit('chat-message', chatMessage);
    } else {
      // Broadcast to peer connections
      this.connections.forEach(conn => {
        conn.send({
          type: 'chat-message',
          message: chatMessage
        });
      });
    }
  }

  updatePlayerPosition(position: [number, number, number], rotation: [number, number, number]): void {
    if (!this.currentPlayer) return;

    this.currentPlayer.position = position;
    this.currentPlayer.rotation = rotation;

    const updateData = {
      type: 'player-update',
      player: this.currentPlayer
    };

    if (this.socket) {
      this.socket.emit('player-update', this.currentPlayer);
    } else {
      // Broadcast to peer connections
      this.connections.forEach(conn => {
        conn.send(updateData);
      });
    }
  }

  updateWorld(worldData: any): void {
    if (!this.isHost) return;

    const updateData = {
      type: 'world-update',
      worldData
    };

    if (this.socket) {
      this.socket.emit('world-update', worldData);
    } else {
      // Broadcast to peer connections
      this.connections.forEach(conn => {
        conn.send(updateData);
      });
    }
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Event listeners
  onPlayerJoinEvent(callback: (player: PlayerData) => void): void {
    this.onPlayerJoin = callback;
  }

  onPlayerLeaveEvent(callback: (playerId: string) => void): void {
    this.onPlayerLeave = callback;
  }

  onPlayerUpdateEvent(callback: (player: PlayerData) => void): void {
    this.onPlayerUpdate = callback;
  }

  onChatMessageEvent(callback: (message: ChatMessage) => void): void {
    this.onChatMessage = callback;
  }

  onWorldUpdateEvent(callback: (worldData: any) => void): void {
    this.onWorldUpdate = callback;
  }

  getCurrentRoom(): RoomData | null {
    return this.currentRoom;
  }

  setCurrentPlayer(player: PlayerData): void {
    this.currentPlayer = player;
  }

  isConnected(): boolean {
    return this.socket?.connected || this.connections.size > 0;
  }
}