import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Activity, LineChart, PlusCircle, Milk, TestTube2, FileHeart,
  Camera, Cpu, FileSpreadsheet, MapPin, Settings, User, X, Radio, Wifi, Globe,
} from 'lucide-react';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  const { t, farmMode, setFarmMode, language, setLanguage } = useApp();

  if (!isOpen) return null;

  const moreNavItems = [
    { to: '/live-monitoring', label: t.liveMonitoring, icon: Activity, desc: t.descLiveMonitoring },
    { to: '/analytics', label: t.analytics, icon: LineChart, desc: t.descAnalytics },
    { to: '/add-data', label: t.addData, icon: PlusCircle, desc: t.descAddData },
    { to: '/milk-data', label: t.milkData, icon: Milk, desc: t.descMilkData },
    { to: '/cmt-tests', label: t.cmtTests, icon: TestTube2, desc: t.descCmtTests },
    { to: '/health-records', label: t.healthRecords, icon: FileHeart, desc: t.descHealthRecords },
    { to: '/udder-analysis', label: t.udderAnalysis, icon: Camera, desc: t.descUdderAnalysis },
    { to: '/devices', label: t.devices, icon: Cpu, desc: t.descDevices },
    { to: '/reports', label: t.reports, icon: FileSpreadsheet, desc: t.descReports },
    { to: '/farm-map', label: t.farmMap, icon: MapPin, desc: t.descFarmMap },
    { to: '/settings', label: t.settings, icon: Settings, desc: t.descSettings },
    { to: '/profile', label: t.profile, icon: User, desc: t.descProfile },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity">
      <div
        id="more-menu-sheet"
        className="bg-[#FFFFFF] w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-[#D9CFC7] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9CFC7]/70 bg-[#F9F8F6]">
          <div>
            <h3 className="font-bold text-base text-[#403129]">{t.more}</h3>
            <p className="text-xs text-[#746E68]">{t.moreDrawerSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#EFE9E3] text-[#746E68] hover:text-[#403129]" aria-label={t.cancel}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode & Language quick row */}
        <div className="px-5 py-3 bg-[#EFE9E3]/50 border-b border-[#D9CFC7]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#746E68] font-medium">{t.modeLabel}:</span>
            <button
              onClick={() => setFarmMode(farmMode === 'low_resource' ? 'connected' : 'low_resource')}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#D9CFC7] rounded-lg font-semibold text-[#403129] flex items-center gap-1"
            >
              {farmMode === 'low_resource' ? (
                <><Radio className="w-3.5 h-3.5 text-amber-700" /><span>{t.lowResourceMode}</span></>
              ) : (
                <><Wifi className="w-3.5 h-3.5 text-emerald-700" /><span>{t.connectedMode}</span></>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#8A5B3D]" />
            {(['en', 'hi', 'mr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  language === l ? 'bg-[#403129] text-white' : 'bg-[#FFFFFF] text-[#746E68] hover:bg-[#EFE9E3]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {moreNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'bg-[#403129] text-white border-[#403129]'
                      : 'bg-[#F9F8F6] hover:bg-[#EFE9E3] text-[#403129] border-[#D9CFC7]/60'
                  }`
                }
              >
                <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-[#FFFFFF] text-[#8A5B3D] border border-[#D9CFC7]/50">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate">{item.label}</div>
                  <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{item.desc}</div>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom close button */}
        <div className="p-3 border-t border-[#D9CFC7]/60 bg-[#FFFFFF] text-center">
          <button onClick={onClose} className="w-full py-2.5 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] font-bold text-xs rounded-xl transition-colors">
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
