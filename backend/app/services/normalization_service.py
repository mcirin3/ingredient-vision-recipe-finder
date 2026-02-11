import json

from fastapi import HTTPException
from openai import OpenAI

from ..core.config import settings

client = OpenAI(api_key=settings.openai_api_key)


def normalize_labels(raw_labels: list[str]) -> list[str]:
    """Normalize raw labels into canonical, singular, lower-case ingredient names."""
    prompt = (
        "Normalize these ingredient labels. "
        "Return a JSON array of canonical, singular, lower-case food names. "
        "Remove duplicates and non-food items.\n"
        f"Input: {raw_labels}"
    )
    resp = client.chat.completions.create(
        model=settings.openai_norm_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=120,
        temperature=0,
        response_format={"type": "json_object"},
    )
    try:
        data = json.loads(resp.choices[0].message.content)
        if isinstance(data, dict) and "ingredients" in data:
            return data["ingredients"]
        if isinstance(data, list):
            return data
        raise ValueError("Unexpected JSON shape from normalization model")
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail="Normalization failed") from exc
