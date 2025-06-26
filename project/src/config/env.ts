// Environment configuration with validation
export interface EnvConfig {
  // API Keys
  openRouterApiKey: string;
  openAiApiKey: string;
  
  // Cloud Services
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  
  // Multiplayer
  socketServerUrl: string;
  peerJsHost: string;
  peerJsPort: number;
  
  // Cloud Storage
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsBucketName: string;
  
  // Analytics
  googleAnalyticsId: string;
  sentryDsn: string;
  
  // Authentication
  googleClientId: string;
  githubClientId: string;
  discordClientId: string;
  
  // App Config
  appEnv: 'development' | 'production' | 'staging';
  apiBaseUrl: string;
  debugMode: boolean;
}

class EnvironmentConfig {
  private config: EnvConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvConfig {
    return {
      // API Keys
      openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      
      // Cloud Services
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      
      // Multiplayer
      socketServerUrl: import.meta.env.VITE_SOCKET_SERVER_URL || 'wss://voxelcraft-server.herokuapp.com',
      peerJsHost: import.meta.env.VITE_PEERJS_HOST || 'peerjs-server.herokuapp.com',
      peerJsPort: parseInt(import.meta.env.VITE_PEERJS_PORT || '443'),
      
      // Cloud Storage
      awsAccessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      awsSecretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
      awsRegion: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      awsBucketName: import.meta.env.VITE_AWS_BUCKET_NAME || '',
      
      // Analytics
      googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '',
      sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
      
      // Authentication
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      discordClientId: import.meta.env.VITE_DISCORD_CLIENT_ID || '',
      
      // App Config
      appEnv: (import.meta.env.VITE_APP_ENV as 'development' | 'production' | 'staging') || 'development',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
    };
  }

  private validateConfig(): void {
    const requiredKeys: (keyof EnvConfig)[] = [];
    
    // Only validate required keys in production
    if (this.config.appEnv === 'production') {
      requiredKeys.push('openRouterApiKey', 'supabaseUrl', 'supabaseAnonKey');
    }

    const missingKeys = requiredKeys.filter(key => !this.config[key]);
    
    if (missingKeys.length > 0) {
      console.warn('Missing required environment variables:', missingKeys);
      if (this.config.appEnv === 'production') {
        throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
      }
    }
  }

  get(): EnvConfig {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.appEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.appEnv === 'production';
  }

  isDebugMode(): boolean {
    return this.config.debugMode;
  }
}

export const env = new EnvironmentConfig();
