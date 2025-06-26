import React, { useState, useEffect } from 'react';
import { Package, Download, Upload, Trash2, Settings, Play, Pause, AlertTriangle } from 'lucide-react';

interface Mod {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  isEnabled: boolean;
  isLoaded: boolean;
  dependencies: string[];
  conflicts: string[];
  size: number;
  downloadCount: number;
  rating: number;
  category: string;
  lastUpdated: Date;
}

interface ModManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModManager: React.FC<ModManagerProps> = ({ isOpen, onClose }) => {
  const [installedMods, setInstalledMods] = useState<Mod[]>([]);
  const [availableMods, setAvailableMods] = useState<Mod[]>([]);
  const [activeTab, setActiveTab] = useState<'installed' | 'browse' | 'create'>('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'all', 'gameplay', 'graphics', 'ui', 'tools', 'content', 'optimization'
  ];

  useEffect(() => {
    if (isOpen) {
      loadMods();
    }
  }, [isOpen]);

  const loadMods = () => {
    // Load installed mods from localStorage
    const installed = localStorage.getItem('voxelcraft-installed-mods');
    if (installed) {
      setInstalledMods(JSON.parse(installed));
    }

    // Simulate available mods
    const mockAvailableMods: Mod[] = [
      {
        id: 'better-graphics',
        name: 'Better Graphics Pack',
        version: '2.1.0',
        author: 'GraphicsGuru',
        description: 'Enhanced textures and lighting effects for a more immersive experience',
        isEnabled: false,
        isLoaded: false,
        dependencies: [],
        conflicts: ['lite-graphics'],
        size: 15728640, // 15MB
        downloadCount: 12543,
        rating: 4.8,
        category: 'graphics',
        lastUpdated: new Date('2024-01-15')
      },
      {
        id: 'advanced-crafting',
        name: 'Advanced Crafting System',
        version: '1.5.2',
        author: 'CraftMaster',
        description: 'Adds complex crafting recipes and automation systems',
        isEnabled: false,
        isLoaded: false,
        dependencies: ['core-api'],
        conflicts: [],
        size: 8388608, // 8MB
        downloadCount: 8921,
        rating: 4.6,
        category: 'gameplay',
        lastUpdated: new Date('2024-01-10')
      },
      {
        id: 'ui-overhaul',
        name: 'Modern UI Overhaul',
        version: '3.0.1',
        author: 'UIDesigner',
        description: 'Complete redesign of the user interface with modern elements',
        isEnabled: false,
        isLoaded: false,
        dependencies: [],
        conflicts: ['classic-ui'],
        size: 5242880, // 5MB
        downloadCount: 15632,
        rating: 4.9,
        category: 'ui',
        lastUpdated: new Date('2024-01-20')
      }
    ];

    setAvailableMods(mockAvailableMods);
  };

  const toggleMod = (modId: string) => {
    setInstalledMods(prev => {
      const updated = prev.map(mod => 
        mod.id === modId ? { ...mod, isEnabled: !mod.isEnabled } : mod
      );
      localStorage.setItem('voxelcraft-installed-mods', JSON.stringify(updated));
      return updated;
    });
  };

  const installMod = async (mod: Mod) => {
    setIsLoading(true);
    try {
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newMod = { ...mod, isEnabled: true, isLoaded: false };
      const updated = [...installedMods, newMod];
      setInstalledMods(updated);
      localStorage.setItem('voxelcraft-installed-mods', JSON.stringify(updated));
      
      // Remove from available mods
      setAvailableMods(prev => prev.filter(m => m.id !== mod.id));
    } catch (error) {
      console.error('Failed to install mod:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uninstallMod = (modId: string) => {
    if (!confirm('Are you sure you want to uninstall this mod?')) return;
    
    const mod = installedMods.find(m => m.id === modId);
    if (mod) {
      setInstalledMods(prev => prev.filter(m => m.id !== modId));
      setAvailableMods(prev => [...prev, { ...mod, isEnabled: false, isLoaded: false }]);
      
      const updated = installedMods.filter(m => m.id !== modId);
      localStorage.setItem('voxelcraft-installed-mods', JSON.stringify(updated));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilteredMods = (mods: Mod[]) => {
    return mods.filter(mod => {
      const matchesSearch = mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mod.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || mod.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-purple-600 max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-purple-400">Mod Manager</h2>
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
            onClick={() => setActiveTab('installed')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'installed'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Installed ({installedMods.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'browse'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Browse Mods
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Create Mod
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mods..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'installed' && (
            <div className="space-y-3">
              {installedMods.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No mods installed</p>
                  <p className="text-sm">Browse available mods to get started</p>
                </div>
              ) : (
                getFilteredMods(installedMods).map(mod => (
                  <div key={mod.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{mod.name}</h4>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            v{mod.version}
                          </span>
                          {mod.isEnabled && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                              Enabled
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{mod.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>by {mod.author}</span>
                          <span>{formatFileSize(mod.size)}</span>
                          <span className="capitalize">{mod.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleMod(mod.id)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            mod.isEnabled
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {mod.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => uninstallMod(mod.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="space-y-3">
              {getFilteredMods(availableMods).map(mod => (
                <div key={mod.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-medium">{mod.name}</h4>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          v{mod.version}
                        </span>
                        <span className="text-yellow-400 text-sm">
                          {getRatingStars(mod.rating)} ({mod.rating})
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{mod.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>by {mod.author}</span>
                        <span>{formatFileSize(mod.size)}</span>
                        <span>{mod.downloadCount.toLocaleString()} downloads</span>
                        <span className="capitalize">{mod.category}</span>
                      </div>
                      
                      {mod.dependencies.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-400">Dependencies: </span>
                          <span className="text-xs text-blue-400">{mod.dependencies.join(', ')}</span>
                        </div>
                      )}
                      
                      {mod.conflicts.length > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400">
                            Conflicts with: {mod.conflicts.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => installMod(mod)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                    >
                      {isLoading ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Upload className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <h3 className="text-white font-medium mb-2">Create Your Own Mod</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Use our mod development tools to create custom content
                </p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Open Mod Editor
                  </button>
                  <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                    View Documentation
                  </button>
                  <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                    Download SDK
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Mod Development Features</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Visual scripting system</li>
                  <li>• Custom block and item creation</li>
                  <li>• Event system and hooks</li>
                  <li>• Asset management tools</li>
                  <li>• Real-time testing environment</li>
                  <li>• Community sharing platform</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};