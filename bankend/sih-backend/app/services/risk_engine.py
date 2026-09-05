"""
Risk Engine for mastitis prediction.

Per PRD §9: Defines interface for risk scoring. Initial MVP implementation is rule-based;
ML team's model will later implement the same interface.
"""

from datetime import datetime
from typing import Dict, List, Optional

from app.schemas.schemas import RiskEngineInputSchema, RiskEngineOutputSchema, ContributingFactorSchema


class RuleBasedRiskEngine:
    """
    Rule-based risk engine for MVP demonstration.
    
    Implements the RiskEngineInputSchema -> RiskEngineOutputSchema interface.
    Uses weighted threshold logic on deviations and lab data.
    
    Once ML model is ready, create MLRiskEngine implementing the same interface.
    The backend remains agnostic to which engine is used - swappable via DI.
    """
    
    MODEL_VERSION = "rule_based_v1"
    
    # Thresholds and weights
    ACTIVITY_DEVIATION_THRESHOLD = -1.5  # Activity drop (negative z-score = decrease)
    RUMINATION_DEVIATION_THRESHOLD = -1.0  # Rumination drop
    SURFACE_TEMP_ELEVATION_THRESHOLD = 1.0  # Elevated temp (positive z-score)
    THI_CRITICAL_THRESHOLD = 72.0  # Critical THI
    THI_ELEVATED_THRESHOLD = 68.0  # Elevated THI
    
    # Weights for contributing factors (sum to ~1.0 for normalized scoring)
    WEIGHTS = {
        "activity_drop": 0.3,
        "rumination_drop": 0.2,
        "temp_elevation": 0.2,
        "thi_elevation": 0.2,
        "cmt_positive": 0.1,
    }
    
    @staticmethod
    def predict(engine_input: RiskEngineInputSchema) -> RiskEngineOutputSchema:
        """
        Compute risk score using rule-based logic.
        
        Returns RiskEngineOutputSchema with risk_level and contributing_factors.
        """
        features = engine_input.features
        animal_meta = features.get("animal_meta", {})
        
        contributing_factors: List[ContributingFactorSchema] = []
        risk_score = 0.0
        
        # ===== Feature 1: Activity Drop =====
        activity_dev = features.get("activity_deviation")
        if activity_dev is not None and activity_dev < RuleBasedRiskEngine.ACTIVITY_DEVIATION_THRESHOLD:
            factor_weight = RuleBasedRiskEngine.WEIGHTS["activity_drop"]
            # Normalize: deviation of -2.0 gives score 1.0, -1.5 gives 0.5
            factor_score = min(1.0, max(0.0, -activity_dev / 2.0))
            risk_score += factor_score * factor_weight
            contributing_factors.append(
                ContributingFactorSchema(factor="activity_deviation", weight=factor_weight)
            )
        
        # ===== Feature 2: Rumination Drop =====
        rumination_dev = features.get("rumination_inferred_deviation")
        if rumination_dev is not None and rumination_dev < RuleBasedRiskEngine.RUMINATION_DEVIATION_THRESHOLD:
            factor_weight = RuleBasedRiskEngine.WEIGHTS["rumination_drop"]
            factor_score = min(1.0, max(0.0, -rumination_dev / 2.0))
            risk_score += factor_score * factor_weight
            contributing_factors.append(
                ContributingFactorSchema(factor="rumination_deviation", weight=factor_weight)
            )
        
        # ===== Feature 3: Surface Temperature Elevation =====
        temp_dev = features.get("surface_temp_deviation")
        if temp_dev is not None and temp_dev > RuleBasedRiskEngine.SURFACE_TEMP_ELEVATION_THRESHOLD:
            factor_weight = RuleBasedRiskEngine.WEIGHTS["temp_elevation"]
            factor_score = min(1.0, max(0.0, temp_dev / 2.0))
            risk_score += factor_score * factor_weight
            contributing_factors.append(
                ContributingFactorSchema(factor="surface_temp_elevation", weight=factor_weight)
            )
        
        # ===== Feature 4: THI Elevation =====
        thi_max = features.get("thi_max")
        if thi_max is not None:
            factor_weight = RuleBasedRiskEngine.WEIGHTS["thi_elevation"]
            if thi_max >= RuleBasedRiskEngine.THI_CRITICAL_THRESHOLD:
                factor_score = 1.0
            elif thi_max >= RuleBasedRiskEngine.THI_ELEVATED_THRESHOLD:
                factor_score = (thi_max - RuleBasedRiskEngine.THI_ELEVATED_THRESHOLD) / \
                               (RuleBasedRiskEngine.THI_CRITICAL_THRESHOLD - RuleBasedRiskEngine.THI_ELEVATED_THRESHOLD)
            else:
                factor_score = 0.0
            
            if factor_score > 0:
                risk_score += factor_score * factor_weight
                contributing_factors.append(
                    ContributingFactorSchema(factor="thi_elevation", weight=factor_weight)
                )
        
        # ===== Feature 5: CMT Result =====
        manual_lab_data = features.get("manual_lab_data")
        if manual_lab_data and manual_lab_data.get("cmt_result"):
            cmt = manual_lab_data.get("cmt_result")
            if cmt in ["1+", "2+", "3+"]:  # Positive CMT
                factor_weight = RuleBasedRiskEngine.WEIGHTS["cmt_positive"]
                if cmt == "1+":
                    factor_score = 0.4
                elif cmt == "2+":
                    factor_score = 0.7
                else:  # "3+"
                    factor_score = 1.0
                risk_score += factor_score * factor_weight
                contributing_factors.append(
                    ContributingFactorSchema(factor="cmt_positive", weight=factor_weight)
                )
        
        # ===== Determine Risk Level =====
        if risk_score >= 0.7:
            risk_level = "high"
        elif risk_score >= 0.5:
            risk_level = "moderate"
        elif risk_score >= 0.3:
            risk_level = "low"
        else:
            risk_level = "no_risk"
        
        # ===== Recommended Action =====
        recommended_action = RuleBasedRiskEngine._get_recommended_action(risk_level, animal_meta)
        
        return RiskEngineOutputSchema(
            risk_level=risk_level,
            risk_score_numeric=round(risk_score, 3),
            contributing_factors=contributing_factors,
            recommended_action=recommended_action,
            model_version=RuleBasedRiskEngine.MODEL_VERSION,
            is_forecast=False,  # Rule engine is current-state screening, not forward forecast
            forecast_horizon_days=None,
        )
    
    @staticmethod
    def _get_recommended_action(risk_level: str, animal_meta: dict) -> str:
        """Determine recommended action based on risk level."""
        if risk_level == "high":
            return "Immediate veterinary examination recommended. Perform detailed udder assessment, collect milk samples for CMT/SCC/pH/EC, check for visible signs of inflammation or discharge."
        elif risk_level == "moderate":
            return "Schedule targeted udder assessment within 24 hours. Collect milk samples for lab analysis (CMT, SCC, pH, EC). Monitor closely for escalation."
        elif risk_level == "low":
            return "Continue routine monitoring. Check next scheduled herd visit for any changes in clinical signs."
        else:  # no_risk
            return "Animal appears healthy. Continue routine monitoring."
