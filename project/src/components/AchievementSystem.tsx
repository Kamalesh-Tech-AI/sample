import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Award, Lock, CheckCircle } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'building' | 'survival' | 'exploration' | 'crafting' | 'social' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  points: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  icon: string;
  reward?: {
    type: 'item' | 'title' | 'cosmetic';
    value: string;
  };
}

interface AchievementSystemProps {
  isOpen: boolean;
  onClose: () => void;
  gameStats?: any;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  isOpen,
  onClose,
  gameStats
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'building', name: 'Building', icon: Target },
    { id: 'survival', name: 'Survival', icon: Award },
    { id: 'exploration', name: 'Exploration', icon: Star },
    { id: 'crafting', name: 'Crafting', icon: Target },
    { id: 'social', name: 'Social', icon: Award },
    { id: 'special', name: 'Special', icon: Trophy }
  ];

  useEffect(() => {
    if (isOpen) {
      loadAchievements();
      loadPlayerProgress();
    }
  }, [isOpen]);

  const loadAchievements = () => {
    const mockAchievements: Achievement[] = [
      {
        id: 'first_block',
        name: 'Getting Started',
        description: 'Place your first block',
        category: 'building',
        difficulty: 'easy',
        points: 10,
        isUnlocked: true,
        unlockedAt: new Date('2024-01-01'),
        progress: 1,
        maxProgress: 1,
        icon: '🧱'
      },
      {
        id: 'hundred_blocks',
        name: 'Builder',
        description: 'Place 100 blocks',
        category: 'building',
        difficulty: 'medium',
        points: 50,
        isUnlocked: false,
        progress: 67,
        maxProgress: 100,
        icon: '🏗️'
      },
      {
        id: 'first_craft',
        name: 'Craftsman',
        description: 'Craft your first item',
        category: 'crafting',
        difficulty: 'easy',
        points: 15,
        isUnlocked: true,
        unlockedAt: new Date('2024-01-02'),
        progress: 1,
        maxProgress: 1,
        icon: '🔨'
      },
      {
        id: 'survive_night',
        name: 'Night Owl',
        description: 'Survive your first night',
        category: 'survival',
        difficulty: 'medium',
        points: 30,
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        icon: '🌙'
      },
      {
        id: 'diamond_finder',
        name: 'Diamond Hunter',
        description: 'Find your first diamond',
        category: 'exploration',
        difficulty: 'hard',
        points: 100,
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        icon: '💎'
      },
      {
        id: 'master_builder',
        name: 'Master Builder',
        description: 'Build a structure with 1000+ blocks',
        category: 'building',
        difficulty: 'legendary',
        points: 500,
        isUnlocked: false,
        progress: 0,
        maxProgress: 1000,
        icon: '🏰'
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Play with 10 different friends',
        category: 'social',
        difficulty: 'medium',
        points: 75,
        isUnlocked: false,
        progress: 3,
        maxProgress: 10,
        icon: '👥'
      },
      {
        id: 'speed_runner',
        name: 'Speed Runner',
        description: 'Complete the game in under 2 hours',
        category: 'special',
        difficulty: 'legendary',
        points: 1000,
        isUnlocked: false,
        progress: 0,
        maxProgress: 1,
        icon: '⚡'
      }
    ];

    setAchievements(mockAchievements);
    
    // Load from localStorage
    const saved = localStorage.getItem('voxelcraft-achievements');
    if (saved) {
      try {
        const savedAchievements = JSON.parse(saved);
        setAchievements(savedAchievements);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      }
    }
  };

  const loadPlayerProgress = () => {
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    const points = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
    setTotalPoints(points);
    setPlayerLevel(Math.floor(points / 100) + 1);
    
    // Get recent unlocks (last 7 days)
    const recent = unlockedAchievements.filter(a => 
      a.unlockedAt && 
      (Date.now() - a.unlockedAt.getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    setRecentUnlocks(recent);
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => 
        achievement.id === achievementId
          ? { ...achievement, isUnlocked: true, unlockedAt: new Date(), progress: achievement.maxProgress }
          : achievement
      );
      
      localStorage.setItem('voxelcraft-achievements', JSON.stringify(updated));
      return updated;
    });
  };

  const updateProgress = (achievementId: string, progress: number) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.id === achievementId) {
          const newProgress = Math.min(progress, achievement.maxProgress);
          const shouldUnlock = newProgress >= achievement.maxProgress && !achievement.isUnlocked;
          
          return {
            ...achievement,
            progress: newProgress,
            isUnlocked: shouldUnlock || achievement.isUnlocked,
            unlockedAt: shouldUnlock ? new Date() : achievement.unlockedAt
          };
        }
        return achievement;
      });
      
      localStorage.setItem('voxelcraft-achievements', JSON.stringify(updated));
      return updated;
    });
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return (achievement.progress / achievement.maxProgress) * 100;
  };

  const getCompletionStats = () => {
    const total = achievements.length;
    const completed = achievements.filter(a => a.isUnlocked).length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  if (!isOpen) return null;

  const stats = getCompletionStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-yellow-600 max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-yellow-400">Achievements</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Player Stats */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{totalPoints}</div>
              <div className="text-sm text-gray-400">Achievement Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{playerLevel}</div>
              <div className="text-sm text-gray-400">Player Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}/{stats.total}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Progress</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto border-b border-gray-700">
          {categories.map(category => {
            const categoryAchievements = achievements.filter(a => 
              category.id === 'all' || a.category === category.id
            );
            const completed = categoryAchievements.filter(a => a.isUnlocked).length;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 py-3 px-4 text-center transition-colors border-b-2 ${
                  selectedCategory === category.id
                    ? 'border-yellow-400 bg-gray-800 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <category.icon className="w-4 h-4 mx-auto mb-1" />
                <div className="text-sm font-medium">{category.name}</div>
                <div className="text-xs text-gray-500">{completed}/{categoryAchievements.length}</div>
              </button>
            );
          })}
        </div>

        {/* Achievements List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Recent Unlocks */}
          {recentUnlocks.length > 0 && selectedCategory === 'all' && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Recently Unlocked
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentUnlocks.map(achievement => (
                  <div key={achievement.id} className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-yellow-400 font-medium">{achievement.name}</h4>
                        <p className="text-gray-300 text-sm">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400 text-sm">+{achievement.points} points</span>
                          <span className="text-gray-500 text-xs">
                            {achievement.unlockedAt?.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFilteredAchievements().map(achievement => (
              <div
                key={achievement.id}
                className={`rounded-lg p-4 border transition-all ${
                  achievement.isUnlocked
                    ? 'bg-gray-800 border-green-600'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`text-3xl ${achievement.isUnlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.isUnlocked ? achievement.icon : '🔒'}
                    </div>
                    {achievement.isUnlocked && (
                      <CheckCircle className="w-4 h-4 text-green-400 absolute -top-1 -right-1" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-medium ${achievement.isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                        {achievement.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getDifficultyColor(achievement.difficulty)}`}>
                          {achievement.difficulty}
                        </span>
                        <span className="text-yellow-400 text-sm">+{achievement.points}</span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-3 ${achievement.isUnlocked ? 'text-gray-300' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>
                    
                    {/* Progress Bar */}
                    {!achievement.isUnlocked && achievement.maxProgress > 1 && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(achievement)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <div className="text-xs text-green-400">
                        Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                      </div>
                    )}
                    
                    {achievement.reward && (
                      <div className="mt-2 p-2 bg-purple-900 bg-opacity-30 rounded text-xs">
                        <span className="text-purple-400">Reward: </span>
                        <span className="text-white">{achievement.reward.value}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};