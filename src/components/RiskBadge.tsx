import React from 'react';
import { RiskLevel } from '../types';
import { useApp } from '../context/AppContext';
import { AlertTriangle, CheckCircle, AlertCircle, AlertOctagon } from 'lucide-react';

export const RiskBadge: React.FC<{
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ level, score, showIcon = true, size = 'md' }) => {
  const { t } = useApp();

  const getStyle = () => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          icon: AlertOctagon,
          label: t.highRisk,
        };
      case 'moderate':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: t.moderateRisk,
        };
      case 'low':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: AlertCircle,
          label: t.lowRisk,
        };
      case 'no_risk':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle,
          label: t.noRisk,  // "Below Alert Threshold" per translations
        };
    }
  };

  const config = getStyle();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{score !== undefined ? `${config.label} (${score})` : config.label}</span>
    </span>
  );
};
