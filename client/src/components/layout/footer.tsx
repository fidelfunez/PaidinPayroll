import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200/80 mt-auto shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 -mt-4 mb-3">
              <img 
                src="/paidin - logos/Logo Designs (Transparent)/paidin-text-and-icon-logo.png" 
                alt="PaidIn Logo" 
                className="h-24"
              />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-3">
              The complete Bitcoin business platform for modern companies.
              <br />
              From payroll and invoicing to reporting and compliance
              <br />
              everything you need to run your business on Bitcoin.
            </p>
            <div className="flex items-center text-xs font-medium text-muted-foreground bg-green-50 px-3 py-1.5 rounded-full border border-green-200/50 w-fit">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Bitcoin network operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                  Dashboard
                </Link>
              </li>
              {isAdmin ? (
                <>
                  <li>
                    <Link href="/payroll" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      Payroll
                    </Link>
                  </li>
                  <li>
                    <Link href="/reimbursements" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      Reimbursements
                    </Link>
                  </li>
                  <li>
                    <Link href="/reports" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      Reports
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/my-expenses" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      My Expenses
                    </Link>
                  </li>
                  <li>
                    <Link href="/time-tracking" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      Time Tracking
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      Profile
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/help-center" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/api-documentation" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200/60 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm font-medium text-muted-foreground">
              © {currentYear} Paidin. Built for the Bitcoin economy.
            </div>
            <div className="flex items-center space-x-6 text-xs text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-primary transition-colors duration-200 font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-primary transition-colors duration-200 font-medium">
                Terms of Service
              </Link>
              <div className="flex items-center space-x-1">
                <span>Powered by</span>
                <span className="text-primary font-bold">Bitcoin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}