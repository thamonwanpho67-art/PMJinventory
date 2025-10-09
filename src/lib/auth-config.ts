import { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || 
                           nextUrl.pathname.startsWith('/admin');
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  // Enhanced error handling
  events: {
    async signIn(message) {
      console.log('Auth sign in event:', message);
    },
    async signOut(message) {
      console.log('Auth sign out event:', message);
    },
    async session(message) {
      // console.log('Auth session event:', message);
    },
  },
  // Custom logger to catch auth errors
  logger: {
    error(error: Error) {
      console.warn('NextAuth Error:', error);
      
      // Don't throw errors for common issues
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('CLIENT_FETCH_ERROR') ||
          error.name === 'ClientFetchError') {
        console.log('Suppressing NextAuth error to prevent app crash');
        return;
      }
    },
    warn(code: string) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code: string, metadata?: any) {
      // Only log debug in development
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', { code, metadata });
      }
    }
  },
  // Enhanced session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Trust host configuration
  trustHost: true,
  // Disable unnecessary features that might cause errors
  useSecureCookies: process.env.NODE_ENV === 'production',
}