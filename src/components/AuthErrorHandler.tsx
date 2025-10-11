'use client';

import { useEffect, useState } from 'react';

export default function AuthErrorHandler() {
  const [errorCount, setErrorCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);

  useEffect(() => {
    // Enhanced NextAuth error handler
    const handleNextAuthError = (event: any) => {
      const now = Date.now();
      const isNextAuthError = (
        event.type === 'unhandledrejection' && 
        event.reason?.message?.includes('Failed to fetch') &&
        (event.reason?.stack?.includes('next-auth') || 
         event.reason?.message?.includes('authjs.dev') ||
         event.reason?.name === 'ClientFetchError')
      );

      if (isNextAuthError) {
        console.warn('NextAuth fetch error intercepted:', {
          message: event.reason.message,
          name: event.reason.name,
          stack: event.reason.stack?.substring(0, 200) + '...'
        });
        
        event.preventDefault(); // Prevent the error from bubbling up
        event.stopImmediatePropagation(); // Stop other handlers
        
        // Track error frequency with improved logic
        if (now - lastErrorTime < 10000) { // Within 10 seconds
          setErrorCount(prev => prev + 1);
        } else {
          setErrorCount(1);
        }
        setLastErrorTime(now);

        // Progressive response to error frequency
        if (errorCount >= 5) {
          console.log('Too many auth errors detected. Implementing recovery strategy...');
          
          // Clear any auth-related localStorage
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (key.includes('nextauth') || key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
          }
          
          // Reload page as last resort
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }, 2000);
        } else if (errorCount >= 3) {
          console.log('Multiple auth errors detected. Clearing auth cache...');
          
          // Try to clear auth-related caches
          if ('caches' in window) {
            caches.keys().then(cacheNames => {
              cacheNames.forEach(cacheName => {
                if (cacheName.includes('auth')) {
                  caches.delete(cacheName);
                }
              });
            });
          }
        }
      }
    };

    // Enhanced regular error handler
    const handleAuthFetchError = (event: ErrorEvent) => {
      const isAuthError = (
        event.message?.includes('Failed to fetch') && 
        (event.message?.includes('authjs.dev') || 
         event.filename?.includes('next-auth') ||
         event.message?.includes('ClientFetchError'))
      );

      if (isAuthError) {
        console.warn('NextAuth fetch error intercepted via error handler:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno
        });
        
        event.preventDefault();
        event.stopImmediatePropagation();
        
        // Update error tracking
        const now = Date.now();
        if (now - lastErrorTime < 10000) {
          setErrorCount(prev => prev + 1);
        } else {
          setErrorCount(1);
        }
        setLastErrorTime(now);
      }
    };

    // Enhanced fetch interceptor
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);
        
        // Reset error count on any successful fetch
        if (response.ok) {
          setErrorCount(0);
        }
        
        return response;
      } catch (error: any) {
        // Special handling for auth endpoints
        const url = args[0]?.toString() || '';
        if (url.includes('/api/auth/')) {
          console.warn('Auth fetch failed, providing fallback response:', error.message);
          
          // Return a graceful fallback response
          return new Response(
            JSON.stringify({ 
              error: 'Authentication temporarily unavailable',
              retry: true,
              user: null,
              timestamp: Date.now()
            }),
            {
              status: 200, // Use 200 to prevent error cascading
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          );
        }
        
        throw error;
      }
    };

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', handleNextAuthError, true);
    
    // Listen for regular errors
    window.addEventListener('error', handleAuthFetchError, true);

    // Reset error count periodically
    const resetInterval = setInterval(() => {
      if (Date.now() - lastErrorTime > 30000) { // 30 seconds without errors
        setErrorCount(0);
      }
    }, 10000);

    // Clean up listeners and restore fetch
    return () => {
      window.removeEventListener('unhandledrejection', handleNextAuthError, true);
      window.removeEventListener('error', handleAuthFetchError, true);
      clearInterval(resetInterval);
      
      if (originalFetch) {
        window.fetch = originalFetch;
      }
    };
  }, [errorCount, lastErrorTime]);

  return null; // This component doesn't render anything
}