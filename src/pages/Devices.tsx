import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, RefreshCw, Wifi, WifiOff, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { env } from '../config/env';
import { parseBackendDate } from '../utils/date';

const DEVICE_ID = 'ESP8266-COW-001';

function ageLabel(timestamp?: string | null) {
  if (!timestamp) return 'No telemetry received';
  const age = Math.max(0, Math.floor((Date.now() - parseBackendDate(timestamp).getTime()) / 1000));
  return `${age} seconds ago`;
}

function statusStyle(status?: string) {
  if (status === 'connected') return { label: 'Connected', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (status === 'stale') return { label: 'Stale', icon: AlertTriangle, className: 'bg-amber-100 text-amber-900 border-amber-300' };
  return { label: 'Offline', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-300' };
}

export const Devices: React.FC = () => {
  const { showToast } = useApp();
  const { activeFarmId } = useAuth();
  const isLive = !env.DEMO_MODE;
  const { data, error, isLoading, refetch } = useDeviceStatus(isLive ? DEVICE_ID : undefined, 5000);
  const status = statusStyle(data?.status);
  const StatusIcon = status.icon;
  const latest = data?.latest_reading;
  const mic = latest?.audio_features?.mic_average;

  const testConnection = async () => {
    await refetch();
    showToast(data?.status === 'connected'
      ? 'Backend ✓ · MQTT ✓ · Device mapping ✓ · Recent telemetry ✓'
      : 'Backend ✓ · Device mapping ✓ · Recent telemetry failed', data?.status === 'connected' ? 'success' : 'error');
  };

  return (
    <div id="devices-page" className="space-y-5">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9CFC7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#403129]">DEVICE CONNECTION CENTER</h1>
          <p className="text-xs text-[#746E68]">Real MQTT telemetry and backend connection diagnostics.</p>
        </div>
        {!env.DEMO_MODE && <span className="text-xs font-bold text-[#746E68]">5-second status refresh</span>}
      </div>

      {env.DEMO_MODE ? (
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50 text-sm text-amber-900">DEMO MODE: device telemetry is disabled. Set VITE_DEMO_MODE=false for the real device.</div>
      ) : (
        <div className="bg-white border border-[#D9CFC7] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-3"><div className="p-3 bg-[#EFE9E3] text-[#8A5B3D] rounded-xl"><Cpu className="w-6 h-6" /></div><div><h2 className="font-extrabold font-mono text-[#403129]">{DEVICE_ID}</h2><p className="text-xs text-[#746E68]">MQTT sensor node</p></div></div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${status.className}`}><StatusIcon className="w-4 h-4" />{status.label}</span>
          </div>
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">Backend connection unavailable: {error}</div>}
          {!error && data?.transport.mqtt !== 'connected' && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">MQTT bridge disconnected</div>}
          {!error && data?.transport.mqtt === 'connected' && !data.last_seen && <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">No live telemetry received</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div><span className="text-[#746E68]">Mapped Animal</span><div className="font-bold text-[#403129]">{data?.tag_id ?? '—'}</div></div>
            <div><span className="text-[#746E68]">Farm</span><div className="font-bold text-[#403129]">{data?.farm_name ?? '—'}</div></div>
            <div><span className="text-[#746E68]">MQTT Broker</span><div className="font-mono font-bold text-[#403129]">{data?.broker ?? '10.250.43.53:1884'}</div></div>
            <div><span className="text-[#746E68]">Packets Received</span><div className="font-bold text-[#403129]">{data?.packets_received ?? '—'}</div></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#F9F8F6] border border-[#D9CFC7] text-xs">
            <div><span className="text-[#746E68]">Topic</span><div className="font-mono break-all text-[#403129]">{data?.topic ?? `godrishti/${DEVICE_ID}/sensors`}</div></div>
            <div><span className="text-[#746E68]">Last Telemetry</span><div className="font-bold text-[#403129]">{ageLabel(data?.last_seen)}</div></div>
            <div><span className="text-[#746E68]">Transport: MQTT</span><div className="font-bold">{data?.transport.mqtt === 'connected' ? '🟢 Connected' : '🔴 Offline'}</div></div>
            <div><span className="text-[#746E68]">Fallback: HTTP/Wi-Fi</span><div className="font-bold">{data?.transport.http_fallback === 'available' ? '🟢 Available' : '🔴 Unavailable'}</div></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div><span className="text-[#746E68]">Surface Temp</span><div className="font-bold">{latest?.surface_temp_c ?? '—'} °C</div></div>
            <div><span className="text-[#746E68]">Ambient Temp</span><div className="font-bold">{latest?.ambient_temp_c ?? '—'} °C</div></div>
            <div><span className="text-[#746E68]">Humidity</span><div className="font-bold">{latest?.relative_humidity ?? '—'} %</div></div>
            <div><span className="text-[#746E68]">Activity</span><div className="font-bold">{latest?.activity_raw ?? '—'}</div></div>
            <div><span className="text-[#746E68]">Acoustic</span><div className="font-bold">{typeof mic === 'number' ? mic : '—'}</div></div>
            <div><span className="text-[#746E68]">Rumination</span><div className="font-bold">{latest?.rumination_inferred_min ?? '—'} min</div></div>
          </div>
          <div className="text-xs text-[#746E68]">Current Risk Screening: <strong className="text-[#403129]">{data?.latest_risk?.risk_score_numeric != null ? `${(data.latest_risk.risk_score_numeric * 100).toFixed(0)}/100` : '—'}</strong> · <strong className="text-emerald-700">{data?.latest_risk?.risk_level === 'no_risk' ? 'Below Alert Threshold' : data?.latest_risk?.risk_level ?? 'No risk score yet'}</strong></div>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EFE9E3]">
            <button onClick={testConnection} disabled={isLoading} className="px-3 py-2 bg-[#403129] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" />Test Connection</button>
            <button onClick={refetch} disabled={isLoading} className="px-3 py-2 bg-[#EFE9E3] text-[#403129] rounded-xl text-xs font-bold flex items-center gap-1.5"><RefreshCw className={isLoading ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />Refresh Status</button>
            <Link to={`/animals/${data?.animal_id ?? ''}`} className="px-3 py-2 bg-[#8A5B3D] text-white rounded-xl text-xs font-bold">View Live Data</Link>
            <button onClick={() => showToast('Disconnect is disabled for the fixed production device mapping.', 'info')} className="px-3 py-2 bg-red-50 text-red-800 rounded-xl text-xs font-bold flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5" />Disconnect Device</button>
          </div>
        </div>
      )}
    </div>
  );
};
