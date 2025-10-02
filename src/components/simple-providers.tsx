'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

export function SimpleProviders({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingSpinner fullScreen color="pink" text="Loading..." />;
  }

  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={0} // Disable automatic refetching
      refetchOnWindowFocus={false} // Disable refetch on window focus
      refetchWhenOffline={false} // Disable refetch when offline
    >
      {children}
    </SessionProvider>
  );
}