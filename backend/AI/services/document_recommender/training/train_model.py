import os
from typing import Any

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer


def _import_preprocess():
    """Import the preprocess function from training.preprocess in a resilient way."""
    try:
        # when run as module/package
        from .preprocess import load_and_preprocess

        return load_and_preprocess
    except Exception:
        # fallback when executed as a script from the training directory
        from preprocess import load_and_preprocess

        return load_and_preprocess


def train_and_persist(model_path: str, csv_path: str = None) -> None:
    """Train a deterministic multi-label model and persist components.

    - Uses TF-IDF (1-2 ngrams) + OneVsRestClassifier(LogisticRegression liblinear)
    - Encodes labels with MultiLabelBinarizer
    - Persists vectorizer, classifier, mlb and label ordering into a single .pkl
    """
    load_and_preprocess = _import_preprocess()

    # Retrieve preprocessed data (X: list[str], y: list[list[str]])
    X, y = load_and_preprocess(csv_path)

    # Basic validations before training
    if not isinstance(X, list) or not isinstance(y, list):
        raise ValueError("Preprocess must return X (list[str]) and y (list[list[str]]).")

    if len(X) == 0:
        raise ValueError("Preprocessed feature list X is empty. Cannot train on empty data.")

    if len(y) == 0:
        raise ValueError("Preprocessed label list y is empty. Cannot train on empty labels.")

    # Flatten labels to determine unique document labels
    unique_labels = set()
    for labels in y:
        if labels:
            for lab in labels:
                unique_labels.add(lab)

    if len(unique_labels) < 2:
        raise ValueError(f"Insufficient unique document labels for training: found {len(unique_labels)}")

    # Encode labels
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(y)

    # Vectorize text inputs using TF-IDF (ngram 1-2)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=False)
    X_vec = vectorizer.fit_transform(X)

    # Deterministic One-vs-Rest logistic regression
    clf = OneVsRestClassifier(
        LogisticRegression(solver="liblinear", random_state=42, max_iter=1000), n_jobs=1
    )
    clf.fit(X_vec, Y)

    # Prepare artifact
    artifact = {
        "vectorizer": vectorizer,
        "classifier": clf,
        "mlb": mlb,
        "labels": list(mlb.classes_),
    }

    # Ensure directory
    os.makedirs(os.path.dirname(model_path), exist_ok=True)

    # Persist using joblib to the exact required path
    joblib.dump(artifact, model_path)

    print(f"Training completed. Unique document labels learned: {len(mlb.classes_)}")
    print(f"Model persisted to: {model_path}")
    print("Required Documents model trained and saved successfully")


if __name__ == "__main__":
    import argparse

    default_model_path = os.path.join(
        os.path.dirname(__file__), "..", "model", "document_model.pkl"
    )

    parser = argparse.ArgumentParser(description="Train required documents model")
    parser.add_argument("--csv", help="Optional path to dataset (preprocess will be called)", default=None)
    parser.add_argument("--out", help="Output pkl path", default=default_model_path)
    args = parser.parse_args()

    train_and_persist(args.out, args.csv)
