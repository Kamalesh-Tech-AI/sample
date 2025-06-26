import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Lightbulb, Hammer, MessageCircle } from 'lucide-react';
import { AIService, AIAssistantMessage, BuildingSuggestion } from '../services/AIService';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  gameContext?: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  gameContext
}) => {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions'>('chat');
  const [buildingSuggestions, setBuildingSuggestions] = useState<BuildingSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiService = AIService.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadConversationHistory();
      loadBuildingSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = () => {
    const history = aiService.getConversationHistory();
    setMessages(history);
  };

  const loadBuildingSuggestions = async () => {
    if (gameContext?.inventory) {
      try {
        const suggestions = await aiService.getBuildingSuggestions(
          gameContext.inventory,
          gameContext.biome || 'plains'
        );
        setBuildingSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to load building suggestions:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.chatWithAssistant(userMessage, gameContext);
      loadConversationHistory(); // Reload to get updated history
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-blue-600 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-blue-400">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Lightbulb className="w-4 h-4 inline mr-2" />
            Building Ideas
          </button>
        </div>

        <div className="h-96 overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Hi! I'm your VoxelCraft AI assistant.</p>
                    <p className="text-sm">Ask me about building, crafting, or survival tips!</p>
                  </div>
                )}
                
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about VoxelCraft..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              <div className="text-center mb-4">
                <h3 className="text-white font-medium mb-2">Building Suggestions</h3>
                <p className="text-gray-400 text-sm">AI-generated ideas based on your inventory</p>
              </div>

              {buildingSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Hammer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Loading building suggestions...</p>
                  <button
                    onClick={loadBuildingSuggestions}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Get Suggestions
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {buildingSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{suggestion.name}</h4>
                        <span className={`text-sm font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
                          {suggestion.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
                      
                      <div className="mb-3">
                        <h5 className="text-gray-400 text-xs font-medium mb-1">Materials needed:</h5>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.materials.map((material, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-gray-400 text-xs font-medium mb-1">Steps:</h5>
                        <ol className="text-gray-300 text-xs space-y-1">
                          {suggestion.steps.map((step, idx) => (
                            <li key={idx} className="flex">
                              <span className="text-blue-400 mr-2">{idx + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};