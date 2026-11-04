import { expect, test, type Page } from "@playwright/test";
import { en } from "../src/i18n/en";
import { CLIENT_EMAIL, STAFF_EMAIL } from "./testAccounts";

/** English copy, so tests follow the strings file instead of repeating text. */
export const text = en;

export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/learn",
  "/learn/budgeting-cash-flow",
  "/contact",
  "/disclosures",
  "/privacy",
  "/terms",
  "/signin",
  "/signup",
  "/no-such-page",
];

/** Skips the current test when the test accounts are not available (CI). */
export function needsTestAccounts() {
  test.skip(!process.env.E2E_STAFF_PASSWORD, "Signed in tests need SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

export async function signIn(page: Page, who: "staff" | "client") {
  const email = who === "staff" ? STAFF_EMAIL : CLIENT_EMAIL;
  const password = who === "staff" ? process.env.E2E_STAFF_PASSWORD : process.env.E2E_CLIENT_PASSWORD;
  await page.goto("/signin");
  await page.getByLabel(text["auth.email"]).fill(email);
  await page.getByLabel(text["auth.password"]).fill(password ?? "");
  await page.locator("form").getByRole("button", { name: text["auth.submit.signIn"] }).click();
  await expect(page).toHaveURL(who === "staff" ? /\/app/ : /\/portal/);
}

/** Answers "are you sure?" dialogs with yes. */
export function acceptDialogs(page: Page) {
  page.on("dialog", (d) => void d.accept());
}

/** True when nothing on the page is wider than the window (no sideways scrolling). */
export async function expectNoSidewaysScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${innerWidth}px window`).toBeLessThanOrEqual(innerWidth);
}
