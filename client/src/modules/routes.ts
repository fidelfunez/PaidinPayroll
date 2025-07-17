// Centralized routing configuration for all modules
import { AuthPage, ProfilePage, SettingsPage } from "./auth";
import { DashboardPage } from "./dashboard";
import { PayrollPage, BulkPayrollPage, PayslipsPage } from "./payroll";
import { EmployeesPage } from "./employees";
import { ReimbursementsPage, MyExpensesPage } from "./reimbursements";
import { TimeTrackingPage } from "./time-tracking";
import { TimeOffPage } from "./time-off";
import { ReportsPage } from "./reports";
import { WithdrawalMethodPage, AdminWithdrawalMethodsPage } from "./withdrawal-methods";
import { MessagesPage, AdminMessagesPage } from "./messaging";
import { AdminApprovalsPage, AuditLogsPage, AdminTaxCompliancePage } from "./admin";
import { InvoicesPage, InvoiceDetailPage, CreateInvoicePage } from "./invoicing";
import { IntegrationsPage, CreateIntegrationPage } from "./integrations";
import { OnboardingPage, CreateOnboardingPage, OnboardingProgressPage } from "./onboarding";
import {
  HelpCenterPage, SecurityPage, PrivacyPolicyPage, TermsOfServicePage,
  BenefitsPage, TaxCompliancePage, NotificationsPage, FilesPage, NotFound, PlaceholderPage
} from "./static";

export const moduleRoutes = {
  auth: [
    { path: "/auth", component: AuthPage, protected: false },
    { path: "/profile", component: ProfilePage, protected: true },
    { path: "/settings", component: SettingsPage, protected: true },
  ],
  dashboard: [
    { path: "/", component: DashboardPage, protected: true },
  ],
  payroll: [
    { path: "/payroll", component: PayrollPage, protected: true },
    { path: "/bulk-payroll", component: BulkPayrollPage, protected: true },
    { path: "/payslips", component: PayslipsPage, protected: true },
  ],
  employees: [
    { path: "/employees", component: EmployeesPage, protected: true },
  ],
  reimbursements: [
    { path: "/reimbursements", component: ReimbursementsPage, protected: true },
    { path: "/my-expenses", component: MyExpensesPage, protected: true },
  ],
  timeTracking: [
    { path: "/time-tracking", component: TimeTrackingPage, protected: true },
  ],
  timeOff: [
    { path: "/time-off", component: TimeOffPage, protected: true },
  ],
  reports: [
    { path: "/reports", component: ReportsPage, protected: true },
  ],
  withdrawalMethods: [
    { path: "/withdrawal-method", component: WithdrawalMethodPage, protected: true },
    { path: "/withdrawal-methods", component: AdminWithdrawalMethodsPage, protected: true },
  ],
  messaging: [
    { path: "/messages", component: MessagesPage, protected: true },
    { path: "/admin-messages", component: AdminMessagesPage, protected: true },
  ],
  admin: [
    { path: "/approvals", component: AdminApprovalsPage, protected: true },
    { path: "/audit-logs", component: AuditLogsPage, protected: true },
    { path: "/admin-tax-compliance", component: AdminTaxCompliancePage, protected: true },
  ],
  invoicing: [
    { path: "/invoices", component: InvoicesPage, protected: true },
    { path: "/invoice/:id", component: InvoiceDetailPage, protected: true },
    { path: "/create-invoice", component: CreateInvoicePage, protected: true },
  ],
  integrations: [
    { path: "/integrations", component: IntegrationsPage, protected: true },
    { path: "/create-integration", component: CreateIntegrationPage, protected: true },
  ],
  onboarding: [
    { path: "/onboarding", component: OnboardingPage, protected: true },
    { path: "/create-onboarding", component: CreateOnboardingPage, protected: true },
    { path: "/onboarding-progress", component: OnboardingProgressPage, protected: true },
  ],
  static: [
    { path: "/help-center", component: HelpCenterPage, protected: false },
    { path: "/security", component: SecurityPage, protected: false },
    { path: "/privacy-policy", component: PrivacyPolicyPage, protected: false },
    { path: "/terms-of-service", component: TermsOfServicePage, protected: false },
    { path: "/benefits", component: BenefitsPage, protected: true },
    { path: "/tax-compliance", component: TaxCompliancePage, protected: true },
    { path: "/notifications", component: NotificationsPage, protected: true },
    { path: "/files", component: FilesPage, protected: true },
    { path: "*", component: NotFound, protected: false },
  ],
};

export const getAllRoutes = () => Object.values(moduleRoutes).flat();
export const getRoutesByModule = (moduleName: keyof typeof moduleRoutes) => {
  return moduleRoutes[moduleName];
}; 