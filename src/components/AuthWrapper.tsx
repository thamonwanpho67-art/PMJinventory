'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const [hasAuthError, setHasAuthError] = useState(false);

  useEffect(() => {
    // Handle auth errors gracefully
    const handleAuthError = () => {
      console.warn('Authentication error detected, continuing with limited functionality');
      setHasAuthError(true);
    };

    // Listen for auth errors
    window.addEventListener('authError', handleAuthError);
    
    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  if (status === 'loading') {
    return <LoadingSpinner fullScreen color="pink" text="กำลังตรวจสอบการเข้าสู่ระบบ..." />;
  }

  if (hasAuthError && !requireAuth) {
    // Continue without auth if not required
    return <>{children}</>;
  }

  if (requireAuth && (status === 'unauthenticated' || hasAuthError)) {
    // Redirect to login for protected pages
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return <LoadingSpinner fullScreen color="pink" text="กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ..." />;
  }

  return <>{children}</>;
}