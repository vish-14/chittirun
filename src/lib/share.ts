export function shareText(score: number, levelName: string, extra = ""): string {
  return `I scored ${score.toLocaleString("en-IN")} in CHITTI NAIDU RUN – The Great CM Escape (${levelName})! ${extra}Can you beat Chitti garu? 🏃‍♂️🧡`.trim();
}

export function whatsappUrl(text: string, url?: string): string {
  const full = url ? `${text} ${url}` : text;
  return `https://wa.me/?text=${encodeURIComponent(full)}`;
}

export async function nativeShare(text: string, url?: string): Promise<boolean> {
  const { nativeShareSheet } = await import("./native");
  if (await nativeShareSheet("CHITTI NAIDU RUN", text, url)) return true;
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "CHITTI NAIDU RUN", text, url });
      return true;
    }
  } catch {
    /* user cancelled */
  }
  return false;
}
