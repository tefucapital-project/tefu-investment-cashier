import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Banner, Button, Empty, Loading, Panel, StatusPill, TextField } from "../components/ui";
import { api, money } from "../lib/api";

type SearchRow = {
  id: string;
  accountMasked: string;
  fullName: string;
  emailMasked: string;
  phoneMasked: string | null;
  status: string;
  eligible: boolean;
  available: number;
};

type CustomerDetail = SearchRow & {
  verificationStatus: string;
  pending: number;
  restrictions: string[];
  recentCredits: Array<{ reference: string; amount: number; source: string; postedAt: string | null }>;
};

export function CustomerSearchPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<SearchRow[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Panel title="Customer search">
      <form
        className="mb-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await api<{ results: SearchRow[] }>(`/customers/search?q=${encodeURIComponent(q)}`);
            setRows(result.data.results);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed.");
            setRows([]);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex-1">
          <TextField label="Search by name, email, phone, or customer ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="submit" className="sm:mt-7" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </Button>
      </form>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {rows == null ? null : rows.length === 0 ? (
        <Empty>No matching customer found.</Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cream/40 px-4 py-3">
              <div>
                <p className="font-medium text-forest">{row.fullName}</p>
                <p className="text-sm text-muted">
                  {row.accountMasked} · {row.emailMasked} · {row.phoneMasked ?? "No phone"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={row.status} />
                <Link to={`/customers/${row.id}`} className="rounded-full bg-forest px-4 py-2 text-sm text-gold2">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<CustomerDetail>(`/customers/${customerId}`)
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message));
  }, [customerId]);

  if (error) return <Banner tone="danger">{error}</Banner>;
  if (!data) return <Loading label="Loading customer account…" />;

  return (
    <div className="space-y-6">
      <Panel title={data.fullName}>
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="text-sm text-muted">Account</p>
          <p className="text-sm">{data.accountMasked}</p>
          <p className="text-sm text-muted">Status</p>
          <StatusPill status={data.status} />
          <p className="text-sm text-muted">Verification</p>
          <p className="text-sm">{data.verificationStatus.replaceAll("_", " ")}</p>
          <p className="text-sm text-muted">Available</p>
          <p className="text-sm font-medium">{money(data.available)}</p>
          <p className="text-sm text-muted">Pending / locked</p>
          <p className="text-sm">{money(data.pending)}</p>
        </div>
        {data.restrictions.length ? (
          <div className="mt-4">
            <Banner tone="warn">{data.restrictions.join(" ")}</Banner>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={!data.eligible} onClick={() => navigate(`/credit?customerId=${data.id}`)}>
            Credit Account
          </Button>
          <Button className="bg-canopy" onClick={() => navigate(`/deposits?customerId=${data.id}`)}>
            Record Deposit
          </Button>
        </div>
      </Panel>
      <Panel title="Recent posted credits">
        {data.recentCredits.length === 0 ? (
          <Empty>No recent cashier credits for this account.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.recentCredits.map((item) => (
              <li key={item.reference} className="flex justify-between border-b border-line py-2">
                <span>
                  {item.reference} · {item.source.replaceAll("_", " ")}
                </span>
                <span>{money(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
