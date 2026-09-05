import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../hooks/useAlerts';
import { riskApiService } from '../services/riskApiService';
import { alertService } from '../services/alertService';
import { env } from '../config/env';
import type { AlertResponse } from '../types/api';
import type { Alert, AlertPriority, AlertStatus } from '../types';
import {
  Bell, AlertTriangle, CheckCircle2, Clock, Filter,
  CheckCheck, ArrowRight, Loader2, RefreshCw, WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const severityClass = (s: string) =>
  s === 'critical' ? 'bg-red-50/60 border-red-200'
  : s === 'high' ? 'bg-amber-50/60 border-amber-200'
  : 'bg-white border-[#D9CFC7]';

const severityIconClass = (s: string) =>
  s === 'critical' ? 'bg-red-600 text-white'
  : s === 'high' ? 'bg-amber-600 text-white'
  : 'bg-[#EFE9E3] text-[#403129]';

const severityBadgeClass = (s: string) =>
  s === 'critical' ? 'bg-red-100 text-red-800'
  : s === 'high' ? 'bg-amber-100 text-amber-800'
  : 'bg-gray-100 text-gray-800';

const statusBadgeClass = (s: string) =>
  s === 'open' ? 'bg-red-600 text-white'
  : s === 'acknowledged' ? 'bg-amber-600 text-white'
  : s === 'false_positive' ? 'bg-blue-600 text-white'
  : 'bg-emerald-600 text-white';

export const Alerts: React.FC = () => {
  const { t, showToast } = useApp();
  const { activeFarmId, user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'acknowledged' | 'resolved' | 'false_positive'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const isLive = !env.DEMO_MODE && !!activeFarmId;

  const { data: apiPage, isLoading, error, refetch } = useAlerts(
    isLive
      ? {
          farm_id: activeFarmId!,
          limit: 100,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          severity: severityFilter !== 'all' ? severityFilter : undefined,
        }
      : undefined,
  );

  const liveAlerts: AlertResponse[] = apiPage?.data ?? [];

  const demoAlerts = alertService.getAll().filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (severityFilter !== 'all' && a.priority !== severityFilter) return false;
    return true;
  });

  const handleLiveUpdate = async (alertId: string, status: AlertResponse['status']) => {
    try {
      await riskApiService.updateAlert(alertId, { status, acknowledged_by: user?.id });
      showToast(status === 'resolved' ? t.toastAlertResolved : t.toastAlertAcknowledged, status === 'resolved' ? 'success' : 'info');
      refetch();
    } catch {
      showToast(t.toastFailedAcknowledge, 'error');
    }
  };

  const handleDemoAcknowledge = (id: string) => {
    alertService.acknowledge(id);
    showToast(t.toastAlertAcknowledged, 'info');
    setRefreshKey((k) => k + 1);
  };
  const handleDemoReview = (id: string) => {
    alertService.inReview(id);
    showToast(t.toastAlertAcknowledged, 'info');
    setRefreshKey((k) => k + 1);
  };
  const handleDemoResolve = (id: string) => {
    alertService.resolve(id);
    showToast(t.toastAlertResolved, 'success');
    setRefreshKey((k) => k + 1);
  };
  const handleAcknowledgeAll = () => {
    if (isLive) {
      liveAlerts.filter((a) => a.status === 'open').forEach((a) => handleLiveUpdate(a.id, 'acknowledged'));
    } else {
      demoAlerts.forEach((a) => { if (a.status === 'active') alertService.acknowledge(a.id); });
      showToast(t.acknowledgeAllActive, 'info');
      setRefreshKey((k) => k + 1);
    }
  };

  const displayCount = isLive ? liveAlerts.length : demoAlerts.length;

  return (
    <div id="alerts-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.alerts}</h1>
          <p className="text-xs text-[#746E68]">
            {isLive ? t.alertsSubtitleLive : t.alertsSubtitleDemo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button onClick={refetch} className="p-1.5 rounded-xl bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129]">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleAcknowledgeAll} className="self-start sm:self-auto px-3.5 py-1.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] text-xs font-bold rounded-xl flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4 text-[#8A5B3D]" />
            <span>{t.acknowledgeAllActive}</span>
          </button>
        </div>
      </div>

      {/* Demo badge */}
      {env.DEMO_MODE && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <span className="font-bold">{t.demoDataLabel}</span>
          <span>{t.alertsDemoNotice}</span>
        </div>
      )}

      {/* No farm */}
      {!env.DEMO_MODE && !activeFarmId && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.noFarmAlertData}</span>
        </div>
      )}

      {/* Backend error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /><span>{error}</span></div>
          <button onClick={refetch} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-semibold shrink-0 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> {t.retryBtn}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#8A5B3D]" />
          <span className="font-semibold text-[#403129]">{t.filterSeverityLabel}:</span>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as any)} className="px-2.5 py-1 bg-[#F9F8F6] border border-[#D9CFC7] rounded-lg text-xs font-medium">
            <option value="all">{t.filterAll}</option>
            <option value="critical">{t.critical}</option>
            <option value="high">{t.high}</option>
            <option value="medium">{t.medium}</option>
            <option value="low">{t.low}</option>
          </select>

          <span className="font-semibold text-[#403129] ml-2">{t.filterStatusLabel}:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-2.5 py-1 bg-[#F9F8F6] border border-[#D9CFC7] rounded-lg text-xs font-medium">
            <option value="all">{t.filterAll}</option>
            <option value="open">{t.statusOpen}</option>
            <option value="acknowledged">{t.statusAcknowledged}</option>
            <option value="resolved">{t.statusResolved}</option>
            <option value="false_positive">{t.statusFalsePositive}</option>
          </select>
        </div>
        <span className="text-xs text-[#746E68]">{t.foundLabel} <strong>{displayCount}</strong></span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin" />
        </div>
      )}

      {/* LIVE alert cards */}
      {!isLoading && isLive && (
        <div className="space-y-3">
          {liveAlerts.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#403129]">{t.noAlertsFound}</p>
              <p className="text-xs text-[#746E68] mt-1">{t.allVitalsNormal}</p>
            </div>
          ) : (
            liveAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-2xl border shadow-xs transition-all ${severityClass(alert.severity)}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${severityIconClass(alert.severity)}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${severityBadgeClass(alert.severity)}`}>{alert.severity}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${statusBadgeClass(alert.status)}`}>{alert.status.replace('_', ' ')}</span>
                        <span className="text-[11px] text-[#746E68]">{new Date(alert.triggered_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#746E68] mt-1 leading-relaxed">{alert.message}</p>
                      <div className="mt-1.5 text-xs font-semibold text-[#8A5B3D]">
                        {t.animalIdLabel}: <code className="font-mono text-[#403129]">{alert.animal_id.slice(0, 8)}…</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center text-xs">
                    {alert.status === 'open' && (
                      <button onClick={() => handleLiveUpdate(alert.id, 'acknowledged')} className="px-3 py-1.5 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] rounded-xl font-semibold">
                        {t.acknowledge}
                      </button>
                    )}
                    {alert.status !== 'resolved' && alert.status !== 'false_positive' && (
                      <button onClick={() => handleLiveUpdate(alert.id, 'resolved')} className="px-3 py-1.5 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-xl font-semibold">
                        {t.resolve}
                      </button>
                    )}
                    {alert.status !== 'false_positive' && alert.status !== 'resolved' && (
                      <button onClick={() => handleLiveUpdate(alert.id, 'false_positive')} className="px-3 py-1.5 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] rounded-xl font-semibold">
                        {t.markFalsePositive}
                      </button>
                    )}
                    <Link to={`/animals/${alert.animal_id}`} className="px-3 py-1.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold flex items-center gap-1">
                      <span>{t.viewAnimal}</span><ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DEMO alert cards */}
      {!isLive && (
        <div className="space-y-3">
          {demoAlerts.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#403129]">{t.noAlertsMatchCriteria}</p>
              <p className="text-xs text-[#746E68] mt-1">{t.allVitalsAndNodesNormal}</p>
            </div>
          ) : (
            demoAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-2xl border shadow-xs ${
                alert.priority === 'critical' ? 'bg-red-50/60 border-red-200' :
                alert.priority === 'high' ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-[#D9CFC7]'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      alert.priority === 'critical' ? 'bg-red-600 text-white' :
                      alert.priority === 'high' ? 'bg-amber-600 text-white' : 'bg-[#EFE9E3] text-[#403129]'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm text-[#403129]">{alert.title}</h3>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                        }`}>{alert.priority}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          alert.status === 'active' ? 'bg-red-600 text-white' :
                          alert.status === 'in_review' ? 'bg-blue-600 text-white' :
                          alert.status === 'acknowledged' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>{alert.status.replace('_', ' ')}</span>
                        <span className="text-[11px] text-[#746E68]">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#746E68] mt-1 leading-relaxed">{alert.message}</p>
                      {alert.animalName && <div className="mt-2 text-xs font-semibold text-[#8A5B3D]">{t.subjectLabel}: {alert.animalName} ({alert.animalTag})</div>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center text-xs">
                    {alert.status === 'active' && (
                      <button onClick={() => handleDemoAcknowledge(alert.id)} className="px-3 py-1.5 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] rounded-xl font-semibold">{t.acknowledge}</button>
                    )}
                    {alert.status !== 'in_review' && alert.status !== 'resolved' && (
                      <button onClick={() => handleDemoReview(alert.id)} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 rounded-xl font-semibold">{t.reviewBtn}</button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button onClick={() => handleDemoResolve(alert.id)} className="px-3 py-1.5 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-xl font-semibold">{t.resolve}</button>
                    )}
                    {alert.animalId && (
                      <Link to={`/animals/${alert.animalId}`} className="px-3 py-1.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold flex items-center gap-1">
                        <span>{t.viewAnimal}</span><ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
