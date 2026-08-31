import { test, expect } from "@playwright/test";

test.describe("Marketing legal pages", () => {
  test("privacy and terms are public", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of use/i })).toBeVisible();
    await expect(page.getByText(/not affiliated with or endorsed by CXC/i)).toBeVisible();
  });
});
