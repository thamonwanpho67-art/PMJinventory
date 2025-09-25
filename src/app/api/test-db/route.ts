import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple database connectivity test
    const userCount = await prisma.user.count();
    const assetCount = await prisma.asset.count();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully',
      data: {
        users: userCount,
        assets: assetCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error : 'Database error'
    }, { status: 500 });
  }
}