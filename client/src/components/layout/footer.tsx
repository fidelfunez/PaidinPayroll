import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 -mt-4 mb-1">
              <img 
                src="/paidin - logos/Logo Designs (Transparent)/paidin-text-and-icon-logo.png" 
                alt="PaidIn Logo" 
                className="h-24"
              />
            </div>
            <p className="text-muted-foreground text-sm max-w-md mb-1">
              The complete Bitcoin business platform for modern companies.
              <br />
              From payroll and invoicing to reporting and compliance
              <br />
              everything you need to run your business on Bitcoin.
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Bitcoin network operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              {isAdmin ? (
                <>
                  <li>
                    <Link href="/payroll" className="text-muted-foreground hover:text-foreground transition-colors">
                      Payroll
                    </Link>
                  </li>
                  <li>
                    <Link href="/reimbursements" className="text-muted-foreground hover:text-foreground transition-colors">
                      Reimbursements
                    </Link>
                  </li>
                  <li>
                    <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
                      Reports
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/my-expenses" className="text-muted-foreground hover:text-foreground transition-colors">
                      My Expenses
                    </Link>
                  </li>
                  <li>
                    <Link href="/time-tracking" className="text-muted-foreground hover:text-foreground transition-colors">
                      Time Tracking
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                      Profile
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help-center" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/api-documentation" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} Paidin. Built for the Bitcoin economy.
            </div>
            <div className="flex items-center space-x-6 text-xs text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <div className="flex items-center space-x-1">
                <span>Powered by</span>
                <span className="text-orange-600 font-semibold">Bitcoin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}