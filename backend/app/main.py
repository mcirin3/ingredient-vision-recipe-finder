import os
import uuid
from pathlib import Path

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Ingredient Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


# Load environment variables from backend/app/.env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

S3_BUCKET = os.getenv("AWS_S3_BUCKET")
S3_REGION = os.getenv("AWS_REGION")
S3_PREFIX = os.getenv("AWS_S3_PREFIX", "uploads/")

if not S3_BUCKET or not S3_REGION:
    raise RuntimeError(
        "Missing S3 configuration. Please set AWS_S3_BUCKET and AWS_REGION in your environment."
    )

s3_client = boto3.client(
    "s3",
    region_name=S3_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


@app.post("/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """
    Accepts an image file, validates type, stores it on S3, and returns the saved key.
    """
    extension = Path(image.filename).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: jpg, jpeg, png",
        )

    file_key = f"{S3_PREFIX}{uuid.uuid4().hex}{extension}"

    try:
        s3_client.upload_fileobj(
            image.file,
            S3_BUCKET,
            file_key,
            ExtraArgs={"ContentType": image.content_type or "application/octet-stream"},
        )
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": file_key},
            ExpiresIn=3600,
        )
    except Exception as exc:  # pragma: no cover - runtime safeguard
        raise HTTPException(status_code=500, detail="Failed to upload image") from exc

    return {"image_id": file_key, "url": presigned_url, "status": "uploaded"}
