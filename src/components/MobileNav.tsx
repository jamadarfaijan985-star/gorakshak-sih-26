import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { alertService } from '../services/alertService';
import {
  LayoutDashboard,
  PawPrint,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import { MoreDrawer } from './MoreDrawer';

export const MobileNav: React.FC = () => {
  const { t } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const activeAlertsCount = alertService.getActive().length;

  return (
    <>
      <nav
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#D9CFC7] shadow-lg flex items-center justify-around h-16 px-2 safe-area-pb"
      >
        {/* 1. Dashboard */}
        <NavLink
          to="/"
          id="mobile-nav-dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8A5B3D] font-bold' : 'text-[#746E68]'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="truncate">{t.dashboard}</span>
        </NavLink>

        {/* 2. Animals */}
        <NavLink
          to="/animals"
          id="mobile-nav-animals"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8A5B3D] font-bold' : 'text-[#746E68]'
            }`
          }
        >
          <PawPrint className="w-5 h-5 mb-0.5" />
          <span className="truncate">{t.animals}</span>
        </NavLink>

        {/* 3. Alerts */}
        <NavLink
          to="/alerts"
          id="mobile-nav-alerts"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center w-16 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8A5B3D] font-bold' : 'text-[#746E68]'
            }`
          }
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {activeAlertsCount}
              </span>
            )}
          </div>
          <span className="truncate">{t.alerts}</span>
        </NavLink>

        {/* 4. More */}
        <button
          id="mobile-nav-more"
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center w-16 py-1 text-[11px] font-medium transition-colors ${
            isMoreOpen ? 'text-[#8A5B3D] font-bold' : 'text-[#746E68]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="truncate">{t.more}</span>
        </button>
      </nav>

      {/* More Drawer Modal */}
      <MoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
};
