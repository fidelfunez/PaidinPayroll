import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [location] = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Keep section expanded when navigating to its sub-items
  useEffect(() => {
    const sectionMappings = {
      '/': 'overview',
      '/my-expenses': 'overview',
      '/invoices': 'overview',
      '/time-tracking': 'time',
      '/time-off': 'time',
      '/profile': 'personal',
      '/files': 'personal',
      '/benefits': 'personal',
      '/withdrawal-method': 'finance',
      '/tax-compliance': 'finance',
      '/settings': 'settings',
      '/payroll': 'hr',
      '/employees': 'hr',
      '/reimbursements': 'finance',
      '/reports': 'accounting',
      '/accounting': 'accounting',
      '/payslips': 'accounting'
    };

    const sectionId = sectionMappings[location as keyof typeof sectionMappings];
    if (sectionId) {
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(sectionId);
        return newSet;
      });
    }
  }, [location]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, expandedSections, toggleSection }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}