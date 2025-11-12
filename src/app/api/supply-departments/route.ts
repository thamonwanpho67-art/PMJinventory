import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');

    // Get all supplies with department inventory
    // @ts-ignore
    const supplies = await prisma.supply.findMany({
      include: {
        departmentInventory: {
          orderBy: {
            department: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get all unique departments
    // @ts-ignore
    const departments = await prisma.supplyDepartmentInventory.groupBy({
      by: ['department'],
      orderBy: {
        department: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        supplies,
        departments: departments.map((d: any) => d.department)
      }
    });

  } catch (error) {
    console.error('Error fetching supply departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { supplyId, department, quantity } = body;

    if (!supplyId || !department || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');

    // Upsert department inventory
    // @ts-ignore
    const result = await prisma.supplyDepartmentInventory.upsert({
      where: {
        supplyId_department: {
          supplyId,
          department
        }
      },
      update: {
        quantity: parseInt(quantity)
      },
      create: {
        supplyId,
        department,
        quantity: parseInt(quantity)
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating supply department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
