import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;
  private config: SupabaseConfig;

  constructor() {
    this.config = {
      url: env.get().supabaseUrl,
      anonKey: env.get().supabaseAnonKey,
      serviceRoleKey: env.get().supabaseServiceRoleKey
    };

    if (!this.config.url || !this.config.anonKey) {
      console.warn('Supabase configuration missing. Some features may not work.');
      // Create a mock client for development
      this.client = {} as SupabaseClient;
      return;
    }

    this.client = createClient(this.config.url, this.config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  // Authentication methods
  async signUp(email: string, password: string, username: string) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase signup error:', error);
      return { success: false, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase signin error:', error);
      return { success: false, error };
    }
  }

  async signInWithProvider(provider: 'google' | 'github' | 'discord') {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase OAuth error:', error);
      return { success: false, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase signout error:', error);
      return { success: false, error };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error };
    }
  }

  // Database methods
  async saveToDB(table: string, data: any) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Database save error:', error);
      return { success: false, error };
    }
  }

  async getFromDB(table: string, filters?: any) {
    try {
      let query = this.client.from(table).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Database fetch error:', error);
      return { success: false, error };
    }
  }

  async updateInDB(table: string, id: string, updates: any) {
    try {
      const { data, error } = await this.client
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Database update error:', error);
      return { success: false, error };
    }
  }

  async deleteFromDB(table: string, id: string) {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Database delete error:', error);
      return { success: false, error };
    }
  }

  // Storage methods
  async uploadFile(bucket: string, path: string, file: File) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error };
    }
  }

  async downloadFile(bucket: string, path: string) {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .download(path);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('File download error:', error);
      return { success: false, error };
    }
  }

  async getPublicUrl(bucket: string, path: string) {
    try {
      const { data } = this.client.storage
        .from(bucket)
        .getPublicUrl(path);

      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error('Get public URL error:', error);
      return { success: false, error };
    }
  }

  // Realtime subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return this.client
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('health_check')
        .select('*')
        .limit(1);

      return { success: !error, data };
    } catch (error) {
      return { success: false, error };
    }
  }
}
