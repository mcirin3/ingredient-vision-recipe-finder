'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MdOutlineClose, MdError } from 'react-icons/md';
import { FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import ImageUploader from '@/components/upload/ImageUploader';
import IngredientPreview from '@/components/upload/IngredientPreview';
import RecipeList from '@/components/recipes/RecipeList';
import { uploadImage, analyzeImage, searchRecipesByIngredients } from '@/lib/api';
import { RankedRecipe } from '@/types/recipe';
import { MESSAGES } from '@/lib/constants';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const { token, user, clearAuth, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/auth');
    }
  }, [hydrated, token, router]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setState('error');
  }, []);

  const handleImageSelect = useCallback(
    async (file: File) => {
      if (!token) {
        router.push('/auth');
        return;
      }
      setImageUrl(URL.createObjectURL(file));
      setState('processing');
      setError('');

      try {
        const result = await uploadImage(file, token);
        setImageId(result.image_id);

        const analysis = await analyzeImage(result.image_id, token);
        setDetectedIngredients(analysis.ingredients_normalized ?? []);
        setState('ingredients');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.PROCESSING_ERROR;
        handleError(errorMessage);
      }
    },
    [handleError, token, router]
  );

  const handleConfirmIngredients = useCallback(
    async (ingredients: string[], cuisine?: string, mealType?: string) => {
      if (!token) {
        router.push('/auth');
        return;
      }
      setSelectedIngredients(ingredients);
      setSelectedCuisine(cuisine);
      setSelectedMealType(mealType);
      setState('processing');

      try {
        const searchResults = await searchRecipesByIngredients(
          ingredients,
          cuisine || undefined,
          mealType || undefined,
          token
        );
        setRecipes(searchResults);
        setState('recipes');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.RECIPES_ERROR;
        handleError(errorMessage);
      }
    },
    [handleError, token, router]
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
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  Menu
                </Button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/');
                      }}
                    >
                      Find recipes
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/settings');
                      }}
                    >
                      Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/about');
                      }}
                    >
                      About
                    </button>
                  </div>
                )}
              </div>
              {!user ? (
                <Button variant="secondary" size="sm" onClick={() => router.push('/auth')}>
                  Sign in
                </Button>
              ) : (
                <>
                  <span className="text-sm text-gray-700">Hi, {user.email}</span>
                  <Button variant="outline" size="sm" onClick={() => { setMenuOpen(false); clearAuth(); }}>
                    Sign out
                  </Button>
                </>
              )}
              {state !== 'upload' && (
                <button
                  onClick={handleStartOver}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  title="Start over"
                >
                  <MdOutlineClose className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Ambient background shapes */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-16 -left-24 h-64 w-64 rounded-full bg-amber-200 blur-3xl opacity-60" />
          <div className="absolute top-32 -right-24 h-64 w-64 rounded-full bg-orange-300 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-200 blur-3xl opacity-40" />
        </div>
        {!token && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-5 py-4 shadow-sm">
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">Sign in to use the recipe finder</p>
              <p className="text-sm text-amber-700">Secure your uploads and keep your recipes personalized.</p>
            </div>
            <Button variant="accent" size="sm" onClick={() => router.push('/auth')}>
              Go to login
            </Button>
          </div>
        )}

        {hydrated && !token && (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="text-center text-gray-700 space-y-2">
              <div className="text-lg font-semibold">Redirecting to login…</div>
              <div className="text-sm">Please sign in or create an account to continue.</div>
            </div>
          </div>
        )}

        {token && (
          <>
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
                <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
                  <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/80 backdrop-blur shadow-lg p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 opacity-70 pointer-events-none" />
                    <div className="relative space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">
                        New • Faster results
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                        Turn your fridge photo into dinner ideas in seconds.
                      </h2>
                      <p className="text-gray-700 text-lg">
                        Snap, upload, confirm ingredients, then see curated recipes with missing items highlighted.
                      </p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Avg. time', value: '8s' },
                          { label: 'Top recipes', value: '5 shown' },
                          { label: 'Supports', value: 'JPEG / PNG' },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                            <div className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</div>
                            <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="accent"
                          size="md"
                          onClick={() => setShowGuide((v) => !v)}
                          aria-expanded={showGuide}
                          data-testid="first-time-guide-btn"
                          className="inline-flex items-center gap-2"
                        >
                          {showGuide ? 'Hide walkthrough' : 'Show walkthrough'}
                        </Button>
                        <span className="text-sm text-gray-600">No sign-in? Use the Menu &rarr; Login.</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-100 bg-white shadow-xl p-6">
                    <div className="mb-4 text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      Ready to upload
                    </div>
                    <ImageUploader onImageSelect={handleImageSelect} onError={handleError} />
                  </div>
                </div>

                <div
                  className={`transition-all duration-400 ease-out ${
                    showGuide ? 'max-h-[900px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'
                  } overflow-hidden`}
                >
                  <section
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                    aria-label="First time guide"
                  >
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        {
                          title: '1) Snap & Upload',
                          body: 'Use good lighting and fit all items in frame. JPEG/PNG up to 10MB.',
                        },
                        {
                          title: '2) Confirm & Tweak',
                          body: 'Remove non-food items, add missing ones, pick cuisine and meal type.',
                        },
                        {
                          title: '3) Get Recipes',
                          body: 'We rank by match quality and call out missing ingredients up front.',
                        },
                      ].map((step, idx) => (
                        <div key={step.title} className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                          <div className="text-xs font-semibold text-amber-700 mb-2">Step {idx + 1}</div>
                          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-700 mt-1">{step.body}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
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
          </>
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

