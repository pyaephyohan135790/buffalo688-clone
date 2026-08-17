/* ============================================================
   Home — exact replica of m.buffalo688.net original app.js render:
     1. Top strip: logo + balance/login block (AppShell)
     2. Banner carousel from website-infos home_banners
     3. Side-nav category tabs: hot / buffalo / card / fishing / arcade / slot (+ skm / bgy / football on original)
     4. Room tiles: new_2_card x2 (new-buffalo-data), 332 x4 (buffalo-data), bufalo688_skm, buffalo688_galone, buffalo688_forest, pp-lc (PP Live)
     5. Hot sections: popular_games (hotGames), popular_slot_games (slotGames),
        popular_fishing_games (fishingGames), popular_arcade_games (arcadeGames)
        with exact-case provider imageLinkGenerate + name labels
   Live backend only — no fake tiles anywhere.
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Flame, ChevronRight, Swords, Castle, Fish, Rocket, Gamepad2, Landmark } from "lucide-react";
import {
  getHotGames,
  getGames,
  getWebsiteInfos,
  imageLinkGenerate,
  type GameInfo,
} from "@/lib/api";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";

const BF_CDN = "https://cdn.myanmarshankoeme.com/build/assets/img/bf688";
const GT = "https://storage.googleapis.com/spacetech2/bf688";

/* Original side-nav tabs (home view) in render order */
const NAV_TABS = [
  { id: "hot", label: "နာမည်ကြီး", img: `${BF_CDN}/buffalo_hot_games.webp`, color: "#eda394", icon: Flame },
  { id: "buffalo", label: "အခန်းများ", img: `${BF_CDN}/buffalo688.webp`, color: "#eda394", icon: Castle },
  { id: "card", label: "ဖဲ", img: `${BF_CDN}/pok3.webp`, color: "#cfa5a5", icon: Landmark },
  { id: "fishing", label: "ငါးပစ်", img: `${BF_CDN}/smt223_fishing.png`, color: "#cfa5a5", icon: Fish },
  { id: "arcade", label: "အာကိတ်", img: `${BF_CDN}/smt223_arcade.png`, color: "#cfa5a5", icon: Rocket },
  { id: "slot", label: "စလော့", img: `${BF_CDN}/smt223_slot.png`, color: "#cfa5a5", icon: Gamepad2 },
] as const;

type NavId = (typeof NAV_TABS)[number]["id"];

/* Original room-grid tiles (buffalo nav) — exact images & handlers */
const ROOM_TILES = [
  { id: "buffalo_new", img: `${BF_CDN}/buffalo688_new_2_card.webp`, label: "African Buffalo အသစ်", target: "new" as const },
  { id: "buffalo_new2", img: `${BF_CDN}/buffalo688_new_2_card.webp`, label: "African Buffalo အသစ်", target: "new" as const },
  { id: "buffalo1", img: `${BF_CDN}/332.png`, label: "African Buffalo", target: null },
  { id: "buffalo2", img: `${BF_CDN}/332.png`, label: "African Buffalo", target: null },
  { id: "buffalo3", img: `${BF_CDN}/332.png`, label: "African Buffalo", target: null },
  { id: "buffalo4", img: `${BF_CDN}/332.png`, label: "African Buffalo", target: null },
];

/* Original other-room tiles (from buffalo/card nav, same layout) */
const OTHER_ROOM_TILES = [
  { id: "skm", img: `${BF_CDN}/bufalo688_skm.webp`, label: "ရှန််ကိုးမီး", route: "/rooms/skm" },
  { id: "galangalu", img: `${BF_CDN}/buffalo688_galone.webp`, label: "ဂလုံး", route: "/rooms/galangalu" },
  { id: "forest", img: `${BF_CDN}/buffalo688_forest.webp`, label: "ကျွဲနီလေးခန်း", route: "/rooms/forest" },
  { id: "pp_live", img: `${GT}/pp-lc.webp`, label: "PP Live", route: "/game/pp-live" },
];

/* Original slot-nav provider strip (6 tiles → /game/<provider> routes) */
const SLOT_NAV = [
  { id: "pragmatic", img: `${BF_CDN}/smt223_pp.webp`, label: "PP" },
  { id: "jili", img: `${BF_CDN}/smt223_jili.webp`, label: "JILI" },
  { id: "hotdog", img: `${GT}/bff_hotdog_slot.webp`, label: "HotDog" },
  { id: "fachai", img: `${GT}/bf688_fachai.webp`, label: "FaChai" },
  { id: "acewin", img: `${GT}/bf688_acewin_slot.webp`, label: "AceWin" },
  { id: "twj", img: `${GT}/bff_2j_slot.webp`, label: "2J" },
] as const;

/* Original fishing-nav provider strip (4 tiles) */
const FISH_NAV = [
  { id: "jili-fish", img: `${GT}/bf688_jili_fishing.webp`, label: "JILI ငါးပစ်" },
  { id: "acewin-fish", img: `${GT}/bf688_acewin_fishing.webp`, label: "AceWin ငါးပစ်" },
  { id: "fachai-fish", img: `${GT}/bf688_fc_fishing.webp`, label: "FaChai ငါးပစ်" },
  { id: "twj-fish", img: `${GT}/bff_2j_fish.webp`, label: "2J ငါးပစ်" },
] as const;

const PROVIDER_KEY: Record<string, string> = {
  Jili: "jili", Pragmatic: "pragmatic", PP: "pragmatic", PP_Live: "pp-live",
  Joker: "joker", JOKER: "joker", JDB: "jdb",
  HotDog: "hotdog", "2J": "twj", "5G": "fiveg", Buffalo: "buffalo",
};

function gameRouteKey(provider: string): string {
  const p = String(provider ?? "").trim();
  if (PROVIDER_KEY[p]) return PROVIDER_KEY[p];
  const low = p.toLowerCase().replace(/[^a-z0-9]/g, "");
  return low || "jili";
}

function HotSection({ icon, title, games }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; games: GameInfo[] }) {
  return (
    <div className="col-12 p-0 py-1">
      <div className="d-flex items-center gap-2 pb-1 px-1">
        <img src={icon} alt="" className="mt-1" style={{ height: "2rem" }} />
        <h4 className="text-nowrap m-0 font-bold" style={{ color: "#eda394", fontSize: "1.3rem", fontWeight: 700 }}>
          {title}
        </h4>
      </div>
      <div className="d-flex flex-wrap">
        {games.map((g, i) => (
          <div key={`${g.gameID}-${i}`} className="col-3 px-1 my-2 rise-in">
            <div className="pb-1">
              <img
                src={imageLinkGenerate(g)}
                alt={g.gameName ?? g.name}
                loading="lazy"
                className="pl-1 pt-1 pr-1 w-100"
                style={{ width: "100%", borderRadius: "10px", background: "#101830" }}
              />
              <div className="text-[11px] text-white truncate mt-0.5 px-1">{g.gameName ?? g.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const loggedIn = !!useAuth().user;
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<NavId>("hot");
  const [hotGames, setHotGames] = useState<{ slotGames: GameInfo[]; fishingGames: GameInfo[]; arcadeGames: GameInfo[] }>({ slotGames: [], fishingGames: [], arcadeGames: [] });
  const [slotGames, setSlotGames] = useState<GameInfo[]>([]);
  const [allGames, setAllGames] = useState<GameInfo[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      try {
        const [live, slots, all, infos] = await Promise.all([
          getHotGames(),
          getGames({ provider: "Pragmatic" }),
          getGames({}),
          getWebsiteInfos().catch(() => null),
        ]);
        setHotGames({
          slotGames: live?.data?.slotGames ?? [],
          fishingGames: live?.data?.fishingGames ?? [],
          arcadeGames: live?.data?.arcadeGames ?? [],
        });
        const s = (slots?.data ?? []) as GameInfo[];
        setSlotGames(s.filter((g) => !g.is_close && String(g.gameTypeID) === "vs"));
        setAllGames((all?.data ?? []) as GameInfo[]);
        const b = infos?.data?.[0]?.home_banners;
        if (Array.isArray(b) && b.length) setBanners(b);
      } catch (e) {
        toast.error("ဂိမ်းစာရင်း ရယူရာ မအောင်မြင်ပါ");
      }
    })();
  }, []);

  // Original banner carousel: rotate through home_banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners]);

  const buffaloGames = useMemo(
    () =>
      allGames.filter(
        (g) => !g.is_close && /buffalo|charge buffalo/i.test(g.gameName ?? g.name ?? "")
      ),
    [allGames]
  );
  const fishGames = useMemo(() => allGames.filter((g) => !g.is_close && String(g.gameTypeID) === "fish"), [allGames]);
  const arcadeGames = useMemo(() => allGames.filter((g) => !g.is_close && String(g.gameTypeID) === "arcade"), [allGames]);
  const cardGames = useMemo(
    () => allGames.filter((g) => !g.is_close && ["bj", "sc"].includes(String(g.gameTypeID).toLowerCase())),
    [allGames]
  );

  return (
    <AppShell title="Buffalo688">
      {/* banner carousel — original website-infos home_banners */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden gold-border relative rise-in" style={{ background: "#101830" }}>
        {banners.length ? (
          <img src={banners[bannerIdx]} alt="Buffalo688" className="w-full aspect-[21/9] object-cover" />
        ) : (
          <div className="w-full aspect-[21/9] flex items-center justify-center gold-grad">
            <span className="font-display font-extrabold text-[22px] text-[#1a1205]">BUFFALO688</span>
          </div>
        )}
        {banners.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
        <Link href="/register?code=SPD5Y8" className={`absolute bottom-3 right-3 press px-3 py-1.5 rounded-full gold-grad text-[12px] font-bold text-[#1a1205] ${loggedIn ? "hidden" : ""}`}>
          စာရင်းသွင်းရန်
        </Link>
      </div>

      {/* category tabs — original sideNav order */}
      <div className="mx-4 mt-4 grid grid-cols-6 gap-1.5">
        {NAV_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`press flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors ${
              tab === t.id ? "gold-grad border-transparent" : "border-[#22305a] bg-[#101830]"
            }`}
          >
            {t.img ? (
              <img src={t.img} alt={t.label} className="my-auto" style={{ width: "2rem" }} />
            ) : (
              <t.icon size={16} className={tab === t.id ? "text-[#1a1205]" : "text-[#e3b24a]"} />
            )}
            <span className={`text-[10px] font-medium truncate ${tab === t.id ? "text-[#1a1205] font-semibold" : "text-[#c6cfde]"}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* provider strips under tabs */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {SLOT_NAV.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/game/${p.id}`)}
            className="press rounded-xl overflow-hidden border border-[#22305a] bg-[#101830]"
          >
            <img src={p.img} alt={p.label} className="w-full h-auto" style={{ borderRadius: "0.8rem" }} />
          </button>
        ))}
        {FISH_NAV.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/game/${p.id}`)}
            className="press rounded-xl overflow-hidden border border-[#22305a] bg-[#101830]"
          >
            <img src={p.img} alt={p.label} className="w-full h-auto" style={{ borderRadius: "0.8rem" }} />
          </button>
        ))}
        {OTHER_ROOM_TILES.map((r) => (
          <button
            key={r.id}
            onClick={() => navigate(r.route)}
            className="press rounded-xl overflow-hidden border border-[#22305a] bg-[#101830]"
          >
            <img src={r.img} alt={r.label} className="w-full h-auto" style={{ borderRadius: "0.8rem" }} />
          </button>
        ))}
      </div>

      <div className="pb-24">
        {tab === "hot" && (
          <>
            <HotSection
              icon={`${BF_CDN}/buffalo_hot_games.webp`}
              title="နာမည်ကြီး ဂိမ်းများ"
              games={hotGames.slotGames}
            />
            <HotSection
              icon={`${BF_CDN}/smt223_hot_fishing.png`}
              title="နာမည်ကြီး ငါးပစ် ဂိမ်းများ"
              games={hotGames.fishingGames}
            />
            <HotSection
              icon={`${BF_CDN}/smt223_hot_arcade.png`}
              title="နာမည်ကြီး အာကိတ် ဂိမ်းများ"
              games={hotGames.arcadeGames}
            />
          </>
        )}

        {tab === "buffalo" && (
          <>
            <div className="flex flex-wrap px-1 pt-2">
              {ROOM_TILES.map((r) => (
                <img
                  key={r.id}
                  src={r.img}
                  alt={r.label}
                  loading="lazy"
                  onClick={() => navigate(`/rooms/buffalo${r.target === "new" ? "-new" : ""}`)}
                  className="my-2 px-1 press"
                  style={{ cursor: "pointer", width: "23.5%", height: "auto", borderRadius: "0.8rem", boxSizing: "border-box" }}
                />
              ))}
            </div>
            <div className="flex flex-wrap px-1">
              {OTHER_ROOM_TILES.slice(0, 3).map((r) => (
                <img
                  key={r.id}
                  src={r.img}
                  alt={r.label}
                  loading="lazy"
                  onClick={() => navigate(r.route)}
                  className="my-2 px-1 press"
                  style={{ cursor: "pointer", width: "23.5%", height: "auto", borderRadius: "0.8rem", boxSizing: "border-box" }}
                />
              ))}
              <img
                src={`${BF_CDN}/bufalo688_skm.webp`}
                alt="ရှန််ကိုးမီး"
                loading="lazy"
                onClick={() => navigate("/rooms/skm")}
                className="my-2 px-1 press"
                style={{ cursor: "pointer", width: "23.5%", height: "auto", borderRadius: "0.8rem", boxSizing: "border-box" }}
              />
            </div>
            <HotSection icon={`${BF_CDN}/smt223_hot_slot.png`} title="စလော့ ဂိမ်းများ" games={slotGames} />
            <HotSection icon={`${BF_CDN}/smt223_hot_fishing.png`} title="ငါးပစ် ဂိမ်းများ" games={fishGames} />
            <HotSection icon={`${BF_CDN}/smt223_hot_arcade.png`} title="အာကိတ် ဂိမ်းများ" games={arcadeGames} />
          </>
        )}

        {tab === "card" && (
          <>
            <div className="flex flex-wrap px-1 pt-2">
              {["/rooms/skm", "/rooms/bugyee", "/rooms/forest", "/rooms/galangalu"].map((route, i) => {
                const imgs = [
                  `${BF_CDN}/smt223_skm.webp`,
                  `${BF_CDN}/smt223_bgy.webp`,
                  `${BF_CDN}/smt223_forest.webp`,
                  `${BF_CDN}/smt223_galone.webp`,
                ];
                const labels = ["ရှန််ကိုးမီး", "ဘီကင်", "ကျွဲနီလေးခန်း", "ဂလုံး"];
                return (
                  <img
                    key={route}
                    src={imgs[i]}
                    alt={labels[i]}
                    loading="lazy"
                    onClick={() => navigate(route)}
                    className="my-2 px-0 mx-0 press"
                    style={{ cursor: "pointer", width: "24%", height: "auto", borderRadius: "0.8rem" }}
                  />
                );
              })}
              <img
                src={`${GT}/pp-lc.webp`}
                alt="PP Live"
                loading="lazy"
                onClick={() => navigate("/game/pp-live")}
                className="px-1 py-1 press"
                style={{ cursor: "pointer", height: "auto", borderRadius: "0.8rem" }}
              />
            </div>
            <HotSection icon={`${BF_CDN}/smt223_hot_slot.png`} title="စလော့ ဂိမ်းများ" games={slotGames} />
            <HotSection icon={`${BF_CDN}/smt223_hot_fishing.png`} title="ငါးပစ် ဂိမ်းများ" games={fishGames} />
            <HotSection icon={`${BF_CDN}/smt223_hot_arcade.png`} title="အာကိတ် ဂိမ်းများ" games={arcadeGames} />
          </>
        )}

        {tab === "fishing" && (
          <div className="d-flex flex-wrap px-1 pt-2">
            {FISH_NAV.map((p) => (
              <img
                key={p.id}
                src={p.img}
                alt={p.label}
                loading="lazy"
                onClick={() => navigate(`/game/${p.id}`)}
                className="px-1"
                style={{ cursor: "pointer", height: "auto", borderRadius: "0.8rem" }}
              />
            ))}
            {fishGames.map((g, i) => (
              <div key={`${g.gameID}-${i}`} className="col-3 px-1 my-2 rise-in">
                <img
                  src={imageLinkGenerate(g)}
                  alt={g.gameName ?? g.name}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", borderRadius: "10px" }}
                />
                <div className="text-[11px] text-white truncate mt-0.5 px-1">{g.gameName ?? g.name}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "arcade" && (
          <div className="flex flex-wrap px-1 pt-2">
            {arcadeGames.map((g, i) => (
              <div key={`${g.gameID}-${i}`} className="rise-in my-2 px-1" style={{ width: "23.5%", boxSizing: "border-box" }}>
                <Link href={`/game/${gameRouteKey(g.provider)}/${encodeURIComponent(g.gameID)}`}>
                  <img
                    src={imageLinkGenerate(g)}
                    alt={g.gameName ?? g.name}
                    loading="lazy"
                    className="w-100 press"
                    style={{ cursor: "pointer", height: "auto", borderRadius: "0.8rem" }}
                  />
                  <div className="text-[11px] text-white truncate mt-0.5 px-1">{g.gameName ?? g.name}</div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {tab === "slot" && (
          <>
            <div className="d-flex flex-wrap px-1 pt-2">
              {SLOT_NAV.map((p) => (
                <img
                  key={p.id}
                  src={p.img}
                  alt={p.label}
                  loading="lazy"
                  onClick={() => navigate(`/game/${p.id}`)}
                  className="px-1 py-1 press"
                  style={{ cursor: "pointer", height: "auto", borderRadius: "0.8rem" }}
                />
              ))}
            </div>
            <HotSection icon={`${BF_CDN}/smt223_hot_slot.png`} title="စလော့ ဂိမ်းများ" games={slotGames} />
          </>
        )}
      </div>

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
