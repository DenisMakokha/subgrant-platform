import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import PartnerRegister from './pages/PartnerRegister';
import PartnerLogin from './pages/PartnerLogin';
import EmailVerification from './pages/EmailVerification';
import SectionC from './components/onboarding/SectionC';
import SectionB from './components/onboarding/SectionB';
import SectionA from './components/onboarding/SectionA';
import ReviewStatus from './components/onboarding/ReviewStatus';
import PartnerDashboard from './pages/PartnerDashboard';
import ProtectedOnboardingRoute from './components/ProtectedOnboardingRoute';
import PartnerShell from './components/PartnerShell';
import PartnerHome from './pages/partner/PartnerHome';
import RoleLanding from './components/RoleLanding';
import GMShell from './components/GMShell';
import COOShell from './components/COOShell';
import GMDashboard from './pages/gm/GMDashboard';
import COODashboard from './pages/coo/COODashboard';
import OnboardingMain from './pages/partner/OnboardingMain';
import OnboardingLanding from './pages/partner/OnboardingLanding';

// Dashboard Router Component
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  
  console.log('DashboardRouter - User:', user);
  console.log('DashboardRouter - User role:', user?.role);
  
  if (user?.role === 'partner_user') {
    console.log('DashboardRouter - Redirecting to partner dashboard');
    return <Navigate to="/partner" replace />;
  }
  
  console.log('DashboardRouter - Showing admin dashboard');
  return <Dashboard />;
};

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
          
          {/* Partner authentication routes (public) */}
          <Route path="/partner/register" element={
            <div className="min-h-screen flex flex-col">
              <Header 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1">
                <PartnerRegister />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/partner/login" element={
            <div className="min-h-screen flex flex-col">
              <Header 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1">
                <PartnerLogin />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/auth/verify-email" element={
            <div className="min-h-screen flex flex-col">
              <Header 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <main className="flex-1">
                <EmailVerification />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Partner routes - separate from main layout to avoid double sidebar */}
          <Route path="/partner" element={
            <ProtectedRoute requireRole="partner_user">
              <PartnerShell />
            </ProtectedRoute>
          }>
            <Route index element={<PartnerHome />} />
            <Route path="onboarding" element={<OnboardingLanding />} />
            <Route path="onboarding/landing" element={<OnboardingLanding />} />
            <Route path="onboarding/section-a" element={<OnboardingMain />} />
            <Route path="onboarding/section-b" element={<OnboardingMain />} />
            <Route path="onboarding/section-c" element={<OnboardingMain />} />
            <Route path="onboarding/review-status" element={<OnboardingMain />} />
            {/* Dashboard route disabled - redirects to /partner/ instead */}
            <Route path="dashboard" element={<Navigate to="/partner/" replace />} />
            <Route path="applications/*" element={<div>Applications Module - Coming Soon</div>} />
            <Route path="compliance/*" element={<div>Compliance Module - Coming Soon</div>} />
            <Route path="me/*" element={<div>M&E Reports Module - Coming Soon</div>} />
            <Route path="finance/*" element={<div>Finance Module - Coming Soon</div>} />
            <Route path="messages/*" element={<div>Messages Module - Coming Soon</div>} />
            <Route path="settings/*" element={<div>Settings Module - Coming Soon</div>} />
          </Route>

          {/* Protected routes with layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Admin Dashboard */}
                  <Route path="/dashboard/*" element={
                    <ProtectedRoute requireRole="admin">
                      <DashboardRouter />
                    </ProtectedRoute>
                  } />
                  
                  {/* GM Dashboard */}
                  <Route path="/gm/*" element={
                    <ProtectedRoute requireRole="grants_manager">
                      <GMShell />
                    </ProtectedRoute>
                  }>
                    <Route index element={<GMDashboard />} />
                    <Route path="analytics" element={<div>GM Analytics - Coming Soon</div>} />
                    <Route path="settings" element={<div>GM Settings - Coming Soon</div>} />
                  </Route>
                  
                  {/* COO Dashboard */}
                  <Route path="/coo/*" element={
                    <ProtectedRoute requireRole="chief_operations_officer">
                      <COOShell />
                    </ProtectedRoute>
                  }>
                    <Route index element={<COODashboard />} />
                    <Route path="reports" element={<div>COO Reports - Coming Soon</div>} />
                    <Route path="analytics" element={<div>COO Analytics - Coming Soon</div>} />
                    <Route path="settings" element={<div>COO Settings - Coming Soon</div>} />
                  </Route>
                  
                  {/* Donor Dashboard */}
                  <Route path="/donor/*" element={
                    <ProtectedRoute requireRole="donor">
                      <div>Donor Dashboard - Coming Soon</div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Partner routes moved outside Layout to avoid double sidebar */}
                  
                  {/* Legacy routes */}
                  <Route path="/projects" element={<ProjectManagementTabs />} />
                  <Route path="/projects/create" element={<ProjectManagementTabs />} />
                  <Route path="/projects/timeline" element={<ProjectManagementTabs />} />
                  <Route path="/projects/categories" element={<ProjectManagementTabs />} />
                  <Route path="/partners" element={<PartnerManagementTabs />} />
                  <Route path="/partners/add-partner" element={<PartnerManagementTabs />} />
                  <Route path="/partners/onboarding" element={<PartnerOnboarding />} />
                  <Route path="/onboarding/section-c" element={
                    <ProtectedOnboardingRoute requiredStatus={['attachments_pending', 'changes_requested']}>
                      <SectionC />
                    </ProtectedOnboardingRoute>
                  } />
                  <Route path="/onboarding/section-b" element={
                    <ProtectedOnboardingRoute requiredStatus={['financials_pending', 'changes_requested']}>
                      <SectionB />
                    </ProtectedOnboardingRoute>
                  } />
                  <Route path="/onboarding/section-a" element={
                    <ProtectedOnboardingRoute requiredStatus={['approved']}>
                      <SectionA />
                    </ProtectedOnboardingRoute>
                  } />
                  <Route path="/onboarding/review-status" element={
                    <ProtectedOnboardingRoute requiredStatus={['under_review', 'changes_requested']}>
                      <ReviewStatus />
                    </ProtectedOnboardingRoute>
                  } />
                  <Route path="/partners/due-diligence" element={<PartnerManagementTabs />} />
                  <Route path="/partners/compliance" element={<PartnerManagementTabs />} />
                  <Route path="/partner-management" element={<PartnerManagementTabs />} />
                  <Route path="/partner-management/onboarding" element={<PartnerManagementTabs />} />
                  <Route path="/partner-management/due-diligence" element={<PartnerManagementTabs />} />
                  <Route path="/partner-management/compliance" element={<PartnerManagementTabs />} />
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
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  );
};

export default App;