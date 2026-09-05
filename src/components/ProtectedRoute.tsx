import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { env } from '../config/env';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps protected routes.
 * - In DEMO_MODE: always renders children.
 * - Otherwise: redirects unauthenticated users to /login.
 */
export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, initialising } = useAuth();
  const location = useLocation();

  // While verifying the stored token, show a full-screen spinner
  if (initialising) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin" />
          <p className="text-xs text-[#746E68]">Loading GoDrishti…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !env.DEMO_MODE) {
    // Redirect to login, remember where the user wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
