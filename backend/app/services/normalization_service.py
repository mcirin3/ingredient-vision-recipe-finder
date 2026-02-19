import json

from fastapi import HTTPException
from openai import OpenAI

from ..core.config import settings

client = OpenAI(api_key=settings.openai_api_key)

# Lightweight deterministic normalization before calling the model.
# This keeps common synonyms consistent and prunes obvious non-food noise.
ALIAS_MAP = {
    "avocados": "avocado",
    "avocadoes": "avocado",
    "steak": "beef",
    "sirloin": "beef",
    "flank": "beef",
    "skirt": "beef",
    "ribeye": "beef",
    "carne": "beef",
    "ground beef": "beef",
    "beefsteak": "beef",
    "pork shoulder": "pork",
    "pork loin": "pork",
    "ground pork": "pork",
    "chicken breast": "chicken",
    "chicken thighs": "chicken",
    "chicken leg": "chicken",
    "chicken legs": "chicken",
    "tortillas": "tortilla",
    "flour tortilla": "tortilla",
    "corn tortilla": "tortilla",
    "wrap": "tortilla",
    "bell peppers": "bell pepper",
    "capsicum": "bell pepper",
    "red bell pepper": "bell pepper",
    "green bell pepper": "bell pepper",
    "yellow bell pepper": "bell pepper",
    "cilantro": "cilantro",
    "coriander": "cilantro",
    "coriander leaves": "cilantro",
    "green onion": "scallion",
    "spring onion": "scallion",
    "scallions": "scallion",
    "limes": "lime",
    "lime wedges": "lime",
    "onions": "onion",
    "red onion": "onion",
    "white onion": "onion",
    "garlic cloves": "garlic",
    "garlic clove": "garlic",
    "minced garlic": "garlic",
    "jalapeño": "jalapeno",
    "jalapenos": "jalapeno",
    "jalapeno pepper": "jalapeno",
    "serrano pepper": "serrano",
    "serranos": "serrano",
    "chili pepper": "chili",
    "chiles": "chili",
    "tomatoes": "tomato",
    "roma tomatoes": "tomato",
    "cherry tomatoes": "tomato",
    "avocado": "avocado",
    "lemon": "lemon",
    "lemons": "lemon",
    "brioche": "bread",
    "white bread": "bread",
    "whole wheat bread": "bread",
    "bread bun": "bread",
}

NOISE = {"plate", "bowl", "table", "countertop", "cup", "container", "paper", "plastic"}


def _apply_alias_map(raw_labels: list[str]) -> list[str]:
    normalized: list[str] = []
    for label in raw_labels:
        if not label:
            continue
        item = label.strip().lower()
        if item in NOISE:
            continue
        mapped = ALIAS_MAP.get(item, item)
        normalized.append(mapped)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for item in normalized:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique


def normalize_labels(raw_labels: list[str]) -> list[str]:
    """Normalize raw labels into canonical, singular, lower-case ingredient names."""
    pre_normalized = _apply_alias_map(raw_labels)

    prompt = (
        "Normalize these ingredient labels. "
        "Return a JSON array of canonical, singular, lower-case food names. "
        "Remove duplicates and non-food items.\n"
        f"Input: {pre_normalized}"
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
