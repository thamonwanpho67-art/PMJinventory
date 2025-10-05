import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

// GET /api/assets/[id] - ดูรายละเอียดอุปกรณ์
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        loans: {
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

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/assets/[id] - แก้ไขอุปกรณ์ (ADMIN เท่านั้น)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, name, description, category, location, status, imageUrl, assetCode, costCenter, price, accountingDate, quantity } = body;

    // ตรวจสอบว่าอุปกรณ์มีอยู่หรือไม่
    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบ code ซ้ำ (ถ้ามีการเปลี่ยน code)
    if (code && code !== existingAsset.code) {
      const codeExists = await prisma.asset.findUnique({
        where: { code }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Asset code already exists' },
          { status: 409 }
        );
      }
    }

    // Validation
    const validStatuses = ['AVAILABLE', 'DAMAGED', 'OUT_OF_STOCK'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be AVAILABLE, DAMAGED, or OUT_OF_STOCK' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (code) updateData.code = code;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) updateData.category = category || null;
    if (location !== undefined) updateData.location = location || null;
    if (assetCode !== undefined) updateData.assetCode = assetCode || null;
    if (costCenter !== undefined) updateData.costCenter = costCenter || null;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (accountingDate !== undefined) updateData.accountingDate = accountingDate ? new Date(accountingDate) : null;
    if (quantity !== undefined) updateData.quantity = quantity ? parseInt(quantity) : 1;
    if (status) updateData.status = status;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - ลบอุปกรณ์ (ADMIN เท่านั้น)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ตรวจสอบว่าอุปกรณ์มีอยู่หรือไม่
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
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

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีการยืมที่ยังไม่คืนหรือไม่
    if (existingAsset.loans.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete asset with pending or approved loans',
          activeLoans: existingAsset.loans.length 
        },
        { status: 409 }
      );
    }

    await prisma.asset.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}