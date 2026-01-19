import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ProtectedRoute } from "./lib/protected-route";
import { MainLayout } from "@/components/layout/main-layout";

// Core pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import SignupPage from "@/pages/signup-page";
import VerifyEmailPage from "@/pages/verify-email-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";

// Accounting pages (new)
import AccountingDashboardPage from "@/pages/accounting-dashboard-page";
import WalletsPage from "@/pages/wallets-page";
import TransactionsPage from "@/pages/transactions-page";
import CategoriesPage from "@/pages/categories-page";
import PurchasesPage from "@/pages/purchases-page";
import QuickBooksExportPage from "@/pages/quickbooks-export-page";

// Admin pages
import AdminPage from "@/pages/admin-page";

// Test pages
import TestValidationPage from "@/pages/test-validation-page";
import TestFlowPage from "@/pages/test-flow-page";

// Wrapper component for routes that need the layout
function LayoutRoute({ component: Component, ...rest }: any) {
  return (
    <ProtectedRoute
      {...rest}
      component={(props: any) => (
        <MainLayout>
          <Component {...props} />
        </MainLayout>
      )}
    />
  );
}

function Router() {
  return (
    <Switch>
      {/* Auth routes (no layout) */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/verify-email/:token" component={VerifyEmailPage} />
      
      {/* Accounting routes (with layout) */}
      <LayoutRoute path="/" component={AccountingDashboardPage} />
      <LayoutRoute path="/accounting" component={AccountingDashboardPage} />
      <LayoutRoute path="/accounting/wallets" component={WalletsPage} />
      <LayoutRoute path="/accounting/transactions" component={TransactionsPage} />
      <LayoutRoute path="/accounting/categories" component={CategoriesPage} />
      <LayoutRoute path="/accounting/purchases" component={PurchasesPage} />
      <LayoutRoute path="/accounting/export" component={QuickBooksExportPage} />
      
      {/* User management (with layout) */}
      <LayoutRoute path="/profile" component={ProfilePage} />
      <LayoutRoute path="/settings" component={SettingsPage} />
      
      {/* Admin routes (with layout) */}
      <LayoutRoute path="/admin" component={AdminPage} />
      
      {/* Test pages */}
      <LayoutRoute path="/accounting/test-flow" component={TestFlowPage} />
      
      {/* Test pages (no auth, no layout - for development) */}
      <Route path="/test-validation" component={TestValidationPage} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
