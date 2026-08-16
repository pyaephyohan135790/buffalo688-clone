/**
 * Buffalo688 rebuild — shared mobile shell layout.
 * Ground truth from original site DOM audit (2026-08-15):
 * - Header: bg #FEE6E6 light pink, logo left, coin img + bold balance + "Ks" right.
 * - Footer (.footer.mt-3.footer-sm): bg #FEE6E6, 5 items:
 *   ပင်မ / ငွေထုတ် / CENTER buffalo688.webp (buffalo game button) / ငွေလွှဲ / ပရိုဖင်
 *   Inactive caption #8C5656, active #FF4F4B, icons 26px, center logo 4.5rem.
 * - Notice bar: smt223_notice_icon + "Buffalo688 မှ လှိုက်လှဲစွာကြိုဆိုပါတယ်။" color #525F7F.
 * - Body bg #FCF6F6.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ASSETS } from "@/lib/assets";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const TABS = [
  { path: "/home", label: "ပင်မ", img: ASSETS.navLocal.home, imgActive: ASSETS.navLocal.homeActive },
  { path: "/withdraw", label: "ငွေထုတ်", img: ASSETS.navLocal.withdraw, imgActive: ASSETS.navLocal.withdrawActive },
  { path: "/buffalo", label: "buffalo", img: null, center: true },
  { path: "/deposit", label: "ငွေလွှဲ", img: ASSETS.navLocal.deposit, imgActive: ASSETS.navLocal.depositActive },
  { path: "/profile", label: "ပရိုဖင်", img: ASSETS.navLocal.profile, imgActive: ASSETS.navLocal.profileActive },
];

export default function SiteLayout({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  const [location] = useLocation();
  const { user, refreshBalance } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const balance = Number(user?.balance ?? 0);

  useEffect(() => {
    document.documentElement.classList.toggle("bf-dark", dark);
    return () => {
      if (!dark) document.documentElement.classList.remove("bf-dark");
    };
  }, [dark]);

  return (
    <div className={dark ? "bf-shell bf-shell-dark" : "bf-shell"}>
      {/* Sky background art */}
      <img
        src={ASSETS.background}
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ maxHeight: "100dvh" }}
      />

      {/* Header — original: bg #FEE6E6 pink */}
      <header
        className="bf-header sticky top-0 z-40 flex items-center justify-between px-2 py-1.5"
        style={dark ? { background: "rgba(13,17,33,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,169,75,0.18)" } : { background: "#FEE6E6" }}
      >
        <Link href="/home" aria-label="Home" className="flex shrink-0 items-center">
          <img src={ASSETS.logoText} alt="Buffalo688" className="h-[2.3rem] w-auto object-contain" />
        </Link>
        {user ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 pr-2" style={{ borderRight: "1px solid #cfc4c4" }}>
              <img src={ASSETS.coin} alt="" className="h-6 w-6 object-contain" />
              <span className={dark ? "text-xs font-bold text-white" : "text-xs font-bold text-[#333]"}>
                <b className={dark ? "text-[#f2d58a]" : ""}>{formatMoney(balance)}</b> <span className={dark ? "font-normal text-[#9aa5c7]" : "font-normal text-gray-500"}>Ks</span>
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (refreshing) return;
                setRefreshing(true);
                try {
                  await refreshBalance();
                } finally {
                  setRefreshing(false);
                }
              }}
              aria-label="Refresh balance"
              className="flex items-center justify-center rounded-full p-1 active:scale-[0.94] transition-transform"
            >
              <RefreshCw className={`h-4 w-4 text-[#8C5656] ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full px-4 py-1.5 text-[12px] font-extrabold transition-transform active:scale-[0.95]"
            style={dark ? { background: "linear-gradient(110deg, #f2d58a 0%, #d4a94b 100%)", color: "#0d1121" } : undefined}
          >
            ဝင်ရောက်မည်
          </Link>
        )}
      </header>

      {/* Notice bar — original: icon + text, color #525F7F */}
      <div
        className="relative z-10 mx-2 my-1 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]"
        style={dark ? { background: "rgba(212,169,75,0.08)", color: "#c3cbe7", border: "1px solid rgba(212,169,75,0.22)" } : { background: "#FEE6E6", color: "#525F7F", border: "1px solid #f3d9d9" }}
      >
        <img src={ASSETS.navLocal.noticeIcon} alt="" className="h-4 w-4 shrink-0" />
        <span className="truncate">Buffalo688 မှ လှိုက်လှဲစွာကြိုဆိုပါတယ်။</span>
      </div>

      {/* Page content — original wraps content in a rounded soft-pink card over the sky bg */}
      <main
        className="relative z-10 mx-auto w-full max-w-[430px]"
        style={{ paddingBottom: "7rem" }}
      >
        {children}
      </main>

      {/* Bottom nav — original order: home / withdraw / buffalo / deposit / profile */}
      <nav
        className="bf-tabbar fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2"
        style={dark ? { background: "rgba(13,17,33,0.94)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(212,169,75,0.18)", paddingBottom: "env(safe-area-inset-bottom)" } : { background: "#FEE6E6", borderTop: "1px solid #f3d9d9", paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-1 pb-1 pt-0.5">
          {TABS.map((t) =>
            t.center ? (
              <Link
                key="buffalo"
                href={t.path}
                className="flex flex-col items-center"
                aria-label="Buffalo"
              >
                <img src={ASSETS.logo} alt="Buffalo688" className="h-[4.5rem] w-auto object-contain drop-shadow-md" style={{ marginTop: "-1.9rem" }} />
              </Link>
            ) : (
              <Link
                key={t.path}
                href={t.path}
                className={`flex w-1/5 flex-col items-center justify-center gap-0.5 py-1 ${
                  location.startsWith(t.path) ? "active" : ""
                }`}
                aria-label={t.label}
              >
                <img
                  src={location.startsWith(t.path) ? t.imgActive! : t.img!}
                  alt=""
                  className="h-[26px] w-[26px] object-contain"
                />
                <span className="text-[11px] leading-tight font-medium">{t.label}</span>
              </Link>
            )
          )}
        </div>
      </nav>
    </div>
  );
}
