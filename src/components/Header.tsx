import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { alertService } from '../services/alertService';
import { Language } from '../i18n/translations';
import { env } from '../config/env';
import {
  Bell, Globe, Plus, Radio, Wifi, Menu, ChevronDown, LogOut, User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { InnovxLogo } from './InnovxLogo';

export const Header: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const { language, setLanguage, t, farmMode, setFarmMode, speciesFilter, setSpeciesFilter, openModal } = useApp();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeAlertsCount = alertService.getActive().length;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#D9CFC7]/80 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Left: Hamburger (mobile) + Logo & Title */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              id="mobile-menu-btn"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-[#403129] hover:bg-[#EFE9E3] rounded-lg transition-colors"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center group py-1" aria-label="GoDrishti Dairy Intelligence Home">
            <InnovxLogo size="md" animated={true} />
          </Link>
        </div>

        {/* Middle: Species Quick Filter */}
        <div className="hidden md:flex items-center bg-[#EFE9E3] p-1 rounded-xl border border-[#D9CFC7]">
          <button
            onClick={() => setSpeciesFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              speciesFilter === 'all'
                ? 'bg-[#FFFFFF] text-[#403129] shadow-xs'
                : 'text-[#746E68] hover:text-[#403129]'
            }`}
          >
            {t.allSpecies}
          </button>
          <button
            onClick={() => setSpeciesFilter('cow')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              speciesFilter === 'cow'
                ? 'bg-[#FFFFFF] text-[#403129] shadow-xs'
                : 'text-[#746E68] hover:text-[#403129]'
            }`}
          >
            <span>🐄</span>
            <span>{t.cows}</span>
          </button>
          <button
            onClick={() => setSpeciesFilter('buffalo')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              speciesFilter === 'buffalo'
                ? 'bg-[#FFFFFF] text-[#403129] shadow-xs'
                : 'text-[#746E68] hover:text-[#403129]'
            }`}
          >
            <span>🐃</span>
            <span>{t.buffaloes}</span>
          </button>
        </div>

        {/* Right Actions: Farm Mode + Language + Alerts + Quick Add */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Farm Mode Toggle */}
          <div className="relative">
            <button
              id="farm-mode-btn"
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D9CFC7] bg-[#F9F8F6] text-xs font-medium text-[#403129] hover:bg-[#EFE9E3] transition-colors"
              title="Change Farm Operating Mode"
            >
              {farmMode === 'low_resource' ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline font-semibold">{t.lowResourceMode}</span>
                  <span className="sm:hidden text-[11px] font-semibold">Low-Res</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline font-semibold">{t.connectedMode}</span>
                  <span className="sm:hidden text-[11px] font-semibold">Conn</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-[#746E68]" />
            </button>

            {showModeMenu && (
              <div
                id="farm-mode-menu"
                className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] border border-[#D9CFC7] rounded-xl shadow-lg p-2 z-50 text-xs"
              >
                <div className="p-2 border-b border-[#D9CFC7]/60 mb-1">
                  <p className="font-bold text-[#403129]">Select Farm Architecture</p>
                  <p className="text-[11px] text-[#746E68]">
                    Adapts features to available field equipment
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFarmMode('low_resource');
                    setShowModeMenu(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                    farmMode === 'low_resource' ? 'bg-[#EFE9E3] font-semibold' : 'hover:bg-[#F9F8F6]'
                  }`}
                >
                  <Radio className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[#403129] font-medium">{t.lowResourceMode}</div>
                    <div className="text-[10px] text-[#746E68] leading-tight mt-0.5">
                      Collar, phone observations & CMT paddle. No lab/SCC required.
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setFarmMode('connected');
                    setShowModeMenu(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                    farmMode === 'connected' ? 'bg-[#EFE9E3] font-semibold' : 'hover:bg-[#F9F8F6]'
                  }`}
                >
                  <Wifi className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[#403129] font-medium">{t.connectedMode}</div>
                    <div className="text-[10px] text-[#746E68] leading-tight mt-0.5">
                      Automated parlour, inline EC/pH sensors & lab SCC integration.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              id="language-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#D9CFC7] bg-[#F9F8F6] text-xs font-semibold text-[#403129] hover:bg-[#EFE9E3] transition-colors"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#8A5B3D]" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-[#746E68]" />
            </button>

            {showLangMenu && (
              <div
                id="language-menu"
                className="absolute right-0 mt-2 w-36 bg-[#FFFFFF] border border-[#D9CFC7] rounded-xl shadow-lg p-1 z-50 text-xs"
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      language === l.code
                        ? 'bg-[#EFE9E3] text-[#403129] font-bold'
                        : 'text-[#746E68] hover:bg-[#F9F8F6] hover:text-[#403129]'
                    }`}
                  >
                    <span>{l.native}</span>
                    <span className="text-[10px] uppercase opacity-60">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alert Bell */}
          <Link
            to="/alerts"
            id="header-alerts-link"
            className="relative p-2 rounded-lg text-[#403129] hover:bg-[#EFE9E3] transition-colors"
            title={t.alerts}
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </Link>

          {/* Quick Register Animal Button */}
          <button
            id="quick-add-btn"
            onClick={() => openModal('add_animal')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#8A5B3D] text-[#FFFFFF] rounded-lg text-xs font-semibold hover:bg-[#403129] shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addAnimal}</span>
          </button>

          {/* User avatar / logout (live mode) */}
          {!env.DEMO_MODE && isAuthenticated && user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#D9CFC7] bg-[#F9F8F6] text-xs font-semibold text-[#403129] hover:bg-[#EFE9E3] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#8A5B3D]" />
                <span className="hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-[#746E68]" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#D9CFC7] rounded-xl shadow-lg p-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#D9CFC7]/60">
                    <p className="font-bold text-[#403129] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#746E68] capitalize">{user.role}</p>
                  </div>
                  <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-[#F9F8F6] text-[#403129]">
                    <User className="w-3.5 h-3.5" />Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-700">
                    <LogOut className="w-3.5 h-3.5" />Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
