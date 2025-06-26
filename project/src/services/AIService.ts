import OpenAI from 'openai';

export interface AIAssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface BuildingSuggestion {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  materials: string[];
  steps: string[];
  image?: string;
}

export class AIService {
  private static instance: AIService;
  private openai: OpenAI;
  private conversationHistory: AIAssistantMessage[] = [];

  constructor() {
    // Initialize with OpenRouter endpoint
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.VITE_OPENROUTER_API_KEY || 'your-openrouter-api-key',
      dangerouslyAllowBrowser: true
    });
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async getBuildingSuggestions(playerInventory: any[], biome: string): Promise<BuildingSuggestion[]> {
    try {
      const prompt = `As a Minecraft building expert, suggest 3 creative building projects for a player in a ${biome} biome with these materials: ${playerInventory.map(item => item.name).join(', ')}. Return suggestions in JSON format with name, description, difficulty, materials, and steps.`;

      const response = await this.openai.chat.completions.create({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Minecraft building assistant. Provide creative and practical building suggestions based on available materials and biome.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          // Fallback suggestions if JSON parsing fails
          return this.getFallbackSuggestions(biome);
        }
      }

      return this.getFallbackSuggestions(biome);
    } catch (error) {
      console.error('AI service error:', error);
      return this.getFallbackSuggestions(biome);
    }
  }

  async chatWithAssistant(message: string, gameContext?: any): Promise<string> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      const contextPrompt = gameContext ? 
        `Current game context: Player position: ${gameContext.position}, Health: ${gameContext.health}, Inventory: ${gameContext.inventory?.length || 0} items` : '';

      const response = await this.openai.chat.completions.create({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `You are a helpful VoxelCraft (Minecraft-like) game assistant. Help players with building, crafting, survival tips, and game mechanics. Be friendly and encouraging. ${contextPrompt}`
          },
          ...this.conversationHistory.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      const assistantResponse = response.choices[0]?.message?.content || 'Sorry, I could not process your request.';
      
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      });

      return assistantResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      return 'Sorry, I\'m having trouble connecting right now. Try asking me something about building or crafting!';
    }
  }

  async generateStructure(description: string): Promise<any> {
    try {
      const prompt = `Generate a 3D structure blueprint for VoxelCraft based on this description: "${description}". Return a JSON object with coordinates and block types for a structure that fits in a 20x20x20 area.`;

      const response = await this.openai.chat.completions.create({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a 3D structure generator for a voxel-based game. Generate practical and aesthetically pleasing structures.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.6
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return this.getFallbackStructure();
        }
      }

      return this.getFallbackStructure();
    } catch (error) {
      console.error('Structure generation error:', error);
      return this.getFallbackStructure();
    }
  }

  private getFallbackSuggestions(biome: string): BuildingSuggestion[] {
    const suggestions = {
      forest: [
        {
          name: 'Treehouse Village',
          description: 'Build connected treehouses using wood and leaves',
          difficulty: 'medium' as const,
          materials: ['Wood', 'Leaves', 'Rope'],
          steps: ['Find large trees', 'Build platforms', 'Connect with bridges', 'Add decorations']
        }
      ],
      desert: [
        {
          name: 'Desert Pyramid',
          description: 'Construct a mysterious pyramid with hidden chambers',
          difficulty: 'hard' as const,
          materials: ['Sandstone', 'Stone', 'Torches'],
          steps: ['Plan pyramid base', 'Build layer by layer', 'Add internal chambers', 'Create entrance']
        }
      ],
      plains: [
        {
          name: 'Windmill Farm',
          description: 'Build a functional windmill with surrounding farmland',
          difficulty: 'easy' as const,
          materials: ['Wood', 'Stone', 'Wool'],
          steps: ['Build windmill base', 'Construct blades', 'Add farmland', 'Plant crops']
        }
      ]
    };

    return suggestions[biome as keyof typeof suggestions] || suggestions.plains;
  }

  private getFallbackStructure(): any {
    return {
      name: 'Simple House',
      blocks: [
        { x: 0, y: 0, z: 0, type: 'stone' },
        { x: 1, y: 0, z: 0, type: 'stone' },
        { x: 0, y: 1, z: 0, type: 'wood' },
        { x: 1, y: 1, z: 0, type: 'wood' }
      ]
    };
  }

  getConversationHistory(): AIAssistantMessage[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}