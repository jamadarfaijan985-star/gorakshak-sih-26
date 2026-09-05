import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnimalList } from '../hooks/useAnimals';
import { animalApiService } from '../services/animalApiService';
import { animalService } from '../services/animalService';
import { RiskBadge } from '../components/RiskBadge';
import { env } from '../config/env';
import type { AnimalResponse } from '../types/api';
import type { Species, RiskLevel, HealthStatus } from '../types';
import {
  Search, Filter, Grid, List, Plus, ArrowRight, PawPrint,
  Loader2, RefreshCw, AlertCircle, WifiOff,
} from 'lucide-react';

// ─── Skeleton row ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-[#D9CFC7] overflow-hidden shadow-xs animate-pulse">
    <div className="h-36 bg-[#EFE9E3]" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-[#EFE9E3] rounded w-1/2" />
      <div className="h-3 bg-[#EFE9E3] rounded w-3/4" />
      <div className="h-3 bg-[#EFE9E3] rounded w-2/3" />
    </div>
  </div>
);

// ─── Live animal card ─────────────────────────────────────────────────────────
const LiveAnimalCard: React.FC<{ animal: AnimalResponse }> = ({ animal }) => {
  const { t } = useApp();
  return (
    <div className="bg-white rounded-2xl border border-[#D9CFC7] overflow-hidden shadow-xs hover:border-[#8A5B3D] transition-all flex flex-col">
      <div className="relative h-24 bg-gradient-to-br from-[#EFE9E3] to-[#D9CFC7] flex items-center justify-center">
        <span className="text-5xl">{animal.species === 'cow' ? '🐄' : '🐃'}</span>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">{animal.tag_id}</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            animal.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
          }`}>{animal.status}</span>
        </div>
      </div>
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#403129]">{animal.tag_id}</h3>
            <span className="text-xs text-[#746E68]">{animal.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`}</span>
          </div>
          <p className="text-[11px] text-[#746E68]">{animal.breed || t.breedNotSpecified}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#746E68] bg-[#F9F8F6] p-2 rounded-xl border border-[#D9CFC7]/50 mt-2">
            <div>{t.ageLabel}: <strong>{animal.age_months ? `${Math.floor(animal.age_months / 12)}yr ${animal.age_months % 12}mo` : '—'}</strong></div>
            <div>{t.lactationLabel}: <strong>#{animal.lactation_number ?? '—'}</strong></div>
            <div>{t.statusLabel}: <strong>{animal.status}</strong></div>
            <div>{t.mastitisHxLabel}: <strong>{animal.previous_mastitis == null ? '—' : animal.previous_mastitis ? t.yesLabel : t.noLabel}</strong></div>
          </div>
          {animal.comorbidities && animal.comorbidities.length > 0 && (
            <div className="text-[11px] mt-1.5">
              <span className="text-[#8A5B3D] font-semibold">Comorbidities: </span>
              <span className="text-[#403129]">{animal.comorbidities.join(', ')}</span>
            </div>
          )}
        </div>
        <div className="pt-2.5 border-t border-[#D9CFC7]/60 flex items-center justify-between text-xs">
          <span className="text-[10px] text-[#746E68]">ID: {animal.id.slice(0, 8)}…</span>
          <Link to={`/animals/${animal.id}`} className="font-bold text-[#8A5B3D] hover:text-[#403129] flex items-center gap-1">
            <span>{t.profileAndRisk}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export const Animals: React.FC = () => {
  const { t, speciesFilter, setSpeciesFilter, openModal } = useApp();
  const { activeFarmId } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isLive = !env.DEMO_MODE && !!activeFarmId;

  // ── Live data ──────────────────────────────────────────────────────────────
  const { data: apiPage, isLoading, error, refetch } = useAnimalList(
    isLive
      ? {
          farm_id: activeFarmId!,
          limit: 200,
          species: speciesFilter !== 'all' ? speciesFilter : undefined,
          risk_level: selectedRisk !== 'all' ? selectedRisk : undefined,
        }
      : undefined,
  );

  // ── Demo data ──────────────────────────────────────────────────────────────
  const demoAnimals = useMemo(() => {
    if (isLive) return [];
    return animalService.filter({
      species: speciesFilter,
      riskLevel: selectedRisk,
      searchQuery,
      sortBy: 'risk_desc',
    });
  }, [isLive, speciesFilter, selectedRisk, searchQuery]);

  // ── Filter live animals client-side by search ──────────────────────────────
  const liveAnimals = useMemo(() => {
    const all = apiPage?.data ?? [];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (a) =>
        a.tag_id.toLowerCase().includes(q) ||
        (a.breed ?? '').toLowerCase().includes(q) ||
        a.species.toLowerCase().includes(q),
    );
  }, [apiPage, searchQuery]);

  const displayAnimals = isLive ? liveAnimals : demoAnimals;
  const total = isLive ? (apiPage?.meta.total ?? 0) : demoAnimals.length;

  return (
    <div id="animals-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#403129] tracking-tight">{t.animals}</h1>
          <p className="text-xs text-[#746E68]">
            {isLive
              ? `Farm: ${activeFarmId?.slice(0, 8)}… — ${t.liveBackendDesc}`
              : t.herdRegistryDesc}
          </p>
        </div>
        <button
          onClick={() => openModal('add_animal')}
          className="self-start sm:self-auto px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addAnimal}</span>
        </button>
      </div>

      {/* Demo badge */}
      {env.DEMO_MODE && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          <span className="font-bold px-2 py-0.5 bg-amber-200 rounded text-amber-900">{t.demoDataLabel}</span>
          <span>Set <code className="font-mono bg-amber-100 px-1 rounded">VITE_DEMO_MODE=false</code> {t.liveBackendDesc}.</span>
        </div>
      )}

      {/* No farm warning */}
      {!env.DEMO_MODE && !activeFarmId && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.noFarmWarningAnimals}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={refetch} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-semibold flex items-center gap-1 shrink-0">
            <RefreshCw className="w-3 h-3" /> {t.retryBtn}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#746E68]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchTagBreedPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-xs outline-none focus:border-[#8A5B3D]"
            />
          </div>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-xs font-semibold text-[#403129]"
          >
            <option value="all">{t.allSpecies}</option>
            <option value="cow">{t.allSpeciesCowsOnly}</option>
            <option value="buffalo">{t.allSpeciesBuffaloOnly}</option>
          </select>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-xs font-semibold text-[#403129]"
          >
            <option value="all">{t.allRiskLevels}</option>
            <option value="high">{t.highRisk}</option>
            <option value="moderate">{t.moderateRisk}</option>
            <option value="low">{t.lowRisk}</option>
            <option value="no_risk">{t.noRisk}</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#EFE9E3] text-xs">
          <div className="flex items-center gap-2">
            {isLive && (
              <button onClick={refetch} className="flex items-center gap-1 text-[#746E68] hover:text-[#403129] font-medium">
                <RefreshCw className="w-3.5 h-3.5" /> {t.refreshLabel}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#746E68]">
              {t.showingAnimals} <strong>{displayAnimals.length}</strong>
              {isLive && ` ${t.ofLabel} ${total}`}
            </span>
            <div className="flex items-center bg-[#EFE9E3] p-1 rounded-lg border border-[#D9CFC7]">
              <button onClick={() => setViewMode('grid')} className={`p-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-[#403129] shadow-xs' : 'text-[#746E68]'}`} title="Grid">
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-1 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-[#403129] shadow-xs' : 'text-[#746E68]'}`} title="Table">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Live mode grid */}
      {!isLoading && isLive && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveAnimals.map((a) => <LiveAnimalCard key={a.id} animal={a} />)}
        </div>
      )}

      {/* Live mode table */}
      {!isLoading && isLive && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#D9CFC7] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EFE9E3] text-[#403129] font-bold border-b border-[#D9CFC7]">
                  <th className="p-3">{t.tagIdLabel}</th>
                  <th className="p-3">{t.speciesLabel} / {t.breedLabel}</th>
                  <th className="p-3">{t.ageLabel}</th>
                  <th className="p-3">{t.lactationLabel}</th>
                  <th className="p-3">{t.statusLabel}</th>
                  <th className="p-3">{t.mastitisHxLabel}</th>
                  <th className="p-3 text-right">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E3]">
                {liveAnimals.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F9F8F6]">
                    <td className="p-3">
                      <div className="font-bold text-[#403129] font-mono">{a.tag_id}</div>
                      <div className="text-[10px] text-[#746E68]">{a.id.slice(0, 8)}…</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{a.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`}</div>
                      <div className="text-[10px] text-[#746E68]">{a.breed || '—'}</div>
                    </td>
                    <td className="p-3 text-[#746E68]">{a.age_months ? `${Math.floor(a.age_months/12)}yr` : '—'}</td>
                    <td className="p-3 text-[#746E68]">#{a.lactation_number ?? '—'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>{a.status}</span>
                    </td>
                    <td className="p-3 text-[#746E68]">
                      {a.previous_mastitis == null ? '—' : a.previous_mastitis ? t.yesLabel : t.noLabel}
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/animals/${a.id}`} className="px-3 py-1 bg-[#8A5B3D] hover:bg-[#403129] text-white font-bold rounded-lg text-[11px]">
                        {t.viewLabel}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demo mode — original grid */}
      {!isLive && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoAnimals.map((animal) => (
            <div key={animal.id} className="bg-white rounded-2xl border border-[#D9CFC7] overflow-hidden shadow-xs hover:border-[#8A5B3D] transition-all flex flex-col group">
              <div className="relative h-36 bg-[#EFE9E3] overflow-hidden">
                <img src={animal.image} alt={animal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">{animal.tag}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <RiskBadge level={animal.riskLevel} score={animal.riskScore} size="sm" />
                </div>
                <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold text-[#403129]">
                  {animal.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`} • {animal.breed}
                </div>
              </div>
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#403129]">{animal.name}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      animal.healthStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800' :
                      animal.healthStatus === 'monitored' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>{animal.healthStatus}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#746E68] bg-[#F9F8F6] p-2.5 rounded-xl border border-[#D9CFC7]/50 mt-2">
                    <div>{t.ageLabel}: <strong>{animal.ageYears} yrs</strong></div>
                    <div>{t.lactationLabel}: <strong>#{animal.lactationNumber}</strong></div>
                    <div>{t.dimLabel}: <strong>{animal.daysInMilk} d</strong></div>
                    <div>{t.avgYield}: <strong>{animal.avgDailyYieldLiters} L/d</strong></div>
                  </div>
                  <div className="text-[11px] mt-2">
                    <span className="text-[#8A5B3D] font-semibold">{t.riskDriversLabel}: </span>
                    <span className="text-[#403129]">{animal.riskFactors[0] || t.allParamsNormal}</span>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-[#D9CFC7]/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#746E68]">{t.collarLabel}: {animal.collarId || '—'}</span>
                  <Link to={`/animals/${animal.id}`} className="font-bold text-[#8A5B3D] hover:text-[#403129] flex items-center gap-1">
                    <span>{t.profileAndLiveData}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demo table mode */}
      {!isLive && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#D9CFC7] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EFE9E3] text-[#403129] font-bold border-b border-[#D9CFC7]">
                  <th className="p-3">{t.animals}</th>
                  <th className="p-3">{t.speciesLabel} / {t.breedLabel}</th>
                  <th className="p-3">{t.farmShedCluster}</th>
                  <th className="p-3">{t.riskScore}</th>
                  <th className="p-3">{t.statusLabel}</th>
                  <th className="p-3">{t.avgYield}</th>
                  <th className="p-3">{t.collarLabel}</th>
                  <th className="p-3 text-right">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E3]">
                {demoAnimals.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F9F8F6]">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img src={a.image} alt={a.name} className="w-9 h-9 rounded-lg object-cover border border-[#D9CFC7]" />
                        <div>
                          <div className="font-bold text-[#403129]">{a.name}</div>
                          <div className="text-[10px] text-[#746E68] font-mono">{a.tag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{a.species === 'cow' ? `🐄 ${t.cow}` : `🐃 ${t.buffalo}`}</div>
                      <div className="text-[10px] text-[#746E68]">{a.breed}</div>
                    </td>
                    <td className="p-3 text-[#746E68]">{a.farm}</td>
                    <td className="p-3"><RiskBadge level={a.riskLevel} score={a.riskScore} size="sm" /></td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.healthStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800' :
                        a.healthStatus === 'monitored' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>{a.healthStatus}</span>
                    </td>
                    <td className="p-3 font-semibold">{a.avgDailyYieldLiters} L</td>
                    <td className="p-3 text-[#746E68] font-mono text-[11px]">{a.collarId || '-'}</td>
                    <td className="p-3 text-right">
                      <Link to={`/animals/${a.id}`} className="px-3 py-1 bg-[#8A5B3D] hover:bg-[#403129] text-white font-bold rounded-lg text-[11px]">{t.viewLabel}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayAnimals.length === 0 && (
        <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl">
          <PawPrint className="w-8 h-8 text-[#8A5B3D] mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold text-[#403129]">{t.noAnimalsFound}</p>
          <p className="text-xs text-[#746E68] mt-1">
            {isLive ? t.noAnimalsFoundLive : t.noAnimalsFoundFilter}
          </p>
        </div>
      )}
    </div>
  );
};
