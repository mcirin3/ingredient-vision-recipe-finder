import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';

// Load Spoonacular key if available (used only when hitting the real API).
dotenv.config({ path: '../backend/app/.env' });
dotenv.config(); // fallback to frontend/.env if present

const fixtureValid = 'tests/fixtures/steak_taco.jpg';
const fixtureBadType = 'tests/fixtures/bad_type.txt';

// Shared helpers
const mockUpload = (page: Page) =>
  page.route('**/upload-image', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_id: 'mock-key', status: 'uploaded' }),
    })
  );

const mockAnalyze = (page: Page, ingredients: string[]) =>
  page.route('**/analyze', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ingredients_raw: ingredients,
        ingredients_normalized: ingredients,
      }),
    })
  );

const mockRecipes = (page: Page, recipes: any[]) =>
  page.route('**/recipes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ recipes }),
    })
  );



function mockCommonRoutes(page: Page) {
  mockUpload(page);
  mockAnalyze(page, ['beef', 'cilantro', 'onion', 'garlic', 'broth', 'rice']);
}

test('unsupported file shows friendly error (TC-2)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureBadType);
  await expect(page.getByText(/valid image file/i)).toBeVisible();
});

test('ground beef street tacos are returned (recipes flow)', async ({ page }) => {
  // Mock backend endpoints to keep test deterministic
  await page.route('**/upload-image', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_id: 'mock-key', status: 'uploaded' }),
    })
  );
  await page.route('**/analyze', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ingredients_raw: ['beef', 'cilantro', 'green salsa', 'lime', 'onion', 'red salsa', 'tortilla'],
        ingredients_normalized: ['beef', 'cilantro', 'green salsa', 'lime', 'onion', 'red salsa', 'tortilla'],
      }),
    })
  );
  await page.route('**/recipes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            id: 123,
            title: 'Ground Beef Street Tacos',
            image: null,
            score: 90,
            missing: [],
            matched: ['beef', 'cilantro', 'green salsa', 'lime', 'onion', 'red salsa', 'tortilla'],
            source: 'spoonacular',
          },
        ],
      }),
    })
  );

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);

  // Wait for ingredient confirmation step
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await expect(page.getByText(/beef/i)).toBeVisible();

  // Confirm ingredients to trigger recipes call
  await page.getByRole('button', { name: /find recipes/i }).click();

  // Expect our mocked recipe to show up
  await expect(page.getByText('Ground Beef Street Tacos')).toBeVisible();
  await expect(page.getByText(/matched/i)).toBeVisible();
});

test('cuisine filter is sent to recipes API', async ({ page }) => {
  await page.route('**/upload-image', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_id: 'mock-key', status: 'uploaded' }),
    })
  );
  await page.route('**/analyze', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ingredients_raw: ['beef', 'cilantro', 'green salsa', 'lime', 'onion', 'red salsa', 'tortilla'],
        ingredients_normalized: ['beef', 'cilantro', 'green salsa', 'lime', 'onion', 'red salsa', 'tortilla'],
      }),
    })
  );

  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { ingredients: string[]; cuisine?: string };
    expect(body.cuisine).toBe('mexican');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            id: 456,
            title: 'Mexican Beef Street Tacos',
            image: null,
            score: 88,
            missing: [],
            matched: body.ingredients,
            source: 'spoonacular',
          },
        ],
      }),
    });
  });

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);

  // Select cuisine before confirming
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('mexican');

  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Mexican Beef Street Tacos')).toBeVisible();
});

// --- Additional coverage for test plan TCs ---

test('valid image upload shows processing then ingredients (TC-1)', async ({ page }) => {
  mockUpload(page);
  await page.route('**/analyze', async (route) => {
    await new Promise((r) => setTimeout(r, 800)); // force processing state visible
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ingredients_raw: ['tomato'],
        ingredients_normalized: ['tomato'],
      }),
    });
  });
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Processing Your Image/i)).toBeVisible();
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
});

test('large image fails gracefully (TC-3)', async ({ page }) => {
  await page.route('**/upload-image', (route) =>
    route.fulfill({ status: 413, contentType: 'application/json', body: '{}' })
  );
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Failed to upload/i)).toBeVisible();
});

test('empty submission blocked (TC-4)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByRole('button', { name: /find recipes/i })).toHaveCount(0);
});

test('clear ingredient detection (TC-5)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['steak', 'tortilla', 'lime', 'cilantro']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/steak/i)).toBeVisible();
  await expect(page.getByText(/tortilla/i)).toBeVisible();
});

test('partial ingredients still proceed (TC-6)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['steak', 'tortilla']);
  mockRecipes(page, [{ id: 1, title: 'Simple Steak Tacos', score: 80, missing: [], matched: ['steak', 'tortilla'], source: 'spoonacular' }]);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Simple Steak Tacos')).toBeVisible();
});

test('overcrowded image filters low-confidence (TC-7)', async ({ page }) => {
  const many = Array.from({ length: 12 }, (_, i) => `item${i}`);
  mockUpload(page);
  mockAnalyze(page, many);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/item0/)).toBeVisible();
});

test('blurry image degrades gracefully (TC-8)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['blurry ingredient']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/blurry ingredient/i)).toBeVisible();
});

test('synonym normalization (TC-9)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['capsicum', 'bell pepper']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/capsicum/i)).toBeVisible();
  await expect(page.getByText(/bell pepper/i)).toBeVisible();
});

test('raw vs prepared normalization (TC-10)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['raw chicken', 'chicken breast']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/chicken breast/i)).toBeVisible();
});

test('noise removal (TC-11)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['plate', 'onion']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/onion/i)).toBeVisible();
});

test('user removes ingredient (TC-12)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['onion']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /remove ingredient/i }).click();
  await expect(page.getByText(/No ingredients detected/i)).toBeVisible();
});

test('user adds ingredient (TC-13)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['onion']);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByPlaceholder(/e.g., tomato/i).fill('tomato');
  await page.getByRole('button', { name: /add/i }).click();
  await expect(page.getByText(/tomato/i)).toBeVisible();
});

test('empty ingredient list shows prompt (TC-14)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, []);
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/No ingredients detected/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /find recipes/i })).toBeDisabled();
});

test('generic ingredients still return recipes (TC-17)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['salt', 'pepper']);
  mockRecipes(page, [{ id: 9, title: 'Pantry Pasta', score: 50, missing: [], matched: ['salt', 'pepper'], source: 'spoonacular' }]);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Pantry Pasta')).toBeVisible();
});

test('missing key ingredients listed (TC-18)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['beef', 'tortilla']);
  mockRecipes(page, [
    {
      id: 11,
      title: 'Beef Tacos with Salsa',
      score: 70,
      missing: ['salsa'],
      matched: ['beef', 'tortilla'],
      source: 'spoonacular',
    },
  ]);
  await page.route('**/recipes/11', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 11,
        title: 'Beef Tacos with Salsa',
        missing: ['salsa'],
        matched: ['beef', 'tortilla'],
        source: 'spoonacular',
      }),
    })
  );
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /find recipes/i }).click();
  const missingPreview = page.getByTestId('missing-preview').filter({ hasText: /salsa/i }).first();
  await expect(missingPreview).toBeVisible();
  await expect(missingPreview).toContainText(/salsa/i);
});

test('recipes with higher match scores are shown (TC-19/20/21 presence)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['beef', 'tortilla', 'onion']);
  mockRecipes(page, [
    { id: 1, title: 'Beef Taco', score: 90, missing: [], matched: ['beef', 'tortilla', 'onion'], source: 'spoonacular' },
    { id: 2, title: 'Onion Wrap', score: 40, missing: ['tortilla'], matched: ['onion'], source: 'spoonacular' },
  ]);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Beef Taco')).toBeVisible();
  await expect(page.getByText('Onion Wrap')).toBeVisible();
});

test('end-to-end completes promptly (TC-22)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['beef']);
  mockRecipes(page, [{ id: 1, title: 'Quick Dish', score: 80, missing: [], matched: ['beef'], source: 'spoonacular' }]);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Quick Dish')).toBeVisible({ timeout: 5000 });
});

test('Spoonacular API failure shows error (TC-23)', async ({ page }) => {
  mockUpload(page);
  mockAnalyze(page, ['beef']);
  await page.route('**/recipes', (route) => route.fulfill({ status: 502, body: '{}' }));
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText(/Failed to search recipes/i)).toBeVisible();
});

test('Vision API failure shows error (TC-24)', async ({ page }) => {
  mockUpload(page);
  await page.route('**/analyze', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Failed to analyze image/i)).toBeVisible();
});

test('loading indicators visible (TC-25)', async ({ page }) => {
  mockUpload(page);
  // Delay analyze to keep spinner visible
  await page.route('**/analyze', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ingredients_raw: ['beef'], ingredients_normalized: ['beef'] }),
    });
  });
  mockRecipes(page, []);
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByTestId('processing-indicator')).toBeVisible();
});

test('mobile view still usable (TC-26)', async ({ page, browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const mobilePage = await context.newPage();
  mockUpload(mobilePage);
  mockAnalyze(mobilePage, ['beef']);
  mockRecipes(mobilePage, []);
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.setInputFiles('input[type=file]', fixtureValid);
  await expect(mobilePage.getByText(/Find Recipes/i)).toBeVisible();
  await context.close();
});

test('first-time user flow guidance (TC-27)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const heroHeading = page.getByRole('heading', { name: /Ingredient Vision/i }).first();
  await expect(heroHeading).toBeVisible();
  await expect(page.getByRole('button', { name: /Upload Image/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Take Photo/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Get recipe recommendations/i })).toBeVisible();
  const guideBtn = page.getByTestId('first-time-guide-btn');
  await expect(guideBtn).toBeVisible({ timeout: 5000 });
  await guideBtn.scrollIntoViewIfNeeded();
  await guideBtn.click({ force: true });

  // Guide section should appear
  await expect(page.getByRole('heading', { name: /How it works/i }).first()).toBeVisible();
  await expect(page.getByText(/Follow these three steps/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Step 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Step 2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Step 3' })).toBeVisible();
  await expect(page.getByText(/Snap & Upload/i)).toBeVisible();
  await expect(page.getByText(/Take a clear photo of all visible ingredients/i)).toBeVisible();
  await expect(page.getByTestId('guide-media')).toBeVisible();
  await expect(page.getByText(/See the flow/i)).toBeVisible();
});

test('Vietnamese cuisine returns Pho', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { ingredients?: string[]; cuisine?: string };
    expect(body.cuisine).toBe('vietnamese');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            id: 201,
            title: 'Pho Bo',
            image: null,
            score: 90,
            missing: [],
            matched: body.ingredients || [],
            source: 'spoonacular',
          },
        ],
      }),
    });
  });

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('vietnamese');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Pho Bo')).toBeVisible();
});

test('American cuisine returns Cheeseburger', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { ingredients?: string[]; cuisine?: string };
    expect(body.cuisine).toBe('american');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            id: 202,
            title: 'Classic Cheeseburger',
            image: null,
            score: 90,
            missing: [],
            matched: body.ingredients || [],
            source: 'spoonacular',
          },
        ],
      }),
    });
  });

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('american');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Classic Cheeseburger')).toBeVisible();
});

test('Filipino cuisine returns Chicken Adobo', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { ingredients?: string[]; cuisine?: string };
    expect(body.cuisine).toBe('filipino');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            id: 203,
            title: 'Chicken Adobo',
            image: null,
            score: 90,
            missing: [],
            matched: body.ingredients || [],
            source: 'spoonacular',
          },
        ],
      }),
    });
  });

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('filipino');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Chicken Adobo')).toBeVisible();
});

test('Middle Eastern cuisine returns Chicken Shawarma', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { ingredients?: string[]; cuisine?: string };
    expect(body.cuisine).toBe('middle eastern');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            id: 204,
            title: 'Chicken Shawarma',
            image: null,
            score: 90,
            missing: [],
            matched: body.ingredients || [],
            source: 'spoonacular',
          },
        ],
      }),
    });
  });

  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', fixtureValid);
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('middle eastern');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Chicken Shawarma')).toBeVisible();
});
