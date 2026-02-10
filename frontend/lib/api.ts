import { API_BASE_URL } from './constants';
import { Recipe } from '@/types/recipe';
import { DetectedIngredient } from '@/types/ingredient';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Vision API
export async function uploadImage(file: File): Promise<{ ingredients: string[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/vision/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to detect ingredients from image');
  }

  return response.json();
}

// Recipe API
export async function searchRecipesByIngredients(
  ingredients: string[]
): Promise<Recipe[]> {
  const params = new URLSearchParams({
    ingredients: ingredients.join(','),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/recipes/by-ingredients?${params.toString()}`
  );

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to search recipes');
  }

  return response.json();
}

export async function getRecipeDetails(recipeId: number): Promise<Recipe> {
  const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`);

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to get recipe details');
  }

  return response.json();
}

// Health check
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new ApiError(response.status, 'Health check failed');
  }

  return response.json();
}
