import type { ReactNode } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useCashier } from "../context/CashierState";
import { Button, Logo } from "./ui";

const links = [
  ["/", "Dashboard"],
  ["/customers", "Customer Search"],
  ["/credit", "Credit Account"],
  ["/deposits", "Record Deposit"],
  ["/transactions", "History"],
  ["/pending", "Pending Approvals"],
  ["/reconciliation", "Reconcile Shift"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
  ["/help", "Help"],
  ["/policy", "Operating Policy"],
] as const;

export function CashierLayout() {
  const { ready, cashier, logout } = useCashier();
  if (!ready) return <div className="grid min-h-screen place-items-center text-muted">Opening cashier desk…</div>;
  if (!cashier) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="forest-panel px-5 py-6 text-gold2">
        <Logo light />
        <p className="mt-3 text-xs text-white/60">
          {cashier.staffId} · {cashier.branch}
        </p>
        <nav className="mt-8 space-y-1">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `block rounded-2xl px-3 py-2.5 text-sm ${isActive ? "bg-white/10 text-gold2" : "text-white/70 hover:bg-white/5 hover:text-white"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <Button className="mt-8 w-full bg-gold text-forest hover:bg-gold2" onClick={() => logout()}>
          Log out
        </Button>
      </aside>
      <main className="px-5 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Cashier desk</p>
            <h1 className="font-serif text-3xl text-forest">
              {cashier.firstName} {cashier.lastName}
            </h1>
          </div>
          <p className="text-sm text-muted">
            Shift {cashier.shift.status.toLowerCase()} · single limit ₦{cashier.singleLimit.toLocaleString("en-NG")}
          </p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export function AuthFrame({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="forest-panel hidden flex-col justify-between p-12 text-gold2 lg:flex">
        <Logo light />
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Verified funds only</p>
          <h1 className="mt-4 max-w-md font-serif text-5xl leading-[1.05] text-white">Credit with evidence. Reconcile every shift.</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
            No spendable balance without verified cash, a settled transfer, or an independently approved adjustment.
          </p>
        </div>
        <p className="text-xs text-white/50">Tefu Investment · Cashier portal</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-serif text-4xl text-forest">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{lede}</p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </div>
  );
}
