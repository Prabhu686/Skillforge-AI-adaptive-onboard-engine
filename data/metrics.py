"""
Internal metrics used to validate SkillForge engine efficiency.

Metric groups
─────────────
1. Skill Extraction      – precision / recall / F1 against labelled resumes
2. Role Classification   – accuracy / macro-F1 on resume categories
3. Gap Analysis          – mean absolute error vs. O*NET importance scores
4. Learning Path         – coverage ratio and redundancy rate
5. Dataset Health        – completeness and class-balance checks
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    mean_absolute_error,
)
from typing import Sequence


# ---------------------------------------------------------------------------
# 1. Skill Extraction Metrics
# ---------------------------------------------------------------------------

def skill_extraction_metrics(
    y_true: list[set[str]],
    y_pred: list[set[str]],
) -> dict[str, float]:
    """
    Token-level precision, recall, F1 for skill extraction.

    Args:
        y_true: Ground-truth skill sets per document.
        y_pred: Predicted skill sets per document.

    Returns:
        {"precision": float, "recall": float, "f1": float}
    """
    tp = fp = fn = 0
    for true_skills, pred_skills in zip(y_true, y_pred):
        tp += len(true_skills & pred_skills)
        fp += len(pred_skills - true_skills)
        fn += len(true_skills - pred_skills)

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall    = tp / (tp + fn) if (tp + fn) else 0.0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) else 0.0)

    return {"precision": round(precision, 4),
            "recall":    round(recall, 4),
            "f1":        round(f1, 4)}


# ---------------------------------------------------------------------------
# 2. Role Classification Metrics
# ---------------------------------------------------------------------------

def role_classification_metrics(
    y_true: Sequence[str],
    y_pred: Sequence[str],
) -> dict[str, float]:
    """
    Accuracy and macro-F1 for resume-to-role classification.
    """
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "macro_f1": round(f1_score(y_true, y_pred, average="macro",
                                   zero_division=0), 4),
        "macro_precision": round(precision_score(y_true, y_pred,
                                                  average="macro",
                                                  zero_division=0), 4),
        "macro_recall": round(recall_score(y_true, y_pred,
                                            average="macro",
                                            zero_division=0), 4),
    }


# ---------------------------------------------------------------------------
# 3. Gap Analysis Metrics
# ---------------------------------------------------------------------------

def gap_analysis_mae(
    predicted_scores: Sequence[float],
    onet_scores: Sequence[float],
) -> dict[str, float]:
    """
    Mean Absolute Error between engine-predicted skill importance scores
    and O*NET ground-truth importance scores (scale 1–5).
    """
    mae = mean_absolute_error(onet_scores, predicted_scores)
    # Normalised MAE: divide by scale range (4) so 0 = perfect, 1 = worst
    nmae = mae / 4.0
    return {"mae": round(mae, 4), "nmae": round(nmae, 4)}


# ---------------------------------------------------------------------------
# 4. Learning Path Metrics
# ---------------------------------------------------------------------------

def learning_path_metrics(
    required_skills: set[str],
    path_skills: list[str],
) -> dict[str, float]:
    """
    Coverage ratio  – fraction of required skills addressed by the path.
    Redundancy rate – fraction of path items that are duplicates.
    """
    unique_in_path = set(path_skills)
    coverage   = len(unique_in_path & required_skills) / len(required_skills) \
                 if required_skills else 0.0
    redundancy = 1 - len(unique_in_path) / len(path_skills) \
                 if path_skills else 0.0

    return {
        "coverage_ratio":  round(coverage, 4),
        "redundancy_rate": round(redundancy, 4),
    }


# ---------------------------------------------------------------------------
# 5. Dataset Health Metrics
# ---------------------------------------------------------------------------

def dataset_health(df: pd.DataFrame, label_col: str) -> dict[str, object]:
    """
    Completeness and class-balance report for a labelled dataset.

    Returns:
        completeness   – fraction of non-null rows
        class_balance  – dict of {label: proportion}
        imbalance_ratio – max_class_freq / min_class_freq
    """
    completeness = df.notna().all(axis=1).mean()
    counts       = df[label_col].value_counts(normalize=True)
    imbalance    = (counts.max() / counts.min()
                    if counts.min() > 0 else float("inf"))

    return {
        "completeness":    round(float(completeness), 4),
        "class_balance":   counts.round(4).to_dict(),
        "imbalance_ratio": round(float(imbalance), 2),
    }


# ---------------------------------------------------------------------------
# Aggregate report
# ---------------------------------------------------------------------------

METRIC_DEFINITIONS = {
    "precision":        "TP / (TP + FP) for extracted skills vs. labelled ground truth",
    "recall":           "TP / (TP + FN) for extracted skills vs. labelled ground truth",
    "f1":               "Harmonic mean of precision and recall for skill extraction",
    "accuracy":         "Fraction of correctly classified resume roles",
    "macro_f1":         "Unweighted mean F1 across all role classes",
    "macro_precision":  "Unweighted mean precision across all role classes",
    "macro_recall":     "Unweighted mean recall across all role classes",
    "mae":              "Mean Absolute Error of skill importance vs. O*NET (scale 1–5)",
    "nmae":             "Normalised MAE (0 = perfect, 1 = worst) for gap analysis",
    "coverage_ratio":   "Fraction of required skills covered by the generated learning path",
    "redundancy_rate":  "Fraction of duplicate items in the generated learning path",
    "completeness":     "Fraction of dataset rows with no missing values",
    "imbalance_ratio":  "Ratio of most-frequent to least-frequent class in dataset",
}


def metric_definitions() -> dict[str, str]:
    """Return human-readable definitions for every internal metric."""
    return METRIC_DEFINITIONS
