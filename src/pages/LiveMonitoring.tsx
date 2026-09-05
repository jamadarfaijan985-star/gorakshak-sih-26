import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnimalList } from '../hooks/useAnimals';
import { animalApiService } from '../services/animalApiService';
import { animalService } from '../services/animalService';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer';
import { RiskBadge } from '../components/RiskBadge';
import { env } from '../config/env';
import type { AnimalResponse, SensorReadingResponse } from '../types/api';
import type { Animal } from '../types';
import {
  Activity, Thermometer, Radio, RefreshCw, Clock, Play, Pause,
  CloudSun, ShieldCheck, AlertTriangle, Zap, Loader2, WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type LatestSensorMap = Record<string, SensorReadingResponse | undefined>;

const LiveSensorCard: React.FC<{ animal: AnimalResponse; sensor?: SensorReadingResponse }> = ({
  animal,
  sensor,
}) => {
  const { t } = useApp();
  return (
    <div className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-[#8A5B3D] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#EFE9E3] flex items-center justify-center text-3xl border border-[#D9CFC7]">
            {animal.species === 'cow' ? '🐄' : '🐃'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-[#403129]">{animal.tag_id}</h3>
              <span className="text-xs">{animal.species === 'cow' ? '🐄' : '🐃'}</span>
            </div>
            <p className="text-[11px] text-[#746E68]">
              {animal.breed || '—'} · {t.statusLabel}: <strong>{animal.status}</strong>
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            animal.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
          }`}>{animal.status}</span>
          {sensor && (
            <div className="text-[10px] text-[#746E68] mt-1 font-mono">
              {new Date(sensor.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80">
          <div className="flex items-center justify-between text-[#746E68] text-[10px]">
            <span className="font-semibold">{t.surfaceTemperature}</span>
            <span className="px-1 py-0.5 bg-[#EFE9E3] text-[#403129] rounded font-bold">{t.measured}</span>
          </div>
          <div className="text-xl font-black text-[#403129] mt-1">
            {sensor?.surface_temp_c != null ? `${sensor.surface_temp_c}°C` : '—'}
          </div>
          <div className="text-[9px] text-[#746E68] mt-0.5">DS18B20 Collar Probe</div>
        </div>

        <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80">
          <div className="flex items-center justify-between text-[#746E68] text-[10px]">
            <span className="font-semibold">{t.aiInferredRumination}</span>
            <span className="px-1 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">{t.aiInferred}</span>
          </div>
          <div className="text-xl font-black text-[#403129] mt-1">
            {sensor?.rumination_inferred_min != null ? `${sensor.rumination_inferred_min} min` : '—'}
          </div>
          <div className="text-[9px] text-[#746E68] mt-0.5">MAX9814 Chewing Mic</div>
        </div>

        <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80">
          <div className="flex items-center justify-between text-[#746E68] text-[10px]">
            <span className="font-semibold">{t.activityRawLabel}</span>
            <span className="px-1 py-0.5 bg-[#EFE9E3] text-[#403129] rounded font-bold">{t.measured}</span>
          </div>
          <div className="text-xl font-black text-[#403129] mt-1">
            {sensor?.activity_raw != null ? sensor.activity_raw.toFixed(1) : '—'}
          </div>
          <div className="text-[9px] text-[#746E68] mt-0.5">MPU6050 Accelerometer</div>
        </div>

        <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]/80">
          <div className="flex items-center justify-between text-[#746E68] text-[10px]">
            <span className="font-semibold">{t.thi}</span>
            <span className="px-1 py-0.5 bg-blue-100 text-blue-900 rounded font-bold">{t.estimated}</span>
          </div>
          <div className="text-xl font-black text-[#403129] mt-1">
            {sensor?.thi != null ? sensor.thi.toFixed(1) : '—'}
          </div>
          <div className="text-[9px] text-[#746E68] mt-0.5">
            {sensor?.ambient_temp_c != null ? `${sensor.ambient_temp_c}°C` : '—'} ·{' '}
            {sensor?.relative_humidity != null ? `${sensor.relative_humidity}%` : '—'} RH · SHT31-D
          </div>
        </div>
      </div>

      {!sensor && (
        <div className="text-center text-[11px] text-[#746E68] py-2 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7]">
          {t.noSensorDataAnimal}
        </div>
      )}

      <div className="pt-2 border-t border-[#EFE9E3] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#746E68]">{sensor ? `${t.sourceLabel}: ${sensor.source}` : t.awaitingData}</span>
        <Link to={`/animals/${animal.id}`} className="font-bold text-[#8A5B3D] hover:underline">
          {t.historicalGraphsLink}
        </Link>
      </div>
    </div>
  );
};

export const LiveMonitoring: React.FC = () => {
  const { speciesFilter, t } = useApp();
  const { activeFarmId } = useAuth();

  const isLive = !env.DEMO_MODE && !!activeFarmId;

  const { data: apiPage, isLoading: animalsLoading, refetch: refetchAnimals } = useAnimalList(
    isLive ? { farm_id: activeFarmId!, limit: 100, species: speciesFilter !== 'all' ? speciesFilter : undefined } : undefined,
  );

  const liveAnimals = apiPage?.data ?? [];

  const [latestSensors, setLatestSensors] = useState<LatestSensorMap>({});
  const [loadingSensors, setLoadingSensors] = useState(false);

  const fetchLatestSensors = useCallback(async () => {
    if (!isLive || liveAnimals.length === 0) return;
    setLoadingSensors(true);
    const map: LatestSensorMap = {};
    await Promise.allSettled(
      liveAnimals.slice(0, 20).map(async (a) => {
        try {
          const page = await animalApiService.getSensorHistory(a.id, 0, 1);
          map[a.id] = page.data[0];
        } catch {
          map[a.id] = undefined;
        }
      }),
    );
    setLatestSensors(map);
    setLoadingSensors(false);
  }, [isLive, liveAnimals]);

  useEffect(() => { fetchLatestSensors(); }, [fetchLatestSensors]);

  const [lastTick, setLastTick] = useState(new Date().toLocaleTimeString());
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!isPolling || !isLive) return;
    const id = setInterval(() => {
      fetchLatestSensors();
      setLastTick(new Date().toLocaleTimeString());
    }, 30_000);
    return () => clearInterval(id);
  }, [isPolling, isLive, fetchLatestSensors]);

  const [demoAnimals, setDemoAnimals] = useState<Animal[]>([]);
  const [isDemoLive, setIsDemoLive] = useState(true);
  const [demoTick, setDemoTick] = useState(new Date().toLocaleTimeString());
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
            surfaceTemp: Number((a.currentSensors.surfaceTemp + (Math.random() - 0.5) * 0.1).toFixed(1)),
            activityScore: Math.max(10, Math.min(100, a.currentSensors.activityScore + Math.floor((Math.random() - 0.5) * 4))),
            timestamp: 'Just now',
          },
        })),
      );
      setDemoTick(new Date().toLocaleTimeString());
    }, 3500);
    return () => clearInterval(interval);
  }, [isDemoLive, isLive]);

  const filteredDemoAnimals =
    selectedAnimalId === 'all' ? demoAnimals : demoAnimals.filter((a) => a.id === selectedAnimalId);

  return (
    <div id="live-monitoring-page" className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#403129]">{t.liveMonitoring}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {isLive ? t.backendConnectedBadge : t.bleMeshBadge}
            </span>
          </div>
          <p className="text-xs text-[#746E68]">
            {isLive ? t.monitoringSubtitleLive : t.monitoringSubtitleDemo}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isLive ? (
            <>
              <button
                onClick={() => setIsPolling(!isPolling)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                  isPolling ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isPolling ? <><Pause className="w-3.5 h-3.5" /><span>{t.stopAutoRefresh}</span></> : <><Play className="w-3.5 h-3.5" /><span>{t.startAutoRefresh}</span></>}
              </button>
              <button onClick={() => { fetchLatestSensors(); refetchAnimals(); setLastTick(new Date().toLocaleTimeString()); }} className="p-1.5 rounded-xl bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129]">
                <RefreshCw className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-[#746E68] font-mono">{t.updatedAtLabel}: {lastTick}</span>
            </>
          ) : (
            <>
              <button onClick={() => setIsDemoLive(!isDemoLive)} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${isDemoLive ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                {isDemoLive ? <><Pause className="w-3.5 h-3.5" /><span>{t.pauseTelemetry}</span></> : <><Play className="w-3.5 h-3.5" /><span>{t.resumeStream}</span></>}
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

      {/* Sensor Legend */}
      <div className="bg-[#EFE9E3]/70 p-3 rounded-xl border border-[#D9CFC7] flex flex-wrap items-center justify-between gap-2 text-xs">
        {!isLive && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#403129]">{t.filterAnimalLabel}:</span>
            <select value={selectedAnimalId} onChange={(e) => setSelectedAnimalId(e.target.value)} className="px-2.5 py-1 bg-white border border-[#D9CFC7] rounded-lg text-xs font-medium text-[#403129]">
              <option value="all">{t.allLivestockOption} ({demoAnimals.length})</option>
              {demoAnimals.map((a) => <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px] ml-auto">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#8A5B3D]" />{t.legendMeasured}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" />{t.legendAiInferred}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />{t.legendEstimated}</span>
        </div>
      </div>

      {/* LIVE mode grid */}
      {isLive && (
        <>
          {animalsLoading || loadingSensors ? (
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
              {liveAnimals.map((a) => (
                <LiveSensorCard key={a.id} animal={a} sensor={latestSensors[a.id]} />
              ))}
            </div>
          )}
        </>
      )}

      {/* DEMO mode */}
      {!isLive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDemoAnimals.map((animal) => (
            <div key={animal.id} className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={animal.image} alt={animal.name} className="w-12 h-12 rounded-xl object-cover border border-[#D9CFC7]" />
                  <div>
                    <h3 className="font-extrabold text-sm text-[#403129]">{animal.name}</h3>
                    <p className="text-[11px] text-[#746E68]">{animal.tag} • {animal.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`}</p>
                  </div>
                </div>
                <RiskBadge level={animal.riskLevel} score={animal.riskScore} size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.surfaceTemperature}</div>
                  <div className="font-black text-[#403129] mt-1">{animal.currentSensors.surfaceTemp}°C</div>
                  <div className="text-[9px] text-[#8A5B3D]">{t.measured}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.aiInferredRumination}</div>
                  <div className="font-black text-[#403129] mt-1">{animal.currentSensors.ruminationMinutes} min</div>
                  <div className="text-[9px] text-amber-700">{t.aiInferred}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.activity}</div>
                  <div className="font-black text-[#403129] mt-1">{animal.currentSensors.activityScore}/100</div>
                  <div className="text-[9px] text-[#8A5B3D]">{t.measured}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-center">
                  <div className="text-[10px] text-[#746E68]">{t.thi}</div>
                  <div className="font-black text-[#403129] mt-1">{animal.currentSensors.thi}</div>
                  <div className="text-[9px] text-blue-700">{t.estimated}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EFE9E3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-[#746E68]">
                  <span>{t.ambientTemperature}: {animal.currentSensors.ambientTemp}°C</span>
                  <span>{t.humidity}: {animal.currentSensors.humidity}%</span>
                </div>
                <Link to={`/animals/${animal.id}`} className="font-bold text-[#8A5B3D] hover:underline text-xs">
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
