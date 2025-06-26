import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, Trash2, Share, Lock, Unlock, Star } from 'lucide-react';
import { CloudSaveService, CloudSave, CloudUser } from '../services/CloudSaveService';

interface CloudSaveManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSave: (saveData: any) => void;
  currentWorldData?: any;
}

export const CloudSaveManager: React.FC<CloudSaveManagerProps> = ({
  isOpen,
  onClose,
  onLoadSave,
  currentWorldData
}) => {
  const [cloudSaves, setCloudSaves] = useState<CloudSave[]>([]);
  const [currentUser, setCurrentUser] = useState<CloudUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'my-saves' | 'public' | 'upload'>('my-saves');
  const [searchQuery, setSearchQuery] = useState('');

  const cloudService = CloudSaveService.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadCloudData();
    }
  }, [isOpen]);

  const loadCloudData = async () => {
    setIsLoading(true);
    try {
      const user = cloudService.getCurrentUser();
      setCurrentUser(user);
      
      const saves = await cloudService.syncSaves();
      setCloudSaves(saves);
    } catch (error) {
      console.error('Failed to load cloud data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSave = async () => {
    if (!saveName.trim() || !currentWorldData) return;

    setIsLoading(true);
    try {
      await cloudService.uploadSave(currentWorldData, saveName, saveDescription);
      setSaveName('');
      setSaveDescription('');
      await loadCloudData();
      setActiveTab('my-saves');
    } catch (error) {
      console.error('Failed to upload save:', error);
      alert('Failed to upload save to cloud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSave = async (save: CloudSave) => {
    setIsLoading(true);
    try {
      const downloadedSave = await cloudService.downloadSave(save.id);
      onLoadSave(downloadedSave.worldData);
      onClose();
    } catch (error) {
      console.error('Failed to download save:', error);
      alert('Failed to download save from cloud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    if (!confirm('Are you sure you want to delete this save from the cloud?')) return;

    setIsLoading(true);
    try {
      await cloudService.deleteSave(saveId);
      await loadCloudData();
    } catch (error) {
      console.error('Failed to delete save:', error);
      alert('Failed to delete save from cloud');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    if (!currentUser) return 0;
    return (currentUser.storageUsed / currentUser.storageLimit) * 100;
  };

  const filteredSaves = cloudSaves.filter(save =>
    save.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    save.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-blue-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-blue-400">Cloud Save Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* User Info & Storage */}
        {currentUser && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-white font-medium">{currentUser.username}</h3>
                <p className="text-gray-400 text-sm capitalize">{currentUser.subscription} Plan</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">
                  {formatFileSize(currentUser.storageUsed)} / {formatFileSize(currentUser.storageLimit)}
                </p>
                <div className="w-32 h-2 bg-gray-700 rounded-full mt-1">
                  <div
                    className={`h-full rounded-full ${
                      getStoragePercentage() > 90 ? 'bg-red-500' :
                      getStoragePercentage() > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('my-saves')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'my-saves'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Cloud className="w-4 h-4 inline mr-2" />
            My Saves ({cloudSaves.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'public'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Share className="w-4 h-4 inline mr-2" />
            Public Saves
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Save
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'my-saves' && (
            <div className="space-y-4">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your saves..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />

              {/* Saves List */}
              {filteredSaves.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No cloud saves found</p>
                  <p className="text-sm">Upload your first save to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSaves.map(save => (
                    <div key={save.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium">{save.name}</h4>
                            {save.isPublic ? (
                              <Unlock className="w-4 h-4 text-green-400" title="Public" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400" title="Private" />
                            )}
                          </div>
                          {save.description && (
                            <p className="text-gray-400 text-sm mb-2">{save.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{save.timestamp.toLocaleDateString()}</span>
                            <span>{formatFileSize(save.size)}</span>
                            <span>v{save.version}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadSave(save)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSave(save.id)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'public' && (
            <div className="text-center py-8 text-gray-400">
              <Share className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Public saves feature coming soon!</p>
              <p className="text-sm">Discover and download community creations</p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Save Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter save name..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Describe your world..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Upload Information</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Your world will be saved securely to the cloud</p>
                  <p>• You can access it from any device</p>
                  <p>• Free users get 100MB of storage</p>
                  <p>• Saves are automatically compressed</p>
                </div>
              </div>

              <button
                onClick={handleUploadSave}
                disabled={!saveName.trim() || !currentWorldData || isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 inline mr-2" />
                    Upload to Cloud
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};