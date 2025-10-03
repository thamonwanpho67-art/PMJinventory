import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Enhanced error handling for NextAuth handlers
const wrappedHandler = (handler: any) => {
  return async (req: NextRequest, context?: any) => {
    try {
      // Ensure proper content type for auth requests
      const response = await handler(req, context);
      
      // Add CORS headers for auth endpoints
      if (response instanceof NextResponse) {
        response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || 'http://localhost:3000');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
      
      return response;
    } catch (error) {
      console.error("NextAuth handler error:", error);
      
      // Return a proper error response instead of crashing
      return NextResponse.json(
        { 
          error: "Authentication service temporarily unavailable",
          details: process.env.NODE_ENV === "development" ? String(error) : undefined
        },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  };
};

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export const GET = wrappedHandler(handlers.GET);
export const POST = wrappedHandler(handlers.POST);
