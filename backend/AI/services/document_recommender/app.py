from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from inference.predict import predict


app = FastAPI(title="Required Documents Recommender")


class PredictRequest(BaseModel):
    origin_country: Optional[str] = ""
    destination_country: Optional[str] = ""
    hs_code: Optional[str] = ""
    hts_flag: Optional[bool] = None
    product_category: Optional[str] = ""
    product_description: Optional[str] = ""
    package_type_weight: Optional[str] = ""
    mode_of_transport: Optional[str] = ""


def _to_text(value: Optional[object]) -> str:
    """Convert incoming values (including booleans) to strings for the model."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


@app.post("/predict-documents")
def predict_documents(payload: PredictRequest) -> dict:
    # Basic validation: require at least one non-empty field
    fields = [
        payload.origin_country,
        payload.destination_country,
        payload.hs_code,
        payload.hts_flag,
        payload.product_category,
        payload.product_description,
        payload.package_type_weight,
        payload.mode_of_transport,
    ]

    if all(v in (None, "") for v in fields):
        raise HTTPException(status_code=400, detail="At least one input field must be provided.")

    try:
        docs: List[str] = predict(
            origin_country=_to_text(payload.origin_country),
            destination_country=_to_text(payload.destination_country),
            hs_code=_to_text(payload.hs_code),
            hts_flag=_to_text(payload.hts_flag),
            product_category=_to_text(payload.product_category),
            product_description=_to_text(payload.product_description),
            package_type=_to_text(payload.package_type_weight),
            mode_of_transport=_to_text(payload.mode_of_transport),
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="Model artifact not found. Please train and persist the model.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    return {"required_documents": docs}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
