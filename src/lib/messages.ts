import type { EndReason } from "@/game/logic/types";

/** Light-hearted Telugu-English ("Tenglish") messages. Entirely fictional satire about a cartoon character. */
export const GAME_OVER_LINES = [
  "Ayyo Chitti garu! Road lo pothole kaadu, mee plan lo pothole undi!",
  "Em chestam babu, traffic ki kuda opposition undi!",
  "Chai thaagi malli raa, Chitti! Irani chai waiting.",
  "Lives ayipoyayi... promises inka migile unnayi!",
  "Arey baboi! Auto-rickshaw ki right-of-way ekkuva!",
  "Paapam Chitti — the cow did not even move.",
  "Nee speed ki biryani kuda saripoledu!",
  "Files pending, CM bending!",
  "Inka konchem practice, inka konchem chai, anthe!",
  "Mana Chitti garu tired ayyaru. Short break, then full josh!",
];

export const CM_LOST_LINES = [
  "Kursi poyindi, kurta migilindi!",
  "No-confidence motion passed! Opposition bench lo seat ready, Chitti garu.",
  "Ayyayyo! CM post poyindi, but selfie skills still 100%.",
  "Public cheppindi: 'Vaddu babu!' Better luck next term.",
  "Power zero, approval zero, chai mathram full.",
];

export const VICTORY_LINES = [
  "Super Chitti garu! Public happy, roads happy, cows neutral.",
  "Bhale bhale! Promises delivered (mostly)!",
  "Kummesaru! Approval rating meter overflow ayyindi!",
];

export function pickLine(reason: EndReason | null, seed: number): string {
  const pool =
    reason === "noConfidence" || reason === "powerZero"
      ? CM_LOST_LINES
      : reason === "campaignComplete"
        ? VICTORY_LINES
        : GAME_OVER_LINES;
  return pool[Math.abs(Math.floor(seed)) % pool.length];
}
