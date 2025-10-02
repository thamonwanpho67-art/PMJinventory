import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Enhanced error handling for NextAuth handlers
const wrappedHandler = (handler: any) => {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("NextAuth handler error:", error);
      
      // Return a proper error response instead of crashing
      return NextResponse.json(
        { 
          error: "Authentication service temporarily unavailable",
          details: process.env.NODE_ENV === "development" ? error : undefined
        },
        { status: 503 }
      );
    }
  };
};

export const GET = wrappedHandler(handlers.GET);
export const POST = wrappedHandler(handlers.POST);
