import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import './NotFound.css';

const NotFound: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  
  let dashboardPath = '/';
  if (role === 'admin') dashboardPath = '/admin/dashboard';
  else if (role === 'grants_manager') dashboardPath = '/gm';
  else if (role === 'chief_operations_officer') dashboardPath = '/coo';
  else if (role === 'donor') dashboardPath = '/donor';
  else if (role === 'partner_user') dashboardPath = '/partner';

  // Auto-redirect admin users to their dashboard after 3 seconds
  useEffect(() => {
    if (role === 'admin') {
      const timer = setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [role, navigate]);

  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <div className="not-found-actions">
          <Link to="/" className="home-button">
            Go to Homepage
          </Link>
          <Link to={dashboardPath} className="dashboard-button">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;