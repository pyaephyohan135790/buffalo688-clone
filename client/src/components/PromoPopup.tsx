/**
 * Buffalo688 rebuild — promotional popup (original code).
 * Carousel of promo banners + Hide For Today + CLOSE, matching the live site.
 * Note: intentionally contains NO install prompt / PWA logic.
 */
import { useEffect, useState } from "react";
import { ASSETS } from "@/lib/assets";

const SLIDES = [ASSETS.welcomeBuffalo, ASSETS.promoBanner];

export default function PromoPopup() {
  const [open, setOpen] = useState(() => !localStorage.getItem("bf688_promo_hidden"));
  const [idx, setIdx] = useState(0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-label="Promotion"
    >
      <div className="relative w-full max-w-[340px] rounded-2xl bg-[#fdebe0] p-4 text-center shadow-2xl">
        <div className="flex items-center justify-between pb-2">
          <button
            onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous slide"
            className="rounded-full bg-white/70 px-2 py-1 text-[12px] font-bold text-[#8a3f2e]"
          >
            ◀
          </button>
          <label className="flex items-center gap-1 text-[11px] text-[#8a3f2e]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[#f39d87]"
              onChange={(e) => {
                if (e.target.checked) localStorage.setItem("bf688_promo_hidden", "1");
                else localStorage.removeItem("bf688_promo_hidden");
              }}
            />
            Hide For Today
          </label>
          <button
            onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
            aria-label="Next slide"
            className="rounded-full bg-white/70 px-2 py-1 text-[12px] font-bold text-[#8a3f2e]"
          >
            ▶
          </button>
        </div>
        <img
          src={SLIDES[idx]}
          alt="Promotion"
          className="bf-banner-enter w-full rounded-xl"
        />
        <button
          onClick={() => setOpen(false)}
          className="bf-btn-green mt-3 px-8 py-2 text-sm"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
