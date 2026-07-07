import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Award, 
  HelpCircle, 
  TrendingUp, 
  AlertOctagon, 
  ChevronRight, 
  Layers, 
  LineChart,
  Grid
} from 'lucide-react';
import { Cow, WeightRecord } from '../../types.js';

interface AnalyticsViewProps {
  cows: Cow[];
  weights: WeightRecord[];
  onSelectCow: (id: string) => void;
}

export default function AnalyticsView({
  cows,
  weights,
  onSelectCow
}: AnalyticsViewProps) {
  const { t } = useTranslation();

  // 1. CALCULATE BREED AVERAGES
  const breeds = Array.from(new Set(cows.map(c => c.breed)));
  const breedPerformance = breeds.map(breed => {
    // Collect cows of this breed
    const breedCows = cows.filter(c => c.breed === breed);
    const breedCowsIds = breedCows.map(c => c.cowId);
    
    // Find latest weights of these cows
    const latestWeights = breedCows.map(cow => {
      const cowRecs = weights.filter(w => w.cowId === cow.cowId);
      if (cowRecs.length === 0) return null;
      // Sort desc
      const sorted = [...cowRecs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return sorted[0].weight;
    }).filter(Boolean) as number[];

    const avg = latestWeights.length > 0
      ? Math.round((latestWeights.reduce((acc, w) => acc + w, 0) / latestWeights.length) * 10) / 10
      : 0;

    return { breed, averageWeight: avg, count: breedCows.length };
  });

  // 2. WEIGHT DISTRIBUTION CLASSIFICATIONS
  // Categories: Calf (< 150kg), Yearling (150-250kg), Standard Adult (250-350kg), Heavy Bull/Cow (> 350kg)
  let distributions = { calf: 0, yearling: 0, standard: 0, heavy: 0 };
  
  cows.forEach(cow => {
    const cowRecs = weights.filter(w => w.cowId === cow.cowId);
    if (cowRecs.length > 0) {
      const sorted = [...cowRecs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const w = sorted[0].weight;
      if (w < 150) distributions.calf++;
      else if (w >= 150 && w < 250) distributions.yearling++;
      else if (w >= 250 && w < 350) distributions.standard++;
      else distributions.heavy++;
    }
  });

  // 3. OUTSTANDING GAINERS VS ACTION LISTS
  interface AnalysisRow {
    cowId: string;
    id: string;
    name: string;
    breed: string;
    netGain: number;
    adg: number;
    headUrl: string | null;
  }

  const individualStats: AnalysisRow[] = cows.map(cow => {
    const cowRecs = [...weights.filter(w => w.cowId === cow.cowId)]
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (cowRecs.length < 2) return null;
    const netGain = cowRecs[cowRecs.length - 1].weight - cowRecs[0].weight;
    const elapsedDays = (new Date(cowRecs[cowRecs.length - 1].timestamp).getTime() - new Date(cowRecs[0].timestamp).getTime()) / (1000 * 3600 * 24);
    const adg = elapsedDays > 0.5 ? netGain / elapsedDays : 0;

    return {
      cowId: cow.cowId,
      id: cow.id,
      name: cow.name,
      breed: cow.breed,
      netGain,
      adg,
      headUrl: cow.image || null
    };
  }).filter(Boolean) as AnalysisRow[];

  const topPerformers = [...individualStats].sort((a,b) => b.netGain - a.netGain).slice(0, 3);
  const underperformers = [...individualStats].sort((a,b) => a.netGain - b.netGain).slice(0, 3);

  // RENDER DYNAMIC SVG BREED AVERAGE GRAPH
  const renderBreedComparisonChart = () => {
    const margin = { top: 10, right: 20, bottom: 25, left: 65 };
    const width = 450;
    const hGraph = 160;

    const maxWeight = Math.max(...breedPerformance.map(b => b.averageWeight), 200);

    return (
      <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full">
        {/* Render horizontal bar rows for each breed */}
        {breedPerformance.map((b, idx) => {
          const rowH = 22;
          const spacing = 10;
          const y = margin.top + idx * (rowH + spacing);
          const barWidth = ((width - margin.left - margin.right) * b.averageWeight) / maxWeight;

          return (
            <g key={b.breed}>
              {/* Row Label */}
              <text 
                x={margin.left - 8} 
                y={y + 15} 
                className="fill-[var(--text-primary)] text-[10px] font-bold text-right" 
                textAnchor="end"
              >
                {b.breed}
              </text>

              {/* Bar line spacer background background */}
              <rect
                x={margin.left}
                y={y}
                width={width - margin.left - margin.right}
                height={rowH}
                fill="var(--bg-app)"
                rx="4"
              />

              {/* Real bar */}
              <rect
                x={margin.left}
                y={y}
                width={Math.max(barWidth, 6)}
                height={rowH}
                fill="var(--primary-brand)"
                rx="4"
              />

              {/* Inner weight tag */}
              <text
                x={margin.left + barWidth - 30 > margin.left ? margin.left + barWidth - 6 : margin.left + barWidth + 8}
                y={y + 14}
                className={`text-[9px] font-mono font-bold ${
                  margin.left + barWidth - 30 > margin.left ? 'fill-white' : 'fill-[var(--text-primary)]'
                }`}
                textAnchor={margin.left + barWidth - 30 > margin.left ? 'end' : 'start'}
              >
                {b.averageWeight.toFixed(0)} kg ({b.count} head)
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // RENDER DYNAMIC SVG DISTRIBUTION HISTOGRAM
  const renderDistributionChart = () => {
    const margin = { top: 15, right: 15, bottom: 25, left: 30 };
    const width = 450;
    const hGraph = 160;

    const distAry = [
      { label: 'Calf (<150k)', count: distributions.calf },
      { label: 'Yearling (150-250k)', count: distributions.yearling },
      { label: 'Adult (250-350k)', count: distributions.standard },
      { label: 'Heavy (>350k)', count: distributions.heavy }
    ];

    const maxCount = Math.max(...distAry.map(d => d.count), 4);
    const colW = (width - margin.left - margin.right) / distAry.length;

    return (
      <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full">
        {/* Render horizontal score lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = margin.top + ratio * (hGraph - margin.top - margin.bottom);
          const label = Math.round((1 - ratio) * maxCount);
          return (
            <g key={ratio} className="opacity-30">
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--border-ui)" strokeWidth="1" strokeDasharray="3 3"/>
              <text x={margin.left - 6} y={y + 3} className="fill-[var(--text-secondary)] text-[8px] font-mono text-right" textAnchor="end">{label}</text>
            </g>
          );
        })}

        {/* Render columns representing intervals */}
        {distAry.map((d, idx) => {
          const xCol = margin.left + idx * colW;
          const colH = (d.count / maxCount) * (hGraph - margin.top - margin.bottom);
          const yCol = hGraph - margin.bottom - colH;
          const barSpacedW = colW * 0.7;
          const space = colW * 0.15;

          return (
            <g key={d.label}>
              {/* Histogram bar */}
              <rect
                x={xCol + space}
                y={yCol}
                width={barSpacedW}
                height={Math.max(colH, 2)}
                fill="var(--secondary-brand)"
                opacity="0.8"
                rx="3"
                className="hover:fill-[var(--primary-brand)] transition-colors duration-150"
              />

              {/* Count label */}
              <text 
                x={xCol + (colW / 2)} 
                y={yCol - 5} 
                className="fill-[var(--text-primary)] text-[9px] font-bold text-center" 
                textAnchor="middle"
              >
                {d.count} Head(s)
              </text>

              {/* X Axis text */}
              <text 
                x={xCol + (colW / 2)} 
                y={hGraph - margin.bottom + 14} 
                className="fill-[var(--text-secondary)] text-[8px] font-semibold text-center" 
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER COUPLE */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {t('analytics.title')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Inspect advanced demographic distribution parameters and identify inefficient cattle weight performances.
        </p>
      </div>

      {/* TWO CORE CHARTS (BENTO BOX ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BAR CHART: BREED WEIGHT MATRIX */}
        <div className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-ui)] shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Grid className="w-5 h-5 text-[var(--primary-brand)]" />
              {t('analytics.breedComparison')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Comparison of average weights categorized dynamically across registered breeds.
            </p>
          </div>

          <div className="py-2.5">
            {renderBreedComparisonChart()}
          </div>
        </div>

        {/* HISTOGRAM: WEIGHT CLASSIFICATION DISTRIBUTIONS */}
        <div className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-ui)] shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--primary-brand)]" />
              {t('analytics.weightDistribution')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Histogram sorting herd animals across life-cycle weight parameters.
            </p>
          </div>

          <div className="py-2.5">
            {renderDistributionChart()}
          </div>
        </div>

      </div>

      {/* LEADERS VS SLUGGISH PERFORMER ANALYSIS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* HIGH-PERFORMING GROWTH WINNER LIST */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-ui)] shadow-xs space-y-4">
          
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600 animate-bounce" />
              <span>{t('analytics.topGainers')}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Cattle displaying highest total weight increases from check-in logs.
            </p>
          </div>

          <div className="space-y-4">
            {topPerformers.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] py-6 text-center">Inquire additional weighing records to trigger rankings logs.</p>
            ) : (
              topPerformers.map((row, idx) => (
                <div 
                  key={row.cowId}
                  onClick={() => onSelectCow(row.id)}
                  className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex items-center justify-between hover:border-[var(--primary-brand)] transition-all cursor-pointer dark:bg-emerald-950/15 dark:border-emerald-900/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-7 h-7 bg-emerald-600 text-white font-black text-xs rounded-full flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    {row.headUrl ? (
                      <img src={row.headUrl} alt={row.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border" />
                    ) : (
                      <span>🐂</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{row.name} ({row.cowId})</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-mono">{row.breed} • Avg: +{row.adg.toFixed(2)} kg/day</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block font-mono">
                      +{row.netGain.toFixed(1)} kg
                    </span>
                    <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Net Gain</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* UNDERPERFORMERS / DANGER ACTION FEED */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-ui)] shadow-xs space-y-4">
          
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-500" />
              <span>{t('analytics.underperforming')}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Cattle registering Sluggish growth coefficients. May require dietary updates or vet clinics.
            </p>
          </div>

          <div className="space-y-4">
            {underperformers.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] py-6 text-center">No anomalies reported. All cattle growth indices are high.</p>
            ) : (
              underperformers.map((row, idx) => (
                <div 
                  key={row.cowId}
                  onClick={() => onSelectCow(row.id)}
                  className="p-3.5 bg-amber-50/30 border border-amber-100 rounded-2xl flex items-center justify-between hover:border-amber-500 transition-all cursor-pointer dark:bg-amber-950/15 dark:border-amber-900/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-7 h-7 bg-amber-500 text-white font-semibold text-xs rounded-full flex items-center justify-center shrink-0">
                      ⚠️
                    </span>
                    {row.headUrl ? (
                      <img src={row.headUrl} alt={row.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border" />
                    ) : (
                      <span>🐂</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{row.name} ({row.cowId})</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-mono">{row.breed} • Gains: +{row.adg.toFixed(2)} kg/day</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-500 block font-mono">
                      +{row.netGain.toFixed(1)} kg
                    </span>
                    <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Low Index</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
