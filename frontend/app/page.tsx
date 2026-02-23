'use client';

import React, { useState, useCallback } from 'react';
import { MdOutlineClose, MdError } from 'react-icons/md';
import { FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import ImageUploader from '@/components/upload/ImageUploader';
import IngredientPreview from '@/components/upload/IngredientPreview';
import RecipeList from '@/components/recipes/RecipeList';
import { uploadImage, analyzeImage, searchRecipesByIngredients } from '@/lib/api';
import { RankedRecipe } from '@/types/recipe';
import { MESSAGES } from '@/lib/constants';

type AppState = 'upload' | 'processing' | 'ingredients' | 'recipes' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageId, setImageId] = useState<string>('');
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RankedRecipe[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<string | undefined>(undefined);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState<1 | 2 | 3>(1);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setState('error');
  }, []);

  const handleImageSelect = useCallback(
    async (file: File) => {
      setImageUrl(URL.createObjectURL(file));
      setState('processing');
      setError('');

      try {
        const result = await uploadImage(file);
        setImageId(result.image_id);

        const analysis = await analyzeImage(result.image_id);
        setDetectedIngredients(analysis.ingredients_normalized ?? []);
        setState('ingredients');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.PROCESSING_ERROR;
        handleError(errorMessage);
      }
    },
    [handleError]
  );

  const handleConfirmIngredients = useCallback(
    async (ingredients: string[], cuisine?: string, mealType?: string) => {
      setSelectedIngredients(ingredients);
      setSelectedCuisine(cuisine);
      setSelectedMealType(mealType);
      setState('processing');

      try {
        const searchResults = await searchRecipesByIngredients(ingredients, cuisine || undefined, mealType || undefined);
        setRecipes(searchResults);
        setState('recipes');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.RECIPES_ERROR;
        handleError(errorMessage);
      }
    },
    [handleError]
  );

  const handleRetake = useCallback(() => {
    setImageUrl('');
    setImageId('');
    setDetectedIngredients([]);
    setState('upload');
    setError('');
  }, []);

  const handleStartOver = useCallback(() => {
    setImageUrl('');
    setImageId('');
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
        <div className="space-y-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">Get recipe recommendations</h2>
              <p className="text-gray-700">
                Upload an ingredient photo, confirm what we detected, and get recipes tailored to what you have.
              </p>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
                data-testid="first-time-guide-btn"
                className="inline-flex items-center gap-2"
              >
                {showGuide ? 'Hide First Time Guide' : 'First Time Guide'}
              </Button>
            </div>
            <div>
              <ImageUploader onImageSelect={handleImageSelect} onError={handleError} />
            </div>
          </div>

          {showGuide && (
            <section
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
              aria-label="First time guide"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">How it works</h3>
                  <p className="text-gray-700">
                    Follow these three steps to go from a quick photo to ready-to-cook recipes.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setGuideStep(step as 1 | 2 | 3)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                          guideStep === step
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        {`Step ${step}`}
                      </button>
                    ))}
                  </div>
                  {guideStep === 1 && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="font-semibold text-gray-900">Snap & Upload</p>
                      <p className="text-sm text-gray-700 mt-1">
                        Take a clear photo of all visible ingredients, then drop it into the uploader.
                      </p>
                    </div>
                  )}
                  {guideStep === 2 && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="font-semibold text-gray-900">Confirm Ingredients</p>
                      <p className="text-sm text-gray-700 mt-1">
                        Remove non-food items, add anything we missed, and optionally pick a cuisine to focus results.
                      </p>
                    </div>
                  )}
                  {guideStep === 3 && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="font-semibold text-gray-900">Get Recipes</p>
                      <p className="text-sm text-gray-700 mt-1">
                        We show matches with missing ingredients listed so you know what else you need.
                      </p>
                    </div>
                  )}
                </div>
                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 via-white to-blue-50 border border-blue-100">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" data-testid="guide-media">
                    <div className="w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-800 font-semibold">See the flow</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload ➜ Confirm ➜ Recipes. Missing items are highlighted on each card.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

        {/* Processing or Ingredients State */}
        {(state === 'processing' || state === 'ingredients') && imageUrl && (
          <IngredientPreview
          imageUrl={imageUrl}
          detectedIngredients={detectedIngredients}
          isProcessing={state === 'processing'}
          imageId={imageId}
          onConfirm={handleConfirmIngredients}
          onRetake={handleRetake}
          selectedCuisine={selectedCuisine}
          onCuisineChange={setSelectedCuisine}
          selectedMealType={selectedMealType}
          onMealTypeChange={setSelectedMealType}
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
          <div className="flex items-center justify-center min-h-[300px]" data-testid="processing-indicator">
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
