import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Debug API called');
    console.log('Environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    
    // Test database connection
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    const assetCount = await prisma.asset.count();
    console.log('Asset count:', assetCount);
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        users: userCount,
        assets: assetCount
      },
      nextauth: {
        url: process.env.NEXTAUTH_URL,
        configured: !!process.env.NEXTAUTH_SECRET
      }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}