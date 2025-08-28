import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ContractManagement from './pages/ContractManagement';
import ContractSigning from './pages/ContractSigning';
import DisbursementManagement from './pages/DisbursementManagement';
import FinancialDashboard from './pages/FinancialDashboard';
import KpiDashboard from './pages/KpiDashboard';
import DonorReporting from './pages/DonorReporting';
import MeReportManagement from './pages/MeReportManagement';
import FinancialReportManagement from './pages/FinancialReportManagement';
import ReceiptManagement from './pages/ReceiptManagement';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={() => {}} />} />
              <Route path="/register" element={<Register onRegister={() => {}} />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kpi-dashboard" element={<KpiDashboard />} />
              <Route path="/donor-reporting" element={<DonorReporting />} />
              <Route path="/contracts" element={<ContractManagement />} />
              <Route path="/contracts/:id/sign" element={<ContractSigning />} />
              <Route path="/disbursements" element={<DisbursementManagement />} />
              <Route path="/financial-dashboard" element={<FinancialDashboard />} />
              <Route path="/me-reports" element={<MeReportManagement />} />
              <Route path="/financial-reports" element={<FinancialReportManagement />} />
              <Route path="/receipts" element={<ReceiptManagement />} />
              <Route path="/profile" element={<Profile user={null} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;