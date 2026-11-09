# Assets & licences

## Original assets (this project)
* **All pixel art** – the Chitti Naidu character (idle, victory, defeat, CM-lost, run, crisis-run, jump, slide, hit
  animations, HUD portraits, four outfits), the fictional "Bongaram Praja Party" orange‑white‑green flag with a raised‑hand ✋ emblem (no blue, no wheel, so it can't be confused with the national flag),
  obstacles, pickups, crowds, roadside props, five bosses and five parallax backgrounds – is drawn **procedurally in
  code** (`src/game/art/*`) and exported by `npm run assets`. No external images, fonts or tracing were used.
* Political posters are pixel text (plus a generic car icon) – no photographs, likenesses or party logos.
* HYDRA van / JCB / house sprites are original pixel art; "HYDRA" refers to the city agency in a satirical game event.
* **All music and sound effects** are original compositions synthesised at runtime (`src/game/audio/*`). No samples.
* The 3×5 pixel font used on signs is an original glyph set (`src/game/art/painter.ts`).
* **Fictional content**: Chitti Naidu, the party, the flag, bosses and missions are invented. The character's design
  (pompadour with grey temples, boxed beard, teal sneakers, chibi proportions) was created to avoid any real person's
  likeness, costume, signature or voice. Party symbols used by real Indian parties were deliberately avoided.
* Licence: these assets are part of this repository and follow the repository's licence.

## Third-party software (npm)
| Package | Licence |
|---|---|
| next, react, react-dom | MIT |
| phaser 3.90 | MIT |
| tailwindcss, @tailwindcss/postcss, postcss | MIT |
| @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb | Apache-2.0 |
| server-only | MIT |
| Dev: typescript (Apache-2.0), vitest (MIT), @playwright/test (Apache-2.0), pngjs (MIT), tsx (MIT), eslint (MIT), eslint-config-next (MIT) | |

No copyrighted game assets, fonts or audio are bundled. Emoji in the UI are rendered by the player's system font.
