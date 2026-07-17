import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowEmployee?: boolean;
  allowUltra?: boolean;
}

const ProtectedRoute = ({ children, allowEmployee = false, allowUltra = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen variant="auto" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Profile still loading (user authenticated but profile not yet fetched):
  // show branded splash instead of rendering the child route (avoids flashing
  // the Carlos dashboard while an ULTRA user is being redirected).
  if (!profile) {
    return <LoadingScreen variant="auto" />;
  }

  // ULTRA user can only access /ultra-registro
  if (profile?.name === 'ULTRA' && !allowUltra) {
    return <Navigate to="/ultra-registro" replace />;
  }

  // Employees can only access /clients
  if (profile?.role === 'employee' && !allowEmployee) {
    return <Navigate to="/clients" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
