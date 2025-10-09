import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Add error handling wrapper
const withErrorHandling = (handler: any) => {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('NextAuth API error:', error);
      
      // Return a proper error response instead of letting it bubble up
      return NextResponse.json(
        { error: 'Authentication service temporarily unavailable' },
        { status: 503, headers: { 'Retry-After': '5' } }
      );
    }
  };
};

export const GET = withErrorHandling(handlers.GET);
export const POST = withErrorHandling(handlers.POST);
