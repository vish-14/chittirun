# Testing

## Automated
| Suite | Command | Coverage |
|---|---|---|
| Unit (Vitest) | `npm test` | governance stages & drift, mission counters/timers/scaling, deterministic sim, lanes/jump/slide, collisions & lives, Biryani shield, pothole fixing, **fairness sweep** (no 3-lane walls, all levels, 4 simulated minutes each), bot completes missions on every level, bosses, final challenge win/loss & power freeze, campaign success / retry / forced challenge, score plausibility rules, daily determinism, campaign progress merge, run-token tampering, replay (409), too-fast submissions, rate limiting, board validation, name sanitising, sprite-sheet completeness |
| E2E (Playwright) | `npm run build && npm run test:e2e` | menus & all screens without console errors, locks & campaign statuses, settings persistence, **keyboard** lanes/jump/slide/briefing/pause (desktop), **touch swipes** + tap-to-start + on-screen buttons (Pixel 7 & iPhone 13 viewports), no horizontal overflow on phones, stage changes + crisis banner, no-confidence briefing/win, CM Position Lost screen, mission complete/fail toasts with meter changes, game over with **server-verified** score, API abuse (forged token, absurd score, bad board) |

Balance probes (not part of CI): `npx tsx scripts/balance-probe.ts [skill]` and `npx tsx scripts/fc-probe.ts`.

## Manual real-device checklist
Automated mobile tests emulate viewports and touch on Chromium. Before release, also check on real hardware:
- [ ] iPhone Safari (WebKit): audio starts after first tap, swipes don't scroll the page, safe-area insets, 60 fps
- [ ] Low-end Android Chrome: frame rate in Secretariat level with crisis weather; reduced-motion toggle
- [ ] Rotate to landscape: canvas letterboxes correctly, HUD readable
- [ ] Airplane mode mid-run: game continues, results say "Offline – saved locally"
- [ ] Screen reader (TalkBack/VoiceOver): menus navigable, mission start/complete announced
- [ ] WhatsApp share opens the app with the score text
