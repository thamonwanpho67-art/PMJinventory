import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('User assets API called');
    
    const session = await auth();
    console.log('Session check:', !!session);
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching assets from database...');
    
    // ดึงข้อมุลอุปกรณ์ทั้งหมดพร้อมจำนวนคงเหลือ
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        imageUrl: true,
        description: true,
        quantity: true,
        _count: {
          select: {
            loans: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${assets.length} assets`);

    // คำนวณจำนวนที่ว่างและสถานะ
    const assetsWithAvailability = assets.map((asset) => {
      const borrowedCount = asset._count.loans;
      const availableCount = asset.quantity - borrowedCount;
      const isAvailable = asset.status === 'AVAILABLE';
      
      return {
        id: asset.id,
        name: asset.name,
        category: asset.category || 'ไม่ระบุ',
        quantity: asset.quantity,
        available: availableCount,
        borrowed: borrowedCount,
        status: asset.status,
        imageUrl: asset.imageUrl,
        description: asset.description,
        canBorrow: isAvailable && availableCount > 0
      };
    });

    // จัดกลุ่มตามหมวดหมู่
    const groupedAssets = assetsWithAvailability.reduce((acc: Record<string, typeof assetsWithAvailability>, asset) => {
      if (!acc[asset.category]) {
        acc[asset.category] = [];
      }
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, typeof assetsWithAvailability>);

    // สถิติรวม
    const summary = {
      totalAssets: assets.length,
      totalBorrowed: assetsWithAvailability.reduce((sum: number, asset) => sum + asset.borrowed, 0),
      totalAvailable: assetsWithAvailability.filter(asset => asset.canBorrow).length,
      categories: Object.keys(groupedAssets).length
    };

    console.log('API response prepared successfully');

    return NextResponse.json({
      success: true,
      data: {
        assets: assetsWithAvailability,
        groupedAssets,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching user assets:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}