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
  file: File,
  token?: string
): Promise<{ image_id: string; status: string; url?: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/upload-image`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to upload image');
  }

  return response.json();
}

// Vision + normalization
export async function analyzeImage(s3Key: string, token?: string): Promise<AnalyzeResponse> {
  const authHeader = token
    ? { Authorization: `Bearer ${token}` }
    : typeof window !== 'undefined' && localStorage.getItem('iv_token')
      ? { Authorization: `Bearer ${JSON.parse(localStorage.getItem('iv_token') as string).access_token}` }
      : {};

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
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
  mealType?: string,
  token?: string
) {
  const authHeader = token
    ? { Authorization: `Bearer ${token}` }
    : typeof window !== 'undefined' && localStorage.getItem('iv_token')
      ? { Authorization: `Bearer ${JSON.parse(localStorage.getItem('iv_token') as string).access_token}` }
      : {};

  const res = await fetch(`${API_BASE_URL}/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      ingredients,
      cuisine,
      meal_type: mealType,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to search recipes');
  }

  const data = await res.json();
  return data.recipes;
}

export async function getRecipeDetails(recipeId: number): Promise<Partial<RankedRecipe>> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined' && localStorage.getItem('iv_token')) {
    headers.Authorization = `Bearer ${
      JSON.parse(localStorage.getItem('iv_token') as string).access_token
    }`;
  }

  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, { headers });
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
