/**
 * BehaviorSignalCard — Model 3 independent behavioral signal display.
 *
 * PRD §14 rules enforced here:
 * - Behavior is NOT a mastitis probability.
 * - The four states are: NORMAL | MILD DEVIATION | MODERATE DEVIATION | HIGH DEVIATION
 * - If backend endpoint is unavailable → show honest "Integration Pending" state.
 * - Never convert HIGH DEVIATION into a mastitis probability.
 */

import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, HelpCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type BehaviorStatus =
  | 'normal'
  | 'mild_deviation'
  | 'moderate_deviation'
  | 'high_deviation'
  | 'insufficient_data'
  | 'integration_pending';

export interface BehaviorSignalData {
  status: BehaviorStatus;
  /** Window used for baseline comparison, e.g. "last 7 days" */
  observationWindow?: string;
  /** Source of the data: 'sensor' | 'manual' | 'ai_derived' */
  dataSource?: string;
  /** Human-readable observation summary from the backend */
  observation?: string;
  /** ISO timestamp of when the signal was computed */
  computedAt?: string;
}

const STATUS_CONFIG: Record<
  BehaviorStatus,
  { labelKey: keyof typeof import('../i18n/translations').translations.en; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  normal: {
    labelKey: 'behaviorNormal',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  mild_deviation: {
    labelKey: 'behaviorMildDeviation',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Activity,
  },
  moderate_deviation: {
    labelKey: 'behaviorModerateDeviation',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  high_deviation: {
    labelKey: 'behaviorHighDeviation',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
  },
  insufficient_data: {
    labelKey: 'signalInsufficient',
    color: 'text-[#746E68]',
    bg: 'bg-[#F9F8F6]',
    border: 'border-[#D9CFC7]',
    icon: HelpCircle,
  },
  integration_pending: {
    labelKey: 'signalPending',
    color: 'text-[#746E68]',
    bg: 'bg-[#F9F8F6]',
    border: 'border-[#D9CFC7]',
    icon: Clock,
  },
};

interface Props {
  data?: BehaviorSignalData | null;
  /** When true, shows a compact inline badge rather than the full card */
  compact?: boolean;
}

export const BehaviorSignalCard: React.FC<Props> = ({ data, compact = false }) => {
  const { t } = useApp();

  // If no data provided at all, show integration-pending state
  const status: BehaviorStatus = data?.status ?? 'integration_pending';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {t[cfg.labelKey]}
      </span>
    );
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.bg} ${cfg.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#746E68] mb-1">
            {t.model3Label}
          </div>
          <div className={`flex items-center gap-2 font-bold text-sm ${cfg.color}`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span>{t[cfg.labelKey]}</span>
          </div>
        </div>

        {/* Source badge */}
        {data?.dataSource && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EFE9E3] text-[#403129]">
            {data.dataSource === 'sensor'
              ? t.provenanceSensor
              : data.dataSource === 'ai_derived'
              ? t.provenanceAiModel
              : t.provenanceManual}
          </span>
        )}
      </div>

      {/* Observation */}
      {status === 'integration_pending' && (
        <p className="text-xs text-[#746E68] leading-relaxed">
          {t.behaviorPendingDesc}
        </p>
      )}

      {status === 'insufficient_data' && (
        <p className="text-xs text-[#746E68] leading-relaxed">
          {t.signalInsufficientDetail}
        </p>
      )}

      {data?.observation && status !== 'integration_pending' && status !== 'insufficient_data' && (
        <p className="text-xs text-[#403129] leading-relaxed">{data.observation}</p>
      )}

      {/* Important: explicitly state this is NOT a mastitis probability */}
      <div className="text-[10px] text-[#746E68] pt-2 border-t border-[#D9CFC7]/60 leading-tight">
        ⚠ {t.behaviorIndependentDisclaimer}
        {data?.observationWindow && (
          <span className="ml-1">{t.observationWindowLabel}: {data.observationWindow}.</span>
        )}
      </div>

      {/* Computed at */}
      {data?.computedAt && (
        <div className="text-[10px] text-[#746E68] font-mono">
          {t.computedLabel}: {new Date(data.computedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};
