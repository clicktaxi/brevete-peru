import { expect, test } from "@playwright/test";

const OPTION = 'article ol li [role="button"]';

test("practice: a wrong answer shows up on the mistakes page", async ({ page }) => {
  await page.goto("/ru/a1/practice/");
  await page.getByRole("button", { name: /Начать тренировку/ }).click();

  let gotWrong = false;
  for (let i = 0; i < 20 && !gotWrong; i++) {
    const option = page.locator(OPTION).first();
    await expect(option).toHaveAttribute("aria-disabled", "false");
    await option.click();

    const feedback = page.getByText(/^(Верно!|Неверно\.)/);
    await expect(feedback).toBeVisible();
    if ((await feedback.innerText()).startsWith("Неверно")) {
      gotWrong = true;
    } else {
      await page.getByRole("button", { name: /^(Дальше|Завершить)/ }).click();
    }
  }
  expect(gotWrong, "expected at least one wrong answer within 20 questions").toBe(true);

  // recordAnswer() is fire-and-forget; give IndexedDB a moment to commit before leaving.
  await page.waitForTimeout(500);

  await page.goto("/ru/a1/mistakes/");
  await expect(page.getByText("Вопросов с ошибками: 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Повторить ошибки" })).toBeVisible();
});
