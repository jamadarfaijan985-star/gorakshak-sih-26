/**
 * Data Ingestion Service — /api/v1/ingest
 * Handles sensor batches, manual lab data, and udder image uploads.
 */

import { apiClient } from './api';
import type {
  BatchSensorReadingIngest,
  ManualLabDataCreate,
  UdderImageResponse,
} from '../types/api';

export interface IngestSensorResult {
  created: number;
  total: number;
  errors: unknown[];
  animal_id: string;
}

export interface IngestLabResult {
  id: string;
  animal_id: string;
  created_at: string;
}

export const ingestService = {
  /** POST /api/v1/ingest/sensor */
  async ingestSensor(payload: BatchSensorReadingIngest): Promise<IngestSensorResult> {
    return apiClient.post<IngestSensorResult>('/api/v1/ingest/sensor', payload);
  },

  /**
   * POST /api/v1/ingest/manual-lab
   * Used for milk data, CMT, SCC, pH, EC — all in one endpoint.
   * All fields are optional except animal_id, recorded_at, and data_source.
   */
  async ingestManualLab(data: ManualLabDataCreate): Promise<IngestLabResult> {
    return apiClient.post<IngestLabResult>('/api/v1/ingest/manual-lab', data);
  },

  /**
   * POST /api/v1/ingest/udder-image  (multipart/form-data)
   * Fields: animal_id (string), captured_at (ISO string), file (File)
   */
  async uploadUdderImage(
    animalId: string,
    capturedAt: string,
    file: File,
  ): Promise<UdderImageResponse> {
    const fd = new FormData();
    fd.append('animal_id', animalId);
    fd.append('captured_at', capturedAt);
    fd.append('file', file);
    return apiClient.upload<UdderImageResponse>('/api/v1/ingest/udder-image', fd);
  },
};
