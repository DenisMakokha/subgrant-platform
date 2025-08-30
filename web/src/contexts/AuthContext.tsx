import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, removeToken } from '../utils/auth';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organization?: {
    id: string;
    name: string;
    status: string;
    complianceStatus: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on initial load
    const token = getToken();
    if (token) {
      setIsAuth(true);
      // Try to get user data from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse user data from localStorage', e);
        }
      }
    }
  }, []);

  const login = (userData: any) => {
    // Map backend user object to frontend user object
    const mappedUser: User = {
      id: userData.id,
      firstName: userData.first_name || userData.firstName,
      lastName: userData.last_name || userData.lastName,
      email: userData.email,
      role: userData.role,
      organization: userData.organization
    };
    
    setUser(mappedUser);
    setIsAuth(true);
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(mappedUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuth(false);
    removeToken();
    // Remove user data from localStorage
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: isAuth }}>
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