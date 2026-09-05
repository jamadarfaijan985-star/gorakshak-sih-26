import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { deviceService } from '../services/deviceService';
import { animalService } from '../services/animalService';
import { Device, DeviceConnectionStatus } from '../types';
import { Cpu, Battery, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const Devices: React.FC = () => {
  const { t, showToast } = useApp();
  const [devices, setDevices] = useState<Device[]>(deviceService.getAll());
  const [pingingId, setPingingId] = useState<string | null>(null);
  const animals = animalService.getAll();

  const handlePing = (id: string) => {
    setPingingId(id);
    setTimeout(() => {
      deviceService.ping(id);
      setDevices([...deviceService.getAll()]);
      setPingingId(null);
      showToast(`${t.toastDevicePingSuccess} — ${id}`, 'success');
    }, 800);
  };

  const handleToggleStatus = (id: string, current: DeviceConnectionStatus) => {
    const next: DeviceConnectionStatus =
      current === 'Connected' ? 'Weak Connection' : current === 'Weak Connection' ? 'Offline' : 'Connected';
    deviceService.updateStatus(id, next);
    setDevices([...deviceService.getAll()]);
    showToast(`${t.toastDeviceStatus} ${next}`, 'info');
  };

  const getStatusBadge = (status: DeviceConnectionStatus) => {
    switch (status) {
      case 'Connected':     return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Weak Connection': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Offline':       return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  return (
    <div id="devices-page" className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#403129]">{t.devices}</h1>
          <p className="text-xs text-[#746E68]">{t.devicesSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#EFE9E3] text-[#403129] border border-[#D9CFC7]">
            {devices.filter((d) => d.connectionStatus === 'Connected').length} / {devices.length} {t.devicesOnlineCount}
          </span>
        </div>
      </div>

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const animal = animals.find((a) => a.id === device.assignedAnimalId);
          const isPinging = pingingId === device.id;
          const isLowBattery = device.batteryLevel < 25;

          return (
            <div
              key={device.id}
              className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#8A5B3D] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-[#EFE9E3] text-[#8A5B3D] rounded-xl">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm font-mono text-[#403129]">{device.id}</h3>
                      <p className="text-[11px] text-[#746E68]">{device.type || device.deviceType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(device.id, device.connectionStatus)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${getStatusBadge(device.connectionStatus)}`}
                    title="Click to cycle test status"
                  >
                    {device.connectionStatus}
                  </button>
                </div>

                <div className="mt-3 p-2.5 bg-[#F9F8F6] rounded-xl border border-[#D9CFC7]/70 text-xs">
                  <span className="text-[10px] font-bold text-[#746E68] uppercase tracking-wider block mb-0.5">
                    {t.assignedSubjectLabel}:
                  </span>
                  {animal ? (
                    <div className="font-bold text-[#403129]">
                      {animal.name} ({animal.tag}) • {animal.species === 'cow' ? t.cow : t.buffalo}
                    </div>
                  ) : (
                    <div className="text-[#746E68] italic">{t.unassignedSpareNode}</div>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#746E68]">
                    <span className="flex items-center gap-1">
                      <Battery className={`w-3.5 h-3.5 ${isLowBattery ? 'text-red-600' : 'text-[#8A5B3D]'}`} />
                      <span>{t.batteryChargeLabel}</span>
                    </span>
                    <span className={`font-bold ${isLowBattery ? 'text-red-600' : 'text-[#403129]'}`}>
                      {device.batteryLevel}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#EFE9E3] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${device.batteryLevel}%` }}
                      className={`h-full transition-all ${
                        isLowBattery ? 'bg-red-600' : device.batteryLevel < 50 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-[#746E68] space-y-1">
                  <div>
                    {t.firmwareLabel}: <span className="font-mono font-semibold text-[#403129]">{device.firmware || device.firmwareVersion}</span>
                  </div>
                  <div className="line-clamp-1">
                    {t.sensorsLabel}: <span className="text-[#403129] font-medium">{(device.sensors || device.sensorsInstalled || []).join(', ')}</span>
                  </div>
                  <div>
                    {t.lastTelemetrySyncLabel}: <span className="text-[#403129] font-medium">{device.lastSync}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE9E3] flex items-center justify-between text-xs">
                <button
                  onClick={() => handlePing(device.id)}
                  disabled={isPinging || device.connectionStatus === 'Offline'}
                  className="px-3 py-1.5 bg-[#8A5B3D] hover:bg-[#403129] text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? t.pingingLabel : t.pingNodeBtn}</span>
                </button>
                <span className="text-[10px] text-[#746E68]">
                  {t.signalStrengthLabel}: {device.connectionStatus === 'Connected' ? t.signalConnected : t.signalWeak}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
