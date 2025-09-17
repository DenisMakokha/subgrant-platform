import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchWithAuth } from '../services/api';

interface ProtectedOnboardingRouteProps {
  children: React.ReactNode;
  requiredStatus?: string[];
  requireEmailVerified?: boolean;
}

const ProtectedOnboardingRoute: React.FC<ProtectedOnboardingRouteProps> = ({
  children,
  requiredStatus = [],
  requireEmailVerified = true
}) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, [location.pathname]);

  const checkAccess = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setRedirectTo('/partner/login');
        setLoading(false);
        return;
      }

      // Check user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        setRedirectTo('/partner/login');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);

      // Only partners need email verification and onboarding
      // All other users (admin, accountant, etc.) are created by admin and bypass these requirements
      if (user.role !== 'partner_user') {
        // Non-partner users should not access onboarding routes
        setRedirectTo('/dashboard');
        setLoading(false);
        return;
      }

      // Check email verification if required (only for partners)
      if (requireEmailVerified && user.role === 'partner_user' && !user.email_verified) {
        setRedirectTo('/auth/verify-email');
        setLoading(false);
        return;
      }

      // If no specific status required, allow access
      if (requiredStatus.length === 0) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // Check organization status
      try {
        const response = await fetchWithAuth('/api/onboarding/section-c');
        const orgStatus = response.organization?.status;

        if (!orgStatus) {
          // No organization yet, redirect to start onboarding
          setRedirectTo('/onboarding/section-c');
          setLoading(false);
          return;
        }

        // Check if current status allows access to this route
        if (requiredStatus.includes(orgStatus)) {
          setAuthorized(true);
        } else {
          // Redirect to appropriate step based on status
          const redirectPath = getRedirectPathForStatus(orgStatus);
          setRedirectTo(redirectPath);
        }
      } catch (error) {
        console.error('Error checking organization status:', error);
        setRedirectTo('/partner/login');
      }
    } catch (error) {
      console.error('Error in route protection:', error);
      setRedirectTo('/partner/login');
    } finally {
      setLoading(false);
    }
  };

  const getRedirectPathForStatus = (status: string): string => {
    switch (status) {
      case 'email_pending':
        return '/auth/verify-email';
      case 'attachments_pending':
        return '/onboarding/section-c';
      case 'financials_pending':
        return '/onboarding/section-b';
      case 'under_review':
      case 'changes_requested':
        return '/onboarding/review-status';
      case 'approved':
        return '/onboarding/section-a';
      case 'finalized':
        return '/partner/dashboard';
      default:
        return '/onboarding/section-c';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Checking access...</span>
        </div>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!authorized) {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedOnboardingRoute;
