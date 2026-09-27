import { expect, test } from "@playwright/test";

test("language switch keeps the current page", async ({ page }) => {
  await page.goto("/ru/a1/practice/");
  await page.getByRole("button", { name: "Язык" }).click();
  await page.getByRole("menuitem", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/a1\/practice\/$/);
});
