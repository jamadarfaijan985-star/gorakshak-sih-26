import React from 'react';
import { useApp } from '../context/AppContext';
import {
  PawPrint,
  Droplets,
  TestTube2,
  FileHeart,
  Camera,
  Plus,
  ArrowRight,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AddData: React.FC = () => {
  const { t, openModal } = useApp();

  const dataHubActions = [
    {
      id: 'add_animal',
      titleKey: 'registerLivestockTitle' as const,
      descKey: 'registerLivestockDesc' as const,
      badgeKey: 'registerLivestockBadge' as const,
      icon: PawPrint,
      onClick: () => openModal('add_animal'),
    },
    {
      id: 'add_milk',
      titleKey: 'milkingRecordQualityTitle' as const,
      descKey: 'milkingRecordQualityDesc' as const,
      badgeKey: 'milkingRecordBadge' as const,
      icon: Droplets,
      onClick: () => openModal('add_milk'),
    },
    {
      id: 'add_cmt',
      titleKey: 'cmtTestTitle' as const,
      descKey: 'cmtTestDesc' as const,
      badgeKey: 'cmtTestBadge' as const,
      icon: TestTube2,
      onClick: () => openModal('add_cmt'),
    },
    {
      id: 'add_health',
      titleKey: 'vetLogTitle' as const,
      descKey: 'vetLogDesc' as const,
      badgeKey: 'vetLogBadge' as const,
      icon: FileHeart,
      onClick: () => openModal('add_health'),
    },
  ];

  return (
    <div id="add-data-page" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <h1 className="text-xl font-black text-[#403129]">{t.addData}</h1>
        <p className="text-xs text-[#746E68] mt-1">{t.addDataSubtitle}</p>
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataHubActions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs hover:border-[#8A5B3D] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-[#EFE9E3] text-[#8A5B3D] rounded-xl">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8A5B3D]/10 text-[#8A5B3D] px-2.5 py-1 rounded-full">
                    {t[action.badgeKey]}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#403129]">{t[action.titleKey]}</h3>
                <p className="text-xs text-[#746E68] mt-1.5 leading-relaxed">{t[action.descKey]}</p>
              </div>

              <button
                onClick={action.onClick}
                className="mt-5 w-full py-2.5 bg-[#8A5B3D] hover:bg-[#403129] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t.openFormBtn} — {t[action.titleKey]}</span>
              </button>
            </div>
          );
        })}

        {/* 5th Card: Udder Analysis Link */}
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border-2 border-[#8A5B3D]/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-[#8A5B3D] text-white rounded-xl">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                {t.aiVisionBadge}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-[#403129]">{t.udderAsymmetryTitle}</h3>
            <p className="text-xs text-[#746E68] mt-1.5 leading-relaxed">{t.udderAsymmetryDesc}</p>
          </div>

          <Link
            to="/udder-analysis"
            className="mt-5 w-full py-2.5 bg-[#403129] hover:bg-[#8A5B3D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <span>{t.launchCameraBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Field Protocol Guide */}
      <div className="bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#403129]">
          <Info className="w-5 h-5 text-[#8A5B3D]" />
          <h3 className="font-bold text-sm">{t.bestFieldPracticesTitle}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#403129]">
          <div className="p-3 bg-white rounded-xl border border-[#D9CFC7]">
            <h4 className="font-bold text-[#8A5B3D] mb-1">{t.stripCupTitle}</h4>
            <p className="text-[#746E68] text-[11px] leading-relaxed">{t.stripCupDesc}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D9CFC7]">
            <h4 className="font-bold text-[#8A5B3D] mb-1">{t.cmtPaddleStepTitle}</h4>
            <p className="text-[#746E68] text-[11px] leading-relaxed">{t.cmtPaddleStepDesc}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D9CFC7]">
            <h4 className="font-bold text-[#8A5B3D] mb-1">{t.postMilkingDipTitle}</h4>
            <p className="text-[#746E68] text-[11px] leading-relaxed">{t.postMilkingDipDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
