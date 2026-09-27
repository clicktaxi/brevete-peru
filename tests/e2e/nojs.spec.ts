import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

const QUESTION = "Está permitido en la vía:";

test("question page shows the question and options without JavaScript", async ({ page }) => {
  await page.goto("/ru/a1/q/1-esta-permitido-en-la-via/");

  // The server-rendered question card is visible without any client JS.
  await expect(page.getByText(QUESTION).first()).toBeVisible();
  const options = page.locator('article ol li [role="button"]');
  await expect(options).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(options.nth(i)).toBeVisible();

  // The <noscript> fallback is present with the question and all 4 options.
  // Chromium does not expand <noscript> into DOM when scripting is disabled via
  // automation, so we parse its markup instead of asserting visibility on it.
  const noscript = page.locator("noscript");
  await expect(noscript).toHaveCount(1);
  const html = await noscript.innerHTML();
  const fallback = await page.evaluate((src) => {
    const doc = new DOMParser().parseFromString(src, "text/html");
    return {
      question: doc.querySelector("p")?.textContent ?? "",
      options: [...doc.querySelectorAll("ol li")].map((li) => li.textContent ?? ""),
    };
  }, html);
  expect(fallback.question).toBe(QUESTION);
  expect(fallback.options).toHaveLength(4);
  for (const [i, letter] of ["a", "b", "c", "d"].entries()) {
    expect(fallback.options[i]).toMatch(new RegExp(`^${letter}\\) \\S`));
  }
});
