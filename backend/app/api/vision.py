from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.normalization_service import normalize_labels
from ..services.vision_service import extract_labels_from_image

router = APIRouter(prefix="/analyze", tags=["vision"])


class AnalyzeRequest(BaseModel):
    s3_key: str


class AnalyzeResponse(BaseModel):
    ingredients_raw: list[str]
    ingredients_normalized: list[str]


@router.post("", response_model=AnalyzeResponse)
async def analyze_image(payload: AnalyzeRequest):
    if not payload.s3_key:
        raise HTTPException(status_code=400, detail="s3_key required")

    raw = extract_labels_from_image(payload.s3_key)
    normalized = normalize_labels(raw)
    return AnalyzeResponse(ingredients_raw=raw, ingredients_normalized=normalized)
