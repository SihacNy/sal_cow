import React from 'react';
import { MoreVertical, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: string;
  isAlert?: boolean;
}

export function StatCard({ title, value, trend, trendUp, icon, color, isAlert = false }: StatCardProps) {
  return (
    <div className={`bg-white p-6 rounded-2xl border shadow-sm ${isAlert ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={20} />
        </button>
      </div>
      <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="mt-3 flex items-center text-sm">
        <span className={`flex items-center font-medium ${isAlert ? 'text-red-600' : (trendUp ? 'text-green-600' : 'text-orange-500')
          }`}>
          {trendUp ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {trend}
        </span>
      </div>
    </div>
  );
}
