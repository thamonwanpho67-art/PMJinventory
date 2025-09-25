import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ดึงข้อมุลอุปกรณ์ทั้งหมดพร้อมจำนวนคงเหลือ
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        imageUrl: true,
        description: true,
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

    // คำนวณจำนวนที่ว่างและสถานะ
    const assetsWithAvailability = assets.map((asset) => {
      const borrowedCount = asset._count.loans;
      const isAvailable = asset.status === 'AVAILABLE';
      
      return {
        id: asset.id,
        name: asset.name,
        category: asset.category || 'ไม่ระบุ',
        borrowed: borrowedCount,
        status: asset.status,
        imageUrl: asset.imageUrl,
        description: asset.description,
        canBorrow: isAvailable && borrowedCount === 0
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}