import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supply = await prisma.supply.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!supply) {
      return NextResponse.json({ error: 'ไม่พบวัสดุ' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: supply
    });

  } catch (error) {
    console.error('Error fetching supply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      unit,
      quantity,
      minStock,
      unitPrice,
      supplier,
      location,
      imageUrl,
      status
    } = body;

    const currentSupply = await prisma.supply.findUnique({
      where: { id: params.id }
    });

    if (!currentSupply) {
      return NextResponse.json({ error: 'ไม่พบวัสดุ' }, { status: 404 });
    }

    // Determine new status if not explicitly provided
    let newStatus = status;
    if (!newStatus) {
      const newQuantity = parseInt(quantity) || currentSupply.quantity;
      const newMinStock = parseInt(minStock) || currentSupply.minStock;
      
      if (newQuantity <= 0) {
        newStatus = 'OUT_OF_STOCK';
      } else if (newQuantity <= newMinStock) {
        newStatus = 'LOW_STOCK';
      } else {
        newStatus = 'AVAILABLE';
      }
    }

    const supply = await prisma.supply.update({
      where: { id: params.id },
      data: {
        name: name || currentSupply.name,
        description: description !== undefined ? description : currentSupply.description,
        category: category || currentSupply.category,
        unit: unit || currentSupply.unit,
        quantity: parseInt(quantity) || currentSupply.quantity,
        minStock: parseInt(minStock) || currentSupply.minStock,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : currentSupply.unitPrice,
        supplier: supplier !== undefined ? supplier : currentSupply.supplier,
        location: location !== undefined ? location : currentSupply.location,
        imageUrl: imageUrl !== undefined ? imageUrl : currentSupply.imageUrl,
        status: newStatus
      }
    });

    return NextResponse.json({
      success: true,
      data: supply
    });

  } catch (error) {
    console.error('Error updating supply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if supply has any transactions
    const transactionCount = await prisma.supplyTransaction.count({
      where: { supplyId: params.id }
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบวัสดุที่มีประวัติการใช้งานได้' },
        { status: 400 }
      );
    }

    await prisma.supply.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบวัสดุเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error deleting supply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}