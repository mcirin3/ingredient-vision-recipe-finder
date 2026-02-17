from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.spoonacular_service import (
    fetch_candidates,
    fetch_recipe_details,
    score_and_rank,
)

router = APIRouter(prefix="/recipes", tags=["recipes"])


class RecipesRequest(BaseModel):
    ingredients: list[str]
    cuisine: str | None = None


class RecipeOut(BaseModel):
    id: int | None
    title: str | None
    image: str | None
    score: int
    missing: list[str]
    matched: list[str]
    source: str


class RecipesResponse(BaseModel):
    recipes: list[RecipeOut]


@router.post("", response_model=RecipesResponse)
async def get_recipes(payload: RecipesRequest):
    if not payload.ingredients:
        raise HTTPException(status_code=400, detail="ingredients required")

    candidates = fetch_candidates(payload.ingredients, cuisine=payload.cuisine)
    ranked = score_and_rank(payload.ingredients, candidates)
    return RecipesResponse(recipes=ranked)


@router.get("/{recipe_id}")
async def get_recipe_details(recipe_id: int):
    return fetch_recipe_details(recipe_id)
