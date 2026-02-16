import { test, expect } from '@playwright/test';

test('happy path steak taco (TC-1,5,15,22,27)', async ({ page }) => {
  // Mock backend APIs
  await page.route('**/upload-image', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: { image_id: 'stub-image', status: 'uploaded' },
    });
  });
  await page.route('**/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: { ingredients_raw: ['Steak', 'Tortilla', 'Onion'], ingredients_normalized: ['steak', 'tortilla', 'onion'] },
    });
  });
  await page.route('**/recipes', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          recipes: [
            { id: 1, title: 'Steak Tacos', image: 'https://example.com/taco.jpg', score: 10, missing: ['cilantro'], matched: ['steak'], source: 'stub' },
          ],
        },
      });
    } else {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: { id: 1, title: 'Steak Tacos', instructions: '', analyzedInstructions: [] },
      });
    }
  });

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');

  await expect(page.getByText(/confirm ingredients/i)).toBeVisible();
  await expect(page.getByText(/steak/i)).toBeVisible();
  await expect(page.getByText(/tortilla/i)).toBeVisible();

  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText(/recipe recommendations/i)).toBeVisible({ timeout: 15000 });
});

test('unsupported file shows friendly error (TC-2)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/bad_type.txt');
  await expect(page.getByText(/valid image file/i)).toBeVisible();
});
