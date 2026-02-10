import React from 'react';
import Image from 'next/image';
import { FiClock, FiUsers, FiExternalLink, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { Recipe } from '@/types/recipe';
import { Button } from '@/components/ui/Button';

interface RecipeDetailProps {
  recipe: Recipe;
  userIngredients: string[];
  onClose: () => void;
}

export default function RecipeDetail({ recipe, userIngredients, onClose }: RecipeDetailProps) {
  const allIngredients = [
    ...recipe.usedIngredients.map((ing) => ({ ...ing, matched: true })),
    ...recipe.missedIngredients.map((ing) => ({ ...ing, matched: false })),
  ];

  const steps = recipe.analyzedInstructions?.[0]?.steps || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        {recipe.readyInMinutes && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FiClock className="w-4 h-4" />
              <span>{recipe.readyInMinutes} minutes</span>
            </div>
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <FiUsers className="w-4 h-4" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {recipe.image && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <div className="space-y-2">
          {allIngredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              {ingredient.matched ? (
                <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <FiAlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className={ingredient.matched ? 'text-gray-900' : 'text-orange-800 font-medium'}>
                  {ingredient.name}
                  {ingredient.amount && ` - ${ingredient.amount}`}
                </span>
                {!ingredient.matched && (
                  <span className="text-xs text-orange-600 ml-2">(missing)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {steps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {step.number}
                </div>
                <p className="text-gray-700 flex-1 pt-1">{step.step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions as HTML if no steps */}
      {steps.length === 0 && recipe.instructions && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
          <div
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: recipe.instructions }}
          />
        </div>
      )}

      {/* Source Link */}
      {recipe.sourceUrl && (
        <div className="pt-4 border-t">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            View original recipe
            <FiExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Close Button */}
      <div className="pt-4 border-t">
        <Button onClick={onClose} variant="secondary" size="lg" fullWidth>
          Close
        </Button>
      </div>
    </div>
  );
}
