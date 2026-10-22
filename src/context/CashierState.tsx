import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearTokens, hasToken, saveTokens } from "../lib/api";

export type CashierProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  staffId: string;
  branch: string;
  singleLimit: number;
  dailyLimit: number;
  mfaEnabled: boolean;
  shift: { id: string; status: string; openedAt: string };
};

type CashierValue = {
  ready: boolean;
  cashier: CashierProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CashierContext = createContext<CashierValue | null>(null);

export function CashierProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cashier, setCashier] = useState<CashierProfile | null>(null);

  async function refresh() {
    if (!hasToken()) {
      setCashier(null);
      return;
    }
    const result = await api<CashierProfile>("/me");
    setCashier(result.data);
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        clearTokens();
        setCashier(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<CashierValue>(
    () => ({
      ready,
      cashier,
      async login(email, password) {
        const result = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        saveTokens(result.data.accessToken, result.data.refreshToken);
        await refresh();
      },
      async logout() {
        try {
          await api("/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        clearTokens();
        setCashier(null);
      },
      refresh,
    }),
    [ready, cashier],
  );

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
}

export function useCashier() {
  const value = useContext(CashierContext);
  if (!value) throw new Error("CashierProvider missing.");
  return value;
}
