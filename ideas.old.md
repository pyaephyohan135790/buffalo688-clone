# Buffalo688 Rebuild — Design Ground Truth

## User Requirement (Ground Truth)

The user wants the Buffalo688 gaming site rebuilt **from scratch with original code** (no copying of their JS bundles), in the **same style** as https://m.buffalo688.club , with **app-install prompts completely removed**. All data comes from the **existing Buffalo688 backend APIs** (api.buffalo688.net, storage.googleapis.com/spacetech2, cdn.myanmarshankoeme.com assets).

## Reference Analysis (observed on live site)

- Mobile-first layout (fixed ~375px width on desktop, centered)
- Sky-blue animated cartoon background with Viking ship / buffalo imagery
- Header: Buffalo688 logo (golden buffalo emblem), welcome banner carousel
- Registration form card (dark translucent): username, phone, password, confirm password, green gradient submit button
- Bottom tab bar: ပင်မ (Home), ငွေထုတ် (Withdraw), center logo (Bet/Sport), ငွေလွှဲ (Transfer), ပရိုဖိုင် (Profile)
- Promo popup with carousel + CLOSE
- Login page inside iframe: password + remember checkbox
- PWA manifest with icons; service worker; install prompt — **REMOVE ALL OF THIS** in the rebuild
- Colors: bright sky blue background, dark navy translucent cards, green gradient CTA, white/nav text

## Chosen Design Direction (replication of reference, ground truth)

- **Theme**: "Myanmar Gaming Sky" — faithful recreation of the reference's playful cartoon casino aesthetic.
- **Design Movement**: Cartoon casino / friendly fantasy (cartoon viking ship, buffalo mascot, bright saturated palette).
- **Core Principles**:
  1. Mobile-first single-column layout (max-w-md, centered)
  2. Sky blue background imagery with translucent dark cards
  3. Vivid gradient CTAs (green primary, gold accent)
  4. Bottom fixed tab navigation with 5 tabs
- **Color Philosophy**: Bright optimistic sky blues (#4FB3E8-ish) for background energy; deep navy (#1B2A4A) translucent panels for readability; casino green gradient for actions; gold for brand accents.
- **Layout Paradigm**: Fixed mobile viewport wrapper; header logo; content card; bottom tab bar — replicating the reference structure.
- **Signature Elements**: Golden buffalo logo mark; cartoon sky-ship background art; green gradient pill buttons; translucent rounded cards.
- **Typography**: Myanmar-friendly stack — 'Padauk' / system fonts for Burmese text, Roboto/Open Sans for Latin.
- **Interaction Philosophy**: Instant page switches via tab bar; simple forms with green submit; banner carousel auto-advance.
- **Animation**: Subtle carousel slide, button scale on press (160ms ease-out); nothing heavy.

## Pages (routes)

- `/` — Register page (default, with referral code param support `?code=...`)
- `/login` — Login page
- `/home` — Home (banner carousel + game provider grid, live 2D results, football matches)
- `/game/:provider` — Game list (iframe from providers, message `gameExit` → /home)
- `/deposit` — Deposit page
- `/withdraw` — Withdraw page
- `/transfer` — Transfer wallet
- `/profile` — Profile / settings

## Backend API contract (live Buffalo688 APIs)

- Base: `https://api.buffalo688.net/api/`
- Register: `POST /auth/Register` (payload likely: {phone, password, confirm_password, username?})
- Login: `POST /auth/Login` → returns token, store in localStorage
- OTP: `/auth/send-code`, `/auth/verify-code`
- Profile: `/auth/user`
- Withdraw: `/withdraw` endpoints
- Deposit: KPay/WavePay/AYA style QR or merchant (silverkirin88 merchantapi observed)
- Agent contact: `/api/user/agentcontact`
- 2D live results: `https://luke.2dboss.com/api/luke/twod-result-live`
- Football live: `https://back.mandalarthu.com/api/football-live-matches-api`
- Images host: `https://storage.googleapis.com/spacetech2/` (game banners)

## Anti-copy safeguards

- All React components handwritten; no original JS bundle reuse
- Brand renamed: use same visual language but own assets where possible; logo images may use CDN URLs (they are served by the same operator)
- NO service worker install prompt, NO PWA "add to home screen" script, NO beforeinstallprompt handler
