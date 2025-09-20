// src/routes/RoleLanding.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleLanding() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'admin': 
      return <Navigate to="/dashboard" replace />;
    case 'grants_manager': 
      return <Navigate to="/gm" replace />;
    case 'chief_operations_officer': 
      return <Navigate to="/coo" replace />;
    case 'donor': 
      return <Navigate to="/donor" replace />;
    default: 
      return <Navigate to="/partner" replace />;
  }
}
