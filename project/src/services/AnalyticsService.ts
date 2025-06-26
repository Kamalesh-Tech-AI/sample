import { env } from '../config/env';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface GameAnalytics {
  sessionStart: Date;
  sessionEnd?: Date;
  blocksPlaced: number;
  blocksDestroyed: number;
  itemsCrafted: number;
  distanceTraveled: number;
  timeInGame: number;
  achievements: string[];
  deaths: number;
  level: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId: string | null = null;
  private gameSession: GameAnalytics;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.gameSession = this.initializeGameSession();
    this.setupEventListeners();
    this.initializeGoogleAnalytics();
    this.initializeSentry();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private initializeGameSession(): GameAnalytics {
    return {
      sessionStart: new Date(),
      blocksPlaced: 0,
      blocksDestroyed: 0,
      itemsCrafted: 0,
      distanceTraveled: 0,
      timeInGame: 0,
      achievements: [],
      deaths: 0,
      level: 1
    };
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEventQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility for session tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_pause');
      } else {
        this.trackEvent('session_resume');
      }
    });

    // Before unload for session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private initializeGoogleAnalytics(): void {
    const gaId = env.get().googleAnalyticsId;
    if (!gaId) return;

    // Load Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', gaId, {
      send_page_view: false // We'll handle page views manually
    });
  }

  private initializeSentry(): void {
    const sentryDsn = env.get().sentryDsn;
    if (!sentryDsn) return;

    // Initialize Sentry for error tracking
    import('@sentry/browser').then(Sentry => {
      Sentry.init({
        dsn: sentryDsn,
        environment: env.get().appEnv,
        integrations: [
          new Sentry.BrowserTracing(),
        ],
        tracesSampleRate: env.isDevelopment() ? 1.0 : 0.1,
      });
    }).catch(error => {
      console.warn('Failed to initialize Sentry:', error);
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
    
    // Set user in Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', env.get().googleAnalyticsId, {
        user_id: userId
      });
    }

    // Set user in Sentry
    import('@sentry/browser').then(Sentry => {
      Sentry.setUser({ id: userId });
    }).catch(() => {});
  }

  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: new Date(),
      userId: this.userId || undefined,
      sessionId: this.sessionId
    };

    // Add to queue
    this.eventQueue.push(event);

    // Track in Google Analytics
    this.trackInGoogleAnalytics(event);

    // Send to backend if online
    if (this.isOnline) {
      this.sendEventToBackend(event);
    }

    // Log in development
    if (env.isDevelopment()) {
      console.log('Analytics Event:', event);
    }
  }

  private trackInGoogleAnalytics(event: AnalyticsEvent): void {
    if ((window as any).gtag) {
      (window as any).gtag('event', event.name, {
        event_category: 'game',
        event_label: event.properties?.label,
        value: event.properties?.value,
        custom_map: event.properties
      });
    }
  }

  private async sendEventToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      const response = await fetch(`${env.get().apiBaseUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
      // Keep in queue for retry
    }
  }

  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      const response = await fetch(`${env.get().apiBaseUrl}/analytics/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });

      if (response.ok) {
        this.eventQueue = [];
      }
    } catch (error) {
      console.warn('Failed to flush analytics queue:', error);
    }
  }

  // Game-specific tracking methods
  trackBlockPlaced(blockType: string, position: [number, number, number]): void {
    this.gameSession.blocksPlaced++;
    this.trackEvent('block_placed', {
      blockType,
      position,
      totalBlocks: this.gameSession.blocksPlaced
    });
  }

  trackBlockDestroyed(blockType: string, position: [number, number, number]): void {
    this.gameSession.blocksDestroyed++;
    this.trackEvent('block_destroyed', {
      blockType,
      position,
      totalDestroyed: this.gameSession.blocksDestroyed
    });
  }

  trackItemCrafted(itemName: string, quantity: number): void {
    this.gameSession.itemsCrafted += quantity;
    this.trackEvent('item_crafted', {
      itemName,
      quantity,
      totalCrafted: this.gameSession.itemsCrafted
    });
  }

  trackPlayerMovement(distance: number, position: [number, number, number]): void {
    this.gameSession.distanceTraveled += distance;
    this.trackEvent('player_movement', {
      distance,
      position,
      totalDistance: this.gameSession.distanceTraveled
    });
  }

  trackAchievement(achievementId: string, achievementName: string): void {
    if (!this.gameSession.achievements.includes(achievementId)) {
      this.gameSession.achievements.push(achievementId);
      this.trackEvent('achievement_unlocked', {
        achievementId,
        achievementName,
        totalAchievements: this.gameSession.achievements.length
      });
    }
  }

  trackPlayerDeath(cause: string, position: [number, number, number]): void {
    this.gameSession.deaths++;
    this.trackEvent('player_death', {
      cause,
      position,
      totalDeaths: this.gameSession.deaths
    });
  }

  trackLevelUp(newLevel: number): void {
    this.gameSession.level = newLevel;
    this.trackEvent('level_up', {
      newLevel,
      sessionStats: this.gameSession
    });
  }

  trackMultiplayerJoin(roomId: string, playerCount: number): void {
    this.trackEvent('multiplayer_join', {
      roomId,
      playerCount
    });
  }

  trackMultiplayerLeave(roomId: string, sessionDuration: number): void {
    this.trackEvent('multiplayer_leave', {
      roomId,
      sessionDuration
    });
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href
    });

    // Also send to Sentry
    import('@sentry/browser').then(Sentry => {
      Sentry.captureException(error, {
        tags: { context },
        extra: { sessionId: this.sessionId }
      });
    }).catch(() => {});
  }

  endSession(): void {
    this.gameSession.sessionEnd = new Date();
    this.gameSession.timeInGame = this.gameSession.sessionEnd.getTime() - this.gameSession.sessionStart.getTime();

    this.trackEvent('session_end', {
      sessionStats: this.gameSession,
      duration: this.gameSession.timeInGame
    });

    // Flush remaining events
    this.flushEventQueue();
  }

  getSessionStats(): GameAnalytics {
    return { ...this.gameSession };
  }
}
