import requests
from fastapi import HTTPException

from ..core.config import settings

SPOONACULAR_SEARCH = "https://api.spoonacular.com/recipes/complexSearch"
SPOONACULAR_INFORMATION = "https://api.spoonacular.com/recipes/{recipe_id}/information"


def _infer_dish_intent(ingredients: list[str]) -> str:
    """
    Prefer a concrete dish hint:
    - If tortilla present with a protein → "taco"
    - Else protein + second ingredient token (e.g., "steak onion")
    - Else join first two ingredients.
    """
    lower = [i.lower() for i in ingredients]
    proteins = [i for i in lower if any(p in i for p in ["chicken", "beef", "pork", "steak", "shrimp", "salmon", "tofu", "egg", "turkey"])]
    has_tortilla = any("tortilla" in i for i in lower)
    if proteins and has_tortilla:
        return "taco"
    if proteins and len(lower) > 1:
        return f"{proteins[0]} {lower[1]}"
    return " ".join(lower[:2]) if lower else ""


def fetch_candidates(ingredients: list[str], limit: int = 15) -> list[dict]:
    """Fetch candidate recipes using complexSearch, biased to maximize ingredient overlap."""
    if not settings.spoonacular_api_key:
        return []

    intent = _infer_dish_intent(ingredients)
    lower = [i.lower() for i in ingredients]
    has_tortilla = any("tortilla" in i for i in lower)
    cuisines = "mexican" if has_tortilla else None

    params = {
        "apiKey": settings.spoonacular_api_key,
        "query": intent,
        # spoonacular treats includeIngredients as a soft filter; keep it, but rely on ranking below.
        "includeIngredients": ",".join(ingredients),
        "number": limit,
        "addRecipeInformation": True,
        "fillIngredients": True,
        "instructionsRequired": False,
        "sort": "max-used-ingredients",
        "sortDirection": "desc",
        "ranking": 2,  # prefer recipes that use more of the given ingredients
        "type": "main course",
    }
    if cuisines:
        params["cuisine"] = cuisines
    r = requests.get(SPOONACULAR_SEARCH, params=params, timeout=10)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Spoonacular error")
    data = r.json()
    return data.get("results", [])


def fetch_recipe_details(recipe_id: int) -> dict:
    """Fetch detailed recipe information including instructions."""
    if not settings.spoonacular_api_key:
        raise HTTPException(status_code=502, detail="Spoonacular API key missing")

    url = SPOONACULAR_INFORMATION.format(recipe_id=recipe_id)
    params = {"apiKey": settings.spoonacular_api_key, "includeNutrition": False}
    r = requests.get(url, params=params, timeout=10)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Spoonacular detail error")
    data = r.json()
    return {
        "id": data.get("id"),
        "title": data.get("title"),
        "image": data.get("image"),
        "instructions": data.get("instructions"),
        "analyzedInstructions": data.get("analyzedInstructions", []),
        "readyInMinutes": data.get("readyInMinutes"),
        "servings": data.get("servings"),
        "sourceUrl": data.get("sourceUrl"),
    }


def score_and_rank(user_ings: list[str], candidates: list[dict], top_k: int = 5) -> list[dict]:
    """Score recipes using ingredient overlap plus intent match; filter out zero-match results."""
    # Normalize user ingredients to tokens for partial matching (e.g., "flour tortillas" -> "tortilla").
    def normalize_tokens(items: list[str]) -> set[str]:
        tokens: set[str] = set()
        for raw in items:
            for token in raw.lower().replace("-", " ").split():
                if token:
                    tokens.add(token.rstrip("s"))  # crude singularize
        return tokens

    user_tokens = normalize_tokens(user_ings)
    scored = []
    intent = _infer_dish_intent(user_ings)
    intent_lower = intent.lower()
    tortilla_mode = any("tortilla" in i.lower() for i in user_ings)

    for c in candidates:
        used = [i.get("name", "") for i in c.get("usedIngredients", [])]
        missed = [i.get("name", "") for i in c.get("missedIngredients", [])]

        used_tokens = normalize_tokens(used)
        matched_tokens = used_tokens & user_tokens
        matched = len(matched_tokens)
        missing_ct = len(missed)

        score = matched * 2 - missing_ct  # base score

        # Boost if title/summary contains inferred intent
        title = (c.get("title") or "").lower()
        summary = (c.get("summary") or "").lower()
        if intent_lower and (intent_lower in title or intent_lower in summary):
            score += 3
        # Additional boost when tortilla is present and title mentions taco/fajita/wrap
        if tortilla_mode and any(k in title for k in ["taco", "fajita", "quesadilla"]):
            score += 4

        scored.append(
            {
                "id": c.get("id"),
                "title": c.get("title"),
                "image": c.get("image"),
                "score": score,
                "missing": missed,
                "matched": sorted(matched_tokens),
                "source": "spoonacular",
            }
        )
    # Drop zero-match recipes to avoid noisy suggestions.
    scored = [r for r in scored if r["matched"]]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
