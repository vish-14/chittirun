# Android & iOS app

The game is already packaged for **Android and iOS with [Capacitor](https://capacitorjs.com)**. The same
codebase builds both the website and the apps:

| | Website (today) | App (Android / iOS) |
|---|---|---|
| Build | `npm run build` (Next.js server) | `npm run build:app` → static `out/` bundled inside the app |
| Network | optional verified global leaderboard (AWS) | **none** – fully offline, local-first |
| Saves | browser localStorage | localStorage **+** native Preferences mirror (survives iOS WebView storage eviction) |
| Back button | – | Android back: in game → pause; in menus → main menu → exit |
| Haptics / share | `navigator.vibrate` / Web Share / WhatsApp link | native Haptics / native share sheet / WhatsApp link |
| Orientation | responsive | locked portrait, status bar hidden |

`BUILD_TARGET=app` switches Next.js to static export and drops the server API route files from the bundle, so the
app contains no server code and never calls AWS. If you ever want an online leaderboard in the app, build with
`NEXT_PUBLIC_API_BASE_URL=https://your-api` (CORS must then allow the app origins).

## Day-to-day workflow

```bash
npm run cap:sync        # build the offline bundle and copy it into android/ and ios/
npm run app:icons       # regenerate launcher icons + splash screens from the pixel art
npm run android:open    # opens Android Studio  → Run ▶ on a phone/emulator
npm run ios:open        # opens Xcode (macOS)   → Run ▶ on an iPhone/simulator
npm run android:debug-apk   # command-line debug APK (needs Android SDK + JDK 21)
```

CI (`.github/workflows/ci.yml`) also builds an installable **debug APK on every push** – download it from the
GitHub Actions run (artifact `chitti-naidu-run-debug-apk`) and install it on any Android phone (allow "install
unknown apps").

App id / bundle id: `com.sritrilinga.chittinaidurun` (in `capacitor.config.ts`). Decide the final id **before the
first store upload** – it can never change afterwards. To rename, change it there and in
`android/app/build.gradle` (`applicationId`, `namespace`) and in Xcode (*Signing & Capabilities → Bundle Identifier*).

## Publishing checklist

### Accounts (the D-U-N-S number)
* **Apple Developer Program** (US$99/year): enrolling as an *organization* requires a **D-U-N-S number** for the
  company. Until it arrives you can develop and test on your own iPhone with a free Apple ID in Xcode.
* **Google Play Console** (US$25 one-time): organization accounts also require a D-U-N-S number. New personal
  accounts must run a closed test (≥ 12 testers for 14 days) before production.

### Android (Google Play)
1. Create an upload keystore (keep it backed up – losing it is painful):
   `keytool -genkey -v -keystore chitti-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
2. Android Studio → *Build → Generate Signed App Bundle* → `.aab` (Play requires AAB, enable Play App Signing).
3. Bump `versionCode` / `versionName` in `android/app/build.gradle` for every upload.
4. Store listing: 512×512 icon, feature graphic 1024×500, phone screenshots, short + full description,
   content rating questionnaire, **Data safety: "No data collected"** (true for the offline build).

### iOS (App Store)
1. On a Mac: `npm run cap:sync && npm run ios:open`.
2. Xcode → *Signing & Capabilities* → select your team, bundle id.
3. Set version/build, *Product → Archive* → *Distribute App* → App Store Connect → TestFlight → review.
4. App Privacy: **"Data Not Collected"** for the offline build. Encryption: the Info.plist already declares
   `ITSAppUsesNonExemptEncryption = false`.

### Store-review notes for a political-satire game
* Keep the in-game disclaimer (main menu) and repeat it in the store description: all characters, parties and the
  flag are fictional; no real politicians.
* The party flag uses orange/white/green bands with a raised-hand ✋ emblem. A blue wheel/chakra-like emblem is
  deliberately avoided: the Indian national flag and emblems are protected under the *Emblems and Names
  (Prevention of Improper Use) Act, 1950* and the Flag Code.
* **Heads-up:** an open palm on an orange-white-green flag is very close to the registered election symbol and flag
  of a real party (INC), and the HYDRA demolition event references a real Hyderabad agency. Combined, players will
  read the game as satire of a real government rather than a fictional one. Political satire is generally allowed
  (Apple 1.1.1 exempts professional political satire), but keep it clearly comedic, avoid factual claims or
  allegations, keep the fictional disclaimer, and consider a quick legal review before publishing. The emblem is a
  single function (`handEmblem` in `src/game/art/character.ts`) if you ever want to swap it.
* Real place names (Charminar, Ameerpet, Hitech City, Tank Bund…) are fine. Shops and malls use **generic** names –
  real brand names/logos need the owner's permission. Football posters show a generic "No. 10" player in
  sky-blue/white stripes – no real player names, faces, club/federation crests or sponsor logos.

## Roadmap: app-only (removing the website and AWS)

The game logic, art, audio and saves are already 100 % client-side, so going app-only is a deletion exercise:

1. Ship the apps; point the website's domain at a simple landing page with store badges (or just delete it).
2. Delete `src/app/api/**`, `src/server/**`, `amplify.yml`, `infra/**`, `@aws-sdk/*` dependencies, and the
   `ONLINE_ENABLED` branches in `src/lib/api.ts`, `Leaderboard.tsx` and `GameView.tsx`.
3. Make `npm run build` an alias of `build:app`; remove the web-only security headers block in `next.config.ts`.
4. Tear down AWS: `aws cloudformation delete-stack --stack-name chitti-run-<stage>` (DynamoDB is retained – delete
   it manually if you don't need old leaderboards), delete the Amplify app and Route 53 zone.

Optional later (still no servers of your own): Google Play Games Services / Apple Game Center leaderboards via a
Capacitor plugin, and cloud save via the platform's own backup.
