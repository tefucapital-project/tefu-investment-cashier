import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banner, Empty, Loading, Panel, StatusPill } from "../components/ui";
import { api, money } from "../lib/api";

type Dashboard = {
  totals: {
    postedCredits: number;
    cashReceived: number;
    transfersReceived: number;
    pendingApprovals: number;
    rejectedCredits: number;
    completedTransactions: number;
  };
  latest: Array<{
    id: string;
    reference: string;
    amount: number;
    status: string;
    source: string;
    customerName: string;
    createdAt: string;
  }>;
};

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dashboard>("/dashboard")
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Banner tone="danger">{error}</Banner>;
  if (!data) return <Loading label="Loading shift summary…" />;

  const cards = [
    ["Posted credits today", money(data.totals.postedCredits)],
    ["Cash received", money(data.totals.cashReceived)],
    ["Transfers received", money(data.totals.transfersReceived)],
    ["Pending approvals", String(data.totals.pendingApprovals)],
    ["Rejected credits", String(data.totals.rejectedCredits)],
    ["Completed transactions", String(data.totals.completedTransactions)],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-[24px] border border-line bg-paper p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-2 font-serif text-3xl text-forest">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/customers" className="rounded-full bg-forest px-5 py-2.5 text-sm text-gold2">
          Search User
        </Link>
        <Link to="/credit" className="rounded-full bg-gold px-5 py-2.5 text-sm text-forest">
          Credit Account
        </Link>
        <Link to="/deposits" className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm text-forest">
          Record Deposit
        </Link>
        <Link to="/reconciliation" className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm text-forest">
          Reconcile Shift
        </Link>
      </div>

      <Panel title="Latest transactions">
        {data.latest.length === 0 ? (
          <Empty>No cashier credits yet in this session.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-3 font-medium">Reference</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.latest.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="py-3">
                      <Link to={`/transactions/${item.id}`} className="text-canopy">
                        {item.reference}
                      </Link>
                    </td>
                    <td className="py-3">{item.customerName}</td>
                    <td className="py-3">{money(item.amount)}</td>
                    <td className="py-3">{item.source.replaceAll("_", " ")}</td>
                    <td className="py-3">
                      <StatusPill status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
