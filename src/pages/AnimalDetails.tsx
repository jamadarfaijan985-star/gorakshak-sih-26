import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnimal, useSensorHistory, useCurrentRisk, useRiskHistory } from '../hooks/useAnimals';
import { animalService } from '../services/animalService';
import { milkService } from '../services/milkService';
import { cmtService } from '../services/cmtService';
import { healthService } from '../services/healthService';
import { riskApiService } from '../services/riskApiService';
import { RiskBadge } from '../components/RiskBadge';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer';
import { AIHealthSignals } from '../components/AIHealthSignals';
import { env } from '../config/env';
import {
  ArrowLeft, Calendar, Activity, Droplet, Heart, History, Radio, Thermometer,
  ShieldAlert, Clock, Plus, Trash2, Camera, CheckCircle2, AlertTriangle,
  Loader2, RefreshCw, WifiOff,
} from 'lucide-react';

type TabKey = 'overview' | 'live' | 'milk' | 'health' | 'history';

// ─── Risk level → display colours (used in history tab) ──────────────────────
// "no_risk" is labelled "Below Alert Threshold" per PRD §12 — never "No Risk"
const riskColors: Record<string, string> = {
  no_risk: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  low: 'text-blue-700 bg-blue-50 border-blue-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-red-700 bg-red-50 border-red-200',
};

/** Human-readable label for a risk_level value (never says "No Risk") */
function riskLevelLabel(level: string): string {
  const map: Record<string, string> = {
    no_risk: 'Below Alert Threshold',
    low: 'Low Signal',
    moderate: 'Elevated Signal',
    high: 'Strong Signal',
  };
  return map[level] ?? level.replace('_', ' ');
}

// ─── Component ────────────────────────────────────────────────────────────────
export const AnimalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, openModal, showToast } = useApp();
  const { activeFarmId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const isLive = !env.DEMO_MODE && !!activeFarmId;

  // ── Live data ──────────────────────────────────────────────────────────────
  const { data: liveAnimal, isLoading: animalLoading, error: animalError } = useAnimal(
    isLive ? id : undefined,
  );
  const { data: sensorPage, isLoading: sensorLoading, refetch: refetchSensor } = useSensorHistory(
    isLive ? id : undefined, 20,
  );
  const { data: currentRisk, isLoading: riskLoading, refetch: refetchRisk } = useCurrentRisk(
    isLive ? id : undefined,
  );
  const { data: riskHistoryPage } = useRiskHistory(isLive ? id : undefined, 10);

  // ── Demo data ──────────────────────────────────────────────────────────────
  const demoAnimal = !isLive && id ? animalService.getById(id) : undefined;
  const milkRecords = id ? milkService.getByAnimalId(id) : [];
  const cmtRecords = id ? cmtService.getByAnimalId(id) : [];
  const healthRecords = id ? healthService.getByAnimalId(id) : [];

  // ── Compute risk trigger ───────────────────────────────────────────────────
  const [computingRisk, setComputingRisk] = useState(false);
  const handleComputeRisk = async () => {
    if (!id || !isLive) return;
    setComputingRisk(true);
    try {
      await riskApiService.compute({ animal_id: id });
      showToast(t.toastRiskComputed, 'info');
      refetchRisk();
    } catch {
      showToast(t.toastFailedRisk, 'error');
    } finally {
      setComputingRisk(false);
    }
  };

  // ── Routing guards ─────────────────────────────────────────────────────────
  if (isLive && animalLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin" />
      </div>
    );
  }

  if (isLive && animalError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#D9CFC7]">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h2 className="text-base font-bold text-[#403129]">{t.couldNotLoadAnimal}</h2>
        <p className="text-xs text-[#746E68] mt-1 mb-4">{animalError}</p>
        <button onClick={() => navigate('/animals')} className="px-4 py-2 bg-[#8A5B3D] text-white rounded-xl text-xs font-semibold">{t.backToAnimals}</button>
      </div>
    );
  }

  if (!isLive && !demoAnimal) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#D9CFC7]">
        <h2 className="text-base font-bold text-[#403129]">{t.animalNotFound}</h2>
        <p className="text-xs text-[#746E68] mt-1 mb-4">{t.animalNotFoundDesc}</p>
        <button onClick={() => navigate('/animals')} className="px-4 py-2 bg-[#8A5B3D] text-white rounded-xl text-xs font-semibold">{t.returnToHerdList}</button>
      </div>
    );
  }

  const handleDeleteDemo = () => {
    if (!demoAnimal) return;
    if (window.confirm(`Remove ${demoAnimal.name} (${demoAnimal.tag}) from the herd?`)) {
      animalService.delete(demoAnimal.id);
      showToast(`${demoAnimal.name} removed`, 'info');
      navigate('/animals');
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: t.aiHealthSignals, icon: ShieldAlert },
    { key: 'live', label: t.sensorDataTab, icon: Activity },
    { key: 'milk', label: `${t.milkTab} (${milkRecords.length})`, icon: Droplet },
    { key: 'health', label: `${t.healthCmtTab} (${cmtRecords.length + healthRecords.length})`, icon: Heart },
    { key: 'history', label: t.riskHistoryTab, icon: History },
  ];

  return (
    <div id="animal-details-page" className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate('/animals')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#746E68] hover:text-[#403129]">
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToAnimals}</span>
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => openModal('add_cmt', id)} className="px-3 py-1.5 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] text-xs font-semibold rounded-xl">{t.recordCmtBtn}</button>
          <button onClick={() => openModal('add_milk', id)} className="px-3 py-1.5 bg-white border border-[#D9CFC7] hover:bg-[#EFE9E3] text-[#403129] text-xs font-semibold rounded-xl">{t.logMilkBtn}</button>
          <Link to={`/udder-analysis?animalId=${id}`} className="px-3 py-1.5 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-semibold rounded-xl flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" /><span>{t.udderScanBtn}</span>
          </Link>
          {!isLive && demoAnimal && (
            <button onClick={handleDeleteDemo} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Remove animal">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs">
        {isLive && liveAnimal ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#EFE9E3] flex items-center justify-center border-2 border-[#D9CFC7] text-5xl">
                {liveAnimal.species === 'cow' ? '🐄' : '🐃'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#403129]">{liveAnimal.tag_id}</h1>
                  <span className="text-sm text-[#746E68]">{liveAnimal.species === 'cow' ? '🐄 Cow' : '🐃 Buffalo'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#746E68]">
                  <span className="font-mono bg-[#EFE9E3] px-2 py-0.5 rounded font-bold text-[#403129]">{liveAnimal.tag_id}</span>
                  {liveAnimal.breed && <span>• {liveAnimal.breed}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#746E68]">
                  <span>{t.ageLabel}: <strong>{liveAnimal.age_months ? `${Math.floor(liveAnimal.age_months/12)}yr ${liveAnimal.age_months%12}mo` : '—'}</strong></span>
                  <span>{t.lactationLabel}: <strong>#{liveAnimal.lactation_number ?? '—'}</strong></span>
                  <span>{t.statusLabel}: <strong>{liveAnimal.status}</strong></span>
                  <span>{t.mastitisHxLabel}: <strong>{liveAnimal.previous_mastitis == null ? '—' : liveAnimal.previous_mastitis ? t.yesLabel : t.noLabel}</strong></span>
                </div>
              </div>
            </div>
            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EFE9E3]">
              {currentRisk ? (
                <>
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase ${riskColors[currentRisk.risk_level] || ''}`}>
                    {riskLevelLabel(currentRisk.risk_level)}
                    {currentRisk.risk_score_numeric != null && ` — ${(currentRisk.risk_score_numeric * 100).toFixed(0)}/100`}
                  </div>
                  <div className="text-[11px] text-[#746E68] mt-1.5">
                    {currentRisk.is_forecast ? t.forecastLabel : t.currentScreeningSignal} · {currentRisk.model_version}
                  </div>
                </>
              ) : riskLoading ? (
                <Loader2 className="w-5 h-5 text-[#8A5B3D] animate-spin" />
              ) : (
                <button onClick={handleComputeRisk} className="px-3 py-1.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] text-xs font-semibold rounded-xl">
                  {t.computeRiskBtn}
                </button>
              )}
            </div>
          </div>
        ) : demoAnimal ? (
          /* demo header — same as original */
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={demoAnimal.image} alt={demoAnimal.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#D9CFC7] shadow-xs" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#403129]">{demoAnimal.name}</h1>
                  <span className="text-sm font-semibold text-[#746E68]">({demoAnimal.species === 'cow' ? '🐄 Cow' : '🐃 Buffalo'})</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#746E68]">
                  <span className="font-mono bg-[#EFE9E3] px-2 py-0.5 rounded font-bold text-[#403129]">{demoAnimal.tag}</span>
                  <span>• {demoAnimal.breed}</span>
                  <span>• {demoAnimal.farm}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#746E68]">
                  <span>{t.ageLabel}: <strong>{demoAnimal.ageYears} yrs</strong></span>
                  <span>{t.lactationLabel}: <strong>#{demoAnimal.lactationNumber}</strong></span>
                  <span>{t.dimLabel}: <strong>{demoAnimal.daysInMilk} days</strong></span>
                  <span>{t.collarLabel}: <strong>{demoAnimal.collarId || t.notPaired}</strong></span>
                </div>
              </div>
            </div>
            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EFE9E3]">
              <RiskBadge level={demoAnimal.riskLevel} score={demoAnimal.riskScore} size="lg" />
              <span className="text-[11px] text-[#746E68] mt-1.5">Trend: <strong className="uppercase text-[#403129]">{demoAnimal.riskTrend}</strong></span>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-[#EFE9E3] overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.key ? 'bg-[#403129] text-white shadow-xs' : 'text-[#746E68] hover:bg-[#EFE9E3] hover:text-[#403129]'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* ── LIVE mode: AI Health Signals (3 independent models) ─────── */}
          {/* udderResult + behaviorData wired in Phase 3 when endpoints are ready */}
          {isLive && (
            <AIHealthSignals
              riskScore={currentRisk ?? null}
              riskLoading={riskLoading}
              udderResult={null}
              behaviorData={null}
              onComputeRisk={handleComputeRisk}
              computingRisk={computingRisk}
            />
          )}

          {!isLive && demoAnimal && (
            <div className="bg-white border border-[#D9CFC7] rounded-2xl p-5 shadow-xs">
              {/* Demo: wrap in AIHealthSignals heading for visual consistency */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#403129]">{t.aiHealthSignals}</h3>
                  <p className="text-xs text-[#746E68]">Demo screening signal — {demoAnimal.riskScore}/100</p>
                </div>
                <RiskBadge level={demoAnimal.riskLevel} score={demoAnimal.riskScore} />
              </div>

              {/* Model 1 disclaimer — always shown */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{t.model1Disclaimer}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80">
                  <h4 className="font-bold text-xs text-[#8A5B3D] mb-2 uppercase tracking-wide">{t.model1Label} — Contributing Factors:</h4>
                  <ul className="space-y-2 text-xs">
                    {demoAnimal.riskFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#403129]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-[#EFE9E3]/60 border border-[#D9CFC7]/80">
                  <h4 className="font-bold text-xs text-[#403129] mb-2 uppercase tracking-wide">{t.confirmatoryProtocol}:</h4>
                  <ul className="space-y-2 text-xs text-[#403129]">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" /><span>{t.cmtPaddleCheck}</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" /><span>{t.checkRearQuarters}</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" /><span>{t.antisepticDip}</span></li>
                  </ul>
                </div>
              </div>

              {/* Model 2 & 3 pending notice in demo */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7] flex items-center gap-2 text-[#746E68]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span><strong className="text-[#403129]">{t.model2Label}</strong> — {t.signalPending}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7] flex items-center gap-2 text-[#746E68]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span><strong className="text-[#403129]">{t.model3Label}</strong> — {t.signalPending}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#EFE9E3] text-[11px] text-[#746E68]">
                * {t.model1Disclaimer}
              </div>
            </div>
          )}

          {/* Quick stats */}
          {!isLive && demoAnimal && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7]">
                <span className="text-[11px] text-[#746E68]">{t.baselineSkinTempLabel}</span>
                <div className="text-lg font-bold text-[#403129] mt-0.5">{demoAnimal.baselineSurfaceTemp}°C</div>
                <span className="text-[10px] text-[#8A5B3D]">DS18B20 {t.measured}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7]">
                <span className="text-[11px] text-[#746E68]">{t.baselineRuminationLabel}</span>
                <div className="text-lg font-bold text-[#403129] mt-0.5">{demoAnimal.baselineRuminationMinutes} min/d</div>
                <span className="text-[10px] text-[#8A5B3D]">MAX9814 {t.aiInferred}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7]">
                <span className="text-[11px] text-[#746E68]">{t.baselineActivityLabel}</span>
                <div className="text-lg font-bold text-[#403129] mt-0.5">{demoAnimal.baselineActivityScore}/100</div>
                <span className="text-[10px] text-[#8A5B3D]">MPU6050 {t.measured}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7]">
                <span className="text-[11px] text-[#746E68]">{t.avgDailyMilkLabel}</span>
                <div className="text-lg font-bold text-[#403129] mt-0.5">{demoAnimal.avgDailyYieldLiters} L</div>
                <span className="text-[10px] text-[#746E68]">7-day moving avg</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: LIVE SENSORS */}
      {activeTab === 'live' && (
        <div className="bg-white border border-[#D9CFC7] rounded-2xl p-5 shadow-xs space-y-4">
          {isLive ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#403129]">{t.sensorReadingHistory}</h3>
                  <p className="text-xs text-[#746E68]">{t.mostRecentSensorData}</p>
                </div>
                <button onClick={refetchSensor} className="flex items-center gap-1 text-xs text-[#8A5B3D] hover:text-[#403129] font-semibold">
                  <RefreshCw className="w-3.5 h-3.5" /> {t.refreshBtn}
                </button>
              </div>

              {sensorLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-[#8A5B3D] animate-spin" /></div>
              ) : sensorPage && sensorPage.data.length > 0 ? (
                <div className="space-y-3">
                  {sensorPage.data.map((r) => (
                    <div key={r.id} className="p-4 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-[#746E68] font-mono">{new Date(r.recorded_at).toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-[#8A5B3D] bg-[#EFE9E3] px-2 py-0.5 rounded">{r.source}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-[#746E68]">{t.surfaceTemperature}</div>
                          <div className="font-bold text-[#403129]">{r.surface_temp_c != null ? `${r.surface_temp_c}°C` : '—'}</div>
                          <div className="text-[9px] text-[#8A5B3D]">{t.measured} · DS18B20</div>
                        </div>
                        <div>
                          <div className="text-[#746E68]">{t.aiInferredRumination}</div>
                          <div className="font-bold text-[#403129]">{r.rumination_inferred_min != null ? `${r.rumination_inferred_min} min` : '—'}</div>
                          <div className="text-[9px] text-amber-700">{t.aiInferred} · MAX9814</div>
                        </div>
                        <div>
                          <div className="text-[#746E68]">{t.activity}</div>
                          <div className="font-bold text-[#403129]">{r.activity_raw != null ? r.activity_raw.toFixed(1) : '—'}</div>
                          <div className="text-[9px] text-[#8A5B3D]">{t.measured} · MPU6050</div>
                        </div>
                        <div>
                          <div className="text-[#746E68]">{t.barnThi}</div>
                          <div className="font-bold text-[#403129]">{r.thi != null ? r.thi.toFixed(1) : '—'}</div>
                          <div className="text-[9px] text-blue-700">{t.estimated} · SHT31-D</div>
                        </div>
                        {r.ambient_temp_c != null && (
                          <div>
                            <div className="text-[#746E68]">{t.ambientTemp}</div>
                            <div className="font-bold text-[#403129]">{r.ambient_temp_c}°C</div>
                          </div>
                        )}
                        {r.relative_humidity != null && (
                          <div>
                            <div className="text-[#746E68]">{t.humidityLabel}</div>
                            <div className="font-bold text-[#403129]">{r.relative_humidity}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#746E68]">
                  <WifiOff className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  {t.noSensorReadings}
                </div>
              )}
            </>
          ) : demoAnimal ? (
            /* Demo live sensor view */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#403129]">{t.liveIotSensors}</h3>
                  <p className="text-xs text-[#746E68]">{t.collarLabel}: {demoAnimal.collarId || t.unknown} · {demoAnimal.lastUpdated}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />{t.liveTelemetryBadge}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                  <div className="flex items-center justify-between text-[#746E68]"><span>{t.surfaceTemperature}</span><span className="text-[10px] font-bold bg-[#EFE9E3] px-1.5 py-0.5 rounded text-[#403129]">{t.measured}</span></div>
                  <div className="text-2xl font-black text-[#403129] mt-2">{demoAnimal.currentSensors.surfaceTemp}°C</div>
                  <div className="text-[11px] text-[#746E68] mt-1">Sensor: <strong>DS18B20 Collar Probe</strong></div>
                </div>
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                  <div className="flex items-center justify-between text-[#746E68]"><span>{t.aiInferredRumination}</span><span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">{t.aiInferred}</span></div>
                  <div className="text-2xl font-black text-[#403129] mt-2">{demoAnimal.currentSensors.ruminationMinutes} min</div>
                  <div className="text-[11px] text-[#746E68] mt-1">Sensor: <strong>MAX9814 Mic</strong></div>
                </div>
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                  <div className="flex items-center justify-between text-[#746E68]"><span>{t.activity}</span><span className="text-[10px] font-bold bg-[#EFE9E3] px-1.5 py-0.5 rounded text-[#403129]">{t.measured}</span></div>
                  <div className="text-2xl font-black text-[#403129] mt-2">{demoAnimal.currentSensors.activityScore}<span className="text-xs font-normal text-[#746E68]">/100</span></div>
                  <div className="text-[11px] text-[#746E68] mt-1">Sensor: <strong>MPU6050 IMU</strong></div>
                </div>
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                  <div className="flex items-center justify-between text-[#746E68]"><span>{t.barnThi}</span><span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">{t.estimated}</span></div>
                  <div className="text-2xl font-black text-[#403129] mt-2">{demoAnimal.currentSensors.thi}</div>
                  <div className="text-[11px] text-[#746E68] mt-1">{demoAnimal.currentSensors.ambientTemp}°C · {demoAnimal.currentSensors.humidity}% RH</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB: MILK */}
      {activeTab === 'milk' && (
        <div className="bg-white border border-[#D9CFC7] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#403129]">{t.milkingRecordsTitle}</h3>
            <button onClick={() => openModal('add_milk', id)} className="px-3 py-1.5 bg-[#8A5B3D] text-white text-xs font-semibold rounded-xl flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /><span>{t.logMilking}</span>
            </button>
          </div>
          {milkRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EFE9E3] text-[#403129] font-bold border-b border-[#D9CFC7]">
                    <th className="p-2.5">{t.tableDate}</th><th className="p-2.5">{t.tableYield}</th><th className="p-2.5">{t.tableMilkTemp}</th><th className="p-2.5">{t.tableEc}</th><th className="p-2.5">{t.tablePh}</th><th className="p-2.5">{t.tableScc}</th><th className="p-2.5">{t.tableNotes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9E3]">
                  {milkRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F9F8F6]">
                      <td className="p-2.5 font-semibold text-[#403129]">{r.date}</td>
                      <td className="p-2.5 font-bold text-[#8A5B3D]">{r.milkYield} L</td>
                      <td className="p-2.5">{r.milkTemperature}°C</td>
                      <td className="p-2.5">{r.electricalConductivity || '—'}</td>
                      <td className="p-2.5">{r.pH || '—'}</td>
                      <td className="p-2.5"><span className={r.scc && r.scc > 300 ? 'text-red-700 font-bold' : 'text-emerald-700'}>{r.scc || '—'}</span></td>
                      <td className="p-2.5 text-[11px] text-[#746E68] max-w-xs truncate">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#746E68] py-4 text-center">{t.noMilkRecords}</p>
          )}
        </div>
      )}

      {/* TAB: HEALTH & CMT */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#D9CFC7] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#403129]">{t.cmtHistoryTitle}</h3>
              <button onClick={() => openModal('add_cmt', id)} className="px-3 py-1.5 bg-[#8A5B3D] text-white text-xs font-semibold rounded-xl flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /><span>{t.newCmt}</span>
              </button>
            </div>
            {cmtRecords.length > 0 ? (
              <div className="space-y-2.5">
                {cmtRecords.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-[#D9CFC7] bg-[#F9F8F6]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#403129]">{c.date}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">{c.overallResult}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {([['Left Front', c.leftFront], ['Right Front', c.rightFront], ['Left Rear', c.leftRear], ['Right Rear', c.rightRear]] as [string, string][]).map(([label, val]) => (
                        <div key={label} className="p-2 bg-white rounded-lg border border-[#D9CFC7]">
                          <div className="text-[10px] text-[#746E68]">{label}</div>
                          <div className="font-bold text-[#403129] uppercase">{val}</div>
                        </div>
                      ))}
                    </div>
                    {c.notes && <p className="text-[11px] text-[#746E68] mt-2 italic">"{c.notes}" — {c.testerName}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-[#746E68] py-3 text-center">{t.noCmtRecords}</p>}
          </div>

          <div className="bg-white border border-[#D9CFC7] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#403129]">{t.vetNotesTitle}</h3>
              <button onClick={() => openModal('add_health', id)} className="px-3 py-1.5 bg-[#8A5B3D] text-white text-xs font-semibold rounded-xl flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /><span>{t.logTreatmentBtn}</span>
              </button>
            </div>
            {healthRecords.length > 0 ? (
              <div className="space-y-2.5">
                {healthRecords.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-xl border border-[#D9CFC7] bg-[#F9F8F6] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#403129]">{h.condition}</span>
                      <span className="text-[11px] text-[#746E68]">{h.date}</span>
                    </div>
                    <p className="text-[#746E68] mb-1"><strong>{t.observationLabel}:</strong> {h.observation}</p>
                    <p className="text-[#403129]"><strong>{t.treatmentLabel}:</strong> {h.treatment}</p>
                    <div className="pt-2 mt-2 border-t border-[#D9CFC7]/60 flex items-center justify-between text-[11px] text-[#746E68]">
                      <span>{t.vetLabel}: {h.veterinarianName}</span>
                      {h.followUpDate && <span>{t.followUpLabel}: {h.followUpDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-[#746E68] py-3 text-center">{t.noHealthRecords}</p>}
          </div>
        </div>
      )}

      {/* TAB: RISK HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#D9CFC7] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-[#403129]">
            {isLive ? t.riskScoreHistoryTitle : t.screeningEventTimeline}
          </h3>
          {isLive ? (
            riskHistoryPage && riskHistoryPage.data.length > 0 ? (
              <div className="space-y-2.5">
                {riskHistoryPage.data.map((r) => (
                  <div key={r.id} className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${riskColors[r.risk_level] || 'border-[#D9CFC7] bg-[#F9F8F6]'}`}>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="uppercase">{riskLevelLabel(r.risk_level)}</span>
                        {r.risk_score_numeric != null && <span>— {(r.risk_score_numeric * 100).toFixed(0)}/100</span>}
                        {r.is_forecast && <span className="text-amber-700 font-semibold">(Forecast {r.forecast_horizon_days}d)</span>}
                      </div>
                      <p className="text-[11px] mt-0.5">{r.recommended_action}</p>
                      {r.contributing_factors.length > 0 && (
                        <p className="text-[10px] mt-1 opacity-75">{r.contributing_factors.map((cf: any) => cf.factor).join('; ')}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono">{new Date(r.computed_at).toLocaleDateString()}</div>
                      <div className="text-[10px] opacity-75">{r.model_version}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#746E68]">{t.noSignalHistory}</div>
            )
          ) : (
            /* Demo timeline */
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                <Clock className="w-4 h-4 text-[#8A5B3D] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#403129]">{t.earlyRiskScoreLabel} ({t.currentScreeningSignal}: {demoAnimal?.riskScore ?? '—'})</div>
                  <div className="text-[11px] text-[#746E68]">{t.screeningEventTimeline} {demoAnimal?.lastUpdated ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                <Clock className="w-4 h-4 text-[#8A5B3D] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[#403129]">{t.collarAttachedLabel}</div>
                  <div className="text-[11px] text-[#746E68]">DEV-COL-01 calibrated to animal neck acoustics.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
