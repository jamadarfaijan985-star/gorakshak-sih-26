/**
 * LiveMonitoring.tsx
 * Real-time sensor display for GoDrishti.
 *
 * Data flow (live mode):
 *   ESP8266 → MQTT → mqtt_bridge.py → /api/v1/ingest/esp8266 → MongoDB
 *   ← GET /api/v1/animals/{id}/sensor-history (limit=10, merged here)
 *   ← GET /api/v1/animals/{id}/risk
 *
 * Key design decisions:
 *  - fetchMergedLatest(): fetches limit=10 readings and merges them into one
 *    complete record so that even if rumination arrives in a later document
 *    we show a single card with all fields.
 *  - Null checks use `!= null` (not `||`) so valid 0.0 values are displayed.
 *  - Auto-refresh is ON by default (isPolling=true) at 10-second intervals.
 *  - Scientific labels follow hardware reality:
 *      DS18B20  → "Surface Skin Temp" (not core body temp)
 *      MAX4466  → "Acoustic Signal / AI-Inferred Rumination"
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnimalList } from '../hooks/useAnimals';
import { animalApiService } from '../services/animalApiService';
import { riskApiService } from '../services/riskApiService';
import { animalService } from '../services/animalService';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer';
import { RiskBadge } from '../components/RiskBadge';
import { env } from '../config/env';
import { parseBackendDate } from '../utils/date';
import type {
  AnimalResponse,
  SensorReadingResponse,
  RiskScoreResponse,
} from '../types/api';
import type { Animal } from '../types';
import {
  Activity,
  Thermometer,
  Radio,
  RefreshCw,
  Play,
  Pause,
  CloudSun,
  Droplets,
  Mic,
  Zap,
  Loader2,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A merged sensor snapshot combining up to 10 readings into one complete view. */
interface MergedSensor {
  surface_temp_c: number | null;
  ambient_temp_c: number | null;
  relative_humidity: number | null;
  activity_raw: number | null;
  mic_average: number | null;       // from audio_features.mic_average
  rumination_inferred_min: number | null;
  thi: number | null;
  recorded_at: string | null;
  source: string | null;
}

interface AnimalRow {
  animal: AnimalResponse;
  sensor: MergedSensor | null;
  risk: RiskScoreResponse | null;
  loading: boolean;
  error: string | null;
}

type RowMap = Record<string, AnimalRow>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Merge the latest N readings into one complete MergedSensor object.
 * Takes the FIRST non-null value for each field across the array
 * (newest reading first = index 0).
 *
 * This handles the case where the bridge stores the main sensors in one doc
 * and rumination in a second doc — both docs contribute their fields.
 */
function mergeSensorReadings(readings: SensorReadingResponse[]): MergedSensor | null {
  if (readings.length === 0) return null;

  const result: MergedSensor = {
    surface_temp_c: null,
    ambient_temp_c: null,
    relative_humidity: null,
    activity_raw: null,
    mic_average: null,
    rumination_inferred_min: null,
    thi: null,
    recorded_at: readings[0]?.recorded_at ?? null,
    source: readings[0]?.source ?? null,
  };

  for (const r of readings) {
    if (result.surface_temp_c == null && r.surface_temp_c != null)
      result.surface_temp_c = r.surface_temp_c;
    if (result.ambient_temp_c == null && r.ambient_temp_c != null)
      result.ambient_temp_c = r.ambient_temp_c;
    if (result.relative_humidity == null && r.relative_humidity != null)
      result.relative_humidity = r.relative_humidity;
    if (result.activity_raw == null && r.activity_raw != null)
      result.activity_raw = r.activity_raw;
    if (result.thi == null && r.thi != null)
      result.thi = r.thi;
    if (result.rumination_inferred_min == null && r.rumination_inferred_min != null)
      result.rumination_inferred_min = r.rumination_inferred_min;
    if (result.mic_average == null) {
      const af = r.audio_features as Record<string, unknown> | null | undefined;
      const mic = af?.mic_average;
      if (mic != null && typeof mic === 'number') result.mic_average = mic;
    }
    // Use the timestamp of the reading that first provided sensor data
    if (result.recorded_at == null && r.recorded_at != null)
      result.recorded_at = r.recorded_at;
  }

  // Return null if absolutely no sensor value was found at all
  const hasAny =
    result.surface_temp_c != null ||
    result.ambient_temp_c != null ||
    result.activity_raw != null ||
    result.thi != null;
  return hasAny ? result : null;
}

/** Map backend risk_level to a user-friendly display label. */
function riskLabel(level: string | undefined): string {
  switch (level) {
    case 'no_risk':   return 'Below Alert Threshold';
    case 'low':       return 'Low Risk Signal';
    case 'moderate':  return 'Moderate Risk Signal';
    case 'high':      return 'High Risk — Confirm';
    default:          return '—';
  }
}

function riskColor(level: string | undefined): string {
  switch (level) {
    case 'no_risk':   return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'low':       return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'moderate':  return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'high':      return 'text-red-700 bg-red-50 border-red-200';
    default:          return 'text-[#746E68] bg-[#F9F8F6] border-[#D9CFC7]';
  }
}

// ─── SensorField atom ────────────────────────────────────────────────────────

const SensorField: React.FC<{
  label: string;
  value: React.ReactNode;
  unit?: string;
  badge: string;
  badgeColor: string;
  subtext?: string;
}> = ({ label, value, unit, badge, badgeColor, subtext }) => (
  <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80 flex flex-col gap-1">
    <div className="flex items-center justify-between text-[#746E68] text-[10px]">
      <span className="font-semibold truncate pr-1">{label}</span>
      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] shrink-0 ${badgeColor}`}>
        {badge}
      </span>
    </div>
    <div className="text-lg font-black text-[#403129] leading-tight">
      {value != null ? (
        <>
          {typeof value === 'number' ? (
            Number.isInteger(value) ? value : value.toFixed(2)
          ) : value}
          {unit && <span className="text-sm font-semibold text-[#746E68] ml-0.5">{unit}</span>}
        </>
      ) : (
        <span className="text-[#D9CFC7] font-bold">—</span>
      )}
    </div>
    {subtext && <div className="text-[9px] text-[#746E68]">{subtext}</div>}
  </div>
);

// ─── LiveSensorCard ──────────────────────────────────────────────────────────

const LiveSensorCard: React.FC<{
  row: AnimalRow;
}> = ({ row }) => {
  const { animal, sensor, risk, loading, error } = row;
  const { t } = useApp();

  const measured  = `${t.measured}`;
  const inferred  = `${t.aiInferred}`;
  const estimated = `${t.estimated}`;

  return (
    <div className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 hover:border-[#8A5B3D] transition-all">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EFE9E3] flex items-center justify-center text-2xl border border-[#D9CFC7]">
            {animal.species === 'cow' ? '🐄' : '🐃'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-[#403129]">{animal.tag_id}</h3>
              <span className="text-xs">{animal.species === 'cow' ? '🐄' : '🐃'}</span>
            </div>
            <p className="text-[11px] text-[#746E68]">
              {animal.breed ?? '—'} · {t.statusLabel}:{' '}
              <strong>{animal.status}</strong>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 space-y-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            animal.status === 'active'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {animal.status}
          </span>
          {sensor?.recorded_at && (
            <div className="text-[10px] text-[#746E68] font-mono">
              {parseBackendDate(sensor.recorded_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading / error state */}
      {loading && (
        <div className="flex items-center justify-center py-4 gap-2 text-xs text-[#746E68]">
          <Loader2 className="w-4 h-4 animate-spin text-[#8A5B3D]" />
          <span>Loading sensor data…</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-xl p-3 border border-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Unable to load sensor data: {error}</span>
        </div>
      )}

      {/* Sensor grid — 8 fields */}
      {!loading && !error && sensor && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* 1. Surface Skin Temperature — DS18B20 */}
          <SensorField
            label={t.surfaceTemperature}
            value={sensor.surface_temp_c}
            unit="°C"
            badge={measured}
            badgeColor="bg-[#EFE9E3] text-[#403129]"
            subtext="DS18B20 Collar Probe"
          />

          {/* 2. Ambient Temperature — DHT11 */}
          <SensorField
            label={t.ambientTemperature}
            value={sensor.ambient_temp_c}
            unit="°C"
            badge={measured}
            badgeColor="bg-[#EFE9E3] text-[#403129]"
            subtext="DHT11 Ambient"
          />

          {/* 3. Humidity — DHT11 */}
          <SensorField
            label={t.humidity}
            value={sensor.relative_humidity}
            unit="%"
            badge={measured}
            badgeColor="bg-[#EFE9E3] text-[#403129]"
            subtext="DHT11 Relative Humidity"
          />

          {/* 4. Activity — MPU6500 */}
          <SensorField
            label={t.activityRawLabel}
            value={sensor.activity_raw}
            badge={measured}
            badgeColor="bg-[#EFE9E3] text-[#403129]"
            subtext="MPU6500 Accelerometer"
          />

          {/* 5. Acoustic Signal — MAX4466 */}
          <SensorField
            label="Acoustic Signal"
            value={sensor.mic_average}
            badge={measured}
            badgeColor="bg-[#EFE9E3] text-[#403129]"
            subtext="MAX4466 Chewing Mic"
          />

          {/* 6. AI-Inferred Rumination — acoustic proxy */}
          <SensorField
            label={t.aiInferredRumination}
            value={sensor.rumination_inferred_min}
            unit=" min"
            badge={inferred}
            badgeColor="bg-amber-100 text-amber-900"
            subtext="Acoustic inference proxy"
          />

          {/* 7. THI — computed backend */}
          <SensorField
            label={t.thi}
            value={sensor.thi}
            badge={estimated}
            badgeColor="bg-blue-100 text-blue-900"
            subtext={
              sensor.ambient_temp_c != null && sensor.relative_humidity != null
                ? `${sensor.ambient_temp_c}°C · ${sensor.relative_humidity}% RH`
                : 'NRC formula'
            }
          />

          {/* 8. Risk level — backend ML engine */}
          <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#746E68] text-[10px]">
              <span className="font-semibold">Risk Signal</span>
              <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-purple-100 text-purple-900">
                ML Model
              </span>
            </div>
            {risk ? (
              <>
                <div className={`text-xs font-black px-2 py-1 rounded-lg border ${riskColor(risk.risk_level)}`}>
                  {riskLabel(risk.risk_level)}
                </div>
                <div className="text-[9px] text-[#746E68]">{risk.model_version}</div>
              </>
            ) : (
              <div className="text-[#D9CFC7] font-bold text-lg">—</div>
            )}
          </div>
        </div>
      )}

      {/* No data state */}
      {!loading && !error && !sensor && (
        <div className="text-center text-[11px] text-[#746E68] py-3 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7]">
          {t.noSensorDataAnimal}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[#EFE9E3] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#746E68] truncate">
          {sensor
            ? `${t.sourceLabel}: ${sensor.source ?? '—'}`
            : t.awaitingData}
        </span>
        <Link
          to={`/animals/${animal.id}`}
          className="font-bold text-[#8A5B3D] hover:underline shrink-0 ml-2"
        >
          {t.historicalGraphsLink}
        </Link>
      </div>
    </div>
  );
};

// ─── LiveMonitoring page ──────────────────────────────────────────────────────

export const LiveMonitoring: React.FC = () => {
  const { speciesFilter, t } = useApp();
  const { activeFarmId } = useAuth();

  const isLive = !env.DEMO_MODE && !!activeFarmId;
  const isDemo = env.DEMO_MODE;

  // ── Animal list (live) ────────────────────────────────────────────────────
  const {
    data: apiPage,
    isLoading: animalsLoading,
    refetch: refetchAnimals,
  } = useAnimalList(
    isLive
      ? {
          farm_id: activeFarmId!,
          limit: 100,
          species: speciesFilter !== 'all' ? speciesFilter : undefined,
        }
      : undefined,
  );

  const liveAnimals = apiPage?.data ?? [];

  // ── Per-animal sensor + risk rows ─────────────────────────────────────────
  const [rows, setRows] = useState<RowMap>({});

  /**
   * Fetch latest 10 sensor readings for an animal, merge them, and fetch the
   * current risk score. Updates only that animal's entry in the rows map.
   */
  const fetchRow = useCallback(async (animal: AnimalResponse) => {
    // Mark as loading
    setRows((prev) => ({
      ...prev,
      [animal.id]: { animal, sensor: prev[animal.id]?.sensor ?? null, risk: prev[animal.id]?.risk ?? null, loading: true, error: null },
    }));
    try {
      // Fetch more readings so we can merge across any split docs
      const [sensorPage, riskScore] = await Promise.allSettled([
        animalApiService.getSensorHistory(animal.id, 0, 10),
        animalApiService.getCurrentRisk(animal.id),
      ]);

      const merged = sensorPage.status === 'fulfilled'
        ? mergeSensorReadings(sensorPage.value.data)
        : null;

      const risk = riskScore.status === 'fulfilled' ? riskScore.value : null;

      const sensorError = sensorPage.status === 'rejected'
        ? String((sensorPage.reason as Error)?.message ?? sensorPage.reason)
        : null;

      setRows((prev) => ({
        ...prev,
        [animal.id]: { animal, sensor: merged, risk, loading: false, error: sensorError },
      }));
    } catch (err) {
      setRows((prev) => ({
        ...prev,
        [animal.id]: { animal, sensor: null, risk: null, loading: false, error: String(err) },
      }));
    }
  }, []);

  /**
   * Refresh all visible animals in parallel (max 20 at once).
   */
  const fetchAllRows = useCallback(async () => {
    if (!isLive || liveAnimals.length === 0) return;
    await Promise.allSettled(
      liveAnimals.slice(0, 20).map((a) => fetchRow(a)),
    );
  }, [isLive, liveAnimals, fetchRow]);

  // Initial load when animal list arrives
  useEffect(() => {
    fetchAllRows();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveAnimals.length, isLive]);

  // ── Auto-refresh — ON by default, 10 s interval ───────────────────────────
  const [isPolling, setIsPolling] = useState(true);
  const [lastTick, setLastTick] = useState(() => new Date().toLocaleTimeString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!isPolling || !isLive) return;
    intervalRef.current = setInterval(() => {
      fetchAllRows();
      setLastTick(new Date().toLocaleTimeString());
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPolling, isLive, fetchAllRows]);

  const handleManualRefresh = useCallback(() => {
    fetchAllRows();
    refetchAnimals();
    setLastTick(new Date().toLocaleTimeString());
  }, [fetchAllRows, refetchAnimals]);

  // ── Demo mode state (unchanged) ───────────────────────────────────────────
  const [demoAnimals, setDemoAnimals] = useState<Animal[]>([]);
  const [isDemoLive, setIsDemoLive] = useState(true);
  const [demoTick, setDemoTick] = useState(() => new Date().toLocaleTimeString());
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('all');

  useEffect(() => {
    if (isLive) return;
    let list = animalService.getAll();
    if (speciesFilter !== 'all') list = list.filter((a) => a.species === speciesFilter);
    setDemoAnimals(list);
  }, [speciesFilter, isLive]);

  useEffect(() => {
    if (isLive || !isDemoLive) return;
    const interval = setInterval(() => {
      setDemoAnimals((prev) =>
        prev.map((a) => ({
          ...a,
          currentSensors: {
            ...a.currentSensors,
            surfaceTemp: Number(
              (a.currentSensors.surfaceTemp + (Math.random() - 0.5) * 0.1).toFixed(1),
            ),
            activityScore: Math.max(
              10,
              Math.min(100, a.currentSensors.activityScore + Math.floor((Math.random() - 0.5) * 4)),
            ),
            timestamp: 'Just now',
          },
        })),
      );
      setDemoTick(new Date().toLocaleTimeString());
    }, 3500);
    return () => clearInterval(interval);
  }, [isDemoLive, isLive]);

  const filteredDemoAnimals =
    selectedAnimalId === 'all'
      ? demoAnimals
      : demoAnimals.filter((a) => a.id === selectedAnimalId);

  const anyLoading = (Object.values(rows) as AnimalRow[]).some((r) => r.loading);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div id="live-monitoring-page" className="space-y-5">

      {/* Top banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#403129]">{t.liveMonitoring}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {isLive ? t.backendConnectedBadge : isDemo ? t.bleMeshBadge : 'Backend unavailable'}
            </span>
          </div>
          <p className="text-xs text-[#746E68]">
            {isLive ? t.monitoringSubtitleLive : isDemo ? t.monitoringSubtitleDemo : 'Waiting for live sensor data'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isLive ? (
            <>
              <button
                onClick={() => setIsPolling((p) => !p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                  isPolling
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isPolling ? (
                  <><Pause className="w-3.5 h-3.5" /><span>{t.stopAutoRefresh}</span></>
                ) : (
                  <><Play className="w-3.5 h-3.5" /><span>{t.startAutoRefresh}</span></>
                )}
              </button>
              <button
                onClick={handleManualRefresh}
                className="p-1.5 rounded-xl bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129]"
                title="Refresh now"
              >
                <RefreshCw className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-[11px] text-[#746E68] font-mono hidden sm:inline">
                {t.updatedAtLabel}: {lastTick}
              </span>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsDemoLive((v) => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                  isDemoLive
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isDemoLive ? (
                  <><Pause className="w-3.5 h-3.5" /><span>{t.pauseTelemetry}</span></>
                ) : (
                  <><Play className="w-3.5 h-3.5" /><span>{t.resumeStream}</span></>
                )}
              </button>
              <span className="text-[11px] text-[#746E68] font-mono">{t.tickLabel}: {demoTick}</span>
            </>
          )}
        </div>
      </div>

      <ScientificDisclaimer compact />

      {/* No farm warning */}
      {!env.DEMO_MODE && !activeFarmId && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.noFarmWarningMonitoring}</span>
        </div>
      )}

      {/* Field legend + optional filter */}
      <div className="bg-[#EFE9E3]/70 p-3 rounded-xl border border-[#D9CFC7] flex flex-wrap items-center justify-between gap-2 text-xs">
        {isDemo && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#403129]">{t.filterAnimalLabel}:</span>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#D9CFC7] rounded-lg text-xs font-medium text-[#403129]"
            >
              <option value="all">{t.allLivestockOption} ({demoAnimals.length})</option>
              {demoAnimals.map((a) => (
                <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px] ml-auto">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8A5B3D]" />{t.legendMeasured}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />{t.legendAiInferred}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />{t.legendEstimated}
          </span>
          {isLive && isPolling && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live · 10s
            </span>
          )}
        </div>
      </div>

      {/* ── LIVE mode ─────────────────────────────────────────────────────── */}
      {isLive && (
        <>
          {animalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin" />
            </div>
          ) : liveAnimals.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl text-xs text-[#746E68]">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {t.noAnimalsForFarm}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveAnimals.map((a) => {
                const row: AnimalRow = rows[a.id] ?? {
                  animal: a,
                  sensor: null,
                  risk: null,
                  loading: true,
                  error: null,
                };
                return <LiveSensorCard key={a.id} row={row} />;
              })}
            </div>
          )}
        </>
      )}

      {/* ── DEMO mode (unchanged) ────────────────────────────────────────── */}
      {isDemo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDemoAnimals.map((animal) => (
            <div
              key={animal.id}
              className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={animal.image}
                    alt={animal.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#D9CFC7]"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-[#403129]">{animal.name}</h3>
                    <p className="text-[11px] text-[#746E68]">
                      {animal.tag} • {animal.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`}
                    </p>
                  </div>
                </div>
                <RiskBadge level={animal.riskLevel} score={animal.riskScore} size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.surfaceTemperature}</div>
                  <div className="font-black text-[#403129] mt-1">
                    {animal.currentSensors.surfaceTemp}°C
                  </div>
                  <div className="text-[9px] text-[#8A5B3D]">{t.measured}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.aiInferredRumination}</div>
                  <div className="font-black text-[#403129] mt-1">
                    {animal.currentSensors.ruminationMinutes} min
                  </div>
                  <div className="text-[9px] text-amber-700">{t.aiInferred}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.activity}</div>
                  <div className="font-black text-[#403129] mt-1">
                    {animal.currentSensors.activityScore}/100
                  </div>
                  <div className="text-[9px] text-[#8A5B3D]">{t.measured}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.thi}</div>
                  <div className="font-black text-[#403129] mt-1">
                    {animal.currentSensors.thi}
                  </div>
                  <div className="text-[9px] text-blue-700">{t.estimated}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EFE9E3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-[#746E68]">
                  <span>{t.ambientTemperature}: {animal.currentSensors.ambientTemp}°C</span>
                  <span>{t.humidity}: {animal.currentSensors.humidity}%</span>
                </div>
                <Link
                  to={`/animals/${animal.id}`}
                  className="font-bold text-[#8A5B3D] hover:underline text-xs"
                >
                  {t.historicalGraphsLink}
                </Link>
              </div>
            </div>
          ))}
          {filteredDemoAnimals.length === 0 && (
            <div className="col-span-2 p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl text-xs text-[#746E68]">
              {t.noAnimalsFoundFilter}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
