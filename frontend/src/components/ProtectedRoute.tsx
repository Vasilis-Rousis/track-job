import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, setUser, clearUser } = useAuthStore();
  const [checking, setChecking] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;

    authApi
      .me()
      .then((user) => setUser(user))
      .catch(() => clearUser())
      .finally(() => setChecking(false));
  }, [isAuthenticated, setUser, clearUser]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
