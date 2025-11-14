import React from 'react';
import { Clock, Cpu, Gauge, CheckCircle } from 'lucide-react';

export const ProcessingMetrics = ({ status }) => {
  const metrics = [
    {
      icon: CheckCircle,
      label: 'Pages Processed',
      value: status?.page_count || 0,
      color: 'text-green-500'
    },
    {
      icon: Gauge,
      label: 'Tables Detected',
      value: status?.table_count || 0,
      color: 'text-blue-500'
    },
    {
      icon: Cpu,
      label: 'Status',
      value: status?.status?.replace(/_/g, ' ').toUpperCase() || 'N/A',
      color: 'text-purple-500'
    },
    {
      icon: Clock,
      label: 'Processing Time',
      value: status?.processing_time 
        ? `${status.processing_time.toFixed(1)}s` 
        : 'In Progress',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${metric.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};