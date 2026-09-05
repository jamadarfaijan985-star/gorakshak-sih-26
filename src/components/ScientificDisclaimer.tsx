import React, { useState } from 'react';
import { Info, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ScientificDisclaimer: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useApp();
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div
      id="scientific-disclaimer-card"
      className="bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-xl p-3.5 sm:p-4 text-xs text-[#403129] shadow-xs"
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-semibold text-[#8A5B3D]">
          <ShieldAlert className="w-4 h-4 text-[#8A5B3D] shrink-0" />
          <span>{t.scientificNotice}</span>
          <span className="bg-[#8A5B3D]/15 text-[#8A5B3D] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
            Clinical Protocols
          </span>
        </div>
        <button
          type="button"
          aria-label="Toggle disclaimer"
          className="text-[#746E68] hover:text-[#403129] p-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#D9CFC7]/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px] leading-relaxed text-[#746E68]">
          <div className="flex items-start gap-1.5">
            <span className="text-[#8A5B3D] font-bold">•</span>
            <span>
              <strong className="text-[#403129]">Rumination:</strong> {t.ruminationNote}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#8A5B3D] font-bold">•</span>
            <span>
              <strong className="text-[#403129]">Surface Temp:</strong> {t.tempNote}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#8A5B3D] font-bold">•</span>
            <span>
              <strong className="text-[#403129]">Udder Scan:</strong> {t.udderNote}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#8A5B3D] font-bold">•</span>
            <span>
              <strong className="text-[#403129]">SCC Data:</strong> {t.sccNote}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#8A5B3D] font-bold">•</span>
            <span>
              <strong className="text-[#403129]">7–14 Day Scope:</strong> {t.validationNote}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#8A5B3D] font-bold">•</span>
            <span>
              <strong className="text-[#403129]">Decision Support:</strong> {t.vetDisclaimer}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
