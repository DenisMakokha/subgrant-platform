import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
import ProjectsIndex from './pages/partner/projects/ProjectsIndex';
import Budget from './pages/partner/projects/Budget';
import Reconciliation from './pages/partner/projects/Reconciliation';
import Reports from './pages/partner/projects/Reports';
import Contracts from './pages/partner/projects/Contracts';
import Documents from './pages/partner/projects/Documents';
import PartnerForum from './pages/partner/PartnerForum';
import HelpCenter from './pages/partner/HelpCenter';
import FundRequest from './pages/partner/projects/FundRequest';
import PartnerProfile from './pages/partner/PartnerProfile';
import Notifications from './pages/partner/Notifications';
import UserManagement from './pages/admin/UserManagement';
import AuditCenter from './pages/admin/AuditCenter';
import ConfigurationCenter from './pages/admin/ConfigurationCenter';
import AdminWizard from './pages/admin/Wizard';
import RoleManagement from './pages/admin/RoleManagement';
import AdvancedReporting from './pages/admin/AdvancedReporting';
import SecurityCenter from './pages/admin/SecurityCenter';
import SystemAdministration from './pages/admin/SystemAdministration';
import ExecutiveDashboard from './pages/admin/ExecutiveDashboard';
import KnowledgeManagement from './pages/admin/KnowledgeManagement';
import ReportedIssues from './pages/admin/ReportedIssues';

import AdminDashboard from './pages/admin/Dashboard';
import ApprovalManagement from './pages/admin/ApprovalManagement';

// Dashboard Router Component
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  console.log('DashboardRouter - User:', user);
  console.log('DashboardRouter - User role:', user?.role);

  if (user?.role === 'partner_user') {
    console.log('DashboardRouter - Redirecting to partner dashboard');
    return <Navigate to="/partner" replace />;
  }

  console.log('DashboardRouter - Showing advanced admin dashboard');
  return <AdminDashboard />;
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
      <NotificationProvider>
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
            <Route path="onboarding/review" element={<OnboardingMain />} />
            <Route path="onboarding/review-status" element={<OnboardingMain />} />
            {/* Partner Projects */}
            <Route path="projects" element={<ProjectsIndex />} />
            <Route path="projects/:projectId/budget" element={<Budget />} />
            <Route path="projects/:projectId/fund-request" element={<FundRequest />} />
            <Route path="projects/:projectId/reconciliation" element={<Reconciliation />} />
            <Route path="projects/:projectId/reports" element={<Reports />} />
            <Route path="projects/:projectId/contracts" element={<Contracts />} />
            <Route path="projects/:projectId/documents" element={<Documents />} />
            {/* Partner Forum */}
            <Route path="forum" element={<PartnerForum />} />
            {/* Partner Help */}
            <Route path="help" element={<HelpCenter />} />
            {/* Partner Profile */}
            <Route path="profile" element={<PartnerProfile />} />
            {/* Partner Notifications */}
            <Route path="notifications" element={<Notifications />} />
            {/* Dashboard route disabled - redirects to /partner/ instead */}
            <Route path="dashboard" element={<Navigate to="/partner/" replace />} />
            {/* Catch-all route for partners - redirect to partner home */}
            <Route path="*" element={<Navigate to="/partner/" replace />} />
          </Route>

          {/* GM routes - outside Layout to avoid double header/sidebar */}
          <Route path="/gm/*" element={
            <ProtectedRoute requireRole="grants_manager">
              <GMShell />
            </ProtectedRoute>
          }>
            <Route index element={<GMDashboard />} />
            <Route path="analytics" element={<div>GM Analytics - Coming Soon</div>} />
            <Route path="settings" element={<div>GM Settings - Coming Soon</div>} />
          </Route>

          {/* COO routes - outside Layout to avoid double header/sidebar */}
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

          {/* Protected routes with layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Admin Dashboard Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requireRole="admin">
                      <Navigate to="/admin/dashboard" replace />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute requireRole="admin">
                      <DashboardRouter />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/*" element={
                    <ProtectedRoute requireRole="admin">
                      <Navigate to="/admin/dashboard" replace />
                    </ProtectedRoute>
                  } />

                  {/* Admin Sub-routes - SSOT Implementation Only */}
                  <Route path="/admin/users" element={
                    <ProtectedRoute requireRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/audit" element={
                    <ProtectedRoute requireRole="admin">
                      <AuditCenter />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/wizard" element={
                    <ProtectedRoute requireRole="admin">
                      <AdminWizard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/role-management" element={
                    <ProtectedRoute requireRole="admin">
                      <RoleManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/config" element={
                    <ProtectedRoute requireRole="admin">
                      <ConfigurationCenter />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reporting" element={
                    <ProtectedRoute requireRole="admin">
                      <AdvancedReporting />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/security" element={
                    <ProtectedRoute requireRole="admin">
                      <SecurityCenter />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/system" element={
                    <ProtectedRoute requireRole="admin">
                      <SystemAdministration />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/executive" element={
                    <ProtectedRoute requireRole="admin">
                      <ExecutiveDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/knowledge" element={
                    <ProtectedRoute requireRole="admin">
                      <KnowledgeManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/approvals" element={
                    <ProtectedRoute requireRole="admin">
                      <ApprovalManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reported-issues" element={
                    <ProtectedRoute requireRole="admin">
                      <ReportedIssues />
                    </ProtectedRoute>
                  } />

                  {/* Essential System Routes */}
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
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
