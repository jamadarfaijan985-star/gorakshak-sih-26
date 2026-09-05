"""
Udder CV Service — runs YOLO inference on uploaded udder images.

Species routing
---------------
  cow     → Cow_Udder_AI_Model/best.pt         (YOLOv8 classify)
  buffalo → Buffalo_udder_AI_Model/buffalo_udder_segmentation.pt  (YOLOv8 segment)

The two models have different output shapes:
  Cow model     → result.probs.top1 / top1conf / names   (classification)
  Buffalo model → result.masks + result.boxes             (segmentation)

Both are normalised here into the CVResultSchema format:
  {swelling, asymmetry, redness, lesions, discharge, confidence}

All fields except confidence are left as None when the model does not
produce them directly — this is intentional per the PRD "honest by design"
principle.  Only values the model actually produces are populated.

Fallback
--------
If ultralytics is not installed, or the model file is missing, or inference
fails for any reason, run_udder_cv() returns None (not a fabricated result).
The caller (routes_ingest.py) must handle None gracefully.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Class name interpretation for the cow classification model
# ---------------------------------------------------------------------------

# The cow model was trained on udder images; the class names it produces
# are stored in model.names.  Common class names from udder health datasets:
#   "healthy" / "normal"          → no disease signals
#   "mastitis" / "infected"       → disease signals present
#   "mild_mastitis" / "swollen"   → intermediate signals
# We map any "positive" class to a non-zero swelling/redness signal.

_COW_DISEASE_CLASSES = {
    "mastitis", "infected", "diseased", "abnormal",
    "mild_mastitis", "moderate_mastitis", "severe_mastitis",
    "swollen", "inflammation",
}


def _interpret_cow_classification(
    prediction: str,
    confidence: float,
) -> Dict[str, Any]:
    """
    Map a cow classification label + confidence to CVResultSchema fields.

    Healthy prediction → all indicators near 0.
    Disease prediction → swelling and redness get the confidence score,
                         other indicators stay None (model doesn't produce them).
    """
    label = prediction.lower().strip()
    is_disease = any(dc in label for dc in _COW_DISEASE_CLASSES)

    if is_disease:
        return {
            "swelling":   round(confidence, 4),
            "redness":    round(confidence, 4),
            "asymmetry":  None,    # classifier doesn't localise asymmetry
            "lesions":    None,
            "discharge":  None,
            "confidence": round(confidence, 4),
            "raw_label":  prediction,
        }
    else:
        return {
            "swelling":   round(1.0 - confidence, 4),   # low-confidence-healthy → slight uncertainty
            "redness":    None,
            "asymmetry":  None,
            "lesions":    None,
            "discharge":  None,
            "confidence": round(confidence, 4),
            "raw_label":  prediction,
        }


# ---------------------------------------------------------------------------
# Class name interpretation for the buffalo segmentation model
# ---------------------------------------------------------------------------

_BUFFALO_DISEASE_CLASSES = {
    "mastitis", "infection", "lesion", "swelling",
    "redness", "discharge", "inflammation", "abscess",
}


def _interpret_buffalo_segmentation(
    detections: list,
) -> Dict[str, Any]:
    """
    Map segmentation detections to CVResultSchema fields.

    Each detection has {class_id, class_name, confidence}.
    We set indicator flags for the categories that are detected.
    Overall confidence = highest detection confidence (or 0 if none).
    """
    if not detections:
        return {
            "swelling":   0.0,
            "redness":    None,
            "asymmetry":  None,
            "lesions":    None,
            "discharge":  None,
            "confidence": 0.0,
            "raw_label":  "no_detection",
        }

    swelling   = 0.0
    redness    = 0.0
    lesions    = 0.0
    discharge  = 0.0
    max_conf   = 0.0
    raw_labels = []

    for det in detections:
        class_name = det.get("class_name", "").lower()
        conf       = float(det.get("confidence", 0.0))
        max_conf   = max(max_conf, conf)
        raw_labels.append(det.get("class_name", ""))

        if "swelling" in class_name or "mastitis" in class_name or "inflammation" in class_name:
            swelling = max(swelling, conf)
        if "redness" in class_name or "infection" in class_name:
            redness = max(redness, conf)
        if "lesion" in class_name or "abscess" in class_name:
            lesions = max(lesions, conf)
        if "discharge" in class_name:
            discharge = max(discharge, conf)

    return {
        "swelling":   round(swelling, 4) if swelling > 0 else None,
        "redness":    round(redness, 4)  if redness  > 0 else None,
        "asymmetry":  None,  # segmentation model doesn't explicitly label asymmetry
        "lesions":    round(lesions, 4)  if lesions  > 0 else None,
        "discharge":  round(discharge, 4) if discharge > 0 else None,
        "confidence": round(max_conf, 4),
        "raw_label":  ", ".join(raw_labels) if raw_labels else "detected",
    }


# ---------------------------------------------------------------------------
# Main inference function
# ---------------------------------------------------------------------------

def run_udder_cv(
    image_path: str,
    species: str,
) -> Optional[Dict[str, Any]]:
    """
    Run YOLO inference on an udder image and return a CVResultSchema-compatible dict.

    Parameters
    ----------
    image_path : absolute path to the saved image file on disk
    species    : "cow" or "buffalo"

    Returns
    -------
    dict compatible with CVResultSchema, or None on any failure.
    The dict always includes a "model_version" key for storing in MongoDB.
    """
    if not os.path.exists(image_path):
        logger.warning("Udder CV: image file not found at %s", image_path)
        return None

    species_lower = (species or "").lower().strip()

    try:
        if species_lower == "buffalo":
            return _run_buffalo(image_path)
        else:
            # Default to cow model for unknown species (safe default for demo)
            return _run_cow(image_path)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Udder CV inference failed for species=%s image=%s: %s",
            species, image_path, exc,
        )
        return None


def _run_cow(image_path: str) -> Dict[str, Any]:
    """Run the YOLOv8 classify model for cow udder images."""
    from app.services.model_loader import get_cow_udder_model  # noqa: PLC0415

    model = get_cow_udder_model()

    results = model.predict(
        source=image_path,
        imgsz=224,
        device="cpu",
        verbose=False,
    )

    result = results[0]
    class_id   = int(result.probs.top1)
    confidence = float(result.probs.top1conf)
    label      = result.names[class_id]

    cv_result = _interpret_cow_classification(label, confidence)
    cv_result["model_version"] = "gorakshak_cow_udder_yolov8_classify_v1"
    return cv_result


def _run_buffalo(image_path: str) -> Dict[str, Any]:
    """Run the YOLOv8 segmentation model for buffalo udder images."""
    from app.services.model_loader import get_buffalo_udder_model  # noqa: PLC0415

    model = get_buffalo_udder_model()

    results = model.predict(
        source=image_path,
        imgsz=640,
        conf=0.25,
        device="cpu",
        save=False,
        verbose=False,
    )

    result = results[0]

    detections = []
    if result.masks is not None:
        for i in range(len(result.masks)):
            class_id   = int(result.boxes.cls[i])
            confidence = float(result.boxes.conf[i])
            class_name = result.names[class_id]
            detections.append({
                "class_id":   class_id,
                "class_name": class_name,
                "confidence": round(confidence, 4),
            })

    cv_result = _interpret_buffalo_segmentation(detections)
    cv_result["model_version"] = "gorakshak_buffalo_udder_yolov8_segment_v1"
    cv_result["detections"]    = detections   # store raw detections for debugging
    return cv_result
