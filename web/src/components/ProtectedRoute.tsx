import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerified?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireEmailVerified = false 
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only partners need email verification
  // All other users (admin, accountant, etc.) are created by admin and bypass verification
  if (requireEmailVerified && user?.role === 'partner_user' && !user.email_verified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
