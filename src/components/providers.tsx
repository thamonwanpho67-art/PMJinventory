'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ChunkErrorHandler from './ChunkErrorHandler';
import AuthErrorHandler from './AuthErrorHandler';
import ServiceWorkerSetup from './ServiceWorkerSetup';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Listen for auth errors
    const handleAuthError = (event: ErrorEvent) => {
      if (event.message?.includes('Failed to fetch') || event.message?.includes('authjs.dev')) {
        console.warn('NextAuth session fetch error detected, attempting recovery...');
        setSessionError(true);
        
        // Attempt to recover after a short delay
        setTimeout(() => {
          setSessionError(false);
        }, 2000);
      }
    };

    window.addEventListener('error', handleAuthError);
    
    return () => {
      window.removeEventListener('error', handleAuthError);
    };
  }, []);

  if (!isClient) {
    return <LoadingSpinner fullScreen color="pink" text="Loading..." />;
  }

  if (sessionError) {
    return <LoadingSpinner fullScreen color="pink" text="Reconnecting..." />;
  }

  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ServiceWorkerSetup />
      <AuthErrorHandler />
      <ChunkErrorHandler />
      {children}
    </SessionProvider>
  );
}

