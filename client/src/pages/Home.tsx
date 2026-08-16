/* ============================================================
   Home — Midnight Vault
   Banner carousel + category chips (2x3 bordered grid)
   + game sections: နာမည်ကြီး / ကျွဲဂိမ်း / စလော့ / ဖဲ / ငါးပစ် / အာကိတ်
   Live API: /hot-games (slotGames/fishingGames/arcadeGames)
   Thumbnails: imageLinkGenerate (original logic) with fallback chain
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Flame, Zap, Sparkles, Rocket, Gamepad2, Fish, Crown, ChevronRight, Megaphone } from "lucide-react";
import { getHotGames, getGames, type GameInfo } from "@/lib/api";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ASSETS } from "@/lib/assets";

// Authentic rooms from the original site — verified tile images (original CDN)
// and live launch APIs (/new-buffalo-data, /buffalo-data, /forest-data,
// /galone-data, /galone-galone, /shankomee-data, /bugyee-new-data).
const BUFFALO_ROOMS = [
  { id: "buffalo", label: "African Buffalo", sub: "အသစ်", img: ASSETS.hotTiles.buffaloNewCard },
  { id: "buffalo", label: "African Buffalo", sub: "အသစ်", img: ASSETS.hotTiles.buffaloNewCard },
  { id: "buffalo_old", label: "African Buffalo", sub: "မူရင််း", img: ASSETS.hotTiles.arcade332 },
  { id: "buffalo_old", label: "African Buffalo", sub: "မူရင််း", img: ASSETS.hotTiles.arcade332 },
];

const OTHER_ROOMS = [
  { id: "forest", label: "ကျွဲနီလေးခန််း", img: ASSETS.providers.forest },
  { id: "galangalu", label: "ဂလုံး", img: ASSETS.providers.galone },
  { id: "galone_galone", label: "ဂလုံးဂလုံး", img: "/assets/tiles/lion_galone_galone.webp" },
  { id: "skm", label: "ရှန််ကိုးမီး", img: ASSETS.providers.skm },
];

const HERO = "/assets/hero-banner_60483ea8.png";
const DARK_BG = "/assets/dark-bg_42856a18.png";

/* ---------- thumbnail builder (EXACT replica of the original app.js imageLinkGenerate) ---------- */
const BF_CDN = "https://cdn.myanmarshankoeme.com/build/assets/img/bf688";
const ST = "https://space-tech.sgp1.cdn.digitaloceanspaces.com";

export function imageLinkGenerate(game: GameInfo): string {
  const provider = (game.provider ?? "").trim();
  const id = String(game.gameID ?? "").trim();
  if (!id) return "";
  if (provider === "Jili") return `${BF_CDN}/jili/${id}.webp`;
  if (provider === "Spade") return `https://merchantapi.silverkirin88.com/thumbnail/en_US/${id}.jpg`;
  if (provider === "Fastspin") return `http://api-egame-staging.fsuat.com/thumbnail/en_US/${id}.jpg`;
  if (provider === "Playstar") return `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/playstar/${id}.png`;
  if (provider === "FaChai") return `${BF_CDN}/fachai/${id}_icon_300x500_mm.webp`;
  if (provider === "PGSoft") return `${ST}/slot-images/pgsoft/${id}.webp`;
  if (provider === "JOKER" || provider === "Joker") return `${ST}/slot-images/joker/${id}.webp`;
  if (provider === "5G") return `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/5g/${id}.png`;
  if (provider === "KA") return `${ST}/slot-images/ka/${id}.webp`;
  if (provider === "AceWin") return `${BF_CDN}/acewin/${id}_EN.webp`;
  if (provider === "JDB") return `${ST}/slot-images/jdb/${id}.webp`;
  if (provider === "Buffalo" && id === "47") return `${ST}/slot-images/jili/JL_400x540_GameID47_en-US.webp`;
  if (provider === "FatPanda") return `https://api-2104.ppgames.net/game_pic/square/138/${id}.jpg`;
  if (provider === "2J") return `${BF_CDN}/2j/${id}.webp`;
  if (provider === "HotDog") return `${BF_CDN}/hotdog/${id}.webp`;
  // default — Pragmatic/PP and anything else
  return `${BF_CDN}/pp/${id}.webp`;
}

/* ---------- notice marquee ---------- */
function NoticeBar() {
  const msg = "Buffalo688 မှ လိုက်လျော့စွာကစားကြပါ။ ငွေသွင်း၊ ငွေထုတ် မှုတိုင်း အမြန်ဆုံး ဆောင်ရွက်ပေးပါသည်။";
  return (
    <div className="mx-4 mt-3 rounded-full bg-[#101830] gold-border flex items-center gap-2 pl-3 overflow-hidden">
      <Megaphone size={14} className="text-[#e3b24a] shrink-0" />
      <div className="flex-1 overflow-hidden whitespace-nowrap py-2">
        <div className="marquee-track inline-block w-max">
          {[0, 1].map((i) => (
            <span key={i} className="text-[12px] text-[#c6cfde] pr-16">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- section title ---------- */
function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-6 pb-3">
      <span className="h-6 w-6 rounded-lg bg-[#16203d] gold-border flex items-center justify-center">
        <Icon size={15} className="text-[#e3b24a]" />
      </span>
      <h2 className="font-display font-bold text-[15px] gold-text">{title}</h2>
      <span className="flex-1 h-px bg-[#22305a]" />
    </div>
  );
}

/* ---------- game card ---------- */
const PROVIDER_KEY: Record<string, string> = {
  Jili: "jili", PGSoft: "pgsoft", FaChai: "fachai", Pragmatic: "pp", PP: "pp",
  Buffalo: "buffalo", Joker: "joker", JOKER: "joker", KA: "ka", JDB: "jdb",
  HotDog: "hotdog", Spade: "spade", Playstar: "playstar", AceWin: "acewin", "2J": "twj",
  "5G": "fiveg",
};

function gameRouteKey(provider: string): string {
  const p = String(provider ?? "").trim();
  if (PROVIDER_KEY[p]) return PROVIDER_KEY[p];
  const low = p.toLowerCase().replace(/[^a-z0-9]/g, "");
  return low || "jili";
}

function GameCard({ game, hot }: { game: GameInfo; hot?: boolean }) {
  const [err, setErr] = useState(false);
  return (
    <Link
      href={`/game/${gameRouteKey(game.provider)}/${encodeURIComponent(game.gameID)}`}
      className="rise-in press relative block rounded-xl overflow-hidden bg-[#101830] gold-border"
    >
      <img
        src={err ? `${imageLinkGenerate(game)}?${Date.now()}` : imageLinkGenerate(game)}
        alt={game.gameName}
        loading="lazy"
        onError={() => setErr(true)}
        className="w-full aspect-[3/4] object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-6 pb-1.5">
        <div className="text-[11px] font-medium text-white truncate">{game.gameName}</div>
        <div className="text-[9px] text-[#9fb0d4] uppercase tracking-wide">{game.provider}</div>
      </div>
      {hot && (
        <span className="absolute top-1.5 right-1.5 text-[13px] drop-shadow">🔥</span>
      )}
    </Link>
  );
}

function GameRow({ games, hot }: { games: GameInfo[]; hot?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-2.5 px-4">
      {games.map((g, i) => (
        <div key={`${g.gameID}-${i}`} style={{ animationDelay: `${i * 40}ms` }} className="rise-in">
          <GameCard game={g} hot={hot} />
        </div>
      ))}
    </div>
  );
}

/* ---------- category chips (2x3 grid like original) ---------- */
const CHIPS = [
  { id: "hot", label: "နာမည်ကြီး", icon: Flame, emoji: "🔥" },
  { id: "buffalo", label: "ကျွဲဂိမ်း", icon: Crown, emoji: "🐂" },
  { id: "slot", label: "စလော့", icon: Zap, emoji: "🎰" },
  { id: "card", label: "ဖဲ", icon: Sparkles, emoji: "🃏" },
  { id: "fish", label: "ငါးပစ်", icon: Fish, emoji: "🐟" },
  { id: "arcade", label: "အာကိတ်", icon: Rocket, emoji: "🚀" },
];


/* Provider strip under banner — like the original home navigation */
const PROVIDER_ROW = [
  { id: "jili", label: "JILI", emoji: "🐉" },
  { id: "pp", label: "PP", emoji: "🎰" },
  { id: "pgsoft", label: "PG", emoji: "🎲" },
  { id: "fachai", label: "FaChai", emoji: "🧧" },
  { id: "joker", label: "Joker", emoji: "🃏" },
  { id: "ka", label: "KA", emoji: "⚡" },
  { id: "jdb", label: "JDB", emoji: "🐯" },
  { id: "hotdog", label: "HotDog", emoji: "🌭" },
];


export default function Home() {
  const loggedIn = !!useAuth().user;
  const [, navigate] = useLocation();
  const [hot, setHot] = useState<GameInfo[]>([]);
  const [slotGames, setSlotGames] = useState<GameInfo[]>([]);
  const [fishGames, setFishGames] = useState<GameInfo[]>([]);
  const [arcadeGames, setArcadeGames] = useState<GameInfo[]>([]);
  const [buffaloGames, setBuffaloGames] = useState<GameInfo[]>([]);
  const [cardGames, setCardGames] = useState<GameInfo[]>([]);
  const [chip, setChip] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      try {
        const [h, live] = await Promise.all([getGames({ provider: undefined }), getHotGames()]);
        const all: GameInfo[] = h?.data ?? [];
        setHot(all.slice(0, 20));
        setSlotGames(live?.data?.slotGames ?? []);
        setFishGames(live?.data?.fishingGames ?? []);
        setArcadeGames(live?.data?.arcadeGames ?? []);
        const buffalo = all.filter((g) => /buffalo|buff|charge buffalo/.test(g.gameName.toLowerCase()));
        const cards = all.filter((g) => String(g.gameTypeID).toLowerCase() === "bj" || String(g.gameTypeID).toLowerCase() === "sc");
        setBuffaloGames(buffalo.length ? buffalo : all.slice(0, 8));
        setCardGames(cards.length ? cards : all.filter((g) => String(g.gameTypeID) === "8").slice(0, 20));
      } catch (e) {
        toast.error("ဂိမ်းစာရင်း ရယူရာ မအောင်မြင်ပါ");
      }
    })();
  }, []);

  const visible = useMemo(() => {
    if (!chip) return null;
    switch (chip) {
      case "hot": return { title: "နာမည်ကြီး ဂိမ်းများ", games: hot.slice(0, 20) };
      case "buffalo": return { title: "ကျွဲဂိမ်းများ", games: buffaloGames };
      case "slot": return { title: "စလော့ ဂိမ်းများ", games: slotGames };
      case "card": return { title: "ဖဲ ဂိမ်းများ", games: cardGames };
      case "fish": return { title: "ငါးပစ် ဂိမ်းများ", games: fishGames };
      case "arcade": return { title: "အာကိတ် ဂိမ်းများ", games: arcadeGames };
      default: return null;
    }
  }, [chip, hot, buffaloGames, slotGames, cardGames, fishGames, arcadeGames]);

  return (
    <AppShell title="Buffalo688">
      <NoticeBar />

      {/* banner carousel */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden gold-border relative rise-in">
        <img src={HERO} alt="Buffalo688 Daily Wins" className="w-full aspect-[21/9] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a14]/70 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="font-display font-extrabold text-[15px] gold-text leading-tight">Daily Wins</div>
            <div className="text-[11px] text-[#c6cfde]">မျှဝေပြီးဆုကြီးနေ့စဉ်ယူ</div>
          </div>
          <Link href="/register?code=SPD5Y8" className={`press px-3 py-1.5 rounded-full gold-grad text-[12px] font-bold text-[#1a1205] ${loggedIn ? "hidden" : ""}`}>
            စာရင််းသွင််းရန်
          </Link>
        </div>
      </div>

      {/* category chips */}
      {/* provider icon strip (original home sideNav: slots/fishing by provider) */}
      <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
        {PROVIDER_ROW.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/game/${p.id}`)}
            className="press flex flex-col items-center gap-1 rounded-xl border border-[#22305a] bg-[#101830] px-2 py-2.5"
          >
            <span className="text-[16px]">{p.emoji}</span>
            <span className="text-[11px] font-medium text-[#c6cfde]">{p.label}</span>
          </button>
        ))}
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              const target: Record<string, string> = {
                hot: "/",
                buffalo: "/game/buffalo",
                slot: "/game/pp",
                card: "/game/card",
                fish: "/game/jili",
                arcade: "/game/jili",
              };
              if (c.id === "hot") return setChip((v) => (v === c.id ? null : c.id));
              navigate(target[c.id] ?? "/");
            }}
            className={`press flex items-center gap-1.5 rounded-xl border px-2.5 py-2.5 transition-colors ${
              chip === c.id
                ? "gold-grad text-[#1a1205] border-transparent font-semibold"
                : "border-[#22305a] bg-[#101830] text-[#c6cfde]"
            }`}
          >
            <span className="text-[14px]">{c.emoji}</span>
            <span className="text-[12px] font-medium truncate">{c.label}</span>
          </button>
        ))}
      </div>

      {visible && (
        <>
          <SectionTitle icon={Gamepad2} title={visible.title} />
          {visible.games.length ? (
            <GameRow games={visible.games} />
          ) : (
            <div className="px-4 py-8 text-center text-[13px] text-[#7c87a6]">ဂိမ်းမရှိသေးပါ</div>
          )}
        </>
      )}

      {!visible && (
        <>
          <SectionTitle icon={Flame} title="နာမည်ကြီး ဂိမ်းများ" />
          <GameRow games={hot} hot />

          {/* Authentic African Buffalo rooms — original live tiles + live APIs */}
          <SectionTitle icon={Crown} title="African Buffalo လေးခန်း" />
          <div className="grid grid-cols-4 gap-2.5 px-4">
            {BUFFALO_ROOMS.map((b, i) => (
              <Link key={`${b.id}-${i}`} href={`/rooms/${b.id}`} className="rise-in press relative block rounded-xl overflow-hidden bg-[#101830] gold-border">
                <img src={b.img} alt={b.label} loading="lazy" className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-8 pb-1.5">
                  <div className="text-center font-display font-bold text-[12px] text-[#ffd93c]">{b.label}</div>
                </div>
                <span className="absolute top-1.5 right-1.5 text-[13px] drop-shadow">🔥</span>
                {i < 2 && (
                  <span className="pointer-events-none absolute top-1.5 left-1.5 rounded-sm bg-emerald-500 px-1 py-0.5 text-[8px] font-bold text-white shadow">
                    အသစ်
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Other authentic rooms — original live tiles + live APIs */}
          <SectionTitle icon={Megaphone} title="အခန်းများ (Rooms)" />
          <div className="grid grid-cols-4 gap-2.5 px-4">
            {OTHER_ROOMS.map((r) => (
              <Link key={r.id} href={`/rooms/${r.id}`} className="rise-in press relative block rounded-xl overflow-hidden bg-[#101830] gold-border">
                <img src={r.img} alt={r.label} loading="lazy" className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pt-8 pb-1.5">
                  <div className="text-center font-display font-bold text-[12px] text-[#ffd93c]">{r.label}</div>
                </div>
                <span className="absolute top-1.5 right-1.5 text-[13px] drop-shadow">🔥</span>
              </Link>
            ))}
          </div>

          <SectionTitle icon={Zap} title="စလော့ ဂိမ်းများ" />
          <GameRow games={slotGames} />

          <SectionTitle icon={Sparkles} title="ဖဲ ဂိမ်းများ" />
          <GameRow games={cardGames} />

          <SectionTitle icon={Fish} title="ငါးပစ် ဂိမ်းများ" />
          <GameRow games={fishGames} />

          <SectionTitle icon={Rocket} title="အာကိတ် ဂိမ်းများ" />
          <GameRow games={arcadeGames} />
        </>
      )}

      {/* footer strip */}
      <div className="mx-4 mt-8 mb-4 rounded-xl bg-[#101830] gold-border px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-[#7c87a6]">© 2026 Buffalo688</span>
        <Link href="/profile" className="text-[11px] text-[#e3b24a] inline-flex items-center gap-1 font-medium">
          ကူညီရေး <ChevronRight size={12} />
        </Link>
      </div>
    </AppShell>
  );
}
