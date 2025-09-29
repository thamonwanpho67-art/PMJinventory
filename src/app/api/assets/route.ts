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

    const formData = await request.formData();
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const assetCode = formData.get('assetCode') as string;
    const costCenter = formData.get('costCenter') as string;
    const price = formData.get('price') as string;
    const status = formData.get('status') as string;
    const imageFile = formData.get('image') as File;

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

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      // Handle file upload here - you'll need to implement this based on your storage solution
      // For now, we'll just skip the image upload functionality
    }

    const asset = await prisma.asset.create({
      data: {
        code,
        name,
        description: description || null,
        category: category || null,
        location: location || null,
        assetCode: assetCode || null,
        costCenter: costCenter || null,
        price: price ? parseFloat(price) : null,
        status: (status as any) || 'AVAILABLE',
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