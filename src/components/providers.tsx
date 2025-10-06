'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ChunkErrorHandler from './ChunkErrorHandler';

export function Providers({ children }: { children: React.ReactNode }) {
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
      refetchInterval={0} // ปิด auto refetch
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ChunkErrorHandler />
      {children}
    </SessionProvider>
  );
}

