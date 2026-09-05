import { useCallback } from 'react';
import { useApi } from './useApi';
import { riskApiService, type AlertListParams } from '../services/riskApiService';
import type { AlertResponse, ListResponse } from '../types/api';

export function useAlerts(params: AlertListParams | undefined) {
  const fetcher = useCallback(() => {
    if (!params?.farm_id) return Promise.reject(new Error('No farm ID'));
    return riskApiService.listAlerts(params);
  }, [params?.farm_id, params?.status, params?.severity, params?.skip, params?.limit]);

  return useApi<ListResponse<AlertResponse>>(fetcher, !!params?.farm_id);
}
