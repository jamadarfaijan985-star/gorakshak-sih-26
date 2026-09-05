  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useHerdSummary } from '../hooks/useFarm';
import { useAnimalList } from '../hooks/useAnimals';
import { useAlerts } from '../hooks/useAlerts';
import { riskApiService } from '../services/riskApiService';

// Legacy local services (demo mode / fallback)
import { animalService } from '../services/animalService';
import { alertService } from '../services/alertService';
import { deviceService } from '../services/deviceService';

import { RiskBadge } from '../components/RiskBadge';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer';
import { env } from '../config/env';

import type { AnimalResponse, AlertResponse, HerdSummaryResponse } from '../types/api';
import type { Animal, Alert, Device } from '../types';

import {
  PawPrint,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Thermometer,
  Activity,
  Plus,
  ArrowRight,
  ShieldAlert,
  Flame,
  Droplets,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  WifiOff,
  Loader2,
} from 'lucide-react';

// ─── Skeleton ────────────────────────────────────────────────────────────────

const StatSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs animate-pulse">
    <div className="h-3 bg-[#EFE9E3] rounded w-1/2 mb-3" />
    <div className="h-8 bg-[#EFE9E3] rounded w-2/3 mb-2" />
    <div className="h-3 bg-[#EFE9E3] rounded w-3/4" />
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const Dashboard: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const { t, farmMode, speciesFilter, openModal, showToast } = useApp();
  const { activeFarmId, user } = useAuth();

  // ── Live backend data ──────────────────────────────────────────────────────
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useHerdSummary(env.DEMO_MODE ? undefined : activeFarmId ?? undefined);

  const {
    data: apiAnimalsPage,
    isLoading: animalsLoading,
    refetch: refetchAnimals,
  } = useAnimalList(
    !env.DEMO_MODE && activeFarmId
      ? {
          farm_id: activeFarmId,
          limit: 200,
          species: speciesFilter !== 'all' ? speciesFilter : undefined,
        }
      : undefined,
  );

  const {
    data: apiAlertsPage,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useAlerts(
    !env.DEMO_MODE && activeFarmId ? { farm_id: activeFarmId, limit: 5 } : undefined,
  );

  // ── Demo / fallback local data ─────────────────────────────────────────────
  const [demoAnimals, setDemoAnimals] = useState<Animal[]>([]);
  const [demoAlerts, setDemoAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const loadDemoData = useCallback(() => {
    let list = animalService.getAll();
    if (speciesFilter !== 'all') list = list.filter((a) => a.species === speciesFilter);
    setDemoAnimals(list);
    setDemoAlerts(alertService.getActive().slice(0, 5));
    setDevices(deviceService.getAll());
  }, [speciesFilter]);

  useEffect(() => {
    if (env.DEMO_MODE) loadDemoData();
    else {
      // Devices have no backend endpoint — always load from localStorage
      setDevices(deviceService.getAll());
    }
  }, [speciesFilter, refreshKey, loadDemoData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const isLive = !env.DEMO_MODE && !!activeFarmId;
  const isLoading = isLive && (summaryLoading || animalsLoading || alertsLoading);

  // Live stats from herd summary
  const liveStats = summary
    ? {
        total: summary.total_animals,
        cows: summary.animals_by_species.cow ?? 0,
        buffaloes: summary.animals_by_species.buffalo ?? 0,
        highRisk: summary.risk_distribution.high ?? 0,
        moderateRisk: summary.risk_distribution.moderate ?? 0,
        lowRisk: summary.risk_distribution.low ?? 0,
        noRisk: summary.risk_distribution.no_risk ?? 0,
        avgRisk: 0, // not in summary
        avgYield: '—',
        openAlerts: summary.open_alerts_count,
      }
    : null;

  // Demo stats
  const demoStats = env.DEMO_MODE ? animalService.getHerdStats() : null;

  const stats = liveStats ?? demoStats;

  // Top priority animals
  const liveAnimals: AnimalResponse[] = apiAnimalsPage?.data ?? [];
  const topPriorityAnimals = isLive
    ? liveAnimals.slice(0, 4)
    : [...demoAnimals].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);

  // Alerts
  const liveAlerts: AlertResponse[] = apiAlertsPage?.data ?? [];
  const displayAlerts = isLive ? liveAlerts : demoAlerts;

  // ── Alert actions ──────────────────────────────────────────────────────────
  const handleAcknowledgeDemo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alertService.acknowledge(id);
    showToast(t.toastAlertAcknowledged, 'info');
    loadDemoData();
  };

  const handleResolveDemo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alertService.resolve(id);
    showToast(t.toastAlertResolved, 'success');
    loadDemoData();
  };

  const handleAcknowledgeLive = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await riskApiService.updateAlert(alertId, { status: 'acknowledged' });
      showToast(t.toastAlertAcknowledged, 'info');
      refetchAlerts();
    } catch {
      showToast(t.toastFailedAcknowledge, 'error');
    }
  };

  const handleResolveLive = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await riskApiService.updateAlert(alertId, { status: 'resolved' });
      showToast(t.toastAlertResolved, 'success');
      refetchAlerts();
    } catch {
      showToast(t.toastFailedResolve, 'error');
    }
  };

  const handleRefreshAll = () => {
    if (isLive) {
      refetchSummary();
      refetchAnimals();
      refetchAlerts();
    } else {
      loadDemoData();
    }
    showToast(t.toastDashboardRefreshed, 'info');
  };

  // ── GAP 5: Trigger risk computation for all active animals ─────────────────
  const [computingRisk, setComputingRisk] = useState(false);
  const handleComputeAllRisk = async () => {
    if (!isLive) return;
    setComputingRisk(true);
    try {
      const result = await riskApiService.compute({});  // no animal_id = all active animals
      showToast(
        `${t.toastRiskComputed}: ${result.total_computed} ${t.totalAnimals.toLowerCase()} · ${result.alerts_generated} alert(s)`,
        'success',
      );
      // Refresh everything after computation
      refetchSummary();
      refetchAlerts();
    } catch (err: any) {
      showToast(err?.detail || t.toastFailedRisk, 'error');
    } finally {
      setComputingRisk(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div id="dashboard-page" className="space-y-6">

      {/* ── Top banner ──────────────────────────────────────────────────── */}
      <div className="bg-[#EFE9E3] border border-[#D9CFC7] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#8A5B3D] text-white rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#403129]">
                GoDrishti — Dairy Livestock Health Intelligence
</span>
              {isLive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {t.liveLabel}
                </span>
              )}
              {!isLive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {t.demoDataLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-[#746E68] mt-0.5">
              {t.appBannerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {isLive && user && (
            <span className="text-[11px] text-[#746E68] hidden sm:inline">
              {user.name} · {user.role}
            </span>
          )}
          <button
            onClick={handleRefreshAll}
            className="p-1.5 rounded-xl text-[#746E68] hover:bg-[#D9CFC7] transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-[#746E68]">
            {farmMode === 'low_resource' ? t.lowResourceSmallholder : t.connectedMultiSensor}
          </span>
        </div>
      </div>

      {/* ── Scientific disclaimer ────────────────────────────────────────── */}
      <ScientificDisclaimer compact />

      {/* ── No farm configured warning ───────────────────────────────────── */}
      {!env.DEMO_MODE && !activeFarmId && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <WifiOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-1">{t.noFarmConnectedTitle}</strong>
            {t.noFarmConnectedDesc.split('Settings').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>{part}<Link to="/settings" className="underline font-semibold">{t.settingsLink}</Link></span>
              ) : <span key={i}>{part}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Backend error warning ────────────────────────────────────────── */}
      {summaryError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{summaryError}</span>
          </div>
          <button
            onClick={refetchSummary}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-semibold shrink-0"
          >
            {t.retryBtn}
          </button>
        </div>
      )}

      {/* ── Herd overview metrics ────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#746E68] uppercase tracking-wider">
          {t.herdOverview}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            {/* Total Animals */}
            <div className="bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#746E68]">
                <span className="text-xs font-semibold">{t.totalAnimals}</span>
                <PawPrint className="w-4 h-4 text-[#8A5B3D]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#403129]">
                  {stats?.total ?? '—'}
                </span>
                <span className="text-xs text-[#746E68]">
                  ({stats?.cows ?? 0} 🐄 / {stats?.buffaloes ?? 0} 🐃)
                </span>
              </div>
              <div className="text-[11px] text-[#746E68] mt-2 pt-2 border-t border-[#EFE9E3]">
                {isLive
                  ? <span>{t.openAlertsLabel}: <strong>{liveStats?.openAlerts ?? 0}</strong></span>
                  : <span>{t.avgHerdYield}: <strong>{demoStats?.avgYield ?? '—'} L/day</strong></span>
                }
              </div>
            </div>

            {/* High Risk */}
            <div className="bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-red-700">
                <span className="text-xs font-semibold">{t.priorityConfirmation}</span>
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-red-600">
                  {stats?.highRisk ?? '—'}
                </span>
                <span className="text-xs text-red-700 font-medium">{t.requireCmtExam}</span>
              </div>
              <div className="text-[11px] text-[#746E68] mt-2 pt-2 border-t border-[#EFE9E3]">
                {t.moderateRiskAnimals}: <strong>{stats?.moderateRisk ?? 0}</strong>
              </div>
            </div>

            {/* Devices — localStorage only; no backend device endpoint exists */}
            <div className="bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#746E68]">
                <span className="text-xs font-semibold">{t.connectedDevices}</span>
                <Cpu className="w-4 h-4 text-[#8A5B3D]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#403129]">
                  {devices.filter((d) => d.connectionStatus === 'Connected').length}
                </span>
                <span className="text-xs text-[#746E68]">/ {devices.length} {t.totalLabel}</span>
              </div>
              <div className="text-[11px] text-[#746E68] mt-2 pt-2 border-t border-[#EFE9E3] flex items-center justify-between">
                <span>{t.lowBattery}: <strong>{devices.filter((d) => d.batteryLevel < 25).length}</strong></span>
                {isLive && (
                  <span className="text-[10px] text-[#8A5B3D] font-semibold bg-[#EFE9E3] px-1.5 py-0.5 rounded whitespace-nowrap">
                    {t.deviceLocalBadge}
                  </span>
                )}
              </div>
            </div>

            {/* Below-threshold animals (was "No Risk") */}
            <div className="bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#746E68]">
                <span className="text-xs font-semibold">{t.noRisk}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {stats?.noRisk ?? '—'}
                </span>
                <span className="text-xs text-emerald-700 font-medium">{t.noElevatedSignal}</span>
              </div>
              <div className="text-[11px] text-[#746E68] mt-2 pt-2 border-t border-[#EFE9E3]">
                {t.lowSignalCount}: <strong>{stats?.lowRisk ?? 0}</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Risk distribution bar + Quick actions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk distribution */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-[#403129]">{t.riskOverview}</h3>
              <p className="text-xs text-[#746E68]">
                {isLive ? t.aiSignalDistLive : t.aiSignalDistDemo}
              </p>
            </div>
            {stats && stats.total > 0 && (
              <span className="text-xs font-bold text-[#8A5B3D]">
                {isLive ? `${stats.total} ${t.totalAnimals.toLowerCase()}` : `Avg: ${(stats as ReturnType<typeof animalService.getHerdStats>).avgRisk}/100`}
              </span>
            )}
          </div>

          {stats && stats.total > 0 ? (
            <>
              <div className="w-full h-4 bg-[#EFE9E3] rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${(stats.noRisk / stats.total) * 100}%` }} className="bg-emerald-500 h-full transition-all" />
                <div style={{ width: `${(stats.lowRisk / stats.total) * 100}%` }} className="bg-blue-500 h-full transition-all" />
                <div style={{ width: `${(stats.moderateRisk / stats.total) * 100}%` }} className="bg-amber-500 h-full transition-all" />
                <div style={{ width: `${(stats.highRisk / stats.total) * 100}%` }} className="bg-red-600 h-full transition-all" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                {[
                  { label: t.noRisk, count: stats.noRisk, bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-900', sub: 'text-emerald-700' },
                  { label: t.lowRisk, count: stats.lowRisk, bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500', text: 'text-blue-900', sub: 'text-blue-700' },
                  { label: t.moderateRisk, count: stats.moderateRisk, bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500', text: 'text-amber-900', sub: 'text-amber-700' },
                  { label: t.highRisk, count: stats.highRisk, bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-600', text: 'text-red-900', sub: 'text-red-700' },
                ].map((r) => (
                  <div key={r.label} className={`flex items-center gap-2 p-2 rounded-xl ${r.bg} border ${r.border}`}>
                    <span className={`w-3 h-3 rounded-full ${r.dot} shrink-0`} />
                    <div>
                      <div className={`font-bold ${r.text}`}>{r.label}</div>
                      <div className={`text-[11px] ${r.sub}`}>{r.count} {t.headsUnit}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Clear provenance: this is AI signal, not confirmed diagnosis */}
              <div className="mt-2 pt-2 border-t border-[#EFE9E3] text-[10px] text-[#746E68] space-y-0.5">
                <div><span className="font-bold text-[#403129]">{t.aiModelSignalLabel}:</span> {t.aiModelSignalDesc}</div>
                <div><span className="font-bold text-[#403129]">{t.confirmatoryRequiredLabel}:</span> {t.confirmatoryRequiredDesc}</div>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-[#746E68] py-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8A5B3D]" />
                  <span>{t.loadingRiskData}</span>
                </div>
              ) : (
                t.noSignalAvailable
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#403129] mb-1">{t.quickActions}</h3>
            <p className="text-xs text-[#746E68] mb-3">{t.rapidFieldEntry}</p>
            <div className="space-y-2">
              <button onClick={() => openModal('add_animal')} className="w-full py-2 px-3 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-semibold text-xs rounded-xl flex items-center justify-between transition-colors">
                <span>{t.addAnimal}</span>
                <Plus className="w-4 h-4 text-[#8A5B3D]" />
              </button>
              <button onClick={() => openModal('add_milk')} className="w-full py-2 px-3 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-semibold text-xs rounded-xl flex items-center justify-between transition-colors">
                <span>{t.recordMilk}</span>
                <Droplets className="w-4 h-4 text-[#8A5B3D]" />
              </button>
              <button onClick={() => openModal('add_cmt')} className="w-full py-2 px-3 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-semibold text-xs rounded-xl flex items-center justify-between transition-colors">
                <span>{t.newCmtTest}</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">4-Paddle</span>
              </button>
              <button onClick={() => openModal('add_health')} className="w-full py-2 px-3 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-semibold text-xs rounded-xl flex items-center justify-between transition-colors">
                <span>{t.addHealthRecord}</span>
                <Plus className="w-4 h-4 text-[#8A5B3D]" />
              </button>

              {/* GAP 5: Risk Compute trigger — only shown in live mode */}
              {isLive && (
                <button
                  onClick={handleComputeAllRisk}
                  disabled={computingRisk}
                  className="w-full py-2 px-3 bg-[#403129] hover:bg-[#8A5B3D] disabled:bg-[#C9B59C] text-white font-semibold text-xs rounded-xl flex items-center justify-between transition-colors"
                >
                  <span>{computingRisk ? t.computingLabel : t.refreshSignalsBtn}</span>
                  {computingRisk
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <TrendingUp className="w-4 h-4" />
                  }
                </button>
              )}
            </div>
          </div>
          <Link to="/analytics" className="mt-3 text-center py-2 text-xs font-bold text-[#8A5B3D] hover:text-[#403129] flex items-center justify-center gap-1">
            <span>{t.viewAnalytics}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Priority Animals ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#746E68] uppercase tracking-wider">{t.topPriorityAnimals}</h2>
            <p className="text-xs text-[#746E68]">
              {isLive ? t.fromBackendSorted : t.rankedByRisk}
            </p>
          </div>
          <Link to="/animals" className="text-xs font-semibold text-[#8A5B3D] hover:underline flex items-center gap-1">
            <span>{t.viewAllAnimals} ({stats?.total ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Live mode */}
        {isLive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {animalsLoading
              ? [0, 1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-[#D9CFC7] rounded-2xl p-4 animate-pulse h-36" />
                ))
              : topPriorityAnimals.map((animal: AnimalResponse) => (
                  <div key={animal.id} className="bg-white border border-[#D9CFC7] rounded-2xl p-4 shadow-xs hover:border-[#8A5B3D] transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-[#403129]">{animal.tag_id}</span>
                          <span className="text-xs">{animal.species === 'cow' ? '🐄' : '🐃'}</span>
                        </div>
                        <p className="text-[11px] text-[#746E68]">
                          {animal.breed || 'Unknown breed'} •{' '}
                          {animal.age_months ? `${Math.round(animal.age_months / 12)}yr` : '—'}
                        </p>
                        <p className="text-[11px] text-[#746E68]">
                          Lact #{animal.lactation_number ?? '—'} • Status: {animal.status}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        animal.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {animal.status}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#D9CFC7]/60 flex items-center justify-between text-xs">
                      <Link to={`/animals/${animal.id}`} className="font-bold text-[#8A5B3D] hover:text-[#403129] flex items-center gap-1">
                        <span>{t.viewAnimal}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openModal('add_cmt')} className="px-2.5 py-1 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] rounded-lg font-semibold text-[#403129]">
                          {t.runCmt}
                        </button>
                        <Link to="/udder-analysis" className="px-2.5 py-1 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-lg font-semibold">
                          {t.scanUdder}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            {!animalsLoading && topPriorityAnimals.length === 0 && (
              <div className="col-span-2 text-center py-8 bg-white border border-[#D9CFC7] rounded-2xl text-xs text-[#746E68]">
                No animals found for this farm yet. <Link to="/animals" className="text-[#8A5B3D] font-semibold hover:underline">{t.addAnimalsLink}</Link>
              </div>
            )}
          </div>
        )}

        {/* Demo mode — original rich cards */}
        {!isLive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topPriorityAnimals.map((animal: Animal) => (
              <div key={animal.id} className="bg-white border border-[#D9CFC7] rounded-2xl p-4 shadow-xs hover:border-[#8A5B3D] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={animal.image} alt={animal.name} className="w-14 h-14 rounded-xl object-cover border border-[#D9CFC7]" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-[#403129]">{animal.name}</h4>
                        <span className="text-xs">{animal.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`}</span>
                      </div>
                      <p className="text-xs text-[#746E68] font-medium">{animal.tag} • {animal.breed}</p>
                      <p className="text-[11px] text-[#746E68]">Lact #{animal.lactationNumber} • DIM {animal.daysInMilk}d • {animal.farm}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <RiskBadge level={animal.riskLevel} score={animal.riskScore} />
                    <div className="text-[10px] text-[#746E68] mt-1">{t.riskTrend}: <span className="font-bold uppercase text-[#403129]">{animal.riskTrend}</span></div>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7]/70 text-xs">
                  <div className="font-semibold text-[#8A5B3D] mb-1 text-[11px]">{t.aiContributingFactors}:</div>
                  <ul className="space-y-1 text-[11px] text-[#403129]">
                    {animal.riskFactors.slice(0, 3).map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-700 font-bold shrink-0">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] bg-[#EFE9E3]/50 p-2 rounded-xl">
                  <div>
                    <div className="text-[#746E68]">{t.surfaceTemperature}</div>
                    <div className="font-bold text-[#403129] text-xs">{animal.currentSensors.surfaceTemp}°C</div>
                    <div className="text-[9px] text-[#8A5B3D]">{t.measured}</div>
                  </div>
                  <div>
                    <div className="text-[#746E68]">{t.aiInferredRumination}</div>
                    <div className="font-bold text-[#403129] text-xs">{animal.currentSensors.ruminationMinutes} min</div>
                    <div className="text-[9px] text-[#8A5B3D]">{t.aiInferred}</div>
                  </div>
                  <div>
                    <div className="text-[#746E68]">{t.activity}</div>
                    <div className="font-bold text-[#403129] text-xs">{animal.currentSensors.activityScore}/100</div>
                    <div className="text-[9px] text-[#8A5B3D]">MPU6050</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#D9CFC7]/60 flex items-center justify-between text-xs">
                  <Link to={`/animals/${animal.id}`} className="font-bold text-[#8A5B3D] hover:text-[#403129] flex items-center gap-1">
                    <span>{t.viewAnimal}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openModal('add_cmt', animal.id)} className="px-2.5 py-1 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] rounded-lg font-semibold text-[#403129]">{t.runCmt}</button>
                    <Link to="/udder-analysis" className="px-2.5 py-1 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-lg font-semibold">{t.scanUdder}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Recent Alerts ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#746E68] uppercase tracking-wider">{t.recentAlerts}</h2>
            <p className="text-xs text-[#746E68]">
              {isLive ? t.openAlertsLabel : t.recentAlerts}
            </p>
          </div>
          <Link to="/alerts" className="text-xs font-semibold text-[#8A5B3D] hover:underline flex items-center gap-1">
            <span>{t.viewAllAlerts}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {alertsLoading && isLive ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-white border border-[#D9CFC7] rounded-xl animate-pulse" />
            ))
          ) : displayAlerts.length === 0 ? (
            <div className="p-6 text-center bg-white border border-[#D9CFC7] rounded-xl text-xs text-[#746E68]">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              {t.noActiveAlerts}
            </div>
          ) : isLive ? (
            /* Live alert cards */
            (displayAlerts as AlertResponse[]).map((alert) => (
              <div key={alert.id} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                alert.severity === 'critical' ? 'bg-red-50/70 border-red-200' :
                alert.severity === 'high' ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-[#D9CFC7]'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    alert.severity === 'critical' ? 'bg-red-600 text-white' :
                    alert.severity === 'high' ? 'bg-amber-600 text-white' : 'bg-[#EFE9E3] text-[#403129]'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#403129] uppercase">{alert.severity}</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{alert.status}</span>
                      <span className="text-[11px] text-[#746E68]">{new Date(alert.triggered_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-[#746E68] mt-0.5">{alert.message}</p>
                    <span className="text-[11px] font-semibold text-[#8A5B3D]">{t.animalIdLabel}: {alert.animal_id.slice(0, 8)}…</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center text-xs">
                  {alert.status === 'open' && (
                    <button onClick={(e) => handleAcknowledgeLive(alert.id, e)} className="px-2.5 py-1 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] rounded-lg font-semibold">
                      {t.acknowledge}
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button onClick={(e) => handleResolveLive(alert.id, e)} className="px-2.5 py-1 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-lg font-semibold">
                      {t.resolve}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            /* Demo alert cards */
            (displayAlerts as Alert[]).map((alert) => (
              <div key={alert.id} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                alert.priority === 'critical' ? 'bg-red-50/70 border-red-200' :
                alert.priority === 'high' ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-[#D9CFC7]'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    alert.priority === 'critical' ? 'bg-red-600 text-white' :
                    alert.priority === 'high' ? 'bg-amber-600 text-white' : 'bg-[#EFE9E3] text-[#403129]'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#403129]">{alert.title}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                      }`}>{alert.priority}</span>
                      <span className="text-[11px] text-[#746E68]">{alert.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#746E68] mt-0.5">{alert.message}</p>
                    {alert.animalName && <span className="text-[11px] font-semibold text-[#8A5B3D]">{t.animalIdLabel}: {alert.animalName} ({alert.animalTag})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center text-xs">
                  {alert.status === 'active' && (
                    <button onClick={(e) => handleAcknowledgeDemo(alert.id, e)} className="px-2.5 py-1 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] rounded-lg font-semibold">{t.acknowledge}</button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button onClick={(e) => handleResolveDemo(alert.id, e)} className="px-2.5 py-1 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-lg font-semibold">{t.resolve}</button>
                  )}
                  {alert.animalId && (
                    <Link to={`/animals/${alert.animalId}`} className="px-2.5 py-1 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-lg font-semibold">{t.viewAnimal}</Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
