import React from 'react';
import { useApp } from '../context/AppContext';
import { animalService } from '../services/animalService';
import { alertService } from '../services/alertService';
import { cmtService } from '../services/cmtService';
import { FileSpreadsheet, Printer, Download, IndianRupee, CheckCircle2 } from 'lucide-react';

export const Reports: React.FC = () => {
  const { t, showToast } = useApp();
  const herdStats = animalService.getHerdStats();
  const animals = animalService.getAll();

  const estimatedSavingsINR = (herdStats.highRisk * 12500) + (herdStats.moderateRisk * 4200);

  const handlePrint = () => { window.print(); };

  const handleDownloadReport = () => {
    showToast(t.toastReportDownloaded, 'success');
  };

  return (
    <div id="reports-page" className="space-y-6 print:p-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.reports}</h1>
          <p className="text-xs text-[#746E68]">{t.reportsSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={handlePrint} className="px-3.5 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors">
            <Printer className="w-4 h-4" />
            <span>{t.printReportBtn}</span>
          </button>
          <button onClick={handleDownloadReport} className="px-3.5 py-2 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors">
            <Download className="w-4 h-4" />
            <span>{t.exportSummaryBtn}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9CFC7] shadow-sm space-y-6 text-[#403129]">
        {/* Document Header */}
        <div className="border-b border-[#D9CFC7] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#403129] tracking-tight">{t.appName}</span>
            </div>
            <h2 className="text-base font-bold text-[#746E68] mt-1">{t.reportDocTitle}</h2>
            <p className="text-xs text-[#746E68] mt-0.5">
              {t.reportPeriodLabel}: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[#746E68]">
            <p className="font-bold text-[#403129]">{t.farmClusterName}</p>
            <p>{t.farmClusterLocation}</p>
            <p className="text-[11px]">{t.auditId}: IX-RPT-2026-09</p>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-[#F9F8F6] rounded-2xl border border-[#D9CFC7]">
            <span className="text-[#746E68] font-medium block">{t.totalScreenedHerd}</span>
            <div className="text-2xl font-black text-[#403129] mt-1">
              {herdStats.total} <span className="text-xs font-normal">{t.headsUnit}</span>
            </div>
            <span className="text-[11px] text-[#746E68] mt-1 block">
              {herdStats.cows} {t.cowsLabel} / {herdStats.buffaloes} {t.buffaloesPluralLabel}
            </span>
          </div>

          <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200">
            <span className="text-red-700 font-medium block">{t.highMastitisRisk}</span>
            <div className="text-2xl font-black text-red-600 mt-1">
              {herdStats.highRisk} <span className="text-xs font-normal text-red-700">{t.headsUnit}</span>
            </div>
            <span className="text-[11px] text-red-700 mt-1 block">{t.requireCmtConfirmation}</span>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
            <span className="text-amber-800 font-medium block">{t.moderateRiskWatch}</span>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {herdStats.moderateRisk} <span className="text-xs font-normal text-amber-800">{t.headsUnit}</span>
            </div>
            <span className="text-[11px] text-amber-700 mt-1 block">{t.biomarkerTrendDeviations}</span>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <span className="text-emerald-800 font-medium block">{t.estMilkLossSaved}</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              ₹{estimatedSavingsINR.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">{t.via7to14Detection}</span>
          </div>
        </div>

        {/* Priority Action Table */}
        <div>
          <h3 className="font-bold text-sm text-[#403129] mb-2 uppercase tracking-wide">
            {t.highPriorityTableTitle}
          </h3>
          <div className="border border-[#D9CFC7] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#EFE9E3] text-[#403129] font-bold">
                <tr>
                  <th className="p-2.5">{t.tableTag}</th>
                  <th className="p-2.5">{t.tableName}</th>
                  <th className="p-2.5">{t.tableSpecies}</th>
                  <th className="p-2.5">{t.tableRiskScore}</th>
                  <th className="p-2.5">{t.tableDeviationFactors}</th>
                  <th className="p-2.5">{t.tablePrescribedAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E3]">
                {animals
                  .filter((a) => a.riskScore > 50)
                  .map((animal) => (
                    <tr key={animal.id} className="hover:bg-[#F9F8F6]">
                      <td className="p-2.5 font-mono font-bold text-[#403129]">{animal.tag}</td>
                      <td className="p-2.5 font-bold">{animal.name}</td>
                      <td className="p-2.5">{animal.species === 'cow' ? t.cow : t.buffalo}</td>
                      <td className="p-2.5">
                        <span className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                          animal.riskScore > 75 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {animal.riskScore}/100
                        </span>
                      </td>
                      <td className="p-2.5 text-[#746E68] text-[11px] max-w-xs">
                        {animal.riskFactors.slice(0, 2).join('; ')}
                      </td>
                      <td className="p-2.5 font-semibold text-[#8A5B3D]">
                        {animal.riskScore > 75 ? t.action4QuarterCmt : t.actionObserveRumination}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Field Recommendations */}
        <div className="p-4 bg-[#EFE9E3]/50 rounded-2xl border border-[#D9CFC7] text-xs space-y-2">
          <h4 className="font-bold text-[#403129] uppercase tracking-wide">
            {t.vetRecommendationsTitle}:
          </h4>
          <ul className="space-y-1.5 text-[#403129]">
            {[t.reportRecommendation1, t.reportRecommendation2, t.reportRecommendation3].map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footnote */}
        <div className="pt-4 border-t border-[#D9CFC7] text-[10px] text-[#746E68] flex items-center justify-between">
          <span>{t.reportFootnote}</span>
          <span>{t.reportFootnoteRight}</span>
        </div>
      </div>
    </div>
  );
};
