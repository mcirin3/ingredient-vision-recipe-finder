export interface RankedRecipe {
  id: number | null;
  title: string | null;
  image?: string | null;
  score: number;
  missing: string[];
  matched: string[];
  source: string;
  instructions?: string | null;
  analyzedInstructions?: Array<{
    steps: Array<{
      number: number;
      step: string;
    }>;
  }>;
  readyInMinutes?: number | null;
  servings?: number | null;
  sourceUrl?: string | null;
}
