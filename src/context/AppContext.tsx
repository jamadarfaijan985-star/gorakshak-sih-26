import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from '../i18n/translations';
import { FarmMode, Species } from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  farmMode: FarmMode;
  setFarmMode: (mode: FarmMode) => void;
  speciesFilter: 'all' | Species;
  setSpeciesFilter: (filter: 'all' | Species) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Quick action modals
  activeModal: 'none' | 'add_animal' | 'add_milk' | 'add_cmt' | 'add_health';
  openModal: (modal: 'add_animal' | 'add_milk' | 'add_cmt' | 'add_health', animalId?: string) => void;
  closeModal: () => void;
  modalAnimalId?: string;
  setModalAnimalId: (id?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('innovx_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
    return 'en';
  });

  const [farmMode, setFarmModeState] = useState<FarmMode>(() => {
    const saved = localStorage.getItem('innovx_farm_mode');
    if (saved === 'connected' || saved === 'low_resource') return saved;
    return 'low_resource'; // Smallholder focus as default
  });

  const [speciesFilter, setSpeciesFilter] = useState<'all' | Species>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeModal, setActiveModal] = useState<'none' | 'add_animal' | 'add_milk' | 'add_cmt' | 'add_health'>('none');
  const [modalAnimalId, setModalAnimalId] = useState<string | undefined>(undefined);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('innovx_language', lang);
  };

  const setFarmMode = (mode: FarmMode) => {
    setFarmModeState(mode);
    localStorage.setItem('innovx_farm_mode', mode);
    showToast(
      mode === 'connected'
        ? 'Switched to Connected Farm Mode (Advanced Lab & Sensors enabled)'
        : 'Switched to Low-Resource Mode (Collar, Mobile & CMT focused)',
      'info'
    );
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openModal = (modal: 'add_animal' | 'add_milk' | 'add_cmt' | 'add_health', animalId?: string) => {
    if (animalId) setModalAnimalId(animalId);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal('none');
    setModalAnimalId(undefined);
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        farmMode,
        setFarmMode,
        speciesFilter,
        setSpeciesFilter,
        toasts,
        showToast,
        removeToast,
        activeModal,
        openModal,
        closeModal,
        modalAnimalId,
        setModalAnimalId,
      }}
    >
      {children}
      {/* Toast notifications */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm flex items-center justify-between border transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-[#403129] text-[#F9F8F6] border-[#8A5B3D]'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-xs opacity-70 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
