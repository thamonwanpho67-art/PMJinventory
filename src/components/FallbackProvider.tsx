'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface FallbackProviderProps {
  children: React.ReactNode;
}

export function FallbackProvider({ children }: FallbackProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Set a timeout to show fallback if NextAuth doesn't load
    const fallbackTimeout = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    // Global error handler for NextAuth errors
    const handleGlobalError = (event: any) => {
      if (event.reason?.message?.includes('Failed to fetch') || 
          event.error?.message?.includes('Failed to fetch')) {
        console.warn('NextAuth fetch error detected, using fallback mode');
        setAuthError(true);
        clearTimeout(fallbackTimeout);
      }
    };

    // Listen for various error types
    window.addEventListener('unhandledrejection', handleGlobalError);
    window.addEventListener('error', handleGlobalError);

    return () => {
      clearTimeout(fallbackTimeout);
      window.removeEventListener('unhandledrejection', handleGlobalError);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  if (!isClient) {
    return <LoadingSpinner fullScreen color="pink" text="เริ่มต้นระบบ..." />;
  }

  if (authError || showFallback) {
    // Fallback mode without SessionProvider
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 bg-blue-100 border-b border-blue-300 px-4 py-2 z-50">
          <p className="text-blue-800 text-sm text-center">
            🔧 ระบบกำลังทำงานในโหมดปลอดภัย | Safe Mode Active
          </p>
        </div>
        <div className="pt-12">
          {children}
        </div>
      </div>
    );
  }

  // Try to use SessionProvider normally
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0} // Disable auto-refetch to prevent errors
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}