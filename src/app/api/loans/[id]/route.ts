import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    // เฉพาะ ADMIN เท่านั้นที่สามารถอัพเดทสถานะได้
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'ไม่มีสิทธิ์ในการดำเนินการ' }, { status: 403 });
    }

    const { status } = await request.json();
    const loanId = id;

    // ตรวจสอบว่าสถานะที่ส่งมาถูกต้อง
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    // ดึงข้อมูล loan ปัจจุบัน
    const existingLoan = await prisma.loan.findUnique({
      where: { id: loanId }
    });

    if (!existingLoan) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืม' }, { status: 404 });
    }

    // เตรียมข้อมูลสำหรับอัพเดท
    const updateData: any = { status };

    // ถ้าเปลี่ยนเป็น APPROVED ให้บันทึกเวลาที่ยืม
    if (status === 'APPROVED' && existingLoan.status !== 'APPROVED') {
      updateData.borrowedAt = new Date();
    }

    // ถ้าเปลี่ยนเป็น RETURNED ให้บันทึกเวลาที่คืน
    if (status === 'RETURNED' && existingLoan.status !== 'RETURNED') {
      updateData.returnedAt = new Date();
    }

    // อัพเดทสถานะ
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: updateData
    });

    return NextResponse.json({
      message: 'อัพเดทสถานะสำเร็จ',
      loan: updatedLoan
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating loan status:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}