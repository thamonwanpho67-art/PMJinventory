'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ChunkErrorHandler from './ChunkErrorHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleAuthError = useCallback((error: any) => {
    console.warn('NextAuth error detected:', error);
    
    // Don't retry if it's a client-side navigation error
    if (error?.message?.includes('chunk') || error?.message?.includes('Loading chunk')) {
      return;
    }
    
    if (retryCount < 3) {
      setIsRetrying(true);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setHasError(true);
    }
  }, [retryCount]);

  useEffect(() => {
    // Add a small delay to prevent hydration issues
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 100);
    
    // Add error listener for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Failed to fetch') && 
          event.reason?.message?.includes('auth')) {
        handleAuthError(event.reason);
        event.preventDefault(); // Prevent the error from being thrown
      }
    };

    // Add error listener for regular errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('Failed to fetch') && 
          event.message?.includes('auth')) {
        handleAuthError(event.error);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [handleAuthError]);

  if (!isClient) {
    return <LoadingSpinner fullScreen color="pink" text="Loading..." />;
  }

  if (isRetrying) {
    return <LoadingSpinner fullScreen color="pink" text={`กำลังเชื่อมต่อระบบรับรอง... (ครั้งที่ ${retryCount + 1})`} />;
  }

  if (hasError) {
    // Provide fallback WITH SessionProvider but with error handling
    console.warn('Running in degraded mode with limited authentication');
    return (
      <SessionProvider 
        basePath="/api/auth"
        refetchInterval={0} // Disable auto-refetch in error mode
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        <ChunkErrorHandler />
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 z-50">
          <p className="text-yellow-800 text-sm text-center">
            ⚠️ ระบบรับรองตัวตนมีปัญหา กำลังทำงานในโหมดจำกัด
          </p>
        </div>
        <div className="pt-12">
          {children}
        </div>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={retryCount > 0 ? 10 * 60 : 5 * 60} // Longer interval if there were errors
      refetchOnWindowFocus={retryCount === 0}
      refetchWhenOffline={false}
      session={undefined} // Let NextAuth handle session fetching
    >
      <ChunkErrorHandler />
      {children}
    </SessionProvider>
  );
}

