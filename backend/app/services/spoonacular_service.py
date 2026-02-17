import requests
from fastapi import HTTPException

from ..core.config import settings

SPOONACULAR_SEARCH = "https://api.spoonacular.com/recipes/complexSearch"
SPOONACULAR_INFORMATION = "https://api.spoonacular.com/recipes/{recipe_id}/information"

# Minimal synonym/alias map to make overlap scoring more robust to wording differences.
CANONICAL_MAP: dict[str, set[str]] = {
    "bell pepper": {"capsicum", "bell peppers"},
    "cilantro": {"coriander", "coriander leaves"},
    "scallion": {"green onion", "spring onion"},
    "tortilla": {"tortillas", "flour tortilla", "corn tortilla"},
    "cheese": {"cheddar", "mozzarella", "queso"},
    "beef": {"steak", "sirloin", "flank", "skirt", "ribeye", "beefsteak", "carne"},
    "lime": {"limes"},
}


def _infer_dish_intent(ingredients: list[str]) -> str:
    """
    Prefer a concrete dish hint:
    - If tortilla present with a protein -> "taco"
    - Else protein + second ingredient token (e.g., "steak onion")
    - Else join first two ingredients.
    """
    lower = [i.lower() for i in ingredients]
    proteins = [
        i
        for i in lower
        if any(
            p in i
            for p in [
                "chicken",
                "beef",
                "pork",
                "steak",
                "shrimp",
                "salmon",
                "tofu",
                "egg",
                "turkey",
                "chorizo",
                "fish",
            ]
        )
    ]
    has_tortilla = any("tortilla" in i for i in lower)
    if proteins and has_tortilla:
        return "taco"
    if proteins and len(lower) > 1:
        return f"{proteins[0]} {lower[1]}"
    return " ".join(lower[:2]) if lower else ""


def fetch_candidates(ingredients: list[str], limit: int = 50, cuisine: str | None = None) -> list[dict]:
    """Fetch candidate recipes using complexSearch, biased to maximize ingredient overlap."""
    if not settings.spoonacular_api_key:
        return []

    intent = _infer_dish_intent(ingredients)
    lower = [i.lower() for i in ingredients]
    has_tortilla = any("tortilla" in i for i in lower)
    has_steak = any("steak" in i or "beef" in i for i in lower)

    # Force a taco-focused query when tortilla + steak/beef are present to avoid drifting results.
    query = "steak taco" if (has_tortilla and has_steak) else intent

    params = {
        "apiKey": settings.spoonacular_api_key,
        "query": query,
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
    if cuisine:
        params["cuisine"] = cuisine
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


def score_and_rank(user_ings: list[str], candidates: list[dict]) -> list[dict]:
    """
    Filter to reasonable matches (>=50% overlap with user ingredients) and sort by match quality.
    """
    def canonicalize(token: str) -> str:
        token = token.rstrip("s")
        for canonical, variants in CANONICAL_MAP.items():
            if token == canonical or token in variants:
                return canonical
        return token

    def normalize_tokens(items: list[str]) -> set[str]:
        tokens: set[str] = set()
        for raw in items:
            for tok in raw.lower().replace("-", " ").split():
                if tok:
                    tokens.add(canonicalize(tok))
        return tokens

    user_tokens = normalize_tokens(user_ings)
    recipes: list[dict] = []

    for c in candidates:
        used = [i.get("name", "") for i in c.get("usedIngredients", [])]
        missed = [i.get("name", "") for i in c.get("missedIngredients", [])]

        used_tokens = normalize_tokens(used)
        matched_tokens = used_tokens & user_tokens

        match_ratio = len(matched_tokens) / max(len(user_tokens), 1)
        if match_ratio < 0.5:  # require at least 50% overlap
            continue

        score = int(match_ratio * 100)  # percent for UI bar

        recipes.append(
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

    recipes.sort(key=lambda r: (-r["score"], len(r["missing"])))
    return recipes
