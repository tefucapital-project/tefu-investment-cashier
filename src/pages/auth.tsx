import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthFrame } from "../components/shell";
import { Banner, Button, TextField } from "../components/ui";
import { useCashier } from "../context/CashierState";
import { api } from "../lib/api";

export function LoginPage() {
  const { cashier, login } = useCashier();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (cashier) return <Navigate to="/" replace />;

  return (
    <AuthFrame title="Cashier sign in" lede="Only provisioned cashier accounts can open a till and post credits.">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await login(email, password);
            navigate("/");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <TextField label="Email or staff ID" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <div className="relative">
          <TextField
            label="Password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="button" className="absolute right-4 top-10 text-xs text-canopy" onClick={() => setShow((v) => !v)}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="text-canopy">
            Forgot password
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthFrame>
  );
}

export function ForgotPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  return (
    <AuthFrame title="Reset password" lede="We issue a time-limited code to the email on the cashier account.">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
          setInfo(result.message);
        }}
      >
        {info ? <Banner tone="ok">{info}</Banner> : null}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" className="w-full">
          Send code
        </Button>
        <Link to="/login" className="block text-center text-sm text-canopy">
          Back to sign in
        </Link>
      </form>
    </AuthFrame>
  );
}
