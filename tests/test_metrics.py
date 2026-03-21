"""Unit tests for data/metrics.py"""

import pandas as pd
import pytest

from data.metrics import (
    dataset_health,
    gap_analysis_mae,
    learning_path_metrics,
    role_classification_metrics,
    skill_extraction_metrics,
)


# ---------------------------------------------------------------------------
# Skill extraction
# ---------------------------------------------------------------------------

def test_skill_extraction_perfect():
    y_true = [{"python", "sql"}, {"java"}]
    y_pred = [{"python", "sql"}, {"java"}]
    r = skill_extraction_metrics(y_true, y_pred)
    assert r == {"precision": 1.0, "recall": 1.0, "f1": 1.0}


def test_skill_extraction_partial():
    y_true = [{"python", "sql", "aws"}]
    y_pred = [{"python", "sql"}]
    r = skill_extraction_metrics(y_true, y_pred)
    assert r["precision"] == 1.0
    assert r["recall"] == round(2 / 3, 4)


def test_skill_extraction_empty():
    r = skill_extraction_metrics([], [])
    assert r["f1"] == 0.0


# ---------------------------------------------------------------------------
# Role classification
# ---------------------------------------------------------------------------

def test_role_classification_perfect():
    y = ["Data Scientist", "Engineer", "Manager"]
    r = role_classification_metrics(y, y)
    assert r["accuracy"] == 1.0
    assert r["macro_f1"] == 1.0


def test_role_classification_partial():
    y_true = ["A", "A", "B", "B"]
    y_pred = ["A", "B", "B", "B"]
    r = role_classification_metrics(y_true, y_pred)
    assert 0 < r["accuracy"] < 1


# ---------------------------------------------------------------------------
# Gap analysis MAE
# ---------------------------------------------------------------------------

def test_gap_mae_perfect():
    scores = [3.0, 4.0, 2.5]
    r = gap_analysis_mae(scores, scores)
    assert r["mae"] == 0.0
    assert r["nmae"] == 0.0


def test_gap_mae_known():
    r = gap_analysis_mae([1.0, 1.0], [3.0, 3.0])
    assert r["mae"] == 2.0
    assert r["nmae"] == 0.5


# ---------------------------------------------------------------------------
# Learning path
# ---------------------------------------------------------------------------

def test_learning_path_full_coverage():
    required = {"python", "sql", "aws"}
    path     = ["python", "sql", "aws"]
    r = learning_path_metrics(required, path)
    assert r["coverage_ratio"] == 1.0
    assert r["redundancy_rate"] == 0.0


def test_learning_path_redundancy():
    required = {"python"}
    path     = ["python", "python", "python"]
    r = learning_path_metrics(required, path)
    assert r["coverage_ratio"] == 1.0
    assert r["redundancy_rate"] == round(1 - 1 / 3, 4)


def test_learning_path_empty():
    r = learning_path_metrics(set(), [])
    assert r["coverage_ratio"] == 0.0
    assert r["redundancy_rate"] == 0.0


# ---------------------------------------------------------------------------
# Dataset health
# ---------------------------------------------------------------------------

def test_dataset_health_balanced():
    df = pd.DataFrame({"text": ["a", "b", "c", "d"], "label": ["X", "X", "Y", "Y"]})
    h = dataset_health(df, "label")
    assert h["completeness"] == 1.0
    assert h["imbalance_ratio"] == 1.0


def test_dataset_health_imbalanced():
    df = pd.DataFrame({"label": ["A"] * 9 + ["B"]})
    h = dataset_health(df, "label")
    assert h["imbalance_ratio"] == 9.0
