'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminLayoutProps {
  children: ReactNode;
}

// Session wrapper that ensures SessionProvider is always available
function SessionWrapper({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingSpinner fullScreen color="pink" text="กำลังโหลดระบบ..." />;
  }

  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <AdminSessionChecker>{children}</AdminSessionChecker>
    </SessionProvider>
  );
}

// Component to check session and handle auth
function AdminSessionChecker({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Handle auth errors
    const handleAuthError = () => {
      setShowError(true);
    };

    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, []);

  if (status === 'loading') {
    return <LoadingSpinner fullScreen color="pink" text="กำลังตรวจสอบสิทธิ์การเข้าใช้..." />;
  }

  if (status === 'unauthenticated' || showError) {
    // Redirect to login
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
    }
    return <LoadingSpinner fullScreen color="pink" text="กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ..." />;
  }

  if (session?.user?.role !== 'ADMIN') {
    // Redirect non-admin users
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    return <LoadingSpinner fullScreen color="pink" text="กำลังเปลี่ยนเส้นทาง..." />;
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SessionWrapper>
      {children}
    </SessionWrapper>
  );
}