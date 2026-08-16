/* ============================================================
   Auth — Login + Register (Midnight Vault)
   Login: POST /auth/login -> token (localStorage)
   Register: POST /auth/register with ?code= referral prefill
   Deep links /auth/login, /auth/register forwarded here.
   ============================================================ */
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { login, register } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const LOGO = "/assets/buffalo-logo_89f5714c.png";

/* မူရင်း link အတိုင်း — referral code ကို SPD5Y8 ပုံသေ ထားပေးရမည် */
const REFERRAL_CODE = "SPD5Y8";

interface RegResult {
  data?: { name?: string; id?: number };
}

function AuthFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-[#040710] flex justify-center items-start pt-[10vh]">
      <div className="w-full max-w-[420px] px-5">
        <div className="flex flex-col items-center gap-4 mb-6">
          <img src={LOGO} alt="Buffalo688" className="h-16 w-16 rounded-2xl object-cover glow-gold ring-2 ring-[#c9962e]/50" />
          <div className="font-display font-extrabold text-[22px] tracking-tight">
            <span className="gold-text">BUFFALO</span>
            <span className="text-[#e9eef8]">688</span>
          </div>
          <div className="text-[13px] text-[#7c87a6]">{title}</div>
        </div>
        {children}
        <div className="mt-5 text-center text-[12px] text-[#7c87a6]">
          © 2026 Buffalo688 — လိုက်လျောစွာ ကစားကြပါ
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-12 rounded-xl bg-[#101830] border border-[#22305a] px-4 text-[14px] text-[#e9eef8] placeholder:text-[#5b6890] focus:outline-none focus:border-[#c9962e] transition-colors";
const btnCls =
  "w-full h-12 rounded-xl gold-grad text-[15px] font-bold text-[#1a1205] press mt-3 shadow-[0_4px_24px_rgba(201,150,46,0.3)]";

export function Login() {
  const { login: authLogin } = useAuth();
  const [params] = useSearchParams();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoNote, setAutoNote] = useState(false);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim() || !pw.trim()) return toast.error("အသုံးပြုသူအမည် နှင့် စကားဝှက် ဖြည့်ပါ");
    setLoading(true);
    try {
      const res = await login(name.trim(), pw);
      const token = (res?.token ?? res?.data?.token ?? res?.data?.tokenInfo?.token) as string | undefined;
      if (!token) throw new Error("ဝင်ရောက်ခွင့် token မရရှိပါ — နောက်တစ်ခါ ကြိုးစားပါ");
      authLogin(token);
      toast.success("ဝင်ရောက်မှု အောင်မြင်ပါပြီ");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message ?? "ဝင်ရောက်မှု မအောင်မြင်ပါ");
    } finally {
      setLoading(false);
    }
  }

  /* Register အောင်မြင်ပြီး လာရင် — credentials prefilled + auto submit (မူရင်းအတိုင်း)
     Hard refresh / re-open: saved credentials auto-fill AND auto-login. */
  useEffect(() => {
    const savedName = localStorage.getItem("bf688_username");
    const savedPw = localStorage.getItem("bf688_password");
    if (savedName && savedPw && !params.get("code")) {
      setName(savedName);
      setPw(savedPw);
      setAutoNote(true);
      const t = setTimeout(() => submit(), 500);
      return () => clearTimeout(t);
    }
    const raw = sessionStorage.getItem("bf688_auto_login");
    if (raw) {
      try {
        const cred = JSON.parse(raw);
        sessionStorage.removeItem("bf688_auto_login");
        if (cred?.name && cred?.password) {
          setName(cred.name);
          setPw(cred.password);
          setAutoNote(true);
          const t = setTimeout(() => submit(), 500);
          return () => clearTimeout(t);
        }
      } catch { /* noop */ }
    }
    void params;
  }, []);

  return (
    <AuthFrame title="Login ဝင်ရောက်ပါ">
      <form onSubmit={submit} className="navy-card rounded-2xl p-5 flex flex-col gap-3">
        <input className={inputCls} placeholder="အသုံးပြုသူအမည်" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" />
        <input className={inputCls} type="password" placeholder="စကားဝှက်" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <button className={btnCls} disabled={loading}>{loading ? "စောင့်ပါ..." : "ဝင်ရောက်မည်"}</button>
      </form>
      {autoNote && (
        <div className="mt-2 text-center text-[11px] text-[#7c87a6]">Register ဖွင့်ထားတဲ့ အကောင့်နဲ့ အလိုအလျောက် ဝင်နေပါတယ်...</div>
      )}
      <div className="mt-3 text-center text-[12px] text-[#7c87a6]">
        Register လုပ်ရင် server က ပေးလိုက်တဲ့ <span className="text-[#e3b24a] font-semibold">buffalo... နာမည်</span> နဲ့ ဝင်ရပါမည်။
      </div>
      <div className="mt-4 text-center text-[13px] text-[#c6cfde]">
        အကောင့် မရှိသေးဘူးလား?{" "}
        <Link href="/register?code=SPD5Y8" className="text-[#e3b24a] font-semibold">အကောင့်အသစ်ဖွင့်ရန်</Link>
      </div>
    </AuthFrame>
  );
}

export function Register() {
  const [, navigate] = useLocation();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<RegResult | null>(null);

  /* မူရင်း link အတိုင်း code=SPD5Y8 ကို ပုံသေ ထားပေးထားသည် */
  useEffect(() => {
    void params;
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("အသုံးပြုသူအမည် ဖြည့်ပါ");
    if (!/^(09|\+?959)\d{7,10}$/.test(phone.trim())) return toast.error("ဖုန်းနံပါတ် မှန်ကန်စွာ ရိုက်ထည့်ပါ");
    if (pw !== pw2) return toast.error("စကားဝှက် နှစ်ခု မတူပါ");
    if (pw.length < 6) return toast.error("စကားဝှက် ၆ လုံးအထက် ထားပါ");
    setLoading(true);
    try {
      /* မူရင်း payload အတိုင်း + code ကို SPD5Y8 ပုံသေ သုံးသည် */
      const res = (await register({ username: name.trim(), phone: phone.trim(), password: pw, confirmPassword: pw, referralCode: REFERRAL_CODE })) as RegResult;
      const generatedName = res?.data?.name;
      if (generatedName) {
        // မူရင်းအတိုင်း — register အောင်ရင် login page ကို auto credentials နဲ့ ပို့ပြီး ချက်ချင်း ဝင်ပေးမည်
        sessionStorage.setItem("bf688_auto_login", JSON.stringify({ name: generatedName, password: pw }));
      }
      setDone(res);
    } catch (err: any) {
      toast.error(err?.message ?? "စာရင်းသွင်းမှု မအောင်မြင်ပါ");
    } finally {
      setLoading(false);
    }
  }

  const generatedName = done?.data?.name;

  if (generatedName) {
    return (
      <AuthFrame title="အကောင့် ဖွင့်ပြီးပါပြီ">
        <meta name="registered" />
        <div className="navy-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-full gold-grad flex items-center justify-center">
            <span className="text-2xl">🎉</span>
          </div>
          <div className="text-[14px] text-[#c6cfde]">စာရင်းသွင်းမှု အောင်မြင်ပါပြီ</div>
          <div className="w-full rounded-xl bg-[#0a1226] border border-[#c9962e]/50 px-4 py-3">
            <div className="text-[11px] text-[#7c87a6] mb-1">Login ဝင်ရန် အသုံးပြုရမည့် အမည်</div>
            <div className="font-num text-[17px] font-bold text-[#e3b24a] select-all">{generatedName}</div>
          </div>
          <div className="text-[12px] text-[#7c87a6] leading-relaxed">
            အပေါ်မှာ ပြထားတဲ့ နာမည်ကို စကားဝှက်နဲ့ တွဲပြီး Login ဝင်ပါ။ <br />
            စကားဝှက်: <span className="font-mono text-[#c6cfde]">{pw}</span>
          </div>
          <button className={btnCls} onClick={() => navigate("/login")}>Login ဝင်ရန်</button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="အကောင့်အသစ် ဖွင့်ရန်">
      <form onSubmit={submit} className="navy-card rounded-2xl p-5 flex flex-col gap-3">
        <input className={inputCls} placeholder="အသုံးပြုသူအမည်" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" />
        <input className={inputCls} type="tel" placeholder="ဖုန်းနံပါတ် (09...)" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        <input className={inputCls} type="password" placeholder="စကားဝှက်" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <input className={inputCls} type="password" placeholder="စကားဝှက် အတည့်ပြုပါ" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        <div className="relative">
          <input className={inputCls} placeholder="မိတ်ဆက်ကုဒ်" value={REFERRAL_CODE} readOnly />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#e3b24a]">CODE</span>
        </div>
        <button className={btnCls} disabled={loading}>{loading ? "စောင့်ပါ..." : "အကောင့်ဖွင့်မည်"}</button>
      </form>
      <div className="mt-4 text-center text-[13px] text-[#c6cfde]">
        အကောင့်ရှိပြီးလား?{" "}
        <Link href="/login" className="text-[#e3b24a] font-semibold">Login ဝင်ရန်</Link>
      </div>
    </AuthFrame>
  );
}
