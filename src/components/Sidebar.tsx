import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { alertService } from '../services/alertService';
import {
  LayoutDashboard, PawPrint, Activity, LineChart, Bell, PlusCircle,
  Milk, TestTube2, FileHeart, Camera, Cpu, FileSpreadsheet, MapPin,
  Settings, User, ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t, farmMode } = useApp();
  const activeAlertsCount = alertService.getActive().length;

  const navItems = [
    { to: '/', label: t.dashboard, icon: LayoutDashboard },
    { to: '/animals', label: t.animals, icon: PawPrint },
    { to: '/live-monitoring', label: t.liveMonitoring, icon: Activity },
    { to: '/analytics', label: t.analytics, icon: LineChart },
    { to: '/alerts', label: t.alerts, icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined },
    { to: '/add-data', label: t.addData, icon: PlusCircle },
    { to: '/milk-data', label: t.milkData, icon: Milk },
    { to: '/cmt-tests', label: t.cmtTests, icon: TestTube2 },
    { to: '/health-records', label: t.healthRecords, icon: FileHeart },
    { to: '/udder-analysis', label: t.udderAnalysis, icon: Camera },
    { to: '/devices', label: t.devices, icon: Cpu },
    { to: '/reports', label: t.reports, icon: FileSpreadsheet },
    { to: '/farm-map', label: t.farmMap, icon: MapPin },
    { to: '/settings', label: t.settings, icon: Settings },
    { to: '/profile', label: t.profile, icon: User },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden lg:flex flex-col w-64 bg-[#FFFFFF] border-r border-[#D9CFC7]/80 shrink-0 min-h-[calc(100vh-4rem)] select-none"
    >
      {/* Operating Mode Indicator */}
      <div className="p-3 mx-3 mt-3 bg-[#EFE9E3]/70 rounded-xl border border-[#D9CFC7]/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-[#746E68]">{t.activeModeShort}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8A5B3D]/15 text-[#8A5B3D]">
            {farmMode === 'low_resource' ? t.lowResourceMode : t.connectedMode}
          </span>
        </div>
        <p className="text-[11px] text-[#403129] font-medium mt-1">
          {farmMode === 'low_resource' ? t.lowResourceModeShort : t.connectedModeShort}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              id={`nav-${item.to.replace('/', '') || 'dashboard'}`}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#403129] text-[#FFFFFF] shadow-xs'
                    : 'text-[#746E68] hover:bg-[#EFE9E3] hover:text-[#403129]'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 m-3 bg-[#F9F8F6] border border-[#D9CFC7]/60 rounded-xl text-[11px] text-[#746E68]">
        <div className="flex items-center gap-1.5 text-[#8A5B3D] font-bold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t.livestockHealthGuard}</span>
        </div>
        <p className="text-[10px] leading-tight">{t.sidebarFooterDisclaimer}</p>
      </div>
    </aside>
  );
};
