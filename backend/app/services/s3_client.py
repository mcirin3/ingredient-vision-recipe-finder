import boto3
from botocore.client import Config

from ..core.config import settings

# S3 client configured with explicit credentials; IAM roles can replace these in production.
s3 = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    config=Config(s3={"addressing_style": "path"}),
)


def presigned_put(key: str, content_type: str, expires: int = 900) -> str:
    """Generate presigned PUT URL so the frontend can upload directly to S3."""
    return s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.aws_s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=expires,
    )


def presigned_get(key: str, expires: int = 300) -> str:
    """Short-lived GET URL used by the backend to pull the image for processing."""
    return s3.generate_presigned_url(
        "get_object", Params={"Bucket": settings.aws_s3_bucket, "Key": key}, ExpiresIn=expires
    )


def upload_fileobj(fileobj, key: str, content_type: str):
    """Directly upload a file-like object to S3 (fallback when not using presigned PUT)."""
    s3.upload_fileobj(
        fileobj,
        settings.aws_s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )
