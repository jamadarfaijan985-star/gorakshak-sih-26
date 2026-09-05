import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { cmtService } from '../services/cmtService';
import { animalService } from '../services/animalService';
import { CMTRecord } from '../types';
import {
  TestTube2, Plus, Trash2, Search, Filter, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';

export const CMTTests: React.FC = () => {
  const { t, openModal, showToast } = useApp();
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const animals = animalService.getAll();
  const cmtRecords = selectedAnimalId === 'all'
    ? cmtService.getAll()
    : cmtService.getByAnimalId(selectedAnimalId);

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteCmtConfirm)) {
      cmtService.delete(id);
      showToast(t.cmtDeletedToast, 'info');
      setRefreshKey((k) => k + 1);
    }
  };

  const getQuarterColor = (res: string) => {
    switch (res) {
      case 'negative': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'trace':    return 'bg-blue-100 text-blue-800 border-blue-300';
      case '1+':       return 'bg-amber-100 text-amber-800 border-amber-300';
      case '2+':       return 'bg-orange-100 text-orange-800 border-orange-300';
      case '3+':       return 'bg-red-100 text-red-800 border-red-300';
      default:         return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div id="cmt-tests-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.cmtTests}</h1>
          <p className="text-xs text-[#746E68]">{t.cmtSubtitle}</p>
        </div>
        <button
          onClick={() => openModal('add_cmt')}
          className="self-start sm:self-auto px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newCmtTest}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8A5B3D]" />
          <span className="font-semibold text-[#403129]">{t.filterLivestockLabel}:</span>
          <select
            value={selectedAnimalId}
            onChange={(e) => setSelectedAnimalId(e.target.value)}
            className="px-3 py-1.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-lg font-semibold text-[#403129]"
          >
            <option value="all">{t.allHerdRecordsOption} ({cmtService.getAll().length})</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.tag} - {a.name} ({a.species === 'cow' ? t.cow : t.buffalo})
              </option>
            ))}
          </select>
        </div>
        <span className="text-[#746E68]">
          {t.showingLabel} <strong>{cmtRecords.length}</strong> {t.showingPaddleEvals}
        </span>
      </div>

      {/* CMT Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cmtRecords.map((record) => {
          const animal = animals.find((a) => a.id === record.animalId);
          const isNegative = record.overallResult.toLowerCase().includes('negative');

          return (
            <div
              key={record.id}
              className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#403129]">
                        {animal?.name || t.unknown} ({record.animalTag || animal?.tag})
                      </h3>
                      <span className="text-xs">{animal?.species === 'cow' ? '🐄' : '🐃'}</span>
                    </div>
                    <p className="text-[11px] text-[#746E68]">
                      {t.dateLabel}: <strong>{record.date}</strong> • {t.evaluatorLabel}: <strong>{record.testerName}</strong>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isNegative ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {record.overallResult}
                  </span>
                </div>

                {/* CMT 4-Cup Paddle Visual */}
                <div className="bg-[#EFE9E3]/60 p-3 rounded-xl border border-[#D9CFC7]">
                  <div className="text-[11px] font-bold text-[#746E68] mb-2 uppercase tracking-wide text-center">
                    {t.paddleReadingsLabel}:
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-w-xs mx-auto">
                    <div className={`p-2.5 rounded-xl border text-center ${getQuarterColor(record.leftFront)}`}>
                      <div className="text-[10px] opacity-80 uppercase font-semibold">{t.leftFront}</div>
                      <div className="text-sm font-black mt-0.5">{record.leftFront.toUpperCase()}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border text-center ${getQuarterColor(record.rightFront)}`}>
                      <div className="text-[10px] opacity-80 uppercase font-semibold">{t.rightFront}</div>
                      <div className="text-sm font-black mt-0.5">{record.rightFront.toUpperCase()}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border text-center ${getQuarterColor(record.leftRear)}`}>
                      <div className="text-[10px] opacity-80 uppercase font-semibold">{t.leftRear}</div>
                      <div className="text-sm font-black mt-0.5">{record.leftRear.toUpperCase()}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border text-center ${getQuarterColor(record.rightRear)}`}>
                      <div className="text-[10px] opacity-80 uppercase font-semibold">{t.rightRear}</div>
                      <div className="text-sm font-black mt-0.5">{record.rightRear.toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                {record.notes && (
                  <p className="text-xs text-[#746E68] mt-2 italic">
                    {t.noteLabel}: "{record.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#EFE9E3] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#746E68]">
                  {isNegative ? t.normalSomaticRange : t.suspectedSccElevation}
                </span>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cmtRecords.length === 0 && (
        <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl">
          <TestTube2 className="w-8 h-8 text-[#8A5B3D] mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-[#403129]">{t.noCmtFoundTitle}</p>
          <p className="text-xs text-[#746E68] mt-1">{t.cmtEmptyHint}</p>
        </div>
      )}
    </div>
  );
};
