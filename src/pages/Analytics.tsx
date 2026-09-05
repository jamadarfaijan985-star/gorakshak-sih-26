import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnimalList, useSensorHistory, useRiskHistory } from '../hooks/useAnimals';
import { animalService } from '../services/animalService';
import {
  mockHerdRiskTrend,
  mockActivityTrend,
  mockRuminationTrend,
  mockTemperatureTrend,
  mockYieldTrend,
} from '../data/mockData';
import { env } from '../config/env';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Download,
  Calendar,
  Filter,
  WifiOff,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer';

interface SensorChartPoint {
  date: string;
  temp?: number;
  ambient?: number;
  thi?: number;
  rumination?: number;
  activity?: number;
  baseline?: number;
}

interface RiskChartPoint {
  day: string;
  riskScore?: number;
  riskLevel?: string;
}

const RISK_LEVEL_NUMERIC: Record<string, number> = {
  no_risk: 5,
  low: 30,
  moderate: 60,
  high: 90,
};

function fmt(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const Analytics: React.FC = () => {
  const { t, showToast } = useApp();
  const { activeFarmId } = useAuth();

  const isLive = !env.DEMO_MODE && !!activeFarmId;

  const { data: apiAnimalsPage, isLoading: animalsLoading } = useAnimalList(
    isLive ? { farm_id: activeFarmId!, limit: 200 } : undefined,
  );
  const liveAnimals = apiAnimalsPage?.data ?? [];
  const demoAnimals = animalService.getAll();

  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  const targetAnimalId = isLive
    ? (selectedAnimalId !== 'all' ? selectedAnimalId : (liveAnimals[0]?.id ?? ''))
    : (selectedAnimalId !== 'all' ? selectedAnimalId : '');

  const sensorLimit = timeRange === '7d' ? 50 : timeRange === '14d' ? 100 : 200;

  const {
    data: sensorPage,
    isLoading: sensorLoading,
    error: sensorError,
    refetch: refetchSensor,
  } = useSensorHistory(
    isLive && targetAnimalId ? targetAnimalId : undefined,
    sensorLimit,
  );

  const {
    data: riskPage,
    isLoading: riskLoading,
    error: riskError,
    refetch: refetchRisk,
  } = useRiskHistory(
    isLive && targetAnimalId ? targetAnimalId : undefined,
    50,
  );

  const liveSensorChartData = useMemo<SensorChartPoint[]>(() => {
    if (!sensorPage?.data?.length) return [];
    return [...sensorPage.data]
      .reverse()
      .map((r) => ({
        date: fmt(r.recorded_at),
        temp: r.surface_temp_c ?? undefined,
        ambient: r.ambient_temp_c ?? undefined,
        thi: r.thi ?? undefined,
        rumination: r.rumination_inferred_min ?? undefined,
        activity: r.activity_raw ?? undefined,
        baseline: undefined,
      }));
  }, [sensorPage]);

  const liveRiskChartData = useMemo<RiskChartPoint[]>(() => {
    if (!riskPage?.data?.length) return [];
    return [...riskPage.data]
      .reverse()
      .map((r) => ({
        day: fmt(r.computed_at),
        riskScore: r.risk_score_numeric != null
          ? Math.round(r.risk_score_numeric * 100)
          : RISK_LEVEL_NUMERIC[r.risk_level] ?? 0,
        riskLevel: r.risk_level,
      }));
  }, [riskPage]);

  const isLoading = isLive && (sensorLoading || riskLoading);
  const hasError = isLive && (sensorError || riskError);

  const demoSelectedAnimal = demoAnimals.find((a) => a.id === selectedAnimalId);

  const handleExportCSV = () => {
    if (isLive) {
      const rows = [
        ['Date', 'Surface Temp (°C)', 'Ambient Temp (°C)', 'THI', 'Rumination (min)', 'Activity Raw'],
        ...liveSensorChartData.map((r) => [
          r.date, r.temp ?? '', r.ambient ?? '', r.thi ?? '', r.rumination ?? '', r.activity ?? '',
        ]),
      ];
      const csv = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `innovx_analytics_${targetAnimalId.slice(0, 8)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(t.toastAnalyticsCsvLive, 'success');
    } else {
      const rows = [
        ['Date', 'Surface Temp (°C)', 'Ambient Temp (°C)', 'THI', 'Rumination (min)', 'Activity Index', 'Milk Yield (L)'],
        ...mockActivityTrend.map((item, idx) => [
          item.date,
          mockTemperatureTrend[idx]?.temp ?? 34.2,
          mockTemperatureTrend[idx]?.ambient ?? 30.5,
          mockTemperatureTrend[idx]?.thi ?? 76,
          mockRuminationTrend[idx]?.rumination ?? 450,
          item.activity,
          mockYieldTrend[idx]?.yield ?? 12.0,
        ]),
      ];
      const csv = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `innovx_analytics_demo_${demoSelectedAnimal?.tag ?? 'herd'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(t.toastAnalyticsCsvDemo, 'success');
    }
  };

  return (
    <div id="analytics-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.analytics}</h1>
          <p className="text-xs text-[#746E68]">
            {isLive ? t.analyticsSubtitleLive : t.analyticsSubtitleDemo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button
              onClick={() => { refetchSensor(); refetchRisk(); }}
              className="p-1.5 rounded-xl bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129]"
              title={t.refreshBtn}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={isLive && liveSensorChartData.length === 0}
            className="self-start sm:self-auto px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      <ScientificDisclaimer compact />

      {/* Demo banner */}
      {env.DEMO_MODE && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <span className="font-bold">{t.demoDataLabel}</span>
          <span>{t.analyticsDemoNotice}</span>
        </div>
      )}

      {/* No farm warning */}
      {!env.DEMO_MODE && !activeFarmId && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.noFarmWarningAnalytics}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#D9CFC7] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8A5B3D]" />
          <span className="font-semibold text-[#403129]">{t.selectAnimalLabel}:</span>
          {isLive ? (
            animalsLoading ? (
              <div className="flex items-center gap-1.5 text-[#746E68]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>{t.loadingLabel}</span>
              </div>
            ) : (
              <select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="px-3 py-1.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-lg font-semibold text-[#403129]"
              >
                {liveAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag_id} ({a.species})
                  </option>
                ))}
              </select>
            )
          ) : (
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="px-3 py-1.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-lg font-semibold text-[#403129]"
            >
              <option value="all">{t.herdAverageOption} ({demoAnimals.length})</option>
              {demoAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tag} — {a.name} (Risk: {a.riskScore})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#746E68]" />
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                timeRange === r
                  ? 'bg-[#403129] text-white'
                  : 'bg-[#EFE9E3] text-[#746E68] hover:bg-[#D9CFC7]'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          {isLive && (
            <span className="text-[10px] text-[#746E68]">
              {t.rangeAffectsFetch}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-[#D9CFC7]">
          <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin mr-3" />
          <span className="text-sm text-[#746E68]">{t.loadingBackendSensor}</span>
        </div>
      )}

      {/* Error */}
      {hasError && !isLoading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{sensorError || riskError}</span>
          </div>
          <button
            onClick={() => { refetchSensor(); refetchRisk(); }}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-semibold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> {t.retryBtn}
          </button>
        </div>
      )}

      {/* No data yet */}
      {isLive && !isLoading && !hasError && liveSensorChartData.length === 0 && (
        <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl text-xs text-[#746E68]">
          <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-[#403129]">{t.noSensorDataForAnimal}</p>
          <p className="mt-1">Sensor readings appear here after collar data is ingested via <code className="font-mono">/api/v1/ingest/sensor</code>.</p>
        </div>
      )}

      {/* ── CHARTS ── */}
      {(!isLive || (!isLoading && liveSensorChartData.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* 1. Surface Temp */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#403129]">{t.chartTitleSurfaceTemp}</h3>
                <p className="text-[11px] text-[#746E68]">{t.chartSubtitleSurfaceTemp}</p>
              </div>
              <span className="text-[10px] font-bold bg-[#EFE9E3] text-[#403129] px-2 py-0.5 rounded">{t.measured}</span>
            </div>
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={isLive ? liveSensorChartData : mockTemperatureTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE9E3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#746E68' }} />
                  <YAxis domain={[28, 40]} tick={{ fontSize: 11, fill: '#746E68' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="temp" name={t.surfaceTempLabel} stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ambient" name={`${t.ambientTemp} (°C)`} stroke="#D97706" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Rumination */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#403129]">{t.chartTitleRumination}</h3>
                <p className="text-[11px] text-[#746E68]">{t.chartSubtitleRumination}</p>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{t.aiInferred}</span>
            </div>
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={isLive ? liveSensorChartData : mockRuminationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE9E3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#746E68' }} />
                  <YAxis domain={[0, 600]} tick={{ fontSize: 11, fill: '#746E68' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {!isLive && (
                    <Area type="monotone" dataKey="baseline" name={t.baselineLabel} stroke="#746E68" fill="#EFE9E3" strokeDasharray="4 4" />
                  )}
                  <Area type="monotone" dataKey="rumination" name={t.aiRuminationLabel} stroke="#8A5B3D" fill="#8A5B3D" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Activity */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#403129]">{t.chartTitleActivity}</h3>
                <p className="text-[11px] text-[#746E68]">{t.chartSubtitleActivity}</p>
              </div>
              <span className="text-[10px] font-bold bg-[#EFE9E3] text-[#403129] px-2 py-0.5 rounded">{t.measured}</span>
            </div>
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isLive ? liveSensorChartData : mockActivityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE9E3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#746E68' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#746E68' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="activity" name={t.activityRawShort} fill="#8A5B3D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Risk trend */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#403129]">
                  {isLive ? t.chartTitleRiskScoreLive : t.chartTitleRiskScoreDemo}
                </h3>
                <p className="text-[11px] text-[#746E68]">
                  {isLive ? t.chartSubtitleRiskLive : t.chartSubtitleRiskDemo}
                </p>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{t.aiIndexBadge}</span>
            </div>
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={isLive ? liveRiskChartData : mockHerdRiskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE9E3" />
                  <XAxis dataKey={isLive ? 'day' : 'day'} tick={{ fontSize: 11, fill: '#746E68' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#746E68' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {isLive ? (
                    <Line type="monotone" dataKey="riskScore" name={t.riskScore} stroke="#DC2626" strokeWidth={2.5} dot={{ r: 4 }} />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="avgRisk" name={`${t.herdAverageOption} ${t.riskScore}`} stroke="#403129" strokeWidth={2} />
                      <Line type="monotone" dataKey="highRiskCount" name={t.topPriorityAnimals} stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Risk level legend — live only */}
            {isLive && liveRiskChartData.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
                {[
                  { label: t.noRisk, range: '0–10', color: 'bg-emerald-500' },
                  { label: t.lowRisk, range: '10–50', color: 'bg-blue-500' },
                  { label: t.moderateRisk, range: '50–75', color: 'bg-amber-500' },
                  { label: t.highRisk, range: '75–100', color: 'bg-red-600' },
                ].map((r) => (
                  <span key={r.label} className="flex items-center gap-1 text-[#746E68]">
                    <span className={`w-2 h-2 rounded-full ${r.color}`} />
                    {r.label} ({r.range})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 5. THI */}
          {(isLive ? liveSensorChartData.some((d) => d.thi != null) : true) && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#403129]">{t.chartTitleThi}</h3>
                  <p className="text-[11px] text-[#746E68]">{t.chartSubtitleThi}</p>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">{t.estimated}</span>
              </div>
              <div className="h-52 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={isLive ? liveSensorChartData : mockTemperatureTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFE9E3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#746E68' }} />
                    <YAxis domain={[60, 90]} tick={{ fontSize: 11, fill: '#746E68' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="thi" name={t.thi} stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
