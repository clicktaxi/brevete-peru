import { test as base } from "@playwright/test";

/** Hides the Next.js dev-tools badge, which otherwise intercepts taps on header controls in dev mode. */
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head.appendChild(style);
      });
    });
    await run(page);
  },
});

export { expect } from "@playwright/test";
