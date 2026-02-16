import React from 'react';
import Image from 'next/image';
import { FiCheck, FiAlertTriangle, FiExternalLink } from 'react-icons/fi';
import { RankedRecipe } from '@/types/recipe';
import { Button } from '@/components/ui/Button';

interface RecipeDetailProps {
  recipe: RankedRecipe;
  onClose: () => void;
  loading?: boolean;
}

export default function RecipeDetail({ recipe, onClose, loading }: RecipeDetailProps) {
  const matched = recipe.matched || [];
  const missing = recipe.missing || [];
  const steps = recipe.analyzedInstructions?.[0]?.steps || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        <p className="text-gray-600">Source: {recipe.source}</p>
        {(recipe.readyInMinutes || recipe.servings) && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            {recipe.readyInMinutes ? <span>{recipe.readyInMinutes} minutes</span> : null}
            {recipe.servings ? <span>{recipe.servings} servings</span> : null}
          </div>
        )}
      </div>

      {/* Image */}
      {recipe.image && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={recipe.image}
            alt={recipe.title || 'Recipe image'}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Matched</h3>
            {matched.length === 0 && <p className="text-sm text-gray-600">None</p>}
            <div className="flex flex-wrap gap-2">
              {matched.map((ing, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm"
                >
                  <FiCheck className="w-4 h-4" />
                  {ing}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Missing</h3>
            {missing.length === 0 && <p className="text-sm text-gray-600">None</p>}
            <div className="flex flex-wrap gap-2">
              {missing.map((ing, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm"
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  {ing}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
        {loading && (
          <p className="text-sm text-gray-600">Loading instructions...</p>
        )}
        {!loading && steps.length > 0 && (
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
        )}
        {!loading && steps.length === 0 && recipe.instructions && (
          <div
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: recipe.instructions }}
          />
        )}
        {!loading && !steps.length && !recipe.instructions && (
          <p className="text-sm text-gray-600">Instructions not available.</p>
        )}
      </div>

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
