import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplyId = searchParams.get('supply');
    const transactionType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (supplyId) {
      where.supplyId = supplyId;
    }

    if (transactionType && ['IN', 'OUT'].includes(transactionType)) {
      where.transactionType = transactionType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.supplyTransaction.findMany({
      where,
      include: {
        supply: {
          select: {
            name: true,
            category: true,
            unit: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalCount = await prisma.supplyTransaction.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching supply transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplyId,
      transactionType,
      quantity,
      unitPrice,
      department,
      notes,
      approvedBy
    } = body;

    // Validate required fields
    if (!supplyId || !transactionType || !quantity) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น' },
        { status: 400 }
      );
    }

    if (!['IN', 'OUT'].includes(transactionType)) {
      return NextResponse.json(
        { error: 'ประเภทธุรกรรมไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const supply = await prisma.supply.findUnique({
      where: { id: supplyId }
    });

    if (!supply) {
      return NextResponse.json({ error: 'ไม่พบวัสดุ' }, { status: 404 });
    }

    const transactionQuantity = parseInt(quantity);
    let newQuantity = supply.quantity;

    if (transactionType === 'IN') {
      newQuantity += transactionQuantity;
    } else if (transactionType === 'OUT') {
      if (transactionQuantity > supply.quantity) {
        return NextResponse.json(
          { error: 'จำนวนที่เบิกเกินจำนวนที่มีในสต็อก' },
          { status: 400 }
        );
      }
      newQuantity -= transactionQuantity;
    }

    // Determine new status
    let newStatus = 'AVAILABLE';
    if (newQuantity <= 0) {
      newStatus = 'OUT_OF_STOCK';
    } else if (newQuantity <= supply.minStock) {
      newStatus = 'LOW_STOCK';
    }

    // Create transaction and update supply in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create transaction record
      const transaction = await tx.supplyTransaction.create({
        data: {
          supplyId,
          userId: session.user.id,
          transactionType,
          quantity: transactionQuantity,
          remainingStock: newQuantity,
          unitPrice: unitPrice ? parseFloat(unitPrice) : supply.unitPrice,
          totalAmount: unitPrice ? parseFloat(unitPrice) * transactionQuantity : 
                      supply.unitPrice ? supply.unitPrice * transactionQuantity : null,
          department,
          notes,
          approvedBy
        },
        include: {
          supply: {
            select: {
              name: true,
              category: true,
              unit: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Update supply quantity and status
      await tx.supply.update({
        where: { id: supplyId },
        data: {
          quantity: newQuantity,
          status: newStatus
        }
      });

      return transaction;
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error creating supply transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}