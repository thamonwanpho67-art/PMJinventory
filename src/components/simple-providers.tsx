'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import AuthErrorHandler from './AuthErrorHandler';
import ServiceWorkerSetup from './ServiceWorkerSetup';

// Enhanced error boundary for auth-related errors
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's an auth-related error
    if (error.message?.includes('Failed to fetch') ||
        error.message?.includes('ClientFetchError') ||
        error.name === 'ClientFetchError') {
      console.warn('Auth error caught by boundary:', error);
      return { hasError: false, error: null }; // Don't show error UI for auth errors
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!error.message?.includes('Failed to fetch') &&
        !error.message?.includes('ClientFetchError')) {
      console.error('Non-auth error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-4">กรุณาลองรีเฟรชหน้าเว็บใหม่</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              รีเฟรช
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function SimpleProviders({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingSpinner fullScreen color="pink" text="Loading..." />;
  }

  return (
    <AuthErrorBoundary>
      <SessionProvider 
        basePath="/api/auth"
        refetchInterval={0} // Disable automatic refetching to prevent errors
        refetchOnWindowFocus={false} // Disable refetch on window focus
        refetchWhenOffline={false} // Disable refetch when offline
      >
        <AuthErrorHandler />
        <ServiceWorkerSetup />
        {children}
      </SessionProvider>
    </AuthErrorBoundary>
  );
}