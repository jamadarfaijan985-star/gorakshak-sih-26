import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { farmService } from '../services/farmService';
import { useFarms } from '../hooks/useFarm';
import { env } from '../config/env';
import {
  Settings as SettingsIcon,
  Radio,
  Wifi,
  Globe,
  Sliders,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';

// ─── Threshold localStorage key ───────────────────────────────────────────────
const THRESHOLDS_KEY = 'innovx_calibration_thresholds';

interface ThresholdConfig {
  tempThreshold: number;
  ruminationDropPercent: number;
  thiStressLimit: number;
  cowTempBaseline: number;
  buffaloTempBaseline: number;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  tempThreshold: 0.8,
  ruminationDropPercent: 20,
  thiStressLimit: 79,
  cowTempBaseline: 34.2,
  buffaloTempBaseline: 33.8,
};

function loadThresholds(): ThresholdConfig {
  try {
    const raw = localStorage.getItem(THRESHOLDS_KEY);
    if (raw) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_THRESHOLDS;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const Settings: React.FC = () => {
  const { farmMode, setFarmMode, language, setLanguage, t, showToast } = useApp();
  const { activeFarmId, setActiveFarmId } = useAuth();

  const isLive = !env.DEMO_MODE;

  // ── GAP 8: Thresholds — persist to localStorage ───────────────────────────
  const [thresholds, setThresholds] = useState<ThresholdConfig>(loadThresholds);
  const [thresholdsSaved, setThresholdsSaved] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
    setThresholdsSaved(true);
    showToast(t.calibrationSavedToast, 'success');
    setTimeout(() => setThresholdsSaved(false), 3000);
  };

  const handleResetThresholds = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(DEFAULT_THRESHOLDS));
    showToast(t.calibrationResetToast, 'info');
  };

  const handleResetDemoData = () => {
    if (window.confirm(t.resetDemoConfirm)) {
      storageService.resetDemoData();
      showToast(t.demoDataResetToast, 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  // ── GAP 9: Farm list & creation ───────────────────────────────────────────
  const {
    data: farmsPage,
    isLoading: farmsLoading,
    error: farmsError,
    refetch: refetchFarms,
  } = useFarms();
  const farms = farmsPage?.data ?? [];

  const [showFarmForm, setShowFarmForm] = useState(false);
  const [farmForm, setFarmForm] = useState({ name: '', code: '', location_text: '' });
  const [creatingFarm, setCreatingFarm] = useState(false);
  const [farmFormError, setFarmFormError] = useState<string | null>(null);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmForm.name.trim() || !farmForm.code.trim()) {
      setFarmFormError('Farm name and code are required.');
      return;
    }
    setCreatingFarm(true);
    setFarmFormError(null);
    try {
      const farm = await farmService.create({
        name: farmForm.name.trim(),
        code: farmForm.code.trim().toUpperCase(),
        location_text: farmForm.location_text.trim() || undefined,
      });
      showToast(`${t.farmCreatedToast} "${farm.name}" (ID: ${farm.id.slice(0, 8)}…)`, 'success');
      setFarmForm({ name: '', code: '', location_text: '' });
      setShowFarmForm(false);
      refetchFarms();
    } catch (err: any) {
      const msg = err?.detail || t.failedCreateFarm;
      setFarmFormError(msg);
      showToast(msg, 'error');
    } finally {
      setCreatingFarm(false);
    }
  };

  const handleSelectFarm = (farmId: string) => {
    setActiveFarmId(farmId);
    showToast(t.activeFarmUpdatedToast, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div id="settings-page" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <h1 className="text-xl font-black text-[#403129]">{t.settings}</h1>
        <p className="text-xs text-[#746E68] mt-0.5">
          {t.settingsSubtitle}
        </p>
      </div>

      {/* ── 1. Farm Operating Mode ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#403129]">{t.farmArchitectureTitle}</h3>
            <p className="text-xs text-[#746E68]">{t.farmArchitectureDesc}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#8A5B3D]/15 text-[#8A5B3D]">
            {t.activeColonLabel} {farmMode === 'low_resource' ? t.lowResourceMode : t.connectedMode}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div
            onClick={() => setFarmMode('low_resource')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              farmMode === 'low_resource' ? 'border-[#8A5B3D] bg-[#EFE9E3]/70' : 'border-[#D9CFC7] bg-[#F9F8F6] hover:border-[#8A5B3D]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-700" />
                  <h4 className="font-bold text-sm text-[#403129]">{t.lowResourceMode}</h4>
                </div>
                {farmMode === 'low_resource' && <CheckCircle2 className="w-4 h-4 text-[#8A5B3D]" />}
              </div>
              <p className="text-xs text-[#746E68] leading-relaxed">{t.lowResourceModeDesc}</p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg">{t.recommendedRuralLabel}</div>
          </div>

          <div
            onClick={() => setFarmMode('connected')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              farmMode === 'connected' ? 'border-[#8A5B3D] bg-[#EFE9E3]/70' : 'border-[#D9CFC7] bg-[#F9F8F6] hover:border-[#8A5B3D]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-emerald-700" />
                  <h4 className="font-bold text-sm text-[#403129]">{t.connectedMode}</h4>
                </div>
                {farmMode === 'connected' && <CheckCircle2 className="w-4 h-4 text-[#8A5B3D]" />}
              </div>
              <p className="text-xs text-[#746E68] leading-relaxed">{t.connectedModeDesc}</p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-emerald-900 bg-emerald-100 px-2 py-1 rounded-lg">{t.recommendedCommercialLabel}</div>
          </div>
        </div>
      </div>

      {/* ── 2. Language ────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#8A5B3D]" />
          <h3 className="font-bold text-sm text-[#403129]">{t.uiLanguageTitle}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {[
            { code: 'en', name: t.langEnglish, native: 'English' },
            { code: 'hi', name: t.langHindi, native: 'हिंदी' },
            { code: 'mr', name: t.langMarathi, native: 'मराठी' },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code as any); showToast(`${t.languageSetToast} ${l.native}`, 'success'); }}
              className={`p-3 rounded-xl border text-center transition-all ${
                language === l.code
                  ? 'bg-[#403129] text-white border-[#403129] font-bold shadow-xs'
                  : 'bg-[#F9F8F6] hover:bg-[#EFE9E3] text-[#403129] border-[#D9CFC7]'
              }`}
            >
              <div className="text-sm">{l.native}</div>
              <div className="text-[10px] opacity-75">{l.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. GAP 8: Biomarker Thresholds (now persisted) ─────────────────── */}
      <form onSubmit={handleSaveThresholds} className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE9E3] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#403129]">{t.calibrationThresholdsTitle}</h3>
            <p className="text-xs text-[#746E68]">{t.calibrationThresholdsDesc}</p>
          </div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8A5B3D]" />
            {thresholdsSaved && (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> {t.savedLabel}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#403129] mb-1">{t.tempDeviationLimitLabel}</label>
            <input type="number" step="0.1" value={thresholds.tempThreshold}
              onChange={(e) => setThresholds({ ...thresholds, tempThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl font-bold" />
            <span className="text-[10px] text-[#746E68]">{t.alertIfDeltaHint}</span>
          </div>
          <div>
            <label className="block font-semibold text-[#403129] mb-1">{t.ruminationDropLabel}</label>
            <input type="number" value={thresholds.ruminationDropPercent}
              onChange={(e) => setThresholds({ ...thresholds, ruminationDropPercent: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl font-bold" />
            <span className="text-[10px] text-[#746E68]">{t.ruminationDropHint}</span>
          </div>
          <div>
            <label className="block font-semibold text-[#403129] mb-1">{t.thiThresholdLabel}</label>
            <input type="number" value={thresholds.thiStressLimit}
              onChange={(e) => setThresholds({ ...thresholds, thiStressLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl font-bold" />
            <span className="text-[10px] text-[#746E68]">{t.thiThresholdHint}</span>
          </div>
          <div>
            <label className="block font-semibold text-[#403129] mb-1">{t.cowBaselineTempLabel}</label>
            <input type="number" step="0.1" value={thresholds.cowTempBaseline}
              onChange={(e) => setThresholds({ ...thresholds, cowTempBaseline: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl font-bold" />
            <span className="text-[10px] text-[#746E68]">{t.ds18b20CalibrationHint}</span>
          </div>
          <div>
            <label className="block font-semibold text-[#403129] mb-1">{t.buffaloBaselineTempLabel}</label>
            <input type="number" step="0.1" value={thresholds.buffaloTempBaseline}
              onChange={(e) => setThresholds({ ...thresholds, buffaloTempBaseline: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl font-bold" />
            <span className="text-[10px] text-[#746E68]">{t.ds18b20CalibrationHint}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 justify-end">
          <button type="button" onClick={handleResetThresholds}
            className="px-4 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] text-xs font-semibold rounded-xl">
            {t.resetToDefaultsBtn}
          </button>
          <button type="submit"
            className="px-5 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors">
            <Check className="w-3.5 h-3.5" />
            {t.saveCalibrationBtn}
          </button>
        </div>
      </form>

      {/* ── 4. GAP 9: Farm Management (POST /api/v1/farms) ─────────────────── */}
      {isLive && (
        <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE9E3] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#8A5B3D]" />
              <div>
                <h3 className="font-bold text-sm text-[#403129]">{t.farmManagementTitle}</h3>
                <p className="text-xs text-[#746E68]">{t.farmManagementDesc} · {t.connectedToApi} <code className="font-mono">POST /api/v1/farms</code></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refetchFarms} className="p-1.5 rounded-xl bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129]" title="Refresh farms">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowFarmForm(!showFarmForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl">
                <Plus className="w-3.5 h-3.5" />
                <span>{t.newFarmBtn}</span>
              </button>
            </div>
          </div>

          {/* Create farm form */}
          {showFarmForm && (
            <form onSubmit={handleCreateFarm} className="p-4 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-[#403129]">{t.registerNewFarmTitle}</h4>

              {farmFormError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{farmFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">{t.farmNameLabel}</label>
                  <input type="text" required value={farmForm.name}
                    onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                    placeholder={t.farmNamePlaceholder}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-white focus:border-[#8A5B3D] outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">{t.farmCodeLabel} <span className="font-normal text-[#746E68]">({t.uniqueShortId})</span></label>
                  <input type="text" required value={farmForm.code}
                    onChange={(e) => setFarmForm({ ...farmForm, code: e.target.value.toUpperCase() })}
                    placeholder={t.farmCodePlaceholder}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-white focus:border-[#8A5B3D] outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#403129] mb-1">{t.locationOptionalLabel}</label>
                <input type="text" value={farmForm.location_text}
                  onChange={(e) => setFarmForm({ ...farmForm, location_text: e.target.value })}
                  placeholder={t.locationPlaceholder}
                  className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-white focus:border-[#8A5B3D] outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowFarmForm(false); setFarmFormError(null); }}
                  className="px-4 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold">{t.cancel}</button>
                <button type="submit" disabled={creatingFarm}
                  className="px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white rounded-xl font-bold flex items-center gap-1.5">
                  {creatingFarm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{t.createFarmBtn}</span>
                </button>
              </div>
            </form>
          )}

          {/* Farm list */}
          {farmsLoading ? (
            <div className="flex items-center gap-2 text-xs text-[#746E68] py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#8A5B3D]" />
              <span>{t.loadingFarmsLabel}</span>
            </div>
          ) : farmsError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{farmsError}</span>
            </div>
          ) : farms.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#746E68]">
              <Building2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>{t.noFarmsRegistered}</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-[#746E68] font-semibold">{t.availableFarmsLabel} ({farms.length})</p>
              {farms.map((farm) => {
                const isActive = farm.id === activeFarmId;
                return (
                  <div key={farm.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isActive ? 'bg-emerald-50 border-emerald-300' : 'bg-[#F9F8F6] border-[#D9CFC7] hover:border-[#8A5B3D]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#403129]">{farm.name}</span>
                        <span className="font-mono text-[10px] bg-[#EFE9E3] px-1.5 py-0.5 rounded text-[#403129]">{farm.code}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{t.activeBadge}</span>
                        )}
                      </div>
                      {farm.location_text && <p className="text-[11px] text-[#746E68] mt-0.5">{farm.location_text}</p>}
                      <p className="text-[10px] text-[#746E68] font-mono mt-0.5">{farm.id.slice(0, 16)}…</p>
                    </div>
                    {!isActive && (
                      <button onClick={() => handleSelectFarm(farm.id)}
                        className="px-3 py-1.5 bg-[#8A5B3D] hover:bg-[#403129] text-white text-[11px] font-bold rounded-lg">
                        {t.setActiveBtn}
                      </button>
                    )}
                  </div>
                );
              })}
              {activeFarmId && (
                <p className="text-[11px] text-[#746E68] pt-1">
                  {t.activeFarmIdLabel}: <code className="font-mono">{activeFarmId}</code>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Reset Demo Data ────────────────────────────────────────────── */}
      <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-red-900">{t.resetDemoDataTitle}</h3>
          <p className="text-xs text-red-700 mt-0.5 max-w-lg">{t.resetDemoDataDesc}</p>
        </div>
        <button onClick={handleResetDemoData} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0">
          <RotateCcw className="w-4 h-4" />
          <span>{t.resetAllDataBtn}</span>
        </button>
      </div>
    </div>
  );
};
