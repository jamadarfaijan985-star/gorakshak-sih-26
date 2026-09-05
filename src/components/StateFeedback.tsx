import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading livestock intelligence...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
      <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin mb-3" />
      <p className="text-xs text-[#746E68] font-medium">{message}</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Unable to load data',
  message = 'An error occurred while communicating with the local data layer.',
  onRetry,
}) => {
  const { t } = useApp();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 border border-red-200 rounded-2xl my-4">
      <AlertCircle className="w-10 h-10 text-red-600 mb-3" />
      <h4 className="text-sm font-bold text-red-900">{title}</h4>
      <p className="text-xs text-red-700 max-w-sm mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.retry}</span>
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#FFFFFF] border border-dashed border-[#D9CFC7] rounded-2xl my-4">
      <div className="w-12 h-12 rounded-full bg-[#EFE9E3] flex items-center justify-center text-[#746E68] mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-bold text-[#403129]">{title}</h4>
      <p className="text-xs text-[#746E68] max-w-xs mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#8A5B3D] text-white rounded-xl text-xs font-semibold hover:bg-[#403129] transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
