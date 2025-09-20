// src/routes/RoleLanding.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleLanding(){
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/partner/" replace />;
}
