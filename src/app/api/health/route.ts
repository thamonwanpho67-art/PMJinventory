import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Log basic info
    console.log('Health check endpoint called');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database URL exists:', !!process.env.DATABASE_URL);
    console.log('NextAuth URL:', process.env.NEXTAUTH_URL);
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      message: 'API is working properly'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}