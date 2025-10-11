import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการดำเนินการ' },
        { status: 403 }
      );
    }

    // Import prisma dynamically to avoid build issues
    const { prisma } = await import('@/lib/prisma');

    // @ts-ignore - Prisma client will be regenerated
    const supplyRequest = await prisma.supplyRequest.findUnique({
      where: { id: params.id },
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

    // ตรวจสอบวัสดุพอในสต็อก
    if (supplyRequest.supply.quantity < supplyRequest.quantity) {
      return NextResponse.json(
        { error: 'วัสดุในสต็อกไม่เพียงพอ' },
        { status: 400 }
      );
    }

    // อัปเดตสถานะคำขอเป็น APPROVED
    // @ts-ignore - Prisma client will be regenerated
    const updatedRequest = await prisma.supplyRequest.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        user: true,
        supply: true
      }
    });

    // อัปเดตสต็อกวัสดุ
    await prisma.supply.update({
      where: { id: supplyRequest.supplyId },
      data: {
        quantity: {
          decrement: supplyRequest.quantity
        }
      }
    });

    // สร้าง transaction record
    await prisma.supplyTransaction.create({
      data: {
        supplyId: supplyRequest.supplyId,
        userId: supplyRequest.userId,
        transactionType: 'OUT',
        quantity: supplyRequest.quantity,
        remainingStock: supplyRequest.supply.quantity - supplyRequest.quantity,
        notes: `อนุมัติคำขอ: ${supplyRequest.purpose || '-'}`,
        department: supplyRequest.department,
        approvedBy: session.user.id
      }
    });

    // สร้างการแจ้งเตือนให้ผู้ขอ
    await prisma.notification.create({
      data: {
        title: 'คำขอวัสดุสิ้นเปลืองได้รับการอนุมัติ',
        message: `คำขอวัสดุสิ้นเปลืองของคุณได้รับการอนุมัติแล้ว\nจำนวน: ${supplyRequest.quantity} ${supplyRequest.supply.unit}`,
        type: 'SYSTEM',
        relatedId: params.id,
        relatedType: 'supply_request'
      }
    });

    return NextResponse.json({
      message: 'อนุมัติคำขอเรียบร้อยแล้ว',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error approving supply request:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอนุมัติคำขอ' },
      { status: 500 }
    );
  }
}