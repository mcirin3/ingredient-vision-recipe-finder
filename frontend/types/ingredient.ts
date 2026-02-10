export interface Ingredient {
  name: string;
  matched?: boolean; // Whether the ingredient was matched in a recipe
}

export interface DetectedIngredient {
  name: string;
  confidence?: number; // Optional confidence score from vision API
}
