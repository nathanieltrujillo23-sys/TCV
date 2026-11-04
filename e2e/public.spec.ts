import { expect, test } from "@playwright/test";
import { PUBLIC_PATHS, text } from "./helpers";

test.describe("public pages", () => {
  for (const path of PUBLIC_PATHS) {
    test(`${path} renders`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("footer links to the legal pages", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    for (const key of ["site.footer.disclosures", "site.footer.privacy", "site.footer.terms"] as const) {
      await expect(footer.getByRole("link", { name: text[key] })).toBeVisible();
    }
    await expect(footer).toContainText(text["site.footer.disclaimer"]);
  });

  test("signed out visitors are sent to sign in from private areas", async ({ page }) => {
    for (const path of ["/app", "/app/ledger", "/app/journal", "/portal", "/portal/tools"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/signin/);
    }
  });

  test("a public sample lesson can be answered without an account", async ({ page }) => {
    await page.goto("/learn/compound-growth");
    await expect(page.getByRole("heading", { name: text["lesson.quiz"] })).toBeVisible();
    await page.getByRole("button", { name: text["lesson.check"] }).click();
    await expect(page.getByText(text["lesson.answerAll"])).toBeVisible();
  });
});
