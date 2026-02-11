import json

from fastapi import HTTPException
from openai import OpenAI

from ..core.config import settings
from .s3_client import presigned_get

client = OpenAI(api_key=settings.openai_api_key)


def extract_labels_from_image(s3_key: str) -> list[str]:
    """Use OpenAI Vision to extract ingredient labels from the image stored in S3."""
    image_url = presigned_get(s3_key)
    prompt = (
        "List distinct, concrete grocery ingredients you can see. "
        "Return ONLY a JSON array of strings, no extras."
    )
    resp = client.chat.completions.create(
        model=settings.openai_vision_model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ],
        max_tokens=200,
        temperature=0,
        response_format={"type": "json_object"},
    )
    try:
        data = json.loads(resp.choices[0].message.content)
        # Accept either {"ingredients": [...]} or a bare array
        if isinstance(data, dict) and "ingredients" in data:
            return data["ingredients"]
        if isinstance(data, list):
            return data
        raise ValueError("Unexpected JSON shape from vision model")
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail="Vision parsing failed") from exc
