import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';

interface AdminRouteProps {
  children: React.ReactNode;
}

const MIN_SPLASH_MS = 1500;

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile, loading } = useAuth();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Keep the branded splash visible for at least MIN_SPLASH_MS.
  if (loading || !splashElapsed) {
    return <LoadingScreen variant="staff" />;
  }

  // Must be authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Must be admin role
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
