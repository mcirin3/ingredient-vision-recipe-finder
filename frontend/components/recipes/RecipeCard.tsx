import React from 'react';
import Image from 'next/image';
import { FiCheck, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const matchPercentage = Math.round(
    (recipe.usedIngredientCount / (recipe.usedIngredientCount + recipe.missedIngredientCount)) * 100
  );

  return (
    <Card hover onClick={onClick} className="h-full">
      <div className="relative w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Match</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">{matchPercentage}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FiCheck className="w-4 h-4 text-green-600" />
              <span>{recipe.usedIngredientCount} matched</span>
            </div>
            {recipe.missedIngredientCount > 0 && (
              <div className="flex items-center gap-1">
                <FiAlertTriangle className="w-4 h-4 text-orange-600" />
                <span>{recipe.missedIngredientCount} missing</span>
              </div>
            )}
          </div>

          {recipe.readyInMinutes && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FiClock className="w-4 h-4" />
              <span>{recipe.readyInMinutes} minutes</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
