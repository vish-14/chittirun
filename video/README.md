# 60-second gameplay video (HyperFrames)

Re-creates `chitti-naidu-run-gameplay-60s.mp4` (1080×1920, 60 s, H.264 + AAC) from the **real game build**.

```bash
npm run build:app                                   # offline bundle in out/
node scripts/serve-static.mjs out 3200 &            # serve it
node video/record-gameplay.cjs video/rec            # 5 scripted gameplay segments (Playwright, 1080x1920)
# trim the menu clicks (offsets in video/rec/meta.json) and convert to 30 fps H.264:
for f in s1-oldcity s2-hidra s3-traffic s4-crisis s5-lost; do
  st=$(node -e "console.log(require('./video/rec/meta.json').find(m=>m.name==='$f').start)")
  ffmpeg -y -ss $st -i video/rec/$f.webm -vf fps=30 -c:v libx264 -crf 18 -pix_fmt yuv420p -an video/trailer/assets/$f.mp4
done
npx tsx video/soundtrack.mts video/rec/soundtrack.wav  # the game's own songs, rendered offline
ffmpeg -y -i video/rec/soundtrack.wav -b:a 192k video/trailer/assets/soundtrack.mp3
npx tsx video/export-sprites.mts video/trailer/assets # pixel sprites for intro/outro cards
cp node_modules/gsap/dist/gsap.min.js video/trailer/assets/   # (npm i -D gsap@3.15.0 first)
cd video/trailer && npx hyperframes@0.9.26 render -o chitti-naidu-run-gameplay-60s.mp4
```

Edit (`trailer/index.html`): intro 0–3 s · Old City missions 3–14.5 · HIDRA demolition + Ranga & Tondal 14.5–27 ·
Ameerpet craters/“Public asks” 27–36 · Political Crisis “CM DOWN DOWN” 36–45.5 · No-confidence → CM Position Lost
45.5–56.5 · outro 56.5–60.
