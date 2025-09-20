import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string | string[];
  requireAdmin?: boolean; // deprecated, use requireRole
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole,
  requireAdmin = false 
}) => {
  const { ready, user, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { ready, user: !!user, isAuthenticated, userRole: user?.role, requireRole });

  // Don't render dashboard until session is loaded
  if (!ready) {
    console.log('ProtectedRoute: Not ready, showing spinner');
    return <Spinner />;
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Handle role-based access control
  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(user.role)) {
      // Bounce to their home based on role
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  }
  
  // Legacy admin check (deprecated)
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
