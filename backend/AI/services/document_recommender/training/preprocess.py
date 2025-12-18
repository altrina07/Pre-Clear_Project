import re
from typing import List, Tuple

import pandas as pd
import os


REQUIRED_COLUMNS = [
    "Origin Country",
    "Destination Country",
    "HS Code",
    "HTS / Regional Tariff Flag",
    "Product Category",
    "Product Description",
    "Package Type & Weight Range",
    "Mode of Transport",
    "Required Documents",
]


def _normalize_text(value: object) -> str:
    """Normalize a text field deterministically.

    - Convert to string
    - Trim leading/trailing whitespace
    - Replace multiple internal whitespace with single space
    - Convert to lowercase
    """
    if pd.isna(value):
        return ""
    s = str(value)
    s = s.strip()
    # collapse multiple spaces/newlines/tabs
    s = re.sub(r"\s+", " ", s)
    s = s.lower()
    return s


def _split_and_dedupe_documents(raw: object) -> List[str]:
    """Split a semi-colon delimited document string, trim entries, and remove duplicates.

    IMPORTANT: preserves the document text exactly as in the dataset (no case changes).
    Duplicate removal preserves first occurrence order.
    """
    if pd.isna(raw):
        return []
    # treat the value as string but preserve internal casing
    s = str(raw)
    parts = [p.strip() for p in s.split(";")]
    parts = [p for p in parts if p != ""]
    seen = set()
    out: List[str] = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def preprocess(csv_path: str) -> Tuple[List[str], List[List[str]]]:
    """Load and preprocess the required documents dataset.

    Returns:
        X: list of combined semantic input strings
        y: list of lists of required document labels (preserved from dataset)

    Raises:
        ValueError: if the CSV is missing any required column headers
    """
    df = pd.read_csv(csv_path, dtype=object)

    # Validate columns
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    X: List[str] = []
    y: List[List[str]] = []

    for idx, row in df.iterrows():
        # For determinism, fetch columns in the required order
        origin = _normalize_text(row.get("Origin Country"))
        destination = _normalize_text(row.get("Destination Country"))
        hs_code = _normalize_text(row.get("HS Code"))
        hts_flag = _normalize_text(row.get("HTS / Regional Tariff Flag"))
        category = _normalize_text(row.get("Product Category"))
        description = _normalize_text(row.get("Product Description"))
        package = _normalize_text(row.get("Package Type & Weight Range"))
        mode = _normalize_text(row.get("Mode of Transport"))

        # Build the combined semantic input string with a consistent delimiter
        combined = " | ".join([
            origin,
            destination,
            hs_code,
            hts_flag,
            category,
            description,
            package,
            mode,
        ])

        # Process required documents without altering their text
        docs = _split_and_dedupe_documents(row.get("Required Documents"))

        # Determine if row is completely invalid: no combined content and no docs
        if combined.strip(" | ") == "" and len(docs) == 0:
            # skip completely empty rows per rules
            continue

        X.append(combined)
        y.append(docs)

    return X, y


def load_and_preprocess(csv_path: str = None) -> Tuple[List[str], List[List[str]]]:
    """Convenience wrapper that uses the dataset default when csv_path is None.

    This makes importing from training scripts easier and deterministic.
    """
    if csv_path is None:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "required_documents_dataset.csv")
    return preprocess(csv_path)


if __name__ == "__main__":
    import argparse
    import os

    parser = argparse.ArgumentParser(description="Preprocess required documents dataset")
    parser.add_argument(
        "csv",
        nargs="?",
        default=os.path.join(os.path.dirname(__file__), "..", "dataset", "required_documents_dataset.csv"),
        help="Path to required_documents_dataset.csv",
    )
    args = parser.parse_args()
    X, y = preprocess(args.csv)
    print(f"Rows processed: {len(X)}")
