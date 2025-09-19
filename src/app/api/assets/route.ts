import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

// GET /api/assets - ดูรายการครุภัณฑ์ทั้งหมด
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/assets - เพิ่มครุภัณฑ์ใหม่ (ADMIN เท่านั้น)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, name, description, category, location, status, imageUrl } = body;

    // Validation
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['AVAILABLE', 'DAMAGED', 'OUT_OF_STOCK'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be AVAILABLE, DAMAGED, or OUT_OF_STOCK' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า code ซ้ำหรือไม่
    const existingAsset = await prisma.asset.findUnique({
      where: { code }
    });

    if (existingAsset) {
      return NextResponse.json(
        { error: 'Asset code already exists' },
        { status: 409 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        code,
        name,
        description: description || null,
        category: category || null,
        location: location || null,
        status: status || 'AVAILABLE',
        imageUrl: imageUrl || null
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}