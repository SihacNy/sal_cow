import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Globe, 
  Palette, 
  Volume2, 
  VolumeX, 
  Check, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Signal, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Terminal, 
  Trash2,
  Sliders,
  Server,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Device } from '../../types.js';
import { changeLanguage } from '../../i18n.js';

interface SettingsProps {
  devices: Device[];
  onClearDeviceData: (deviceId: string) => Promise<boolean>;
  theme: 'light' | 'dark' | 'farm';
  onChangeTheme: (theme: 'light' | 'dark' | 'farm') => void;
}

export default function SettingsView({
  devices,
  onClearDeviceData,
  theme,
  onChangeTheme
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  
  // Audio state
  const [soundOnStable, setSoundOnStable] = useState(true);
  const [vibrationOnWarning, setVibrationOnWarning] = useState(true);

  // WiFi configurator state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    devices.length > 0 ? devices[0].deviceId : 'esp32-scale-01'
  );
  const [ssidField, setSsidField] = useState<string>('');
  const [passwordField, setPasswordField] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [networks, setNetworks] = useState<Array<{ ssid: string; signal: number; secure: boolean; connected: boolean }>>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Set default SSID from device status if connected
  const activeDevice = devices.find(d => d.deviceId === selectedDeviceId);

  // Connect socket for real-time WiFi configuration terminal stream
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] WLAN channel ready. Selected node: ${selectedDeviceId}`,
      `[${new Date().toLocaleTimeString()}] Interface current status: ${activeDevice?.wifiStatus || (activeDevice?.status === 'online' ? 'connected' : 'disconnected')}`
    ]);

    socket.on('wifi_provision_status', (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [OTA-AGENT] ${data.message}`
        ]);
        
        if (data.status === 'connecting') {
          setIsProvisioning(true);
        } else if (data.status === 'connected') {
          setIsProvisioning(false);
          setSsidField('');
          setPasswordField('');
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDeviceId]);

  // Handle scanned network selection
  const handleSelectNetwork = (ssid: string) => {
    setSsidField(ssid);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Selected wireless SSID target: "${ssid}"`
    ]);
  };

  // Run simulated WiFi scans
  const handleScanNetworks = async () => {
    setScanning(true);
    setNetworks([]);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] RF channel sweep initiated on scale module: ${selectedDeviceId}`
    ]);
    
    try {
      const res = await axios.get(`/api/devices/${selectedDeviceId}/networks`);
      // Simulate hardware propagation latency for premium realistic feedback
      setTimeout(() => {
        setNetworks(res.data);
        setScanning(false);
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Sweep completed. Detected ${res.data.length} wireless base stations nearby.`
        ]);
      }, 1500);
    } catch (e) {
      setScanning(false);
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] WiFi controller reported error: failed to initiate scan probe.`
      ]);
    }
  };

  // Dispatch connection parameters to hardware
  const handleConnectWiFi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssidField) return;
    
    setIsProvisioning(true);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Preparing credentials payload...`,
      `[${new Date().toLocaleTimeString()}] Target SSID: "${ssidField}" (Security: WPA2-PSK)`
    ]);

    try {
      await axios.post(`/api/devices/${selectedDeviceId}/wifi`, {
        ssid: ssidField,
        password: passwordField
      });
      // socket.io events will take over streaming progressive terminal states
    } catch (e) {
      setIsProvisioning(false);
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Error: OTA dispatcher reported fail to transmit WiFi settings.`
      ]);
    }
  };

  const handleClearHistory = async (deviceId: string) => {
    const isConfirmed = window.confirm(`CRITICAL WARNING: Are you sure you want to delete all historical logs for scale device ${deviceId}? This is irreversible.`);
    if (isConfirmed) {
      const success = await onClearDeviceData(deviceId);
      if (success) {
        alert(`Successfully deleted historical log buffers for scale ${deviceId}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {t('settings.title')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Provision wireless hardware nodes, select workspace language preferences, and audit system diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WIFI MANAGER & SYSTEM PREFERENCES (LEFT 7 COLS) */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in">
          
          {/* WIFI MANAGER CARD */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Wifi className="w-5 h-5 text-[var(--primary-brand)] animate-pulse" />
                <span>Wi-Fi Configurator (WiFi Manager)</span>
              </h3>
              
              {/* Scale Target Dropdown Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">Target Scale:</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="farm-input py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                >
                  {devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scale Node Wireless Status Bar */}
            <div className="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-ui)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider">Wi-Fi Connection</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    activeDevice?.wifiStatus === 'connected' || (activeDevice?.status === 'online' && activeDevice?.wifiStatus !== 'connecting')
                      ? 'bg-emerald-500 animate-pulse' 
                      : activeDevice?.wifiStatus === 'connecting'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-zinc-400'
                  }`} />
                  <span className="text-[var(--text-primary)] capitalize">
                    {activeDevice?.wifiStatus || (activeDevice?.status === 'online' ? 'connected' : 'disconnected')}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider">SSID Network</p>
                <p className="text-[var(--text-primary)] font-mono truncate mt-1">
                  {activeDevice?.wifiSSID || 'Not Configured'}
                </p>
              </div>

              <div>
                <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider">Node IP Address</p>
                <p className="text-[var(--text-primary)] font-mono mt-1">
                  {activeDevice?.wifiIP || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider">Signal Strength</p>
                <div className="flex items-center gap-1.5 mt-1 text-[var(--text-primary)]">
                  <Signal className="w-3.5 h-3.5 text-[var(--primary-brand)]" />
                  <span>{activeDevice?.wifiSignal ? `${activeDevice.wifiSignal}%` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Network scanning and provision form */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Configure Scale WLAN Credentials</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-normal mt-0.5">ESP32 loads credentials OTA. Scan nearby routers or specify SSID directly.</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleScanNetworks}
                  disabled={scanning || isProvisioning}
                  className="flex items-center gap-1.5 bg-[var(--bg-app)] hover:bg-[var(--border-ui)] text-[var(--text-primary)] font-bold text-xs py-1.5 px-3 rounded-lg border border-[var(--border-ui)] transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-[var(--primary-brand)]' : ''}`} />
                  <span>{scanning ? 'Scanning...' : 'Scan Networks'}</span>
                </button>
              </div>

              {/* Scanned networks list */}
              {scanning && (
                <div className="p-6 border border-dashed border-[var(--border-ui)] rounded-xl flex flex-col items-center justify-center gap-2 bg-[var(--bg-app)]">
                  <div className="relative">
                    <Wifi className="w-8 h-8 text-[var(--primary-brand)] animate-bounce" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary-brand)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary-brand)]"></span>
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium animate-pulse">Scanning RF bands (2.4GHz) for scale-visible APs...</span>
                </div>
              )}

              {!scanning && networks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Nearby Networks Detected:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {networks.map((net) => (
                      <button
                        key={net.ssid}
                        type="button"
                        onClick={() => handleSelectNetwork(net.ssid)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all ${
                          ssidField === net.ssid
                            ? 'border-[var(--primary-brand)] bg-[var(--accent-light)] text-[var(--primary-brand)]'
                            : 'border-[var(--border-ui)] bg-[var(--bg-app)] hover:bg-[var(--border-ui)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Wifi className="w-4 h-4 shrink-0 text-[var(--primary-brand)]" />
                          <span className="truncate font-mono">{net.ssid}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] shrink-0 font-mono text-[10px]">
                          {net.secure ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-emerald-500" />}
                          <span>{net.signal}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection Form */}
              <form onSubmit={handleConnectWiFi} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-semibold">
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider">Wi-Fi SSID</label>
                  <input
                    type="text"
                    required
                    disabled={isProvisioning}
                    placeholder="Enter SSID network"
                    value={ssidField}
                    onChange={(e) => setSsidField(e.target.value)}
                    className="w-full farm-input font-mono text-sm h-11"
                  />
                </div>
                
                <div className="sm:col-span-6 space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider">WPA2 Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-[var(--primary-brand)] hover:underline"
                    >
                      {showPassword ? 'Hide Secret' : 'Show Secret'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isProvisioning}
                      placeholder="Security passphrase"
                      value={passwordField}
                      onChange={(e) => setPasswordField(e.target.value)}
                      className="flex-1 farm-input font-mono text-sm h-11"
                    />
                    
                    <button
                      type="submit"
                      disabled={!ssidField || isProvisioning}
                      className="farm-btn-primary h-11 px-5 px-6 shrink-0 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isProvisioning ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* WLAN provision real-time progressive log screen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>Scale Connection Logs (OTA terminal)</span>
                </span>
                
                <button 
                  type="button"
                  onClick={() => setTerminalLogs([])}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-red-500 font-bold"
                >
                  Clear Logs
                </button>
              </div>

              <div className="h-28 overflow-y-auto bg-zinc-950 p-3 rounded-xl border border-zinc-900 font-mono text-[10px] text-zinc-300 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {terminalLogs.length === 0 ? (
                  <p className="text-zinc-600 italic">No communication logs recorded. Push "Connect" to stream OTA stats.</p>
                ) : (
                  terminalLogs.map((log, index) => {
                    let logColor = 'text-zinc-300';
                    if (log.includes('Successful') || log.includes('connected')) logColor = 'text-emerald-400';
                    if (log.includes('Failed') || log.includes('Error')) logColor = 'text-rose-400';
                    if (log.includes('handshake') || log.includes('Waking')) logColor = 'text-cyan-400';
                    return (
                      <p key={index} className={`${logColor} leading-relaxed break-all`}>
                        {log}
                      </p>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          {/* INTERNATIONALIZATION AND PERSISTENT THEME */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xs">
            
            {/* Lang switcher panel */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--primary-brand)]" />
                {t('settings.language')}
              </h4>

              <div className="flex flex-col gap-2 pt-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    i18n.language === 'en'
                      ? 'border-[var(--primary-brand)] bg-[var(--accent-light)] text-[var(--primary-brand)]'
                      : 'border-[var(--border-ui)] hover:bg-[var(--bg-app)] text-[var(--text-primary)]'
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {i18n.language === 'en' && <Check className="w-4 h-4 text-[var(--primary-brand)]" />}
                </button>
                
                <button
                  type="button"
                  onClick={() => changeLanguage('km')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    i18n.language === 'km'
                      ? 'border-[var(--primary-brand)] bg-[var(--accent-light)] text-[var(--primary-brand)]'
                      : 'border-[var(--border-ui)] hover:bg-[var(--bg-app)] text-[var(--text-primary)]'
                  }`}
                >
                  <span>🇰🇭 ខ្មែរ (Khmer)</span>
                  {i18n.language === 'km' && <Check className="w-4 h-4 text-[var(--primary-brand)]" />}
                </button>
              </div>
            </div>

            {/* Theme selection panel */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--primary-brand)]" />
                {t('settings.theme')}
              </h4>

              <div className="flex flex-col gap-2 pt-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onChangeTheme('light')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    theme === 'light'
                      ? 'border-[var(--primary-brand)] bg-[var(--accent-light)] text-[var(--primary-brand)]'
                      : 'border-[var(--border-ui)] hover:bg-[var(--bg-app)] text-[var(--text-primary)]'
                  }`}
                >
                  <span>🔆 {t('settings.themeLight')}</span>
                  {theme === 'light' && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTheme('dark')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    theme === 'dark'
                      ? 'border-[var(--primary-brand)] bg-[var(--accent-light)] text-[var(--primary-brand)]'
                      : 'border-[var(--border-ui)] hover:bg-[var(--bg-app)] text-[var(--text-primary)]'
                  }`}
                >
                  <span>🌙 {t('settings.themeDark')}</span>
                  {theme === 'dark' && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTheme('farm')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    theme === 'farm'
                      ? 'border-[var(--primary-brand)] bg-[var(--accent-light)] text-[var(--primary-brand)]'
                      : 'border-[var(--border-ui)] hover:bg-[var(--bg-app)] text-[var(--text-primary)]'
                  }`}
                >
                  <span>🌾 {t('settings.themeFarm')}</span>
                  {theme === 'farm' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* SPEAKER VOLUME CONTROL AND ACOUSTICS TOGGLE */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[var(--primary-brand)]" />
              <span>{t('settings.notifications')}</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border-ui)]">
                <div>
                  <p className="text-[var(--text-primary)]">Capture beep feedback sound</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-normal">Plays confirmation chime on client browser as soon as stable loads are locked.</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setSoundOnStable(!soundOnStable)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                    soundOnStable ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800'
                  }`}
                >
                  {soundOnStable ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border-ui)]">
                <div>
                  <p className="text-[var(--text-primary)]">Warning notifications trigger</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-normal font-normal">Push notification banner visual indicators immediately on drastic weight drops.</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setVibrationOnWarning(!vibrationOnWarning)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                    vibrationOnWarning ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-800'
                  }`}
                >
                  {vibrationOnWarning ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ACTIVE DEVICES TELEMETRY & DATA PURGING TOOLS (RIGHT 5 COLS) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] shadow-xs flex flex-col justify-between">
          
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--primary-brand)]" />
              <span>{t('settings.sysInfo')}</span>
            </h3>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Traces metrics of scales active on pasture stations. You can purge telemetry buffer logs of offline modules and issue remote tare calibration vectors.
            </p>

            <div className="space-y-3.5 pt-2">
              {devices.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-6">No devices detected by API server yet.</p>
              ) : (
                devices.map((d) => (
                  <div key={d.deviceId} className="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-ui)] space-y-3 transition-shadow hover:shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div>
                        <p className="font-mono font-black text-[var(--text-primary)]">{d.deviceId}</p>
                        <span className="text-[9px] text-[var(--text-secondary)]">Last check-in: {new Date(d.lastSeen).toLocaleString()}</span>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        d.status === 'online' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' 
                          : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                      }`}>
                        {d.status === 'online' ? t('common.online') : t('common.offline')}
                      </span>
                    </div>

                    <div className="text-[10px] border-t border-[var(--border-ui)] pt-2 space-y-1 text-[var(--text-secondary)] font-mono">
                      <div className="flex justify-between">
                        <span>Wi-Fi Network:</span>
                        <span className="text-[var(--text-primary)] font-bold">{d.wifiSSID || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signal Level:</span>
                        <span className="text-[var(--text-primary)] font-bold">{d.wifiSignal ? `${d.wifiSignal}%` : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleClearHistory(d.deviceId)}
                        className="flex-1 bg-red-50 hover:bg-rose-100 text-rose-600 dark:bg-red-950/20 dark:hover:bg-rose-950/30 text-[10px] py-2 rounded-lg border border-red-200/50 dark:border-rose-900/35 transition-all font-bold"
                      >
                        Purge Records
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Triggering Virtual Tare command on scale ${d.deviceId}`)}
                        className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950/20 dark:hover:bg-sky-950/30 text-[10px] py-2 rounded-lg border border-sky-200/50 dark:border-sky-900/35 transition-all font-bold"
                      >
                        Tare Sensor
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border-ui)] pt-4 text-[10px] text-[var(--text-secondary)] space-y-1 font-mono">
            <p>Database Engine: Self-Containing JSON Document Store</p>
            <p>Sensor Driver: hx711.cpp (24-bit dual conversion)</p>
            <p>WebSocket Mode: server-side dynamic upgrade (socket.io)</p>
          </div>

        </div>

      </div>

    </div>
  );
}
