/**
 * Buffalo688 rebuild — authentication state (original code).
 * Tokens live on api.buffalo688.net; this client keeps only the bearer token
 * and a lightweight profile cache. No install prompts anywhere.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getProfile, getToken, setToken } from "@/lib/api";

export interface BfUser {
  id?: number;
  amount?: string | number;
  balance?: number | undefined;
  user_name?: string;
  username?: string;
  name?: string;
  phone?: string;
  total_bet_amount?: number;
  turn_over_amount?: string;
}

interface AuthContextValue {
  user: BfUser | null;
  loading: boolean;
  refreshing: boolean;
  fetched: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshBalance: () => Promise<number>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BfUser | null>(null);
  // loading only stays true while a hard-reload profile fetch is in flight;
  // the guard must never redirect during that window.
  const [loading, setLoading] = useState(() => !!getToken());
  const [refreshing, setRefreshing] = useState(false);
  // whether the profile check (hard reload or fresh login) has completed
  const fetchedRef = useRef(false);
  const [fetched, setFetched] = useState(false);
  // ref-based flag so login() can mark the guard safe synchronously
  const [authedRef] = useState(() => !!getToken());

  // Live response: {status, data:{id, amount, user_name, name, phone, bank, ...}, totalWithdraw}
  const fetchUser = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await getProfile();
      const data = (res?.data ?? res) as BfUser | undefined;
      if (data) {
        setUser({
          ...data,
          username: data.user_name ?? data.username ?? data.name,
          balance: Number(data.amount ?? data.balance ?? 0),
        });
        return data;
      }
      throw new Error("empty profile");
    } catch (err: any) {
      // Only drop auth state when the server explicitly rejected the token
      // (401 / invalid credentials). Transient network errors must NOT
      // log the user out on reload.
      if (err?.status === 401 || /invalid|credential/i.test(err?.message ?? "")) {
        setToken(null);
        setUser(null);
      }
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      // Live API has no standalone balance endpoint; fetch fresh user profile.
      const res = await getProfile();
      const data = (res?.data ?? res) as BfUser | undefined;
      const b = Number(data?.amount ?? 0);
      setUser((u) => (u ? { ...u, balance: b } : u));
      return b;
    } catch {
      return user?.balance ?? 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchUser();
      fetchedRef.current = true;
      if (active) {
        setLoading(false);
        setFetched(true);
      }
      fetchBalance();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    fetchedRef.current = true;
    setFetched(true);
    await fetchBalance();
    setRefreshing(false);
  }, [fetchUser, fetchBalance]);

  const refreshBalance = useCallback(async () => {
    return fetchBalance();
  }, [fetchBalance]);

  const login = useCallback((token: string, username?: string) => {
    setToken(token);
    // Persist the username too — on a hard refresh the profile fetch may take
    // a moment, so the login page can auto-fill saved credentials instead of
    // showing an empty screen. Uses localStorage so it survives session end.
    if (username) {
      try {
        localStorage.setItem("bf688_username", username);
      } catch { /* noop */ }
    }
    // Mark the guard safe immediately: the token is stored, so a redirect
    // to /login during the profile fetch would be wrong.
    fetchedRef.current = true;
    setFetched(true);
    setUser(null);
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    fetchedRef.current = true;
    setFetched(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshing, fetched, login, logout, refreshUser, refreshBalance }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
