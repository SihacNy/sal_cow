import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  Printer, 
  FileSpreadsheet, 
  Award, 
  ArrowUpRight,
  TrendingUp as GainIcon,
  TrendingDown as LossIcon
} from 'lucide-react';
import { ReportData } from '../../types.js';

interface ReportsViewProps {
  reportType: 'daily' | 'weekly' | 'monthly';
  onSetReportType: (type: 'daily' | 'weekly' | 'monthly') => void;
  reportData: ReportData | null;
}

export default function ReportsView({
  reportType,
  onSetReportType,
  reportData
}: ReportsViewProps) {
  const { t } = useTranslation();

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-ui)]">
        <div className="w-10 h-10 rounded-full border-3 border-[var(--primary-brand)] border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs text-[var(--text-secondary)] font-medium">Aggregating comprehensive weights, please wait...</p>
      </div>
    );
  }

  const { summary, chartData, details } = reportData;

  // BUILD THE REPORT HISTOGRAM / AREA CHART
  const renderReportChart = () => {
    if (chartData.length === 0) return null;

    const margin = { top: 15, right: 20, bottom: 25, left: 40 };
    const width = 500;
    const hGraph = 180;

    const svgWidth = width;
    const svgHeight = hGraph;

    const values = chartData.map(c => c.avgWeight);
    const maxVal = Math.max(...values, 100) * 1.05;
    const minVal = Math.min(...values, 0) * 0.95;
    const valRange = maxVal - minVal || 1;

    // Build bar/line coordinates
    const barWidth = ((width - margin.left - margin.right) / chartData.length) * 0.7;
    const spacing = ((width - margin.left - margin.right) / chartData.length) * 0.3;

    return (
      <div className="overflow-x-auto pt-4">
        <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full min-w-[400px]" style={{ maxHeight: '180px' }}>
          
          {/* Horizontal Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = margin.top + ratio * (hGraph - margin.top - margin.bottom);
            const val = Math.round(maxVal - ratio * valRange);
            return (
              <g key={ratio} className="opacity-30">
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--border-ui)" strokeWidth="1" strokeDasharray="3 3"/>
                <text x={margin.left - 6} y={y + 3} className="fill-[var(--text-secondary)] text-[8px] font-mono" textAnchor="end">{val} kg</text>
              </g>
            );
          })}

          {/* Render Bars for counts, and overlapping trend curve for weight */}
          {chartData.map((pt, idx) => {
            const x = margin.left + idx * ((width - margin.left - margin.right) / chartData.length);
            
            // Weight Line projection
            const yLine = hGraph - margin.bottom - ((pt.avgWeight - minVal) / valRange) * (hGraph - margin.top - margin.bottom);
            
            // Head count bar projection (on smaller ratio)
            const maxCount = Math.max(...chartData.map(c => c.count), 1);
            const barH = (pt.count / maxCount) * (hGraph - margin.top - margin.bottom) * 0.4;
            const yBar = hGraph - margin.bottom - barH;

            return (
              <g key={idx}>
                {/* Weighing Event counts (transparent structural columns) */}
                <rect 
                  x={x + spacing} 
                  y={yBar} 
                  width={barWidth} 
                  height={Math.max(barH, 0)} 
                  fill="var(--primary-brand)" 
                  opacity="0.15" 
                  rx="2"
                />

                {/* Draw connecting lines for weight curve of indexers */}
                {idx > 0 && (
                  <line
                    x1={margin.left + (idx - 1) * ((width - margin.left - margin.right) / chartData.length) + (barWidth / 2) + spacing}
                    y1={hGraph - margin.bottom - ((chartData[idx - 1].avgWeight - minVal) / valRange) * (hGraph - margin.top - margin.bottom)}
                    x2={x + (barWidth / 2) + spacing}
                    y2={yLine}
                    stroke="var(--primary-brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Little dot on each point node */}
                <circle 
                  cx={x + (barWidth / 2) + spacing} 
                  cy={yLine} 
                  r="3.5" 
                  fill="var(--bg-card)" 
                  stroke="var(--primary-brand)" 
                  strokeWidth="2" 
                />

                {/* X Axis labels */}
                <text 
                  x={x + (barWidth / 2) + spacing} 
                  y={hGraph - margin.bottom + 12} 
                  className="fill-[var(--text-secondary)] text-[7px] font-mono tracking-wider text-center" 
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

        </svg>
      </div>
    );
  };

  const handleDownloadReport = () => {
    alert("Compiling report statement... Download started successfully.");
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('reports.title')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Review detailed animal diagnostics, weight gains, and livestock performance matrices.
          </p>
        </div>

        {/* PRINT ACTIONS */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="farm-btn-secondary py-2 text-xs"
          >
            <Printer className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>{t('reports.generatePDF')}</span>
          </button>
          
          <button
            onClick={() => alert("Downloading spreadsheet statements...")}
            className="farm-btn-secondary py-2 text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{t('reports.generateExcel')}</span>
          </button>
        </div>
      </div>

      {/* INTERVAL TAB SELECTORS (DAILY / WEEKLY / MONTHLY) */}
      <div className="flex bg-[var(--bg-card)] rounded-2xl border border-[var(--border-ui)] p-1 w-full max-w-md">
        {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onSetReportType(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
              reportType === tab
                ? 'bg-[var(--primary-brand)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab === 'daily' ? t('reports.dailyReport') : tab === 'weekly' ? t('reports.weeklyReport') : t('reports.monthlyReport')}
          </button>
        ))}
      </div>

      {/* THREE BENTO METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* REPORT AVERAGE CARD */}
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] space-y-3 shadow-xs">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
            {t('reports.averageWeight')}
          </p>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-4xl font-extrabold text-[var(--text-primary)]">
              {summary.averageWeight.toFixed(1)}
            </span>
            <span className="text-base text-[var(--text-secondary)] font-bold uppercase">{t('common.kg')}</span>
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono block">
            Calculated over the active report set
          </span>
        </div>

        {/* FEED PERFORMANCE CARD */}
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] space-y-3 shadow-xs">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
            Weighed Performance Rates
          </p>
          
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-emerald-600 flex items-center">
                <GainIcon className="w-5 h-5 shrink-0" /> {summary.cowsGainedRate}%
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">Gained</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-red-500 flex items-center">
                <LossIcon className="w-5 h-5 shrink-0" /> {summary.cowsLostRate}%
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">Lost</span>
            </div>
          </div>

          <span className="text-[10px] text-[var(--text-secondary)] font-mono block">
            Ratios of cows gaining vs losing weights
          </span>
        </div>

        {/* OUTSTANDING PERFORMER CARD */}
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] shadow-xs space-y-3">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
            Leaderboard metrics
          </p>
          
          <div className="space-y-1.5 text-xs text-[var(--text-primary)]">
            {summary.mostImproved ? (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1">🥇 Most Improved:</span>
                <span className="font-bold">{summary.mostImproved.name} (+{summary.mostImproved.gain.toFixed(1)}kg)</span>
              </div>
            ) : (
              <span className="text-[var(--text-secondary)]">Pending log data</span>
            )}

            {summary.leastImproved ? (
              <div className="flex items-center justify-between border-t border-[var(--border-ui)] pt-1.5">
                <span className="text-[var(--text-secondary)] flex items-center gap-1">⚠️ Lowest Gainer:</span>
                <span className="font-bold">{summary.leastImproved.name} ({summary.leastImproved.gain.toFixed(1)}kg)</span>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* CHART AREA AND LOG DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAV METRIC VISUALIZER (LEFT 5 COLS) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider">
              {reportType === 'daily' ? 'Daily Weigh Count & Averages' : reportType === 'weekly' ? 'Weekly Growth Curve' : 'Monthly Aggregated Trajectory'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Visualizes dynamic checks and count aggregates executed in the period.
            </p>
          </div>

          {renderReportChart()}

          <div className="text-[10px] text-[var(--text-secondary)] pt-4 border-t border-[var(--border-ui)] mt-4">
            *Dotted columns represent event count, line represents average weights.
          </div>
        </div>

        {/* GROWTH LEDGER LOG (RIGHT 7 COLS) */}
        <div className="lg:col-span-7 bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-ui)] shadow-xs">
          <h4 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider mb-3">
            {t('reports.performanceTable')}
          </h4>

          <div className="overflow-x-auto max-h-[295px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-ui)] text-[var(--text-secondary)] font-bold pb-2 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Cattle</th>
                  <th className="py-2.5 px-3">Breed</th>
                  <th className="py-2.5 px-3">Stable Weight</th>
                  <th className="py-2.5 px-3">ADG Ratio</th>
                  <th className="py-2.5 px-3 text-right">Net Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-ui)]">
                {details.map((row) => (
                  <tr key={row.cowId} className="hover:bg-[var(--accent-light)]/40">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-mono font-bold text-[var(--text-primary)]">{row.cowId}</p>
                        <p className="text-[10px] font-medium text-[var(--primary-brand)]">{row.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{row.breed}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)]">
                      {row.currentWeight.toFixed(1)} {t('common.kg')}
                    </td>
                    <td className="py-3 px-3">
                      {row.adg > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{row.adg.toFixed(2)} ADG
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-secondary)]">No progress</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.gainFromPrev >= 0 ? (
                        <span className="text-emerald-600 font-bold">+{row.gainFromPrev.toFixed(1)} kg</span>
                      ) : (
                        <span className="text-red-500 font-bold">{row.gainFromPrev.toFixed(1)} kg</span>
                      )}
                    </td>
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
