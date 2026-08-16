/* ============================================================
   AppShell — Midnight Vault mobile app frame
   Header (logo + balance hero) + fixed 5-tab bottom nav.
   Desktop wraps everything in a 420px centered phone frame.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { getBalance } from "@/lib/api";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

const LOGO = "/assets/buffalo-logo_89f5714c.png";

function formatKs(n: number | string | undefined) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("en-US");
}

export function BalanceHero() {
  const [balance, setBalance] = useState<string>("0");
  const [visible, setVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);

  const fetch = async (soft = false) => {
    if (!soft && busy.current) return;
    busy.current = true;
    try {
      if (soft) setRefreshing(true);
      const b = await getBalance();
      setBalance(String(b?.data?.amount ?? 0));
    } finally {
      busy.current = false;
      if (soft) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch(true);
    const t = setInterval(() => fetch(true), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-4 mt-3 rounded-2xl bg-gradient-to-b from-[#16203d] to-[#101830] gold-border glow-gold overflow-hidden">
      <div className="h-1 gold-grad" />
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[11px] text-[#7c87a6] tracking-wide">သင့်လက်ကျန်ငွေ</div>
          <div className="font-display font-700 font-bold text-[22px] leading-tight text-[#e9eef8]">
            {visible ? balance : "•••••"} <span className="text-[13px] text-[#7c87a6] font-medium">Ks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="refresh balance"
            onClick={() => fetch()}
            className="press p-2 rounded-full bg-[#22305a]/60 border border-[#22305a] text-[#e3b24a]"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            aria-label="toggle balance visibility"
            onClick={() => setVisible((v) => !v)}
            className="press p-2 rounded-full bg-[#22305a]/60 border border-[#22305a] text-[#e3b24a]"
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-[#060a14]/95 backdrop-blur-md border-b border-[#22305a]/60">
      <div className="flex items-center gap-3 px-4 h-14">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img src={LOGO} alt="Buffalo688" className="h-9 w-9 rounded-xl object-cover ring-1 ring-[#c9962e]/60" />
          <span className="font-display font-extrabold text-[17px] tracking-tight leading-none">
            <span className="gold-text">BUFFALO</span>
            <span className="text-[#e9eef8]">688</span>
          </span>
        </Link>
        {title && (
          <div className="ml-auto text-[15px] font-semibold text-[#e9eef8]">{title}</div>
        )}
        {!title && <div className="ml-auto" />}
      </div>
    </header>
  );
}

const TABS = [
  { href: "/", label: "ပင်မ", path: "home" },
  { href: "/withdraw", label: "ငွေထုတ်", path: "withdraw" },
  { href: "/deposit", label: "", path: "deposit" },
  { href: "/profile", label: "ပရိုဖိုင်", path: "profile" },
];

export default function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const navPath = location === "/" ? "home" : location.replace(/^\//, "").split("/")[0];

  return (
    <div className="min-h-screen bg-[#040710] flex justify-center">
      <div className="w-full max-w-[420px] min-h-screen bg-[#060a14] relative flex flex-col">
        <Header title={title} />
        <BalanceHero />
        <main className="flex-1 pb-[92px]">{children}</main>

        {/* fixed bottom nav — exactly one uniform row of 4 equal cells */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-50">
          <div className="mx-2 mb-2 rounded-2xl bg-[#0d1424] border border-[#22305a] shadow-[0_-8px_40px_rgba(0,0,0,0.55)] grid grid-cols-4 grid-rows-1 items-stretch">
            <Tab t={TABS[0]} active={navPath === TABS[0].path} />
            <Tab t={TABS[1]} active={navPath === TABS[1].path} />
            <DepositCenterTab active={navPath === "deposit"} />
            <Tab t={TABS[3]} active={navPath === TABS[3].path} />
          </div>
        </nav>
      </div>
    </div>
  );
}

function Tab({ t, active }: { t: { href: string; label: string; path: string }; active: boolean }) {
  return (
    <Link href={t.href} className="flex flex-col items-center justify-center gap-1 py-2 press min-h-0">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${active ? "bg-[#e3b24a] shadow-[0_0_8px_#e3b24a]" : "bg-transparent"}`}
      />
      <span className={`text-[12px] font-medium whitespace-nowrap ${active ? "text-[#e3b24a]" : "text-[#7c87a6]"}`}>{t.label}</span>
    </Link>
  );
}

function DepositCenterTab({ active }: { active: boolean }) {
  return (
    <Link href="/deposit" className="flex flex-col items-center justify-center gap-1 py-2 press min-h-0">
      <span className="-mt-3 h-[42px] w-[42px] rounded-full gold-grad flex items-center justify-center shadow-[0_0_24px_rgba(201,150,46,0.45)] ring-4 ring-[#0d1424]">
        <img src={LOGO} alt="" className="h-6 w-6 rounded-full object-cover" />
      </span>
      <span className={`text-[12px] font-medium whitespace-nowrap ${active ? "text-[#e3b24a]" : "text-[#7c87a6]"}`}>ငွေသွင်း</span>
    </Link>
  );
}
