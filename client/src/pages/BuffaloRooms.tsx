/* ============================================================
   Buffalo rooms — African Buffalo / တောဒိုက်ကောက်မီး / ဂလုံး / ဂလုံးဂလုံး
   (original bundle: fetchBuffaloData / fetchForestData / fetchGaloneData /
   fetchGaloneGalone). Midnight Vault palette.
   Direct-launch rooms (no level tiles): balance gate 1,000 min like original,
   live GET /buffalo-data, /new-buffalo-data, /forest-data, /galone-data,
   /galone-galone. Server lock messages shown as Burmese error alerts exactly
   like the original n.A.alert / alertBoxForLimit.
   Route: /rooms/:game (buffalo | forest | galangalu)
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, X, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getBuffaloData,
  getForestData,
  getGalangaluData,
  getGaloneGaloneData,
  getShanKoMeeData,
  getBugyeeData,
  RoomData,
} from "@/lib/api";
import { ASSETS } from "@/lib/assets";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

// Authentic tiles live on the original CDN via assets.providers / assets.hotTiles (assets.ts).
const WELCOME_TILE = ASSETS.hotTiles.buffaloNewCard; // African Buffalo (new card tile)
const NEW_TILE = ASSETS.hotTiles.arcade332; // African Buffalo (classic 332 tile)

const CONFIG: Record<
  string,
  {
    title: string;
    subtitle: string;
    tile: string;
    fetch: (
      u: { id: string; balance: number },
      refresh: () => void
    ) => Promise<RoomData>;
  }
> = {
  buffalo: {
    title: "African Buffalo",
    subtitle: "နှုတ်ခွန်းဆိုသော ကျွန်းမင်း",
    tile: WELCOME_TILE,
    fetch: (_u, refresh) => {
      refresh();
      return getBuffaloData(true);
    },
  },
  buffalo_old: {
    title: "Classic Buffalo",
    subtitle: "မူရင်း African Buffalo ဂိမ်း",
    tile: NEW_TILE,
    fetch: (_u, refresh) => {
      refresh();
      return getBuffaloData(false);
    },
  },
  buffalo_new: {
    title: "African Buffalo အသစ်",
    subtitle: "African Buffalo အသစ် version",
    tile: WELCOME_TILE,
    fetch: (_u, refresh) => {
      refresh();
      return getBuffaloData(true);
    },
  },
  forest: {
    title: "ကျွဲနီလေးခန်း",
    subtitle: "",
    // gate removed — original site allows entry regardless of balance
    tile: ASSETS.providers.forest,
    fetch: (u) => getForestData(u),
  },
  galangalu: {
    title: "ဂလုံး",
    subtitle: "",
    // gate removed — original site allows entry regardless of balance
    tile: ASSETS.providers.galone,
    fetch: (u) => getGalangaluData(u),
  },
  galone_galone: {
    title: "ဂလုံးဂလုံး",
    subtitle: "",
    // gate removed — original site allows entry regardless of balance
    tile: "/assets/tiles/lion_galone_galone.webp",
    // lion tile: authentic crop of the original site's lion room image (user screenshot)
    fetch: (u) => getGaloneGaloneData(u),
  },
  skm: {
    title: "ရှန်ကိုးမီး",
    subtitle: "",
    // gate removed — original site allows entry regardless of balance
    tile: ASSETS.providers.skm,
    fetch: (u, refresh) => {
      refresh();
      const nickname = String((u as any).username ?? (u as any).user_name ?? (u as any).name ?? (u as any).id ?? "");
      return getShanKoMeeData({ id: u.id, level: 1, balance: u.balance, nickname });
    },
  },
  bugyee: {
    title: "ဘီကင်",
    subtitle: "",
    // gate removed — original site allows entry regardless of balance
    tile: ASSETS.providers.bgy,
    fetch: (u, refresh) => {
      refresh();
      const nickname = String((u as any).username ?? (u as any).user_name ?? (u as any).name ?? (u as any).id ?? "");
      return getBugyeeData({ id: u.id, level: 1, balance: u.balance, nickname });
    },
  },
};

/* ---------- shared full-screen iframe game player ---------- */
function GamePlayer({ url, onExit, title }: { url: string; onExit: () => void; title: string }) {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (/exit|quit|close|gameExit|exitGame/i.test(data?.type ?? data?.event ?? "")) onExit();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <iframe
        src={url}
        title={title}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
      <button
        onClick={onExit}
        aria-label="ထွက်မည်"
        className="absolute top-3 right-3 z-50 h-9 w-9 rounded-full bg-black/70 backdrop-blur border border-[#c9962e]/60 flex items-center justify-center text-[#e3b24a] press"
      >
        <X size={18} />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur border border-[#22305a] text-[11px] text-[#c6cfde]">
        {title}
      </div>
    </div>
  );
}

export default function BuffaloRooms({ game }: { game?: string }) {
  const [, navigate] = useLocation();
  const { user, refreshBalance } = useAuth();

  const cfg = useMemo(() => {
    const key = (game ?? "").toLowerCase();
    return CONFIG[key] ?? CONFIG.buffalo;
  }, [game]);

  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [balance, setBalance] = useState(() => user?.balance ?? 0);

  useEffect(() => {
    setBalance(user?.balance ?? 0);
  }, [user?.balance]);

  async function openRoom() {
    const amount = Number(balance ?? 0);
    if (!user) return;
    setLoading(true);
    setLimitMsg(null);
    try {
      const userName = String(user.username ?? user.name ?? user.user_name ?? "");
      const res = await cfg.fetch(
        {
          id: userName,
          username: userName,
          user_name: userName,
          name: userName,
          balance: amount,
        },
        refreshBalance
      );
      const url = res?.gameURL ?? res?.gameUrl ?? null;
      if (url) {
        setGameUrl(url);
      } else {
        // Original shows the server's Burmese description in an alert modal.
        const errText = res?.description ?? res?.message ?? "";
        setLimitMsg(errText || "အခန်းဖွင့်၍ မရပါ");
      }
    } catch (e: any) {
      const msg = e?.message ?? "";
      setLimitMsg(msg || "အခန်းဖွင့်၍ မရပါ");
    } finally {
      setLoading(false);
    }
  }

  if (gameUrl) {
    return (
      <GamePlayer
        url={gameUrl}
        title={cfg.title}
        onExit={() => {
          setGameUrl(null);
          refreshBalance();
        }}
      />
    );
  }

  return (
    <AppShell title={cfg.title}>
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => navigate("/")}
            aria-label="နောက်သို့"
            className="press h-8 w-8 rounded-lg border border-[#22305a] bg-[#101830] flex items-center justify-center text-[#c6cfde]"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-display font-extrabold text-[17px] gold-text flex-1 text-center">{cfg.title}</h1>
          <button
            onClick={async () => {
              const b = await refreshBalance();
              setBalance(b);
              toast.success(`လက်ကျန် ${Number(b).toLocaleString()}`);
            }}
            aria-label="refresh"
            className="press h-8 w-8 rounded-lg border border-[#22305a] bg-[#101830] flex items-center justify-center text-[#e3b24a]"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* original-style tile + launch card */}
        <div className="mt-3 rounded-xl overflow-hidden bg-[#101830] gold-border">
          <img src={cfg.tile} alt={cfg.title} loading="lazy" className="w-full aspect-square object-cover" />
          <div className="px-4 pb-4 text-center">
            {cfg.subtitle ? <p className="text-[13px] text-[#c6cfde] py-1.5">{cfg.subtitle}</p> : null}
            <p className="text-[12px] text-[#7c87a6] pb-3">
              လက်ကျန် · <span className="text-[#e3b24a] font-semibold">{Number(balance).toLocaleString()}</span>
            </p>
            <button
              onClick={openRoom}
              disabled={loading}
              className="press w-full rounded-full gold-grad px-4 py-3 text-[14px] font-bold text-[#1a1205] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "ဖွင့်နေပါသည်..." : "အခန်းဝင်ရန်"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#7c87a6] py-4">
          အခန်းအဝင် အနည်းဆုံးပမာဏ ရှိမှ ဝင်ရောက်ကစားနိုင်ပါသည်။
        </p>
      </div>

      {/* original-style limit / server-message modal (black + gold) */}
      {limitMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-8"
          onClick={() => setLimitMsg(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-[#0a1024] gold-border px-6 py-8 text-center rise-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#16203d] gold-border flex items-center justify-center">
              <AlertTriangle size={22} className="text-[#e3b24a]" />
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#e8eaf2]">{limitMsg}</p>
            <button
              onClick={() => setLimitMsg(null)}
              className="press mt-6 w-full rounded-full gold-grad px-4 py-2.5 text-[13px] font-bold text-[#1a1205]"
            >
              နောက်သို့ပြန်သွားမည်။
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
