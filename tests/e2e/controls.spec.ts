import { expect, test } from "@playwright/test";
import { clearRoad, sim, startEndless, trackErrors } from "./helpers";

test.describe("keyboard controls", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard test runs on desktop");

  test("lanes, jump, slide, briefing and pause via keyboard", async ({ page }) => {
    const errors = await trackErrors(page);
    await startEndless(page);
    await clearRoad(page);
    await page.keyboard.press("ArrowLeft");
    expect(await sim(page, (c) => c.sim.player.lane)).toBe(0);
    await page.keyboard.press("d");
    await page.keyboard.press("ArrowRight");
    expect(await sim(page, (c) => c.sim.player.lane)).toBe(2);
    await page.keyboard.press("Space");
    await expect.poll(() => sim(page, (c) => c.sim.player.jumpT >= 0 || c.sim.player.y > 0)).toBe(true);
    await page.keyboard.press("ArrowDown");
    expect(await sim(page, (c) => c.sim.player.slideT >= 0)).toBe(true);

    // mission briefing appears and Enter starts it
    await sim(page, (c) => (c.sim.missionTimer = 0));
    await expect(page.getByTestId("briefing")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("mission-card")).toBeVisible();
    const t1 = await page.getByTestId("mission-timer").textContent();
    await expect.poll(() => page.getByTestId("mission-timer").textContent(), { timeout: 10_000 }).not.toBe(t1);

    // pause freezes the simulation
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("pause-menu")).toBeVisible();
    const t = await sim(page, (c) => c.sim.t);
    await page.waitForTimeout(500);
    expect(await sim(page, (c) => c.sim.t)).toBe(t);
    await page.getByTestId("resume").click();
    await expect(page.getByTestId("pause-menu")).toBeHidden();
    await expect.poll(() => sim(page, (c) => c.sim.t)).toBeGreaterThan(t);
    expect(errors).toEqual([]);
  });
});

test.describe("touch controls", () => {
  test.skip(({ isMobile }) => !isMobile, "touch test runs on mobile emulation");

  async function swipe(page: import("@playwright/test").Page, dx: number, dy: number) {
    const box = (await page.getByTestId("game-surface").boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height * 0.7;
    await page.getByTestId("game-surface").dispatchEvent("pointerdown", { clientX: x, clientY: y, pointerType: "touch", button: 0 });
    await page.getByTestId("game-surface").dispatchEvent("pointermove", { clientX: x + dx, clientY: y + dy, pointerType: "touch" });
    await page.getByTestId("game-surface").dispatchEvent("pointerup", { clientX: x + dx, clientY: y + dy, pointerType: "touch" });
  }

  test("swipes switch lanes, jump and slide; tap starts a mission", async ({ page }) => {
    const errors = await trackErrors(page);
    await startEndless(page);
    await clearRoad(page);
    await swipe(page, -80, 0);
    expect(await sim(page, (c) => c.sim.player.lane)).toBe(0);
    await swipe(page, 80, 0);
    expect(await sim(page, (c) => c.sim.player.lane)).toBe(1);
    await swipe(page, 0, -80);
    expect(await sim(page, (c) => c.sim.player.jumpT >= 0)).toBe(true);
    await swipe(page, 0, 80);
    expect(await sim(page, (c) => c.sim.player.slideT >= 0)).toBe(true);
    await sim(page, (c) => (c.sim.missionTimer = 0));
    await expect(page.getByTestId("briefing")).toBeVisible();
    await page.getByTestId("briefing-start").tap();
    await expect(page.getByTestId("mission-card")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("on-screen buttons work when enabled", async ({ page }) => {
    await page.goto("/?debug=1");
    await page.getByRole("button", { name: /Settings/ }).click();
    await page.getByRole("switch", { name: "On-screen control buttons" }).tap();
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: /Endless Run/ }).click();
    await page.getByRole("button", { name: "Play Old City Chaos" }).click();
    await expect(page.getByTestId("touch-controls")).toBeVisible({ timeout: 20_000 });
    await page.waitForFunction(() => !!window.__chitti);
    await clearRoad(page);
    await page.getByRole("button", { name: "Move right" }).tap();
    expect(await sim(page, (c) => c.sim.player.lane)).toBe(2);
  });

  test("layout fits the viewport without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
