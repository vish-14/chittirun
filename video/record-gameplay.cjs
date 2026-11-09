const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function segment(name, level, script) {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, hasTouch: true,
    recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } },
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('chitti-run:profile:v1', JSON.stringify({ unlockedLevels: ['old-city','traffic','pothole','water','secretariat'], settings: { muted: true } }));
    // phone-sized UI on a 1080x1920 capture: zoom the HTML HUD/overlays 2.5x, the game canvas fills the frame
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'main:not([aria-label=Game]){zoom:2.5} [data-testid="game-surface"] > *:not(:first-child){zoom:2.5}'; document.head.append(s); });
  });
  const t0 = Date.now();
  const p = await ctx.newPage();
  await p.goto('http://localhost:3200/?debug=1&demo=1');
  await p.getByRole('button', { name: /Endless Run/ }).click();
  await p.getByRole('button', { name: 'Play ' + level }).click();
  await p.waitForFunction(() => !!window.__chitti && window.__chitti.sim.t > 0.05);
  const start = (Date.now() - t0) / 1000;
  const ev = (fn) => p.evaluate(fn);
  await ev(() => { const s = window.__chitti.sim; s.missionTimer = 999; s.demolitionTimer = 999; s.bossTimer = 999; });
  await script(p, ev);
  const video = p.video();
  await ctx.close();
  const file = await video.path();
  fs.renameSync(file, `${OUT}/${name}.webm`);
  await b.close();
  console.log(JSON.stringify({ name, start }));
  return { name, start };
}

(async () => {
  const meta = [];
  // S1 Old City: briefing card, then mission accomplished
  meta.push(await segment('s1-oldcity', 'Old City Chaos', async (p, ev) => {
    await sleep(2200);
    await ev(() => { const c = window.__chitti; c.demo = false; c.sim.missionTimer = 0; });
    await sleep(2400);
    await ev(() => { const c = window.__chitti; c.confirmBriefing(); c.demo = true; });
    await sleep(4500);
    await ev(() => { const s = window.__chitti.sim; const m = s.mission; if (m) { m.progress = m.target - 1; s.progress(m.def.event); } });
    await sleep(3500);
  }));
  // S2 Pothole Paradise: HIDRA demolition stopped → Ranga & Tondal angry
  meta.push(await segment('s2-hidra', 'Pothole Paradise', async (p, ev) => {
    await sleep(1200);
    await ev(() => { window.__chitti.sim.demolitionTimer = 0.01; });
    await sleep(5000);
    await ev(() => { const s = window.__chitti.sim; if (s.demolition) { s.demolition.got = s.demolition.needed - 1; s.entities.push({ id: 990001, type: 'token', kind: 'stayOrder', lane: s.player.lane, z: 7, vz: 0, length: 0.6, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 }); } });
    await sleep(7500);
  }));
  // S3 Ameerpet metro route: crater hit → "Public asks"
  meta.push(await segment('s3-traffic', 'Traffic Madness', async (p, ev) => {
    await sleep(3500);
    await ev(() => { const c = window.__chitti; c.demo = false; const s = c.sim; s.player.invuln = 0; s.entities = s.entities.filter(e => !(e.lane === s.player.lane && e.z < 14)); s.entities.push({ id: 990002, type: 'obstacle', kind: 'crater', lane: s.player.lane, z: 9, vz: 0, length: 2.6, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 }); });
    await sleep(1600);
    await ev(() => { window.__chitti.demo = true; });
    await sleep(5500);
  }));
  // S4 Hitech City: Political Crisis, CM DOWN DOWN chants
  meta.push(await segment('s4-crisis', 'Water Crisis Escape', async (p, ev) => {
    await sleep(2000);
    await ev(() => { const s = window.__chitti.sim; s.gov.adjust(-72, -15); });
    await sleep(9000);
  }));
  // S5 Secretariat: No-confidence motion → CM Position Lost
  meta.push(await segment('s5-lost', 'Secretariat Escape', async (p, ev) => {
    await sleep(1500);
    await ev(() => { const c = window.__chitti; c.demo = false; c.sim.gov.adjust(-88, 0); });
    await sleep(2600);
    await ev(() => { const c = window.__chitti; c.confirmBriefing(); c.demo = true; });
    await sleep(3500);
    await ev(() => { const s = window.__chitti.sim; for (const o of s.fc.objectives) o.target = 999; s.fc.timeLeft = 0.1; });
    await sleep(5000);
  }));
  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 2));
})();
