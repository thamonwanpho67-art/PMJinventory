import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการดำเนินการ' },
        { status: 403 }
      );
    }

    const { rejectionReason } = await request.json();

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผลในการปฏิเสธ' },
        { status: 400 }
      );
    }

    // Import prisma dynamically to avoid build issues
    const { prisma } = await import('@/lib/prisma');

    // @ts-ignore - Prisma client will be regenerated
    const supplyRequest = await prisma.supplyRequest.findUnique({
      where: { id: id },
      include: {
        user: true,
        supply: true
      }
    });

    if (!supplyRequest) {
      return NextResponse.json(
        { error: 'ไม่พบคำขอนี้' },
        { status: 404 }
      );
    }

    if (supplyRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'คำขอนี้ได้รับการดำเนินการแล้ว' },
        { status: 400 }
      );
    }

    // อัปเดตสถานะคำขอเป็น REJECTED
    // @ts-ignore - Prisma client will be regenerated
    const updatedRequest = await prisma.supplyRequest.update({
      where: { id: id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        rejectedAt: new Date(),
      },
      include: {
        user: true,
        supply: true
      }
    });

    // สร้างการแจ้งเตือนให้ผู้ขอ
    await prisma.notification.create({
      data: {
        title: 'คำขอวัสดุสิ้นเปลืองถูกปฏิเสธ',
        message: `คำขอวัสดุสิ้นเปลืองของคุณถูกปฏิเสธ\nเหตุผล: ${rejectionReason}`,
        type: 'SYSTEM',
        relatedId: id,
        relatedType: 'supply_request'
      }
    });

    return NextResponse.json({
      message: 'ปฏิเสธคำขอเรียบร้อยแล้ว',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error rejecting supply request:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ' },
      { status: 500 }
    );
  }
}