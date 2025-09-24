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

      // Check organization status from session (canonical SSoT)
      try {
        const session = await fetchWithAuth('/session');
        const orgStatusRaw = session.organization?.status as string | undefined;

        if (!orgStatusRaw) {
          // No organization yet, redirect to start onboarding
          setRedirectTo('/onboarding/section-a');
          setLoading(false);
          return;
        }

        // Normalize under_review variants
        const orgStatus = (orgStatusRaw === 'under_review_gm' || orgStatusRaw === 'under_review_coo')
          ? 'under_review'
          : orgStatusRaw;

        // Check if current status allows access to this route
        if (requiredStatus.includes(orgStatusRaw) || requiredStatus.includes(orgStatus)) {
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
      case 'a_pending':
        return '/onboarding/section-a';
      case 'b_pending':
        return '/onboarding/section-b';
      case 'c_pending':
        return '/onboarding/section-c';
      case 'under_review':
      case 'under_review_gm':
      case 'under_review_coo':
      case 'changes_requested':
        return '/onboarding/review-status';
      case 'finalized':
        return '/partner/';
      default:
        return '/onboarding/section-a';
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
