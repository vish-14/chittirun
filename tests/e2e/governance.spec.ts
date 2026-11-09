import { expect, test } from "@playwright/test";
import { clearRoad, sim, startEndless } from "./helpers";

test("power stages change the HUD, warn the player and trigger the final challenge", async ({ page }) => {
  await startEndless(page);
  await clearRoad(page);
  await expect(page.getByTestId("stage")).toHaveAttribute("data-stage", "control");
  await sim(page, (c) => c.sim.gov.adjust(-45, 0));
  await expect(page.getByTestId("stage")).toHaveAttribute("data-stage", "pressure");
  await expect(page.getByTestId("crisis-warning")).toContainText("Public Pressure");
  await sim(page, (c) => c.sim.gov.adjust(-25, 0));
  await expect(page.getByTestId("stage")).toHaveAttribute("data-stage", "crisis");
  await expect(page.getByRole("progressbar", { name: "CM Power" })).toHaveAttribute("aria-valuenow", /^(2\d|3\d)$/);

  // drop below 15% → no-confidence briefing with three objectives
  await sim(page, (c) => {
    c.sim.gov.adjust(-20, 0);
    c.sim.missionTimer = 99;
  });
  await expect(page.getByTestId("fc-briefing")).toBeVisible();
  await expect(page.getByTestId("fc-briefing").locator("ol li")).toHaveCount(3);
  await page.getByTestId("fc-start").click();
  await expect(page.getByTestId("fc-card")).toBeVisible();

  // win it by completing the objectives
  await sim(page, (c) => {
    for (const o of c.sim.fc!.objectives) {
      o.progress = o.target;
      o.done = true;
    }
    c.sim.fc!.status = "won";
  });
  await expect(page.getByTestId("toast-reward")).toContainText("Confidence restored");
  await expect.poll(() => sim(page, (c) => c.sim.gov.power)).toBeGreaterThan(40);
});

test("failing the no-confidence motion shows the CM Position Lost screen", async ({ page }) => {
  await startEndless(page);
  await clearRoad(page);
  await sim(page, (c) => c.sim.gov.adjust(-90, 0));
  await expect(page.getByTestId("fc-briefing")).toBeVisible();
  await page.getByTestId("fc-start").click();
  await sim(page, (c) => {
    for (const o of c.sim.fc!.objectives) o.target = 999;
    c.sim.fc!.timeLeft = 0.2;
  });
  const lost = page.getByTestId("cm-lost-screen");
  await expect(lost).toBeVisible();
  await expect(lost).toContainText("CM Position Lost");
  await expect(lost).toContainText(/no confidence/i);
  await expect(page.getByTestId("whatsapp-share")).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
});

test("missions complete with animation and rewards; deadlines penalise", async ({ page }) => {
  await startEndless(page);
  await clearRoad(page);
  await sim(page, (c) => (c.sim.missionTimer = 0));
  await page.getByTestId("briefing-start").click();
  const approval = await sim(page, (c) => c.sim.gov.approval);
  await sim(page, (c) => {
    const m = c.sim.mission!;
    m.progress = m.target - 1;
    // emit the mission's own progress event via the public path
    (c.sim as unknown as { progress: (e: string) => void }).progress(m.def.event);
  });
  await expect(page.getByTestId("toast-success")).toContainText("Mission accomplished");
  expect(await sim(page, (c) => c.sim.gov.approval)).toBeGreaterThan(approval);

  await sim(page, (c) => (c.sim.missionTimer = 0));
  await page.getByTestId("briefing-start").click();
  const power = await sim(page, (c) => c.sim.gov.power);
  await sim(page, (c) => (c.sim.mission!.timeLeft = 0.05));
  await expect(page.getByTestId("toast-fail")).toContainText("Deadline missed");
  expect(await sim(page, (c) => c.sim.gov.power)).toBeLessThan(power - 10);
});

test("losing all lives shows game over with a verified score", async ({ page }) => {
  await startEndless(page);
  await page.waitForTimeout(2500);
  await sim(page, (c) => {
    c.sim.missionTimer = 999;
    c.sim.lives = 1;
    c.sim.player.invuln = 0;
    c.sim.entities = [{ id: 99999, type: "obstacle", kind: "cow", lane: c.sim.player.lane, z: 0.2, vz: 0, length: 2, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 }];
  });
  await expect(page.getByTestId("results-screen")).toBeVisible();
  await expect(page.getByText("Game Over")).toBeVisible();
  await expect(page.getByTestId("server-status")).toContainText(/Verified · rank #\d+/);
  await page.getByTestId("menu").click();
  await page.getByRole("button", { name: /Leaders/ }).click();
  await expect(page.getByText("Local high scores")).toBeVisible();
});

test("HIDRA demolition: stopped with stay orders, or the building falls and power drops", async ({ page }) => {
  await startEndless(page);
  await clearRoad(page);
  await sim(page, (c) => {
    c.sim.missionTimer = 999;
    c.sim.demolitionTimer = 0.01;
  });
  const card = page.getByTestId("demolition-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("STAY ORDERS");
  await sim(page, (c) => {
    c.sim.demolition!.got = 2;
    c.sim.entities.push({ id: 777001, type: "token", kind: "stayOrder", lane: c.sim.player.lane, z: 0.1, vz: 0, length: 0.6, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 });
  });
  await expect(page.getByTestId("toast-success").filter({ hasText: "Demolition stopped" })).toBeVisible();
  await expect(card).toBeHidden();

  // second alert: let the timer run out
  const power = await sim(page, (c) => c.sim.gov.power);
  await sim(page, (c) => {
    c.sim.demolitionTimer = 0.01;
  });
  await expect(card).toBeVisible();
  await sim(page, (c) => {
    c.sim.entities = [];
    c.sim.demolition!.timeLeft = 0.05;
  });
  await expect(page.getByTestId("toast-fail").filter({ hasText: "Building demolished" })).toBeVisible();
  expect(await sim(page, (c) => c.sim.gov.power)).toBeLessThan(power - 8);
});
