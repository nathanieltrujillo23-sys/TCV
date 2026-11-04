import { expect, test } from "@playwright/test";
import { expectNoSidewaysScroll, needsTestAccounts, PUBLIC_PATHS, signIn, text } from "./helpers";

// Runs in the "phone" project (375 px wide). Wide tables may scroll inside
// their own box, but the page itself must never scroll sideways.

test("public pages fit a 375 px phone", async ({ page }) => {
  for (const path of PUBLIC_PATHS) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await test.step(path, () => expectNoSidewaysScroll(page));
  }
});

test("staff pages fit a 375 px phone", async ({ page }) => {
  needsTestAccounts();
  await signIn(page, "staff");
  for (const path of [
    "/app",
    "/app/ledger",
    "/app/journal",
    "/app/journal/new",
    "/app/journal/rules",
    "/app/journal/stats",
    "/app/journal/import",
    "/app/accounts",
    "/app/portfolio",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await test.step(path, () => expectNoSidewaysScroll(page));
  }
});

test("client pages fit a 375 px phone", async ({ page }) => {
  needsTestAccounts();
  await signIn(page, "client");
  // The disclaimer card is the first portal screen unless another test already accepted it.
  const accept = page.getByRole("button", { name: text["disclaimer.accept"] });
  if (await accept.isVisible()) {
    await test.step("/portal (disclaimer)", () => expectNoSidewaysScroll(page));
    await accept.click();
  }
  for (const path of ["/portal", "/portal/workbook", "/portal/lessons/budgeting-cash-flow", "/portal/lessons/compound-growth", "/portal/tools", "/portal/account"]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await test.step(path, () => expectNoSidewaysScroll(page));
  }
});
