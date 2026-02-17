import { test, expect, Page } from '@playwright/test';
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
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');

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
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');

  // Select cuisine before confirming
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('mexican');

  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Mexican Beef Street Tacos')).toBeVisible();
});

function mockCommonRoutes(page: Page) {
  page.route('**/upload-image', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image_id: 'mock-key', status: 'uploaded' }),
    })
  );
  page.route('**/analyze', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ingredients_raw: ['beef', 'cilantro', 'onion', 'garlic', 'broth', 'rice'],
        ingredients_normalized: ['beef', 'cilantro', 'onion', 'garlic', 'broth', 'rice'],
      }),
    })
  );
}

test('Vietnamese cuisine returns Pho', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { cuisine?: string };
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
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('vietnamese');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Pho Bo')).toBeVisible();
});

test('American cuisine returns Cheeseburger', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { cuisine?: string };
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
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('american');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Classic Cheeseburger')).toBeVisible();
});

test('Filipino cuisine returns Chicken Adobo', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { cuisine?: string };
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
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('filipino');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Chicken Adobo')).toBeVisible();
});

test('Middle Eastern cuisine returns Chicken Shawarma', async ({ page }) => {
  mockCommonRoutes(page);
  await page.route('**/recipes', async (route) => {
    const body = route.request().postDataJSON() as { cuisine?: string };
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
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');
  await expect(page.getByText(/Confirm Ingredients/i)).toBeVisible();
  await page.getByLabel(/Expected cuisine/i).selectOption('middle eastern');
  await page.getByRole('button', { name: /find recipes/i }).click();
  await expect(page.getByText('Chicken Shawarma')).toBeVisible();
});
