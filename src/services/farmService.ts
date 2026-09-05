/**
 * Farm Service — /api/v1/farms
 */

import { apiClient } from './api';
import type {
  FarmResponse,
  FarmCreate,
  FarmUpdate,
  ListResponse,
  HerdSummaryResponse,
} from '../types/api';

export const farmService = {
  async list(skip = 0, limit = 100): Promise<ListResponse<FarmResponse>> {
    return apiClient.get<ListResponse<FarmResponse>>('/api/v1/farms', {
      params: { skip, limit },
    });
  },

  async getById(farmId: string): Promise<FarmResponse> {
    return apiClient.get<FarmResponse>(`/api/v1/farms/${farmId}`);
  },

  async create(data: FarmCreate): Promise<FarmResponse> {
    return apiClient.post<FarmResponse>('/api/v1/farms', data);
  },

  async update(farmId: string, data: FarmUpdate): Promise<FarmResponse> {
    return apiClient.put<FarmResponse>(`/api/v1/farms/${farmId}`, data);
  },

  async delete(farmId: string): Promise<void> {
    return apiClient.delete(`/api/v1/farms/${farmId}`);
  },

  async getSummary(farmId: string): Promise<HerdSummaryResponse> {
    return apiClient.get<HerdSummaryResponse>(`/api/v1/farms/${farmId}/summary`);
  },
};
