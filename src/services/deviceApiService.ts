import { apiClient } from './api';

export interface DeviceMappingResponse {
  device_id: string;
  tag_id: string;
  animal_id?: string | null;
  animal_species?: string | null;
  farm_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceStatusResponse {
  device_id: string;
  tag_id: string;
  animal_id: string;
  farm_id: string;
  farm_name?: string | null;
  status: 'connected' | 'stale' | 'offline';
  transport: { mqtt: 'connected' | 'offline'; http_fallback: 'available' | 'unavailable' };
  broker: string;
  topic: string;
  last_seen?: string | null;
  packets_received: number;
  latest_reading?: {
    id?: string;
    recorded_at: string;
    received_at: string;
    surface_temp_c?: number | null;
    ambient_temp_c?: number | null;
    relative_humidity?: number | null;
    activity_raw?: number | null;
    audio_features?: Record<string, unknown> | null;
    rumination_inferred_min?: number | null;
    thi?: number | null;
    source?: string;
  } | null;
  latest_risk?: {
    risk_score_numeric?: number | null;
    risk_level?: string | null;
    computed_at?: string;
  } | null;
}

export const deviceApiService = {
  async register(device_id: string, tag_id: string): Promise<DeviceMappingResponse> {
    return apiClient.post<DeviceMappingResponse>('/api/v1/devices/register', {
      device_id,
      tag_id,
    });
  },
  async getStatus(deviceId: string): Promise<DeviceStatusResponse> {
    return apiClient.get<DeviceStatusResponse>(`/api/v1/devices/${deviceId}/status`);
  },
};