/**
 * Udder service — demo mode only.
 *
 * In LIVE mode, udder image analysis is handled end-to-end by the backend:
 *   POST /api/v1/ingest/udder-image  →  saves file, triggers YOLO inference
 *                                       asynchronously, writes cv_result back.
 *
 * The UdderAnalysis page calls ingestService.uploadUdderImage() in live mode
 * and the backend's YOLO model (Cow: YOLOv8-classify, Buffalo: YOLOv8-segment)
 * populates cv_result once inference completes.
 *
 * This service provides demo-mode results using client-side image heuristics:
 * - Canvas API pixel analysis for redness, brightness, asymmetry signals
 * - Produces realistic, image-driven predictions (not hardcoded 0)
 */

import { UdderAnalysisResult, RiskLevel } from '../types';

export type { UdderAnalysisResult };

export const MANDATORY_UDDER_DISCLAIMER =
  'This visual assessment is supportive only and is not a standalone veterinary diagnosis.';

// ---------------------------------------------------------------------------
// Canvas-based image feature extraction
// ---------------------------------------------------------------------------

interface ImageFeatures {
  avgRed: number;
  avgGreen: number;
  avgBlue: number;
  brightness: number;
  rednessRatio: number;
  pixelVariance: number;
  lrAsymmetry: number;
  avgSaturation: number;
  darkPixelRatio: number;
}

function extractImageFeatures(imageUrl: string): Promise<ImageFeatures> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const SIZE = 120;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
        const total = SIZE * SIZE;
        let sumR = 0, sumG = 0, sumB = 0, sumL = 0, sumRH = 0, sumSat = 0, darkPx = 0;
        const brightnessArr: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          sumR += r; sumG += g; sumB += b;
          const bright = (r + g + b) / (3 * 255);
          brightnessArr.push(bright);
          const col = (i / 4) % SIZE;
          if (col < SIZE / 2) sumL += bright; else sumRH += bright;
          const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
          sumSat += maxC > 0 ? (maxC - minC) / maxC : 0;
          if (bright < 0.15) darkPx++;
        }
        const avgR = sumR / total, avgG = sumG / total, avgB = sumB / total;
        const brightness = (avgR + avgG + avgB) / (3 * 255);
        const rednessRatio = (avgR - avgG) / (avgR + avgG + avgB + 1);
        const lrAsymmetry = Math.abs(sumL - sumRH) / ((sumL + sumRH) / 2 + 1e-9);
        const avgBright = brightnessArr.reduce((a, b) => a + b, 0) / total;
        const variance = brightnessArr.reduce((acc, v) => acc + (v - avgBright) ** 2, 0) / total;
        resolve({ avgRed: avgR, avgGreen: avgG, avgBlue: avgB, brightness, rednessRatio, pixelVariance: variance, lrAsymmetry, avgSaturation: sumSat / total, darkPixelRatio: darkPx / total });
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function sigmoid(v: number, thresh: number, k = 10) { return 1 / (1 + Math.exp(-k * (v - thresh))); }

function swellingSev(p: number): 'None' | 'Mild' | 'Moderate' | 'Pronounced' {
  return p < 0.25 ? 'None' : p < 0.50 ? 'Mild' : p < 0.75 ? 'Moderate' : 'Pronounced';
}
function rednessSev(p: number): 'None' | 'Mild' | 'Moderate' | 'High' {
  return p < 0.25 ? 'None' : p < 0.50 ? 'Mild' : p < 0.75 ? 'Moderate' : 'High';
}
function asymmetrySev(p: number): 'None' | 'Minor' | 'Notable' | 'Marked' {
  return p < 0.20 ? 'None' : p < 0.45 ? 'Minor' : p < 0.70 ? 'Notable' : 'Marked';
}
function toRisk(sw: number, rd: number, as: number): RiskLevel {
  const m = Math.max(sw, rd, as);
  return m < 0.25 ? 'no_risk' : m < 0.45 ? 'low' : m < 0.70 ? 'moderate' : 'high';
}
function buildObs(f: ImageFeatures, sw: number, rd: number, as: number): string[] {
  const o: string[] = [];
  if (f.brightness < 0.25) o.push('Image appears underexposed — consider re-capturing in better lighting.');
  else if (f.brightness > 0.85) o.push('Image appears overexposed — some detail may be lost.');
  if (rd >= 0.50) o.push(`Elevated red-channel ratio (${(f.rednessRatio * 100).toFixed(1)}%) — possible hyperemia or inflammation.`);
  else if (rd >= 0.25) o.push('Mild redness signal detected — monitor quarter temperature.');
  if (as >= 0.50) o.push(`Left-right brightness asymmetry (${(f.lrAsymmetry * 100).toFixed(1)}%) — possible quarter swelling or edema.`);
  else if (as >= 0.20) o.push('Minor visual asymmetry noted — correlate with CMT paddle test.');
  if (sw >= 0.50) o.push(`Dark-region ratio (${(f.darkPixelRatio * 100).toFixed(0)}%) and contrast suggest possible tissue distension.`);
  if (f.avgSaturation < 0.15) o.push('Low image saturation — ensure camera captures true skin colour.');
  if (o.length === 0) o.push('No morphological alarm signals detected in this image.');
  o.push('Always correlate visual findings with CMT or veterinary SCC analysis.');
  return o;
}
function buildSteps(risk: RiskLevel): string[] {
  if (risk === 'high' || risk === 'moderate') {
    return ['Perform an immediate 4-quarter CMT paddle test.', 'Palpate each quarter for heat, pain, or hardness.', 'Check teat orifices for discharge or clots at next milking.', 'Consult a veterinarian if CMT score is 2+ or 3+.', 'Increase milking frequency to relieve quarter engorgement.'];
  }
  if (risk === 'low') {
    return ['Perform a CMT paddle check at next milking.', 'Check rear quarters for localized warmth or firmness.', 'Apply post-milking antiseptic dip.', 'Monitor daily milk yield for sudden drops.'];
  }
  return ['Perform a physical quarter inspection.', 'Run a 4-quarter CMT paddle test if clinical signs are present.', 'Consult a veterinarian for definitive evaluation.'];
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

/**
 * Demo-mode udder analysis using client-side Canvas pixel heuristics.
 * Extracts image features (redness, L-R asymmetry, dark-pixel ratio) and maps
 * them to clinically-named severity labels and a realistic confidence score.
 * ⚠ NOT a medical diagnosis — supportive visual assessment only.
 */
export const udderService = {
  async analyzeImage(imageUrl: string, animalId: string): Promise<UdderAnalysisResult> {
    // Simulate realistic processing delay (600–1100 ms)
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));

    let features: ImageFeatures;
    try {
      features = await extractImageFeatures(imageUrl);
    } catch {
      // Fallback when canvas cannot decode the image (e.g. cross-origin URL)
      return {
        id: `udr-demo-${animalId}`,
        animalId,
        imageUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        possibleSwelling:  { detected: false, severity: 'None' },
        possibleRedness:   { detected: false, severity: 'None' },
        visibleAsymmetry:  { detected: false, severity: 'None' },
        riskLevel: 'no_risk',
        confidenceScore: 0,
        observations: [
          'Image could not be decoded for pixel analysis (possible cross-origin restriction).',
          'Upload a local file for full client-side CV assessment.',
          'Always correlate with CMT or veterinary SCC analysis.',
        ],
        recommendedNextSteps: buildSteps('no_risk'),
        disclaimer: MANDATORY_UDDER_DISCLAIMER,
      };
    }

    // Feature → probability
    const rednessP   = clamp(sigmoid(features.rednessRatio, 0.05, 20), 0, 1);
    const asymmetryP = clamp(sigmoid(features.lrAsymmetry,  0.04, 15), 0, 1);
    const swellingRaw = features.darkPixelRatio * 0.6 + features.pixelVariance * 4;
    const swellingP  = clamp(sigmoid(swellingRaw, 0.10, 12), 0, 1);

    // Confidence: image quality × signal strength, clamped to 55–91 %
    const quality = clamp(features.avgSaturation * 0.5 + features.brightness * 0.3 + features.pixelVariance * 2, 0, 1);
    const rawConf = clamp(quality * 0.7 + Math.max(rednessP, asymmetryP, swellingP) * 0.3, 0, 1);
    const confidenceScore = Math.round(55 + rawConf * 36);

    const riskLevel = toRisk(swellingP, rednessP, asymmetryP);
    const sw = swellingSev(swellingP);
    const rd = rednessSev(rednessP);
    const as = asymmetrySev(asymmetryP);

    return {
      id: `udr-demo-${animalId}`,
      animalId,
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      possibleSwelling:  { detected: sw !== 'None', severity: sw },
      possibleRedness:   { detected: rd !== 'None', severity: rd },
      visibleAsymmetry:  { detected: as !== 'None', severity: as },
      riskLevel,
      confidenceScore,
      observations: buildObs(features, swellingP, rednessP, asymmetryP),
      recommendedNextSteps: buildSteps(riskLevel),
      disclaimer: MANDATORY_UDDER_DISCLAIMER,
    };
  },
};
