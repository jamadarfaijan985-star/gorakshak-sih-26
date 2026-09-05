import React, { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAnimalList } from '../hooks/useAnimals';
import { animalService } from '../services/animalService';
import { ingestService } from '../services/ingestService';
import { udderService } from '../services/udderService';
import { ScientificDisclaimer } from '../components/ScientificDisclaimer';
import { RiskBadge } from '../components/RiskBadge';
import { env } from '../config/env';
import type { UdderImageResponse } from '../types/api';
import type { UdderAnalysisResult } from '../types';
import {
  Camera, Upload, Sparkles, CheckCircle2, AlertTriangle,
  RefreshCw, Loader2, ArrowRight, WifiOff, Info,
} from 'lucide-react';

export const UdderAnalysis: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAnimalId = searchParams.get('animalId') || '';
  const { t, showToast } = useApp();
  const { activeFarmId } = useAuth();

  const isLive = !env.DEMO_MODE && !!activeFarmId;

  const { data: apiPage } = useAnimalList(
    isLive ? { farm_id: activeFarmId!, limit: 200 } : undefined,
  );
  const liveAnimals = apiPage?.data ?? [];
  const demoAnimals = animalService.getAll();
  const allAnimals = isLive ? liveAnimals : demoAnimals;

  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(
    initialAnimalId || (allAnimals[0]?.id || ''),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [liveResult, setLiveResult] = useState<UdderImageResponse | null>(null);
  const [demoResult, setDemoResult] = useState<UdderAnalysisResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleImages = [
    { label: 'Healthy Normal Udder', url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80' },
    { label: 'Asymmetric LR Swelling', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setLiveResult(null);
        setDemoResult(null);
        setUploadError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setImageFile(null);
    setImagePreview(url);
    setLiveResult(null);
    setDemoResult(null);
    setUploadError(null);
  };

  const handleRunAnalysis = async () => {
    if (!imagePreview && !imageFile) {
      showToast(t.pleaseUploadPhoto, 'error');
      return;
    }
    if (!selectedAnimalId) {
      showToast(t.pleaseSelectAnimal, 'error');
      return;
    }
    setIsAnalyzing(true);
    setUploadError(null);
    try {
      if (isLive && imageFile) {
        const capturedAt = new Date().toISOString();
        const result = await ingestService.uploadUdderImage(selectedAnimalId, capturedAt, imageFile);
        setLiveResult(result);
        showToast(t.toastUdderUploaded, 'success');
      } else {
        const result = await udderService.analyzeImage(imagePreview!, selectedAnimalId);
        setDemoResult(result);
        showToast(t.toastUdderAssessed, 'success');
      }
    } catch (err: any) {
      const msg = err?.detail || err?.message || 'Upload failed';
      setUploadError(msg);
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setLiveResult(null);
    setDemoResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="udder-analysis-page" className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-[#403129]">{t.udderAnalysis}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8A5B3D]/15 text-[#8A5B3D]">
                {t.supportiveVisionBadge}
              </span>
              {isLive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t.backendUploadBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-[#746E68] mt-0.5">{t.udderAnalysisSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#403129]">{t.animalLabel}:</span>
            <select
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
              className="px-3 py-1.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-xs font-bold text-[#403129]"
            >
              {isLive
                ? liveAnimals.map((a) => (
                    <option key={a.id} value={a.id}>{a.tag_id} ({a.species === 'cow' ? t.cow : t.buffalo})</option>
                  ))
                : demoAnimals.map((a) => (
                    <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>
                  ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mandatory disclaimer */}
      <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block font-bold">{t.sciConstraintTitle}:</strong>
          {t.sciConstraintDesc}
        </div>
      </div>

      {/* Live mode info */}
      {isLive && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t.liveInfoDesc}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload panel */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#403129]">{t.udderStep1Title}</h3>

          <div className="border-2 border-dashed border-[#D9CFC7] rounded-2xl p-4 text-center hover:border-[#8A5B3D] transition-colors bg-[#F9F8F6]">
            {imagePreview ? (
              <div className="relative max-h-64 overflow-hidden rounded-xl bg-black">
                <img src={imagePreview} alt={t.photoPreview} className="w-full h-64 object-contain mx-auto" />
                <button onClick={handleReset} className="absolute top-2 right-2 px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-bold rounded-lg">
                  {t.changePhotoBtn}
                </button>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EFE9E3] text-[#8A5B3D] flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <label htmlFor="udder-file-input" className="cursor-pointer px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl inline-block transition-colors">
                    {t.selectPhotoBtn}
                  </label>
                  <input id="udder-file-input" ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                  <p className="text-[11px] text-[#746E68] mt-2">{t.photoFormatHint}</p>
                </div>
              </div>
            )}
          </div>

          {/* Demo presets */}
          {!isLive && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#746E68]">{t.demoSampleLabel}:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {sampleImages.map((s, idx) => (
                  <button key={idx} type="button" onClick={() => handleSelectPreset(s.url)} className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-colors ${imagePreview === s.url ? 'border-[#8A5B3D] bg-[#EFE9E3] font-bold' : 'border-[#D9CFC7] bg-[#F9F8F6] hover:bg-[#EFE9E3]'}`}>
                    <img src={s.url} alt={s.label} className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-[11px] text-[#403129] truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={(!imagePreview && !imageFile) || isAnalyzing || (isLive && !imageFile)}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
              (!imagePreview && !imageFile) || isAnalyzing || (isLive && !imageFile)
                ? 'bg-[#D9CFC7] text-[#746E68] cursor-not-allowed'
                : 'bg-[#8A5B3D] hover:bg-[#403129] text-white'
            }`}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>{isLive ? t.uploadingToBackend : t.runningCvModel}</span></>
            ) : (
              <><Sparkles className="w-4 h-4" /><span>{isLive ? t.uploadUdderImageBtn : t.analyzeUdderImageBtn}</span></>
            )}
          </button>
          {isLive && !imageFile && imagePreview && (
            <p className="text-[11px] text-amber-700 text-center">{t.selectFileHint}</p>
          )}
        </div>

        {/* Results panel */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#403129]">{t.udderStep2Title}</h3>

          {/* Live result */}
          {isLive && liveResult && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-emerald-900">{t.imageUploadedMsg}</div>
                  <div className="text-[11px] text-emerald-700">
                    {t.storedAtLabel}: <code className="font-mono">{liveResult.image_url}</code>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                <div className="font-bold text-xs text-[#403129] mb-2 uppercase tracking-wide">{t.supportiveVisualAssessment}</div>

                {liveResult.cv_result ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {([
                      [t.possibleSwelling, liveResult.cv_result.swelling],
                      [t.visibleAsymmetry, liveResult.cv_result.asymmetry],
                      [t.possibleRedness, liveResult.cv_result.redness],
                      [t.cvLesions, liveResult.cv_result.lesions],
                      [t.cvDischarge, liveResult.cv_result.discharge],
                      [t.cvConfidence, liveResult.cv_result.confidence],
                    ] as [string, number | null | undefined][]).map(([label, val]) => (
                      <div key={label} className="p-2 rounded-xl bg-white border border-[#D9CFC7]">
                        <div className="text-[10px] text-[#746E68]">{label}</div>
                        <div className="font-bold text-[#403129]">
                          {val != null ? `${(val * 100).toFixed(0)}%` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-[#746E68]">
                    <p className="font-medium">{t.signalPending}</p>
                    <p className="text-[11px] mt-1">{t.cvAnalysisPendingDesc}</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <strong>{t.requiresFollowUpTitle}:</strong> {t.requiresFollowUp}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link to={`/animals/${selectedAnimalId}`} className="font-bold text-[#8A5B3D] hover:underline flex items-center gap-1 text-xs">
                  <span>{t.viewAnimalProfileLink}</span><ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button onClick={handleReset} className="px-3 py-1.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-bold rounded-lg text-xs">
                  {t.newScanBtn}
                </button>
              </div>
            </div>
          )}

          {/* Demo result */}
          {!isLive && demoResult && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#746E68] font-bold uppercase tracking-wide">{t.morphologicalRiskLabel}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <RiskBadge level={demoResult.riskLevel} />
                    <span className="font-bold text-xs text-[#403129]">{t.confidenceLabel}: {demoResult.confidenceScore}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#746E68]">{t.statusLabel}</span>
                  <div className="font-bold text-xs text-[#8A5B3D]">{t.statusProcessed}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-[#EFE9E3]/50 rounded-xl border border-[#D9CFC7]">
                  <div className="text-[10px] text-[#746E68]">{t.possibleSwelling}</div>
                  <div className="font-bold text-[#403129] mt-0.5">{demoResult.possibleSwelling.severity}</div>
                </div>
                <div className="p-3 bg-[#EFE9E3]/50 rounded-xl border border-[#D9CFC7]">
                  <div className="text-[10px] text-[#746E68]">{t.possibleRedness}</div>
                  <div className="font-bold text-[#403129] mt-0.5">{demoResult.possibleRedness.severity}</div>
                </div>
                <div className="p-3 bg-[#EFE9E3]/50 rounded-xl border border-[#D9CFC7]">
                  <div className="text-[10px] text-[#746E68]">{t.visibleAsymmetry}</div>
                  <div className="font-bold text-[#403129] mt-0.5">{demoResult.visibleAsymmetry.severity}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7]">
                <span className="text-[10px] font-bold text-[#8A5B3D] uppercase tracking-wide block mb-1">{t.cvObservationsLabel}:</span>
                <ul className="space-y-1 text-[#403129]">
                  {demoResult.observations.map((obs, i) => <li key={i}>• {obs}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-[#EFE9E3]/70 border border-[#D9CFC7]">
                <span className="text-[10px] font-bold text-[#403129] uppercase tracking-wide block mb-1">{t.recommendedProtocolLabel}:</span>
                <ul className="space-y-1 text-[#403129]">
                  {demoResult.recommendedNextSteps.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link to={`/animals/${selectedAnimalId}`} className="font-bold text-[#8A5B3D] hover:underline flex items-center gap-1">
                  <span>{t.attachToProfileLink}</span><ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button onClick={handleReset} className="px-3 py-1.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-bold rounded-lg text-xs">
                  {t.newScanBtn}
                </button>
              </div>
            </div>
          )}

          {!liveResult && !demoResult && (
            <div className="p-12 text-center text-[#746E68] border-2 border-dashed border-[#D9CFC7] rounded-xl">
              <Camera className="w-8 h-8 text-[#8A5B3D] mx-auto mb-2 opacity-50" />
              <p className="font-bold text-xs text-[#403129]">{t.noScanYet}</p>
              <p className="text-[11px] mt-1 max-w-xs mx-auto">{t.noScanHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
