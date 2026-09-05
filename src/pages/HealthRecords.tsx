import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { healthService } from '../services/healthService';
import { animalService } from '../services/animalService';
import { HealthRecord } from '../types';
import { FileHeart, Plus, Trash2, Search, Calendar } from 'lucide-react';

export const HealthRecords: React.FC = () => {
  const { t, openModal, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const animals = animalService.getAll();
  const allRecords = healthService.getAll();

  const filteredRecords = allRecords.filter((record) => {
    const animal = animals.find((a) => a.id === record.animalId);
    const text = `${animal?.tag || ''} ${animal?.name || ''} ${record.condition} ${record.treatment} ${record.observation} ${record.veterinarianName}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteHealthConfirm)) {
      healthService.delete(id);
      showToast(t.healthDeletedToast, 'info');
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div id="health-records-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.healthRecords}</h1>
          <p className="text-xs text-[#746E68]">{t.healthRecordsSubtitle}</p>
        </div>
        <button
          onClick={() => openModal('add_health')}
          className="self-start sm:self-auto px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addHealthRecord}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7] flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#746E68]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.healthSearchPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-xs outline-hidden"
          />
        </div>
        <span className="text-[#746E68]">
          {t.showingRecords} <strong>{filteredRecords.length}</strong> {t.showingRecordsCount}
        </span>
      </div>

      {/* List of Records */}
      <div className="space-y-3.5">
        {filteredRecords.map((record) => {
          const animal = animals.find((a) => a.id === record.animalId);
          return (
            <div
              key={record.id}
              className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE9E3] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#EFE9E3] text-[#8A5B3D] rounded-xl">
                    <FileHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#403129]">{record.condition}</h3>
                    <div className="text-[11px] text-[#746E68]">
                      {t.subjectLabel2}: <strong>{animal?.name || t.unknown}</strong> ({record.animalTag || animal?.tag}) • {record.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-semibold text-[#8A5B3D] bg-[#8A5B3D]/10 px-2.5 py-0.5 rounded-full">
                    {record.veterinarianName}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7]/60">
                  <span className="text-[10px] font-bold text-[#746E68] uppercase tracking-wider block mb-1">
                    {t.physicalObservationsLabel}:
                  </span>
                  <p className="text-[#403129] leading-relaxed">{record.observation}</p>
                </div>
                <div className="p-3 bg-[#EFE9E3]/50 rounded-xl border border-[#D9CFC7]/60">
                  <span className="text-[10px] font-bold text-[#8A5B3D] uppercase tracking-wider block mb-1">
                    {t.prescribedInterventionLabel}:
                  </span>
                  <p className="text-[#403129] font-medium leading-relaxed">{record.treatment}</p>
                </div>
              </div>

              {record.veterinaryNotes && (
                <div className="text-xs text-[#746E68] italic pt-1">
                  <strong>{t.notesLabel}:</strong> "{record.veterinaryNotes}"
                </div>
              )}

              {record.followUpDate && (
                <div className="pt-2 border-t border-[#EFE9E3] text-[11px] text-[#8A5B3D] flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t.scheduledFollowUpLabel}: {record.followUpDate}</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="p-8 text-center bg-white border border-[#D9CFC7] rounded-2xl">
            <FileHeart className="w-8 h-8 text-[#8A5B3D] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#403129]">{t.noHealthFoundTitle}</p>
            <p className="text-xs text-[#746E68] mt-1">{t.clickLogVet}</p>
          </div>
        )}
      </div>
    </div>
  );
};
