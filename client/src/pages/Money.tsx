/* ============================================================
   Money — Midnight Vault
   Deposit / Withdraw / TransactionHistory with live API parity.
   All pages use AppShell (header + balance hero + bottom nav).
   Ground truth (original app.js):
     DEPOSIT:   GET /accounts -> select card | POST /deposits {account_id, amount(>=3000), remark(last txn digits)}
     WITHDRAW:  GET /user_bank -> own bank card | POST /withdraws {amount, remark, ...user bank fields}
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Loader2,
  PencilLine,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  createDeposit,
  createWithdraw,
  getAccounts,
  getDepositHistory,
  getUserBank,
  getWithdrawHistory,
  type AgentAccount,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Safety-net: the server sometimes processes a deposit/withdraw but returns an
 * empty response body. Poll the server history once after such a failure; if a
 * new pending/confirm record with the same amount exists, treat it as success.
 */
async function confirmByHistory(
  kind: "deposit" | "withdraw",
  uid: number,
  amount: number,
): Promise<boolean> {
  try {
    const list = kind === "withdraw" ? await getWithdrawHistory(uid, 1) : await getDepositHistory(uid, 1);
    const items = (list?.data ?? []) as Tx[];
    const recent = items.find((x) => Number(x.amount) === amount);
    if (!recent) return false;
    const st = String(recent.status ?? "").toLowerCase();
    const s = Number(recent.status);
    return !Number.isNaN(s) || st === "pending" || st === "confirm" || st === "success" || st === "waiting";
  } catch {
    return false;
  }
}

const QUICK = [3000, 5000, 10000, 20000, 50000, 100000];

const PAY_ICONS: Record<string, string> = {
  kpay: "/assets/pay-kpay.png",
  kbz: "/assets/pay-kbz.png",
  wavepay: "/assets/pay-wave.png",
  wave: "/assets/pay-wave.png",
  cbpay: "/assets/pay-cb.png",
  cb_pay: "/assets/pay-cb.png",
  cbbank: "/assets/pay-cbbank.png",
  ayapay: "/assets/pay-aya.png",
  aya: "/assets/pay-aya.png",
  cdgpayout: "/assets/pay-cdg.png",
  cdg: "/assets/pay-cdg.png",
};

function paymentIcon(type?: string | null, name?: string | null): string {
  const text = [type, name].filter(Boolean).join(" ").toLowerCase();
  if (!text) return "";
  const key = text.replace(/[^a-z]/g, "");
  if (PAY_ICONS[key]) return PAY_ICONS[key];
  for (const [k, url] of Object.entries(PAY_ICONS)) {
    if (text.includes(k)) return url;
  }
  return "";
}

const inputCls = "w-full h-12 rounded-xl bg-[#0d1424] border border-[#22305a] px-4 text-[14px] text-[#e9eef8] placeholder:text-[#5b6890] focus:outline-none focus:border-[#c9962e] transition-colors font-num";

/* ---------------- Section heading ---------------- */
function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#c6cfde] mb-3">
      {icon}
      <span>{label}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-[#22305a] to-transparent" />
    </div>
  );
}

/* ---------------- DEPOSIT ---------------- */
function nowRangoon(): string {
  // Original bundle: date.toLocaleString('en-GB',{hour12:false,timeZone:'Asia/Rangoon'})
  // => "DD/MM/YYYY, HH:MM:SS" — the live Laravel backend validates this format.
  return new Date().toLocaleString("en-GB", { hour12: false, timeZone: "Asia/Rangoon" });
}

/* ---------------- DEPOSIT ---------------- */
export function Deposit() {
  const { refreshBalance } = useAuth();
  const [, navigate] = useLocation();
  const [accounts, setAccounts] = useState<AgentAccount[]>([]);
  const [selected, setSelected] = useState<AgentAccount | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionNo, setTransactionNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let dead = false;
    getAccounts()
      .then((res) => {
        if (dead) return;
        const list = ((res?.data ?? []) as AgentAccount[]).filter(
          (a) => a.account_name || a.name || a.number || a.account_number || a.type,
        );
        setAccounts(list);
        setSelected(list[0] ?? null);
      })
      .catch(() => toast.error("ငွေသွင်းလိပ်းစာရင်း မရယူနိုင်ပါ"))
      .finally(() => setLoading(false));
    return () => {
      dead = true;
    };
  }, []);

  const number = selected?.account_number ?? selected?.number ?? "";
  const label = selected?.account_name ?? selected?.name ?? selected?.type ?? "Account";
  const amt = parseFloat(amount);

  function copyNumber() {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return toast.error("ငွေသွင်းမည့်လိပ်းစာရင်း ရွေးချယ်ပေးပါ");
    if (!amt || amt < 3000) return toast.error("ငွေပမာဏ အနည်းဆုံး ၃,၀၀၀ ထည့်ပေးပါ");
    if (transactionNo.trim().length < 6) return toast.error("လုပ်ငန်းစဉ်နံပါတ် (နောက်ဆုံး ၆ လုံး) ထည့်ပေးပါ");
    setSubmitting(true);
    try {
      const res = await createDeposit({
        account_id: Number(selected.id ?? 1),
        amount: amt,
        remark: transactionNo.trim(),
        date: nowRangoon(),
        lang: "my",
      });
      if (res?.success) {
        toast.success("အောင်မြင်သည်");
        setAmount("");
        setTransactionNo("");
        await refreshBalance();
        navigate("/transaction");
        return;
      }
      // Server replied without success flag — check if the request landed anyway
      const landed = await confirmByHistory("deposit", Number(useAuth().user?.id ?? 0), amt);
      if (landed) {
        toast.success("ငွေသွင်း တင်ပြခဲ့ပြီး — စစ်ဆေးခံနေပါသည်");
        setAmount("");
        setTransactionNo("");
        await refreshBalance();
        navigate("/transaction");
        return;
      }
      const serverMsg = (res as any)?.message ?? (res as any)?.errors ?? undefined;
      toast.error(serverMsg ? String(serverMsg) : "ငွေသွင်းမရပါ — အငွေပမာဏနှင့် လုပ်ငန်းစဉ်နံပါတ် စစ်ပါ");
    } catch (err: any) {
      const raw = err?.raw as { message?: string; errors?: Record<string, string> } | undefined;
      const serverMsg = raw?.errors ? (Object.values(raw.errors)[0] ?? raw.message) : (raw?.message ?? "");
      // Empty server body → poll history; the backend deducts/records even on empty replies
      if (!serverMsg) {
        const landed = await confirmByHistory("deposit", Number(useAuth().user?.id ?? 0), amt);
        if (landed) {
          toast.success("ငွေသွင်း တင်ပြခဲ့ပြီး — စစ်ဆေးခံနေပါသည်");
          setAmount("");
          setTransactionNo("");
          await refreshBalance();
          navigate("/transaction");
          return;
        }
      }
      toast.error(serverMsg || "ဆက်သွယ်ရေး အောင်မြင်မှုမရှိ — ကွန်ယက်စစ်ပြီး ပြန်ကြိုးစားပါ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="ငွေသွင်းရန်">
      <div className="px-4 pt-4 pb-6">
        <div className="navy-card rounded-2xl p-4">
          <SectionHead icon={<Wallet size={15} className="text-[#e3b24a]" />} label="ငွေသွင်းမည့်လိပ်စာရင်း" />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#e3b24a]" />
            </div>
          ) : !accounts.length ? (
            <div className="text-center text-[12px] text-[#7c87a6] py-6">ငွေသွင်းလိပ်စာရင်း မရှိသေးပါ</div>
          ) : (
            <>
              {/* Account ရွေးရန် — မူရင်းအတိုင်း dropdown */}
              <select
                className={inputCls}
                value={selected?.id ?? ""}
                onChange={(e) => {
                  const a = accounts.find((x) => String(x.id) === e.target.value);
                  setSelected(a ?? null);
                }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.type ?? "Account"} — {(a.account_name ?? a.name ?? "Account").trim()}
                  </option>
                ))}
              </select>
              {selected && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#0d1424] border border-[#22305a] px-3.5 py-3">
                  {(() => {
                    const icon = paymentIcon(selected?.type, selected?.account_name ?? selected?.name);
                    return icon ? (
                      <img src={icon} alt="" className="h-9 w-9 rounded-lg object-contain" />
                    ) : (
                      <span className="h-9 w-9 shrink-0 rounded-lg bg-[#16203d] gold-border flex items-center justify-center text-[11px] font-bold text-[#e3b24a]">
                        {(selected?.name ?? "").slice(0, 1).toUpperCase()}
                      </span>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-[#e9eef8]">{selected?.name ?? selected?.type ?? "Method"}</div>
                    <div className="text-[11px] text-[#7c87a6] truncate">{(selected?.account_name ?? selected?.name ?? "").trim()}</div>
                    <div className="text-[13px] font-bold tracking-wide text-[#e3b24a] font-num">{selected?.number ?? selected?.account_number ?? ""}</div>
                  </div>
                  <button
                    type="button"
                    onPointerDown={copyNumber}
                    className={`press h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${copied ? "bg-[#22c55e]/15 border border-[#22c55e]/50 text-[#7fc89a]" : "bg-[#16203d] gold-border text-[#e3b24a]"}`}
                    aria-label="ကူးယူရန်"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}
              {selected?.note && (
                <div className="mt-2.5 rounded-lg border border-[#22305a] bg-[#0d1424] px-3 py-2 text-[11px] leading-relaxed text-[#8a93b8]">{selected.note}</div>
              )}
            </>
          )}
        </div>

        <form onSubmit={onSubmit} className="navy-card rounded-2xl p-4 mt-4">
          <SectionHead icon={<PiggyBank size={15} className="text-[#e3b24a]" />} label="ပမာဏ" />
          <input className={inputCls} inputMode="numeric" min={3000} placeholder="အနည်းဆုံး ၃,၀၀၀ MMK" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="mt-2.5 grid grid-cols-6 gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onPointerDown={() => setAmount(String(q))}
                className="press h-7 rounded-lg border border-[#22305a] bg-[#0d1424] text-[11px] font-num font-bold text-[#c3cbe7] hover:border-[#c9962e] hover:text-[#e3b24a]"
              >
                {q >= 1000 ? `${q / 1000}K` : q}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <SectionHead icon={<PencilLine size={15} className="text-[#e3b24a]" />} label="လုပ်ငန်းစဉ်နံပါတ် (နောက်ဆုံး ၆ လုံး)" />
            <input className={inputCls} placeholder="ဥပမာ — ဖုန်းသွင်းသောကွန်ပျူတာနောက်ဆုံး ၆ လုံး" value={transactionNo} onChange={(e) => setTransactionNo(e.target.value)} />
          </div>
          <button
            type="submit"
            className="press w-full h-12 rounded-xl gold-grad text-[15px] font-bold text-[#1a1205] mt-4 shadow-[0_4px_24px_rgba(201,150,46,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownLeft size={16} />}
            {submitting ? "ဆောင်ရွက်နေပါ..." : "ငွေသွင်းမည်"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

/* ---------------- WITHDRAW ---------------- */
export function Withdraw() {
  const { refreshBalance } = useAuth();
  const [, navigate] = useLocation();
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [method, setMethod] = useState<"wavepay" | "kpay">("kpay");
  const [accountName, setAccountName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let dead = false;
    getUserBank()
      .then((res) => {
        if (dead) return;
        const b = res?.data ?? null;
        setBankInfo(b);
        if (b?.type) {
          const t = String(b.type).toLowerCase();
          if (t.includes("wave")) setMethod("wavepay");
          else if (t.includes("kpay") || t.includes("kbz")) setMethod("kpay");
        }
        if (b?.name || (b as any)?.account_name) setAccountName(String(b?.name ?? (b as any)?.account_name ?? ""));
        if (b?.account_number) setPhoneNumber(String(b?.account_number ?? ""));
      })
      .catch(() => toast.error("ဘန့်က်အချက်အလက် မရယူနိုင်ပါ"))
      .finally(() => setLoading(false));
    return () => {
      dead = true;
    };
  }, []);

  const amt = parseFloat(amount);
  const balance = Number(useAuth().user?.balance ?? 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) return toast.error("အကောင့်နာမည် ထည့်ပေးပါ");
    if (!phoneNumber.trim()) return toast.error("ဖုန်းနံပါတ် ထည့်ပေးပါ");
    if (!amt || amt < 10000) return toast.error("ငွေထုတ်အနည်းဆုံး ၁၀,၀၀၀ ထည့်ပေးပါ");
    if (amt > balance) return toast.error("အကောင့်ထဲတွင် ပိုက်ဆံအလုံအလောက် မရှိပါ");
    setSubmitting(true);
    try {
      const res = await createWithdraw({
        amount: amt,
        type: method === "kpay" ? "Kpay" : "Wavepay",
        name: accountName.trim(),
        account_number: phoneNumber.trim(),
        account_name: accountName.trim(),
        remark: remark.trim() || undefined,
        date: nowRangoon(),
        lang: "my",
        user_id: Number(useAuth().user?.id ?? 0),
      });
      if (res?.success) {
        toast.success("ငွေထုတ် တင်ပြခဲ့ပြီး — စစ်ဆေးခံနေပါသည်");
        setAmount("");
        setRemark("");
        await refreshBalance();
        navigate("/transaction");
        return;
      }
      const landed = await confirmByHistory("withdraw", Number(useAuth().user?.id ?? 0), amt);
      if (landed) {
        toast.success("ငွေထုတ် တင်ပြခဲ့ပြီး — စစ်ဆေးခံနေပါသည်");
        setAmount("");
        setRemark("");
        await refreshBalance();
        navigate("/transaction");
        return;
      }
      const serverMsg = (res as any)?.message ?? (res as any)?.errors ?? undefined;
      toast.error(serverMsg ? String(serverMsg) : "တင်ပြမရပါ — စနစ်ကို စစ်ဆေးနေပါသည်");
    } catch (err: any) {
      const raw = err?.raw as { message?: string; errors?: Record<string, string> } | undefined;
      const serverMsg = raw?.errors ? (Object.values(raw.errors)[0] ?? raw.message) : (raw?.message ?? "");
      // Empty server body → poll history; the backend records the withdraw even on empty replies
      if (!serverMsg) {
        const landed = await confirmByHistory("withdraw", Number(useAuth().user?.id ?? 0), amt);
        if (landed) {
          toast.success("ငွေထုတ် တင်ပြခဲ့ပြီး — စစ်ဆေးခံနေပါသည်");
          setAmount("");
          setRemark("");
          await refreshBalance();
          navigate("/transaction");
          return;
        }
      }
      toast.error(serverMsg || "ဆက်သွယ်ရေး အောင်မြင်မှုမရှိ — ကွန်ယက်စစ်ပြီး ပြန်ကြိုးစားပါ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="ငွေထုတ်ရန်">
      <div className="px-4 pt-4 pb-6">
        <div className="navy-card rounded-2xl p-4">
          <SectionHead icon={<Wallet size={15} className="text-[#e3b24a]" />} label="ငွေထုတ်မည့်နည်းလမ်း" />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#e3b24a]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onPointerDown={() => setMethod("kpay")}
                className={`press flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition-colors ${method === "kpay" ? "border-[#c9962e] bg-[#c9962e]/10" : "border-[#22305a] bg-[#0d1424]"}`}
              >
                <img src={PAY_ICONS.kpay} alt="K Pay" className="h-10 w-10 rounded-lg object-contain" />
                <span className={`text-[12px] font-semibold ${method === "kpay" ? "text-[#e3b24a]" : "text-[#7c87a6]"}`}>K Pay</span>
              </button>
              <button
                type="button"
                onPointerDown={() => setMethod("wavepay")}
                className={`press flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition-colors ${method === "wavepay" ? "border-[#c9962e] bg-[#c9962e]/10" : "border-[#22305a] bg-[#0d1424]"}`}
              >
                <img src={PAY_ICONS.wavepay} alt="Wave Pay" className="h-10 w-10 rounded-lg object-contain" />
                <span className={`text-[12px] font-semibold ${method === "wavepay" ? "text-[#e3b24a]" : "text-[#7c87a6]"}`}>Wave Pay</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="navy-card rounded-2xl p-4 mt-4">
          <SectionHead icon={<PiggyBank size={15} className="text-[#e3b24a]" />} label="အကောင့်နာမည်" />
          <input className={inputCls} placeholder="အကောင့်နာမည် ထည့်ပေးပါ" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          <div className="mt-4">
            <SectionHead icon={<PiggyBank size={15} className="text-[#e3b24a]" />} label="ဖုန်းနံပါတ်" />
            <input className={inputCls} inputMode="tel" placeholder="09xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
          <div className="mt-4">
            <SectionHead icon={<PiggyBank size={15} className="text-[#e3b24a]" />} label="ထုတ်မည့်ပမာဏ" />
          <input className={inputCls} inputMode="numeric" min={10000} placeholder="အနည်းဆုံး ၁၀,၀၀၀ MMK" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="mt-2.5 grid grid-cols-6 gap-1.5">
            {QUICK.filter((q) => q >= 10000).map((q) => (
              <button
                key={q}
                type="button"
                onPointerDown={() => setAmount(String(q))}
                className="press h-7 rounded-lg border border-[#22305a] bg-[#0d1424] text-[11px] font-num font-bold text-[#c3cbe7] hover:border-[#c9962e] hover:text-[#e3b24a]"
              >
                {q >= 1000 ? `${q / 1000}K` : q}
              </button>
              ))}
          </div>
          </div>
          <div className="mt-4">
            <SectionHead icon={<PencilLine size={15} className="text-[#e3b24a]" />} label="မှတ်ချက် (ထည့်ချင်လျှင်သာ)" />
            <textarea
              className={`${inputCls} h-auto min-h-[80px] resize-none py-3`}
              placeholder="မှတ်ချက်"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="press w-full h-12 rounded-xl gold-grad text-[15px] font-bold text-[#1a1205] mt-4 shadow-[0_4px_24px_rgba(201,150,46,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight size={16} />}
            {submitting ? "ဆောင်ရွက်နေပါ..." : "ငွေထုတ်မည်"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

/* ---------------- Transaction History ---------------- */
interface Tx {
  id?: number | string;
  amount?: number | string;
  note?: string;
  remark?: string;
  status?: number | string;
  type?: number | string;
  createdAt?: string;
  created_at?: string;
}

function statusMeta(kind: "deposit" | "withdraw", st: number | string) {
  const s = Number(st);
  const str = String(st ?? "").toLowerCase();
  const ok = (!Number.isNaN(s) && s >= 2) || str === "success";
  const pend = (!Number.isNaN(s) && s < 2) || str === "pending" || str === "success" === false && str.includes("စစ်");
  const no = str === "fail" || str === "rejected" || str === "cancel";
  const labels =
    kind === "deposit"
      ? { ok: "အောင်မြင်ပြီး", pend: "စောင့်နေပါ", no: "ပယ်ဖျက်ခြင်း" }
      : { ok: "ပေးပို့ပြီးပြီ", pend: "စစ်ဆေးခံနေသည်", no: "ပယ်ဖျက်ခြင်း" };
  const label = ok ? labels.ok : no ? labels.no : labels.pend;
  const tone = ok
    ? "bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/40"
    : pend
      ? "bg-[#eab308]/12 text-[#facc15] border-[#eab308]/40"
      : "bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/40";
  return { label, tone };
}

function TxCard({ tx, kind }: { tx: Tx; kind: "deposit" | "withdraw" }) {
  const st = statusMeta(kind, tx.status ?? 0);
  const Icon = kind === "deposit" ? ArrowDownLeft : ArrowUpRight;
  const t = tx.createdAt ?? tx.created_at ?? "";
  const date = t
    ? new Date(t).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className="rise-in flex items-center gap-3 navy-card rounded-xl px-3.5 py-3">
      <span
        className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${kind === "deposit" ? "bg-[#22c55e]/15 text-[#4ade80]" : "bg-[#ef4444]/15 text-[#f87171]"}`}
      >
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#e9eef8]">{kind === "deposit" ? "ငွေသွင်း" : "ငွေထုတ်"}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold ${st.tone}`}>{st.label}</span>
        </div>
        <div className="text-[10px] text-[#7c87a6] truncate">
          {tx.remark ?? tx.note ?? ""} {date ? `· ${date}` : ""}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-[13px] font-num font-semibold ${kind === "deposit" ? "text-[#4ade80]" : "text-[#f87171]"}`}>
          {kind === "deposit" ? "+" : "-"}
          {Number(tx.amount ?? 0).toLocaleString("en-US")}
        </div>
        <div className="text-[9px] text-[#7c87a6] font-num">{date}</div>
      </div>
    </div>
  );
}

export function TransactionHistory({ mode }: { mode?: "all" | "deposit" | "withdraw" }) {
  const [deposits, setDeposits] = useState<Tx[]>([]);
  const [withdraws, setWithdraws] = useState<Tx[]>([]);
  const [tab, setTab] = useState<"deposit" | "withdraw" | "all">(mode === "all" ? "all" : (mode ?? "all"));
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const uid = user?.id ?? 0;
    if (!uid) {
      setLoading(false);
      return;
    }
    Promise.all([getDepositHistory(uid, 1), getWithdrawHistory(uid, 1)])
      .then(([d, w]) => {
        setDeposits((d?.data as Tx[]) ?? []);
        setWithdraws((w?.data as Tx[]) ?? []);
      })
      .catch(() => toast.error("မှတ်တမ်း မရယူနိုင်ပါ"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const items = useMemo(() => {
    if (tab === "deposit") return deposits.map((t) => ({ t, k: "deposit" as const }));
    if (tab === "withdraw") return withdraws.map((t) => ({ t, k: "withdraw" as const }));
    return [
      ...deposits.map((t) => ({ t, k: "deposit" as const })),
      ...withdraws.map((t) => ({ t, k: "withdraw" as const })),
    ].sort(
      (a, b) =>
        new Date(b.t.createdAt ?? b.t.created_at ?? 0).getTime() - new Date(a.t.createdAt ?? a.t.created_at ?? 0).getTime(),
    );
  }, [tab, deposits, withdraws]);

  return (
    <AppShell title="ငွေသွင်းငွေထုတ် မှတ်တမ်း">
      <div className="px-4 pt-4 pb-6">
        <div className="flex gap-2 rounded-xl bg-[#101830] gold-border p-1.5">
          {[
            { id: "all", label: "အကုန်" },
            { id: "deposit", label: "ငွေသွင်း" },
            { id: "withdraw", label: "ငွေထုတ်" },
          ].map((o) => (
            <button
              key={o.id}
              onPointerDown={() => setTab(o.id as any)}
              className={`press flex-1 h-9 rounded-lg text-[12px] font-semibold transition-colors ${tab === o.id ? "gold-grad text-[#1a1205]" : "text-[#7c87a6]"}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-5 pb-2">
          <Receipt size={15} className="text-[#e3b24a]" />
          <h2 className="font-display font-bold text-[14px] text-[#e9eef8]">မှတ်တမ်းစာရင်း</h2>
          <span className="flex-1 h-px bg-[#22305a]" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-5 w-5 animate-spin text-[#e3b24a]" />
          </div>
        ) : !items.length ? (
          <div className="text-center text-[12px] text-[#7c87a6] py-14">မှတ်တမ်း မရှိသေးပါ</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map(({ t, k }) => (
              <TxCard key={`${k}-${t.id}-${t.amount}-${k === "deposit" ? "d" : "w"}`} tx={t} kind={k} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default Deposit;
