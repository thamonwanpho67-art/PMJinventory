// Global error prevention for NextAuth ClientFetchError
(function() {
  'use strict';
  
  // Early error interception
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    try {
      return await originalFetch.apply(this, args);
    } catch (error) {
      // Log auth-related fetch errors but don't throw them
      if (error.name === 'ClientFetchError' || 
          error.message?.includes('Failed to fetch')) {
        
        const url = args[0]?.toString() || '';
        if (url.includes('/api/auth/')) {
          console.warn('NextAuth fetch error prevented:', error.message);
          
          // Return a mock successful response to prevent error propagation
          return new Response(
            JSON.stringify({ 
              error: 'Temporary network issue',
              retry: true,
              user: null 
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            }
          );
        }
      }
      throw error;
    }
  };

  // Global promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason?.name === 'ClientFetchError' || 
        event.reason?.message?.includes('Failed to fetch')) {
      console.warn('Prevented unhandled NextAuth promise rejection:', event.reason.message);
      event.preventDefault();
    }
  });

  // Global error handler
  window.addEventListener('error', function(event) {
    if (event.error?.name === 'ClientFetchError' || 
        event.message?.includes('Failed to fetch')) {
      console.warn('Prevented NextAuth error:', event.message);
      event.preventDefault();
    }
  });

  console.log('NextAuth error prevention initialized');
})();