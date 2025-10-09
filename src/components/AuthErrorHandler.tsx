'use client';

import { useEffect } from 'react';

export default function AuthErrorHandler() {
  useEffect(() => {
    const handleNextAuthError = (event: any) => {
      // Check if it's a NextAuth error
      if (
        event.type === 'unhandledrejection' && 
        event.reason?.message?.includes('Failed to fetch') &&
        event.reason?.stack?.includes('next-auth')
      ) {
        console.warn('NextAuth fetch error intercepted:', event.reason.message);
        event.preventDefault(); // Prevent the error from bubbling up
        
        // Optionally reload the page after a delay if errors persist
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            console.log('Reloading page due to persistent auth errors...');
            window.location.reload();
          }
        }, 5000);
      }
    };

    // Listen for unhandled promise rejections (common with NextAuth fetch errors)
    window.addEventListener('unhandledrejection', handleNextAuthError);
    
    // Also listen for regular errors
    window.addEventListener('error', (event) => {
      if (event.message?.includes('Failed to fetch') && event.message?.includes('authjs.dev')) {
        console.warn('NextAuth error intercepted:', event.message);
        event.preventDefault();
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleNextAuthError);
    };
  }, []);

  return null; // This component doesn't render anything
}