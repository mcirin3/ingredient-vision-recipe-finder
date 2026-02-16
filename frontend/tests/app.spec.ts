import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load Spoonacular key if available (used only when hitting the real API).
dotenv.config({ path: '../backend/app/.env' });
dotenv.config(); // fallback to frontend/.env if present
const SPOON_KEY = process.env.SPOONACULAR_API_KEY;

test.skip('happy path steak taco (TC-1,5,15,22,27)', async ({ page }) => {
  test.skip(!SPOON_KEY, 'SPOONACULAR_API_KEY not set; skipping live recipe test.');

  // Stub fetch. If SPOONACULAR_API_KEY is available, call Spoonacular for /recipes; otherwise return a canned response.
  await page.addInitScript(() => {
    const jsonResponse = (body: unknown) =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/upload-image')) {
        return jsonResponse({ image_id: 'stub-image', status: 'uploaded' });
      }
      if (url.includes('/analyze')) {
        return jsonResponse({
          ingredients_raw: ['Steak', 'Tortilla', 'Onion'],
          ingredients_normalized: ['steak', 'tortilla', 'onion'],
        });
      }
      if (url.match(/\/recipes\/\d+$/)) {
        return jsonResponse({
          id: 1,
          title: 'Steak Tacos',
          instructions: '',
          analyzedInstructions: [],
        });
      }
      if (url.endsWith('/recipes')) {
        // Always delegate to the live Spoonacular handler when present.
        if ((window as any).__fetchRecipes) {
          return (window as any).__fetchRecipes(input, init);
        }
        // Without handler (should not happen when key is present) return empty.
        return jsonResponse({ recipes: [] });
      }
      if (url.endsWith('/health')) {
        return jsonResponse({ status: 'ok' });
      }
      return originalFetch(input, init);
    };
  });

  // Install a live fetch handler for /recipes that hits Spoonacular.
  await page.addInitScript(([apiKey]) => {
    (window as any).__fetchRecipes = async (_input: RequestInfo | URL, init: RequestInit = {}) => {
      try {
        const payload = init.body ? JSON.parse(init.body as string) : { ingredients: [] };
        const ingredients: string[] = payload.ingredients || [];
        const params = new URLSearchParams({
          apiKey,
          includeIngredients: ingredients.join(','),
          number: '5',
          addRecipeInformation: 'true',
          instructionsRequired: 'false',
          sort: 'max-used-ingredients',
          sortDirection: 'desc',
          ranking: '2',
          type: 'main course',
          cuisine: ingredients.some((i) => i.toLowerCase().includes('tortilla')) ? 'mexican' : '',
        });
        const resp = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`);
        const data = await resp.json();
        const recipes =
          data?.results?.map((r: any) => ({
            id: r.id,
            title: r.title,
            image: r.image,
            score: r.spoonacularScore ?? 0,
            missing: (r.missedIngredients || []).map((m: any) => m.name),
            matched: (r.usedIngredients || []).map((m: any) => m.name),
            source: 'spoonacular',
          })) ?? [];
        return new Response(JSON.stringify({ recipes }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ recipes: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
    };
  }, [SPOON_KEY]);

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');

  await expect(page.getByText(/confirm ingredients/i)).toBeVisible();
  await expect(page.getByText(/steak/i)).toBeVisible();
  await expect(page.getByText(/tortilla/i)).toBeVisible();

  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText(/recipe recommendations/i)).toBeVisible({ timeout: 15000 });
  const cards = page.getByRole('heading', { level: 3 });
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(3);
});

test('unsupported file shows friendly error (TC-2)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/bad_type.txt');
  await expect(page.getByText(/valid image file/i)).toBeVisible();
});
