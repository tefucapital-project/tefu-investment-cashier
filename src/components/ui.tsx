import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`font-serif text-2xl tracking-tight ${light ? "text-gold2" : "text-forest"}`}>
      Tefu <span className={`text-xs uppercase tracking-[0.28em] ${light ? "text-gold" : "text-gold"}`}>Cashier</span>
    </div>
  );
}

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-gold2 transition hover:bg-canopy disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function GhostButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium text-forest transition hover:bg-cream disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        className="w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none ring-forest/20 focus:ring-4"
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select className="w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none ring-forest/20 focus:ring-4" {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <textarea className="w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none ring-forest/20 focus:ring-4" rows={4} {...props} />
    </label>
  );
}

export function Banner({ tone = "warn", children }: { tone?: "warn" | "danger" | "ok" | "neutral"; children: ReactNode }) {
  const styles = {
    warn: "border-gold/40 bg-gold2/40 text-ink",
    danger: "border-danger/30 bg-danger/10 text-danger",
    ok: "border-ok/30 bg-ok/10 text-ok",
    neutral: "border-line bg-cream text-ink",
  };
  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${styles[tone]}`}>{children}</div>;
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "POSTED" || status === "OPEN" || status === "ACTIVE"
      ? "bg-ok/10 text-ok"
      : status.includes("PENDING")
        ? "bg-warn/10 text-warn"
        : status === "REJECTED" || status === "FAILED" || status === "SUSPENDED"
          ? "bg-danger/10 text-danger"
          : "bg-line text-muted";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-line bg-paper p-5 shadow-[0_18px_50px_rgba(20,36,28,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-forest">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-cream/60 px-4 py-8 text-center text-sm text-muted">{children}</p>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="text-sm text-muted">{label}</p>;
}
