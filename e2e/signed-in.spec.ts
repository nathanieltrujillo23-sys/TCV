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

test("portal: fill in the workbook, keep it after a reload, and download the PDF", async ({ page }) => {
  await signIn(page, "client");
  const accept = page.getByRole("button", { name: text["disclaimer.accept"] });
  if (await accept.isVisible()) await accept.click();
  await page.goto("/portal/workbook");
  await expect(page.getByRole("heading", { level: 1, name: text["wb.title"] })).toBeVisible();

  const stage = page.getByRole("group", { name: text["wb.stage.label"] });
  await stage.getByText(text["wb.stage.student"], { exact: true }).click();

  const amount = (label: string) => page.getByRole("spinbutton", { name: text["wb.line.amountFor"].replace("{label}", label), exact: true });
  await amount(text["wb.line.takeHome"]).fill("1800");
  await amount(text["wb.line.rent"]).fill("750");
  await amount(text["wb.line.groceries"]).fill("250");
  await amount(text["wb.line.savings"]).fill("2000");
  await amount(text["wb.line.creditCards"]).fill("400");

  // 1800 in, 1000 out: cash flow $800, two months covered, net worth $1,600.
  const snapshot = page.locator("#wb-snapshot");
  await expect(snapshot).toContainText("$800.00");
  await expect(snapshot).toContainText(text["wb.fig.months"].replace("{months}", "2"));
  await expect(snapshot).toContainText("$1,600.00");

  const goals = page.locator("#wb-goals");
  await goals.getByRole("textbox").first().fill("Emergency fund");
  await goals.getByRole("spinbutton", { name: text["wb.goal.target"] }).fill("3000");
  await goals.getByRole("spinbutton", { name: text["wb.goal.saved"] }).fill("600");
  const nextYear = new Date();
  const target = `${nextYear.getFullYear() + 1}-${String(nextYear.getMonth() + 1).padStart(2, "0")}`;
  await goals.locator('input[type="month"]').fill(target);
  // 2,400 left over 12 months.
  await expect(goals).toContainText("$200.00");

  const items = page.locator("#wb-checklist fieldset");
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const answer = i === 0 ? text["wb.answer.not_sure"] : text["wb.answer.yes"];
    await items.nth(i).getByText(answer, { exact: true }).click();
  }
  await expect(page.getByText(text["wb.progress"].replace("{done}", "3").replace("{total}", "3"))).toBeVisible();
  await expect(page.locator("#wb-questions")).toContainText(text["wb.q.emergency"]);
  await expect(page.getByText(text["wb.save.saved"], { exact: true })).toBeVisible();

  // Everything is still there after a reload.
  await page.reload();
  await expect(amount(text["wb.line.takeHome"])).toHaveValue("1800");
  await expect(page.locator("#wb-goals").getByRole("textbox").first()).toHaveValue("Emergency fund");

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: text["wb.pdf.button"] }).click()]);
  expect(download.suggestedFilename()).toMatch(/^tcv-workbook-\d{4}-\d{2}-\d{2}\.pdf$/);

  // The portal home card shows it as finished.
  await page.goto("/portal");
  await expect(page.getByRole("link", { name: text["wb.card.done"] })).toBeVisible();
});
