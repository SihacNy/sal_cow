import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Scale, 
  Users, 
  History, 
  FileText, 
  BarChart3, 
  Settings, 
  Bell,
  Radio,
  MapPin,
  Globe
} from 'lucide-react';
import { changeLanguage } from '../i18n';

interface LayoutProps {
  currentTab: string;
  onSetTab: (tab: string) => void;
  socketConnected: boolean;
  alertCount: number;
  children: React.ReactNode;
}

export default function Layout({
  currentTab,
  onSetTab,
  socketConnected,
  alertCount,
  children
}: LayoutProps) {
  const { t, i18n } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'livescale', label: t('nav.liveScale'), icon: Scale },
    { id: 'cows', label: t('nav.cattleRecords'), icon: Users },
    { id: 'history', label: t('nav.weightHistory'), icon: History },
    { id: 'reports', label: t('nav.reports'), icon: FileText },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'settings', label: t('nav.settings'), icon: Settings }
  ];

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'en' ? 'km' : 'en';
    changeLanguage(nextLang);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBFBFA]">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-[#E9EAE7] bg-white">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2E7D32] flex items-center justify-center text-white text-xl">
             🌾
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-[#1C1D1A] uppercase tracking-wide">AgroScale Live</h1>
            <p className="text-[10px] text-[#5A5D55] font-medium uppercase tracking-tighter">Smart Cattle Scales</p>
          </div>
        </div>

        <div className="mx-4 mb-6 p-2 rounded-lg bg-[#F1F8F3] flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Radio size={14} className={socketConnected ? 'text-[#2E7D32]' : 'text-red-500 animate-pulse'} />
             <span className="text-[10px] font-bold text-[#1C1D1A]">
                {i18n.language === 'km' ? 'អនឡាញ' : 'Online'}
             </span>
           </div>
           <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E9EAE7] text-[#5A5D55] font-mono">V1.2.0</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSetTab(item.id)}
              className={`sidebar-nav-item ${currentTab === item.id || (item.id === 'cows' && currentTab === 'cow-detail') ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
              {item.id === 'dashboard' && alertCount > 0 && (
                <span className="ml-auto w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-[10px]">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E9EAE7]">
           <button 
             onClick={handleLanguageToggle}
             className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F1F8F3] text-[10px] font-bold text-[#2E7D32] hover:bg-[#D6EBD9] transition-colors"
           >
              <div className="flex items-center gap-2">
                 <Globe size={14} />
                 <span>{i18n.language === 'en' ? 'ENGLISH (UK)' : 'ភាសាខ្មែរ'}</span>
              </div>
              <span className="text-[9px] opacity-50">{i18n.language === 'en' ? 'SWITCH TO KM' : 'ប្តូរជា EN'}</span>
           </button>
           <p className="text-[9px] text-[#5A5D55] font-mono mt-4 text-center">© 2026 AGROSCALE CO.</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-[#E9EAE7] shrink-0">
          <div className="flex items-center gap-3 bg-[#F1F8F3] px-3 py-1.5 rounded-lg border border-[#D6EBD9]">
            <MapPin size={14} className="text-[#2E7D32]" />
            <span className="text-[11px] font-bold text-[#1B351D]">Kampong Cham Farmland #2</span>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-[#2E7D32]' : 'bg-red-500'}`}></div>
                <span className="text-[11px] font-bold text-[#5A5D55]">ESP32 scale-01: {socketConnected ? t('common.online') : t('common.offline')}</span>
             </div>
             
             {alertCount > 0 && (
               <button className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 animate-pulse">
                  <Bell size={14} />
                  <span className="text-[11px] font-bold">{alertCount} {t('dashboard.activeAlerts')}</span>
               </button>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
