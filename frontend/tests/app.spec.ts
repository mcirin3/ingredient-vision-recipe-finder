import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load Spoonacular key if available (used only when hitting the real API).
dotenv.config({ path: '../backend/app/.env' });
dotenv.config(); // fallback to frontend/.env if present
const SPOON_KEY = process.env.SPOONACULAR_API_KEY;

test('unsupported file shows friendly error (TC-2)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/bad_type.txt');
  await expect(page.getByText(/valid image file/i)).toBeVisible();
});
