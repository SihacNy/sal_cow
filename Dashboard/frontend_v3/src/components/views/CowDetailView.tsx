import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Scale, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Layers, 
  FileIcon,
  Tag,
  Clock
} from 'lucide-react';
import { Cow, WeightRecord } from '../../types.js';

interface CowDetailProps {
  cowId: string;
  cows: Cow[];
  weights: WeightRecord[];
  onBack: () => void;
}

export default function CowDetailView({
  cowId,
  cows,
  weights,
  onBack
}: CowDetailProps) {
  const { t } = useTranslation();

  // Find the exact cow (either by UUID 'id' or Label 'cowId')
  const cow = cows.find(c => c.cowId === cowId);
  if (!cow) {
    return (
      <div className="p-8 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-ui)]">
        <p className="text-sm text-[var(--text-secondary)] font-medium mb-4">Cattle profile not found or deleted.</p>
        <button onClick={onBack} className="farm-btn-secondary py-2 text-xs">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  // Get chronological records for this cow
  const cowWeights = [...weights.filter(w => w.cowId === cow.cowId)]
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // oldest to newest

  const latestWeight = cowWeights.length > 0 ? cowWeights[cowWeights.length - 1] : null;
  const previousWeight = cowWeights.length > 1 ? cowWeights[cowWeights.length - 2] : null;

  // Weight Deltas
  const totalGained = cowWeights.length > 1 
    ? (latestWeight!.weight - cowWeights[0].weight) 
    : 0;

  const currentGainFromPrev = previousWeight 
    ? latestWeight!.weight - previousWeight.weight 
    : 0;

  const growthPercentage = cowWeights.length > 1 && cowWeights[0].weight > 0
    ? Math.round((totalGained / cowWeights[0].weight) * 1000) / 10
    : 0;

  // Average Daily Gain (ADG)
  let adg = 0;
  let daysCycle = 0;
  if (cowWeights.length > 1) {
    const elapsedMs = new Date(latestWeight!.timestamp).getTime() - new Date(cowWeights[0].timestamp).getTime();
    daysCycle = Math.round(elapsedMs / (1000 * 3600 * 24));
    if (daysCycle > 0) {
      adg = Math.round((totalGained / daysCycle) * 100) / 100; // kg per day
    }
  }

  // Health assessment
  let healthStatus = "Normal growth pattern";
  let healthColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  let healthHeartColor = "text-emerald-500 animate-pulse";

  if (currentGainFromPrev < -1.5) {
    healthStatus = "WARNING: Significant weight loss detected!";
    healthColor = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200";
    healthHeartColor = "text-red-500";
  } else if (adg > 0.6) {
    healthStatus = "Excellent: High Performance growth rate";
    healthColor = "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400";
  } else if (cowWeights.length <= 1) {
    healthStatus = "Observations pending (additional check-ins required)";
    healthColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
  }

  // BUILD DYNAMIC SVG GRAPH DATA POINTS
  const renderGrowthSvgChart = () => {
    if (cowWeights.length < 2) {
      return (
        <div className="h-64 flex flex-col items-center justify-center p-6 border border-dashed border-[var(--border-ui)] rounded-2xl bg-[var(--bg-app)]/50">
          <Scale className="w-10 h-10 text-[var(--text-secondary)] mb-2.5 opacity-50" />
          <p className="text-xs text-[var(--text-secondary)]">Insure at least 2 stable weighing events to render growth trajectory graphs.</p>
        </div>
      );
    }

    const margin = { top: 20, right: 30, bottom: 35, left: 45 };
    const width = 600;
    const hGraph = 220;

    const weightsArr = cowWeights.map(w => w.weight);
    const minWeight = Math.min(...weightsArr) * 0.95; // 5% padding
    const maxWeight = Math.max(...weightsArr) * 1.05; // 5% padding
    const weightRange = maxWeight - minWeight;

    const timestamps = cowWeights.map(w => new Date(w.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    // Project points onto our SVG viewport coordinates
    const points = cowWeights.map(w => {
      const rx = margin.left + ((new Date(w.timestamp).getTime() - minTime) / timeRange) * (width - margin.left - margin.right);
      const ry = hGraph - margin.bottom - ((w.weight - minWeight) / weightRange) * (hGraph - margin.top - margin.bottom);
      return { x: rx, y: ry, weight: w.weight, date: new Date(w.timestamp).toLocaleDateString() };
    });

    const pathData = points.reduce((acc, p, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '');

    // Area filling payload
    const areaData = pathData + ` L ${points[points.length - 1].x} ${hGraph - margin.bottom} L ${points[0].x} ${hGraph - margin.bottom} Z`;

    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full min-w-[500px]" style={{ maxHeight: '220px' }}>
          
          {/* Chart Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const yValue = margin.top + ratio * (hGraph - margin.top - margin.bottom);
            const labelValue = Math.round(maxWeight - ratio * weightRange);
            return (
              <g key={ratio} className="opacity-40">
                <line 
                  x1={margin.left} 
                  y1={yValue} 
                  x2={width - margin.right} 
                  y2={yValue} 
                  stroke="var(--border-ui)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={margin.left - 8} 
                  y={yValue + 4} 
                  className="fill-[var(--text-secondary)] text-[10px] font-mono font-medium text-right"
                  textAnchor="end"
                >
                  {labelValue} kg
                </text>
              </g>
            );
          })}

          {/* Render Area Fill under weight trend */}
          <path 
            d={areaData} 
            fill="url(#farmGradient)" 
            opacity="0.12"
          />

          {/* Render Line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="var(--primary-brand)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Draggable Circle nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-help z-20">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="var(--bg-card)" 
                stroke="var(--primary-brand)" 
                strokeWidth="3.5" 
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="10" 
                fill="transparent" 
                title={`${p.weight} kg on ${p.date}`} 
              />
              {/* Floating label */}
              <text 
                x={p.x} 
                y={p.y - 12} 
                className="fill-[var(--text-primary)] text-[10px] font-bold text-center" 
                textAnchor="middle"
              >
                {p.weight.toFixed(0)} kg
              </text>
              <text 
                x={p.x} 
                y={hGraph - margin.bottom + 15} 
                className="fill-[var(--text-secondary)] text-[8px] font-mono uppercase text-center"
                textAnchor="middle"
              >
                {p.date}
              </text>
            </g>
          ))}

          {/* Defining color gradient helper */}
          <defs>
            <linearGradient id="farmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-brand)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER BLOCK */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl hover:bg-[var(--accent-light)] text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Cattle Profile Inspection Card</span>
            <span className="text-xs font-mono font-bold uppercase bg-[var(--accent-light)] text-[var(--primary-brand)] px-2.5 py-0.5 rounded">
              {cow.cowId}
            </span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Explore genealogical charts, clinical statistics, and comprehensive weight dynamics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COW BRIEF SPECIFICATIONS CARD (LEFT 4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-ui)] overflow-hidden shadow-xs flex flex-col items-center">
            
            {/* Visual Header Image representation */}
            <div className="w-full h-44 relative bg-[var(--accent-light)] overflow-hidden border-b border-[var(--border-ui)]">
              {cow.image ? (
                <img 
                  src={cow.image} 
                  alt={cow.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🐂</div>
              )}
            </div>

            {/* General Bio */}
            <div className="p-6 w-full text-center space-y-3.5">
              <div>
                <h3 className="font-extrabold text-xl text-[var(--text-primary)]">{cow.name}</h3>
                <span className="text-xs font-mono uppercase bg-[var(--bg-app)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded mt-1 inline-block">
                  Registry: {cow.cowId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs pt-2">
                <div className="bg-[var(--bg-app)] p-3 rounded-xl">
                  <span className="text-[9px] uppercase text-[var(--text-secondary)] font-bold">Breed</span>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5 mt-1 truncate">{cow.breed}</p>
                </div>
                <div className="bg-[var(--bg-app)] p-3 rounded-xl">
                  <span className="text-[9px] uppercase text-[var(--text-secondary)] font-bold">Gender</span>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5 mt-1 text-sky-700 dark:text-sky-400">
                    {cow.gender === 'Female' ? '♀ Female' : '♂ Male'}
                  </p>
                </div>
                <div className="bg-[var(--bg-app)] p-3 rounded-xl col-span-2">
                  <span className="text-[9px] uppercase text-[var(--text-secondary)] font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--primary-brand)]" /> Birth Registration
                  </span>
                  <p className="font-mono font-bold text-[var(--text-primary)] mt-1">
                    {cow.birthDate} ({new Date(cow.birthDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })})
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* CARD FOR OVERALL HEALTH ALARMS */}
          <div className={`p-5 rounded-2xl border ${healthColor} flex items-start gap-3.5`}>
            <Heart className={`w-5 h-5 shrink-0 mt-0.5 ${healthHeartColor}`} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Metabolic Assessment Score</p>
              <p className="text-xs font-medium mt-1 leading-relaxed">{healthStatus}</p>
            </div>
          </div>

        </div>

        {/* DETAILED WEIGHT ANALYSIS AND TREND CHARTS (RIGHT 8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-ui)] shadow-xs space-y-6">
            
            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--primary-brand)]" />
              <span>{t('reports.performanceTable')}</span>
            </h3>

            {/* WEIGHT SCORE INDEXERS METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-[var(--bg-app)] p-4 rounded-xl text-left border border-[var(--border-ui)]">
                <span className="text-[9px] uppercase text-[var(--text-secondary)] tracking-wider block font-bold">
                  Weight Lock (Current)
                </span>
                <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
                  {latestWeight ? latestWeight.weight.toFixed(1) : '—'}{' '}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{t('common.kg')}</span>
                </p>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1">
                  {latestWeight ? new Date(latestWeight.timestamp).toLocaleDateString() : 'Pending Weigh'}
                </span>
              </div>

              <div className="bg-[var(--bg-app)] p-4 rounded-xl text-left border border-[var(--border-ui)]">
                <span className="text-[9px] uppercase text-[var(--text-secondary)] tracking-wider block font-bold">
                  Previous Weigh
                </span>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {previousWeight ? previousWeight.weight.toFixed(1) : '—'}{' '}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{t('common.kg')}</span>
                </p>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1">
                  {previousWeight ? new Date(previousWeight.timestamp).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="bg-[var(--bg-app)] p-4 rounded-xl text-left border border-[var(--border-ui)]">
                <span className="text-[9px] uppercase text-[var(--text-secondary)] tracking-wider block font-bold">
                  Total Weight Gain
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-2xl">
                  {totalGained >= 0 ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      +{totalGained.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-0.5">
                      <TrendingDown className="w-4 h-4 shrink-0" />
                      {totalGained.toFixed(1)}
                    </span>
                  )}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{t('common.kg')}</span>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] block mt-1">
                  {growthPercentage >= 0 ? `+${growthPercentage.toFixed(1)}%` : `${growthPercentage.toFixed(1)}%`} Overall Growth
                </span>
              </div>

              <div className="bg-[var(--bg-app)] p-4 rounded-xl text-left border border-[var(--border-ui)]">
                <span className="text-[9px] uppercase text-[var(--text-secondary)] tracking-wider block font-bold">
                  Avg Daily Gain (ADG)
                </span>
                <p className="text-2xl font-black text-[var(--primary-brand)] mt-1">
                  +{adg.toFixed(2)}
                </p>
                <span className="text-[10px] text-[var(--text-secondary)] block mt-1">
                  kg/day over past {daysCycle} days
                </span>
              </div>

            </div>

            {/* DYNAMIC SVG CHART AREA CONTAINER */}
            <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-ui)] space-y-3">
              <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Historical Growth Log Representation Curve
              </p>
              {renderGrowthSvgChart()}
            </div>

          </div>

          {/* CHRONOLOGICAL TIMELINE LEDGER */}
          <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-ui)] shadow-xs space-y-4">
            
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--primary-brand)]" />
                <span>Historic Weight Check-ins Timeline</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Full chronological ledger tracing stable loads associated with {cow.name}.
              </p>
            </div>

            <div className="relative border-l border-[var(--border-ui)] pl-5 ml-4 space-y-6 pt-3.5 pb-2">
              {cowWeights.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] py-3">No weights reported on this animal registry file yet.</p>
              ) : (
                [...cowWeights].reverse().map((rec, i) => (
                  <div key={rec.id || i} className="relative">
                    {/* Time Dot Indicator */}
                    <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2.5 border-[var(--bg-card)]"></span>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <p className="font-mono text-sm font-black text-[var(--text-primary)]">
                          {rec.weight.toFixed(1)} {t('common.kg')}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono">
                          Device: {rec.deviceId} • Stable: {rec.stable ? 'YES (Verified)' : 'NO (Manual Override)'}
                        </p>
                      </div>
                      
                      <div className="text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--accent-light)] px-2.5 py-1 rounded border border-[var(--border-ui)] self-start sm:self-auto uppercase">
                        {new Date(rec.timestamp).toLocaleString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
