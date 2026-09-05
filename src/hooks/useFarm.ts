import { useCallback } from 'react';
import { useApi } from './useApi';
import { farmService } from '../services/farmService';
import type { FarmResponse, HerdSummaryResponse, ListResponse } from '../types/api';

/** List all farms the user has access to */
export function useFarms() {
  const fetcher = useCallback(() => farmService.list(), []);
  return useApi<ListResponse<FarmResponse>>(fetcher);
}

/** Single farm by ID */
export function useFarm(farmId: string | undefined) {
  const fetcher = useCallback(() => {
    if (!farmId) return Promise.reject(new Error('No farm ID'));
    return farmService.getById(farmId);
  }, [farmId]);
  return useApi<FarmResponse>(fetcher, !!farmId);
}

/** Herd summary for a farm */
export function useHerdSummary(farmId: string | undefined) {
  const fetcher = useCallback(() => {
    if (!farmId) return Promise.reject(new Error('No farm ID'));
    return farmService.getSummary(farmId);
  }, [farmId]);
  return useApi<HerdSummaryResponse>(fetcher, !!farmId);
}
