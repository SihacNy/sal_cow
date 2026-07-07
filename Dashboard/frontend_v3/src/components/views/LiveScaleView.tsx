import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Scale, 
  Search, 
  Check, 
  HelpCircle, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  History,
  Sparkles
} from 'lucide-react';
import { Cow, LiveScaleState, Device } from '../../types.js';

interface LiveScaleProps {
  liveScale: LiveScaleState;
  cows: Cow[];
  devices: Device[];
  onSaveWeight: (cowId: string, weight: number, deviceId: string) => Promise<boolean>;
}

export default function LiveScaleView({
  liveScale,
  cows,
  devices,
  onSaveWeight
}: LiveScaleProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Track state transitions to trigger chime once per stabilization
  const lastStableRef = useRef(false);
  const lastWeightRef = useRef(0);

  // Play a beautiful synthetic chime when stable weight is captured
  const playStableChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Dual-tone high fidelity chime
      // Note 1: E5
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      // Note 2: G#5 slightly offset
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(830.61, audioCtx.currentTime); // G#5
        gain2.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 100);

    } catch (err) {
      console.warn("Audio context failed or blocked by autoplay permissions:", err);
    }
  };

  // Watch for stability changes to trigger the chime
  useEffect(() => {
    // Only beep if transitioning from unstable to stable, AND there is a real weight on the scale (> 10kg)
    if (liveScale.stable && !lastStableRef.current && liveScale.weight > 10) {
      playStableChime();
    }
    lastStableRef.current = liveScale.stable;
    lastWeightRef.current = liveScale.weight;
  }, [liveScale.stable, liveScale.weight]);

  // Determine farmer-facing process stage
  let stageText = t('liveScale.readyToWeigh');
  let stageColor = 'border-dashed border-[var(--border-ui)] text-[var(--text-secondary)]';
  let stageIndicator = 'bg-gray-400';

  if (liveScale.weight >= 10) {
    if (liveScale.stable) {
      stageText = t('liveScale.stableCaptured');
      stageColor = 'border-solid border-emerald-500 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400';
      stageIndicator = 'bg-emerald-500 animate-pulse';
    } else {
      stageText = t('liveScale.weighing');
      stageColor = 'border-solid border-amber-500 bg-amber-50/10 text-amber-600 dark:text-amber-400 animate-pulse';
      stageIndicator = 'bg-amber-500 animate-ping';
    }
  }

  // Filter cows for dropdown selection
  const filteredCows = cows.filter(cow => 
    cow.cowId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cow.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCow = cows.find(c => c.cowId === selectedCowId);

  const handleBindAndLog = async () => {
    if (!selectedCowId) {
      setErrorMsg(t('liveScale.noCowSelectedErr'));
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const success = await onSaveWeight(selectedCowId, liveScale.weight, liveScale.deviceId);
      if (success) {
        setSuccessMsg(t('liveScale.successSave'));
        // Trigger a secondary quick confirmation click sound
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch(e) {}

        // Reset state
        setSelectedCowId('');
        setSearchQuery('');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to log weight session properly');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (e) {
      setErrorMsg('Error communicating with backend database');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualUnboundWeight = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const success = await onSaveWeight('UNBOUND', liveScale.weight, liveScale.deviceId);
      if (success) {
        setSuccessMsg("Successfully logged weight unbound to any profile!");
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch(e) {
      setErrorMsg("Failed to store manual weight log");
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER COUPLING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('liveScale.mainTitle')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Observe realtime load-cell readings and associate them with cattle files.
          </p>
        </div>

        {/* SOUND INDICATOR SELECTOR */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
            soundEnabled 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20' 
              : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950/20'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-red-600" />}
          <span>{soundEnabled ? "Chime Audio: On (Beeps on Stable)" : "Chime Audio: Muted"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HUGE WEIGHING DISPLAY (LEFT 7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[var(--bg-card)] p-8 md:p-12 rounded-3xl border border-[var(--border-ui)] shadow-sm flex flex-col justify-between items-center relative overflow-hidden text-center">
            
            {/* Dynamic decorative backdrop circles to animate weight fluctuations */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center">
              <div className="w-96 h-96 rounded-full border-12 border-[var(--primary-brand)] animate-ping" style={{ animationDuration: '6s' }}></div>
            </div>

            <div className="z-10 w-full mb-8">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--text-secondary)] block mb-1">
                Telemetry Module 01
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">HX711 Digital Channel</span>
              </div>
            </div>

            {/* WEIGHT IN LARGE DISPLAY TEXT */}
            <div className="z-10 py-4 select-none">
              <div className="relative inline-flex items-baseline">
                {/* Visual ripple indicating changing weight */}
                {!liveScale.stable && liveScale.weight > 10 && (
                  <span className="absolute -inset-x-8 -inset-y-4 rounded-xl bg-amber-500/5 animate-pulse"></span>
                )}
                
                <span className="text-8xl md:text-9xl font-black tracking-tighter text-[var(--text-primary)] transition-all tabular-nums">
                  {liveScale.weight.toFixed(1)}
                </span>
                
                <span className="text-2xl md:text-3xl font-black ml-2 text-[var(--text-secondary)] uppercase">
                  {t('common.kg')}
                </span>
              </div>
            </div>

            {/* STAGE CONTAINER BAR MESSAGE */}
            <div className={`z-10 w-full max-w-sm mt-4 px-6 py-3 rounded-2xl border flex items-center justify-center gap-2.5 font-bold transition-all ${stageColor}`}>
              <span className={`w-2 h-2 rounded-full ${stageIndicator}`}></span>
              <span>{stageText}</span>
            </div>

            {/* LIVE DATA COMPARISON SUMMARY */}
            <div className="z-10 w-full mt-12 grid grid-cols-3 divide-x divide-[var(--border-ui)] border-t border-[var(--border-ui)] pt-6 text-left">
              <div className="pl-2">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Stability Check</span>
                <span className={`text-xs font-bold ${liveScale.stable ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                  {liveScale.stable ? 'LOCKED' : 'STABILIZING...'}
                </span>
              </div>
              <div className="pl-4">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Sensor Load</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {liveScale.weight > 12 ? 'COMPRESSIVE' : 'TARED / ZERO'}
                </span>
              </div>
              <div className="pl-4">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Virtual Signal</span>
                <span className="text-xs font-mono font-bold text-sky-600">
                  {liveScale.weight > 0 ? `+${(liveScale.weight * 12.3).toFixed(0)} mV` : '0.00 mV'}
                </span>
              </div>
            </div>

          </div>

          {/* DEVICE INFORMATION DIAGNOSTICS COMPONENT */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)]">
            <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider mb-3">
              Scale Hardware Settings & calibration
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[var(--accent-light)] rounded-xl border border-[var(--border-ui)]">
                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Zero Offset</p>
                <p className="font-mono font-bold mt-0.5 text-[var(--text-primary)]">42,109 raw</p>
              </div>
              <div className="p-3 bg-[var(--accent-light)] rounded-xl border border-[var(--border-ui)]">
                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Scale Factor</p>
                <p className="font-mono font-bold mt-0.5 text-[var(--text-primary)]">231.85 kg/mV</p>
              </div>
              <div className="p-3 bg-[var(--accent-light)] rounded-xl border border-[var(--border-ui)]">
                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Lpf Alpha coeff</p>
                <p className="font-mono font-bold mt-0.5 text-[var(--text-primary)]">0.12 (Dynamic)</p>
              </div>
              <div className="p-3 bg-[var(--accent-light)] rounded-xl border border-[var(--border-ui)]">
                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Median Width</p>
                <p className="font-mono font-bold mt-0.5 text-[var(--text-primary)]">5 samples</p>
              </div>
            </div>
          </div>

        </div>

        {/* COW BINDS PANEL (RIGHT 5 COLS) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-ui)] shadow-sm flex flex-col justify-between">
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[var(--primary-brand)]" />
                {t('liveScale.selectCowPrompt')}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Link current weight measurement data directly into the database files of a cow.
              </p>
            </div>

            {/* FEEDBACK LABELS */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:bg-emerald-950/20">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 dark:bg-red-950/20">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* COWS SEARCH AUTOCOMPLETE FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                1. Select Cattle profile
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder={t('cattleRecords.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full farm-input pl-9"
                />
              </div>

              {/* LIST OF FILTERED COWS */}
              <div className="border border-[var(--border-ui)] rounded-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-ui)] bg-[var(--bg-app)]/50">
                {filteredCows.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[var(--text-secondary)]">No cattle matches your keywords.</p>
                ) : (
                  filteredCows.map((cow) => {
                    const isSelected = selectedCowId === cow.cowId;
                    return (
                      <button
                        key={cow.cowId}
                        type="button"
                        onClick={() => setSelectedCowId(cow.cowId)}
                        className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                          isSelected 
                            ? 'bg-[var(--accent-light)] font-bold text-[var(--primary-brand)]' 
                            : 'hover:bg-[var(--accent-light)]/50 text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {cow.image ? (
                            <img src={cow.image} alt={cow.name} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <span>🐂</span>
                          )}
                          <div>
                            <p className="font-bold">{cow.name}</p>
                            <p className="text-[9px] text-[var(--text-secondary)]">{cow.cowId} • {cow.breed}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--primary-brand)]" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* CONFIRMATION SUMMARY BAR */}
            {selectedCow && (
              <div className="p-4 bg-[var(--accent-light)] border border-[var(--primary-brand)]/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs border-b border-[var(--border-ui)] pb-2">
                  <span className="text-[var(--text-secondary)]">Cattle Target:</span>
                  <span className="font-bold text-[var(--text-primary)]">{selectedCow.name} ({selectedCow.cowId})</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-[var(--border-ui)] pb-2">
                  <span className="text-[var(--text-secondary)]">Weighing Value:</span>
                  <span className="font-mono font-bold text-sm text-[var(--primary-brand)]">
                    {liveScale.weight.toFixed(1)} {t('common.kg')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
                  <span>Stability Ratio:</span>
                  <span className={`font-semibold ${liveScale.stable ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                    {liveScale.stable ? 'Excellent (Locked)' : 'Fluctuating'}
                  </span>
                </div>
              </div>
            )}

          </div>

          <div className="space-y-2 pt-6 border-t border-[var(--border-ui)]">
            <button
              onClick={handleBindAndLog}
              disabled={isSaving || liveScale.weight < 1}
              className="w-full farm-btn-primary py-3.5 font-bold shadow-md hover:scale-[1.01] transition-transform disabled:opacity-40 disabled:pointer-events-none"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Saving session..." : t('liveScale.bindButton')}</span>
            </button>

            <button
              onClick={handleManualUnboundWeight}
              disabled={isSaving || liveScale.weight < 1}
              className="w-full farm-btn-secondary py-2.5 text-xs text-[var(--text-secondary)] border-dashed border-[var(--border-ui)] disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>{t('liveScale.unidentifiedCattle')}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
