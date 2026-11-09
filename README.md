# CHITTI NAIDU RUN – The Great CM Escape

A humorous, **entirely fictional** political-satire endless runner. Help Chitti Naidu – a cartoon Chief Minister
with a pompadour, a neat beard, a full green kurta, an orange‑white‑green kanduva and teal sneakers – dodge auto-rickshaws,
potholes, water tankers and red tape across five Hyderabad-inspired (fictional) levels, while keeping his
**CM Power** and **Public Approval** alive.

Mobile-first, keyboard + touch, original 16-bit-style pixel art and chiptune music, ~113 KiB of art in total.

![stack](https://img.shields.io/badge/Next.js-16-black) ![phaser](https://img.shields.io/badge/Phaser-3.90-blue) ![ts](https://img.shields.io/badge/TypeScript-strict-3178c6)

## Features

**Gameplay** – three lanes, swipe/arrow lane changes, jump, slide (slide over potholes to *fix* them), coins,
score multipliers, 3 lives with invulnerability frames, speed and density ramp over time, six power-ups
(Irani Chai, Biryani Shield, Metro Pass, File Collector, Promise Rocket, Water Tanker Shield) and a boss per level
(Runaway Mega-Auto, Gridlock Double-Decker, Crater-Digging JCB, Thirsty Mega-Tanker, Red-Tape Golem).

**Levels = real Hyderabad routes** – Old City Chaos (Charminar → Koti) · Traffic Madness (Ameerpet → Nampally metro
corridor) · Pothole Paradise (Mehdipatnam → Golconda) · Water Crisis Escape (Hitech City → Gachibowli) · Secretariat
Escape (Tank Bund → Secretariat). Each has its own landmark skyline (Charminar, metro viaduct, Golconda Fort, Cyber
Towers-style IT tower, Hussain Sagar's Buddha statue), green signboards for every real stop, a live "📍 next stop"
HUD, paan shops, Irani cafés, biryani houses, shopping malls, metro pillars and trains, flickering broken street
lights and signals, potholes and traffic jams, football-fan posters and bunting, its own obstacle mix, difficulty
curve, boss, song and sound effects. Levels unlock by score.

**CM Governance system (core mechanic)** – seven timed missions (Road Development, Water Supply, Traffic
Management, Employment Drive, Public Services, Infrastructure Development, timed Emergency Response) with briefings,
progress counters, countdowns, rewards, penalties and completion animations; CM Power & Public Approval meters;
stage progression (CM in Control → Public Pressure → Political Crisis → Final Confidence Challenge → CM Position Lost)
that changes sky, weather, crowds (cheering → protesting), music (tempo/minor key/heartbeat) and Chitti's animation;
a final no-confidence challenge with three random objectives; a six-chapter campaign with completed/pending/failed
missions. Full rules: [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md).

**HYDRA demolition alerts** – mid-run, a HYDRA van and a JCB start demolishing a family's house; Chitti has 5–10
seconds to grab 3 🛑 stay orders, or the building comes down (−10 % CM Power). **City problems everywhere** –
potholes, waterlogging and traffic jams on every route, with the public asking the CM questions about each one.

**Screens** – main menu, character select (outfits + animation preview + V-sign victory pose), level select,
campaign, daily challenge (seeded, same for everyone), global + local leaderboards, CM Performance Dashboard,
Governance Mission Board, settings, how-to-play, pause menu, mission briefing, crisis warnings, no-confidence
challenge, results / CM Position Lost screens with Telugu-English one-liners and WhatsApp sharing.

**Accessibility** – keyboard-only play, on-screen buttons option, reduced motion (no shake/flash/lightning), high
contrast, larger text, relaxed mode (slower, longer timers), optional briefings, ARIA progress bars and live
announcements, auto-pause when the tab is hidden.

## Website + Android/iOS app

One codebase, two targets. The **website** (`npm run build`) can use an optional verified global leaderboard on
AWS. The **app** (`npm run build:app` + Capacitor, projects in `android/` and `ios/`) is fully **offline and
local-first** – every score, setting and campaign save stays on the phone. The plan is to retire the website later
and ship app-only; see [`docs/MOBILE_APP.md`](docs/MOBILE_APP.md) for builds, store publishing (incl. the D-U-N-S
requirement) and the website-removal roadmap.

## Quick start

```bash
npm install          # uses .npmrc legacy-peer-deps (npm 10 peer-resolution bug with vitest 4)
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve |
| `npm test` | Vitest unit tests (logic, fairness, governance, campaign, API security) |
| `npm run test:e2e` | Playwright – desktop keyboard, Android & iPhone viewports with touch (builds must exist: run `npm run build` first) |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run assets` | Regenerate all sprite sheets & backgrounds into `public/assets/sprites` (content-hashed) |
| `npm run assets:check` | Fail if committed assets are stale (used in CI and Amplify build) |
| `npm run build:app` / `cap:sync` | Offline static bundle for the apps / copy it into `android/` + `ios/` |
| `npm run android:open` / `ios:open` | Open the native projects in Android Studio / Xcode |
| `npm run app:icons` | Regenerate app icons and splash screens from the pixel art |

Debug helpers (dev builds, or any build with `?debug=1`): `window.__chitti` exposes the running game controller;
`?demo=1` lets the autopilot play.

## Architecture

```
src/
  app/                 Next.js App Router: page, layout, /api/{runs,scores,leaderboard,health}
  components/          React + Tailwind UI (menus, HUD, overlays, results)
  game/
    logic/             Pure TypeScript simulation – no engine, fully deterministic & unit-tested
                       (sim, governance, missions, final challenge, campaign, daily, scoring, autopilot bot)
    art/               Procedural pixel-art painter, character/props/backgrounds, atlas packing
    audio/             WebAudio chiptune engine + original songs
    phaser/            Phaser 3 scene: pseudo-3D road renderer, sprites, effects
    controller.ts      Bridges sim ⇄ Phaser ⇄ React (fixed 120 Hz timestep, input, audio cues)
  server/              Run tokens (HMAC), score validation, rate limiting, memory/DynamoDB stores
  lib/                 Local profile storage, API client, sharing, messages
infra/                 CloudFormation (DynamoDB, S3+CloudFront, IAM, alarms, budgets), optional Lambda
docs/                  AWS deployment & cost plan, governance rules, asset licences, testing
```

Design choices:
* **Simulation separated from rendering** – the whole game runs headless, which makes it testable, lets a bot prove
  fairness, keeps the daily challenge deterministic, and allows server-side replay in future.
* **Phaser is lazy-loaded** only when a run starts; menus are light. Art (~113 KiB) is cached immutably; audio is
  synthesised (0 bytes). If sprite downloads fail, the same art is regenerated in the browser.
* **Errors never crash the run**: audio, storage, network and leaderboard failures degrade gracefully; a React error
  boundary protects menus; corrupted local saves are repaired on load.

## Testing

* `npm test` – 43 unit tests, including: never-three-lanes-blocked fairness sweep, bot survives & completes missions on
  all five levels, final challenge win/loss, power frozen during the motion, campaign retries, token tampering,
  replay rejection, wall-clock checks, rate limits.
* `npm run test:e2e` – 29 browser tests on Desktop Chrome, Pixel 7 and iPhone 13 viewports (touch emulated, Chromium
  engine). See [`docs/TESTING.md`](docs/TESTING.md) for the manual real-device checklist (Safari/WebKit).

## Deployment (AWS – website only, optional)

The apps need no AWS at all. 
Deployment-ready for **AWS Amplify Hosting** (SSR + Lambda-backed API routes), **DynamoDB**, **S3 + CloudFront**,
**Route 53**, **ACM**, **CloudWatch** and **AWS Budgets**, with separate staging/production stages. Nothing is
provisioned automatically – read the plan and cost estimate (≈ $4–5/month per stage for an MVP) in
[`docs/AWS_DEPLOYMENT.md`](docs/AWS_DEPLOYMENT.md) and approve before deploying.

## Disclaimer

Chitti Naidu, the Bongaram Praja Party, its flag and every place, mission and event in this game are fictional.
Any resemblance to real persons, parties or governments is coincidental. The game makes no claims or allegations
about any real person or government. All art and music are original – see
[`docs/ASSETS_AND_LICENSES.md`](docs/ASSETS_AND_LICENSES.md).
