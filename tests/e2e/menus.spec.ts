import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

test("main menu and every screen render without errors", async ({ page }) => {
  const errors = await trackErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Chitti Naidu/i })).toBeVisible();
  await expect(page.getByText(/political-satire game/)).toBeVisible();
  const screens: [RegExp, RegExp][] = [
    [/Endless Run/, /Select level/i],
    [/Campaign/, /^Campaign$/i],
    [/Daily/, /Daily challenge/i],
    [/Character/, /Choose your CM/i],
    [/Leaders/, /Leaderboard/i],
    [/CM Dashboard/, /CM Performance Dashboard/i],
    [/Mission Board/, /Governance Mission Board/i],
    [/How to play/, /How to play/i],
    [/Settings/, /Settings/i],
  ];
  for (const [btn, heading] of screens) {
    await page.getByRole("button", { name: btn }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
  }
  expect(errors).toEqual([]);
});

test("level select shows locks and campaign shows mission statuses", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Endless Run/ }).click();
  await expect(page.getByRole("button", { name: "Play Old City Chaos" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Play Secretariat Escape" })).toBeDisabled();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: /Campaign/ }).click();
  await page.getByRole("button", { name: /First 100 Days/ }).click();
  await expect(page.getByRole("list", { name: "First 100 Days missions" }).getByText("Pending")).toHaveCount(3);
});

test("settings persist across reloads (local storage)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Settings/ }).click();
  await page.getByRole("switch", { name: "High contrast" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/high-contrast/);
  await page.getByRole("button", { name: /Settings/ }).click();
  await expect(page.getByRole("switch", { name: "High contrast" })).toHaveAttribute("aria-checked", "true");
});
