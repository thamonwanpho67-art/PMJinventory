'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}