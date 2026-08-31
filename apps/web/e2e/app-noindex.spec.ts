import { test, expect } from "@playwright/test";

test.describe("App routes noindex", () => {
  test("home sets robots noindex via layout", async ({ page }) => {
    await page.goto("/home");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toMatch(/noindex/);
  });
});
