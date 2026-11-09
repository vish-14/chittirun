import { expect, type Page } from "@playwright/test";

export async function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

export async function startEndless(page: Page, level = "Old City Chaos") {
  await page.goto("/?debug=1");
  await page.getByRole("button", { name: /Endless Run/ }).click();
  await page.getByRole("button", { name: `Play ${level}` }).click();
  await expect(page.getByTestId("hud")).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(() => !!window.__chitti);
}

/** Evaluate against the live game controller (exposed with ?debug=1). */
export function sim<T>(page: Page, fn: (c: NonNullable<Window["__chitti"]>) => T) {
  return page.evaluate(`(${fn.toString()})(window.__chitti)`) as Promise<T>;
}

export async function clearRoad(page: Page) {
  await page.evaluate(() => {
    const s = window.__chitti!.sim;
    s.entities = [];
    s.player.invuln = 1e9;
  });
}
