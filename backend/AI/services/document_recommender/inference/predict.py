import os
import re
from typing import Dict, List, Optional

import joblib
from scipy import sparse


DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "model", "document_model.pkl"
)

_MODEL_CACHE: Dict[str, Dict] = {}


def _normalize_text(value: object) -> str:
    """Normalize text exactly as training preprocess does."""
    if value is None:
        return ""
    s = str(value).strip()
    s = re.sub(r"\s+", " ", s)
    return s.lower()


def _build_combined_input(
    origin_country: Optional[str],
    destination_country: Optional[str],
    hs_code: Optional[str],
    hts_flag: Optional[str],
    product_category: Optional[str],
    product_description: Optional[str],
    package_type: Optional[str],
    mode_of_transport: Optional[str],
) -> str:
    parts = [
        _normalize_text(origin_country),
        _normalize_text(destination_country),
        _normalize_text(hs_code),
        _normalize_text(hts_flag),
        _normalize_text(product_category),
        _normalize_text(product_description),
        _normalize_text(package_type),
        _normalize_text(mode_of_transport),
    ]
    return " | ".join(parts)


def _load_artifact(model_path: Optional[str] = None) -> Dict:
    path = model_path or DEFAULT_MODEL_PATH
    path = os.path.abspath(path)

    if path in _MODEL_CACHE:
        return _MODEL_CACHE[path]

    if not os.path.exists(path):
        raise FileNotFoundError(f"Model artifact not found at: {path}")

    artifact = joblib.load(path)

    required_keys = {"vectorizer", "classifier", "mlb"}
    missing = [k for k in required_keys if k not in artifact]
    if missing:
        raise ValueError(f"Model artifact is missing required keys: {missing}")

    _MODEL_CACHE[path] = artifact
    return artifact


def predict(
    origin_country: Optional[str] = None,
    destination_country: Optional[str] = None,
    hs_code: Optional[str] = None,
    hts_flag: Optional[str] = None,
    product_category: Optional[str] = None,
    product_description: Optional[str] = None,
    package_type: Optional[str] = None,
    mode_of_transport: Optional[str] = None,
    model_path: Optional[str] = None,
) -> List[str]:
    """Predict required documents from shipment context.

    Mirrors training preprocessing: normalize, concatenate with " | ", and predict
    via the persisted TF-IDF + OneVsRest(LogReg) model.
    """

    artifact = _load_artifact(model_path)
    vectorizer = artifact["vectorizer"]
    classifier = artifact["classifier"]
    mlb = artifact["mlb"]

    combined = _build_combined_input(
        origin_country,
        destination_country,
        hs_code,
        hts_flag,
        product_category,
        product_description,
        package_type,
        mode_of_transport,
    )

    # If every field is empty, return early with no documents
    if combined.strip(" | ") == "":
        return []

    X_vec = vectorizer.transform([combined])
    if not isinstance(X_vec, sparse.spmatrix):
        raise ValueError("Vectorizer must produce a scipy sparse matrix.")

    Y_pred = classifier.predict(X_vec)
    decoded = mlb.inverse_transform(Y_pred)
    if not decoded:
        return []

    raw_docs = list(decoded[0])

    # Filter out empty strings and the forbidden Air Waybill label
    filtered: List[str] = []
    seen = set()
    for doc in raw_docs:
        if not doc:
            continue
        if doc.strip().lower() == "air waybill".lower():
            continue
        if doc in seen:
            continue
        seen.add(doc)
        filtered.append(doc)

    return filtered


if __name__ == "__main__":
    sample = predict(
        origin_country="South Africa",
        destination_country="United States",
        hs_code="300490",
        hts_flag="Yes",
        product_category="Pharmaceuticals",
        product_description="Finished formulation medicinal tablets",
        package_type="Pallets (200–800 kg)",
        mode_of_transport="Air",
    )
    print("Predicted documents:")
    for doc in sample:
        print(f"- {doc}")