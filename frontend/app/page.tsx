'use client';

import React, { useState, useCallback } from 'react';
import { MdOutlineClose, MdError, MdCheckCircle } from 'react-icons/md';
import { FiLoader } from 'react-icons/fi';
import ImageUploader from '@/components/upload/ImageUploader';
import IngredientPreview from '@/components/upload/IngredientPreview';
import RecipeList from '@/components/recipes/RecipeList';
import { uploadImage, searchRecipesByIngredients } from '@/lib/api';
import { Recipe } from '@/types/recipe';
import { MESSAGES, MAX_RECIPES } from '@/lib/constants';

type AppState = 'upload' | 'processing' | 'ingredients' | 'recipes' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setState('error');
  }, []);

  const handleImageSelect = useCallback(
    async (file: File) => {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setState('processing');
      setError('');
      setIsProcessing(true);

      try {
        const result = await uploadImage(file);
        setDetectedIngredients(result.ingredients);
        setState('ingredients');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.PROCESSING_ERROR;
        handleError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError]
  );

  const handleConfirmIngredients = useCallback(
    async (ingredients: string[]) => {
      setSelectedIngredients(ingredients);
      setState('processing');
      setIsProcessing(true);

      try {
        const searchResults = await searchRecipesByIngredients(ingredients);
        const limitedRecipes = searchResults.slice(0, MAX_RECIPES);
        setRecipes(limitedRecipes);
        setState('recipes');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.PROCESSING_ERROR;
        handleError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError]
  );

  const handleRetake = useCallback(() => {
    setImageFile(null);
    setImageUrl('');
    setDetectedIngredients([]);
    setState('upload');
    setError('');
  }, []);

  const handleStartOver = useCallback(() => {
    setImageFile(null);
    setImageUrl('');
    setDetectedIngredients([]);
    setRecipes([]);
    setSelectedIngredients([]);
    setState('upload');
    setError('');
  }, []);

  const handleDismissError = useCallback(() => {
    setError('');
    if (state === 'error') {
      setState('upload');
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              🍳 Ingredient Vision
            </h1>
            {state !== 'upload' && (
              <button
                onClick={handleStartOver}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <MdOutlineClose className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Error State */}
        {state === 'error' && error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MdError className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-red-800">{error}</p>
                <button
                  onClick={handleDismissError}
                  className="mt-3 text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload State */}
        {state === 'upload' && !error && (
          <ImageUploader onImageSelect={handleImageSelect} onError={handleError} />
        )}

        {/* Processing or Ingredients State */}
        {(state === 'processing' || state === 'ingredients') && imageUrl && (
          <IngredientPreview
            imageUrl={imageUrl}
            detectedIngredients={detectedIngredients}
            isProcessing={state === 'processing'}
            onConfirm={handleConfirmIngredients}
            onRetake={handleRetake}
          />
        )}

        {/* Recipes State */}
        {state === 'recipes' && (
          <RecipeList
            recipes={recipes}
            userIngredients={selectedIngredients}
            onStartOver={handleStartOver}
          />
        )}

        {/* No Results State */}
        {state === 'processing' && recipes.length === 0 && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <FiLoader className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Searching for recipes...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>
              Get recipe recommendations from your ingredients with AI-powered vision recognition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

