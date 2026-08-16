# Rework 6 — Missing home game rooms

User screenshot shows the ORIGINAL site home with sections the clone is missing:
1. A featured/hot slot row with 4 African Buffalo tiles (2 with "အသစ်များ" green ribbon, all with 🔥 badge) — likely a "new/hot slots" or "Popular" section
2. Burmese game rooms row: ရှမ်းကိုင့်မီး (shame card game), ဘာကရို, လက်မုန်လက်မုန် (dice), ဒေါက်ကောက်မီး ဘီင် (lion game) — likely a local Myanm

## Rework 6 FINDINGS (complete)

### What the user screenshot shows (ORIGINAL home, 2 missing rows)
Row A: 4 "African Buffalo" hot-slot tiles (green "အသစ်များ" ribbon on first 2, 🔥 badge on all). Row B: 4 Burmese game rooms: ရှမ်းကိုင်မီး (card girl), ဘာကရို (chinese girl), လက်မုန်လက်မုန် (dice), ဒေါက်ကောက်မီး ဘီကင် (lion) — these are the original's "rooms" (live card/dice rooms), NOT regular slot games.

### Original bundle findings (/home/ubuntu/orig_site/fresh_app.js)
- Shan Ko Mee (ရှမ်းကိုးမီး) Room page: route path "skm-rooms" (user prefix: /user/skm-rooms). Component module at ~42430.
  - API: GET /shankomee-data?params={id: authUser.name, level: roomIdx, balance: amount, info:{nickname:user_name, profile:3}}
  - Then opens https://yoeyar-skm.vercel.app?id={name}&passcode={data.passcode}&exit={site}/user/skm-rooms
  - Rooms 6 levels: 100/300/500/1000/3000/5000 with min-balance checks (room0: 1000 min / 100000 max; room1: 3000/300000; room2: 5000/500000; room3: 10000; room4: 30000; room5: 50000)
  - Tile imgs: /build/assets/img/theme/rooms/{100,300,500,1000,3000,5000}_room.png
- Bugyee (ဘီယာ/ဘီကင် "ဒေါက်ကောက်မီး ဘီကင်") Room page: route path "bugyee-rooms" (/user/bugyee-rooms).
  - API: GET /bugyee-new-data?params={id, level, balance, info}
  - Opens http://165.22.110.56/bugyee_game/?id={name}&passcode={passcode}&exit=...
  - Also /bugyee-create-room and /bugyee-join-room APIs.
- These room pages are inside original at /user/skm-rooms, /user/bugyee-rooms routes; home tiles link there.
- The 4-tile row on original home likely consists of: 2 room-tiles (Shan Ko Mee + Bugyee) + 2 more? User's screenshot shows 4: ရှမ်းကိုင်မီး, ဘာကရို, လက်မုန်လက်မုန်, ဒေါက်ကောက်မီး ဘီကင်. These are probably separate room-game links (maybe each has own data API: /baccarat-data, /dice-data? NOT found in bundle). NOTE: bundle only has skm + bugyee rooms. The "ဘာကရို" (baccarat) and "လက်မုန်" tiles may belong to bugyee rooms page or another section — the bugyee Room page shows rooms for these games? Could not confirm; the screenshot likely is the bugyee rooms page itself (title row + 4 game tiles).
- African Buffalo hot row: carousel slide img https://storage.googleapis.com/spacetech2/africanbuffalo/banners/BUFFALO688%201.avif; section likely "hot" games. In our clone home, African Buffalo tiles exist under ကျွဲဂိမ်း already; the screenshot shows a dedicated HOT row with 🎉/🔥 badges and "အသစ်များ" ribbon = maybe original home "hot games" section using /hot-games or slotGames with ribbon if new.

### Plan for clone Home.tsx
1. Add "အခန်းများ (Rooms)" section: 2-4 tiles — ရှမ်းကိုးမီး (shan ko mee), ဘီယာ/ဘုရင် (bugyee). Click → /rooms/skm or /rooms/bugyee page that mimics original room selection (6 room tiles with balance checks) then fetch API & open iframe game URL.
   - APIs: GET {base}/shankomee-data and /bugyee-new-data with auth token. Passcode returned; game URL: https://yoeyar-skm.vercel.app?id=X&passcode=Y&exit=SITE/user/skm-rooms and http://165.22.110.56/bugyee_game/?id=X&passcode=Y&exit=...
   - Use iframe inside our app (instead of window.location.assign) to keep nav.
2. Add "hot" African Buffalo row: reuse existing hotGames slot data; mark games named African Buffalo with 🔥 + "အသစ်များ" ribbon for first 2. Tile images already work via imageLinkGenerate.
3. Tile art: download original /build/assets/img/theme/rooms/{n}_room.png from https://cdn.myanmarshankoeme.com/build/assets/img/theme/rooms/... (cdn.myanmarshankoeme.com base) — upload via manus-upload-file --webdev.
4. Existing clone pages: Home.tsx sections order: banner, chips, ကျွဲဂိမ်း, နာမည်ကြီး slots, ငါးပစ်, အာကိတ်, provider strip. Insert Rooms section after slots.

### Test accounts
buffalo3467167 / E2Etest9 (test deposit record exists +3000, balance ~5.50 after usage).
Login payload: {name, password, roles:"normal"} → login response has token + amount + user_name.

### Room API verification (shell test)
GET /api/shankomee-data?params{id,level,balance,info{nickname,profile:3}} → 200 {"status":"ok","gameURL":"https://spacetech-skm-landscape.qianxu168.com/?id=...&passcode=...&domain=buffalo688&game=ShanKoeMee&key=...&exit=..."} — WORKS (embeds in iframe).
GET /api/bugyee-new-data → returns HTML admin page (server misconfig on that endpoint right now) — FAILS.
GET /api/bugyee-data (with Bearer header) → error: "သင့်သည့် ရှမ်းကိုးမီး အခန်းတွင့် ကျန်ရှိနေသည့်။ ..." (player still in SKM room — locked until auto-kick). So bugyee endpoint exists but is blocked by the SKM session. In our implementation we call the same endpoint; error handling must show the description as a toast/alert.
NOTE: user screenshot 4 tiles = maybe bugyee rooms page shows game tabs (ရှမ်းကိုင်မီး/ဘာကရို/လက်မုန်လက်မုန်/ဘီကင်). Bugyee = "ဘီကင်" game family. Implement: rooms section with 2 tiles (Shan Ko Mee + ဘီကင်), each room page has 6 room tiles 100-5000 with balance checks like original.

## USER REQUEST (Aug 16): African Buffalo ဂလုံးဂလုံး + ငါးပစ် အခန်း
- [ ] Research original bundle for buffalo room module (room levels, min/max, Burmese messages, API endpoint, launch URL)
- [ ] Research original bundle for fishing room module (same)
- [ ] Get room tile art for buffalo & fishing rooms
- [ ] Implement /rooms/buffalo and /rooms/fishing pages (extend Rooms.tsx config + gates)
- [ ] Add api.ts helpers (getBuffaloData / getFishingData)
- [ ] Add Home entry tiles for buffalo & fishing rooms
- [ ] Verify balance gates and launch flow; checkpoint + deliver

## USER REQUEST (Aug 16, after sandbox reset): "မင့််ဟာ api တွေမှားနေတယ် မူရင်း website ကိုဝင် ဂိမ်းတွေကိုဝင်ကြည်အုံး"
- [ ] Load original site pages in browser (m.buffalo688.net), open several games, capture real network calls from browser devtools / network log
- [ ] Compare real endpoint URLs/HTTP method/params against clone api.ts (auth, games, hot-games, shankomee/bugyee/buffalo rooms, deposit/withdraw)
- [ ] Fix mismatches; re-verify; checkpoint; deliver

## USER REQUEST (Aug 16, evening): buffalo3467622 / Abcd1234 withdraw fails ("မအောင်မြင်ပါဘူး"), balance 10,000
- [ ] Log in buffalo3467622 on live site, check balance
- [ ] Submit withdraw via website, capture real error from console/network logs
- [ ] Compare payload against the payload that succeeded earlier (withdraw id 1714546 at 12:42)
- [ ] Fix Money.tsx / api.ts if needed; retest end-to-end
- [ ] Checkpoint + deliver, show user the real error
