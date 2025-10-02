import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'OK', 
      message: 'NextAuth API route is working',
      timestamp: new Date().toISOString(),
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET,
        hasUrl: !!process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ 
      status: 'ERROR', 
      message: 'NextAuth API route error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}