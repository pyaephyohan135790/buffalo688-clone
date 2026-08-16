/* ============================================================
   Profile — Midnight Vault
   ပရိုဖိုင် (original /setting): profile card + quick access + setting nav.
   Password change: old/new/confirm -> PATCH /users/{id} (api.changePassword).
   ============================================================ */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  BadgeCheck,
  ChevronRight,
  CreditCard,
  Globe2,
  KeyRound,
  Languages,
  Loader2,
  LogOut,
  LockKeyhole,
  PhoneCall,
  Wallet,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { getAgentContact } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/utils";

const LANGS = [
  { key: "my", label: "မြန်မာ", flag: "🇲🇲" },
  { key: "en", label: "English", flag: "🇬🇧" },
  { key: "cn", label: "တရုပ်", flag: "🇨🇳" },
  { key: "th", label: "ထိုင်း", flag: "🇹🇭" },
];

function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 8) return "******";
  return "*".repeat(phone.length - 5) + phone.slice(-5);
}

const menuCls = "press flex w-full items-center gap-3 px-4 py-3.5 text-[14px] font-semibold text-[#e9eef8] hover:bg-[#0d1424] transition-colors";

export default function Profile() {
  const { user, logout, refreshBalance } = useAuth();
  const [lang, setLang] = useState("my");
  const [langOpen, setLangOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ old: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [agent, setAgent] = useState<{ viber?: string; telegram?: string } | null>(null);

  useEffect(() => {
    getAgentContact()
      .then((res) => {
        const d = res?.data;
        if (d) {
          setAgent({
            viber: d.viber_number ? `+${d.viber_number}` : undefined,
            telegram: d.telegram_username ? `https://t.me/${d.telegram_username.replace(/^@/, "")}` : undefined,
          });
        }
      })
      .catch(() => undefined);
    refreshBalance();
  }, [refreshBalance]);

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next.length < 6) return toast.error("စကားဝှက် အသစ် အနည်းဆုံး ၆ လုံး ရေးပါ");
    if (pwForm.next !== pwForm.confirm) return toast.error("စကားဝှက် အတည်ပြု မတူပါ");
    setPwLoading(true);
    try {
      const api = await import("@/lib/api");
      const res = (await api.changePassword(pwForm.old, pwForm.next, user?.id ?? 0)) as { success?: string; error?: string; message?: string };
      if (res?.error || !res?.success) {
        toast.error(res?.error || res?.message || "စကားဝှက် ပြောင်းမရပါ — ယခင်စကားဝှက် မှန်ကြောင်း စစ်ပါ");
        return;
      }
      toast.success("စကားဝှက် ပြောင်းပြီးပါပြီ");
      setPwOpen(false);
      setPwForm({ old: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "ပြောင်းမရပါ — ယခင်စကားဝှက် မှန်ကြောင်း စစ်ပါ");
    } finally {
      setPwLoading(false);
    }
  }

  const balance = Number(user?.balance ?? user?.amount ?? 0);
  const withdrawAmt = Number((user as any)?.withdraw_amount ?? 0);
  const totalBet = Number((user as any)?.total_bet_amount ?? 0);
  const turnOver = Number((user as any)?.turn_over_amount ?? 0);

  return (
    <AppShell title="ပရိုဖိုင်">
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* ---------- Profile card ---------- */}
        <div className="navy-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="h-13 w-13 shrink-0 rounded-full gold-grad flex items-center justify-center text-[18px] font-black text-[#1a1205]">
              {(user?.username ?? "B").slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-[#e9eef8]">{user?.username ?? "—"}</span>
                <BadgeCheck size={13} className="text-[#e3b24a]" />
              </div>
              <div className="mt-0.5 text-[11px] text-[#7c87a6] font-num">ဖုန်းနံပါတ် {maskPhone(user?.phone)}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#0d1424] border border-[#22305a] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b8]">ငွေပမာဏ</div>
              <div className="mt-0.5 text-[15px] font-num font-extrabold text-[#e3b24a]">{formatMoney(balance)} <span className="text-[10px] text-[#7c87a6]">MMK</span></div>
            </div>
            <div className="rounded-xl bg-[#0d1424] border border-[#22305a] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b8]">ငွေထုတ်</div>
              <div className="mt-0.5 text-[15px] font-num font-extrabold text-[#4ade80]">{formatMoney(withdrawAmt)} <span className="text-[10px] text-[#7c87a6]">MMK</span></div>
            </div>
          </div>
        </div>

        {/* ---------- Bet history summary (splay များ / အကိုးစုစုပေါင်း) ---------- */}
        <div className="navy-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-[#e3b24a]" />
            <h3 className="text-[14px] font-bold text-[#e9eef8]">Betslip / ကစားမှတ်တမ်း</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#0d1424] border border-[#22305a] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b8]">စုစုပေါင်း ကစားငွေ</div>
              <div className="mt-0.5 text-[15px] font-num font-extrabold text-[#f87171]">{formatMoney(totalBet)} <span className="text-[10px] text-[#7c87a6]">MMK</span></div>
            </div>
            <div className="rounded-xl bg-[#0d1424] border border-[#22305a] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b8]">စုစုပေါင်း လှည့်လည်ငွေ</div>
              <div className="mt-0.5 text-[15px] font-num font-extrabold text-[#60a5fa]">{formatMoney(turnOver)} <span className="text-[10px] text-[#7c87a6]">MMK</span></div>
            </div>
          </div>
          <Link href="/bet-history" className="press mt-3 flex items-center justify-between rounded-xl bg-[#0d1424] border border-[#22305a] px-3.5 py-2.5">
            <span className="text-[12px] font-semibold text-[#c3cbe7]">ကစားမှတ်တမ်း (Betslip) ကြည့်ရန်</span>
            <ChevronRight size={14} className="text-[#e3b24a]" />
          </Link>
          <p className="mt-3 text-[11px] leading-relaxed text-[#7c87a6]">
            မူရင််း site မှာပြတဲ့ ဘောက်ချာမှတ်တမ််း (ဂဏန််းပေါက်/ဘောလုံးတိုက်) ကို ထောက်ပံ့ထားပါတယ် — ယနေ့ ထိုးထားတဲ့ ဘောက်ချာရှိမှ ပြပါတယ်။
          </p>
        </div>

        {/* ---------- Quick access ---------- */}
        <div className="navy-card rounded-2xl px-2 py-3 flex items-center justify-between">
          {[
            { label: "ငွေသွင်း", icon: CreditCard, href: "/deposit" },
            { label: "ငွေထုတ်", icon: Wallet, href: "/withdraw" },
            { label: "ပရိုမိုးရှင်း", icon: BadgeCheck, href: "/home" },
            { label: "ငွေစာရင််းများ", icon: Wallet, href: "/transaction" },
            { label: "ကစားမှတ်တမ််း", icon: BadgeCheck, href: "/bet-history" },
          ].map((q) => (
            <Link key={q.label} href={q.href} className="press flex w-1/4 flex-col items-center gap-1 py-1 active:scale-95 transition-transform">
              <span className="h-9 w-9 rounded-full bg-[#0d1424] gold-border flex items-center justify-center">
                <q.icon size={15} className="text-[#e3b24a]" />
              </span>
              <span className="text-[10px] font-bold text-[#c3cbe7]">{q.label}</span>
            </Link>
          ))}
        </div>

        {/* ---------- Settings nav ---------- */}
        <div className="navy-card rounded-2xl overflow-hidden">
          <button type="button" className={menuCls}>
            <CreditCard size={15} className="text-[#e3b24a]" />
            <span className="flex-1 text-left">အမည် - {user?.username ?? ""}</span>
            <ChevronRight size={14} className="text-[#5b6890]" />
          </button>
          <div className="mx-4 h-px bg-[#22305a]" />
          <button type="button" onClick={() => setPwOpen(true)} className={menuCls}>
            <KeyRound size={15} className="text-[#e3b24a]" />
            <span className="flex-1 text-left">စကားဝှက်ပြောင်းရန်</span>
            <ChevronRight size={14} className="text-[#5b6890]" />
          </button>
          <div className="mx-4 h-px bg-[#22305a]" />
          <Link href="/withdraw" className={menuCls}>
            <CreditCard size={15} className="text-[#e3b24a]" />
            <span className="flex-1 text-left">ဘဏ် အကောင့်</span>
            <ChevronRight size={14} className="text-[#5b6890]" />
          </Link>
          <div className="mx-4 h-px bg-[#22305a]" />
          <div className="relative">
            <button type="button" onClick={() => setLangOpen((v) => !v)} className={`${menuCls} w-full`}>
              <Globe2 size={15} className="text-[#e3b24a]" />
              <span className="flex-1 text-left">ဘာသာစကားပြောင်းရန်</span>
              <Languages size={13} className="text-[#5b6890]" />
            </button>
            {langOpen && (
              <div className="absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden rounded-xl bg-[#101830] border border-[#22305a] shadow-2xl">
                {LANGS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => {
                      setLang(l.key);
                      setLangOpen(false);
                      toast.success(`ဘာသာစကား ${l.label} ရွေးပြီးပါပြီ`);
                    }}
                    className={`press flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                      lang === l.key ? "bg-[#16203d] text-[#e3b24a]" : "text-[#c3cbe7] hover:bg-[#0d1424]"
                    }`}
                  >
                    <span>{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mx-4 h-px bg-[#22305a]" />
          <button
            type="button"
            className="press flex w-full items-center gap-3 px-4 py-3.5 text-[14px] font-semibold text-[#f87171]"
            onClick={() => {
              logout();
              toast.success("ထွက်ပြီးပါပြီ");
              window.location.href = "/";
            }}
          >
            <LogOut size={15} />
            <span className="flex-1 text-left">ထွက်ရန်</span>
            <ChevronRight size={14} className="text-[#5b6890]" />
          </button>
        </div>

        {/* ---------- Support ---------- */}
        <div className="flex items-center justify-center gap-4 py-2">
          <a href="tel:09756477723" aria-label="Support call" className="press h-11 w-11 rounded-full bg-[#101830] gold-border flex items-center justify-center">
            <PhoneCall size={17} className="text-[#e3b24a]" />
          </a>
          {agent?.telegram && (
            <a href={agent.telegram} target="_blank" rel="noreferrer" aria-label="Telegram" className="press h-11 w-11 rounded-full bg-[#101830] border border-[#22305a] flex items-center justify-center">
              <span className="text-[15px]">✈️</span>
            </a>
          )}
          {agent?.viber && (
            <a href={`viber://chat?number=${encodeURIComponent(agent.viber)}`} aria-label="Viber" className="press h-11 w-11 rounded-full bg-[#101830] border border-[#22305a] flex items-center justify-center">
              <span className="text-[15px]">📞</span>
            </a>
          )}
        </div>
      </div>

      {/* ---------- Password modal ---------- */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5" onClick={() => setPwOpen(false)}>
          <div className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-[#101830] border border-[#22305a] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-[#e3b24a]" />
                <h3 className="text-[15px] font-bold text-[#e9eef8]">စကားဝှက်ပြောင်းရန်</h3>
              </div>
              <button type="button" onClick={() => setPwOpen(false)} className="press text-[#7c87a6]">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={changePw} className="space-y-3 px-5 py-4">
              <input className={inputCls} type="password" value={pwForm.old} onChange={(e) => setPwForm((f) => ({ ...f, old: e.target.value }))} placeholder="စကားဝှက်အဟောင်း" />
              <input className={inputCls} type="password" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} placeholder="စကားဝှက်အသစ်" />
              <input className={inputCls} type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="အတည်ပြု" />
              <button
                type="submit"
                className="press w-full h-11 rounded-xl gold-grad text-[14px] font-bold text-[#1a1205] flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={pwLoading}
              >
                {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole size={15} />}
                {pwLoading ? "ဆောင်ရွက်နေပါသည်..." : "အပ်ဒိတ်မည်"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const inputCls = "w-full h-12 rounded-xl bg-[#0d1424] border border-[#22305a] px-4 text-[14px] text-[#e9eef8] placeholder:text-[#5b6890] focus:outline-none focus:border-[#c9962e] transition-colors";
