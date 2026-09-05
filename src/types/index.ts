export type Species = 'cow' | 'buffalo';

export type RiskLevel = 'no_risk' | 'low' | 'moderate' | 'high';

export type HealthStatus = 'healthy' | 'monitored' | 'suspected' | 'clinical';

export type SensorLabel = 'Measured' | 'AI-Inferred' | 'Estimated';

export type FarmMode = 'low_resource' | 'connected';

export interface SensorDataPoint {
  timestamp: string;
  // DS18B20: Surface / Skin Temperature (NOT core body temp)
  surfaceTemp: number; // in Celsius
  surfaceTempLabel: 'Measured';
  
  // MPU6050: 3-axis accelerometer and gyro for neck & head movement
  activityScore: number; // 0-100 activity index
  movementLabel: 'Measured';
  
  // MAX9814: Acoustic microphone on collar analyzed by ML audio inference
  ruminationMinutes: number; // daily or rolling rumination in minutes
  ruminationLabel: 'AI-Inferred'; // AI infers rumination from chewing acoustics
  chewingIntensity: number; // acoustic RMS amplitude
  
  // SHT31-D: Barn ambient temperature & relative humidity
  ambientTemp: number;
  humidity: number;
  thi: number; // Temperature-Humidity Index (THI)
  thiLabel: 'Estimated';
}

export interface Animal {
  id: string;
  tag: string;
  name: string;
  species: Species;
  breed: string;
  ageYears: number;
  sex: 'Female';
  lactationNumber: number;
  daysInMilk: number;
  avgDailyYieldLiters: number;
  farm: string;
  image: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskTrend: 'rising' | 'stable' | 'declining';
  healthStatus: HealthStatus;
  collarId?: string;
  lastUpdated: string;
  riskFactors: string[];
  baselineSurfaceTemp: number; // animal-specific baseline °C
  baselineRuminationMinutes: number; // animal-specific baseline
  baselineActivityScore: number;
  currentSensors: SensorDataPoint;
}

export interface MilkRecord {
  id: string;
  animalId: string;
  animalTag?: string;
  date: string;
  milkYield: number; // Liters
  milkTemperature: number; // °C
  electricalConductivity?: number; // mS/cm (connected mode)
  pH?: number; // (connected mode)
  scc?: number; // Somatic Cell Count in x10³ cells/mL (lab or rapid test)
  notes?: string;
  source: 'manual' | 'automated_system' | 'lab_report';
}

export type CMTQuarterResult = 'negative' | 'trace' | '1+' | '2+' | '3+';

export interface CMTRecord {
  id: string;
  animalId: string;
  animalTag?: string;
  date: string;
  leftFront: CMTQuarterResult;
  rightFront: CMTQuarterResult;
  leftRear: CMTQuarterResult;
  rightRear: CMTQuarterResult;
  overallResult: 'Negative' | 'Trace' | 'Subclinical Suspect (1+ / 2+)' | 'Strong Clinical (3+)';
  reagentLot?: string;
  testerName: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  animalTag?: string;
  date: string;
  observation: string;
  condition: string;
  treatment: string;
  veterinaryNotes: string;
  followUpDate?: string;
  veterinarianName: string;
}

export interface UdderAnalysisResult {
  id: string;
  animalId: string;
  imageUrl: string;
  timestamp: string;
  possibleSwelling: { detected: boolean; severity: 'None' | 'Mild' | 'Moderate' | 'Pronounced' };
  possibleRedness: { detected: boolean; severity: 'None' | 'Mild' | 'Moderate' | 'High' };
  visibleAsymmetry: { detected: boolean; severity: 'None' | 'Minor' | 'Notable' | 'Marked' };
  riskLevel: RiskLevel;
  confidenceScore: number; // e.g. 84%
  observations: string[];
  recommendedNextSteps: string[];
  disclaimer: string;
}

export type DeviceConnectionStatus = 'Connected' | 'Weak Connection' | 'Offline';

export interface Device {
  id: string;
  type?: string;
  deviceType: 'GoDrishti Smart Collar v2' | 'Barn SHT31-D Ambient Node' | 'Handheld Udder Scanner' | string;
  assignedAnimalId?: string;
  assignedAnimalName?: string;
  batteryLevel: number; // percentage
  connectionStatus: DeviceConnectionStatus;
  lastSync: string;
  firmware?: string;
  firmwareVersion: string;
  sensors?: string[];
  sensorsInstalled: string[];
}

export type AlertType =
  | 'elevated_risk'
  | 'reduced_activity'
  | 'behaviour_change'
  | 'reduced_rumination'
  | 'temperature_deviation'
  | 'environmental_stress'
  | 'device_offline'
  | 'low_battery'
  | 'missing_data';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'in_review' | 'resolved';

export interface Alert {
  id: string;
  animalId?: string;
  animalTag?: string;
  animalName?: string;
  species?: Species;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  timestamp: string;
  status: AlertStatus;
  resolvedAt?: string;
  actionNotes?: string;
}

export interface FarmLocation {
  id: string;
  name: string;
  region: string;
  state: string;
  lat: number;
  lng: number;
  totalAnimals: number;
  cows: number;
  buffaloes: number;
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
  noRiskCount: number;
  avgRiskScore: number;
  isDemo: true;
}
