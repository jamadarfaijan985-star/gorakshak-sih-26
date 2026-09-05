import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { milkService } from '../services/milkService';
import { animalService } from '../services/animalService';
import { env } from '../config/env';
import type { MilkRecord } from '../types';
import {
  Droplets, Plus, Search, Trash2, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';

export const MilkData: React.FC = () => {
  const { t, openModal, showToast, farmMode } = useApp();
  const { activeFarmId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const animals = animalService.getAll();
  const allMilk = milkService.getAll();

  const filteredMilk = allMilk.filter((record) => {
    const animal = animals.find((a) => a.id === record.animalId);
    const text = `${animal?.tag || ''} ${animal?.name || ''} ${record.date} ${record.notes || ''}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteMilkConfirm)) {
      milkService.delete(id);
      showToast(t.milkDeletedToast, 'info');
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div id="milk-data-page" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.milkData}</h1>
          <p className="text-xs text-[#746E68]">{t.milkDataSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {!env.DEMO_MODE && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
              {t.submitsToBackend}
            </span>
          )}
          <button onClick={() => openModal('add_milk')} className="self-start sm:self-auto px-4 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" />
            <span>{t.recordMilk}</span>
          </button>
        </div>
      </div>

      {env.DEMO_MODE && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <span className="font-bold">{t.demoDataLabel}</span>
          <span>{t.milkDemoNotice}</span>
        </div>
      )}

      <div className="bg-white p-3.5 rounded-xl border border-[#D9CFC7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#746E68]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.milkSearchPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-xs outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-[#746E68]">
          <span>{t.showingRecords} <strong>{filteredMilk.length}</strong></span>
          {farmMode === 'connected' ? (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">{t.inlineEcPhMode}</span>
          ) : (
            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">{t.lowResourceModeTag}</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#D9CFC7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EFE9E3] text-[#403129] font-bold border-b border-[#D9CFC7]">
                <th className="p-3">{t.tableAnimal}</th>
                <th className="p-3">{t.tableDate}</th>
                <th className="p-3">{t.tableYield}</th>
                <th className="p-3">{t.tableMilkTemp}</th>
                <th className="p-3">{t.tableEc}</th>
                <th className="p-3">{t.tablePh}</th>
                <th className="p-3">{t.tableScc}</th>
                <th className="p-3">{t.tableNotes}</th>
                <th className="p-3 text-right">{t.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E3]">
              {filteredMilk.map((record) => {
                const animal = animals.find((a) => a.id === record.animalId);
                const isHighSCC = record.scc && record.scc > 300;
                return (
                  <tr key={record.id} className="hover:bg-[#F9F8F6]">
                    <td className="p-3">
                      <div className="font-bold text-[#403129]">{animal?.name || t.unknown}</div>
                      <div className="text-[10px] text-[#746E68] font-mono">{record.animalTag || animal?.tag} ({animal?.species === 'cow' ? t.cow : t.buffalo})</div>
                    </td>
                    <td className="p-3 font-semibold text-[#403129]">{record.date}</td>
                    <td className="p-3 font-extrabold text-[#8A5B3D]">{record.milkYield} L</td>
                    <td className="p-3">{record.milkTemperature ? `${record.milkTemperature}°C` : '—'}</td>
                    <td className="p-3">{record.electricalConductivity || '—'}</td>
                    <td className="p-3">{record.pH || '—'}</td>
                    <td className="p-3">
                      {record.scc ? (
                        <span className={`font-extrabold ${isHighSCC ? 'text-red-700 bg-red-50 px-1.5 py-0.5 rounded' : 'text-emerald-700'}`}>{record.scc}</span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-[11px] text-[#746E68] max-w-xs truncate">{record.notes || '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(record.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMilk.length === 0 && (
          <div className="p-8 text-center text-[#746E68]">
            <Droplets className="w-8 h-8 text-[#8A5B3D] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#403129]">{t.noMilkFoundTitle}</p>
            <p className="text-xs mt-1">{t.clickToRecordMilk}</p>
          </div>
        )}
      </div>
    </div>
  );
};
