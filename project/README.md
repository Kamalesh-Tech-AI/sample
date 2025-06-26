# VoxelCraft - Minecraft Java Edition Remastered

Enhanced Minecraft-like experience built for the modern web with AI assistance, cloud saves, and multiplayer support.

## Features

- 🎮 **Enhanced Gameplay**: Modern Minecraft-like experience with improved graphics and mechanics
- 🤖 **AI Assistant**: Get building suggestions and gameplay help powered by OpenAI/OpenRouter
- ☁️ **Cloud Saves**: Sync your worlds across devices with Supabase backend
- 👥 **Multiplayer**: Real-time multiplayer with WebRTC and Socket.IO
- 📱 **PWA Support**: Install and play offline on any device
- 🎯 **Achievements**: Track your progress with a comprehensive achievement system
- 🔧 **Mod Support**: Extensible mod system for custom content
- 📊 **Analytics**: Performance monitoring and gameplay analytics

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your API keys and configuration:

### Required for AI Features
- `VITE_OPENROUTER_API_KEY`: Get from [OpenRouter](https://openrouter.ai/)
- `VITE_OPENAI_API_KEY`: Alternative to OpenRouter, get from [OpenAI](https://platform.openai.com/)

### Required for Cloud Features
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

### Optional Services
- `VITE_GOOGLE_ANALYTICS_ID`: For usage analytics
- `VITE_SENTRY_DSN`: For error monitoring
- `VITE_GOOGLE_CLIENT_ID`: For Google OAuth login
- `VITE_GITHUB_CLIENT_ID`: For GitHub OAuth login
- `VITE_DISCORD_CLIENT_ID`: For Discord OAuth login

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Services

### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Get your project URL and API keys from the project settings
3. Set up the following tables in your Supabase database:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Game saves table
CREATE TABLE public.game_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  world_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  size INTEGER,
  version TEXT DEFAULT '1.0.0',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own saves" ON public.game_saves
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create own saves" ON public.game_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saves" ON public.game_saves
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves" ON public.game_saves
  FOR DELETE USING (auth.uid() = user_id);
```

### OpenRouter/OpenAI Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/) (recommended) or [OpenAI](https://platform.openai.com/)
2. Add the key to your `.env` file
3. The AI assistant will provide building suggestions and gameplay help

### Analytics Setup

1. **Google Analytics**: Create a GA4 property and add the measurement ID
2. **Sentry**: Create a Sentry project for error monitoring
3. The app will automatically track gameplay events and errors

## Architecture

### Frontend
- **React 18** with TypeScript
- **Three.js** for 3D rendering
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **PWA** support with Workbox

### Backend Services
- **Supabase** for database, auth, and real-time features
- **OpenRouter/OpenAI** for AI assistance
- **WebRTC + Socket.IO** for multiplayer
- **Google Analytics + Sentry** for monitoring

### Key Components
- `GameEngine`: Core 3D game logic
- `AIService`: AI assistant integration
- `SupabaseService`: Database and auth
- `MultiplayerService`: Real-time multiplayer
- `AnalyticsService`: Event tracking
- `BackendService`: API communication

## Development

### Environment Variables
All environment variables are prefixed with `VITE_` to be accessible in the browser. Sensitive keys should only be used for client-side operations.

### Adding New Features
1. Create services in `src/services/`
2. Add configuration to `src/config/env.ts`
3. Update environment variables in `.env.example`
4. Add proper TypeScript types

### Testing
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Deployment

### Netlify (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push

### Vercel
1. Import project from GitHub
2. Add environment variables
3. Deploy

### Self-hosted
```bash
npm run build
# Serve the dist/ folder with any static file server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see LICENSE file for details.
