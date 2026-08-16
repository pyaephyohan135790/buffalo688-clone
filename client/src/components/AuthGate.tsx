/**
 * Buffalo688 rebuild — auth gate, premium dark-luxury styling.
 * Matches Money.tsx: deep navy gradients, gold accents, no install prompts.
 */
import { Link } from "wouter";
import { useEffect } from "react";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGate({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  const { user, loading } = useAuth();

  // Premium pages keep the dark navy background even when the visitor
  // is logged out (this panel itself must not sit on the sky bg).
  useEffect(() => {
    document.documentElement.classList.toggle("bf-dark", dark);
    return () => {
      if (!dark) document.documentElement.classList.remove("bf-dark");
    };
  }, [dark]);
  if (loading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-5 mt-6 overflow-hidden rounded-3xl text-center shadow-2xl" style={{
        background: "linear-gradient(160deg, #0d1121 0%, #171c35 55%, #1b2040 100%)",
        border: "1px solid rgba(212,169,75,0.3)",
        boxShadow: "0 18px 45px rgba(8,10,30,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
      }}>
        <div className="flex justify-center pt-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{
            background: "rgba(212,169,75,0.18)",
            border: "1px solid rgba(212,169,75,0.45)",
          }}>
            <Lock className="h-5 w-5 text-[#d4a94b]" />
          </div>
        </div>
        <p className="mt-3 px-6 text-[15px] font-bold text-white">
          ဤနေရာသို့ ဝင်ရောက်ရန် အကောင့်လိုအပ်ပါသည်
        </p>
        <p className="mt-1 px-6 text-[11px] font-semibold text-[#8a93b8]">
          Login ဝင်ရောက်ပြီး အကောင့်တစ်ခု ရှိရန် လိုအပ်ပါသည်
        </p>
        <div className="px-6 py-5">
          <Link
            href="/login"
            className="block w-full rounded-2xl py-3.5 text-[14px] font-extrabold transition-transform active:scale-[0.97]"
            style={{
              background: "linear-gradient(110deg, #f2d58a 0%, #d4a94b 55%, #b98e38 100%)",
              color: "#0d1121",
              boxShadow: "0 10px 28px rgba(212,169,75,0.35), inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
          >
            ဝင်ရောက်မည်
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
