import { expect, test } from "@playwright/test";

const OPTION = 'article ol li [role="button"]';

test("exam simulator: answer all 40 questions and see the result", async ({ page }) => {
  test.setTimeout(300_000);
  page.on("dialog", (d) => d.accept());

  await page.goto("/ru/a1/exam/");
  await page.getByRole("button", { name: "Начать экзамен" }).click();

  const total = 40;
  for (let i = 1; i <= total; i++) {
    await expect(page.getByText(`Pregunta ${i} de ${total}`).first()).toBeVisible();

    const option = page.locator(OPTION).first();
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");

    if (i < total) {
      await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    } else {
      await page.getByRole("button", { name: "Finalizar", exact: true }).first().click();
    }
  }

  await page.waitForURL(/\/exam\/result\/\?id=/);
  await expect(page.getByText(/^(APROBADO|DESAPROBADO)$/)).toBeVisible();
  await expect(page.getByText(/\d+ из 40/).first()).toBeVisible();
});
