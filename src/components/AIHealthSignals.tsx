0/**
 * AIHealthSignals — unified display of THREE independent AI model signals.
 *
 * PRD rules enforced here:
 * - Model 1 (Mastitis Forecasting), Model 2 (Udder Image AI), Model 3 (Behavior)
 *   are displayed as visually SEPARATE sections.
 * - They are NEVER merged into a single probability.
 * - They are NEVER averaged.
 * - Model 2 and 3 NEVER silently modify Model 1's risk band.
 * - Model 1 always shows the development disclaimer.
 * - Placeholder "Integration Pending" states shown when backends not ready.
 *
 * Props
 * -----
 * riskScore   — latest RiskScoreResponse from the backend (Model 1 output)
 * udderResult — UdderImageResponse from the backend (Model 2 output); null = pending
 * behaviorData — BehaviorSignalData from future Model 3 endpoint; null = pending
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Camera,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BehaviorSignalCard, BehaviorSignalData } from './BehaviorSignalCard';
import type { ForecastResponse, RiskScoreResponse, UdderImageResponse } from '../types/api';

// ---------------------------------------------------------------------------
// Model 1 signal helpers
// ---------------------------------------------------------------------------

type SignalState = 'elevated' | 'below_threshold' | 'insufficient' | 'pending';

function riskLevelToSignal(riskLevel?: string | null): SignalState {
  if (!riskLevel) return 'pending';
  if (riskLevel === 'no_risk' || riskLevel === 'low') return 'below_threshold';
  if (riskLevel === 'moderate' || riskLevel === 'high') return 'elevated';
  return 'pending';
}

const SIGNAL_STYLE: Record<SignalState, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  elevated: {
    label: 'Elevated',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    Icon: AlertTriangle,
  },
  below_threshold: {
    label: 'Below Alert Threshold',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    Icon: CheckCircle2,
  },
  insufficient: {
    label: 'Insufficient Data',
    color: 'text-[#746E68]',
    bg: 'bg-[#F9F8F6]',
    border: 'border-[#D9CFC7]',
    Icon: HelpCircle,
  },
  pending: {
    label: 'Integration Pending',
    color: 'text-[#746E68]',
    bg: 'bg-[#F9F8F6]',
    border: 'border-[#D9CFC7]',
    Icon: Clock,
  },
};

function SignalChip({ state }: { state: SignalState }) {
  const { label, color, bg, border, Icon } = SIGNAL_STYLE[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${color} ${border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ icon: Icon, title, subtitle, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#D9CFC7] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#EFE9E3]/60 hover:bg-[#EFE9E3] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-[#8A5B3D] shrink-0" />
          <div className="text-left">
            <div className="text-xs font-bold text-[#403129]">{title}</div>
            <div className="text-[10px] text-[#746E68]">{subtitle}</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#746E68]" /> : <ChevronDown className="w-4 h-4 text-[#746E68]" />}
      </button>
      {open && <div className="p-4 bg-white space-y-3">{children}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  /** Latest risk score from backend — null means no score computed yet */
  riskScore?: RiskScoreResponse | null;
  /** True while risk score is loading */
  riskLoading?: boolean;
  /** Latest udder image result from backend — null means no image uploaded or Model 2 pending */
  udderResult?: UdderImageResponse | null;
  /** Model 3 behavior signal data — null means backend endpoint not yet available */
  behaviorData?: BehaviorSignalData | null;
  /**
   * XGBoost 7d/14d forecast from POST /api/v1/risk/forecast/{animal_id}.
   * null  = not yet fetched or insufficient data (expected state, not an error)
   * undefined = loading
   */
  forecastData?: ForecastResponse | null;
  /** True while forecast is loading */
  forecastLoading?: boolean;
  /** Called when user clicks "Recompute Risk" */
  onComputeRisk?: () => void;
  computingRisk?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AIHealthSignals: React.FC<Props> = ({
  riskScore,
  riskLoading,
  udderResult,
  behaviorData,
  forecastData,
  forecastLoading,
  onComputeRisk,
  computingRisk,
}) => {
  const { t } = useApp();

  // ── Screening signal (rule-based / ML classification engine) ──────────────
  const screeningSignal: SignalState = riskScore
    ? riskLevelToSignal(riskScore.risk_level)
    : riskLoading
    ? 'pending'
    : 'insufficient';

  // ── 7d / 14d forecast signals (XGBoost gorakshak_forecast_*_xgb_v2) ───────
  // Map backend VERY_LOW/LOW/MODERATE/HIGH → frontend SignalState
  function forecastLevelToSignal(level?: string | null): SignalState {
    if (!level) return 'pending';
    const l = level.toUpperCase();
    if (l === 'HIGH' || l === 'MODERATE') return 'elevated';
    if (l === 'LOW' || l === 'VERY_LOW') return 'below_threshold';
    return 'pending';
  }

  const signal7d: SignalState = forecastLoading
    ? 'pending'
    : forecastData?.forecast
    ? forecastLevelToSignal(forecastData.forecast.risk_7d_level)
    : 'insufficient';

  const signal14d: SignalState = forecastLoading
    ? 'pending'
    : forecastData?.forecast
    ? forecastLevelToSignal(forecastData.forecast.risk_14d_level)
    : 'insufficient';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[#403129]">{t.aiHealthSignals}</h3>
        {onComputeRisk && (
          <button
            onClick={onComputeRisk}
            disabled={computingRisk}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8A5B3D] hover:text-[#403129] disabled:opacity-50"
          >
            {computingRisk ? t.computingLabel : t.refreshSignals}
          </button>
        )}
      </div>

      {/* IMPORTANT: signals-are-independent notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          {t.independentSignalsNotice}
        </span>
      </div>

      {/* ── MODEL 1: Mastitis Forecasting ───────────────────────────────── */}
      <Section
        icon={ShieldAlert}
        title={t.model1Label}
        subtitle={t.model1SubLabel}
        defaultOpen
      >
        {/* Disclaimer — always visible per PRD §11 */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{t.model1Disclaimer}</span>
        </div>

        {/* Current screening */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-[#746E68] uppercase tracking-wide">
            {t.currentScreeningSignal}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7]">
            <div>
              <div className="text-xs text-[#746E68] mb-1">{t.ruleBasedEngineOutput}</div>
              <SignalChip state={screeningSignal} />
            </div>
            {riskScore && (
              <div className="text-right text-[10px] text-[#746E68] space-y-0.5">
                <div className="font-mono">{riskScore.model_version}</div>
                {riskScore.risk_score_numeric != null && (
                  <div>{t.scoreLabel}: {(riskScore.risk_score_numeric * 100).toFixed(0)}/100</div>
                )}
              </div>
            )}
          </div>

          {/* Contributing factors */}
          {riskScore && riskScore.contributing_factors.length > 0 && (
            <div className="p-3 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7] space-y-1.5">
              <div className="text-[10px] font-bold text-[#8A5B3D] uppercase tracking-wide">
                {t.contributingFactorsLabel}
              </div>
              {riskScore.contributing_factors.map((cf, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#403129]">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {cf.factor}
                    <span className="text-[#746E68] ml-1">
                      (weight: {(cf.weight * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recommended action */}
          {riskScore?.recommended_action && (
            <div className="p-3 rounded-lg bg-[#EFE9E3]/70 border border-[#D9CFC7]">
              <div className="text-[10px] font-bold text-[#403129] uppercase tracking-wide mb-1">
                {t.recommendedActionLabel}
              </div>
              <p className="text-xs text-[#403129] leading-relaxed">
                {riskScore.recommended_action}
              </p>
            </div>
          )}

          {/* Insufficient data */}
          {!riskScore && !riskLoading && (
            <p className="text-xs text-[#746E68] leading-relaxed">
              {t.signalInsufficientDetail}
            </p>
          )}
        </div>

        {/* 7-day and 14-day forecast */}
        <div className="pt-2 border-t border-[#D9CFC7]/60 space-y-2">
          <div className="text-[10px] font-bold text-[#746E68] uppercase tracking-wide">
            {t.temporalForecastingSignals}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg border border-[#D9CFC7] bg-[#F9F8F6] space-y-1.5">
              <div className="text-[10px] text-[#746E68] font-semibold">
                {t.model1Signal7d}
              </div>
              <SignalChip state={signal7d} />
              {forecastData?.forecast ? (
                <div className="text-[10px] text-[#403129] font-mono font-bold">
                  {forecastData.forecast.risk_7d_percent.toFixed(1)}%
                </div>
              ) : (
                <div className="text-[9px] text-[#746E68]">
                  {forecastLoading ? 'Loading…' : t.notYetIntegrated7d}
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg border border-[#D9CFC7] bg-[#F9F8F6] space-y-1.5">
              <div className="text-[10px] text-[#746E68] font-semibold">
                {t.model1Signal14d}
              </div>
              <SignalChip state={signal14d} />
              {forecastData?.forecast ? (
                <div className="text-[10px] text-[#403129] font-mono font-bold">
                  {forecastData.forecast.risk_14d_percent.toFixed(1)}%
                </div>
              ) : (
                <div className="text-[9px] text-[#746E68]">
                  {forecastLoading ? 'Loading…' : t.notYetIntegrated14d}
                </div>
              )}
            </div>
          </div>

          {/* SHAP explanations + recommendation when available */}
          {forecastData && forecastData.explanations.length > 0 && (
            <div className="p-3 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7] space-y-1.5">
              <div className="text-[10px] font-bold text-[#8A5B3D] uppercase tracking-wide">
                {t.contributingFactorsLabel}
              </div>
              {forecastData.explanations.map((exp, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-[#403129]">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span>{exp}</span>
                </div>
              ))}
            </div>
          )}

          {forecastData?.recommendation && (
            <div className="p-3 rounded-lg bg-[#EFE9E3]/70 border border-[#D9CFC7]">
              <div className="text-[10px] font-bold text-[#403129] uppercase tracking-wide mb-1">
                {t.recommendedActionLabel}
              </div>
              <p className="text-[10px] text-[#403129] leading-relaxed">
                {forecastData.recommendation}
              </p>
            </div>
          )}

          {forecastData && (
            <div className="text-[9px] text-[#746E68] leading-tight italic">
              {forecastData.data_disclaimer}
            </div>
          )}
        </div>

        {/* Window info */}
        {riskScore && (
          <div className="text-[10px] text-[#746E68] font-mono space-y-0.5 pt-1">
            <div>Computed: {new Date(riskScore.computed_at).toLocaleString()}</div>
            <div>
              Window: {new Date(riskScore.window_start).toLocaleDateString()} –{' '}
              {new Date(riskScore.window_end).toLocaleDateString()}
            </div>
          </div>
        )}
      </Section>

      {/* ── MODEL 2: Udder Image AI ──────────────────────────────────────── */}
      <Section
        icon={Camera}
        title={t.model2Label}
        subtitle={t.model2SubLabel}
        defaultOpen={false}
      >
        {udderResult?.cv_result ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {(
                [
                  ['Possible Swelling', udderResult.cv_result.swelling],
                  ['Asymmetry', udderResult.cv_result.asymmetry],
                  ['Redness', udderResult.cv_result.redness],
                  ['Lesions', udderResult.cv_result.lesions],
                  ['Discharge', udderResult.cv_result.discharge],
                  ['CV Confidence', udderResult.cv_result.confidence],
                ] as [string, number | null | undefined][]
              ).map(([label, val]) => (
                <div key={label} className="p-2 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7]">
                  <div className="text-[10px] text-[#746E68]">{label}</div>
                  <div className="font-bold text-[#403129]">
                    {val != null ? `${(val * 100).toFixed(0)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-[#746E68]">
              Model: {udderResult.cv_model_version ?? 'unknown'} · Captured:{' '}
              {new Date(udderResult.captured_at).toLocaleString()}
            </div>
          </div>
        ) : udderResult && !udderResult.cv_result ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F9F8F6] border border-[#D9CFC7]">
              <Clock className="w-4 h-4 text-[#746E68] shrink-0 mt-0.5" />
              <div className="text-xs text-[#746E68]">
                <span className="font-semibold text-[#403129]">{t.signalPending}</span> —
                {t.imageStoredAt}{' '}
                <code className="font-mono text-[10px]">{udderResult.image_url}</code>.
                {t.cvAnalysisPending}
              </div>
            </div>
            <p className="text-[10px] text-[#746E68] leading-tight">
              Always correlate with CMT or veterinary SCC analysis.
            </p>
          </div>
        ) : (
          <div className="text-xs text-[#746E68] space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#403129]">
              <Clock className="w-4 h-4" />
              {t.signalPending}
            </div>
            <p>
              {t.noUdderImageUploaded}
              {' '}
              {t.udderUploadViaPage}
            </p>
          </div>
        )}

        {/* Mandatory disclaimer */}
        <div className="text-[10px] text-[#746E68] pt-2 border-t border-[#D9CFC7]/60">
          ⚠ {t.udderImageDisclaimer}
        </div>
      </Section>

      {/* ── MODEL 3: Behavior Signal ─────────────────────────────────────── */}
      <Section
        icon={Activity}
        title={t.model3Label}
        subtitle={t.model3SubLabel}
        defaultOpen={false}
      >
        <BehaviorSignalCard data={behaviorData} />
      </Section>
    </div>
  );
};
