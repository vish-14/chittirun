import { expect, test } from "@playwright/test";
import { clearRoad, sim, trackErrors } from "./helpers";

test("offline app bundle: plays with no server, routes shown, scores saved on device", async ({ page }) => {
  const errors = await trackErrors(page);
  const apiCalls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/")) apiCalls.push(r.url());
  });
  await page.goto("/?debug=1");
  await page.getByRole("button", { name: /Endless Run/ }).click();
  await expect(page.getByText("Charminar → Koti")).toBeVisible();
  await page.getByRole("button", { name: "Play Old City Chaos" }).click();
  await expect(page.getByTestId("hud")).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(() => !!window.__chitti);
  await expect(page.getByTestId("route")).toContainText("Charminar");
  await clearRoad(page);
  await sim(page, (c) => {
    c.sim.missionTimer = 999;
    c.sim.lives = 1;
    c.sim.player.invuln = 0;
    c.sim.entities = [{ id: 1, type: "obstacle", kind: "cow", lane: c.sim.player.lane, z: 0.2, vz: 0, length: 2, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 }];
  });
  await expect(page.getByTestId("server-status")).toHaveText("Saved on this device");
  await page.getByTestId("menu").click();
  await page.getByRole("button", { name: /Leaders/ }).click();
  await expect(page.getByText(/stored privately on this device/)).toBeVisible();
  expect(apiCalls).toEqual([]);
  expect(errors).toEqual([]);
});
