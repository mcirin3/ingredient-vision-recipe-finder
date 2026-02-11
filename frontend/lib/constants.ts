// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// UI Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_RECIPES = 5;

// Messages
export const MESSAGES = {
  UPLOAD_ERROR: 'Failed to upload image. Please try again.',
  PROCESSING_ERROR: 'Failed to process image. Please try again.',
  NO_RECIPES: 'No recipes found with the given ingredients. Try adding more ingredients!',
  FILE_TOO_LARGE: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  INVALID_FILE_TYPE: 'Please upload a valid image file (JPEG, PNG, or WebP)',
  PROCESSING_TIME: 'This may take 5-10 seconds...',
};

// Routes
export const ROUTES = {
  HOME: '/',
  RECIPES: '/recipes',
};
