import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Wifi, Save, CheckCircle2, Bell } from 'lucide-react';

export function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('settings.title', 'Settings')}</h2>
        <p className="text-gray-500 mt-1">{t('settings.subtitle', 'Manage your account and configure your devices.')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User size={20} className={activeTab === 'profile' ? 'text-green-600' : 'text-gray-400'} />
              <span>{t('settings.profile.tab', 'Profile Information')}</span>
            </button>
            <button
              onClick={() => setActiveTab('wifi')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'wifi'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Wifi size={20} className={activeTab === 'wifi' ? 'text-green-600' : 'text-gray-400'} />
              <span>{t('settings.wifi.tab', 'WiFi Configuration')}</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Bell size={20} className={activeTab === 'notifications' ? 'text-green-600' : 'text-gray-400'} />
              <span>{t('settings.notifications.tab', 'Notifications')}</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-4xl h-fit bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          {showSuccess && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-center space-x-2 border border-green-100">
              <CheckCircle2 size={20} className="text-green-500" />
              <span className="font-medium">{t('settings.successMsg', 'Settings saved successfully.')}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t('settings.profile.title', 'Profile Settings')}</h3>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profile.fullName', 'Full Name')}</label>
                    <input 
                      type="text" 
                      defaultValue="Sal The Butcher"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profile.email', 'Email Address')}</label>
                    <input 
                      type="email" 
                      defaultValue="sal@camtech.edu"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profile.farmName', 'Farm Name')}</label>
                  <input 
                    type="text" 
                    defaultValue="Camtech experimental Farm"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                  />
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.profile.security', 'Security')}</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profile.password', 'New Password')}</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <button type="submit" className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    <Save size={18} />
                    <span>{t('settings.save', 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('settings.wifi.title', 'Microcontroller WiFi Configuration')}</h3>
              <p className="text-gray-500 mb-6">{t('settings.wifi.description', 'Enter the WiFi credentials that your smart scales will use to connect to the network. Generate a config file to flash onto your devices.')}</p>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.wifi.ssid', 'Network Name (SSID)')}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Farm_Network_2G"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.wifi.password', 'WiFi Password')}</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm">
                    <Wifi size={18} />
                    <span>{t('settings.wifi.generateBtn', 'Save Configuration')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('settings.notifications.title', 'Notification Preferences')}</h3>
              <p className="text-gray-500 mb-6">{t('settings.notifications.description', 'Choose how you want to be notified about your herd.')}</p>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">{t('settings.notifications.email', 'Email Alerts')}</h4>
                      <p className="text-sm text-gray-500">{t('settings.notifications.emailDesc', 'Receive daily summaries and critical alerts via email.')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">{t('settings.notifications.sms', 'SMS Alerts')}</h4>
                      <p className="text-sm text-gray-500">{t('settings.notifications.smsDesc', 'Get text messages for critical herd health warnings.')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.notifications.rulesTitle', 'Rules & Sound')}</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <h4 className="font-medium text-gray-900">{t('settings.notifications.beep', 'Capture beep feedback sound')}</h4>
                          <p className="text-sm text-gray-500">{t('settings.notifications.beepDesc', 'Plays confirmation chime on client browser as soon as stable loads are locked.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <h4 className="font-medium text-gray-900">{t('settings.notifications.warning', 'Warning notifications trigger')}</h4>
                          <p className="text-sm text-gray-500">{t('settings.notifications.warningDesc', 'Push notification banner visual indicators immediately on drastic weight drops.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <button type="submit" className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    <Save size={18} />
                    <span>{t('settings.save', 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
