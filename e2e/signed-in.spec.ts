import { expect, test } from "@playwright/test";
import { lessonById } from "../src/content/lessons";
import { E2E_NOTE } from "./testAccounts";
import { acceptDialogs, needsTestAccounts, signIn, text } from "./helpers";

test.beforeEach(() => needsTestAccounts());

test("journal: create, edit and delete a trade", async ({ page }) => {
  acceptDialogs(page);
  await signIn(page, "staff");
  await page.goto("/app/journal/new");

  await page.getByRole("combobox", { name: text["j.form.instrument"], exact: true }).selectOption("MES");
  await page.getByRole("textbox", { name: text["j.form.entryTime"] }).fill("2026-01-06T09:45");
  await page.getByRole("textbox", { name: text["j.form.exitTime"] }).fill("2026-01-06T10:05");
  await page.getByRole("spinbutton", { name: text["j.form.entryPrice"], exact: true }).fill("5000");
  await page.getByRole("spinbutton", { name: text["j.form.exitPrice"], exact: true }).fill("5004");
  await page.getByRole("spinbutton", { name: text["j.form.contracts"], exact: true }).fill("1");
  await page.getByRole("textbox", { name: text["j.form.notes"], exact: true }).fill(E2E_NOTE);
  await page.getByRole("button", { name: text["j.form.save"] }).click();

  // Back on the list: 4 points on MES is $20 gross.
  await expect(page).toHaveURL(/\/app\/journal$/);
  const row = page.locator("tr", { hasText: "MES" }).first();
  await expect(row).toBeVisible();

  // Edit: two contracts instead of one.
  await row.getByRole("link").click();
  await expect(page).toHaveURL(/\/app\/journal\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("textbox", { name: text["j.form.notes"], exact: true })).toHaveValue(E2E_NOTE);
  await page.getByRole("spinbutton", { name: text["j.form.contracts"], exact: true }).fill("2");
  await page.getByRole("button", { name: text["j.form.save"] }).click();
  await expect(page).toHaveURL(/\/app\/journal$/);
  await expect(page.locator("tr", { hasText: "MES" }).first().locator("td").nth(3)).toHaveText("2");

  // Delete it again.
  await page.locator("tr", { hasText: "MES" }).first().getByRole("link").click();
  await page.getByRole("button", { name: text["j.delete"] }).click();
  await expect(page).toHaveURL(/\/app\/journal$/);
  await expect(page.locator("tr", { hasText: "MES" })).toHaveCount(0);
});

test("portal: accept the disclaimer and complete a lesson", async ({ page }) => {
  await signIn(page, "client");
  await page.getByRole("button", { name: text["disclaimer.accept"] }).click();
  await expect(page.getByText(text["portal.progress.title"])).toBeVisible();

  const lesson = lessonById("budgeting-cash-flow")!;
  await page.goto(`/portal/lessons/${lesson.id}`);
  const questions = page.locator("fieldset");
  for (const [i, q] of lesson.quiz.entries()) {
    await questions.nth(i).getByLabel(q.options[q.answer], { exact: true }).check();
  }
  await page.getByRole("button", { name: text["lesson.check"] }).click();
  await expect(page.getByText(text["lesson.result"].replace("{correct}", "3"))).toBeVisible();
  await expect(page.getByText(text["lesson.passed"])).toBeVisible();

  await page.getByRole("link", { name: text["lesson.back"] }).click();
  await expect(page.getByText(text["portal.progress.count"].replace("{done}", "1").replace("{total}", "8"))).toBeVisible();
});
