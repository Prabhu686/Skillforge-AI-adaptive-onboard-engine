"""
Validation runner – produces a full disclosure report of datasets used
and internal metric results for the SkillForge onboarding engine.

Usage
-----
    python -m data.validate \
        --resume  path/to/resume_dataset.csv \
        --jobs    path/to/jobs_dataset.csv \
        --onet    path/to/onet_data_dir          # optional; fetches live if omitted
"""

import argparse
import json
import sys

import pandas as pd

from data.datasets import (
    dataset_registry,
    load_resume_dataset,
    load_onet_skills,
    load_onet_occupations,
    load_jobs_dataset,
)
from data.metrics import (
    dataset_health,
    gap_analysis_mae,
    metric_definitions,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _section(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print('=' * 60)


def _print_json(obj: object) -> None:
    print(json.dumps(obj, indent=2, default=str))


# ---------------------------------------------------------------------------
# Dataset disclosure
# ---------------------------------------------------------------------------

def report_dataset_registry() -> None:
    _section("PUBLIC DATASETS USED")
    for name, meta in dataset_registry().items():
        print(f"\n[{name}]")
        for k, v in meta.items():
            print(f"  {k:<16}: {v}")


# ---------------------------------------------------------------------------
# Dataset health checks
# ---------------------------------------------------------------------------

def report_resume_health(csv_path: str) -> None:
    _section("DATASET HEALTH – Resume Dataset")
    df = load_resume_dataset(csv_path)
    print(f"  Rows loaded : {len(df)}")
    health = dataset_health(df, label_col="Category")
    print(f"  Completeness    : {health['completeness']}")
    print(f"  Imbalance ratio : {health['imbalance_ratio']}")
    print("\n  Class distribution (top 10):")
    top10 = dict(list(health["class_balance"].items())[:10])
    _print_json(top10)


def report_jobs_health(csv_path: str) -> None:
    _section("DATASET HEALTH – Jobs & Job Description Dataset")
    df = load_jobs_dataset(csv_path)
    print(f"  Rows loaded : {len(df)}")
    df["_label"] = df["Job Title"]
    health = dataset_health(df, label_col="_label")
    print(f"  Completeness    : {health['completeness']}")
    print(f"  Imbalance ratio : {health['imbalance_ratio']}")


def report_onet_health(data_dir: str | None) -> None:
    _section("DATASET HEALTH – O*NET Skills")
    df = load_onet_skills(data_dir)
    print(f"  Rows loaded      : {len(df)}")
    print(f"  Unique SOC codes : {df['O*NET-SOC Code'].nunique()}")
    print(f"  Unique skills    : {df['Element Name'].nunique()}")
    print(f"  Score range      : {df['Data Value'].min():.2f} – "
          f"{df['Data Value'].max():.2f}")


# ---------------------------------------------------------------------------
# Gap analysis metric (synthetic baseline)
# ---------------------------------------------------------------------------

def report_gap_analysis_baseline() -> None:
    """
    Demonstrates the MAE metric using a synthetic baseline where the engine
    predicts the dataset mean for every skill (worst-case naive baseline).
    Replace with real engine predictions in production.
    """
    _section("METRIC VALIDATION – Gap Analysis MAE (Synthetic Baseline)")
    import numpy as np
    rng = np.random.default_rng(42)
    onet_scores = rng.uniform(1, 5, size=500)
    # Naive baseline: always predict the mean
    naive_pred  = [onet_scores.mean()] * 500
    result = gap_analysis_mae(naive_pred, onet_scores)
    print(f"  Naive-mean MAE  : {result['mae']}  (expected ~1.15 for uniform dist)")
    print(f"  Normalised MAE  : {result['nmae']}")
    print("  (Replace naive_pred with real engine output for production metrics)")


# ---------------------------------------------------------------------------
# Metric definitions disclosure
# ---------------------------------------------------------------------------

def report_metric_definitions() -> None:
    _section("INTERNAL METRIC DEFINITIONS")
    for metric, definition in metric_definitions().items():
        print(f"  {metric:<20}: {definition}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="SkillForge dataset & metrics disclosure report"
    )
    parser.add_argument("--resume", help="Path to resume_dataset.csv")
    parser.add_argument("--jobs",   help="Path to jobs_dataset.csv")
    parser.add_argument("--onet",   help="Path to O*NET data directory (optional)")
    args = parser.parse_args()

    report_dataset_registry()
    report_metric_definitions()
    report_gap_analysis_baseline()

    if args.resume:
        report_resume_health(args.resume)
    else:
        print("\n[INFO] --resume not provided; skipping resume health check.")

    if args.jobs:
        report_jobs_health(args.jobs)
    else:
        print("[INFO] --jobs not provided; skipping jobs health check.")

    try:
        report_onet_health(args.onet)   # fetches live if --onet not provided
    except Exception as exc:
        print(f"[WARN] O*NET health check failed: {exc}")

    print("\n✓ Disclosure report complete.\n")


if __name__ == "__main__":
    main()
