import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native app shell (Android + iOS). The web game is statically exported to `out/`
 * (`npm run build:app`) and bundled inside the app – it runs fully offline.
 * Change appId before the first store upload if you prefer a different bundle identifier;
 * it cannot be changed after publishing.
 */
const config: CapacitorConfig = {
  appId: "com.sritrilinga.chittinaidurun",
  appName: "Chitti Naidu Run",
  webDir: "out",
  backgroundColor: "#1b1020",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "never",
    scrollEnabled: false,
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: "DARK", backgroundColor: "#1b1020" },
  },
};

export default config;
