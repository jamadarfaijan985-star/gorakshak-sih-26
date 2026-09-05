/**
 * Animal API Service — /api/v1/animals
 * Named animalApiService to avoid collision with the existing local animalService.ts
 */

import { apiClient } from './api';
import type {
  AnimalResponse,
  AnimalCreate,
  AnimalUpdate,
  SensorReadingResponse,
  RiskScoreResponse,
  ListResponse,
} from '../types/api';

export interface AnimalListParams {
  farm_id: string;
  skip?: number;
  limit?: number;
  species?: 'cow' | 'buffalo';
  risk_level?: 'no_risk' | 'low' | 'moderate' | 'high';
}

export const animalApiService = {
  async list(params: AnimalListParams): Promise<ListResponse<AnimalResponse>> {
    return apiClient.get<ListResponse<AnimalResponse>>('/api/v1/animals', {
      params: {
        farm_id: params.farm_id,
        skip: params.skip ?? 0,
        limit: params.limit ?? 200,
        species: params.species,
        risk_level: params.risk_level,
      },
    });
  },

  async getById(animalId: string): Promise<AnimalResponse> {
    return apiClient.get<AnimalResponse>(`/api/v1/animals/${animalId}`);
  },

  async create(data: AnimalCreate): Promise<AnimalResponse> {
    return apiClient.post<AnimalResponse>('/api/v1/animals', data);
  },

  async update(animalId: string, data: AnimalUpdate): Promise<AnimalResponse> {
    return apiClient.put<AnimalResponse>(`/api/v1/animals/${animalId}`, data);
  },

  async getSensorHistory(
    animalId: string,
    skip = 0,
    limit = 50,
  ): Promise<ListResponse<SensorReadingResponse>> {
    return apiClient.get<ListResponse<SensorReadingResponse>>(
      `/api/v1/animals/${animalId}/sensor-history`,
      { params: { skip, limit } },
    );
  },

  async getCurrentRisk(animalId: string): Promise<RiskScoreResponse> {
    return apiClient.get<RiskScoreResponse>(`/api/v1/animals/${animalId}/risk`);
  },

  async getRiskHistory(
    animalId: string,
    skip = 0,
    limit = 50,
  ): Promise<ListResponse<RiskScoreResponse>> {
    return apiClient.get<ListResponse<RiskScoreResponse>>(
      `/api/v1/animals/${animalId}/risk-history`,
      { params: { skip, limit } },
    );
  },
};
