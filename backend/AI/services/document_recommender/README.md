# Required Documents Recommendation System

This directory contains the ML-based document requirement predictor for Pre-Clear shipping compliance platform.

## Architecture

- **Training**: `training/train_model.py` — TF-IDF + OneVsRest(LogisticRegression) multi-label classifier
- **Preprocessing**: `training/preprocess.py` — Dataset validation, text normalization, document label parsing
- **Inference**: `inference/predict.py` — Model loading and document prediction
- **Dataset**: `dataset/required_documents_dataset.csv` — Training data with shipment scenarios and required documents
- **Model**: `model/document_model.pkl` — Serialized trained model (vectorizer, classifier, label encoder)

## Setup

### 1. Install Dependencies

```bash
cd backend/AI/services/document_recommender
pip install -r requirements.txt
```

### 2. Prepare Dataset

Create or update `dataset/required_documents_dataset.csv` with columns:
- Origin Country
- Destination Country
- HS Code
- HTS / Regional Tariff Flag
- Product Category
- Product Description
- Package Type & Weight Range
- Mode of Transport
- Required Documents (semicolon-delimited)

### 3. Train the Model

```bash
python training/train_model.py
```

**Output:**
- `model/document_model.pkl` (serialized artifact)
- Console logs: number of unique labels, confirmation message

### 4. Test Inference

```bash
python inference/predict.py
```

Expected output: model loads, 18+ labels printed, sample prediction returned.

## Usage in Backend

### C# Integration (AiController)

The model is consumed via HTTP POST from the .NET backend:

```csharp
POST /api/ai/documents/predict
{
    "origin_country": "China",
    "destination_country": "United States",
    "hs_code": "8471",
    "hts_flag": "Standard",
    "product_category": "Electronics",
    "product_description": "Computer Equipment",
    "package_type": "Carton 5-10kg",
    "mode_of_transport": "Air"
}
```

Response: list of required document names (no scores).

### Python API Usage

```python
from backend.AI.services.document_recommender.inference.predict import predict

docs = predict(
    origin_country="China",
    destination_country="United States",
    hs_code="8471",
    hts_flag="Standard",
    product_category="Electronics",
    product_description="Computer Equipment",
    package_type="Carton 5-10kg",
    mode_of_transport="Air",
)
# Returns: ['Commercial Invoice', 'Packing List', ...]
```

## Key Constraints

- **Dataset-driven only**: No hardcoded rules, fallback documents, or synthetic data
- **Deterministic**: Same inputs → same outputs (random_state fixed to 42)
- **Multi-label**: Predicts 5–12 documents per shipment
- **No scores**: Confidence/probability values never exposed
- **No Air Waybill**: Not included in any form
- **Isolated**: All logic contained within this directory

## Training Details

### Vectorizer
- TF-IDF with 1-2 character n-grams
- Lowercase disabled (preserves original casing)

### Classifier
- OneVsRest wrapper + LogisticRegression (liblinear solver)
- random_state=42 for determinism
- No class balancing heuristics

### Label Encoding
- MultiLabelBinarizer for multi-label support
- Classes preserved in exact dataset order

## Retraining

To retrain from scratch:

```bash
cd backend/AI/services/document_recommender
python training/train_model.py --csv dataset/required_documents_dataset.csv --out model/document_model.pkl
```

The script will:
1. Validate all required dataset columns
2. Normalize text fields and parse document lists
3. Train the multi-label classifier
4. Persist the model artifact
5. Print confirmation: "Required Documents model trained and saved successfully"

## Troubleshooting

**Model not found**: Ensure `model/document_model.pkl` exists after training.

**Import errors**: Run from the project root directory; Python path includes `.venv`.

**No predictions**: Check dataset has at least 2 unique document labels across all rows.

**Insufficient data**: Minimum 10 rows recommended for stable training.

## Files

```
document_recommender/
├── dataset/
│   └── required_documents_dataset.csv       # Training data
├── training/
│   ├── train_model.py                       # Training script
│   └── preprocess.py                        # Preprocessing logic
├── inference/
│   └── predict.py                           # Inference/prediction
├── model/
│   └── document_model.pkl                   # Trained model (created after training)
├── requirements.txt                         # Python dependencies
└── README.md                                # This file
```

## Version Info

- Python: 3.11+
- scikit-learn: 1.3.1+
- joblib: 1.3.2+
- pandas: 2.0.3+
