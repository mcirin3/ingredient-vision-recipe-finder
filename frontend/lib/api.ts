import { API_BASE_URL } from './constants';
import { RankedRecipe } from '@/types/recipe';
import { AnalyzeResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Image Upload API (direct upload fallback)
export async function uploadImage(
  file: File
): Promise<{ image_id: string; status: string; url?: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/upload-image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to upload image');
  }

  return response.json();
}

// Vision + normalization
export async function analyzeImage(s3Key: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ s3_key: s3Key }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to analyze image');
  }

  return response.json();
}

// Recipe API
export async function searchRecipesByIngredients(
  ingredients: string[],
  cuisine?: string,
  mealType?: string
) {
  const res = await fetch(`${API_BASE_URL}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ingredients,
      cuisine,
      meal_type: mealType, // 👈 THIS is the missing piece
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch recipes");
  }

  const data = await res.json();
  return data.recipes;
}


export async function getRecipeDetails(recipeId: number): Promise<Partial<RankedRecipe>> {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to get recipe details');
  }
  return response.json();
}

// Health check
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new ApiError(response.status, 'Health check failed');
  }

  return response.json();
}
