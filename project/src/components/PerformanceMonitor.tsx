import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, HardDrive, Zap, Settings } from 'lucide-react';

interface PerformanceData {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  chunkUpdates: number;
  networkLatency: number;
  cpuUsage: number;
}

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  gameEngine?: any;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isOpen,
  onClose,
  gameEngine
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    chunkUpdates: 0,
    networkLatency: 0,
    cpuUsage: 0
  });

  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<PerformanceData[]>([]);
  const [settings, setSettings] = useState({
    showFPS: true,
    showMemory: true,
    showNetwork: true,
    updateInterval: 1000,
    maxHistoryLength: 60
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && isRecording) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isOpen, isRecording, settings.updateInterval]);

  useEffect(() => {
    if (history.length > 0) {
      drawPerformanceGraph();
    }
  }, [history]);

  const startMonitoring = () => {
    intervalRef.current = setInterval(() => {
      const newData = collectPerformanceData();
      setPerformanceData(newData);
      
      setHistory(prev => {
        const updated = [...prev, newData];
        return updated.slice(-settings.maxHistoryLength);
      });
    }, settings.updateInterval);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const collectPerformanceData = (): PerformanceData => {
    // Simulate performance data collection
    const now = performance.now();
    const memory = (performance as any).memory;
    
    return {
      fps: Math.round(1000 / (now % 100 + 10)), // Simulated FPS
      frameTime: now % 100 + 10,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : Math.random() * 100,
      drawCalls: Math.floor(Math.random() * 500) + 100,
      triangles: Math.floor(Math.random() * 50000) + 10000,
      chunkUpdates: Math.floor(Math.random() * 10),
      networkLatency: Math.floor(Math.random() * 100) + 20,
      cpuUsage: Math.random() * 100
    };
  };

  const drawPerformanceGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw FPS graph
    if (settings.showFPS) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      history.forEach((data, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - (data.fps / 120) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // Draw memory usage graph
    if (settings.showMemory) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      history.forEach((data, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - (data.memoryUsage / 200) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // Draw network latency graph
    if (settings.showNetwork) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      history.forEach((data, index) => {
        const x = (index / (history.length - 1)) * width;
        const y = height - (data.networkLatency / 200) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
  };

  const getPerformanceStatus = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'text-green-400';
    if (value < thresholds[1]) return 'text-yellow-400';
    return 'text-red-400';
  };

  const exportPerformanceData = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxelcraft-performance-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-green-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-green-400">Performance Monitor</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRecording ? 'Stop' : 'Start'} Monitoring
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Real-time Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 text-sm">FPS</span>
              </div>
              <div className={`text-2xl font-bold ${getPerformanceStatus(performanceData.fps, [30, 60])}`}>
                {performanceData.fps}
              </div>
              <div className="text-xs text-gray-500">
                {performanceData.frameTime.toFixed(2)}ms
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-sm">Memory</span>
              </div>
              <div className={`text-2xl font-bold ${getPerformanceStatus(performanceData.memoryUsage, [50, 100])}`}>
                {performanceData.memoryUsage.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">MB</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-sm">Draw Calls</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {performanceData.drawCalls}
              </div>
              <div className="text-xs text-gray-500">
                {(performanceData.triangles / 1000).toFixed(1)}k tris
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-sm">Network</span>
              </div>
              <div className={`text-2xl font-bold ${getPerformanceStatus(performanceData.networkLatency, [50, 100])}`}>
                {performanceData.networkLatency}
              </div>
              <div className="text-xs text-gray-500">ms ping</div>
            </div>
          </div>

          {/* Performance Graph */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">Performance History</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-400">FPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-400">Memory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-400">Network</span>
                </div>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full h-48 bg-gray-900 rounded"
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Rendering Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Draw Calls:</span>
                  <span className="text-white">{performanceData.drawCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Triangles:</span>
                  <span className="text-white">{performanceData.triangles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chunk Updates:</span>
                  <span className="text-white">{performanceData.chunkUpdates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CPU Usage:</span>
                  <span className={getPerformanceStatus(performanceData.cpuUsage, [50, 80])}>
                    {performanceData.cpuUsage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Optimization Tips</h3>
              <div className="space-y-2 text-sm text-gray-300">
                {performanceData.fps < 30 && (
                  <div className="text-red-400">• Low FPS detected - reduce render distance</div>
                )}
                {performanceData.memoryUsage > 100 && (
                  <div className="text-yellow-400">• High memory usage - consider restarting</div>
                )}
                {performanceData.drawCalls > 400 && (
                  <div className="text-yellow-400">• High draw calls - optimize chunk rendering</div>
                )}
                {performanceData.networkLatency > 100 && (
                  <div className="text-red-400">• High network latency detected</div>
                )}
                {performanceData.fps >= 60 && performanceData.memoryUsage < 50 && (
                  <div className="text-green-400">• Performance is optimal!</div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setHistory([])}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Clear History
              </button>
              <button
                onClick={exportPerformanceData}
                disabled={history.length === 0}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Export Data
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={settings.showFPS}
                  onChange={(e) => setSettings(prev => ({ ...prev, showFPS: e.target.checked }))}
                  className="rounded"
                />
                Show FPS
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={settings.showMemory}
                  onChange={(e) => setSettings(prev => ({ ...prev, showMemory: e.target.checked }))}
                  className="rounded"
                />
                Show Memory
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={settings.showNetwork}
                  onChange={(e) => setSettings(prev => ({ ...prev, showNetwork: e.target.checked }))}
                  className="rounded"
                />
                Show Network
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};