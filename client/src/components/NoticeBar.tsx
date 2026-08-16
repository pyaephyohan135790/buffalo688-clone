/**
 * Buffalo688 rebuild — scrolling notice bar (original code).
 */
import { useEffect, useRef, useState } from "react";

const NOTICES = [
  "ဂိမ်းဆော့ရာတွင် အသက် ၁၈ နှစ်ပြည့်မှ ဆော့ကစားပါ",
  "ငွေသွင်း/ငွေထုတ် အကူအညီအတွက် အောက်ခြေ Contact မှတစ်ဆင့် ဆက်သွယ်နိုင်ပါသည်",
];

export default function NoticeBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % NOTICES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="mx-3 mt-2 flex items-center gap-2 overflow-hidden rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#1a2a4a] shadow-sm backdrop-blur-sm"
      ref={ref}
    >
      <img src="/favicon.ico" alt="" className="h-4 w-4 shrink-0" />
      <span key={idx} className="bf-banner-enter truncate">
        {NOTICES[idx]}
      </span>
    </div>
  );
}
