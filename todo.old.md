# Final Verification Todo

- [x] Login flow verified with test account buffalo3465924
- [x] Deposit page: payment type + amount + transaction number (no password)
- [x] Withdraw page: payment system selector (K Pay, Wave Pay, etc.)
- [x] Transfer page: agent contacts + accounts + user-to-user form
- [x] Profile page: settings, language, logout, contacts
- [x] Game catalogs: PP (681), JILI (221), all providers separated
- [x] Game iframe URL returns 200 (PP tudgiigxgo, Jili wbgame)
- [ ] Confirm game iframe renders visually on the rebuilt site (mobile viewport)
- [ ] Verify "Hide For Today" promo persistence
- [ ] Confirm zero app-install prompts on all pages
- [ ] Save final checkpoint + deliver URLs + source zip

## New request (user): home page game sections must match original
- [ ] Audit original home page: count of game sections (user says 4 buffalo sections) and which providers
- [ ] Audit original /api home endpoints for section categories (နာမည်ကြီး, ကျွဲဂိမ်း, စလော့, ဖဲ, ငါးပစ်, အာကိတ် etc.)
- [ ] List all providers from live API (JILI, PP, PG, ...) and map MM names
- [ ] Restructure Home.tsx sections to match original exactly
- [ ] Verify game page routes per provider, full catalog playable
- [ ] Checkpoint + deliver

## User screenshot feedback (2026-08-16)
- [ ] Game card images not rendering (blank white cards) — fix thumbnails
- [ ] Every game card click must open a playable game (even guest sees overlay like original)
- [ ] Find original per-game thumb URL convention in original JS bundle (imagedelivery.net UUIDs) and use it

## User logged-in home screenshot (12:32) — mismatches to fix
- [ ] Game sections (ရေပန်းစား ဂိမ်း/စလော့/ငါးဖမ်း/အာကိတ်) NOT visible in logged-in view — only welcome cards show; check if API failure hides sections or layout hidden behind welcome card
- [ ] Section header titles (h4) not rendering — check SectionTitle text color visibility vs pink bg
- [ ] Header: balance area blends into page — original has solid pink header; check SiteLayout header bg
- [ ] Chips row in original logged-in view shows only 4 chips (နာမည်ကြီး/ကျွဲဂိမ်း/စလော့ + chip w/ cards icon) — row layout 2 rows x 2? verify count/arrangement
- [ ] Welcome card 6-card grid OK but sections must follow immediately below
- [ ] Footer nav: left dark circle refresh item appears in original — check bottom nav match

## User request (clarified): test games one by one ON THE ORIGINAL SITE m.buffalo688.club
- [ ] Log into m.buffalo688.club with test account buffalo3465924 / Testmanus2026!
- [ ] Open a Jili game and verify it launches
- [ ] Open a Pragmatic (PP) game and verify
- [ ] Open a PG Soft game and verify
- [ ] Open other providers (Ka, Spade, JDB, 2J, HotDog, FaChai) and verify
- [ ] Report per-provider test results to user

## User feedback 2026-08-16: clone home "games not showing, structure differs from original"
- [ ] Capture clone home (production, logged-in) and list what renders: which sections, how many tiles each
- [ ] Compare against original structure: original shows games grouped by PROVIDER sections (JILI/PP/PG/...) not just gameType sections
- [ ] Identify why some sections show 0 or no tiles on production
- [ ] Rebuild Home.tsx sections to match original: all providers' games fully populated
- [ ] Verify full game coverage, checkpoint, deliver

## User report 2026-08-16 (chips filter broken + background mismatch)
- [ ] Reproduce: clicking ကျွဲဂိမ်း / ဖဲ chip does NOT filter game sections — all sections stay visible
- [ ] Fix Home.tsx chip click so sections filter exactly like original (sideNav active + only matched section renders)
- [ ] Compare original home background (blue water/sky theme, rounded pink container) with clone and match it
- [ ] Verify production link renders correctly, checkpoint and deliver
