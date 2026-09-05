/**
 * Risk & Alert API Service
 * POST /api/v1/risk/compute
 * GET  /api/v1/risk/farms/{farm_id}/alerts
 * PATCH /api/v1/risk/alerts/{alert_id}
 */

import { apiClient } from './api';
import type {
  AlertResponse,
  AlertUpdate,
  ListResponse,
  RiskComputeRequest,
} from '../types/api';

export interface RiskComputeResult {
  total_computed: number;
  alerts_generated: number;
  results: unknown[];
}

export interface AlertListParams {
  farm_id: string;
  skip?: number;
  limit?: number;
  status?: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const riskApiService = {
  /** Trigger risk computation for one animal or all active animals */
  async compute(request: RiskComputeRequest): Promise<RiskComputeResult> {
    return apiClient.post<RiskComputeResult>('/api/v1/risk/compute', request);
  },

  /** List alerts for a farm */
  async listAlerts(params: AlertListParams): Promise<ListResponse<AlertResponse>> {
    return apiClient.get<ListResponse<AlertResponse>>(
      `/api/v1/risk/farms/${params.farm_id}/alerts`,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
          status: params.status,
          severity: params.severity,
        },
      },
    );
  },

  /** Acknowledge / resolve / mark false-positive an alert */
  async updateAlert(alertId: string, update: AlertUpdate): Promise<AlertResponse> {
    return apiClient.patch<AlertResponse>(`/api/v1/risk/alerts/${alertId}`, update);
  },
};
