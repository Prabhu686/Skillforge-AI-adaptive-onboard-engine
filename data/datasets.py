"""
Public dataset loaders for SkillForge onboarding engine.

Sources:
  - Resume Dataset       : https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset
  - O*NET DB Releases    : https://www.onetcenter.org/db_releases.html
  - Jobs & Descriptions  : https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description
"""

import os

import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ONET_VERSION   = "db_28_3"
_ONET_BASE_URL  = f"https://www.onetcenter.org/dl_files/database/{_ONET_VERSION}_text"
ONET_SKILLS_URL      = f"{_ONET_BASE_URL}/Skills.txt"
ONET_OCCUPATIONS_URL = f"{_ONET_BASE_URL}/Occupation%20Data.txt"

DATASET_REGISTRY = {
    "resume": {
        "source": "Kaggle – snehaanbhawal/resume-dataset",
        "url": "https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data",
        "license": "CC BY 4.0",
        "columns_used": ["Resume_str", "Category"],
        "purpose": "Skill extraction & role classification from raw resume text",
    },
    "onet_skills": {
        "source": "O*NET Resource Center – db_28_3",
        "url": "https://www.onetcenter.org/db_releases.html",
        "license": "Public Domain (US Dept. of Labor)",
        "columns_used": ["O*NET-SOC Code", "Element Name", "Scale Name", "Data Value"],
        "purpose": "Canonical skill taxonomy and proficiency benchmarks per occupation",
    },
    "onet_occupations": {
        "source": "O*NET Resource Center – db_28_3",
        "url": "https://www.onetcenter.org/db_releases.html",
        "license": "Public Domain (US Dept. of Labor)",
        "columns_used": ["O*NET-SOC Code", "Title", "Description"],
        "purpose": "Occupation titles and descriptions for role-to-skill mapping",
    },
    "jobs": {
        "source": "Kaggle – kshitizregmi/jobs-and-job-description",
        "url": "https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description",
        "license": "CC BY 4.0",
        "columns_used": ["Job Title", "Job Description"],
        "purpose": "Real-world job postings for gap analysis and learning path generation",
    },
}


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_resume_dataset(csv_path: str) -> pd.DataFrame:
    """
    Load the Kaggle resume dataset from a locally downloaded CSV.
    Expected columns: Resume_str, Category
    """
    df = pd.read_csv(csv_path, usecols=["Resume_str", "Category"])
    df = df.dropna(subset=["Resume_str", "Category"])
    df["Resume_str"] = df["Resume_str"].str.strip()
    return df


def load_onet_skills(data_dir: str | None = None) -> pd.DataFrame:
    """
    Load O*NET Skills table.
    If data_dir is None, fetches directly from the O*NET public URL.
    """
    if data_dir:
        path = os.path.join(data_dir, "Skills.txt")
        df = pd.read_csv(path, sep="\t", encoding="utf-8")
    else:
        df = pd.read_csv(ONET_SKILLS_URL, sep="\t", encoding="utf-8")

    keep = ["O*NET-SOC Code", "Element Name", "Scale Name", "Data Value"]
    df = df[keep].dropna()
    # Retain only importance scores for comparability
    df = df[df["Scale Name"] == "Importance"]
    return df


def load_onet_occupations(data_dir: str | None = None) -> pd.DataFrame:
    """
    Load O*NET Occupation Data table.
    If data_dir is None, fetches directly from the O*NET public URL.
    """
    if data_dir:
        path = os.path.join(data_dir, "Occupation Data.txt")
        df = pd.read_csv(path, sep="\t", encoding="utf-8")
    else:
        df = pd.read_csv(ONET_OCCUPATIONS_URL, sep="\t", encoding="utf-8")

    keep = ["O*NET-SOC Code", "Title", "Description"]
    return df[keep].dropna()


def load_jobs_dataset(csv_path: str) -> pd.DataFrame:
    """
    Load the Kaggle jobs-and-job-description dataset from a locally downloaded CSV.
    Expected columns: Job Title, Job Description
    """
    df = pd.read_csv(csv_path)
    # Normalise column names to handle minor variations across dataset versions
    df.columns = df.columns.str.strip()
    title_col = next(c for c in df.columns if "title" in c.lower())
    desc_col  = next(c for c in df.columns if "description" in c.lower())
    df = df[[title_col, desc_col]].rename(
        columns={title_col: "Job Title", desc_col: "Job Description"}
    )
    return df.dropna()


def dataset_registry() -> dict:
    """Return the full disclosure registry of all public datasets used."""
    return DATASET_REGISTRY
