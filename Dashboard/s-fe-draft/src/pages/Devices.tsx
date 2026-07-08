import { useTranslation } from 'react-i18next';
import { Plus, Wifi, WifiOff, ArrowLeft, Activity, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Scale {
  id: string;
  name: string;
  status: string;
  battery: number;
  lastSync: string;
  currentReading: string;
}

const mockScales: Scale[] = [
  { id: 'SCALE-01', name: 'North Pasture Gate', status: 'online', battery: 85, lastSync: '2 mins ago', currentReading: '0 lbs' },
  { id: 'SCALE-02', name: 'Barn A Entrance', status: 'online', battery: 42, lastSync: '5 mins ago', currentReading: '1,240 lbs' },
  { id: 'SCALE-03', name: 'South Water Trough', status: 'offline', battery: 12, lastSync: '3 hours ago', currentReading: '--' },
];

const mockLogs = [
  { id: 1, time: '10:42 AM', type: 'Weight Recorded', details: 'Tag #8492 - 1,240 lbs', status: 'success' },
  { id: 2, time: '10:15 AM', type: 'Zero Calibrated', details: 'Manual reset to 0 lbs', status: 'info' },
  { id: 3, time: '09:30 AM', type: 'Weight Recorded', details: 'Tag #7731 - 980 lbs', status: 'success' },
  { id: 4, time: '08:05 AM', type: 'Error', details: 'Unstable reading timeout', status: 'error' },
];

interface DevicesProps {
  activeScaleId?: string | null;
  setActiveScaleId?: (id: string | null) => void;
  weighingCowId?: string | null;
  setWeighingCowId?: (id: string | null) => void;
}

export function Devices({ activeScaleId = null, setActiveScaleId = () => {}, weighingCowId = null, setWeighingCowId = () => {} }: DevicesProps) {
  const { t } = useTranslation();
  const selectedScale = activeScaleId ? mockScales.find(s => s.id === activeScaleId) || null : null;

  if (selectedScale) {
    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => {
              setActiveScaleId(null);
              setWeighingCowId?.(null);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{selectedScale.name}</h2>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${selectedScale.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {selectedScale.status === 'online' ? t('devices.statusOnline') : t('devices.statusOffline')}
              </span>
            </div>
            <p className="text-gray-500 font-mono text-sm mt-1">{selectedScale.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Live Reading Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 right-4">
                 {selectedScale.status === 'online' ? (
                   <span className="flex h-3 w-3 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                   </span>
                 ) : (
                   <span className="flex h-3 w-3 relative">
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                   </span>
                 )}
              </div>
              <Activity size={32} className="text-gray-400 mb-4" />
              <p className="text-sm uppercase tracking-widest font-semibold text-gray-500 mb-2">{t('devices.liveReading', 'Live Reading')}</p>
              <div className="text-6xl font-bold text-gray-900 font-mono tracking-tight mb-2">
                {selectedScale.currentReading.split(' ')[0]}
              </div>
              <p className="text-xl text-gray-500 font-medium mb-8">
                {selectedScale.currentReading.split(' ')[1] || 'lbs'}
              </p>
              
              <div className="w-full flex space-x-3">
                <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium transition-colors">
                  <RefreshCw size={18} />
                  <span>{t('devices.zeroScale', 'Zero Scale')}</span>
                </button>
                {weighingCowId && (
                  <div className="flex-1 flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-3 px-4 rounded-xl font-medium border border-green-200 shadow-sm cursor-default">
                    <CheckCircle2 size={18} />
                    <span>Bound to: {weighingCowId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${selectedScale.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedScale.status === 'online' ? t('devices.statusOnline') : t('devices.statusOffline')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('devices.lastSync')}</span>
                <span className="font-medium text-gray-700">{selectedScale.lastSync}</span>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{t('devices.logsTitle', 'Recent Activity')}</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t('devices.logTime', 'Time')}</th>
                    <th className="px-6 py-4 font-medium">{t('devices.logType', 'Event')}</th>
                    <th className="px-6 py-4 font-medium">{t('devices.logDetails', 'Details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{log.time}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' :
                          log.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('devices.title')}</h2>
          <p className="text-gray-500 mt-1">Manage your connected weighing hardware across all pastures.</p>
        </div>
        <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <Plus size={20} />
          <span>{t('devices.addDevice')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockScales.map((scale) => (
          <div 
            key={scale.id} 
            onClick={() => setActiveScaleId(scale.id)}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors">{scale.name}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">{scale.id}</p>
              </div>
              <div className={`p-2 rounded-lg ${scale.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {scale.status === 'online' ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${scale.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                  {scale.status === 'online' ? t('devices.statusOnline') : t('devices.statusOffline')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('devices.lastSync')}</span>
                <span className="font-medium text-gray-700">{scale.lastSync}</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">{t('devices.currentReading')}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">{scale.currentReading.split(' ')[0]}</span>
                <span className="text-gray-500 font-medium">{scale.currentReading.split(' ')[1] || ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
