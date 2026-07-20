import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowEmployee?: boolean;
  allowUltra?: boolean;
}

const MIN_SPLASH_MS = 1500;

const ProtectedRoute = ({ children, allowEmployee = false, allowUltra = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Keep the branded splash visible for at least MIN_SPLASH_MS so the images
  // are actually seen on login, instead of flashing by instantly.
  if (loading || !splashElapsed) {
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
