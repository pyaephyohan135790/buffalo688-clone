/* ============================================================
   BetHistory — Midnight Vault
   "ကစားမှတ်တမ်း (Betslip)" — mirrors the original site's
   /betslip-history (BetslipHistory.vue):

     twod/threed      POST /vouchers/datas/all  {draw, date, search, isBingo, type}
     maung/body/1x2   POST /fb-vouchers-history {draw_date, type}
     slip detail      POST /vouchers/datas      {voucher_id, type}

   Verified 2026-08-16 against api.buffalo688.net (200 on all three;
   records are only shown for bets the account has actually placed —
   the original site behaves identically).
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Receipt, Ticket, TicketCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getFBVouchersHistory, getVouchersAll, type BetSlipRecord } from "@/lib/api";

const FB_TYPES = [
  { id: "maung", label: "မောင်း" },
  { id: "body", label: "ဘော်ဒီ" },
  { id: "1x2", label: "1×2" },
  { id: "correctScore", label: "မှန်ကန်သောရလဒ်" },
];

const LOTTERY_TYPES = [
  { id: "twod", label: "2 လုံး" },
  { id: "threed", label: "3 လုံး" },
];

function todayLabel(): string {
  return new Date().toLocaleString("en-GB", { hour12: false, timeZone: "Asia/Rangoon" }).split(",")[0];
}

function currentDraw(): string {
  // Original: const h = (new Date).getHours(); return h < 12 ? "12:00" : "4:30";
  const h = new Date().getHours();
  return h < 12 ? "12:00" : "4:30";
}

function fmtAmount(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function BetCard({ rec, group }: { rec: BetSlipRecord; group: "fb" | "lottery" }) {
  const date = rec.created_at
    ? new Date(rec.created_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const teamV = rec.team_vouchers as unknown[] | undefined;
  return (
    <div className="rise-in navy-card rounded-xl px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 shrink-0 rounded-lg bg-[#e3b24a]/15 text-[#e3b24a] border border-[#e3b24a]/30 flex items-center justify-center">
          <Ticket size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#e9eef8] truncate">
            {group === "lottery" ? (rec.type === "twod" ? "2 102c1000103a1019" : "3 102c1000103a1019") : (rec.name ?? rec.type ?? "10181031102c1004103a10211031102c1004103a10101005103a")}
          </div>
          <div className="text-[10px] text-[#7c87a6] truncate">
            {rec.remark ?? ""} {date ? `· ${date}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-num font-semibold text-[#e9eef8]">
            {fmtAmount(rec.total_amount ?? (rec as { bet_amount?: unknown }).bet_amount).toLocaleString("en-US")}
          </div>
          {fmtAmount(rec.bingo_amount) > 0 && (
            <div className="text-[10px] font-num text-[#4ade80]">
              နိုင် {fmtAmount(rec.bingo_amount).toLocaleString("en-US")}
            </div>
          )}
        </div>
      </div>
      {teamV && teamV.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#22305a]/60 flex flex-col gap-1">
          {(teamV as BetSlipRecord[]).map((v, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#7c87a6]">
              <TicketCheck size={10} className="text-[#e3b24a] shrink-0" />
              <span className="truncate">
                {String(v.name ?? v.match ?? "")} {v.remark ? `· ${String(v.remark)}` : ""}
                {v.bet_score != null && String(v.bet_score) ? ` — ${String(v.bet_score)}` : ""}
              </span>
              {fmtAmount(v?.bet_amount ?? v?.total_amount) > 0 && (
                <span className="ml-auto shrink-0 font-num text-[#c6cfde]">
                  {fmtAmount(v.bet_amount ?? v.total_amount).toLocaleString("en-US")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BetHistory() {
  const [, navigate] = useLocation();
  const [group, setGroup] = useState<"fb" | "lottery">("lottery");
  const [type, setType] = useState("twod");
  const [records, setRecords] = useState<BetSlipRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const date = todayLabel();
    const draw = currentDraw();
    const p = (group === "lottery"
      ? getVouchersAll({ draw, date, type })
      : getFBVouchersHistory({ draw_date: date, type }))
      .then((res) => {
        setRecords((res?.data as BetSlipRecord[]) ?? []);
      })
      .catch(() => {
        toast.error("ကစားမှတ်တမ်း မရယူနိုင်ပါ");
        setRecords([]);
      })
      .finally(() => setLoading(false));
    void p;
  }, [group, type]);

  const totalStaked = useMemo(
    () =>
      records
        .map((r) => fmtAmount(r.total_amount ?? (r as { bet_amount?: unknown }).bet_amount))
        .reduce((a, b) => a + b, 0),
    [records],
  );
  const totalWon = useMemo(() => records.map((r) => fmtAmount(r.bingo_amount)).reduce((a, b) => a + b, 0), [records]);

  return (
    <AppShell title="ကစားမှတ်တမ်း">
      <div className="px-4 pt-4 pb-6">
        {/* group switch: lottery vs football */}
        <div className="flex gap-2 rounded-xl bg-[#101830] gold-border p-1.5">
          {[
            { id: "lottery", label: "ဂဏန််းပေါက်" },
            { id: "fb", label: "ဘောလုံးတိုက်" },
          ].map((o) => (
            <button
              key={o.id}
              onPointerDown={() => {
                setGroup(o.id as "lottery" | "fb");
                setType(o.id === "lottery" ? "twod" : "maung");
              }}
              className={`press flex-1 h-9 rounded-lg text-[12px] font-semibold transition-colors ${group === o.id ? "gold-grad text-[#1a1205]" : "text-[#7c87a6]"}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* type chips */}
        <div className="flex gap-1.5 pt-3 overflow-x-auto pb-1">
          {(group === "lottery" ? LOTTERY_TYPES : FB_TYPES).map((t) => (
            <button
              key={t.id}
              onPointerDown={() => setType(t.id)}
              className={`press shrink-0 h-8 px-3.5 rounded-full border text-[11px] font-semibold transition-colors ${
                type === t.id
                  ? "gold-grad text-[#1a1205] border-transparent"
                  : "border-[#22305a] bg-[#101830] text-[#7c87a6]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* summary strip */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="navy-card rounded-xl px-3 py-2.5 border border-[#22305a]">
            <div className="text-[10px] text-[#7c87a6]">စုစုပေါင််းထိုးငွေ</div>
            <div className="text-[14px] font-num font-bold text-[#f87171]">{totalStaked.toLocaleString("en-US")}</div>
          </div>
          <div className="navy-card rounded-xl px-3 py-2.5 border border-[#22305a]">
            <div className="text-[10px] text-[#7c87a6]">စုစုပေါင််းနိုင်ငွေ</div>
            <div className="text-[14px] font-num font-bold text-[#4ade80]">{totalWon.toLocaleString("en-US")}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-5 pb-2">
          <Receipt size={15} className="text-[#e3b24a]" />
          <h2 className="font-display font-bold text-[14px] text-[#e9eef8]">ဘောက်ချာမှတ်တမ််း</h2>
          <span className="flex-1 h-px bg-[#22305a]" />
          <span className="text-[10px] text-[#5b6890]">
            {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short" })}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-5 w-5 animate-spin text-[#e3b24a]" />
          </div>
        ) : !records.length ? (
          <div className="text-center py-14">
            <Ticket size={26} className="mx-auto text-[#2a3a66] mb-2" />
            <div className="text-[12px] text-[#7c87a6]">ယန်ေ့ ဘောက်ချာ မှတ်တမ််း မရှိသေးပါ</div>
            <div className="text-[10px] text-[#5b6890] mt-1 px-6">
              မူရင််း site မှာလည််း ထိုးထားတဲ့ ဘောက်ချာရှိမှ ပြပါတယ်
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {records.map((r, i) => (
              <BetCard key={`${r.id ?? i}-${i}`} rec={r} group={group} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
