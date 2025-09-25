import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR Code data is required' },
        { status: 400 }
      );
    }

    // Parse QR Code data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid QR Code format' },
        { status: 400 }
      );
    }

    const { assetId, type } = parsedData;

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID not found in QR Code' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล Asset จากฐานข้อมูล
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        loans: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED']
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // คำนวณจำนวนที่ยืมอยู่
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const borrowedCount = asset.loans.reduce((total: number, loan: any) => {
      return total + (loan.quantity || 1);
    }, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availableCount = (asset as any).quantity - borrowedCount;

    // ส่งข้อมูลตาม type ที่ร้องขอ
    const response = {
      success: true,
      asset: {
        id: asset.id,
        name: asset.name,
        code: asset.code,
        description: asset.description,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quantity: (asset as any).quantity,
        available: availableCount,
        borrowed: borrowedCount,
        imageUrl: asset.imageUrl,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      },
      currentLoans: asset.loans,
      scanType: type,
      scanTime: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('QR Code scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process QR Code scan' },
      { status: 500 }
    );
  }
}