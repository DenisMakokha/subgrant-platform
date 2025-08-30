import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Sub-Grant Platform</h1>
          </Link>
          
          <nav className="nav">
            {user ? (
              <>
                {user.role === 'donor' ? (
                  <>
                    <Link to="/donor-reporting" className="nav-link">Donor Reporting</Link>
                    <Link to="/profile" className="nav-link">Profile</Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/kpi-dashboard" className="nav-link">KPI Dashboard</Link>
                    <Link to="/contracts" className="nav-link">Contracts</Link>
                    <Link to="/disbursements" className="nav-link">Disbursements</Link>
                    <Link to="/me-reports" className="nav-link">ME Reports</Link>
                    <Link to="/financial-reports" className="nav-link">Financial Reports</Link>
                    <Link to="/receipts" className="nav-link">Receipts</Link>
{(user.role === 'admin' || user.role === 'auditor') && (
                      <Link to="/compliance-dashboard" className="nav-link">Compliance Dashboard</Link>
                    )}
                    <Link to="/profile" className="nav-link">Profile</Link>
                  </>
                )}
                <button onClick={logout} className="logout-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;