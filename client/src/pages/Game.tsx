/* ============================================================
   Game — Midnight Vault
   Provider catalog (live /games?provider=), original imageLinkGenerate
   thumbnails, full-screen game iframe with close bar.
   Route: /game/:provider/:gameID
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, X, Flame } from "lucide-react";
import { toast } from "sonner";
import { getGames, getGameUrl, type GameInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { imageLinkGenerate } from "@/pages/Home";
import AppShell from "@/components/AppShell";

// Route key → EXACT backend provider value. The backend query is case-sensitive
// (verified in the live bundle: ?provider=Jili / Pragmatic / HotDog / 2J ...).
const PROVIDERS: Record<string, string> = {
  jili: "Jili",
  buffalo: "Pragmatic",
  pp: "Pragmatic",
  pragmatic: "Pragmatic",
  joker: "Joker",
  jdb: "JDB",
  hotdog: "HotDog",
  twj: "2J",
  fiveg: "5G",
  card: "Pragmatic",
  "jili-fish": "Jili",
  "jili-ac": "Jili",
};

const LABELS: Record<string, string> = {
  jili: "JILI ဂိမ်းများ",
  buffalo: "ကျွဲဂိမ်းများ",
  pp: "Pragmatic Play",
  pragmatic: "Pragmatic Play",
  joker: "Joker ဂိမ်းများ",
  jdb: "JDB ဂိမ်းများ",
  hotdog: "HotDog ဂိမ်းများ",
  twj: "2J ဂိမ်းများ",
  fiveg: "5G ဂိမ်းများ",
  card: "ဖဲ ဂိမ်းများ",
  "jili-fish": "ငါးပစ် ဂိမ်းများ",
  "jili-ac": "အာကိတ် ဂိမ်းများ",
};

const BUFFALO_KEYS = ["bufking", "buf", "buffalo", "47charge", "crazybuffalo", "buffalowin"];
const isBuffaloGame = (g: GameInfo) => {
  const needle = `${String(g.gameID ?? "").toLowerCase()} ${(g.gameName ?? "").toLowerCase()}`;
  return BUFFALO_KEYS.some((k) => needle.includes(k));
};

export default function Game() {
  const { provider = "jili", game: gameKey } = useParams<{ provider: string; game?: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  // Route → live API provider name (verified values: jili, pgsoft, fachai).
  // Route key → EXACT backend provider value used for GET /games?provider=
  // AND for GET /games/url launch. Never normalize casing — the backend is
  // case-sensitive.
  const apiName = useMemo(() => PROVIDERS[String(provider).toLowerCase()] ?? "Jili", [provider]);
  // Special pages: "jili-fish" sends type=fish, "jili-ac" sends gameTypeID=ac.
  const apiTypeParam = useMemo(() => {
    if (provider === "jili-fish") return "fish";
    return undefined;
  }, [provider]);
  const apiTypeIDParam = useMemo(() => {
    if (provider === "jili-ac") return "ac";
    return undefined;
  }, [provider]);
  // Card page lists Pragmatic bj + sc games only.
  const isCardPage = provider === "card";

  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [gameName, setGameName] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setGames([]);
    const load =
      provider === "buffalo"
        ? getGames({})
            .then((res) =>
              ((res?.data ?? []) as GameInfo[]).filter(
                (g) => !g.is_close && (isBuffaloGame(g) || /charge buffalo/i.test(g.gameName ?? ""))
              )
            )
        : isCardPage
          ? getGames({ provider: apiName }).then((res) =>
              ((res?.data ?? []) as GameInfo[]).filter(
                (g) => !g.is_close && ["bj", "sc"].includes(String(g.gameTypeID).toLowerCase())
              )
            )
          : getGames({
              ...(apiTypeParam ? { type: apiTypeParam } : {}),
              ...(apiTypeIDParam ? { gameTypeID: apiTypeIDParam } : {}),
              provider: apiName,
            }).then((res) => ((res?.data ?? []) as GameInfo[]).filter((g) => !g.is_close));
    load
      .then((list: GameInfo[]) => {
        setGames(list);
        if (!list.length) setError("ဂိမ်းစာရင်း မရယူနိုင်ပါ");
      })
      .catch(() => setError("Server နှင့် ချိတ်ဆက်မရပါ"))
      .finally(() => setLoading(false));
  }, [apiName, apiTypeParam, apiTypeIDParam, isCardPage, provider]);

  const target = useMemo(() => {
    if (!gameKey) return null;
    const id = decodeURIComponent(gameKey);
    return games.find((g) => g.gameID === id || String(g.id) === id) ?? null;
  }, [gameKey, games]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (/exit|quit|close|gameExit|exitGame/i.test(data?.type ?? data?.event ?? "")) closeGame();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function launchGame(g: GameInfo) {
    if (launchingId || gameUrl) return;
    setLaunchingId(g.gameID);
    setError(null);
    try {
      // Original gameInit: provider comes from the page's route query in the API's
      // exact casing ("Jili", "Pragmatic", "PGSoft"...). Never send a normalized
      // lowercase name — the backend maps the wrong game otherwise (e.g. /game/jili
      // clicked → Pragmatic URL returned). Rewrite rules identical to original:
      // "FatPanda" → "Pragmatic" (original bundle rule).
      let launchProvider: string = g.provider;
      if (String(g.provider).toLowerCase() === "fatpanda") launchProvider = "Pragmatic";
      const res = await getGameUrl({ gameID: g.gameID, provider: launchProvider, userId: user?.id });
      const url = res?.data?.gameUrl ?? res?.data?.gameURL ?? null;
      if (url) {
        setGameUrl(url);
        setGameName(g.gameName);
      } else toast.error(res?.message ?? "ဂိမ်းဖွင့်၍ မရပါ");
    } catch {
      toast.error("ဂိမ်းဖွင့်၍ မရပါ");
    } finally {
      setLaunchingId(null);
    }
  }

  function closeGame() {
    setGameUrl(null);
    setGameName("");
    navigate("/");
  }

  if (gameUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <iframe
          src={gameUrl}
          title={gameName}
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
        <button
          onClick={closeGame}
          aria-label="ထွက်မည်"
          className="absolute top-3 right-3 z-50 h-9 w-9 rounded-full bg-black/70 backdrop-blur border border-[#c9962e]/60 flex items-center justify-center text-[#e3b24a] press"
        >
          <X size={18} />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur border border-[#22305a] text-[11px] text-[#c6cfde]">
          {gameName}
        </div>
      </div>
    );
  }

  return (
    <AppShell title={LABELS[provider] ?? apiName}>
      <div className="px-4 py-4">
          {loading && (
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-[#101830] animate-pulse" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl bg-[#101830] border border-[#ef4444]/40 px-4 py-8 text-center text-[13px] text-[#ef4444]">{error}</div>
          )}
          {!loading && !error && !games.length && (
            <div className="text-center text-[13px] text-[#7c87a6] py-10">ဂိမ်း မရှိသေးပါ</div>
          )}
          <div className="grid grid-cols-3 gap-2.5">
            {games.map((g, i) => (
              <button
                key={g.id}
                onClick={() => launchGame(g)}
                disabled={launchingId !== null}
                className="rise-in press relative block rounded-xl overflow-hidden bg-[#101830] gold-border"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Thumb g={g} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-8 pb-1.5">
                  <div className="text-[11px] font-medium text-white truncate">{g.gameName}</div>
                  <div className="text-[9px] text-[#9fb0d4] uppercase tracking-wide">{g.provider}</div>
                </div>
                {launchingId === g.gameID && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-6 w-6 animate-spin text-[#e3b24a]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
    </AppShell>
  );
}

function Thumb({ g }: { g: GameInfo }) {
  const [src, setSrc] = useState(() => imageLinkGenerate(g));
  return <img src={src} alt={g.gameName} loading="lazy" onError={() => setSrc((s) => (s.includes("?") ? s : `${s}?retry=${Date.now()}`))} className="w-full aspect-[3/4] object-cover" />;
}
