import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .api import health, recipes, vision
from .core.config import settings
from .services import s3_client

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

app = FastAPI(title="Ingredient Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(vision.router)
app.include_router(recipes.router)


@app.post("/upload-url")
async def upload_url(content_type: str = "image/jpeg"):
    """Return a presigned PUT so the frontend can upload directly to S3."""
    key = f"{settings.aws_s3_prefix}{uuid.uuid4().hex}.jpg"
    url = s3_client.presigned_put(key, content_type)
    return {"key": key, "url": url, "method": "PUT"}


@app.post("/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """
    Optional direct upload endpoint (bypasses presigned PUT).
    """
    ext = Path(image.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: jpg, jpeg, png",
        )

    key = f"{settings.aws_s3_prefix}{uuid.uuid4().hex}{ext}"
    try:
        s3_client.upload_fileobj(
            image.file,
            key,
            image.content_type or "application/octet-stream",
        )
        url = s3_client.presigned_get(key)
    except Exception as exc:  # pragma: no cover - runtime safeguard
        raise HTTPException(status_code=500, detail="Failed to upload image") from exc

    return {"image_id": key, "url": url, "status": "uploaded"}
