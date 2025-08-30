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
import ContractManagement from './pages/ContractManagement';
import ContractSigning from './pages/ContractSigning';
import DisbursementManagement from './pages/DisbursementManagement';
import PartnerOnboarding from './pages/PartnerOnboarding';
import ComplianceManagement from './pages/ComplianceManagement';
import BudgetCreation from './pages/BudgetCreation';
import BudgetReview from './pages/BudgetReview';
import BudgetApproval from './pages/BudgetApproval';
import FinancialDashboard from './pages/FinancialDashboard';
import KpiDashboard from './pages/KpiDashboard';
import DonorReporting from './pages/DonorReporting';
import MeReportManagement from './pages/MeReportManagement';
import FinancialReportManagement from './pages/FinancialReportManagement';
import ReceiptManagement from './pages/ReceiptManagement';
import ComplianceDashboard from './pages/ComplianceDashboard';
import NotFound from './pages/NotFound';

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
                <Login onLogin={() => {}} />
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
                <Register onRegister={() => {}} />
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
                  <Route path="/kpi-dashboard" element={<KpiDashboard />} />
                  <Route path="/donor-reporting" element={<DonorReporting />} />
                  <Route path="/contracts" element={<ContractManagement />} />
                  <Route path="/contracts/:id/sign" element={<ContractSigning />} />
                  <Route path="/disbursements" element={<DisbursementManagement />} />
                  <Route path="/partner-onboarding" element={<PartnerOnboarding />} />
                  <Route path="/organizations/:organizationId/compliance" element={<ComplianceManagement />} />
                  <Route path="/budgets/create" element={<BudgetCreation />} />
                  <Route path="/budgets/review" element={<BudgetReview />} />
                  <Route path="/budgets/approval" element={<BudgetApproval />} />
                  <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                  <Route path="/me-reports" element={<MeReportManagement />} />
                  <Route path="/financial-reports" element={<FinancialReportManagement />} />
                  <Route path="/receipts" element={<ReceiptManagement />} />
                  <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
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