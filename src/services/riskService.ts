import { Animal, RiskLevel, Species } from '../types';

export interface RiskAnalysisResult {
  score: number;
  level: RiskLevel;
  contributingFactors: string[];
  recommendations: string[];
}

export const riskService = {
  calculateTHI(ambientTempC: number, relativeHumidityPercent: number): number {
    // Standard National Research Council (NRC) formula for dairy cattle THI
    // THI = 0.8 * T + (RH/100) * (T - 14.4) + 46.4
    const t = ambientTempC;
    const rh = relativeHumidityPercent;
    const thi = 0.8 * t + (rh / 100) * (t - 14.4) + 46.4;
    return parseFloat(thi.toFixed(1));
  },

  calculateRisk(params: {
    species: Species;
    currentSurfaceTemp: number; // DS18B20 skin/surface
    baselineSurfaceTemp: number;
    currentRuminationMin: number; // MAX9814 AI-inferred
    baselineRuminationMin: number;
    currentActivity: number; // MPU6050
    baselineActivity: number;
    ambientTemp: number;
    humidity: number;
    cmtHighestQuarter?: string;
    yieldDropLiters?: number;
  }): RiskAnalysisResult {
    let score = 10; // Baseline healthy score
    const factors: string[] = [];
    const recommendations: string[] = [];

    // 1. Surface Temperature Deviation (DS18B20)
    // Note: Skin temp varies with ambient; elevated skin temp >0.8C above baseline indicates local vascular dilation / inflammation
    const tempDelta = params.currentSurfaceTemp - params.baselineSurfaceTemp;
    if (tempDelta >= 1.2) {
      score += 26;
      factors.push(`Surface skin temperature significantly elevated (+${tempDelta.toFixed(1)}°C over baseline)`);
    } else if (tempDelta >= 0.6) {
      score += 15;
      factors.push(`Mild surface temperature elevation (+${tempDelta.toFixed(1)}°C)`);
    }

    // 2. Rumination Acoustic Inference Deviation (MAX9814)
    // Chewing sound inference drop is an established early biomarker of prodromal systemic discomfort
    const ruminationDrop = params.baselineRuminationMin - params.currentRuminationMin;
    if (ruminationDrop >= 80) {
      score += 28;
      factors.push(`Marked decrease in AI-inferred rumination (-${Math.round(ruminationDrop)} mins/day)`);
    } else if (ruminationDrop >= 45) {
      score += 16;
      factors.push(`Moderate rumination acoustic drop (-${Math.round(ruminationDrop)} mins/day)`);
    }

    // 3. Activity / Restlessness Deviation (MPU6050)
    const activityRatio = params.currentActivity / (params.baselineActivity || 1);
    if (activityRatio < 0.65) {
      score += 18;
      factors.push(`Reduced physical activity index (-${Math.round((1 - activityRatio) * 100)}% from normal moving average)`);
    } else if (activityRatio > 1.4) {
      score += 12;
      factors.push(`Restless stepping / postural shifts (+${Math.round((activityRatio - 1) * 100)}% activity surge)`);
    }

    // 4. Environmental Stress (THI from SHT31-D)
    const thi = this.calculateTHI(params.ambientTemp, params.humidity);
    if (thi >= 78) {
      score += 10;
      factors.push(`High barn thermal stress (THI ${thi}) increasing physiological susceptibility`);
    }

    // 5. Species-Specific Calibration
    if (params.species === 'buffalo') {
      // Buffaloes have higher skin pigmentation and thicker epidermis, causing lower baseline surface heat emission
      if (tempDelta > 0.8) {
        score += 6;
        factors.push('Buffalo-specific epidermal adjustment: skin temperature surge is clinically notable');
      }
    }

    // 6. CMT input if present
    if (params.cmtHighestQuarter === '3+') {
      score += 30;
      factors.push('Confirmatory California Mastitis Test indicates 3+ strong gel formation');
    } else if (params.cmtHighestQuarter === '2+') {
      score += 20;
      factors.push('CMT reveals 2+ distinct gel formation (subclinical threshold)');
    } else if (params.cmtHighestQuarter === '1+') {
      score += 10;
      factors.push('CMT indicates 1+ mild precipitate');
    }

    // 7. Milk yield drop if recorded
    if (params.yieldDropLiters && params.yieldDropLiters >= 1.5) {
      score += 14;
      factors.push(`Milk production declined by ${params.yieldDropLiters.toFixed(1)} L`);
    }

    // Clamp score between 0 and 100
    score = Math.min(100, Math.max(0, Math.round(score)));

    // Categorize
    let level: RiskLevel = 'no_risk';
    if (score >= 76) {
      level = 'high';
      recommendations.push('Immediate targeted quarter-by-quarter CMT confirmation recommended');
      recommendations.push('Isolate milking sequence to avoid herd cross-contamination');
      recommendations.push('Request veterinary examination before clinical progression');
      recommendations.push('Apply post-milking barrier antiseptic teat dip');
    } else if (score >= 51) {
      level = 'moderate';
      recommendations.push('Increase sensor sampling frequency & observe next milking letdown');
      recommendations.push('Conduct on-farm CMT test within 24 hours');
      recommendations.push('Ensure dry bedding and assess udder hygiene score');
    } else if (score >= 26) {
      level = 'low';
      recommendations.push('Continue continuous collar screening');
      recommendations.push('Monitor rumination recovery over next 12 hours');
    } else {
      level = 'no_risk';
      recommendations.push('Routine preventive management & regular sanitation');
    }

    return {
      score,
      level,
      contributingFactors: factors.length > 0 ? factors : ['All multimodal sensor parameters within normal physiological limits'],
      recommendations,
    };
  },
};
