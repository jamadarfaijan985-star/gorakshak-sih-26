import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { MoreDrawer } from '../components/MoreDrawer';
import { GlobalModals } from '../components/modals/ActionModals';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toasts, removeToast } = useApp();

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#403129] flex flex-col font-sans antialiased selection:bg-[#8A5B3D] selection:text-white">
      {/* 1. Sticky Application Header */}
      <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* 2. Middle Body: Desktop Sidebar + Content Area */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Scrollable Main View */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-12 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation */}
      <MobileNav />

      {/* 4. Mobile Drawer (triggered from hamburger or More button) */}
      <MoreDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* 5. Global Action Modals (Add Animal, Add Milk, Add CMT, Add Health) */}
      <GlobalModals />

      {/* 6. Global Floating Toasts */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-[#FFFFFF] border-emerald-300 text-[#403129]'
                : t.type === 'error'
                ? 'bg-[#FFFFFF] border-red-300 text-red-900'
                : 'bg-[#FFFFFF] border-[#D9CFC7] text-[#403129]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#8A5B3D] shrink-0" />}
              <span className="font-semibold">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#746E68] hover:text-[#403129] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
