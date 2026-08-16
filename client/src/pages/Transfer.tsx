/* ============================================================
   Transfer — Midnight Vault
   ငွေလွှဲ: Agent ဆက်သွယ်ရန် (Viber/Telegram) + Agent payment accounts
   (ငွေလွှဲရမည့် ဖုန်းနံပာတ်များ) + user→user wallet transfer.
   API ground truth (original app.js):
     Agent contact:  POST /user/agentcontact   -> {viber_number, telegram_username} (live often 500)
     Accounts:       GET  /accounts            -> agent payment account cards
     User transfer:  POST /transfers           -> {target_user, amount, password}
   ============================================================ */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, Copy, Headphones, Loader2, MessageCircle, Phone } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  getAccounts,
  getAgentContact,
  transferWallet,
  type AgentAccount,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/utils";

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

function maskNumber(n: string): string {
  const len = n.length;
  if (len >= 7) return "*".repeat(len - 5) + n.slice(len - 5);
  return n;
}

function copyText(text: string, doneMsg: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(doneMsg))
    .catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success(doneMsg);
    });
}

const inputCls = "w-full h-12 rounded-xl bg-[#0d1424] border border-[#22305a] px-4 text-[14px] text-[#e9eef8] placeholder:text-[#5b6890] focus:outline-none focus:border-[#c9962e] transition-colors font-num";

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#c6cfde] mb-3">
      {icon}
      <span>{label}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-[#22305a] to-transparent" />
    </div>
  );
}

export default function Transfer() {
  const { user, refreshBalance } = useAuth();

  const [agent, setAgent] = useState<{ viber?: string; telegram?: string } | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [accounts, setAccounts] = useState<AgentAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const [toUser, setToUser] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getAgentContact()
      .then((res) => {
        if (active && res?.data) {
          setAgent({ viber: res.data.viber_number, telegram: res.data.telegram_username });
        }
      })
      .catch(() => undefined)
      .finally(() => active && setAgentLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getAccounts()
      .then((res) => {
        const list = ((res?.data ?? []) as AgentAccount[]).filter(
          (a) => a.account_number || a.number || a.account_name || a.name || a.type,
        );
        if (active) setAccounts(list);
      })
      .catch(() => undefined)
      .finally(() => active && setAccountsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function onSubmitTransfer(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!toUser.trim()) return toast.error("လက်ခံမည့် User ID ထည့်ပါ");
    if (!amt || amt < 100) return toast.error("အနည်းဆုံး 100 ထည့်ပါ");
    if (!password) return toast.error("စကားဝှက် ထည့်ပါ");
    setSubmitting(true);
    try {
      await transferWallet(toUser.trim(), amt, password);
      toast.success("ငွေလွှဲအောင်မြင်ပါသည်");
      setToUser("");
      setAmount("");
      setPassword("");
      refreshBalance();
    } catch (err: any) {
      toast.error(err?.message ?? "လွှဲမရပါ၊ နောက်တစ်ကြိမ် ကြိုးစားပါ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="ငွေလွှဲရန်">
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* ---------- Agent contact: Viber + Telegram ---------- */}
        <div className="navy-card rounded-2xl p-4">
          <SectionHead icon={<Headphones size={15} className="text-[#e3b24a]" />} label="Agent ဆက်သွယ်ရန်" />
          {agentLoading ? (
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#7c87a6]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#e3b24a]" /> ဆက်သွယ်ရန်ခလုတ် ယူနေပါသည်...
            </div>
          ) : (
            <div className="flex gap-3">
              {agent?.telegram ? (
                <a
                  href={`https://t.me/${agent.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press h-14 w-14 rounded-xl bg-[#0d1424] border border-[#22305a] flex items-center justify-center"
                >
                  <MessageCircle size={26} className="text-[#29b6f6]" />
                </a>
              ) : null}
              {agent?.viber ? (
                <a
                  href={`viber://contact?number=+${agent.viber}`}
                  className="press h-14 w-14 rounded-xl bg-[#0d1424] border border-[#22305a] flex items-center justify-center"
                >
                  <Phone size={24} className="text-[#7360f2]" />
                </a>
              ) : null}
              {!agent?.telegram && !agent?.viber && (
                <a href="tel:09756477723" className="text-[12px] font-bold text-[#c9962e] underline">
                  09756477723 ကို ဖုန်းခေါ်ရန်
                </a>
              )}
            </div>
          )}
        </div>

        {/* ---------- Agent payment accounts ---------- */}
        <div className="navy-card rounded-2xl p-4">
          <SectionHead icon={<ArrowLeftRight size={15} className="text-[#e3b24a]" />} label="ငွေလွှဲရမည့် အကောင့်များ" />
          <p className="text-[11px] text-[#7c87a6] leading-relaxed mb-3">
            ရွေးချယ်ထားသော အကောင့်ကို ငွေလွှဲပြီးနောက် screenshot ဖမ်း၍ admin ထံ upload တင်ပေးပါ။
          </p>

          {accountsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-[#0d1424]" />
              ))}
            </div>
          ) : accounts.length ? (
            <div className="space-y-2.5">
              {accounts.map((a, i) => {
                const active = selectedIdx === i;
                const name = a.account_name ?? a.name ?? a.type ?? "Account";
                const number = a.account_number ?? a.number ?? "";
                const icon = paymentIcon(a.type, name);
                return (
                  <button
                    key={a.id ?? i}
                    type="button"
                    onPointerDown={() => setSelectedIdx(i)}
                    className={`press w-full rounded-xl p-3 text-left border transition-transform active:scale-[0.98] ${
                      active ? "gold-border bg-[#16203d]" : "border-[#22305a] bg-[#0d1424]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {icon ? (
                        <img src={icon} alt={a.type ?? name} className="h-10 w-10 rounded-lg object-contain" />
                      ) : (
                        <span className="h-10 w-10 shrink-0 rounded-lg bg-[#16203d] gold-border flex items-center justify-center text-[10px] font-bold text-[#e3b24a]">
                          {(a.type ?? "?").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-[13px] font-bold text-[#e9eef8]">{a.type ?? name}</div>
                        <div className="truncate text-[11px] text-[#7c87a6]">{name}</div>
                      </div>
                      {active && (
                        <span className="press rounded-full gold-grad px-2 py-0.5 text-[10px] font-black text-[#1a1205]">✓</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#060a14] border border-[#22305a] px-3 py-2">
                      <span className="truncate font-num text-[13px] font-bold text-[#e9eef8]">{number ? maskNumber(number) : "—"}</span>
                      {number && (
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyText(number, "ကူးယူပြီးပါပြီ");
                          }}
                          className="press flex shrink-0 items-center gap-1 rounded-lg bg-[#16203d] gold-border px-2 py-1 text-[11px] font-bold text-[#e3b24a]"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      )}
                    </div>
                    {a.note && <div className="mt-1.5 text-[11px] text-[#7c87a6] leading-relaxed">{a.note}</div>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-[#0d1424] border border-[#22305a] p-4 text-center text-[12px] text-[#7c87a6]">
              Agent အကောင့်များ မရယူနိုင်ပါ — 09756477723 ကို ဆက်သွယ်ပါ
            </div>
          )}
        </div>

        {/* ---------- User → User wallet transfer ---------- */}
        <form onSubmit={onSubmitTransfer} className="navy-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <SectionHead icon={<ArrowLeftRight size={15} className="text-[#e3b24a]" />} label="User → User ငွေလွှဲ" />
            <span className="rounded-full bg-[#0d1424] border border-[#22305a] px-2.5 py-1 text-[11px] font-num font-bold text-[#e3b24a]">
              {formatMoney(user?.balance ?? 0)} Ks
            </span>
          </div>

          <label className="block text-[12px] font-semibold text-[#8a93b8] mb-1.5">လက်ခံမည့် User ID</label>
          <input className={inputCls} value={toUser} onChange={(e) => setToUser(e.target.value)} placeholder="လက်ခံမည့် user id" />

          <label className="block text-[12px] font-semibold text-[#8a93b8] mt-3.5 mb-1.5">ပမာဏ (MMK)</label>
          <input className={inputCls} type="number" inputMode="numeric" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10,000" />

          <label className="block text-[12px] font-semibold text-[#8a93b8] mt-3.5 mb-1.5">စကားဝှက်</label>
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

          <button
            type="submit"
            className="press w-full h-12 rounded-xl gold-grad text-[15px] font-bold text-[#1a1205] mt-4 shadow-[0_4px_24px_rgba(201,150,46,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight size={16} />}
            {submitting ? "ဆောင်ရွက်နေပါ..." : "ငွေလွှဲမည်"}
          </button>
        </form>

        <div className="rounded-xl bg-[#0d1424] border border-[#22305a] p-3 text-center text-[11px] text-[#7c87a6]">
          ငွေလွှဲမရသည့်အခါ ဝန်ဆောင်မှုပေးသူနှင့် တိုက်ရိုက်ဆက်သွယ်ပါ — 09756477723
        </div>
      </div>
    </AppShell>
  );
}
