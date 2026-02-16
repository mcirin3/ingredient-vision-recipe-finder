import { test, expect } from '@playwright/test';

test('happy path steak taco (TC-1,5,15,22,27)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/steak_taco.jpg');
  await page.getByRole('button', { name: /upload/i }).click();
  await expect(page.getByText(/detected ingredients/i)).toBeVisible();
  await expect(page.getByText(/steak/i)).toBeVisible();
  await expect(page.getByText(/taco/i)).toBeVisible();
});

test('unsupported file shows friendly error (TC-2)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type=file]', 'tests/fixtures/bad_type.txt');
  await page.getByRole('button', { name: /upload/i }).click();
  await expect(page.getByText(/invalid file/i)).toBeVisible();
});
