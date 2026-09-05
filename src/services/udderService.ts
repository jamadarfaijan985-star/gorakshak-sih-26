/**
 * Udder service — demo mode only.
 *
 * In LIVE mode, udder image analysis is handled by the backend
 * via POST /api/v1/ingest/udder-image (see ingestService.ts).
 * The backend returns the actual cv_result once Model 2 is integrated.
 *
 * IMPORTANT: Math.random() and simulated CV results have been removed.
 * This service now only provides the data structure + an honest
 * "integration pending" state for demo mode display.
 */

import { UdderAnalysisResult, RiskLevel } from '../types';

export type { UdderAnalysisResult };

export const MANDATORY_UDDER_DISCLAIMER =
  'This visual assessment is supportive only and is not a standalone veterinary diagnosis.';

/**
 * Demo-mode placeholder.
 * Returns a clearly-labelled "Integration Pending" result.
 * Does NOT use Math.random() or fabricate findings.
 */
export const udderService = {
  analyzeImage(_imageUrl: string, animalId: string): Promise<UdderAnalysisResult> {
    return Promise.resolve({
      id: `udr-pending-${animalId}`,
      animalId,
      imageUrl: _imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      possibleSwelling: { detected: false, severity: 'None' },
      possibleRedness: { detected: false, severity: 'None' },
      visibleAsymmetry: { detected: false, severity: 'None' },
      riskLevel: 'no_risk' as RiskLevel,
      confidenceScore: 0,
      observations: [
        'Model 2 (Udder Image AI) is not yet integrated.',
        'Image has been stored. Analysis will appear here once the CV pipeline is connected.',
      ],
      recommendedNextSteps: [
        'Perform a physical quarter inspection.',
        'Run a 4-quarter CMT paddle test if clinical signs are present.',
        'Consult a veterinarian for definitive evaluation.',
      ],
      disclaimer: MANDATORY_UDDER_DISCLAIMER,
    });
  },
};
