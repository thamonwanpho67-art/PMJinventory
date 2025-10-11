import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    // User can only see their own requests, Admin can see all
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    // Import prisma dynamically to avoid build issues
    const { prisma } = await import('@/lib/prisma');

    // @ts-ignore - Prisma client will be regenerated
    const requests = await prisma.supplyRequest.findMany({
      where,
      include: {
        supply: {
          select: {
            name: true,
            category: true,
            unit: true,
            quantity: true
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

    // @ts-ignore - Prisma client will be regenerated
    const totalCount = await prisma.supplyRequest.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching supply requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplyId,
      quantity,
      requesterName,
      department,
      requestDate,
      purpose,
      notes
    } = body;

    // Validate required fields
    if (!supplyId || !quantity || !requesterName || !department) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น' },
        { status: 400 }
      );
    }

    // Import prisma dynamically to avoid build issues
    const { prisma } = await import('@/lib/prisma');

    // Check if supply exists
    const supply = await prisma.supply.findUnique({
      where: { id: supplyId }
    });

    if (!supply) {
      return NextResponse.json({ error: 'ไม่พบวัสดุ' }, { status: 404 });
    }

    // Check if requested quantity is available
    if (quantity > supply.quantity) {
      return NextResponse.json(
        { error: 'จำนวนที่ขอเบิกเกินจำนวนที่มีในสต็อก' },
        { status: 400 }
      );
    }

    // Create supply request
    // @ts-ignore - Prisma client will be regenerated
    const supplyRequest = await prisma.supplyRequest.create({
      data: {
        supplyId,
        userId: session.user.id,
        quantity: parseInt(quantity),
        requesterName: requesterName.trim(),
        department,
        requestDate: requestDate ? new Date(requestDate) : new Date(),
        purpose: purpose?.trim() || null,
        notes: notes?.trim() || null,
        status: 'PENDING'
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

    return NextResponse.json({
      success: true,
      data: supplyRequest
    });

  } catch (error) {
    console.error('Error creating supply request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}