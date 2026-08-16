/**
 * Buffalo688 — Midnight Vault rebuild, routes.
 * NO service worker, NO manifest link, NO install prompt anywhere in this app.
 * Root "/" serves the new React home. Deep links /auth/* forward to login/register.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { getToken } from "./lib/api";
import { Login, Register } from "./pages/Auth";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Rooms from "./pages/Rooms";
import BuffaloRooms from "./pages/BuffaloRooms";
import { Deposit, Withdraw, TransactionHistory } from "./pages/Money";
import BetHistory from "./pages/BetHistory";
import Profile from "./pages/Profile";
import OriginalHome from "./pages/OriginalHome";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, fetched } = useAuth();
  // Wait for the initial profile check to finish before redirecting. On a
  // hard reload the stored token may be valid, but the user profile fetch
  // needs a moment — redirecting early creates the "login ဝင့်ပီးလဲ login"
  // loop. After the safety valve (8s) a token-bearing visitor is never
  // bounced back to /login even if the profile fetch timed out: the page
  // renders and will self-recover once the profile lands.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, []);
  if (loading && !visible) return null;
  // If we waited through the whole session check and have NO stored token,
  // the visitor is genuinely logged out → /login. With a token present but
  // profile still null (network timeout), let the page render instead of
  // trapping the user on the login screen.
  const hasToken = !!getToken();
  if (fetched && !user && !hasToken) return <Redirect to="/login" />;
  return <>{children}</>;
}

function DeepLinkForward() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (location.startsWith("/auth/")) {
      const target = location.includes("register") ? "/register" : "/login";
      navigate(target, { replace: true });
    }
  }, [location, navigate]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        <Home />
      </Route>
      <Route path={"/login"}>
        <Login />
      </Route>
      <Route path={"/register"}>
        <Register />
      </Route>
      <Route path={"/game/:provider/:game"}>
        <RequireAuth><Game /></RequireAuth>
      </Route>
      <Route path={"/game/:provider"}>
        <RequireAuth><Game /></RequireAuth>
      </Route>
      <Route path={/^\/rooms\/(skm|bugyee)$/}>
        <RequireAuth><Rooms /></RequireAuth>
      </Route>
      <Route path={/^\/rooms\/(buffalo|buffalo_old|forest|galangalu|galone_galone)$/}>
        <RequireAuth><BuffaloRooms /></RequireAuth>
      </Route>
      <Route path={"/deposit"}>
        <RequireAuth><Deposit /></RequireAuth>
      </Route>
      <Route path={"/withdraw"}>
        <RequireAuth><Withdraw /></RequireAuth>
      </Route>
      <Route path={"/transaction"}>
        <RequireAuth><TransactionHistory mode="all" /></RequireAuth>
      </Route>
      <Route path={"/history"}>
        <RequireAuth><TransactionHistory mode="all" /></RequireAuth>
      </Route>
      <Route path={"/profile"}>
        <RequireAuth><Profile /></RequireAuth>
      </Route>
      <Route path={"/bet-history"}>
        <RequireAuth><BetHistory /></RequireAuth>
      </Route>
      <Route path={"/original"}>
        <OriginalHome />
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route>
        <DeepLinkForward />
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-center" />
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
