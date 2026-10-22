import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Banner, Button, GhostButton, Panel, SelectField, TextArea, TextField } from "../components/ui";
import { api, money, uid } from "../lib/api";

type Customer = {
  id: string;
  fullName: string;
  accountMasked: string;
  eligible: boolean;
  available: number;
  status: string;
};

type CreditResult = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  amountWords: string;
  customerName: string;
  accountMasked: string;
  source: string;
  posted?: boolean;
  ledgerReference?: string | null;
  postedAt?: string | null;
  purpose?: string;
  externalReference?: string;
  cashierName?: string;
};

export function CreditPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const customerId = params.get("customerId") ?? "";
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("CASH");
  const [externalReference, setExternalReference] = useState("");
  const [purpose, setPurpose] = useState("Cashier wallet credit");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const idempotencyKey = useMemo(() => uid(), []);

  useEffect(() => {
    if (!customerId) return;
    api<Customer>(`/customers/${customerId}`)
      .then((result) => setCustomer(result.data))
      .catch((err) => setError(err.message));
  }, [customerId]);

  async function submit() {
    if (!customer) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<CreditResult>("/credits", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify({
          customerId: customer.id,
          amount: Number(amount),
          source,
          externalReference,
          purpose,
          evidenceNote: evidenceNote || undefined,
          confirm: true,
        }),
      });
      navigate(`/transactions/${result.data.id}/receipt`, { state: result.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credit failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!customerId) {
    return (
      <Panel title="Credit account">
        <Banner tone="neutral">Search and confirm a customer before opening the credit form.</Banner>
        <Link to="/customers" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm text-gold2">
          Search customers
        </Link>
      </Panel>
    );
  }

  if (!customer) return <p className="text-sm text-muted">Loading customer…</p>;

  if (!customer.eligible) {
    return (
      <Panel title="Credit blocked">
        <Banner tone="danger">Account restricted ({customer.status}). Ordinary credits are blocked.</Banner>
      </Panel>
    );
  }

  if (step === "confirm") {
    return (
      <Panel title="Confirm credit">
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <dl className="mt-2 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted">Customer</dt><dd>{customer.fullName}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Account</dt><dd>{customer.accountMasked}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Amount</dt><dd>{money(Number(amount) || 0)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Source</dt><dd>{source.replaceAll("_", " ")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">External reference</dt><dd>{externalReference}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Purpose</dt><dd>{purpose}</dd></div>
        </dl>
        <div className="mt-4">
          <Banner tone="warn">
            {source === "ADJUSTMENT" || Number(amount) > 250000
              ? "This request may require independent approval before funds become spendable."
              : "Confirm only if funds were received or an approved adjustment applies."}
          </Banner>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={busy} onClick={submit}>{busy ? "Posting…" : "Confirm credit"}</Button>
          <GhostButton onClick={() => setStep("form")}>Cancel</GhostButton>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Credit account">
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <p className="mb-4 text-sm text-muted">
        {customer.fullName} · {customer.accountMasked} · available {money(customer.available)}
      </p>
      <form
        className="grid max-w-xl gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!amount || Number(amount) <= 0) {
            setError("Enter a positive NGN amount.");
            return;
          }
          if (!externalReference.trim()) {
            setError("Enter the external payment or adjustment reference.");
            return;
          }
          setError("");
          setStep("confirm");
        }}
      >
        <TextField label="Amount (NGN)" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <SelectField label="Source" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="CASH">Cash received</option>
          <option value="BANK_TRANSFER">Verified bank transfer</option>
          <option value="ADJUSTMENT">Approved adjustment</option>
        </SelectField>
        <TextField label="External payment / reference number" value={externalReference} onChange={(e) => setExternalReference(e.target.value)} />
        <TextField label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        <TextArea label="Evidence note (optional)" value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} />
        <Button type="submit">Review credit</Button>
      </form>
    </Panel>
  );
}

export function ReceiptPage() {
  const { creditId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<CreditResult | null>((location.state as CreditResult | null) ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data || !creditId) return;
    api<CreditResult>(`/credits/${creditId}`)
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message));
  }, [creditId, data]);

  if (error) return <Banner tone="danger">{error}</Banner>;
  if (!data) return <p className="text-sm text-muted">Loading receipt…</p>;
  const posted = data.posted || data.status === "POSTED";

  return (
    <Panel
      title="Transaction receipt"
      action={
        <Button className="bg-canopy" onClick={() => window.print()}>
          Print
        </Button>
      }
    >
      <Banner tone={posted ? "ok" : "warn"}>
        {posted ? "Posted. Available balance was updated by the backend." : "Pending approval. This receipt does not mean funds were credited."}
      </Banner>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Institution</dt><dd>Tefu Investment</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Reference</dt><dd>{data.reference}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Customer</dt><dd>{data.customerName}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Account</dt><dd>{data.accountMasked}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Amount</dt><dd>{money(data.amount)} ({data.amountWords})</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Method</dt><dd>{data.source.replaceAll("_", " ")}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Status</dt><dd>{data.status}</dd></div>
      </dl>
      <div className="mt-5 flex gap-3">
        <Button onClick={() => navigate(`/transactions/${data.id}`)}>Details</Button>
        <GhostButton onClick={() => navigate("/")}>Dashboard</GhostButton>
      </div>
    </Panel>
  );
}
