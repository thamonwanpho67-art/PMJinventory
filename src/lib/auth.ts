import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  experimental: {
    enableWebAuthn: false,
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("Auth: Attempting to authorize credentials");
          
          if (!credentials?.email || !credentials?.password) {
            console.log("Auth: Missing credentials");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          });

          if (!user) {
            console.log("Auth: User not found");
            return null;
          }

          const isValid = await compare(credentials.password as string, user.password);

          if (!isValid) {
            console.log("Auth: Invalid password");
            return null;
          }

          console.log("Auth: Successfully authorized user:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any }) {
      try {
        if (user) {
          console.log("JWT callback - User logged in:", user.email);
          return {
            ...token,
            id: user.id,
            role: user.role,
          };
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return a minimal token to prevent auth failure
        return token || {};
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      try {
        console.log("Session callback - Token:", { id: token.id, role: token.role });
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role,
          },
        };
      } catch (error) {
        console.error("Session callback error:", error);
        // Return session with minimal user data to prevent failure
        return {
          ...session,
          user: {
            ...session.user,
            id: token?.id || 'unknown',
            role: token?.role || 'USER',
          },
        };
      }
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
