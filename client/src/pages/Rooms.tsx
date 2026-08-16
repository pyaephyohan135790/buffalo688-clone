/* ============================================================
   Rooms — Shan Ko Mee / ဘီကင် (original /user/skm-rooms & /user/bugyee-rooms)
   Midnight Vault palette. Original layout: gold title, subtitle,
   2-col grid of 6 room tiles with EXACT original balance gates and
   Burmese limit messages. Game opens in a full-screen iframe keeping
   the app shell clean (bottom nav hidden inside the iframe view).
   Route: /rooms/:game (skm | bugyee)
   Live APIs: GET /shankomee-data, GET /bugyee-new-data
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getShanKoMeeData, getBugyeeData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

const SKM_TILE = "/assets/skm_tile_1833f62e.png";
const BGY_TILE = "/assets/bgy_tile_87c1f9be.png";
const BGY_ROOM = "/assets/bugyee_lion_room_96cb341e.png";
// Generated golden casino room tiles (original room PNGs no longer hosted)
const ROOM_TILES = [
  "/assets/room_100_b71d40e3.png",
  "/assets/room_300_b81d59f5.png",
  "/assets/room_500_100d5020.png",
  "/assets/room_1000_07105703.png",
  "/assets/room_3000_9e730a17.png",
  "/assets/room_5000_f497f5d5.png",
];

interface RoomGate {
  label: string;
  min: number;
  max?: number;
  lowMsg: string;
}

const ROOM_GATES: RoomGate[] = [
  { label: "အခန်း (၁)", min: 1000, max: 100000, lowMsg: "1,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။" },
  { label: "အခန်း (၂)", min: 3000, max: 300000, lowMsg: "3,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။" },
  { label: "အခန်း (၃)", min: 5000, max: 500000, lowMsg: "5,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။" },
  { label: "အခန်း (၄)", min: 10000, lowMsg: "10,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။" },
  { label: "အခန်း (၅)", min: 30000, lowMsg: "30,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။" },
  { label: "အခန်း (၆)", min: 50000, lowMsg: "50,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။" },
];

const OVER_MAX_MSG = "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
const OVER_MAX_SHORT = "ကျော်လွန်နေပါသည်။";

const CONFIG = {
  skm: {
    title: "ရှန်းကိုးမီး",
    subtitle: "သင့်ကြိုက်နှစ်သက်သော အခန်းတစ်ခန်းရွေးချယ်ပေးပါ။",
    tile: SKM_TILE,
    api: getShanKoMeeData,
  },
  bugyee: {
    title: "ဘီကင်",
    subtitle: "သင့်ကြိုက်နှစ်သက်သော အခန်းတစ်ခန်းရွေးချယ်ပေးပါ။",
    tile: BGY_TILE,
    api: getBugyeeData,
  },
} as const;

/* ---------- shared iframe game player ---------- */
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

export default function Rooms() {
  const { game } = useParams<{ game: string }>();
  const [, navigate] = useLocation();
  const { user, refreshBalance } = useAuth();

  const cfg = useMemo(() => {
    const key = (game ?? "").toLowerCase();
    return CONFIG[key as "skm" | "bugyee"] ?? CONFIG.skm;
  }, [game]);

  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [balance, setBalance] = useState(() => user?.balance ?? 0);

  const refresh = async () => {
    const b = await refreshBalance();
    setBalance(b);
    toast.success(`လက်ကျန် ${Number(b).toLocaleString()}`);
  };

  useEffect(() => {
    setBalance(user?.balance ?? 0);
  }, [user?.balance]);

  async function openRoom(level: number) {
    const gate = ROOM_GATES[level];
    if (!gate) return;
    const amount = Number(balance ?? 0);
    if (amount < gate.min) {
      setLimitMsg(gate.lowMsg);
      return;
    }
    if (gate.max && amount > gate.max) {
      setLimitMsg(OVER_MAX_MSG);
      return;
    }
    if (!user) return;
    setLoading(true);
    setLimitMsg(null);
    try {
      const res = await cfg.api({
        id: String(user.username ?? user.name ?? user.user_name ?? ""),
        level,
        balance: amount,
        nickname: String(user.user_name ?? user.username ?? user.name ?? ""),
      });
      const url = res?.gameURL ?? res?.gameUrl ?? null;
      if (url) {
        setGameUrl(url);
      } else {
        const errText = res?.message ?? res?.description ?? "";
        toast.error(errText || "အခန်းဖွင့်၍ မရပါ");
      }
    } catch (e: any) {
      const msg = e?.message ?? "";
      // Burmese server-side lock messages (e.g. still in SKM room) should be
      // shown as-is rather than a generic error.
      toast.error(msg || "အခန်းဖွင့်၍ မရပါ");
    } finally {
      setLoading(false);
    }
  }

  if (gameUrl) {
    return <GamePlayer url={gameUrl} title={cfg.title} onExit={() => { setGameUrl(null); refresh(); }} />;
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
            onClick={refresh}
            aria-label="refresh"
            className="press h-8 w-8 rounded-lg border border-[#22305a] bg-[#101830] flex items-center justify-center text-[#e3b24a]"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <p className="text-center text-[12px] text-[#c6cfde] py-2">
          {cfg.subtitle} · <span className="text-[#e3b24a] font-semibold">{Number(balance).toLocaleString()}</span>
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {ROOM_GATES.map((gate, i) => (
            <button
              key={gate.label}
              onClick={() => openRoom(i)}
              disabled={loading}
              className="press relative block rounded-xl overflow-hidden bg-[#101830] gold-border"
            >
              <img
                src={ROOM_TILES[i]}
                alt={gate.label}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-8 pb-1.5">
                <div className="text-center font-display font-bold text-[14px] text-[#ffd93c]">{gate.label}</div>
                <div className="text-center text-[9px] text-[#9fb0d4]">
                  အနည်းဆုံး {gate.min.toLocaleString()}
                  {gate.max ? ` · အများဆုံး ${gate.max.toLocaleString()}` : ""}
                </div>
              </div>
              {loading && (
                <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="text-[#e3b24a] animate-spin" />
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#7c87a6] py-4">
          အခန်းအဝင် အနည်းဆုံးပမာဏ ရှိမှ ဝင်ရောက်ကစားနိုင်ပါသည်။
        </p>
      </div>

      {/* original-style limit modal (black + gold, like the original #limit modal) */}
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
              <RefreshCw size={22} className="text-[#e3b24a]" />
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#e8eaf2]">{limitMsg}</p>
            <button
              onClick={() => setLimitMsg(null)}
              className="press mt-6 w-full rounded-full gold-grad px-4 py-2.5 text-[13px] font-bold text-[#1a1205]"
            >
              ဟုတ်ပြီ။
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
