import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { BitcoinQuotesProvider } from "@/hooks/use-bitcoin-quotes";
import { BtcRateProvider } from "@/hooks/use-btc-rate-context";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import PayrollPage from "@/pages/payroll-page";
import ReimbursementsPage from "@/pages/reimbursements-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import MyExpensesPage from "@/pages/my-expenses-page";
import FilesPage from "@/pages/files-page";
import InvoicesPage from "@/pages/invoices-page";
import ProfilePage from "@/pages/profile-page";
import TimeTrackingPage from "@/pages/time-tracking-page";
import TimeOffPage from "@/pages/time-off-page";
import EmployeesPage from "@/pages/employees-page";
import HelpCenterPage from "@/pages/help-center-page";
import ApiDocumentationPage from "@/pages/api-documentation-page";
import SecurityPage from "@/pages/security-page";
import PrivacyPolicyPage from "@/pages/privacy-policy-page";
import TermsOfServicePage from "@/pages/terms-of-service-page";
import BenefitsPage from "@/pages/benefits-page";
import TaxCompliancePage from "@/pages/tax-compliance-page";
import WithdrawalMethodPage from "@/pages/withdrawal-method-page";
import NotificationsPage from "@/pages/notifications-page";

// Page wrapper components for remaining placeholders
import MessagesPage from "@/pages/messages-page";
import AdminWithdrawalMethodsPage from "@/pages/admin-withdrawal-methods-page";
import AdminApprovalsPage from "@/pages/admin-approvals-page";
import AdminMessagesPage from "@/pages/admin-messages-page";
import PayslipsPage from "@/pages/payslips-page";
import AuditLogsPage from "@/pages/audit-logs-page";
import AdminTaxCompliancePage from "@/pages/admin-tax-compliance-page";
import BulkPayrollPage from "@/pages/bulk-payroll-page";
import AccountingPage from "@/pages/accounting-page";
import TaxComplianceDashboardPage from "@/pages/tax-compliance-dashboard-page";
import CompanyOnboardingPage from "@/pages/company-onboarding-page";
import TestOnboardingPage from "@/pages/test-onboarding-page";
import SimpleOnboardingPage from "@/pages/simple-onboarding-page";
import MinimalOnboardingPage from "@/pages/minimal-onboarding-page";
import BitcoinEducationPage from "@/pages/bitcoin-education-page";
import GettingStartedPage from "@/pages/getting-started-page";
import FAQPage from "@/pages/faq-page";
import SupportPage from "@/pages/support-page";
import WalletPage from "@/pages/wallet-page";
import IntegrationsPage from "@/pages/integrations-page";
import APIAccessPage from "@/pages/api-access-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/payroll" component={PayrollPage} />
      <ProtectedRoute path="/reimbursements" component={ReimbursementsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/my-expenses" component={MyExpensesPage} />
      <ProtectedRoute path="/files" component={FilesPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/time-tracking" component={TimeTrackingPage} />
      <ProtectedRoute path="/time-off" component={TimeOffPage} />
      <ProtectedRoute path="/benefits" component={BenefitsPage} />
      <ProtectedRoute path="/tax-compliance" component={TaxCompliancePage} />
      <ProtectedRoute path="/withdrawal-method" component={WithdrawalMethodPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/withdrawal-methods" component={AdminWithdrawalMethodsPage} />
      <ProtectedRoute path="/approvals" component={AdminApprovalsPage} />
      <ProtectedRoute path="/payslips" component={PayslipsPage} />
      <ProtectedRoute path="/admin-tax-compliance" component={AdminTaxCompliancePage} />
      <ProtectedRoute path="/audit-logs" component={AuditLogsPage} />
      <ProtectedRoute path="/admin-messages" component={AdminMessagesPage} />
      <ProtectedRoute path="/bulk-payroll" component={BulkPayrollPage} />
      <ProtectedRoute path="/accounting" component={AccountingPage} />
      <ProtectedRoute path="/tax-compliance-dashboard" component={TaxComplianceDashboardPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/bitcoin-education" component={BitcoinEducationPage} />
      <ProtectedRoute path="/getting-started" component={GettingStartedPage} />
      <ProtectedRoute path="/faq" component={FAQPage} />
      <ProtectedRoute path="/support" component={SupportPage} />
      <ProtectedRoute path="/integrations" component={IntegrationsPage} />
      <ProtectedRoute path="/api-access" component={APIAccessPage} />
      <Route path="/onboarding" component={CompanyOnboardingPage} />
      <Route path="/help-center" component={HelpCenterPage} />
      <Route path="/api-documentation" component={ApiDocumentationPage} />
      <Route path="/security" component={SecurityPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BtcRateProvider>
          <BitcoinQuotesProvider>
            <SidebarProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </SidebarProvider>
          </BitcoinQuotesProvider>
        </BtcRateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
