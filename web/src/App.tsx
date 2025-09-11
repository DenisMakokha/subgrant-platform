import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ContractManagementTabs from './pages/ContractManagementTabs';
import ContractTemplates from './pages/ContractTemplates';
import CreateContract from './pages/CreateContract';
import ContractSettings from './pages/ContractSettings';
import ContractSigning from './pages/ContractSigning';
import DisbursementManagement from './pages/DisbursementManagement';
import PartnerOnboarding from './pages/PartnerOnboarding';
import PartnerManagementTabs from './pages/PartnerManagementTabs';
import ComplianceManagement from './pages/ComplianceManagement';
import BudgetManagementTabs from './pages/BudgetManagementTabs';
import FinancialManagementTabs from './pages/FinancialManagementTabs';
import KpiDashboard from './pages/KpiDashboard';
import DonorReporting from './pages/DonorReporting';
import MeReportManagement from './pages/MeReportManagement';
import FinancialReportManagement from './pages/FinancialReportManagement';
import ReceiptManagement from './pages/ReceiptManagement';
import ComplianceDashboard from './pages/ComplianceDashboard';
import ProjectManagementTabs from './pages/ProjectManagementTabs';
import MEReportsTabs from './pages/MEReportsTabs';
import ReportingAnalyticsTabs from './pages/ReportingAnalyticsTabs';
import DocumentsManagementTabs from './pages/DocumentsManagementTabs';
import NotificationsManagementTabs from './pages/NotificationsManagementTabs';
import NotFound from './pages/NotFound';
import Forum from './pages/ForumAdmin';
import TopicDetail from './pages/TopicDetail';
import NewTopic from './pages/NewTopic';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes with header and footer */}
          <Route path="/" element={
            <div className="min-h-screen flex flex-col">
              <Header 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1">
                <Home />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/login" element={
            <div className="min-h-screen flex flex-col">
              <Header 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1">
                <Login />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/register" element={
            <div className="min-h-screen flex flex-col">
              <Header 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1">
                <Register />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Protected routes with layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<ProjectManagementTabs />} />
                  <Route path="/projects/create" element={<ProjectManagementTabs />} />
                  <Route path="/projects/timeline" element={<ProjectManagementTabs />} />
                  <Route path="/projects/categories" element={<ProjectManagementTabs />} />
                  <Route path="/partners" element={<PartnerManagementTabs />} />
                  <Route path="/partners/onboarding" element={<PartnerManagementTabs />} />
                  <Route path="/partners/due-diligence" element={<PartnerManagementTabs />} />
                  <Route path="/partners/compliance" element={<PartnerManagementTabs />} />
                  <Route path="/contracts" element={<ContractManagementTabs />} />
                  <Route path="/contracts/templates" element={<ContractManagementTabs />} />
                  <Route path="/contracts/create" element={<ContractManagementTabs />} />
                  <Route path="/contracts/settings" element={<ContractManagementTabs />} />
                  <Route path="/contract-signing" element={<ProtectedRoute><ContractSigning /></ProtectedRoute>} />
                  <Route path="/contracts/signing" element={<ContractManagementTabs />} />
                  <Route path="/contracts/compliance" element={<ContractManagementTabs />} />
                  <Route path="/kpi-dashboard" element={<KpiDashboard />} />
                  <Route path="/donor-reporting" element={<DonorReporting />} />
                  <Route path="/disbursements" element={<DisbursementManagement />} />
                  <Route path="/organizations/:organizationId/compliance" element={<ComplianceManagement />} />
                  <Route path="/budgets" element={<BudgetManagementTabs />} />
                  <Route path="/budgets/create" element={<BudgetManagementTabs />} />
                  <Route path="/budgets/review" element={<BudgetManagementTabs />} />
                  <Route path="/budgets/approval" element={<BudgetManagementTabs />} />
                  <Route path="/budgets/tracking" element={<BudgetManagementTabs />} />
                  <Route path="/financial-dashboard" element={<FinancialManagementTabs />} />
                  <Route path="/financial/retirement" element={<FinancialManagementTabs />} />
                  <Route path="/financial/reconciliation" element={<FinancialManagementTabs />} />
                  <Route path="/financial/reports" element={<FinancialManagementTabs />} />
                  <Route path="/financial/analytics" element={<FinancialManagementTabs />} />
                  <Route path="/monitoring/kpi" element={<MEReportsTabs />} />
                  <Route path="/monitoring/risks" element={<MEReportsTabs />} />
                  <Route path="/monitoring/milestones" element={<MEReportsTabs />} />
                  <Route path="/me-reports" element={<MEReportsTabs />} />
                  <Route path="/me-reports-management" element={<MeReportManagement />} />
                  <Route path="/financial-reports" element={<FinancialReportManagement />} />
                  <Route path="/receipts" element={<ReceiptManagement />} />
                  <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
                  <Route path="/reporting-analytics" element={<ReportingAnalyticsTabs />} />
                  <Route path="/reporting/dashboards" element={<ReportingAnalyticsTabs />} />
                  <Route path="/reporting/insights" element={<ReportingAnalyticsTabs />} />
                  <Route path="/reporting/exports" element={<ReportingAnalyticsTabs />} />
                  <Route path="/reporting/settings" element={<ReportingAnalyticsTabs />} />
                  <Route path="/documents" element={<DocumentsManagementTabs />} />
                  <Route path="/documents/versions" element={<DocumentsManagementTabs />} />
                  <Route path="/documents/audit" element={<DocumentsManagementTabs />} />
                  <Route path="/documents/templates" element={<DocumentsManagementTabs />} />
                  <Route path="/documents/settings" element={<DocumentsManagementTabs />} />
                  <Route path="/notifications" element={<NotificationsManagementTabs />} />
                  <Route path="/notifications/settings" element={<NotificationsManagementTabs />} />
                  <Route path="/notifications/deadlines" element={<NotificationsManagementTabs />} />
                  <Route path="/notifications/escalation" element={<NotificationsManagementTabs />} />
                  <Route path="/notifications/templates" element={<NotificationsManagementTabs />} />
                  <Route path="/forum" element={<Forum />} />
                  <Route path="/forum/categories" element={<Forum />} />
                  <Route path="/forum/tags" element={<Forum />} />
                  <Route path="/forum/settings" element={<Forum />} />
                  <Route path="/forum/topics/:id" element={<TopicDetail />} />
                  <Route path="/forum/new-topic" element={<NewTopic />} />
                  <Route path="/profile" element={<Profile user={null} />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;