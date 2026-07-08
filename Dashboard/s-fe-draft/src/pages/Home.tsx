import { useTranslation } from 'react-i18next';
import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/StatCard';
import cowIcon from '../assets/cow.png';

const weightData = [
  { day: 'Mon', weight: 1120 },
  { day: 'Tue', weight: 1150 },
  { day: 'Wed', weight: 1140 },
  { day: 'Thu', weight: 1190 },
  { day: 'Fri', weight: 1220 },
  { day: 'Sat', weight: 1260 },
  { day: 'Sun', weight: 1280 },
];

export function Home() {
  const { t } = useTranslation();

  const recentWeighIns = [
    { id: 'TAG-8921', weight: 1450, status: t('status.overweight'), time: `10 mins ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'up' },
    { id: 'TAG-1142', weight: 1120, status: t('status.normal'), time: `45 mins ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'stable' },
    { id: 'TAG-9932', weight: 1520, status: t('status.critical'), time: `1 hour ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'up' },
    { id: 'TAG-0021', weight: 1180, status: t('status.normal'), time: `2 hours ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'down' },
    { id: 'TAG-4431', weight: 1390, status: t('status.warning'), time: `3 hours ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'up' },
  ];

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t('dashboard.totalCows')}
          value="1,248"
          trend="+12 this week"
          trendUp={true}
          icon={<div className="w-6 h-6 bg-current text-gray-600" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />}
          color="bg-gray-100"
        />
        <StatCard
          title={t('dashboard.avgWeight')}
          value="1,180 lbs"
          trend="-5 lbs from last month"
          trendUp={false}
          icon={<Scale className="w-6 h-6 text-gray-600" />}
          color="bg-gray-100"
        />
        <StatCard
          title={t('dashboard.overweightAlerts')}
          value="24"
          trend="+3 since yesterday"
          trendUp={true}
          isAlert={true}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Average Weight Trend</h3>
              <p className="text-sm text-gray-500">Trailing 7 days across all active scales</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg block px-4 py-2.5 min-w-[160px] focus:outline-none font-sans">
              <option>{t('timeFilter.last7Days')}</option>
              <option>{t('timeFilter.last30Days')}</option>
              <option>{t('timeFilter.thisYear')}</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer={false} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('dashboard.recentWeighIns')}</h3>
            <button className="text-green-600 text-sm font-medium hover:text-green-700">{t('dashboard.viewAll')}</button>
          </div>

          <div className="flex-1 overflow-auto pr-2 space-y-4">
            {recentWeighIns.map((cow, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cow.status === t('status.critical') ? 'bg-red-100 text-red-600' :
                    cow.status === t('status.overweight') || cow.status === t('status.warning') ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                    <div className="w-5 h-5 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cow.id}</p>
                    <p className="text-xs text-gray-500">{cow.time}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">{cow.weight} <span className="text-xs font-normal text-gray-500">lbs</span></p>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    {cow.trend === 'up' ? (
                      <ArrowUpRight size={14} className="text-red-500" />
                    ) : cow.trend === 'down' ? (
                      <ArrowDownRight size={14} className="text-green-500" />
                    ) : (
                      <CheckCircle2 size={14} className="text-gray-400" />
                    )}
                    <span className={`text-xs font-medium ${cow.trend === 'up' ? 'text-red-500' :
                      cow.trend === 'down' ? 'text-green-500' :
                        'text-gray-500'
                      }`}>
                      {cow.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
