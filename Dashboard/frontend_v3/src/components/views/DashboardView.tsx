import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Scale, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Clock,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { DashboardStats, RecentActivity } from '../../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  liveWeight: { weight: number; stable: boolean; deviceId: string };
  onNavigateToTab: (tab: string) => void;
  onSelectCow: (cowId: string) => void;
}

const StatCard = ({ label, value, change, isPositive, icon: Icon }: any) => (
  <div className="human-card flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-2xl bg-[#E8F3F1] text-[#4D8E7D]">
         <Icon size={20} />
      </div>
      <button className="text-[#A0AEC0]"><MoreHorizontal size={20} /></button>
    </div>
    <p className="text-sm font-bold text-[#A0AEC0] uppercase tracking-wider">{label}</p>
    <div className="flex items-end justify-between mt-4">
      <h3 className="human-stat-value">{value}</h3>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      )}
    </div>
  </div>
);

export default function DashboardView({
  stats,
  liveWeight,
  onNavigateToTab,
  onSelectCow
}: DashboardViewProps) {
  const { t } = useTranslation();

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 fade-in">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F3F1] flex items-center justify-center animate-bounce mb-6">
           <Scale className="text-[#4D8E7D]" size={32} />
        </div>
        <p className="heading-xl text-2xl !font-medium text-[#A0AEC0]">Syncing with herd records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="heading-xl">Farm Dashboard</h2>
           <div className="flex items-center gap-3 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4D8E7D]"></div>
              <p className="text-xs text-[#A0AEC0] font-black uppercase tracking-[0.2em] leading-none">Kampong Cham Sector 4</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              const randomWeight = (Math.random() * 200 + 100).toFixed(1);
              try {
                await fetch('/api/weight', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ device_id: 'esp32-scale-01', display: parseFloat(randomWeight), stable: true })
                });
              } catch (e) {
                console.error("Simulation failed - is backend running on 3002?");
              }
            }}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-[#4D8E7D] border border-emerald-100 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95"
          >
            <Activity size={20} /> Auto-Simulate
          </button>
          
          <button 
            onClick={() => onNavigateToTab('livescale')}
            className="flex items-center gap-2 px-8 py-4 bg-[#1A202C] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={20} /> Register Weights
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Total Herd" value={stats.totalCows} change="+4 Head" isPositive={true} icon={Users} />
        <StatCard label="Avg. Weight" value={`${stats.averageWeight} kg`} change="1.2%" isPositive={true} icon={TrendingUp} />
        <StatCard label="Heaviest" value={`${stats.heaviestCow?.weight || 0} kg`} change={stats.heaviestCow?.name} isPositive={true} icon={Scale} />
        <StatCard label="Live Units" value={stats.onlineDevices} change="Offline: 0" isPositive={true} icon={ActivityIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Scale Stream */}
        <div className="lg:col-span-12 xl:col-span-5 human-card !bg-[#1A202C] text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Scale size={160} />
           </div>
           
           <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Live Reading</h3>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-mono tracking-widest">ESP-SCALE-01</div>
              </div>

              <div className="py-8">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Sensor Telemetry (KG)</p>
                 <div className="flex items-baseline gap-4">
                    <span className="text-8xl font-black tracking-tighter tabular-nums">{liveWeight.weight.toFixed(1)}</span>
                    <span className="text-2xl font-bold text-white/30 italic">kg</span>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                   liveWeight.stable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                 }`}>
                   <div className={`w-2 h-2 rounded-full ${liveWeight.stable ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
                   {liveWeight.stable ? 'Stable Lock' : 'Fluctuating'}
                 </div>
                 <button onClick={() => onNavigateToTab('livescale')} className="text-xs font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                    Calibration <ChevronRight size={16} />
                 </button>
              </div>
           </div>
        </div>

        {/* Alerts / Activity */}
        <div className="lg:col-span-12 xl:col-span-7 human-card">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-[#1A202C]">System Notifications</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                 <AlertTriangle size={14} /> {stats.alerts.length} Warnings
              </div>
           </div>

           <div className="space-y-4">
              {stats.alerts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F8FAF9] mx-auto flex items-center justify-center text-emerald-500 mb-4">
                    <TrendingUp size={24} />
                  </div>
                  <p className="text-sm font-bold text-[#1A202C]">All Systems Optimal</p>
                  <p className="text-xs text-[#A0AEC0]">No health or hardware alerts pending.</p>
                </div>
              ) : (
                stats.alerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 rounded-3xl bg-[#F8FAF9] border border-black/[0.03] flex items-center gap-4 group hover:bg-[#E8F3F1] transition-colors">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                       alert.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                     }`}>
                        {alert.type === 'weight_loss' ? <ArrowDownRight size={20} /> : <AlertTriangle size={20} />}
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-[#1A202C]">{alert.message}</p>
                        <p className="text-[10px] text-[#A0AEC0] mt-0.5">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                     </div>
                     <button onClick={() => alert.cowId && onSelectCow(alert.cowId)} className="p-3 text-[#A0AEC0] group-hover:text-[#4D8E7D] transition-colors">
                        <ChevronRight size={20} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Recent Ledger */}
      <div className="human-card">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-lg font-bold text-[#1A202C]">Recent Weigh-ins</h3>
          <button onClick={() => onNavigateToTab('history')} className="text-xs font-black uppercase tracking-widest text-[#4D8E7D] hover:underline">View History</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[#E2E8F0]">
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Cattle</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Weight</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Status</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Captured At</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {stats.recentActivity.map((act: RecentActivity) => (
                <tr key={act.id} className="group hover:bg-[#F8FAF9] transition-colors">
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-[#E8F3F1] flex items-center justify-center text-[#4D8E7D] font-bold">🐂</div>
                       <div>
                         <p className="text-xs font-bold text-[#1A202C]">{act.cowName}</p>
                         <p className="text-[10px] text-[#A0AEC0]">{act.cowId}</p>
                       </div>
                    </div>
                  </td>
                  <td className="py-6 font-black text-xs text-[#1A202C]">{act.weight.toFixed(1)} kg</td>
                  <td className="py-6">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-[#1A202C]">Normal Growth</span>
                     </div>
                  </td>
                  <td className="py-6 text-[10px] font-medium text-[#A0AEC0]">{new Date(act.timestamp).toLocaleString()}</td>
                  <td className="py-6 text-right">
                    <button onClick={() => onSelectCow(act.cowId)} className="p-2 text-[#A0AEC0] opacity-0 group-hover:opacity-100 hover:text-[#4D8E7D] transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ActivityIcon = ({ size }: any) => (
  <div className="relative">
    <div className="absolute inset-0 bg-emerald-400 blur-sm rounded-full animate-pulse opacity-50"></div>
    <div className="relative w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
  </div>
);
