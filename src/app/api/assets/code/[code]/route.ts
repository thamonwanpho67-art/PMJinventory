import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: 'Asset code is required' }, { status: 400 });
    }

    // ค้นหาครุภัณฑ์ด้วยรหัส
    const asset = await prisma.asset.findFirst({
      where: {
        code: code
      },
      include: {
        loans: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED']
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ 
        success: false,
        error: 'ไม่พบครุภัณฑ์ที่มีรหัสนี้' 
      }, { status: 404 });
    }

    // คำนวณจำนวนที่สามารถยืมได้
    const borrowedQuantity = asset.loans.reduce((total, loan) => total + loan.quantity, 0);
    const availableQuantity = asset.quantity - borrowedQuantity;

    const assetWithAvailability = {
      ...asset,
      availableQuantity: Math.max(0, availableQuantity),
      borrowedQuantity
    };

    return NextResponse.json({
      success: true,
      data: assetWithAvailability
    });

  } catch (error) {
    console.error('Error fetching asset by code:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}