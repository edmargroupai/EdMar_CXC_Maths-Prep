import { expect, test } from "@playwright/test";

function collectSupabaseAuthKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    if (/^sb-.*-auth-token$/i.test(key) || /supabase.*auth/i.test(key)) {
      keys.push(key);
    }
  }
  return keys;
}

test.describe("auth session storage", () => {
  test("does not persist Supabase auth tokens in browser storage", async ({ page }) => {
    await page.goto("/onboarding/first-question");

    await page.waitForFunction(
      () =>
        document.cookie.includes("sb-") ||
        window.localStorage.getItem("edmar-onboarding") !== null,
      undefined,
      { timeout: 15_000 },
    );

    const localKeys = await page.evaluate(() =>
      collectSupabaseAuthKeys(window.localStorage),
    );
    const sessionKeys = await page.evaluate(() =>
      collectSupabaseAuthKeys(window.sessionStorage),
    );

    expect(localKeys).toEqual([]);
    expect(sessionKeys).toEqual([]);
  });
});
