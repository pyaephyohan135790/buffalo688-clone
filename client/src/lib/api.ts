/**
 * Buffalo688 rebuild — API client (written from scratch).
 * Connects to the existing Buffalo688 backend at https://api.buffalo688.net
 * No app-install / PWA logic anywhere in this project.
 */

export const API_BASE = "https://api.buffalo688.net/api";

function getToken(): string | null {
  try {
    return (
      localStorage.getItem("bf688_token") ??
      localStorage.getItem("token") ??
      null
    );
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) {
      // The original site (and the game backend api.buffalo688.net) store the
      // bearer token under the exact key "token". Keep the clone key as an
      // alias so both apps can read the same login session.
      localStorage.setItem("bf688_token", token);
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("bf688_token");
      localStorage.removeItem("token");
    }
  } catch {
    /* noop */
  }
}

export async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Hard timeout — protected routes must never stay blank forever on a hung
  // backend response. On timeout the auth guard shows an error + retry path.
  const timeoutMs = 12000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let raw: unknown = undefined;
    try {
      raw = await res.clone().json();
      message =
        (raw as { message?: string; error?: string })?.message ||
        (raw as { error?: string })?.error ||
        JSON.stringify(raw);
    } catch {
      /* keep default */
    }
    const err = new Error(message) as Error & { status?: number; raw?: unknown };
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  // The backend occasionally returns an empty body on successful writes —
  // JSON.parse would throw; return an empty object so callers can still
  // treat the write as completed.
  const text = await res.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
}

export { getToken, setToken };

// ---------- Auth ----------

export interface RegisterPayload {
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

export function register(payload: RegisterPayload) {
  // Shape matches the live bundle: POST /auth/userRegister {user_name, phone,
  // password, confirmPassword, roles: "normal", referralCode}.
  const body = {
    user_name: payload.username,
    phone: payload.phone,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    roles: "normal",
    referralCode: payload.referralCode || undefined,
  };
  return request<{ success?: boolean; message?: string; data?: any; user_id?: string }>(
    "/auth/userRegister",
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function login(name: string, password: string, remember = false) {
  // Shape matches the live bundle: POST /auth/login {name, password, roles: "normal"}.
  return request<{ token?: string; access_token?: string; message?: string; data?: any }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ name, password, roles: "normal", remember }) }
  );
}

export function logout() {
  setToken(null);
  return request("/auth/logout", { method: "POST" }).catch(() => undefined);
}

export function getProfile() {
  return request<{ data?: any; message?: string }>("/auth/user");
}

// Live bundle: POST /auth/userPasswordChange {user_id, old, new, confirm} — verified
// against the original setting component (errors.old/new/confirm). Returns
// {success:"Password updated successfully"} or 401 {error:...} when old is wrong.
export function changePassword(oldPassword: string, newPassword: string, userId: number | string) {
  return request<{ success?: string; error?: string; message?: string }>("/auth/userPasswordChange", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, old: oldPassword, new: newPassword, confirm: newPassword }),
  });
}

// ---------- Money ----------

export interface BalanceInfo {
  id?: number;
  amount?: string | number;
  user_name?: string;
  name?: string;
  phone?: string;
  bank?: any;
  total_bet_amount?: number;
  turn_over_amount?: string | number;
  is_buffalo_playing?: boolean;
}

// Matches the original site: GET /auth/user -> {status, data:{amount,...}, totalWithdraw}
export function getBalance() {
  return request<{ data?: BalanceInfo; totalWithdraw?: number }>('/auth/user').catch(
    () => undefined as any
  );
}

// Deposit accounts are fetched via GET /user_bank (single account record: {type:"KBZ Pay", ...}).
// Submit deposit via POST /deposits and withdraw via POST /withdraws (see bottom of file).

export function transferWallet(targetUser: string, amount: number, password: string) {
  return request("/auth/transferUser", {
    method: "POST",
    body: JSON.stringify({ to_user: targetUser, amount, password }),
  });
}

// ---------- Games (live from Buffalo688 backend) ----------

export function getGames(params: { provider?: string; type?: string } = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return request<{ data?: GameInfo[] }>(`/games${qs ? `?${qs}` : ""}`);
}

export function getHotGames() {
  // Live API sections (verified against original app.js fetchHotGames):
  // slotGames(35), fishingGames(12), arcadeGames(20)
  // NOTE: original render reads `a.name` but the API returns `gameName` — map it.
  return request<{
    data?: {
      slotGames?: GameInfo[];
      fishingGames?: GameInfo[];
      arcadeGames?: GameInfo[];
    };
  }>("/hot-games").then((res) => {
    const data = res.data;
    if (data) {
      for (const list of [data.slotGames, data.fishingGames, data.arcadeGames]) {
        if (Array.isArray(list)) {
          for (const g of list) {
            if (!g.name && g.gameName) g.name = g.gameName;
          }
        }
      }
    }
    return res;
  });
}

export interface GameInfo {
  id: number;
  gameID: string;
  gameName: string;
  name?: string;
  gameTypeID: string;
  provider: string;
  technology?: string;
  aspectRatio?: string;
  is_close?: boolean;
}

const BF_CDN = "https://cdn.myanmarshankoeme.com/build/assets/img/bf688";
const ST_CDN = "https://space-tech.sgp1.cdn.digitaloceanspaces.com";

/** Exact replica of the original app.js imageLinkGenerate(gameID, provider). */
export function imageLinkGenerate(game: GameInfo): string {
  const provider = (game.provider ?? "").trim();
  const id = String(game.gameID ?? "").trim();
  if (!id) return "";
  if (provider === "Jili") return `${BF_CDN}/jili/${id}.webp`;
  if (provider === "Spade") return `${ST_CDN}/slot-images/spade/${id}.webp`;
  if (provider === "Fastspin") return `http://api-egame-staging.fsuat.com/thumbnail/en_US/${id}.jpg`;
  if (provider === "Playstar") return `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/playstar/${id}.png`;
  if (provider === "FaChai") return `${BF_CDN}/fachai/${id}_icon_300x500_mm.webp`;
  if (provider === "PGSoft") return `${ST_CDN}/slot-images/pgsoft/${id}.webp`;
  if (provider === "JOKER" || provider === "Joker") return `${ST_CDN}/slot-images/joker/${id}.webp`;
  if (provider === "5G") return `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/5g/${id}.png`;
  if (provider === "KA") return `${ST_CDN}/slot-images/ka/${id}.webp`;
  if (provider === "AceWin") return `${BF_CDN}/acewin/${id}_EN.webp`;
  if (provider === "JDB") return `${ST_CDN}/slot-images/jdb/${id}.webp`;
  if (provider === "2J") return `${BF_CDN}/2j/${id}.webp`;
  if (provider === "HotDog") return `${BF_CDN}/hotdog/${id}.webp`;
  // default — Pragmatic (original falls back to bf688/pp/{id}.webp)
  return `${BF_CDN}/pp/${id}.webp`;
}

export function getGameUrl(params: { gameID: string; provider: string; userId?: string | number | null }) {
  return request<{ success?: boolean; data?: { gameUrl?: string; gameURL?: string }; message?: string; description?: string }>(
    "/games/url?" +
      Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&")
  );
}

// ---------- Bank / agent ----------

export function getUserBank() {
  return request<{ success?: boolean; data?: { id?: number; type?: string; name?: string | null; account_number?: string | null } }>("/user_bank");
}

/**
 * Withdraw on the Buffalo688 backend is the user's bank record UPDATE —
 * verified against the live bundle 2026-08-16: PUT /api/user_bank with the
 * full bank record; the withdrawn amount is placed in `account_number`.
 * Responses: 200 {success:...} on acceptance; 500 "Please try again next 24
 * hour!" when the user already withdrew within the last 24h; other 5xx/4xx
 * with plain text messages.
 */
export function updateUserBank(bank: {
  id?: number;
  user_id?: number;
  name?: string | null;
  account_number?: string | number | null;
  type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}) {
  return request<{ success?: string; message?: string }>("/user_bank", {
    method: "PUT",
    body: JSON.stringify(bank),
  });
}

export function getAgentContact() {
  // The live bundle calls POST /user/agentcontact with an empty body and reads
  // data.{viber_number, telegram_username, telegram_name, agent_id}. The live API
  // currently returns 500 on that call, so callers must tolerate failure.
  return request<{ data?: { viber_number?: string; telegram_username?: string; telegram_name?: string | null; agent_id?: number } }>("/user/agentcontact", {
    method: "POST",
    body: "{}",
  });
}

export interface AgentAccount {
  id?: number | string;
  type?: string;
  account_name?: string | null;
  account_number?: string | null;
  name?: string | null;
  number?: string | null;
  note?: string | null;
  link?: string | null;
}

/** Deposit/transfer destination accounts — GET /accounts (data array). */
export function getAccounts() {
  return request<{ data?: AgentAccount[] }>("/accounts");
}

// ---------- Deposits / Withdraws ----------

export function getDepositHistory(userId: string | number, page = 1) {
  return request<{ data?: any[]; total?: number; current_page?: number }>(`/users/${userId}/deposits?page=${page}`);
}

export function createDeposit(params: { user_id?: number; account_id?: number; amount: number; date?: string; remark?: string; promotion_id?: number | null; lang?: string; password?: string }) {
  return request<{ success?: boolean; data?: any; message?: string }>("/deposits", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getWithdrawHistory(userId: string | number, page = 1) {
  return request<{ data?: any[]; total?: number; current_page?: number }>(`/users/${userId}/withdraws?page=${page}`);
}

export function createWithdraw(params: {
  amount: number;
  type?: string;
  name?: string;
  account_number?: string;
  account_name?: string;
  date?: string;
  remark?: string;
  lang?: string;
  user_id?: number;
  transaction_image?: string;
}) {
  return request<{ success?: boolean; data?: any; message?: string }>("/withdraws", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ---------- External live data ----------

export function get2DResultLive() {
  return fetch("https://luke.2dboss.com/api/luke/twod-result-live")
    .then((r) => r.json())
    .catch(() => null);
}

export function getFootballLive() {
  return fetch("https://back.mandalarthu.com/api/football-live-matches-api")
    .then((r) => r.json())
    .catch(() => null);
}

// ---------- Live rooms (Shan Ko Mee / ဘီကင် — original /user/skm-rooms, /user/bugyee-rooms) ----------
// Verified 2026-08-16: GET /shankomee-data?params{id,level,balance,info{nickname,profile:3}}
// returns {status:"ok", gameURL:"https://spacetech-skm-landscape.qianxu168.com/?id=..&passcode=..&domain=buffalo688&game=ShanKoeMee&key=..&exit=.."}
// GET /bugyee-new-data same shape -> http://165.22.110.56/bugyee_game/?id=..&passcode=..&exit=.. (may return HTML admin page on server side right now — caller must handle non-JSON)

export interface RoomData {
  status?: string;
  gameURL?: string;
  gameUrl?: string;
  success?: boolean;
  message?: string;
  description?: string;
}

export function getShanKoMeeData(params: { id: string; level: number; balance: number; nickname: string }) {
  const qs =
    `id=${encodeURIComponent(params.id)}` +
    `&level=${params.level}` +
    `&balance=${params.balance}` +
    `&info=${encodeURIComponent(JSON.stringify({ nickname: params.nickname, profile: 3 }))}`;
  return request<RoomData>(`/shankomee-data?${qs}`);
}

export function getBugyeeData(params: { id: string; level: number; balance: number; nickname: string }) {
  const qs =
    `id=${encodeURIComponent(params.id)}` +
    `&level=${params.level}` +
    `&balance=${params.balance}` +
    `&info=${encodeURIComponent(JSON.stringify({ nickname: params.nickname, profile: 3 }))}`;
  return request<RoomData>(`/bugyee-new-data?${qs}`);
}

// ---------- Buffalo rooms (African Buffalo / တောဒိုက်ကောက်မီး / ဂလုံး / ဂလုံးဂလုံး) ----------
// Verified 2026-08-16 against live bundle (fresh_app.js fetchBuffaloData / fetchForestData /
// fetchGaloneData / fetchGaloneGalone):
//  - GET /buffalo-data      → {status:"ok", gameURL:"https://african-buffalo-v1-02.qianxu168.com/..."}
//  - GET /new-buffalo-data  → {status:"ok", gameURL:"https://shuiniu-v3.shengli888.com/..."}
//  - GET /forest-data?id=&balance=   → same shape (server may lock: {status:"error", description:"..."})
//  - GET /galone-data?id=&balance=   → same shape
//  - GET /galone-galone?id=&balance= → same shape (server route misconfigured right now — treat as error)
// Original shows description in a Burmese alert when status !== ok / no gameURL.

export function getBuffaloData(newVersion = true) {
  return request<RoomData>(newVersion ? "/new-buffalo-data" : "/buffalo-data");
}

export function getForestData(params: { id: string; balance: number }) {
  return request<RoomData>(
    `/forest-data?id=${encodeURIComponent(params.id)}&balance=${params.balance}`
  );
}

export function getGalangaluData(params: { id: string; balance: number }) {
  return request<RoomData>(
    `/galone-data?id=${encodeURIComponent(params.id)}&balance=${params.balance}`
  );
}

export function getGaloneGaloneData(params: { id: string; balance: number }) {
  return request<RoomData>(
    `/galone-galone?id=${encodeURIComponent(params.id)}&balance=${params.balance}`
  );
}

// ============================================================
// Betslip / ကစားမှတ်တမ်း (original site: /betslip-history)
// The original frontend (BetslipHistory.vue in app.js) fetches LOTTERY
// voucher history from three endpoints — these are the real per-user
// betting records the original site shows users. Verified 2026-08-16:
//  - POST /vouchers/datas/all  {draw, date, search, isBingo, type}
//  - POST /fb-vouchers-history {draw_date, type}
//  - POST /vouchers/datas      {voucher_id, type}  (slip detail)
// Endpoints return 200 even when the account has no bets ({success:true,data:[]}).
// ============================================================
export interface BetSlipRecord {
  id?: number;
  type?: string;
  total_amount?: number | string;
  bingo_amount?: number | string;
  name?: string;
  remark?: string;
  created_at?: string;
  team_vouchers?: unknown[];
  isBet?: boolean;
  [key: string]: unknown;
}

export function getVouchersAll(params: {
  draw: string;
  date: string;
  search?: string;
  isBingo?: boolean;
  type: string;
}) {
  return request<{ success?: boolean; data?: BetSlipRecord[]; total?: number }>(
    "/vouchers/datas/all",
    {
      method: "POST",
      body: JSON.stringify({
        draw: params.draw,
        date: params.date,
        search: params.search ?? "",
        isBingo: params.isBingo ?? false,
        type: params.type,
      }),
    }
  );
}

export function getFBVouchersHistory(params: { draw_date: string; type: string }) {
  return request<{ success?: boolean; data?: BetSlipRecord[]; total?: number }>(
    "/fb-vouchers-history",
    {
      method: "POST",
      body: JSON.stringify({ draw_date: params.draw_date, type: params.type }),
    }
  );
}

export function getSlipDetail(params: { voucher_id: number | string; type: string }) {
  return request<{ success?: boolean; data?: unknown }>(
    "/vouchers/datas",
    {
      method: "POST",
      body: JSON.stringify({ voucher_id: params.voucher_id, type: params.type }),
    }
  );
}

/* ============================================================
   Lottery / Football / VIP / Commission / Promotion / Contact / Banking
   (original app.js endpoints — verified against live API Aug 16)
   ============================================================ */
export interface LotteryDataRecord {
  id?: number;
  name?: string;
  type?: string;
  value?: string;
  price?: number;
  time?: string;
  created_at?: string;
  [k: string]: unknown;
}

/** 2D — buy/home options */
export function get2DData() {
  return request<{ success?: boolean; data?: LotteryDataRecord[] }>("/2d/data", { method: "GET" });
}
/** 3D live data */
export function get2DDataLive() {
  return request<{ success?: boolean; data?: LotteryDataRecord[] }>("/2d/data/live", { method: "GET" });
}
/** 3D buy options */
export function get3DData() {
  return request<{ success?: boolean; data?: LotteryDataRecord[] }>("/3d/data", { method: "GET" });
}
/** 2D results / closed days / winners / data-table statistics */
export function get2DHistory() {
  return request<{ success?: boolean; data?: LotteryDataRecord[]; total?: number }>("/twod_history", { method: "GET" });
}
/** 3D results */
export function get3DHistory() {
  return request<{ success?: boolean; data?: LotteryDataRecord[] }>("/threed_history", { method: "GET" });
}
/** Dream book meanings (2D / 3D) */
export function getDreamBook2D() {
  return request<{ data?: LotteryDataRecord[] }>("/dreamBook/2d", { method: "GET" });
}
export function getDreamBook3D() {
  return request<{ data?: LotteryDataRecord[] }>("/dreamBook/3d", { method: "GET" });
}
/** Football betting feed (မောင်း / ဘော်ဒီ) */
export function getFootball() {
  return request<{ status?: string; data?: unknown[] }>("/football", { method: "GET" });
}
/** VIP levels */
export function getVipLevels() {
  return request<{ data?: unknown[]; success?: boolean }>("/user/levels", { method: "GET" });
}
/** Claim VIP reward */
export function claimVipReward(params: { amount?: number } = {}) {
  return request<{ success?: string; error?: string; message?: string }>("/user/claim-reward", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
/** Affiliate commission info */
export function getCommissionInfo() {
  return request<{ data?: unknown }>("/user/commission-info", { method: "GET" });
}
/** Transfer commission earnings to balance */
export function transferCommission() {
  return request<{ success?: string; error?: string; message?: string }>("/transferComToUserAmount", {
    method: "POST",
  });
}
/** Promotions */
export function getPromotions() {
  return request<{ data?: unknown[]; success?: boolean }>("/promotions", { method: "GET" });
}
/** Website info (contact numbers / notice) */
export function getWebsiteInfos() {
  return request<{ success?: boolean; data?: { id?: number; noticeText?: string; viber_number?: string; telegram_username?: string; [k: string]: unknown }[] }>("/website-infos", { method: "GET" });
}
/** User's own bank accounts (Banking /user_bank) */
export function getUserBankAccounts() {
  return request<{ data?: { id?: number; bank_name?: string; account_name?: string; account_number?: string; type?: string; [k: string]: unknown }[] }>("/user_bank", { method: "GET" });
}

/* ---------- 2D/3D betting ---------- */
export function get2DNumbers(params: { limit?: string; drawTime?: string } = {}) {
  return request<{ success?: boolean; data?: unknown[]; total?: number }>("/twod_numbers", {
    method: "POST",
    body: JSON.stringify({ limit: params.limit ?? "all", drawTime: params.drawTime ?? "12:00" }),
  });
}
export function get3DNumbers() {
  return request<{ success?: boolean; data?: unknown[] }>("/threed_numbers", {
    method: "POST",
    body: JSON.stringify({ limit: "all" }),
  });
}
/** Check current user's open vouchers for a type (length of active bets) */
export function checkVouchers(type: "twod" | "threed") {
  return request<{ voucherLength?: number; data?: unknown }>(
    "/vouchers/check",
    { method: "POST", body: JSON.stringify({ type }) },
    // this endpoint is known to be flaky on the live server ("id on null"); callers should handle error gracefully
  );
}

/** Create 2D/3D lottery voucher (original POST /vouchers — admin or sufficient balance) */
export function createVoucher(params: {
  type: string;
  numbers: string[];
  amount_per_number?: number;
  draw_time?: string;
  draw_date?: string;
  [k: string]: unknown;
}) {
  return request<{ success?: boolean; error?: string; message?: string; data?: unknown }>(
    "/vouchers",
    { method: "POST", body: JSON.stringify(params) }
  );
}
/** Create football (မောင်း/ဘော်ဒီ/1x2) voucher (original POST /fb-vouchers) */
export function createFBVoucher(params: {
  type: string;
  match_id?: number | string;
  team_vouchers?: unknown[];
  amount?: number;
  [k: string]: unknown;
}) {
  return request<{ success?: boolean; error?: string; message?: string; data?: unknown }>(
    "/fb-vouchers",
    { method: "POST", body: JSON.stringify(params) }
  );
}
