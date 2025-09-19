import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

// GET /api/loans - ดู loan requests ทั้งหมด
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let loans;

    if (user.role === 'ADMIN') {
      // ADMIN ดูได้ทุกคำขอ
      loans = await prisma.loan.findMany({
        include: {
          asset: true,
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // USER ดูได้เฉพาะคำขอของตัวเอง
      loans = await prisma.loan.findMany({
        where: {
          userId: user.id
        },
        include: {
          asset: true,
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/loans - สร้างคำขอยืมใหม่
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assetId, dueAt, notes } = body;

    // Validation
    if (!assetId || !dueAt) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId, dueAt' },
        { status: 400 }
      );
    }

    // Removed quantity validation as we use single item loans now

    // ตรวจสอบว่า asset มีอยู่จริง
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบสถานะของอุปกรณ์
    if (asset.status !== 'AVAILABLE') {
      const statusText = asset.status === 'DAMAGED' ? 'ชำรุด' : 'หมด';
      return NextResponse.json(
        { 
          error: `ไม่สามารถยืมได้ เนื่องจากอุปกรณ์อยู่ในสถานะ: ${statusText}`,
          assetStatus: asset.status
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าวันที่ valid
    const dueDate = new Date(dueAt);
    if (dueDate <= new Date()) {
      return NextResponse.json(
        { error: 'Due date must be in the future' },
        { status: 400 }
      );
    }

    const loan = await prisma.loan.create({
      data: {
        assetId,
        userId: user.id,
        dueAt: new Date(dueAt),
        notes: notes || null
      }
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}