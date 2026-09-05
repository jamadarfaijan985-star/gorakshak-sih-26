/**
 * TypeScript types that mirror the FastAPI backend Pydantic schemas exactly.
 * Source of truth: bankend/sih-backend/app/schemas/schemas.py
 * DO NOT invent field names — every field here maps 1-to-1 with the backend.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;              // UUID as string
  name: string;
  email: string;
  phone?: string | null;
  role: 'farmer' | 'vet' | 'admin';
  preferred_language?: string;
  farm_id?: string | null; // UUID as string, or null
  created_at: string;      // ISO datetime
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: UserResponse;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'farmer' | 'vet' | 'admin';
  farm_id?: string;
  preferred_language?: string;
}

// ─── Farms ───────────────────────────────────────────────────────────────────

export interface FarmResponse {
  id: string;
  name: string;
  code: string;
  location_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface FarmCreate {
  name: string;
  code: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
}

export interface FarmUpdate {
  name?: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Animals ─────────────────────────────────────────────────────────────────

export interface AnimalResponse {
  id: string;
  farm_id: string;
  tag_id: string;
  species: 'cow' | 'buffalo';
  breed?: string | null;
  age_months?: number | null;
  lactation_number?: number | null;
  pregnancy_status?: string | null;
  previous_mastitis?: boolean | null;
  disease_history?: Record<string, unknown> | null;
  vaccination_history?: Record<string, unknown> | null;
  treatment_history?: Record<string, unknown> | null;
  comorbidities?: string[] | null;
  status: 'active' | 'culled' | 'sold' | 'dead';
  created_at: string;
  updated_at: string;
}

export interface AnimalCreate {
  farm_id: string;
  tag_id: string;
  species: 'cow' | 'buffalo';
  breed?: string;
  age_months?: number;
  lactation_number?: number;
  pregnancy_status?: string;
  previous_mastitis?: boolean;
  disease_history?: Record<string, unknown>;
  vaccination_history?: Record<string, unknown>;
  treatment_history?: Record<string, unknown>;
  comorbidities?: string[];
  status?: string;
}

export interface AnimalUpdate {
  breed?: string;
  age_months?: number;
  lactation_number?: number;
  pregnancy_status?: string;
  previous_mastitis?: boolean;
  disease_history?: Record<string, unknown>;
  vaccination_history?: Record<string, unknown>;
  treatment_history?: Record<string, unknown>;
  comorbidities?: string[];
  status?: string;
}

// ─── Sensor Readings ─────────────────────────────────────────────────────────

export interface SensorReadingResponse {
  id: string;
  animal_id: string;
  recorded_at: string;
  received_at: string;
  activity_raw?: number | null;
  surface_temp_c?: number | null;
  ambient_temp_c?: number | null;
  relative_humidity?: number | null;
  audio_features?: Record<string, unknown> | null;
  rumination_inferred_min?: number | null;
  thi?: number | null;
  source: string;
}

export interface BatchSensorReadingIngest {
  device_id?: string;
  animal_id?: string;
  tag_id?: string;
  source?: string;
  readings: SensorReadingCreate[];
}

export interface SensorReadingCreate {
  recorded_at: string;
  activity_raw?: number;
  surface_temp_c?: number;
  ambient_temp_c?: number;
  relative_humidity?: number;
  audio_features?: Record<string, unknown>;
  rumination_inferred_min?: number;
  source?: string;
}

// ─── Manual Lab Data ─────────────────────────────────────────────────────────

export interface ManualLabDataCreate {
  animal_id: string;
  recorded_at: string;
  milk_yield_l?: number;
  milk_temp_c?: number;
  udder_temp_c?: number;
  cmt_result?: string;   // 'negative' | 'trace' | '1+' | '2+' | '3+'
  scc_value?: number;
  scc_unit?: string;
  milk_ph?: number;
  milk_ec?: number;
  data_source: string;   // 'manual' | 'lab' | 'cooperative' | 'vet' | 'farm_equipment'
}

export interface ManualLabDataResponse {
  id: string;
  animal_id: string;
  recorded_at: string;
  milk_yield_l?: number | null;
  milk_temp_c?: number | null;
  udder_temp_c?: number | null;
  cmt_result?: string | null;
  scc_value?: number | null;
  scc_unit?: string | null;
  milk_ph?: number | null;
  milk_ec?: number | null;
  data_source: string;
  entered_by_user_id?: string | null;
  created_at: string;
}

// ─── Udder Images ─────────────────────────────────────────────────────────────

export interface CVResult {
  swelling?: number | null;
  asymmetry?: number | null;
  redness?: number | null;
  lesions?: number | null;
  discharge?: number | null;
  confidence?: number | null;
}

export interface UdderImageResponse {
  id: string;
  animal_id: string;
  captured_at: string;
  image_url: string;
  cv_result?: CVResult | null;
  cv_model_version?: string | null;
  reviewed_by_vet: boolean;
  created_at: string;
}

// ─── Risk ─────────────────────────────────────────────────────────────────────

export interface ContributingFactor {
  factor: string;
  weight: number;
}

export interface RiskScoreResponse {
  id: string;
  animal_id: string;
  computed_at: string;
  window_start: string;
  window_end: string;
  risk_level: 'no_risk' | 'low' | 'moderate' | 'high';
  risk_score_numeric?: number | null;
  contributing_factors: ContributingFactor[];
  recommended_action?: string | null;
  model_version: string;
  is_forecast: boolean;
  forecast_horizon_days?: number | null;
}

export interface RiskComputeRequest {
  animal_id?: string;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface AlertResponse {
  id: string;
  animal_id: string;
  risk_score_id?: string | null;
  triggered_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledged_by?: string | null;
  resolved_at?: string | null;
}

export interface AlertUpdate {
  status?: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledged_by?: string;
}

// ─── Herd Summary ────────────────────────────────────────────────────────────

export interface HerdSummaryResponse {
  farm_id: string;
  total_animals: number;
  animals_by_species: { cow: number; buffalo: number };
  risk_distribution: {
    no_risk: number;
    low: number;
    moderate: number;
    high: number;
  };
  open_alerts_count: number;
  last_updated: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  skip: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
