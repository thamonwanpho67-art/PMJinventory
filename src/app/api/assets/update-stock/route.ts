import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const { assetId, newQuantity, reason } = await request.json();

    if (!assetId || newQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    if (newQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'จำนวนต้องเป็นค่าบวกหรือศูนย์' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าครุภัณฑ์มีอยู่จริง
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบครุภัณฑ์' },
        { status: 404 }
      );
    }

    // ตรวจสอบจำนวนที่ถูกยืมอยู่
    const borrowedCount = await prisma.loan.aggregate({
      where: {
        assetId: assetId,
        status: 'BORROWED'
      },
      _sum: {
        quantity: true
      }
    });

    const currentBorrowed = borrowedCount._sum.quantity || 0;

    // ตรวจสอบว่าจำนวนใหม่ไม่น้อยกว่าจำนวนที่ถูกยืมอยู่
    if (newQuantity < currentBorrowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ไม่สามารถลดจำนวนได้ เนื่องจากมีการยืมอยู่ ${currentBorrowed} ชิ้น` 
        },
        { status: 400 }
      );
    }

    // อัปเดตจำนวนครุภัณฑ์
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: { 
        quantity: newQuantity,
        updatedAt: new Date()
      }
    });

    // บันทึกประวัติการอัปเดตสต็อก (ถ้าต้องการ)
    // สามารถเพิ่ม model StockHistory ใน Prisma schema ได้
    
    // คำนวณจำนวนที่พร้อมใช้งาน
    const availableQuantity = newQuantity - currentBorrowed;

    return NextResponse.json({
      success: true,
      asset: {
        ...updatedAsset,
        availableQuantity,
        borrowedQuantity: currentBorrowed
      },
      message: 'อัปเดตจำนวนครุภัณฑ์สำเร็จ'
    });

  } catch (error) {
    console.error('Error updating asset stock:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสต็อก' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const { assetId, adjustment, reason } = await request.json();

    if (!assetId || adjustment === undefined) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าครุภัณฑ์มีอยู่จริง
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบครุภัณฑ์' },
        { status: 404 }
      );
    }

    const newQuantity = asset.quantity + adjustment;

    if (newQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลดจำนวนให้เป็นค่าลบได้' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวนที่ถูกยืมอยู่
    const borrowedCount = await prisma.loan.aggregate({
      where: {
        assetId: assetId,
        status: 'BORROWED'
      },
      _sum: {
        quantity: true
      }
    });

    const currentBorrowed = borrowedCount._sum.quantity || 0;

    // ตรวจสอบว่าจำนวนใหม่ไม่น้อยกว่าจำนวนที่ถูกยืมอยู่
    if (newQuantity < currentBorrowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `ไม่สามารถปรับจำนวนได้ เนื่องจากมีการยืมอยู่ ${currentBorrowed} ชิ้น` 
        },
        { status: 400 }
      );
    }

    // อัปเดตจำนวนครุภัณฑ์
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: { 
        quantity: newQuantity,
        updatedAt: new Date()
      }
    });

    // คำนวณจำนวนที่พร้อมใช้งาน
    const availableQuantity = newQuantity - currentBorrowed;

    return NextResponse.json({
      success: true,
      asset: {
        ...updatedAsset,
        availableQuantity,
        borrowedQuantity: currentBorrowed
      },
      message: `${adjustment > 0 ? 'เพิ่ม' : 'ลด'}จำนวนครุภัณฑ์สำเร็จ (${adjustment > 0 ? '+' : ''}${adjustment})`
    });

  } catch (error) {
    console.error('Error adjusting asset stock:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการปรับจำนวนสต็อก' },
      { status: 500 }
    );
  }
}