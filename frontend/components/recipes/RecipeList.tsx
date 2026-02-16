'use client';

import React, { useState } from 'react';
import { MdFace } from 'react-icons/md';
import RecipeCard from './RecipeCard';
import RecipeDetail from './RecipeDetail';
import { RankedRecipe } from '@/types/recipe';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MESSAGES } from '@/lib/constants';
import { getRecipeDetails } from '@/lib/api';

interface RecipeListProps {
  recipes: RankedRecipe[];
  userIngredients: string[];
  onStartOver: () => void;
}

export default function RecipeList({ recipes, userIngredients, onStartOver }: RecipeListProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<RankedRecipe | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleSelect = async (recipe: RankedRecipe) => {
    setSelectedRecipe(recipe);
    if (!recipe.id) return;
    setIsDetailLoading(true);
    try {
      const detail = await getRecipeDetails(recipe.id);
      setSelectedRecipe({ ...recipe, ...detail });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 px-4">
        <div className="text-center space-y-2">
          <MdFace className="w-20 h-20 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">No Recipes Found</h2>
          <p className="text-gray-600 max-w-md">
            {MESSAGES.NO_RECIPES}
          </p>
        </div>
        <Button onClick={onStartOver} variant="primary" size="lg">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Recipe Recommendations
          </h2>
          <p className="text-gray-600 mt-1">
            Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} for your ingredients
          </p>
        </div>
        <Button onClick={onStartOver} variant="secondary">
          Start Over
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 pb-4 border-b">
        <span className="text-sm text-gray-600">Your ingredients:</span>
        {userIngredients.map((ingredient, index) => (
          <span
            key={index}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
          >
            {ingredient}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => handleSelect(recipe)}
          />
        ))}
      </div>

      <Modal
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        maxWidth="xl"
      >
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            loading={isDetailLoading}
          />
        )}
      </Modal>
    </div>
  );
}
