import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, removeToken, saveToken } from '../utils/auth';
import { normalizeRole } from '../shared/constants/roles';
import { User } from '../types/user';

// API helpers - hardcode for now to fix immediate issue
const API_BASE = 'http://localhost:3000/api';

const buildUrl = (path: string) => {
  console.log('API_BASE:', API_BASE);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  
  if (!API_BASE) {
    // Using proxy mode - return relative path
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // Using absolute API base - join with path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const fullUrl = `${API_BASE}/${cleanPath}`;
  console.log('Built URL:', fullUrl);
  return fullUrl;
};

const expectJson = async (res: Response) => {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const txt = await res.text().catch(() => '');
    throw new Error(
      `Expected JSON but got ${ct || 'unknown'}. ` +
      `Likely wrong host/port or a redirect serving HTML. ` +
      `Snippet: ${txt.slice(0, 140)}`
    );
  }
  return res.json();
};

interface Organization {
  id: string;
  name?: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  legal_structure?: string;
  year_established?: number;
  email?: string;
  phone?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  bank_name?: string;
  bank_branch?: string;
  account_name?: string;
  account_number?: string;
  swift_code?: string;
  status: string;
  financial_assessment?: {
    currentAnnualBudget?: { amountUsd?: number; year?: number };
    nextYearAnnualBudgetEstimate?: { amountUsd?: number; year?: number };
    largestGrantEverManaged?: { amountUsd?: number; year?: number };
    currentDonorFunding?: { amountUsd?: number; year?: number };
    otherFunds?: { amountUsd?: number; year?: number };
  };
}

interface AuthContextType {
  ready: boolean;
  user: User | null;
  organization: Organization | null;
  nextStep: string | null;
  modules: any | null;
  onboardingLocked: boolean;
  login: ({ email, password }: { email: string; password: string }) => Promise<{ role: string; sessionData: any }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [modules, setModules] = useState<any | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  
  // Calculate onboarding locked status
  const onboardingLocked = user?.role === 'partner_user' && organization?.status !== 'finalized';

  useEffect(() => {
    // Check if user is authenticated on initial load
    const token = getToken();
    console.log('AuthContext useEffect - Initial load, token exists:', !!token);
    
    if (token) {
      console.log('AuthContext useEffect - Token found, calling refreshSession');
      refreshSession();
    } else {
      console.log('AuthContext useEffect - No token, setting ready to true');
      setReady(true); // No token, ready to show login
    }
  }, []);

  async function refreshSession() {
    try {
      console.log('refreshSession called');
      const token = getToken();
      if (!token) {
        console.log('refreshSession: No token found, setting ready to true');
        setReady(true);
        return;
      }
      
      console.log('refreshSession: Token found, fetching session data');

      const resp = await fetch(buildUrl('/session'), {
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!resp.ok) {
        throw new Error(`Session refresh failed (${resp.status})`);
      }

      const data = await expectJson(resp);
      setUser({
        id: data.user.id,
        email: data.user.email,
        role: normalizeRole(data.user.role) as any,
        email_verified: data.user.email_verified,
        organization_id: data.user.organization_id,
        status: data.user.status || 'active',
        mfaEnabled: data.user.mfaEnabled || false,
        createdAt: data.user.createdAt || new Date().toISOString(),
        updatedAt: data.user.updatedAt || new Date().toISOString(),
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || ''
      });
      setOrganization(data.organization);
      setNextStep(data.next_step);
      setModules(data.modules);
      setIsAuth(true);
      setReady(true);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setReady(true);
      logout();
    }
  }

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      // Clear any old token first
      localStorage.removeItem('token');
      
      // Set provisional state - not ready yet
      setReady(false);
      setUser(null);
      setOrganization(null);
      
      console.log('Making login request to:', buildUrl('/auth/login'));
      
      const res = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!res.ok) {
        // Try to parse JSON error first; fall back to text
        let details = '';
        try { 
          details = JSON.stringify(await res.json()); 
        } catch {
          try { 
            details = (await res.text()).slice(0, 140); 
          } catch {}
        }
        throw new Error(`Login failed (${res.status}). ${details}`);
      }

      const data = await expectJson(res); // Catches HTML responses
      const token = data?.token;
      if (!token) throw new Error('Login succeeded but no token in response.');

      saveToken(token);

      // Fetch session data
      const sres = await fetch(buildUrl('/session'), {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!sres.ok) {
        let details = '';
        try { 
          details = JSON.stringify(await sres.json()); 
        } catch {
          try { 
            details = (await sres.text()).slice(0, 140); 
          } catch {}
        }
        throw new Error(`Session fetch failed (${sres.status}). ${details}`);
      }

      const sessionData = await expectJson(sres); // Catches HTML responses

      // Normalize role from session only
      const role = normalizeRole(sessionData.user.role);
      
      // Set final auth state from session
      setUser({
        id: sessionData.user.id,
        email: sessionData.user.email,
        role: role as any,
        email_verified: sessionData.user.email_verified,
        organization_id: sessionData.user.organization_id,
        status: sessionData.user.status || 'active',
        mfaEnabled: sessionData.user.mfaEnabled || false,
        createdAt: sessionData.user.createdAt || new Date().toISOString(),
        updatedAt: sessionData.user.updatedAt || new Date().toISOString(),
        first_name: sessionData.user.first_name || '',
        last_name: sessionData.user.last_name || ''
      });
      
      setOrganization(sessionData.organization);
      setNextStep(sessionData.next_step);
      setModules(sessionData.modules);
      setIsAuth(true);
      setReady(true);
      
      console.log('Login successful - Auth state updated:', {
        user: sessionData.user,
        isAuth: true,
        ready: true
      });
      
      // Login successful - auth state updated
      
      return { role, sessionData };
    } catch (error: any) {
      setReady(true);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    setNextStep(null);
    setModules(null);
    setIsAuth(false);
    removeToken();
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ ready, user, organization, nextStep, modules, onboardingLocked, login, logout, refreshSession, isAuthenticated: isAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};