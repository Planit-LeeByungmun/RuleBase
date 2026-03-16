

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  requireAdmin?: boolean;
}

export function ProtectedRoute({ requireAdmin = false }: Props) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/documents" replace />;

  return <Outlet />;
}
