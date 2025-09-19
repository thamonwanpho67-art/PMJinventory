import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ดึงข้อมูลอุปกรณ์ทั้งหมดพร้อมจำนวนคงเหลือ
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        status: true,
        image: true,
        description: true,
        _count: {
          select: {
            loans: {
              where: {
                status: 'PENDING'
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
    const assetsWithAvailability = assets.map((asset: any) => {
      const pendingLoans = asset._count.loans;
      const available = Math.max(0, asset.quantity - pendingLoans);
      
      return {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        quantity: asset.quantity,
        available,
        borrowed: pendingLoans,
        status: asset.status,
        image: asset.image,
        description: asset.description,
        canBorrow: available > 0 && asset.status === 'AVAILABLE'
      };
    });

    // จัดกลุ่มตามหมวดหมู่
    const groupedAssets = assetsWithAvailability.reduce((acc: any, asset: any) => {
      if (!acc[asset.category]) {
        acc[asset.category] = [];
      }
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, typeof assetsWithAvailability>);

    // สถิติรวม
    const summary = {
      totalAssets: assets.length,
      totalQuantity: assets.reduce((sum: number, asset: any) => sum + asset.quantity, 0),
      totalAvailable: assetsWithAvailability.reduce((sum: number, asset: any) => sum + asset.available, 0),
      totalBorrowed: assetsWithAvailability.reduce((sum: number, asset: any) => sum + asset.borrowed, 0),
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