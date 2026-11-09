# CM Governance system – rules reference

All values live in code (`src/game/logic/governance.ts`, `missions.ts`, `finalChallenge.ts`, `sim.ts`) and are covered by
unit tests. Everything is fictional game balance.

## Meters
* **CM Power** (0–100, starts 100): fictional political authority. Game over at 0.
* **Public Approval** (0–100, starts 60): approval ≥ 80 multiplies score ×1.5; < 30 doubles power drain.

| Event | CM Power | Approval |
|---|---|---|
| Passive drain | −0.14/s (−0.26/s if approval < 30, −0.09/s if ≥ 75) | – |
| Collision (no mission) | −3 | −2 |
| Collision during a mission | −6 | −4 |
| Collision during the final challenge | 0 (frozen) | −4 |
| Mission completed | +10 to +12 | +12 to +14 (+ score bonus, +1 life) |
| Mission deadline missed | −12 to −14 | −8 to −10 |
| Boss defeated / escaped | +4 / 0 | +6 / −3 |
| Every 50 coins | – | +1 |
| Final challenge won | +35 | +20 (+ life, reward, 5000 pts) |
| HYDRA demolition stopped (3 stay orders in time) | +4 | +6 (+1500 pts) |
| HYDRA demolition not stopped (building demolished) | −10 | −8 |

## Stages
| Power | Stage | Effects |
|---|---|---|
| 100–70 | CM in Control | normal music, cheering crowds, confident run |
| 69–40 | Public Pressure | faster music + busier hi-hats, sky darkens, chanting crowd |
| 39–15 | Political Crisis | minor-key music + alarm pad, orange sky, flying newspapers, protesters, panic-run animation |
| < 15 | Final Confidence Challenge | heartbeat drums, storm/rain + lightning, red pulse, mandatory challenge |
| 0 | CM Position Lost | game over screen |

## Missions
Seven missions rotate (no immediate repeats). Each pauses for a briefing card (can be disabled in Settings), has a
progress counter and countdown, rewards and penalties. Targets grow up to +30 % and timers shrink up to −20 % as the
run goes on; *Relaxed mode* adds +25 % time. The spawner guarantees ≈1.7× the needed tokens arrive before the
deadline, always in a lane that is not blocked.

## HYDRA demolition alerts
Every ~55–80 s (first at ~32 s) a HYDRA van and a JCB arrive at a family's house by the road. The CM has
**10 s early in a run, shrinking to 6 s** (+2 s in relaxed mode) to collect **3 🛑 stay orders**, which spawn in
reachable lanes that are clear of obstacles. Success saves the home; failure shows the house collapsing and costs
power. The event never overlaps a boss and is cancelled (no penalty) if the no-confidence motion starts. Balance probe:
a skilled bot stops 147/149 alerts, a weak bot ~57 %.

## City problems everywhere
Every route now mixes potholes, waterlogged roads and traffic jams with its own hazards. Hitting one triggers a
"Public asks:" question for the CM (e.g. “CM garu, ee pothole eppudu fill chestaru?”), and protesters carry
question placards (ROAD? WHY? JAM! WATER FIX! HELP). Questions, not allegations.

## Final no-confidence challenge
Triggered the moment power drops below 15 %. The active mission is paused (returned to the queue, no penalty), any
boss leaves, and three random objectives are drawn (max one "skill" objective such as dodges/jumps/coins). 60 s
(75 s relaxed). Power is frozen while it runs. Win → +35 power, +20 approval, reward, run continues (20 s cooldown).
Lose → power 0, "CM Position Lost" screen.

## Campaign
Six chapters (First 100 Days → Final CM Survival Challenge). A failed mission gets one retry at the end of the
chapter's queue; a second failure ends the chapter. *Public Approval Test* also needs ≥ 75 % approval at the end;
*Final CM Survival* starts at 32 % power and requires winning a confidence challenge (forced if it hasn't happened).
Progress, per-mission status (completed / pending / failed) and best scores are saved locally.

## Fairness guarantees (tested)
* No row ever blocks all three lanes with lane-only obstacles; vehicles are time-aligned so they never overlap rows.
* An autopilot bot survives 4+ minutes and completes missions on every level, and wins the final challenge in all
  50 sampled seeds – proving no unwinnable configurations.
