import React, { useState } from 'react';
import './Sidebar.css';
import { Link, useLocation } from 'react-router-dom';

// Using simple SVG icons instead of Heroicons for now
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const ContractIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ReportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const BudgetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface NavigationSection {
  id: string;
  name: string;
  icon: React.ComponentType;
  path?: string;
  items: Array<{
    name: string;
    path: string;
    icon: React.ComponentType;
  }>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? []
        : [sectionId]
    );
  };

  const navigationSections = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: DashboardIcon,
      path: '/dashboard',
      items: []
    },
    {
      id: 'projects',
      name: 'Grants & Projects',
      icon: ChartIcon,
      items: [
        { name: 'Project Overview', path: '/projects', icon: ChartIcon },
        { name: 'Create Project', path: '/projects/create', icon: DocumentIcon },
        { name: 'Project Timeline', path: '/projects/timeline', icon: DocumentIcon },
        { name: 'Budget Categories', path: '/projects/categories', icon: BudgetIcon },
      ]
    },
    {
      id: 'partners',
      name: 'Partner Management',
      icon: BuildingIcon,
      items: [
        { name: 'Partner Onboarding', path: '/partner-onboarding', icon: BuildingIcon },
        { name: 'Partner Profiles', path: '/partners', icon: BuildingIcon },
        { name: 'Due Diligence', path: '/partners/due-diligence', icon: ShieldIcon },
        { name: 'Partner Compliance', path: '/partners/compliance', icon: ShieldIcon },
      ]
    },
    {
      id: 'contracts',
      name: 'Contract Management',
      icon: ContractIcon,
      items: [
        { name: 'Create Contract', path: '/contracts/create', icon: ContractIcon },
        { name: 'Manage Contracts', path: '/contracts', icon: ContractIcon },
        { name: 'Contract Signing', path: '/contracts/signing', icon: DocumentIcon },
        { name: 'Contract Templates', path: '/contracts/templates', icon: DocumentIcon },
      ]
    },
    {
      id: 'budget',
      name: 'Budget Management',
      icon: BudgetIcon,
      items: [
        { name: 'Budget Creation', path: '/budgets/create', icon: BudgetIcon },
        { name: 'Budget Review', path: '/budgets/review', icon: DocumentIcon },
        { name: 'Budget Approval', path: '/budgets/approval', icon: ShieldIcon },
        { name: 'Budget Templates', path: '/budgets/templates', icon: DocumentIcon },
      ]
    },
    {
      id: 'financial',
      name: 'Financial Management',
      icon: MoneyIcon,
      items: [
        { name: 'Disbursements', path: '/disbursements', icon: MoneyIcon },
        { name: 'Financial Dashboard', path: '/financial-dashboard', icon: ChartIcon },
        { name: 'Receipts', path: '/receipts', icon: DocumentIcon },
        { name: 'Financial Retirement', path: '/financial/retirement', icon: MoneyIcon },
        { name: 'Reconciliation', path: '/financial/reconciliation', icon: ShieldIcon },
      ]
    },
    {
      id: 'monitoring',
      name: 'M&E Reports',
      icon: ReportIcon,
      items: [
        { name: 'M&E Reports', path: '/me-reports', icon: ReportIcon },
        { name: 'KPI Tracking', path: '/monitoring/kpi', icon: ChartIcon },
        { name: 'Risk Management', path: '/monitoring/risks', icon: ShieldIcon },
        { name: 'Progress Milestones', path: '/monitoring/milestones', icon: DocumentIcon },
      ]
    },
    {
      id: 'reporting',
      name: 'Reporting & Analytics',
      icon: ReportIcon,
      items: [
        { name: 'Analytics Dashboard', path: '/reporting-analytics', icon: ChartIcon },
        { name: 'Financial Reports', path: '/financial-reports', icon: DocumentIcon },
        { name: 'Compliance Reports', path: '/compliance-dashboard', icon: ShieldIcon },
        { name: 'KPI Dashboard', path: '/kpi-dashboard', icon: ChartIcon },
      ]
    },
    {
      id: 'documents',
      name: 'Documents',
      icon: DocumentIcon,
      items: [
        { name: 'Document Library', path: '/documents', icon: DocumentIcon },
        { name: 'Version Control', path: '/documents/versions', icon: DocumentIcon },
        { name: 'Audit Trail', path: '/documents/audit', icon: ShieldIcon },
        { name: 'Templates', path: '/documents/templates', icon: DocumentIcon },
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications & Alerts',
      icon: ReportIcon,
      items: [
        { name: 'Notification Center', path: '/notifications', icon: ReportIcon },
        { name: 'Alert Settings', path: '/notifications/settings', icon: ShieldIcon },
        { name: 'Deadline Reminders', path: '/notifications/deadlines', icon: DocumentIcon },
        { name: 'Escalation Rules', path: '/notifications/escalation', icon: ShieldIcon },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-500 bg-opacity-75 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col pt-20 lg:pt-6">
          <nav className="glass-card p-3 sticky top-24">
            <div className="space-y-2">
              {navigationSections.map((section) => {
                const isExpanded = expandedSections.includes(section.id);
                const SectionIcon = section.icon;
                const hasActiveItem = section.items.some(item => location.pathname === item.path);
                
                return (
                  <div key={section.id} className="space-y-1">
                    {/* Dashboard and Projects as direct links, others as dropdown sections */}
                    {(section.id === 'dashboard' || section.id === 'projects') && section.path ? (
                      <Link
                        to={section.path}
                        onClick={() => setIsOpen(false)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          location.pathname === section.path
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <SectionIcon />
                          <span>{section.name}</span>
                        </div>
                      </Link>
                    ) : (
                      <>
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            hasActiveItem 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <SectionIcon />
                            <span>{section.name}</span>
                          </div>
                          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </button>
                        
                        {/* Section Items */}
                        {isExpanded && (
                          <div className="ml-6 space-y-1">
                            {section.items.map((item) => {
                              const isActive = location.pathname === item.path;
                              const ItemIcon = item.icon;
                              
                              return (
                                <Link
                                  key={item.name}
                                  to={item.path}
                                  onClick={() => setIsOpen(false)}
                                  className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                    isActive 
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <ItemIcon />
                                  <span>{item.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;