# Buffalo688 — ပုံစံအသစ် ဒီဇိုင်းအသစ် (Full Rebuild)

User request: "ပုံစံအသစ် ဒီဇိုင်း အသစ်နဲ့ အစဆုံး ပြန်ရေး site တစ်ခုလုံးကို" — rebuild the whole site with a brand-new design (dark navy + gold premium), all React-native, live Buffalo688 APIs.

## Three approaches
1. **Midnight Vault** — dark navy + gold luxury casino, premium card-glass UI. Probability: 0.06
2. **Neon Arena** — black + electric purple/cyan glow, arcade-esports energy. Probability: 0.03
3. **Royal Crimson** — deep crimson + ivory, classic royal casino serif typography. Probability: 0.02

## CHOSEN: Midnight Vault (အရွေးခံ)

**Design Movement**: Luxury fintech × high-end casino (premium betting app meets gold-bullion banking UI).

**Core Principles**:
- Dark depth first: every surface is a shade of deep navy (#060a14 → #101830); content floats on layered cards
- Gold is currency: gold gradient (#f7d070 → #c9962e) used ONLY for money, actions, and active states — never decoration
- Mobile-native shell: fixed bottom nav with center buffalo emblem; pages scroll inside a 390px-centered viewport
- Density with breathing room: compact game grids but generous 16px page padding

**Color Philosophy**: Night vault = safety + exclusivity; gold = the winnings. Background: #060a14, cards: #0d1424/#101830, gold: #f7d070→#c9962e, text: #e9eef8 primary / #7c87a6 secondary, success green #22c55e, danger red #ef4444.

**Layout Paradigm**: Mobile app shell — header (balance hero) + scrollable content + fixed 5-tab bottom nav (ပင်မ/ငွေထုတ်/logo-center/ငွေလွှဲ/ပရိုဖိုင်). Desktop wraps everything in a 420px centered phone frame with dark backdrop. No full-bleed desktop layouts.

**Signature Elements**:
1. Gold-rimmed buffalo emblem (center of bottom nav + header logo)
2. Balance hero card — gold gradient top edge, eye-icon refresh
3. Section title with small gold gamepad/dice icon + left gold tick

**Interaction Philosophy**: Taps feel immediate — 150ms scale(0.97) press, chips toggle with gold pill fill, bottom nav active = gold icon + glow.

**Animation**: Entrance: 240ms ease-out fade+translateY(8px) staggered 40ms per card. Modals 220ms from scale(0.95). No slow parallax.

**Typography System**: "Noto Sans Myanmar" for Burmese, "Sora" (600/700) for latin headings, "IBM Plex Mono" for account numbers. Page title 18px, section 15px, body 14px, caption 12px.

**Brand Essence**: Buffalo688 — Myanmar's golden buffalo casino. Adjectives: bold, trustworthy, rewarding.

**Brand Voice**: Short Burmese commands, money-forward. Examples: "ငွေလွှဲရန် အသင့်ဖြစ်ပြီ", "ကျွဲဂိမ်းထဲ ဝင်လိုက်".

**Wordmark & Logo**: Gold buffalo head emblem (generated asset) + BUFFALO wordmark in Sora 700 gold gradient with 688 gold numeral.

**Signature Brand Color**: Gold #c9962e on navy #060a14.

## Implementation notes
- All pages React-native; one shared mobile shell (header + bottom nav)
- Live API: https://api.buffalo688.net/api (helpers in client/src/lib/api.ts — do not duplicate)
- Game launch: getGameUrl({gameID, provider}) → data.gameUrl → full-screen iframe overlay with close
- Thumbnails: imageLinkGenerate helper (existing in project)
- Root "/" = new home; deep links /auth/login, /auth/register forward to /login, /register

## Generated assets (reserved URLs — use exactly as-is)
- /manus-storage/buffalo-logo_89f5714c.png
- /manus-storage/hero-banner_60483ea8.png
- /manus-storage/dark-bg_42856a18.png

## Payment icons (original CDN)
https://cdn.gold549.com/build/assets/img/payments/{kpay,kbz,wavepay,cb_pay,cbbank,ayapay,aya}.png
