const BLOCKED = ["fuck", "shit", "bitch", "bastard", "dick", "cunt", "slut", "whore", "nazi", "rape", "nigg", "madarchod", "bhenchod", "chutiya", "lanja", "dengu", "puku", "gandu"];

/** Leaderboard display names: short, printable, no markup, mild profanity filter. */
export function sanitizeName(raw: unknown): string {
  if (typeof raw !== "string") return "Chitti Fan";
  let s = raw.normalize("NFKC").replace(/[^\p{L}\p{N} ._\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
  const flat = s.toLowerCase().replace(/[^a-z]/g, "");
  if (!s || BLOCKED.some((w) => flat.includes(w))) s = "Chitti Fan";
  return s;
}
