import React, { useEffect, useState } from 'react';

const SystemMonitor = () => {
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    activeUsers: 0,
    queueSize: 0,
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        activeUsers: Math.floor(Math.random() * 50),
        queueSize: Math.floor(Math.random() * 20),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">System Monitor</h2>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">CPU Usage</span>
            <span className="text-sm text-gray-600">{systemStats.cpu}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${systemStats.cpu}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            <span className="text-sm text-gray-600">{systemStats.memory}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${systemStats.memory}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Queue Size</p>
            <p className="text-2xl font-bold text-gray-900">{systemStats.queueSize}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;