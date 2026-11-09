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

/** What the (fictional) public asks the CM when he runs into the city's problems. */
const QUESTIONS: Partial<Record<string, string[]>> = {
  pothole: ["“CM garu, ee pothole eppudu fill chestaru?”", "“Road aa, swimming pool aa?”", "“Pothole count > vote count!”"],
  puddle: ["“Varsham padithe chaalu, road lo boat kavali!”", "“Drainage ekkada sir?”", "“Waterlogging ki solution undha?”"],
  jam: ["“2 km ki 2 gantalu – idhi development aa?”", "“Signal panichesthunda asalu?”", "“Traffic jam lo pelli miss ayyindi!”"],
  auto: ["“Meter vesthara leda?”"],
  bus: ["“Bus eppudu time ki vasthundi?”"],
  potQueue: ["“Neellu ekkada CM garu? Bindelu khaali!”", "“Roju tanker kosam line lo nilabadali aa?”", "“Water bill vasthundi, water raadu!”"],
  tanker: ["“Tap lo neellu eppudu?”", "“Tanker ki ₹2000 aa?!”"],
  cables: ["“Ee wires ki owner evaru?”"],
  speedBreaker: ["“Speed breaker aa, mountain aa?”"],
  fileStack: ["“Na file eppudu sign avthundi?”"],
  redTape: ["“Red tape cut cheyyandi sir!”"],
};

export function publicQuestion(kind: string): string | null {
  const pool = QUESTIONS[kind];
  return pool ? pool[Math.floor(Math.random() * pool.length)] : null;
}

export function pickLine(reason: EndReason | null, seed: number): string {
  const pool =
    reason === "noConfidence" || reason === "powerZero"
      ? CM_LOST_LINES
      : reason === "campaignComplete"
        ? VICTORY_LINES
        : GAME_OVER_LINES;
  return pool[Math.abs(Math.floor(seed)) % pool.length];
}
