'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { MdClose } from 'react-icons/md';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface IngredientPreviewProps {
  imageUrl: string;
  detectedIngredients: string[];
  isProcessing: boolean;
  imageId?: string;
  onConfirm: (ingredients: string[], cuisine?: string, mealType?: string) => void;
  onRetake: () => void;
  selectedCuisine?: string;
  onCuisineChange?: (value?: string) => void;
  selectedMealType?: string;
  onMealTypeChange?: (value?: string) => void;
}

export default function IngredientPreview({
  imageUrl,
  detectedIngredients,
  isProcessing,
  imageId,
  onConfirm,
  onRetake,
  selectedCuisine,
  onCuisineChange,
  selectedMealType,
  onMealTypeChange,
}: IngredientPreviewProps) {
  const [ingredients, setIngredients] = useState<string[]>(detectedIngredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [cuisine, setCuisine] = useState<string>(selectedCuisine || '');
  const [mealType, setMealType] = useState<string>(selectedMealType || '');

  useEffect(() => {
    setIngredients(detectedIngredients);
  }, [detectedIngredients]);

  useEffect(() => {
    if (selectedCuisine !== undefined) {
      setCuisine(selectedCuisine);
    }
  }, [selectedCuisine]);

  useEffect(() => {
    if (selectedMealType !== undefined) {
      setMealType(selectedMealType);
    }
  }, [selectedMealType]);

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddIngredient = () => {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setNewIngredient('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  const handleConfirm = () => {
    if (ingredients.length > 0) {
      onConfirm(
        ingredients,
        cuisine || undefined,
        mealType || undefined
      );
    }
  };

  const handleCuisineChange = (value: string) => {
    setCuisine(value);
    onCuisineChange?.(value || undefined);
  };

  const handleMealTypeChange = (value: string) => {
    setMealType(value);
    onMealTypeChange?.(value || undefined);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isProcessing ? 'Processing Your Image...' : 'Confirm Ingredients'}
        </h2>
        <p className="text-gray-600">
          {isProcessing
            ? 'Detecting ingredients...'
            : 'Review and edit the ingredients before finding recipes'}
        </p>
        {!isProcessing && imageId && (
          <p className="text-sm text-gray-500 mt-1">
            Upload complete. Image ID: <span className="font-mono">{imageId}</span>
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={imageUrl}
                alt="Uploaded ingredients"
                fill
                className="object-cover"
              />
            </div>
            <Button
              onClick={onRetake}
              variant="secondary"
              size="sm"
              fullWidth
              className="mt-4"
            >
              Retake Photo
            </Button>
          </CardContent>
        </Card>

        {/* Ingredients List */}
        <Card>
          <CardContent className="p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                <p className="text-gray-600">Detecting ingredients...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 min-h-[100px]">
                  {ingredients.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No ingredients detected. Add some manually below.
                    </p>
                  ) : (
                    ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {ingredient}
                        <button
                          onClick={() => handleRemoveIngredient(index)}
                          aria-label="remove ingredient"
                          className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Ingredient */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add more ingredients
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., tomato, chicken..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={handleAddIngredient}
                      variant="secondary"
                      disabled={!newIngredient.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Cuisine Select */}
                <div className="border-t pt-4 space-y-2">
                  <label htmlFor="cuisine-select" className="block text-sm font-medium text-gray-700">
                    Expected cuisine (optional)
                  </label>
                  <select
                    id="cuisine-select"
                    value={cuisine}
                    onChange={(e) => handleCuisineChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">All cuisines</option>
                    <option value="mexican">Mexican</option>
                    <option value="italian">Italian</option>
                    <option value="american">American</option>
                    <option value="vietnamese">Vietnamese</option>
                    <option value="asian">Asian</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="indian">Indian</option>
                    <option value="french">French</option>
                    <option value="thai">Thai</option>
                    <option value="spanish">Spanish</option>
                    <option value="filipino">Filipino</option>
                    <option value="middle eastern">Middle Eastern</option>
                  </select>
                </div>

                {/* Meal Type Select */}
                <div className="border-t pt-4 space-y-2">
                  <label htmlFor="meal-type-select" className="block text-sm font-medium text-gray-700">
                    Meal type (optional)
                  </label>
                  <select
                    id="meal-type-select"
                    value={mealType}
                    onChange={(e) => handleMealTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Any meal</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>

                <Button
                  onClick={handleConfirm}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={ingredients.length === 0}
                  className="mt-4"
                >
                  Find Recipes ({ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
