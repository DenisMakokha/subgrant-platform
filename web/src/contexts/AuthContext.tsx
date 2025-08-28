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
      // In a real app, you would fetch user data from the API
      // For now, we'll just set a placeholder user
      // setUser(parsedUser);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuth(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuth(false);
    removeToken();
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