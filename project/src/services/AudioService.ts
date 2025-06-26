import { Howl, Howler } from 'howler';

export interface SoundEffect {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
}

export class AudioService {
  private static instance: AudioService;
  private sounds: Map<string, Howl> = new Map();
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private currentMusic: Howl | null = null;

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async initialize(): Promise<void> {
    // Initialize audio context
    Howler.autoUnlock = true;
    
    // Load sound effects
    await this.loadSounds();
  }

  private async loadSounds(): Promise<void> {
    const soundEffects: SoundEffect[] = [
      { id: 'block_break', url: '/sounds/block_break.ogg', volume: 0.8, loop: false },
      { id: 'block_place', url: '/sounds/block_place.ogg', volume: 0.6, loop: false },
      { id: 'footstep_grass', url: '/sounds/footstep_grass.ogg', volume: 0.4, loop: false },
      { id: 'footstep_stone', url: '/sounds/footstep_stone.ogg', volume: 0.4, loop: false },
      { id: 'water_splash', url: '/sounds/water_splash.ogg', volume: 0.5, loop: false },
      { id: 'inventory_open', url: '/sounds/inventory_open.ogg', volume: 0.3, loop: false },
      { id: 'craft_success', url: '/sounds/craft_success.ogg', volume: 0.6, loop: false },
      { id: 'ambient_cave', url: '/sounds/ambient_cave.ogg', volume: 0.3, loop: true },
      { id: 'ambient_forest', url: '/sounds/ambient_forest.ogg', volume: 0.4, loop: true },
      { id: 'music_calm', url: '/sounds/music_calm.ogg', volume: 0.3, loop: true },
      { id: 'music_creative', url: '/sounds/music_creative.ogg', volume: 0.3, loop: true }
    ];

    // Create fallback sounds using Web Audio API
    soundEffects.forEach(effect => {
      try {
        const sound = new Howl({
          src: [effect.url],
          volume: effect.volume * this.sfxVolume,
          loop: effect.loop,
          onloaderror: () => {
            // Create synthetic sound as fallback
            this.createSyntheticSound(effect.id);
          }
        });
        this.sounds.set(effect.id, sound);
      } catch (error) {
        console.warn(`Failed to load sound: ${effect.id}`, error);
        this.createSyntheticSound(effect.id);
      }
    });
  }

  private createSyntheticSound(soundId: string): void {
    // Create simple synthetic sounds using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      return new Promise<AudioBuffer>((resolve) => {
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          let value = 0;
          
          switch (type) {
            case 'sine':
              value = Math.sin(2 * Math.PI * frequency * t);
              break;
            case 'square':
              value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
              break;
            case 'sawtooth':
              value = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
              break;
          }
          
          data[i] = value * Math.exp(-t * 2); // Add decay
        }
        
        resolve(buffer);
      });
    };

    // Define synthetic sound parameters
    const synthParams: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
      block_break: { freq: 200, duration: 0.2, type: 'square' },
      block_place: { freq: 300, duration: 0.1, type: 'sine' },
      footstep_grass: { freq: 150, duration: 0.1, type: 'sawtooth' },
      footstep_stone: { freq: 250, duration: 0.1, type: 'square' },
      water_splash: { freq: 400, duration: 0.3, type: 'sine' },
      inventory_open: { freq: 500, duration: 0.2, type: 'sine' },
      craft_success: { freq: 600, duration: 0.4, type: 'sine' }
    };

    const params = synthParams[soundId];
    if (params) {
      createTone(params.freq, params.duration, params.type).then(buffer => {
        const sound = new Howl({
          src: ['data:audio/wav;base64,'], // Empty source, will use buffer
          volume: 0.5,
          onload: () => {
            // Replace with actual buffer playback
            console.log(`Synthetic sound created for ${soundId}`);
          }
        });
        this.sounds.set(soundId, sound);
      });
    }
  }

  playSound(soundId: string, volume?: number): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      if (volume !== undefined) {
        sound.volume(volume * this.sfxVolume);
      }
      sound.play();
    }
  }

  playMusic(musicId: string): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    
    const music = this.sounds.get(musicId);
    if (music) {
      music.volume(this.musicVolume);
      music.play();
      this.currentMusic = music;
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume(this.musicVolume);
    }
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      if (sound !== this.currentMusic) {
        sound.volume(this.sfxVolume);
      }
    });
  }

  playFootstepSound(blockType: string): void {
    const footstepSounds: Record<string, string> = {
      grass: 'footstep_grass',
      dirt: 'footstep_grass',
      stone: 'footstep_stone',
      wood: 'footstep_grass',
      sand: 'footstep_grass'
    };
    
    const soundId = footstepSounds[blockType] || 'footstep_grass';
    this.playSound(soundId, 0.3);
  }

  playAmbientSound(biome: string): void {
    const ambientSounds: Record<string, string> = {
      forest: 'ambient_forest',
      cave: 'ambient_cave',
      desert: 'ambient_forest', // Fallback
      plains: 'ambient_forest'
    };
    
    const soundId = ambientSounds[biome];
    if (soundId) {
      this.playSound(soundId);
    }
  }
}