import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const dbStatus = await testDatabaseConnection();
    
    // Test environment variables
    const envStatus = testEnvironmentVariables();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        environment: envStatus,
        nextauth: {
          secret: !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET,
          url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    return {
      connected: true,
      userCount
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

function testEnvironmentVariables() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET_SET: !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
  };
}