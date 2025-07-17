import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { BitcoinQuotesProvider } from "@/hooks/use-bitcoin-quotes";
import { ProtectedRoute } from "./lib/protected-route";
import { getAllRoutes } from "./modules/routes";

function Router() {
  const routes = getAllRoutes();

  return (
    <Switch>
      {routes.map(({ path, component: Component, protected: isProtected }) => {
        if (isProtected) {
          return (
            <ProtectedRoute key={path} path={path} component={Component} />
          );
        } else {
          return (
            <Route key={path} path={path} component={Component} />
          );
        }
      })}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BitcoinQuotesProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </SidebarProvider>
        </BitcoinQuotesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
