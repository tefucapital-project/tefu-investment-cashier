import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Banner, Button, Empty, Loading, Panel, SelectField, StatusPill, TextArea, TextField } from "../components/ui";
import { useCashier } from "../context/CashierState";
import { api, money, uid } from "../lib/api";

export function DepositPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState(params.get("customerId") ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [externalReference, setExternalReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => uid());

  return (
    <Panel title="Record deposit">
      <p className="mb-4 text-sm text-muted">A deposit records funds received. It does not by itself spendably credit a wallet.</p>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {ok ? <Banner tone="ok">{ok}</Banner> : null}
      <form
        className="grid max-w-xl gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setOk("");
          try {
            const result = await api<{ reference: string }>("/deposits", {
              method: "POST",
              idempotencyKey,
              body: JSON.stringify({
                customerId: customerId || undefined,
                amount: Number(amount),
                method,
                externalReference,
                note: note || undefined,
              }),
            });
            setOk(`Deposit ${result.data.reference} recorded.`);
            setAmount("");
            setExternalReference("");
            setNote("");
            setIdempotencyKey(uid());
          } catch (err) {
            setError(err instanceof Error ? err.message : "Deposit failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <TextField label="Customer ID (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <TextField label="Amount (NGN)" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <SelectField label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
        </SelectField>
        <TextField label="External reference" value={externalReference} onChange={(e) => setExternalReference(e.target.value)} />
        <TextArea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Record deposit"}</Button>
          <Button type="button" className="bg-canopy" onClick={() => navigate("/customers")}>Find customer</Button>
        </div>
      </form>
    </Panel>
  );
}

type CreditRow = {
  id: string;
  reference: string;
  amount: number;
  source: string;
  status: string;
  purpose: string;
  externalReference: string;
  customerName: string;
  accountMasked: string;
  createdAt: string;
  postedAt: string | null;
};

export function TransactionsPage() {
  const [rows, setRows] = useState<CreditRow[] | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = status ? `?status=${status}` : "";
    api<CreditRow[]>(`/credits${query}`)
      .then((result) => setRows(result.data))
      .catch((err) => setError(err.message));
  }, [status]);

  return (
    <Panel
      title="Transaction history"
      action={
        <select className="rounded-full border border-line bg-paper px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="POSTED">Posted</option>
          <option value="PENDING_APPROVAL">Pending approval</option>
          <option value="REJECTED">Rejected</option>
        </select>
      }
    >
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {rows == null ? <Loading /> : rows.length === 0 ? <Empty>No transactions yet.</Empty> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="py-3"><Link className="text-canopy" to={`/transactions/${item.id}`}>{item.reference}</Link></td>
                  <td className="py-3">{item.customerName}</td>
                  <td className="py-3">{money(item.amount)}</td>
                  <td className="py-3"><StatusPill status={item.status} /></td>
                  <td className="py-3">{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function TransactionDetailPage() {
  const { creditId } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Record<string, unknown>>(`/credits/${creditId}`)
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message));
  }, [creditId]);

  if (error) return <Banner tone="danger">{error}</Banner>;
  if (!data) return <Loading />;

  return (
    <Panel
      title="Transaction details"
      action={<Link to={`/transactions/${creditId}/receipt`} className="rounded-full bg-forest px-4 py-2 text-sm text-gold2">Receipt</Link>}
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <dt className="text-muted">{key}</dt>
            <dd className="mt-1 break-all font-medium text-forest">{String(value ?? "—")}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function PendingPage() {
  const [rows, setRows] = useState<Array<{ id: string; reference: string; amount: number; customerName: string; purpose: string; createdAt: string }> | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function load() {
    const result = await api<typeof rows extends null ? never : NonNullable<typeof rows>>("/pending");
    setRows(result.data);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  return (
    <Panel title="Pending approvals">
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {info ? <Banner tone="ok">{info}</Banner> : null}
      {rows == null ? <Loading /> : rows.length === 0 ? <Empty>No pending credits.</Empty> : (
        <div className="space-y-3">
          {rows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-cream/40 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-forest">{item.customerName}</p>
                  <p className="text-sm text-muted">{item.reference} · {money(item.amount)} · {item.purpose}</p>
                </div>
                <Button
                  className="bg-danger text-paper"
                  onClick={async () => {
                    try {
                      await api(`/pending/${item.id}/withdraw`, { method: "POST" });
                      setInfo("Pending credit withdrawn.");
                      await load();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Withdraw failed.");
                    }
                  }}
                >
                  Withdraw request
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function ReconciliationPage() {
  const [data, setData] = useState<{
    shift: {
      id: string;
      status: string;
      openedAt: string;
      openingFloat: number;
      cashReceived: number;
      transfersReceived: number;
      postedCredits: number;
      pendingCount: number;
      countedCash: number | null;
      variance: number | null;
      varianceReason: string | null;
    };
  } | null>(null);
  const [countedCash, setCountedCash] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    api<NonNullable<typeof data>>("/reconciliation")
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Banner tone="danger">{error}</Banner>;
  if (!data) return <Loading label="Loading reconciliation…" />;
  const shift = data.shift;

  return (
    <Panel title="Daily reconciliation">
      {info ? <Banner tone="ok">{info}</Banner> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Opening float", money(shift.openingFloat)],
          ["Cash received", money(shift.cashReceived)],
          ["Transfers received", money(shift.transfersReceived)],
          ["Posted credits", money(shift.postedCredits)],
          ["Pending count", String(shift.pendingCount)],
          ["Shift status", shift.status],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-cream/50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="mt-1 font-serif text-2xl text-forest">{value}</p>
          </div>
        ))}
      </div>
      {shift.status === "CLOSED" ? (
        <div className="mt-4"><Banner tone="neutral">This shift is closed and read-only. Counted cash {shift.countedCash == null ? "—" : money(shift.countedCash)}.</Banner></div>
      ) : (
        <form
          className="mt-5 grid max-w-xl gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const result = await api<{ variance: number }>("/reconciliation/close", {
                method: "POST",
                body: JSON.stringify({
                  countedCash: Number(countedCash),
                  varianceReason: varianceReason || undefined,
                  note: note || undefined,
                }),
              });
              setInfo(`Shift closed. Variance ${money(result.data.variance)}.`);
              const refreshed = await api<NonNullable<typeof data>>("/reconciliation");
              setData(refreshed.data);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Close failed.");
            }
          }}
        >
          {error ? <Banner tone="danger">{error}</Banner> : null}
          <TextField label="Counted closing cash (NGN)" type="number" min="0" step="0.01" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
          <TextArea label="Variance reason (required if mismatch)" value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} />
          <TextArea label="Close note" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit">Close shift</Button>
        </form>
      )}
    </Panel>
  );
}

export function NotificationsPage() {
  const [rows, setRows] = useState<Array<{ id: string; title: string; body: string; createdAt: string }> | null>(null);
  useEffect(() => {
    api<NonNullable<typeof rows>>("/notifications").then((result) => setRows(result.data)).catch(() => setRows([]));
  }, []);
  return (
    <Panel title="Notifications">
      {rows == null ? <Loading /> : rows.length === 0 ? <Empty>No notifications yet.</Empty> : (
        <ul className="space-y-3">
          {rows.map((item) => (
            <li key={item.id} className="rounded-2xl border border-line px-4 py-3">
              <p className="font-medium text-forest">{item.title}</p>
              <p className="text-sm text-muted">{item.body}</p>
              <p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ProfilePage() {
  const { cashier, refresh } = useCashier();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!cashier) return null;
  return (
    <div className="space-y-6">
      <Panel title="Cashier profile">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Name</dt><dd>{cashier.firstName} {cashier.lastName}</dd></div>
          <div><dt className="text-muted">Staff ID</dt><dd>{cashier.staffId}</dd></div>
          <div><dt className="text-muted">Branch</dt><dd>{cashier.branch}</dd></div>
          <div><dt className="text-muted">Email</dt><dd>{cashier.email}</dd></div>
          <div><dt className="text-muted">Single limit</dt><dd>{money(cashier.singleLimit)}</dd></div>
          <div><dt className="text-muted">Daily limit</dt><dd>{money(cashier.dailyLimit)}</dd></div>
        </dl>
      </Panel>
      <Panel title="Change password">
        {message ? <Banner tone="ok">{message}</Banner> : null}
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <form
          className="grid max-w-md gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setMessage("");
            try {
              await api("/profile/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
              setMessage("Password updated.");
              setCurrentPassword("");
              setNewPassword("");
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Update failed.");
            }
          }}
        >
          <TextField label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <TextField label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="At least 8 characters with a letter and a number." />
          <Button type="submit">Update password</Button>
        </form>
      </Panel>
    </div>
  );
}

export function HelpPage() {
  return (
    <Panel title="Help and support">
      <div className="space-y-4 text-sm leading-6 text-muted">
        <p>Credits only post after backend validation. If a request times out, check History before retrying.</p>
        <p>Duplicate external references are blocked. Open the existing transaction instead of creating another credit.</p>
        <p>Wrong recipient: do not edit the ledger. Submit a reversal request through support with the original reference.</p>
        <p>Contact support with the transaction reference. Never ask anyone to change balances outside the portal.</p>
      </div>
    </Panel>
  );
}

export function PolicyPage() {
  return (
    <Panel title="Cashier operating policy">
      <div className="space-y-4 text-sm leading-6 text-muted">
        <p>Acceptable evidence: physical cash counted into till, or a server-verified bank/payment reference. Screenshots alone are not definitive proof.</p>
        <p>Adjustments and high-value credits require an independent approver who is not the initiating cashier.</p>
        <p>Close every shift with counted cash. Explain any variance before the shift becomes read-only.</p>
        <p>Escalate fraud, disputes, and outages to Finance or Compliance. Do not bypass limits or approval queues.</p>
      </div>
    </Panel>
  );
}
