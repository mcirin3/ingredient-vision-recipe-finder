import requests
from fastapi import HTTPException

from ..core.config import settings

SPOONACULAR_SEARCH = "https://api.spoonacular.com/recipes/complexSearch"
SPOONACULAR_INFORMATION = "https://api.spoonacular.com/recipes/{recipe_id}/information"


def _infer_dish_intent(ingredients: list[str]) -> str:
    """Naive intent inference: prefer a protein + style; fallback to top two ingredients."""
    lower = [i.lower() for i in ingredients]
    proteins = [i for i in lower if any(p in i for p in ["chicken", "beef", "pork", "steak", "shrimp", "salmon", "tofu", "egg"])]
    cuisines = [i for i in lower if any(c in i for c in ["taco", "curry", "stir fry", "pasta", "soup", "salad", "stew", "sandwich"])]
    if proteins and cuisines:
        return f"{proteins[0]} {cuisines[0]}"
    if proteins:
        return proteins[0]
    return " ".join(lower[:2]) if lower else ""


def fetch_candidates(ingredients: list[str], limit: int = 15) -> list[dict]:
    """Fetch candidate recipes using complexSearch with intent keyword + includeIngredients."""
    if not settings.spoonacular_api_key:
        return []

    intent = _infer_dish_intent(ingredients)
    params = {
        "apiKey": settings.spoonacular_api_key,
        "query": intent,
        "includeIngredients": ",".join(ingredients),
        "number": limit,
        "addRecipeInformation": True,
        "fillIngredients": True,
        "instructionsRequired": False,
        "sort": "max-used-ingredients",
        "sortDirection": "desc",
    }
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
    """Score recipes using ingredient overlap plus intent match."""
    user_set = set(user_ings)
    scored = []
    intent = _infer_dish_intent(user_ings)
    intent_lower = intent.lower()

    for c in candidates:
        used = [i.get("name", "") for i in c.get("usedIngredients", [])]
        missed = [i.get("name", "") for i in c.get("missedIngredients", [])]
        matched = len(set(used) & user_set)
        missing_ct = len(missed)

        score = matched * 2 - missing_ct  # base score

        # Boost if title/summary contains inferred intent
        title = (c.get("title") or "").lower()
        summary = (c.get("summary") or "").lower()
        if intent_lower and (intent_lower in title or intent_lower in summary):
            score += 3

        scored.append(
            {
                "id": c.get("id"),
                "title": c.get("title"),
                "image": c.get("image"),
                "score": score,
                "missing": missed,
                "matched": list(set(used) & user_set),
                "source": "spoonacular",
            }
        )
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
