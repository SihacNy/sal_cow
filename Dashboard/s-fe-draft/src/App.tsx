import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './hooks/useLanguage';
import {
  LayoutDashboard,
  Scale,
  Settings as SettingsIcon,
  Search,
  Bell,
  Globe
} from 'lucide-react';
import logoImg from './assets/logo.png';
import cowIcon from './assets/cow.png';
import { Home } from './pages/Home';
import { Devices } from './pages/Devices';
import { Herd } from './pages/Herd';
import { Settings } from './pages/Settings';
import { NavItem } from './components/NavItem';

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeScaleId, setActiveScaleId] = useState<string | null>(null);
  const [weighingCowId, setWeighingCowId] = useState<string | null>(null);

  const navigateToScale = (scaleId: string, cowId?: string) => {
    setActiveScaleId(scaleId);
    setWeighingCowId(cowId || null);
    setActiveTab('devices');
  };
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img src={logoImg} alt="CowFit Logo" className="h-12 w-auto object-contain mr-3" />
          <span className="font-bold text-xl text-gray-900 tracking-tight font-sans">CowFit</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label={t('nav.home')} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<div className="w-5 h-5 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />} label={t('nav.herd')} active={activeTab === 'herd'} onClick={() => setActiveTab('herd')} />
          <NavItem icon={<Scale size={20} />} label={t('nav.devices')} active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} />
          <NavItem icon={<SettingsIcon size={20} />} label={t('nav.settings')} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTab('settings')}>
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
              JD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Sal The Butcher</p>
              <p className="text-xs text-gray-500">Farm Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-10 flex-shrink-0">
          <div className="flex items-center text-xl font-semibold text-gray-800 font-sans">
            {activeTab === 'home' && t('dashboard.overview')}
            {activeTab === 'devices' && t('nav.devices')}
            {activeTab === 'herd' && t('nav.herd')}
            {activeTab === 'settings' && t('nav.settings')}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors mr-4"
            >
              <Globe className="w-4 h-4" />
              <span>{currentLanguage === 'en' ? 'EN' : 'ខ្មែរ'}</span>
            </button>

            <div className="relative hidden sm:block">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64 bg-gray-50 font-sans"
              />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Dynamic View Rendering */}
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          {activeTab === 'home' && <Home />}
          {activeTab === 'devices' && <Devices activeScaleId={activeScaleId} setActiveScaleId={setActiveScaleId} weighingCowId={weighingCowId} setWeighingCowId={setWeighingCowId} />}
          {activeTab === 'herd' && <Herd onNavigateToScale={navigateToScale} />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}


