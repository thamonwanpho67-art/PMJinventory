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

    const supplies = await prisma.supply.findMany({
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Update status based on quantity and minStock
    const suppliesWithStatus = supplies.map((supply: any) => {
      let status = supply.status;
      if (supply.quantity <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (supply.quantity <= supply.minStock) {
        status = 'LOW_STOCK';
      } else {
        status = 'AVAILABLE';
      }
      
      return {
        ...supply,
        status,
        transactionCount: supply._count.transactions
      };
    });

    return NextResponse.json({
      success: true,
      data: suppliesWithStatus
    });

  } catch (error) {
    console.error('Error fetching supplies:', error);
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
      name,
      description,
      category,
      unit,
      quantity,
      minStock,
      unitPrice,
      supplier,
      location,
      imageUrl
    } = body;

    // Validate required fields
    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น' },
        { status: 400 }
      );
    }

    // Determine status based on quantity
    let status = 'AVAILABLE';
    if (quantity <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (quantity <= (minStock || 0)) {
      status = 'LOW_STOCK';
    }

    const supply = await prisma.supply.create({
      data: {
        name,
        description,
        category,
        unit,
        quantity: parseInt(quantity) || 0,
        minStock: parseInt(minStock) || 0,
        unitPrice: parseFloat(unitPrice) || null,
        supplier,
        location,
        imageUrl,
        status
      }
    });

    // Create initial transaction record if quantity > 0
    if (supply.quantity > 0) {
      await prisma.supplyTransaction.create({
        data: {
          supplyId: supply.id,
          userId: session.user.id,
          transactionType: 'IN',
          quantity: supply.quantity,
          remainingStock: supply.quantity,
          unitPrice: supply.unitPrice,
          totalAmount: supply.unitPrice ? supply.unitPrice * supply.quantity : null,
          notes: 'สต็อกเริ่มต้น'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: supply
    });

  } catch (error) {
    console.error('Error creating supply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}