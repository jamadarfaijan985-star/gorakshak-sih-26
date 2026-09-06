import { useCallback } from 'react';
import { useApi } from './useApi';
import { animalApiService, type AnimalListParams } from '../services/animalApiService';
import { riskApiService } from '../services/riskApiService';
import type {
  AnimalResponse,
  ForecastResponse,
  SensorReadingResponse,
  RiskScoreResponse,
  ListResponse,
} from '../types/api';

/** List animals for a farm */
export function useAnimalList(params: AnimalListParams | undefined) {
  const fetcher = useCallback(() => {
    if (!params?.farm_id) return Promise.reject(new Error('No farm ID'));
    return animalApiService.list(params);
  }, [
    params?.farm_id,
    params?.species,
    params?.risk_level,
    params?.skip,
    params?.limit,
  ]);
  return useApi<ListResponse<AnimalResponse>>(fetcher, !!params?.farm_id);
}

/** Single animal by ID */
export function useAnimal(animalId: string | undefined) {
  const fetcher = useCallback(() => {
    if (!animalId) return Promise.reject(new Error('No animal ID'));
    return animalApiService.getById(animalId);
  }, [animalId]);
  return useApi<AnimalResponse>(fetcher, !!animalId);
}

/** Sensor history for an animal */
export function useSensorHistory(animalId: string | undefined, limit = 50) {
  const fetcher = useCallback(() => {
    if (!animalId) return Promise.reject(new Error('No animal ID'));
    return animalApiService.getSensorHistory(animalId, 0, limit);
  }, [animalId, limit]);
  return useApi<ListResponse<SensorReadingResponse>>(fetcher, !!animalId);
}

/** Latest risk score for an animal */
export function useCurrentRisk(animalId: string | undefined) {
  const fetcher = useCallback(() => {
    if (!animalId) return Promise.reject(new Error('No animal ID'));
    return animalApiService.getCurrentRisk(animalId);
  }, [animalId]);
  return useApi<RiskScoreResponse>(fetcher, !!animalId);
}

/** Risk history for an animal */
export function useRiskHistory(animalId: string | undefined, limit = 20) {
  const fetcher = useCallback(() => {
    if (!animalId) return Promise.reject(new Error('No animal ID'));
    return animalApiService.getRiskHistory(animalId, 0, limit);
  }, [animalId, limit]);
  return useApi<ListResponse<RiskScoreResponse>>(fetcher, !!animalId);
}

/**
 * 7d/14d XGBoost forecast for an animal.
 * Only fires when animalId is provided and DEMO_MODE is off.
 * Returns null data gracefully when models are not loaded (503) or
 * data is insufficient (422) — these are expected states.
 */
export function useForecast(animalId: string | undefined) {
  const fetcher = useCallback(() => {
    if (!animalId) return Promise.reject(new Error('No animal ID'));
    return riskApiService.forecast(animalId, true);
  }, [animalId]);
  return useApi<ForecastResponse>(fetcher, !!animalId);
}
