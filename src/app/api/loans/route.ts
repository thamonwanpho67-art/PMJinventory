import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { createLoanRequestNotification } from '@/lib/notifications';

// GET /api/loans - ดู loan requests ทั้งหมด
export async function GET() {
  try {
    console.log('API: /api/loans - Starting request');
    
    const user = await getCurrentUser();
    console.log('API: Current user:', user ? { id: user.id, role: user.role } : 'null');
    
    if (!user) {
      console.log('API: No user found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let loans;

    if (user.role === 'ADMIN') {
      console.log('API: Admin user, fetching all loans');
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
      console.log('API: Regular user, fetching user loans for:', user.id);
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

    console.log('API: Found loans count:', loans.length);
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
    console.log('API: Creating new loan request...');
    const user = await getCurrentUser();
    console.log('API: Current user for loan creation:', user ? { id: user.id, email: user.email, role: user.role } : 'null');
    
    if (!user) {
      console.log('API: No user found for loan creation');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่า user มีอยู่ใน database จริงหรือไม่
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!dbUser) {
      console.log('API: User not found in database:', user.id);
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    console.log('API: User verified in database:', { id: dbUser.id, email: dbUser.email });

    const body = await request.json();
    console.log('API: Request body:', body);
    const { assetId, quantity, borrowDate, dueAt, costCenter, note } = body;

    // Validation
    if (!assetId || !quantity || !borrowDate) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId, quantity, borrowDate' },
        { status: 400 }
      );
    }

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

    // ตรวจสอบจำนวนที่ขอยืม
    if (quantity <= 0 || quantity > asset.quantity) {
      return NextResponse.json(
        { error: `จำนวนที่ขอยืมไม่ถูกต้อง (มีอยู่ ${asset.quantity} ชิ้น)` },
        { status: 400 }
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
    const borrowDateTime = new Date(borrowDate);
    if (borrowDateTime < new Date(new Date().setHours(0, 0, 0, 0))) {
      return NextResponse.json(
        { error: 'วันที่ยืมไม่สามารถเป็นวันในอดีตได้' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าวันกำหนดคืน valid (ถ้ามี)
    // หมายเหตุ: ตอนนี้ dueAt เป็น string แล้ว ไม่ใช่ date
    if (dueAt && typeof dueAt === 'string' && dueAt.trim() === '') {
      return NextResponse.json(
        { error: 'กรุณาระบุกำหนดคืนให้ชัดเจน' },
        { status: 400 }
      );
    }

    const loanData: any = {
      assetId,
      userId: user.id,
      quantity: parseInt(quantity.toString()),
      borrowDate: new Date(borrowDate),
      costCenter: costCenter || null,
      note: note || null
    };

    // เพิ่ม dueAt เฉพาะเมื่อมีค่า (เป็น string)
    if (dueAt && typeof dueAt === 'string' && dueAt.trim()) {
      loanData.dueAt = dueAt.trim();
    }

    const loan = await prisma.loan.create({
      data: loanData,
      include: {
        asset: true,
        user: true
      }
    });

    // สร้างการแจ้งเตือนสำหรับ Admin
    try {
      await createLoanRequestNotification(loan.id, user.name || 'ผู้ใช้', asset.name);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // ไม่ให้ notification error ทำให้การสร้าง loan ล้มเหลว
    }

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}