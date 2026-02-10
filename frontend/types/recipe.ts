export interface Recipe {
  id: number;
  title: string;
  image?: string;
  missedIngredientCount: number;
  missedIngredients: Array<{
    name: string;
    amount?: string;
  }>;
  usedIngredientCount: number;
  usedIngredients: Array<{
    name: string;
    amount?: string;
  }>;
  unusedIngredients?: Array<{
    name: string;
  }>;
  likes?: number;
  instructions?: string;
  analyzedInstructions?: Array<{
    steps: Array<{
      number: number;
      step: string;
    }>;
  }>;
  sourceUrl?: string;
  readyInMinutes?: number;
  servings?: number;
}

export interface RecipeSearchResponse {
  recipes: Recipe[];
  totalResults: number;
}
