/**
 * Buffalo688 rebuild — shared game utilities.
 * Thumb URL builder matches the ORIGINAL site's imageLinkGenerate (app.3b6a1c48.js):
 *   Jili   → cdn.myanmarshankoeme.com/.../jili/${id}.webp
 *   Spade  → merchantapi.silverkirin88.com/thumbnail/en_US/${id}.jpg
 *   Fastspin→ api-egame-staging.fsuat.com/thumbnail/en_US/${id}.jpg
 *   Playstar→ yy24gld.sgp1.cdn.digitaloceanspaces.com/playstar/${id}.png
 *   FaChai → cdn/.../fachai/${id}_icon_300x500_mm.webp
 *   PGSoft → space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/pgsoft/${id}.webp
 *   JOKER  → space-tech.../slot-images/joker/${id}.webp
 *   5G     → yy24gld.../5g/${id}.png
 *   KA     → space-tech.../slot-images/ka/${id}.webp
 *   AceWin → cdn/.../acewin/${id}_EN.webp
 *   JDB    → space-tech.../slot-images/jdb/${id}.webp
 *   Buffalo id==47 → space-tech.../slot-images/jili/JL_400x540_GameID47_en-US.webp
 *   FatPanda → api-2104.ppgames.net/game_pic/square/138/${id}.jpg
 *   2J     → cdn/.../2j/${id}.webp
 *   HotDog → cdn/.../hotdog/${id}.webp
 *   default→ cdn/.../pp/${id}.webp
 */
import { getGames as apiGetGames, getHotGames as apiGetHotGames, type GameInfo } from "@/lib/api";

export type { GameInfo };
export { getGames };

export function getHotGames() {
  return apiGetHotGames().catch(() => ({ data: {} })) as Promise<{
    data?: {
      slotGames?: GameInfo[];
      fishingGames?: GameInfo[];
      arcadeGames?: GameInfo[];
    };
  }>;
}

function getGames(params: { provider?: string } = {}): Promise<{ data?: GameInfo[] }> {
  return apiGetGames(params).catch(() => ({ data: [] })) as Promise<{ data?: GameInfo[] }>;
}

const CDN = "https://cdn.myanmarshankoeme.com/build/assets/img/bf688";
const ST = "https://space-tech.sgp1.cdn.digitaloceanspaces.com";

declare global {
  interface Window {
    __BF688_THUMB__?: (provider: string, id: string) => string;
  }
}

/** Primary: the ORIGINAL site's own imageLinkGenerate (loaded from /js/original-thumb.js).
 *  Fallback: same rules replicated locally so build-time code stays correct too. */
export function thumbForGame(g: GameInfo): string {
  const p = (g.provider || "").trim();
  const id = String(g.gameID || "").trim();
  if (!id) return "";
  const orig =
    typeof window !== "undefined" && typeof window.__BF688_THUMB__ === "function"
      ? window.__BF688_THUMB__!
      : null;
  if (orig) return orig(p, id);
  if (p === "Jili") return `${CDN}/jili/${id}.webp`;
  if (p === "Spade") return `https://merchantapi.silverkirin88.com/thumbnail/en_US/${id}.jpg`;
  if (p === "Fastspin") return `http://api-egame-staging.fsuat.com/thumbnail/en_US/${id}.jpg`;
  if (p === "Playstar") return `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/playstar/${id}.png`;
  if (p === "FaChai") return `${CDN}/fachai/${id}_icon_300x500_mm.webp`;
  if (p === "PGSoft") return `${ST}/slot-images/pgsoft/${id}.webp`;
  if (p === "JOKER" || p === "Joker") return `${ST}/slot-images/joker/${id}.webp`;
  if (p === "5G") return `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/5g/${id}.png`;
  if (p === "KA") return `${ST}/slot-images/ka/${id}.webp`;
  if (p === "AceWin") return `${CDN}/acewin/${id}_EN.webp`;
  if (p === "JDB") return `${ST}/slot-images/jdb/${id}.webp`;
  if (p === "Pragmatic" && id === "47") return `${ST}/slot-images/jili/JL_400x540_GameID47_en-US.webp`;
  if (p === "FatPanda") return `https://api-2104.ppgames.net/game_pic/square/138/${id}.jpg`;
  if (p === "2J") return `${CDN}/2j/${id}.webp`;
  if (p === "HotDog") return `${CDN}/hotdog/${id}.webp`;
  return `${CDN}/pp/${id}.webp`;
}
