import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClusterInfo {
  id: string;
  name: string;
  region: string;
  state: string;
  cows: number;
  buffaloes: number;
  avgRisk: number;
  highRiskCount: number;
  ambientTemp: number;
  humidity: number;
  thi: number;
  status: 'Normal' | 'Elevated THI' | 'Mastitis Alert';
}

export const FarmMap: React.FC = () => {
  const { t } = useApp();
  const [selectedClusterId, setSelectedClusterId] = useState<string>('anand');

  const clusters: ClusterInfo[] = [
    { id: 'anand', name: 'Anand Dairy Co-op Cluster', region: 'Western Zone', state: 'Gujarat', cows: 18, buffaloes: 12, avgRisk: 42, highRiskCount: 2, ambientTemp: 31.5, humidity: 65, thi: 79.4, status: 'Mastitis Alert' },
    { id: 'pune', name: 'Pune Dairy Belt Shed #4', region: 'Western Ghats Zone', state: 'Maharashtra', cows: 14, buffaloes: 8, avgRisk: 28, highRiskCount: 0, ambientTemp: 28.2, humidity: 58, thi: 74.8, status: 'Normal' },
    { id: 'karnal', name: 'Karnal Livestock Research Station', region: 'Northern Indo-Gangetic Plain', state: 'Haryana', cows: 24, buffaloes: 16, avgRisk: 55, highRiskCount: 3, ambientTemp: 34.0, humidity: 72, thi: 83.6, status: 'Elevated THI' },
    { id: 'mehsana', name: 'Mehsana Buffalo Research Farm', region: 'North Gujarat Semi-Arid', state: 'Gujarat', cows: 6, buffaloes: 22, avgRisk: 34, highRiskCount: 1, ambientTemp: 32.8, humidity: 52, thi: 78.1, status: 'Normal' },
  ];

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];

  return (
    <div id="farm-map-page" className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#403129]">{t.farmMap}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {t.demoDataLabel}
            </span>
          </div>
          <p className="text-xs text-[#746E68] mt-0.5">{t.farmMapGeographicDesc}</p>
        </div>
        <span className="text-xs text-[#746E68] bg-[#EFE9E3] px-3 py-1.5 rounded-xl font-semibold">
          {t.coopHubsMapped}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#403129]">{t.indianDairyClusters}</h3>
            <span className="text-xs text-[#746E68]">{t.clickClusterHint}</span>
          </div>

          <div className="relative h-80 sm:h-96 bg-[#F9F8F6] rounded-2xl border border-[#D9CFC7] p-4 flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#8A5B3D_1px,transparent_1px)] [background-size:16px_16px]" />

            {[
              { id: 'karnal', pos: 'top-12 left-1/3 sm:left-1/2 -translate-x-1/2', dot: 'bg-red-600 animate-ping', label: 'Karnal, HR', sub: 'THI: 83.6 (Stress)' },
              { id: 'mehsana', pos: 'top-36 left-12 sm:left-24', dot: 'bg-emerald-500', label: 'Mehsana, GJ', sub: '28 Buffaloes' },
              { id: 'anand', pos: 'top-48 left-20 sm:left-36', dot: 'bg-amber-500 animate-pulse', label: 'Anand, GJ', sub: 'Primary Co-op Hub' },
              { id: 'pune', pos: 'top-64 left-28 sm:left-48', dot: 'bg-emerald-500', label: 'Pune, MH', sub: 'Low Risk (28/100)' },
            ].map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedClusterId(node.id)}
                className={`absolute ${node.pos} p-2.5 rounded-2xl border transition-all shadow-md flex items-center gap-2 z-10 ${
                  selectedClusterId === node.id
                    ? 'bg-[#403129] text-white border-[#403129] scale-105 ring-2 ring-[#8A5B3D]'
                    : 'bg-white text-[#403129] border-[#D9CFC7] hover:border-[#8A5B3D]'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${node.dot}`} />
                <div className="text-left">
                  <div className="font-bold text-xs">{node.label}</div>
                  <div className="text-[10px] opacity-80">{node.sub}</div>
                </div>
              </button>
            ))}

            <div className="mt-auto relative z-10 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-[#D9CFC7] text-[11px] text-[#746E68] flex items-center justify-between">
              <span>{t.nationalTelemetryNetwork}</span>
              <span className="font-semibold text-[#8A5B3D]">{t.simulatedGeoNodes}</span>
            </div>
          </div>
        </div>

        {/* Cluster Deep Dive */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#8A5B3D] uppercase tracking-wide">
                {t.clusterProfileLabel}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedCluster.status === 'Normal' ? 'bg-emerald-100 text-emerald-800' :
                selectedCluster.status === 'Elevated THI' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-800'
              }`}>
                {selectedCluster.status}
              </span>
            </div>

            <h3 className="font-black text-base text-[#403129]">{selectedCluster.name}</h3>
            <p className="text-xs text-[#746E68] mt-0.5">{selectedCluster.region} • {selectedCluster.state}</p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="p-3 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7] flex items-center justify-between">
                <span className="text-[#746E68]">{t.livestockCensusLabel}:</span>
                <span className="font-bold text-[#403129]">
                  {selectedCluster.cows} {t.cowsLabel} / {selectedCluster.buffaloes} {t.buffaloesPluralLabel}
                </span>
              </div>

              <div className="p-3 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7] flex items-center justify-between">
                <span className="text-[#746E68]">{t.clusterMeanRiskLabel}:</span>
                <span className={`font-black ${selectedCluster.avgRisk > 50 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {selectedCluster.avgRisk}/100
                </span>
              </div>

              <div className="p-3 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7] flex items-center justify-between">
                <span className="text-[#746E68]">{t.priorityFlaggedHeadsLabel}:</span>
                <span className="font-bold text-red-600">{selectedCluster.highRiskCount} {t.headsLabel}</span>
              </div>

              <div className="p-3 bg-[#EFE9E3]/60 rounded-xl border border-[#D9CFC7] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#403129]">{t.barnClimateLabel}:</span>
                  <span className="font-bold text-[#8A5B3D]">THI {selectedCluster.thi}</span>
                </div>
                <div className="text-[11px] text-[#746E68] flex justify-between">
                  <span>{t.tempLabel}: {selectedCluster.ambientTemp}°C</span>
                  <span>{t.rhLabel}: {selectedCluster.humidity}%</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/animals"
            className="mt-4 w-full py-2.5 bg-[#8A5B3D] hover:bg-[#403129] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{t.viewClusterAnimals}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
