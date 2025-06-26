import React from 'react';
import { Save, Users, Settings, MessageCircle, Map, Bot, Package, Activity, Trophy, Cloud } from 'lucide-react';

interface GameHUDProps {
  isMultiplayer: boolean;
  roomId?: string;
  onSaveGame: () => void;
  onShowSaveManager: () => void;
  onShowCloudSaves: () => void;
  onShowSettings: () => void;
  onShowChat: () => void;
  onShowMap: () => void;
  onShowAI: () => void;
  onShowMods: () => void;
  onShowPerformance: () => void;
  onShowAchievements: () => void;
  connectedPlayers?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  isMultiplayer,
  roomId,
  onSaveGame,
  onShowSaveManager,
  onShowCloudSaves,
  onShowSettings,
  onShowChat,
  onShowMap,
  onShowAI,
  onShowMods,
  onShowPerformance,
  onShowAchievements,
  connectedPlayers = 1
}) => {
  return (
    <div className="fixed top-4 right-4 z-40 space-y-2">
      {/* Room Info (Multiplayer) */}
      {isMultiplayer && roomId && (
        <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-green-400" />
            <span>Room: {roomId}</span>
            <span className="text-gray-300">({connectedPlayers} players)</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onSaveGame}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Quick Save (Ctrl+S)"
        >
          <Save className="w-5 h-5" />
        </button>

        <button
          onClick={onShowSaveManager}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Save Manager"
        >
          <Save className="w-5 h-5 text-blue-400" />
        </button>

        <button
          onClick={onShowCloudSaves}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Cloud Saves"
        >
          <Cloud className="w-5 h-5 text-blue-400" />
        </button>

        <button
          onClick={onShowAI}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="AI Assistant (H)"
        >
          <Bot className="w-5 h-5 text-purple-400" />
        </button>

        <button
          onClick={onShowAchievements}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Achievements (J)"
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
        </button>

        <button
          onClick={onShowMods}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Mod Manager (M)"
        >
          <Package className="w-5 h-5 text-purple-400" />
        </button>

        <button
          onClick={onShowPerformance}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Performance Monitor (P)"
        >
          <Activity className="w-5 h-5 text-green-400" />
        </button>

        <button
          onClick={onShowMap}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Map (M)"
        >
          <Map className="w-5 h-5" />
        </button>

        {isMultiplayer && (
          <button
            onClick={onShowChat}
            className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
            title="Chat (T)"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onShowSettings}
          className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-opacity-80 transition-all text-white"
          title="Settings (ESC)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};