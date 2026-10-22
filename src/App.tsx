import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CashierLayout } from "./components/shell";
import { CashierProvider } from "./context/CashierState";
import { ForgotPage, LoginPage } from "./pages/auth";
import { CreditPage, ReceiptPage } from "./pages/credit";
import { CustomerDetailPage, CustomerSearchPage } from "./pages/customers";
import { DashboardPage } from "./pages/dashboard";
import {
  DepositPage,
  HelpPage,
  NotificationsPage,
  PendingPage,
  PolicyPage,
  ProfilePage,
  ReconciliationPage,
  TransactionDetailPage,
  TransactionsPage,
} from "./pages/ops";

export default function App() {
  return (
    <CashierProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route element={<CashierLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomerSearchPage />} />
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="/credit" element={<CreditPage />} />
            <Route path="/deposits" element={<DepositPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:creditId" element={<TransactionDetailPage />} />
            <Route path="/transactions/:creditId/receipt" element={<ReceiptPage />} />
            <Route path="/pending" element={<PendingPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/policy" element={<PolicyPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CashierProvider>
  );
}
