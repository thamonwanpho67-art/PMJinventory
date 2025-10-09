// Service Worker to handle auth fetch errors
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register a more comprehensive service worker for auth error handling
      const swCode = `
        // Global error counter
        let errorCount = 0;
        let lastErrorTime = 0;

        self.addEventListener('fetch', function(event) {
          // Handle all fetch requests
          if (event.request.url.includes('/api/auth/')) {
            event.respondWith(
              fetch(event.request)
                .then(function(response) {
                  // Reset error count on successful response
                  errorCount = 0;
                  return response;
                })
                .catch(function(error) {
                  console.warn('Service Worker intercepted auth fetch error:', error);
                  
                  const now = Date.now();
                  if (now - lastErrorTime < 5000) {
                    errorCount++;
                  } else {
                    errorCount = 1;
                  }
                  lastErrorTime = now;

                  // If too many consecutive errors, return a more graceful response
                  if (errorCount >= 3) {
                    return new Response(
                      JSON.stringify({ 
                        error: 'Service temporarily unavailable', 
                        retry: true,
                        user: null 
                      }),
                      {
                        status: 200, // Return 200 to prevent cascading errors
                        headers: {
                          'Content-Type': 'application/json',
                          'Cache-Control': 'no-cache'
                        }
                      }
                    );
                  }

                  // Return a minimal response for auth failures
                  return new Response(
                    JSON.stringify({ 
                      error: 'Network error', 
                      retry: true,
                      user: null 
                    }),
                    {
                      status: 200, // Use 200 to prevent error propagation
                      headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '3',
                        'Cache-Control': 'no-cache'
                      }
                    }
                  );
                })
            );
          }
        });

        // Handle service worker messages
        self.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'RESET_ERROR_COUNT') {
            errorCount = 0;
            lastErrorTime = 0;
          }
        });
      `;

      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('Enhanced Auth Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Auth Service Worker registration failed:', error);
        });

      // Periodically reset error count
      const resetInterval = setInterval(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'RESET_ERROR_COUNT'
          });
        }
      }, 30000); // Reset every 30 seconds

      // Clean up
      return () => {
        URL.revokeObjectURL(swUrl);
        clearInterval(resetInterval);
      };
    }
  }, []);

  return null;
}